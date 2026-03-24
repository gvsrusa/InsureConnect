# Quick Start Checklist

## Before You Start
- [ ] Docker Desktop installed and running
- [ ] Repository cloned: `git clone ...`
- [ ] Dependencies installed: `npm install`
- [ ] Environment file exists: `.env` in root
- [ ] All validations pass: `npm run typecheck && npm run lint && npm run build`

## Database Setup
- [ ] PostgreSQL container running: `docker compose -f infra/docker-compose.yml ps | grep postgres`
- [ ] Redis container running: `docker compose -f infra/docker-compose.yml ps | grep redis`
- [ ] Seed data loaded: `npm run prisma:seed`
- [ ] Verified in database:
  ```bash
  docker compose -f infra/docker-compose.yml exec postgres psql -U postgres -d insureconnect -c "SELECT COUNT(*) FROM \"User\";"
  ```

## Services Health Check
- [ ] All 5 services running: `docker compose -f infra/docker-compose.yml ps`
- [ ] Nginx (port 80): http://localhost
- [ ] Next.js (port 3000): http://localhost:3000
- [ ] NestJS API (port 4000, behind Nginx): http://localhost/api
- [ ] PostgreSQL (port 5432): `docker compose -f infra/docker-compose.yml exec postgres pg_isready`
- [ ] Redis (port 6379): `docker compose -f infra/docker-compose.yml exec redis redis-cli ping`

## Authentication Flow
- [ ] Register new user: http://localhost/register
- [ ] Verify JWT cookie: DevTools → Application → Cookies → `access_token`
- [ ] Login with seeded agent: agent@insureconnect.local / TestPassword123!
- [ ] Logout: Verify cookie deleted and redirected to /login

## Portal (Customer) Tests
- [ ] Dashboard loads: http://localhost/dashboard
- [ ] API responds: `curl -H "Authorization: Bearer..." http://localhost/api/v1/portal/dashboard | jq`
- [ ] Policies list: http://localhost/policies
- [ ] Policy detail: http://localhost/policies/{id}
- [ ] Agent card displays on dashboard

## Agent Console Tests
- [ ] Login as agent: agent@insureconnect.local
- [ ] Dashboard loads: http://localhost/agent/dashboard
- [ ] Quote requests list: http://localhost/agent/quotes
- [ ] Quote detail: http://localhost/agent/quotes/{id}
- [ ] Policies list: http://localhost/agent/policies
- [ ] Actions work: recommend & requote buttons

## Partner Dashboard Tests
- [ ] Analytics dashboard: http://localhost/partner/dashboard
- [ ] Quote traffic view: http://localhost/partner/quotes
- [ ] Policies view: http://localhost/partner/policies
- [ ] Partner stats display correctly

## Performance & Data Validation
- [ ] Dashboard loads in < 500ms
- [ ] No N+1 query issues in logs
- [ ] Response data matches TypeScript types
- [ ] Date formatting is ISO 8601
- [ ] Currency values are integers (cents)

## Code Quality
- [ ] No console errors (DevTools)
- [ ] No console warnings (check for mock fallback messages)
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No lint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`

## Debugging Checklist
- [ ] API responding to health check: `http://localhost/api/healthz` (if available)
- [ ] Database connection: `docker compose -f infra/docker-compose.yml logs api-1 | grep -i "database\|prisma\|error"`
- [ ] JWT validation: Check token format in browser console
- [ ] CORS issues: Check browser DevTools Network tab
- [ ] Mock fallback: Search console for "unavailable"

## Final Verification
- [ ] All three user roles tested (if applicable)
- [ ] All dashboard pages load without errors
- [ ] API data flows through to UI correctly
- [ ] Authentication persists across page reloads
- [ ] Logout clears all session data
- [ ] No dead links or 404s in navigation
- [ ] Responsive design works on mobile (DevTools device emulation)

## Cleanup
- [ ] Stop stack: `npm run compose:down`
- [ ] Remove dangling volumes: `docker volume prune`
- [ ] Clean logs: All errors documented for fixes

---

# Frontend Debugging Quick Tips

## Console Warnings to Watch For
```
"Dashboard API unavailable, using mock data"        → API endpoint not responding
"@typescript-eslint/no-unused-vars"                  → Dead code
"Invalid hook call"                                   → Component used incorrectly
"Warning: useLayoutEffect does nothing on server"   → Server component issue
```

## Browser DevTools Workflow

1. **Check Authentication**
   - Application → Cookies → `access_token`
   - Paste value at jwt.io to decode and verify payload

2. **Monitor API Calls**
   - Network tab → Filter by "fetch"
   - Look for `/api/v1/*` requests
   - Check status codes (200 = success, 401 = auth, 404 = missing)

3. **Inspect Response Data**
   - Response tab → Check JSON structure
   - Compare against TypeScript types in lib/types.ts

4. **Watch for Redirects**
   - /login → /register (if not authenticated)
   - /dashboard → /login (valid redirect on logout)

---

# Backend Debugging Quick Tips

## Docker Logs
```bash
# All services
docker compose -f infra/docker-compose.yml logs

# Specific service (follow mode)
docker compose -f infra/docker-compose.yml logs -f api-1

# Last 50 lines
docker compose -f infra/docker-compose.yml logs --tail=50

# Since specific time
docker compose -f infra/docker-compose.yml logs --since="2 minutes ago"
```

## Database Debugging
```bash
# Connect to database
docker compose -f infra/docker-compose.yml exec postgres psql -U postgres -d insureconnect

# After connecting, try queries:
SELECT * FROM "User";
SELECT * FROM "QuoteRequest" LIMIT 5;
SELECT * FROM "Policy" WHERE status = 'ACTIVE';
SELECT * FROM "AgentAssignment" LIMIT 5;

# Check schema
\dt  # List tables
\d "QuoteRequest"  # Describe table
```

## API Endpoint Testing
```bash
# Health check (if available)
curl http://localhost/api/healthz

# Get JWT token
RESPONSE=$(curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@insureconnect.local","password":"TestPassword123!"}')
TOKEN=$(echo $RESPONSE | jq -r '.accessToken')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/v1/agent/dashboard | jq

# Test with verbose output
curl -v -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/v1/agent/dashboard
```

## Common Database Issues
```bash
# Reset database (WARNING: Deletes all data)
docker compose -f infra/docker-compose.yml exec api-1 npx prisma migrate reset

# Re-seed after reset
npm run prisma:seed

# Check if migrations are up to date
docker compose -f infra/docker-compose.yml exec api-1 npx prisma migrate status
```

---

# Performance Profiling

## API Response Times
```bash
# Measure dashboard endpoint
time curl -H "Authorization: Bearer $TOKEN" http://localhost/api/v1/agent/dashboard

# Expected: < 200ms
```

## Database Query Performance
```sql
-- Check slow queries (in PostgreSQL)
-- Enable query logging or use pg_stat_statements extension
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

## Bundle Size
```bash
# Next.js build already shows size breakdown
# Look for output after: npm run build

# ✓ Generating static pages (23/23)
# Should show: First Load JS around 106 kB
```

---

# Integration Testing Commands

```bash
# Full stack health check
npm run compose:up && \
  sleep 2 && \
  npm run prisma:seed && \
  curl -H "Authorization: Bearer..." http://localhost/api/v1/portal/dashboard

# Run all validations
npm run typecheck && npm run lint && npm run build

# Tear down
npm run compose:down
```
