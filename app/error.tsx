"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

import { EmptyState } from "@/components/empty-state";

// The root error boundary replaces the whole (app) layout, shell included, so
// the card centers itself on the page and its title is the page's <h1>.
export default function Error({
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
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-12">
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
    </main>
  );
}
