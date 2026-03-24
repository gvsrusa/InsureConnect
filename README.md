# InsureConnect

InsureConnect is a Turbo monorepo with a NestJS API, a Next.js web app, shared TypeScript packages, and Prisma for the PostgreSQL data model.

## Architecture Overview

- `apps/api`: NestJS backend, listening on port `4000` inside the stack.
- `apps/web`: Next.js frontend, listening on port `3000` inside the stack.
- `packages/shared`: shared TypeScript types consumed by the API and web app.
- `prisma`: Prisma schema and client generation.
- `infra/nginx/nginx.conf`: entrypoint reverse proxy, routing `/api/*` to the API pool and `/` to the web app.
- `infra/docker-compose.yml`: local full-stack environment.
- `infra/docker-compose.prod.yml`: production-like compose variant with stronger environment parameterization and no host exposure for stateful services.

The request flow in the containerized stack is:

1. Browser traffic enters `nginx` on port `80`.
2. Requests to `/api/*` are load-balanced with `least_conn` across `api-1`, `api-2`, and `api-3`.
3. All other requests are proxied to the `web` service.
4. The API uses `postgres` and `redis` over the internal Compose network.

## Local Prerequisites

- Node.js `22.x`
- npm `11.x`
- Docker Desktop or a compatible Docker Engine with `docker compose`

## Local Development Without Docker

Install dependencies:

```bash
npm ci
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run lint, typecheck, and build:

```bash
npm run lint
npm run typecheck
npm run build
```

## Local Full-Stack With Docker Compose

Bring the stack up:

```bash
npm run compose:up
```

Bring the stack down:

```bash
npm run compose:down
```

The local stack exposes:

- `http://localhost` for nginx and the full application
- `localhost:5432` for PostgreSQL
- `localhost:6379` for Redis

## Production-Like Compose Variant

Start the production-like stack:

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
```

Stop it:

```bash
docker compose -f infra/docker-compose.prod.yml down
```

Recommended environment variables for the production-like variant:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `CORS_ORIGIN`

## Container Notes

- The API image builds the Prisma client during the image build and runs the compiled NestJS output.
- The web image uses a multi-stage build with Next.js standalone output for a smaller runtime image.
- Compose uses the repository root as the Docker build context because the app images depend on shared workspace packages.

## CI

GitHub Actions runs:

- `npm ci`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
