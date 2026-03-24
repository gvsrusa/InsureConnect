import { getAuthToken } from "@/lib/auth";
import { portalApi, ApiError } from "@/lib/api";
import { MOCK_QUOTE_REQUEST } from "@/lib/mock-data";
import StatusBadge from "@/components/domain/StatusBadge";
import LilyChatWidget from "@/components/domain/LilyChatWidget";
import type { QuoteRequest } from "@/lib/types";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ quoteRequestId?: string; error?: string }>;
}

export const metadata = { title: "Your Quotes — InsureConnect" };

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function QuotesPage({ searchParams }: Props): Promise<React.JSX.Element> {
  const { quoteRequestId, error } = await searchParams;
  const token = await getAuthToken();

  if (!quoteRequestId) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="border-b border-[var(--color-border)] bg-white px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-bold text-ink">Get a fresh quote</h1>
            <p className="mt-2 text-sm text-muted">
              Submit a few details and we will pull sample carrier quotes instantly.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <form
            action="/api/quotes"
            method="POST"
            className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-card"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink">Name or business</span>
                <input
                  name="businessName"
                  required
                  defaultValue="Chris Customer"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink">Coverage type</span>
                <select
                  name="coverageType"
                  defaultValue="AUTO"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none transition focus:border-pine"
                >
                  <option value="AUTO">Auto</option>
                  <option value="HOME">Home</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink">State</span>
                <input
                  name="state"
                  required
                  minLength={2}
                  maxLength={2}
                  defaultValue="TX"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm uppercase outline-none transition focus:border-pine"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink">Annual revenue</span>
                <input
                  name="annualRevenue"
                  type="number"
                  min={1}
                  required
                  defaultValue={125000}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted">
                This creates a real quote request in the local database.
              </p>
              <button
                type="submit"
                className="rounded-xl bg-pine px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
              >
                Create quote →
              </button>
            </div>
          </form>
        </div>

        <LilyChatWidget />
      </main>
    );
  }

  // TODO: GET /api/v1/portal/quotes/:id — this endpoint requires JWT auth.
  //       Partner-shared links may not have a session, so either:
  //       (a) embed a short-lived signed token in the URL, or
  //       (b) require users to create an account before viewing quotes.
  //       For now, fallback to mock data when no auth token or API returns 404.
  let quoteRequest: QuoteRequest | null = null;

  if (quoteRequestId !== "demo") {
    try {
      quoteRequest = await portalApi.quotes(quoteRequestId, token);
    } catch (err) {
      if (!(err instanceof ApiError) || err.statusCode !== 404) {
        console.warn("Quotes API unavailable, using mock data:", (err as Error).message);
      }
      quoteRequest = { ...MOCK_QUOTE_REQUEST, id: quoteRequestId };
    }
  } else {
    // Demo mode — show mock data
    quoteRequest = MOCK_QUOTE_REQUEST;
  }

  if (!quoteRequest) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold text-ink">Quote not found</p>
          <p className="mt-2 text-sm text-muted">
            This quote link may have expired or is invalid.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-pine px-6 py-2.5 text-sm font-semibold text-white">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const sorted = [...quoteRequest.quotes].sort((a, b) => a.monthlyPremium - b.monthlyPremium);
  const cheapest = sorted[0];

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-pine">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                <rect width="28" height="28" rx="7" fill="var(--color-pine)" />
                <path d="M14 5L21 9V15C21 19.1421 17.4183 22.5 14 23C10.5817 22.5 7 19.1421 7 15V9L14 5Z" fill="white" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-ink">Your Insurance Quotes</h1>
              <p className="text-sm text-muted">
                {quoteRequest.productType} · <StatusBadge status={quoteRequest.status} />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {/* Best deal callout */}
        {cheapest && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-xl">✨</span>
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">Better option found!</span> {cheapest.carrierName} is
              your lowest estimate at{" "}
              <span className="font-bold">{formatCurrency(cheapest.monthlyPremium)}/mo</span>
            </p>
          </div>
        )}

        {/* Quote cards */}
        <div className="space-y-4">
          {sorted.map((quote, idx) => (
            <article
              key={quote.id}
              className={[
                "relative rounded-2xl border bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover",
                idx === 0 ? "border-emerald-300" : "border-[var(--color-border)]"
              ].join(" ")}
            >
              {idx === 0 && (
                <span className="absolute -top-3 left-4 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white">
                  Best price
                </span>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-ink">{quote.carrierName}</p>
                  <p className="text-xs text-muted">Expires {formatDate(quote.expiresAt)}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-pine">
                    {formatCurrency(quote.monthlyPremium)}
                    <span className="text-sm font-normal text-muted">/mo</span>
                  </p>
                  <p className="text-xs text-muted">
                    {formatCurrency(quote.annualPremium)}/yr
                  </p>
                </div>
              </div>

              {/* Coverage summary */}
              {quote.coverageSummary && Object.keys(quote.coverageSummary).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(quote.coverageSummary).map(([key, val]) => (
                    <span
                      key={key}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-muted"
                    >
                      <span className="capitalize">{key.replace(/_/g, " ")}</span>:{" "}
                      <span className="font-medium text-ink">
                        {typeof val === "number"
                          ? formatCurrency(val as number)
                          : String(val)}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                {token ? (
                  <form action={`/api/quotes/${quoteRequest.id}/bind`} method="POST">
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
                    >
                      Bind this policy →
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/register"
                    className="rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-white hover:bg-pine-dark transition-colors"
                  >
                    Sign up to bind →
                  </Link>
                )}
                <p className="text-xs text-muted">No commitment required</p>
              </div>
            </article>
          ))}
        </div>

        {quoteRequest.quotes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-14 text-center text-sm text-muted">
            No quotes available yet. Check back shortly.
          </div>
        )}
      </div>

      <LilyChatWidget />
    </main>
  );
}
