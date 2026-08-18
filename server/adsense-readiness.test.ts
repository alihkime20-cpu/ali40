import { describe, expect, it } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY, readCookieConsent, writeCookieConsent } from "../client/src/lib/cookieConsent";
import {
  CONTACT_PAGE_TITLE,
  WHATSAPP_BUSINESS_NUMBER,
  EDITORIAL_SECTION_HEADINGS,
} from "../client/src/pages/LegalPages";
import {
  AI_SUMMARY_LABEL,
  EDITORIAL_VALUE_HEADINGS,
  ORIGINAL_CONTENT_NOTE,
} from "../client/src/pages/NewsDetail";

describe("AdSense readiness content", () => {
  it("persists and reads an explicit cookie preference", () => {
    const storage = new Map<string, string>();
    const adapter = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } as Storage;

    expect(readCookieConsent(adapter)).toBeNull();
    writeCookieConsent("rejected", adapter);
    expect(storage.get(COOKIE_CONSENT_STORAGE_KEY)).toBe("rejected");
    expect(readCookieConsent(adapter)).toBe("rejected");
  });

  it("keeps public contact details stable", () => {
    expect(CONTACT_PAGE_TITLE).toBe("اتصل بنا");
    expect(WHATSAPP_BUSINESS_NUMBER).toBe("9647740669189");
  });

  it("keeps editorial transparency sections discoverable", () => {
    expect(Object.values(EDITORIAL_SECTION_HEADINGS)).toEqual([
      "الجهة التحريرية",
      "منهجية النشر",
      "الذكاء الاصطناعي والمراجعة",
      "التصحيحات والملاحظات",
      "الشفافية التحريرية",
    ]);
  });

  it("labels assisted summaries and original-source boundaries", () => {
    expect(AI_SUMMARY_LABEL).toContain("الذكاء الاصطناعي");
    expect(ORIGINAL_CONTENT_NOTE).toContain("المصدر الأصلي");
    expect(Object.values(EDITORIAL_VALUE_HEADINGS)).toEqual([
      "السياق التحريري",
      "ما الذي نتحقق منه؟",
      "ملاحظة للقراءة",
    ]);
  });
});
