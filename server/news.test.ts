import { describe, expect, it } from "vitest";
import { fallbackArabicSummary, parseRss } from "./news";

const source = {
  name: "مصدر تجريبي موثوق",
  feedUrl: "https://example.com/rss.xml",
  language: "ar",
  category: "world" as const,
  isActive: true,
};

describe("RSS news ingestion", () => {
  it("parses title, link, description, date, and image", () => {
    const xml = `<rss><channel><item><title><![CDATA[عنوان الخبر العالمي]]></title><link>https://example.com/story</link><guid>story-1</guid><description>تفاصيل الخبر</description><pubDate>Mon, 18 Aug 2026 10:00:00 GMT</pubDate><enclosure url="https://example.com/image.jpg" /></item></channel></rss>`;
    const [item] = parseRss(xml, source);
    expect(item).toMatchObject({
      title: "عنوان الخبر العالمي",
      sourceUrl: "https://example.com/story",
      externalId: "story-1",
      content: "تفاصيل الخبر",
      imageUrl: "https://example.com/image.jpg",
    });
    expect(item?.publishedAt).toBeInstanceOf(Date);
  });

  it("ignores RSS items without a title or source link", () => {
    const xml = `<rss><channel><item><title>خبر بلا رابط</title></item><item><link>https://example.com/ok</link><title>خبر صالح</title></item></channel></rss>`;
    expect(parseRss(xml, source)).toHaveLength(1);
  });

  it("marks urgent stories and preserves the source category", () => {
    const xml = `<rss><channel><item><title>عاجل: تطور جديد حول العالم</title><link>https://example.com/urgent</link></item></channel></rss>`;
    const [item] = parseRss(xml, { ...source, category: "lifestyle" });
    expect(item?.isBreaking).toBe(true);
    expect(item?.category).toBe("lifestyle");
  });

  it("creates a concise Arabic fallback summary", () => {
    expect(fallbackArabicSummary("عنوان", "  نص   الخبر   المختصر ")).toBe("نص الخبر المختصر");
    expect(fallbackArabicSummary("عنوان", null)).toBe("عنوان");
  });
});
