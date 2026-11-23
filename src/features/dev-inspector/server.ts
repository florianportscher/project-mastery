// Public API of the dev-inspector feature for server code only: who may see
// the developer view, and what it reads.
import "server-only";

export { isDeveloper, requireDeveloper } from "./server/access";
export { getCourseInspection } from "./server/snapshot";
export { isBuildFlagged, isChatFlagged } from "./server/flags";
export { getCourseCalls } from "./server/calls";
