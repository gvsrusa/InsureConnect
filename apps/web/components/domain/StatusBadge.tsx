import type { PolicyStatus, QuoteStatus } from "@/lib/types";

type AnyStatus = PolicyStatus | QuoteStatus | "ONLINE" | "OFFLINE";

const STATUS_STYLES: Record<AnyStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  EXPIRED: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  ONLINE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  OFFLINE: "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export default function StatusBadge({
  status,
  className = ""
}: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500",
        className
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          status === "ACTIVE" || status === "COMPLETED" || status === "ONLINE"
            ? "bg-emerald-500"
            : status === "PENDING"
              ? "bg-amber-500"
              : status === "CANCELLED" || status === "FAILED"
                ? "bg-red-500"
                : "bg-gray-400"
        ].join(" ")}
        aria-hidden
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
