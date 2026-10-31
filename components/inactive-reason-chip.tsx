"use client";

import type { GuestInactiveReason } from "@/api/guests-api/types";
import type { MemberInactiveReason } from "@/api/members-api/types";

import { useTranslations } from "next-intl";

function ReasonChip({ children }: { children: string }) {
  return (
    <span className="inline-block w-fit rounded-full bg-default px-2.5 py-0.5 text-[12.5px] font-semibold text-muted">
      {children}
    </span>
  );
}

// Neutral chip for why a member left. The API sends the reason only to callers with
// `members: setStatus`, so for everyone else there is none and nothing renders.
export function InactiveReasonChip({
  reason,
}: {
  reason: MemberInactiveReason | null;
}) {
  const t = useTranslations("MemberStatus.reason");

  if (!reason) return null;

  return <ReasonChip>{t(reason)}</ReasonChip>;
}

// The same for a guest, whose reasons are their own set. The API sends it only to callers with
// `guests: deactivate`.
export function GuestInactiveReasonChip({
  reason,
}: {
  reason: GuestInactiveReason | null;
}) {
  const t = useTranslations("GuestInactiveReason");

  if (!reason) return null;

  return <ReasonChip>{t(reason)}</ReasonChip>;
}
