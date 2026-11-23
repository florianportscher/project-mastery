import "server-only";
import type {
  DevCall,
  DevCallDetail,
  DevCalls,
} from "@/features/dev-inspector/types";
import { failed } from "@/lib/supabase/failed";
import { createClient } from "@/lib/supabase/server";
import {
  getTracedCall,
  listTracedCalls,
  type TracedCall,
} from "@/lib/tracing/observations";

/**
 * The parse and build calls traced for a Course (trace metadata
 * `courseId`), oldest first. Calls made before they carried it are not
 * found. Callers check access with `requireDeveloper` first.
 */
export async function getCourseCalls(courseId: string): Promise<DevCalls> {
  try {
    const traced = await listTracedCalls("courseId", courseId);
    return traced === null
      ? { status: "untraced" }
      : {
          status: "ok",
          calls: traced.calls.map(toDevCall),
          truncated: traced.truncated,
        };
  } catch (error) {
    console.error("Reading the Course's calls from Langfuse failed:", error);
    return { status: "error", message: String(error) };
  }
}

/**
 * One call with its input and output, when it belongs to a Course the
 * signed-in developer can read; null for any other.
 */
export async function getCallDetail(
  callId: string,
): Promise<DevCallDetail | null> {
  const call = await getTracedCall(callId);
  const courseId = call?.metadata.courseId;
  if (!call || !courseId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();
  if (error) failed("Reading the call's Course", error);
  if (!data) return null;
  return { ...toDevCall(call), input: call.input, output: call.output };
}

function toDevCall(call: TracedCall): DevCall {
  const { metadata, ...rest } = call;
  return {
    ...rest,
    materialId: metadata.materialId ?? null,
    unitKey: metadata.unitKey ?? null,
    appCommit: metadata.appCommit ?? null,
  };
}
