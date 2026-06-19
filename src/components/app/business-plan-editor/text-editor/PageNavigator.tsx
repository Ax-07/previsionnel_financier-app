"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PageNavigatorProps {
  editorState: EditorState;
  viewRef: React.RefObject<EditorView | null>;
  viewVersion: number;
}

interface PageMetrics {
  pageCount: number;
  pageHeight: number;
  pageGap: number;
}

interface OutlineItem {
  pos: number;
  level: number;
  title: string;
}

type NavigatorTab = "outline" | "pages";
type ScrollHost = HTMLElement | Window;

const DEFAULT_PAGE_HEIGHT = 1123;
const DEFAULT_PAGE_GAP = 50;

function readPxVar(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getToolbarHeight(): number {
  return document.getElementById("toolbar")?.getBoundingClientRect().height ?? 0;
}

function clampPage(page: number, pageCount: number): number {
  return Math.max(1, Math.min(pageCount, page));
}

function isHeadingElement(node: globalThis.Node | null): node is HTMLElement {
  return node instanceof HTMLElement && /^H[1-6]$/i.test(node.tagName);
}

function isWindowHost(host: ScrollHost): host is Window {
  return host === window;
}

function getScrollHost(element: HTMLElement): ScrollHost {
  let current = element.parentElement;
  while (current && current !== document.body) {
    const { overflowY } = getComputedStyle(current);
    const canScroll = /(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight;
    if (canScroll) return current;
    current = current.parentElement;
  }
  return window;
}

function getHostScrollTop(host: ScrollHost): number {
  return isWindowHost(host) ? window.scrollY : host.scrollTop;
}

function getHostViewportTop(host: ScrollHost): number {
  return isWindowHost(host) ? 0 : host.getBoundingClientRect().top;
}

function getElementTopInHost(element: HTMLElement, host: ScrollHost): number {
  return element.getBoundingClientRect().top - getHostViewportTop(host) + getHostScrollTop(host);
}

function scrollHostTo(host: ScrollHost, top: number): void {
  const scrollOptions: ScrollToOptions = { top: Math.max(0, top), behavior: "smooth" };
  if (isWindowHost(host)) {
    window.scrollTo(scrollOptions);
    return;
  }
  host.scrollTo(scrollOptions);
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({ editorState, viewRef, viewVersion }) => {
  const editorDoc = editorState.doc;
  const [metrics, setMetrics] = useState<PageMetrics>({
    pageCount: 1,
    pageHeight: DEFAULT_PAGE_HEIGHT,
    pageGap: DEFAULT_PAGE_GAP,
  });
  const [activeTab, setActiveTab] = useState<NavigatorTab>("outline");
  const [activePage, setActivePage] = useState(1);
  const [activeHeadingPos, setActiveHeadingPos] = useState<number | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const outline = useMemo<OutlineItem[]>(() => {
    const items: OutlineItem[] = [];
    const heading = editorState.schema.nodes.heading;
    if (!heading) return items;

    editorState.doc.descendants((node, pos) => {
      if (node.type !== heading) return;
      const title = node.textContent.trim() || `Titre ${items.length + 1}`;
      items.push({
        pos,
        level: Number(node.attrs.level) || 1,
        title,
      });
    });

    return items;
  }, [editorState]);

  const measurePages = useCallback(() => {
    const editor = viewRef.current?.dom as HTMLElement | undefined;
    if (!editor) return;

    const pageHeight = readPxVar(editor, "--pm-page-height", DEFAULT_PAGE_HEIGHT);
    const pageGap = readPxVar(editor, "--pm-page-gap", DEFAULT_PAGE_GAP);
    const pageBreakCount = editor.querySelectorAll(".pm-page-break").length;
    const pageCountFromHeight = Math.round((editor.scrollHeight + pageGap) / (pageHeight + pageGap));
    const pageCount = Math.max(1, pageBreakCount + 1, pageCountFromHeight);

    setMetrics((current) =>
      current.pageCount === pageCount && current.pageHeight === pageHeight && current.pageGap === pageGap
        ? current
        : { pageCount, pageHeight, pageGap },
    );
    setToolbarHeight(getToolbarHeight());
  }, [viewRef]);

  useEffect(() => {
    let frame = 0;
    const scheduleMeasure = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measurePages();
      });
    };

    const editor = viewRef.current?.dom as HTMLElement | undefined;
    scheduleMeasure();
    if (!editor) {
      return () => {
        if (frame) window.cancelAnimationFrame(frame);
      };
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const mutationObserver = new MutationObserver(scheduleMeasure);
    resizeObserver.observe(editor);
    mutationObserver.observe(editor, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [editorDoc, measurePages, viewRef, viewVersion]);

  const updateActiveNavigation = useCallback(() => {
    const view = viewRef.current;
    const editor = view?.dom as HTMLElement | undefined;
    if (!view || !editor) return;

    const scrollHost = getScrollHost(editor);
    const editorTop = getElementTopInHost(editor, scrollHost);
    const readingLine = getHostScrollTop(scrollHost) + toolbarHeight + 40;
    const pageStride = metrics.pageHeight + metrics.pageGap;
    const nextPage = clampPage(Math.floor((readingLine - editorTop) / pageStride) + 1, metrics.pageCount);
    setActivePage((current) => (current === nextPage ? current : nextPage));

    let nextHeadingPos: number | null = null;
    for (const item of outline) {
      const dom = view.nodeDOM(item.pos);
      if (!isHeadingElement(dom)) continue;
      const domTop = dom.getBoundingClientRect().top - getHostViewportTop(scrollHost);
      if (domTop <= toolbarHeight + 72) {
        nextHeadingPos = item.pos;
      } else {
        break;
      }
    }
    setActiveHeadingPos((current) => (current === nextHeadingPos ? current : nextHeadingPos));
  }, [metrics, outline, toolbarHeight, viewRef]);

  useEffect(() => {
    let frame = 0;
    const scheduleActivePage = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveNavigation();
      });
    };

    scheduleActivePage();
    const editor = viewRef.current?.dom as HTMLElement | undefined;
    const scrollHost = editor ? getScrollHost(editor) : window;
    scrollHost.addEventListener("scroll", scheduleActivePage, { passive: true });
    window.addEventListener("resize", scheduleActivePage);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      scrollHost.removeEventListener("scroll", scheduleActivePage);
      window.removeEventListener("resize", scheduleActivePage);
    };
  }, [updateActiveNavigation, viewRef, viewVersion]);

  const pages = useMemo(
    () => Array.from({ length: metrics.pageCount }, (_, index) => index + 1),
    [metrics.pageCount],
  );
  const progress =
    metrics.pageCount > 1 ? ((activePage - 1) / (metrics.pageCount - 1)) * 100 : 100;

  const scrollToPage = (page: number) => {
    const editor = viewRef.current?.dom as HTMLElement | undefined;
    if (!editor) return;

    const scrollHost = getScrollHost(editor);
    const editorTop = getElementTopInHost(editor, scrollHost);
    const targetTop = editorTop + (page - 1) * (metrics.pageHeight + metrics.pageGap) - toolbarHeight - 16;
    scrollHostTo(scrollHost, targetTop);
  };

  const scrollToHeading = (pos: number) => {
    const view = viewRef.current;
    if (!view) return;

    const target = view.nodeDOM(pos);
    if (!isHeadingElement(target)) return;

    const scrollHost = getScrollHost(target);
    const targetTop = getElementTopInHost(target, scrollHost) - toolbarHeight - 18;
    scrollHostTo(scrollHost, targetTop);
  };

  return (
    <aside
      className="w-full h-full hidden overflow-auto bg-background/95 text-foreground shadow-xs [scrollbar-gutter:stable] print:hidden min-[901px]:sticky min-[901px]:block"
      style={{
        top: `${toolbarHeight + 12}px`,
        maxHeight: `calc(100vh - ${toolbarHeight + 24}px)`,
      }}
      aria-label="Navigation du document"
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[0.8rem] font-semibold leading-none">Navigation</div>
            <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
              {metrics.pageCount} {metrics.pageCount > 1 ? "pages" : "page"} - {outline.length}{" "}
              {outline.length > 1 ? "titres" : "titre"}
            </div>
          </div>
          {/* <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[0.72rem] font-semibold text-primary-foreground">
            {activePage}
          </div> */}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as NavigatorTab)}
          className="mt-2.5"
        >
          <TabsList className="grid w-full grid-cols-2 border border-border">
            <TabsTrigger value="outline" className="gap-1 text-[0.72rem] font-semibold">
              Titres
              <span
                className={cn(
                  "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-[0.66rem]",
                  activeTab === "outline" && "bg-primary text-primary-foreground",
                )}
              >
                {outline.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1 text-[0.72rem] font-semibold">
              Pages
              <span
                className={cn(
                  "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-[0.66rem]",
                  activeTab === "pages" && "bg-primary text-primary-foreground",
                )}
              >
                {metrics.pageCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="mt-3">
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid gap-2.5">
              {pages.map((page) => {
                const active = page === activePage;
                return (
                  <button
                    key={page}
                    type="button"
                    className={cn(
                      "block w-full cursor-pointer rounded-[10px] border border-transparent px-1.75 pb-1.75 pt-2 text-center text-muted-foreground transition hover:-translate-y-px hover:border-border hover:bg-muted hover:text-foreground",
                      active && "border-primary/60 bg-primary/10 text-primary",
                    )}
                    onClick={() => scrollToPage(page)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "relative mx-auto grid h-26 w-19 gap-1.25 overflow-hidden rounded-md border border-border bg-white px-2.5 py-2.75 shadow-xs transition dark:bg-background/70",
                        active && "border-primary ring-2 ring-primary/20 shadow-md",
                      )}
                      aria-hidden="true"
                    >
                      <span className="h-2 w-[64%] rounded-full bg-primary/15" />
                      <span className="h-1 w-full rounded-full bg-foreground/15" />
                      <span className="h-1 w-[72%] rounded-full bg-foreground/15" />
                      <span className="h-1 w-[54%] rounded-full bg-foreground/15" />
                      <span className="my-1 h-6 w-full rounded border border-foreground/15" />
                      <span className="h-1 w-full rounded-full bg-foreground/15" />
                    </span>
                    <span className="mt-1.5 inline-flex items-center justify-center gap-1 text-[0.72rem] font-semibold">
                      <span>Page {page}</span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-primary opacity-0 transition-opacity",
                          active && "opacity-100",
                        )}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="outline" className="mt-3">
            {outline.length > 0 ? (
              <div className="grid gap-0.5">
                {outline.map((item) => {
                  const active = item.pos === activeHeadingPos;
                  return (
                    <button
                      key={item.pos}
                      type="button"
                      className={cn(
                        "grid min-h-7 w-full cursor-pointer grid-cols-[6px_minmax(0,1fr)] items-center gap-1.5 rounded-lg border border-transparent bg-transparent py-1.5 pr-2 text-left text-[0.74rem] leading-tight text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground",
                        active && "border-primary/40 bg-primary/10 text-primary",
                      )}
                      style={{ paddingLeft: `${8 + Math.min(item.level - 1, 4) * 10}px` }}
                      onClick={() => scrollToHeading(item.pos)}
                      aria-current={active ? "location" : undefined}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-50", active && "opacity-100")}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-2 text-[0.72rem] leading-tight text-muted-foreground">
                Ajoutez des titres pour creer le plan.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
};
