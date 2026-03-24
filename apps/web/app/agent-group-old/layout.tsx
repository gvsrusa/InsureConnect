import PageShell from "@/components/layout/PageShell";

export default async function AgentLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  return (
    <PageShell variant="agent">
      {children}
    </PageShell>
  );
}
