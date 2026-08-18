import type { Express, Request, Response } from "express";
import { desc } from "drizzle-orm";
import { getDb } from "./db";
import { news } from "../drizzle/schema";

function siteOrigin(req: Request) {
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
  const host = String(req.headers.host || "localhost").split(",")[0].trim();
  return `${protocol}://${host}`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

function urlEntry(origin: string, path: string, changefreq: "hourly" | "daily" | "yearly", priority: string, lastmod?: Date | string) {
  const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "";
  return `  <url><loc>${escapeXml(`${origin}${path}`)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    const origin = siteOrigin(req);
    res.type("text/plain; charset=utf-8").send([
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /__manus__/",
      `Sitemap: ${origin}/sitemap.xml`,
      "",
    ].join("\n"));
  });

  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    const origin = siteOrigin(req);
    const pages = [
      urlEntry(origin, "/", "hourly", "1.0"),
      urlEntry(origin, "/about", "yearly", "0.4"),
      urlEntry(origin, "/contact", "yearly", "0.4"),
      urlEntry(origin, "/privacy", "yearly", "0.3"),
      urlEntry(origin, "/terms", "yearly", "0.3"),
      urlEntry(origin, "/content-policy", "yearly", "0.3"),
    ];

    try {
      const db = await getDb();
      if (db) {
        const stories = await db.select({ slug: news.slug, publishedAt: news.publishedAt }).from(news).orderBy(desc(news.publishedAt)).limit(5000);
        for (const story of stories) {
          if (story.slug) pages.push(urlEntry(origin, `/news/${encodeURIComponent(story.slug)}`, "daily", "0.7", story.publishedAt));
        }
      }
    } catch (error) {
      console.warn("[SEO] Could not load article URLs for sitemap:", error);
    }

    res.type("application/xml; charset=utf-8").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join("\n")}\n</urlset>`);
  });
}
