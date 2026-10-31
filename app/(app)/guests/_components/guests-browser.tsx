"use client";

import type { GuestList, GuestStatusFilter } from "@/api/guests-api/types";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";

import GuestCardSummary from "./guest-card-summary";
import GuestsSummaryTable from "./guests-summary-table";

import { StatusTabs } from "@/components/status-tabs";

const TABS = [
  { key: "active", labelKey: "tabActive" },
  { key: "inactive", labelKey: "tabInactive" },
  { key: "all", labelKey: "tabAll" },
] as const satisfies readonly {
  key: GuestStatusFilter;
  labelKey: "tabActive" | "tabInactive" | "tabAll";
}[];

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

function buildHref(
  pathname: string,
  status: GuestStatusFilter,
  q: string,
  page: number,
): string {
  const params = new URLSearchParams();

  if (status !== "active") params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

// Tabs, search and the list for the Guests page. The API filters and pages, so each change is a
// navigation (`?status=&q=&page=`); the transition keeps the current list on screen meanwhile.
export default function GuestsBrowser({
  list,
  status,
  q,
}: {
  list: GuestList;
  status: GuestStatusFilter;
  q: string;
}) {
  const t = useTranslations("GuestsBrowser");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const lastSent = useRef(q);

  function navigate(next: {
    status?: GuestStatusFilter;
    q?: string;
    page?: number;
  }) {
    startTransition(() => {
      router.replace(
        buildHref(pathname, next.status ?? status, next.q ?? q, next.page ?? 1),
        { scroll: false },
      );
    });
  }

  // Debounced: the typed text goes to the URL once the typing pauses.
  useEffect(() => {
    const text = query.trim();

    if (text === lastSent.current) return;

    const timer = window.setTimeout(() => {
      lastSent.current = text;
      startTransition(() => {
        router.replace(buildHref(pathname, status, text, 1), {
          scroll: false,
        });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, status, pathname, router]);

  const emptyLine = q
    ? t("noMatches")
    : status === "inactive"
      ? t("noInactive")
      : t("noActive");
  const counts: Record<GuestStatusFilter, number> = {
    all: list.counts.all,
    active: list.counts.active,
    inactive: list.counts.inactive,
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusTabs
          ariaLabel={t("filterByStatus")}
          counts={counts}
          options={TABS.map(({ key, labelKey }) => ({
            key,
            label: t(labelKey),
          }))}
          value={status}
          onChange={(next) => navigate({ status: next })}
        />
        <TextField
          aria-label={t("filterLabel")}
          className="w-full sm:w-[340px]"
          type="search"
          value={query}
          onChange={setQuery}
        >
          <InputGroup className="h-10 w-full">
            <InputGroup.Prefix className="border-0 pl-3 pr-2">
              <MagnifyingGlassIcon
                className="pointer-events-none size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
            </InputGroup.Prefix>
            <InputGroup.Input
              className="text-sm"
              placeholder={t("filterPlaceholder")}
            />
          </InputGroup>
        </TextField>
        <p aria-live="polite" className="text-sm text-muted">
          {t.rich("count", {
            count: list.total,
            num: (chunks) => (
              <span className="font-semibold text-heading">{chunks}</span>
            ),
          })}
        </p>
      </div>

      {/* The list is replaced by the new page; it stays readable, dimmed, meanwhile. */}
      <div
        aria-busy={isPending}
        className={isPending ? "opacity-60 transition-opacity" : undefined}
      >
        <div className="hidden md:block">
          <GuestsSummaryTable
            data={list.items}
            emptyLine={emptyLine}
            page={list.page}
            pageSize={PAGE_SIZE}
            tab={status}
            total={list.total}
            onPageChange={(page) => navigate({ page })}
          />
        </div>

        <div className="grid gap-3 md:hidden">
          {list.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{emptyLine}</p>
          ) : (
            list.items.map((guest) => (
              <GuestCardSummary key={guest.id} guest={guest} tab={status} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
