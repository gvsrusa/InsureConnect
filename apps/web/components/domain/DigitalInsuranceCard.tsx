import type { Policy } from "@/lib/types";

interface DigitalInsuranceCardProps {
  policy: Policy;
  holderName?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit"
  });
}

export default function DigitalInsuranceCard({
  policy,
  holderName
}: DigitalInsuranceCardProps): React.JSX.Element {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pine to-pine-dark p-6 text-white shadow-soft"
      aria-label={`Digital insurance card for ${policy.policyNumber}`}
    >
      {/* Background watermark */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5"
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            InsureConnect
          </p>
          <p className="mt-1 text-sm font-medium text-white/80">
            {policy.coverageType} Insurance
          </p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {policy.status}
        </span>
      </div>

      {/* Policy number */}
      <p className="mt-5 font-mono text-xl font-bold tracking-widest">
        {policy.policyNumber}
      </p>

      {/* Footer row */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          {holderName && (
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              Insured
            </p>
          )}
          <p className="text-sm font-semibold">{holderName ?? "Policy Holder"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/50">Carrier</p>
          <p className="text-sm font-semibold">{policy.carrierName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/50">Expires</p>
          <p className="text-sm font-semibold">{formatDate(policy.expirationDate)}</p>
        </div>
      </div>
    </div>
  );
}
