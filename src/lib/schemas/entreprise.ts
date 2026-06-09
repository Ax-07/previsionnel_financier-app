import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

// FORMES_JURIDIQUES est réexportée depuis le schéma porteur (RAISONS_SOCIALES)
// pour éviter la duplication — cf. porteur.ts

export const REGIMES_FISCAUX = [
  { value: "IS", label: "Impôt sur les sociétés (IS)" },
  { value: "IR", label: "Impôt sur le revenu (IR)" },
] as const;

export const REGIMES_TVA = [
  { value: "REEL_NORMAL",     label: "Régime réel normal" },
  { value: "REEL_SIMPLIFIE",  label: "Régime réel simplifié" },
  { value: "FRANCHISE",       label: "Franchise en base de TVA" },
] as const;

export const PERIODICITES_TVA = [
  { value: "mensuel",      label: "Mensuel" },
  { value: "trimestriel",  label: "Trimestriel" },
] as const;

// ── Schéma Zod ──────────────────────────────────────────────────────────────

export const entrepriseSchema = z.object({
  // ── Forme juridique & régimes ────────────────────────────────────────────
  formeJuridique: z.string().optional().or(z.literal("")),

  regimeFiscal: z.enum(["IS", "IR"]),

  regimeTVA: z.enum(["FRANCHISE", "REEL_SIMPLIFIE", "REEL_NORMAL"]),

  // ── TVA ──────────────────────────────────────────────────────────────────
  periodiciteDeclarationTVA: z.enum(["mensuel", "trimestriel"]),


  // ── Période prévisionnelle ────────────────────────────────────────────────
  dateDebutExerciceN: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (format attendu : AAAA-MM-JJ)")
    .optional()
    .or(z.literal("")),
  dureePrevisionnelle: z
    .number()
    .int("Entier requis")
    .min(1, "Minimum : 1 exercice")
    .max(3, "Maximum : 3 exercices en v1"),

  // ── Exercices prévisionnels ───────────────────────────────────────────────
  exercices: z
    .array(
      z.object({
        dateCloture: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
        duree: z.number().int().min(1).max(24),
        annee: z.number().int().min(2000).max(2100),
      })
    )
    .max(3, "Maximum : 3 exercices en v1")
    .optional(),
});

export type EntrepriseFormValues = z.infer<typeof entrepriseSchema>;

export type ExerciceFormValues = NonNullable<EntrepriseFormValues["exercices"]>[number];
