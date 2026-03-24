import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant multi-carrier quotes",
    desc: "Fan-out to State Farm, Geico, Progressive & Clearcover in under 2 seconds via a single API call."
  },
  {
    icon: "🔗",
    title: "One-click policy binding",
    desc: "No more faxed forms. Submit a bind request and receive a policy number in real time."
  },
  {
    icon: "🤝",
    title: "Seamless agent handoff",
    desc: "Every quote link routes the client to a licensed Goosehead agent — the right one, automatically."
  },
  {
    icon: "📊",
    title: "Partner analytics dashboard",
    desc: "Track quote volume, bind rate, and API latency across all your integration partners."
  }
];

const STATS = [
  { label: "Carriers connected", value: "4+" },
  { label: "Avg quote response", value: "<2s" },
  { label: "Partner integrations", value: "14" },
  { label: "Policies bound 2024", value: "1,200+" }
];

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-pine">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect width="28" height="28" rx="7" fill="var(--color-pine)" />
              <path
                d="M14 5L21 9V15C21 19.1421 17.4183 22.5 14 23C10.5817 22.5 7 19.1421 7 15V9L14 5Z"
                fill="white"
              />
            </svg>
            <span className="text-sm font-semibold tracking-tight">InsureConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-pine px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pine">
            Insurance API Platform
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
            Faster quote intake.{" "}
            <span className="text-pine">Cleaner policy handoff.</span>
          </h1>
          <p className="mt-5 text-lg text-muted text-balance">
            InsureConnect is the API middleware that lets lenders, real-estate platforms, and SaaS
            tools embed insurance quoting directly into their workflow — powered by Goosehead agents.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-pine px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-pine-dark"
            >
              Start free trial
            </Link>
            <Link
              href="/quotes?quoteRequestId=demo"
              className="rounded-xl border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-ink transition-shadow hover:shadow-card"
            >
              View demo quote ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--color-border)] bg-white py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-6 py-4">
              <span className="text-3xl font-bold text-pine">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          Everything your integration needs
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-pine to-pine-dark p-10 text-white shadow-soft">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to integrate?</h2>
          <p className="mt-3 text-white/75">
            Get your API key in minutes. No long-term contracts.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-xl bg-white px-8 py-3 text-sm font-bold text-pine transition-opacity hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}