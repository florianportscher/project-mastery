/**
 * Alike KCs by their vectors: which retired KC a new one revives, and which
 * pairs the check report lists as still alike.
 */

/** Cosine similarity from which the check report lists two KCs as alike. */
export const SAME_KC_SIMILARITY = 0.85;

/** Cosine similarity from which a new KC revives a retired one. */
export const REVIVE_SIMILARITY = 0.9;

export function cosineSimilarity(
  a: readonly number[],
  b: readonly number[],
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}
