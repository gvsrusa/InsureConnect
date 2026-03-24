import PolicyCard from "@/components/domain/PolicyCard";
import { ApiError, partnerApi } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { MOCK_POLICIES } from "@/lib/mock-data";
import type { Policy } from "@/lib/types";

export const metadata = { title: "Partner Policies — InsureConnect" };

export default async function PartnerPoliciesPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  let policies: Policy[] = MOCK_POLICIES;
  try {
    policies = await partnerApi.policies(token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.statusCode !== 404) {
      console.warn("Partner policies API unavailable, using mock data:", (err as Error).message);
    }
  }

  const activePolicies = policies.filter((policy) => policy.status === "ACTIVE");
  const inactivePolicies = policies.filter((policy) => policy.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Partner Policies</h1>
        <p className="mt-1 text-sm text-muted">
          Policies bound through partner-generated quote traffic.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Active ({activePolicies.length})
        </h2>
        <div className="space-y-3">
          {activePolicies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} showClientName />
          ))}
        </div>
      </section>

      {inactivePolicies.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Inactive ({inactivePolicies.length})
          </h2>
          <div className="space-y-3">
            {inactivePolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} showClientName />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
