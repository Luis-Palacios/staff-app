import { UserIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { Greeting, TodayDate } from "./dashboard-greeting";

import { EmptyState } from "@/components/empty-state";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";

/**
 * The dashboard for a signed-in user with no small group permissions (a plain `user`): a greeting
 * and the way to My profile, which needs no permission (rule 11).
 */
export async function WelcomeDashboard({ firstName }: { firstName: string }) {
  const [t, tGreeting] = await Promise.all([
    getTranslations("WelcomeDashboard"),
    getTranslations("DashboardPage"),
  ]);

  return (
    <>
      <StaffAppPageHeader
        description={t("description")}
        eyebrow={<TodayDate />}
        title={
          <Greeting
            firstName={firstName}
            salutations={{
              morning: tGreeting("morning"),
              afternoon: tGreeting("afternoon"),
              evening: tGreeting("evening"),
            }}
          />
        }
      />
      <EmptyState
        action={
          <NextLink
            className={buttonVariants({
              variant: "primary",
              className: "h-[42px] gap-2 px-[18px] md:h-[42px]",
            })}
            href="/users/me"
          >
            {t("openProfile")}
          </NextLink>
        }
        icon={UserIcon}
        title={t("title")}
      >
        {t("body")}
      </EmptyState>
    </>
  );
}
