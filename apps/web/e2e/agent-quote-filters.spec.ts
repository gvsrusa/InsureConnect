import { expect, test } from "@playwright/test";

test.describe("Agent quote filters", () => {
  test("filters quote requests by status from the chip links", async ({ page }) => {
    await page.goto("/login");

    await page.locator("select").first().selectOption("agent");
    await page.getByRole("textbox", { name: "Email" }).fill("agent@insureconnect.local");
    await page.getByRole("textbox", { name: "Password" }).fill("Password1!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.getByRole("link", { name: "Quotes" }).click();
    await expect(page.getByRole("heading", { name: "Quote Requests" })).toBeVisible();

    const pendingChip = page.getByRole("link", { name: /PENDING \(/ });
    await expect(pendingChip).toBeVisible();
    await pendingChip.click();

    await expect(page).toHaveURL(/\/agent\/quotes\?status=PENDING$/);
    await expect(page.locator("a[aria-current='page']").filter({ hasText: /PENDING \(/ })).toBeVisible();
    await expect(page.getByText(/shown/)).toContainText("pending");

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    for (let index = 0; index < rowCount; index += 1) {
      await expect(rows.nth(index)).toContainText("Pending");
    }

    await page.getByRole("link", { name: /All \(/ }).click();
    await expect(page).toHaveURL(/\/agent\/quotes$/);
    await expect(page.locator("a[aria-current='page']").filter({ hasText: /All \(/ })).toBeVisible();
  });
});