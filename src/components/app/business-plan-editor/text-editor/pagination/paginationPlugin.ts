import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction, EditorStateConfig } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView } from "prosemirror-view";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { deepEqualIterative, getFooterHeight, getHeader, getHeaderHeight, getHeight, updateCssVariables, getFooter } from "./utils";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGINATION_META_KEY = "PAGINATION_UPDATE";
const paginationKey = new PluginKey<{ decorations: DecorationSet }>("pagination");
const brDecorationKey = new PluginKey<DecorationSet>("brDecoration");

// ─── Types exportés ───────────────────────────────────────────────────
export interface PaginationOptions extends PageConfig {
  pageGap: number;
  pageGapBorderSize: number;
  pageBreakBackground: string;
  footerRight: string;
  footerLeft: string;
  headerRight: string;
  headerLeft: string;
  customHeader: Record<string, { headerLeft: string; headerRight: string }>;
  customFooter: Record<string, { footerLeft: string; footerRight: string }>;
  onHeaderClick?: (e: { event: MouseEvent; pageNumber: number }) => void;
  onFooterClick?: (e: { event: MouseEvent; pageNumber: number }) => void;
}

const defaultOptions: PaginationOptions = {
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
};

// ─── Injection CSS ────────────────────────────────────────────────────────────

function injectPaginationStyles(): void {
  if (document.querySelector("[data-pm-pagination-style]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-pm-pagination-style", "");
  style.textContent = `
    .rm-pagination-gap {
      border-top: 1px solid;
      border-bottom: 1px solid;
      border-color: var(--pm-page-gap-border-color);
    }
    .rm-with-pagination,
    .rm-with-pagination .rm-first-page-header {
      counter-reset: page-number page-number-plus 1;
    }
    .rm-with-pagination .rm-page-break {
      counter-increment: page-number page-number-plus;
    }
    .rm-with-pagination .rm-page-break:last-child .rm-pagination-gap { display: none; }
    .rm-with-pagination .rm-page-break:last-child .rm-page-header { display: none; }
    .rm-with-pagination table tr td,
    .rm-with-pagination table tr th { word-break: break-all; }
    .rm-with-pagination table > tr { display: grid; min-width: 100%; }
    .rm-with-pagination table { border-collapse: collapse; width: 100%; display: contents; }
    .rm-with-pagination table tbody { display: table; max-height: 300px; overflow-y: auto; }
    .rm-with-pagination table tbody > tr { display: table-row !important; }
    .rm-with-pagination *:has(> br.ProseMirror-trailingBreak:only-child) { display: table; width: 100%; }
    .rm-with-pagination .rm-br-decoration { display: table; width: 100%; }
    .rm-with-pagination .table-row-group {
      max-height: var(--pm-max-content-child-height);
      overflow-y: auto;
      width: 100%;
    }
    .rm-with-pagination .rm-page-footer-left,
    .rm-with-pagination .rm-page-footer-right,
    .rm-with-pagination .rm-page-header-left,
    .rm-with-pagination .rm-page-header-right { display: inline-block; }
    .rm-with-pagination .rm-page-header-left,
    .rm-with-pagination .rm-page-footer-left { float: left; margin-left: var(--pm-margin-left); }
    .rm-with-pagination .rm-page-header-right,
    .rm-with-pagination .rm-page-footer-right { float: right; margin-right: var(--pm-margin-right); }
    .rm-with-pagination .rm-first-page-header .rm-page-header-right { margin-right: 0px !important; }
    .rm-with-pagination .rm-first-page-header .rm-page-header-left { margin-left: 0px !important; }
    .rm-with-pagination .rm-page-number::before { content: counter(page-number); }
    .rm-with-pagination .rm-page-number-plus::before { content: counter(page-number-plus); }
    .rm-with-pagination .rm-page-header,
    .rm-with-pagination .rm-page-footer { width: 100%; }
    .rm-with-pagination .rm-page-header {
      padding-bottom: var(--pm-content-margin-top) !important;
      padding-top: var(--pm-margin-top) !important;
      display: inline-flex;
      justify-content: space-between;
      max-height: calc(calc(var(--pm-page-height) * 0.45) - var(--pm-margin-top) - var(--pm-content-margin-top));
      overflow-y: hidden;
    }
    .rm-with-pagination .rm-page-footer {
      padding-top: var(--pm-content-margin-bottom) !important;
      padding-bottom: var(--pm-margin-bottom) !important;
      display: inline-flex;
      justify-content: space-between;
      max-height: calc(calc(var(--pm-page-height) * 0.45) - var(--pm-content-margin-bottom) - var(--pm-margin-bottom));
      overflow-y: hidden;
    }
  `;
  document.head.appendChild(style);
}

// ─── Helpers DOM ──────────────────────────────────────────────────────────────

function refreshPage(targetNode: HTMLElement): void {
  const paginationElement = targetNode.querySelector("[data-pm-pagination]");
  if (paginationElement) {
    const lastPageBreak = paginationElement.lastElementChild?.querySelector(".breaker") as HTMLElement | null;
    if (lastPageBreak) {
      const minHeight = lastPageBreak.offsetTop + lastPageBreak.offsetHeight;
      targetNode.style.minHeight = `calc(${minHeight}px + 2px)`;
    }
  }
}

function getExistingPageCount(dom: HTMLElement): number {
  const paginationElement = dom.querySelector("[data-pm-pagination]");
  return paginationElement ? paginationElement.children.length : 0;
}

function countManualPageBreaks(doc: ProseMirrorNode): number {
  let count = 0;
  doc.descendants((node) => { if (node.type.name === "page_break") count++; });
  return count;
}

function calculatePageCount(
  dom: HTMLElement,
  pageOptions: PaginationOptions,
  headerHeight = 0,
  footerHeight = 0,
  doc?: ProseMirrorNode,
): number {
  const _pageHeaderHeight = pageOptions.contentMarginTop + pageOptions.marginTop + headerHeight;
  const _pageFooterHeight = pageOptions.contentMarginBottom + pageOptions.marginBottom + footerHeight;
  const pageContentAreaHeight = pageOptions.pageHeight - _pageHeaderHeight - _pageFooterHeight;
  const paginationElement = dom.querySelector("[data-pm-pagination]");
  const currentPageCount = getExistingPageCount(dom);
  const minFromBreaks = doc ? countManualPageBreaks(doc) + 1 : 1;

  if (paginationElement) {
    const lastElementOfEditor = dom.lastElementChild;
    const lastPageBreak = paginationElement.lastElementChild?.querySelector(".breaker") as HTMLElement | null;
    if (lastElementOfEditor && lastPageBreak) {
      const lastPageGap =
        lastElementOfEditor.getBoundingClientRect().bottom -
        lastPageBreak.getBoundingClientRect().bottom;
      if (lastPageGap > 0) {
        return Math.max(currentPageCount + Math.ceil(lastPageGap / pageContentAreaHeight), minFromBreaks);
      }
      const lpTo = -(pageOptions.pageHeight - 10);
      if (lastPageGap > lpTo && lastPageGap < -10) return Math.max(currentPageCount, minFromBreaks);
      if (lastPageGap < lpTo) {
        return Math.max(currentPageCount + Math.floor(lastPageGap / (pageOptions.pageHeight + pageOptions.pageGap)), minFromBreaks);
      }
      return Math.max(currentPageCount, minFromBreaks);
    }
    return minFromBreaks;
  }

  const editorHeight = dom.scrollHeight;
  return Math.max(1, Math.ceil(editorHeight / pageContentAreaHeight), minFromBreaks);
}

// ─── Décoration BR ────────────────────────────────────────────────────────────

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

// ─── Décoration de pagination ─────────────────────────────────────────────────

function createPaginationDecoration(
  pageOptions: PaginationOptions,
  headerHeightMap: Map<number, number>,
  footerHeightMap: Map<number, number>,
): Decoration[] {
  const commonHeader = { headerLeft: pageOptions.headerLeft, headerRight: pageOptions.headerRight };
  const commonFooter = { footerLeft: pageOptions.footerLeft, footerRight: pageOptions.footerRight };

  const pageWidget = Decoration.widget(
    0,
    (view: EditorView) => {
      const el = document.createElement("div");
      el.dataset.pmPagination = "true";
      el.id = "pages";
      el.classList.add("rm-pages-wrapper");

      const makePageBreak = (
        firstPage: boolean,
        pageHeader: HTMLDivElement,
        pageFooter: HTMLDivElement,
        hdHeight: number,
        ftHeight: number,
        pageNumber?: number,
      ): HTMLDivElement => {
        const { _pageHeaderHeight, _pageHeight } = getHeight(pageOptions, hdHeight, ftHeight);
        const pageContainer = document.createElement("div");
        pageContainer.classList.add("rm-page-break");

        const page = document.createElement("div");
        page.classList.add("page");
        page.style.cssText = "position:relative;float:left;clear:both;";
        const fallback = firstPage
          ? `calc(${_pageHeaderHeight}px + ${_pageHeight}px)`
          : `${_pageHeight}px`;
        page.style.marginTop = pageNumber
          ? `var(--pm-page-content-${pageNumber}, ${fallback})`
          : firstPage
            ? `var(--pm-page-content-first, ${fallback})`
            : `var(--pm-page-content-general, ${fallback})`;

        const breaker = document.createElement("div");
        breaker.classList.add("breaker");
        breaker.style.cssText = [
          `width:calc(100% + var(--pm-margin-left) + var(--pm-margin-right))`,
          `margin-left:calc(-1 * var(--pm-margin-left))`,
          `margin-right:calc(-1 * var(--pm-margin-right))`,
          `position:relative;float:left;clear:both;left:0;right:0;z-index:2`,
        ].join(";");

        const gap = document.createElement("div");
        gap.classList.add("rm-pagination-gap");
        gap.style.cssText = [
          `height:${pageOptions.pageGap}px`,
          `border-left:1px solid;border-right:1px solid`,
          `position:relative`,
          `left:-1px`,
          `background-color:var(--pm-page-break-bg, ${pageOptions.pageBreakBackground})`,
          `border-left-color:var(--pm-page-break-bg, ${pageOptions.pageBreakBackground})`,
          `border-right-color:var(--pm-page-break-bg, ${pageOptions.pageBreakBackground})`,
        ].join(";");
        gap.style.setProperty("width", "calc(100% + 2px)", "important");

        breaker.append(pageFooter, gap, pageHeader);
        pageContainer.append(page, breaker);
        return pageContainer;
      };

      const _hh = headerHeightMap.get(0) ?? 0;
      const _fh = footerHeightMap.get(0) ?? 0;
      const pageCount = calculatePageCount(view.dom, pageOptions, 0, 0, view.state.doc);
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = i + 1;
        const headerPageNumber = i + 2;
        const hasCustom =
          headerPageNumber in pageOptions.customHeader ||
          pageNumber in pageOptions.customFooter ||
          pageNumber in pageOptions.customHeader;

        if (hasCustom) {
          let hOpts = commonHeader;
          let fOpts = commonFooter;
          let hHeight = _hh;
          let fHeight = _fh;

          if (headerPageNumber in pageOptions.customHeader) {
            hOpts = pageOptions.customHeader[headerPageNumber] ?? commonHeader;
            hHeight = headerHeightMap.get(headerPageNumber) ?? 0;
          }
          if (pageNumber in pageOptions.customFooter) {
            fOpts = pageOptions.customFooter[pageNumber] ?? commonFooter;
            fHeight = footerHeightMap.get(pageNumber) ?? 0;
          }

          fragment.appendChild(
            makePageBreak(
              i === 0,
              getHeader(hOpts.headerRight, hOpts.headerLeft, pageOptions.onHeaderClick, headerPageNumber),
              getFooter(fOpts.footerRight, fOpts.footerLeft, pageOptions.onFooterClick, pageNumber),
              hHeight,
              fHeight,
              pageNumber,
            ),
          );
        } else {
          fragment.appendChild(
            makePageBreak(
              i === 0,
              getHeader(commonHeader.headerRight, commonHeader.headerLeft, pageOptions.onHeaderClick, 0),
              getFooter(commonFooter.footerRight, commonFooter.footerLeft, pageOptions.onFooterClick, pageNumber),
              _hh,
              _fh,
            ),
          );
        }
      }

      el.appendChild(fragment);
      return el;
    },
    { side: -1 },
  );

  const firstHeaderWidget = Decoration.widget(
    0,
    () => {
      const hOpts = (1 in pageOptions.customHeader)
        ? pageOptions.customHeader[1]
        : commonHeader;
      const el = getHeader(
        hOpts.headerRight,
        hOpts.headerLeft,
        pageOptions.onHeaderClick,
        1,
      );
      el.classList.add("rm-first-page-header");
      return el;
    },
    { side: -1 },
  );

  return [pageWidget, firstHeaderWidget];
}

// ─── Fabrique de plugins ──────────────────────────────────────────────────────

export function createPaginationPlugins(userOptions?: Partial<PaginationOptions>): Plugin[] {
  const options: PaginationOptions = { ...defaultOptions, ...userOptions };

  // Snapshot des options précédentes + hauteurs de header/footer mémorisées
  let snapshot: PaginationOptions & {
    headerHeight: Map<number, number>;
    footerHeight: Map<number, number>;
  } = { ...options, headerHeight: new Map(), footerHeight: new Map() };

  // ── Plugin principal de pagination ─────────────────────────────────────────
  const paginationPlugin = new Plugin({
    key: paginationKey,

    state: {
      // On démarre avec un DecorationSet vide.
      // La vraie décoration est créée par le `requestAnimationFrame` dans `view()`
      // après que les CSS variables ont été posées sur le DOM, évitant ainsi
      // que `calculatePageCount` ne mesure le fallback CSS (1123px min-height)
      // et ne génère un nombre de pages erroné au premier rendu.
      init: () => ({
        decorations: DecorationSet.empty,
      }),

      apply: (tr: Transaction, oldValue: { decorations: DecorationSet }, _old: EditorState, newState: EditorState) => {
        const shouldRebuild =
          tr.getMeta(PAGINATION_META_KEY) === true ||
          tr.docChanged ||
          snapshot.pageBreakBackground !== options.pageBreakBackground ||
          snapshot.pageHeight !== options.pageHeight ||
          snapshot.pageWidth !== options.pageWidth ||
          snapshot.marginTop !== options.marginTop ||
          snapshot.marginBottom !== options.marginBottom ||
          snapshot.marginLeft !== options.marginLeft ||
          snapshot.marginRight !== options.marginRight ||
          snapshot.pageGap !== options.pageGap ||
          snapshot.contentMarginTop !== options.contentMarginTop ||
          snapshot.contentMarginBottom !== options.contentMarginBottom ||
          snapshot.headerLeft !== options.headerLeft ||
          snapshot.headerRight !== options.headerRight ||
          snapshot.footerLeft !== options.footerLeft ||
          snapshot.footerRight !== options.footerRight ||
          !deepEqualIterative(options.customHeader, snapshot.customHeader) ||
          !deepEqualIterative(options.customFooter, snapshot.customFooter);

        if (!shouldRebuild) return oldValue;

        const { headerHeight, footerHeight } = snapshot;
        const widgets = createPaginationDecoration(options, headerHeight, footerHeight);
        snapshot = { ...options, headerHeight, footerHeight };
        return { decorations: DecorationSet.create(newState.doc, widgets) };
      },
    },

    props: {
      decorations(state: EditorState) {
        return paginationKey.getState(state)?.decorations;
      },
    },

    view: (editorView: EditorView) => {
      // Initialisation DOM
      const dom = editorView.dom;
      dom.classList.add("rm-with-pagination");
      dom.style.border = "1px solid var(--pm-page-gap-border-color)";
      dom.style.paddingLeft = "var(--pm-margin-left)";
      dom.style.paddingRight = "var(--pm-margin-right)";
      dom.style.width = "var(--pm-page-width)";
      updateCssVariables(dom, options);
      injectPaginationStyles();

      // Déclenche le premier calcul de pagination APRÈS que le navigateur
      // a appliqué les CSS variables posées ci-dessus. Sans ce RAF, la widget
      // factory s'exécute avant view() et mesure le min-height fallback du CSS
      // (1123px), créant un page-break band fantôme visible au premier rendu.
      let destroyed = false;
      requestAnimationFrame(() => {
        if (!destroyed) {
          editorView.dispatch(
            editorView.state.tr.setMeta(PAGINATION_META_KEY, true),
          );
        }
      });

      return {
        update: (view: EditorView) => {
          const d = view.dom;
          updateCssVariables(d, options);

          const pageCount = calculatePageCount(d, options, 0, 0, view.state.doc);
          const currentPageCount = getExistingPageCount(d);

          if (currentPageCount !== pageCount) {
            requestAnimationFrame(() => {
              view.dispatch(view.state.tr.setMeta(PAGINATION_META_KEY, true));
            });
            return;
          }

          // Calcul des hauteurs header/footer par page
          const customHeaderPages = Object.keys(options.customHeader).map(Number);
          const customFooterPages = Object.keys(options.customFooter).map(Number);
          const headerHeightMap = getHeaderHeight(d, customHeaderPages, "content");
          const footerHeightMap = getFooterHeight(d, customFooterPages, "content");

          const headerForPages = new Map<number, number>();
          const footerForPages = new Map<number, number>();
          for (let i = 0; i <= pageCount; i++) {
            if (headerHeightMap.has(i)) headerForPages.set(i, headerHeightMap.get(i) ?? 0);
            if (footerHeightMap.has(i)) footerForPages.set(i, footerHeightMap.get(i) ?? 0);
          }

          // Mémorisation pour la prochaine reconstruction de décoration
          snapshot.headerHeight = headerForPages;
          snapshot.footerHeight = footerForPages;

          // CSS variables de hauteur par page
          const pagesSet = new Set([1, ...footerForPages.keys(), ...headerForPages.keys()]);
          let missingPage: number | undefined;
          for (let i = 1; i <= pageCount; i++) {
            if (!pagesSet.has(i)) { missingPage = i; break; }
          }
          if (missingPage !== undefined) pagesSet.add(missingPage);
          pagesSet.delete(0);

          let maxH: number | undefined;
          for (const page of pagesSet) {
            const hh = headerForPages.get(page) ?? headerForPages.get(0) ?? 0;
            const fh = footerForPages.get(page) ?? footerForPages.get(0) ?? 0;
            const { _pageHeaderHeight, _pageHeight } = getHeight(options, hh, fh);
            const contentHeight = page === 1 ? _pageHeight + _pageHeaderHeight : _pageHeight;

            if (page === 1) {
              d.style.setProperty("--pm-page-content-first", `${contentHeight}px`);
            } else if (page === missingPage) {
              d.style.setProperty("--pm-page-content-general", `${contentHeight}px`);
            } else {
              d.style.setProperty(`--pm-page-content-${page}`, `${contentHeight}px`);
            }

            if (maxH === undefined || contentHeight < maxH) maxH = contentHeight;
          }

          if (maxH !== undefined) {
            d.style.setProperty("--pm-max-content-child-height", `${maxH - 10}px`);
          }

          refreshPage(d);
        },
        destroy: () => {
          destroyed = true;
          document.querySelector("[data-pm-pagination-style]")?.remove();
          dom.classList.remove("rm-with-pagination");
          dom.style.removeProperty("border");
          dom.style.removeProperty("padding-left");
          dom.style.removeProperty("padding-right");
          dom.style.removeProperty("width");
          dom.style.removeProperty("min-height");
        },
      };
    },
  });

  // ── Plugin de décoration des sauts de ligne ────────────────────────────────
  const brDecoPlugin = new Plugin({
    key: brDecorationKey,

    state: {
      init: (_config: EditorStateConfig, state: EditorState) => buildBrDecorations(state.doc),
      apply: (tr: Transaction, old: DecorationSet) =>
        tr.docChanged ? buildBrDecorations(tr.doc) : old,
    },

    props: {
      decorations(state: EditorState) {
        return brDecorationKey.getState(state) ?? DecorationSet.empty;
      },
    },
  });

  return [paginationPlugin, brDecoPlugin];
}
