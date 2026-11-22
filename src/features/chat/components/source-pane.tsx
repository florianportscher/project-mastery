"use client";

import { Maximize2Icon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { pageNotFoundMessage } from "@/features/chat/domain/sources";
import { pagesLabel } from "@/features/courses";
import {
  PaneDivider,
  usePaneWidth,
} from "@/features/chat/components/pane-divider";
import { SourcePaneContext } from "@/features/chat/hooks/use-source-pane";
import { openSource } from "@/features/chat/server/actions";
import type { ChatSource, SourceRequest } from "@/features/chat/types";
import { MaterialFile } from "@/features/courses";
import { useIsWide } from "@/hooks/use-is-wide";

type Loaded =
  | { status: "loading" }
  | { status: "open"; source: ChatSource }
  | { status: "failed"; message: string };

/**
 * The Chat's layout with its source pane beside the Chat's messages, which
 * citations and cards inside open through `useSourcePane`.
 */
export function WithSourcePane({
  courseId,
  children,
}: {
  courseId: string;
  /** The Chat. */
  children: ReactNode;
}) {
  // What the pane shows; one source at a time.
  const [source, setSource] = useState<SourceRequest | null>(null);
  const pane = useMemo(() => ({ courseId, openSource: setSource }), [courseId]);
  return (
    <SourcePaneContext value={pane}>
      <div className="flex min-h-0 flex-1">
        {children}
        <SourcePane
          courseId={courseId}
          request={source}
          onClose={() => setSource(null)}
        />
      </div>
    </SourcePaneContext>
  );
}

/**
 * The Chat's source pane: a Material's own pages from the source's first
 * page, which a Reading section or a citation opens. From `lg` up it sits
 * beside the Chat; below, it opens in a Sheet. Null `request` closes it.
 */
function SourcePane({
  courseId,
  request,
  onClose,
}: {
  courseId: string;
  request: SourceRequest | null;
  onClose: () => void;
}) {
  const isWide = useIsWide();
  const width = usePaneWidth();
  if (request === null) return null;
  // Keyed, so opening another source loads it afresh.
  const view = (
    <SourceView
      key={sourceKey(request)}
      courseId={courseId}
      request={request}
      onClose={onClose}
    />
  );

  if (isWide) {
    return (
      <>
        <PaneDivider
          fraction={width.fraction}
          onChange={width.set}
          onReset={width.reset}
        />
        <aside
          aria-label="Source"
          style={
            width.fraction === null
              ? undefined
              : { width: `${width.fraction * 100}vw` }
          }
          className="flex h-full w-[28rem] shrink-0 flex-col border-l"
        >
          {view}
        </aside>
      </>
    );
  }
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-lg"
      >
        <SheetTitle className="sr-only">Source</SheetTitle>
        <section aria-label="Source" className="flex min-h-0 flex-1 flex-col">
          {view}
        </section>
      </SheetContent>
    </Sheet>
  );
}

function sourceKey(request: SourceRequest): string {
  return request.kind === "pages"
    ? `pages:${request.materialId}:${request.pageFrom}-${request.pageTo}`
    : `${request.kind}:${request.id}`;
}

function SourceView({
  courseId,
  request,
  onClose,
}: {
  courseId: string;
  request: SourceRequest;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  // Where the Student has read to and how far they zoomed, which the pane and
  // the full-screen view hand to each other. Undefined: the source's first page.
  const [page, setPage] = useState<number>();
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let current = true;
    void openSource({ courseId, ...request }).then(
      (result) => {
        if (!current) return;
        setLoaded(
          result.ok
            ? { status: "open", source: result.data }
            : { status: "failed", message: result.message },
        );
      },
      () =>
        current &&
        setLoaded({
          status: "failed",
          message: "The source could not be opened. Please try again.",
        }),
    );
    return () => {
      current = false;
    };
  }, [courseId, request]);

  const source = loaded.status === "open" ? loaded.source : null;
  // One viewer at a time, keyed by where it shows, so each starts at the
  // page and zoom the other left.
  const file = source && (
    <MaterialFile
      key={expanded ? "expanded" : "pane"}
      materialId={source.materialId}
      name={source.materialName}
      page={page ?? source.pageFrom}
      onPageChange={setPage}
      defaultZoom={zoom}
      onZoomChange={setZoom}
      marked={
        source.pageNotFound
          ? undefined
          : { from: source.pageFrom, to: source.pageTo }
      }
    />
  );
  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="min-w-0 flex-1">
          {source && (
            <>
              <h2 className="truncate text-sm font-semibold">
                {source.materialName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {source.pageNotFound
                  ? pageNotFoundMessage
                  : pagesLabel(source.pageFrom, source.pageTo)}
              </p>
            </>
          )}
        </div>
        {source && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand source"
            onClick={() => setExpanded(true)}
          >
            <Maximize2Icon />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close source"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 pb-2">
        {loaded.status === "loading" && (
          <Skeleton className="aspect-[1/1.414] w-full" />
        )}
        {loaded.status === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            {loaded.message}
          </p>
        )}
        {!expanded && file}
      </div>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-2 rounded-none sm:max-w-none">
          <DialogTitle className="truncate pr-8">
            {source?.materialName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            The source over the whole window.
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-auto">{file}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
