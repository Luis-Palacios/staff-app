import { IconSvgProps } from "@/types";

export const ChildReachingIcon: React.FC<IconSvgProps> = ({
  size = 36,
  width,
  height,
  ...props
}) => (
  <svg
    fill="none"
    height={height || size}
    viewBox="0 0 384 512"
    width={width || size}
    {...props}
  >
    <path
      d="M256 64a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zM152.9 169.3c-23.7-8.4-44.5-24.3-58.8-45.8L74.6 94.2C64.8 79.5 45 75.6 30.3 85.4S11.6 115 21.4 129.8L40.9 159c18.1 27.1 42.8 48.4 71.1 62.4L112 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96 32 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-258.4c29.1-14.2 54.4-36.2 72.7-64.2l18.2-27.9c9.6-14.8 5.4-34.6-9.4-44.3s-34.6-5.5-44.3 9.4L291 122.4c-21.8 33.4-58.9 53.6-98.8 53.6-12.6 0-24.9-2-36.6-5.8-.9-.3-1.8-.7-2.7-.9z"
      fill="currentColor"
    />
  </svg>
);

export const PersonWaterIcon: React.FC<IconSvgProps> = ({
  size = 36,
  width,
  height,
  ...props
}) => (
  <svg
    fill="none"
    height={height || size}
    viewBox="0 0 200 200"
    width={width || size}
    {...props}
  >
    <circle cx="100" cy="55" fill="currentColor" r="16" />
    <path
      d="M 52,48 
       A 12,12 0 0,1 74,45 
       C 75,70 85,82 100,82 
       C 115,82 125,70 126,45 
       A 12,12 0 0,1 148,48 
       C 145,88 128,106 120,106 
       L 120,118 
       L 100,130 
       L 80,118 
       L 80,106 
       C 72,106 55,88 52,48 Z"
      fill="currentColor"
    />
    <path
      d="M 20,145 
       C 32,130 48,130 60,145 
       C 72,160 88,160 100,145 
       C 112,130 128,130 140,145 
       C 152,160 168,160 180,145"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="14"
    />
  </svg>
);
