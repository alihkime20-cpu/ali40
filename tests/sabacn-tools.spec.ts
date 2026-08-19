import { expect, test } from "@playwright/test";

const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

async function chooseFile(page: import("@playwright/test").Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.locator('input[type="file"]').setInputFiles(file);
}

test("homepage lists tools and filters them with search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /SABACUN/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "ابحث عن أداة" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ضغط الصور اونلاين مجانًا" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تحويل الصور إلى JPG وPNG وWebP" })).toBeVisible();
  await page.getByRole("textbox", { name: "ابحث عن أداة" }).fill("ضغط");
  await expect(page.getByRole("heading", { name: "ضغط الصور اونلاين مجانًا" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تحويل الصور إلى JPG وPNG وWebP" })).toBeHidden();
  await page.getByRole("textbox", { name: "ابحث عن أداة" }).fill("غير موجود");
  await expect(page.getByText("لا توجد أداة مطابقة لبحثك.")).toBeVisible();
});

test("tools directory exposes only stage-one tools", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "أدوات SABACUN الرقمية" })).toBeVisible();
  await expect(page.getByRole("link", { name: /ضغط الصور/ })).toHaveAttribute("href", "/tools/image-compressor");
  await expect(page.getByRole("link", { name: /تحويل الصور/ })).toHaveAttribute("href", "/tools/image-converter");
  await expect(page.locator('a[href^="/tools/"]')).toHaveCount(2);
});

test("image compressor processes, downloads, rejects invalid files, and resets", async ({ page }) => {
  await page.goto("/tools/image-compressor");
  await chooseFile(page, { name: "pixel.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.getByText(/pixel.png/)).toBeVisible();
  await page.getByRole("button", { name: "ضغط الصور" }).click();
  await expect(page.getByText(/بعد الضغط:/)).toBeVisible({ timeout: 15000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل pixel.png" }).click();
  await expect(download).resolves.toBeTruthy();
  await page.getByRole("button", { name: "مسح الكل" }).click();
  await expect(page.getByText(/pixel.png/)).toHaveCount(0);
  await chooseFile(page, { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await expect(page.getByRole("alert")).toContainText("JPG أو PNG");
  await chooseFile(page, { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert")).toContainText("10MB");
});

test("image converter converts and downloads PNG, then resets on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/image-converter");
  await chooseFile(page, { name: "pixel.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.getByAltText("معاينة pixel.png")).toBeVisible();
  await page.getByLabel("الصيغة المطلوبة").selectOption("image/jpeg");
  await page.getByRole("button", { name: "تحويل الصورة" }).click();
  await expect(page.getByRole("button", { name: "تنزيل" })).toBeVisible({ timeout: 10000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل" }).click();
  await expect(download).resolves.toBeTruthy();
  await page.getByRole("button", { name: "إعادة ضبط" }).click();
  await expect(page.getByAltText("معاينة pixel.png")).toHaveCount(0);
  await chooseFile(page, { name: "large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert")).toContainText("10MB");
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("homepage remains usable on mobile without knowledge links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "من نحن" }).first()).toBeVisible();
  await expect(page.getByText("مركز المعرفة")).toHaveCount(0);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
