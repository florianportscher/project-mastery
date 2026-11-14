import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PdfViewerCore } from "./pdf-viewer-core";

const pdf = vi.hoisted(() => ({ loadFails: false }));

// PDF.js needs a worker and canvas, which jsdom lacks. The mock loads a
// five-page document of 600 x 800 pages, or fails to when `pdf.loadFails` is
// set, renders each requested page number as text, and has a link inside the
// PDF to page 4.
vi.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({
    children,
    error,
    onLoadSuccess,
    onItemClick,
  }: {
    children: ReactNode;
    error: ReactNode;
    onLoadSuccess: (document: unknown) => void;
    onItemClick: (item: { pageNumber: number }) => void;
  }) => {
    useEffect(() => {
      if (!pdf.loadFails) {
        onLoadSuccess({
          numPages: 5,
          getPage: async () => ({ view: [0, 0, 600, 800] }),
        });
      }
    }, [onLoadSuccess]);
    if (pdf.loadFails) return <div>{error}</div>;
    return (
      <div>
        <button type="button" onClick={() => onItemClick({ pageNumber: 4 })}>
          Contents: chapter 4
        </button>
        {children}
      </div>
    );
  },
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid="pdf-page">{pageNumber}</div>
  ),
}));

// Pages whose numbers are in `near` count as close to the viewport.
const viewport = vi.hoisted(() => ({ near: new Set<number>([1, 2, 3, 4, 5]) }));
const scrolled = vi.hoisted(() => ({ top: 0 }));

beforeEach(() => {
  pdf.loadFails = false;
  viewport.near = new Set([1, 2, 3, 4, 5]);
  scrolled.top = 0;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        this.callback(
          [{ contentRect: { width: 600 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        const number = Number((target as HTMLElement).dataset.page);
        this.callback(
          [
            { target, isIntersecting: viewport.near.has(number) },
          ] as IntersectionObserverEntry[],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
    },
  );
  // jsdom does not scroll: record where the viewer scrolls to.
  Object.defineProperty(HTMLElement.prototype, "scrollTop", {
    configurable: true,
    get: () => scrolled.top,
    set: (value: number) => {
      scrolled.top = value;
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTop");
});

// A page is 600 x 800 at zoom 1 in a 600-wide container, plus the 8px gap.
const PAGE_STRIDE = 808;

describe("PdfViewerCore", () => {
  test("shows all pages and scrolls to the requested one when it changes", async () => {
    const { rerender } = render(<PdfViewerCore file="/slides.pdf" page={3} />);

    expect(await screen.findAllByTestId("pdf-page")).toHaveLength(5);
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
    expect(scrolled.top).toBe(2 * PAGE_STRIDE);

    rerender(<PdfViewerCore file="/slides.pdf" page={5} />);
    expect(scrolled.top).toBe(4 * PAGE_STRIDE);
  });

  test("renders only the pages near the viewport", async () => {
    viewport.near = new Set([1, 2]);
    render(<PdfViewerCore file="/slides.pdf" />);

    const pages = await screen.findAllByTestId("pdf-page");
    expect(pages.map((element) => element.textContent)).toEqual(["1", "2"]);
  });

  test("marks the cited pages", async () => {
    const { container } = render(
      <PdfViewerCore file="/slides.pdf" marked={{ from: 2, to: 3 }} />,
    );

    await screen.findAllByTestId("pdf-page");
    const marked = [...container.querySelectorAll("[data-marked]")].map(
      (element) => (element as HTMLElement).dataset.page,
    );
    expect(marked).toEqual(["2", "3"]);
    expect(screen.getAllByText("Cited")).toHaveLength(2);
  });

  test("reports the page the Student scrolls to", async () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <PdfViewerCore file="/slides.pdf" onPageChange={onPageChange} />,
    );
    await screen.findAllByTestId("pdf-page");

    scrolled.top = 2 * PAGE_STRIDE + 100;
    fireEvent.scroll(container.querySelector(".overflow-auto")!);

    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });

  test("clamps a page number beyond the document", async () => {
    render(<PdfViewerCore file="/slides.pdf" page={42} />);

    expect(await screen.findByText("Page 5 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  test("says so when the document cannot be loaded", async () => {
    pdf.loadFails = true;
    render(<PdfViewerCore file="/broken.pdf" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The document could not be loaded.",
    );
    expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
  });

  test("a link inside the PDF jumps to its page", async () => {
    const onPageChange = vi.fn();
    render(<PdfViewerCore file="/slides.pdf" onPageChange={onPageChange} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Contents: chapter 4" }),
    );

    expect(screen.getByText("Page 4 of 5")).toBeInTheDocument();
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(scrolled.top).toBe(3 * PAGE_STRIDE);
  });

  test("navigates with the page buttons", async () => {
    render(<PdfViewerCore file="/slides.pdf" defaultPage={2} />);

    fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
    expect(scrolled.top).toBe(2 * PAGE_STRIDE);

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  });

  test("zooms in 25% steps between 50% and 300%", async () => {
    render(<PdfViewerCore file="/slides.pdf" />);
    const zoomIn = await screen.findByRole("button", { name: "Zoom in" });
    const zoomOut = screen.getByRole("button", { name: "Zoom out" });

    fireEvent.click(zoomIn);
    expect(screen.getByText("125%")).toBeInTheDocument();
    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    expect(screen.getByText("75%")).toBeInTheDocument();
    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(zoomOut).toBeDisabled();

    for (let step = 0; step < 10; step++) fireEvent.click(zoomIn);
    expect(screen.getByText("300%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();
  });

  test("a pinch zooms the PDF and not the app", async () => {
    const { container } = render(<PdfViewerCore file="/slides.pdf" />);
    await screen.findAllByTestId("pdf-page");
    const scroller = container.querySelector(".overflow-auto")!;

    const pinchOut = new WheelEvent("wheel", {
      ctrlKey: true,
      deltaY: -20,
      cancelable: true,
    });
    act(() => {
      scroller.dispatchEvent(pinchOut);
    });
    expect(pinchOut.defaultPrevented).toBe(true);
    expect(screen.getByText("122%")).toBeInTheDocument();

    // A plain wheel scrolls as usual.
    const scroll = new WheelEvent("wheel", { deltaY: 20, cancelable: true });
    scroller.dispatchEvent(scroll);
    expect(scroll.defaultPrevented).toBe(false);
  });
});
