"use client";

import Link from "next/link";
import {
  BarChart3Icon,
  ChevronLeftIcon,
  SaveIcon,
  FolderOpenIcon,
  ChevronDownIcon,
  LayoutDashboardIcon,
  CalculatorIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NouveauDossierDialog } from "@/components/app/nouveau-dossier-dialog";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** Dossier courant — absent sur le dashboard */
  dossier?: {
    id: string;
    nom: string;
    typeDossier: "CREATION" | "REPRISE";
  };
}

export default function AppHeader({ dossier }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      {/* Logo / retour landing */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden gap-1.5 text-muted-foreground sm:flex"
        )}
      >
        <ChevronLeftIcon className="size-4" />
        <BarChart3Icon className="size-4 text-primary" />
        <span className="font-semibold text-foreground">Previsia</span>
      </Link>

      <Separator orientation="vertical" className="hidden h-5 sm:block" />

      {dossier ? (
        /* ── Mode dossier : affiche le dossier courant + lien retour ── */
        <>
          <Link
            href="/app"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-muted-foreground"
            )}
            aria-label="Retour à mes dossiers"
          >
            <LayoutDashboardIcon className="size-4" />
            <span className="hidden sm:inline">Mes dossiers</span>
          </Link>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex min-w-0 items-center gap-2 px-1 text-sm">
            <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="max-w-48 truncate font-medium">{dossier.nom}</span>
            <Badge variant="outline" className="hidden shrink-0 text-xs sm:inline-flex">
              {dossier.typeDossier === "CREATION" ? "Création" : "Reprise"}
            </Badge>
          </div>
        </>
      ) : (
        /* ── Mode dashboard : titre simple ── */
        <div className="flex items-center gap-2 text-sm font-medium">
          <LayoutDashboardIcon className="size-4 text-muted-foreground" />
          <span>Mes dossiers</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Lien simulateur paie */}
      <Link
        href="/simulateur-paie"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden gap-1.5 text-muted-foreground sm:flex"
        )}
      >
        <CalculatorIcon className="size-4" />
        <span className="hidden lg:inline">Simulateur paie</span>
      </Link>

      <Separator orientation="vertical" className="hidden h-5 sm:block" />

      {/* Sélecteur d'hypothèse (visible seulement sur un dossier) */}
      {dossier && (
        <>
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted sm:flex"
            aria-label="Changer d'hypothèse"
          >
            <span className="text-muted-foreground">Hypothèse :</span>
            <span>Réaliste</span>
            <ChevronDownIcon className="size-3 text-muted-foreground" />
          </button>

          <Separator orientation="vertical" className="hidden h-5 sm:block" />
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <NouveauDossierDialog />
        <Separator orientation="vertical" className="mx-1 h-5" />
        {dossier && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Sauvegarder"
          >
            <SaveIcon className="size-4" />
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
