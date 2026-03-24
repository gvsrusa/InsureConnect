import { requireAuth } from "@/lib/auth";
import { portalApi, ApiError } from "@/lib/api";
import { MOCK_AGENT } from "@/lib/mock-data";
import AgentContactCard from "@/components/domain/AgentContactCard";
import LilyChatWidget from "@/components/domain/LilyChatWidget";
import type { Agent } from "@/lib/types";

export const metadata = { title: "My Agent — InsureConnect" };

export default async function CustomerAgentPage(): Promise<React.JSX.Element> {
  const token = await requireAuth("/login");

  // TODO: Remove fallback once GET /api/v1/portal/agent is confirmed working
  let agent: Agent = MOCK_AGENT;
  try {
    agent = await portalApi.agent(token);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode !== 404) {
      console.warn("Agent API unavailable, using mock data:", (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Your Goosehead Agent</h1>
        <p className="mt-1 text-sm text-muted">
          Your dedicated licensed insurance agent, here to guide every decision.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-1">
          <AgentContactCard agent={agent} />
        </div>

        {/* Why your agent matters */}
        <div className="sm:col-span-1 lg:col-span-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card h-full">
            <h2 className="font-semibold text-ink">What your agent does for you</h2>
            <ul className="mt-4 space-y-3">
              {[
                {
                  icon: "🔍",
                  title: "Shops multiple carriers",
                  desc: "Compares quotes from 4+ carriers so you always get the best rate."
                },
                {
                  icon: "📋",
                  title: "Handles paperwork",
                  desc: "From application to policy issuance — no forms, no faxes."
                },
                {
                  icon: "🔄",
                  title: "Annual renewals",
                  desc: "Proactively reviews your coverage every year before renewal."
                },
                {
                  icon: "🚨",
                  title: "Claims support",
                  desc: "Advocates for you when you file a claim with your carrier."
                }
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 text-xl">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <LilyChatWidget />
    </>
  );
}
