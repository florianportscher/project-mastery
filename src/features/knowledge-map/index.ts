// Public API of the knowledge-map feature for any code, client or server.
// Server-only exports live in `server.ts`. It reads chunks and Materials
// through the ingestion and courses features, which never import it.
export { CourseMap } from "./components/course-map";
export { CourseMapLink } from "./components/course-map-link";
export { TopicDetail } from "./components/topic-detail";
export { TopicTitle } from "./components/topic-title";
export { courseMapPath, topicPath } from "./domain/map-paths";
export type { AnswerCheck } from "./domain/answer-keys";
export type { MapKcLearning, MapPriorities } from "./types";
