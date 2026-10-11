import type en from "./en.json";
import type es from "./es.json";

// Compile-time completeness check: `pnpm exec tsc --noEmit` fails here when
// es.json is missing a key (or a whole namespace) that en.json has. Types
// only, so nothing from this file exists at runtime.
type AssertComplete<Translation extends Source, Source> = Translation;

export type SpanishIsComplete = AssertComplete<typeof es, typeof en>;
