"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import { uniteDOeuvreSchema, type UniteDOeuvreRow } from "@/lib/schemas/unites-oeuvre";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateRows(rows: UniteDOeuvreRow[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const result = uniteDOeuvreSchema.safeParse(row);
    if (!result.success) {
      const issue = result.error?.issues[0];
      const field = (issue?.path ?? [])
        .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
        .join(".");
      const msg = issue?.message ?? "Données invalides";
      const rowName =
        typeof row.libelle === "string" && row.libelle.trim()
          ? row.libelle.trim()
          : `unité ${i + 1}`;
      return field ? `« ${rowName} » — ${field} : ${msg}` : `« ${rowName} » : ${msg}`;
    }
  }
  return null;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchUnitesDOeuvre(dossierId: string): Promise<UniteDOeuvreRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const rows = await prisma.uniteDOeuvre.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { ordre: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      actif: r.actif,
      libelle: r.libelle,
      typeUnite: r.typeUnite as UniteDOeuvreRow["typeUnite"],
      typeIndicateur: r.typeIndicateur as UniteDOeuvreRow["typeIndicateur"],
      typeDuree: r.typeDuree as UniteDOeuvreRow["typeDuree"],
      ordre: r.ordre,
      n: {
        indicateurBase: Number(r.indicateurBaseN),
        partPct: Number(r.partPctN),
        chiffreAffaires: Number(r.chiffreAffairesN),
        nbJours: Number(r.nbJoursN),
        parJour: Number(r.parJourN),
        prixMoyen: Number(r.prixMoyenN),
        quantite: Number(r.quantiteN),
      },
      n1: {
        indicateurBase: Number(r.indicateurBaseN1),
        partPct: Number(r.partPctN1),
        chiffreAffaires: Number(r.chiffreAffairesN1),
        nbJours: Number(r.nbJoursN1),
        parJour: Number(r.parJourN1),
        prixMoyen: Number(r.prixMoyenN1),
        quantite: Number(r.quantiteN1),
      },
      n2: {
        indicateurBase: Number(r.indicateurBaseN2),
        partPct: Number(r.partPctN2),
        chiffreAffaires: Number(r.chiffreAffairesN2),
        nbJours: Number(r.nbJoursN2),
        parJour: Number(r.parJourN2),
        prixMoyen: Number(r.prixMoyenN2),
        quantite: Number(r.quantiteN2),
      },
    }));
  } catch (error) {
    console.error("[fetchUnitesDOeuvre]", error);
    throw new Error("Impossible de charger les unités d'œuvre");
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveUnitesDOeuvre(
  dossierId: string,
  rows: UniteDOeuvreRow[]
): Promise<ActionResult & { rows?: UniteDOeuvreRow[] }> {
  try {
    const err = validateRows(rows);
    if (err) return { success: false, error: err };

    const scenarioId = await getOrCreateDefaultScenario(dossierId);

    const saved = await prisma.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.uniteDOeuvre.deleteMany({
        where: { scenarioId, id: { notIn: keepIds } },
      });

      const results: UniteDOeuvreRow[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const data = {
          actif: row.actif,
          libelle: row.libelle,
          typeUnite: row.typeUnite,
          typeIndicateur: row.typeIndicateur,
          typeDuree: row.typeDuree,
          ordre: i,
          indicateurBaseN: row.n.indicateurBase,
          partPctN: row.n.partPct,
          chiffreAffairesN: row.n.chiffreAffaires,
          nbJoursN: row.n.nbJours,
          parJourN: row.n.parJour,
          prixMoyenN: row.n.prixMoyen,
          quantiteN: row.n.quantite,
          indicateurBaseN1: row.n1.indicateurBase,
          partPctN1: row.n1.partPct,
          chiffreAffairesN1: row.n1.chiffreAffaires,
          nbJoursN1: row.n1.nbJours,
          parJourN1: row.n1.parJour,
          prixMoyenN1: row.n1.prixMoyen,
          quantiteN1: row.n1.quantite,
          indicateurBaseN2: row.n2.indicateurBase,
          partPctN2: row.n2.partPct,
          chiffreAffairesN2: row.n2.chiffreAffaires,
          nbJoursN2: row.n2.nbJours,
          parJourN2: row.n2.parJour,
          prixMoyenN2: row.n2.prixMoyen,
          quantiteN2: row.n2.quantite,
          scenarioId,
        };

        if (row.id) {
          const updated = await tx.uniteDOeuvre.update({
            where: { id: row.id },
            data,
          });
          results.push({ ...row, id: updated.id });
        } else {
          const created = await tx.uniteDOeuvre.create({ data });
          results.push({ ...row, id: created.id });
        }
      }
      return results;
    });

    return { success: true, message: "Unités d'œuvre enregistrées", rows: saved };
  } catch (error) {
    console.error("[saveUnitesDOeuvre]", error);
    return { success: false, error: "Erreur lors de l'enregistrement des unités d'œuvre" };
  }
}
