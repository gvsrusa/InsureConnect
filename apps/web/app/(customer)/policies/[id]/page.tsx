import { requireAuth } from "@/lib/auth";
import { portalApi, ApiError } from "@/lib/api";
import { MOCK_POLICIES } from "@/lib/mock-data";
import StatusBadge from "@/components/domain/StatusBadge";
import DigitalInsuranceCard from "@/components/domain/DigitalInsuranceCard";
import LilyChatWidget from "@/components/domain/LilyChatWidget";
import type { Policy } from "@/lib/types";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Policy Detail — InsureConnect" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default async function PolicyDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const token = await requireAuth("/login");

  // TODO: Remove fallback once GET /api/v1/portal/policies/:id is confirmed working
  let policy: Policy | undefined = MOCK_POLICIES.find((p) => p.id === id);
  try {
    policy = await portalApi.policy(id, token);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode !== 404) {
      console.warn("Policy API unavailable, using mock data:", (err as Error).message);
    }
  }

  if (!policy) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-ink">Policy not found</p>
        <Link href="/policies" className="mt-3 inline-block text-sm text-pine hover:underline">
          ← Back to policies
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/policies" className="hover:text-pine">Policies</Link>
        <span>›</span>
        <span className="text-ink">{policy.policyNumber}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div className="flex items-start justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {policy.carrierName}
              </p>
              <h1 className="text-xl font-bold text-ink">
                {policy.coverageType} Insurance
              </h1>
              <p className="font-mono text-sm text-muted">{policy.policyNumber}</p>
            </div>
            <StatusBadge status={policy.status} />
          </div>

          {/* Coverage details */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-ink">Coverage Details</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "Annual Premium", value: formatCurrency(policy.premium) },
                { label: "Monthly Premium", value: formatCurrency(policy.premium / 12) },
                { label: "Effective Date", value: formatDate(policy.effectiveDate) },
                { label: "Expiration Date", value: formatDate(policy.expirationDate) },
                { label: "Carrier", value: policy.carrierName },
                { label: "Coverage Type", value: policy.coverageType }
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <DigitalInsuranceCard policy={policy} />

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-ink">Need help?</h3>
            <p className="text-sm text-muted">
              Questions about your policy? Your Goosehead agent is ready to assist.
            </p>
            <Link
              href="/agent"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white hover:bg-pine-dark transition-colors"
            >
              Contact my agent
            </Link>
          </div>
        </aside>
      </div>

      <LilyChatWidget />
    </>
  );
}
