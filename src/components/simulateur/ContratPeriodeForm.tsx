"use client";

/**
 * Formulaire de saisie de la période de contrat pour la simulation multi-mois.
 *
 * - CDD : dates de début et fin libres, choix des CP pris.
 * - CDI : seule la date de début est saisie, simulation automatique sur 12 mois.
 */

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDaysIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { decomposerPeriode } from "@/lib/paie/contrat/date-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ContratPeriodeFormProps {
  /** Callback de lancement de la simulation */
  onSimulate: (dateDebut: string, dateFin: string, joursCPPris: number) => void;
  /** Type de contrat (CDI = 12 mois auto, autres = dates libres) */
  typeContrat: string;
  /** Simulation en cours */
  loading?: boolean;
  /** Erreur éventuelle */
  error?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Calcule la date de fin = dateDebut + N mois - 1 jour (dernier jour du 12ème mois) */
function calcDateFinCDI(dateDebut: string, nbMois = 12): string {
  const d = new Date(dateDebut);
  d.setMonth(d.getMonth() + nbMois);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

export function ContratPeriodeForm({
  onSimulate,
  typeContrat,
  loading = false,
  error,
}: ContratPeriodeFormProps) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [joursCPPris, setJoursCPPris] = useState(0);

  const estCDI = typeContrat === "CDI";

  // Pour un CDI, la date de fin est calculée automatiquement (12 mois)
  const dateFinEffective = estCDI
    ? (dateDebut ? calcDateFinCDI(dateDebut) : "")
    : dateFin;

  // Validation locale
  const isValid = dateDebut.length > 0
    && dateFinEffective.length > 0
    && dateDebut <= dateFinEffective;
  const nbMois = useMemo(
    () => (isValid ? decomposerPeriode(dateDebut, dateFinEffective).length : 0),
    [isValid, dateDebut, dateFinEffective],
  );

  // Max CP théoriques (2.5 jours par mois)
  const maxCPTheorique = Math.floor(nbMois * 2.5);

  // Limite raisonnable : max 60 mois (5 ans)
  const tropLong = nbMois > 60;

  function handleLaunch() {
    if (!isValid || tropLong || loading) return;
    onSimulate(dateDebut, dateFinEffective, estCDI ? 0 : joursCPPris);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <CalendarDaysIcon className="size-4" />
        {estCDI ? "Projection annuelle CDI" : "Période de contrat CDD"}
      </div>

      {estCDI ? (
        /* ── CDI : date de début uniquement ── */
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contrat-debut">Date de début du contrat</Label>
          <Input
            id="contrat-debut"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            aria-label="Date de début du contrat"
          />
          {dateDebut && (
            <p className="text-xs text-muted-foreground">
              {"Simulation sur 12 mois jusqu'au "}
              <strong>{new Date(dateFinEffective).toLocaleDateString("fr-FR")}</strong>
            </p>
          )}
        </div>
      ) : (
        /* ── CDD : dates de début et fin ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contrat-debut">Date de début</Label>
            <Input
              id="contrat-debut"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              aria-label="Date de début du contrat"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contrat-fin">Date de fin</Label>
            <Input
              id="contrat-fin"
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              min={dateDebut || undefined}
              aria-label="Date de fin du contrat"
            />
          </div>
        </div>
      )}

      {/* Indicateur durée */}
      {isValid && !estCDI && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={tropLong ? "destructive" : "secondary"}>
            {nbMois} mois
          </Badge>
          {tropLong && (
            <span className="text-destructive text-xs">
              Maximum 60 mois (5 ans)
            </span>
          )}
        </div>
      )}

      {/* Congés payés pris (CDD uniquement) */}
      {!estCDI && isValid && !tropLong && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contrat-cp-pris">Jours de congés payés pris</Label>
          <div className="flex items-center gap-3">
            <Input
              id="contrat-cp-pris"
              type="number"
              min={0}
              max={maxCPTheorique}
              step={0.5}
              value={joursCPPris}
              onChange={(e) => setJoursCPPris(Math.max(0, Number(e.target.value)))}
              className="w-24"
              aria-label="Nombre de jours de congés payés pris"
            />
            <span className="text-xs text-muted-foreground">
              / {maxCPTheorique} j max théorique ({nbMois} mois × 2,5 j)
            </span>
          </div>
          {joursCPPris > 0 && (
            <p className="text-xs text-muted-foreground">
              {"L'indemnité CP sera ajoutée au brut du dernier mois et soumise à cotisations."}
            </p>
          )}
        </div>
      )}

      {/* Erreur de validation (CDD uniquement) */}
      {!estCDI && dateDebut && dateFin && dateDebut > dateFin && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircleIcon className="size-3" />
          La date de fin doit être postérieure à la date de début.
        </p>
      )}

      {/* Erreur de calcul */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bouton simulation */}
      <Button
        type="button"
        onClick={handleLaunch}
        disabled={!isValid || tropLong || loading}
        className="w-full sm:w-auto"
      >
        <PlayIcon className="mr-2 size-4" />
        {loading
          ? "Simulation en cours…"
          : estCDI
            ? "Simuler 12 mois"
            : "Simuler la période"}
      </Button>
    </div>
  );
}
