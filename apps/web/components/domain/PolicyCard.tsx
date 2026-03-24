import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { Policy } from "@/lib/types";

interface PolicyCardProps {
  policy: Policy;
  showClientName?: boolean;
  portalPrefix?: string;

}
const CARRIER_COLORS: Record<string, string> = {
  "State Farm": "bg-red-50 text-red-700",
  Progressive: "bg-blue-50 text-blue-700",
  Geico: "bg-emerald-50 text-emerald-700",
  Clearcover: "bg-violet-50 text-violet-700"
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents);
}

export default function PolicyCard({
  policy,
  showClientName = false,
  portalPrefix = ""
}: PolicyCardProps): React.JSX.Element {
  const carrierStyle =
    CARRIER_COLORS[policy.carrierName] ?? "bg-gray-100 text-gray-600";

  return (
    <Link
      href={`${portalPrefix}/policies/${policy.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              carrierStyle
            ].join(" ")}
          >
            {policy.carrierName}
          </span>
          <p className="font-semibold text-ink group-hover:text-pine transition-colors">
            {policy.coverageType} Insurance
          </p>
          <p className="text-xs text-muted font-mono">{policy.policyNumber}</p>
          {showClientName && policy.clientName && (
            <p className="text-xs text-muted">{policy.clientName}</p>
          )}
        </div>
        <StatusBadge status={policy.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Premium</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatCurrency(policy.premium)}<span className="text-xs font-normal text-muted">/yr</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Effective</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{formatDate(policy.effectiveDate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Expires</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{formatDate(policy.expirationDate)}</p>
        </div>
      </div>
    </Link>
  );
}
