const { chromium } = require("playwright");
const fs = require("node:fs/promises");

const BASE = "http://localhost";
const OUT = "docs/screenshots";

const creds = {
  customer: { portal: "customer", email: "customer@insureconnect.local", password: "Password1!" },
  agent: { portal: "agent", email: "agent@insureconnect.local", password: "Password1!" },
  partner: { portal: "partner", email: "underwriter@insureconnect.local", password: "Password1!" },
  admin: { email: "admin.test@insureconnect.local", password: "Password1!" }
};

const knownIds = {
  agentPolicyId: "cmn4sue16002br2f4r9mi0x37",
  partnerPolicyId: "cmn4w5ub7000dvxepb2qr87v3"
};

async function shot(page, relPath, fullPage = true) {
  const filePath = `${OUT}/${relPath}`;
  await fs.mkdir(filePath.substring(0, filePath.lastIndexOf("/")), { recursive: true });
  await page.screenshot({ path: filePath, fullPage });
}

async function loginPortal(page, portal, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator("select").first().selectOption(portal);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForFunction(() => !window.location.pathname.endsWith("/login"), null, {
    timeout: 20000
  });
  await page.waitForLoadState("networkidle");
}

async function safeClick(page, selector) {
  const loc = page.locator(selector).first();
  if (await loc.count()) {
    await loc.click();
    await page.waitForLoadState("networkidle");
    return true;
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    await fs.mkdir(OUT, { recursive: true });

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await shot(page, "public/01-login.png");

      await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
      await shot(page, "public/02-register.png");

      await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
      await shot(page, "public/03-admin-login.png");
      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await loginPortal(page, creds.customer.portal, creds.customer.email, creds.customer.password);
      await shot(page, "customer/01-dashboard.png");

      await page.goto(`${BASE}/roles`, { waitUntil: "networkidle" });

      // The roles page requires an explicit refresh to load DB-backed role data.
      const refreshRolesButton = page.getByRole("button", { name: /refresh roles/i });
      if (await refreshRolesButton.count()) {
        await refreshRolesButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForFunction(() => {
          const button = Array.from(document.querySelectorAll("button")).find(
            (el) => /refresh roles/i.test((el.textContent || "").trim())
          );
          return Boolean(button);
        });
      }

      await shot(page, "shared/01-role-management.png");

      await page.goto(`${BASE}/policies`, { waitUntil: "networkidle" });
      await shot(page, "customer/02-policies-list.png");

      if (await safeClick(page, "a[href^='/policies/']")) {
        await shot(page, "customer/03-policy-detail.png");
      }
      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await loginPortal(page, creds.agent.portal, creds.agent.email, creds.agent.password);
      await shot(page, "agent/01-dashboard.png");

      await page.goto(`${BASE}/agent/quotes`, { waitUntil: "networkidle" });
      await shot(page, "agent/02-quotes-all.png");

      await page.goto(`${BASE}/agent/quotes?status=PENDING`, { waitUntil: "networkidle" });
      await shot(page, "agent/03-quotes-filter-pending.png");

      if (await safeClick(page, "a[href^='/agent/quotes/']")) {
        await shot(page, "agent/04-quote-detail.png");
      }

      await page.goto(`${BASE}/agent/policies`, { waitUntil: "networkidle" });
      await shot(page, "agent/05-policies-list.png");

      await page.goto(`${BASE}/agent/policies/${knownIds.agentPolicyId}`, { waitUntil: "networkidle" });
      await shot(page, "agent/06-policy-detail.png");

      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await loginPortal(page, creds.partner.portal, creds.partner.email, creds.partner.password);
      await shot(page, "partner/01-dashboard.png");

      await page.goto(`${BASE}/partner/quotes`, { waitUntil: "networkidle" });
      await shot(page, "partner/02-quotes-list.png");

      await page.goto(`${BASE}/partner/policies`, { waitUntil: "networkidle" });
      await shot(page, "partner/03-policies-list.png");

      await page.goto(`${BASE}/partner/policies/${knownIds.partnerPolicyId}`, { waitUntil: "networkidle" });
      await shot(page, "partner/04-policy-detail.png");

      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
      await page.getByRole("textbox", { name: /admin email/i }).fill(creds.admin.email);
      await page.getByRole("textbox", { name: /password/i }).fill(creds.admin.password);
      await page.getByRole("button", { name: /sign in as admin/i }).click();
      await page.waitForLoadState("networkidle");

      await page.goto(`${BASE}/admin/roles`, { waitUntil: "networkidle" });
      await shot(page, "admin/01-role-management.png");

      await page.goto(`${BASE}/admin/audit`, { waitUntil: "networkidle" });
      await shot(page, "admin/02-audit-log.png");

      await context.close();
    }

    console.log("Screenshots captured successfully.");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
