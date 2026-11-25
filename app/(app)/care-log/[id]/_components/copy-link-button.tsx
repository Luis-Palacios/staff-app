"use client";

import { LinkIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { showToast } from "@/components/toast-host";

/**
 * *Copy link* (rule 56): the entry's own address. The toast says who can open it, since the link
 * alone shows nothing to anyone outside the entry's audience (rule 57).
 */
export function CopyLinkButton({
  entryId,
  className,
}: {
  entryId: number;
  className?: string;
}) {
  const t = useTranslations("CareLog.entry");

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/care-log/${entryId}`,
      );
      showToast(t("linkCopied"));
    } catch {
      showToast(t("copyFailed"), "danger");
    }
  }

  return (
    <Button
      className={`h-11 gap-2 px-3.5 text-[14.5px] font-semibold ${className ?? ""}`}
      variant="outline"
      onPress={copy}
    >
      <LinkIcon aria-hidden="true" className="size-[17px]" strokeWidth={1.8} />
      {t("copyLink")}
    </Button>
  );
}
