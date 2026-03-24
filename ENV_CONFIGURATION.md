# Environment Variables Configuration Guide

## Overview

This guide explains all environment variables used in the InsureConnect application and how to configure them for different environments (development, staging, production).

## Quick Start

```bash
# For local development
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update values as needed for your local setup
```

## Environment Variables by Category

### Database Configuration

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `DATABASE_URL` | ✅ Yes | None | `postgresql://user:pass@localhost/db` | PostgreSQL connection string with schema |

**Format Breakdown:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public&sslmode=require
```

- `user`: PostgreSQL username
- `password`: PostgreSQL password  
- `host`: Database hostname or IP
- `port`: PostgreSQL port (default 5432)
- `database`: Database name
- `schema`: Prisma schema (use `public`)
- `sslmode`: For production, always use `require`

**Examples:**
- Development: `postgresql://postgres:postgres@localhost:5432/insureconnect_dev?schema=public`
- Production: `postgresql://user:secure-pwd@prod-db.rds.amazonaws.com:5432/insureconnect?schema=public&sslmode=require`

### Redis / Queue Configuration

Redis is required for the Bull job queue system. Configure via individual parameters OR connection URL.

**Option 1: Individual Parameters (Recommended)**

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `REDIS_HOST` | ✅ Yes | `localhost` | `localhost` or `redis.example.com` |
| `REDIS_PORT` | ✅ Yes | `6379` | `6379` |
| `REDIS_PASSWORD` | ❌ No | Empty | `your-redis-password` |
| `REDIS_DB` | ✅ Yes | `0` | `0` (0-15) |

**Option 2: Connection URL**

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `REDIS_URL` | ✅ (if no params) | None | `redis://localhost:6379` |

URL format: `redis://[:password@]host:port/db`

**Examples:**
- Development: `redis://localhost:6379/0`
- AWS ElastiCache: `redis://:auth-token@insureconnect.xxxxx.ng.0001.use1.cache.amazonaws.com:6379`

### Server Configuration

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `PORT` | ❌ No | `4000` | `4000` | API server port |
| `NODE_ENV` | ✅ Yes | `development` | `development`, `staging`, `production` | Affects logging, security settings |
| `LOG_LEVEL` | ❌ No | `debug` | `error`, `warn`, `log`, `debug`, `verbose` | NestJS logger level |

### Authentication & Security

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `JWT_SECRET` | ✅ Yes | None | *(32+ char string)* | Access token signing secret; **MUST be secure in production** |
| `JWT_REFRESH_SECRET` | ✅ Yes | None | *(32+ char string)* | Refresh token signing secret; **Must differ from JWT_SECRET** |

**Generating Secure Secrets:**

```bash
# Generate a 48-char secure secret
openssl rand -base64 48

# Store in secrets manager (AWS Secrets Manager, Vault, etc.)
# Never commit secrets to git
```

**Security Guidelines:**
- ✅ Minimum 32 characters
- ✅ Use different secrets for JWT and refresh tokens
- ✅ Rotate periodically (at least annually)
- ✅ Store in secure secrets manager
- ❌ Never hardcode in application code
- ❌ Never commit to version control
- ❌ Never log or expose in error messages

### CORS Configuration

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `CORS_ORIGIN` | ❌ No | `http://localhost:3000` | `https://yourdomain.com` | Allowed origin for API requests |

**Examples:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`
- Multiple origins: *(configure in NestJS if needed)* Contact DevOps

### API & Application URLs

These URLs tell your application how to connect to services.

| Variable | Scope | Example | Used By | Notes |
|----------|-------|---------|---------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Public | `http://localhost:4000` | Browser | Public API URL for client-side requests |
| `INTERNAL_API_BASE_URL` | Private | `http://api:4000` | Server | Internal API URL for server-to-server |
| `NEXT_PUBLIC_APP_URL` | Public | `http://localhost:3000` | Browser | Public application URL |

**Key Differences:**

- **NEXT_PUBLIC_API_BASE_URL**: Used in browser; must be publicly accessible
  - Development: `http://localhost:4000`
  - Docker: `http://localhost/api` (through nginx)
  - Production: `https://api.yourdomain.com`

- **INTERNAL_API_BASE_URL**: Used only by Next.js server; can be internal network address
  - Development: `http://localhost:4000`
  - Docker: `http://api:4000` (internal network)
  - Production: `http://insureconnect-api:4000` (internal)

- **NEXT_PUBLIC_APP_URL**: Application base URL
  - Development: `http://localhost:3000`
  - Docker: `http://localhost`
  - Production: `https://yourdomain.com`

**Important:** All production URLs must use HTTPS.

### Next.js Specific

| Variable | Required | Default | Example | Notes |
|----------|----------|---------|---------|-------|
| `NEXT_TELEMETRY_DISABLED` | ❌ No | `0` | `1` | Set to `1` to disable telemetry |

## Environment Profiles

### 1. Development (.env)

Used for local development with `npm run dev`

**Characteristics:**
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- Localhost URLs
- Test/dummy credentials acceptable
- Optional secrets can be simple

**Setup:**
```bash
cp .env.example .env
# Edit .env with localhost URLs and test credentials
```

### 2. Staging (.env.staging.example)

Pre-production environment for testing

**Characteristics:**
- `NODE_ENV=production`
- `LOG_LEVEL=log`
- Staging domain URLs (staging.yourdomain.com)
- Strong secrets (different from production)
- Real-like infrastructure
- Non-sensitive test data

**Setup:**
```bash
# Copy from staging example
cp .env.staging.example .env.staging
# Update with staging infrastructure details
```

### 3. Production (.env.production.example)

Live production environment

**Characteristics:**
- `NODE_ENV=production`
- `LOG_LEVEL=error`
- Production domain URLs (yourdomain.com)
- Very strong secrets from secrets manager
- Managed database & Redis
- All HTTPS
- Encrypted secrets

**Setup:**
```bash
# Never copy example file directly!
# Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
# Example for AWS:
aws secretsmanager create-secret --name insureconnect/prod
```

## Environment-Specific Examples

### Local Development

```env
NODE_ENV=development
LOG_LEVEL=debug
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insureconnect_dev?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

JWT_SECRET=dev-secret-32-chars-minimum-length-required
JWT_REFRESH_SECRET=dev-refresh-32-chars-minimum-length-required

CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
INTERNAL_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1
```

### Docker Compose Development

```env
NODE_ENV=production
LOG_LEVEL=log
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/insureconnect?schema=public
REDIS_URL=redis://redis:6379

JWT_SECRET=dev-docker-secret-32-chars
JWT_REFRESH_SECRET=dev-docker-refresh-32-chars

CORS_ORIGIN=http://localhost
NEXT_PUBLIC_API_BASE_URL=http://localhost/api
INTERNAL_API_BASE_URL=http://nginx
NEXT_PUBLIC_APP_URL=http://localhost
```

### Production (AWS)

```env
NODE_ENV=production
LOG_LEVEL=error
PORT=4000

DATABASE_URL=postgresql://user:${DB_PASSWORD}@prod-db.rds.amazonaws.com:5432/insureconnect?schema=public&sslmode=require
REDIS_HOST=prod-redis.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
INTERNAL_API_BASE_URL=http://insureconnect-api:4000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Deployment Guides

### Docker Compose

Files reference environment variables:
- `infra/docker-compose.yml` - Development setup
- `infra/docker-compose.prod.yml` - Production with 3 API replicas

Set environment variables:
```bash
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...
export JWT_SECRET=...
docker-compose -f infra/docker-compose.prod.yml up
```

### AWS Deployment

Use AWS Secrets Manager:
```bash
# Create secret
aws secretsmanager create-secret \
  --name insureconnect/production \
  --secret-string '{
    "DATABASE_URL": "...",
    "REDIS_URL": "...",
    "JWT_SECRET": "..."
  }'

# Reference in ECS/Lambda task definition
```

### Kubernetes

Use ConfigMaps and Secrets:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: insureconnect-config
data:
  NODE_ENV: production
  LOG_LEVEL: error
  CORS_ORIGIN: https://yourdomain.com
---
apiVersion: v1
kind: Secret
metadata:
  name: insureconnect-secrets
type: Opaque
stringData:
  JWT_SECRET: "..."
  JWT_REFRESH_SECRET: "..."
```

## Troubleshooting

### Database Connection Issues

- ✓ Verify `DATABASE_URL` format is correct
- ✓ Check PostgreSQL is running
- ✓ Verify credentials (user:password)
- ✓ Check network connectivity to database host
- ✓ For production, ensure `sslmode=require`

**Debug:**
```bash
psql "$DATABASE_URL"
```

### Redis Connection Issues

- ✓ Verify `REDIS_HOST` and `REDIS_PORT`
- ✓ Check Redis is running
- ✓ Verify password if `REDIS_PASSWORD` is set
- ✓ Check network connectivity

**Debug:**
```bash
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

### JWT Token Errors

- ✓ Verify `JWT_SECRET` matches on API and Web servers
- ✓ Ensure secrets are strong (32+ chars)
- ✓ Check for accidentally swapped secrets
- ✓ Verify NODE_ENV consistency

### CORS Errors

- ✓ Verify `CORS_ORIGIN` matches your frontend URL
- ✓ Include protocol (http:// or https://)
- ✓ No trailing slash
- ✓ Production requires https://

## Security Checklist

- [ ] All secrets use 32+ characters
- [ ] JWT secret differs from refresh secret
- [ ] Production URLs use HTTPS
- [ ] Secrets stored in secrets manager (not .env)
- [ ] .env files in .gitignore
- [ ] No secrets in logs
- [ ] Database uses SSL in production
- [ ] Regular secret rotation schedule
- [ ] Access controls on secrets manager
- [ ] Audit logging of secret access

## Additional Resources

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Redis Client Configuration](https://redis.io/docs/clients/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Support

For environment configuration issues:
1. Check this guide for your environment type
2. Review example files (.env.example, .env.staging.example, etc.)
3. See DEVELOPMENT_CHECKLIST.md for local setup
4. Contact your DevOps team for deployment questions
