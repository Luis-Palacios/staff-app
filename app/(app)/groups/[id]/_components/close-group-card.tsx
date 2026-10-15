"use client";

import type { SmallGroupDetail } from "@/api/small-groups-api/types";

import { useState, useTransition } from "react";
import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { closeGroupAction } from "@/app/(app)/groups/_actions/group-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { title } from "@/components/primitives";
import { SavedToast } from "@/components/saved-toast";

// Closing ends every membership today and can't be undone, so the button only
// opens a confirm. On success the page is reloaded with `?saved=closed`: the
// closed group no longer renders this card, so the toast can't live here.
export function CloseGroupCard({ group }: { group: SmallGroupDetail }) {
  const t = useTranslations("GroupClose");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<{ id: number; message: string }>();

  function close() {
    startTransition(async () => {
      const result = await closeGroupAction(String(group.id));

      if (result.ok) {
        router.replace(`/groups/${group.id}?saved=closed`);

        return;
      }

      // Already closed elsewhere: just show it as closed.
      if (result.error === "closed") router.refresh();

      setFailure((current) => ({
        id: (current?.id ?? 0) + 1,
        message:
          result.error === "closed"
            ? t("errors.closed")
            : (result.message ?? t("errors.generic")),
      }));
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-danger/40 bg-surface px-6 py-5">
      <h2 className={title({ size: "sm", className: "text-xl" })}>
        {t("title")}
      </h2>
      <p className="text-sm leading-[1.55] text-muted">{t("body")}</p>
      <Button
        className="gap-2 self-start font-semibold text-danger"
        isPending={isPending}
        variant="outline"
        onPress={() => setConfirming(true)}
      >
        <ArchiveBoxArrowDownIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={2}
        />
        {t("button")}
      </Button>

      <ConfirmDialog
        confirmLabel={t("confirm")}
        isOpen={confirming}
        title={t("dialogTitle", { name: group.name })}
        tone="danger"
        onConfirm={close}
        onOpenChange={setConfirming}
      >
        {t("dialogBody", { count: group.members.length })}
      </ConfirmDialog>

      {failure && (
        <SavedToast key={failure.id} message={failure.message} tone="danger" />
      )}
    </section>
  );
}
