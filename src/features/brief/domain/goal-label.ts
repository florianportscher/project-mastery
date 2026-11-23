import type { BriefFields } from "@/features/brief/domain/intake";

const GOALS = {
  pass: "Pass",
  good_grade: "A good grade",
  master_everything: "Master everything",
} as const;

/** The Student's goal from the Brief in words. */
export function goalLabel(goal: BriefFields["goal"]): string {
  return goal === null ? "Not answered" : GOALS[goal];
}
