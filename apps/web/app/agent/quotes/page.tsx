import { requireAuth } from "@/lib/auth";
import { agentApi, ApiError } from "@/lib/api";
import { MOCK_AGENT_DASHBOARD } from "@/lib/mock-data";
import StatusBadge from "@/components/domain/StatusBadge";
import type { QuoteRequest } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Quotes — Agent Console" };

const FILTERS = ["ALL", "PENDING", "COMPLETED", "EXPIRED", "FAILED"] as const;

type QuoteFilter = (typeof FILTERS)[number];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "< 1h ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AgentQuotesPage({ searchParams }: Props): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");
  const { status } = await searchParams;

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

  const activeFilter: QuoteFilter = FILTERS.includes((status ?? "").toUpperCase() as QuoteFilter)
    ? ((status ?? "").toUpperCase() as QuoteFilter)
    : "ALL";

  const filteredQuoteRequests =
    activeFilter === "ALL"
      ? quoteRequests
      : quoteRequests.filter((quoteRequest) => quoteRequest.status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Quote Requests</h1>
        <p className="mt-1 text-sm text-muted">
          {filteredQuoteRequests.length} shown · {quoteRequests.length} total · {byStatus.PENDING.length} pending
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <Link
              key={filter}
              href={filter === "ALL" ? "/agent/quotes" : `/agent/quotes?status=${filter}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-pine bg-pine text-white"
                  : "border-gray-200 bg-white text-muted hover:border-pine hover:text-pine"
              ].join(" ")}
            >
              {filter === "ALL"
                ? `All (${quoteRequests.length})`
                : `${filter} (${byStatus[filter]?.length ?? 0})`}
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
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
              {filteredQuoteRequests.map((qr) => (
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
        </div>

        {filteredQuoteRequests.length === 0 && (
          <div className="py-14 text-center text-sm text-muted">
            {activeFilter === "ALL" ? "No quote requests yet." : `No ${activeFilter.toLowerCase()} quote requests.`}
          </div>
        )}
      </div>
    </div>
  );
}
