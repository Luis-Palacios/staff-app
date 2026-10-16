"use client";

import type { MemberSummary, SmallGroupRole } from "@/api/members-api/types";
import type {
  SmallGroupDetail,
  SmallGroupMember,
} from "@/api/small-groups-api/types";
import type { GroupActionResult } from "@/app/(app)/groups/_actions/group-actions";
import type { SmallGroupAccess } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/locale-shared";

import { useState, useTransition } from "react";
import { StarIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { AddMemberDialog, SCOPED_ADD_ROLES } from "./add-member-dialog";
import { MemberRowMenu, ROLES, SCOPED_ROLES } from "./member-row-menu";

import {
  changeGroupMemberRoleAction,
  listMembersForPickerAction,
  removeGroupMemberAction,
  setGroupLeaderAction,
} from "@/app/(app)/groups/_actions/group-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
import { SavedToast } from "@/components/saved-toast";
import { StatusBadge, type StatusBadgeProps } from "@/components/status-badge";
import { can } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/contexts/user-context";
import { formatCalendarDate } from "@/lib/format-date";

const ROLE_BADGE: Record<
  SmallGroupRole,
  Pick<StatusBadgeProps, "tone" | "variant">
> = {
  leader: { tone: "warning", variant: "solid-dot" },
  co_leader: { tone: "accent", variant: "solid-dot" },
  member: { tone: "neutral", variant: "ring-dot" },
};

const ROLE_ORDER: Record<SmallGroupRole, number> = {
  leader: 0,
  co_leader: 1,
  member: 2,
};

/** Leader, co-leaders, members; then by name. */
function sortMembers(members: SmallGroupMember[]): SmallGroupMember[] {
  return [...members].sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
      a.memberName.localeCompare(b.memberName),
  );
}

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

// The members card: the list, and (for active groups) everything that changes
// it. Each action saves on its own through a server action, confirms first
// when it swaps the leader or removes someone, and ends in a toast. The page
// re-renders from the revalidated data. What shows follows the caller's permissions: `manageMembers`
// for the add button and the row menus, `setLeader` for touching the leader's row and picking Leader,
// and `all` for changing their own row (rule 9).
export function GroupMembersCard({
  group,
  access,
  currentMemberId,
}: {
  group: SmallGroupDetail;
  access: SmallGroupAccess;
  /** The caller's own member id; only needed without `smallGroups: all`. */
  currentMemberId: number | null;
}) {
  const t = useTranslations("GroupMembersCard");
  const tm = useTranslations("GroupMembers");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SmallGroupMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SmallGroupMember | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pickerMembers, setPickerMembers] = useState<MemberSummary[] | null>(
    null,
  );
  const [pickerError, setPickerError] = useState<string | null>(null);
  const members = sortMembers(group.members);
  const leader = group.members.find((member) => member.role === "leader");
  const groupId = String(group.id);
  const isClosed = group.closedAt !== null;
  const permissions = usePermissions();
  const canManage = can(permissions, { smallGroups: ["manageMembers"] });
  const canSetLeader = can(permissions, { smallGroups: ["setLeader"] });
  const isFull = access === "full";

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }

  function showFailure(result: Extract<GroupActionResult, { ok: false }>) {
    if (result.error === "closed") {
      // The group closed elsewhere: show it as closed.
      router.refresh();
    }

    showToast(
      result.error
        ? tm(
            `errors.${result.error === "alreadyInGroup" ? "generic" : result.error}`,
          )
        : (result.message ?? tm("errors.generic")),
      "danger",
    );
  }

  // Runs one action, then reports it. `onSuccess` is the toast text.
  function run(action: () => Promise<GroupActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();

      if (result.ok) showToast(success);
      else showFailure(result);
    });
  }

  function openAdd() {
    setAdding(true);

    if (pickerMembers !== null) return;

    void listMembersForPickerAction().then((result) => {
      if (result.ok) {
        setPickerMembers(result.members);
        setPickerError(null);
      } else {
        setPickerMembers([]);
        setPickerError(result.message);
      }
    });
  }

  function changeRole(member: SmallGroupMember, role: SmallGroupRole) {
    // Leader while someone else leads is a swap, so it asks first.
    if (role === "leader" && leader && leader.memberId !== member.memberId) {
      setSwapTarget(member);

      return;
    }

    run(
      () => changeGroupMemberRoleAction(groupId, member.memberId, role),
      tm("toasts.roleChanged"),
    );
  }

  return (
    <section
      className={card({
        className:
          "flex min-w-0 flex-[3_1_340px] flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <DetailCardHeading eyebrow={t("eyebrow")}>
          {t("title")}
        </DetailCardHeading>
        {!isClosed && canManage && (
          <Button
            className="gap-2 font-semibold text-heading"
            isDisabled={isPending}
            variant="outline"
            onPress={openAdd}
          >
            <UserPlusIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {tm("addMember")}
          </Button>
        )}
      </div>
      {isClosed || members.length === 0 ? (
        <div className="flex flex-col gap-1 py-3">
          <p className="text-[15px] font-semibold text-heading">
            {group.closedAt
              ? t("closedTitle", {
                  date: formatCalendarDate(group.closedAt, locale),
                })
              : t("emptyTitle")}
          </p>
          <p className="text-sm text-muted">
            {isClosed ? t("closedBody") : t("emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {members.map((member) => (
            <li
              key={member.memberId}
              className="flex flex-wrap items-center gap-3.5 py-3"
            >
              <InitialsAvatar name={member.memberName} />
              <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                <NextLink
                  className="break-words text-[15px] font-semibold text-heading hover:underline"
                  href={`/members/${member.memberId}`}
                >
                  {member.memberName}
                </NextLink>
                <span className="text-[13px] text-muted">
                  {t("joined", {
                    date: formatCalendarDate(member.joinedAt, locale),
                  })}
                </span>
              </div>
              {/* Badge and menu slot wrap as one unit, so a row without a menu doesn't leave a blank line. */}
              <div className="flex shrink-0 items-center gap-3.5">
                <StatusBadge {...ROLE_BADGE[member.role]}>
                  {tRole(member.role)}
                </StatusBadge>
                {!canManage ||
                (!canSetLeader && member.role === "leader") ||
                (!isFull && member.memberId === currentMemberId) ? (
                  // Same size as the ⋯ button, so rows line up.
                  <span aria-hidden="true" className="size-9 shrink-0" />
                ) : (
                  <MemberRowMenu
                    isDisabled={isPending}
                    member={member}
                    roles={canSetLeader ? ROLES : SCOPED_ROLES}
                    onChangeRole={(role) => changeRole(member, role)}
                    onRemove={() => setRemoveTarget(member)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isClosed && canManage && (
        <AddMemberDialog
          group={group}
          isOpen={adding}
          loadError={pickerError}
          members={pickerMembers}
          roles={canSetLeader ? undefined : SCOPED_ADD_ROLES}
          onAdded={(name) => {
            setAdding(false);
            showToast(tm("toasts.added", { name }));
          }}
          onOpenChange={setAdding}
        />
      )}

      <ConfirmDialog
        confirmLabel={tm("swap.confirm")}
        icon={<StarIcon aria-hidden="true" className="size-5" />}
        isOpen={swapTarget !== null}
        title={tm("swap.title", { name: swapTarget?.memberName ?? "" })}
        onConfirm={() => {
          if (!swapTarget) return;

          const { memberId, memberName } = swapTarget;

          run(
            () => setGroupLeaderAction(groupId, memberId),
            tm("toasts.leaderSet", { name: memberName }),
          );
        }}
        onOpenChange={(open) => {
          if (!open) setSwapTarget(null);
        }}
      >
        {tm("swap.body", {
          current: leader?.memberName ?? "",
          name: swapTarget?.memberName ?? "",
        })}
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel={tm("removeDialog.confirm")}
        isOpen={removeTarget !== null}
        title={tm("removeDialog.title", {
          name: removeTarget?.memberName ?? "",
        })}
        tone="danger"
        onConfirm={() => {
          if (!removeTarget) return;

          const { memberId, memberName } = removeTarget;

          run(
            () => removeGroupMemberAction(groupId, memberId),
            tm("toasts.removed", { name: memberName }),
          );
        }}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        {tm("removeDialog.body")}
      </ConfirmDialog>

      {toast && (
        <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
      )}
    </section>
  );
}
