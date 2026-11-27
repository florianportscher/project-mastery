import { parseFailureReason } from "@/features/ingestion/domain/parse-failure";
import { chunkMaterial } from "@/features/ingestion/workflows/chunk-material";
import { embedChunks } from "@/features/ingestion/workflows/embed-chunks";
import {
  failParse,
  markParsed,
  PAGES_PER_STEP,
  preparePages,
  readPages,
} from "@/features/ingestion/workflows/parse-steps";

/**
 * Parses one Material into chunks (ADR 0007, 0009): prepares its pages and
 * skips slide overlays, reads the pages without a stored result in steps
 * of up to PAGES_PER_STEP, one vision call per batch of pages, then cuts
 * the units into chunks, each following its heading, takes the Material's
 * language and notes from the page reads, embeds the chunks and marks the
 * Material parsed. A page that cannot be read is stored unreadable and the
 * parse goes on, unless a step ends with no page read: then it fails. A
 * retried parse resumes at the first page without a result and reads the
 * unreadable pages again. Steps retry on their own; a step that fails for good, or a
 * reached Daily limit, marks the parse failed with a reason: the file's
 * when a step named it, a general one for any other failure. A deleted
 * Material stops it quietly.
 *
 * For the smoke checks: `options.pages` reads only those pages.
 */
export async function parseMaterial(
  materialId: string,
  options: { pages?: number[] } = {},
): Promise<void> {
  "use workflow";
  try {
    let pages = await preparePages(materialId, options.pages);
    while (pages && pages.length > 0) {
      const outcome = await readPages(
        materialId,
        pages.slice(0, PAGES_PER_STEP),
      );
      if (!outcome.ok) {
        await failParse(materialId, outcome.reason);
        return;
      }
      pages = outcome.left && [...outcome.left, ...pages.slice(PAGES_PER_STEP)];
    }
    if (!pages) return;
    await chunkMaterial(materialId);
    const embedded = await embedChunks(materialId);
    if (!embedded.ok) {
      await failParse(materialId, embedded.reason);
      return;
    }
    await markParsed(materialId);
  } catch (error) {
    console.error("Parsing the Material failed:", error);
    await failParse(materialId, parseFailureReason(error));
  }
}
