# LinkedIn Post Draft

I recently built a full-stack insurance workflow platform called InsureConnect to push beyond my frontend comfort zone and prove I can ship end-to-end product features.

What I built:

- Multi-portal experiences for Customer, Agent, Partner, and Admin roles
- Role-aware authentication and session behavior
- Policy and quote workflows across portals
- Admin role management and audit timeline
- Regression fixes with Playwright end-to-end coverage

A few concrete engineering wins:

- Fixed a portal policy-detail mismatch that caused valid list items to open as not found
- Turned quote filter chips from display-only into URL-backed working filters
- Improved KPI readability by formatting raw response milliseconds into business-friendly durations

Tech stack:

- Next.js + React + Tailwind
- NestJS + Prisma + PostgreSQL + Redis
- Docker Compose + nginx
- Playwright E2E

I put together a complete walkthrough with screenshots, architecture context, and testing evidence so anyone can understand the product quickly:

- Showcase hub: [docs/showcase/README.md](./README.md)
- Screenshot catalog: [docs/showcase/screenshot-catalog.md](./screenshot-catalog.md)
- Testing evidence: [docs/showcase/testing-report.md](./testing-report.md)

This project reflects what I am focused on now: shipping reliable, testable product features across frontend and backend boundaries.

#react #nextjs #nestjs #typescript #fullstack #softwareengineering #insurtech
