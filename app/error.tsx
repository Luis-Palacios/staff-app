"use client";

import { ErrorState } from "@/components/error-state";

// Catches what app/(app)/error.tsx can't: errors in the (app) layout itself
// (session lookup) and outside the shell. It replaces the whole layout, so the
// card centers itself on the page.
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-12">
      <ErrorState {...props} />
    </main>
  );
}
