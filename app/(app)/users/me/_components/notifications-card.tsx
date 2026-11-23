"use client";

import type { WatchedGroup } from "@/api/notifications-api/types";

import { useTranslations } from "next-intl";

import {
  setConversationEmails,
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
 * My profile's email settings: "Conversation emails" for everyone who sees conversations, and for
 * the full-scope audience (`watchedGroups` not undefined) a Watching switch per group. The page
 * renders this only while emails are on at the server (`emailsEnabled`). The watch switches are
 * disabled, not hidden, while Conversation emails is off: the choice is kept for later.
 */
export function NotificationsCard({
  conversationEmails,
  watchedGroups,
}: {
  conversationEmails: boolean;
  /** `undefined`: not a watcher; `null`: the list failed to load. */
  watchedGroups?: WatchedGroup[] | null;
}) {
  const t = useTranslations("NotificationSettings");
  const emails = useSavedToggle(
    conversationEmails,
    setConversationEmails,
    t("saveFailed"),
  );

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
        <SettingSwitch
          description={t("conversationEmailsHint")}
          error={emails.error}
          isSelected={emails.isSelected}
          label={t("conversationEmails")}
          pending={emails.pending}
          onChange={emails.toggle}
        />
      </div>
      {watchedGroups !== undefined && (
        <div className="flex flex-col border-t border-separator">
          <div className="flex flex-col gap-1 px-6 pb-3 pt-4">
            <h3 className="text-[15px] font-semibold text-heading">
              {t("watchedGroupsTitle")}
            </h3>
            <p className="text-[13.5px] text-muted">
              {emails.isSelected ? t("watchedGroupsHint") : t("emailsOffHint")}
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
                  emailsOn={emails.isSelected}
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
