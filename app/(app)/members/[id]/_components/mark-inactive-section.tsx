"use client";

import type { MemberSmallGroup } from "@/api/members-api/types";
import type { LeadsGroup } from "@/app/(app)/members/_actions/status-actions";

import { useState } from "react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { DeactivateMemberDialog } from "./deactivate-member-dialog";
import { LeaderBlockDialog } from "./leader-block-dialog";

import { title } from "@/components/primitives";

// The danger section at the end of the right column of an active member (same look as *Close this
// group*). Only rendered with `members: setStatus`. Success reloads the page with `?saved=…`,
// because the section itself is gone once the member is inactive, and so would its toast be.
export function MarkInactiveSection({
  member,
  groups,
  signInEmail,
  today,
}: {
  member: { id: number; name: string; userId: string | null };
  /** Their current groups, from the page. */
  groups: MemberSmallGroup[];
  signInEmail: string | null;
  today: string;
}) {
  const t = useTranslations("MemberStatusCard");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [leading, setLeading] = useState<LeadsGroup[] | null>(null);
  const ledByThem = groups
    .filter((group) => group.role === "leader")
    .map((group) => ({ id: group.smallGroupId, name: group.smallGroupName }));

  function open() {
    // The groups are already on the page, so skip the round trip. The API stays the guard.
    if (ledByThem.length > 0) setLeading(ledByThem);
    else setIsOpen(true);
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-danger/40 bg-surface px-6 py-5">
      <h2 className={title({ size: "sm", className: "text-xl" })}>
        {t("dangerTitle")}
      </h2>
      <p className="text-sm leading-[1.55] text-muted">{t("dangerBody")}</p>
      <Button
        className="gap-2 self-start font-semibold text-danger"
        variant="outline"
        onPress={open}
      >
        <ArrowRightStartOnRectangleIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={2}
        />
        {t("dangerButton")}
      </Button>

      <DeactivateMemberDialog
        groups={groups}
        isOpen={isOpen}
        member={member}
        signInEmail={signInEmail}
        today={today}
        onDone={({ banFailed }) =>
          router.replace(
            `/members/${member.id}?saved=${banFailed ? "inactiveBanFailed" : "inactive"}`,
          )
        }
        onLeaderBlocked={(led) => {
          setIsOpen(false);
          setLeading(led);
        }}
        onOpenChange={setIsOpen}
      />
      <LeaderBlockDialog
        groups={leading}
        memberName={member.name}
        onOpenChange={(isOpenNow) => !isOpenNow && setLeading(null)}
      />
    </section>
  );
}
