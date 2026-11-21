import { sleep } from "workflow";
import {
  buildFailedReason,
  nothingToMapReason,
} from "@/features/knowledge-map/domain/build-failure";
import { arrangeKnowledgeMap } from "@/features/knowledge-map/workflows/arrange-steps";
import {
  failBuild,
  prepareBuild,
  type BuildStep,
  type StepOutcome,
} from "@/features/knowledge-map/workflows/build-steps";
import { consolidateKcs } from "@/features/knowledge-map/workflows/consolidate-steps";
import { extractExercises } from "@/features/knowledge-map/workflows/exercise-steps";
import { extractChapters } from "@/features/knowledge-map/workflows/extract-steps";
import { groupExercises } from "@/features/knowledge-map/workflows/group-steps";
import { recheckAssumes } from "@/features/knowledge-map/workflows/prerequisite-steps";
import { proposeTopicTree } from "@/features/knowledge-map/workflows/topic-steps";

/**
 * Updates a Course's Knowledge map from its Chapters (#229, #315). The
 * workflow passes only the Course's id; each step reads and writes tables
 * and stores its results before it ends. It retires KCs whose sources are
 * gone and extracts the teaching units without a current extraction one
 * after another in Course order, each offered the KCs stored so far and
 * stored as KCs before the next. It then groups the exercise and solution
 * chunks into whole Exercises (one call, only when they changed), extracts
 * the Exercises in batches and stores them with their new KCs. When the build stored new KCs, what
 * KCs of earlier builds assume as text is asked once against them. It
 * groups the Chapters into a Topic tree (one call, only when the Outlines
 * or KCs changed) and puts the map in Course order. A unit whose call fails
 * (a timeout, or no valid answer) is left to the next step. An extraction
 * unit is then split into pieces until it is given up, and the check report
 * lists it. A call the Gateway's rate limit turns away is no failure: its
 * step stores what was answered, and the workflow sleeps the wait it named
 * before the next step calls the rest. A step that fails for good, or a
 * reached Daily limit, fails the build with a reason and loses only that
 * step's calls: the next Update map resumes where the build stopped.
 */
export async function buildKnowledgeMap(courseId: string): Promise<void> {
  "use workflow";
  try {
    const prepared = await prepareBuild(courseId);
    if (prepared === "stopped") return;
    if (prepared === "nothing") {
      await failBuild(courseId, nothingToMapReason);
      return;
    }
    // Names asked again pick up after the last one an earlier run handled.
    let after = "";
    const recheck: BuildStep = async () => {
      const outcome = await recheckAssumes(courseId, after);
      if (outcome.ok) after = outcome.after;
      return outcome;
    };
    // Exercises are matched to the KCs the teaching units gave, a unit
    // given up on included, and their new KCs are stored like those.
    const steps: BuildStep[] = [
      extractChapters,
      consolidateKcs,
      groupExercises,
      extractExercises,
      consolidateKcs,
      recheck,
    ];
    for (const step of steps) {
      // The units whose call failed in earlier runs of this step, a key
      // once per failure, and those the rate limit turned away.
      let failed: string[] = [];
      let deferred: string[] = [];
      for (;;) {
        const outcome: StepOutcome = await step(courseId, failed, deferred);
        if (!outcome.ok) {
          await failBuild(courseId, outcome.reason);
          return;
        }
        if (outcome.left === null) return;
        if (outcome.left === 0) break;
        failed = [...failed, ...(outcome.failed ?? [])];
        deferred = [...deferred, ...(outcome.deferred ?? [])];
        // The rate limit turned a call away: its units wait, nothing failed.
        if (outcome.waitMs !== undefined) await sleep(outcome.waitMs);
      }
    }
    const proposal = await proposeTopicTree(courseId);
    if (!proposal.ok) {
      await failBuild(courseId, proposal.reason);
      return;
    }
    if (proposal.tree === null) return;
    await arrangeKnowledgeMap(courseId, proposal.tree);
  } catch (error) {
    console.error("Building the knowledge map failed:", error);
    await failBuild(courseId, buildFailedReason);
  }
}
