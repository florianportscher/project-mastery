// Public API of the dev-inspector feature for server code only: who may see
// the developer view, and what it reads.
import "server-only";

export { isDeveloper, requireDeveloper } from "./server/access";
export { getCourseInspection, type CourseInspection } from "./server/snapshot";
export { getCourseCalls } from "./server/calls";
