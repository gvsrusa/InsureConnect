"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type NavVariant = "customer" | "agent" | "partner";

interface RoleSwitcherProps {
  availableRoles: string[];
  currentVariant: NavVariant;
}

/** Maps a DB role string to display name and target URL */
const ROLE_CONFIG: Record<string, { label: string; url: string; variant: NavVariant }> = {
  CUSTOMER: { label: "Customer Portal", url: "/dashboard", variant: "customer" },
  AGENT: { label: "Agent Console", url: "/agent/dashboard", variant: "agent" },
  PARTNER_UNDERWRITER: { label: "Partner Portal", url: "/partner/dashboard", variant: "partner" },
  PARTNER_VIEWER: { label: "Partner Portal", url: "/partner/dashboard", variant: "partner" }
};

/** Maps a NavVariant back to a role string for "current role" detection */
const VARIANT_TO_ROLE: Record<NavVariant, string[]> = {
  customer: ["CUSTOMER"],
  agent: ["AGENT"],
  partner: ["PARTNER_UNDERWRITER", "PARTNER_VIEWER"]
};

export default function RoleSwitcher({
  availableRoles,
  currentVariant
}: RoleSwitcherProps): React.JSX.Element | null {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Roles that are available AND not the current portal
  const currentRoles = VARIANT_TO_ROLE[currentVariant];
  const switchableRoles = availableRoles.filter((r) => {
    const config = ROLE_CONFIG[r];
    return config && !currentRoles.includes(r);
  });

  // Deduplicate by target URL (e.g. PARTNER_UNDERWRITER and PARTNER_VIEWER both → /partner/dashboard)
  const seen = new Set<string>();
  const uniqueSwitchableRoles = switchableRoles.filter((r) => {
    const url = ROLE_CONFIG[r]?.url;
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    setMounted(true);
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (uniqueSwitchableRoles.length === 0) return null;

  function handleRoleClick(role: string) {
    setDropdownOpen(false);
    setPendingRole(role);
  }

  function handleConfirm() {
    if (!pendingRole) return;
    const config = ROLE_CONFIG[pendingRole];
    if (config) {
      window.open(config.url, "_blank", "noopener,noreferrer");
    }
    setPendingRole(null);
  }

  function handleCancel() {
    setPendingRole(null);
  }

  const pendingConfig = pendingRole ? ROLE_CONFIG[pendingRole] : null;

  return (
    <>
      {/* Role switcher dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-gray-100 hover:text-ink sm:gap-1.5 sm:px-3 sm:text-sm"
          aria-label="Switch role"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M11 10l2 2-2 2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">Switch role</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
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

        {dropdownOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
            {uniqueSwitchableRoles.map((role) => {
              const config = ROLE_CONFIG[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleClick(role)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-gray-50 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    className="shrink-0 text-pine"
                  >
                    <path
                      d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <circle cx="7" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  {config?.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {mounted && pendingConfig
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-switch-title"
            >
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <h2 id="role-switch-title" className="text-base font-semibold text-ink">
                  Switch to {pendingConfig.label}?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {pendingConfig.label} will open in a new tab. You can return to this
                  portal any time.
                </p>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-gray-100 hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-dark transition-colors"
                  >
                    Open in new tab
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
