"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function normalizeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/admin/roles";
  }

  return value;
}

function AdminLoginForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = normalizeRedirectPath(searchParams.get("redirect"));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "admin" })
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Invalid admin credentials.");
        return;
      }

      window.location.href = redirectTo;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Use your admin account to manage users, roles, and audit history.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-ink">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-pine focus:ring-1 focus:ring-pine"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-pine focus:ring-1 focus:ring-pine"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pine py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Need regular access?{" "}
          <Link href="/login" className="font-semibold text-pine hover:underline">
            Go to standard login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="w-full max-w-sm" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
