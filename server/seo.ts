import type { Express, Request } from "express";

function siteOrigin(req: Request) { const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim(); const host = String(req.headers.host || "localhost").split(",")[0].trim(); return `${protocol}://${host}`; }
function escapeXml(value: string) { return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] || character); }
function urlEntry(origin: string, path: string, changefreq: "daily" | "weekly" | "yearly", priority: string) { return `  <url><loc>${escapeXml(`${origin}${path}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`; }

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => { const origin = siteOrigin(req); res.type("text/plain; charset=utf-8").send(["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /__manus__/", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n")); });
  app.get("/sitemap.xml", (req, res) => { const origin = siteOrigin(req); const paths = [
    ["/", "daily", "1.0"], ["/tools", "weekly", "0.9"], ["/tools/image-compressor", "weekly", "0.8"], ["/tools/image-converter", "weekly", "0.8"], ["/tools/merge-pdf", "weekly", "0.8"], ["/tools/images-to-pdf", "weekly", "0.8"], ["/tools/background-remover", "weekly", "0.8"], ["/about", "yearly", "0.4"], ["/contact", "yearly", "0.4"], ["/privacy", "yearly", "0.3"], ["/terms", "yearly", "0.3"], ["/cookies", "yearly", "0.3"], ["/content-policy", "yearly", "0.3"],
  ] as const; const pages = paths.map(([path, changefreq, priority]) => urlEntry(origin, path, changefreq, priority)); res.type("application/xml; charset=utf-8").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join("\n")}\n</urlset>`); });
}
