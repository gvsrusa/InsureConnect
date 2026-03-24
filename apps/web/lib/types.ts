export type PolicyStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";
export type ProductType = "AUTO" | "HOME";
export type QuoteStatus = "PENDING" | "COMPLETED" | "EXPIRED" | "FAILED";
export type UserRole = "CLIENT" | "AGENT" | "PARTNER_USER";

export interface Policy {
  id: string;
  carrierName: string;
  policyNumber: string;
  status: PolicyStatus;
  effectiveDate: string;
  expirationDate: string;
  premium: number;
  coverageType: string;
  clientName?: string;
}

export interface Quote {
  id: string;
  carrierName: string;
  monthlyPremium: number;
  annualPremium: number;
  coverageSummary: Record<string, unknown>;
  expiresAt: string;
}

export interface QuoteRequest {
  id: string;
  status: QuoteStatus;
  productType: ProductType;
  quotes: Quote[];
  createdAt: string;
  clientEmail?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
  policiesManaged?: number;
  isOnline?: boolean;
}

export interface DashboardSummary {
  activePolicies: number;
  pendingQuotes: number;
  annualPremium: number;
  recentPolicies: Policy[];
}

export interface AgentDashboardSummary {
  assignedQuotes: number;
  boundThisMonth: number;
  activePolicies: number;
  conversionRate: number;
  recentQuoteRequests: QuoteRequest[];
}

export interface PartnerDashboardSummary {
  totalRequests: number;
  successRate: number;
  boundPolicies: number;
  apiCallsToday: number;
  avgResponseMs: number;
}
