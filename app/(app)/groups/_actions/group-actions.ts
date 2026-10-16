"use server";

import type { MemberOption, SmallGroupRole } from "@/api/members-api/types";
import type { SmallGroupInput } from "@/api/small-groups-api/types";
import type {
  GroupFieldErrors,
  GroupFormValues,
} from "@/app/(app)/groups/_lib/group-schema";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { listMemberOptions } from "@/api/members-api/client";
import {
  addSmallGroupMember,
  changeSmallGroupMemberRole,
  closeSmallGroup,
  createSmallGroup,
  getSmallGroup,
  removeSmallGroupMember,
  setSmallGroupLeader,
  updateSmallGroup,
} from "@/api/small-groups-api/client";
import {
  groupChangesSchema,
  groupSchema,
  toFieldErrors,
} from "@/app/(app)/groups/_lib/group-schema";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless } from "@/lib/auth/get-permissions";

/** A failed form save. Success never returns: it redirects to the detail page. */
export interface GroupFormFailure {
  ok: false;
  fieldErrors?: GroupFieldErrors;
  formError?: string;
}

/**
 * Why a member action failed, when the page can say something specific. The
 * API's 409s carry no code, so these come from which call failed (and, when
 * one call has several 409s, from re-reading the group).
 */
export type GroupActionError = "alreadyInGroup" | "hasLeader" | "closed";

export type GroupActionResult =
  | { ok: true }
  | { ok: false; error?: GroupActionError; message?: string };

async function toFormFailure(error: unknown): Promise<GroupFormFailure> {
  return { ok: false, formError: await getApiErrorMessage(error) };
}

/** A member action's failure for a caller who lacks the permission (rule 9). */
async function toForbidden(error: unknown): Promise<GroupActionResult> {
  return { ok: false, message: await getApiErrorMessage(error) };
}

/** POST: an empty address and an unset day are omitted. */
export async function createGroupAction(
  values: GroupFormValues,
): Promise<GroupFormFailure> {
  const forbidden = await forbiddenUnless({ smallGroups: ["create"] });

  if (forbidden) return toFormFailure(forbidden);

  const parsed = groupSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, meetingDay, meetingAddress } = parsed.data;
  const input: SmallGroupInput = {
    name,
    ...(meetingDay !== null && { meetingDay }),
    ...(meetingAddress && { meetingAddress }),
  };
  let id: number;

  try {
    ({ id } = await createSmallGroup(input));
  } catch (error) {
    return toFormFailure(error);
  }

  revalidatePath("/groups");
  redirect(`/groups/${id}?saved=created`);
}

/**
 * PATCH: `changes` holds only the fields that changed; an empty address or an
 * unset day becomes `null`, which clears it. Nothing changed goes back to the
 * detail page without a request or a toast.
 */
export async function updateGroupAction(
  id: string,
  changes: Partial<GroupFormValues>,
): Promise<GroupFormFailure> {
  const forbidden = await forbiddenUnless({ smallGroups: ["update"] });

  if (forbidden) return toFormFailure(forbidden);

  const parsed = groupChangesSchema.safeParse(changes);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, meetingDay, meetingAddress } = parsed.data;
  const patch: Partial<SmallGroupInput> = {
    ...(name !== undefined && { name }),
    ...(meetingDay !== undefined && { meetingDay }),
    ...(meetingAddress !== undefined && {
      meetingAddress: meetingAddress || null,
    }),
  };

  if (Object.keys(patch).length === 0) redirect(`/groups/${id}`);

  try {
    await updateSmallGroup(id, patch);
  } catch (error) {
    // 409: closed while the form was open. The detail page shows it closed.
    if (error instanceof ApiError && error.status === 409) {
      revalidatePath(`/groups/${id}`);
      redirect(`/groups/${id}`);
    }

    return toFormFailure(error);
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${id}`);
  redirect(`/groups/${id}?saved=updated`);
}

/** After a member change: the group page, the list and the member's own page. */
function revalidateGroup(groupId: string, memberId: number) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath(`/members/${memberId}`);
}

/** The group's current state, to tell apart 409s that share a status. */
async function readGroupSafely(groupId: string) {
  try {
    return await getSmallGroup(groupId);
  } catch {
    return null;
  }
}

/**
 * A 409 from add or role change is one of: closed, already in the group (add
 * only), or already has a leader (when the role asked for was leader).
 */
async function toActionFailure(
  error: unknown,
  groupId: string,
  memberId: number,
  call: "add" | "role",
  role: SmallGroupRole,
): Promise<GroupActionResult> {
  if (error instanceof ApiError && error.status === 409) {
    const group = await readGroupSafely(groupId);

    if (group?.closedAt) return { ok: false, error: "closed" };

    if (
      call === "add" &&
      group?.members.some((member) => member.memberId === memberId)
    ) {
      return { ok: false, error: "alreadyInGroup" };
    }

    if (role === "leader") return { ok: false, error: "hasLeader" };
  }

  return { ok: false, message: await getApiErrorMessage(error) };
}

export async function addGroupMemberAction(
  groupId: string,
  memberId: number,
  role: SmallGroupRole,
): Promise<GroupActionResult> {
  // Putting someone in as the leader is a leadership change (rule 6).
  const forbidden = await forbiddenUnless({
    smallGroups:
      role === "leader" ? ["manageMembers", "setLeader"] : ["manageMembers"],
  });

  if (forbidden) return toForbidden(forbidden);

  try {
    await addSmallGroupMember(groupId, memberId, role);
  } catch (error) {
    return toActionFailure(error, groupId, memberId, "add", role);
  }

  revalidateGroup(groupId, memberId);

  return { ok: true };
}

export async function changeGroupMemberRoleAction(
  groupId: string,
  memberId: number,
  role: SmallGroupRole,
): Promise<GroupActionResult> {
  const forbidden = await forbiddenUnless({
    smallGroups:
      role === "leader" ? ["manageMembers", "setLeader"] : ["manageMembers"],
  });

  if (forbidden) return toForbidden(forbidden);

  try {
    await changeSmallGroupMemberRole(groupId, memberId, role);
  } catch (error) {
    return toActionFailure(error, groupId, memberId, "role", role);
  }

  revalidateGroup(groupId, memberId);

  return { ok: true };
}

/** Swaps or sets the leader in one call; its only 409 is a closed group. */
export async function setGroupLeaderAction(
  groupId: string,
  memberId: number,
): Promise<GroupActionResult> {
  const forbidden = await forbiddenUnless({ smallGroups: ["setLeader"] });

  if (forbidden) return toForbidden(forbidden);

  try {
    await setSmallGroupLeader(groupId, memberId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { ok: false, error: "closed" };
    }

    return { ok: false, message: await getApiErrorMessage(error) };
  }

  revalidateGroup(groupId, memberId);

  return { ok: true };
}

export async function removeGroupMemberAction(
  groupId: string,
  memberId: number,
): Promise<GroupActionResult> {
  const forbidden = await forbiddenUnless({ smallGroups: ["manageMembers"] });

  if (forbidden) return toForbidden(forbidden);

  try {
    await removeSmallGroupMember(groupId, memberId);
  } catch (error) {
    // 404: not in the group any more (removed elsewhere, or the group closed).
    if (error instanceof ApiError && error.status === 404) {
      const group = await readGroupSafely(groupId);

      if (group?.closedAt) return { ok: false, error: "closed" };
    }

    return { ok: false, message: await getApiErrorMessage(error) };
  }

  revalidateGroup(groupId, memberId);

  return { ok: true };
}

export async function closeGroupAction(
  groupId: string,
): Promise<GroupActionResult> {
  const forbidden = await forbiddenUnless({ smallGroups: ["close"] });

  if (forbidden) return toForbidden(forbidden);

  try {
    await closeSmallGroup(groupId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      revalidatePath(`/groups/${groupId}`);

      return { ok: false, error: "closed" };
    }

    return { ok: false, message: await getApiErrorMessage(error) };
  }

  // Closing ends every membership, and each member's own page lists their groups.
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/members", "layout");

  return { ok: true };
}

/** Every member's name, for the add-member dialog's search (filtered in the browser). */
export async function listMembersForPickerAction(): Promise<
  { ok: true; members: MemberOption[] } | { ok: false; message: string }
> {
  const forbidden = await forbiddenUnless({
    smallGroups: ["manageMembers"],
    members: ["search"],
  });

  if (forbidden)
    return { ok: false, message: await getApiErrorMessage(forbidden) };

  try {
    return { ok: true, members: await listMemberOptions() };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}
