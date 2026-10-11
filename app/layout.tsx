import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontDisplay, fontLogo, fontSans } from "@/config/fonts";
import { pickClientMessages } from "@/i18n/client-namespaces";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#081A31" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cookie, then the browser's Accept-Language, then "en" (lib/locale.ts).
  const locale = await getLocale();
  // All of this language's messages, on the server (i18n/request.ts).
  const messages = await getMessages();

  return (
    // Font variables go on <html>, not <body>: brand.css defines `--font-sans:
    // var(--font-figtree), …` on :root, so --font-figtree must exist there too.
    <html
      suppressHydrationWarning
      className={clsx(
        fontSans.variable,
        fontDisplay.variable,
        fontLogo.variable,
      )}
      lang={locale}
    >
      <head />
      <body className="min-h-screen text-foreground bg-background font-sans antialiased">
        <Providers
          locale={locale}
          themeProps={{ attribute: "class", defaultTheme: "system" }}
        >
          {/* Without `messages`, next-intl would send every message to the
              browser. Client components only need CLIENT_NAMESPACES. */}
          <NextIntlClientProvider messages={pickClientMessages(messages)}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
