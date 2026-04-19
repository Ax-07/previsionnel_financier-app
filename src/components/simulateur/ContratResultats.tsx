"use client";

/**
 * Affichage des résultats de simulation multi-mois sur une période de contrat.
 *
 * Comprend :
 * - Un résumé des totaux consolidés (brut, net, coût employeur, CP)
 * - Un tableau récapitulatif mois par mois
 * - Le détail des congés payés
 * - Un panneau extensible pour chaque bulletin individuel
 */

import { memo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  PalmtreeIcon,
  EuroIcon,
  BriefcaseIcon,
} from "lucide-react";
import type { SimulationContratResultat, BulletinMensuel } from "@/lib/paie/contrat/types";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ContratResultatsProps {
  resultat: SimulationContratResultat;
  estCDD: boolean;
}

import { formatEur as eur } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Formatage
// ─────────────────────────────────────────────────────────────────────────────

const pct = (v: number) =>
  `${(v * 100).toFixed(0)} %`;

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function ContratResultats({ resultat, estCDD }: ContratResultatsProps) {
  const { totaux, bulletins, congesPayesFinal, periode } = resultat;
  const [bulletinOuvert, setBulletinOuvert] = useState<string | null>(null);

  if (bulletins.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucun bulletin généré pour cette période.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Résumé de la période ── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CalendarDaysIcon className="size-4" />
        <span>
          Du <strong className="text-foreground">{formatDateFR(periode.dateDebut)}</strong>
          {" "}au <strong className="text-foreground">{formatDateFR(periode.dateFin)}</strong>
        </span>
        <Badge variant="secondary">{totaux.nbMois} mois</Badge>
      </div>

      {/* ── Cartes KPI ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          label="Salaire brut total"
          value={eur(totaux.brutTotal)}
          icon={<EuroIcon className="size-4" />}
          subtitle={`≈ ${eur(totaux.brutTotal / totaux.nbMois)} / mois`}
        />
        <KPICard
          label="Salaire net total"
          value={eur(totaux.netAPayerTotal)}
          icon={<TrendingUpIcon className="size-4" />}
          subtitle={`≈ ${eur(totaux.netAPayerTotal / totaux.nbMois)} / mois`}
          highlight
        />
        <KPICard
          label="Coût employeur"
          value={eur(totaux.coutEmployeurTotal)}
          icon={<BriefcaseIcon className="size-4" />}
          subtitle={`≈ ${eur(totaux.coutEmployeurTotal / totaux.nbMois)} / mois`}
        />
        <KPICard
          label="Coût total avec CP"
          value={eur(totaux.coutEmployeurTotalAvecCP)}
          icon={<BriefcaseIcon className="size-4" />}
          subtitle={`+${eur(totaux.provisionCPTotale)} provision CP`}
        />
        <KPICard
          label="CP acquis"
          value={`${congesPayesFinal.joursAcquisCumules} j`}
          icon={<PalmtreeIcon className="size-4" />}
          subtitle={
            totaux.joursCPPris > 0
              ? `${totaux.joursCPPris} j pris · Solde : ${congesPayesFinal.soldeCP} j`
              : `Provision : ${eur(congesPayesFinal.provisionCPCumulee)}`
          }
        />
      </div>

      {/* ── Indemnité CP des jours pris (soumise à cotisations) ── */}
      {totaux.indemniteCPPris > 0 && (
        <div className="rounded-lg border border-green-500/30 bg-green-50/50 px-4 py-3 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <PalmtreeIcon className="size-4" />
            Indemnité de congés payés pris ({totaux.joursCPPris} jours)
          </div>
          <p className="mt-1 text-lg font-bold text-green-900 dark:text-green-300">
            {eur(totaux.indemniteCPPris)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ajoutée au brut du dernier mois et soumise à cotisations sociales.
            Calcul : max(1/10ème du brut total proratisé, maintien de salaire).
          </p>
        </div>
      )}

      {/* ── Indemnité compensatrice CP (CDD) — jours NON pris ── */}
      {estCDD && totaux.indemniteCompensatriceCP > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 px-4 py-3 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <PalmtreeIcon className="size-4" />
            Indemnité compensatrice de congés payés (fin de CDD)
          </div>
          <p className="mt-1 text-lg font-bold text-amber-900 dark:text-amber-300">
            {eur(totaux.indemniteCompensatriceCP)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pour les {congesPayesFinal.soldeCP} jours acquis non pris
            (art. L1243-8 C.trav.) — incluse dans le brut du dernier mois et soumise à cotisations.
          </p>
        </div>
      )}

      <Separator />

      {/* ── Tableau récapitulatif mensuel ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Détail mensuel
        </h3>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Jours</TableHead>
                <TableHead className="text-right">Prorata</TableHead>
                <TableHead className="text-right">Salaire brut</TableHead>
                <TableHead className="text-right">Cot. salariales</TableHead>
                <TableHead className="text-right">Salaire net</TableHead>
                <TableHead className="text-right">Coût employeur</TableHead>
                <TableHead className="text-right">CP acquis</TableHead>
                <TableHead className="text-right">Solde CP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulletins.map((b) => (
                <BulletinRow
                  key={b.mois}
                  bulletin={b}
                  isOpen={bulletinOuvert === b.mois}
                  onToggle={() =>
                    setBulletinOuvert(bulletinOuvert === b.mois ? null : b.mois)
                  }
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell />
                <TableCell>Total</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right">{eur(totaux.brutTotal)}</TableCell>
                <TableCell className="text-right">{eur(totaux.cotisationsSalarialesTotal)}</TableCell>
                <TableCell className="text-right text-primary">{eur(totaux.netAPayerTotal)}</TableCell>
                <TableCell className="text-right">{eur(totaux.coutEmployeurTotal)}</TableCell>
                <TableCell className="text-right">
                  {congesPayesFinal.joursAcquisCumules} j
                </TableCell>
                <TableCell className="text-right">
                  {congesPayesFinal.soldeCP} j
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne de bulletin (avec détail extensible)
// ─────────────────────────────────────────────────────────────────────────────

const BulletinRow = memo(function BulletinRow({
  bulletin: b,
  isOpen,
  onToggle,
}: {
  bulletin: BulletinMensuel;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const s = b.simulation;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="w-8 px-2">
          {isOpen ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{b.moisLabel}</span>
            {b.estMoisEntree && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Entrée
              </Badge>
            )}
            {b.estMoisSortie && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Sortie
              </Badge>
            )}
            {b.indemniteCP > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                +CP pris {eur(b.indemniteCP)}
              </Badge>
            )}
            {b.indemniteCompensatriceCP > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                +CP compensatrice {eur(b.indemniteCompensatriceCP)}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {b.joursOuvresTravailles}/{b.joursOuvresDuMois}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {pct(b.facteurProrata)}
        </TableCell>
        <TableCell className="text-right tabular-nums">{eur(s.brutSoumis)}</TableCell>
        <TableCell className="text-right tabular-nums text-muted-foreground">{eur(s.totalCotisationsSalariales)}</TableCell>
        <TableCell className="text-right tabular-nums font-semibold text-primary">{eur(s.netAPayer)}</TableCell>
        <TableCell className="text-right tabular-nums">{eur(s.coutEmployeur)}</TableCell>
        <TableCell className="text-right tabular-nums">
          +{b.congesPayes.joursAcquisMois} j
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {b.congesPayes.soldeCP} j
        </TableCell>
      </TableRow>

      {/* Détail du bulletin (extensible) */}
      {isOpen && (
        <TableRow>
          <TableCell colSpan={10} className="bg-muted/30 p-4">
            <BulletinDetail bulletin={b} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
});
BulletinRow.displayName = "BulletinRow";

// ─────────────────────────────────────────────────────────────────────────────
// Détail d'un bulletin (panneau extensible)
// ─────────────────────────────────────────────────────────────────────────────

function BulletinDetail({ bulletin: b }: { bulletin: BulletinMensuel }) {
  const s = b.simulation;

  return (
    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
      <DetailItem label="Brut soumis" value={eur(s.brutSoumis)} />
      <DetailItem label="Heures sup" value={eur(s.heuresSup)} />
      <DetailItem label="Assiette CSG" value={eur(s.assietteCsg)} />
      <DetailItem label="PMSS proratisé" value={eur(s.pmssProratise)} />
      <DetailItem label="Base T1" value={eur(s.baseT1)} />
      <DetailItem label="Base T2" value={eur(s.baseT2)} />
      <DetailItem label="Cot. salariales" value={eur(s.totalCotisationsSalariales)} />
      <DetailItem label="Cot. patronales" value={eur(s.totalCotisationsPatronales)} />
      <DetailItem label="RGDU" value={s.montantRGDU > 0 ? eur(s.montantRGDU) : "—"} />
      <DetailItem label="Net social" value={eur(s.netSocial)} />
      <DetailItem label="Net imposable" value={eur(s.netImposable)} />
      <DetailItem label="PAS" value={eur(s.pas)} />
      <DetailItem label="Net à payer" value={eur(s.netAPayer)} highlight />
      <DetailItem label="Coût employeur" value={eur(s.coutEmployeur)} />
      <DetailItem
        label="Taux cot. patronales"
        value={`${s.tauxCotisationsPatronalesEffectif.toFixed(2)} %`}
      />
      <DetailItem label="Facteur prorata" value={pct(s.facteurProrata)} />

      {/* Congés payés */}
      <Separator className="col-span-full" />
      <DetailItem
        label="CP acquis ce mois"
        value={`${b.congesPayes.joursAcquisMois} j`}
      />
      <DetailItem
        label="CP cumulés"
        value={`${b.congesPayes.joursAcquisCumules} j`}
      />
      <DetailItem
        label="CP pris"
        value={`${b.congesPayes.joursPrisCumules} j`}
      />
      <DetailItem
        label="Solde CP"
        value={`${b.congesPayes.soldeCP} j`}
      />
      <DetailItem
        label="Provision CP cumulée"
        value={eur(b.congesPayes.provisionCPCumulee)}
      />
      {b.indemniteCP > 0 && (
        <DetailItem
          label="Indemnité CP pris (soumise)"
          value={eur(b.indemniteCP)}
          highlight
        />
      )}
      {b.indemniteCompensatriceCP > 0 && (
        <DetailItem
          label="Indemnité compensatrice CP (soumise)"
          value={eur(b.indemniteCompensatriceCP)}
          highlight
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants atomiques
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  subtitle,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? "border-primary/40 bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-medium tabular-nums ${highlight ? "text-primary font-bold" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Formate une date ISO en format français (dd/mm/aaaa) */
function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
