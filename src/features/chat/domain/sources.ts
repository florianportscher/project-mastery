import { materialsPath } from "@/features/courses";
import type { SourceRequest } from "@/features/chat/types";

const MATERIAL_ID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PAGES_LINK = new RegExp(
  `^(${MATERIAL_ID})\\?pages=([1-9]\\d*)(?:-([1-9]\\d*))?$`,
  "i",
);

/**
 * The source a link cites, when it links to one of the Course's Materials:
 * `materialChunksPath` + `?pages=10-11` is the Material at those pages.
 * Otherwise null.
 */
export function citedSource(
  href: string | undefined,
  courseId: string,
): SourceRequest | null {
  const prefix = `${materialsPath(courseId)}/`;
  if (!href?.startsWith(prefix)) return null;
  const rest = href.slice(prefix.length);

  const pages = PAGES_LINK.exec(rest);
  if (!pages) return null;
  const pageFrom = Number(pages[2]);
  const pageTo = pages[3] === undefined ? pageFrom : Number(pages[3]);
  if (pageTo < pageFrom) return null;
  return { kind: "pages", materialId: pages[1]!, pageFrom, pageTo };
}

export const pageNotFoundMessage = "The cited page wasn't found.";
