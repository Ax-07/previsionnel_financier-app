/**
 * Catalogue officiel des conventions collectives supportées.
 *
 * Ajouter une entrée ici pour référencer un IDCC dans l'interface utilisateur
 * et dans le moteur de calcul.
 *
 * L'implémentation des règles métier est dans ./idcc/<code>.ts
 */

import type { ConventionMetadata } from "@/lib/paie/conventions/types";

/**
 * Catalogue des 10 IDCC prioritaires (Lot 6).
 * Clé = code IDCC sous forme de chaîne (ex. "1486").
 */
export const CONVENTION_CATALOG: ReadonlyMap<string, ConventionMetadata> =
  new Map<string, ConventionMetadata>([
    [
      "1979",
      {
        idcc: "1979",
        label: "HCR — Hôtels, cafés, restaurants",
        version: "2026-01-01",
        branches: ["restauration", "hôtellerie", "cafés"],
        dateEffet: "2024-06-01",  // avenant n°33, juin 2024
        statut: "verified" as const,
      },
    ],
    [
      "1597",
      {
        idcc: "1597",
        label: "BTP — Ouvriers du bâtiment (Confédération)",
        version: "2026-01-01",
        branches: ["bâtiment", "travaux publics"],
        statut: "partial" as const,
      },
    ],
    [
      "3248",
      {
        idcc: "3248",
        label: "Métallurgie",
        version: "2024-01-01",
        branches: ["industrie", "métallurgie", "électronique"],
        dateEffet: "2024-01-01",
        statut: "partial" as const,
      },
    ],
    [
      "16",
      {
        idcc: "16",
        label: "Transport routier et activités auxiliaires",
        version: "2026-01-01",
        branches: ["transport", "logistique"],
        statut: "partial" as const,
      },
    ],
    [
      "1486",
      {
        idcc: "1486",
        label: "Syntec — Bureaux d'études, informatique, conseil",
        version: "2026-01-01",
        branches: ["informatique", "conseil", "ingénierie", "bureaux d'études"],
        dateEffet: "2024-11-01",  // arr. extension 08/11/2024 (accord 26/06/2024)
        statut: "verified" as const,
      },
    ],
    [
      "1351",
      {
        idcc: "1351",
        label: "Sécurité privée",
        version: "2026-01-01",
        branches: ["sécurité", "gardiennage", "surveillance"],
        statut: "partial" as const,
      },
    ],
    [
      "3043",
      {
        idcc: "3043",
        label: "Propreté et services associés",
        version: "2026-01-01",
        branches: ["propreté", "nettoyage"],
        dateEffet: "2025-03-05",  // avenant n°26 du 05/03/2025
        statut: "verified" as const,
      },
    ],
    [
      "1245",
      {
        idcc: "1245",
        label: "Commerce de détail non alimentaire",
        version: "2026-01-01",
        branches: [
          "commerce",
          "détail",
          "habillement",
          "maroquinerie",
          "chaussures",
        ],
        statut: "partial" as const,
      },
    ],
    [
      "1266",
      {
        idcc: "1266",
        label: "Restauration collective",
        version: "2026-01-01",
        branches: ["restauration", "collectivité", "entreprise"],
        dateEffet: "2024-04-15",  // avenant n°65 du 15/04/2024
        statut: "verified" as const,
      },
    ],
    [
      "2941",
      {
        idcc: "2941",
        label: "Services à la personne — Aide à domicile (BAD/ADMR)",
        version: "2026-01-01",
        branches: ["aide à domicile", "services à la personne", "medico-social"],
        dateEffet: "2023-01-01",  // avenant 61/2023
        statut: "partial" as const,  // structure filières non complète
      },
    ],
  ]);

/**
 * Renvoie vrai si le code IDCC est dans le catalogue.
 */
export function isConventionSupported(idcc: string): boolean {
  return CONVENTION_CATALOG.has(idcc);
}

/**
 * Renvoie les métadonnées d'une convention (ou undefined si inconnue).
 */
export function getConventionMetadata(
  idcc: string
): ConventionMetadata | undefined {
  return CONVENTION_CATALOG.get(idcc);
}
