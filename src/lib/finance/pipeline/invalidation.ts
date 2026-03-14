/**
 * Graphe de dépendances pour le recalcul partiel du moteur financier.
 *
 * Permet d'identifier, lors de la modification d'une hypothèse, quels modules
 * doivent être recalculés en cascade (§3.4 des directives métier).
 *
 * Dans la version actuelle, `buildFinCalc` recalcule tout.
 * Ce graphe prépare le recalcul partiel via cache de résultats intermédiaires.
 */

export type CalcModule =
  | "ca"
  | "stocks"
  | "personnel"
  | "amortissements"
  | "emprunts"
  | "sig"
  | "is"
  | "caf"
  | "tva"
  | "bfr"
  | "tresorerie"
  | "bilan"
  | "ratios"
  | "seuil";

/**
 * Graphe de dépendances downstream.
 * `DOWNSTREAM[module]` = liste des modules à recalculer quand `module` change.
 */
export const DOWNSTREAM: Record<CalcModule, CalcModule[]> = {
  ca:             ["stocks", "sig", "tva", "bfr", "tresorerie", "bilan", "ratios", "seuil"],
  stocks:         ["sig", "bfr", "tresorerie", "bilan"],
  personnel:      ["sig", "is", "caf", "bfr", "tresorerie", "bilan", "ratios"],
  amortissements: ["sig", "caf", "bilan", "ratios"],
  emprunts:       ["sig", "is", "caf", "tresorerie", "bilan", "ratios"],
  sig:            ["is", "caf", "tresorerie", "bilan", "ratios", "seuil"],
  is:             ["caf", "tresorerie", "bilan", "ratios"],
  caf:            ["tresorerie", "bilan", "ratios"],
  tva:            ["tresorerie", "bfr"],
  bfr:            ["tresorerie", "bilan", "ratios"],
  tresorerie:     ["bilan"],
  bilan:          ["ratios"],
  ratios:         [],
  seuil:          [],
};

/**
 * Retourne la liste (dédupliquée) de tous les modules à recalculer en cascade
 * quand `changed` est modifié.
 */
export function getDownstream(changed: CalcModule): CalcModule[] {
  const visited = new Set<CalcModule>();
  const queue: CalcModule[] = [...(DOWNSTREAM[changed] ?? [])];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
      for (const dep of DOWNSTREAM[current] ?? []) {
        if (!visited.has(dep)) queue.push(dep);
      }
    }
  }
  return [...visited];
}
