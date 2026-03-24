# Architecture

## Monorepo Layout

- apps/api: NestJS backend service for insurance workflows.
- apps/web: Next.js app router frontend.
- packages/shared: Shared TypeScript contracts between backend and frontend.
- prisma: Database schema and seeding scripts.
- infra: Infrastructure and deployment assets.

## Domain Boundaries

- Auth and user management
- Partner management
- Quote ingestion and scoring
- Policy lifecycle events
- Agent assignment and workflow orchestration

## Next Steps

- Add module-level NestJS implementations in each placeholder folder.
- Add queue/event transport for asynchronous quote processing.
- Introduce CI workflows for lint, typecheck, tests, and Prisma migrations.