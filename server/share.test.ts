import { describe, expect, it } from "vitest";
import { getShareLinks } from "../client/src/lib/share";

describe("getShareLinks", () => {
  it("builds encoded links for WhatsApp, Facebook, X, and Telegram", () => {
    const links = getShareLinks("دليل SABACUN للأدوات الرقمية", "https://example.com/tools/text-counter");
    expect(links.whatsapp).toContain("wa.me");
    expect(links.facebook).toContain("facebook.com/sharer");
    expect(links.x).toContain("twitter.com/intent/tweet");
    expect(links.telegram).toContain("t.me/share/url");
    expect(links.whatsapp).toContain(encodeURIComponent("دليل SABACUN للأدوات الرقمية"));
    expect(links.facebook).toContain(encodeURIComponent("https://example.com/tools/text-counter"));
  });
});
