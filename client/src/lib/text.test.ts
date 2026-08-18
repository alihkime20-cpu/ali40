import { describe, expect, it } from "vitest";
import { cleanDisplayText } from "./text";

describe("display text sanitization", () => {
  it("removes HTML and decodes escaped tags", () => {
    expect(cleanDisplayText("خبر &lt;br/&gt; <strong>مهم</strong>")).toBe("خبر مهم");
  });
});
