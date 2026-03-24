import { requireAuth } from "@/lib/auth";
import { portalApi, ApiError } from "@/lib/api";
import { MOCK_POLICIES } from "@/lib/mock-data";
import PolicyCard from "@/components/domain/PolicyCard";
import LilyChatWidget from "@/components/domain/LilyChatWidget";
import type { Policy } from "@/lib/types";

export const metadata = { title: "My Policies — InsureConnect" };

export default async function CustomerPoliciesPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: Remove fallback once GET /api/v1/portal/policies is confirmed working
  let policies: Policy[] = MOCK_POLICIES;
  try {
    policies = await portalApi.policies(token);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode !== 404) {
      console.warn("Policies API unavailable, using mock data:", (err as Error).message);
    }
  }

  const active = policies.filter((p) => p.status === "ACTIVE");
  const inactive = policies.filter((p) => p.status !== "ACTIVE");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Policies</h1>
          <p className="mt-1 text-sm text-muted">
            {active.length} active · {inactive.length} inactive
          </p>
        </div>
        <a
          href="/quotes"
          className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-dark transition-colors"
        >
          + Get a quote
        </a>
      </div>

      {active.length > 0 && (
        <section className="mb-8" aria-labelledby="active-heading">
          <h2 id="active-heading" className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
            Active
          </h2>
          <div className="space-y-3">
            {active.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section aria-labelledby="inactive-heading">
          <h2 id="inactive-heading" className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
            Inactive
          </h2>
          <div className="space-y-3">
            {inactive.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>
        </section>
      )}

      {policies.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <p className="text-lg font-semibold text-ink">No policies yet</p>
          <p className="mt-1 text-sm text-muted">
            Start by getting a quote from your agent link.
          </p>
        </div>
      )}

      <LilyChatWidget />
    </>
  );
}
