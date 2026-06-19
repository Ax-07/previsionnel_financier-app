// Types locaux (compatibles structurellement avec HeaderFooterImage de documentLayoutTypes.ts).
export interface HeaderFooterImageItem {
  url: string;
  position: "left" | "center" | "right";
  height?: number;
  opacity?: number;
}

import { sanitizeBgUrl } from "./utils";

function selectBannerImage(images: HeaderFooterImageItem[]): HeaderFooterImageItem | undefined {
  return images.find((item) => sanitizeBgUrl(item.url));
}

function createMarginBannerImage(item: HeaderFooterImageItem): HTMLImageElement | null {
  const src = sanitizeBgUrl(item.url);
  if (!src) return null;
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.classList.add("rm-page-margin-banner-img");
  img.setAttribute("aria-hidden", "true");
  img.style.display = "block";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  if (item.opacity !== undefined && item.opacity < 1) img.style.opacity = String(item.opacity);
  return img;
}

function appendMarginImageLayer(
  container: HTMLElement,
  images: HeaderFooterImageItem[] | undefined,
  placement: "top" | "bottom",
): void {
  if (!images?.length) return;
  const bannerImage = selectBannerImage(images);
  if (!bannerImage) return;
  const imgEl = createMarginBannerImage(bannerImage);
  if (!imgEl) return;
  const layer = document.createElement("div");
  layer.classList.add("rm-page-margin-banner", `rm-page-margin-banner-${placement}`);
  layer.setAttribute("aria-hidden", "true");
  layer.style.pointerEvents = "none";
  layer.appendChild(imgEl);
  container.prepend(layer);
}

function appendTemplateContent(
  container: HTMLElement,
  template: string,
  pageNumberClass: "rm-page-number" | "rm-page-number-plus",
): void {
  const parts = template.split("{page}");
  parts.forEach((part, index) => {
    if (part) container.appendChild(document.createTextNode(part));
    if (index < parts.length - 1) {
      const pageNumber = document.createElement("span");
      pageNumber.classList.add(pageNumberClass);
      container.appendChild(pageNumber);
    }
  });
}

export function getFooter(
  footerRightContent: string,
  footerLeftContent: string,
  onFooterClick: HeaderFooterClickHandler | undefined,
  pageNumber: number,
  marginImages?: HeaderFooterImageItem[],
): HTMLDivElement {
  const pageFooter = document.createElement("div");
  pageFooter.classList.add("rm-page-footer");
  pageFooter.classList.add(`rm-page-footer-${pageNumber}`);
  pageFooter.setAttribute("contenteditable", "false");
  pageFooter.style.overflow = "visible";
  pageFooter.style.position = "relative";
  if (onFooterClick) pageFooter.style.cursor = "pointer";
  appendMarginImageLayer(pageFooter, marginImages, "bottom");

  const pageFooterContent = document.createElement("div");
  pageFooterContent.classList.add("rm-page-footer-content");

  const pageFooterLeft = document.createElement("div");
  pageFooterLeft.classList.add("rm-page-footer-left");
  appendTemplateContent(pageFooterLeft, footerLeftContent, "rm-page-number");

  const pageFooterCenter = document.createElement("div");
  pageFooterCenter.classList.add("rm-page-footer-center");

  const pageFooterRight = document.createElement("div");
  pageFooterRight.classList.add("rm-page-footer-right");
  appendTemplateContent(pageFooterRight, footerRightContent, "rm-page-number");

  pageFooterContent.append(pageFooterLeft, pageFooterCenter, pageFooterRight);
  pageFooter.append(pageFooterContent);
  if (onFooterClick) {
    pageFooter.addEventListener("click", (event: MouseEvent) => {
      onFooterClick({ event, pageNumber });
    });
  }
  return pageFooter;
}

export function getHeader(
  headerRightContent: string,
  headerLeftContent: string,
  onHeaderClick: HeaderFooterClickHandler | undefined,
  pageNumber: number,
  marginImages?: HeaderFooterImageItem[],
): HTMLDivElement {
  const pageHeader = document.createElement("div");
  pageHeader.classList.add("rm-page-header");
  pageHeader.classList.add(`rm-page-header-${pageNumber}`);
  pageHeader.setAttribute("contenteditable", "false");
  pageHeader.style.overflow = "hidden";
  if (onHeaderClick) pageHeader.style.cursor = "pointer";
  pageHeader.style.position = "relative";
  appendMarginImageLayer(pageHeader, marginImages, "top");

  const pageHeaderContent = document.createElement("div");
  pageHeaderContent.classList.add("rm-page-header-content");

  const pageHeaderLeft = document.createElement("div");
  pageHeaderLeft.classList.add("rm-page-header-left");
  appendTemplateContent(pageHeaderLeft, headerLeftContent, "rm-page-number-plus");

  const pageHeaderCenter = document.createElement("div");
  pageHeaderCenter.classList.add("rm-page-header-center");

  const pageHeaderRight = document.createElement("div");
  pageHeaderRight.classList.add("rm-page-header-right");
  appendTemplateContent(pageHeaderRight, headerRightContent, "rm-page-number-plus");

  pageHeaderContent.append(pageHeaderLeft, pageHeaderCenter, pageHeaderRight);
  pageHeader.append(pageHeaderContent);
  if (onHeaderClick) {
    pageHeader.addEventListener("click", (event: MouseEvent) => {
      onHeaderClick({ event, pageNumber });
    });
  }
  return pageHeader;
}
