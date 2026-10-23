"use client";

import { useMemo } from "react";
import NextLink from "next/link";
import { buttonVariants } from "@heroui/react";
import { useTranslations } from "next-intl";

import {
  GuestMeta,
  useGuestSearch,
} from "@/app/(app)/groups/[id]/_components/add-guest-dialog";

// "Is this the same person?": guests that look like the one being typed, by name and by phone, at
// the top of the form. Nothing blocks saving (rule 13). Each has an Open link when the viewer can
// open guests.
export function SimilarGuests({
  name,
  phone,
  excludeId,
  canOpen,
}: {
  name: string;
  /** The composed phone ("+505 8367 0887"), or "" while the number is empty. */
  phone: string;
  /** The guest being edited, who is always a match for themselves. */
  excludeId?: number;
  canOpen: boolean;
}) {
  const t = useTranslations("SimilarGuests");
  const byName = useGuestSearch(name);
  const byPhone = useGuestSearch(phone);
  const matches = useMemo(() => {
    const seen = new Set<number>();

    return [...byName.guests, ...byPhone.guests].filter((guest) => {
      if (guest.id === excludeId || seen.has(guest.id)) return false;

      seen.add(guest.id);

      return true;
    });
  }, [byName.guests, byPhone.guests, excludeId]);

  if (matches.length === 0) return null;

  return (
    <div
      className="mx-6 mt-6 flex flex-col gap-2 rounded-xl bg-warning-soft p-3 text-warning-soft-foreground"
      role="status"
    >
      <p className="text-sm font-semibold">{t("title")}</p>
      <ul className="flex flex-col gap-1">
        {matches.map((guest) => (
          <li
            key={guest.id}
            className="flex items-center gap-3 rounded-[10px] bg-surface px-3 py-2 text-foreground"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-heading">
                {guest.name}
              </span>
              <GuestMeta guest={guest} />
            </span>
            {canOpen && (
              <NextLink
                aria-label={t("openGuest", { name: guest.name })}
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "font-semibold",
                })}
                href={`/guests/${guest.id}`}
              >
                {t("open")}
              </NextLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
