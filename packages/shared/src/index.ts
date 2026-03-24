// ---------------------------------------------------------------------------
// User / Auth
// ---------------------------------------------------------------------------
export type UserRole =
  | "ADMIN"
  | "AGENT"
  | "PARTNER_UNDERWRITER"
  | "PARTNER_VIEWER";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// ---------------------------------------------------------------------------
// Partner API
// ---------------------------------------------------------------------------
export interface CreateQuoteRequestInput {
  businessName: string;
  coverageType: "AUTO" | "HOME" | "COMMERCIAL";
  state: string;
  annualRevenue: number;
}

export interface QuoteItem {
  id: string;
  carrierName: string;
  premiumCents: number;
  annualPremiumCents: number;
  termMonths: number;
  coverageSummary: Record<string, unknown>;
}

export interface QuoteRequestResponse {
  quoteRequestId: string;
  status: string;
  quotes: QuoteItem[];
}

export interface BindPolicyInput {
  quoteRequestId: string;
  quoteId: string;
}

export interface PolicyDetail {
  id: string;
  policyNumber: string;
  carrierName: string;
  premiumCents: number;
  status: string;
  effectiveDate: string;
  expirationDate: string;
  assignedAgentId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Legacy (kept for back-compat)
// ---------------------------------------------------------------------------
export type QuoteRequestInput = {
  partnerId: string;
  requestedByUserId: string;
  businessName: string;
  coverageType: string;
  state: string;
  annualRevenue: number;
  effectiveDate: string;
  notes?: string;
};

export type QuoteResult = {
  quoteId: string;
  quoteRequestId: string;
  carrierName: string;
  premiumCents: number;
  termMonths: number;
  status: "PENDING" | "READY" | "DECLINED";
  createdAt: string;
};

export type PolicyResult = {
  policyId: string;
  quoteRequestId: string;
  policyNumber: string;
  carrierName: string;
  premiumCents: number;
  status: "DRAFT" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  effectiveDate: string;
  expirationDate: string;
  createdAt: string;
};