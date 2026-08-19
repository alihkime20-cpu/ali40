import { expect, test } from "@playwright/test";

test("homepage no longer exposes removed tools", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /SABACUN/ })).toBeVisible();
  await expect(page.getByText("جميع الأدوات")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "ابحث عن أداة" })).toHaveCount(0);
  await expect(page.locator('a[href^="/tool/"]')).toHaveCount(0);
});

test("tools route shows an empty transition state and no tool links", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "الأدوات قيد الإعداد" })).toBeVisible();
  await expect(page.getByText(/أزلنا مجموعة الأدوات السابقة بالكامل/)).toBeVisible();
  await expect(page.locator('a[href^="/tool/"]')).toHaveCount(0);
});

test("internal knowledge page has back navigation and remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/knowledge");
  await expect(page.getByRole("button", { name: "الرئيسية" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
