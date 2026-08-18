import type { Express, Request, Response } from "express";

function siteOrigin(req: Request) {
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
  const host = req.headers.host || "localhost";
  return `${protocol}://${host}`;
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", (req: Request, res: Response) => {
    const origin = siteOrigin(req);
    const pages = ["/", "/about", "/privacy", "/terms", "/content-policy"];
    const urls = pages.map(path => `  <url><loc>${origin}${path}</loc><changefreq>${path === "/" ? "hourly" : "yearly"}</changefreq><priority>${path === "/" ? "1.0" : "0.4"}</priority></url>`).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  });
}
