import type { Express, Request, Response } from "express";
import { desc } from "drizzle-orm";
import { news } from "../drizzle/schema";
import { getDb } from "./db";

function siteOrigin(req: Request) {
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
  const host = req.headers.host || "localhost";
  return `${protocol}://${host}`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    const origin = siteOrigin(req);
    const pages = ["/", "/about", "/privacy", "/terms", "/content-policy", "/contact"];
    let articlePaths: string[] = [];
    try {
      const db = await getDb();
      if (db) {
        const articles = await db.select({ slug: news.slug }).from(news).orderBy(desc(news.publishedAt)).limit(1000);
        articlePaths = articles.map(article => `/news/${encodeURIComponent(article.slug)}`);
      }
    } catch (error) {
      console.warn("[SEO] Could not load article URLs for sitemap", error);
    }
    const allPaths = [...pages, ...articlePaths];
    const urls = allPaths.map(path => {
      const isArticle = path.startsWith("/news/");
      const isHome = path === "/";
      return `  <url><loc>${escapeXml(`${origin}${path}`)}</loc><changefreq>${isHome ? "hourly" : isArticle ? "daily" : "yearly"}</changefreq><priority>${isHome ? "1.0" : isArticle ? "0.7" : "0.4"}</priority></url>`;
    }).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  });
}
