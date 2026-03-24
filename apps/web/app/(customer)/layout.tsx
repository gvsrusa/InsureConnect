import PageShell from "@/components/layout/PageShell";

export default async function CustomerLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  return (
    <PageShell variant="customer">
      {children}
    </PageShell>
  );
}
