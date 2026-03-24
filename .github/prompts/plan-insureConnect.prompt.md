# Plan: InsureConnect — Insurance API Aggregation Platform

## TL;DR

Build a full-stack B2B insurance API middleware demo (NestJS + Next.js + PostgreSQL + Redis + Nginx) that directly addresses Goosehead Insurance's 2026 strategic priority: scaling enterprise API partnerships. The project aggregates mock carrier quotes, issues policies via API, and routes clients to agents — demonstrating backend depth (the rejection reason) alongside strong React skills. Deploy live on Railway.

---

## Architecture Summary

```
Partner Systems (Mortgage Lenders, Real Estate Platforms)
        │
        ▼  REST API / API Keys
┌─────────────────────────────────┐
│     Nginx (Load Balancer)       │  Rate limiting, reverse proxy
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
NestJS API            Next.js Frontend
(apps/api)            (apps/web)
    │                     │
    ├── PostgreSQL         ├── App Router (SSR + RSC)
    ├── Redis Cache        ├── React Query + Zustand
    └── Bull Queue         └── Tailwind + shadcn/ui
         │
    Carrier Adapters (Mock)
    ├── StateFarmAdapter
    ├── GeicoAdapter
    ├── ProgressiveAdapter
    └── ClearcoverAdapter
```

## Monorepo Structure (Turborepo)

```
insureconnect/
├── turbo.json
├── package.json                    (workspace root)
├── apps/
│   ├── api/                        NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           JWT + API key guards
│   │   │   │   ├── users/          User CRUD + roles
│   │   │   │   ├── partners/       Partner management + API keys
│   │   │   │   ├── quotes/         Quote orchestration + fan-out
│   │   │   │   ├── carriers/       Adapter pattern (one per carrier)
│   │   │   │   ├── policies/       Policy CRUD + state machine
│   │   │   │   ├── agents/         Agent registry + assignment
│   │   │   │   ├── webhooks/       Outbound delivery + retry (Bull)
│   │   │   │   └── analytics/      Basic stats endpoints
│   │   │   ├── common/             Guards, decorators, filters, pipes
│   │   │   └── main.ts
│   │   └── test/
│   └── web/                        Next.js frontend
│       ├── app/
│       │   ├── (public)/           Landing, login
│       │   ├── (customer)/         Client portal
│       │   ├── (agent)/            Agent console
│       │   ├── (partner)/          Partner dashboard
│       │   └── api/                Next.js API routes (BFF proxy)
│       ├── components/
│       │   ├── ui/                 shadcn/ui components (Button, Card, Badge, Avatar, Progress, Tabs, etc.)
│       │   ├── layout/            TopNav, PageShell, StatsRow, TwoColumnLayout
│       │   └── domain/            PolicyCard, QuoteCard, AgentContactCard, LilyChatWidget,
│       │                          AlertBanner, StatCard, DigitalInsuranceCard, StatusBadge,
│       │                          PolicyProgressBar, CarrierIcon
│       └── lib/                    Hooks, utils, API client
├── packages/
│   └── shared/                     Shared TypeScript types + DTOs
├── infra/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── docker-compose.yml          Local dev (3 API instances + PG + Redis + Nginx)
│   └── docker-compose.prod.yml     Production-like
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   └── api-reference.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Data Model (Prisma)

- **User** — id (UUID), name, email, passwordHash, role (CLIENT | AGENT | PARTNER_USER), createdAt, updatedAt
- **Partner** — id, name, apiKey (hashed), apiKeyPrefix (for display), isActive, rateLimitPerMinute, createdAt
- **QuoteRequest** — id, partnerId, clientUserId (nullable), productType (AUTO | HOME), riskData (JSON), status (PENDING | COMPLETED | EXPIRED | FAILED), partnerRefId, createdAt
- **Quote** — id, quoteRequestId, carrierName, monthlyPremium, annualPremium, coverageSummary (JSON), termDetails (JSON), expiresAt, createdAt
- **Policy** — id, clientUserId, quoteId, carrierName, policyNumber, status (ACTIVE | CANCELLED | EXPIRED), effectiveDate, expirationDate, premium, createdAt
- **PolicyEvent** — id, policyId, eventType, payload (JSON), createdAt (audit log)
- **AgentAssignment** — id, agentUserId, quoteRequestId (nullable), policyId (nullable), assignedAt

## API Design

### Partner API (B2B, API key auth via `x-api-key` header)
- `POST /api/v1/partner/quotes` — Submit quote request, get aggregated carrier quotes
- `POST /api/v1/partner/policies/bind` — Bind a policy from a quote
- `GET /api/v1/partner/quotes/:id` — Check quote status
- `GET /api/v1/partner/policies` — List policies created via this partner

### Customer API (JWT auth)
- `GET /api/v1/portal/dashboard` — Dashboard summary
- `GET /api/v1/portal/policies` — List policies
- `GET /api/v1/portal/policies/:id` — Policy detail
- `POST /api/v1/portal/policies/bind` — Bind from quote link
- `GET /api/v1/portal/agent` — Assigned agent info
- `GET /api/v1/portal/quotes/:quoteRequestId` — View quotes from a link

### Auth API
- `POST /api/v1/auth/register` — Register (client/agent)
- `POST /api/v1/auth/login` — Login → access_token + refresh_token (httpOnly cookie)
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Revoke refresh token

### Agent API (JWT auth, agent role)
- `GET /api/v1/agent/quote-requests` — List all quote requests with filters
- `GET /api/v1/agent/quote-requests/:id` — Detail with all carrier quotes
- `POST /api/v1/agent/quote-requests/:id/requote` — Trigger re-quote
- `GET /api/v1/agent/policies` — All policies
- `POST /api/v1/agent/quote-requests/:id/recommend` — Mark recommended quote

### Admin/Partner Management (JWT auth, agent role)
- `GET /api/v1/admin/partners` — List partners
- `POST /api/v1/admin/partners` — Create partner
- `POST /api/v1/admin/partners/:id/rotate-key` — Rotate API key
- `GET /api/v1/admin/analytics` — Basic stats

## Redis Usage
| Key Pattern | TTL | Purpose |
|---|---|---|
| `quote:{hash}` | 300s | Dedup identical quote requests |
| `carrier:rates:{zip}:{type}` | 60s | Cached carrier rate data |
| `session:revoked:{jti}` | match token TTL | Revoked token tracking |
| `ratelimit:partner:{id}` | 60s | Sliding window rate limit |
| `agent:load:{id}` | 30s | Agent assignment load balancing |

## Frontend Pages

### Customer Portal
| Route | Purpose | Auth |
|---|---|---|
| `/` | Marketing landing + partner CTA | Public |
| `/login` | Customer/Agent login | Public |
| `/register` | Customer registration | Public |
| `/quotes?quoteRequestId=X` | View quotes from partner link | Public (token in URL) |
| `/dashboard` | Policy overview + pending quotes | Client |
| `/policies` | Policy list | Client |
| `/policies/:id` | Policy detail + documents | Client |
| `/agent` | Assigned Goosehead agent contact | Client |

### Agent Console
| Route | Purpose | Auth |
|---|---|---|
| `/agent/dashboard` | Agent overview stats | Agent |
| `/agent/quotes` | Quote request list + filters | Agent |
| `/agent/quotes/:id` | Quote detail + recommend/requote | Agent |
| `/agent/policies` | Policy list + filters | Agent |
| `/agent/partners` | Partner management | Agent |
| `/agent/analytics` | Basic analytics dashboard | Agent |

### Partner Dashboard
| Route | Purpose | Auth |
|---|---|---|
| `/partner/login` | Partner dashboard login | Public |
| `/partner/dashboard` | API usage stats | Partner |
| `/partner/quotes` | Quote request logs | Partner |
| `/partner/policies` | Issued policies | Partner |
| `/partner/docs` | Interactive API docs (Swagger embed) | Partner |

## Auth Architecture
- **Customers/Agents**: Email/password → bcrypt hash → JWT access (15min) + refresh (7d httpOnly cookie)
- **Partners (B2B API)**: API key in `x-api-key` header → hashed and compared → rate-limited per partner
- **NestJS Guards**: `@UseGuards(JwtAuthGuard)`, `@UseGuards(RolesGuard)`, `@UseGuards(ApiKeyGuard)`
- **Next.js**: Middleware checks JWT on protected route groups, redirects to login if expired
- **Redis**: Tracks revoked tokens for logout/security events

## Load Balancing (Nginx)
- 3 NestJS API instances behind Nginx with `least_conn` strategy
- Rate limiting: 100 req/min per IP at Nginx level, per-partner limits in app
- Health check endpoint: `GET /api/v1/health`
- Static assets served by Next.js directly

## UI/UX Design System (Goosehead-Inspired, from Mockup)

### Color Palette (Tailwind CSS custom theme)
| Token | Hex (approx) | Tailwind Alias | Usage |
|---|---|---|---|
| Forest Green | `#1B6B3A` | `primary-600` | Primary buttons, links, premium text, active badges |
| Dark Green | `#14532D` | `primary-800` | Agent card header bg, filled buttons ("Send Message") |
| Light Green | `#22C55E` | `primary-400` | "Better option found" highlights, online dots, upward indicators |
| Pale Green | `#F0FDF4` | `primary-50` | Subtle green tinted backgrounds |
| Gold/Amber | `#D97706` | `amber-600` | Renewing badge, alert bell icon, highlighted card border |
| Light Amber | `#FEF3C7` | `amber-100` | Renewing card tint/background |
| Red/Coral | `#DC2626` | `red-600` | Alert CTA ("Review Options"), destructive actions |
| Off-White | `#F8FAFC` | `slate-50` | Page background |
| White | `#FFFFFF` | `white` | Card backgrounds |
| Dark Gray | `#1E293B` | `slate-800` | Headings, primary body text |
| Medium Gray | `#64748B` | `slate-500` | Labels, secondary text, "State Farm · HO3" |
| Light Border | `#E2E8F0` | `slate-200` | Card borders, dividers |

### Typography
- Font: `Inter` (or system sans-serif fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Heading hierarchy:
  - Page title: `text-2xl font-bold text-slate-800`
  - Card title: `text-lg font-semibold text-slate-800` ("Homeowners", "Auto")
  - Section title: `text-base font-semibold text-slate-700` ("Your Agent", "Digital Insurance Card")
  - Stat number: `text-3xl font-bold text-slate-900` ("$247/mo", "3", "$620")
  - Label/caption: `text-xs font-medium uppercase tracking-wider text-slate-500` ("ACTIVE POLICIES", "PREMIUM", "COVERAGE")
  - Body: `text-sm text-slate-600`
  - Premium price: `text-xl font-bold text-primary-600` ("$103/mo", "$98/mo")
  - Green accent text: `text-sm font-medium text-primary-600` ("better option found", "↑ All covered")
  - Amber accent text: `text-sm font-medium text-amber-600` ("32 days away", "renewal approaching")

### Component Patterns

**Top Navigation Bar**
- White bg, subtle bottom border (`border-b border-slate-200`)
- Left: Logo icon (green circle with shield) + "InsureConnect" in `font-bold text-lg`
- Center: Tab navigation — outlined bordered pills (`border border-slate-300 rounded-lg px-4 py-1.5 text-sm`) with active state (green border + green text)
- Right: User name + role subtitle + circular avatar with initials (dark green bg `bg-primary-800`, white text)

**Alert/Notification Banner**
- Full-width, rounded-xl, dark forest green bg (`bg-primary-800`)
- Left: amber bell icon
- Text: white heading (bold) + white/light subtext
- Right: Red CTA button ("Review Options") — `bg-red-600 text-white rounded-lg px-4 py-2 font-semibold`

**Stats Row (4 metric cards)**
- Horizontal row of 4 cards, equal width, light bg (`bg-white border border-slate-200 rounded-xl`)
- Layout per card: uppercase gray label on top → large bold number → colored indicator below
- Indicator colors: green for positive ("↑ All covered"), amber for alerts ("32 days away"), red for increases ("↑ $14 at renewal")

**Policy Card**
- White bg, `rounded-xl border border-slate-200 shadow-sm`
- Header row: product icon (small, ~32px) + product name + status badge
- Status badges:
  - Active: `border border-primary-600 text-primary-600 bg-primary-50 rounded-full px-2.5 py-0.5 text-xs font-medium`
  - Renewing: `border border-amber-500 text-amber-700 bg-amber-50 rounded-full px-2.5 py-0.5 text-xs font-medium`
- Highlighted card (renewing): amber left border or amber border glow (`border-amber-400 border-2`)
- Data rows: label (uppercase gray) + value (bold dark) stacked vertically
- Progress bar: thin (4px height), rounded, green for active, amber for approaching renewal — "128 of 365 days" label below
- Card actions: row of buttons at bottom — outlined secondary + filled primary (green)

**Agent Contact Card**
- White card with dark green header section (`bg-primary-800 rounded-t-xl`)
- Large circular avatar in header (`w-16 h-16 bg-primary-600 text-white text-xl font-bold rounded-full` centered)
- Agent name below in green (`text-primary-600 font-bold text-lg`)
- Title/company in `text-sm text-slate-500`
- Contact details: icon + text rows (phone, email, availability w/ online dot)
- Two action buttons: "Call Now" (outlined green) + "Send Message" (filled dark green)

**Lily AI Chat Widget**
- Embedded below agent card (not a floating bubble)
- Header: "Lily" name + "AI Insurance Assistant" + green online dot
- Message bubbles:
  - AI messages: white bg, left-aligned, `rounded-lg` with slight shadow
  - User messages: green bg (`bg-primary-600`), white text, right-aligned, `rounded-lg`
- Input field at bottom (if interactive)

**Digital Insurance Card**
- Section heading + "Save to Wallet" button (outlined, wallet icon)
- Card visual: dark green gradient bg (`bg-gradient-to-br from-primary-800 to-primary-900`), rounded-xl
- Content: "AUTO INSURANCE" label (uppercase, small, white/light) → Carrier name (white, bold, large) → carrier logo → Details (INSURED, VEHICLE in small caps, values in white)

**Button Variants**
- Primary filled: `bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 font-medium`
- Primary outline: `border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg px-4 py-2 font-medium`
- Secondary outline: `border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 font-medium`
- Danger: `bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium`

**Card Layout Rule**
- All content cards: `bg-white rounded-xl border border-slate-200 shadow-sm p-5`
- Consistent `gap-4` between sections, `gap-6` between major page blocks
- Responsive: 2-column layout on desktop (policies left, agent right), single column on mobile

### Tailwind Config Customization (tailwind.config.ts)
Extend the default shadcn/ui theme:
- `colors.primary`: map 50-950 shades to the forest green palette
- `colors.amber`: keep Tailwind default (already matches mockup)
- `fontFamily.sans`: `['Inter', ...defaultTheme.fontFamily.sans]`
- `borderRadius.xl`: `0.75rem` (cards), `borderRadius.full` for badges/avatars
- shadcn/ui `--primary` CSS variable: set to forest green `#1B6B3A`

### shadcn/ui Components to Use
- `Card`, `CardContent`, `CardHeader` — policy cards, stat cards, agent card
- `Badge` — status badges (Active, Renewing) with custom variant colors
- `Button` — all button variants mapped to mockup styles
- `Avatar`, `AvatarFallback` — user initials, agent initials
- `Progress` — policy expiration progress bars
- `Tabs` — top navigation portal switching
- `Table` — agent console quote/policy lists
- `Dialog`/`Sheet` — policy detail modal, quote detail
- `Input`, `Label`, `Select` — forms
- `Skeleton` — loading states matching card shapes

### Page-Specific Layout (from Mockup)

**Customer Dashboard (`/dashboard`)**
- Row 1: Alert banner (full width, conditionally shown for renewal/changes)
- Row 2: 4 stat cards in horizontal row (Active Policies, Monthly Total, Annual Savings, Next Renewal)
- Row 3 (2-column): Left = policy cards (stacked vertically), Right = "Your Agent" card + Lily chat
- Row 4: Digital Insurance Card section

**Nav Structure**
- Top bar with tabs: "Client Portal", "Quote Flow", "Agent Console", "Partner API"
- These map to the route groups: `(customer)`, quote flow, `(agent)`, `(partner)`
- Right side: user avatar + name/role dropdown

## Carrier Adapter Pattern
```
interface CarrierAdapter {
  readonly carrierName: string;
  getQuote(input: QuoteInput): Promise<CarrierQuoteResult>;
  bindPolicy(input: BindInput): Promise<BindResult>;
}
```
- 4 mock adapters: StateFarm, GEICO, Progressive, Clearcover
- Each returns randomized but realistic data based on input (zip code, vehicle, property)
- Simulated latency (200-800ms random delay) to demonstrate parallel fan-out + timeout handling
- `CarrierAggregatorService.getQuotes()` fans out in parallel with `Promise.allSettled` + 3s timeout

---

## Phased Build Order

### Phase 1: Foundation (Week 1)
*Goal: Turborepo scaffold, database, auth — all wired up and testable*

1. Initialize Turborepo workspace with `apps/api`, `apps/web`, `packages/shared`
2. Set up NestJS app in `apps/api` with config module (env vars via `@nestjs/config`)
3. Set up Prisma schema with all models, run initial migration
4. Create seed script with sample data (partners, agents, users, demo quote data)
5. Implement auth module: register, login, refresh, logout (bcrypt + JWT + Redis revocation)
6. Implement NestJS guards: JwtAuthGuard, RolesGuard, ApiKeyGuard
7. Implement partner module: CRUD + API key generation (store hashed, return raw once)
8. Implement user module: CRUD for clients and agents
9. Set up Next.js app in `apps/web` with Tailwind + shadcn/ui
10. Implement login/register pages with JWT cookie handling
11. Write unit tests for auth module and guards

**Verification**: `POST /auth/login` returns tokens, protected routes reject unauthenticated requests, Prisma seed runs clean

### Phase 2: Core Insurance Domain (Week 2)
*Goal: Quote aggregation + policy binding — the star feature*

1. Implement `CarrierAdapter` interface in `packages/shared`
2. Build 4 mock carrier adapters (StateFarm, GEICO, Progressive, Clearcover) with simulated latency
3. Implement `CarrierAggregatorService` — parallel fan-out, timeout, error isolation
4. Implement quotes module: create quote request, aggregate from carriers, store results
5. Add Redis caching layer for quote deduplication (hash input → cache key)
6. Implement policies module: bind from quote, create policy record, state transitions
7. Implement `PolicyEvent` audit logging on every state change
8. Implement agent assignment logic (round-robin or least-loaded via Redis)
9. Build partner quote API endpoint: `POST /api/v1/partner/quotes`
10. Build partner bind endpoint: `POST /api/v1/partner/policies/bind`
11. Add Redis-based rate limiting per partner
12. Write integration tests for quote flow (request → fan-out → aggregate → cache hit on retry)

**Verification**: Partner API key → POST /quotes → get 4 carrier quotes sorted by price → POST /bind → policy created → second identical quote request returns cached result instantly

### Phase 3: Frontend — Customer Portal (Week 3)
*Goal: Customer-facing UI — view quotes, bind policies, manage policies — pixel-aligned with Goosehead mockup*

1. Set up React Query provider + API client (axios with interceptor for token refresh)
2. Configure Tailwind theme: forest green primary palette, Inter font, custom border-radius — as specified in UI/UX Design System section
3. Customize shadcn/ui theme: set `--primary` to forest green, add custom Badge variants for Active (green outline) and Renewing (amber outline)
4. Build top navigation bar: InsureConnect logo + tab pills (Client Portal, Quote Flow, Agent Console, Partner API) + user avatar with initials
5. Build customer dashboard page (`/dashboard`):
   - Alert banner component (dark green bg, bell icon, red CTA button) — conditionally rendered for renewals/changes
   - Stats row: 4 metric cards (Active Policies, Monthly Total, Annual Savings, Next Renewal) with colored indicators (green/amber/red)
   - Policy cards: carrier icon + name + status badge (Active green, Renewing amber) + premium + coverage + expiry + progress bar + action buttons (Policy Details, View Card, Compare Options)
   - Highlighted card variant: amber border for renewing policies
   - "Your Agent" card: dark green header, circular avatar, contact details, Call Now + Send Message buttons
   - Lily AI chat widget: embedded below agent card, message bubbles (white for AI, green for user)
6. Build Digital Insurance Card component: dark green gradient card with carrier/insured/vehicle info + "Save to Wallet" button
7. Build quote overview page (`/quotes?quoteRequestId=X`) — carrier quote cards sorted by price, same card style as policy cards
8. Build quote detail + bind flow — select carrier, confirm, call bind API
9. Build policies list page (`/policies`) — policy cards with carrier, premium, status badges, progress bars
10. Build policy detail page (`/policies/:id`) — coverage summary, renewal info, plain-language sections
11. Build agent contact page (`/agent`) — agent card component (same as dashboard sidebar)
12. Implement loading skeletons matching card shapes (Skeleton components from shadcn/ui)
13. Tone: conversational copy — "All your coverage in one place", "Here are your top options", "better option found"

**Verification**: Full customer flow works — open quote link → see carrier options → bind → see policy in dashboard → view agent contact

### Phase 4: Agent Console + Partner Dashboard (Week 4)
*Goal: Agent and partner management UIs*

1. Build agent dashboard (`/agent/dashboard`) — stats overview
2. Build quote requests list (`/agent/quotes`) — table with filters (status, product type, partner)
3. Build quote request detail (`/agent/quotes/:id`) — all carrier quotes, recommend action, re-quote
4. Build agent policies list (`/agent/policies`) — filterable table
5. Build partner management page (`/agent/partners`) — list, create, rotate keys
6. Build basic analytics page (`/agent/analytics`) — quote count, bind rate, carrier distribution (chart)
7. Build partner login + dashboard (`/partner/dashboard`) — API usage stats
8. Build partner quote logs page (`/partner/quotes`)
9. Build partner policy list page (`/partner/policies`)
10. Embed Swagger API docs on partner docs page (`/partner/docs`)

**Verification**: Agent can view all quote requests, recommend quotes, re-quote; partner can see their API activity; analytics show real data from seed + test interactions

### Phase 5: Infrastructure + Load Balancing (Week 5)
*Goal: Docker Compose with Nginx, 3 API instances, production-like setup*

1. Create Dockerfiles for NestJS API and Next.js frontend
2. Write `docker-compose.yml` with: nginx, api-1, api-2, api-3, frontend, postgres, redis
3. Configure Nginx: reverse proxy to 3 API instances (least_conn), rate limiting, health checks
4. Add health check endpoint (`GET /api/v1/health`) returning DB + Redis status
5. Configure `docker-compose.prod.yml` with production-like settings
6. Add Swagger/OpenAPI generation in NestJS (`@nestjs/swagger`)
7. Write comprehensive README with setup instructions, architecture diagram, demo walkthrough
8. Set up GitHub Actions CI: lint, type-check, test, build

**Verification**: `docker-compose up` brings up full stack, Nginx distributes requests across 3 instances (visible in logs), rate limiting works, Swagger docs accessible

### Phase 6: Deployment + Polish (Week 6)
*Goal: Live demo on Railway, webhook system, final polish*

1. Deploy to Railway: NestJS API + Next.js + PostgreSQL + Redis
2. Implement webhook module: outbound delivery to partner callback URLs with Bull queue + retry
3. Add SSE endpoint for real-time policy status updates in customer portal
4. Polish UI: animations, transitions, mobile responsiveness pass
5. Create demo walkthrough script (the mortgage officer story from the spec)
6. Load test the partner quote endpoint with k6 or artillery, document results

**Verification**: Live URL works end-to-end, webhook deliveries appear in partner dashboard, SSE updates policy status in real-time

### Phase 7: AI Chat + Extras (Week 7, nice-to-have)
*Goal: Lily AI assistant + any remaining polish*

1. Implement AI chat module in NestJS (Claude API integration)
2. Build chat widget in frontend (WebSocket via Socket.io)
3. Scope chat to insurance Q&A: coverage explanations, policy questions
4. Add digital insurance card component (visual card with "Save to Wallet" CTA)
5. Final documentation pass

**Verification**: Chat widget answers insurance questions using policy context, digital card renders correctly

---

## Relevant Files

- `turbo.json` — Turborepo pipeline config (build, dev, lint, test tasks)
- `apps/api/src/modules/auth/` — JWT + API key authentication, guards, strategies
- `apps/api/src/modules/carriers/` — CarrierAdapter interface + 4 mock implementations
- `apps/api/src/modules/quotes/quotes.service.ts` — CarrierAggregatorService with fan-out logic
- `apps/api/src/modules/policies/policies.service.ts` — Policy state machine + binding
- `apps/api/src/modules/partners/partners.service.ts` — API key management + rate limiting
- `apps/api/src/modules/webhooks/` — Bull queue + outbound delivery
- `apps/web/app/(customer)/dashboard/page.tsx` — Customer dashboard (SSR)
- `apps/web/app/(customer)/quotes/page.tsx` — Quote overview with carrier cards
- `apps/web/app/(agent)/` — Agent console pages
- `packages/shared/src/types/` — Shared DTOs and interfaces (QuoteRequest, CarrierQuote, Policy, etc.)
- `prisma/schema.prisma` — Full data model
- `prisma/seed.ts` — Demo data seeding
- `infra/nginx/nginx.conf` — Load balancer config
- `infra/docker-compose.yml` — Full local stack

## Verification (End-to-End Demo)

1. **Local**: `docker-compose up` → all services healthy → Nginx serving on port 80
2. **Partner flow**: Use curl/Postman with partner API key → POST /quotes → get carrier options → POST /bind → policy created
3. **Customer flow**: Open quote link in browser → view quotes → select + bind → dashboard shows policy → view agent
4. **Agent flow**: Login as agent → see quote requests → recommend → re-quote → manage partners
5. **Cache demo**: POST identical quote twice → second returns instantly from Redis
6. **Load balancing**: Watch Nginx logs, requests distributed across api-1/2/3
7. **Rate limiting**: Exceed partner limit → get 429 response
8. **Railway**: Live URL works same as local

## Decisions

- **Turborepo** over NestJS CLI monorepo — better DX, caching, Next.js-native support
- **Prisma** over TypeORM — type-safe, declarative schema, better migration story
- **Railway** over GitHub Spark — Spark can't support full-stack with PG + Redis
- **API key auth** for partners (simpler than OAuth2 client credentials for a demo; still demonstrates the pattern)
- **Mock carriers with simulated latency** — demonstrates real-world async patterns without needing actual carrier APIs
- **AI chat is Phase 7** — core insurance domain + infrastructure are the priority to address the "backend experience" gap
- **Bull queue for webhooks** — demonstrates async job processing, retry logic, and Redis-backed queuing
- **shadcn/ui** — production-quality components, easy to customize to Goosehead green theme
- **Scope excludes**: real carrier APIs, real payments, actuarial models, complex underwriting

## Key Refinements from Your Two Versions

1. **Merged business context** (Version 1) with **structured feature specs** (Version 2/PRD) into one coherent plan
2. **Simplified partner auth** to API key (vs. full OAuth2 client_credentials) — still impressive, less boilerplate
3. **Moved AI chat to Phase 7** per your preference — core demo is strong without it
4. **Added Turborepo** per your choice — better than NestJS CLI monorepo for this mixed Next.js + NestJS setup
5. **Railway deployment** instead of GitHub Spark — supports full stack
6. **Carrier adapters reduced to 4** (StateFarm, GEICO, Progressive, Clearcover) — enough to demo fan-out pattern
7. **Removed notifications module** from core — email/SMS adds complexity without demo value
8. **Added k6 load testing** in Phase 6 — concrete proof of scalability claims
9. **SSE over WebSocket** for policy updates — simpler, sufficient for status notifications (WebSocket reserved for chat only)
10. **Agent console simplified** — focused on the Aviator-like quote management that tells the Goosehead story
