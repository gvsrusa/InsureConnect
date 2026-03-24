/**
 * Mock data module — used as fallback when backend endpoints are unavailable.
 * TODO: Remove mock data once all backend endpoints are implemented and populated.
 */

import type {
  Agent,
  AgentDashboardSummary,
  DashboardSummary,
  PartnerDashboardSummary,
  Policy,
  QuoteRequest
} from "./types";

// ── Policies ─────────────────────────────────────────────────────────────────

export const MOCK_POLICIES: Policy[] = [
  {
    id: "pol_001",
    carrierName: "State Farm",
    policyNumber: "SF-2024-88201",
    status: "ACTIVE",
    effectiveDate: "2024-01-01",
    expirationDate: "2025-01-01",
    premium: 1428,
    coverageType: "HOME"
  },
  {
    id: "pol_002",
    carrierName: "Progressive",
    policyNumber: "PGR-2024-44510",
    status: "ACTIVE",
    effectiveDate: "2024-03-15",
    expirationDate: "2025-03-15",
    premium: 892,
    coverageType: "AUTO"
  },
  {
    id: "pol_003",
    carrierName: "Geico",
    policyNumber: "GEICO-2023-77034",
    status: "EXPIRED",
    effectiveDate: "2023-06-01",
    expirationDate: "2024-06-01",
    premium: 754,
    coverageType: "AUTO"
  }
];

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const MOCK_CUSTOMER_DASHBOARD: DashboardSummary = {
  activePolicies: 2,
  pendingQuotes: 1,
  annualPremium: 2320,
  latestQuoteRequestId: "qr_mock_001",
  recentPolicies: MOCK_POLICIES.slice(0, 2)
};

// ── Agent ─────────────────────────────────────────────────────────────────────

export const MOCK_AGENT: Agent = {
  id: "agent_001",
  name: "Sarah Mitchell",
  email: "sarah.mitchell@goosehead.com",
  phone: "(512) 555-0143",
  bio: "10+ years in commercial and residential insurance. Specialises in bundled home + auto packages.",
  rating: 4.9,
  policiesManaged: 312,
  isOnline: true
};

// ── Quotes ────────────────────────────────────────────────────────────────────

export const MOCK_QUOTE_REQUEST: QuoteRequest = {
  id: "qr_mock_001",
  status: "COMPLETED",
  productType: "HOME",
  createdAt: new Date().toISOString(),
  quotes: [
    {
      id: "q_001",
      carrierName: "Clearcover",
      monthlyPremium: 98,
      annualPremium: 1176,
      coverageSummary: { dwelling: 350000, liability: 100000, deductible: 1000 },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "q_002",
      carrierName: "State Farm",
      monthlyPremium: 119,
      annualPremium: 1428,
      coverageSummary: { dwelling: 350000, liability: 300000, deductible: 500 },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "q_003",
      carrierName: "Progressive",
      monthlyPremium: 107,
      annualPremium: 1284,
      coverageSummary: { dwelling: 350000, liability: 100000, deductible: 750 },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// ── Agent Dashboard ───────────────────────────────────────────────────────────

export const MOCK_AGENT_DASHBOARD: AgentDashboardSummary = {
  assignedQuotes: 14,
  boundThisMonth: 7,
  activePolicies: 312,
  conversionRate: 0.62,
  recentQuoteRequests: [
    {
      id: "qr_001",
      status: "COMPLETED",
      productType: "HOME",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      quotes: [],
      clientEmail: "john.doe@example.com"
    },
    {
      id: "qr_002",
      status: "PENDING",
      productType: "AUTO",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      quotes: [],
      clientEmail: "jane.smith@example.com"
    },
    {
      id: "qr_003",
      status: "COMPLETED",
      productType: "AUTO",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      quotes: [],
      clientEmail: "bob.jones@example.com"
    }
  ]
};

// ── Partner Dashboard ─────────────────────────────────────────────────────────

export const MOCK_PARTNER_DASHBOARD: PartnerDashboardSummary = {
  totalRequests: 1_284,
  successRate: 0.97,
  boundPolicies: 52,
  apiCallsToday: 48,
  avgResponseMs: 312
};
