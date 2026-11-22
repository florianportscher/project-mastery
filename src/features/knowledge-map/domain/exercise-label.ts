/**
 * An Exercise's label, built when read from its question chunk (#228):
 * "<heading> · <Material> p. N", or "<Material> p. N" when the chunk
 * follows no heading.
 */
export function exerciseLabel(question: {
  heading: string | null;
  materialName: string;
  pageFrom: number;
}): string {
  const place = `${question.materialName} p. ${question.pageFrom}`;
  const heading = question.heading?.trim();
  return heading ? `${heading} · ${place}` : place;
}
