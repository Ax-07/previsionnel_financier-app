/**
 * Libellés des familles de cotisations sociales.
 *
 * Source unique partagée entre CotisationLine, BulletinDisplay et BulletinPdfTemplate.
 */

/** Labels courts pour l'affichage tableau et badges */
export const LIBELLES_FAMILLE: Record<string, string> = {
  assurance_maladie: "Maladie",
  assurance_vieillesse: "Vieillesse",
  allocations_familiales: "Alloc. familiales",
  assurance_chomage: "Chômage",
  ags: "AGS",
  fnal: "FNAL",
  csa: "CSA",
  dialogue_social: "Dialogue social",
  csg_deductible: "CSG déductible",
  csg_non_deductible: "CSG non déd.",
  crds: "CRDS",
  at_mp: "AT/MP",
  versement_mobilite: "Mobilité",
  retraite_complementaire: "Retraite compl.",
  ceg: "CEG",
  cet: "CET",
  apec: "APEC",
  exoneration: "Exonération",
  rgdu: "RGDU",
  prevoyance_mutuelle: "Mutuelle",
  prevoyance_prevoyance: "Prévoyance",
  taxe_apprentissage: "Taxe apprentissage",
  formation_professionnelle: "Formation pro.",
};

/** Labels longs pour l'export PDF bulletin */
export const FAMILLE_LABELS_PDF: Record<string, string> = {
  assurance_maladie: "Santé",
  assurance_vieillesse: "Assurance vieillesse",
  allocations_familiales: "Allocations familiales",
  assurance_chomage: "Assurance chômage",
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
  apec: "APEC",
  prevoyance_prevoyance: "Prévoyance (Convention collective)",
  prevoyance_mutuelle: "Mutuelle (Convention collective)",
  exoneration: "Exonérations",
  rgdu: "Réduction générale (RGDU)",
  taxe_apprentissage: "Taxe apprentissage",
  formation_professionnelle: "Formation professionnelle",
};
