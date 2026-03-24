import { requireAuth } from "@/lib/auth";
import { agentApi, ApiError } from "@/lib/api";
import { MOCK_AGENT_DASHBOARD } from "@/lib/mock-data";
import StatCard from "@/components/domain/StatCard";
import StatusBadge from "@/components/domain/StatusBadge";
import type { AgentDashboardSummary } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Agent Dashboard — InsureConnect" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "< 1h ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AgentDashboardPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: GET /api/v1/agent/dashboard – aggregate endpoint not yet implemented.
  //       Using mock data as fallback.
  let data: AgentDashboardSummary = MOCK_AGENT_DASHBOARD;
  try {
    data = await agentApi.dashboard(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Agent dashboard API unavailable, using mock data:", (err as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Agent Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Your performance at a glance</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Quotes" value={data.assignedQuotes} icon="📋" />
        <StatCard label="Bound This Month" value={data.boundThisMonth} icon="✅" trend={12} />
        <StatCard label="Active Policies" value={data.activePolicies} icon="🛡" />
        <StatCard
          label="Conversion Rate"
          value={`${Math.round(data.conversionRate * 100)}%`}
          icon="📈"
          trend={3}
        />
      </div>

      {/* Recent quote requests */}
      <section aria-labelledby="recent-quotes-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-quotes-heading" className="text-lg font-semibold text-ink">
            Recent Quote Requests
          </h2>
          <Link href="/agent/quotes" className="text-sm font-medium text-pine hover:underline">
            View all →
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-gray-50">
              <tr>
                {["Client", "Type", "Status", "Requested", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentQuoteRequests.map((qr) => (
                <tr key={qr.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-ink">{qr.clientEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{qr.productType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={qr.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{timeAgo(qr.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/agent/quotes?id=${qr.id}`}
                      className="text-pine text-xs font-semibold hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
