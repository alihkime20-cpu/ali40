import { and, desc, eq, inArray, like, ne, or } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { news, newsSources, type InsertNewsSource } from "../drizzle/schema";

export const DEFAULT_NEWS_SOURCES: InsertNewsSource[] = [
  { name: "السومرية — آخر أخبار العراق", feedUrl: "https://www.alsumaria.tv/Rss/iraq-latest-news/ar", language: "ar", category: "world", isActive: true },
  { name: "السومرية — أبرز الأخبار", feedUrl: "https://www.alsumaria.tv/Rss/NewsHighlights/ar", language: "ar", category: "world", isActive: true },
  { name: "السومرية — دوليات الشرق الأوسط", feedUrl: "https://www.alsumaria.tv/Rss/News/ar/49/%D8%AF%D9%88%D9%84%D9%8A%D8%A7%D8%AA", language: "ar", category: "politics", isActive: true },
  { name: "بي بي سي عربي", feedUrl: "https://feeds.bbci.co.uk/arabic/rss.xml", language: "ar", category: "world", isActive: true },
  { name: "BBC Middle East", feedUrl: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", language: "en", category: "world", isActive: true },
  { name: "BBC Sport", feedUrl: "https://feeds.bbci.co.uk/sport/rss.xml", language: "en", category: "sports", isActive: true },
  { name: "ESPN Sports", feedUrl: "https://www.espn.com/espn/rss/news", language: "en", category: "sports", isActive: true },
  { name: "BBC Business", feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml", language: "en", category: "economy", isActive: true },
  { name: "BBC Health", feedUrl: "https://feeds.bbci.co.uk/news/health/rss.xml", language: "en", category: "health", isActive: true },
  { name: "BBC Science", feedUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", language: "en", category: "science", isActive: true },
  { name: "BBC Technology", feedUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml", language: "en", category: "technology", isActive: true },
  { name: "BBC Culture", feedUrl: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", language: "en", category: "culture", isActive: true },
  { name: "BBC Politics", feedUrl: "https://feeds.bbci.co.uk/news/politics/rss.xml", language: "en", category: "politics", isActive: true },
  { name: "The Guardian Politics", feedUrl: "https://www.theguardian.com/politics/rss", language: "en", category: "politics", isActive: true },
  { name: "The Guardian Business", feedUrl: "https://www.theguardian.com/business/rss", language: "en", category: "economy", isActive: true },
  { name: "The Guardian Health", feedUrl: "https://www.theguardian.com/society/health/rss", language: "en", category: "health", isActive: true },
  { name: "The Guardian Science", feedUrl: "https://www.theguardian.com/science/rss", language: "en", category: "science", isActive: true },
  { name: "The Guardian Technology", feedUrl: "https://www.theguardian.com/technology/rss", language: "en", category: "technology", isActive: true },
  { name: "The Guardian Culture", feedUrl: "https://www.theguardian.com/culture/rss", language: "en", category: "culture", isActive: true },
  { name: "The Guardian Lifestyle", feedUrl: "https://www.theguardian.com/lifeandstyle/rss", language: "en", category: "lifestyle", isActive: true },
  { name: "The Guardian Food", feedUrl: "https://www.theguardian.com/food/rss", language: "en", category: "lifestyle", isActive: true },
];

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function slugify(title: string, externalId: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  return `${base || "khabar"}-${Buffer.from(externalId).toString("base64url").slice(0, 18)}`;
}

export function parseRss(xml: string, source: InsertNewsSource) {
  const items = Array.from(xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi), match => match[1]);
  return items.map((item, index) => {
    const title = readTag(item, "title");
    const atomLink = item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "";
    const sourceUrl = readTag(item, "link") || atomLink || readTag(item, "guid");
    const externalId = readTag(item, "guid") || sourceUrl || `${source.feedUrl}-${index}-${title}`;
    const published = readTag(item, "pubDate") || readTag(item, "published") || readTag(item, "updated");
    const description = readTag(item, "description") || readTag(item, "content:encoded");
    const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] || item.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1];
    return {
      externalId: externalId.slice(0, 512),
      slug: slugify(title, externalId),
      title: title.slice(0, 500),
      content: description.slice(0, 12000) || null,
      sourceName: source.name,
      sourceUrl: sourceUrl.slice(0, 1000),
      imageUrl: enclosure?.slice(0, 1000) || null,
      category: source.category,
      publishedAt: Number.isNaN(Date.parse(published)) ? new Date() : new Date(published),
      isBreaking: /(عاجل|breaking|urgent|live|آخر الأخبار)/i.test(title),
    };
  }).filter(item => item.title && item.sourceUrl);
}

export function fallbackArabicSummary(title: string, content: string | null) {
  return content ? content.replace(/\s+/g, " ").trim().slice(0, 240) : title;
}

export async function summarizeArabic(title: string, content: string | null) {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت محرر أخبار عربي. اكتب ملخصاً عربياً مهنياً ومحايداً من جملة واحدة، لا يتجاوز 26 كلمة، ولا تضف أي معلومة غير موجودة في النص." },
        { role: "user", content: `العنوان: ${title}\nالنص: ${content || title}` },
      ],
    });
    const text = response.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim().slice(0, 500) : title;
  } catch (error) {
    console.warn("[News] Summary generation failed:", error);
    return fallbackArabicSummary(title, content);
  }
}

export async function ensureDefaultSources() {
  const db = await getDb();
  if (!db) return [];
  for (const source of DEFAULT_NEWS_SOURCES) {
    await db.insert(newsSources).values(source).onDuplicateKeyUpdate({ set: { name: source.name, language: source.language, category: source.category, isActive: true } });
  }
  return db.select().from(newsSources);
}

export async function syncNewsFeeds() {
  const db = await getDb();
  if (!db) return { fetched: 0, inserted: 0, sources: 0 };
  const sources = await ensureDefaultSources();
  let fetched = 0;
  let inserted = 0;
  for (const source of sources.filter(item => item.isActive)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(source.feedUrl, {
        headers: { "user-agent": "NabdAlalam/1.0 RSS Reader", accept: "application/rss+xml, application/atom+xml, text/xml" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        console.warn(`[News] Feed returned ${response.status}: ${source.feedUrl}`);
        continue;
      }
      const parsed = parseRss(await response.text(), source);
      fetched += parsed.length;
      const items = await Promise.all(parsed.slice(0, 3).map(async item => ({ ...item, sourceId: source.id, summary: await summarizeArabic(item.title, item.content) })));
      await Promise.all(items.map(item => db.insert(news).values(item).onDuplicateKeyUpdate({ set: { title: item.title, content: item.content, imageUrl: item.imageUrl, summary: item.summary, publishedAt: item.publishedAt } })));
      inserted += items.length;
    } catch (error) {
      console.warn(`[News] Feed failed: ${source.feedUrl}`, error);
    }
  }
  return { fetched, inserted, sources: sources.length };
}

export const SOURCE_COVERAGE_CATEGORIES = ["politics", "economy", "sports", "technology", "health", "science", "culture", "lifestyle"] as const;

export function hasRedundantCategoryCoverage(sources: Pick<InsertNewsSource, "category">[] = DEFAULT_NEWS_SOURCES) {
  return SOURCE_COVERAGE_CATEGORIES.every(category => sources.filter(source => source.category === category).length >= 2);
}

export function prioritizeNews<T extends { sourceName: string; publishedAt: Date | string }>(rows: T[]) {
  const regionalPattern = /السومرية|بي بي سي عربي|BBC Middle East/i;
  return rows.sort((a, b) => Number(regionalPattern.test(b.sourceName)) - Number(regionalPattern.test(a.sourceName)) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function listNews(input: { category?: string; search?: string; language?: "ar" | "en"; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (input.language === "en") {
    const englishSources = await db.select({ id: newsSources.id }).from(newsSources).where(eq(newsSources.language, "en"));
    if (englishSources.length) filters.push(inArray(news.sourceId, englishSources.map(source => source.id)));
    else return [];
  }
  if (input.category && input.category !== "all") filters.push(eq(news.category, input.category as typeof news.category.enumValues[number]));
  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    filters.push(or(like(news.title, term), like(news.summary, term), like(news.sourceName, term))!);
  }
  const rows = await db.select().from(news).where(filters.length ? and(...filters) : undefined).orderBy(desc(news.publishedAt)).limit(Math.min(input.limit || 30, 60));
  if (!input.category || input.category === "all") return prioritizeNews(rows);
  return rows;
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return rows[0];
}

export async function listRelatedNews(article: { id: number; category: string }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).where(and(eq(news.category, article.category as typeof news.category.enumValues[number]), ne(news.id, article.id))).orderBy(desc(news.publishedAt)).limit(4);
}
