/**
 * Re-export du type de données de scénario.
 * La définition reste dans fetch-scenario.ts car elle est dérivée du type
 * de retour Prisma : `Awaited<ReturnType<typeof fetchScenarioData>>`.
 */
export type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
