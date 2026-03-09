/**
 * Registre des millésimes de paramètres réglementaires.
 *
 * Ce fichier est le point d'entrée unique pour accéder aux paramètres
 * réglementaires du moteur de paie.
 *
 * Architecture :
 *   - Chaque millésime est un fichier `params/YYYY.ts` compilé
 *   - Le registre `REGISTRE_MILLESIMES` indexe tous les bundles disponibles
 *   - `getParamsBundle(millesime?)` retourne le bon bundle selon le millésime
 *   - `getMillesimeActif(date?)` sélectionne automatiquement le millésime
 *     applicable en fonction de la date de référence (date courante par défaut)
 *
 * Étendre à un nouveau millésime :
 *   1. Créer `params/2027.ts` sur le modèle de `params/2026.ts`
 *   2. Importer ses exports ici
 *   3. Ajouter une entrée dans `REGISTRE_MILLESIMES` et `METADATA_MILLESIMES`
 */

import type { ParamsReglementaires } from "@/lib/paie/types";
import {
  PARAMS_2026,
  TAUX_URSSAF_2026,
  TAUX_ARRCO_2026,
  RGDU_2026,
  ABATTEMENT_CSG,
  EXONERATION_APPRENTISSAGE_2026,
  REMUN_MIN_APPRENTISSAGE_2026,
  REMUN_MIN_CONTRAT_PRO_2026,
} from "./2026";

// ─────────────────────────────────────────────────────────────────────────────
// Type ParamsBundle — snapshot complet d'un millésime
// ─────────────────────────────────────────────────────────────────────────────

export interface ParamsBundle {
  millesime: string;
  /** Date d'entrée en vigueur du millésime */
  depuis: Date;
  /** Paramètres généraux (SMIC, PASS, heures légales…) */
  params: ParamsReglementaires;
  /** Taux Urssaf (maladie, vieillesse, AF, chômage…) */
  tauxUrssaf: typeof TAUX_URSSAF_2026;
  /** Taux Agirc-Arrco (T1, T2, CEG, CET, APEC) */
  tauxArrco: typeof TAUX_ARRCO_2026;
  /** Paramètres RGDU */
  rgdu: typeof RGDU_2026;
  /** Taux d'abattement CSG (ex. 0.9825) */
  abattementCsg: number;
  /** Grilles exonération apprentissage */
  exoApprentissage: typeof EXONERATION_APPRENTISSAGE_2026;
  /** Rémunérations minimales apprentissage par tranche */
  remunMinApprentissage: Record<string, number>;
  /** Rémunérations minimales contrat pro par tranche */
  remunMinContratPro: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registre des millésimes disponibles
// ─────────────────────────────────────────────────────────────────────────────

export const REGISTRE_MILLESIMES: Record<string, ParamsBundle> = {
  "2026": {
    millesime: "2026",
    depuis: new Date("2026-01-01"),
    params: PARAMS_2026,
    tauxUrssaf: TAUX_URSSAF_2026,
    tauxArrco: TAUX_ARRCO_2026,
    rgdu: RGDU_2026,
    abattementCsg: ABATTEMENT_CSG,
    exoApprentissage: EXONERATION_APPRENTISSAGE_2026,
    remunMinApprentissage: REMUN_MIN_APPRENTISSAGE_2026,
    remunMinContratPro: REMUN_MIN_CONTRAT_PRO_2026,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Métadonnées d'affichage (admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface MetadataMillesime {
  millesime: string;
  label: string;
  description: string;
  depuis: string;  // ISO "YYYY-MM-DD"
  sources: string[];
}

export const METADATA_MILLESIMES: MetadataMillesime[] = [
  {
    millesime: "2026",
    label: "Millésime 2026",
    description:
      "Paramètres réglementaires 2026 — Urssaf, BOSS, Agirc-Arrco, Service-Public.fr",
    depuis: "2026-01-01",
    sources: [
      "Circulaire Urssaf 2026",
      "BOSS (Bulletin Officiel de la Sécurité Sociale) — janvier 2026",
      "Accord national interprofessionnel Agirc-Arrco — novembre 2023",
      "Décret SMIC — décembre 2025",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers publics
// ─────────────────────────────────────────────────────────────────────────────

/** Liste des millésimes disponibles, triés du plus récent au plus ancien. */
export const AVAILABLE_MILLESIMES: string[] = Object.keys(REGISTRE_MILLESIMES)
  .sort()
  .reverse();

/** Millésime par défaut (le plus récent disponible). */
export const DEFAULT_MILLESIME: string = AVAILABLE_MILLESIMES[0] ?? "2026";

/**
 * Retourne le millésime applicable pour une date de référence.
 * Sélectionne le bundle le plus récent dont la date `depuis` est ≤ à la date de référence.
 *
 * @param date - Date de référence (défaut : date courante)
 */
export function getMillesimeActif(date?: Date): string {
  const ref = (date ?? new Date()).getTime();
  const candidats = Object.values(REGISTRE_MILLESIMES)
    .filter((b) => b.depuis.getTime() <= ref)
    .sort((a, b) => b.depuis.getTime() - a.depuis.getTime());
  return candidats[0]?.millesime ?? DEFAULT_MILLESIME;
}

/**
 * Retourne le bundle complet de paramètres pour un millésime donné.
 * Utilise le millésime actif si non spécifié ou inconnu.
 */
export function getParamsBundle(millesime?: string | null, date?: Date): ParamsBundle {
  const key = millesime ?? getMillesimeActif(date);
  return REGISTRE_MILLESIMES[key] ?? REGISTRE_MILLESIMES[DEFAULT_MILLESIME];
}

/**
 * Retourne uniquement les `ParamsReglementaires` pour un millésime.
 * Rétrocompatibilité avec l'ancienne API `getParams()`.
 */
export function getParams(millesime?: string | null, date?: Date): ParamsReglementaires {
  return getParamsBundle(millesime, date).params;
}
