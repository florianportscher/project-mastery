import "server-only";
import { failed } from "@/lib/supabase/failed";
import { createClient } from "@/lib/supabase/server";

/** The map build a flag is for: what a later rebuild changes. */
export type FlagBuild = { appCommit: string | null; finishedAt: string | null };

/**
 * Whether the developer flagged this Chat. Callers check access with
 * `isDeveloper` first.
 */
export async function isChatFlagged(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_flags")
    .select("id")
    .eq("chat_id", chatId)
    .limit(1);
  if (error) failed("Reading the Chat's flags", error);
  return data.length > 0;
}

/** Whether the developer flagged this very build of the Course's map. */
export async function isBuildFlagged(
  courseId: string,
  build: FlagBuild,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("developer_flags")
    .select("id")
    .eq("course_id", courseId)
    .is("chat_id", null);
  query =
    build.appCommit === null
      ? query.is("app_commit", null)
      : query.eq("app_commit", build.appCommit);
  query =
    build.finishedAt === null
      ? query.is("finished_at", null)
      : query.eq("finished_at", build.finishedAt);
  const { data, error } = await query.limit(1);
  if (error) failed("Reading the build's flags", error);
  return data.length > 0;
}

/**
 * Stores a flag for a Chat, or without `chatId` for the Course's current map
 * build. False when the Chat or Course is not the developer's own, or the
 * Course has no build.
 */
export async function addFlag(input: {
  owner: string;
  courseId: string;
  chatId?: string;
  note: string;
}): Promise<boolean> {
  const supabase = await createClient();
  const { owner, courseId, chatId, note } = input;
  if (chatId) {
    const { data, error } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (error) failed("Reading the Chat", error);
    if (!data) return false;
    const insert = await supabase
      .from("developer_flags")
      .insert({ owner, course_id: courseId, chat_id: chatId, note });
    if (insert.error) failed("Storing the flag", insert.error);
    return true;
  }
  const { data, error } = await supabase
    .from("knowledge_map_builds")
    .select("app_commit, finished_at")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) failed("Reading the build", error);
  if (!data) return false;
  const insert = await supabase.from("developer_flags").insert({
    owner,
    course_id: courseId,
    note,
    app_commit: data.app_commit,
    finished_at: data.finished_at,
  });
  if (insert.error) failed("Storing the flag", insert.error);
  return true;
}
