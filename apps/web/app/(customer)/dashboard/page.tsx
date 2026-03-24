import { requireAuth } from "@/lib/auth";
import { portalApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { MOCK_CUSTOMER_DASHBOARD, MOCK_AGENT } from "@/lib/mock-data";
import StatCard from "@/components/domain/StatCard";
import PolicyCard from "@/components/domain/PolicyCard";
import AgentContactCard from "@/components/domain/AgentContactCard";
import AlertBanner from "@/components/domain/AlertBanner";
import LilyChatWidget from "@/components/domain/LilyChatWidget";
import type { DashboardSummary, Agent } from "@/lib/types";

export const metadata = { title: "Dashboard — InsureConnect" };

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

export default async function CustomerDashboardPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: Replace fallbacks with real endpoints once portal dashboard is wired
  let dashboard: DashboardSummary = MOCK_CUSTOMER_DASHBOARD;
  let agent: Agent = MOCK_AGENT;

  try {
    [dashboard, agent] = await Promise.all([
      portalApi.dashboard(token),
      portalApi.agent(token)
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode !== 404) {
      // 404 = endpoint not yet implemented — fall through to mock
      console.warn("Dashboard API unavailable, using mock data:", err.message);
    }
  }

  const hasPendingQuotes = dashboard.pendingQuotes > 0;
  const quotesHref = dashboard.latestQuoteRequestId
    ? `/quotes?quoteRequestId=${dashboard.latestQuoteRequestId}`
    : "/quotes";

  return (
    <>
      {hasPendingQuotes && (
        <AlertBanner
          type="warning"
          message={`You have ${dashboard.pendingQuotes} pending quote${dashboard.pendingQuotes > 1 ? "s" : ""} expiring soon.`}
          ctaHref={quotesHref}
          ctaLabel="View quotes →"
        />
      )}

      <div className="space-y-8">
        {/* Stats row */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="mb-4 text-lg font-semibold text-ink">
            Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Active Policies"
              value={dashboard.activePolicies}
              icon="🛡"
              trend={5}
            />
            <StatCard
              label="Pending Quotes"
              value={dashboard.pendingQuotes}
              icon="📋"
            />
            <StatCard
              label="Annual Premium"
              value={formatCurrency(dashboard.annualPremium)}
              icon="💰"
              subtext="combined across all carriers"
            />
          </div>
        </section>

        {/* Two-column layout: policies + agent */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Policies list */}
          <section className="lg:col-span-2" aria-labelledby="policies-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="policies-heading" className="text-lg font-semibold text-ink">
                Recent Policies
              </h2>
              <a
                href="/policies"
                className="text-sm font-medium text-pine hover:underline"
              >
                View all →
              </a>
            </div>
            {dashboard.recentPolicies.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-muted">
                No policies yet.{" "}
                <a href="/quotes" className="font-semibold text-pine hover:underline">
                  Get a quote
                </a>
              </div>
            )}
          </section>

          {/* Agent card */}
          <aside>
            <h2 className="mb-4 text-lg font-semibold text-ink">Your Agent</h2>
            <AgentContactCard agent={agent} />
          </aside>
        </div>
      </div>

      {/* Lily chat widget */}
      <LilyChatWidget />
    </>
  );
}
