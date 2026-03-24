interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional small description below the value */
  subtext?: string;
  /** Percent change – positive = green, negative = red */
  trend?: number;
  /** Icon as a string emoji or text glyph */
  icon?: string;
}

export default function StatCard({
  label,
  value,
  subtext,
  trend,
  icon
}: StatCardProps): React.JSX.Element {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          {label}
        </span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine/8 text-lg"
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
        {subtext && <p className="text-xs text-muted">{subtext}</p>}
      </div>

      {trend !== undefined && (
        <p
          className={[
            "flex items-center gap-1 text-xs font-semibold",
            trendPositive ? "text-emerald-600" : "text-red-500"
          ].join(" ")}
        >
          <span aria-hidden>{trendPositive ? "↑" : "↓"}</span>
          {Math.abs(trend)}% vs last month
        </p>
      )}
    </article>
  );
}
