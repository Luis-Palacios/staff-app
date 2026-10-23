"use client";

import type { SmallGroupDetail } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useState, useTransition } from "react";
import { ClockIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { AddGuestDialog } from "./add-guest-dialog";
import { GuestRowMenu } from "./guest-row-menu";
import { RemoveGuestDialog } from "./remove-guest-dialog";

import { removeGuestAction } from "@/app/(app)/groups/_actions/guest-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
import { SavedToast } from "@/components/saved-toast";
import { StatusBadge } from "@/components/status-badge";
import { can } from "@/lib/auth/permissions";
import { useFeatures, usePermissions } from "@/lib/contexts/user-context";
import { formatCalendarDate } from "@/lib/format-date";
import { GUEST_STOPPED_COMING_SUGGEST_AFTER, isNewGuest } from "@/lib/guests";

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

// The guests card of a guest group: guests apart from the leaders and members. *Add a guest* and
// *Remove* save on their own through server actions and end in a toast. A closed group is read-only.
export function GroupGuestsCard({
  group,
  today,
}: {
  group: SmallGroupDetail;
  /** Today at the church ("YYYY-MM-DD"). */
  today: string;
}) {
  const t = useTranslations("GroupGuestsCard");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    id: number;
    name: string;
    reason: "stopped_coming" | null;
  } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const permissions = usePermissions();
  const { guestGroups } = useFeatures();
  const isClosed = group.closedAt !== null;
  // Adding needs the setting; reading and removing never do (rule 1).
  const canManage = can(permissions, { smallGroups: ["manageMembers"] });
  const canAdd =
    canManage &&
    !isClosed &&
    guestGroups &&
    can(permissions, { guests: ["search"] });
  const canView = can(permissions, { guests: ["view"] });
  const canEdit = can(permissions, { guests: ["update"] });
  const guests = group.members
    .filter((row) => row.person.type === "guest")
    .sort((a, b) => a.person.name.localeCompare(b.person.name));

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }

  function remove(
    guest: { id: number; name: string },
    reason: "stopped_coming" | "other",
  ) {
    startTransition(async () => {
      const result = await removeGuestAction(String(group.id), guest.id, {
        leftReason: reason,
      });

      if (result.ok) {
        showToast(t("toasts.removed", { name: guest.name }));
      } else if (result.error) {
        showToast(t(`errors.${result.error}`, { name: guest.name }), "danger");
      } else {
        showToast(result.message ?? t("errors.generic"), "danger");
      }
    });
  }

  return (
    <section
      className={card({
        className: "flex min-w-0 flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <DetailCardHeading eyebrow={t("eyebrow")}>
          {t("title")}
        </DetailCardHeading>
        {canAdd && (
          <Button
            className="gap-2 font-semibold"
            isDisabled={isPending}
            onPress={() => setAdding(true)}
          >
            <UserPlusIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {t("add")}
          </Button>
        )}
      </div>

      {guests.length === 0 ? (
        <div className="flex flex-col gap-1 py-3">
          <p className="text-[15px] font-semibold text-heading">
            {isClosed ? t("closedTitle") : t("emptyTitle")}
          </p>
          <p className="text-sm text-muted">
            {isClosed ? t("closedBody") : t("emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {guests.map((row) => {
            const { id, name } = row.person;
            const streak = row.missedStreak ?? 0;
            const suggest =
              !isClosed && streak >= GUEST_STOPPED_COMING_SUGGEST_AFTER;

            return (
              <li key={id} className="flex flex-col py-3">
                <div className="flex flex-wrap items-center gap-3.5">
                  <InitialsAvatar name={name} />
                  <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                    {canView ? (
                      <NextLink
                        className="break-words text-[15px] font-semibold text-heading hover:underline"
                        href={`/guests/${id}`}
                      >
                        {name}
                      </NextLink>
                    ) : (
                      <span className="break-words text-[15px] font-semibold text-heading">
                        {name}
                      </span>
                    )}
                    <span className="text-[13px] text-muted">
                      {t("joined", {
                        date: formatCalendarDate(row.joinedAt, locale),
                      })}
                      {" · "}
                      {row.lastAttendedDate
                        ? t("lastSeen", {
                            date: formatCalendarDate(
                              row.lastAttendedDate,
                              locale,
                            ),
                          })
                        : t("neverSeen")}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5">
                    {isNewGuest(row.joinedAt, today) ? (
                      <StatusBadge tone="success">{t("new")}</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral" variant="ring-dot">
                        {t("participant")}
                      </StatusBadge>
                    )}
                    {isClosed || !canManage ? (
                      <span aria-hidden="true" className="size-9 shrink-0" />
                    ) : (
                      <GuestRowMenu
                        canRemove
                        canEdit={canEdit}
                        canView={canView}
                        guestId={id}
                        isDisabled={isPending}
                        name={name}
                        onRemove={() =>
                          setRemoveTarget({ id, name, reason: null })
                        }
                      />
                    )}
                  </div>
                </div>
                {suggest && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground">
                    <ClockIcon aria-hidden="true" className="size-5 shrink-0" />
                    <p className="min-w-0 flex-[1_1_220px]">
                      {t.rich("suggestion", {
                        count: streak,
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                    {canManage && (
                      <Button
                        className="bg-surface font-semibold text-heading"
                        isDisabled={isPending}
                        size="sm"
                        variant="outline"
                        onPress={() =>
                          setRemoveTarget({
                            id,
                            name,
                            reason: "stopped_coming",
                          })
                        }
                      >
                        {t("markStopped")}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canAdd && (
        <AddGuestDialog
          groupId={group.id}
          groupName={group.name}
          isOpen={adding}
          joinedAt={today}
          today={today}
          variant="group"
          onAdded={(guest) => {
            setAdding(false);
            showToast(t("toasts.added", { name: guest.name }));
          }}
          onOpenChange={setAdding}
        />
      )}

      <RemoveGuestDialog
        initialReason={removeTarget?.reason}
        target={removeTarget}
        onConfirm={(guest, reason) => remove(guest, reason)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      />

      {toast && (
        <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
      )}
    </section>
  );
}
