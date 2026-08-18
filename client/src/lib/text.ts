export function cleanDisplayText(value: string | null | undefined) {
  let cleaned = value || "";
  for (let pass = 0; pass < 2; pass += 1) {
    cleaned = cleaned.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    cleaned = cleaned.replace(/<[^>]+>/g, " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}
