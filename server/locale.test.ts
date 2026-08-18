import { describe, expect, it } from "vitest";
import { detectLocale, getInitialLocale, getLocaleDirection, normalizeLocale } from "../client/src/lib/locale";

describe("locale detection", () => {
  it("normalizes browser language tags", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("ar-IQ")).toBe("ar");
    expect(detectLocale("fr-FR")).toBe("ar");
  });

  it("prefers a saved manual choice over the browser language", () => {
    expect(getInitialLocale("en-US", "ar")).toBe("ar");
    expect(getInitialLocale("ar-IQ", "en")).toBe("en");
    expect(getInitialLocale("en-US", null)).toBe("en");
  });

  it("uses the correct reading direction", () => {
    expect(getLocaleDirection("ar")).toBe("rtl");
    expect(getLocaleDirection("en")).toBe("ltr");
  });
});
