"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

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
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      action={
        // Re-renders the segment, which retries its server fetches.
        <Button onPress={() => reset()}>Try again</Button>
      }
      as="h1"
      className="w-full"
      icon={ExclamationTriangleIcon}
      title="Something went wrong"
    >
      This page couldn&apos;t load. Try again, and if it keeps happening, let
      your administrator know.
    </EmptyState>
  );
}
