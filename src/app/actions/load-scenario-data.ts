"use server";

import { Decimal } from "@prisma/client/runtime/client";
import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
// TODO(auth) : importer assertDossierAccess et le resolver de session Better Auth
// import { assertDossierAccess } from "@/lib/finance/fetch-scenario";
// import { auth } from "@/lib/auth";

export type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

/** Regex pour détecter les strings ISO 8601 produites par JSON.stringify sur les Date. */
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Convertit récursivement :
 *  - les Decimal Prisma → number  (replacer, avant serialisation)
 *  - les strings ISO 8601 → Date  (reviver, après désérialisation)
 * Garantit que les objets Date du serveur restent des Date côté client.
 */
function serializeDecimals<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      Decimal.isDecimal(value) ? value.toNumber() : value
    ),
    (_, value) =>
      typeof value === "string" && ISO_DATE_RE.test(value)
        ? new Date(value)
        : value
  ) as T;
}

export async function loadScenarioData(dossierId: string) {
  // TODO(auth) : décommenter une fois Better Auth configuré
  // const session = await auth();
  // if (!session?.user?.id) throw new Error("Non authentifié");
  // await assertDossierAccess(dossierId, session.user.id);
  const data = await fetchScenarioData(dossierId);
  return serializeDecimals(data);
}
