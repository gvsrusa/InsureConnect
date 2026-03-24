import PageShell from "@/components/layout/PageShell";

export default async function PartnerLayout({
  children
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  return (
    <PageShell variant="partner">
      {children}
    </PageShell>
  );
}
