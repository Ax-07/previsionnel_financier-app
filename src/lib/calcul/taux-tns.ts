import type { RegimeSocial } from "@/lib/schemas/personnel";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MOTEUR TNS (SSI) 2026 — OFFICIEL / EN VIGUEUR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1) ASSIETTE "DÉFINITIVE" (réforme assiette unique)
 *    assiette = revenuBrut - abattement
 *    abattement = 26% du revenuBrut, borné :
 *      - min = 1,76% PASS
 *      - max = 130% PASS
 *
 * 2) 6 LIGNES DE SORTIE (format UI)
 *    0. Allocations familiales (AF)
 *    1. Maladie-maternité (hors IJ)
 *    2. Indemnités journalières (IJ)
 *    3. Retraite + Invalidité/Décès (bloc)
 *    4. CSG déductible + CFP
 *    5. CSG non déductible
 *
 * 3) ACRE (créations/reprises à compter du 01/01/2026 — hors micro)
 *    Règle officielle :
 *    - si R ≤ 75% PASS : exonération = 25% des cotisations éligibles
 *    - si 75% PASS < R < PASS : exonération dégressive (décret 2026-69)
 *      Formule (décret) :
 *        Montant exonération = E/PASS × (PASS − R)
 *      où E = total des cotisations éligibles dues pour R = 0,75 PASS
 *    - si R ≥ PASS : exonération = 0
 *
 *    Cotisations éligibles (décret / Service-Public) :
 *    - maladie-maternité, vieillesse de base, invalidité-décès, allocations familiales
 *    Non éligibles :
 *    - IJ, retraite complémentaire, CSG/CRDS, CFP
 *
 *    Implémentation :
 *    - On calcule d'abord toutes les cotisations "brutes"
 *    - On calcule le montant d'exonération officiel
 *    - On répartit l'exonération PROPORTIONNELLEMENT sur les cotisations éligibles
 *      (afin de respecter le total exonéré officiel sans imposer une clé arbitraire)
 *
 * 4) DÉBUT D'ACTIVITÉ (TRÉSORERIE URSSAF)
 *    Deux premières années : appels PROVISIONNELS sur bases forfaitaires (faute de revenu connu),
 *    puis régularisation l'année suivante quand le revenu réel est déclaré :
 *      - assiette forfaitaire "générale" ≈ 19% PASS
 *      - assiette forfaitaire "maladie/IJ" ≈ 40% PASS
 *
 * 5) CSG/CRDS (circularité type Mon-entreprise)
 *    CSG = t × (assiette + cotisations_hors_CSG + CSG)  =>
 *    CSG = t × (assiette + cotisations_hors_CSG) / (1 − t)
 *    Split : 6,8% déductible / 2,9% non déductible (sur 9,7% total)
 *
 * Références :
 * - Service-Public : seuils 75% PASS / 100% PASS + 25% + dégressivité :contentReference[oaicite:4]{index=4}
 * - Décret 2026-69 (résumé Centre Inffo) : formule dégressive via E/PASS × (PASS−R) :contentReference[oaicite:5]{index=5}
 * - Bpifrance-Création : bases forfaitaires 19% PASS et 40% PASS :contentReference[oaicite:6]{index=6}
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PASS_2026 = 48_060;

// ─────────────────────────────────────────────────────────────────────────────
// Minima / plafonds annuels (référentiel SSI / Mon-entreprise dans ton moteur)
// ─────────────────────────────────────────────────────────────────────────────
const MIN_ASSIETTE_RETRAITE = 5_409;    // plancher retraite de base
const MIN_ASSIETTE_INVALIDITE = 5_527;  // plancher invalidité-décès

// IJ : plancher "faibles revenus" = 40% PASS + plafond 5 PASS
const MIN_ASSIETTE_IJ = 0.40 * PASS_2026;
const PLAFOND_IJ = 5 * PASS_2026;

// Retraite complémentaire : 1 PASS puis 4 PASS
const PLAFOND_RCI_TR1 = 1 * PASS_2026;
const PLAFOND_RCI_TR2 = 4 * PASS_2026;

// ─────────────────────────────────────────────────────────────────────────────
// Assiette unique : abattement 26% borné
// ─────────────────────────────────────────────────────────────────────────────
const ABATTEMENT_TAUX = 0.26;
const ABATTEMENT_MIN = 0.0176 * PASS_2026; // 1,76% PASS
const ABATTEMENT_MAX = 1.30 * PASS_2026;   // 130% PASS

function assietteUnique(revenuBrut: number): number {
  if (revenuBrut <= 0) return 0;
  const abat = Math.min(
    Math.max(ABATTEMENT_TAUX * revenuBrut, ABATTEMENT_MIN),
    ABATTEMENT_MAX,
  );
  return Math.max(0, revenuBrut - abat);
}

// ─────────────────────────────────────────────────────────────────────────────
// Prorata temporis
// ─────────────────────────────────────────────────────────────────────────────
function prorataTemporis(joursActivite: number): number {
  if (!Number.isFinite(joursActivite)) return 1;
  if (joursActivite <= 0) return 0;
  return Math.min(1, Math.max(0, joursActivite / 360));
}

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────
function rd(n: number): number { return Math.round(n * 100) / 100; }
function clamp(x: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, x)); }

// ─────────────────────────────────────────────────────────────────────────────
// Barèmes 2026 (tels que dans ton extrait)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allocations familiales :
 * - 0% jusqu’à 110% PASS
 * - progressif 110–140% PASS vers 3,10%
 * - 3,10% au-delà
 */
function cotisAllocFam(assiette: number, pro: number): number {
  if (assiette <= 0) return 0;
  const bas = 1.10 * PASS_2026 * pro;
  const haut = 1.40 * PASS_2026 * pro;
  if (assiette <= bas) return 0;
  if (assiette <= haut) return assiette * 0.031 * ((assiette - bas) / (haut - bas));
  return assiette * 0.031;
}

/**
 * IJ : 0,5% sur assiette clampée :
 * - plancher = 40% PASS (proratisé)
 * - plafond  = 5×PASS (proratisé)
 */
function cotisIJ(assiette: number, pro: number): number {
  if (assiette <= 0) return 0;
  const plancher = MIN_ASSIETTE_IJ * pro;
  const plafond = PLAFOND_IJ * pro;
  const base = clamp(assiette, plancher, plafond);
  return base * 0.005;
}

/**
 * Maladie-maternité (hors IJ) — taux moyen sur l'assiette :
 * Tranches PASS : 0% ; 0→1,5 ; 1,5→4 ; 4→6,5 ; 6,5→7,7 ; 7,7→8,5 ; puis part >3 PASS à 6,5%.
 *
 * Formules (2)→(6) issues de ton extrait (taux), puis cotisation = taux × assiette.
 */
function cotisMaladieMaternite(assiette: number, pro: number): number {
  if (assiette <= 0) return 0;

  const P = PASS_2026 * pro;
  const a = assiette;

  const s20 = 0.20 * P;
  const s40 = 0.40 * P;
  const s60 = 0.60 * P;
  const s110 = 1.10 * P;
  const s200 = 2.00 * P;
  const s300 = 3.00 * P;

  if (a > s300) {
    // Jusqu’à 3 PASS : 8,5% ; au-delà : 6,5% sur l’excédent
    return (s300 * 0.085) + ((a - s300) * 0.065);
  }

  let taux = 0;

  if (a <= s20) {
    taux = 0;
  } else if (a <= s40) {
    // (2)
    taux = (0.015 * (a - s20)) / (0.20 * P);
  } else if (a <= s60) {
    // (3)
    taux = 0.015 + (0.025 * (a - s40)) / (0.20 * P);
  } else if (a <= s110) {
    // (4)
    taux = 0.04 + (0.025 * (a - s60)) / (0.50 * P);
  } else if (a <= s200) {
    // (5)
    taux = 0.065 + (0.012 * (a - s110)) / (0.90 * P);
  } else {
    // (6)
    taux = 0.077 + (0.008 * (a - s200)) / (1.00 * P);
  }

  return a * taux;
}

/**
 * Retraite de base 2026 :
 * - plancher assiette = 5 409€/an proratisé
 * - 17,87% ≤ PASS proratisé
 * - 0,72% au-delà
 */
function cotisRetraiteBase(assiette: number, pro: number): number {
  const plancher = MIN_ASSIETTE_RETRAITE * pro;
  const base = Math.max(assiette, plancher);

  const plafondTr1 = PASS_2026 * pro;
  const tr1 = Math.min(base, plafondTr1);
  const tr2 = Math.max(0, base - plafondTr1);

  return 0.1787 * tr1 + 0.0072 * tr2;
}

/**
 * Retraite complémentaire 2026 :
 * - 8,1% ≤ 1 PASS
 * - 9,1% entre 1 et 4 PASS
 * - 0% au-delà
 */
function cotisRetraiteComplementaire(assiette: number, pro: number): number {
  const base = Math.max(0, assiette);

  const tr1Plaf = PLAFOND_RCI_TR1 * pro;
  const tr2Plaf = PLAFOND_RCI_TR2 * pro;

  const tr1 = Math.min(base, tr1Plaf);
  const tr2 = Math.max(0, Math.min(base, tr2Plaf) - tr1Plaf);

  return 0.081 * tr1 + 0.091 * tr2;
}

/**
 * Invalidité-décès :
 * assiette clampée : [ 5 527€/an proratisé ; PASS proratisé ]
 * taux 1,30%
 */
function cotisInvaliditeDeces(assiette: number, pro: number): number {
  if (assiette <= 0) return 0;
  const plancher = MIN_ASSIETTE_INVALIDITE * pro;
  const plafond = PASS_2026 * pro;
  const base = clamp(assiette, plancher, plafond);
  return 0.013 * base;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSG/CRDS — circularité
// ─────────────────────────────────────────────────────────────────────────────
const TAUX_CSG_TOTAL = 0.097;
const TAUX_CSG_DED = 0.068;
const TAUX_CSG_NONDED = 0.029;

function cotisCsgTotal(assiette: number, cotisationsHorsCsg: number): number {
  const baseSansCsg = assiette + cotisationsHorsCsg;
  return (TAUX_CSG_TOTAL * baseSansCsg) / (1 - TAUX_CSG_TOTAL);
}

function splitCsg(total: number): { ded: number; nonded: number } {
  const ded = total * (TAUX_CSG_DED / TAUX_CSG_TOTAL);
  const nonded = total * (TAUX_CSG_NONDED / TAUX_CSG_TOTAL);
  return { ded, nonded };
}

// ─────────────────────────────────────────────────────────────────────────────
// CFP — PASS × taux (proratisé)
// ─────────────────────────────────────────────────────────────────────────────
function cfpTaux(regime: RegimeSocial): number {
  return regime === "commerce" ? 0.0025 : regime === "artisan" ? 0.0029 : 0.0034;
}
function cotisCFP(regime: RegimeSocial, pro: number): number {
  return PASS_2026 * cfpTaux(regime) * pro;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACRE 2026 OFFICIEL — calcul du ratio d'exonération à appliquer aux cotisations éligibles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le montant des cotisations éligibles ACRE à partir des assiettes (déjà proratisées).
 * Éligibles : AF + Maladie-maternité (hors IJ) + Retraite base + Invalidité-décès
 */
function cotisationsEligiblesACRE(
  assietteGenerale: number,
  assietteMaladieIJ: number,
  pro: number,
): number {
  // Les assiettes passées ici sont déjà proratisées ; on travaille donc avec pro=1 dans les barèmes
  const af = cotisAllocFam(assietteGenerale, 1);
  const mal = cotisMaladieMaternite(assietteMaladieIJ, 1);
  const rb = cotisRetraiteBase(assietteGenerale, 1);
  const id = cotisInvaliditeDeces(assietteGenerale, 1);
  return af + mal + rb + id;
}

/**
 * Ratio d'exonération à appliquer PROPORTIONNELLEMENT aux cotisations éligibles,
 * de manière à respecter le montant d'exonération officiel.
 *
 * R (officiel) : on utilise ici l'assiette "générale" (grandeur de référence SSI),
 * ce qui aligne seuils PASS et cotisations.
 */
function ratioExonerationACRE_2026(
  acreActif: boolean,
  assietteGenerale: number,
  assietteMaladieIJ: number,
  pro: number,
): number {
  if (!acreActif) return 0;

  const P = PASS_2026 * pro;
  if (P <= 0) return 0;

  const R = assietteGenerale;
  if (R <= 0) return 0;

  const seuil75 = 0.75 * P;

  const eligibleR = cotisationsEligiblesACRE(assietteGenerale, assietteMaladieIJ, pro);
  if (eligibleR <= 0) return 0;

  // Cas 1 : R ≤ 75% PASS => exonération = 25% des cotisations éligibles
  if (R <= seuil75) {
    const exon = 0.25 * eligibleR;
    return clamp(exon / eligibleR, 0, 1);
  }

  // Cas 3 : R ≥ PASS => pas d'exonération
  if (R >= P) return 0;

  // Cas 2 : 75% PASS < R < PASS => exonération dégressive
  // Décret : Montant exonération = E/PASS × (PASS − R)
  // où E = cotisations éligibles dues pour R = 0,75 PASS
  const assRef = seuil75; // Rref = 0,75 PASS
  const eligibleRef = cotisationsEligiblesACRE(assRef, assRef, pro);
  const exon = (eligibleRef / P) * (P - R);

  return clamp(exon / eligibleR, 0, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────
export interface MontantsTNSLigne {
  montantN: number;
  montantN1: number;
  montantN2: number;
  acreApplique: boolean;
}

export const NB_LIGNES_TNS_AUTO = 6;

export type ModeCalculTNS = "DEFINITIF" | "DEBUT_ACTIVITE_FORFAIT";

export interface SimulationNetToBrut {
  brut: number;
  net: number;
  totalCotisations: number;
  lignes: MontantsTNSLigne[];
  iterations: number;
  mode: ModeCalculTNS;
}

export interface TresorerieAnnuelleTNS {
  anneeIndex: 0 | 1 | 2; // 0=N, 1=N+1, 2=N+2
  revenuBrut: number;
  definitifDu: number;
  provisionnelAppelee: number;
  regularisation: number;
  totalPaye: number;
  lignesProvisionnel: MontantsTNSLigne[];
  lignesDefinitif: MontantsTNSLigne[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Calcul générique des 6 lignes depuis 2 assiettes
// ─────────────────────────────────────────────────────────────────────────────
function calculer6LignesDepuisAssiettes(
  assietteGenerale: number,
  assietteMaladieIJ: number,
  regime: RegimeSocial,
  acreActif: boolean,
  pro: number,
): readonly [number, number, number, number, number, number] {
  // 1) Cotisations BRUTES
  const af = cotisAllocFam(assietteGenerale, 1);
  const maladie = cotisMaladieMaternite(assietteMaladieIJ, 1);
  const ij = cotisIJ(assietteMaladieIJ, 1);

  const rb = cotisRetraiteBase(assietteGenerale, 1);
  const rc = cotisRetraiteComplementaire(assietteGenerale, 1);
  const id = cotisInvaliditeDeces(assietteGenerale, 1);

  // 2) ACRE : ratio officiel 2026 (appliqué proportionnellement aux éligibles)
  const ratioAcre = ratioExonerationACRE_2026(acreActif, assietteGenerale, assietteMaladieIJ, pro);

  const afNet = rd(af * (1 - ratioAcre));
  const maladieNet = rd(maladie * (1 - ratioAcre));
  const rbNet = rd(rb * (1 - ratioAcre));
  const idNet = rd(id * (1 - ratioAcre));

  // Non éligibles ACRE
  const ijNet = rd(ij);
  const rcNet = rd(rc);

  // Ligne 3 : bloc retraite + ID = (RB net + RC brut + ID net)
  const retraiteBloc = rd(rbNet + rcNet + idNet);

  // CFP
  const cfp = rd(cotisCFP(regime, pro));

  // 3) CSG/CRDS : circularité (sur assiette générale + cotisations hors CSG)
  const cotHorsCsg = rd(afNet + maladieNet + ijNet + retraiteBloc + cfp);
  const csgTot = cotisCsgTotal(assietteGenerale, cotHorsCsg);
  const { ded, nonded } = splitCsg(csgTot);

  // Lignes finales
  const l0 = afNet;
  const l1 = maladieNet;
  const l2 = ijNet;
  const l3 = retraiteBloc;
  const l4 = rd(ded + cfp);
  const l5 = rd(nonded);

  return [l0, l1, l2, l3, l4, l5];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode DEFINITIF : assiette unique sur revenu réel
// ─────────────────────────────────────────────────────────────────────────────
function calculer6LignesDefinitif(
  revenuBrut: number,
  regime: RegimeSocial,
  acreActif: boolean,
  joursActivite: number,
): readonly [number, number, number, number, number, number] {
  const pro = prorataTemporis(joursActivite);
  const ass = assietteUnique(revenuBrut);
  return calculer6LignesDepuisAssiettes(ass, ass, regime, acreActif, pro);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode DEBUT D’ACTIVITÉ : bases forfaitaires URSSAF (trésorerie)
// ─────────────────────────────────────────────────────────────────────────────
const FORFAIT_ASSIETTE_GENERALE = 0.19 * PASS_2026;     // 19% PASS :contentReference[oaicite:7]{index=7}
const FORFAIT_ASSIETTE_MALADIE_IJ = 0.40 * PASS_2026;   // 40% PASS :contentReference[oaicite:8]{index=8}

function calculer6LignesForfaitDebutActivite(
  regime: RegimeSocial,
  acreActif: boolean,
  joursActivite: number,
): readonly [number, number, number, number, number, number] {
  const pro = prorataTemporis(joursActivite);
  const assGen = FORFAIT_ASSIETTE_GENERALE * pro;
  const assMal = FORFAIT_ASSIETTE_MALADIE_IJ * pro;
  return calculer6LignesDepuisAssiettes(assGen, assMal, regime, acreActif, pro);
}

// ─────────────────────────────────────────────────────────────────────────────
// API : Calcul 6 lignes sur 3 ans (N, N+1, N+2) selon un mode
// ACRE ne s'applique que sur N dans cette API
// ─────────────────────────────────────────────────────────────────────────────
export function calculerMontantsTNS(
  remuN: number,
  remuN1: number,
  remuN2: number,
  regime: RegimeSocial,
  acreN = false,
  joursActiviteN = 360,
  joursActiviteN1 = 360,
  joursActiviteN2 = 360,
  mode: ModeCalculTNS = "DEFINITIF",
): MontantsTNSLigne[] {
  const calc = (modeLocal: ModeCalculTNS, revenu: number, acreActif: boolean, jours: number) => {
    if (modeLocal === "DEFINITIF") {
      return calculer6LignesDefinitif(revenu, regime, acreActif, jours);
    }
    return calculer6LignesForfaitDebutActivite(regime, acreActif, jours);
  };

  const aN = calc(mode, remuN, acreN, joursActiviteN);
  const aN1 = calc(mode, remuN1, false, joursActiviteN1);
  const aN2 = calc(mode, remuN2, false, joursActiviteN2);

  const acreVisible = acreN; // affichage UI

  return aN.map((montantN, i) => ({
    montantN,
    montantN1: aN1[i],
    montantN2: aN2[i],
    // Lignes éligibles ACRE (affichage seulement)
    acreApplique: acreVisible && (i === 0 || i === 1 || i === 3),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Totaux & extraction année
// ─────────────────────────────────────────────────────────────────────────────
function totalCotisationsLignesN(lignes: MontantsTNSLigne[]): number {
  return rd(lignes.reduce((s, l) => s + (l.montantN ?? 0), 0));
}

function extraireLignesPourAnnee(
  lignes3Ans: MontantsTNSLigne[],
  anneeIndex: 0 | 1 | 2,
): MontantsTNSLigne[] {
  return lignes3Ans.map((l) => ({
    montantN: anneeIndex === 0 ? l.montantN : anneeIndex === 1 ? l.montantN1 : l.montantN2,
    montantN1: 0,
    montantN2: 0,
    acreApplique: l.acreApplique,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Solveur NET -> BRUT (hors IR) pour un mode
// net = brut - totalCotisations(brut)
// ─────────────────────────────────────────────────────────────────────────────
function netPourBrut(
  brut: number,
  regime: RegimeSocial,
  acreActif: boolean,
  joursActivite: number,
  mode: ModeCalculTNS,
): { net: number; totalCotisations: number; lignes: MontantsTNSLigne[] } {
  const lignes3 = calculerMontantsTNS(brut, 0, 0, regime, acreActif, joursActivite, 360, 360, mode);
  const lignesN = extraireLignesPourAnnee(lignes3, 0);
  const total = totalCotisationsLignesN(lignesN);
  return { net: rd(brut - total), totalCotisations: total, lignes: lignes3 };
}

export function trouverBrutPourNet(
  netCible: number,
  regime: RegimeSocial,
  acreActif: boolean,
  options?: {
    precisionEuro?: number;
    maxIterations?: number;
    brutMax?: number;
    joursActivite?: number;
    mode?: ModeCalculTNS;
  },
): SimulationNetToBrut {
  const precision = options?.precisionEuro ?? 0.01;
  const maxIt = options?.maxIterations ?? 80;
  const brutMax = options?.brutMax ?? 1_000_000;
  const jours = options?.joursActivite ?? 360;
  const mode = options?.mode ?? "DEFINITIF";

  if (netCible <= 0) {
    const zero = calculerMontantsTNS(0, 0, 0, regime, false, jours, 360, 360, mode);
    return { brut: 0, net: 0, totalCotisations: 0, lignes: zero, iterations: 0, mode };
  }

  // Encadrement
  let lo = 0;
  let hi = Math.max(1, netCible * 2);

  let rHi = netPourBrut(hi, regime, acreActif, jours, mode);
  let guard = 0;

  while (rHi.net < netCible && hi < brutMax) {
    lo = hi;
    hi *= 2;
    rHi = netPourBrut(hi, regime, acreActif, jours, mode);
    guard++;
    if (guard > 60) break;
  }

  // Dichotomie
  let iterations = 0;
  while (iterations < maxIt) {
    const mid = (lo + hi) / 2;
    const rMid = netPourBrut(mid, regime, acreActif, jours, mode);
    const diff = rMid.net - netCible;

    if (Math.abs(diff) <= precision) {
      const brut = rd(mid);
      const fin = netPourBrut(brut, regime, acreActif, jours, mode);
      return {
        brut,
        net: fin.net,
        totalCotisations: fin.totalCotisations,
        lignes: fin.lignes,
        iterations: iterations + 1,
        mode,
      };
    }

    if (rMid.net < netCible) lo = mid;
    else hi = mid;

    iterations++;
  }

  const brut = rd((lo + hi) / 2);
  const fin = netPourBrut(brut, regime, acreActif, jours, mode);
  return { brut, net: fin.net, totalCotisations: fin.totalCotisations, lignes: fin.lignes, iterations, mode };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trésorerie URSSAF sur 3 ans (modèle annuel robuste)
// - N   : appels forfaitaires (début activité)
// - N+1 : appels forfaitaires + régularisation N
// - N+2 : appels basés sur N+1 (N-1) + régularisation N+1
// ─────────────────────────────────────────────────────────────────────────────
export function simulerTresorerieUrssafSur3Ans(params: {
  brutN: number;
  brutN1: number;
  brutN2: number;
  regime: RegimeSocial;
  acreN?: boolean;
  joursN?: number;
  joursN1?: number;
  joursN2?: number;
}): TresorerieAnnuelleTNS[] {
  const {
    brutN, brutN1, brutN2,
    regime,
    acreN = false,
    joursN = 360,
    joursN1 = 360,
    joursN2 = 360,
  } = params;

  // Définifits (dû réel)
  const defN3 = calculerMontantsTNS(brutN, 0, 0, regime, acreN, joursN, 360, 360, "DEFINITIF");
  const defN13 = calculerMontantsTNS(brutN1, 0, 0, regime, false, joursN1, 360, 360, "DEFINITIF");
  const defN23 = calculerMontantsTNS(brutN2, 0, 0, regime, false, joursN2, 360, 360, "DEFINITIF");

  const defN = totalCotisationsLignesN(extraireLignesPourAnnee(defN3, 0));
  const defN1 = totalCotisationsLignesN(extraireLignesPourAnnee(defN13, 0));
  const defN2 = totalCotisationsLignesN(extraireLignesPourAnnee(defN23, 0));

  // Provisionnels (forfait début d’activité)
  const forfN3 = calculerMontantsTNS(brutN, 0, 0, regime, acreN, joursN, 360, 360, "DEBUT_ACTIVITE_FORFAIT");
  const forfN13 = calculerMontantsTNS(brutN1, 0, 0, regime, false, joursN1, 360, 360, "DEBUT_ACTIVITE_FORFAIT");

  const forfN = totalCotisationsLignesN(extraireLignesPourAnnee(forfN3, 0));
  const forfN1 = totalCotisationsLignesN(extraireLignesPourAnnee(forfN13, 0));

  const anN: TresorerieAnnuelleTNS = {
    anneeIndex: 0,
    revenuBrut: brutN,
    definitifDu: defN,
    provisionnelAppelee: forfN,
    regularisation: 0,
    totalPaye: rd(forfN),
    lignesProvisionnel: forfN3,
    lignesDefinitif: defN3,
  };

  // Régul N en N+1
  const regN = rd(defN - forfN);
  const anN1: TresorerieAnnuelleTNS = {
    anneeIndex: 1,
    revenuBrut: brutN1,
    definitifDu: defN1,
    provisionnelAppelee: forfN1,
    regularisation: regN,
    totalPaye: rd(forfN1 + regN),
    lignesProvisionnel: forfN13,
    lignesDefinitif: defN13,
  };

  // À partir de N+2 : provisionnel ~ basé sur N-1 (ici on approxime = dû réel N+1)
  const provisionnelN2 = defN1;
  const regN1 = rd(defN1 - forfN1);

  const anN2: TresorerieAnnuelleTNS = {
    anneeIndex: 2,
    revenuBrut: brutN2,
    definitifDu: defN2,
    provisionnelAppelee: provisionnelN2,
    regularisation: regN1,
    totalPaye: rd(provisionnelN2 + regN1),
    lignesProvisionnel: defN13, // proxy
    lignesDefinitif: defN23,
  };

  return [anN, anN1, anN2];
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

export function detecterACRE(
  dirigeants: Array<{ actif?: boolean; exonerationTNS?: string }>,
): boolean {
  return dirigeants.some((d) => d.actif !== false && d.exonerationTNS === "ACRE");
}

export function remuTNSBase(
  dirigeants: Array<{
    actif?: boolean;
    montantN: number;
    montantN1: number;
    montantN2: number;
    tauxFixe: number;
  }>,
): { remuN: number; remuN1: number; remuN2: number } {
  const active = dirigeants.filter((d) => d.actif !== false);
  return {
    remuN: active.reduce((s, d) => s + d.montantN * (d.tauxFixe / 100), 0),
    remuN1: active.reduce((s, d) => s + d.montantN1 * (d.tauxFixe / 100), 0),
    remuN2: active.reduce((s, d) => s + d.montantN2 * (d.tauxFixe / 100), 0),
  };
}