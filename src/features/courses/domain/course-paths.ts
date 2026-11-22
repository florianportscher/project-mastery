export const COURSE_LIST_PATH = "/courses";

/**
 * Where opening a Course leads: its home, the Course map. The knowledge-map
 * feature, which this one may not import, owns the same path.
 */
export function coursePath(courseId: string): string {
  return `${COURSE_LIST_PATH}/${courseId}/map`;
}

export function materialsPath(courseId: string): string {
  return `${COURSE_LIST_PATH}/${courseId}/materials`;
}

/**
 * The chunk view of a parsed Material. With `pages`, the link also names the
 * pages it cites (`?pages=10-11`, or `?pages=10`), which a Chat's source pane
 * opens.
 */
export function materialChunksPath(
  courseId: string,
  materialId: string,
  pages?: { from: number; to: number },
): string {
  const path = `${materialsPath(courseId)}/${materialId}`;
  if (!pages) return path;
  const range =
    pages.from === pages.to ? `${pages.from}` : `${pages.from}-${pages.to}`;
  return `${path}?pages=${range}`;
}

/** Such as "p. 3" or "pp. 3–5". */
export function pagesLabel(pageFrom: number, pageTo: number): string {
  return pageFrom === pageTo ? `p. ${pageFrom}` : `pp. ${pageFrom}–${pageTo}`;
}
