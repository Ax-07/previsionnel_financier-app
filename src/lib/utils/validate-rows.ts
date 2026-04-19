/**
 * Valide un tableau de lignes avec un parser Zod.
 * Retourne un message d'erreur enrichi (avec libellé de la ligne + champ fautif)
 * ou `null` si tout est valide.
 */
export function validateRows<T>(
  rows: T[],
  parser: {
    safeParse: (v: unknown) => {
      success: boolean;
      error?: { issues: Array<{ message: string; path: PropertyKey[] }> };
    };
  },
): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const result = parser.safeParse(row);
    if (!result.success) {
      const issue = result.error?.issues[0];
      const field = (issue?.path ?? [])
        .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
        .join(".");
      const msg = issue?.message ?? "Données invalides";
      const label = (row as Record<string, unknown>)["libelle"];
      const rowName =
        typeof label === "string" && label.trim() ? label.trim() : `ligne ${i + 1}`;
      return field ? `« ${rowName} » — ${field} : ${msg}` : `« ${rowName} » : ${msg}`;
    }
  }
  return null;
}
