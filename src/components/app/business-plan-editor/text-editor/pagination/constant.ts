import { getPageSize } from "./utils";

const CONTENT_MARGIN_TOP = 8; // 0.5rem

export const A4_PAGE_SIZE = getPageSize(1123, 794, 95, 95, 76, 76, CONTENT_MARGIN_TOP);
export const A3_PAGE_SIZE = getPageSize(1591, 1123, 95, 95, 76, 76, CONTENT_MARGIN_TOP);
export const A5_PAGE_SIZE = getPageSize(794, 419, 76, 76, 57, 57, CONTENT_MARGIN_TOP);
export const LETTER_PAGE_SIZE = getPageSize(1060, 818, 96, 96, 96, 96, CONTENT_MARGIN_TOP);
export const LEGAL_PAGE_SIZE = getPageSize(1404, 818, 96, 96, 96, 96, CONTENT_MARGIN_TOP);
export const TABLOID_PAGE_SIZE = getPageSize(1635, 1060, 96, 96, 96, 96, CONTENT_MARGIN_TOP);
export const PAGE_SIZES = {
    A4: A4_PAGE_SIZE,
    A3: A3_PAGE_SIZE,
    A5: A5_PAGE_SIZE,
    LETTER: LETTER_PAGE_SIZE,
    LEGAL: LEGAL_PAGE_SIZE,
    TABLOID: TABLOID_PAGE_SIZE,
};
