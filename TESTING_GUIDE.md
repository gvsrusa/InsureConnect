# InsureConnect Integration Testing Guide

## Prerequisites

### 1. Start Docker Daemon (macOS)
```bash
# Open Docker Desktop or use:
open -a Docker

# Verify Docker is running:
docker ps
```

### 2. Ensure Environment File
```bash
# .env should exist in project root
# Contains:
NODE_ENV=production
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost
```

---

## Quick Start

```bash
# 1. Bring up the full stack
npm run compose:up

# 2. Seed the database with test data
npm run prisma:seed

# 3. Access the application
# Frontend:  http://localhost
# API:       http://localhost/api
```

Wait 30 seconds for all services to be healthy. Check status:
```bash
docker compose -f infra/docker-compose.yml ps
```

All services should show `healthy` or `running`.

---

## Testing Workflow

### Phase 1: Authentication

#### 1.1 Register a New User
```bash
# Navigate to http://localhost/register
# Fill form:
#   Name: John Doe
#   Email: customer@example.local
#   Password: TestPassword123!

# Expected: Redirected to /dashboard with auth cookie set
```

**Verify:**
- Check browser DevTools → Application → Cookies
- `access_token` cookie should be present
- Value should be a JWT token (starts with `eyJ...`)

#### 1.2 Login
```bash
# Navigate to http://localhost/login
# Use credentials:
#   Email: agent@insureconnect.local (seeded)
#   Password: TestPassword123!

# Expected: Redirected to /dashboard with auth cookie set
```

#### 1.3 Logout
```bash
# Click logout button on any page
# Expected: Redirected to /login
# Verify: access_token cookie is deleted
```

---

### Phase 2: Portal (Customer) Dashboard

#### 2.1 Dashboard Summary
```
GET http://localhost/api/v1/portal/dashboard
Header: Authorization: Bearer {access_token}

Expected Response:
{
  "activePolicies": 0,
  "pendingQuotes": 1,
  "annualPremium": 45000,
  "recentPolicies": []
}
```

**UI Check:**
- Navigate to http://localhost/dashboard (if logged in as customer on master)
- Verify stats cards display (may show 0s or mock data if not created)
- No console errors

#### 2.2 Policy List
```
GET http://localhost/api/v1/portal/policies
Header: Authorization: Bearer {access_token}

Expected Response: Array of policies
[
  {
    "id": "...",
    "carrierName": "State Farm",
    "policyNumber": "SF-123456",
    "status": "ACTIVE",
    "effectiveDate": "2025-01-01T00:00:00.000Z",
    "premium": 1500,
    "coverageType": "General Liability",
    "clientName": "Harbor Cafe Group"
  }
]
```

**UI Check:**
- Navigate to http://localhost/policies
- Verify policies display or mock fallback shows
- Click policy card
- Navigate to individual policy view (/policies/[id])

#### 2.3 Policy Detail
```
GET http://localhost/api/v1/portal/policies/{policyId}
Header: Authorization: Bearer {access_token}

Expected: Single policy object (same schema as above)
```

#### 2.4 Available Agent
```
GET http://localhost/api/v1/portal/agent
Header: Authorization: Bearer {access_token}

Expected Response:
{
  "id": "...",
  "name": "Alex Agent",
  "email": "agent@insureconnect.local",
  "phone": "(512) 555-0143",
  "bio": "Licensed advisor...",
  "rating": 4.9,
  "policiesManaged": 1,
  "isOnline": true
}
```

**UI Check:**
- Dashboard should display agent card
- Click to verify agent details load

#### 2.5 Quote Request
```
GET http://localhost/api/v1/portal/quotes/{quoteRequestId}
Header: Authorization: Bearer {access_token}

Expected Response:
{
  "id": "...",
  "status": "PENDING",
  "productType": "AUTO",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "clientEmail": "customer@example.local",
  "quotes": [
    {
      "id": "...",
      "carrierName": "Geico",
      "monthlyPremium": 125,
      "annualPremium": 1500,
      "coverageSummary": {},
      "expiresAt": "2025-01-22T10:30:00.000Z"
    }
  ]
}
```

---

### Phase 3: Agent Dashboard

#### 3.1 Switch to Agent Role
```bash
# Login as:
#   Email: agent@insureconnect.local
#   Password: TestPassword123!
```

#### 3.2 Agent Dashboard Summary
```
GET http://localhost/api/v1/agent/dashboard
Header: Authorization: Bearer {access_token}

Expected Response:
{
  "assignedQuotes": 1,
  "boundThisMonth": 0,
  "activePolicies": 0,
  "conversionRate": 0.0,
  "recentQuoteRequests": [
    {
      "id": "...",
      "status": "PENDING",
      "productType": "AUTO",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "quotes": [...]
    }
  ]
}
```

**UI Check:**
- Navigate to http://localhost/agent/dashboard
- Verify stats display (Assigned Quotes, Bound This Month, etc.)
- Verify recent quote requests section

#### 3.3 Quote Requests List
```
GET http://localhost/api/v1/agent/quote-requests
Header: Authorization: Bearer {access_token}

Expected: Array of quote requests assigned to agent
```

**UI Check:**
- Navigate to http://localhost/agent/quotes
- Verify quotes grouped by status (PENDING, COMPLETED, EXPIRED, FAILED)
- Click individual quote to navigate to detail

#### 3.4 Quote Request Detail
```
GET http://localhost/api/v1/agent/quote-requests/{id}
Header: Authorization: Bearer {access_token}

Expected: Single quote request with quotes and agent filtering applied
```

**UI Check:**
- Navigate to http://localhost/agent/quotes/[id]
- Verify quote cards display in order (lowest premium first)
- "Best price" tag on first quote
- Quotes show monthly/annual premium and coverage tags

#### 3.5 Agent Policies List
```
GET http://localhost/api/v1/agent/policies
Header: Authorization: Bearer {access_token}

Expected: Array of policies
```

**UI Check:**
- Navigate to http://localhost/agent/policies
- Verify policy cards display
- Policies grouped into Active/Cancelled sections

#### 3.6 Recommend Quote (Action)
```
POST http://localhost/api/v1/agent/quote-requests/{id}/recommend
Header: Authorization: Bearer {access_token}
Body: { "quoteId": "..." }

Expected Response: { "ok": true }
```

**Verify:**
- Quote request status changes to "IN_REVIEW"
- Check database: `SELECT status FROM "QuoteRequest" WHERE id = '...';`

#### 3.7 Requote (Action)
```
POST http://localhost/api/v1/agent/quote-requests/{id}/requote
Header: Authorization: Bearer {access_token}

Expected Response: { "ok": true }
```

**Verify:**
- Quote request status changes to "IN_REVIEW"

---

### Phase 4: Partner Dashboard

#### 4.1 Switch to Partner Role
```bash
# Create partner user or use admin token for partner API
# Navigate as:
#   Email: partner@insureconnect.local
#   Password: TestPassword123!
```

**Note:** Partner API uses API-key auth primarily. To test via web:
1. Partner user logs in
2. API calls use bearer token with admin/partner role

#### 4.2 Analytics/Dashboard
```
GET http://localhost/api/v1/admin/analytics
Header: Authorization: Bearer {access_token}

Expected Response:
{
  "totalRequests": 1,
  "successRate": 0.0,
  "boundPolicies": 0,
  "apiCallsToday": 0,
  "avgResponseMs": 180
}
```

**UI Check:**
- Navigate to http://localhost/partner/dashboard
- Verify stats display (Total Requests, Success Rate, etc.)

#### 4.3 Quote Requests (Partner View)
```
GET http://localhost/api/v1/admin/quote-requests
Header: Authorization: Bearer {access_token}

Expected: Array of all quote requests in system
```

**UI Check:**
- Navigate to http://localhost/partner/quotes
- Verify quote request cards display
- Each card shows business name, email, quote count, best premium

#### 4.4 Policies (Partner View)
```
GET http://localhost/api/v1/admin/policies
Header: Authorization: Bearer {access_token}

Expected: Array of all policies in system
```

**UI Check:**
- Navigate to http://localhost/partner/policies
- Verify policies grouped into Active/Inactive sections

#### 4.5 Partners List
```
GET http://localhost/api/v1/admin/partners
Header: Authorization: Bearer {access_token}

Expected Response:
[
  {
    "id": "...",
    "name": "Oakline Partners",
    "slug": "oakline-partners",
    "apiKeyPrefix": "seed-oak",
    "rateLimitPerMinute": 1000,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

## Test Data Reference

### Seeded Users
```
Agent:
  Email: agent@insureconnect.local
  Role: AGENT
  Name: Alex Agent

(Customer user must be created via registration)
```

### Seeded Quote Request
```
External Ref: QR-0001
Partner: Oakline Partners
Requester: agent@insureconnect.local
Business Name: Harbor Cafe Group
Coverage Type: General Liability
State: TX
Annual Revenue: $3,200,000
Status: IN_REVIEW
```

### API Key
```
Partner: Oakline Partners
Raw Key: seed-oakline-partner-api-key
API Prefix: seed-oak
```

---

## Troubleshooting

### Docker Services Not Healthy

```bash
# Check logs
docker compose -f infra/docker-compose.yml logs

# Specific service
docker compose -f infra/docker-compose.yml logs postgres
docker compose -f infra/docker-compose.yml logs redis
docker compose -f infra/docker-compose.yml logs api-1

# Restart services
npm run compose:down
npm run compose:up
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker compose -f infra/docker-compose.yml exec postgres pg_isready

# Check Prisma migrations
docker compose -f infra/docker-compose.yml exec api-1 npx prisma migrate status

# Run migrations manually
docker compose -f infra/docker-compose.yml exec api-1 npx prisma migrate deploy
```

### Auth Token Issues

```bash
# Check JWT secret in .env
cat .env | grep JWT_SECRET

# Verify cookie is set (browser DevTools)
# Cookie name: access_token
# Should be HttpOnly, Secure (in production)

# Test token manually
curl -H "Authorization: Bearer {token}" http://localhost/api/v1/portal/dashboard
```

### Mock Fallback vs Real Data

**Pages show mock data when:**
- API endpoint returns 404 (not implemented)
- API endpoint returns 500 (server error)
- Network request times out

**Check browser console for warnings:**
```
"Dashboard API unavailable, using mock data: ..."
```

**Fix:**
1. Verify API service is running: `docker compose -f infra/docker-compose.yml ps`
2. Check API logs: `docker compose -f infra/docker-compose.yml logs api-1 | tail -50`
3. Verify database has seed data: `npx prisma db push && npm run prisma:seed`

---

## Performance Checks

### Response Times
- Dashboard endpoints: < 200ms
- List endpoints: < 500ms
- Detail endpoints: < 300ms

```bash
# Test with curl
time curl -H "Authorization: Bearer {token}" http://localhost/api/v1/agent/dashboard
```

### Bundle Size
```bash
# Check Next.js build output (already run)
# Web built 23 pages successfully
# Should see: "First Load JS" around 106 kB
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Login again, check cookie |
| 404 Not Found | Endpoint not implemented | Use mock fallback or file issue |
| 500 Internal Server Error | API crashed or DB error | Check logs, restart services |
| CORS Error | Wrong origin header | Verify CORS_ORIGIN in .env |
| Slow responses | N+1 queries or missing indexes | Check Prisma query optimization |
| Mock data shows | API endpoint not responding | Verify /healthz endpoint |

---

## Success Criteria

✅ All three user roles can log in
✅ Dashboard pages load real data (or display mock gracefully)
✅ Navigation between pages works without errors
✅ API responses have correct data shape
✅ Auth tokens persist across page reloads
✅ Logout clears session
✅ Role-based access controls work (agent sees own quotes, admin sees all)
✅ No console errors or warnings
✅ Build/typecheck/lint all pass

---

## Next Actions

1. **Start Docker**: `npm run compose:up`
2. **Verify Health**: `docker compose -f infra/docker-compose.yml ps`
3. **Seed Data**: `npm run prisma:seed`
4. **Run Tests**: Follow this guide section by section
5. **Document Findings**: Note any failures or unexpected behavior
6. **Fix & Iterate**: Address any issues found during testing

---

## API Endpoint Reference

### Portal Endpoints
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/portal/dashboard` | Bearer | Any | Dashboard summary |
| GET | `/api/v1/portal/policies` | Bearer | Any | List policies |
| GET | `/api/v1/portal/policies/:id` | Bearer | Any | Get policy detail |
| GET | `/api/v1/portal/agent` | Bearer | Any | Get available agent |
| GET | `/api/v1/portal/quotes/:id` | Bearer | Any | Get quote request detail |

### Agent Endpoints
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/agent/dashboard` | Bearer | AGENT/ADMIN | Dashboard summary |
| GET | `/api/v1/agent/quote-requests` | Bearer | AGENT/ADMIN | List quote requests |
| GET | `/api/v1/agent/quote-requests/:id` | Bearer | AGENT/ADMIN | Get quote detail |
| GET | `/api/v1/agent/policies` | Bearer | AGENT/ADMIN | List policies |
| POST | `/api/v1/agent/quote-requests/:id/recommend` | Bearer | AGENT/ADMIN | Recommend quote |
| POST | `/api/v1/agent/quote-requests/:id/requote` | Bearer | AGENT/ADMIN | Request new quotes |

### Admin Endpoints
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/v1/admin/analytics` | Bearer | ADMIN | Analytics dashboard |
| GET | `/api/v1/admin/partners` | Bearer | ADMIN | List partners |
| POST | `/api/v1/admin/partners` | Bearer | ADMIN | Create partner |
| POST | `/api/v1/admin/partners/:id/rotate-key` | Bearer | ADMIN | Rotate API key |
| GET | `/api/v1/admin/quote-requests` | Bearer | ADMIN | List all quote requests |
| GET | `/api/v1/admin/policies` | Bearer | ADMIN | List all policies |

---

## File Reference

**Backend Controllers:**
- [PortalController](apps/api/src/modules/policies/portal.controller.ts)
- [AgentController](apps/api/src/modules/agents/agent.controller.ts)
- [AdminController](apps/api/src/modules/partners/admin.controller.ts)

**Frontend Pages:**
- [Portal Dashboard](apps/web/app/(customer)/dashboard/page.tsx)
- [Agent Dashboard](apps/web/app/agent/dashboard/page.tsx)
- [Agent Quotes](apps/web/app/agent/quotes/page.tsx)
- [Agent Quote Detail](apps/web/app/agent/quotes/[id]/page.tsx)
- [Agent Policies](apps/web/app/agent/policies/page.tsx)
- [Partner Dashboard](apps/web/app/partner/dashboard/page.tsx)
- [Partner Quotes](apps/web/app/partner/quotes/page.tsx)
- [Partner Policies](apps/web/app/partner/policies/page.tsx)

**API Client:**
- [lib/api.ts](apps/web/lib/api.ts) - All API namespaces (portalApi, agentApi, partnerApi)

**Test Data:**
- [prisma/seed.ts](prisma/seed.ts) - Seed script
