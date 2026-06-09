import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";
import { Schema, NodeSpec, MarkSpec } from "prosemirror-model";

/** Nœuds de base étendus avec le support des listes (bullet_list, ordered_list, list_item). */
const baseNodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");

/** Liste à puces avec attribut `listStyleType`. */
const bulletListSpec: NodeSpec = {
  ...baseNodes.get("bullet_list")!,
  attrs: { listStyleType: { default: "disc" } },
  toDOM(node) {
    return ["ul", { style: `list-style-type: ${node.attrs.listStyleType}` }, 0];
  },
  parseDOM: [
    {
      tag: "ul",
      getAttrs(dom) {
        if (typeof dom === "string") return {};
        return { listStyleType: (dom as HTMLElement).style.listStyleType || "disc" };
      },
    },
  ],
};

/** Liste numérotée avec attributs `listStyleType` et `order`. */
const orderedListSpec: NodeSpec = {
  ...baseNodes.get("ordered_list")!,
  attrs: { order: { default: 1 }, listStyleType: { default: "decimal" } },
  toDOM(node) {
    return [
      "ol",
      {
        style: `list-style-type: ${node.attrs.listStyleType}`,
        ...(node.attrs.order !== 1 ? { start: node.attrs.order } : {}),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "ol",
      getAttrs(dom) {
        if (typeof dom === "string") return {};
        const el = dom as HTMLElement;
        return {
          order: el.hasAttribute("start") ? +el.getAttribute("start")! : 1,
          listStyleType: el.style.listStyleType || "decimal",
        };
      },
    },
  ],
};

/** Paragraphe avec attributs `textAlign` et `indent`. */
const paragraphSpec: NodeSpec = {
  content: "inline*",
  group: "block",
  attrs: { textAlign: { default: "left" }, indent: { default: 0 } },
  parseDOM: [
    {
      tag: "p",
      getAttrs(dom) {
        if (typeof dom === "string") return {};
        const el = dom as HTMLElement;
        const rawIndent = parseFloat(el.style.paddingLeft || "0");
        return {
          textAlign: el.style.textAlign || "left",
          indent: isNaN(rawIndent) ? 0 : Math.round(rawIndent / 2),
        };
      },
    },
  ],
  toDOM(node) {
    const styles: string[] = [];
    if (node.attrs.textAlign !== "left") styles.push(`text-align: ${node.attrs.textAlign}`);
    if (node.attrs.indent > 0) styles.push(`padding-left: ${node.attrs.indent * 2}rem`);
    return ["p", styles.length ? { style: styles.join("; ") } : {}, 0];
  },
};

/** Titre (H1-H6) avec attribut `textAlign`. */
const headingSpec: NodeSpec = {
  attrs: { level: { default: 1 }, textAlign: { default: "left" } },
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: ([1, 2, 3, 4, 5, 6] as const).map((level) => ({
    tag: `h${level}`,
    getAttrs(dom: string | Node) {
      if (typeof dom === "string") return { level };
      return { level, textAlign: (dom as HTMLElement).style.textAlign || "left" };
    },
  })),
  toDOM(node) {
    if (node.attrs.textAlign !== "left") {
      return [`h${node.attrs.level}`, { style: `text-align: ${node.attrs.textAlign}` }, 0];
    }
    return [`h${node.attrs.level}`, 0];
  },
};

/** Saut de page manuel (nœud atomique). */
const pageBreakSpec: NodeSpec = {
  group: "block",
  atom: true,
  selectable: true,
  parseDOM: [{ tag: "div[data-type='page-break']" }],
  toDOM() {
    return [
      "div",
      { "data-type": "page-break", class: "page-break" },
      ["span", { class: "page-break-label" }, "Saut de page"],
    ];
  },
};

/** Nœuds du tableau (table, table_row, table_cell, table_header). */
const tblNodes = tableNodes({ tableGroup: "block", cellContent: "block+", cellAttributes: {} });

// ─── Marks supplémentaires ───────────────────────────────────────────────────

const underlineSpec: MarkSpec = {
  parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
  toDOM() {
    return ["u", 0];
  },
};

const strikethroughSpec: MarkSpec = {
  parseDOM: [{ tag: "s" }, { tag: "del" }, { style: "text-decoration=line-through" }],
  toDOM() {
    return ["s", 0];
  },
};

const subscriptSpec: MarkSpec = {
  excludes: "superscript",
  parseDOM: [{ tag: "sub" }],
  toDOM() {
    return ["sub", 0];
  },
};

const superscriptSpec: MarkSpec = {
  excludes: "subscript",
  parseDOM: [{ tag: "sup" }],
  toDOM() {
    return ["sup", 0];
  },
};

const textColorSpec: MarkSpec = {
  attrs: { color: {} },
  parseDOM: [{ style: "color", getAttrs: (v) => (v ? { color: v } : false) }],
  toDOM(mark) {
    return ["span", { style: `color: ${mark.attrs.color}` }, 0];
  },
};

const highlightSpec: MarkSpec = {
  attrs: { color: {} },
  parseDOM: [{ style: "background-color", getAttrs: (v) => (v ? { color: v } : false) }],
  toDOM(mark) {
    return ["span", { style: `background-color: ${mark.attrs.color}` }, 0];
  },
};

/**
 * Schéma ProseMirror de l'éditeur.
 * Étend `prosemirror-schema-basic` avec :
 * - Listes enrichies (listStyleType)
 * - Paragraphes et titres avec textAlign + indent
 * - Saut de page manuel
 * - Tableaux (prosemirror-tables)
 * - Marks : underline, strikethrough, subscript, superscript, textColor, highlight
 */
export const schema = new Schema({
  nodes: baseNodes
    .update("paragraph", paragraphSpec)
    .update("heading", headingSpec)
    .update("bullet_list", bulletListSpec)
    .update("ordered_list", orderedListSpec)
    .append({ page_break: pageBreakSpec })
    .append(tblNodes),
  marks: basicSchema.spec.marks.append({
    underline: underlineSpec,
    strikethrough: strikethroughSpec,
    subscript: subscriptSpec,
    superscript: superscriptSpec,
    textColor: textColorSpec,
    highlight: highlightSpec,
  }),
});
