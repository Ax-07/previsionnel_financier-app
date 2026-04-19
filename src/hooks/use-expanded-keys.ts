import { useCallback, useState } from "react";

/**
 * Gère un ensemble de clés "dépliées" pour les arbres récursifs des onglets de contrôle.
 * La logique est : une clé présente dans le Set = ligne dépliée.
 */
export function useExpandedKeys(initialKeys: Iterable<string> = []) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(initialKeys),
  );

  const handleToggle = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { expandedKeys, handleToggle } as const;
}
