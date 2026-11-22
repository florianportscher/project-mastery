/**
 * A KC's recall band (#250), what the Student sees of a KC instead of its
 * card: from its recall at the end of the current UTC day, so a KC just
 * answered wrong is not `strong`. Pure.
 */
import type { KcRecall } from "@/features/study/domain/replay";

export type RecallBand = "new" | "strong" | "fading" | "weak";

const FADING_RECALL = 0.7;

export type KcBand = {
  band: RecallBand;
  /** 0 to 1; null untaught. */
  recallToday: number | null;
  /** As YYYY-MM-DD; null untaught. */
  nextReview: string | null;
};

/**
 * `new` untaught, `strong` at or above the goal's `retention`, `fading` at
 * 0.7 or more, else `weak`.
 */
export function recallBand(
  recall: KcRecall | undefined,
  retention: number,
): RecallBand {
  if (!recall?.taught) return "new";
  if (recall.recallToday >= retention) return "strong";
  return recall.recallToday >= FADING_RECALL ? "fading" : "weak";
}

export function kcBand(
  recall: KcRecall | undefined,
  retention: number,
): KcBand {
  return {
    band: recallBand(recall, retention),
    recallToday: recall?.taught ? recall.recallToday : null,
    nextReview: recall?.nextReview ?? null,
  };
}
