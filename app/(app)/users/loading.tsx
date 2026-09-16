import { ProgressBar } from "@heroui/react";

export default function Loading() {
  return (
    <ProgressBar isIndeterminate aria-label="Loading" className="full-width">
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}
