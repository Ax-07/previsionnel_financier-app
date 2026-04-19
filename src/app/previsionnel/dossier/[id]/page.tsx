import DossierWorkspace from "@/components/app/dossier-workspace";

export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DossierWorkspace dossierId={id} />;
}

