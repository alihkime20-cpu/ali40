import { expect, test, type Page } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function upload(page: Page, name = "sample.png", mimeType = "image/png", buffer = tinyPng) {
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer });
}

test("text tool processes valid input, downloads output, and resets", async ({ page }) => {
  await page.goto("/tool/text-counter");
  await page.getByPlaceholder("اكتب أو الصق النص هنا...").fill("مرحبا بالعالم\nهذا اختبار");
  await page.getByRole("button", { name: "تشغيل الأداة" }).click();
  await expect(page.locator("pre")).toContainText("الكلمات: 4");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("text-counter.txt");

  await page.getByPlaceholder("اكتب أو الصق النص هنا...").fill("");
  await page.getByRole("button", { name: "تشغيل الأداة" }).click();
  await expect(page.locator("pre")).toContainText("الكلمات: 0");
});

test("image tool accepts a valid image, downloads output, and resets", async ({ page }) => {
  await page.goto("/tool/image-compressor");
  await upload(page);
  await expect(page.getByText("sample.png")).toBeVisible();
  await expect(page.locator('img[alt="معاينة الصورة المختارة"]')).toBeVisible();
  await expect(page.getByText("ملفاتك تُعالج محليًا في متصفحك ولا تُرفع لأي سيرفر.")).toBeVisible();
  await expect(page.getByText(/الحجم قبل الضغط:/)).toContainText("بايت");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "ضغط وتنزيل الصورة" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample-compressed.png");
  await expect(page.getByText(/الحجم بعد الضغط:/)).toContainText("بايت");

  await page.getByRole("button", { name: "إزالة" }).click();
  await expect(page.getByText("sample.png")).toHaveCount(0);
  await expect(page.locator('img[alt="معاينة الصورة المختارة"]')).toHaveCount(0);
});

test("image tools reject invalid and oversized files", async ({ page }) => {
  await page.goto("/tool/color-extractor");
  await upload(page, "notes.txt", "text/plain", Buffer.from("not an image"));
  await expect(page.getByRole("alert")).toContainText("يرجى اختيار ملف صورة");

  await upload(page, "large.png", "image/png", Buffer.alloc(10 * 1024 * 1024 + 1));
  await expect(page.getByRole("alert")).toContainText("10 ميغابايت");
});

test("jpg to pdf creates a downloadable PDF", async ({ page }) => {
  await page.goto("/tool/pdf-jpg");
  await upload(page, "photo.png");
  await expect(page.getByText("photo.png")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "إنشاء وتنزيل PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("photo.pdf");
});

test("homepage search filters tools, focuses results, and handles no matches", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "ابحث عن أداة" });
  await search.fill("ضغط الصور");
  await expect(page.getByRole("heading", { name: "نتائج البحث عن «ضغط الصور»" })).toBeVisible();
  await expect(page.locator("#tools-results").getByText("ضغط الصور", { exact: true })).toBeVisible();
  await search.press("Enter");
  await expect(page.locator("#tools-results")).toBeInViewport();
  await search.fill("لا توجد أداة بهذا الاسم");
  await expect(page.getByText("لم نجد أداة مطابقة لبحثك.")).toBeVisible();
});

test("internal pages expose a back button while the homepage does not", async ({ page }) => {
  await page.goto("/tool/text-counter");
  await expect(page.getByRole("button", { name: "جميع الأدوات" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "رجوع" })).toHaveCount(0);
});

test("internal tool page remains usable on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tool/text-counter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

