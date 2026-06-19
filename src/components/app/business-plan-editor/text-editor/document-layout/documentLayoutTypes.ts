export type MarginImagePosition = "top" | "center" | "bottom";
export type PageBackgroundSize = "cover" | "contain" | "tile";
export type HeaderFooterSlotPosition = "left" | "center" | "right";

export interface MarginImageOptions {
  /** URL de l'image (https, /, ou data:image/). */
  url: string;
  /** Opacite de 0 a 1. Defaut : 1. */
  opacity?: number;
  /** Alignement vertical de l'image dans la marge. Defaut : "center". */
  position?: MarginImagePosition;
}

export interface HeaderFooterImage {
  /** URL de l'image (https, /, ou data:image/). */
  url: string;
  /** Ancien slot source. Pour un bandeau, le premier slot renseigne est utilise. */
  position: HeaderFooterSlotPosition;
  /** Hauteur historique en px. Le bandeau utilise surtout la hauteur de marge. */
  height?: number;
  /** Opacite de 0 a 1. Defaut : 1. */
  opacity?: number;
}

export interface DocumentLayoutOptions extends PageConfig {
  pageGap: number;
  pageGapBorderSize: number;
  pageBreakBackground: string;
  footerRight: string;
  footerLeft: string;
  headerRight: string;
  headerLeft: string;
  customHeader: Record<string, { headerLeft: string; headerRight: string }>;
  customFooter: Record<string, { footerLeft: string; footerRight: string }>;
  /** Image de fond de la page de garde. */
  pageBackgroundImage?: string;
  /** Opacite du fond de page de garde, entre 0 et 1. Defaut : 1. */
  pageBackgroundImageOpacity?: number;
  /** Mode de dimensionnement de l'image de fond de page de garde. Defaut : "cover". */
  pageBackgroundImageSize?: PageBackgroundSize;
  /** Image a afficher dans la marge gauche de chaque page. */
  marginLeftImage?: MarginImageOptions;
  /** Image a afficher dans la marge droite de chaque page. */
  marginRightImage?: MarginImageOptions;
  /** Images sources du bandeau de marge haute. */
  marginTopImages?: HeaderFooterImage[];
  /** Images sources du bandeau de marge basse. */
  marginBottomImages?: HeaderFooterImage[];
  /** @deprecated Utiliser marginTopImages. Conserve pour compatibilite. */
  headerImages?: HeaderFooterImage[];
  /** @deprecated Utiliser marginBottomImages. Conserve pour compatibilite. */
  footerImages?: HeaderFooterImage[];
  /** Affiche une table des matieres generee sur la page 2, apres la page de garde. */
  showTableOfContents?: boolean;
}
