import { requireAuth } from "@/lib/auth";
import { agentApi, ApiError } from "@/lib/api";
import { MOCK_AGENT_DASHBOARD } from "@/lib/mock-data";
import StatusBadge from "@/components/domain/StatusBadge";
import type { QuoteRequest } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Quotes — Agent Console" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "< 1h ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AgentQuotesPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: GET /api/v1/agent/quote-requests — returns paginated list; add filter/sort params
  let quoteRequests: QuoteRequest[] = MOCK_AGENT_DASHBOARD.recentQuoteRequests;
  try {
    quoteRequests = await agentApi.quoteRequests(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Agent quote requests API unavailable, using mock:", (err as Error).message);
    }
  }

  const byStatus = {
    PENDING: quoteRequests.filter((q) => q.status === "PENDING"),
    COMPLETED: quoteRequests.filter((q) => q.status === "COMPLETED"),
    EXPIRED: quoteRequests.filter((q) => q.status === "EXPIRED"),
    FAILED: quoteRequests.filter((q) => q.status === "FAILED")
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Quote Requests</h1>
        <p className="mt-1 text-sm text-muted">
          {quoteRequests.length} total · {byStatus.PENDING.length} pending
        </p>
      </div>

      {/* Filter chips (display only – TODO: wire to URL params for server-side filtering) */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "COMPLETED", "EXPIRED"] as const).map((s) => (
          <span
            key={s}
            className="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-muted hover:border-pine hover:text-pine transition-colors"
          >
            {s === "ALL" ? `All (${quoteRequests.length})` : `${s} (${byStatus[s]?.length ?? 0})`}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-gray-50">
            <tr>
              {["ID", "Client", "Type", "Quotes", "Status", "Requested", "Actions"].map((h) => (
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
            {quoteRequests.map((qr) => (
              <tr key={qr.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted">{qr.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-ink">{qr.clientEmail ?? "—"}</td>
                <td className="px-4 py-3 text-ink">{qr.productType}</td>
                <td className="px-4 py-3 text-ink">{qr.quotes.length}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={qr.status} />
                </td>
                <td className="px-4 py-3 text-muted">{timeAgo(qr.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/agent/quotes/${qr.id}`}
                    className="text-pine text-xs font-semibold hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {quoteRequests.length === 0 && (
          <div className="py-14 text-center text-sm text-muted">No quote requests yet.</div>
        )}
      </div>
    </div>
  );
}
