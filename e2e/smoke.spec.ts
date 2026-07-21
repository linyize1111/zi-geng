import { expect, test } from "@playwright/test";

test("today route loads under hash router", async ({ page }) => {
  await page.goto("./#/today");
  await expect(page.getByRole("heading", { name: "今日" })).toBeVisible();
});
