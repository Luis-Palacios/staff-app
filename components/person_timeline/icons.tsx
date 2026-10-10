import type { SVGProps } from "react";

// Heroicons has no water drop, so baptism gets this one, drawn on the same
// 24px grid and stroke style as the outline set so it sits beside them.
export function DropIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z" />
    </svg>
  );
}
