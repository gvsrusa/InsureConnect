import { expect, test } from "@playwright/test";

test.describe("Admin login flow", () => {
  test("renders dedicated admin login page", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByRole("heading", { name: "Secure Access" })).toBeVisible();
    await expect(page.getByText("Admin Portal")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Admin email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in as admin" })).toBeVisible();
  });

  test("shows error for invalid admin credentials", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByRole("textbox", { name: "Admin email" }).fill("invalid-admin@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("bad-password");
    await page.getByRole("button", { name: "Sign in as admin" }).click();

    await expect(
      page.locator("div[role='alert']").filter({ hasText: /invalid|credential|password|unauthorized/i })
    ).toBeVisible();
  });
});
