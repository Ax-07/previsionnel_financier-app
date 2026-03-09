import type { Metadata } from "next";
import AppHeader from "@/components/app/app-header";

export const metadata: Metadata = {
  title: "Simulateur de fiche de paie 2026 | Previsia",
  description:
    "Simulez un bulletin de paie 2026 : calcul des cotisations, RGDU, net à payer, coût employeur. Paramètres réglementaires mis à jour.",
};

export default function SimulateurPaieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
