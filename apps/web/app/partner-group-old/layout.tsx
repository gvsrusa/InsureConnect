import { headers } from "next/headers";
import PageShell from "@/components/layout/PageShell";

export default async function PartnerLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/partner/dashboard";

  return (
    <PageShell variant="partner" currentPath={pathname}>
      {children}
    </PageShell>
  );
}
