import { headers } from "next/headers";
import PageShell from "@/components/layout/PageShell";

export default async function AgentLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/agent/dashboard";

  return (
    <PageShell variant="agent" currentPath={pathname}>
      {children}
    </PageShell>
  );
}
