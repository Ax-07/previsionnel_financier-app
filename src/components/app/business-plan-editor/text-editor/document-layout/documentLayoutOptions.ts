import type { DocumentLayoutOptions, HeaderFooterImage, MarginImageOptions } from "./documentLayoutTypes";

export const defaultDocumentLayout: DocumentLayoutOptions = {
  pageHeight: 800,
  pageWidth: 789,
  pageGap: 50,
  pageGapBorderSize: 1,
  pageBreakBackground: "#ffffff",
  footerRight: "{page}",
  footerLeft: "",
  headerRight: "",
  headerLeft: "",
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 50,
  marginRight: 50,
  contentMarginTop: 10,
  contentMarginBottom: 10,
  pageGapBorderColor: "#e5e5e5",
  customHeader: {},
  customFooter: {},
  showTableOfContents: false,
};

function finiteNumber(value: unknown, fallback: number, min = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

function optionalOpacity(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1, Math.max(0, n));
}

function textOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHeaderMap(value: unknown): DocumentLayoutOptions["customHeader"] {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => isRecord(entry))
      .map(([page, entry]) => [
        page,
        {
          headerLeft: textOrEmpty((entry as Record<string, unknown>).headerLeft),
          headerRight: textOrEmpty((entry as Record<string, unknown>).headerRight),
        },
      ]),
  );
}

function normalizeFooterMap(value: unknown): DocumentLayoutOptions["customFooter"] {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => isRecord(entry))
      .map(([page, entry]) => [
        page,
        {
          footerLeft: textOrEmpty((entry as Record<string, unknown>).footerLeft),
          footerRight: textOrEmpty((entry as Record<string, unknown>).footerRight),
        },
      ]),
  );
}

function normalizeMarginImage(value: unknown): MarginImageOptions | undefined {
  if (!isRecord(value) || typeof value.url !== "string") return undefined;
  const opacity = optionalOpacity(value.opacity);
  const position =
    value.position === "top" || value.position === "bottom" || value.position === "center"
      ? value.position
      : "center";
  return {
    url: value.url,
    position,
    ...(opacity !== undefined ? { opacity } : {}),
  };
}

function normalizeHeaderFooterImages(value: unknown): HeaderFooterImage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const images = value.flatMap((entry): HeaderFooterImage[] => {
    if (!isRecord(entry) || typeof entry.url !== "string") return [];
    if (entry.position !== "left" && entry.position !== "center" && entry.position !== "right") return [];
    const opacity = optionalOpacity(entry.opacity);
    const height =
      entry.height === undefined || entry.height === null
        ? undefined
        : finiteNumber(entry.height, 1, 1);
    return [{
      url: entry.url,
      position: entry.position,
      ...(height !== undefined ? { height } : {}),
      ...(opacity !== undefined ? { opacity } : {}),
    }];
  });
  return images.length > 0 ? images : undefined;
}

export function normalizeDocumentLayout(userLayout?: Partial<DocumentLayoutOptions>): DocumentLayoutOptions {
  const raw = { ...defaultDocumentLayout, ...userLayout };
  const headerImages = normalizeHeaderFooterImages(raw.headerImages);
  const footerImages = normalizeHeaderFooterImages(raw.footerImages);
  const marginTopImages = normalizeHeaderFooterImages(raw.marginTopImages) ?? headerImages;
  const marginBottomImages = normalizeHeaderFooterImages(raw.marginBottomImages) ?? footerImages;

  return {
    ...raw,
    pageHeight: finiteNumber(raw.pageHeight, defaultDocumentLayout.pageHeight, 1),
    pageWidth: finiteNumber(raw.pageWidth, defaultDocumentLayout.pageWidth, 1),
    pageGap: finiteNumber(raw.pageGap, defaultDocumentLayout.pageGap, 0),
    pageGapBorderSize: finiteNumber(raw.pageGapBorderSize, defaultDocumentLayout.pageGapBorderSize, 0),
    pageBreakBackground: textOrEmpty(raw.pageBreakBackground) || defaultDocumentLayout.pageBreakBackground,
    footerRight: textOrEmpty(raw.footerRight),
    footerLeft: textOrEmpty(raw.footerLeft),
    headerRight: textOrEmpty(raw.headerRight),
    headerLeft: textOrEmpty(raw.headerLeft),
    marginTop: finiteNumber(raw.marginTop, defaultDocumentLayout.marginTop, 0),
    marginBottom: finiteNumber(raw.marginBottom, defaultDocumentLayout.marginBottom, 0),
    marginLeft: finiteNumber(raw.marginLeft, defaultDocumentLayout.marginLeft, 0),
    marginRight: finiteNumber(raw.marginRight, defaultDocumentLayout.marginRight, 0),
    contentMarginTop: finiteNumber(raw.contentMarginTop, defaultDocumentLayout.contentMarginTop, 0),
    contentMarginBottom: finiteNumber(raw.contentMarginBottom, defaultDocumentLayout.contentMarginBottom, 0),
    pageGapBorderColor: textOrEmpty(raw.pageGapBorderColor) || defaultDocumentLayout.pageGapBorderColor,
    customHeader: normalizeHeaderMap(raw.customHeader),
    customFooter: normalizeFooterMap(raw.customFooter),
    pageBackgroundImage: typeof raw.pageBackgroundImage === "string" ? raw.pageBackgroundImage : undefined,
    pageBackgroundImageOpacity: optionalOpacity(raw.pageBackgroundImageOpacity),
    pageBackgroundImageSize:
      raw.pageBackgroundImageSize === "contain" || raw.pageBackgroundImageSize === "tile" || raw.pageBackgroundImageSize === "cover"
        ? raw.pageBackgroundImageSize
        : undefined,
    marginLeftImage: normalizeMarginImage(raw.marginLeftImage),
    marginRightImage: normalizeMarginImage(raw.marginRightImage),
    marginTopImages,
    marginBottomImages,
    headerImages,
    footerImages,
    showTableOfContents: raw.showTableOfContents === true,
  };
}
