import type { GuestStatus } from "@/api/guests-api/types";

import { HandRaisedIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import { AddGuestLink } from "./add-guest-link";
import GuestsBrowser from "./guests-browser";

import { listGuests } from "@/api/guests-api/client";
import { EmptyState } from "@/components/empty-state";

export const GUESTS_PAGE_SIZE = 25;

export default async function GuestsList({
  status,
  q,
  page,
  canCreate,
}: {
  status: GuestStatus;
  q: string;
  page: number;
  canCreate: boolean;
}) {
  const list = await listGuests({
    status,
    page,
    pageSize: GUESTS_PAGE_SIZE,
    ...(q && { q }),
  });

  // No guests at all (the counts ignore `status`, follow `q`).
  if (list.counts.all === 0 && !q) {
    const t = await getTranslations("GuestsEmpty");

    return (
      <EmptyState
        action={canCreate ? <AddGuestLink variant="empty" /> : undefined}
        icon={HandRaisedIcon}
        title={t("title")}
      >
        {t("description")}
      </EmptyState>
    );
  }

  return <GuestsBrowser list={list} q={q} status={status} />;
}
