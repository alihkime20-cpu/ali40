import { describe, expect, it } from "vitest";

describe("SABACUN application title", () => {
  it("exposes the configured public title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("SABACUN");
  });
});
