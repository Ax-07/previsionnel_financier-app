import { updateCssVariables } from "./utils";
import type { PaginationOptions } from "./paginationTypes";

const PAGINATION_STYLE_ATTR = "data-pm-pagination-style";
const PAGE_PRINT_RULE_ATTR = "data-pm-page-print-rule";

let paginationStyleRefCount = 0;
let nextPrintRuleId = 1;
const pagePrintRules = new Map<number, string>();

function buildPagePrintRuleCss(options: PaginationOptions): string {
  return [
    "@page {",
    `  size: ${options.pageWidth}px ${options.pageHeight}px;`,
    "  margin: 0;",
    "}",
  ].join("\n");
}

function applyLatestPagePrintRule(): void {
  if (typeof document === "undefined") return;
  const ruleValues = Array.from(pagePrintRules.values());
  const latestCss = ruleValues[ruleValues.length - 1];
  const existing = document.querySelector(`[${PAGE_PRINT_RULE_ATTR}]`);
  if (!latestCss) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.textContent = latestCss;
    return;
  }
  const style = document.createElement("style");
  style.setAttribute(PAGE_PRINT_RULE_ATTR, "");
  style.textContent = latestCss;
  document.head.appendChild(style);
}

export function acquirePagePrintRule(options: PaginationOptions): { id: number; release: () => void } {
  const id = nextPrintRuleId++;
  pagePrintRules.set(id, buildPagePrintRuleCss(options));
  applyLatestPagePrintRule();
  return {
    id,
    release: () => {
      pagePrintRules.delete(id);
      applyLatestPagePrintRule();
    },
  };
}

export function acquirePaginationStyles(): () => void {
  if (typeof document === "undefined") return () => {};
  paginationStyleRefCount++;
  if (!document.querySelector(`[${PAGINATION_STYLE_ATTR}]`)) {
    const style = document.createElement("style");
    style.setAttribute(PAGINATION_STYLE_ATTR, "");
    style.textContent = `
    .rm-with-pagination { counter-reset: page-number 0 page-number-plus 1; }
    .pm-page-break { counter-increment: page-number page-number-plus; }
    .rm-with-pagination .rm-page-number::before { content: counter(page-number); }
    .rm-with-pagination .rm-page-number-plus::before { content: counter(page-number-plus); }

    .pm-page-break {
      display: flow-root;
      overflow: visible;
      user-select: none;
      pointer-events: none;
      box-sizing: border-box;
      margin-left: calc(-1 * var(--pm-margin-left));
      width: calc(var(--pm-content-width) + var(--pm-margin-left) + var(--pm-margin-right));
    }

    [data-pagination-measuring] .pm-page-break { display: none !important; }

    .pm-table-of-contents-frontmatter {
      display: block;
      user-select: none;
      box-sizing: border-box;
    }

    .pm-table-of-contents-frontmatter .rm-page-header,
    .pm-table-of-contents-frontmatter .rm-page-footer {
      pointer-events: auto;
    }

    .pm-page-break__gap {
      width: 100%;
      background-color: var(--pm-page-break-bg, #ffffff);
      border-top: var(--pm-page-gap-border-size, 1px) solid var(--pm-page-gap-border-color);
      border-bottom: var(--pm-page-gap-border-size, 1px) solid var(--pm-page-gap-border-color);
      box-sizing: border-box;
    }

    .pm-print-page-break {
      display: none;
      height: 0;
      overflow: hidden;
    }

    .pm-footer-print-box {
      display: contents;
    }

    .rm-with-pagination .pm-page-break .rm-page-footer,
    .rm-with-pagination .pm-page-break .rm-page-header {
      width: 100%;
      box-sizing: border-box;
      pointer-events: auto;
    }

    .rm-with-pagination .pm-first-page-header {
      width: var(--pm-page-width);
      margin-left: calc(-1 * var(--pm-margin-left));
      box-sizing: border-box;
      pointer-events: auto;
    }

    .rm-with-pagination .rm-page-header-content,
    .rm-with-pagination .rm-page-footer-content {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      padding-left: var(--pm-margin-left);
      padding-right: var(--pm-margin-right);
    }
    .rm-with-pagination .pm-last-page-footer .rm-page-footer-content {
      padding-left: 0;
      padding-right: 0;
    }
    .rm-with-pagination .rm-page-header-left,
    .rm-with-pagination .rm-page-footer-left {
      justify-self: start;
      min-width: 0;
      overflow: hidden;
    }
    .rm-with-pagination .rm-page-header-center,
    .rm-with-pagination .rm-page-footer-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 0;
      overflow: hidden;
    }
    .rm-with-pagination .rm-page-header-right,
    .rm-with-pagination .rm-page-footer-right {
      justify-self: end;
      min-width: 0;
      overflow: hidden;
      text-align: right;
    }
    .rm-with-pagination .rm-page-header,
    .rm-with-pagination .rm-page-footer { width: 100%; }
    .rm-with-pagination .rm-page-header.pm-first-page-header {
      width: var(--pm-page-width);
    }
    .rm-with-pagination .rm-page-header-content,
    .rm-with-pagination .rm-page-footer-content {
      position: relative;
      z-index: 1;
    }
    .rm-with-pagination .rm-page-header {
      padding-bottom: var(--pm-content-margin-top) !important;
      padding-top: var(--pm-margin-top) !important;
      display: flex;
      justify-content: space-between;
      max-height: calc(calc(var(--pm-page-height) * 0.45) - var(--pm-margin-top) - var(--pm-content-margin-top));
      overflow-y: hidden;
    }
    .rm-with-pagination .rm-page-footer {
      padding-top: var(--pm-content-margin-bottom) !important;
      padding-bottom: var(--pm-margin-bottom) !important;
      display: flex;
      justify-content: space-between;
      max-height: calc(calc(var(--pm-page-height) * 0.45) - var(--pm-content-margin-bottom) - var(--pm-margin-bottom));
      overflow-y: hidden;
    }
    .rm-with-pagination .rm-page-margin-banner {
      position: absolute;
      left: 0;
      right: 0;
      width: 100%;
      box-sizing: border-box;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    .rm-with-pagination .pm-last-page-footer .rm-page-margin-banner {
      left: calc(-1 * var(--pm-margin-left));
      width: var(--pm-page-width);
    }
    .rm-with-pagination .pm-first-page-header .rm-page-margin-banner {
      width: var(--pm-page-width);
    }
    .rm-with-pagination .rm-page-margin-banner-top {
      top: 0;
      height: var(--pm-margin-top);
    }
    .rm-with-pagination .rm-page-margin-banner-bottom {
      bottom: 0;
      height: var(--pm-margin-bottom);
    }
    .rm-with-pagination .rm-page-margin-banner-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .rm-with-pagination .rm-hf-img {
      display: block;
      width: auto;
      object-fit: contain;
      max-width: 100%;
    }

    .rm-with-pagination table tr td,
    .rm-with-pagination table tr th { word-break: break-word; overflow-wrap: break-word; }
    .rm-with-pagination table { border-collapse: collapse; width: 100%; }
    .rm-with-pagination *:has(> br.ProseMirror-trailingBreak:only-child) { display: table; width: 100%; }
    .rm-with-pagination .rm-br-decoration { display: table; width: 100%; }

    .pm-page-break { position: relative; overflow: visible; }
    .pm-first-page-layers {
      position: relative;
      height: 0;
      overflow: visible;
      pointer-events: none;
      user-select: none;
      margin-left: calc(-1 * var(--pm-margin-left));
      width: calc(var(--pm-content-width) + var(--pm-margin-left) + var(--pm-margin-right));
    }
    .pm-document-page-layers {
      position: relative;
      height: 0;
      overflow: visible;
      pointer-events: none;
      user-select: none;
      margin-left: calc(-1 * var(--pm-margin-left));
      width: calc(var(--pm-content-width) + var(--pm-margin-left) + var(--pm-margin-right));
    }

    .pm-page-bg-layer {
      position: absolute;
      top: 0;
      left: calc(-1 * var(--pm-margin-left));
      width: var(--pm-page-width);
      pointer-events: none;
      z-index: -1;
      background-position: center center;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .pm-margin-left-layer,
    .pm-margin-right-layer {
      position: absolute;
      pointer-events: none;
      z-index: -1;
      background-repeat: no-repeat;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .pm-margin-left-layer {
      left: calc(-1 * var(--pm-margin-left));
      width: var(--pm-margin-left);
    }
    .pm-margin-right-layer {
      right: calc(-1 * var(--pm-margin-right));
      width: var(--pm-margin-right);
    }

    .pm-print-document {
      display: none;
    }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      .rm-with-pagination {
        position: relative !important;
        display: block !important;
        width: var(--pm-page-width) !important;
        min-width: var(--pm-page-width) !important;
        max-width: var(--pm-page-width) !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        overflow: visible !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .rm-with-pagination > :not(.pm-print-document) {
        display: none !important;
      }

      .rm-with-pagination .pm-first-page-layers,
      .rm-with-pagination .pm-first-page-header,
      .rm-with-pagination .pm-table-of-contents-frontmatter,
      .rm-with-pagination .pm-page-break,
      .rm-with-pagination .pm-last-page-footer-wrap,
      .rm-with-pagination .pm-last-page-footer,
      .rm-with-pagination .pm-footer-print-box {
        display: none !important;
      }

      .rm-with-pagination .pm-print-document {
        display: block !important;
        width: var(--pm-page-width) !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        color: black !important;
        break-before: auto !important;
        page-break-before: auto !important;
        /* Keep print pages just below @page height so Chromium does not push
           the first exact-height block to a blank leading page. */
        --pm-print-page-height: calc(var(--pm-page-height) - 1px);
      }

      .rm-with-pagination .pm-print-page {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        left: 0 !important;
        right: auto !important;
        transform: none !important;
        align-self: flex-start !important;
        width: var(--pm-page-width) !important;
        height: var(--pm-print-page-height) !important;
        min-height: var(--pm-print-page-height) !important;
        max-height: var(--pm-print-page-height) !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        background: white !important;
        color: black !important;
        break-before: auto !important;
        page-break-before: auto !important;
        break-inside: auto !important;
        page-break-inside: auto !important;
        break-after: page;
        page-break-after: always;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .rm-with-pagination .pm-print-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .rm-with-pagination .pm-print-page-layers {
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        pointer-events: none !important;
        overflow: hidden !important;
      }

      .rm-with-pagination .pm-print-page-bg,
      .rm-with-pagination .pm-print-margin-banner,
      .rm-with-pagination .pm-print-margin-left-layer,
      .rm-with-pagination .pm-print-margin-right-layer {
        position: absolute !important;
        pointer-events: none !important;
        background-repeat: no-repeat;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .rm-with-pagination .pm-print-page-bg {
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-position: center center;
      }

      .rm-with-pagination .pm-print-margin-banner {
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        background-size: cover;
        background-position: center center;
      }

      .rm-with-pagination .pm-print-margin-banner-top {
        top: 0 !important;
        height: var(--pm-margin-top) !important;
      }

      .rm-with-pagination .pm-print-margin-banner-bottom {
        bottom: 0 !important;
        height: var(--pm-margin-bottom) !important;
      }

      .rm-with-pagination .pm-print-margin-left-layer {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        width: var(--pm-margin-left) !important;
      }

      .rm-with-pagination .pm-print-margin-right-layer {
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: var(--pm-margin-right) !important;
      }

      .rm-with-pagination .pm-print-page .rm-page-header,
      .rm-with-pagination .pm-print-page .rm-page-footer {
        position: relative !important;
        z-index: 1 !important;
        display: flex !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        flex-shrink: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .rm-with-pagination .pm-print-page .rm-page-header-content,
      .rm-with-pagination .pm-print-page .rm-page-footer-content {
        padding-left: var(--pm-margin-left) !important;
        padding-right: var(--pm-margin-right) !important;
      }

      .rm-with-pagination .pm-print-page .rm-page-margin-banner {
        left: 0 !important;
        right: 0 !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
      }

      .rm-with-pagination .pm-print-content-area {
        position: relative !important;
        z-index: 1 !important;
        flex: 1 1 auto !important;
        min-height: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding-left: var(--pm-margin-left) !important;
        padding-right: var(--pm-margin-right) !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        color: black !important;
      }

      .rm-with-pagination .pm-generated-print-page-body,
      .rm-with-pagination .pm-generated-print-page-body > * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      .rm-with-pagination .pm-generated-document-page {
        margin: 0 !important;
        padding: 0 !important;
      }

      .rm-with-pagination .pm-print-page table {
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        table-layout: fixed !important;
        width: 100% !important;
        margin: 0.75rem 0 !important;
      }

      .rm-with-pagination .pm-print-page td,
      .rm-with-pagination .pm-print-page th {
        vertical-align: top !important;
        box-sizing: border-box !important;
        position: relative !important;
        border: 1px solid rgba(0, 0, 0, 0.55) !important;
        padding: 6px 10px !important;
        min-width: 50px !important;
      }

      .rm-with-pagination .pm-print-page th {
        font-weight: 600 !important;
        background: transparent !important;
      }

      /* Les cellules vides sérialisées deviennent souvent <td><p></p></td>
         (sans ProseMirror-trailingBreak), ce qui réduit la hauteur visuelle.
         On injecte une ligne non-sécable pour conserver la même hauteur qu'en édition. */
      .rm-with-pagination .pm-print-page td > p:only-child:empty::before,
      .rm-with-pagination .pm-print-page th > p:only-child:empty::before {
        content: "\\00a0";
      }

      .rm-with-pagination .pm-print-content-area .page-break {
        display: none !important;
        break-after: auto !important;
        page-break-after: auto !important;
      }

      .rm-with-pagination .pm-print-content-area .ProseMirror-selectednode {
        outline: none !important;
      }
    }
  `;
    document.head.appendChild(style);
  }

  return () => {
    paginationStyleRefCount = Math.max(0, paginationStyleRefCount - 1);
    if (paginationStyleRefCount === 0) {
      document.querySelector(`[${PAGINATION_STYLE_ATTR}]`)?.remove();
    }
  };
}

export function refreshPageMinHeight(
  dom: HTMLElement,
  options: PaginationOptions,
  breaks: ReadonlyArray<unknown>,
  extraPages = 0,
): void {
  const pageCount = breaks.length + 1 + extraPages;
  const gapCount = breaks.length + extraPages;
  const minHeight = pageCount * options.pageHeight + gapCount * options.pageGap;
  dom.style.setProperty("--pm-print-min-height", `${Math.max(1, pageCount * options.pageHeight - 4)}px`);
  if (Math.abs(dom.offsetHeight - minHeight) > 1) {
    dom.style.minHeight = `${minHeight}px`;
  }
}

export function updatePaginationDomStyles(dom: HTMLElement, options: PaginationOptions): void {
  updateCssVariables(dom, options);
  dom.style.setProperty("--pm-page-break-bg", options.pageBreakBackground);
  dom.style.setProperty("--pm-page-gap", `${options.pageGap}px`);
  dom.style.setProperty("--pm-page-gap-border-size", `${options.pageGapBorderSize}px`);
  if (!dom.style.getPropertyValue("--pm-print-min-height")) {
    dom.style.setProperty("--pm-print-min-height", `${Math.max(1, options.pageHeight - 4)}px`);
  }
}
