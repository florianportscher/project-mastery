import { ChunkMarkdown } from "@/features/dev-inspector/components/chunk-markdown";
import {
  Flag,
  KcRefs,
  Ref,
  Section,
  chunkName,
  unitName,
} from "@/features/dev-inspector/components/inspector-parts";
import { pageKey } from "@/features/dev-inspector/domain/flags";
import {
  anchor,
  chunkOnPage,
  type Lookup,
} from "@/features/dev-inspector/domain/lookup";
import type {
  Flags,
  Snapshot,
  SnapshotChunk,
} from "@/features/dev-inspector/types";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  content: "bg-sky-400",
  exercise: "bg-emerald-400",
  solution: "bg-teal-200",
  admin: "bg-violet-300",
  blank: "bg-neutral-100 dark:bg-neutral-800",
  overlay: "bg-neutral-300 dark:bg-neutral-600",
  titles: "bg-amber-200",
  unreadable: "bg-red-500",
  uncovered: "bg-orange-400",
  continued: "bg-sky-100 dark:bg-sky-900",
};

export function MaterialsSection({
  snapshot,
  flags,
}: {
  snapshot: Snapshot;
  flags: Flags;
}) {
  return (
    <Section id="materials" title="Materials">
      <p className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(COLORS).map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1">
            <span className={cn("inline-block size-3 rounded-sm", color)} />
            {name}
          </span>
        ))}
      </p>
      {snapshot.materials.map((material) => {
        const pages = snapshot.pages.filter(
          (p) => p.materialId === material.id,
        );
        const unread = pages.filter((p) =>
          flags.unreadPages.has(pageKey(material.id, p.pageNumber)),
        );
        return (
          <div
            key={material.id}
            id={anchor.material(material.id)}
            className="scroll-mt-4 space-y-1"
          >
            <h3 className="font-medium">
              {material.position + 1}. {material.name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {material.parseStatus} · {material.pagesTotal ?? "?"} pages ·{" "}
                {material.language ?? "no language"}
              </span>
            </h3>
            {material.parseFailure && <Flag>{material.parseFailure}</Flag>}
            {material.notes && (
              <p className="text-xs text-muted-foreground">
                Notes: {material.notes}
              </p>
            )}
            {unread.length > 0 && (
              <Flag>
                unread pages: {unread.map((p) => p.pageNumber).join(", ")}
              </Flag>
            )}
            <div className="flex flex-wrap gap-0.5">
              {pages.map((page) => {
                const kind =
                  page.skipped ?? page.labels[0] ?? ("continued" as const);
                const chunk = chunkOnPage(
                  snapshot,
                  material.id,
                  page.pageNumber,
                );
                const flagged = flags.unreadPages.has(
                  pageKey(material.id, page.pageNumber),
                );
                return (
                  <a
                    key={page.pageNumber}
                    id={anchor.page(material.id, page.pageNumber)}
                    href={chunk ? `#${anchor.chunk(chunk.id)}` : undefined}
                    title={`p. ${page.pageNumber}: ${page.skipped ?? (page.labels.join(", ") || "continues a unit")}`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-sm text-[9px] text-black/70",
                      COLORS[kind] ?? "bg-neutral-400",
                      flagged && "ring-2 ring-red-600",
                    )}
                  >
                    {page.pageNumber}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </Section>
  );
}

export function ChunksSection({
  snapshot,
  lookup,
  flags,
}: {
  snapshot: Snapshot;
  lookup: Lookup;
  flags: Flags;
}) {
  return (
    <Section id="chunks" title="Chunks">
      {snapshot.materials.map((material) => {
        const chunks = snapshot.chunks
          .filter((c) => c.materialId === material.id)
          .toSorted((a, b) => a.position - b.position);
        // Runs of chunks that follow the same heading.
        const runs: SnapshotChunk[][] = [];
        for (const chunk of chunks) {
          const run = runs.at(-1);
          if (run && run[0]!.heading === chunk.heading) run.push(chunk);
          else runs.push([chunk]);
        }
        return (
          <div key={material.id} className="space-y-1">
            <h3 className="font-medium">
              <Ref to={anchor.material(material.id)}>{material.name}</Ref>
            </h3>
            {runs.map((run) => (
              <div key={run[0]!.id} className="border-l pl-3">
                <div className="text-sm font-medium">
                  {run[0]!.heading ?? (
                    <span className="text-muted-foreground">no heading</span>
                  )}
                </div>
                <ul className="my-1 space-y-1">
                  {run.map((chunk) => chunkItem(chunk, lookup, flags))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </Section>
  );
}

/**
 * One chunk's line. A function, not a component: a server component per
 * chunk would carry the whole `lookup` in its dev-mode debug info.
 */
function chunkItem(chunk: SnapshotChunk, lookup: Lookup, flags: Flags) {
  return (
    <li
      key={chunk.id}
      id={anchor.chunk(chunk.id)}
      className="scroll-mt-4 text-xs target:bg-yellow-50 dark:target:bg-yellow-950"
    >
      <span className="font-mono">{chunkName(chunk.id, lookup)}</span>{" "}
      <span className="text-muted-foreground">
        {chunk.chars.toLocaleString("en")} ch.
      </span>{" "}
      {flags.chunksWithoutKcs.has(chunk.id) && <Flag>content, no KC</Flag>}{" "}
      <KcRefs ids={lookup.kcsOfChunk.get(chunk.id) ?? []} lookup={lookup} />{" "}
      {(lookup.unitsOfChunk.get(chunk.id) ?? []).map((unit) => (
        <Ref key={unit.key} to={anchor.unit(unit.key)}>
          [{unitName(unit)}]
        </Ref>
      ))}{" "}
      {lookup.exerciseOfChunk.has(chunk.id) && (
        <Ref to={anchor.exercise(lookup.exerciseOfChunk.get(chunk.id)!)}>
          [Exercise]
        </Ref>
      )}{" "}
      <ChunkMarkdown chunkId={chunk.id} />
    </li>
  );
}
