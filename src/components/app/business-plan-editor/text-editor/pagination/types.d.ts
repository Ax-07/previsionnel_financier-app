interface PageConfig {
    pageHeight: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    contentMarginTop: number;
    contentMarginBottom: number;
    pageGapBorderColor: string;
    pageWidth: number;
}

interface CssVariables {
    "pm-page-height": string;
    "pm-margin-top": string;
    "pm-margin-bottom": string;
    "pm-margin-left": string;
    "pm-margin-right": string;
    "pm-content-margin-top": string;
    "pm-content-margin-bottom": string;
    "pm-page-gap-border-color": string;
    "pm-page-width": string;
    "pm-content-width": string;
}

type HeaderFooterType = "actual" | "content";

interface HeaderFooterClickEvent {
    event: MouseEvent;
    pageNumber: number;
}

type HeaderFooterClickHandler = (event: HeaderFooterClickEvent) => void;