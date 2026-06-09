/**
 * Fonctions de formatage centralisées — source unique de vérité pour tout le projet.
 *
 * Règles d'affichage :
 *   - Zéro       → "—" pour les fonctions de type montant (formatAmount, formatEurNoDecimals)
 *   - null        → "" pour formatPct
 *   - EUR (display) → séparateur milliers fr-FR via Intl.NumberFormat
 *
 * @module format
 */

// ── Instances Intl hissées (évite les allocations répétées) ──────────────────

const frFmt0 = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const frFmt2 = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ── Formatage numérique générique ─────────────────────────────────────────────

/**
 * Formate un nombre en locale française avec un maximum de N décimales
 * (les zéros en fin de fraction sont supprimés).
 *
 * @param v          - Valeur numérique
 * @param maxDecimals - Nombre maximum de décimales (défaut : 2)
 * @returns Ex. formatNumber(1234.56) → "1 234,56"
 *          Ex. formatNumber(1234)    → "1 234"
 *          Ex. formatNumber(1234, 0) → "1 234"
 */
export function formatNumber(v: number, maxDecimals = 2): string {
  if (maxDecimals === 0) return frFmt0.format(v);
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

// ── Formatage EUR ─────────────────────────────────────────────────────────────

/**
 * Formate un montant en euros avec 2 décimales (fr-FR, symbole €).
 *
 * @param v - Montant en euros
 * @returns Ex. "1 823,03 €"
 */
export function formatEur(v: number): string {
  return frFmt2.format(v) + " €";
}

/**
 * Formate un montant en euros sans décimales. Retourne "—" si zéro.
 * Utilisé pour les montants financiers où la précision à l'euro suffit.
 *
 * @param v - Montant en euros
 * @returns Ex. "1 235 €" ou "—" si 0
 */
export function formatEurNoDecimals(v: number): string {
  if (v === 0) return "—";
  return frFmt0.format(Math.round(v)) + " €";
}

/**
 * Formate un montant en notation compacte (k€ / M€).
 * Utilisé dans les graphiques et cartes KPI pour économiser de l'espace.
 *
 * @param v - Montant en euros
 * @returns Ex. "1.2 M€", "123 k€", "850 €", "0"
 */
export function formatEurCompact(v: number): string {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)} k€`;
  return `${Math.round(v)} €`;
}

// ── Formatage montant sans symbole (tableaux financiers) ─────────────────────

/**
 * Formate un montant entier en fr-FR sans symbole €. Retourne "—" si zéro.
 * Utilisé dans les tableaux financiers où la devise est implicite dans l'en-tête.
 *
 * @param amount - Montant
 * @returns Ex. "1 235" ou "—" si 0
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return frFmt0.format(Math.round(amount));
}

/**
 * Formate un montant avec couleur CSS conditionnelle.
 *   - Positif → vert (text-emerald-600)
 *   - Négatif → rouge (text-destructive)
 *   - Zéro    → gris (text-muted-foreground) + "–"
 *
 * @param v - Montant
 * @returns `{ text: string; cls: string }`
 */
export function formatAmountColored(v: number): { text: string; cls: string } {
  if (v === 0) return { text: "–", cls: "text-muted-foreground" };
  const text = frFmt0.format(Math.round(v));
  return { text, cls: v < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400" };
}

// ── Formatage pourcentage ─────────────────────────────────────────────────────

/**
 * Formate un ratio (0–1) en pourcentage. Retourne "" si null.
 *
 * @param v        - Ratio (ex. 0.4532) ou null
 * @param decimals - Nombre de décimales (défaut : 1)
 * @returns Ex. formatPct(0.4532)    → "45.3 %"
 *          Ex. formatPct(0.4532, 2) → "45.32 %"
 *          Ex. formatPct(null)      → ""
 */
export function formatPct(v: number | null, decimals = 1): string {
  if (v === null) return "";
  return `${(v).toFixed(decimals)} %`;
}

// ── Formatage date ────────────────────────────────────────────────────────────

/**
 * Formate une date ISO (YYYY-MM-DD ou ISO 8601) en format français (JJ/MM/AAAA).
 *
 * @param iso - Date au format ISO (ex. "2026-04-23")
 * @returns Ex. "23/04/2026" ou "—" si invalide
 */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

/**
 * Formate un timestamp (ms) en date + heure française.
 *
 * @param ts - Timestamp Unix en millisecondes
 * @returns Ex. "23/04/26 14:30"
 */
export function formatDateTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convertit une chaîne de caractères en nombre, en gérant les formats français
 * (virgule comme séparateur décimal, espaces comme séparateurs de milliers).
 *
 * @param v - Chaîne de caractères à convertir
 * @returns Le nombre correspondant, ou 0 si la conversion échoue
 */
export function numVal(v: string): number {
  const n = parseFloat(v.replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}