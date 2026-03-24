import TopNav from "./TopNav";

type NavVariant = "customer" | "agent" | "partner";

interface PageShellProps {
  variant: NavVariant;
  children: React.ReactNode;
  /** Optional full-width alert rendered just below the nav */
  alert?: React.ReactNode;
}

export default function PageShell({
  variant,
  children,
  alert
}: PageShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-cream">
      <TopNav variant={variant} />
      {alert}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
