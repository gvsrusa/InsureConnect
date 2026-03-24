"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setError(body.message ?? "Invalid email or password.");
        return;
      }

      // Redirect based on role stored in JWT (server reads cookie from Set-Cookie header)
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your InsureConnect account</p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-pine focus:ring-1 focus:ring-pine"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-pine focus:ring-1 focus:ring-pine"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pine py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-pine hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
