/**
 * Vérifie si une erreur est une erreur Prisma avec un code donné (duck-typing).
 *
 * @example
 * ```ts
 * if (isPrismaError(err, "P2025")) return { success: false, error: "Introuvable." };
 * ```
 */
export function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}
