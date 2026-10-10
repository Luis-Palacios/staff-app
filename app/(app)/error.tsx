"use client";

import { ErrorState } from "@/components/error-state";

// Page errors inside the shell: the sidebar and top bar stay mounted, so the
// card sits in the main region (sized like loading.tsx, not min-h-dvh).
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center">
      <ErrorState {...props} />
    </div>
  );
}
