import { mkdir, writeFile } from "node:fs/promises";

const feeds = [
  { name: "BBC World", language: "en", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC Middle East", language: "en", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "The Guardian World", language: "en", url: "https://www.theguardian.com/world/rss" },
  { name: "BBC Arabic", language: "ar", url: "https://feeds.bbci.co.uk/arabic/rss.xml" },
] as const;

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const tag = (item: string, name: string) => {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
};

async function fetchFeed(feed: (typeof feeds)[number]) {
  const response = await fetch(feed.url, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`${feed.name}: HTTP ${response.status}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, 8);
  return items.map(({ 1: item }) => ({
    title: tag(item, "title"),
    link: tag(item, "link"),
    publishedAt: tag(item, "pubDate") || tag(item, "dc:date"),
    source: feed.name,
    language: feed.language,
  })).filter(item => item.title && item.link);
}

const results = await Promise.allSettled(feeds.map(fetchFeed));
const articles = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
const failedFeeds = results.flatMap((result, index) => result.status === "rejected" ? [{ source: feeds[index].name, error: String(result.reason) }] : []);

await mkdir("data", { recursive: true });
await writeFile("data/news-latest.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  articles,
  failedFeeds,
}, null, 2) + "\n");

console.log(`Wrote ${articles.length} articles from ${feeds.length} RSS feeds.`);
if (failedFeeds.length > 0) console.warn(`Feeds unavailable: ${failedFeeds.map(feed => feed.source).join(", ")}`);
