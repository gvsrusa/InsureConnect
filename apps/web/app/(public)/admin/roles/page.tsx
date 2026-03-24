"use client";

import { useState } from "react";

type Portal = "customer" | "agent" | "partner";
type MutableRole = "CUSTOMER" | "AGENT" | "PARTNER_UNDERWRITER" | "PARTNER_VIEWER";

type UserRolesResponse = {
  email: string;
  roles: MutableRole[];
};

const ROLE_OPTIONS: Array<{ value: MutableRole; label: string }> = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "AGENT", label: "Agent" },
  { value: "PARTNER_UNDERWRITER", label: "Partner Underwriter" },
  { value: "PARTNER_VIEWER", label: "Partner Viewer" }
];

export default function AdminRolesPage(): React.JSX.Element {
  const [portal, setPortal] = useState<Portal>("customer");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<MutableRole[]>([]);
  const [result, setResult] = useState<UserRolesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRoleSet = new Set(selectedRoles);

  function toggleRole(role: MutableRole) {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  }

  async function lookupByEmail() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/auth/admin/user-roles?portal=${portal}&email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Unable to load user roles.");
        setResult(null);
        return;
      }

      const body = (await res.json()) as UserRolesResponse;
      setResult(body);
      setSelectedRoles(body.roles ?? []);
    } catch {
      setError("Network error while loading user roles.");
    } finally {
      setLoading(false);
    }
  }

  async function mutateUserRoles(action: "add" | "remove") {
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Select at least one role.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal,
          email,
          action,
          roles: selectedRoles
        })
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Unable to update user roles.");
        return;
      }

      const body = (await res.json()) as UserRolesResponse;
      setResult(body);
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
        <h1 className="text-2xl font-bold text-ink">Admin: Manage User Roles</h1>
        <p className="mt-2 text-sm text-muted">
          Manage role assignments for any user by email. This page requires an ADMIN token.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="portal" className="block text-sm font-medium text-ink">
              Admin portal token
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              User email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void lookupByEmail()}
            disabled={loading || !email}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Lookup user"}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-xl bg-cream px-4 py-3 text-sm text-ink">
            <p>
              <span className="font-semibold">User:</span> {result.email}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Current DB roles:</span> {result.roles.join(", ") || "None"}
            </p>
          </div>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink">Roles to apply</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  checked={selectedRoleSet.has(role.value)}
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
            onClick={() => void mutateUserRoles("add")}
            disabled={loading}
            className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            Add selected roles
          </button>
          <button
            type="button"
            onClick={() => void mutateUserRoles("remove")}
            disabled={loading}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Remove selected roles
          </button>
          <a
            href="/admin/audit"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-pine hover:underline"
          >
            View audit history
          </a>
        </div>
      </div>
    </div>
  );
}
