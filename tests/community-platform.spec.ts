import { expect, test } from "@playwright/test";

async function acceptCookies(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: "قبول الاختيار" });
  if (await button.isVisible().catch(() => false)) await button.click();
}

async function clearLocalState(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

async function viewportCheck(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("homepage is an entry page without posts, search, or fake counts", async ({ page }) => {
  await clearLocalState(page);
  await page.goto("/");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "شارك في حملة، واترك أثراً." })).toBeVisible();
  await expect(page.getByRole("link", { name: "التبرع بالدم" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "التطوع" }).first()).toBeVisible();
  await expect(page.getByPlaceholder("ابحث عن حملة أو مدينة")).toHaveCount(0);
  await expect(page.getByText(/مشارك/)).toHaveCount(0);
  await viewportCheck(page);
});

test("each section shows only its own posts and publication page", async ({ page }) => {
  await clearLocalState(page);
  await page.goto("/blood");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "طلبات التبرع بالدم" })).toBeVisible();
  await expect(page.getByText("لا توجد منشورات تبرع بالدم حالياً.")).toBeVisible();
  await expect(page.getByRole("link", { name: /انشر طلب تبرع/ })).toBeVisible();
  await page.goto("/volunteer");
  await expect(page.getByRole("heading", { name: "فرص التطوع" })).toBeVisible();
  await expect(page.getByText("لا توجد منشورات تطوع حالياً.")).toBeVisible();
  await expect(page.getByRole("link", { name: /انشر فرصة تطوع/ })).toBeVisible();
  await page.goto("/publish/blood");
  await expect(page.getByRole("heading", { name: "انشر طلب تبرع بالدم" })).toBeVisible();
  await page.goto("/publish/volunteer");
  await expect(page.getByRole("heading", { name: "انشر فرصة تطوع" })).toBeVisible();
});

test("blood and volunteer posts stay inside their own section", async ({ page }) => {
  await clearLocalState(page);
  await page.goto("/publish/blood");
  await acceptCookies(page);
  await page.getByLabel("عنوان الحملة").fill("طلب دم عاجل");
  await page.getByLabel("وصف الحملة").fill("طلب تبرع بالدم من الجهة الناشرة.");
  await page.getByLabel("الموقع").fill("الموقع العام");
  await page.getByLabel("التاريخ").fill("2026-09-20");
  await page.getByLabel("الوقت").fill("10:00");
  await page.getByRole("button", { name: /إرسال للمراجعة/ }).click();
  await expect(page.getByRole("status")).toContainText("تم إرسال حملتك");
  await page.goto("/blood");
  await expect(page.getByRole("heading", { name: "طلب دم عاجل" })).toBeVisible();
  await page.goto("/volunteer");
  await expect(page.getByRole("heading", { name: "طلب دم عاجل" })).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "طلب دم عاجل" })).toHaveCount(0);
});

test("create campaign validates before saving", async ({ page }) => {
  await clearLocalState(page);
  await page.goto("/create");
  await acceptCookies(page);
  await page.getByRole("button", { name: /إرسال للمراجعة/ }).click();
  await expect(page.getByRole("status")).toContainText("أكمل الحقول الأساسية");
});

test("profile and mobile navigation remain usable without old routes", async ({ page }) => {
  await clearLocalState(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/profile");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { name: "عضو المجتمع" })).toBeVisible();
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
