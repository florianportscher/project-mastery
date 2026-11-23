import { createHash } from "node:crypto";

/**
 * The batches the build extracts from: a Material's `content` chunks in
 * reading order, packed up to UNIT_CHARS characters each.
 */

/**
 * The most characters of chunks in one batch. A call's time follows the
 * KCs it writes, and a slow model (MiMo) took over 170 s on 25,000
 * characters, so a batch asks for about 15 KCs at most.
 */
export const UNIT_CHARS = 12_000;

type BatchChunk = { id: string; heading: string | null; chars: number };

/**
 * One Material's chunks packed in reading order into batches of at most
 * `cap` characters, each the ids of its chunks. A batch that is at least
 * half full ends before a chunk that starts under a new heading, so a
 * subject is not cut where a heading would do. A chunk over the cap is a
 * batch of its own.
 */
export function teachingBatches(
  chunks: readonly BatchChunk[],
  cap = UNIT_CHARS,
): string[][] {
  const batches: string[][] = [];
  let open: string[] = [];
  let chars = 0;
  let heading: string | null = null;
  for (const chunk of chunks) {
    const newHeading = chunk.heading !== null && chunk.heading !== heading;
    heading = chunk.heading;
    if (
      open.length > 0 &&
      (chars + chunk.chars > cap || (newHeading && chars >= cap / 2))
    ) {
      batches.push(open);
      open = [];
      chars = 0;
    }
    open.push(chunk.id);
    chars += chunk.chars;
  }
  if (open.length > 0) batches.push(open);
  return batches;
}

/** Where a batch is: "Material p. 3" or "Material p. 3–7". */
export function batchTitle(
  materialName: string,
  pages: ReadonlyArray<{ pageFrom: number; pageTo: number }>,
): string {
  const from = Math.min(...pages.map((page) => page.pageFrom));
  const to = Math.max(...pages.map((page) => page.pageTo));
  return `${materialName} p. ${from === to ? from : `${from}–${to}`}`;
}

/**
 * A batch's content hash: of its chunks' Markdown, so an unchanged batch is
 * not extracted again.
 */
export function unitHash(markdowns: readonly string[]): string {
  return createHash("sha256").update(markdowns.join("\u0000")).digest("hex");
}
