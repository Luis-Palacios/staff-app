import type { MemberDetail } from "@/api/members-api/types";

import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { UserMemberActions } from "./user-member-actions";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card, textLink } from "@/components/primitives";

export function UserMemberCard({
  user,
  member,
}: {
  user: { id: string; name: string; email: string };
  member: MemberDetail | null;
}) {
  const t = useTranslations("UserMember");

  return (
    <section
      aria-labelledby="user-member-title"
      className={card({
        className: "flex min-w-0 flex-col gap-3 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")} id="user-member-title">
        {t("title")}
      </DetailCardHeading>

      {member ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <InitialsAvatar
              className="bg-accent text-accent-foreground"
              name={member.name}
              size="lg"
            />
            <div className="flex min-w-0 flex-col">
              <NextLink
                className={textLink({
                  className: "break-words text-[15px] font-semibold",
                })}
                href={`/members/${member.id}`}
              >
                {member.name}
              </NextLink>
              <span className="text-sm text-muted">
                {t("memberNumber", { id: String(member.id) })}
                {" · "}
                {t("groupCount", { count: member.smallGroups.length })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="py-1 text-sm text-muted">{t("notLinkedBody")}</p>
      )}

      <UserMemberActions member={member} user={user} />
    </section>
  );
}
