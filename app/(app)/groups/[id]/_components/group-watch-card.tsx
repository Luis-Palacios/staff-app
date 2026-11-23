"use client";

import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { setWatching } from "@/app/(app)/_actions/notification-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { SettingSwitch, useSavedToggle } from "@/components/setting-switch";

/**
 * The group's Watching switch (report-conversations rules 18–21), for the full-scope audience while
 * emails are on at the server; the page decides that. With Conversation emails off in My profile
 * the switch is disabled and the hint says where to turn emails on.
 */
export function GroupWatchCard({
  groupId,
  watching,
  conversationEmails,
}: {
  groupId: number;
  watching: boolean;
  conversationEmails: boolean;
}) {
  const t = useTranslations("NotificationSettings");
  const watch = useSavedToggle(
    watching,
    (next) => setWatching(groupId, next),
    t("saveFailed"),
  );

  return (
    <section
      aria-labelledby="group-watch-title"
      className={card({
        className: "flex min-w-0 flex-col gap-4 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")} id="group-watch-title">
        {t("title")}
      </DetailCardHeading>
      <SettingSwitch
        description={conversationEmails ? t("watchingHint") : undefined}
        error={watch.error}
        isDisabled={!conversationEmails}
        isSelected={watch.isSelected}
        label={t("watching")}
        note={
          conversationEmails
            ? undefined
            : t.rich("emailsOffGroupHint", {
                link: (chunks) => (
                  <NextLink className={textLink()} href="/users/me">
                    {chunks}
                  </NextLink>
                ),
              })
        }
        pending={watch.pending}
        onChange={watch.toggle}
      />
    </section>
  );
}
