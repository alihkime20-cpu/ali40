const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const checks = [
  { path: "/", status: 200, includes: "id=\"root\"" },
  { path: "/tools", status: 200, includes: "id=\"root\"" },
  { path: "/knowledge", status: 200, includes: "id=\"root\"" },
  { path: "/about", status: 200, includes: "id=\"root\"" },
  { path: "/contact", status: 200, includes: "id=\"root\"" },
  { path: "/privacy", status: 200, includes: "id=\"root\"" },
  { path: "/terms", status: 200, includes: "id=\"root\"" },
  { path: "/robots.txt", status: 200, includes: "User-agent" },
  { path: "/sitemap.xml", status: 200, includes: "<urlset" },
];

let failed = 0;
for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`);
  const body = await response.text();
  const contentOk = body.includes(check.includes);
  const ok = response.status === check.status && contentOk;
  console.log(`${ok ? "PASS" : "FAIL"} ${check.path} status=${response.status} marker=${contentOk ? "yes" : "no"}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`Public route audit failed: ${failed} check(s).`);
  process.exit(1);
}
console.log(`Public route audit passed: ${checks.length} checks.`);
