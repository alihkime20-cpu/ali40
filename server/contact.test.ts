import { describe, expect, it } from "vitest";
import {
  CONTACT_PAGE_INTRO,
  CONTACT_PAGE_TITLE,
  CONTACT_WHATSAPP_SECTION_TITLE,
  WHATSAPP_BUSINESS_NUMBER,
  WHATSAPP_BUSINESS_URL,
} from "../client/src/pages/LegalPages";

describe("Contact page", () => {
  it("exposes the Arabic contact content and WhatsApp Business details", () => {
    expect(CONTACT_PAGE_TITLE).toBe("اتصل بنا");
    expect(CONTACT_PAGE_INTRO).toContain("واتساب الأعمال");
    expect(CONTACT_WHATSAPP_SECTION_TITLE).toBe("واتساب الأعمال");
    expect(WHATSAPP_BUSINESS_NUMBER).toBe("9647740669189");
    expect(WHATSAPP_BUSINESS_URL).toBe("https://wa.me/9647740669189");
  });
});
