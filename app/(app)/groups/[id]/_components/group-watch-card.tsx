"use client";

import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { setWatching } from "@/app/(app)/_actions/notification-actions";
import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { SettingSwitch, useSavedToggle } from "@/components/setting-switch";

/**
 * The group's Watching switch (report-conversations rules 18–21), for the full-scope audience while
 * a kind of email is on at the server; the page decides that. While in-app notifications are on the
 * switch is never disabled (notifications rule 7); with them off and both email switches off in My
 * profile it is disabled and the hint says where to turn emails on.
 */
export function GroupWatchCard({
  groupId,
  watching,
  emailsOn,
  inApp,
}: {
  groupId: number;
  watching: boolean;
  /** At least one kind of email is on (available at the server and chosen by the caller). */
  emailsOn: boolean;
  /** In-app notifications are on at the server: Watching covers them too. */
  inApp: boolean;
}) {
  const enabled = inApp || emailsOn;
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
        description={
          inApp
            ? t("watchingHintInApp")
            : emailsOn
              ? t("watchingHint")
              : undefined
        }
        error={watch.error}
        isDisabled={!enabled}
        isSelected={watch.isSelected}
        label={t("watching")}
        note={
          enabled
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
