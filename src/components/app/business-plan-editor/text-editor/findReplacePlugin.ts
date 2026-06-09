import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";

export interface FindReplaceState {
  query: string;
  results: Array<{ from: number; to: number }>;
  activeIndex: number;
  decorations: DecorationSet;
}

export const findReplaceKey = new PluginKey<FindReplaceState>("findReplace");

/** Échappe les caractères spéciaux regex pour éviter toute injection. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findAll(doc: ProseMirrorNode, query: string): Array<{ from: number; to: number }> {
  if (!query.trim()) return [];
  const results: Array<{ from: number; to: number }> = [];
  const regex = new RegExp(escapeRegex(query), "gi");

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(node.text)) !== null) {
        results.push({ from: pos + match.index, to: pos + match.index + match[0].length });
      }
    }
  });
  return results;
}

function buildDecorations(
  doc: ProseMirrorNode,
  results: Array<{ from: number; to: number }>,
  activeIndex: number,
): DecorationSet {
  if (!results.length) return DecorationSet.empty;
  const decorations = results.map(({ from, to }, i) =>
    Decoration.inline(from, to, { class: i === activeIndex ? "pm-find-active" : "pm-find-match" }),
  );
  return DecorationSet.create(doc, decorations);
}

type FindReplaceMeta = { type: "setQuery"; query: string } | { type: "next" } | { type: "prev" };

export const createFindReplacePlugin = (): Plugin<FindReplaceState> =>
  new Plugin<FindReplaceState>({
    key: findReplaceKey,
    state: {
      init() {
        return { query: "", results: [], activeIndex: 0, decorations: DecorationSet.empty };
      },
      apply(tr, pluginState, _, newState) {
        const meta = tr.getMeta(findReplaceKey) as FindReplaceMeta | undefined;

        if (meta) {
          switch (meta.type) {
            case "setQuery": {
              const results = findAll(newState.doc, meta.query);
              return { query: meta.query, results, activeIndex: 0, decorations: buildDecorations(newState.doc, results, 0) };
            }
            case "next": {
              if (!pluginState.results.length) return pluginState;
              const activeIndex = (pluginState.activeIndex + 1) % pluginState.results.length;
              return { ...pluginState, activeIndex, decorations: buildDecorations(newState.doc, pluginState.results, activeIndex) };
            }
            case "prev": {
              if (!pluginState.results.length) return pluginState;
              const activeIndex =
                (pluginState.activeIndex - 1 + pluginState.results.length) % pluginState.results.length;
              return { ...pluginState, activeIndex, decorations: buildDecorations(newState.doc, pluginState.results, activeIndex) };
            }
          }
        }

        if (tr.docChanged && pluginState.query) {
          const results = findAll(newState.doc, pluginState.query);
          const activeIndex = Math.min(pluginState.activeIndex, Math.max(0, results.length - 1));
          return { ...pluginState, results, activeIndex, decorations: buildDecorations(newState.doc, results, activeIndex) };
        }

        return pluginState;
      },
    },
    props: {
      decorations(state) {
        return findReplaceKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });

/** Remplace l'occurrence active par `replacement`. */
export const replaceActive = (view: EditorView, replacement: string): void => {
  const state = findReplaceKey.getState(view.state);
  if (!state || !state.results.length) return;
  const { from, to } = state.results[state.activeIndex];
  view.dispatch(view.state.tr.insertText(replacement, from, to));
};

/** Remplace toutes les occurrences de la fin vers le début (pour préserver les positions). */
export const replaceAll = (view: EditorView, replacement: string): void => {
  const state = findReplaceKey.getState(view.state);
  if (!state || !state.results.length) return;
  let tr = view.state.tr;
  for (let i = state.results.length - 1; i >= 0; i--) {
    const { from, to } = state.results[i];
    tr = tr.insertText(replacement, from, to);
  }
  view.dispatch(tr);
};
