/**
 * What code decides about a Material's pages: which it skips without a page
 * call (slide overlays from the PDF's text layer, blank renders from their
 * pixels), and which a retried parse still reads.
 */

/**
 * The page numbers, 1-based and in order, of a Material with `pageCount`
 * pages that have no stored page result yet: the pages a retried parse still
 * renders and reads.
 */
export function missingPages(
  pageCount: number,
  storedPageNumbers: readonly number[],
): number[] {
  const stored = new Set(storedPageNumbers);
  const missing: number[] = [];
  for (let page = 1; page <= pageCount; page++) {
    if (!stored.has(page)) missing.push(page);
  }
  return missing;
}

/**
 * Whether a parse read no page: some page is stored `unreadable` and none has
 * an answer (units, `titles` or `uncovered`). `overlay` and `blank` pages had
 * no call and count neither way.
 */
export function noPageRead(skips: readonly (string | null)[]): boolean {
  const answered = skips.some(
    (skip) => skip === null || skip === "titles" || skip === "uncovered",
  );
  return skips.includes("unreadable") && !answered;
}

/** A page's text without any whitespace, so line breaks never matter. */
function collapse(text: string): string {
  return text.replaceAll(/\s+/g, "");
}

/**
 * The 1-based numbers of the pages that are slide overlays: a page whose
 * collapsed text is non-empty and is the start of the next page's text, so
 * the next page shows everything it does and more.
 */
export function overlayPages(texts: readonly string[]): number[] {
  const collapsed = texts.map(collapse);
  return collapsed.flatMap((text, index) => {
    const next = collapsed[index + 1];
    return text !== "" && next !== undefined && next.startsWith(text)
      ? [index + 1]
      : [];
  });
}

/** A channel value below this is ink, not paper. */
const INK_BELOW = 200;

/**
 * The share of ink pixels under which a render counts as blank: 0.05% of a
 * 2,000 × 1,414 render is about 1,400 pixels, enough for a page number or a
 * scanner speck but not for a line of text.
 */
const BLANK_INK_SHARE = 0.0005;

/**
 * Whether a render is almost all white, from its RGBA pixels: a page call
 * would find nothing to transcribe on it.
 */
export function isBlankRender(rgba: Uint8ClampedArray): boolean {
  const pixels = rgba.length / 4;
  const limit = pixels * BLANK_INK_SHARE;
  let ink = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (
      Math.min(rgba[i] ?? 255, rgba[i + 1] ?? 255, rgba[i + 2] ?? 255) <
      INK_BELOW
    ) {
      ink += 1;
      if (ink > limit) return false;
    }
  }
  return true;
}
