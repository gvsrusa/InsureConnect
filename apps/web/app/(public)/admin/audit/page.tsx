"use client";

import { useState } from "react";

type AuditLog = {
  id: string;
  actor: { id: string; email: string };
  target: { id: string; email: string };
  action: "ADD" | "REMOVE";
  roles: string[];
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
};

export default function AdminAuditPage(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [limit, setLimit] = useState(50);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAuditLogs() {
    setError("");
    setLoading(true);

    try {
      const query = new URLSearchParams({
        portal: "admin",
        limit: String(limit)
      });
      if (email) {
        query.set("email", email);
      }

      const res = await fetch(`/api/auth/admin/role-audit?${query.toString()}`, {
        cache: "no-store"
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Unable to load role audit history.");
        setLogs([]);
        return;
      }

      const body = (await res.json()) as AuditResponse;
      setLogs(body.logs ?? []);
    } catch {
      setError("Network error while loading role audit history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Admin: Role Audit History</h1>
        <p className="mt-2 text-sm text-muted">
          View who changed roles, what changed, and when.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Filter by target email (optional)
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

          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-ink">
              Max rows
            </label>
            <input
              id="limit"
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value || 50))}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadAuditLogs()}
            disabled={loading}
            className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load audit history"}
          </button>
          <a href="/admin/roles" className="rounded-xl px-4 py-2 text-sm font-semibold text-pine hover:underline">
            Back to role manager
          </a>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-cream text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white text-ink">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted" colSpan={5}>
                    No audit records loaded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{log.actor.email}</td>
                    <td className="px-3 py-2">{log.target.email}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2">{log.roles.join(", ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
