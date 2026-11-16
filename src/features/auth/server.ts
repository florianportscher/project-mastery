// Public API of the auth feature for server code only.
import "server-only";

export { confirmEmailLink } from "./server/confirm-email-link";
export { getDisplayName } from "./server/display-name";
export { signInDemo } from "./server/demo-sign-in";
export { isDemoUser } from "./server/demo-user";
