import Link from "next/link";

import StatusBadge from "@/components/domain/StatusBadge";
import { ApiError, partnerApi } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { MOCK_AGENT_DASHBOARD } from "@/lib/mock-data";
import type { QuoteRequest } from "@/lib/types";

export const metadata = { title: "Partner Quotes — InsureConnect" };

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function PartnerQuotesPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  let quoteRequests: QuoteRequest[] = MOCK_AGENT_DASHBOARD.recentQuoteRequests;
  try {
    quoteRequests = await partnerApi.quoteRequests(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Partner quote requests API unavailable, using mock data:", (err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Partner Quote Requests</h1>
        <p className="mt-1 text-sm text-muted">
          Monitor submitted quote traffic and the current carrier response set.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {quoteRequests.map((quoteRequest) => {
          const bestQuote = [...quoteRequest.quotes].sort((left, right) => left.annualPremium - right.annualPremium)[0];

          return (
            <article
              key={quoteRequest.id}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {quoteRequest.productType}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">
                    {quoteRequest.clientEmail ?? "Inbound partner submission"}
                  </h2>
                  <p className="mt-1 text-xs font-mono text-muted">{quoteRequest.id}</p>
                </div>
                <StatusBadge status={quoteRequest.status} />
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Quotes</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{quoteRequest.quotes.length}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Best annual</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {bestQuote ? formatCurrency(bestQuote.annualPremium) : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Created</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {new Date(quoteRequest.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">
                  {bestQuote ? `${bestQuote.carrierName} is currently leading` : "Waiting for carrier responses"}
                </span>
                <Link href={`/quotes?quoteRequestId=${quoteRequest.id}`} className="font-semibold text-pine hover:underline">
                  Open quote view
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
