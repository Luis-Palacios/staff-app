import clsx from "clsx";

/**
 * "on-dark": white figure for navy backgrounds (sidebar, sign-in brand panel).
 * "on-light": navy figure for paper/white backgrounds.
 * "auto": follows the theme (navy in light, white in dark). The mark is the one
 * place a `dark:` switch is allowed, because it isn't page content.
 */
export type BrandTone = "on-dark" | "on-light" | "auto";

const toneClass: Record<BrandTone, string> = {
  "on-dark": "text-white",
  "on-light": "text-navy-900",
  auto: "text-navy-900 dark:text-white",
};

type EkklesiaioMarkProps = {
  size?: number;
  tone?: BrandTone;
  className?: string;
};

/**
 * The ekklesiaio mark (church outline, gold cross, three people), drawn from
 * `landing-page/public/brand/icon.svg` without its navy background tile.
 * The figure uses `currentColor` so the tone is just a text-color class;
 * the cross is always gold. Decorative: pair it with visible or aria text.
 */
export const EkklesiaioMark = ({
  size = 32,
  tone = "auto",
  className,
}: EkklesiaioMarkProps) => (
  <svg
    aria-hidden="true"
    className={clsx("shrink-0", toneClass[tone], className)}
    focusable="false"
    height={size}
    viewBox="6 6 88 88"
    width={size}
  >
    <g transform="translate(6 20.575) scale(1.1)">
      <path
        d="M22 42V27c0-4 2-7 5-9l13-9 13 9c3 2 5 5 5 9v15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5.5"
      />
      <path
        className="stroke-gold-500"
        d="M40 7v16M34 15h12"
        fill="none"
        strokeLinecap="round"
        strokeWidth="5.5"
      />
      <circle cx="40" cy="30" fill="currentColor" r="4.2" />
      <circle cx="29" cy="32" fill="currentColor" r="3.2" />
      <circle cx="51" cy="32" fill="currentColor" r="3.2" />
      <path d="M32 48c0-7 3.3-11 8-11s8 4 8 11" fill="currentColor" />
      <path
        d="M23 47c0-5 2.3-8 6-8 2.2 0 3.8 1.1 4.8 3.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4.5"
      />
      <path
        d="M57 47c0-5-2.3-8-6-8-2.2 0-3.8 1.1-4.8 3.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4.5"
      />
    </g>
  </svg>
);

type EkklesiaioLogoProps = {
  /** Wordmark font size in px; the mark and the gap scale from it. */
  size?: number;
  tone?: BrandTone;
  className?: string;
};

/**
 * Mark + "ekklesiaio" wordmark, matching `landing-page/public/brand/logo-horizontal.svg`.
 * The wordmark is live text (crisp at any size, uses the loaded Inter), so the
 * whole thing is exposed to assistive tech as one image named "ekklesiaio".
 * "io" stays gold-500 in both tones: it's the logo, not running text.
 */
export const EkklesiaioLogo = ({
  size = 21,
  tone = "auto",
  className,
}: EkklesiaioLogoProps) => (
  <span
    aria-label="ekklesiaio"
    className={clsx(
      "inline-flex items-center gap-[0.48em] font-logo leading-none font-[650] tracking-[-0.037em]",
      toneClass[tone],
      className,
    )}
    role="img"
    style={{ fontSize: size }}
  >
    {/* Mark is ~1.43x the wordmark size (30px mark next to a 21px wordmark). */}
    <EkklesiaioMark size={Math.round(size * (30 / 21))} tone={tone} />
    <span aria-hidden="true">
      ekklesia<span className="text-gold-500">io</span>
    </span>
  </span>
);
