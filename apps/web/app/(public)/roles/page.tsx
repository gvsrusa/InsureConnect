"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Portal = "customer" | "agent" | "partner";
type MutableRole = "CUSTOMER" | "AGENT" | "PARTNER_UNDERWRITER" | "PARTNER_VIEWER";

type RolesResponse = {
  userId: string;
  email: string;
  roles: MutableRole[];
};

const ROLE_OPTIONS: Array<{ value: MutableRole; label: string }> = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "AGENT", label: "Agent" },
  { value: "PARTNER_UNDERWRITER", label: "Partner Underwriter" },
  { value: "PARTNER_VIEWER", label: "Partner Viewer" }
];

function defaultPortalPath(portal: Portal): string {
  if (portal === "agent") return "/agent/dashboard";
  if (portal === "partner") return "/partner/dashboard";
  return "/dashboard";
}

export default function RolesManagementPage(): React.JSX.Element {
  const [portal, setPortal] = useState<Portal>("customer");
  const [selectedRoles, setSelectedRoles] = useState<MutableRole[]>([]);
  const [current, setCurrent] = useState<RolesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedRoles), [selectedRoles]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/me/roles?portal=${portal}`, {
        cache: "no-store"
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Unable to fetch roles. Please sign in first.");
        setCurrent(null);
        setSelectedRoles([]);
        return;
      }

      const body = (await res.json()) as RolesResponse;
      setCurrent(body);
      setSelectedRoles(body.roles ?? []);
    } catch {
      setError("Network error while loading roles.");
    } finally {
      setLoading(false);
    }
  }, [portal]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  function toggleRole(role: MutableRole) {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  }

  async function mutateRoles(action: "add" | "remove") {
    if (selectedRoles.length === 0) {
      setError("Pick at least one role.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/me/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal, action, roles: selectedRoles })
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Role update failed.");
        return;
      }

      const body = (await res.json()) as RolesResponse;
      setCurrent(body);
      setSelectedRoles(body.roles ?? []);
    } catch {
      setError("Network error while updating roles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Manage My Roles</h1>
        <p className="mt-2 text-sm text-muted">
          Add or remove role assignments saved in the database for your signed-in account.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="portal" className="block text-sm font-medium text-ink">
              Active portal token
            </label>
            <select
              id="portal"
              value={portal}
              onChange={(e) => setPortal(e.target.value as Portal)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
            >
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void loadRoles()}
            disabled={loading}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh roles"}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {current && (
          <div className="mt-5 rounded-xl bg-cream px-4 py-3 text-sm text-ink">
            <p>
              <span className="font-semibold">Signed in as:</span> {current.email}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Current DB roles:</span> {current.roles.join(", ") || "None"}
            </p>
          </div>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink">Select roles</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(role.value)}
                  onChange={() => toggleRole(role.value)}
                  className="h-4 w-4 accent-[var(--color-pine)]"
                />
                {role.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void mutateRoles("add")}
            disabled={loading}
            className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            Add Selected Roles
          </button>
          <button
            type="button"
            onClick={() => void mutateRoles("remove")}
            disabled={loading}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Remove Selected Roles
          </button>
          <a
            href={defaultPortalPath(portal)}
            className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-pine hover:underline"
          >
            Back to portal
          </a>
        </div>
      </div>
    </div>
  );
}
