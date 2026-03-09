import { notFound } from "next/navigation";
import AppHeader from "@/components/app/app-header";
import { fetchDossierById } from "@/app/actions/dossier";

interface DossierLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function DossierLayout({
  children,
  params,
}: DossierLayoutProps) {
  const { id } = await params;
  const dossier = await fetchDossierById(id);

  if (!dossier) notFound();

  return (
    <>
      <AppHeader
        dossier={{
          id: dossier.id,
          nom: dossier.nom,
          typeDossier: dossier.typeDossier,
        }}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </>
  );
}
