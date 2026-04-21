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
import { ColorThemeControl } from "../ui/color-theme-control";
import { HypotheseSelector } from "./hypothese/hypothese-selector";

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
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-accent-foreground bg-primary px-4">
      {/* Logo / retour landing */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden gap-1.5 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 sm:flex"
        )}
      >
        <ChevronLeftIcon className="size-4" />
        <BarChart3Icon className="size-4" />
        <span className="font-semibold">Previsia</span>
      </Link>

      {/* <Separator orientation="vertical" className="hidden h-5 sm:block dark:bg-accent-foreground" /> */}

      {dossier ? (
        /* ── Mode dossier : affiche le dossier courant + lien retour ── */
        <>
          <Link
            href="/previsionnel"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-primary-foreground"
            )}
            aria-label="Retour à mes dossiers"
          >
            <LayoutDashboardIcon className="size-4" />
            <span className="hidden sm:inline">Mes dossiers</span>
          </Link>

          {/* <Separator orientation="vertical" className="hidden h-5 sm:block dark:bg-accent-foreground" /> */}

          <div className="flex min-w-0 items-center gap-2 px-1 text-sm text-primary-foreground">
            <FolderOpenIcon className="size-4 shrink-0" />
            <span className="max-w-48 truncate font-medium">{dossier.nom}</span>
            <Badge variant="outline" className="hidden shrink-0 text-xs sm:inline-flex text-primary-foreground dark:border-accent-foreground">
              {dossier.typeDossier === "CREATION" ? "Création" : "Reprise"}
            </Badge>
          </div>
        </>
      ) : (
        /* ── Mode dashboard : titre simple ── */
        <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground">
          <LayoutDashboardIcon className="size-4" />
          <span>Mes dossiers</span>
        </div>
      )}

      {dossier?.id && <HypotheseSelector dossierId={dossier.id} />}
      

      {/* Spacer */}
      <div className="flex-1" />

      {/* Lien simulateur paie */}
      <Link
        href="/simulateur-paie"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden gap-1.5 sm:flex text-primary-foreground"
        )}
      >
        <CalculatorIcon className="size-4" />
        <span className="hidden lg:inline">Simulateur paie</span>
      </Link>

      {/* <Separator orientation="vertical" className="hidden h-5 sm:block dark:bg-accent-foreground" /> */}

      {/* Sélecteur d'hypothèse (visible seulement sur un dossier) */}
      {/* {dossier && (
        <>
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted sm:flex"
            aria-label="Changer d'hypothèse"
          >
            <span className="text-primary-foreground">Hypothèse :</span>
            <span className="text-primary-foreground">Réaliste</span>
            <ChevronDownIcon className="size-3 text-primary-foreground" />
          </button>

          <Separator orientation="vertical" className="hidden h-5 sm:block dark:bg-accent-foreground" />
        </>
      )} */}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <NouveauDossierDialog className="text-primary-foreground hover:text-accent-foreground dark:hover:bg-accent/50" />
        <ThemeToggle size="icon-sm" variant="outline" className="text-primary-foreground hover:text-accent-foreground dark:hover:bg-accent/50" />
        <ColorThemeControl size="icon-sm" variant="outline" className="text-primary-foreground hover:text-accent-foreground dark:hover:bg-accent/50" />
      </div>
    </header>
  );
}
