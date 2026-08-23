import { expect, test } from "@playwright/test";

async function acceptCookies(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: "قبول الاختيار" });
  if (await button.isVisible().catch(() => false)) await button.click();
}

async function viewportCheck(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("homepage shows community feed, search, categories and campaign CTA", async ({ page }) => {
  await page.goto("/");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "شارك في حملة، واترك أثراً." })).toBeVisible();
  await expect(page.getByRole("link", { name: /انشر حملة/ }).first()).toBeVisible();
  await expect(page.getByPlaceholder("ابحث عن حملة أو مدينة")).toBeVisible();
  await expect(page.getByRole("heading", { name: "نحتاج متبرعين لفصيلة O+" })).toBeVisible();
  await page.getByPlaceholder("ابحث عن حملة أو مدينة").fill("تشجير");
  await expect(page.getByRole("heading", { name: "تشجير وتنظيف مساحة عامة" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "نحتاج متبرعين لفصيلة O+" })).toHaveCount(0);
});

test("blood and volunteer pages expose actionable campaign cards", async ({ page }) => {
  await page.goto("/blood");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "قطرة منك، حياة لغيرك" })).toBeVisible();
  await expect(page.getByText("أريد التبرع").first()).toBeVisible();
  await page.getByRole("button", { name: "أريد التبرع" }).first().click();
  await expect(page.getByRole("button", { name: "شكراً لاستجابتك" })).toBeVisible();
  await page.goto("/volunteer");
  await expect(page.getByRole("heading", { name: "وقتك يمكن أن يغيّر مكاناً" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تشجير وتنظيف مساحة عامة" })).toBeVisible();
  await expect(page.getByRole("link", { name: /انشر فرصة تطوع/ })).toBeVisible();
  await page.goto("/publish/blood");
  await expect(page.getByRole("heading", { name: "انشر طلب تبرع بالدم" })).toBeVisible();
  await page.goto("/publish/volunteer");
  await expect(page.getByRole("heading", { name: "انشر فرصة تطوع" })).toBeVisible();
});

test("campaign details supports registration and cancellation", async ({ page }) => {
  await page.goto("/campaign/c1");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "نحتاج متبرعين لفصيلة O+" })).toBeVisible();
  await page.getByRole("button", { name: "سجل الآن" }).click();
  await expect(page.getByRole("button", { name: "مسجل" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("تم تسجيلك");
  await page.getByRole("button", { name: "مسجل" }).click();
  await expect(page.getByRole("button", { name: "سجل الآن" })).toBeVisible();
});

test("create campaign validates and stores a campaign for review", async ({ page }) => {
  await page.goto("/create");
  await acceptCookies(page);
  await page.getByRole("button", { name: /إرسال للمراجعة/ }).click();
  await expect(page.getByRole("status")).toContainText("أكمل الحقول الأساسية");
  await page.getByLabel("عنوان الحملة").fill("حملة تنظيف مساحة عامة");
  await page.getByLabel("وصف الحملة").fill("نشاط مجتمعي لتنظيف الحي بمشاركة السكان.");
  await page.getByLabel("الموقع").fill("الموقع العام · نقطة التجمع");
  await page.getByLabel("التاريخ").fill("2026-09-20");
  await page.getByLabel("الوقت").fill("10:00");
  await page.getByRole("button", { name: /إرسال للمراجعة/ }).click();
  await expect(page.getByRole("status")).toContainText("تم إرسال حملتك");
});

test("profile and mobile navigation remain usable without old tools routes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/profile");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "زائر SABACUN" })).toBeVisible();
  await expect(page.getByRole("link", { name: "نشر" })).toBeVisible();
  await viewportCheck(page);
  await page.goto("/tools/image-compressor");
  await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
  await expect(page.getByText("مبادرة مجتمعية")).toHaveCount(0);
  await expect(page.getByText("وجبات")).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByText("مركز المعرفة")).toHaveCount(0);
  await viewportCheck(page);
});
