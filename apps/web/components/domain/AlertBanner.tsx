"use client";

import { useState } from "react";

interface AlertBannerProps {
  message: string;
  type?: "info" | "warning" | "success" | "error";
  /** URL to follow when clicking the CTA */
  ctaHref?: string;
  ctaLabel?: string;
  dismissible?: boolean;
}

const TYPE_STYLES = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-300 text-amber-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800"
};

const ICON: Record<string, string> = {
  info: "ℹ",
  warning: "⚠",
  success: "✓",
  error: "✕"
};

export default function AlertBanner({
  message,
  type = "info",
  ctaHref,
  ctaLabel,
  dismissible = true
}: AlertBannerProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={[
        "flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm",
        TYPE_STYLES[type]
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base font-bold">
          {ICON[type]}
        </span>
        <span>{message}</span>
        {ctaHref && ctaLabel && (
          <a
            href={ctaHref}
            className="ml-2 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {ctaLabel}
          </a>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
