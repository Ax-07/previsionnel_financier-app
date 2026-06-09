import { EditorState } from "prosemirror-state";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { schema } from "./schema";
import { buildKeymap, baseKeymap } from "./keymap";
import { buildInputRules } from "./inputrules";
import { createDemoDoc } from "./demoContent";
import { createPaginationPlugins } from "./pagination/paginationPlugin";
import type { PaginationOptions } from "./pagination/paginationPlugin";
import { A4_PAGE_SIZE } from "./pagination/constant";

/**
 * Crée un `EditorState` avec tous les plugins nécessaires.
 * @param pageSize    Options de pagination (format, marges…). Défaut : A4.
 * @param existingDoc Document ProseMirror à conserver (ex : changement de format).
 */
export const createEditorState = (
  pageSize: Partial<PaginationOptions> = A4_PAGE_SIZE,
  existingDoc?: ProseMirrorNode,
): EditorState =>
  EditorState.create({
    schema,
    doc: existingDoc ?? createDemoDoc(),
    plugins: [
      buildInputRules(schema),
      keymap(buildKeymap(schema)),
      keymap(baseKeymap),
      dropCursor(),
      gapCursor(),
      history(),
      ...createPaginationPlugins(pageSize),
    ],
  });
