"use client";

import Link from "next/link";
import { useState } from "react";

type RegisterRole = "CUSTOMER" | "AGENT" | "PARTNER_UNDERWRITER" | "PARTNER_VIEWER";

export default function RegisterPage(): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, roles: [role] })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setError(body.message ?? "Registration failed. Please try again.");
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Join InsureConnect to manage your insurance in one place
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-ink">
              Account type
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as RegisterRole)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="AGENT">Agent</option>
              <option value="PARTNER_UNDERWRITER">Partner Underwriter</option>
              <option value="PARTNER_VIEWER">Partner Viewer</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
              placeholder="Min. 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pine py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-pine hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
