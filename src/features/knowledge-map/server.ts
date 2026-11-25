// Public API of the knowledge-map feature for server code only: reading a
// Course's map and its build workflow.
import "server-only";

// Also in `index.ts`: `index.ts` loads React components, which fail outside
// Next.js, so server code that smoke checks load imports it from here.
export { exerciseLabel } from "./domain/exercise-label";
export { courseMapPath } from "./domain/map-paths";
export { buildTopicGraph } from "./domain/topic-graph";
export { topicAnchors } from "./domain/topic-reading";
export {
  worstCheck,
  type AnswerCheck,
  type AnswerKey,
} from "./domain/answer-keys";
// The answer check under a time limit: the only one server code may use.
export {
  checkAnswer,
  checkAnswers,
  checkEachAnswer,
} from "./server/answer-check";
export { answerKeySchema, MAX_ANSWER_LENGTH } from "./schemas";
export {
  findReadingSection,
  loadCourseTopics,
  loadReadingSections,
} from "./server/course-topics";
export { getKnowledgeMap } from "./server/queries";
export { getTopicNames } from "./server/topic-names";
export {
  loadExamChunkIds,
  loadKcAssumes,
  loadStoredMap,
} from "./server/stored-map";
export { loadStoredTopics, loadTopicTree } from "./server/stored-topics";
export { topicLineage } from "./domain/topic-tree";
export { buildKnowledgeMap } from "./workflows/build-knowledge-map";
// The map smoke check reads the units a KC may cite from.
export { loadCourseUnits, unitKey } from "./workflows/course-units";
// The grouping smoke check runs the grouping step alone.
export { groupExercises } from "./workflows/group-steps";
// The developer view forms the units from its snapshot.
export {
  batchTitle,
  teachingBatches,
  UNIT_CHARS,
} from "./domain/teaching-batches";
export { extractionDigest } from "./workflows/course-units";
export { exerciseBatches } from "./domain/exercise-groups";
export { MIN_UNIT_COVERAGE } from "./domain/unit-coverage";
// `pnpm replay` rebuilds archived build calls with the current prompts.
export { MAP_CALL_REPLAYS } from "./ai/replay";
