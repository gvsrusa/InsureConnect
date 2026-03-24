# InsureConnect Product Showcase

This document is the single entry point for recruiters, hiring managers, and interviewers to understand the product, architecture, and implementation quality of InsureConnect.

## What This Application Is

InsureConnect is a full-stack insurance workflow platform with role-based experiences for:

- Customers: review coverage, manage policies, and request quotes.
- Agents: manage assigned quote traffic, recommend quotes, and track policies.
- Partner users: monitor API integrations and policy activity.
- Admins: manage user roles and review an audit trail of role changes.

The project demonstrates practical delivery across frontend UX, backend APIs, authentication/session handling, authorization, and test coverage.

## Why This Was Built

This project was built to demonstrate end-to-end engineering capability beyond UI implementation, including backend integration, production-style debugging, and quality validation.

## Tech Stack

- Frontend: Next.js 15 App Router, React 19, Tailwind CSS
- Backend: NestJS, Prisma, PostgreSQL, Redis
- Infra: Docker Compose, nginx reverse proxy
- Testing: Playwright E2E, TypeScript typecheck, API build validation

## Live Feature Walkthrough

Use these documents in order:

1. [Screenshot Catalog](./screenshot-catalog.md)
2. [Testing Evidence Report](./testing-report.md)
3. [Recruiter One Pager](./recruiter-one-pager.md)
4. [LinkedIn Post Draft](./linkedin-post-draft.md)

## Role-Based Functional Coverage

### Public and Access

- Login with portal selector (Customer, Agent, Partner, Admin)
- Registration flow
- Dedicated admin sign-in flow

### Customer Experience

- Dashboard overview
- Policy list and policy detail
- Account/role-aware top navigation and session behavior

### Agent Experience

- Agent dashboard metrics
- Quote request list and quote detail
- Working status filter chips on quote list (`status` URL param)
- Policy list and policy detail (portal-correct endpoint)

### Partner Experience

- Partner dashboard metrics and API overview
- Quote monitoring view
- Policy list and policy detail (portal-correct endpoint)
- Human-readable response-time formatting

### Admin Experience

- Role management by user email
- Role add/remove workflows
- Audit timeline with actor/target/action visibility

## Architecture Snapshot

- Web app: [apps/web](../../apps/web)
- API service: [apps/api](../../apps/api)
- Prisma schema and seed: [prisma](../../prisma)
- Compose stack: [infra/docker-compose.yml](../../infra/docker-compose.yml)
- Base architecture notes: [docs/architecture.md](../architecture.md)

## High-Impact Engineering Fixes Demonstrated

1. Portal-specific policy detail parity
- Root cause: list/detail endpoint mismatch across role portals.
- Fix: aligned frontend route clients and backend detail endpoints so role-specific lists open role-specific details reliably.

2. Agent quote filter behavior
- Root cause: filter chips were display-only and did not affect data shown.
- Fix: URL-backed filtering using `?status=` query params and filtered rendering.

3. Response-time readability
- Root cause: raw milliseconds reduced business readability.
- Fix: duration formatter that converts raw ms to human-readable strings.

## How To Reproduce Locally

```bash
npm ci
npm run compose:up
npm run prisma:seed
```

Open:

- App: http://localhost
- API via nginx path: http://localhost/api

## Key Credentials Used During Validation

- customer@insureconnect.local / Password1!
- agent@insureconnect.local / Password1!
- underwriter@insureconnect.local / Password1!
- admin.test@insureconnect.local / Password1!

## Screenshot Library

All captured evidence is in:

- [docs/screenshots/public](../screenshots/public)
- [docs/screenshots/customer](../screenshots/customer)
- [docs/screenshots/agent](../screenshots/agent)
- [docs/screenshots/partner](../screenshots/partner)
- [docs/screenshots/admin](../screenshots/admin)
- [docs/screenshots/shared](../screenshots/shared)

## Suggested Review Path For Hiring Teams

1. Read [Recruiter One Pager](./recruiter-one-pager.md) first.
2. Skim [Screenshot Catalog](./screenshot-catalog.md) for product breadth.
3. Inspect [Testing Evidence Report](./testing-report.md) for validation rigor.
4. Review the commit history and E2E specs for implementation depth.
