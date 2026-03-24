import type {
  Agent,
  AgentDashboardSummary,
  DashboardSummary,
  PartnerDashboardSummary,
  Policy,
  QuoteRequest
} from "./types";
import { getApiBaseUrl } from "./api-base";

const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

function bearer(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiFetch<{ accessToken: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  register: (body: { fullName: string; email: string; password: string }) =>
    apiFetch<{ accessToken: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  logout: (token: string) =>
    apiFetch<void>("/api/v1/auth/logout", {
      method: "POST",
      ...bearer(token)
    })
};

export const portalApi = {
  dashboard: (token: string) =>
    apiFetch<DashboardSummary>("/api/v1/portal/dashboard", bearer(token)),

  policies: (token: string) =>
    apiFetch<Policy[]>("/api/v1/portal/policies", bearer(token)),

  policy: (id: string, token: string) =>
    apiFetch<Policy>(`/api/v1/portal/policies/${id}`, bearer(token)),

  agent: (token: string) =>
    apiFetch<Agent>("/api/v1/portal/agent", bearer(token)),

  quotes: (quoteRequestId: string, token?: string) =>
    apiFetch<QuoteRequest>(
      `/api/v1/portal/quotes/${quoteRequestId}`,
      token ? bearer(token) : undefined
    )
};

export const agentApi = {
  dashboard: (token: string) =>
    apiFetch<AgentDashboardSummary>("/api/v1/agent/dashboard", bearer(token)),

  quoteRequests: (token: string) =>
    apiFetch<QuoteRequest[]>("/api/v1/agent/quote-requests", bearer(token)),

  quoteRequest: (id: string, token: string) =>
    apiFetch<QuoteRequest>(`/api/v1/agent/quote-requests/${id}`, bearer(token)),

  policies: (token: string) =>
    apiFetch<Policy[]>("/api/v1/agent/policies", bearer(token)),

  recommend: (id: string, quoteId: string, token: string) =>
    apiFetch<{ ok: boolean }>(`/api/v1/agent/quote-requests/${id}/recommend`, {
      method: "POST",
      body: JSON.stringify({ quoteId }),
      ...bearer(token)
    }),

  requote: (id: string, token: string) =>
    apiFetch<{ ok: boolean }>(`/api/v1/agent/quote-requests/${id}/requote`, {
      method: "POST",
      ...bearer(token)
    })
};

export const partnerApi = {
  dashboard: (token: string) =>
    apiFetch<PartnerDashboardSummary>("/api/v1/admin/analytics", bearer(token)),

  partners: (token: string) =>
    apiFetch<unknown[]>("/api/v1/admin/partners", bearer(token)),

  quoteRequests: (token: string) =>
    apiFetch<QuoteRequest[]>("/api/v1/admin/quote-requests", bearer(token)),

  policies: (token: string) =>
    apiFetch<Policy[]>("/api/v1/admin/policies", bearer(token))
};
