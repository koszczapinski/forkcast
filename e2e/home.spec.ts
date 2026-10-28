import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Forkcast/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Forkcast" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan a week" })).toBeVisible();
});
