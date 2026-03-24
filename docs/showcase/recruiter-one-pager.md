# InsureConnect Recruiter One Pager

## Candidate Intent

I built InsureConnect to prove I can deliver full-stack outcomes, not only frontend UI. The project demonstrates that I can:

- Implement role-based product experiences in React/Next.js.
- Integrate and extend backend APIs in NestJS/Prisma.
- Diagnose production-like bugs and ship verified fixes.
- Add automated regression tests and validate behavior in-browser.

## Product Summary

InsureConnect is a role-based insurance workflow platform with separate portal experiences for customers, agents, partners, and admins.

## Full-Stack Outcomes Delivered

1. Authentication and portal-aware session handling
- Implemented role-aware login/logout behavior and account menu identity context.

2. Policy detail routing reliability
- Fixed portal list/detail endpoint mismatch that caused policy detail failures.

3. Functional filtering behavior
- Converted display-only quote filters into URL-backed functional filters.

4. Business-friendly metrics
- Replaced raw millisecond rendering with readable duration formatting.

5. Operational administration
- Added and validated admin role management and audit visibility.

6. Testing and quality
- Added Playwright regression coverage and revalidated key flows in browser.

## Engineering Evidence

- Product walkthrough and screenshots: [docs/showcase/screenshot-catalog.md](./screenshot-catalog.md)
- Testing evidence: [docs/showcase/testing-report.md](./testing-report.md)
- Source repository root: [README.md](../../README.md)

## Why This Matters For Insurance Engineering

Insurance products require careful role separation, operational correctness, and transparent auditability. This project directly demonstrates those capabilities with real implementation details across frontend and backend boundaries.

## Suggested Interview Discussion Topics

1. How I traced and fixed a portal detail mismatch bug from root cause to regression test.
2. How I balanced UX improvements with backend consistency.
3. How I validated changes using both automated and manual browser testing.
4. How I would scale this architecture with stronger CI/CD and observability.
