"use client";

import type { MemberInactiveReason } from "@/api/members-api/types";

import { useTranslations } from "next-intl";

// Neutral chip for why a member left. The API sends the reason only to callers with
// `members: setStatus`, so for everyone else there is none and nothing renders.
export function InactiveReasonChip({
  reason,
}: {
  reason: MemberInactiveReason | null;
}) {
  const t = useTranslations("MemberStatus.reason");

  if (!reason) return null;

  return (
    <span className="inline-block w-fit rounded-full bg-default px-2.5 py-0.5 text-[12.5px] font-semibold text-muted">
      {t(reason)}
    </span>
  );
}
