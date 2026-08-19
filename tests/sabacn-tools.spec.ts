import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const tinyWebp = Buffer.from("UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=", "base64");
const tinyJpg = Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AYf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AYf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oARAAEAAgDAQACEQMRAD8A7f/EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8hP//Z", "base64");

async function chooseFile(page: import("@playwright/test").Page, file: { name: string; mimeType: string; buffer: Buffer }, multiple = false) {
  await page.locator('input[type="file"]').setInputFiles(multiple ? [file] : file);
}

async function pdfBuffer(pages = 1) {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([200, 200]);
  return Buffer.from(await document.save());
}

test("homepage lists tools and filters them with search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /SABACUN/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "ابحث عن أداة" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ضغط الصور اونلاين مجانًا" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تحويل الصور إلى JPG وPNG وWebP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "دمج ملفات PDF مجانًا" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تحويل الصور إلى PDF مجانًا" })).toBeVisible();
  await page.getByRole("textbox", { name: "ابحث عن أداة" }).fill("ضغط");
  await expect(page.getByRole("heading", { name: "ضغط الصور اونلاين مجانًا" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تحويل الصور إلى JPG وPNG وWebP" })).toBeHidden();
  await page.getByRole("textbox", { name: "ابحث عن أداة" }).fill("غير موجود");
  await expect(page.getByText("لا توجد أداة مطابقة لبحثك.")).toBeVisible();
});

test("tools directory exposes the three approved tools", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "أدوات SABACUN الرقمية" })).toBeVisible();
  await expect(page.getByRole("link", { name: /ضغط الصور/ })).toHaveAttribute("href", "/tools/image-compressor");
  await expect(page.getByRole("link", { name: "تحويل الصور إلى JPG وPNG وWebP" })).toHaveAttribute("href", "/tools/image-converter");
  await expect(page.getByRole("link", { name: /دمج ملفات PDF/ })).toHaveAttribute("href", "/tools/merge-pdf");
  await expect(page.getByRole("link", { name: /تحويل الصور إلى PDF/ })).toHaveAttribute("href", "/tools/images-to-pdf");
  await expect(page.locator('a[href^="/tools/"]')).toHaveCount(4);
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

test("merge PDF validates, warns about duplicates, reorders, merges, downloads, clears, and works on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/merge-pdf");
  const first = await pdfBuffer(1);
  const second = await pdfBuffer(2);
  await chooseFile(page, { name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") }, true);
  await expect(page.getByRole("alert")).toContainText("تالف");
  await chooseFile(page, { name: "large.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(20 * 1024 * 1024 + 1) }, true);
  await expect(page.getByRole("alert")).toContainText("20MB");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: first },
    { name: "second.pdf", mimeType: "application/pdf", buffer: second },
    { name: "copy.pdf", mimeType: "application/pdf", buffer: first },
  ]);
  await expect(page.getByText("first.pdf")).toBeVisible();
  await expect(page.getByText("second.pdf")).toBeVisible();
  await expect(page.getByText("copy.pdf")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("مكرر");
  await page.getByRole("button", { name: "تحريك second.pdf للأسفل" }).click();
  await expect(page.getByRole("button", { name: "تحريك second.pdf للأعلى" })).toBeEnabled();
  await page.getByRole("button", { name: "حذف copy.pdf" }).click();
  await expect(page.getByText("copy.pdf")).toHaveCount(0);
  await page.getByRole("button", { name: "دمج ملفات PDF" }).click();
  await expect(page.getByRole("button", { name: "تنزيل PDF المدمج" })).toBeVisible({ timeout: 15000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل PDF المدمج" }).click();
  await expect(download).resolves.toBeTruthy();
  await page.getByRole("button", { name: "إعادة ضبط" }).click();
  await expect(page.getByText("first.pdf")).toHaveCount(0);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("images to PDF accepts multiple images, validates, reorders, downloads, resets, and works on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/images-to-pdf");
  await chooseFile(page, { name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") }, true);
  await expect(page.getByRole("alert")).toContainText("تعذر قراءة إحدى الصور");
  await chooseFile(page, { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) }, true);
  await expect(page.getByRole("alert")).toContainText("10MB");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer: tinyPng },
    { name: "second.jpg", mimeType: "image/jpeg", buffer: tinyJpg },
    { name: "third.webp", mimeType: "image/webp", buffer: tinyWebp },
  ]);
  await expect(page.getByAltText("معاينة first.png")).toBeVisible();
  await expect(page.getByAltText("معاينة second.jpg")).toBeVisible();
  await expect(page.getByAltText("معاينة third.webp")).toBeVisible();
  await page.getByRole("button", { name: "تحريك second.jpg للأعلى" }).click();
  await expect(page.getByRole("button", { name: "تحريك second.jpg للأسفل" })).toBeEnabled();
  await expect(page.locator('img[alt^="معاينة "]').evaluateAll((images) => images.map((image) => image.getAttribute("alt")))).resolves.toEqual(["معاينة second.jpg", "معاينة first.png", "معاينة third.webp"]);
  await page.getByRole("button", { name: "إنشاء PDF" }).click();
  await expect(page.getByRole("button", { name: "تنزيل PDF" })).toBeVisible({ timeout: 15000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل PDF" }).click();
  const downloaded = await download;
  const generatedPath = await downloaded.path();
  expect(generatedPath).toBeTruthy();
  const generatedPdf = await PDFDocument.load(await import("node:fs/promises").then(({ readFile }) => readFile(generatedPath!)));
  expect(generatedPdf.getPageCount()).toBe(3);
  await page.getByRole("button", { name: "إعادة ضبط" }).click();
  await expect(page.getByAltText("معاينة first.png")).toHaveCount(0);
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
