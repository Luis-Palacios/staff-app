"use client";

import { useState } from "react";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { DeactivateGuestDialog } from "./deactivate-guest-dialog";

// The danger section at the end of the left column of an active guest. Only rendered with
// `guests: deactivate`. Success reloads the page with `?saved=inactive`: the section is gone once
// the guest is inactive, and so would its toast be.
export function MarkGuestInactiveSection({
  guest,
  groupName,
  today,
}: {
  guest: { id: number; name: string };
  /** Their current group, the one they leave today. */
  groupName: string | null;
  today: string;
}) {
  const t = useTranslations("GuestStatusCard");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      aria-labelledby="mark-guest-inactive-title"
      className="flex flex-col items-start gap-2 rounded-card border border-danger/40 px-[22px] pb-5 pt-[18px]"
    >
      <h2
        className="text-[15px] font-semibold text-heading"
        id="mark-guest-inactive-title"
      >
        {t("dangerTitle")}
      </h2>
      <p className="text-sm leading-[1.55] text-muted">{t("dangerBody")}</p>
      <Button
        className="mt-1 gap-2 font-semibold text-danger"
        variant="outline"
        onPress={() => setIsOpen(true)}
      >
        <ArchiveBoxIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={1.8}
        />
        {t("dangerButton")}
      </Button>
      <p className="text-[13px] text-muted">{t("dangerWho")}</p>

      <DeactivateGuestDialog
        groupName={groupName}
        guest={guest}
        isOpen={isOpen}
        today={today}
        onDone={() => router.replace(`/guests/${guest.id}?saved=inactive`)}
        onOpenChange={setIsOpen}
      />
    </section>
  );
}
