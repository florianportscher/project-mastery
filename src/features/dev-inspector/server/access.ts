import "server-only";
import { notFound } from "next/navigation";
import { getUser, requireUser, type AuthUser } from "@/lib/auth/user";
import { isProductionDeployment } from "@/lib/deployment-env";
import { failed } from "@/lib/supabase/failed";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether the signed-in account is a developer: never in production, else
 * when it has a `developers` row, which it may read only for itself.
 */
export async function isDeveloper(): Promise<boolean> {
  if (isProductionDeployment()) return false;
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developers")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) failed("Reading the developer row", error);
  return data !== null;
}

/**
 * The signed-in developer, for every page and data call under `/dev`: signs
 * in first, and answers 404 in production and for any other account.
 */
export async function requireDeveloper(next: string): Promise<AuthUser> {
  const user = await requireUser(next);
  if (!(await isDeveloper())) notFound();
  return user;
}
