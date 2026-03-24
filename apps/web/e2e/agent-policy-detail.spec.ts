import { expect, test } from "@playwright/test";

test.describe("Agent policy detail flow", () => {
  test("opens a policy detail from the agent policies list", async ({ page }) => {
    await page.goto("/login");

    await page.locator("select").first().selectOption("agent");
    await page.getByRole("textbox", { name: "Email" }).fill("agent@insureconnect.local");
    await page.getByRole("textbox", { name: "Password" }).fill("Password1!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.getByRole("link", { name: "Policies" }).click();
    await expect(page.getByRole("heading", { name: "All Policies" })).toBeVisible();

    const firstPolicy = page.locator("a[href^='/agent/policies/']").first();
    await expect(firstPolicy).toBeVisible();
    await firstPolicy.click();

    await expect(page.getByText("Policy not found")).toHaveCount(0);
    await expect(page.getByText("Coverage Details")).toBeVisible();
    await expect(page).toHaveURL(/\/agent\/policies\//);
  });
});
