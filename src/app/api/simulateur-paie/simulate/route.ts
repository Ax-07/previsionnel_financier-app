/**
 * Route API POST /api/simulateur-paie/simulate
 *
 * Exécute le moteur de paie côté serveur et retourne le `SimulationResultat`
 * complet au format JSON.
 *
 * Usages prévus :
 *   - Calcul batch (DSN, export multi-salariés)
 *   - Intégrations tierces sans accès au bundle client
 *   - Tests d'intégration contre le moteur versionné en production
 *
 * @example
 * POST /api/simulateur-paie/simulate
 * Content-Type: application/json
 *
 * {
 *   "salarié": { "statut": "non_cadre", "typeContrat": "CDI", "heuresContrat": 151.67, "brutMensuel": 1802 },
 *   "entreprise": { "effectif": 10, "tauxATMP": 0.021 }
 * }
 */

import { NextResponse } from "next/server";
import { simulate } from "@/lib/paie/simulate";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Validation d'entrée (garde-fou minimal — champs obligatoires uniquement)
// ─────────────────────────────────────────────────────────────────────────────

function isValidInput(body: unknown): body is SimulationInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.salarié !== "object" || b.salarié === null) return false;
  if (typeof b.entreprise !== "object" || b.entreprise === null) return false;
  const sal = b.salarié as Record<string, unknown>;
  const ent = b.entreprise as Record<string, unknown>;
  if (typeof sal.brutMensuel !== "number" || sal.brutMensuel < 0) return false;
  if (typeof sal.heuresContrat !== "number" || sal.heuresContrat <= 0) return false;
  if (typeof ent.effectif !== "number" || ent.effectif < 0) return false;
  if (typeof ent.tauxATMP !== "number" || ent.tauxATMP < 0) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de la requête invalide (JSON attendu)." },
      { status: 400 },
    );
  }

  if (!isValidInput(body)) {
    return NextResponse.json(
      {
        error:
          "Paramètres manquants ou invalides. Champs requis : salarié.brutMensuel (≥ 0), salarié.heuresContrat (> 0), entreprise.effectif (≥ 0), entreprise.tauxATMP (≥ 0).",
      },
      { status: 422 },
    );
  }

  try {
    const resultat = simulate(body);
    return NextResponse.json(resultat, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne du moteur de calcul.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
