import { requireAuth } from "@/lib/auth";
import { agentApi, ApiError } from "@/lib/api";
import { MOCK_POLICIES } from "@/lib/mock-data";
import PolicyCard from "@/components/domain/PolicyCard";
import type { Policy } from "@/lib/types";

export const metadata = { title: "Policies — Agent Console" };

export default async function AgentPoliciesPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: GET /api/v1/agent/policies — wire real data when endpoint returns 200
  let policies: Policy[] = MOCK_POLICIES;
  try {
    policies = await agentApi.policies(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Agent policies API unavailable, using mock:", (err as Error).message);
    }
  }

  const active = policies.filter((p) => p.status === "ACTIVE");
  const cancelled = policies.filter((p) => p.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">All Policies</h1>
        <p className="mt-1 text-sm text-muted">
          {policies.length} total · {active.length} active
        </p>
      </div>

      {active.length > 0 && (
        <section aria-labelledby="active-policies">
          <h2
            id="active-policies"
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted"
          >
            Active ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((p) => (
              <PolicyCard key={p.id} policy={p} showClientName />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section aria-labelledby="inactive-policies">
          <h2
            id="inactive-policies"
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted"
          >
            Inactive ({cancelled.length})
          </h2>
          <div className="space-y-3">
            {cancelled.map((p) => (
              <PolicyCard key={p.id} policy={p} showClientName />
            ))}
          </div>
        </section>
      )}

      {policies.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-14 text-center text-sm text-muted">
          No policies to display.
        </div>
      )}
    </div>
  );
}
