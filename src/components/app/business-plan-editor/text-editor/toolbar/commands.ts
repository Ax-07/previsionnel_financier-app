import { NodeType, Attrs, MarkType, Mark } from "prosemirror-model";
import { Command, EditorState, TextSelection } from "prosemirror-state";
import { setBlockType } from "prosemirror-commands";
import { liftListItem, wrapInList } from "prosemirror-schema-list";

/**
 * Sort de la liste courante si nécessaire, puis applique un type de bloc.
 * Permet de passer d'un list_item vers heading/paragraph.
 */
export const liftAndSetBlockType = (type: NodeType, attrs?: Attrs): Command =>
  (state, dispatch, view) => {
    const { $from } = state.selection;
    const listTypes = [state.schema.nodes.bullet_list, state.schema.nodes.ordered_list];
    const inList = Array.from({ length: $from.depth + 1 }, (_, d) => $from.node(d)).some((n) =>
      listTypes.includes(n.type)
    );

    if (inList) {
      if (!liftListItem(state.schema.nodes.list_item)(state, undefined)) return false;
      if (dispatch && view) {
        liftListItem(state.schema.nodes.list_item)(state, dispatch);
        setBlockType(type, attrs)(view.state, dispatch);
      }
      return true;
    }

    return setBlockType(type, attrs)(state, dispatch, view);
  };

/**
 * Enveloppe le bloc courant dans une liste du type donné.
 * Si le bloc est un heading, le convertit d'abord en paragraph
 * (car list_item n'accepte que des paragraph dans le schéma de base).
 */
export const wrapInListSafe = (listType: NodeType, listStyleType: string): Command =>
  (state, dispatch, view) => {
    if (dispatch && view && state.selection.$from.parent.type === state.schema.nodes.heading) {
      setBlockType(state.schema.nodes.paragraph)(state, dispatch, view);
      return wrapInList(listType, { listStyleType })(view.state, dispatch);
    }
    return wrapInList(listType, { listStyleType })(state, dispatch);
  };

/**
 * Modifie le style (et/ou le type) de la liste courante.
 * Si le curseur n'est pas dans une liste, enveloppe le bloc courant dans une nouvelle liste.
 */
export const setListStyle = (listType: NodeType, listStyleType: string): Command =>
  (state, dispatch, view) => {
    const { $from } = state.selection;
    const listTypes = [state.schema.nodes.bullet_list, state.schema.nodes.ordered_list];
    for (let d = $from.depth; d >= 0; d--) {
      if (listTypes.includes($from.node(d).type)) {
        if (dispatch) {
          dispatch(
            state.tr.setNodeMarkup($from.before(d), listType, {
              ...$from.node(d).attrs,
              listStyleType,
            })
          );
        }
        return true;
      }
    }
    return wrapInListSafe(listType, listStyleType)(state, dispatch, view);
  };

/**
 * Bascule une liste : retire si même type, convertit si type différent,
 * ou enveloppe le bloc courant si pas dans une liste.
 */
export const toggleList = (listType: NodeType, defaultStyle: string): Command =>
  (state, dispatch, view) => {
    const { $from } = state.selection;
    const { bullet_list, ordered_list, list_item } = state.schema.nodes;
    const listTypes = [bullet_list, ordered_list];
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (listTypes.includes(node.type)) {
        if (node.type === listType) {
          return liftListItem(list_item)(state, dispatch, view);
        } else {
          if (dispatch) {
            dispatch(
              state.tr.setNodeMarkup($from.before(d), listType, {
                ...node.attrs,
                listStyleType: defaultStyle,
              })
            );
          }
          return true;
        }
      }
    }
    return wrapInListSafe(listType, defaultStyle)(state, dispatch, view);
  };

/** Indique si le curseur est à l'intérieur d'une liste du type donné. */
export const isInList = (listType: NodeType, state: EditorState): boolean => {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type === listType) return true;
  }
  return false;
};

/**
 * Insère un nœud `page_break` à la position courante du curseur.
 * Le nœud est atomique : l'utilisateur peut le sélectionner et le supprimer, mais pas y entrer.
 */
export const insertPageBreak = (): Command => (state, dispatch) => {
  const { page_break } = state.schema.nodes;
  if (!page_break) return false;
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(page_break.create()).scrollIntoView());
  }
  return true;
};

// ─── Mark utilitaires ────────────────────────────────────────────────────────

/** Indique si un mark est actif à la position courante (ou dans la sélection). */
export const isMarkActive = (state: EditorState, markType: MarkType): boolean => {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!markType.isInSet(state.storedMarks ?? $from.marks());
  return state.doc.rangeHasMark(from, to, markType);
};

// ─── Alignement et indentation ───────────────────────────────────────────────

/** Applique l'alignement à tous les paragraphes et titres de la sélection. */
export const setTextAlign = (align: "left" | "center" | "right" | "justify"): Command =>
  (state, dispatch) => {
    const { from, to } = state.selection;
    const { paragraph, heading } = state.schema.nodes;
    const tr = state.tr;
    let changed = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if ((node.type === paragraph || node.type === heading) && node.attrs.textAlign !== align) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: align });
        changed = true;
      }
    });
    if (!changed) return false;
    if (dispatch) dispatch(tr);
    return true;
  };

/** Augmente ou diminue l'indentation des paragraphes de la sélection (0–8 niveaux). */
export const changeIndent = (delta: 1 | -1): Command =>
  (state, dispatch) => {
    const { from, to } = state.selection;
    const { paragraph } = state.schema.nodes;
    const tr = state.tr;
    let changed = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === paragraph) {
        const newIndent = Math.max(0, Math.min(8, (node.attrs.indent ?? 0) + delta));
        if (newIndent !== node.attrs.indent) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent });
          changed = true;
        }
      }
    });
    if (!changed) return false;
    if (dispatch) dispatch(tr);
    return true;
  };

// ─── Insertion de nœuds ──────────────────────────────────────────────────────

/** Insère une règle horizontale à la position courante. */
export const insertHorizontalRule = (): Command => (state, dispatch) => {
  const { horizontal_rule } = state.schema.nodes;
  if (!horizontal_rule) return false;
  if (dispatch) dispatch(state.tr.replaceSelectionWith(horizontal_rule.create()).scrollIntoView());
  return true;
};

/** Insère une image à la position courante. N'accepte que les URLs http(s) et les chemins relatifs. */
export const insertImage = (src: string, alt?: string): Command => (state, dispatch) => {
  const { image } = state.schema.nodes;
  if (!image) return false;
  try {
    const url = new URL(src);
    if (!["http:", "https:"].includes(url.protocol)) return false;
  } catch {
    if (!src.startsWith("/") && !src.startsWith("#") && !src.startsWith("./") && !src.startsWith("../")) {
      return false;
    }
  }
  if (dispatch) dispatch(state.tr.replaceSelectionWith(image.create({ src, alt: alt ?? "" })).scrollIntoView());
  return true;
};

/** Insère un tableau NxM à la position courante. */
export const insertTable = (rows: number, cols: number): Command => (state, dispatch) => {
  const { table, table_row, table_cell, paragraph } = state.schema.nodes;
  if (!table || !table_row || !table_cell || !paragraph) return false;
  const createCell = () => table_cell.create(null, [paragraph.create()]);
  const createRow = () => table_row.create(null, Array.from({ length: cols }, createCell));
  const tableNode = table.create(null, Array.from({ length: rows }, createRow));
  if (dispatch) dispatch(state.tr.replaceSelectionWith(tableNode).scrollIntoView());
  return true;
};

// ─── Insertion de tableau financier ──────────────────────────────────────────

export interface NormalizedTableRow {
  cells: string[];
  isSectionHeader: boolean;
}

export interface NormalizedTable {
  title: string;
  headers: string[];
  rows: NormalizedTableRow[];
}

/**
 * Insère un tableau financier (issu de l'onglet Contrôle) à la position courante.
 * Les lignes `isSectionHeader` produisent une ligne de titre pleine largeur (colspan).
 */
export const insertFinancialTable = (tableData: NormalizedTable): Command => (state, dispatch) => {
  const { table, table_row, table_cell, table_header, paragraph } = state.schema.nodes;
  if (!table || !table_row || !table_cell || !table_header || !paragraph) return false;

  const colCount = tableData.headers.length;

  const makeCell = (text: string, isHeader = false) => {
    const type = isHeader ? table_header : table_cell;
    const content = text.trim()
      ? [paragraph.create(null, [state.schema.text(text)])]
      : [paragraph.create()];
    return type.create(null, content);
  };

  const makeSectionRow = (label: string) => {
    const cell = table_header.create(
      { colspan: colCount, rowspan: 1, colwidth: null },
      [paragraph.create(null, label.trim() ? [state.schema.text(label)] : [])],
    );
    return table_row.create(null, [cell]);
  };

  const headerRow = table_row.create(null, tableData.headers.map((h) => makeCell(h, true)));

  const dataRows = tableData.rows.map((row) => {
    if (row.isSectionHeader) return makeSectionRow(row.cells[0] ?? "");
    return table_row.create(null, row.cells.map((c, i) => makeCell(c, i === 0)));
  });

  const tableNode = table.create(null, [headerRow, ...dataRows]);

  if (dispatch) {
    let tr = state.tr.replaceSelectionWith(tableNode);

    // Trouver la position de fin du tableau dans le nouveau document
    const $pos = tr.doc.resolve(tr.selection.from);
    let tableDepth = 0;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type === table) {
        tableDepth = d;
        break;
      }
    }
    const tableEndPos = $pos.after(tableDepth);

    // Si le tableau est en fin de document, insérer un paragraphe vide après
    if (tableEndPos >= tr.doc.content.size - 1) {
      tr = tr.insert(tableEndPos, paragraph.create());
    }

    // Placer le curseur dans le paragraphe qui suit le tableau
    tr = tr.setSelection(TextSelection.create(tr.doc, tableEndPos + 1)).scrollIntoView();
    dispatch(tr);
  }

  return true;
};

// ─── Liens ───────────────────────────────────────────────────────────────────

/** Retourne le mark `link` actif à la position courante, ou null. */
export const getActiveLink = (state: EditorState): Mark | null => {
  const { $from, from, to, empty } = state.selection;
  const linkMark = state.schema.marks.link;
  if (!linkMark) return null;
  if (empty) return linkMark.isInSet(state.storedMarks ?? $from.marks()) ?? null;
  let found: Mark | null = null;
  state.doc.nodesBetween(from, to, (node) => {
    if (found) return false;
    const mark = linkMark.isInSet(node.marks);
    if (mark) found = mark;
  });
  return found;
};

/** Applique un lien (http/https/mailto ou chemin relatif) sur la sélection. */
export const setLink = (href: string): Command => (state, dispatch) => {
  const linkMark = state.schema.marks.link;
  if (!linkMark) return false;
  try {
    const url = new URL(href);
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return false;
  } catch {
    if (!href.startsWith("/") && !href.startsWith("#") && !href.startsWith("?")) return false;
  }
  const { from, to } = state.selection;
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, linkMark).addMark(from, to, linkMark.create({ href })));
  }
  return true;
};

/** Supprime le mark `link` de la sélection. */
export const removeLink = (): Command => (state, dispatch) => {
  const linkMark = state.schema.marks.link;
  if (!linkMark) return false;
  const { from, to } = state.selection;
  if (dispatch) dispatch(state.tr.removeMark(from, to, linkMark));
  return true;
};
