import { requireAuth } from "@/lib/auth";
import { partnerApi, ApiError } from "@/lib/api";
import { MOCK_PARTNER_DASHBOARD } from "@/lib/mock-data";
import { formatDurationFromMs } from "@/lib/format";
import StatCard from "@/components/domain/StatCard";
import AlertBanner from "@/components/domain/AlertBanner";
import type { PartnerDashboardSummary } from "@/lib/types";

export const metadata = { title: "Partner Dashboard — InsureConnect" };

export default async function PartnerDashboardPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: GET /api/v1/admin/analytics — wire real data; endpoint requires agent/admin role
  let data: PartnerDashboardSummary = MOCK_PARTNER_DASHBOARD;
  try {
    data = await partnerApi.dashboard(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Partner dashboard API unavailable, using mock:", (err as Error).message);
    }
  }

  const successPct = Math.round(data.successRate * 100);

  return (
    <>
      <AlertBanner
        type="info"
        message="This dashboard shows your API integration stats."
        dismissible
      />

      <div className="space-y-8">
        <div className="mt-6">
          <h1 className="text-2xl font-bold text-ink">Partner Dashboard</h1>
          <p className="mt-1 text-sm text-muted">API usage and policy activity for your integration</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Requests" value={data.totalRequests.toLocaleString()} icon="🔗" />
          <StatCard label="Success Rate" value={`${successPct}%`} icon="✅" trend={successPct - 95} />
          <StatCard label="Bound Policies" value={data.boundPolicies} icon="🛡" trend={8} />
          <StatCard label="API Calls Today" value={data.apiCallsToday} icon="⚡" />
          <StatCard label="Avg Response" value={formatDurationFromMs(data.avgResponseMs)} icon="⏱" />
        </div>

        {/* API quick-reference */}
        <section
          className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card"
          aria-labelledby="api-ref"
        >
          <h2 id="api-ref" className="mb-4 font-semibold text-ink">
            Quick API Reference
          </h2>
          <div className="space-y-3">
            {[
              {
                method: "POST",
                path: "/api/v1/partner/quotes",
                desc: "Submit quote request — returns aggregated carrier quotes"
              },
              {
                method: "GET",
                path: "/api/v1/partner/quotes/:id",
                desc: "Check quote status"
              },
              {
                method: "POST",
                path: "/api/v1/partner/policies/bind",
                desc: "Bind policy from a quote"
              },
              {
                method: "GET",
                path: "/api/v1/partner/policies",
                desc: "List policies created via this partner"
              }
            ].map(({ method, path, desc }) => (
              <div key={path} className="flex flex-wrap items-start gap-3">
                <span
                  className={[
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-bold",
                    method === "GET"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  ].join(" ")}
                >
                  {method}
                </span>
                <code className="flex-1 font-mono text-sm text-ink">{path}</code>
                <span className="text-sm text-muted">{desc}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">Auth required:</span> Include your API key via{" "}
            <code className="font-mono">x-api-key: YOUR_KEY</code> on all partner endpoints.
          </div>
        </section>
      </div>
    </>
  );
}
