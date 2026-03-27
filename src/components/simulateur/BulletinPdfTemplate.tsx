/**
 * BulletinPdfTemplate
 *
 * Composant React pur (sans hooks, sans effets côté navigateur) rendu à la fois :
 *  - Côté serveur via `renderToStaticMarkup` dans la route API export-pdf
 *  - Côté client comme prévisualisation d'impression
 *
 * Les styles sont inline ou via une classe globale `bulletin-print` afin
 * de garantir la compatibilité avec tous les moteurs de rendu PDF.
 */

import type { SimulationInput, SimulationResultat, LigneCotisation } from "@/lib/paie/types";
import { CONVENTION_CATALOG } from "@/lib/paie/conventions/catalog";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function pct(v: number): string {
  return (v * 100).toFixed(4) + " %";
}

function groupByFamille(lignes: LigneCotisation[]): Map<string, LigneCotisation[]> {
  const map = new Map<string, LigneCotisation[]>();
  for (const ligne of lignes) {
    const key = ligne.famille;
    const existing = map.get(key);
    if (existing) {
      existing.push(ligne);
    } else {
      map.set(key, [ligne]);
    }
  }
  return map;
}

const FAMILLE_LABELS: Record<string, string> = {
  assurance_maladie: "Santé",
  assurance_vieillesse: "Assurance vieillesse",
  allocations_familiales: "Allocations familiales",
  assurance_chomage: "Retraite et prévoyance",
  ags: "Garantie salaires (AGS)",
  fnal: "Logement (FNAL)",
  csa: "Solidarité autonomie",
  dialogue_social: "Dialogue social",
  csg_deductible: "CSG déductible",
  csg_non_deductible: "CSG / CRDS non déductible",
  crds: "CRDS",
  at_mp: "Accidents du travail / maladies professionnelles",
  versement_mobilite: "Versement mobilité",
  retraite_complementaire: "Retraite complémentaire (Agirc-Arrco)",
  ceg: "Contribution équilibre général (CEG)",
  cet: "Contribution temporaire (CET)",
  apec: "APEC",  prevoyance_prevoyance: "Prévoyance (Convention collective)",
  prevoyance_mutuelle: "Mutuelle (Convention collective)",  exoneration: "Exonérations",
  rgdu: "Réduction générale (RGDU)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles print inline
// ─────────────────────────────────────────────────────────────────────────────

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .bulletin { max-width: 800px; margin: 0 auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #1a56d5; }
  .header-title { font-size: 18px; font-weight: 700; color: #1a56d5; }
  .header-meta { font-size: 10px; color: #555; text-align: right; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 6px; padding: 3px 6px; background: #f0f4ff; border-left: 3px solid #1a56d5; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #555; text-align: right; padding: 4px 6px; border-bottom: 1px solid #ddd; background: #f9f9f9; }
  th:first-child { text-align: left; }
  td { font-size: 10px; padding: 3px 6px; border-bottom: 1px dotted #eee; text-align: right; vertical-align: top; }
  td:first-child { text-align: left; }
  tr.famille-header td { font-size: 10px; font-weight: 700; background: #f5f5f5; padding: 4px 6px; border-bottom: 1px solid #ddd; }
  tr.exo td.montant-sal { color: #16a34a; }
  tr.totaux td { font-weight: 700; border-top: 2px solid #111; background: #f0f4ff; }
  .recap { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .recap-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
  .recap-box .label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
  .recap-box .value { font-size: 16px; font-weight: 700; color: #111; margin-top: 2px; }
  .recap-box.accent { border-color: #1a56d5; background: #f0f4ff; }
  .recap-box.accent .value { color: #1a56d5; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9px; color: #888; text-align: center; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface BulletinPdfTemplateProps {
  input: SimulationInput;
  resultat: SimulationResultat;
}

export function BulletinPdfTemplate({ input, resultat }: BulletinPdfTemplateProps) {
  const { salarié, entreprise } = input;
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Convention collective
  const convMeta = salarié.conventionCode ? CONVENTION_CATALOG.get(salarié.conventionCode) : undefined;

  // Taux horaire pour le détail HS
  const heuresNormales = Math.min(salarié.heuresContrat, 151.66669);
  const tauxHoraire = salarié.brutMensuel > 0 ? salarié.brutMensuel / heuresNormales : 0;

  // Exclure les lignes "exoneration" / "rgdu" des cotisations principales
  const lignesNormales = resultat.lignes.filter(
    (l) => l.famille !== "exoneration" && l.famille !== "rgdu",
  );
  const lignesExoneration = resultat.lignes.filter(
    (l) => l.famille === "exoneration" || l.famille === "rgdu",
  );

  const groupes = groupByFamille(lignesNormales);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>Bulletin de paie simulé — {dateStr}</title>
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      </head>
      <body>
        <div className="bulletin">
          {/* ── En-tête ── */}
          <div className="header">
            <div>
              <div className="header-title">Bulletin de paie simulé</div>
              <div className="header-meta" style={{ textAlign: "left", marginTop: 4 }}>
                Millésime {input.millesime ?? "2026"} — Régime général
                {salarié.alsaceMoselle ? " + Alsace-Moselle" : ""}
                {convMeta && (
                  <> — <strong>CCN IDCC {salarié.conventionCode} — {convMeta.label}</strong>
                    {convMeta.statut === "partial" && (
                      <span style={{ color: "#d97706", marginLeft: 4 }}>(impl. partielle)</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="header-meta">
              <div>Généré le {dateStr}</div>
              <div style={{ marginTop: 2 }}>Moteur v2.0.0</div>
              {resultat.facteurProrata < 1 && (
                <div style={{ marginTop: 2, color: "#d97706" }}>
                  Prorata : {(resultat.facteurProrata * 100).toFixed(1)} %
                </div>
              )}
            </div>
          </div>

          {/* ── Informations salarié / entreprise ── */}
          <div className="section">
            <div className="section-title">Paramètres</div>
            <table>
              <tbody>
                <tr>
                  <td>Statut</td>
                  <td>{salarié.statut === "cadre" ? "Cadre" : "Non-cadre"}</td>
                  <td>Type de contrat</td>
                  <td>{salarié.typeContrat.toUpperCase()}</td>
                </tr>
                <tr>
                  <td>Heures / mois</td>
                  <td>{salarié.heuresContrat.toFixed(2)} h</td>
                  <td>Effectif entreprise</td>
                  <td>{entreprise.effectif} salariés</td>
                </tr>
                <tr>
                  <td>Taux AT/MP</td>
                  <td>{(entreprise.tauxATMP * 100).toFixed(3)} %</td>
                  {entreprise.tauxMobilite != null && entreprise.tauxMobilite > 0 ? (
                    <>
                      <td>Versement mobilité</td>
                      <td>{(entreprise.tauxMobilite * 100).toFixed(3)} %</td>
                    </>
                  ) : (
                    <>
                      <td></td>
                      <td></td>
                    </>
                  )}
                </tr>
                {convMeta && (
                  <tr>
                    <td>Convention collective</td>
                    <td colSpan={3}>
                      IDCC {salarié.conventionCode} — {convMeta.label}
                      {convMeta.statut === "partial" && (
                        <span style={{ color: "#d97706", marginLeft: 4 }}>(impl. partielle)</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Éléments de rémunération ── */}
          <div className="section">
            <div className="section-title">Rémunération brute</div>
            <table>
              <tbody>
                <tr>
                  <td>Salaire de base</td>
                  <td>{eur(salarié.brutMensuel)}</td>
                  <td>Brut soumis</td>
                  <td>{eur(resultat.brutSoumis)}</td>
                </tr>
                {resultat.heuresSupLignes && resultat.heuresSupLignes.length > 0
                  ? resultat.heuresSupLignes.map((l) => (
                      <tr key={l.label}>
                        <td>
                          {l.label}<br/>
                          <span style={{ fontSize: "9px", color: "#888" }}>
                            {l.heures.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h
                            {" × "}{(100 + l.tauxMajoration * 100).toFixed(0)} %
                            {" × "}{eur(tauxHoraire)}/h
                          </span>
                        </td>
                        <td>{eur(l.montant)}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))
                  : (salarié.heuresSupplementaires ?? 0) > 0 && (
                      <tr>
                        <td>Heures supplémentaires</td>
                        <td>{eur(resultat.heuresSup ?? 0)}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    )
                }
                {(salarié.primesSoumises ?? 0) > 0 && (
                  <tr>
                    <td>Primes soumises</td>
                    <td>{eur(salarié.primesSoumises ?? 0)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                {(salarié.avantagesEnNature ?? 0) > 0 && (
                  <tr>
                    <td>Avantages en nature</td>
                    <td>{eur(salarié.avantagesEnNature ?? 0)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Tableau des cotisations ── */}
          <div className="section">
            <div className="section-title">Cotisations sociales</div>
            <table>
              <thead>
                <tr>
                  <th>Nature de la cotisation</th>
                  <th>Organisme</th>
                  <th>Assiette</th>
                  <th>Taux sal.</th>
                  <th>Montant sal.</th>
                  <th>Taux pat.</th>
                  <th>Montant pat.</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(groupes.entries()).map(([famille, lignes]) => (
                  <>
                    <tr className="famille-header" key={`header-${famille}`}>
                      <td colSpan={7}>
                        {FAMILLE_LABELS[famille] ?? famille}
                      </td>
                    </tr>
                    {lignes.map((ligne) => (
                      <tr key={ligne.code}>
                        <td>{ligne.libelle}</td>
                        <td>{ligne.organisme}</td>
                        <td>{eur(ligne.assiette)}</td>
                        <td>{pct(ligne.tauxSalarie)}</td>
                        <td className={ligne.montantSalarie < 0 ? "montant-sal" : ""}>
                          {eur(ligne.montantSalarie)}
                        </td>
                        <td>{pct(ligne.tauxEmployeur)}</td>
                        <td>{eur(ligne.montantEmployeur)}</td>
                      </tr>
                    ))}
                  </>
                ))}

                {/* Exonérations */}
                {lignesExoneration.length > 0 && (
                  <>
                    <tr className="famille-header">
                      <td colSpan={7}>Exonérations et réductions</td>
                    </tr>
                    {lignesExoneration.map((ligne) => (
                      <tr key={ligne.code} className="exo">
                        <td>{ligne.libelle}</td>
                        <td>{ligne.organisme}</td>
                        <td>{eur(ligne.assiette)}</td>
                        <td>—</td>
                        <td className="montant-sal">{eur(ligne.montantSalarie)}</td>
                        <td>—</td>
                        <td style={{ color: "#16a34a" }}>{eur(ligne.montantEmployeur)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Totaux */}
                <tr className="totaux">
                  <td colSpan={4}>Total cotisations</td>
                  <td>{eur(resultat.totalCotisationsSalariales)}</td>
                  <td></td>
                  <td>{eur(resultat.totalCotisationsPatronales)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Net et fiscalité ── */}
          <div className="section">
            <div className="section-title">Net et fiscalité</div>
            <table>
              <tbody>
                <tr>
                  <td>Net social</td>
                  <td style={{ fontWeight: 600 }}>{eur(resultat.netSocial)}</td>
                  <td></td><td></td>
                </tr>
                {(salarié.avantagesEnNature ?? 0) > 0 && (
                  <tr>
                    <td style={{ color: "#dc2626" }}>Avantages en nature</td>
                    <td style={{ color: "#dc2626" }}>&minus;{eur(salarié.avantagesEnNature ?? 0)}</td>
                    <td></td><td></td>
                  </tr>
                )}
                {resultat.exonerationHSIR > 0 && (
                  <tr>
                    <td style={{ color: "#dc2626" }}>
                      Exonération HS / IR
                      <span style={{ fontSize: "9px", color: "#d97706", marginLeft: 4 }}>(art. 81q CGI)</span>
                    </td>
                    <td style={{ color: "#dc2626" }}>&minus;{eur(resultat.exonerationHSIR)}</td>
                    <td></td><td></td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: "#555" }}>Net imposable</td>
                  <td style={{ color: "#555" }}>{eur(resultat.netImposable)}</td>
                  <td></td><td></td>
                </tr>
                {resultat.pas > 0 && (
                  <tr>
                    <td style={{ color: "#dc2626" }}>
                      Prélèvement à la source{salarié.tauxPAS != null ? ` (${pct(salarié.tauxPAS)})` : ""}
                    </td>
                    <td style={{ color: "#dc2626" }}>&minus;{eur(resultat.pas)}</td>
                    <td></td><td></td>
                  </tr>
                )}
                <tr style={{ borderTop: "2px solid #111", background: "#f0f4ff" }}>
                  <td style={{ fontWeight: 700 }}>Net à payer</td>
                  <td style={{ fontWeight: 700, color: "#1a56d5" }}>{eur(resultat.netAPayer)}</td>
                  <td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Récapitulatif ── */}
          <div className="section">
            <div className="section-title">Récapitulatif</div>
            <div className="recap">
              <div className="recap-box accent">
                <div className="label">Net à payer</div>
                <div className="value">{eur(resultat.netAPayer)}</div>
              </div>
              <div className="recap-box">
                <div className="label">Coût total employeur</div>
                <div className="value">{eur(resultat.coutEmployeur)}</div>
              </div>
              <div className="recap-box">
                <div className="label">Charges patronales / brut</div>
                <div className="value">
                  {resultat.tauxCotisationsPatronalesEffectif.toFixed(2)} %
                </div>
              </div>
              <div className="recap-box">
                <div className="label">RGDU (réduction employeur)</div>
                <div className="value" style={{ color: "#16a34a" }}>
                  {eur(Math.abs(resultat.montantRGDU))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Pied de page ── */}
          <div className="footer">
            Simulation à titre indicatif — Paramètres réglementaires {input.millesime ?? "2026"} —
            Moteur de calcul v2.0.0 — Ne pas utiliser comme bulletin officiel
          </div>
        </div>
      </body>
    </html>
  );
}
