export const COOKIE_CONSENT_STORAGE_KEY = "nabdh-cookie-consent";

export type CookieConsent = "accepted" | "rejected";

export function readCookieConsent(storage?: Storage | null): CookieConsent | null {
  try {
    const value = storage?.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent, storage?: Storage | null) {
  try {
    storage?.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
}
