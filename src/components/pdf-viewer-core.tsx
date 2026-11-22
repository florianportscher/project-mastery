"use client";

import "client-only";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Document, Page, pdfjs, type DocumentProps } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useElementWidth } from "@/hooks/use-element-width";
import { cn } from "@/lib/utils";

// Must be set in the module that renders <Document>, see the react-pdf README.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const PAGE_GAP = 8;
// A4 until the first page says otherwise.
const DEFAULT_ASPECT = 1.414;

export type PdfViewerProps = {
  /**
   * URL, `File` or `{ data }` object. Memoize objects: a new object on every
   * render reloads the document.
   */
  file: DocumentProps["file"];
  /** 1-based page the viewer is scrolled to. Set it to jump, e.g. to a cited page. */
  page?: number;
  /** Initial page when `page` is not controlled. */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Pages to mark as cited, both ends included. */
  marked?: { from: number; to: number };
  /** Zoom as a multiple of the fit-to-width size, from 0.5 to 3. */
  zoom?: number;
  /** Initial zoom when `zoom` is not controlled. */
  defaultZoom?: number;
  onZoomChange?: (zoom: number) => void;
  className?: string;
};

/**
 * Shows every page of a PDF in one scroll container, fitted to the container
 * width times the zoom, with a selectable text layer and clickable links.
 * Only pages near the viewport render. Zoom by buttons or trackpad pinch.
 * Import `PdfViewer` instead, which loads this only in the browser.
 */
export function PdfViewerCore({
  file,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  marked,
  zoom: zoomProp,
  defaultZoom = 1,
  onZoomChange,
  className,
}: PdfViewerProps) {
  const [page, setPage] = useControllableState({
    prop: pageProp,
    defaultProp: defaultPage,
    onChange: onPageChange,
  });
  const [zoom, setZoom] = useControllableState({
    prop: zoomProp,
    defaultProp: defaultZoom,
    onChange: onZoomChange,
  });
  const [numPages, setNumPages] = useState<number>();
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [near, setNear] = useState<ReadonlySet<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLElement>());
  const width = useElementWidth(containerRef);

  const pageWidth = width ? Math.round(width * zoom) : undefined;
  // Pages draw at this width and are scaled by CSS to `pageWidth` meanwhile,
  // so a drag or zoom does not redraw every canvas on each step.
  const [renderWidth, setRenderWidth] = useState(pageWidth);
  useEffect(() => {
    const timer = setTimeout(() => setRenderWidth(pageWidth), 250);
    return () => clearTimeout(timer);
  }, [pageWidth]);
  const drawnWidth = renderWidth ?? pageWidth;
  const stride = pageWidth ? pageWidth * aspect + PAGE_GAP : 0;
  const currentPage = numPages ? clamp(page, 1, numPages) : page;

  // The page the scroll position shows, so a change of `page` that came from
  // scrolling does not scroll again.
  const shownPage = useRef(0);
  // Scroll position in pages (1.5 is half way down page 2), kept across a
  // change of page size such as a resize of the pane.
  const scrollPages = useRef(0);
  // The point a zoom keeps in place: where it sits in the viewport, and where
  // in the document, as a fraction of the page width and in pages from the top.
  const zoomAnchor = useRef<{
    viewX: number;
    viewY: number;
    pageX: number;
    pages: number;
  } | null>(null);
  // Page geometry as last laid out, which the scroll position belongs to.
  const layout = useRef({ width: 0, pageWidth: 0, stride: 0 });
  const ready = Boolean(numPages && pageWidth);

  const scrollToPage = useCallback(
    (target: number) => {
      const container = containerRef.current;
      if (!container) return;
      scrollPages.current = target - 1;
      container.scrollTop = (target - 1) * stride;
    },
    [stride],
  );

  useEffect(() => {
    if (!ready || currentPage === shownPage.current) return;
    shownPage.current = currentPage;
    scrollToPage(currentPage);
  }, [ready, currentPage, scrollToPage]);

  // Keep the reading position when the page size changes: a zoom keeps the
  // point it zooms around in place, a resize keeps the top of the view.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !ready || !width || !pageWidth) return;
    const anchor = zoomAnchor.current;
    zoomAnchor.current = null;
    if (anchor) {
      const pageLeft = Math.max(0, (width - pageWidth) / 2);
      container.scrollLeft = pageLeft + anchor.pageX * pageWidth - anchor.viewX;
      container.scrollTop = anchor.pages * stride - anchor.viewY;
      scrollPages.current = Math.max(0, container.scrollTop / stride);
    } else {
      container.scrollTop = scrollPages.current * stride;
    }
    layout.current = { width, pageWidth, stride };
  }, [stride, ready, width, pageWidth]);

  // Zooms around a point of the viewport, its centre unless given.
  const zoomAround = useCallback(
    (next: (current: number) => number, point?: { x: number; y: number }) => {
      const container = containerRef.current;
      const laidOut = layout.current;
      if (container && laidOut.stride) {
        const viewX = point?.x ?? container.clientWidth / 2;
        const viewY = point?.y ?? container.clientHeight / 2;
        const pageLeft = Math.max(0, (laidOut.width - laidOut.pageWidth) / 2);
        zoomAnchor.current = {
          viewX,
          viewY,
          pageX: (container.scrollLeft + viewX - pageLeft) / laidOut.pageWidth,
          pages: (container.scrollTop + viewY) / laidOut.stride,
        };
      }
      setZoom(next);
    },
    [setZoom],
  );

  // Render pages within about two screens of the viewport.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !numPages) return;
    const observer = new IntersectionObserver(
      (entries) =>
        setNear((previous) => {
          const next = new Set(previous);
          for (const entry of entries) {
            const number = Number((entry.target as HTMLElement).dataset.page);
            if (entry.isIntersecting) next.add(number);
            else next.delete(number);
          }
          return next;
        }),
      { root: container, rootMargin: "200% 0px" },
    );
    for (const element of pageRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, [numPages]);

  // Pinch arrives as a wheel event with ctrlKey. React's onWheel is passive,
  // so this needs a native listener to stop the browser zooming the app.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const box = container.getBoundingClientRect();
      zoomAround(
        (current) =>
          clamp(current * Math.exp(-event.deltaY * 0.01), MIN_ZOOM, MAX_ZOOM),
        { x: event.clientX - box.left, y: event.clientY - box.top },
      );
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomAround]);

  const onScroll = () => {
    const container = containerRef.current;
    if (!container || !ready) return;
    scrollPages.current = container.scrollTop / stride;
    const shown = clamp(
      Math.floor((container.scrollTop + stride / 3) / stride) + 1,
      1,
      numPages ?? 1,
    );
    if (shown === shownPage.current) return;
    shownPage.current = shown;
    setPage(shown);
  };

  const zoomBy = (direction: 1 | -1) =>
    zoomAround((current) => {
      const steps = current / ZOOM_STEP;
      const stepped =
        direction === 1
          ? Math.floor(steps + 1e-6) + 1
          : Math.ceil(steps - 1e-6) - 1;
      return clamp(stepped * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    });

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-auto"
      >
        <Document
          file={file}
          suspense={false}
          onLoadSuccess={(document) => {
            setNumPages(document.numPages);
            void document
              .getPage?.(1)
              .then((first) => {
                const [x0 = 0, y0 = 0, x1 = 1, y1 = DEFAULT_ASPECT] =
                  first.view;
                setAspect((y1 - y0) / (x1 - x0));
              })
              .catch(() => {});
          }}
          // Links inside the PDF, e.g. a table of contents.
          onItemClick={({ pageNumber }) => setPage(pageNumber)}
          loading={<PageSkeleton />}
          error={
            <p role="alert" className="p-4 text-sm text-destructive">
              The document could not be loaded.
            </p>
          }
        >
          {pageWidth && numPages
            ? Array.from({ length: numPages }, (_, index) => {
                const number = index + 1;
                const isMarked =
                  marked !== undefined &&
                  number >= marked.from &&
                  number <= marked.to;
                return (
                  <div
                    key={number}
                    data-page={number}
                    data-marked={isMarked || undefined}
                    ref={(element) => {
                      if (element) pageRefs.current.set(number, element);
                      else pageRefs.current.delete(number);
                    }}
                    style={{
                      width: pageWidth,
                      height: pageWidth * aspect,
                      marginBottom: PAGE_GAP,
                    }}
                    className={cn(
                      "relative mx-auto overflow-hidden bg-white",
                      isMarked && "ring-2 ring-primary",
                    )}
                  >
                    {isMarked && (
                      <span className="absolute top-2 right-2 z-10 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                        Cited
                      </span>
                    )}
                    {near.has(number) && drawnWidth ? (
                      <PdfPage
                        number={number}
                        width={pageWidth}
                        drawWidth={drawnWidth}
                      />
                    ) : null}
                  </div>
                );
              })
            : null}
        </Document>
      </div>
      {numPages ? (
        <nav
          aria-label="Pages"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span aria-live="polite" className="tabular-nums">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={currentPage >= numPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => zoomBy(-1)}
            >
              <MinusIcon />
            </Button>
            <span className="w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => zoomBy(1)}
            >
              <PlusIcon />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

/**
 * One page drawn at `drawWidth` and scaled to `width`. PDF.js blanks a canvas
 * while it redraws, so on a new `drawWidth` the old drawing stays on screen
 * until the new one has finished, hidden beneath it.
 */
function PdfPage({
  number,
  width,
  drawWidth,
}: {
  number: number;
  width: number;
  drawWidth: number;
}) {
  // The width of the drawing on screen, until the first one has drawn.
  const [shownWidth, setShownWidth] = useState<number>();
  const layers =
    shownWidth === undefined || shownWidth === drawWidth
      ? [drawWidth]
      : [shownWidth, drawWidth];

  return layers.map((layerWidth) => {
    const pending = layerWidth !== (shownWidth ?? drawWidth);
    return (
      <div
        key={layerWidth}
        className="absolute top-0 left-0"
        style={{
          width: layerWidth,
          transform: `scale(${width / layerWidth})`,
          transformOrigin: "top left",
          visibility: pending ? "hidden" : undefined,
        }}
      >
        <Page
          pageNumber={number}
          width={layerWidth}
          suspense={false}
          loading={null}
          onRenderSuccess={() => setShownWidth(layerWidth)}
        />
      </div>
    );
  });
}

function PageSkeleton() {
  return <Skeleton className="aspect-[1/1.414] w-full" />;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
