import type { Agent } from "@/lib/types";

interface AgentContactCardProps {
  agent: Agent;
}

export default function AgentContactCard({
  agent
}: AgentContactCardProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-card">
      {/* Header bar */}
      <div className="bg-pine-dark px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Your Goosehead Agent
        </p>
        <p className="mt-1 text-sm font-medium text-white/90">
          Licensed in your state
        </p>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine/10 text-xl font-bold text-pine">
              {agent.name.charAt(0)}
            </div>
            {agent.isOnline && (
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"
                title="Online"
                aria-label="Agent is online"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink">{agent.name}</p>
            {agent.bio && (
              <p className="mt-0.5 text-xs text-muted line-clamp-2">{agent.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {agent.rating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  ★ {agent.rating}
                </span>
              )}
              {agent.policiesManaged && (
                <span className="inline-flex items-center rounded-full bg-pine/8 px-2.5 py-0.5 text-xs font-medium text-pine">
                  {agent.policiesManaged} policies
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center gap-2 text-sm text-muted hover:text-pine transition-colors"
          >
            <span aria-hidden className="text-base">✉</span>
            {agent.email}
          </a>
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-2 text-sm text-muted hover:text-pine transition-colors"
            >
              <span aria-hidden className="text-base">📞</span>
              {agent.phone}
            </a>
          )}
        </div>

        {/* CTA */}
        <a
          href={`mailto:${agent.email}`}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-pine-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine"
        >
          Send Message
        </a>
      </div>
    </div>
  );
}
