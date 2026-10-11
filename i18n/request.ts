import { getRequestConfig } from "next-intl/server";

import { getLocale } from "@/lib/locale";

/**
 * next-intl's per-request config, found by the plugin in next.config.mjs.
 * There is no locale in the URL, so the language comes from our own
 * getLocale() (cookie → Accept-Language → "en"), the same value that sets
 * `<html lang>`.
 *
 * Only the active language's messages are imported, and only on the server.
 * What reaches the browser is decided separately, by the NextIntlClientProvider
 * in app/layout.tsx.
 */
export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
