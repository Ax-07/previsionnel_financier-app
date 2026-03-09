import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const RAISONS_SOCIALES = [
  { value: "Association",  label: "Association" },
  { value: "EI",           label: "Entreprise individuelle (EI)" },
  { value: "EIRL",         label: "Entreprise individuelle à responsabilité limitée (EIRL)" },
  { value: "EURL",         label: "Entreprise unipersonnelle à responsabilité limitée (EURL)" },
  { value: "GIE",          label: "Groupe d'intérêt économique (GIE)" },
  { value: "SA",           label: "Société anonyme (SA)" },
  { value: "SARL",         label: "Société à responsabilité limitée (SARL)" },
  { value: "SAS",          label: "Société par actions simplifiée (SAS)" },
  { value: "SASU",         label: "Société par actions simplifiée unipersonnelle (SASU)" },
  { value: "SCA",          label: "Société en commandite par actions (SCA)" },
  { value: "SCI",          label: "Société civile immobilière (SCI)" },
  { value: "SCM",          label: "Société civile de moyens (SCM)" },
  { value: "SCP",          label: "Société civile professionnelle (SCP)" },
  { value: "SCS",          label: "Société en commandite simple (SCS)" },
  { value: "SEL",          label: "Société d'exercice libéral (SEL)" },
  { value: "SEP",          label: "Société d'exercice professionnel (SEP)" },
  { value: "SNC",          label: "Société en nom collectif (SNC)" },
  { value: "M.",           label: "Monsieur" },
  { value: "Mme",          label: "Madame" },
  { value: "Mlle",         label: "Mademoiselle" },
  { value: "Autre",        label: "Autre" },
] as const;

export type RaisonSociale = (typeof RAISONS_SOCIALES)[number]["value"];

export const CIVILITES = [
  "Monsieur",
  "Madame",
  "Mademoiselle",
  "Maître",
  "Docteur",
  "Autre",
] as const;

export type Civilite = (typeof CIVILITES)[number];

export const FONCTIONS = [
  "Chef d'entreprise",
  "Cheffe d'entreprise",
  "Entrepreneur individuel",
  "Entrepreneuse individuelle",
  "Gérant",
  "Gérante",
  "Président",
  "Présidente",
  "Président directeur général",
  "Présidente directrice générale",
  "Président du conseil d'administration",
  "Présidente du conseil d'administration",
  "Directeur général",
  "Directrice générale",
  "Directeur Administratif et financier",
  "Directrice Administrative et financière",
  "Administrateur",
  "Administratrice",
  "Président de l'association",
  "Présidente de l'association",
] as const;

export type Fonction = (typeof FONCTIONS)[number];

// ── Schéma Zod ──────────────────────────────────────────────────────────────

export const porteurSchema = z.object({
  // Dossier
  reference: z
    .string()
    .max(50, "50 caractères maximum")
    .optional()
    .or(z.literal("")),
  raisonSociale: z.string().optional().or(z.literal("")),
  nom: z
    .string()
    .min(1, "Le nom de la société est obligatoire")
    .max(255, "255 caractères maximum"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit comporter 14 chiffres")
    .optional()
    .or(z.literal("")),
  activiteSociete: z.string().max(255).optional().or(z.literal("")),

  // Responsable
  responsableCivilite: z.string().optional().or(z.literal("")),
  responsableNom: z.string().max(100).optional().or(z.literal("")),
  responsablePrenom: z.string().max(100).optional().or(z.literal("")),
  responsableFonction: z.string().optional().or(z.literal("")),

  // Coordonnées
  adresse1: z.string().max(255).optional().or(z.literal("")),
  adresse2: z.string().max(255).optional().or(z.literal("")),
  codePostal: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)")
    .optional()
    .or(z.literal("")),
  ville: z.string().max(100).optional().or(z.literal("")),
  pays: z.string().max(100).optional().or(z.literal("")),
  telephone: z
    .string()
    .regex(/^[0-9+\s().]{0,20}$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
  portable: z
    .string()
    .regex(/^[0-9+\s().]{0,20}$/, "Numéro invalide")
    .optional()
    .or(z.literal("")),
  telecopie: z
    .string()
    .regex(/^[0-9+\s().]{0,20}$/, "Numéro invalide")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
});

export type PorteurFormValues = z.infer<typeof porteurSchema>;
