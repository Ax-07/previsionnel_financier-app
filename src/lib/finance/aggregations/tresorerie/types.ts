/**
 * Types d'entrée du tableau de trésorerie.
 * @module aggregations/tresorerie/types
 */

import type { Yk3 } from "@/lib/finance/tresorerie-types";
import type { EncaissementsResult } from "@/lib/finance/calculs/encaissements";
import type { DecaissementsResult } from "@/lib/finance/calculs/decaissements";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

export interface TresorerieRowsInput {
  enc: EncaissementsResult;
  dec: DecaissementsResult;
  soldePrecedent: Yk3;
  variation: Yk3;
  soldeFinal: Yk3;
  encoursFournisseurs: Yk3;
  immosParNature: {
    CORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    INCORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    FINANCIER: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
  };
}
