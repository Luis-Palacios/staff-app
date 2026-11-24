import * as React from "react";

import { IconSvgProps } from "@/types";

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
} as const;

export const ChevronDownIcon = ({
  size = 16,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 24 24"
    width={size || width}
    {...strokeProps}
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const MenuIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 24 24"
    width={size || width}
    {...strokeProps}
    {...props}
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    height={size || height}
    viewBox="0 0 24 24"
    width={size || width}
    {...strokeProps}
    {...props}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** Heroicons has no calendar with an X; same 24px outline style, sized with `className`. */
export const CalendarXIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    {...strokeProps}
    strokeWidth={1.5}
    {...props}
  >
    <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-11.25-3 4.5-4.5m0 4.5-4.5-4.5" />
  </svg>
);

/** Two ticks, "read": Heroicons has no double check. Sized with `className`. */
export const DoubleCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    {...strokeProps}
    strokeWidth={1.8}
    {...props}
  >
    <path d="m2.25 12.75 4.5 4.5 9-10.5M10.5 15.75l1.5 1.5 9.75-10.5" />
  </svg>
);

/**
 * Care (*acompañamiento*): two open hands, filled. The path is copied from the canvas's `Sidebar`
 * board (Care item); the other icons are outlined, this one is filled on purpose. Prayer keeps the
 * heart. Sized with `className`.
 */
export const CareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    fillRule="evenodd"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M10.92 7.17L10.62 7.17L10.5 7.23L10.32 7.41L10.2 7.65L9.66 9.24L9.6 9.33L9.6 9.42L9.54 9.51L8.73 12.03L8.73 12.15L8.88 12.3L9.42 12.63L10.05 13.11L10.11 13.11L10.17 13.02L10.32 12.21L10.38 12.09L10.41 11.85L11.34 8.13L11.31 7.56L11.22 7.38L11.1 7.26ZM13.14 7.14L12.87 7.26L12.72 7.44L12.63 7.74L12.63 8.04L13.41 11.16L13.41 11.28L13.77 12.72L13.83 13.08L13.92 13.11L14.61 12.6L15.09 12.3L15.24 12.15L15.24 11.97L14.82 10.71L14.82 10.62L13.83 7.71L13.68 7.41L13.5 7.23ZM14.43 4.98L14.19 5.1L13.95 5.4L13.89 5.61L13.92 6.12L14.04 6.48L14.07 6.69L15.24 10.08L15.24 10.17L15.45 10.74L15.66 11.52L15.72 11.64L15.81 11.64L16.05 11.37L16.68 10.41L16.8 10.11L15.87 7.23L15.81 7.14L15.69 6.72L15.63 6.63L15.63 6.54L15.57 6.45L15.15 5.28L14.85 5.01ZM9.54 4.98L9.24 4.98L9.06 5.07L8.85 5.28L8.73 5.52L8.22 7.05L8.16 7.14L8.16 7.23L8.07 7.41L7.2 10.08L7.2 10.26L7.95 11.4L8.16 11.64L8.25 11.64L8.31 11.55L8.37 11.28L8.52 10.89L8.52 10.8L8.73 10.23L8.73 10.14L8.79 10.05L8.79 9.96L8.97 9.42L9.03 9.33L9.03 9.24L9.09 9.15L9.48 7.92L9.69 7.38L9.69 7.29L9.9 6.72L10.05 6.15L10.08 5.61L9.96 5.28L9.72 5.04ZM19.08 4.11L18.72 4.08L18.36 4.26L18.15 4.56L18.09 4.83L18.09 5.07L18.21 5.55L18.99 7.86L19.38 9.33L19.8 9.87L19.98 10.35L19.98 10.86L19.86 11.31L19.41 12.21L18.75 13.35L18.33 14.16L18.09 14.55L17.88 14.73L17.67 14.73L17.52 14.61L17.49 14.52L17.52 14.34L17.76 13.83L17.94 13.56L18.99 11.64L19.32 10.86L19.32 10.41L19.2 10.14L19.05 9.96L18.72 9.78L18.54 9.78L18.51 9.75L18.27 9.78L18.03 9.87L17.79 10.02L17.4 10.47L16.8 11.4L16.23 12.15L15.66 12.69L14.4 13.56L13.56 14.37L13.26 14.79L12.93 15.48L12.75 16.11L12.69 16.65L12.66 16.68L12.63 17.43L12.6 17.46L12.63 19.71L12.66 19.74L12.66 20.01L12.84 20.25L12.99 20.25L13.02 20.28L16.77 20.28L16.8 20.25L17.31 20.25L17.4 20.19L17.52 19.98L17.55 19.35L17.61 19.05L17.85 18.48L18.36 17.82L20.19 15.99L20.61 15.51L21.03 14.91L21.39 14.16L21.57 13.38L21.6 12.48L21.63 12.45L21.63 10.56L21.6 10.53L21.57 9.75L21.54 9.72L21.48 9.18L21.36 8.7L21 7.68L20.01 5.34L19.68 4.68L19.5 4.41L19.35 4.26ZM4.83 4.14L4.47 4.41L3.93 5.43L2.91 7.86L2.52 9.06L2.43 9.69L2.4 9.72L2.37 10.47L2.34 10.5L2.34 12.57L2.37 12.6L2.4 13.35L2.43 13.38L2.46 13.71L2.61 14.22L2.97 14.94L3.51 15.69L5.61 17.82L5.97 18.27L6.21 18.66L6.36 19.05L6.42 19.35L6.45 19.95L6.51 20.1L6.69 20.25L7.17 20.25L7.2 20.28L11.01 20.28L11.13 20.25L11.25 20.16L11.34 19.95L11.34 19.44L11.37 19.41L11.37 17.28L11.34 17.25L11.34 16.86L11.31 16.83L11.31 16.59L11.28 16.56L11.22 16.08L11.01 15.36L10.8 14.91L10.53 14.49L10.2 14.1L9.78 13.71L9.18 13.26L8.43 12.78L7.77 12.18L7.26 11.52L6.63 10.56L6.33 10.17L6.12 9.96L5.73 9.78L5.34 9.78L5.16 9.84L4.92 9.99L4.77 10.17L4.65 10.47L4.65 10.83L4.74 11.13L4.95 11.58L6.48 14.37L6.48 14.55L6.33 14.73L6.24 14.76L6.09 14.73L5.88 14.52L4.56 12.18L4.08 11.19L3.99 10.8L4.02 10.26L4.2 9.84L4.59 9.36L4.89 8.19L5.79 5.52L5.88 5.1L5.82 4.56L5.55 4.2L5.19 4.08ZM16.29 3.69L16.08 3.75L15.93 3.84L15.72 4.08L15.63 4.32L15.63 4.74L15.93 5.7L15.99 5.79L16.11 6.21L16.5 7.23L17.04 8.85L17.04 8.94L17.1 9.03L17.22 9.45L17.31 9.51L17.79 9.24L18.06 9.15L18.63 9.09L18.66 8.94L18.33 7.74L18.27 7.65L18.27 7.56L17.16 4.32L16.98 3.99L16.83 3.84L16.59 3.72ZM7.71 3.69L7.5 3.69L7.2 3.81L6.96 4.05L6.84 4.29L5.91 7.02L5.88 7.2L5.79 7.38L5.79 7.47L5.61 7.95L5.61 8.04L5.31 8.97L5.31 9.03L5.37 9.09L5.64 9.09L6.09 9.21L6.66 9.54L6.72 9.54L6.78 9.45L6.9 9L7.59 6.93L7.98 5.91L8.34 4.77L8.37 4.41L8.25 4.05L8.1 3.87L7.92 3.75Z" />
  </svg>
);
