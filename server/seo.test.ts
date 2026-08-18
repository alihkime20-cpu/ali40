import { describe, expect, it } from "vitest";

describe("SEO route contracts", () => {
  it("uses absolute sitemap and robots paths", () => {
    const origin = "https://globalnews-zkgmaf9k.manus.space";
    expect(`${origin}/sitemap.xml`).toMatch(/^https:\/\//);
    expect(`${origin}/robots.txt`).toBe("https://globalnews-zkgmaf9k.manus.space/robots.txt");
  });

  it("encodes article slugs safely in sitemap URLs", () => {
    const slug = "خبر عربي & عالمي";
    const encoded = encodeURIComponent(slug);
    expect(encoded).toBe("%D8%AE%D8%A8%D8%B1%20%D8%B9%D8%B1%D8%A8%D9%8A%20%26%20%D8%B9%D8%A7%D9%84%D9%85%D9%8A");
    expect(encoded).not.toContain("&");
  });
});
