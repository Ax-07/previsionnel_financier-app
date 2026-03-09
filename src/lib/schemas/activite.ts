import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const SECTEURS_ACTIVITE = [
  { value: "PRODUCTION", label: "Production" },
  { value: "SERVICE", label: "Service" },
  { value: "NEGOCE", label: "Négoce" },
] as const;

export const HYPOTHESES_ACTIVITE = [
  { value: "limite", label: "Limite" },
  { value: "basse", label: "Basse" },
  { value: "normal", label: "Normal" },
  { value: "haute", label: "Haute" },
  { value: "detailler", label: "Détailler" },
] as const;

export const TAUX_TVA_OPTIONS = [
  { value: 0, label: "0 %" },
  { value: 2.1, label: "2,1 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 10, label: "10 %" },
  { value: 20, label: "20 %" },
] as const;

export const MODES_CALCUL_COMMISSION = [
  { value: "HT", label: "HT" },
  { value: "TTC", label: "TTC" },
] as const;

export const MODES_EXIGIBILITE_TVA = [
  { value: "FACTURATION", label: "À la facturation" },
  { value: "ENCAISSEMENT", label: "À l'encaissement" },
] as const;

export const MODES_CA = [
  { value: "CA_GLOBAL", label: "CA global" },
  { value: "CA_MENSUEL", label: "CA mensuel" },
  { value: "CA_DETAILLE", label: "CA détaillé" },
] as const;

export const MODES_MARGE = [
  { value: "MARGE_GLOBALE", label: "Marge globale" },
  { value: "TAUX_MARGE", label: "Taux de marge" },
  { value: "MARQUE", label: "Marque" },
] as const;

// ── Schéma Activité (Chiffre d'affaires) ────────────────────────────────────

export const activiteSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  secteur: z.enum(["PRODUCTION", "SERVICE", "NEGOCE"]),
  hypothese: z.enum(["limite", "basse", "normal", "haute", "detailler"]),
  
  // Projections annuelles
  montantN: z.number().min(0, "≥ 0"),
  evolutionN1: z.number(), // % évolution N→N+1
  montantN1: z.number().min(0, "≥ 0"),
  evolutionN2: z.number(), // % évolution N+1→N+2
  montantN2: z.number().min(0, "≥ 0"),
  
  // Paramètres financiers
  tauxMarge: z.number().min(0).max(100),
  stocks: z.number().int().min(0).optional(), // jours
  reglementClients: z.number().int().min(0).optional(), // jours
  tvaVentes: z.number().min(0).max(100),
  reglementFournisseurs: z.number().int().min(0).optional(), // jours
  tvaAchats: z.number().min(0).max(100),

  // Saisonnalité mensuelle par exercice (tableaux de longueur variable selon la durée réelle)
  // Structure : { N: number[], N1: number[], N2: number[] }
  saisonnaliteCA: z.record(z.string(), z.array(z.number())).optional(),
  saisonnaliteAchats: z.record(z.string(), z.array(z.number())).optional(),
  // Achats de stock ponctuels (stock initial, réassorts) par mois et par exercice
  achatsStockPonctuel: z.record(z.string(), z.array(z.number())).optional(),

  actif: z.boolean().optional(),
});

export type ActiviteRow = z.infer<typeof activiteSchema>;

// ── Schéma Activité commissionnée ───────────────────────────────────────────

export const activiteCommissionSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  hypothese: z.enum(["limite", "basse", "normal", "haute", "detailler"]),
  
  montantN: z.number().min(0, "≥ 0"),
  evolutionN1: z.number(),
  montantN1: z.number().min(0, "≥ 0"),
  evolutionN2: z.number(),
  montantN2: z.number().min(0, "≥ 0"),
  
  calculCommission: z.enum(["HT", "TTC"]),
  tauxCommission: z.number().min(0).max(100),
  tvaCommission: z.number().min(0).max(100),
  stocks: z.number().int().min(0).optional(),
  reglementFournisseurs: z.number().int().min(0).optional(),
  
  actif: z.boolean().optional(),
});

export type ActiviteCommissionRow = z.infer<typeof activiteCommissionSchema>;

// ── Schéma Production immobilisée ───────────────────────────────────────────

export const productionImmobiliseeSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  nature: z.enum(["CORPOREL", "INCORPOREL", "FINANCIER"]),
  hypothese: z.enum(["limite", "basse", "normal", "haute", "detailler"]),
  date: z.string().min(1, "Requis"),
  montant: z.number().min(0, "≥ 0"),
  amortissement: z.enum(["AUCUN", "LINEAIRE", "DEGRESSIF"]),
  differe: z.number().int().min(0).optional(),
  duree: z.number().int().min(0).optional(),
  
  actif: z.boolean().optional(),
});

export type ProductionImmobiliseeRow = z.infer<typeof productionImmobiliseeSchema>;

// ── Schéma Subventions d'exploitation ───────────────────────────────────────

export const subventionExploitationSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  hypothese: z.enum(["limite", "basse", "normal", "haute", "detailler"]),
  
  dateN: z.string().optional(),
  montantN: z.number().min(0, "≥ 0").optional(),
  dateN1: z.string().optional(),
  montantN1: z.number().min(0, "≥ 0").optional(),
  dateN2: z.string().optional(),
  montantN2: z.number().min(0, "≥ 0").optional(),
  
  tva: z.number().min(0).max(100),
  typeTva: z.enum(["RECUPERABLE", "NON_RECUPERABLE", "EXONEREE"]),
  
  actif: z.boolean().optional(),
});

export type SubventionExploitationRow = z.infer<typeof subventionExploitationSchema>;

// ── Schéma détail activité (modal) ──────────────────────────────────────────

export const detailActiviteSchema = z.object({
  // Paramètres CA
  modeCA: z.enum(["CA_GLOBAL", "CA_MENSUEL", "CA_DETAILLE"]),
  encours: z.boolean(),
  reglementClients: z.number().int().min(0),
  tvaVentes: z.number().min(0).max(100),
  exigibiliteTVAVentes: z.enum(["FACTURATION", "ENCAISSEMENT"]),
  
  // Paramètres Achats
  modeMarge: z.enum(["MARGE_GLOBALE", "TAUX_MARGE", "MARQUE"]),
  stocks: z.number().int().min(0),
  reglementFournisseurs: z.number().int().min(0),
  tvaAchats: z.number().min(0).max(100),
  exigibiliteTVAAchats: z.enum(["FACTURATION", "ENCAISSEMENT"]),
  
  // Saisonnalité (12 mois, doit sommer à 100%)
  saisonnalite: z.object({
    janvier: z.number().min(0).max(100),
    fevrier: z.number().min(0).max(100),
    mars: z.number().min(0).max(100),
    avril: z.number().min(0).max(100),
    mai: z.number().min(0).max(100),
    juin: z.number().min(0).max(100),
    juillet: z.number().min(0).max(100),
    aout: z.number().min(0).max(100),
    septembre: z.number().min(0).max(100),
    octobre: z.number().min(0).max(100),
    novembre: z.number().min(0).max(100),
    decembre: z.number().min(0).max(100),
  }).refine(
    (data) => {
      const total = Object.values(data).reduce((sum, val) => sum + val, 0);
      return Math.abs(total - 100) < 0.01; // tolérance pour erreurs d'arrondi
    },
    { message: "La somme de la saisonnalité doit être égale à 100%" }
  ),
  
  // Taux de marge par mois (pour calculs détaillés)
  tauxMarge: z.number().min(0).max(100),
});

export type DetailActiviteFormValues = z.infer<typeof detailActiviteSchema>;
