import type { DocumentLayoutOptions } from "../document-layout";

export type {
  HeaderFooterImage,
  HeaderFooterSlotPosition,
  MarginImageOptions,
  MarginImagePosition,
  PageBackgroundSize,
} from "../document-layout";

export interface PaginationOptions extends DocumentLayoutOptions {
  onHeaderClick?: HeaderFooterClickHandler;
  onFooterClick?: HeaderFooterClickHandler;
}
