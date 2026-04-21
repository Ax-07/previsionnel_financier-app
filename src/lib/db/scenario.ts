import { prisma } from "@/lib/prisma";

/**
 * Trouve ou crée le scénario par défaut d'un dossier.
 * Retourne l'id du scénario.
 */
export async function getOrCreateDefaultScenario(
  dossierId: string,
): Promise<string> {
  const existing = await prisma.scenario.findFirst({
    where: { dossierId, isDefault: true },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.scenario.create({
    data: { nom: "Scénario réaliste", isDefault: true, dossierId },
    select: { id: true },
  });
  return created.id;
}