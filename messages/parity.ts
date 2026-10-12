import type en from "./en.json";
import type es from "./es.json";

// Compile-time completeness check: `pnpm exec tsc --noEmit` fails here when
// es.json is missing a key (or a whole namespace) that en.json has. Types
// only, so nothing from this file exists at runtime.
//
// en.json's types come from the generated messages/en.d.json.ts, which keeps
// each message as a string literal (that is how next-intl types ICU
// arguments). Comparing against the literals would reject every Spanish
// string, so the check compares the shape: same keys, string values.
type Shape<Source> = {
  [Key in keyof Source]: Source[Key] extends string
    ? string
    : Shape<Source[Key]>;
};

type AssertComplete<Translation extends Source, Source> = Translation;

export type SpanishIsComplete = AssertComplete<typeof es, Shape<typeof en>>;
