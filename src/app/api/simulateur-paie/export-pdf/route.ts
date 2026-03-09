/**
 * Route API POST /api/simulateur-paie/export-pdf
 *
 * Accepte un `SimulationInput`, exécute `simulate()` côté serveur,
 * et retourne un document HTML complet prêt à imprimer / sauvegarder en PDF.
 *
 * Le client peut ouvrir cette réponse dans un nouvel onglet et déclencher
 * window.print() pour obtenir un PDF via la boîte de dialogue d'impression.
 */

import { NextResponse } from "next/server";
import { simulate } from "@/lib/paie/simulate";
import { buildBulletinHtml } from "@/lib/paie/export/html";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Validation minimale (schema léger sans Zod pour garder la route légère)
// ─────────────────────────────────────────────────────────────────────────────

function isValidInput(body: unknown): body is SimulationInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.salarié !== "object" || b.salarié === null) return false;
  if (typeof b.entreprise !== "object" || b.entreprise === null) return false;
  const sal = b.salarié as Record<string, unknown>;
  if (typeof sal.brutMensuel !== "number") return false;
  if (typeof sal.heuresContrat !== "number") return false;
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
      { error: "Paramètres manquants ou invalides : salarié.brutMensuel et heuresContrat requis." },
      { status: 422 },
    );
  }

  let resultat;
  try {
    resultat = simulate(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de calcul inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const html = buildBulletinHtml(body, resultat);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
