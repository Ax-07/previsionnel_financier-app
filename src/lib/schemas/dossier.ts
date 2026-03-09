import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const TYPES_DOSSIER = [
  { value: "CREATION", label: "Création" },
  { value: "REPRISE",  label: "Reprise" },
] as const;

export type TypeDossier = (typeof TYPES_DOSSIER)[number]["value"];

export const DUREES_PROJECTION = [
  { value: 3, label: "3 ans" },
  { value: 5, label: "5 ans" },
] as const;

export type DureeProjection = (typeof DUREES_PROJECTION)[number]["value"];

// ── Schéma de création d'un dossier ─────────────────────────────────────────

export const createDossierSchema = z.object({
  nom: z
    .string()
    .min(1, "Le nom du dossier est obligatoire")
    .max(255, "255 caractères maximum"),
  typeDossier: z.enum(["CREATION", "REPRISE"]),
  dateDemarrage: z
    .string()
    .min(1, "La date de démarrage est obligatoire")
    .refine((v) => !isNaN(Date.parse(v)), "Date invalide"),
  dureeProjection: z
    .union([z.literal(3), z.literal(5)], {
      error: "La durée doit être 3 ou 5 ans",
    }),
  reference: z
    .string()
    .max(50, "50 caractères maximum")
    .optional()
    .or(z.literal("")),
});

export type CreateDossierValues = z.infer<typeof createDossierSchema>;

// ── Schéma de mise à jour d’un dossier ────────────────────────────────────────────

export const updateDossierSchema = createDossierSchema.partial();
export type UpdateDossierValues = z.infer<typeof updateDossierSchema>;
