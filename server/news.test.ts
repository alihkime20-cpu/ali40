import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: async () => null }));

import { DEFAULT_NEWS_SOURCES, fallbackArabicSummary, hasRedundantCategoryCoverage, listNews, parseRss, prioritizeNews } from "./news";

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

  it("includes official Iraq and Middle East feeds", () => {
    expect(DEFAULT_NEWS_SOURCES.map(source => source.feedUrl)).toEqual(expect.arrayContaining([
      "https://www.alsumaria.tv/Rss/iraq-latest-news/ar",
      "https://www.alsumaria.tv/Rss/News/ar/49/%D8%AF%D9%88%D9%84%D9%8A%D8%A7%D8%AA",
      "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    ]));
  });

  it("keeps redundant coverage for every core section when one source fails", () => {
    expect(hasRedundantCategoryCoverage(DEFAULT_NEWS_SOURCES)).toBe(true);
    const remaining = DEFAULT_NEWS_SOURCES.filter(source => source.name !== "The Guardian Business");
    expect(remaining.filter(source => source.category === "economy")).toHaveLength(1);
    expect(hasRedundantCategoryCoverage(remaining)).toBe(false);
  });

  it("keeps the empty state safe and prioritizes regional sources", () => {
    expect(prioritizeNews([])).toEqual([]);
    const rows = [
      { sourceName: "BBC Sport", publishedAt: new Date("2026-08-18T12:00:00Z") },
      { sourceName: "السومرية — آخر أخبار العراق", publishedAt: new Date("2026-08-18T10:00:00Z") },
    ];
    expect(prioritizeNews(rows)[0]?.sourceName).toContain("السومرية");
  });

  it("returns an empty list when the news database is unavailable", async () => {
    await expect(listNews({})).resolves.toEqual([]);
  });
});
