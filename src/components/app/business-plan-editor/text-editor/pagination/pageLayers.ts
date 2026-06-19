import type { MarginImagePosition, PageBackgroundSize } from "./paginationTypes";
import { sanitizeBgUrl } from "./utils";

interface MarginImageLayerOptions {
  url: string;
  opacity?: number;
  position?: MarginImagePosition;
}

interface PageLayerOptions {
  pageHeight: number;
  pageBackgroundImage?: string;
  pageBackgroundImageOpacity?: number;
  pageBackgroundImageSize?: PageBackgroundSize;
  marginLeftImage?: MarginImageLayerOptions;
  marginRightImage?: MarginImageLayerOptions;
}

export { sanitizeBgUrl } from "./utils";

export function resolveBgSize(size?: PageBackgroundSize): string {
  if (size === "tile") return "auto auto";
  if (size === "contain") return "contain";
  return "cover";
}

function resolveBgRepeat(size?: PageBackgroundSize): string {
  return size === "tile" ? "repeat" : "no-repeat";
}

function positionToBgPos(position?: MarginImagePosition): string {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

/**
 * Ajoute les calques visuels de page de garde et d'images de marge.
 */
function appendPageLayers(
  container: HTMLElement,
  options: PageLayerOptions,
  topOffset: number,
  layerHeight: number,
  containerIsFullWidth = false,
): void {
  const bgUrl = sanitizeBgUrl(options.pageBackgroundImage ?? "");
  const leftUrl = sanitizeBgUrl(options.marginLeftImage?.url ?? "");
  const rightUrl = sanitizeBgUrl(options.marginRightImage?.url ?? "");

  if (!bgUrl && !leftUrl && !rightUrl) return;

  if (bgUrl) {
    const layer = document.createElement("div");
    layer.className = "pm-page-bg-layer";
    layer.style.top = `${topOffset}px`;
    layer.style.height = `${layerHeight}px`;
    layer.style.backgroundImage = `url("${bgUrl}")`;
    layer.style.backgroundSize = resolveBgSize(options.pageBackgroundImageSize);
    layer.style.backgroundRepeat = resolveBgRepeat(options.pageBackgroundImageSize);
    layer.style.opacity = String(options.pageBackgroundImageOpacity ?? 1);
    if (containerIsFullWidth) layer.style.left = "0";
    container.prepend(layer);
  }

  if (leftUrl) {
    const layer = document.createElement("div");
    layer.className = "pm-margin-left-layer";
    layer.style.top = `${topOffset}px`;
    layer.style.height = `${layerHeight}px`;
    layer.style.backgroundImage = `url("${leftUrl}")`;
    layer.style.backgroundSize = "contain";
    layer.style.backgroundPosition = positionToBgPos(options.marginLeftImage?.position);
    layer.style.opacity = String(options.marginLeftImage?.opacity ?? 1);
    if (containerIsFullWidth) layer.style.left = "0";
    container.prepend(layer);
  }

  if (rightUrl) {
    const layer = document.createElement("div");
    layer.className = "pm-margin-right-layer";
    layer.style.top = `${topOffset}px`;
    layer.style.height = `${layerHeight}px`;
    layer.style.backgroundImage = `url("${rightUrl}")`;
    layer.style.backgroundSize = "contain";
    layer.style.backgroundPosition = positionToBgPos(options.marginRightImage?.position);
    layer.style.opacity = String(options.marginRightImage?.opacity ?? 1);
    if (containerIsFullWidth) layer.style.right = "0";
    container.prepend(layer);
  }
}

export function makeFirstPageLayersWidget(options: PageLayerOptions): () => HTMLElement {
  return () => {
    const container = document.createElement("div");
    container.classList.add("pm-first-page-layers");
    container.setAttribute("aria-hidden", "true");
    container.setAttribute("contenteditable", "false");
    appendPageLayers(
      container,
      {
        pageHeight: options.pageHeight,
        pageBackgroundImage: options.pageBackgroundImage,
        pageBackgroundImageOpacity: options.pageBackgroundImageOpacity,
        pageBackgroundImageSize: options.pageBackgroundImageSize,
      },
      0,
      options.pageHeight,
      true,
    );
    return container;
  };
}

export function makeDocumentPageMarginLayers(options: PageLayerOptions): HTMLElement | null {
  const container = document.createElement("div");
  container.classList.add("pm-document-page-layers");
  container.setAttribute("aria-hidden", "true");
  container.setAttribute("contenteditable", "false");
  appendPageLayers(
    container,
    {
      pageHeight: options.pageHeight,
      marginLeftImage: options.marginLeftImage,
      marginRightImage: options.marginRightImage,
    },
    0,
    options.pageHeight,
    true,
  );
  return container.childElementCount > 0 ? container : null;
}
