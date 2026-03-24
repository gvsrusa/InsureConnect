#!/bin/sh
set -e

echo "[entrypoint] Running Prisma DB push..."
node_modules/.bin/prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss

echo "[entrypoint] Starting API..."
exec node apps/api/dist/main.js
