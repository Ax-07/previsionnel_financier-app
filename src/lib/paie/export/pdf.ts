/**
 * Export PDF d'un bulletin de paie simulé.
 *
 * Stratégie : appel POST vers `/api/simulateur-paie/export-pdf`.
 * La route retourne un document HTML complet avec auto-print activé.
 * Le client ouvre cet HTML dans un nouvel onglet → la boîte de dialogue
 * impression du navigateur permet de sauvegarder en PDF.
 *
 * Cette approche ne nécessite aucune dépendance externe (ni Puppeteer,
 * ni @react-pdf/renderer) et fonctionne sur Vercel Edge / Node runtimes.
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Export via route API + impression navigateur
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ouvre le bulletin dans un nouvel onglet et déclenche l'impression.
 * L'utilisateur peut choisir "Enregistrer en PDF" dans la boîte d'impression.
 *
 * @throws Error si la requête réseau échoue ou si le serveur retourne une erreur.
 */
export async function downloadBulletinPdf(
  input: SimulationInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _resultat: SimulationResultat, // conservé pour cohérence de signature avec json/csv
): Promise<void> {
  const response = await fetch("/api/simulateur-paie/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Erreur serveur (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // ignorer les erreurs de parsing
    }
    throw new Error(message);
  }

  const htmlBlob = await response.blob();
  const url = URL.createObjectURL(htmlBlob);

  // Ouvrir dans un nouvel onglet — le script auto-print lancera l'impression
  const win = window.open(url, "_blank");

  // Libérer l'URL objet après un délai raisonnable
  if (win) {
    win.addEventListener("load", () => {
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    });
  } else {
    // Popup bloquée — libérer quand même
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    throw new Error(
      "La fenêtre d'impression a été bloquée. Autorisez les popups pour ce site.",
    );
  }
}
