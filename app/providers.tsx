"use client";

import type { ThemeProviderProps } from "next-themes";
import type { Locale } from "@/lib/locale-shared";

import * as React from "react";
import { I18nProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export interface ProvidersProps {
  children: React.ReactNode;
  /** Resolved on the server (lib/locale.ts). */
  locale: Locale;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, locale, themeProps }: ProvidersProps) {
  return (
    // react-aria (under HeroUI) has its own built-in strings and number/date
    // formatting, and defaults to the browser's language. This makes it
    // follow the language picked in the account menu instead.
    <I18nProvider locale={locale}>
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </I18nProvider>
  );
}
