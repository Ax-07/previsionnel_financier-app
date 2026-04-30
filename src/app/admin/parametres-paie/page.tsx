/**
 * Page d'administration des paramètres réglementaires.
 *
 * Server Component — lecture directe du registre (@/lib/paie/params/index).
 * Accessible à /admin/parametres-paie.
 */

import type { Metadata } from "next";
import { formatEur } from "@/lib/format";
import {
  METADATA_MILLESIMES,
  REGISTRE_MILLESIMES,
  AVAILABLE_MILLESIMES,
} from "@/lib/paie/params/index";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Paramètres réglementaires | Administration",
  description:
    "Consultation des paramètres réglementaires du moteur de calcul de paie (SMIC, PASS, taux Urssaf, Agirc-Arrco, RGDU).",
  robots: { index: false, follow: false },
};

// Utilitaire d'affichage des taux en pourcentage
function fmtTaux(n: number): string {
  return `${(n * 100).toFixed(4).replace(/\.?0+$/, "")} %`;
}

function fmtEuros(n: number): string { return formatEur(n); }

export default function PageParametresPaie() {
  const millesimes = AVAILABLE_MILLESIMES;

  return (
    <main className="container mx-auto max-w-6xl py-10 px-4 space-y-10">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold leading-tight">
            Paramètres réglementaires
          </h1>
          <Badge variant="outline" className="text-sm">
            Admin
          </Badge>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed">
          Consultation des paramètres légaux utilisés par le moteur de calcul.
          Les millésimes disponibles sont enregistrés dans{" "}
          <code className="text-sm bg-muted px-1 rounded">
            src/lib/paie/params/
          </code>
          .
        </p>
      </header>

      {/* ── Liste des millésimes ─────────────────────────────────────────── */}
      <section aria-labelledby="section-millesimes">
        <h2 id="section-millesimes" className="text-xl font-semibold mb-4">
          Millésimes disponibles ({millesimes.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {millesimes.map((m) => (
            <Badge key={m} variant={m === millesimes[0] ? "default" : "secondary"}>
              {m === millesimes[0] ? `${m} (actif)` : m}
            </Badge>
          ))}
        </div>
      </section>

      {/* ── Détail par millésime ─────────────────────────────────────────── */}
      {millesimes.map((millesime) => {
        const bundle = REGISTRE_MILLESIMES[millesime];
        const meta = METADATA_MILLESIMES.find((m) => m.millesime === millesime);
        if (!bundle) return null;

        const { params, tauxUrssaf, tauxArrco, rgdu } = bundle;

        return (
          <div key={millesime} className="space-y-6">
            {/* ── Titre millésime ─── */}
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <h2 className="text-2xl font-bold whitespace-nowrap">
                Millésime {millesime}
              </h2>
              <Separator className="flex-1" />
            </div>

            {/* ── Métadonnées ─── */}
            {meta && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations</CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    <span className="font-medium">En vigueur depuis :</span>{" "}
                    {new Date(meta.depuis).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">Sources officielles :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {meta.sources.map((s) => (
                        <li key={s} className="text-sm text-muted-foreground">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Paramètres généraux ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres généraux</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "SMIC horaire", value: fmtEuros(params.smicHoraire) },
                    {
                      label: "SMIC mensuel",
                      value: "smicMensuel" in params ? fmtEuros((params as unknown as Record<string, number>).smicMensuel) : "—",
                    },
                    { label: "PASS mensuel", value: fmtEuros(params.passMensuel) },
                    { label: "PASS annuel", value: fmtEuros(params.passAnnuel) },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* ── Taux Urssaf ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taux Urssaf — régime général</CardTitle>
                <CardDescription>
                  Cotisations patronales et salariales (en % de l&apos;assiette)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cotisation</TableHead>
                      <TableHead className="text-right">Employeur</TableHead>
                      <TableHead className="text-right">Salarié</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      Object.entries(tauxUrssaf) as [
                        string,
                        { employeur?: number; salarie?: number; patronal?: number },
                      ][]
                    ).map(([cle, taux]) => (
                      <TableRow key={cle}>
                        <TableCell className="font-mono text-sm">{cle}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtTaux(taux.employeur ?? taux.patronal ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtTaux(taux.salarie ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ── Taux Agirc-Arrco ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taux Agirc-Arrco</CardTitle>
                <CardDescription>
                  Retraite complémentaire — tranches T1 / T2, CEG, CET, APEC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tranche</TableHead>
                      <TableHead className="text-right">Employeur</TableHead>
                      <TableHead className="text-right">Salarié</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      Object.entries(tauxArrco) as [
                        string,
                        { employeur?: number; salarie?: number; patronal?: number },
                      ][]
                    ).map(([cle, taux]) => (
                      <TableRow key={cle}>
                        <TableCell className="font-mono text-sm uppercase">{cle}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtTaux(taux.employeur ?? taux.patronal ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtTaux(taux.salarie ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ── RGDU ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Réduction générale des cotisations patronales (RGDU)
                </CardTitle>
                <CardDescription>
                  Paramètres de la formule Fillon — Décret n° 2019-1160
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "T_min", value: fmtTaux(rgdu.tMin) },
                    {
                      label: "T_delta (< 50 sal.)",
                      value: fmtTaux(rgdu.tDeltaInf50),
                    },
                    {
                      label: "T_delta (≥ 50 sal.)",
                      value: fmtTaux(rgdu.tDeltaSup50),
                    },
                    {
                      label: "Coeff. max (< 50)",
                      value: fmtTaux(rgdu.coeffMaxInf50),
                    },
                    {
                      label: "Coeff. max (≥ 50)",
                      value: fmtTaux(rgdu.coeffMaxSup50),
                    },
                    { label: "Exposant P", value: `${rgdu.p}` },
                    {
                      label: "Sortie à",
                      value: `${rgdu.facteurSortie} × SMIC`,
                    },
                    {
                      label: "Plafond AT/MP",
                      value: fmtTaux(rgdu.plafondImputationATMP),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="text-base font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </main>
  );
}
