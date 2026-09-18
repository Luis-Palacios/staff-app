import * as React from "react";

import { IconSvgProps } from "@/types";

export const Logo: React.FC<IconSvgProps> = ({
  size = 36,
  width,
  height,
  ...props
}) => (
  <svg
    fill="none"
    height={size || height}
    viewBox="0 0 324 258"
    width={size || width}
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M 136.6,1.1 c -27.2,3.1 -57.2,14.1 -79.6,29 c -13.1,8.7 -31,26.6 -38.9,38.9 c -17.9,27.8 -22.5,60.1 -12.6,89.5 c 16.7,49.9 68.8,86.5 133.5,93.9 c 17,2 29,2 45.5,0.1 c 48.6,-5.6 91.8,-28.5 116.8,-62 c 7.4,-9.9 15.9,-27.2 18.8,-38.5 c 4.7,-18.5 3.5,-42 -3.1,-60.2 c -17,-46.6 -67.6,-82.4 -127.7,-90.3 c -12.1,-1.6 -40.7,-1.8 -52.7,-0.4 z m 50.1,4.4 c 42.7,5.3 79.9,24 104.9,52.7 c 15.7,18.1 26.3,44.2 26.4,65 l 0,6.8 l -13.2,-8.6 c -7.3,-4.7 -14.3,-9.5 -15.5,-10.7 c -4.7,-4.2 -3.3,-0.6 2.7,7.2 l 6.1,8.1 l -8,-6.1 l -8,-6.1 l -6.3,0.9 l -6.3,0.8 l -1.7,7.5 c -0.9,4.1 -1.7,8.3 -1.7,9.2 c -0.1,1.7 1.8,1.8 26,1.8 l 26,0 l -0.6,4.7 c -2.2,15.4 -8.8,32.4 -18.2,46.6 c -11,16.7 -34.2,35.9 -55.9,46.3 c -38.4,18.4 -86.8,22.9 -129.5,12 c -45,-11.4 -81.1,-38.3 -97.9,-73 c -5.3,-10.9 -8.5,-21.2 -9.6,-30.7 l -0.7,-5.9 l 26.7,0 l 26.6,0 l 6.3,-4.9 c 3.4,-2.7 8.5,-6.2 11.2,-7.9 c 4.4,-2.7 6,-4.7 12.5,-15.8 c 4.6,-7.8 7.6,-12 7.7,-10.8 c 0.1,1 0.7,8 1.2,15.5 c 0.8,11 0.8,14.5 -0.4,19 c -0.8,2.9 -1.5,5.4 -1.5,5.4 c 0,0 35.3,0 78.4,0 c 52,0 78.2,-0.3 77.8,-1 c -0.3,-0.6 -3,-4.2 -5.9,-8.1 l -5.3,-7 l -12.2,-4.9 c -6.8,-2.7 -13.7,-5.4 -15.5,-6.1 l -3.1,-1.4 l 4.4,-13.7 c 3.3,-10.3 4.7,-16.7 5.5,-25.3 c 0.6,-6.3 1.2,-11.6 1.3,-11.7 c 0.1,-0.1 4.6,5.1 10,11.6 c 8.6,10.5 10.2,11.9 13.4,12.4 c 2,0.3 7.4,1.1 11.9,1.8 l 8.3,1.1 l 3.7,5.2 c 2,2.8 3.8,5.3 4,5.5 c 0.2,0.2 0.6,0.2 0.9,-0.2 c 0.3,-0.3 -1.3,-3.3 -3.6,-6.5 l -4.1,-6 l -8.2,-1.1 c -4.5,-0.6 -9.9,-1.4 -11.9,-1.7 c -3.4,-0.5 -4.9,-1.9 -13.9,-12.7 l -10.1,-12.2 l -8.1,-0.8 c -7.4,-0.7 -9,-1.2 -17.5,-6.2 c -5.5,-3.2 -13.3,-6.7 -18.8,-8.4 c -8,-2.4 -10.5,-3.8 -15.7,-8.3 c -3.4,-2.9 -6.9,-5.9 -7.8,-6.6 c -2.3,-1.8 -22.8,10.1 -24.7,14.3 c -1.8,4 -12.3,11.7 -22.5,16.5 c -6.5,3.1 -9.5,5.4 -14.7,10.9 l -6.5,7 l -8,1.2 c -4.4,0.7 -8.5,1.7 -9.2,2.2 c -0.7,0.5 -3.3,4.7 -5.9,9.3 l -4.8,8.4 l -25,18.8 c -13.8,10.4 -25.7,19.2 -26.4,19.6 c -1.9,1.2 -0.7,-13.8 2,-25.9 c 11.7,-51.4 64.9,-91.8 130.8,-99.4 c 12.3,-1.4 34.7,-1.2 47.7,0.4 z m -9.4,33.9 c 5,1.5 12.3,4.6 16.2,6.8 c 12.1,7 11.8,6.1 2.9,10.6 c -7.5,3.8 -8.4,4.7 -16.9,15.6 c -8.8,11.4 -9.5,11.9 -36.6,32.5 l -27.7,21 l 13.6,-23.7 c 7.4,-13 13.7,-24.4 13.9,-25.2 c 0.2,-1 -3.3,-4.2 -9.7,-9 c -5.5,-4.1 -9.8,-8 -9.6,-8.6 c 0.9,-2.2 12.7,-18.4 13.4,-18.3 c 0.4,0.1 2.3,0.1 4.2,0 c 3.4,-0.2 3.6,-0.4 7.5,-8.9 l 4,-8.8 l 7.8,6.6 c 7,5.9 8.9,7 17,9.4 z M 39,167.5 l 0,22.5 l 4,0 l 4,0 l 0,-9.5 l 0,-9.5 l 12.3,0 c 13.3,0 16.8,-1.1 20.3,-6.5 c 2.3,-3.5 2.2,-10 -0.3,-13.3 c -3.9,-5.3 -7.3,-6.2 -24.5,-6.2 l -15.8,0 l 0,22.5 z m 31.4,-14.5 c 2.6,2.7 2.9,6.4 0.8,9.1 c -1.9,2.2 -2.8,2.4 -13.1,2.7 l -11.1,0.4 l 0,-7.2 l 0,-7.2 l 11,0.4 c 8,0.2 11.4,0.7 12.4,1.8 z M 90,167.5 l 0,22.5 l 21,0 l 21,0 l 0,-3 l 0,-3 l -16.5,0 l -16.5,0 l 0,-7 l 0,-7 l 15,0 l 15,0 l 0,-3 l 0,-3 l -15,0 l -15,0 l 0,-6.5 l 0,-6.5 l 16.5,0 l 16.5,0 l 0,-3 l 0,-3 l -21,0 l -21,0 l 0,22.5 z M 136,148 l 0,3 l 9.5,0 l 9.5,0 l -0.6,19.5 l -0.7,19.5 l 4.6,0 l 4.7,0 l 0,-19.5 l 0,-19.5 l 9.5,0 l 9.5,0 l 0,-3 l 0,-3 l -23,0 l -23,0 l 0,3 z M 188,167.4 l 0,22.6 l 4.5,0 l 4.5,0 l 0,-9.6 l 0,-9.6 l 11.6,0.4 c 13,0.4 14.4,1.1 14.4,7.7 c 0,2 0.3,5.3 0.6,7.3 l 0.7,3.8 l 5.3,0 c 4.9,0 7.2,-1.2 4.2,-2.2 c -0.7,-0.3 -1.5,-3.6 -1.9,-8.3 c -0.5,-6.9 -0.9,-8.2 -3.1,-9.8 l -2.5,-1.8 l 3.4,-3.4 c 3.7,-3.7 4.3,-7.7 1.8,-12.5 c -2.9,-5.6 -6.1,-6.5 -25.7,-6.8 l -17.8,-0.4 l 0,22.6 z m 33.9,-14 c 2.1,1.9 2.8,6.1 1.3,8.2 c -1.7,2.6 -5.6,3.4 -15.6,3.4 l -10.6,0 l 0,-7.1 l 0,-7.1 l 11.4,0.3 c 9.5,0.3 11.8,0.7 13.5,2.3 z M 248.9,166.6 c -5.7,11.9 -10.5,22 -10.7,22.5 c -0.2,0.5 1.6,0.9 4,0.9 l 4.4,0 l 3.2,-6.5 l 3.2,-6.6 l 10.6,0.3 l 10.6,0.3 l 2.6,6.2 l 2.7,6.1 l 4.8,0.4 c 2.6,0.2 4.7,0.1 4.7,-0.2 c 0,-0.3 -4.6,-10.5 -10.2,-22.8 l -10.2,-22.2 l -4.6,0 l -4.7,0 l -10.4,21.6 z m 22,3.6 c 0.1,0.5 -3.3,0.8 -7.5,0.8 c -5.7,0 -7.5,-0.3 -7.1,-1.3 c 0.2,-0.6 2,-4.5 3.8,-8.6 l 3.3,-7.5 l 3.8,8 c 2,4.3 3.7,8.2 3.7,8.6 z M 143,214.4 l 0,13.5 l 2.8,0.4 c 2.5,0.4 2.5,0.4 -0.5,0.6 l -3.3,0.1 l 0,-11.4 l 0,-11.4 l -3.1,-0.6 c -1.7,-0.3 -3.5,-0.3 -4,0 c -1.1,0.6 -1.2,25.5 -0.1,26.9 c 0.4,0.5 4.3,1 8.7,1.1 c 4.7,0.1 10.3,0.8 13.3,1.8 c 4.9,1.7 5.4,1.7 9.7,0 c 3,-1.1 7.7,-1.7 13.5,-1.8 l 9,-0.1 l 0,-14.3 l 0,-14.4 l -3.2,0.7 c -1.8,0.4 -3.6,0.9 -4,1.2 c -0.5,0.2 -0.8,5.3 -0.8,11.4 l 0,10.9 l -3.2,-0.1 c -3.1,-0.2 -3.1,-0.2 -0.5,-0.6 l 2.7,-0.4 l 0,-13.5 l 0,-13.4 l -2.7,0.6 c -1.6,0.4 -5,1.5 -7.8,2.4 c -4.5,1.5 -5,2 -5.3,4.8 c -0.3,3.1 -0.2,3.2 3.2,3.2 c 2.5,0 3.6,0.4 3.6,1.5 c 0,1 -1.1,1.5 -3.5,1.5 l -3.5,0 l 0,7.5 c 0,6.4 0.2,7.5 1.8,7.6 c 0.9,0 0.4,0.5 -1.2,1 c -1.8,0.5 -4.6,0.4 -7,-0.1 c -2.3,-0.5 -5.2,-1.2 -6.6,-1.4 c -1.4,-0.3 0.1,-0.3 3.3,0 l 5.7,0.4 l 0,-7.5 l 0,-7.5 l -3.5,0 c -2.4,0 -3.5,-0.5 -3.5,-1.5 c 0,-1.1 1.1,-1.5 3.6,-1.5 c 3.4,0 3.5,-0.1 3.2,-3.1 c -0.3,-3 -0.7,-3.3 -7.8,-5.5 c -4.1,-1.3 -7.8,-2.4 -8.2,-2.4 c -0.5,0 -0.8,6 -0.8,13.4 z m 29.8,15.3 c -1,0.2 -2.6,0.2 -3.5,0 c -1,-0.3 -0.2,-0.5 1.7,-0.5 c 1.9,0 2.7,0.2 1.8,0.5 z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const DiscordIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z"
        fill="currentColor"
      />
    </svg>
  );
};

export const TwitterIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GithubIcon: React.FC<IconSvgProps> = ({
  size = 24,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const MoonFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
      fill="currentColor"
    />
  </svg>
);

export const SunFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

export const SystemIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height={size || height}
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <rect height="14" rx="2" width="20" x="2" y="3" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const HeartFilledIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height={size || height}
    role="presentation"
    viewBox="0 0 24 24"
    width={size || width}
    {...props}
  >
    <path
      d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"
      fill="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
);

export const SearchIcon = (props: IconSvgProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

/**
 * Nav / chrome icons. Stroke-based, 24x24 viewBox, sized via `size` (default 20)
 * or width/height, colored with `currentColor` — same contract as the icons above.
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
} as const;

export const DashboardIcon = ({
  size = 20,
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
    <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z" />
  </svg>
);

export const GroupsIcon = ({
  size = 20,
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const ApplicationsIcon = ({
  size = 20,
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
  </svg>
);

export const ReportsIcon = ({
  size = 20,
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
    <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />
  </svg>
);

export const BalancesIcon = ({
  size = 20,
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
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
);

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
