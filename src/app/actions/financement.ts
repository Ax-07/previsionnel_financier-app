"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultScenario } from "@/lib/db/scenario";
import {
  apportSchema,
  empruntSchema,
  type ApportRow,
  type EmpruntRow,
  type LigneEcheancier,
  type EmpruntWithEcheancier,
} from "@/lib/schemas/financement";
import { calculerEcheancier } from "@/lib/calcul/echeancier";

export type ActionResult =
  | { success: true; message: string; id?: string }
  | { success: false; error: string };

// ── Helpers internes ─────────────────────────────────────────────────────────

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}

function buildLignesEcheancier(empruntId: string, data: EmpruntRow) {
  const lignes: LigneEcheancier[] = calculerEcheancier({
    montant:               data.montant,
    tauxAnnuel:            data.tauxAnnuel,
    tauxAssurance:         data.tauxAssurance,
    dureeEnMois:           data.dureeEnMois,
    periodicite:           data.periodicite,
    dateDéblocage:         data.dateDéblocage,
    typeDiffere:           data.typeDiffere,
    dureeDiffereEnMois:    data.dureeDiffereEnMois,
    fraisDossier:          data.fraisDossier,
    typeEmprunt:           data.typeEmprunt,
    modaliteRemboursement: data.modaliteRemboursement,
    modeAssurance:         data.modeAssurance,
  });

  return lignes.map((l) => ({
    empruntId,
    moisNumero:           l.moisNumero,
    dateEcheance:         new Date(l.dateEcheance),
    capitalRestantDebut:  l.capitalRestantDebut,
    interesMois:          l.interesMois,
    assuranceMois:        l.assuranceMois,
    capitalRembourse:     l.capitalRembourse,
    mensualiteTotale:     l.mensualiteTotale,
    capitalRestantFin:    l.capitalRestantFin,
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPORTS EN CAPITAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchApports(dossierId: string): Promise<ApportRow[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const items = await prisma.apport.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { createdAt: "asc" },
    });

    return items.map((item, idx) => ({
      id:           item.id,
      libelle:      item.libelle,
      type:         item.type as ApportRow["type"],
      montant:      Number(item.montant),
      dateApport:   item.dateApport.toISOString().slice(0, 10),
      remboursable: item.remboursable,
      actif:        true,
      ordre:        idx,
    }));
  } catch (err) {
    console.error("[fetchApports]", err);
    return [];
  }
}

export async function upsertApport(
  dossierId: string,
  rawData: ApportRow
): Promise<ActionResult> {
  const parsed = apportSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const payload = {
      libelle:      data.libelle,
      type:         data.type,
      montant:      data.montant,
      dateApport:   new Date(data.dateApport),
      remboursable: data.remboursable ?? false,
      scenarioId,
    };

    let id = data.id;
    if (id) {
      await prisma.apport.update({ where: { id }, data: payload });
    } else {
      const created = await prisma.apport.create({ data: payload });
      id = created.id;
    }

    return { success: true, message: data.id ? "Apport mis à jour." : "Apport créé.", id };
  } catch (err) {
    console.error("[upsertApport]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Apport introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteApport(id: string): Promise<ActionResult> {
  try {
    await prisma.apport.delete({ where: { id } });
    return { success: true, message: "Apport supprimé." };
  } catch (err) {
    console.error("[deleteApport]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Apport introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPRUNTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchEmprunts(dossierId: string): Promise<EmpruntWithEcheancier[]> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { dossierId, isDefault: true },
      select: { id: true },
    });
    if (!scenario) return [];

    const items = await prisma.emprunt.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { createdAt: "asc" },
      include: { lignesEcheancier: { orderBy: { moisNumero: "asc" } } },
    });

    return items.map((item, idx) => ({
      id:                    item.id,
      libelle:               item.libelle,
      montant:               Number(item.montant),
      tauxAnnuel:            Number(item.tauxAnnuel),
      tauxAssurance:         Number(item.tauxAssurance),
      dureeEnMois:           item.dureeEnMois,
      periodicite:           item.periodicite as EmpruntRow["periodicite"],
      dateDéblocage:         item.dateDéblocage.toISOString().slice(0, 10),
      typeDiffere:           item.typeDiffere as EmpruntRow["typeDiffere"],
      dureeDiffereEnMois:    item.dureeDiffereEnMois,
      fraisDossier:          Number(item.fraisDossier),
      typeEmprunt:           item.typeEmprunt as EmpruntRow["typeEmprunt"],
      modaliteRemboursement: item.modaliteRemboursement as EmpruntRow["modaliteRemboursement"],
      modeAssurance:         item.modeAssurance as EmpruntRow["modeAssurance"],
      actif:                 true,
      ordre:                 idx,
      lignesEcheancier:   item.lignesEcheancier.map((l) => ({
        moisNumero:           l.moisNumero,
        dateEcheance:         l.dateEcheance.toISOString().slice(0, 10),
        capitalRestantDebut:  Number(l.capitalRestantDebut),
        interesMois:          Number(l.interesMois),
        assuranceMois:        Number(l.assuranceMois),
        capitalRembourse:     Number(l.capitalRembourse),
        mensualiteTotale:     Number(l.mensualiteTotale),
        capitalRestantFin:    Number(l.capitalRestantFin),
      })),
    }));
  } catch (err) {
    console.error("[fetchEmprunts]", err);
    return [];
  }
}

export async function upsertEmprunt(
  dossierId: string,
  rawData: EmpruntRow
): Promise<ActionResult> {
  const parsed = empruntSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const scenarioId = await getOrCreateDefaultScenario(dossierId);
    const payload = {
      libelle:               data.libelle,
      montant:               data.montant,
      tauxAnnuel:            data.tauxAnnuel,
      tauxAssurance:         data.tauxAssurance,
      dureeEnMois:           data.dureeEnMois,
      periodicite:           data.periodicite,
      dateDéblocage:         new Date(data.dateDéblocage),
      typeDiffere:           data.typeDiffere,
      dureeDiffereEnMois:    data.dureeDiffereEnMois,
      fraisDossier:          data.fraisDossier,
      typeEmprunt:           data.typeEmprunt,
      modaliteRemboursement: data.modaliteRemboursement,
      modeAssurance:         data.modeAssurance,
      scenarioId,
    };

    const isUpdate = !!data.id;

    const id = await prisma.$transaction(async (tx) => {
      let empruntId = data.id;
      if (empruntId) {
        await tx.emprunt.update({ where: { id: empruntId }, data: payload });
      } else {
        const created = await tx.emprunt.create({ data: payload });
        empruntId = created.id;
      }

      const lignes = buildLignesEcheancier(empruntId, data);
      await tx.ligneEcheancier.deleteMany({ where: { empruntId } });
      if (lignes.length > 0) {
        await tx.ligneEcheancier.createMany({ data: lignes });
      }

      return empruntId;
    });

    return { success: true, message: isUpdate ? "Emprunt mis à jour." : "Emprunt créé.", id };
  } catch (err) {
    console.error("[upsertEmprunt]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Emprunt introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function deleteEmprunt(id: string): Promise<ActionResult> {
  try {
    await prisma.emprunt.delete({ where: { id } });
    return { success: true, message: "Emprunt supprimé." };
  } catch (err) {
    console.error("[deleteEmprunt]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Emprunt introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}
