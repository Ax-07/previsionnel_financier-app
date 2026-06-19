export const updateCssVariables = (targetNode: HTMLElement, config: PageConfig): void => {
    const cssVariables: CssVariables = {
        "pm-page-height": `${config.pageHeight}px`,
        "pm-margin-top": `${config.marginTop}px`,
        "pm-margin-bottom": `${config.marginBottom}px`,
        "pm-margin-left": `${config.marginLeft}px`,
        "pm-margin-right": `${config.marginRight}px`,
        "pm-content-margin-top": `${config.contentMarginTop}px`,
        "pm-content-margin-bottom": `${config.contentMarginBottom}px`,
        "pm-page-gap-border-color": `${config.pageGapBorderColor}`,
        "pm-page-width": `${config.pageWidth}px`,
        // Largeur de la zone de contenu (border-box page - marges).
        // Valeur absolue : garantit le bon calcul y compris dans les cellules de tableau
        // où `100%` se résout à la largeur d'une seule colonne, pas de tout le tableau.
        "pm-content-width": `${config.pageWidth - config.marginLeft - config.marginRight}px`,
    };
    Object.entries(cssVariables).forEach(([key, value]) => {
        targetNode.style.setProperty(`--${key}`, value);
    });
};
export const getPageSize = (
    height: number,
    width: number,
    marginTop: number,
    marginBottom: number,
    marginLeft: number,
    marginRight: number,
    contentMarginTop: number = 0,
    contentMarginBottom: number = 0,
    pageGapBorderColor: string = "transparent"
): PageConfig => {
    return {
        pageHeight: height,
        pageWidth: width,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        contentMarginTop,
        contentMarginBottom,
        pageGapBorderColor,
    };
};

function queryPaginationMeasureTarget(targetNode: HTMLElement, selector: string): HTMLElement | null {
    return Array.from(targetNode.querySelectorAll<HTMLElement>(selector)).find(
        (el) => !el.closest(".pm-print-document")
    ) ?? null;
}

export const getHeaderHeight = (
    targetNode: HTMLElement,
    pageNumbers: number[],
    type: "actual" | "content"
): Map<number, number> => {
    const headerHeightMap: Map<number, number> = new Map();
    // Hauteur générale : page-0 n'existe jamais (les pages commencent à 1).
    // Fallback sur page-1 (pm-first-page-header sans table des matières).
    // Quand la table des matières est active, page-1 est la couverture (pas de header) :
    // on remonte alors jusqu'à page-2 puis page-3 qui sont dans le front-matter widget.
    const clientHeader =
        queryPaginationMeasureTarget(targetNode, getHeaderHeightSelector(0, type)) ??
        queryPaginationMeasureTarget(targetNode, getHeaderHeightSelector(1, type)) ??
        queryPaginationMeasureTarget(targetNode, getHeaderHeightSelector(2, type)) ??
        queryPaginationMeasureTarget(targetNode, getHeaderHeightSelector(3, type));
    headerHeightMap.set(0, clientHeader ? clientHeader.clientHeight : 0);
    // Find header height for each page number
    pageNumbers.forEach((pageNumber: number) => {
        const clientHeader = queryPaginationMeasureTarget(targetNode,
            getHeaderHeightSelector(pageNumber, type)
        );
        const headerHeight = clientHeader ? clientHeader.clientHeight : 0;
        headerHeightMap.set(pageNumber, headerHeight);
    });
    return headerHeightMap;
};

export const getHeaderHeightSelector = (pageNumber: number, type: HeaderFooterType): string => {
    return type === "actual" ? `.rm-page-header-${pageNumber}` : `.rm-page-header-${pageNumber} .rm-page-header-content`;
};
export const getFooterHeight = (
    targetNode: HTMLElement,
    pageNumbers: number[],
    type: HeaderFooterType
): Map<number, number> => {
    const footerHeightMap: Map<number, number> = new Map();
    // Hauteur générale : page-0 n'existe jamais (les pages commencent à 1).
    // Fallback sur page-1 : présent dans le premier spacer une fois rendu.
    // Quand la table des matières est active, page-1 est la couverture (pas de footer) :
    // on remonte alors jusqu'à page-2 qui est dans le front-matter widget.
    const clientFooter =
        queryPaginationMeasureTarget(targetNode, getFooterHeightSelector(0, type)) ??
        queryPaginationMeasureTarget(targetNode, getFooterHeightSelector(1, type)) ??
        queryPaginationMeasureTarget(targetNode, getFooterHeightSelector(2, type));
    footerHeightMap.set(0, clientFooter ? clientFooter.clientHeight : 0);
    // Find footer height for each page number
    pageNumbers.forEach((pageNumber: number) => {
        const clientFooter = queryPaginationMeasureTarget(targetNode, getFooterHeightSelector(pageNumber, type));
        const footerHeight = clientFooter ? clientFooter.clientHeight : 0;
        footerHeightMap.set(pageNumber, footerHeight);
    });
    return footerHeightMap;
};
export const getFooterHeightSelector = (pageNumber: number, type: HeaderFooterType): string => {
    return type === "actual" ? `.rm-page-footer-${pageNumber}` : `.rm-page-footer-${pageNumber} .rm-page-footer-content`;
};

/**
 * Sanitize une URL d'image pour une utilisation sûre dans `background-image` et `src`.
 * Seuls http(s), les chemins absolus "/" et data:image/ sont acceptés.
 */
export function sanitizeBgUrl(url: string): string {
    if (!url) return "";
    const trimmed = url.trim();
    if (!/^(https?:\/\/|\/[^/]|data:image\/)/i.test(trimmed)) return "";
    return trimmed.replace(/['")]/g, "");
}

