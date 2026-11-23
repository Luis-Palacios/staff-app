"use client";

import type { WatchedGroup } from "@/api/notifications-api/types";

import { useTranslations } from "next-intl";

import {
  setConversationEmails,
  setReportReminderEmails,
  setSubmittedReportEmails,
  setWatching,
} from "@/app/(app)/_actions/notification-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card } from "@/components/primitives";
import { SettingSwitch, useSavedToggle } from "@/components/setting-switch";
import { StatusBadge } from "@/components/status-badge";

function WatchedGroupRow({
  group,
  emailsOn,
}: {
  group: WatchedGroup;
  emailsOn: boolean;
}) {
  const t = useTranslations("NotificationSettings");
  const watch = useSavedToggle(
    group.watching,
    (next) => setWatching(group.smallGroupId, next),
    t("saveFailed"),
  );

  return (
    <li className="border-t border-separator px-6 py-3">
      <SettingSwitch
        badge={
          group.closed ? (
            <StatusBadge variant="ring-dot">{t("closedGroup")}</StatusBadge>
          ) : undefined
        }
        error={watch.error}
        isDisabled={!emailsOn}
        isSelected={watch.isSelected}
        label={group.name}
        pending={watch.pending}
        onChange={watch.toggle}
      />
    </li>
  );
}

/**
 * My profile's email settings: a switch per kind of email, "Conversations" and (for the full-scope
 * audience) "Submitted reports" and (for group leaders) "Weekly report reminders", each `undefined`
 * while hidden. The reminder switch doesn't affect the Watching list. For the
 * audience (`watchedGroups` not undefined) a Watching switch per group follows. The watch switches
 * are disabled, not hidden, while every shown email switch is off: the choice is kept for later.
 */
export function NotificationsCard({
  conversationEmails,
  submittedEmails,
  reminderEmails,
  watchedGroups,
}: {
  /** `undefined`: the switch is hidden (kind off at the server). */
  conversationEmails?: boolean;
  /** `undefined`: hidden (not a watcher, or kind off at the server). */
  submittedEmails?: boolean;
  /** `undefined`: hidden (doesn't lead a group, or kind off at the server). Independent of the
   *  Watching list: it never counts toward `emailsOn`. */
  reminderEmails?: boolean;
  /** `undefined`: not a watcher; `null`: the list failed to load. */
  watchedGroups?: WatchedGroup[] | null;
}) {
  const t = useTranslations("NotificationSettings");
  const conversations = useSavedToggle(
    conversationEmails ?? false,
    setConversationEmails,
    t("saveFailed"),
  );
  const submitted = useSavedToggle(
    submittedEmails ?? false,
    setSubmittedReportEmails,
    t("saveFailed"),
  );
  const reminders = useSavedToggle(
    reminderEmails ?? false,
    setReportReminderEmails,
    t("saveFailed"),
  );
  const emailsOn =
    (conversationEmails !== undefined && conversations.isSelected) ||
    (submittedEmails !== undefined && submitted.isSelected);

  return (
    <section
      aria-labelledby="my-notifications-title"
      className={card({
        className: "flex min-w-0 flex-col overflow-hidden pt-5",
      })}
    >
      <div className="flex flex-col gap-4 px-6 pb-5">
        <DetailCardHeading eyebrow={t("eyebrow")} id="my-notifications-title">
          {t("title")}
        </DetailCardHeading>
        {conversationEmails !== undefined && (
          <SettingSwitch
            description={t("conversationEmailsHint")}
            error={conversations.error}
            isSelected={conversations.isSelected}
            label={t("conversationEmails")}
            pending={conversations.pending}
            onChange={conversations.toggle}
          />
        )}
        {submittedEmails !== undefined && (
          <SettingSwitch
            description={t("submittedEmailsHint")}
            error={submitted.error}
            isSelected={submitted.isSelected}
            label={t("submittedEmails")}
            pending={submitted.pending}
            onChange={submitted.toggle}
          />
        )}
        {reminderEmails !== undefined && (
          <SettingSwitch
            description={t("reminderEmailsHint")}
            error={reminders.error}
            isSelected={reminders.isSelected}
            label={t("reminderEmails")}
            pending={reminders.pending}
            onChange={reminders.toggle}
          />
        )}
      </div>
      {watchedGroups !== undefined && (
        <div className="flex flex-col border-t border-separator">
          <div className="flex flex-col gap-1 px-6 pb-3 pt-4">
            <h3 className="text-[15px] font-semibold text-heading">
              {t("watchedGroupsTitle")}
            </h3>
            <p className="text-[13.5px] text-muted">
              {emailsOn ? t("watchedGroupsHint") : t("emailsOffHint")}
            </p>
          </div>
          {watchedGroups === null ? (
            <p className="px-6 pb-5 text-[13px] text-danger" role="alert">
              {t("watchedGroupsLoadFailed")}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {watchedGroups.map((group) => (
                <WatchedGroupRow
                  key={group.smallGroupId}
                  emailsOn={emailsOn}
                  group={group}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
