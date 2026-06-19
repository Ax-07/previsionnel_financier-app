import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction, EditorStateConfig } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView } from "prosemirror-view";
import { DOMSerializer } from "prosemirror-model";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import {
  getFooterHeight,
  getHeaderHeight,
  sanitizeBgUrl,
} from "./utils";
import { getFooter, getHeader } from "./headerFooterRenderer";
import {
  makeDocumentPageMarginLayers,
  makeFirstPageLayersWidget,
  resolveBgSize,
} from "./pageLayers";
import { normalizeOptions } from "./paginationOptions";
import {
  acquirePagePrintRule,
  acquirePaginationStyles,
  refreshPageMinHeight,
  updatePaginationDomStyles,
} from "./paginationStyles";
import type { PaginationOptions } from "./paginationTypes";
export type {
  HeaderFooterImage,
  HeaderFooterSlotPosition,
  MarginImageOptions,
  MarginImagePosition,
  PageBackgroundSize,
  PaginationOptions,
} from "./paginationTypes";

/**
 * Plugin ProseMirror de pagination — approche spacer (conforme spec).
 *
 * Principe :
 *   - Le document ProseMirror reste continu (aucun nœud de pagination interne).
 *   - Un plugin mesure les positions DOM réelles de chaque bloc.
 *   - Quand un bloc déborderait sur la page suivante, un widget espaceur
 *     (`Decoration.widget`) est inséré AVANT ce bloc.
 *   - L'espaceur contient : espace restant de la page courante + footer +
 *     gap visuel + header de la page suivante.
 *   - Le bloc entier passe en haut de la page suivante — jamais de coupure.
 *   - Les mesures sont prises avec les espaceurs masqués via
 *     `[data-pagination-measuring]` pour éviter les boucles de recalcul.
 *
 * Avantages vs. l'ancienne approche overlay (position:absolute + floats) :
 *   - Aucun contenu n'est caché derrière une bande blanche opaque.
 *   - La séparation visuelle est exactement au niveau du vrai saut de bloc.
 *   - Compatible avec les tableaux (plus de conflit de BFC).
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGINATION_META_KEY = "PAGINATION_UPDATE";
const TABLE_OF_CONTENTS_FRONT_MATTER_PAGE_COUNT = 2;
interface PaginationState {
  breaks: BreakItem[];
  lastPageRemainingSpace: number;
}
const paginationKey = new PluginKey<PaginationState>("pagination");
const brDecorationKey = new PluginKey<DecorationSet>("brDecoration");

/**
 * Décrit un point de rupture calculé par `computeBreaks`.
 * Un espaceur de hauteur `spacerHeight` est inséré à `pos` dans le document.
 */
interface BreakItem {
  /** Position ProseMirror avant laquelle insérer l espaceur. */
  pos: number;
  /** Hauteur totale de l espaceur en pixels. */
  spacerHeight: number;
  /**
   * Pixels restants dans la zone de contenu juste avant la rupture.
   * Utilisé pour positionner le footer en bas de la zone.
   */
  remainingContentSpace: number;
  /** Numéro de la page dont on affiche le footer dans cet espaceur. */
  pageNumber: number;
}

interface TableOfContentsItem {
  pos: number;
  level: number;
  title: string;
  pageNumber: number;
}

// ─── Helpers DOM ──────────────────────────────────────────────────────────────

/**
 * Retourne la geometrie d un element dans le repere LOCAL de l editeur.
 * Soustrait la position du DOMRect de l editeur pour etre independant du scroll.
 * Arrondi au pixel entier pour stabiliser les comparaisons.
 */
function getLocalRect(
  editorEl: HTMLElement,
  el: HTMLElement,
): { top: number; bottom: number; height: number } {
  const editorRect = editorEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    top: Math.round(rect.top - editorRect.top),
    bottom: Math.round(rect.bottom - editorRect.top),
    height: Math.round(rect.height),
  };
}

/**
 * Compare deux tableaux de BreakItem avec une tolerance de plus ou moins `tolerance` px.
 * Evite les dispatches causes par des differences de sous-pixels.
 */
function sameBreaks(a: BreakItem[], b: BreakItem[], tolerance = 1): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].pos !== b[i].pos) return false;
    if (Math.abs(a[i].spacerHeight - b[i].spacerHeight) > tolerance) return false;
  }
  return true;
}

/**
 * Masque temporairement les widgets .pm-page-break via l attribut
 * `data-pagination-measuring` pendant la mesure DOM, puis les restaure.
 * Sans ca, getBoundingClientRect mesure des blocs deja deplaces par les
 * spacers de la passe precedente, ce qui cause une boucle de recalcul infinie.
 */
function withBreaksHidden<T>(editorEl: HTMLElement, fn: () => T): T {
  editorEl.setAttribute("data-pagination-measuring", "true");
  try {
    return fn();
  } finally {
    editorEl.removeAttribute("data-pagination-measuring");
  }
}

function pageForDocumentPosition(pos: number, breaks: readonly BreakItem[], firstDocumentPage: number): number {
  let pageNumber = firstDocumentPage;
  for (const item of breaks) {
    if (item.pos <= pos) pageNumber++;
  }
  return pageNumber;
}

function extractTableOfContents(
  doc: ProseMirrorNode,
  breaks: readonly BreakItem[],
  firstDocumentPage = TABLE_OF_CONTENTS_FRONT_MATTER_PAGE_COUNT + 1,
): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return;
    const title = node.textContent.trim();
    if (!title) return;
    const level = Number(node.attrs.level) || 1;
    items.push({
      pos,
      level,
      title,
      pageNumber: pageForDocumentPosition(pos, breaks, firstDocumentPage),
    });
  });
  return items;
}

// ─── Decoration BR ────────────────────────────────────────────────────────────

/**
 * Insere un span.rm-br-decoration apres chaque noeud hardBreak du document.
 * Ces spans (display:table; width:100%) evitent la fusion des lignes vides
 * par les navigateurs, ce qui fausserait le calcul de hauteur des blocs.
 */
function buildBrDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "hardBreak") {
      decorations.push(
        Decoration.widget(pos + 1, () => {
          const el = document.createElement("span");
          el.classList.add("rm-br-decoration");
          return el;
        }),
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}

// ─── Calcul des ruptures ────────────────────────────────────────────────────────

/**
 * Traverse le document ProseMirror et calcule les positions ou inserer des espaceurs.
 *
 * Regle fondamentale : aucun bloc n est coupe entre deux pages.
 * Si un bloc deborde sur la page suivante, il passe integralement a la page
 * suivante via un espaceur insere AVANT lui.
 *
 * A appeler exclusivement via `withBreaksHidden()` pour mesurer les positions
 * naturelles des blocs (sans l influence des spacers de la passe precedente).
 *
 * @param view         Vue ProseMirror (acces au doc et au DOM)
 * @param options      Options de pagination
 * @param headerHeights Hauteurs mesurees du contenu header par page (sans padding CSS)
 * @param footerHeights Hauteurs mesurees du contenu footer par page (sans padding CSS)
 */
function computeBreaks(
  view: EditorView,
  options: PaginationOptions,
  headerHeights: Map<number, number>,
  footerHeights: Map<number, number>,
): { breaks: BreakItem[]; lastPageRemainingSpace: number } {
  const breaks: BreakItem[] = [];
  const editorEl = view.dom as HTMLElement;

  const getPageHeights = (pageNumber: number) => {
    const headerHeight = headerHeights.get(pageNumber) ?? headerHeights.get(0) ?? 0;
    const footerHeight = footerHeights.get(pageNumber) ?? footerHeights.get(0) ?? 0;
    const pageHeaderHeight = options.contentMarginTop + options.marginTop + headerHeight;
    const pageFooterHeight = options.contentMarginBottom + options.marginBottom + footerHeight;
    return {
      pageHeaderHeight,
      pageFooterHeight,
      usableHeight: options.pageHeight - pageHeaderHeight - pageFooterHeight,
    };
  };

  const firstPageHeights = getPageHeights(1);
  if (firstPageHeights.usableHeight <= 0) return { breaks: [], lastPageRemainingSpace: 0 };

  // Point de depart : bas de l en-tete de la premiere page.
  // Ce widget (.pm-first-page-header) est en flux normal et toujours visible.
  const firstHeaderEl = editorEl.querySelector<HTMLElement>(".pm-first-page-header");
  let initialOffset = firstHeaderEl
    ? getLocalRect(editorEl, firstHeaderEl).bottom
    : firstPageHeights.pageHeaderHeight;
  let currentPageNumber = 1;

  const frontMatterEl = options.showTableOfContents
    ? editorEl.querySelector<HTMLElement>(".pm-table-of-contents-frontmatter")
    : null;
  if (frontMatterEl) {
    const frontMatterRect = getLocalRect(editorEl, frontMatterEl);
    const frontMatterPageCount = Number(frontMatterEl.dataset.frontmatterPages);
    initialOffset = frontMatterRect.bottom;
    currentPageNumber =
      (Number.isFinite(frontMatterPageCount) && frontMatterPageCount > 0
        ? frontMatterPageCount
        : getTableOfContentsFrontMatterPageCount(options)) + 1;
  }

  // pageEnd        : position (repere local, spacers masques) de la fin de la zone
  //                  de contenu de la page courante.
  // prevBlockBottom: bas du dernier bloc traite — sert a calculer l espace
  //                  restant avant la prochaine rupture.
  const initialPageHeights = getPageHeights(currentPageNumber);
  let pageEnd = initialOffset + initialPageHeights.usableHeight;
  let prevBlockBottom = initialOffset;

  view.state.doc.descendants((node, pos) => {
    // Les noeuds inline ne sont pas paginables
    if (!node.isBlock) return false;

    // Listes : on descend pour paginer par list_item (unite indivisible),
    // et non par la liste entiere.
    // Tableaux : on descend pour paginer par table_row.
    // Note : un <div> insere entre deux <tr> via l API DOM (pas le parser HTML)
    // reste en place et est rendu comme un bloc — les navigateurs modernes
    // respectent la hauteur de cet element a l interieur d un <tbody>.
    if (
      node.type.name === "bullet_list" ||
      node.type.name === "ordered_list" ||
      node.type.name === "table"
    ) {
      return true;
    }

    // Saut de page manuel : insere un vrai spacer apres le marqueur logique.
    if (node.type.name === "page_break") {
      const dom = view.nodeDOM(pos) as HTMLElement | null;
      if (dom instanceof HTMLElement) {
        const rect = getLocalRect(editorEl, dom);
        const currentHeights = getPageHeights(currentPageNumber);
        const nextHeights = getPageHeights(currentPageNumber + 1);
        if (nextHeights.usableHeight <= 0) return false;
        const remainingContentSpace = Math.max(0, pageEnd - rect.bottom);
        const spacerHeight = Math.max(
          0,
          Math.round(remainingContentSpace + currentHeights.pageFooterHeight + options.pageGap + nextHeights.pageHeaderHeight),
        );
        breaks.push({
          pos: pos + node.nodeSize,
          spacerHeight,
          remainingContentSpace,
          pageNumber: currentPageNumber,
        });
        pageEnd = rect.bottom + nextHeights.usableHeight;
        prevBlockBottom = rect.bottom;
        currentPageNumber++;
      }
      return false;
    }

    // Tous les autres blocs (paragraph, heading, blockquote, list_item,
    // code_block, table...) : mesure et eventuelle insertion d espaceur.
    const dom = view.nodeDOM(pos) as HTMLElement | null;
    if (!(dom instanceof HTMLElement)) return false;
    const rect = getLocalRect(editorEl, dom);
    if (rect.height <= 0) return false;

    if (rect.bottom > pageEnd) {
      const currentHeights = getPageHeights(currentPageNumber);
      if (currentHeights.usableHeight <= 0) return false;

      if (rect.top >= pageEnd - currentHeights.usableHeight) {
        const nextHeights = getPageHeights(currentPageNumber + 1);
        if (nextHeights.usableHeight <= 0) return false;
        // Le bloc commence sur la page courante mais son bas depasse la limite :
        // on insere un espaceur AVANT lui pour le pousser a la page suivante.
        //
        // Structure de l espaceur (de haut en bas) :
        //   +------------------------------+
        //   |  espace blanc fin de page    |  = remainingContentSpace
        //   +------------------------------+
        //   |  footer de la page courante  |  = hauteur footer courante
        //   +------------------------------+  <- border-top du gap
        //   |  gap visuel                  |  = pageGap
        //   +------------------------------+  <- border-bottom du gap
        //   |  header de la page suivante  |  = hauteur header suivante
        //   +------------------------------+
        const remainingContentSpace = Math.max(0, pageEnd - prevBlockBottom);
        const spacerHeight = Math.max(
          0,
          Math.round(remainingContentSpace + currentHeights.pageFooterHeight + options.pageGap + nextHeights.pageHeaderHeight),
        );
        breaks.push({
          pos,
          spacerHeight,
          remainingContentSpace,
          pageNumber: currentPageNumber,
        });
        currentPageNumber++;

        // Avancer pageEnd dans le repere naturel (spacers masques) :
        // le bloc est suppose commencer en haut de la nouvelle page.
        pageEnd = rect.top + nextHeights.usableHeight;
      }

      // Bloc plus grand qu une page : avancer pageEnd du nombre de pages necessaires
      while (rect.bottom > pageEnd) {
        currentPageNumber++;
        const overflowHeights = getPageHeights(currentPageNumber);
        if (overflowHeights.usableHeight <= 0) break;
        pageEnd += overflowHeights.usableHeight;
      }
    }

    prevBlockBottom = rect.bottom;
    return false; // bloc atomique — ne pas descendre dans ses enfants
  });

  const lastPageRemainingSpace = Math.max(0, Math.round(pageEnd - prevBlockBottom));
  return {
    breaks,
    lastPageRemainingSpace,
  };
}

// ─── Fabrique de widgets espaceurs ────────────────────────────────────────────

function resolveHeaderOptions(options: PaginationOptions, pageNumber: number): { headerLeft: string; headerRight: string } {
  const key = String(pageNumber);
  return key in options.customHeader
    ? options.customHeader[key]
    : { headerRight: options.headerRight, headerLeft: options.headerLeft };
}

function resolveFooterOptions(options: PaginationOptions, pageNumber: number | "last"): { footerLeft: string; footerRight: string } {
  const key = String(pageNumber);
  return key in options.customFooter
    ? options.customFooter[key]
    : { footerRight: options.footerRight, footerLeft: options.footerLeft };
}

function replaceCounterPageNumbers(root: HTMLElement, pageNumber: number): void {
  root.querySelectorAll<HTMLElement>(".rm-page-number, .rm-page-number-plus").forEach((el) => {
    el.classList.remove("rm-page-number", "rm-page-number-plus");
    el.textContent = String(pageNumber);
  });
}

function expandHeaderFooterToPageWidth(el: HTMLElement): void {
  el.style.width = "var(--pm-page-width)";
  el.style.marginLeft = "calc(-1 * var(--pm-margin-left))";
  el.style.boxSizing = "border-box";
}

function makeFrontMatterGap(options: PaginationOptions): HTMLDivElement {
  const gap = document.createElement("div");
  gap.classList.add("pm-frontmatter-gap");
  gap.setAttribute("aria-hidden", "true");
  gap.style.height = `${options.pageGap}px`;
  gap.style.marginLeft = "calc(-1 * var(--pm-margin-left))";
  gap.style.width = "var(--pm-page-width)";
  gap.style.backgroundColor = "var(--pm-page-break-bg, #ffffff)";
  gap.style.borderTop = "var(--pm-page-gap-border-size, 1px) solid var(--pm-page-gap-border-color)";
  gap.style.borderBottom = "var(--pm-page-gap-border-size, 1px) solid var(--pm-page-gap-border-color)";
  gap.style.boxSizing = "border-box";
  return gap;
}

function makeFrontMatterHeader(options: PaginationOptions, pageNumber: number): HTMLDivElement {
  const hOpts = resolveHeaderOptions(options, pageNumber);
  const header = getHeader(hOpts.headerRight, hOpts.headerLeft, options.onHeaderClick, pageNumber, pageNumber > 1 ? options.marginTopImages : undefined);
  replaceCounterPageNumbers(header, pageNumber);
  expandHeaderFooterToPageWidth(header);
  header.style.flexShrink = "0";
  return header;
}

function makeFrontMatterFooter(options: PaginationOptions, pageNumber: number): HTMLDivElement {
  const fOpts = resolveFooterOptions(options, pageNumber);
  const footer = getFooter(fOpts.footerRight, fOpts.footerLeft, options.onFooterClick, pageNumber, pageNumber > 1 ? options.marginBottomImages : undefined);
  replaceCounterPageNumbers(footer, pageNumber);
  expandHeaderFooterToPageWidth(footer);
  footer.style.flexShrink = "0";
  return footer;
}

function makePrintFooterBox(
  remainingContentSpace: number,
  footer: HTMLDivElement,
): HTMLDivElement {
  const box = document.createElement("div");
  box.classList.add("pm-footer-print-box");
  box.setAttribute("aria-hidden", "true");
  box.setAttribute("contenteditable", "false");
  box.style.setProperty("--pm-footer-margin-top", `${remainingContentSpace}px`);
  box.appendChild(footer);
  return box;
}

function makeGeneratedPrintPageBody(className: string, label: string): HTMLElement {
  const page = document.createElement("section");
  page.classList.add("pm-generated-print-page-body", className);
  page.setAttribute("aria-label", label);
  page.style.flex = "1 1 auto";
  page.style.minHeight = "0";
  page.style.width = "100%";
  page.style.maxWidth = "100%";
  page.style.boxSizing = "border-box";
  page.style.overflow = "hidden";
  return page;
}

function makeTableOfContentsPage(options: PaginationOptions, items: readonly TableOfContentsItem[]): HTMLElement {
  const page = makeGeneratedPrintPageBody("pm-generated-toc-page", "Table des matieres");
  page.style.padding = "28px 0";
  page.style.display = "flex";
  page.style.flexDirection = "column";
  page.style.gap = "18px";

  const title = document.createElement("div");
  title.textContent = "Table des matieres";
  title.style.fontSize = "28px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1.15";
  title.style.letterSpacing = "0";
  page.appendChild(title);

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Ajoutez des titres au document pour alimenter automatiquement la table des matieres.";
    empty.style.margin = "0";
    empty.style.color = "hsl(220 9% 46%)";
    empty.style.fontSize = "14px";
    page.appendChild(empty);
    return page;
  }

  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "8px";
  list.style.minHeight = "0";
  list.style.overflow = "hidden";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "minmax(0, auto) minmax(24px, 1fr) auto";
    row.style.alignItems = "end";
    row.style.columnGap = "8px";
    row.style.paddingLeft = `${Math.min(Math.max(item.level - 1, 0), 4) * 18}px`;
    row.style.fontSize = item.level === 1 ? "14px" : "13px";
    row.style.fontWeight = item.level === 1 ? "600" : "400";

    const itemTitle = document.createElement("span");
    itemTitle.textContent = item.title;
    itemTitle.style.overflow = "hidden";
    itemTitle.style.textOverflow = "ellipsis";
    itemTitle.style.whiteSpace = "nowrap";

    const leader = document.createElement("span");
    leader.setAttribute("aria-hidden", "true");
    leader.style.borderBottom = "1px dotted hsl(220 9% 62%)";
    leader.style.transform = "translateY(-4px)";

    const pageNumber = document.createElement("span");
    pageNumber.textContent = String(item.pageNumber);
    pageNumber.style.fontVariantNumeric = "tabular-nums";

    row.append(itemTitle, leader, pageNumber);
    list.appendChild(row);
  });

  page.appendChild(list);
  return page;
}

function makeDocumentContentPage(content: Node | null): HTMLElement {
  const page = makeGeneratedPrintPageBody("pm-generated-document-page", "Contenu du document");
  page.style.padding = "0";
  page.style.display = "block";
  if (content) page.appendChild(content);
  return page;
}

function makeTableOfContentsWidget(
  options: PaginationOptions,
  items: readonly TableOfContentsItem[],
): () => HTMLElement {
  return () => {
    const includeCoverPage = hasPrintableCoverPage(options);
    const frontMatterPageCount = includeCoverPage ? 2 : 1;
    const tocPageNumber = includeCoverPage ? 2 : 1;
    const documentStartPageNumber = frontMatterPageCount + 1;

    const frontMatter = document.createElement("div");
    frontMatter.classList.add("pm-table-of-contents-frontmatter");
    frontMatter.setAttribute("contenteditable", "false");
    frontMatter.setAttribute("data-frontmatter-pages", String(frontMatterPageCount));
    frontMatter.style.counterIncrement = `page-number ${frontMatterPageCount} page-number-plus ${frontMatterPageCount}`;

    const coverFiller = document.createElement("div");
    coverFiller.classList.add("pm-frontmatter-cover-filler");
    coverFiller.setAttribute("aria-hidden", "true");
    coverFiller.style.height = `${options.pageHeight}px`;

    const tocPage = document.createElement("div");
    tocPage.classList.add("pm-frontmatter-page");
    tocPage.style.height = `${options.pageHeight}px`;
    tocPage.style.display = "flex";
    tocPage.style.flexDirection = "column";
    tocPage.style.boxSizing = "border-box";
    tocPage.style.position = "relative";
    tocPage.style.overflow = "visible";
    const tocPageLayers = tocPageNumber > 1 ? makeDocumentPageMarginLayers(options) : null;
    if (tocPageLayers) tocPage.appendChild(tocPageLayers);
    tocPage.append(
      makeFrontMatterHeader(options, tocPageNumber),
      makeTableOfContentsPage(options, items),
      makeFrontMatterFooter(options, tocPageNumber),
    );

    const documentPageStart = document.createElement("div");
    documentPageStart.classList.add("pm-frontmatter-page-start");
    documentPageStart.style.position = "relative";
    documentPageStart.style.overflow = "visible";
    const documentPageLayers = makeDocumentPageMarginLayers(options);
    if (documentPageLayers) documentPageStart.appendChild(documentPageLayers);
    documentPageStart.appendChild(makeFrontMatterHeader(options, documentStartPageNumber));

    if (includeCoverPage) {
      frontMatter.append(coverFiller, makeFrontMatterGap(options));
    }
    frontMatter.append(tocPage, makeFrontMatterGap(options), documentPageStart);
    return frontMatter;
  };
}

interface PrintPageRange {
  from: number;
  to: number;
  pageNumber: number;
}

function resolvePrintBgRepeat(size: PaginationOptions["pageBackgroundImageSize"]): string {
  return size === "tile" ? "repeat" : "no-repeat";
}

function marginPositionToBgPosition(
  position: NonNullable<PaginationOptions["marginLeftImage"]>["position"] | undefined,
): string {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

function selectPrintBannerImage(
  images: PaginationOptions["marginTopImages"],
): NonNullable<PaginationOptions["marginTopImages"]>[number] | undefined {
  return images?.find((item) => sanitizeBgUrl(item.url));
}

function getPrintPageRanges(
  doc: ProseMirrorNode,
  breaks: readonly BreakItem[],
  firstDocumentPage: number,
): PrintPageRange[] {
  const ranges: PrintPageRange[] = [];
  let from = 0;
  let pageNumber = firstDocumentPage;

  for (const item of breaks) {
    const to = Math.max(from, Math.min(item.pos, doc.content.size));
    if (to > from) {
      ranges.push({ from, to, pageNumber });
    }
    from = to;
    pageNumber += 1;
  }

  if (from < doc.content.size || ranges.length === 0) {
    ranges.push({
      from,
      to: doc.content.size,
      pageNumber,
    });
  }

  return ranges;
}

function hasPrintableCoverPage(options: PaginationOptions): boolean {
  const coverUrl = sanitizeBgUrl(options.pageBackgroundImage ?? "");
  const opacity = options.pageBackgroundImageOpacity ?? 1;
  return coverUrl !== "" && opacity > 0;
}

function getTableOfContentsFrontMatterPageCount(options: PaginationOptions): number {
  if (!options.showTableOfContents) return 0;
  return hasPrintableCoverPage(options) ? 2 : 1;
}

function serializeDocRange(doc: ProseMirrorNode, from: number, to: number): DocumentFragment {
  const target = document.createDocumentFragment();
  const safeFrom = Math.max(0, Math.min(from, doc.content.size));
  const safeTo = Math.max(safeFrom, Math.min(to, doc.content.size));
  if (safeFrom >= safeTo) return target;

  const serializer = DOMSerializer.fromSchema(doc.type.schema);
  serializer.serializeFragment(doc.slice(safeFrom, safeTo).content, { document }, target);
  return target;
}

function appendPrintPageLayers(
  page: HTMLElement,
  options: PaginationOptions,
  includeCoverBackground: boolean,
  includeDocumentMarginImages: boolean,
): void {
  const coverUrl = includeCoverBackground ? sanitizeBgUrl(options.pageBackgroundImage ?? "") : "";
  const leftUrl = includeDocumentMarginImages ? sanitizeBgUrl(options.marginLeftImage?.url ?? "") : "";
  const rightUrl = includeDocumentMarginImages ? sanitizeBgUrl(options.marginRightImage?.url ?? "") : "";
  const topBanner = includeDocumentMarginImages ? selectPrintBannerImage(options.marginTopImages) : undefined;
  const bottomBanner = includeDocumentMarginImages ? selectPrintBannerImage(options.marginBottomImages) : undefined;

  if (!coverUrl && !leftUrl && !rightUrl && !topBanner && !bottomBanner) return;

  const layers = document.createElement("div");
  layers.classList.add("pm-print-page-layers");
  layers.setAttribute("aria-hidden", "true");

  if (coverUrl) {
    const cover =
      options.pageBackgroundImageSize === "tile"
        ? document.createElement("div")
        : document.createElement("img");
    cover.classList.add("pm-print-page-bg");
    if (cover instanceof HTMLImageElement) {
      cover.src = coverUrl;
      cover.alt = "";
      cover.decoding = "sync";
      cover.style.objectFit = options.pageBackgroundImageSize === "contain" ? "contain" : "cover";
      cover.style.objectPosition = "center center";
    } else {
      cover.style.backgroundImage = `url("${coverUrl}")`;
      cover.style.backgroundSize = resolveBgSize(options.pageBackgroundImageSize);
      cover.style.backgroundRepeat = resolvePrintBgRepeat(options.pageBackgroundImageSize);
    }
    cover.style.opacity = String(options.pageBackgroundImageOpacity ?? 1);
    layers.appendChild(cover);
  }

  if (topBanner) {
    const top = document.createElement("div");
    top.classList.add("pm-print-margin-banner", "pm-print-margin-banner-top");
    top.style.backgroundImage = `url("${sanitizeBgUrl(topBanner.url)}")`;
    top.style.opacity = String(topBanner.opacity ?? 1);
    layers.appendChild(top);
  }

  if (bottomBanner) {
    const bottom = document.createElement("div");
    bottom.classList.add("pm-print-margin-banner", "pm-print-margin-banner-bottom");
    bottom.style.backgroundImage = `url("${sanitizeBgUrl(bottomBanner.url)}")`;
    bottom.style.opacity = String(bottomBanner.opacity ?? 1);
    layers.appendChild(bottom);
  }

  if (leftUrl) {
    const left = document.createElement("div");
    left.classList.add("pm-print-margin-left-layer");
    left.style.backgroundImage = `url("${leftUrl}")`;
    left.style.backgroundSize = "contain";
    left.style.backgroundPosition = marginPositionToBgPosition(options.marginLeftImage?.position);
    left.style.opacity = String(options.marginLeftImage?.opacity ?? 1);
    layers.appendChild(left);
  }

  if (rightUrl) {
    const right = document.createElement("div");
    right.classList.add("pm-print-margin-right-layer");
    right.style.backgroundImage = `url("${rightUrl}")`;
    right.style.backgroundSize = "contain";
    right.style.backgroundPosition = marginPositionToBgPosition(options.marginRightImage?.position);
    right.style.opacity = String(options.marginRightImage?.opacity ?? 1);
    layers.appendChild(right);
  }

  page.prepend(layers);
}

function makePrintHeader(options: PaginationOptions, pageNumber: number): HTMLDivElement {
  const hOpts = resolveHeaderOptions(options, pageNumber);
  const header = getHeader(
    hOpts.headerRight,
    hOpts.headerLeft,
    undefined,
    pageNumber,
  );
  replaceCounterPageNumbers(header, pageNumber);
  header.classList.add("pm-print-page-header");
  header.style.margin = "0";
  header.style.width = "100%";
  header.style.flexShrink = "0";
  return header;
}

function makePrintFooter(options: PaginationOptions, pageNumber: number, isLastPage: boolean): HTMLDivElement {
  const fOpts = resolveFooterOptions(options, isLastPage ? "last" : pageNumber);
  const footer = getFooter(
    fOpts.footerRight,
    fOpts.footerLeft,
    undefined,
    pageNumber,
  );
  replaceCounterPageNumbers(footer, pageNumber);
  footer.classList.add("pm-print-page-footer");
  footer.style.margin = "0";
  footer.style.width = "100%";
  footer.style.flexShrink = "0";
  return footer;
}

function makePrintPage(
  options: PaginationOptions,
  pageNumber: number,
  content: Node | null,
  config: { kind: "cover" | "toc" | "content"; isLastPage: boolean; includeCoverBackground?: boolean },
): HTMLElement {
  const page = document.createElement("section");
  page.classList.add("pm-print-page", `pm-print-page-${config.kind}`);
  page.setAttribute("data-print-page", String(pageNumber));
  page.setAttribute("aria-label", `Page ${pageNumber}`);
  page.style.width = `${options.pageWidth}px`;
  page.style.height = `${options.pageHeight}px`;
  page.style.minHeight = `${options.pageHeight}px`;
  page.style.maxHeight = `${options.pageHeight}px`;

  appendPrintPageLayers(
    page,
    options,
    config.includeCoverBackground === true,
    pageNumber > 1,
  );

  if (config.kind === "cover") return page;

  const contentEl = document.createElement("div");
  contentEl.classList.add("pm-print-content-area");
  if (content) contentEl.appendChild(content);

  page.append(
    makePrintHeader(options, pageNumber),
    contentEl,
    makePrintFooter(options, pageNumber, config.isLastPage),
  );

  return page;
}

function makePrintDocumentWidget(
  options: PaginationOptions,
  doc: ProseMirrorNode,
  breaks: readonly BreakItem[],
): () => HTMLElement {
  return () => {
    const root = document.createElement("div");
    root.classList.add("pm-print-document");
    root.setAttribute("contenteditable", "false");
    root.setAttribute("aria-hidden", "true");

    const printCoverPage = options.showTableOfContents && hasPrintableCoverPage(options);
    const frontMatterPageCount = getTableOfContentsFrontMatterPageCount(options);
    const firstDocumentPage = frontMatterPageCount + 1;
    const documentPages = getPrintPageRanges(doc, breaks, firstDocumentPage);
    const tableOfContentsItems = options.showTableOfContents
      ? extractTableOfContents(doc, breaks, firstDocumentPage)
      : [];

    if (options.showTableOfContents) {
      if (printCoverPage) {
        root.appendChild(
          makePrintPage(options, 1, null, {
            kind: "cover",
            isLastPage: false,
            includeCoverBackground: true,
          }),
        );
      }

      root.appendChild(
        makePrintPage(options, printCoverPage ? 2 : 1, makeTableOfContentsPage(options, tableOfContentsItems), {
          kind: "toc",
          isLastPage: false,
        }),
      );
    }

    documentPages.forEach((range, index) => {
      const isLastPage = index === documentPages.length - 1;
      root.appendChild(
        makePrintPage(
          options,
          range.pageNumber,
          makeDocumentContentPage(serializeDocRange(doc, range.from, range.to)),
          {
            kind: "content",
            isLastPage,
            includeCoverBackground: !options.showTableOfContents && range.pageNumber === 1,
          },
        ),
      );
    });

    return root;
  };
}

/**
 * Retourne la fonction factory du widget espaceur pour `Decoration.widget`.
 *
 * L espaceur est un `<div class="pm-page-break">` de hauteur `spacerHeight`
 * contenant footer + gap + header.
 */

function makeSpacerWidget(
  options: PaginationOptions,
  spacerHeight: number,
  remainingContentSpace: number,
  pageNumber: number,
): () => HTMLElement {
  return () => {
    const spacer = document.createElement("div");
    spacer.classList.add("pm-page-break");
    spacer.setAttribute("aria-hidden", "true");
    spacer.setAttribute("contenteditable", "false");
    spacer.style.height = `${spacerHeight}px`;

    // Footer de la page courante.
    // marginTop pousse le footer en bas de la zone de contenu courante.
    const fKey = String(pageNumber);
    const fOpts =
      fKey in options.customFooter
        ? options.customFooter[fKey]
        : { footerRight: options.footerRight, footerLeft: options.footerLeft };
    const footerMarginImages = pageNumber > 1 ? options.marginBottomImages : undefined;
    const footer = getFooter(
      fOpts.footerRight,
      fOpts.footerLeft,
      options.onFooterClick,
      pageNumber,
      footerMarginImages,
    );
    replaceCounterPageNumbers(footer, pageNumber);
    footer.style.marginTop = `${remainingContentSpace}px`;
    footer.style.setProperty("--pm-footer-margin-top", `${remainingContentSpace}px`);
    const footerBox = makePrintFooterBox(remainingContentSpace, footer);

    // Zone visuelle du gap entre les deux pages
    const gap = document.createElement("div");
    gap.classList.add("pm-page-break__gap");
    gap.style.height = `${options.pageGap}px`;

    const printBreak = document.createElement("div");
    printBreak.classList.add("pm-print-page-break");
    printBreak.setAttribute("aria-hidden", "true");

    // Header de la page suivante
    const nextPage = pageNumber + 1;
    const hKey = String(nextPage);
    const hOpts =
      hKey in options.customHeader
        ? options.customHeader[hKey]
        : { headerRight: options.headerRight, headerLeft: options.headerLeft };
    const header = getHeader(hOpts.headerRight, hOpts.headerLeft, options.onHeaderClick, nextPage, options.marginTopImages);
    replaceCounterPageNumbers(header, nextPage);
    const pageMarginLayers = makeDocumentPageMarginLayers(options);

    if (pageMarginLayers) {
      spacer.append(footerBox, gap, printBreak, pageMarginLayers, header);
    } else {
      spacer.append(footerBox, gap, printBreak, header);
    }

    return spacer;
  };
}

/**
 * Retourne la fonction factory du widget footer de la dernière page.
 *
 * Ce widget est inséré à la fin du document (pos = doc.content.size) pour
 * afficher le footer de la dernière page avec un numéro déjà résolu.
 *
 * Le footer garde son padding bas normal afin de fermer la page comme les
 * footers intermediaires. Le `.ProseMirror` pagine lui-meme avec padding-bottom 0.
 */
function makeLastPageFooterWidget(
  options: PaginationOptions,
  remainingContentSpace: number,
  showMarginImages: boolean,
  pageNumber: number,
): () => HTMLElement {
  return () => {
    const fKey = "last";
    const fOpts =
      fKey in options.customFooter
        ? options.customFooter[fKey]
        : { footerRight: options.footerRight, footerLeft: options.footerLeft };
    const footer = getFooter(
      fOpts.footerRight,
      fOpts.footerLeft,
      options.onFooterClick,
      pageNumber,
      showMarginImages ? options.marginBottomImages : undefined,
    );
    replaceCounterPageNumbers(footer, pageNumber);

    footer.classList.add("pm-last-page-footer");
    // Pousse le footer en bas de la zone de contenu de la dernière page.
    footer.style.marginTop = `${remainingContentSpace}px`;
    footer.style.setProperty("--pm-footer-margin-top", `${remainingContentSpace}px`);
    footer.setAttribute("aria-hidden", "true");
    footer.setAttribute("contenteditable", "false");

    const footerBox = makePrintFooterBox(remainingContentSpace, footer);
    footerBox.classList.add("pm-last-page-footer-wrap");
    return footerBox;
  };
}

// ─── Fabrique de plugins ──────────────────────────────────────────────────────

/**
 * Point d entree principal du module.
 * Fusionne les options utilisateur avec les defauts et retourne les deux plugins.
 */
export function createPaginationPlugins(userOptions?: Partial<PaginationOptions>): Plugin[] {
  const options = normalizeOptions(userOptions);

  // Plugin principal de pagination
  const paginationPlugin = new Plugin({
    key: paginationKey,

    state: {
      // Etat initial : aucune rupture — le premier RAF declenche le calcul.
      init: () => ({ breaks: [] as BreakItem[], lastPageRemainingSpace: 0 }),

      apply: (tr: Transaction, value: PaginationState) => {
        // Les ruptures sont mises a jour exclusivement via setMeta.
        const meta = tr.getMeta(PAGINATION_META_KEY);
        if (meta !== undefined) return meta as PaginationState;
        return value;
      },
    },

    props: {
      decorations(state: EditorState) {
        const pluginState = paginationKey.getState(state);
        if (!pluginState) return DecorationSet.empty;
        const { breaks, lastPageRemainingSpace } = pluginState;

        const frontMatterPageCount = getTableOfContentsFrontMatterPageCount(options);
        const firstDocumentPage = frontMatterPageCount + 1;
        const tableOfContentsItems = options.showTableOfContents
          ? extractTableOfContents(state.doc, breaks, firstDocumentPage)
          : [];

        const printDocumentWidget = Decoration.widget(
          0,
          makePrintDocumentWidget(options, state.doc, breaks),
          { side: -3 },
        );

        const firstPageLayersWidget = Decoration.widget(
          0,
          makeFirstPageLayersWidget(options),
          { side: -2, key: "pm-first-page-layers" },
        );

        // Widget de l en-tete de la premiere page, toujours present a pos 0.
        // Il est en flux normal et sa hauteur sert de point de depart a computeBreaks.
        const h1Key = "1";
        const h1Opts =
          h1Key in options.customHeader
            ? options.customHeader[h1Key]
            : { headerRight: options.headerRight, headerLeft: options.headerLeft };
        const firstHeaderWidget = Decoration.widget(
          0,
          () => {
            if (options.showTableOfContents) {
              const placeholder = document.createElement("div");
              placeholder.classList.add("pm-first-page-header");
              placeholder.setAttribute("aria-hidden", "true");
              placeholder.setAttribute("contenteditable", "false");
              return placeholder;
            }
            const el = getHeader(h1Opts.headerRight, h1Opts.headerLeft, options.onHeaderClick, 1);
            replaceCounterPageNumbers(el, 1);
            el.classList.add("pm-first-page-header");
            el.setAttribute("contenteditable", "false");
            return el;
          },
          { side: -1 },
        );

        // Widgets espaceurs — un par rupture calculee par computeBreaks
        const spacerWidgets = breaks.map(({ pos, spacerHeight, remainingContentSpace, pageNumber }) =>
          Decoration.widget(
            pos,
            makeSpacerWidget(options, spacerHeight, remainingContentSpace, pageNumber),
            { side: -1, key: `pm-break-${pos}-${spacerHeight}` },
          ),
        );

        const tableOfContentsWidgets = options.showTableOfContents
          ? [
              Decoration.widget(
                0,
                makeTableOfContentsWidget(options, tableOfContentsItems),
                {
                  side: 0,
                  key: `pm-toc-${tableOfContentsItems
                    .map((item) => `${item.pos}:${item.level}:${item.pageNumber}:${item.title}`)
                    .join("|")}`,
                },
              ),
            ]
          : [];

        // Widget footer de la derniere page — toujours present a la fin du document.
        // Le numero est resolu statiquement pour rester fiable aussi en impression.
        const lastPageNumber = breaks.length + 1 + frontMatterPageCount;
        const showLastPageMarginImages = lastPageNumber > 1;
        const lastFooterWidget = Decoration.widget(
          state.doc.content.size,
          makeLastPageFooterWidget(
            options,
            lastPageRemainingSpace,
            showLastPageMarginImages,
            lastPageNumber,
          ),
          { side: 1, key: `pm-last-footer-${lastPageRemainingSpace}-${lastPageNumber}` },
        );

        return DecorationSet.create(state.doc, [
          printDocumentWidget,
          firstPageLayersWidget,
          firstHeaderWidget,
          ...tableOfContentsWidgets,
          ...spacerWidgets,
          lastFooterWidget,
        ]);
      },
    },

    view: (initialView: EditorView) => {
      const dom = initialView.dom as HTMLElement;

      // Applique les classes et styles sur le noeud .ProseMirror
      dom.classList.add("rm-with-pagination");
      // outline au lieu de border : n'affecte pas le box model (pas de décalage
      // de 2px dans la zone de contenu avec box-sizing: border-box).
      dom.style.outline = "1px solid var(--pm-page-gap-border-color)";
      dom.style.paddingLeft = "var(--pm-margin-left)";
      dom.style.paddingRight = "var(--pm-margin-right)";
      dom.style.paddingBottom = "0";
      dom.style.width = "var(--pm-page-width)";
      updatePaginationDomStyles(dom, options);
      const releasePaginationStyles = acquirePaginationStyles();
      const pagePrintRule = acquirePagePrintRule(options);

      let rafId: number | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let destroyed = false;

      /**
       * Recalcule les positions de rupture et dispatche si necessaire.
       * Appele via RAF pour s executer apres que le navigateur a finalise le layout.
       */
      const recalc = (view: EditorView): void => {
        if (!view.dom.isConnected || destroyed) return;
        const d = view.dom as HTMLElement;

        updatePaginationDomStyles(d, options);

        // Mesure les hauteurs reelles du header / footer depuis le DOM
        const customHeaderPages = Object.keys(options.customHeader).map(Number).filter(Number.isFinite);
        const customFooterPages = Object.keys(options.customFooter).map(Number).filter(Number.isFinite);
        const headerHeightMap = getHeaderHeight(d, customHeaderPages, "content");
        const footerHeightMap = getFooterHeight(d, customFooterPages, "content");

        // Calcule les ruptures avec les spacers masques (repere naturel)
        const { breaks, lastPageRemainingSpace } = withBreaksHidden(d, () =>
          computeBreaks(view, options, headerHeightMap, footerHeightMap),
        );
        const prevPluginState = paginationKey.getState(view.state);
        const prev = prevPluginState?.breaks ?? [];
        const prevLastRem = prevPluginState?.lastPageRemainingSpace ?? -1;

        if (!sameBreaks(prev, breaks) || Math.abs(prevLastRem - lastPageRemainingSpace) > 1) {
          // Les ruptures ont change : declenche un re-rendu des decorations
          view.dispatch(view.state.tr.setMeta(PAGINATION_META_KEY, { breaks, lastPageRemainingSpace }));
          schedule(view);
          return;
        }

        // Ruptures stables : ajuste le min-height de l editeur
        refreshPageMinHeight(
          d,
          options,
          breaks,
          getTableOfContentsFrontMatterPageCount(options),
        );
      };

      /**
       * Planifie un recalcul dans le prochain frame d animation.
       * Le debounce evite les calculs redondants lors de frappes rapides.
       */
      const schedule = (view: EditorView): void => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = null;
          recalc(view);
        });
      };

      const onAssetSettled = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLImageElement)) return;
        if (!target.closest(".rm-page-header, .rm-page-footer")) return;
        schedule(initialView);
      };

      dom.addEventListener("load", onAssetSettled, true);
      dom.addEventListener("error", onAssetSettled, true);

      // Premier calcul apres que les CSS variables sont posees sur le DOM.
      schedule(initialView);

      // Observer le PARENT de l editeur (pas l editeur lui-meme) pour ne
      // pas reagir aux modifications de minHeight que l on pose soi-meme.
      const host = initialView.dom.parentElement;
      if (typeof ResizeObserver !== "undefined" && host) {
        resizeObserver = new ResizeObserver(() => schedule(initialView));
        resizeObserver.observe(host);
      }

      return {
        update: (view: EditorView, prevState: EditorState) => {
          updatePaginationDomStyles(view.dom, options);
          // Recalcul uniquement lors d une modification du document
          // (pas sur les changements de selection ou de decoration seuls).
          if (!view.state.doc.eq(prevState.doc)) {
            schedule(view);
          }
        },

        destroy: () => {
          if (destroyed) return;
          destroyed = true;
          if (rafId !== null) cancelAnimationFrame(rafId);
          resizeObserver?.disconnect();
          releasePaginationStyles();
          pagePrintRule.release();
          dom.removeEventListener("load", onAssetSettled, true);
          dom.removeEventListener("error", onAssetSettled, true);
          dom.classList.remove("rm-with-pagination");
          dom.style.removeProperty("outline");
          dom.style.removeProperty("padding-left");
          dom.style.removeProperty("padding-right");
          dom.style.removeProperty("padding-bottom");
          dom.style.removeProperty("width");
          dom.style.removeProperty("min-height");
          dom.style.removeProperty("--pm-page-break-bg");
          dom.style.removeProperty("--pm-page-gap");
          dom.style.removeProperty("--pm-page-gap-border-size");
          dom.style.removeProperty("--pm-print-min-height");
        },
      };
    },
  });

  // Plugin de decoration des sauts de ligne
  const brDecoPlugin = new Plugin({
    key: brDecorationKey,

    state: {
      init: (_config: EditorStateConfig, state: EditorState) => buildBrDecorations(state.doc),
      apply: (tr: Transaction, old: DecorationSet) =>
        tr.docChanged ? buildBrDecorations(tr.doc) : old,
    },

    props: {
      decorations(state: EditorState) {
        return brDecorationKey.getState(state);
      },
    },
  });

  return [paginationPlugin, brDecoPlugin];
}
