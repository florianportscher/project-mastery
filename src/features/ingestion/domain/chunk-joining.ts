import type { BatchUnit } from "@/features/ingestion/domain/page-batches";
import type { ChunkLabel } from "@/features/ingestion/types";

export type DraftChunk = {
  pageFrom: number;
  pageTo: number;
  label: ChunkLabel;
  markdown: string;
  /** The heading it follows; null before the Material's first. */
  heading: string | null;
};

/** The longest a chunk gets, in characters, unless one paragraph is longer. */
export const MAX_CHUNK_CHARS = 6000;

type Paragraph = { text: string; pageFrom: number; pageTo: number };

type OpenChunk = {
  label: ChunkLabel;
  heading: string | null;
  paragraphs: Paragraph[];
};

/** Heading marks a heading's text may still carry: `#`s or bold. */
const HEADING_MARKS = /^\s*#+\s*|^\s*\*\*|\*\*\s*$/g;

const headingText = (markdown: string) =>
  markdown.replaceAll(HEADING_MARKS, "").replaceAll(/\s+/g, " ").trim();

function paragraphs(unit: BatchUnit, markdown = unit.markdown): Paragraph[] {
  return markdown
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ text, pageFrom: unit.pageFrom, pageTo: unit.pageTo }));
}

/**
 * The chunks of a Material's units, in reading order. Each unit is a
 * chunk, except that a unit joins the one before it across a batch edge
 * when that one continues on the next batch, it continues from the previous
 * one, no heading stands between them and their labels match. Each heading
 * unit starts the next chunk: it becomes a bold line at its start and its
 * `heading`, the last one when several stand together; a chunk without a
 * heading of its own keeps the one before it. Headings with no unit after
 * them make a content chunk. A chunk over MAX_CHUNK_CHARS splits between
 * paragraphs.
 */
export function chunksFromUnits(units: readonly BatchUnit[]): DraftChunk[] {
  const chunks: OpenChunk[] = [];
  let heading: string | null = null;
  let headings: Paragraph[] = [];
  let previous: BatchUnit | null = null;
  const flushHeadings = () => {
    if (headings.length > 0) {
      chunks.push({ label: "content", heading, paragraphs: headings });
    }
    headings = [];
  };

  for (const unit of units) {
    if (unit.label === "heading") {
      const text = headingText(unit.markdown);
      if (text) {
        headings.push(...paragraphs(unit, `**${text}**`));
        heading = text;
      }
      previous = null;
      continue;
    }
    const open = chunks.at(-1);
    if (
      open &&
      previous?.continuesOnNextBatch &&
      unit.continuesFromPreviousBatch &&
      previous.label === unit.label
    ) {
      open.paragraphs.push(...paragraphs(unit));
    } else {
      chunks.push({
        label: unit.label,
        heading,
        paragraphs: [...headings, ...paragraphs(unit)],
      });
    }
    headings = [];
    previous = unit;
  }
  flushHeadings();

  return chunks
    .filter((chunk) => chunk.paragraphs.length > 0)
    .flatMap((chunk) =>
      splitParagraphs(chunk.paragraphs).map((part) => ({
        pageFrom: Math.min(...part.map((paragraph) => paragraph.pageFrom)),
        pageTo: Math.max(...part.map((paragraph) => paragraph.pageTo)),
        label: chunk.label,
        markdown: part.map((paragraph) => paragraph.text).join("\n\n"),
        heading: chunk.heading,
      })),
    );
}

/** Paragraphs in runs of at most MAX_CHUNK_CHARS, each run at least one. */
function splitParagraphs(all: Paragraph[]): Paragraph[][] {
  const runs: Paragraph[][] = [];
  let run: Paragraph[] = [];
  let length = 0;
  for (const paragraph of all) {
    const added = (run.length > 0 ? 2 : 0) + paragraph.text.length;
    if (run.length > 0 && length + added > MAX_CHUNK_CHARS) {
      runs.push(run);
      run = [];
      length = 0;
    }
    length += (run.length > 0 ? 2 : 0) + paragraph.text.length;
    run.push(paragraph);
  }
  if (run.length > 0) runs.push(run);
  return runs;
}
