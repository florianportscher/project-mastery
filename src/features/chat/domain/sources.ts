import { materialsPath } from "@/features/courses";
import type { SourceRequest } from "@/features/chat/types";

const MATERIAL_ID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PAGES_LINK = new RegExp(
  `^(${MATERIAL_ID})\\?pages=([1-9]\\d*)(?:-([1-9]\\d*))?$`,
  "i",
);
// Links of Chats from before page links: the chunk page's anchor.
const CHUNK_LINK = /^[^/?#]+#chunk-([0-9a-f-]{36})$/i;

/**
 * The source a link cites, when it links to one of the Course's Materials:
 * `materialChunksPath` + `?pages=10-11` is the Material at those pages, and
 * an old `#chunk-…` link is that chunk. Otherwise null.
 */
export function citedSource(
  href: string | undefined,
  courseId: string,
): SourceRequest | null {
  const prefix = `${materialsPath(courseId)}/`;
  if (!href?.startsWith(prefix)) return null;
  const rest = href.slice(prefix.length);

  const pages = PAGES_LINK.exec(rest);
  if (pages) {
    const pageFrom = Number(pages[2]);
    const pageTo = pages[3] === undefined ? pageFrom : Number(pages[3]);
    if (pageTo < pageFrom) return null;
    return { kind: "pages", materialId: pages[1]!, pageFrom, pageTo };
  }
  const chunkId = CHUNK_LINK.exec(rest)?.[1];
  return chunkId ? { kind: "chunk", id: chunkId } : null;
}

/** The note when a cited page is not in the Material. */
export const pageNotFoundMessage = "The cited page wasn't found.";

/** Such as "p. 3" or "pp. 3–5". */
export function pagesLabel(pageFrom: number, pageTo: number): string {
  return pageFrom === pageTo ? `p. ${pageFrom}` : `pp. ${pageFrom}–${pageTo}`;
}
