import type { AuthSessionUser } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";

import { useTranslations } from "next-intl";

import { RoleBadge } from "@/app/(app)/users/_components/role-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { title } from "@/components/primitives";

// The person is the page, as on Member detail, but with no breadcrumbs (most roles can't open
// Users) and no actions. The avatar circle is where the photo goes later.
export function MyProfileHeader({
  user,
  member,
}: {
  user: AuthSessionUser;
  member: MemberDetail | null;
}) {
  const t = useTranslations("MyProfilePage");
  const tMember = useTranslations("MemberDetailHeader");

  return (
    <header className="mb-6 flex flex-wrap items-center gap-5">
      <InitialsAvatar
        className="bg-accent text-[22px] text-accent-foreground"
        name={user.name}
        size="xl"
      />
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("eyebrow")}
          </span>
          <h1 className={title({ size: "md" })}>{user.name}</h1>
        </div>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
          <span className="break-all">{user.email}</span>
          <RoleBadge role={user.role} />
          {member && (
            <>
              <span>
                {tMember("member")}{" "}
                <strong className="font-semibold text-heading">
                  #{member.id}
                </strong>
              </span>
              <span>
                {tMember.rich("groupCount", {
                  count: member.smallGroups.length,
                  strong: (chunks) => (
                    <strong className="font-semibold text-heading">
                      {chunks}
                    </strong>
                  ),
                })}
              </span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
