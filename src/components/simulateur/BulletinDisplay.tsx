"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatEur } from "@/lib/format";
import { CotisationLine, CotisationTableHeader } from "./CotisationLine";
import type { LigneCotisation, SimulationInput, SimulationResultat, FamilleCotisation } from "@/lib/paie/types";
import { CONVENTION_CATALOG } from "@/lib/paie/conventions/catalog";
import { calcBrutDetails, GROUPES } from "./bulletin-helpers";

// ─────────────────────────────────────────────────────────────────────────────
// BulletinDisplay
// ─────────────────────────────────────────────────────────────────────────────

interface BulletinDisplayProps {
  resultat: SimulationResultat;
  input: SimulationInput;
}

export function BulletinDisplay({ resultat, input }: BulletinDisplayProps) {
  const { lignes } = resultat;
  const sal = input.salarié;

  // ── Convention collective ─────────────────────────────────────────────────
  const convMeta = sal.conventionCode
    ? CONVENTION_CATALOG.get(sal.conventionCode)
    : undefined;

  // ── Composition du brut ───────────────────────────────────────────────────
  const {
    salaireBase, heuresNormales, tauxHoraire, nbHeuresSup,
    montantHS, tauxMajoration, primes, avantages, absences, aDesExtras,
  } = calcBrutDetails(input, resultat);

  // ── Cotisations ───────────────────────────────────────────────────────────
  const lignesReduction = lignes.filter(
    (l) => l.famille === "rgdu" || l.famille === "exoneration"
  );
  const lignesStandard = lignes.filter(
    (l) => l.famille !== "rgdu" && l.famille !== "exoneration"
  );
  const parFamille = new Map<FamilleCotisation, LigneCotisation[]>();
  for (const ligne of lignesStandard) {
    if (!parFamille.has(ligne.famille)) parFamille.set(ligne.famille, []);
    parFamille.get(ligne.famille)!.push(ligne);
  }

  // ── Totaux ────────────────────────────────────────────────────────────────
  const totalSal = resultat.totalCotisationsSalariales;
  // totalCotisationsPatronales exclut le RGDU — on retranche la réduction pour
  // afficher le coût patronal net effectif.
  const totalPatNet = resultat.totalCotisationsPatronales - resultat.montantRGDU;

  return (
    <div className="flex flex-col gap-0 text-sm overflow-x-auto">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div>
          <p className="font-semibold">Bulletin de simulation</p>
          <p className="text-xs text-muted-foreground">
            Paramètres 2026 — Régime général
            {convMeta && (
              <> — <span className="text-foreground font-medium">CCN IDCC {sal.conventionCode} — {convMeta.label}</span>
                {convMeta.statut === "partial" && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400" title="Implémentation partielle">●</span>
                )}
              </>
            )}
          </p>
        </div>
        <Badge variant="secondary">
          {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())}
        </Badge>
      </div>

      {/* ── SECTION 1 : Composition du brut ── */}
      <div className="rounded-md border bg-muted/30 mx-1 mb-3 overflow-hidden">
        <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
          Composition du brut
        </p>

        <BrutRow
          label="Salaire de base"
          detail={`${heuresNormales.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h × ${formatEur(tauxHoraire)}/h`}
          montant={salaireBase}
        />

        {resultat.heuresSupLignes && resultat.heuresSupLignes.length > 0
          ? resultat.heuresSupLignes.map((ligne) => (
              <BrutRow
                key={ligne.label}
                label={ligne.label}
                detail={`${ligne.heures.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h × ${(100 + ligne.tauxMajoration * 100).toFixed(0)} % × ${formatEur(tauxHoraire)}/h`}
                montant={ligne.montant}
                extra
              />
            ))
          : nbHeuresSup > 0 && (
              <BrutRow
                label="Heures supplémentaires"
                detail={`${nbHeuresSup.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h × ${(100 + tauxMajoration * 100).toFixed(1)} % × ${formatEur(tauxHoraire)}/h`}
                montant={montantHS}
                extra
              />
            )
        }

        {primes > 0 && (
          <BrutRow label="Primes soumises" montant={primes} extra />
        )}

        {avantages > 0 && (
          <BrutRow label="Avantages en nature" montant={avantages} extra />
        )}

        {absences > 0 && (
          <BrutRow label="Absences non rémunérées" montant={-absences} extra />
        )}

        <div className={`grid grid-cols-[1fr_auto] items-center gap-x-4 ${aDesExtras ? "border-t" : ""} bg-background px-3 py-2`}>
          <span className="font-semibold">Brut soumis à cotisations</span>
          <span className="w-28 text-right font-mono font-semibold">
            {formatEur(resultat.brutSoumis)}
          </span>
        </div>
      </div>

      {/* ── SECTION 2 : Bases de référence ── */}
      <div className="mx-1 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide text-[10px]">Bases</span>
        <BaseChip label="PMSS" value={formatEur(resultat.pmssProratise)} />
        <span className="text-border">·</span>
        <BaseChip label="Assiette CSG" value={formatEur(resultat.assietteCsg)} />
        <span className="text-border">·</span>
        <BaseChip label="T1 Agirc-Arrco" value={formatEur(resultat.baseT1)} />
        {resultat.baseT2 > 0 && (
          <>
            <span className="text-border">·</span>
            <BaseChip label="T2 Agirc-Arrco" value={formatEur(resultat.baseT2)} />
          </>
        )}
      </div>

      {/* ── SECTION 3 : Cotisations ── */}
      <CotisationTableHeader />

      {GROUPES.map(({ label, familles }) => {
        const lignesGroupe = familles.flatMap((f) => parFamille.get(f) ?? []);
        if (lignesGroupe.length === 0) return null;
        return (
          <div key={label}>
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
              {label}
            </p>
            {lignesGroupe.map((l) => (
              <CotisationLine key={l.code} ligne={l} />
            ))}
          </div>
        );
      })}

      {/* Réductions / exonérations */}
      {lignesReduction.length > 0 && (
        <div>
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            Réductions &amp; Exonérations
          </p>
          {lignesReduction.map((l) => (
            <CotisationLine key={l.code} ligne={l} highlight />
          ))}
        </div>
      )}

      {/* Total des cotisations */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-t mt-1 px-3 py-2 font-semibold bg-muted/30 text-sm">
        <span>
          Total cotisations
          {resultat.montantRGDU > 0 && (
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">(net RGDU)</span>
          )}
        </span>
        <span className="hidden md:block" />
        <span className="w-20 text-right font-mono text-destructive">
          -{formatEur(totalSal)}
        </span>
        <span className="w-20 text-right font-mono text-muted-foreground">
          {formatEur(totalPatNet)}
        </span>
      </div>

      <Separator className="my-3" />

      {/* ── SECTION 4 : Net et fiscalité ── */}
      <div className="flex flex-col gap-0.5 px-3">
        <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
          <span className="text-muted-foreground">Net social</span>
          <span className="w-28 text-right font-mono">{formatEur(resultat.netSocial)}</span>
        </div>

        {avantages > 0 && (
          <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
            <span className="text-muted-foreground">Avantages en nature</span>
            <span className="w-28 text-right font-mono text-destructive">
              -{formatEur(avantages)}
            </span>
          </div>
        )}

        {resultat.exonerationHSIR > 0 && (
          <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
            <span className="text-muted-foreground">
              Exonération HS / IR
              <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400" title="Art. 81 quater CGI — plafond 7 500 €/an">▸ art. 81q CGI</span>
            </span>
            <span className="w-28 text-right font-mono text-destructive">
              -{formatEur(resultat.exonerationHSIR)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
          <span className="text-muted-foreground">Net imposable</span>
          <span className="w-28 text-right font-mono text-muted-foreground">
            {formatEur(resultat.netImposable)}
          </span>
        </div>

        {resultat.pas > 0 && (
          <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
            <span className="text-muted-foreground">
              Prélèvement à la source
              {sal.tauxPAS ? ` (${((sal.tauxPAS ?? 0) * 100).toFixed(1)} %)` : ""}
            </span>
            <span className="w-28 text-right font-mono text-destructive">
              -{formatEur(resultat.pas)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-x-4 rounded-md border px-3 py-2.5 text-base font-bold mt-1">
          <span>Net à payer</span>
          <span className="w-28 text-right font-mono text-green-700 dark:text-green-400">
            {formatEur(resultat.netAPayer)}
          </span>
        </div>
      </div>

      <Separator className="my-3" />

      {/* ── Coût employeur ── */}
      <div className="flex flex-col gap-0.5 px-3">
        {resultat.montantRGDU > 0 && (
          <>
            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
              <span className="text-muted-foreground">Cotisations patronales brutes</span>
              <span className="w-28 text-right font-mono">{formatEur(resultat.totalCotisationsPatronales)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
              <span className="text-green-700 dark:text-green-400">Réduction générale (RGDU)</span>
              <span className="w-28 text-right font-mono text-green-700 dark:text-green-400">
                -{formatEur(resultat.montantRGDU)}
              </span>
            </div>
          </>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1 font-semibold">
          <span className="text-muted-foreground">Coût total employeur</span>
          <span className="w-28 text-right font-mono">{formatEur(resultat.coutEmployeur)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

/** Ligne dans la section composition du brut */
function BrutRow({
  label,
  detail,
  montant,
  extra,
}: {
  label: string;
  detail?: string;
  montant: number;
  extra?: boolean;
}) {
  const neg = montant < 0;
  return (
    <div className={`grid grid-cols-[1fr_auto] items-baseline gap-x-4 px-3 py-1 text-sm ${
      extra ? "text-muted-foreground" : ""
    }`}>
      <div className="flex flex-col">
        <span className={extra ? "" : "font-medium"}>{label}</span>
        {detail && <span className="text-[11px] text-muted-foreground">{detail}</span>}
      </div>
      <span className={`w-28 text-right font-mono ${
        neg ? "text-destructive" : extra ? "text-muted-foreground" : ""
      }`}>
        {neg ? "-" : extra ? "+" : ""}{formatEur(Math.abs(montant))}
      </span>
    </div>
  );
}

/** Chip d'une base de référence */
function BaseChip({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label} : <strong className="text-foreground">{value}</strong>
    </span>
  );
}


