"use client";

import { useEffect, useRef, useState } from "react";

type NavVariant = "customer" | "agent" | "partner";

interface AccountMenuProps {
  currentVariant: NavVariant;
  displayName: string;
  email: string;
  availableRoles: string[];
}

const ROLE_CONFIG: Record<string, { label: string; url: string; variant: NavVariant }> = {
  CUSTOMER: { label: "Customer Portal", url: "/dashboard", variant: "customer" },
  AGENT: { label: "Agent Console", url: "/agent/dashboard", variant: "agent" },
  PARTNER_UNDERWRITER: { label: "Partner Portal", url: "/partner/dashboard", variant: "partner" },
  PARTNER_VIEWER: { label: "Partner Portal", url: "/partner/dashboard", variant: "partner" }
};

const VARIANT_LABEL: Record<NavVariant, string> = {
  customer: "Customer",
  agent: "Agent",
  partner: "Partner"
};

const VARIANT_TO_ROLE: Record<NavVariant, string[]> = {
  customer: ["CUSTOMER"],
  agent: ["AGENT"],
  partner: ["PARTNER_UNDERWRITER", "PARTNER_VIEWER"]
};

function initialsForName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "U";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? "U";

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";
  return `${first}${second}`.toUpperCase() || "U";
}

export default function AccountMenu({
  currentVariant,
  displayName,
  email,
  availableRoles
}: AccountMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRoles = VARIANT_TO_ROLE[currentVariant];
  const switchableRoles = availableRoles.filter((role) => {
    const config = ROLE_CONFIG[role];
    return Boolean(config && !currentRoles.includes(role));
  });

  const seenUrls = new Set<string>();
  const uniqueSwitchableRoles = switchableRoles.filter((role) => {
    const url = ROLE_CONFIG[role]?.url;
    if (!url || seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  function onSwitchRole(role: string): void {
    const config = ROLE_CONFIG[role];
    if (!config) return;

    setOpen(false);
    window.open(config.url, "_blank", "noopener,noreferrer");
  }

  const initials = initialsForName(displayName);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-100 sm:px-3"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-pine text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[180px] truncate text-xs font-semibold text-ink">
            {displayName}
          </span>
          <span className="block text-[11px] font-medium text-muted">{VARIANT_LABEL[currentVariant]}</span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-lg"
        >
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="truncate text-sm font-semibold text-ink">{displayName}</div>
            <div className="truncate text-xs text-muted">{email}</div>
            <div className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-pine">
              Role: {VARIANT_LABEL[currentVariant]}
            </div>
          </div>

          {uniqueSwitchableRoles.length > 0 && (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Switch role
              </p>
              {uniqueSwitchableRoles.map((role) => {
                const config = ROLE_CONFIG[role];
                return (
                  <button
                    key={role}
                    type="button"
                    role="menuitem"
                    onClick={() => onSwitchRole(role)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-gray-50"
                  >
                    <span>{config?.label}</span>
                    <span className="text-xs text-muted">Open</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 border-t border-[var(--color-border)] pt-2">
            <form action={`/api/auth/logout?portal=${currentVariant}`} method="POST">
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-gray-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
