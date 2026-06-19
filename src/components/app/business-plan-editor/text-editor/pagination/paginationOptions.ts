import { normalizeDocumentLayout } from "../document-layout";
import type { PaginationOptions } from "./paginationTypes";
function maybeClickHandler(value: unknown): PaginationOptions["onHeaderClick"] | undefined {
  return typeof value === "function" ? value as PaginationOptions["onHeaderClick"] : undefined;
}

export function normalizeOptions(userOptions?: Partial<PaginationOptions>): PaginationOptions {
  const layout = normalizeDocumentLayout(userOptions);
  return {
    ...layout,
    onHeaderClick: maybeClickHandler(userOptions?.onHeaderClick),
    onFooterClick: maybeClickHandler(userOptions?.onFooterClick),
  };
}
