import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduledNewsHandler } from "../news-scheduled";
import { getNewsBySlug } from "../news";
import { registerSeoRoutes } from "../seo";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/news", scheduledNewsHandler);
  app.get("/news/:slug", async (req, res, next) => {
    const userAgent = req.get("user-agent") || "";
    const isCrawler = /bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|whatsapp/i.test(userAgent);
    if (!isCrawler) return next();
    const story = await getNewsBySlug(req.params.slug);
    if (!story) return next();
    const requestedLanguage = String(req.headers["accept-language"] || "").toLowerCase();
    const locale = requestedLanguage.startsWith("en") ? "en" : "ar";
    const direction = locale === "ar" ? "rtl" : "ltr";
    const brand = locale === "ar" ? "نبض العالم" : "Global Pulse";
    const readLabel = locale === "ar" ? "قراءة الخبر" : "Read story";
    const title = escapeHtml(`${story.title} | ${brand}`);
    const description = escapeHtml(story.summary || story.title);
    const canonicalRaw = `${req.protocol}://${req.get("host")}/news/${encodeURIComponent(req.params.slug)}`;
    const canonical = escapeHtml(canonicalRaw);
    const image = story.imageUrl ? `<meta property="og:image" content="${escapeHtml(story.imageUrl)}" />` : "";
    const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": "NewsArticle", headline: story.title, description: story.summary || story.title, datePublished: new Date(story.publishedAt).toISOString(), dateModified: new Date(story.fetchedAt).toISOString(), mainEntityOfPage: canonicalRaw, author: { "@type": "Organization", name: story.sourceName }, publisher: { "@type": "Organization", name: brand }, ...(story.imageUrl ? { image: [story.imageUrl] } : {}) }).replace(/</g, "\\u003c");
    const alternateLinks = `<link rel="alternate" hreflang="ar" href="${canonical}?lang=ar" /><link rel="alternate" hreflang="en" href="${canonical}?lang=en" /><link rel="alternate" hreflang="x-default" href="${canonical}" />`;
    res.type("html").send(`<!doctype html><html lang="${locale}" dir="${direction}"><head><meta charset="utf-8" /><title>${title}</title><meta name="description" content="${description}" /><meta property="og:locale" content="${locale === "ar" ? "ar_AR" : "en_US"}" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:type" content="article" /><meta property="og:url" content="${canonical}" />${image}<meta name="twitter:card" content="summary_large_image" /><link rel="canonical" href="${canonical}" />${alternateLinks}<script type="application/ld+json">${structuredData}</script></head><body><main><h1>${title}</h1><p>${description}</p><a href="${canonical}">${readLabel}</a></main></body></html>`);
  });
  registerSeoRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
