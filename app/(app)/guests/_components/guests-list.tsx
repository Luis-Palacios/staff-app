import type { GuestStatus } from "@/api/guests-api/types";

import { HandRaisedIcon } from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";
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

  // A page past the end (an old link, a list that shrank) goes to the last one, not an empty list.
  if (page > 1 && list.items.length === 0 && list.total > 0) {
    const params = new URLSearchParams({ status });
    const lastPage = Math.ceil(list.total / GUESTS_PAGE_SIZE);

    if (q) params.set("q", q);
    if (lastPage > 1) params.set("page", String(lastPage));

    redirect(`/guests?${params}`);
  }

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
