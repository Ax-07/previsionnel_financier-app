/**
 * Types TypeScript du moteur de paie simulateur 2026.
 *
 * Ce fichier est la source unique des types d'entrée et de sortie.
 * Aucune logique de calcul ici — uniquement des définitions de formes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres d'entrée
// ─────────────────────────────────────────────────────────────────────────────

/** Type de contrat de travail */
export type TypeContrat =
  | "CDI"
  | "CDD"
  | "apprentissage"
  | "contrat_pro"
  | "stage";

// ── Import + ré-export pour éviter les imports croisés entre lib/paie/profiles/ et lib/paie/types.ts
// ProfileCode est défini dans lib/paie/profiles/types.ts pour la séparation des responsabilités.
import type { ProfileCode } from "@/lib/paie/profiles/types";
export type { ProfileCode };

/** Statut cadre ou non-cadre */
export type StatutCadre = "cadre" | "non_cadre";

/** Régime de cotisations */
export type RegimeAlsaceMoselle = boolean;

/** Génération du contrat d'apprentissage (détermine les règles d'exonération) */
export type GenerationApprenti = "avant_mars_2025" | "depuis_mars_2025";

/** Année du cycle d'apprentissage */
export type AnneeApprenti = 1 | 2 | 3;

/** Mode de versement prélèvement à la source */
export type ModePAS = "personnalise" | "neutre" | "individualise" | "absent";

/** Informations sur le salarié pour la simulation */
export interface SalarieInput {
  /** Statut cadre ou non-cadre */
  statut: StatutCadre;
  /** Type de contrat */
  typeContrat: TypeContrat;
  /** Régime Alsace-Moselle actif */
  alsaceMoselle?: boolean;
  /** Heures de travail contractuelles par mois (151,67 pour un temps plein) */
  heuresContrat: number;
  /** Heures normales travaillées ce mois */
  heuresTravaillees?: number;
  /** Salaire brut mensuel de base (entrée principale brut→net) */
  brutMensuel: number;
  /** Heures supplémentaires réalisées ce mois */
  heuresSupplementaires?: number;
  /** Taux horaire majoration heures sup (ex. 0.25 pour 25 %) */
  tauxMajorationHeuresSup?: number;
  /** Primes soumises à cotisations */
  primesSoumises?: number;
  /** Avantages en nature valorisés */
  avantagesEnNature?: number;
  /** Retenues pour absences non rémunérées */
  absencesNonRemunerees?: number;
  /** Taux PAS (ex. 0.075 pour 7,5 %) */
  tauxPAS?: number;
  /** Mode de prélèvement à la source */
  modePAS?: ModePAS;
  /**
   * Date d'entrée dans l'entreprise (ISO 8601 : "YYYY-MM-DD").
   * Si défini ET si le jour ≠ 1, le mois de référence est proratisé.
   */
  dateEntree?: string;
  /**
   * Date de sortie de l'entreprise (ISO 8601 : "YYYY-MM-DD").
   * Si défini, le mois de référence est proratisé jusqu'à cette date.
   */
  dateSortie?: string;
  /**
   * Mois de référence pour la proratisation (ISO 8601 : "YYYY-MM").
   * Si absent, le mois courant est utilisé.
   */
  moisReference?: string;
  /** Paramètres spécifiques apprentissage */
  apprentissage?: {
    generation: GenerationApprenti;
    annee: AnneeApprenti;
    ageApprenti: number;
  };

  // ── Lot P — Extension ProfileEngine ────────────────────────────────────────
  /**
   * Code de profil réglementaire explicite (Lots 5–12).
   * Si absent, le profil est déduit automatiquement depuis `typeContrat`.
   * Exemples : "btp_ouvrier", "intermittent_artiste", "public_fpe_titulaire"
   */
  profileCode?: ProfileCode;
  /**
   * Code de section ou branche professionnelle (usage futur).
   * Ex. "BTP_OUVRIERS", "HCR", "SYNTEC"
   */
  sectionCode?: string;
  /**
   * Code IDCC de la convention collective applicable (Lot 6).
   * Ex. "1486" (Syntec), "1979" (HCR), "1597" (BTP ouvriers)
   */
  conventionCode?: string;

  // ── Lot 5 — Absence avancée ─────────────────────────────────────────────────
  /**
   * Événement d'absence avancé (Lot 5 : IJSS, maintien, subrogation).
   * Si présent, le moteur d'absence calcule le maintien légal/conventionnel
   * et les IJSS estimées à l'étape 9 du pipeline.
   * Incompatible avec `absencesNonRemunerees` simple (ce champ est alors ignoré).
   */
  absenceEvent?: import("@/lib/paie/absence/types").AbsenceEvent;

  /**
   * Cumul annuel de rémunération heures supplémentaires / complémentaires
   * avant ce mois (pour calcul exonération IR — art. 81 quater CGI).
   * Défaut : 0 (début d'année, plafond 7 500 € plein disponible).
   */
  cumulHeuresSup?: number;
}

/** Informations sur l'entreprise pour la simulation */
export interface EntrepriseInput {
  /** Effectif de référence (< 50 ou ≥ 50 — impact FNAL et RGDU) */
  effectif: number;
  /** Taux AT/MP applicable (ex. 0.021 pour 2,1 %) */
  tauxATMP: number;
  /** Taux versement mobilité (ex. 0.03 pour 3 %) */
  tauxMobilite?: number;
  /**
   * Configuration mutuelle / prévoyance complémentaire (optionnel).
   * Si présent, les lignes correspondantes sont ajoutées au bulletin.
   * Importer `PrevoyanceConfig` depuis `@/lib/paie/params/prevoyance`.
   */
  prevoyance?: import("@/lib/paie/params/prevoyance").PrevoyanceConfig;
}

/** Paramètres d'une simulation complète */
export interface SimulationInput {
  /** Millésime réglementaire (ex. "2026") */
  millesime?: string;
  salarié: SalarieInput;
  entreprise: EntrepriseInput;
}

// ─────────────────────────────────────────────────────────────────────────────
// Résultats de sortie
// ─────────────────────────────────────────────────────────────────────────────

/** Famille d'une ligne de cotisation */
export type FamilleCotisation =
  | "assurance_maladie"
  | "assurance_vieillesse"
  | "allocations_familiales"
  | "assurance_chomage"
  | "ags"
  | "fnal"
  | "csa"
  | "dialogue_social"
  | "csg_deductible"
  | "csg_non_deductible"
  | "crds"
  | "at_mp"
  | "versement_mobilite"
  | "retraite_complementaire"
  | "ceg"
  | "cet"
  | "apec"
  | "exoneration"
  | "rgdu"
  | "prevoyance_mutuelle"
  | "prevoyance_prevoyance";

/** Détail d'une ligne de bulletin */
export interface LigneCotisation {
  /** Code technique unique de la ligne */
  code: string;
  /** Libellé affiché sur le bulletin */
  libelle: string;
  /** Famille de la cotisation */
  famille: FamilleCotisation;
  /** Organisme collecteur */
  organisme: string;
  /** Assiette de calcul */
  assiette: number;
  /** Tranche utilisée (ex. "T1", "T2", "totalite", "4PASS") */
  tranche: string;
  /** Taux salarié (ex. 0.069 pour 6,90 %) */
  tauxSalarie: number;
  /** Taux employeur */
  tauxEmployeur: number;
  /** Montant salarié (négatif = retenue sur salaire) */
  montantSalarie: number;
  /** Montant employeur (positif = charges patronales) */
  montantEmployeur: number;
  /** La cotisation salariale est-elle déductible fiscalement ? */
  deductible: boolean;
  /** Règle d'origine (référence paramétrique) */
  regleCode: string;
}

/** Détail d'une tranche d'heures supplémentaires pour l'affichage du bulletin */
export interface HeuresSupLigne {
  /** Libellé affiché (ex. "HS 25 % (h36–h43)") */
  label: string;
  /** Nombre d'heures mensuelles dans cette tranche */
  heures: number;
  /** Taux de majoration (ex. 0.25) */
  tauxMajoration: number;
  /** Montant € de cette tranche */
  montant: number;
}

/** Résumé global d'une simulation */
export interface SimulationResultat {
  /** Brut soumis à cotisations sociales */
  brutSoumis: number;
  /** Brut fiscal (base imposable avant cotisations) */
  brutFiscal: number;
  /** Montant heures supplémentaires effectivement appliqué (après surcharge conventionnelle) */
  heuresSup: number;
  /** Détail par tranche des heures supplémentaires (pour affichage bulletin) */
  heuresSupLignes?: HeuresSupLigne[];
  /**
   * Exonération fiscale IR des HS ce mois (art. 81 quater CGI).
   * Déduite du net imposable ; les HS restent dans le brut et les cotisations.
   */
  exonerationHSIR: number;
  /**
   * Réduction de cotisations salariales sur HS ce mois (art. L241-17 CSS).
   * Injectée comme ligne négative dans le bulletin ; augmente le net social.
   */
  reductionHSCotSal: number;
  /** Assiette CSG/CRDS (brutSoumis × 98,25 %) */
  assietteCsg: number;
  /** PMSS proratisé utilisé */
  pmssProratise: number;
  /** Base T1 Agirc-Arrco */
  baseT1: number;
  /** Base T2 Agirc-Arrco */
  baseT2: number;
  /**
   * Facteur de proratisation calendaire (0–1).
   * 1 = salarié présent tout le mois ; < 1 = entrée ou sortie en cours de mois.
   */
  facteurProrata: number;
  /** Total cotisations salariales (somme montantSalarie) */
  totalCotisationsSalariales: number;
  /** Total cotisations patronales */
  totalCotisationsPatronales: number;
  /** Montant RGDU (réduction employeur) */
  montantRGDU: number;
  /** Net social (net avant prélèvement à la source) */
  netSocial: number;
  /** Net imposable */
  netImposable: number;
  /** Prélèvement à la source */
  pas: number;
  /** Net à payer au salarié */
  netAPayer: number;
  /** Coût total employeur */
  coutEmployeur: number;
  /** Taux de cotisations patronales effectif (cotisationsPatronales / brutSoumis × 100) */
  tauxCotisationsPatronalesEffectif: number;
  /** Lignes détaillées du bulletin */
  lignes: LigneCotisation[];

  // ── Lot 5 — Détail absence ────────────────────────────────────────────────
  /**
   * Détail du calcul d'absence avancé (Lot 5).
   * Présent uniquement si `salarié.absenceEvent` était défini.
   */
  absenceDetail?: import("@/lib/paie/absence/types").ResultatAbsence;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres réglementaires internes
// ─────────────────────────────────────────────────────────────────────────────

/** Paramètres réglementaires d'un millésime */
export interface ParamsReglementaires {
  millesime: string;
  /** SMIC horaire brut */
  smicHoraire: number;
  /** SMIC mensuel brut (151,67 h) */
  smicMensuel: number;
  /** SMIC annuel de référence */
  smicAnnuel: number;
  /** Plafond annuel Sécurité Sociale */
  passAnnuel: number;
  /** Plafond mensuel Sécurité Sociale */
  passMensuel: number;
  /** Durée mensuelle légale temps plein */
  heuresLegalesMensuelles: number;
  /** Gratification minimale stage par heure */
  gratifStageHoraire: number;
}
