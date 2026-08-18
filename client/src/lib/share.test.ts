import { describe, expect, it } from "vitest";
import { getShareLinks } from "./share";

describe("getShareLinks", () => {
  it("builds encoded links for the supported platforms", () => {
    const links = getShareLinks("خبر عربي مهم", "https://example.com/news/1");
    expect(links.whatsapp).toContain("wa.me");
    expect(links.facebook).toContain("facebook.com/sharer");
    expect(links.x).toContain("twitter.com/intent/tweet");
    expect(links.telegram).toContain("t.me/share/url");
    expect(links.whatsapp).toContain(encodeURIComponent("خبر عربي مهم"));
    expect(links.facebook).toContain(encodeURIComponent("https://example.com/news/1"));
  });
});
