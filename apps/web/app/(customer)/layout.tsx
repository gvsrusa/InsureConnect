import { headers } from "next/headers";
import PageShell from "@/components/layout/PageShell";

export default async function CustomerLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/dashboard";

  return (
    <PageShell variant="customer" currentPath={pathname}>
      {children}
    </PageShell>
  );
}
