import { describe, expect, it } from "vitest";
import {
  BUSINESS_WHATSAPP_NUMBER,
  BUSINESS_WHATSAPP_URL,
  CONTACT_PAGE_INTRO,
  CONTACT_PAGE_SECTION_TITLE,
  CONTACT_PAGE_TITLE,
} from "../client/src/pages/LegalPages";

describe("contact page", () => {
  it("exposes the Arabic contact content and business WhatsApp link", () => {
    expect(CONTACT_PAGE_TITLE).toBe("اتصل بنا");
    expect(CONTACT_PAGE_INTRO).toContain("واتساب أعمال");
    expect(CONTACT_PAGE_SECTION_TITLE).toBe("واتساب أعمال");
    expect(BUSINESS_WHATSAPP_NUMBER).toBe("9647740669189");
    expect(BUSINESS_WHATSAPP_URL).toBe("https://wa.me/9647740669189");
  });
});
