// Public API of the ingestion feature for server code only: starting a
// Material's parse and reading its chunks.
import "server-only";

export type { OutlineAnswer } from "./ai/outline";
export { chunkAnchor } from "./domain/chunk-anchor";
export { withLease } from "./domain/parse-state";
export { getMaterialChunks } from "./server/chunk-queries";
export {
  loadAdminChunks,
  loadChunkMaterials,
  loadCourseChunkSpans,
  loadChunkSources,
} from "./server/course-chunks";
export { loadCourseLanguage } from "./server/course-language";
export { startParse } from "./server/start-parse";
export { parseMaterial } from "./workflows/parse-material";
