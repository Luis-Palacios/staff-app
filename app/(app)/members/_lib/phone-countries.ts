// Countries offered by the phone field, Nicaragua first and then the region.
// Names are shown in their own language, not translated. To add a country,
// append a row here: the picker and the parser read this list.
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 code, shown as the tag. */
  code: string;
  name: string;
  dialCode: string;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "NI", name: "Nicaragua", dialCode: "+505" },
  { code: "CR", name: "Costa Rica", dialCode: "+506" },
  { code: "HN", name: "Honduras", dialCode: "+504" },
  { code: "SV", name: "El Salvador", dialCode: "+503" },
  { code: "GT", name: "Guatemala", dialCode: "+502" },
  { code: "PA", name: "Panamá", dialCode: "+507" },
  { code: "MX", name: "México", dialCode: "+52" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "ES", name: "España", dialCode: "+34" },
];

/** Stands for a stored phone that doesn't start with a known dial code. */
export const OTHER_COUNTRY = "OTHER";

export const DEFAULT_COUNTRY = "NI";

export interface PhoneParts {
  /** A `PhoneCountry.code`, or `OTHER_COUNTRY`. */
  country: string;
  number: string;
}

// Longest dial code first, so "+1" can never take a number meant for a longer
// code added later.
const BY_DIAL_CODE_LENGTH = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/**
 * Splits a stored phone ("+505 8590 4417") into country and number. A value
 * with no known dial code goes whole into the number under "Other", so saving
 * without touching it doesn't change it.
 */
export function parsePhone(stored: string | null): PhoneParts {
  const value = (stored ?? "").trim();

  if (!value) return { country: DEFAULT_COUNTRY, number: "" };

  const match = BY_DIAL_CODE_LENGTH.find(
    ({ dialCode }) =>
      value.startsWith(dialCode) &&
      (value.length === dialCode.length || /^\s/.test(value[dialCode.length])),
  );

  if (!match) return { country: OTHER_COUNTRY, number: value };

  return {
    country: match.code,
    number: value.slice(match.dialCode.length).trim(),
  };
}

/** Separators people type between digits; they become single spaces. */
const SEPARATORS = /[\s\-().]+/g;

/** True when the number holds only digits and the usual separators. */
export function hasOnlyPhoneDigits(number: string): boolean {
  return /^[\d\s\-().]*$/.test(number);
}

/** Digits and single spaces, keeping the user's grouping. */
export function normalizePhoneNumber(number: string): string {
  return number.replace(SEPARATORS, " ").trim();
}

/**
 * The stored string for a country and number: "{dialCode} {number}", or ""
 * when there's no number, whatever the country. "Other" keeps the number as
 * it is.
 */
export function composePhone({ country, number }: PhoneParts): string {
  if (country === OTHER_COUNTRY) return number.trim();

  const normalized = normalizePhoneNumber(number);
  const dialCode = PHONE_COUNTRIES.find((c) => c.code === country)?.dialCode;

  return normalized && dialCode ? `${dialCode} ${normalized}` : "";
}
