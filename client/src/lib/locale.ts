export type Locale = "ar" | "en";

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_STORAGE_KEY = "nabdh-locale";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value?.toLowerCase().startsWith("en") ? "en" : "ar";
}

export function detectLocale(language: string | null | undefined): Locale {
  return normalizeLocale(language);
}

export function getInitialLocale(language?: string | null, stored?: string | null): Locale {
  const urlLocale = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lang") : null;
  const saved = urlLocale === "ar" || urlLocale === "en" ? urlLocale : stored ?? (typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null);
  if (saved === "ar" || saved === "en") return saved;
  return detectLocale(language ?? (typeof navigator !== "undefined" ? navigator.language : undefined));
}

export function getLocaleDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
