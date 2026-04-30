# Audit des Stores Zustand — Architecture & Standardisation

> Rédigé le 27 avril 2026 · Application : `previsionnel-app`

---

## 1. Vue d'ensemble

Le dossier contient **17 stores Zustand**. L'analyse révèle **4 familles de stores** avec des patterns d'implémentation sensiblement différents, et plusieurs incohérences techniques qui peuvent provoquer des bugs de performance (re-renders) ou de maintenabilité.

---

## 2. Les 4 familles de stores

### Famille A — Stores de formulaires simples

Stores sans dirty flags, sans listes multi-lignes. Simples formulaires clé-valeur.

| Store                 | Particularité                               |
| --------------------- | ------------------------------------------- |
| `entreprise-store.ts` | `getDraft()` retourne `undefined` si absent |
| `porteur-store.ts`    | Identique à `entreprise-store`              |

**Pattern :**

```ts
getDraft: (dossierId) => get().drafts[dossierId],  // undefined si absent
setDraft: (dossierId, values) => set((s) => ({
  drafts: { ...s.drafts, [dossierId]: { ...s.drafts[dossierId], ...values } }
})),
```

---

### Famille B — Stores de listes éditables (saisie)

La famille la plus nombreuse. Chaque store gère une ou plusieurs listes de lignes avec dirty flags, opérations CRUD et persistance localStorage.

| Store                      | Sections     | getDraft                         | patchDraft helper | Particularités                    |
| -------------------------- | ------------ | -------------------------------- | :---------------: | --------------------------------- |
| `activite-store.ts`        | 4            | `?? EMPTY_ACTIVITE_DRAFT`        | ❌ inline spread  | —                                 |
| `autres-charges-store.ts`  | 6            | `?? EMPTY_AUTRES_CHARGES_DRAFT`  | ✅ `patchDraft()` | `updateRow<T>()` générique        |
| `autres-produits-store.ts` | 6            | `?? EMPTY_AUTRES_PRODUITS_DRAFT` | ✅ `patchDraft()` | Identique à autres-charges        |
| `charges-store.ts`         | 3            | `?? EMPTY_CHARGES_DRAFT`         | ❌ inline spread  | Auto-calcul N1/N2, `_hasHydrated` |
| `divers-store.ts`          | 8            | `?? EMPTY_DIVERS_DRAFT`          | ❌ inline spread  | —                                 |
| `impots-fiscaux-store.ts`  | 3 + params   | `?? EMPTY_IMPOTS_DRAFT`          | ❌ inline spread  | `partialize` simplifié            |
| `personnel-store.ts`       | 7 + params   | WeakMap cache                    | ✅ `patchDraft()` | `makeListActions()`, WeakMap      |
| `tableau-libre-store.ts`   | 1 (imbriqué) | `?? EMPTY_TABLEAU_LIBRE_DRAFT`   | ✅ `patchDraft()` | Structure 3 niveaux               |
| `unites-oeuvre-store.ts`   | 1            | `?? EMPTY_UNITES_OEUVRE_DRAFT`   | ✅ `patchDraft()` | Simple, exemplaire                |

---

### Famille C — Stores d'investissement / financement (updater pattern)

Deux stores avec une API basée sur un _updater callback_ (comme `useState`), sans dirty flags de draft mais avec un flag `_dirty` sur les rows individuelles.

| Store                     | API                                                       |
| ------------------------- | --------------------------------------------------------- |
| `financement-store.ts`    | `setApports(dossierId, updater: (prev) => LocalApport[])` |
| `investissement-store.ts` | Même pattern                                              |

**Ce qui les distingue :**

- API moderne type `useState` avec updater fonction
- `hydrate*()` avec smart merge (ne pas écraser les lignes `_dirty`)
- `devtools` middleware activé
- Pas de draft objet, juste `apports: Record<string, LocalApport[]>`

---

### Famille D — Stores d'état pur / cache serveur

Stores sans persistance, sans CRUD. État volatile ou données serveur.

| Store                      | Type                                        |
| -------------------------- | ------------------------------------------- |
| `hypothese-store.ts`       | État simple (hypothèse active courante)     |
| `saisie-data-store.ts`     | Cache fetch serveur, load/reload pattern    |
| `scenario-data-store.ts`   | Cache fetch serveur, load/reload pattern    |
| `simulateur-paie-store.ts` | État simulation éphémère (max 20 scénarios) |

---

## 3. Pourquoi ces incohérences ?

L'application a été développée de manière incrémentale. Chaque ajout de store a parfois pris pour modèle le dernier store écrit plutôt qu'un standard commun.

### 3.1 — Chronologie probable des patterns

```
v1  activite, charges               → inline spread, getDraft ?? getEmptyDraft()
v2  autres-charges, autres-produits → patchDraft() helper (amélioration lisibilité)
v3  financement, investissement     → updater pattern (plus moderne encore)
v4  personnel                       → makeListActions() factory + WeakMap (correctif re-renders)
v4.5 divers                         → EMPTY_DIVERS_DRAFT constant (correctif re-render)
v5  standardisation (cible)         → EMPTY_*_DRAFT sur tous les stores Famille B
```

### 3.2 — Conséquences concrètes des incohérences

| Problème                                                  | Cause                                                                                                  | Impact                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Re-renders infinis (personnel)**                        | `getDraft()` retournait `{ ...emptyDraft(), ...stored }` à chaque appel — nouvel objet à chaque render | Boucle de re-render au montage de l'onglet                     |
| **Re-renders sur divers**                                 | `getDraft()` appelait `emptyDraft()` inline → référence instable                                       | Même boucle, corrigée avec `EMPTY_DIVERS_DRAFT`                |
| **Méthodes dupliquées dans divers-store**                 | Ajout des `setXxxRows` sans supprimer les occurrences précédentes                                      | La 1ère définition est silencieusement écrasée par la 2ème     |
| **partialize impots-fiscaux filtre par flags**            | Volonté d'économiser le localStorage                                                                   | Perte potentielle de données si `hasUnsaved = false` au reload |
| **patchDraft inline vs helper**                           | Pas de standard établi lors de l'écriture initiale                                                     | Code dupliqué, moins lisible, erreur plus probable             |
| **makeListActions absent des autres stores multi-listes** | Personnel a été refactorisé, les autres non                                                            | 8 stores ont du CRUD répété manuellement pour chaque liste     |

---

## 4. Architecture cible unifiée

### 4.1 — Règle générale par famille

| Famille                | getDraft                         | patchDraft            | CRUD                                         | Dirty flags       |
| ---------------------- | -------------------------------- | --------------------- | -------------------------------------------- | ----------------- |
| A (formulaires)        | `?? undefined`                   | Inline                | `setDraft()` seulement                       | ❌                |
| B (listes saisie)      | `?? EMPTY_XXX_DRAFT` (constante) | `patchDraft()` helper | `makeListActions()` si ≥ 2 listes identiques | ✅ par liste      |
| C (invest/financement) | N/A                              | N/A                   | Updater `(prev) => next`                     | `_dirty` sur rows |
| D (état/cache)         | N/A                              | N/A                   | N/A                                          | ❌                |

### 4.2 — Template standard Famille B (listes saisie)

```ts
// ── 1. Types ───────────────────────────────────────────────────────────────

export interface XxxDraft {
  items: XxxRow[];
  hasUnsavedItems: boolean;
}

// ── 2. Helpers ────────────────────────────────────────────────────────────

function getEmptyDraft(): XxxDraft {
  return { items: [], hasUnsavedItems: false };
}

/** Référence stable pour getDraft() quand aucun draft n'existe. */
const EMPTY_XXX_DRAFT: XxxDraft = getEmptyDraft();

/**
 * Cache de mémoïzation : même référence `stored` → même objet fusionné retourné.
 * À utiliser UNIQUEMENT si getDraft() fait un spread { ...defaults, ...stored }
 * (nécessaire pour la migration des champs ajoutés post-déploiement).
 * Pour les nouveaux stores, préférer stored ?? EMPTY_XXX_DRAFT sans merge.
 */
const draftMergeCache = new WeakMap<XxxDraft, XxxDraft>();

function patchDraft(state: XxxState, dossierId: string, patch: Partial<XxxDraft>): Pick<XxxState, "drafts"> {
  return {
    drafts: {
      ...state.drafts,
      [dossierId]: { ...(state.drafts[dossierId] ?? getEmptyDraft()), ...patch },
    },
  };
}

// ── 3. Store ──────────────────────────────────────────────────────────────

export const useXxxStore = create<XxxState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (dossierId) => {
        const stored = get().drafts[dossierId];
        // Cas simple (pas de migration nécessaire) :
        if (!stored) return EMPTY_XXX_DRAFT;
        return stored;
        //
        // Cas migration (champs ajoutés post-déploiement) — utiliser WeakMap :
        // if (!stored) return EMPTY_XXX_DRAFT;
        // const cached = draftMergeCache.get(stored);
        // if (cached) return cached;
        // const merged = { ...getEmptyDraft(), ...stored };
        // draftMergeCache.set(stored, merged);
        // return merged;
      },

      hasUnsavedChanges: (dossierId) => get().drafts[dossierId]?.hasUnsavedItems ?? false,

      // Hydratation sans dirty (chargement initial depuis DB)
      setItems: (dossierId, rows) => set((s) => patchDraft(s, dossierId, { items: rows, hasUnsavedItems: false })),

      // Mutation DnD / édition inline avec dirty=true
      setItemsRows: (dossierId, rows) => set((s) => patchDraft(s, dossierId, { items: rows, hasUnsavedItems: true })),

      markItemsSaved: (dossierId, rows) =>
        set((s) => patchDraft(s, dossierId, { items: rows, hasUnsavedItems: false })),

      clearDraft: (dossierId) =>
        set((s) => {
          const { [dossierId]: _, ...rest } = s.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: "xxx-store",
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);
```

### 4.3 — Quand utiliser le WeakMap ?

Le WeakMap de mémoïzation n'est nécessaire que si `getDraft()` retourne un objet **mergé** avec les valeurs par défaut :

```ts
// ❌ Crée un NOUVEL objet à chaque appel → re-renders → nécessite WeakMap
return { ...getEmptyDraft(), ...stored };

// ✅ Retourne la même référence → pas de WeakMap nécessaire
return stored ?? EMPTY_XXX_DRAFT;
```

**Règle :** ne faire le merge avec WeakMap que si le draft peut être **incomplet en localStorage** (migration d'une ancienne version sans certains champs). Pour les stores nouveaux, préférer `onRehydrateStorage` de Zustand persist pour gérer les migrations proprement.

### 4.4 — Convention de nommage des méthodes (Famille B)

| Action                          | Nom                             | `dirty` résultant |
| ------------------------------- | ------------------------------- | :---------------: |
| Hydratation initiale depuis DB  | `setXxx(dossierId, rows)`       |      `false`      |
| Mutation DnD / édition inline   | `setXxxRows(dossierId, rows)`   |      `true`       |
| Sauvegarde confirmée (post-API) | `markXxxSaved(dossierId, rows)` |      `false`      |
| Purger le draft du dossier      | `clearDraft(dossierId)`         |         —         |

---

## 5. Corrections appliquées

### ✅ P1 — Méthodes dupliquées dans `divers-store.ts` (corrigé)

Les méthodes `setRemboursementsCCRows`, `setDividendesRows`, etc. étaient présentes deux fois dans l'objet du store. La première déclaration était silencieusement écrasée par la seconde. Les doublons ont été supprimés.

### ✅ P2 — `getDraft()` instable dans les stores Famille B (corrigé)

Tous les stores Famille B ont désormais une constante `EMPTY_*_DRAFT` module-level utilisée dans `getDraft()` :

```ts
const EMPTY_XXX_DRAFT: XxxDraft = getEmptyDraft();
getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_XXX_DRAFT,
```

### 🟡 P3 — `patchDraft` inline dans `activite-store.ts`, `charges-store.ts`, `divers-store.ts`, `impots-fiscaux-store.ts` (amélioration recommandée)

Ces 4 stores utilisent encore le pattern inline `{ ...(state.drafts[dossierId] ?? getEmptyDraft()), ...patch }` dans chaque mutation. Extraire un helper `patchDraft(state, dossierId, patch)` réduirait la duplication et améliorerait la lisibilité, mais n'a pas d’impact sur les performances (les mutations ne s’exécutent pas à chaque render).

### ✅ P4 — `partialize` dans `impots-fiscaux-store.ts` filtre par flags (corrigé)

Remplacé par un `partialize` sans filtre :

```ts
partialize: (state) => ({ drafts: state.drafts }),
```

### ✅ P5 — Re-renders infinis sur l'onglet Personnel (corrigé)

`getDraft()` retournait `{ ...getEmptyDraft(), ...stored }` à chaque appel — un nouvel objet à chaque render provoquant une boucle infinie. Corrigé avec `EMPTY_PERSONNEL_DRAFT` + WeakMap de mémoïzation.

---

## 6. Tableau de conformité

| Store                      | `EMPTY_*_DRAFT` | `patchDraft()` helper | Convention nommage | Statut |
| -------------------------- | :-------------: | :-------------------: | :----------------: | :----: |
| `activite-store.ts`        |       ✅        |          ❌           |         ✅         |   🟡   |
| `autres-charges-store.ts`  |       ✅        |          ✅           |         ✅         |   ✅   |
| `autres-produits-store.ts` |       ✅        |          ✅           |         ✅         |   ✅   |
| `charges-store.ts`         |       ✅        |          ❌           |         ✅         |   🟡   |
| `divers-store.ts`          |       ✅        |          ❌           |         ✅         |   🟡   |
| `entreprise-store.ts`      |       N/A       |          N/A          |         ✅         |   ✅   |
| `financement-store.ts`     |       N/A       |          N/A          |         ✅         |   ✅   |
| `hypothese-store.ts`       |       N/A       |          N/A          |         ✅         |   ✅   |
| `impots-fiscaux-store.ts`  |       ✅        |          ❌           |         ✅         |   🟡   |
| `investissement-store.ts`  |       N/A       |          N/A          |         ✅         |   ✅   |
| `personnel-store.ts`       |       ✅        |          ✅           |         ✅         |   ✅   |
| `porteur-store.ts`         |       N/A       |          N/A          |         ✅         |   ✅   |
| `saisie-data-store.ts`     |       N/A       |          N/A          |         ✅         |   ✅   |
| `scenario-data-store.ts`   |       N/A       |          N/A          |         ✅         |   ✅   |
| `simulateur-paie-store.ts` |       N/A       |          N/A          |         ✅         |   ✅   |
| `tableau-libre-store.ts`   |       ✅        |          ✅           |         ✅         |   ✅   |
| `unites-oeuvre-store.ts`   |       ✅        |          ✅           |         ✅         |   ✅   |

**Légende :** ✅ Conforme · 🟡 Améliorable (patchDraft non extrait) · N/A Non applicable
