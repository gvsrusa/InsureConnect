import Link from "next/link";

import StatusBadge from "@/components/domain/StatusBadge";
import BackBreadcrumb from "@/components/domain/BackBreadcrumb";
import { agentApi, ApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { MOCK_QUOTE_REQUEST } from "@/lib/mock-data";
import type { QuoteRequest } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Quote Detail — Agent Console" };

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export default async function AgentQuoteDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const token = await requireAuth("/login");

  let quoteRequest: QuoteRequest = { ...MOCK_QUOTE_REQUEST, id };
  try {
    quoteRequest = await agentApi.quoteRequest(id, token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Agent quote detail API unavailable, using mock data:", (err as Error).message);
    }
  }

  const sortedQuotes = [...quoteRequest.quotes].sort((left, right) => left.annualPremium - right.annualPremium);

  return (
    <div className="space-y-6">
      {/* Breadcrumb – only visible when navigated from the quotes list */}
      <BackBreadcrumb
        listHref="/agent/quotes"
        listLabel="Quote Requests"
        currentLabel={quoteRequest.id}
      />

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {quoteRequest.productType}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink">
              {quoteRequest.clientEmail ?? "Unassigned client"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Requested {new Date(quoteRequest.createdAt).toLocaleString("en-US")}
            </p>
          </div>
          <StatusBadge status={quoteRequest.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedQuotes.map((quote, index) => (
          <article
            key={quote.id}
            className={[
              "rounded-2xl border bg-white p-5 shadow-card",
              index === 0 ? "border-emerald-300" : "border-[var(--color-border)]"
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-ink">{quote.carrierName}</p>
                <p className="mt-1 text-sm text-muted">
                  Expires {new Date(quote.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </div>
              {index === 0 && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Best price
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Monthly</p>
                <p className="mt-1 text-xl font-semibold text-ink">{formatCurrency(quote.monthlyPremium)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Annual</p>
                <p className="mt-1 text-xl font-semibold text-ink">{formatCurrency(quote.annualPremium)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(quote.coverageSummary).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-muted"
                >
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>: {typeof value === "number" ? formatCurrency(value) : String(value)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
