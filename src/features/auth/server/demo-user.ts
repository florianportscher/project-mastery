import "server-only";
import { getDemoCredentials } from "@/features/auth/server/demo-env";
import { getUser } from "@/lib/auth/user";

/** Whether the visitor is signed into the shared demo account. */
export async function isDemoUser(): Promise<boolean> {
  const demo = getDemoCredentials();
  if (!demo) return false;
  const user = await getUser();
  return user?.email?.toLowerCase() === demo.email.toLowerCase();
}
