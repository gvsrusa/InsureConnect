# Testing Evidence Report

This report documents the validation approach and evidence used to verify InsureConnect functionality across authentication, role-based navigation, API-backed data flows, and regression fixes.

## Validation Strategy

1. Compile-time safety
- Web TypeScript typecheck
- API TypeScript build

2. Automated browser tests
- Playwright E2E coverage for critical regressions

3. Manual browser verification
- Portal-specific click-through tests across Customer, Agent, Partner, and Admin
- Role add/remove operations and audit verification

## Automated Tests Executed

### Command

```bash
npm run test:e2e -- apps/web/e2e/agent-policy-detail.spec.ts apps/web/e2e/agent-quote-filters.spec.ts
```

### Result

- 2 passed
- 0 failed

### Covered Specs

- [apps/web/e2e/agent-policy-detail.spec.ts](../../apps/web/e2e/agent-policy-detail.spec.ts)
- [apps/web/e2e/agent-quote-filters.spec.ts](../../apps/web/e2e/agent-quote-filters.spec.ts)

## Build and Type Validation

### Commands

```bash
npm run -w @insureconnect/web typecheck
npm run -w @insureconnect/api build
```

### Result

- Web typecheck: passed
- API build: passed

## Manual Browser Verification Matrix

### Public

- Login screen loaded with portal selector.
- Registration screen loaded.
- Admin login screen loaded.

Evidence:
- [docs/screenshots/public/01-login.png](../screenshots/public/01-login.png)
- [docs/screenshots/public/02-register.png](../screenshots/public/02-register.png)
- [docs/screenshots/public/03-admin-login.png](../screenshots/public/03-admin-login.png)

### Customer

- Customer login successful.
- Customer dashboard rendered.
- Customer policies list rendered.

Evidence:
- [docs/screenshots/customer/01-dashboard.png](../screenshots/customer/01-dashboard.png)
- [docs/screenshots/customer/02-policies-list.png](../screenshots/customer/02-policies-list.png)

### Agent

- Agent dashboard rendered.
- Agent quote list rendered.
- Pending filter path rendered with filtered state (`status=PENDING`).
- Agent policies list rendered.
- Agent policy detail rendered.

Evidence:
- [docs/screenshots/agent/01-dashboard.png](../screenshots/agent/01-dashboard.png)
- [docs/screenshots/agent/02-quotes-all.png](../screenshots/agent/02-quotes-all.png)
- [docs/screenshots/agent/03-quotes-filter-pending.png](../screenshots/agent/03-quotes-filter-pending.png)
- [docs/screenshots/agent/05-policies-list.png](../screenshots/agent/05-policies-list.png)
- [docs/screenshots/agent/06-policy-detail.png](../screenshots/agent/06-policy-detail.png)

### Partner

- Partner dashboard rendered.
- Response-time metric displayed as human-readable duration.
- Partner quotes list rendered.
- Partner policies list rendered.
- Partner policy detail rendered via portal-correct endpoint path.

Evidence:
- [docs/screenshots/partner/01-dashboard.png](../screenshots/partner/01-dashboard.png)
- [docs/screenshots/partner/02-quotes-list.png](../screenshots/partner/02-quotes-list.png)
- [docs/screenshots/partner/03-policies-list.png](../screenshots/partner/03-policies-list.png)
- [docs/screenshots/partner/04-policy-detail.png](../screenshots/partner/04-policy-detail.png)

### Admin

- Admin role management rendered and usable.
- Admin audit log rendered.

Evidence:
- [docs/screenshots/admin/01-role-management.png](../screenshots/admin/01-role-management.png)
- [docs/screenshots/admin/02-audit-log.png](../screenshots/admin/02-audit-log.png)

## Regression Fixes Verified

1. Policy detail mismatch regression
- Symptom: role portal list item opened detail page showing Policy not found.
- Verification: Agent and Partner policy detail pages now render policy details.

2. Agent quote filter regression
- Symptom: filter chips looked interactive but did not alter dataset.
- Verification: `status` query param updates list and URL in both manual and E2E flows.

3. Response metric readability issue
- Symptom: raw milliseconds displayed for business KPI.
- Verification: partner dashboard now displays formatted durations (for example, minutes and seconds).

## Test Data Notes

Credentials used during validation:

- customer@insureconnect.local / Password1!
- agent@insureconnect.local / Password1!
- underwriter@insureconnect.local / Password1!
- admin.test@insureconnect.local / Password1!

## Optional Next Validation Steps

1. Add mobile viewport Playwright snapshots for each role.
2. Add E2E coverage for partner policy detail route.
3. Add E2E coverage for admin role add/remove and audit assertion chain.
4. Add CI artifact upload for screenshot snapshots per test run.
