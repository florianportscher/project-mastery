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
  SnapshotChapter,
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

/** Each Material with its pages as a grid, coloured by units or skip reason. */
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

/** Each Material's Chapter tree with its chunks. */
export function OutlineSection({
  snapshot,
  lookup,
  flags,
}: {
  snapshot: Snapshot;
  lookup: Lookup;
  flags: Flags;
}) {
  return (
    <Section id="outline" title="Outline">
      {snapshot.materials.map((material) => {
        const roots = snapshot.chapters.filter(
          (c) => c.materialId === material.id && c.parentId === null,
        );
        return (
          <div key={material.id} className="space-y-1">
            <h3 className="font-medium">
              <Ref to={anchor.material(material.id)}>{material.name}</Ref>
            </h3>
            {roots.map((root) => (
              <ChapterNode
                key={root.id}
                chapter={root}
                lookup={lookup}
                flags={flags}
              />
            ))}
          </div>
        );
      })}
    </Section>
  );
}

function ChapterNode({
  chapter,
  lookup,
  flags,
}: {
  chapter: SnapshotChapter;
  lookup: Lookup;
  flags: Flags;
}) {
  const chunks = lookup.chunksOfChapter.get(chapter.id) ?? [];
  const children = (lookup.children.get(chapter.id) ?? []).toSorted(
    (a, b) => a.position - b.position,
  );
  const units = lookup.unitsOfChapter.get(chapter.id) ?? [];
  const topics = lookup.topicsOfChapter.get(chapter.id) ?? [];
  const report = flags.chaptersInReport.get(chapter.id) ?? [];
  return (
    <div
      id={anchor.chapter(chapter.id)}
      className="scroll-mt-4 border-l pl-3 target:bg-yellow-50 dark:target:bg-yellow-950"
    >
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="font-medium">{chapter.title}</span>
        <span className="text-xs text-muted-foreground">
          p. {chapter.pageFrom}
        </span>
        {flags.chaptersWithoutKcs.has(chapter.id) && (
          <Flag>content, no KC</Flag>
        )}
        {report.map((note) => (
          <Flag key={note}>check report: {note}</Flag>
        ))}
        {units.map((unit) => (
          <Ref key={unit.key} to={anchor.unit(unit.key)} className="text-xs">
            unit {unit.kind} {unit.unit}
          </Ref>
        ))}
        {topics.map((id) => (
          <Ref key={id} to={anchor.topic(id)} className="text-xs">
            Topic: {lookup.topic.get(id)?.name}
          </Ref>
        ))}
      </div>
      {chunks.length > 0 && (
        <ul className="my-1 space-y-1">
          {chunks.map((chunk) => (
            <li
              key={chunk.id}
              id={anchor.chunk(chunk.id)}
              className="scroll-mt-4 text-xs target:bg-yellow-50 dark:target:bg-yellow-950"
            >
              <span className="font-mono">{chunkName(chunk.id, lookup)}</span>{" "}
              <span className="text-muted-foreground">
                {chunk.chars.toLocaleString("en")} ch.
              </span>{" "}
              <KcRefs
                ids={lookup.kcsOfChunk.get(chunk.id) ?? []}
                lookup={lookup}
              />{" "}
              {(lookup.unitsOfChunk.get(chunk.id) ?? []).map((unit) => (
                <Ref key={unit.key} to={anchor.unit(unit.key)}>
                  [{unitName(unit, lookup)}]
                </Ref>
              ))}{" "}
              {lookup.exerciseOfChunk.has(chunk.id) && (
                <Ref
                  to={anchor.exercise(lookup.exerciseOfChunk.get(chunk.id)!)}
                >
                  [Exercise]
                </Ref>
              )}{" "}
              <ChunkMarkdown chunkId={chunk.id} />
            </li>
          ))}
        </ul>
      )}
      {children.map((child) => (
        <ChapterNode
          key={child.id}
          chapter={child}
          lookup={lookup}
          flags={flags}
        />
      ))}
    </div>
  );
}
