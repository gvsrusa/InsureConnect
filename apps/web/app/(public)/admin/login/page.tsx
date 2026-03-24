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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-16 sm:px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 right-10 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin Portal</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Secure Access</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with an admin account to manage roles and audit logs.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-200">
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
              className="mt-1 block w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-200">
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
              className="mt-1 block w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          Not an admin?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Go to standard login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-slate-950" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
