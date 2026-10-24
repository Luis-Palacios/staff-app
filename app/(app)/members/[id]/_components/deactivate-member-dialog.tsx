"use client";

import type { MemberInactiveReason } from "@/api/members-api/types";
import type { LeadsGroup } from "@/app/(app)/members/_actions/status-actions";
import type { SubmitEvent } from "react";

import { useState } from "react";
import {
  ExclamationCircleIcon,
  NoSymbolIcon,
  UserGroupIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import { GuestDatePicker } from "@/app/(app)/groups/[id]/_components/guest-date-picker";
import { deactivateMemberAction } from "@/app/(app)/members/_actions/status-actions";
import { authClient } from "@/lib/auth/auth-client";
import { MEMBER_INACTIVE_BAN_REASON } from "@/lib/members/inactive";

export const INACTIVE_REASONS: readonly MemberInactiveReason[] = [
  "moved_away",
  "transferred",
  "stopped_attending",
  "church_discipline",
  "deceased",
  "other",
];

const NOTE_MAX = 1000;

interface CurrentGroup {
  smallGroupId: number;
  smallGroupName: string;
  role: "member" | "leader" | "co_leader";
}

export interface DeactivateOutcome {
  /** The member is inactive but the ban on their user failed (rule 9). */
  banFailed: boolean;
}

function DeactivateForm({
  member,
  groups,
  signInEmail,
  today,
  isPending,
  setIsPending,
  onClose,
  onLeaderBlocked,
  onDone,
}: {
  member: { id: number; name: string; userId: string | null };
  groups: CurrentGroup[];
  signInEmail: string | null;
  today: string;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  onClose: () => void;
  onLeaderBlocked: (groups: LeadsGroup[]) => void;
  onDone: (outcome: DeactivateOutcome) => void;
}) {
  const t = useTranslations("DeactivateMemberDialog");
  const tReason = useTranslations("MemberStatus.reason");
  const tRole = useTranslations("SmallGroupRole");
  const [reason, setReason] = useState<MemberInactiveReason | null>(null);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason || isPending) return;

    setIsPending(true);
    setError(null);

    const result = await deactivateMemberAction(String(member.id), {
      reason,
      effectiveDate: date,
      note: note.trim() || null,
    });

    if (!result.ok) {
      setIsPending(false);

      // Someone made them a leader since the page loaded: the same block as the one up front.
      if (result.code === "leads_group" && result.groups) {
        onLeaderBlocked(result.groups);

        return;
      }

      setError(result.error);

      return;
    }

    // Rule 9: deactivation is done and never rolled back; a failed ban is reported, and the
    // Account card offers the retry.
    let banFailed = false;

    if (member.userId) {
      const { error: banError } = await authClient.admin.banUser({
        userId: member.userId,
        banReason: MEMBER_INACTIVE_BAN_REASON,
      });

      banFailed = !!banError;
    }

    onDone({ banFailed });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("title", { name: member.name })}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">{t("description")}</p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <Select.Root
          // eslint-disable-next-line jsx-a11y/no-autofocus -- focus starts on the first field of the dialog
          autoFocus
          isRequired
          aria-label={t("reason")}
          className="gap-1.5"
          isDisabled={isPending}
          placeholder={t("reasonPlaceholder")}
          selectedKey={reason}
          onSelectionChange={(key) => setReason(key as MemberInactiveReason)}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("reason")}
          </Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {INACTIVE_REASONS.map((option) => (
                <ListBox.Item key={option} id={option}>
                  {tReason(option)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select.Root>

        <GuestDatePicker
          isDisabled={isPending}
          label={t("date")}
          max={today}
          note={t("dateHint")}
          value={date}
          onChange={setDate}
        />

        <TextField
          fullWidth
          className="gap-1.5"
          isDisabled={isPending}
          maxLength={NOTE_MAX}
          value={note}
          onChange={setNote}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("note")}
          </Label>
          <TextArea className="text-sm" rows={3} />
          <p className="text-[13px] text-muted">{t("noteHint")}</p>
        </TextField>

        <div className="flex flex-col gap-3 rounded-xl bg-surface-secondary px-4 py-3.5">
          <p className="text-[13px] font-semibold text-heading">
            {t("whatHappens")}
          </p>
          <ul className="flex flex-col gap-3">
            {groups.length > 0 && (
              <li className="flex items-start gap-2.5 text-sm">
                <UserGroupIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  strokeWidth={1.8}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold text-heading">
                    {t("leavesGroups", { count: groups.length })}
                  </span>
                  <span className="break-words text-muted">
                    {t("leavesGroupsBody", {
                      groups: groups
                        .map(
                          (group) =>
                            `${group.smallGroupName} (${tRole(group.role)})`,
                        )
                        .join(", "),
                    })}
                  </span>
                </span>
              </li>
            )}
            {member.userId && (
              <li className="flex items-start gap-2.5 text-sm">
                <NoSymbolIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  strokeWidth={1.8}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold text-heading">
                    {t("signInOff")}
                  </span>
                  <span className="break-words text-muted">
                    {signInEmail
                      ? t("signInOffBody", { email: signInEmail })
                      : t("signInOffBodyNoEmail")}
                  </span>
                </span>
              </li>
            )}
            <li className="flex items-start gap-2.5 text-sm">
              <ArrowRightStartOnRectangleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-heading">
                  {t("movesToInactive")}
                </span>
                <span className="text-muted">{t("movesToInactiveBody")}</span>
              </span>
            </li>
          </ul>
        </div>

        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
            role="alert"
          >
            <ExclamationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          type="button"
          variant="outline"
          onPress={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          className="font-semibold"
          isDisabled={!reason}
          isPending={isPending}
          type="submit"
          variant="danger"
        >
          {t("submit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

/**
 * Marks a member inactive: reason, the date they left (today or earlier) and a note, then what
 * will happen. Nothing can close it while the call is in flight. The caller handles the result in
 * `onDone` (toast, reload) and the leader block in `onLeaderBlocked`. Remounts on every open.
 */
export function DeactivateMemberDialog({
  isOpen,
  onOpenChange,
  ...form
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: { id: number; name: string; userId: string | null };
  /** Their current groups: the ones they leave today. */
  groups: CurrentGroup[];
  /** The linked user's email, for the sign-in line. */
  signInEmail: string | null;
  /** Today at the church ("YYYY-MM-DD"): the latest date they can have left. */
  today: string;
  onLeaderBlocked: (groups: LeadsGroup[]) => void;
  onDone: (outcome: DeactivateOutcome) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Modal.Backdrop
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <Modal.Container placement="auto" size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <DeactivateForm
            {...form}
            isPending={isPending}
            setIsPending={setIsPending}
            onClose={() => onOpenChange(false)}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
