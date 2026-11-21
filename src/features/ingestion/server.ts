// Public API of the ingestion feature for server code only: starting a
// Material's parse or a Course's pairing, and reading its chunks.
import "server-only";

export type { OutlineAnswer } from "./ai/outline";
export { chunkAnchor } from "./domain/chunk-anchor";
export { examChapterIds } from "./domain/old-exam-chapters";
export { withLease } from "./domain/parse-state";
export { getMaterialChunks } from "./server/chunk-queries";
export {
  findChunkSpan,
  loadAdminChunks,
  loadChunkMaterials,
  loadCourseChunkSpans,
  loadChunkSources,
  loadChapterChunkIds,
} from "./server/course-chunks";
export { loadCourseLanguage } from "./server/course-language";
export { startPairing } from "./server/start-pairing";
export { startParse } from "./server/start-parse";
export { pairCourse } from "./workflows/pair-exercises";
export { parseMaterial } from "./workflows/parse-material";
