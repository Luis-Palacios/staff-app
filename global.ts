import type messages from "./messages/en.json";
import type { Locale } from "@/lib/locale-shared";

// Types next-intl against our own setup. With these, `t("typo")`, an unknown
// namespace, or a key missing from en.json fails `pnpm exec tsc --noEmit`,
// and next-intl's locale values are typed as "en" | "es".
//
// A .ts file on purpose, not .d.ts: `skipLibCheck` hides errors in .d.ts
// files, which once hid this augmentation silently not applying.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
