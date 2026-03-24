"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BackBreadcrumbProps {
  listHref: string;
  listLabel: string;
  currentLabel: string;
}

/**
 * Shows a breadcrumb "← List › Current" ONLY when the user navigated
 * from the matching list page. Renders nothing if the user landed directly
 * via a typed/bookmarked URL.
 */
export default function BackBreadcrumb({
  listHref,
  listLabel,
  currentLabel
}: BackBreadcrumbProps): React.JSX.Element | null {
  const [cameFromList, setCameFromList] = useState(false);

  useEffect(() => {
    const referrer = document.referrer;
    if (!referrer) return;
    try {
      const ref = new URL(referrer);
      if (
        ref.origin === window.location.origin &&
        (ref.pathname === listHref || ref.pathname.startsWith(`${listHref}/`))
      ) {
        setCameFromList(true);
      }
    } catch {
      // invalid referrer URL — do nothing
    }
  }, [listHref]);

  if (!cameFromList) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 hover:text-pine transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 3L5 8L10 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {listLabel}
      </Link>
      <span aria-hidden="true">›</span>
      <span className="text-ink">{currentLabel}</span>
    </nav>
  );
}
