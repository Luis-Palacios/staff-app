import { ProgressBar } from "@heroui/react";

import { Logo } from "@/components/icons";

// Same centered logo + bar as the auth screens, sized to the main region
// (not min-h-screen) since the sidebar and top bar stay mounted around it.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <Logo size={100} />
      <ProgressBar isIndeterminate aria-label="Loading" className="w-72">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
