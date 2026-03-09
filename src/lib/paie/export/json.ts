/**
 * Export JSON d'une simulation de bulletin de paie.
 *
 * Le payload exporté est auto-documenté et inclut :
 *   - La version du moteur
 *   - Le timestamp de génération
 *   - Les inputs complets (sans données personnelles sensibles)
 *   - Le résultat complet avec toutes les lignes de cotisations
 *   - Les paramètres réglementaires utilisés (millésime)
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Structure du payload JSON
// ─────────────────────────────────────────────────────────────────────────────

export interface BulletinExportJSON {
  meta: {
    /** Version du moteur */
    moteurVersion: string;
    /** Millésime réglementaire */
    millesime: string;
    /** Date et heure de génération (ISO 8601) */
    generatedAt: string;
  };
  input: SimulationInput;
  resultat: SimulationResultat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction du payload
// ─────────────────────────────────────────────────────────────────────────────

const MOTEUR_VERSION = "2.0.0";

export function buildExportJSON(
  input: SimulationInput,
  resultat: SimulationResultat,
): BulletinExportJSON {
  return {
    meta: {
      moteurVersion: MOTEUR_VERSION,
      millesime: input.millesime ?? "2026",
      generatedAt: new Date().toISOString(),
    },
    input,
    resultat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Téléchargement côté client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère et télécharge le bulletin au format JSON côté navigateur.
 *
 * @param input    - Paramètres de la simulation
 * @param resultat - Résultat calculé
 * @param filename - Nom du fichier sans extension (défaut : "bulletin-paie")
 */
export function downloadBulletinJSON(
  input: SimulationInput,
  resultat: SimulationResultat,
  filename = "bulletin-paie",
): void {
  const payload = buildExportJSON(input, resultat);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
