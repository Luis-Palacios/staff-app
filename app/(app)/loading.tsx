import { ProgressBar } from "@heroui/react";
import { useTranslations } from "next-intl";

import { EkklesiaioMark } from "@/components/brand/ekklesiaio-logo";

// Same centered logo + bar as the auth screens, sized to the main region
// (not min-h-screen) since the sidebar and top bar stay mounted around it.
export default function Loading() {
  const t = useTranslations("Loading");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <EkklesiaioMark size={64} tone="auto" />
      <ProgressBar isIndeterminate aria-label={t("label")} className="w-72">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
