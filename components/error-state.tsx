"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state";

// Body of the error boundaries (app/error.tsx and app/(app)/error.tsx): logs
// the error and offers a retry. The card replaces the page, header included,
// so its title is the page's <h1>. Each boundary supplies its own wrapper.
export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorState");

  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      action={
        // Re-renders the segment, which retries its server fetches.
        <Button onPress={() => reset()}>{t("retry")}</Button>
      }
      as="h1"
      className="w-full"
      icon={ExclamationTriangleIcon}
      title={t("title")}
    >
      {t("body")}
    </EmptyState>
  );
}
