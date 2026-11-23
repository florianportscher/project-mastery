import {
  BUILD_STAGES,
  type BuildProgress,
  type BuildStage,
} from "@/features/knowledge-map/schemas";

const stageLabels: Record<BuildStage, string> = {
  materials: "Reading your Materials",
  exercises: "Working through your Exercises",
  connecting: "Connecting what builds on what",
  topics: "Grouping into Topics",
  finishing: "Finishing",
};

const countUnits: Partial<Record<BuildStage, string>> = {
  materials: "sections",
  exercises: "batches",
};

export type StageView = {
  stage: BuildStage;
  label: string;
  state: "done" | "running" | "todo";
  /** The running stage's count, such as "4 of 12 sections"; else null. */
  count: string | null;
  /** How much of its segment of the bar is filled, from 0 to 1. */
  fill: number;
};

/**
 * The build's stages as the Student sees them: those before the running
 * one done, its segment full; the running one filled by its count, or
 * empty without one. A build without progress yet reads its Materials.
 */
export function buildStages(progress: BuildProgress | null): StageView[] {
  const current = progress ?? { stage: "materials" };
  const running = BUILD_STAGES.indexOf(current.stage);
  return BUILD_STAGES.map((stage, index) => {
    const state =
      index < running ? "done" : index === running ? "running" : "todo";
    const counted =
      state === "running" && current.total !== undefined && current.total > 0
        ? {
            done: Math.min(current.done ?? 0, current.total),
            total: current.total,
          }
        : null;
    return {
      stage,
      label: stageLabels[stage],
      state,
      count: counted
        ? `${counted.done} of ${counted.total} ${countUnits[stage] ?? "steps"}`
        : null,
      fill: state === "done" ? 1 : counted ? counted.done / counted.total : 0,
    };
  });
}

/** The seconds left of the rate limit's pause at `now`; null when none. */
export function waitSecondsLeft(
  progress: BuildProgress | null,
  now: number,
): number | null {
  if (!progress?.waitUntil) return null;
  const left = Math.ceil((Date.parse(progress.waitUntil) - now) / 1000);
  return left > 0 ? left : null;
}

/** How long ago `iso` was at `now`: "just now", "2 min ago", "1 h 5 min ago". */
export function elapsedText(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h ago` : `${hours} h ${rest} min ago`;
}
