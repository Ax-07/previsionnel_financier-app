/**
 * Types du système d'extension ProfileEngine.
 *
 * Utilisés par le Lot P — Infrastructure d'extension du moteur de paie.
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §3
 */

/**
 * Code identifiant un profil réglementaire salarié.
 *
 * Les valeurs litérales couvrent les profils connus (Lots 0–12).
 * Le type est ouvert `(string & {})` pour permettre l'ajout futur de profils
 * via PROFILE_REGISTRY sans modification de ce fichier.
 */
export type ProfileCode =
  // ── Régime général (Lots 0–4 — terminés) ──────────────────────────────────
  | "regime_general"
  | "apprentissage"
  | "contrat_pro"
  | "stage"
  // ── Lots 5–8 (priorité 1–2) ────────────────────────────────────────────────
  | "btp_ouvrier"
  // ── Lots 10–11 (priorité 4) ────────────────────────────────────────────────
  | "intermittent_artiste"
  | "intermittent_technicien"
  | "vrp_multicarte"
  | "journaliste"
  | "marin"
  // ── Lot 9 (priorité 3) — mobilité internationale ──────────────────────────
  | "international_expatrie"
  | "international_detache"
  | "international_impatie"
  | "international_split"
  // ── Lot 12 (priorité 5) — secteur public ──────────────────────────────────
  | "public_fpe_titulaire"
  | "public_fpt_titulaire"
  | "public_fph_titulaire"
  | "public_contractuel"
  // ── Extensible sans modification de ce fichier ────────────────────────────
  | (string & {});

/**
 * Définition d'un profil salarié spécialisé enregistré dans PROFILE_REGISTRY.
 */
export interface SpecialProfile {
  /** Code unique du profil */
  code: ProfileCode;
  /** Label affiché dans les interfaces */
  label: string;
  /** Profil parent (pour héritage des règles — ex. apprentissage → regime_general) */
  parentProfile?: ProfileCode;
  /** Description métier */
  description?: string;
  /** Date d'entrée en vigueur du profil (ISO 8601 : "YYYY-MM-DD") */
  validFrom?: string;
  /** Date de fin de validité */
  validTo?: string;
  /** Codes de rule sets de cotisations associés (triés par priorité croissante) */
  ruleSetCodes?: string[];
}
