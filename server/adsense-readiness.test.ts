import { describe, expect, it } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY, readCookieConsent, writeCookieConsent } from "../client/src/lib/cookieConsent";
import { CONTACT_PAGE_TITLE, OFFICIAL_EMAIL, WHATSAPP_BUSINESS_NUMBER, WHATSAPP_BUSINESS_URL } from "../client/src/pages/LegalPages";
import { tools, articles } from "../client/src/lib/sabacn";

describe("SABACUN readiness content", () => {
  it("persists an explicit cookie preference", () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } as Storage;
    expect(readCookieConsent(adapter)).toBeNull();
    writeCookieConsent("rejected", adapter);
    expect(storage.get(COOKIE_CONSENT_STORAGE_KEY)).toBe("rejected");
    expect(readCookieConsent(adapter)).toBe("rejected");
  });

  it("keeps public contact details stable", () => {
    expect(CONTACT_PAGE_TITLE).toBe("اتصل بنا");
    expect(WHATSAPP_BUSINESS_NUMBER).toBe("9647740669189");
    expect(WHATSAPP_BUSINESS_URL).toBe("https://wa.me/9647740669189");
    expect(OFFICIAL_EMAIL).toBe("alihkime20@gmail.com");
  });

  it("contains real tools and original knowledge entries", () => {
    expect(tools.length).toBeGreaterThanOrEqual(10);
    expect(tools.every(tool => tool.slug && tool.name && tool.description)).toBe(true);
    expect(articles.length).toBeGreaterThanOrEqual(3);
    expect(articles.every(article => article.slug && article.title && article.excerpt)).toBe(true);
  });
});
