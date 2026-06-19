import { EditorState, Command } from "prosemirror-state";
import type { MarginImageOptions, PageBackgroundSize, HeaderFooterImage } from "../document-layout";

export type { MarginImageOptions, PageBackgroundSize, HeaderFooterImage };

export interface ToolbarSectionProps {
  editorState: EditorState;
  executeCommand: (command: Command) => void;
}

export interface PageFormatState {
  format: string;
  orientation: "portrait" | "landscape";
  showPageNumbers: boolean;
  /** Image de fond de la page de garde. */
  pageBackgroundImage?: string;
  /** Opacité du fond de page de garde, entre 0 et 1. */
  pageBackgroundImageOpacity?: number;
  /** Mode de dimensionnement de l'image de fond de page de garde. */
  pageBackgroundImageSize?: PageBackgroundSize;
  /** Image dans la marge gauche. */
  marginLeftImage?: MarginImageOptions;
  /** Image dans la marge droite. */
  marginRightImage?: MarginImageOptions;
  marginTopImages?: HeaderFooterImage[];
  marginBottomImages?: HeaderFooterImage[];
  /** Images dans les slots de l'en-tête. */
  headerImages?: HeaderFooterImage[];
  /** Images dans les slots du pied de page. */
  footerImages?: HeaderFooterImage[];
  /** Affiche une table des matieres generee sur la page 2. */
  showTableOfContents?: boolean;
}
