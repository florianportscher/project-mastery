import "server-only";
import { transcribe } from "ai";
import { after } from "next/server";
import {
  checkDailyLimit,
  dailyLimitReachedMessage,
  recordAiUsage,
} from "@/features/usage/server";
import { audioCostUsd } from "@/lib/ai/cost";
import { aiTask } from "@/lib/ai/models";
import { getUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import type { Supabase } from "@/lib/supabase/types";
import { flushTraces } from "@/lib/tracing";

/**
 * The largest recording taken: 2 minutes of Opus are about 2 MB, and
 * Vercel refuses bodies over 4.5 MB.
 */
const MAX_DICTATION_BYTES = 4 * 1024 * 1024;

/** The longest recording, priced when the model reports no duration. */
const MAX_DICTATION_SECONDS = 120;

/** What the Student sees when the model fails. */
const transcriptionFailedMessage = "Couldn't transcribe that. Try again.";

const NO_TOKENS = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };

/**
 * Turns a Student's Dictation into text: the request's body is the raw
 * recording, with its `Content-Type`. Answers `{ text }`; refusals are
 * plain text. Stages:
 *
 * 1. require the signed-in Student (401)
 * 2. refuse an empty (400) or too large (413) recording
 * 3. refuse at the Daily limit, before any model call (429)
 * 4. transcribe and record the call's cost from the audio's length; a model
 *    error answers 502 and records nothing
 */
export async function handleDictationRequest(
  request: Request,
): Promise<Response> {
  const user = await getUser();
  if (!user) return refuse(401, "Sign in to dictate a message.");
  const response = await transcribeDictation({
    request,
    supabase: await createClient(),
  });
  after(flushTraces);
  return response;
}

/**
 * `handleDictationRequest` from stage 2 on, as the Student whose session
 * client `supabase` is. Smoke checks call it with a client they signed in.
 */
export async function transcribeDictation({
  request,
  supabase,
}: {
  request: Request;
  supabase: Supabase;
}): Promise<Response> {
  if (Number(request.headers.get("content-length")) > MAX_DICTATION_BYTES) {
    return tooLarge();
  }
  const audio = new Uint8Array(await request.arrayBuffer());
  if (audio.byteLength === 0) return refuse(400, "No audio was recorded.");
  if (audio.byteLength > MAX_DICTATION_BYTES) return tooLarge();

  const dailyLimit = await checkDailyLimit(supabase);
  if (dailyLimit.level === "reached") {
    return refuse(429, dailyLimitReachedMessage);
  }

  const settings = aiTask("transcribe");
  let result;
  try {
    result = await transcribe({ ...settings, audio });
  } catch (error) {
    console.error("Dictation transcription failed", error);
    return refuse(502, transcriptionFailedMessage);
  }

  const seconds = result.durationInSeconds;
  await recordAiUsage(supabase, {
    task: "transcribe",
    modelId: settings.model,
    usage: NO_TOKENS,
    costUsd: audioCostUsd(settings.model, seconds ?? MAX_DICTATION_SECONDS),
    estimated: seconds === undefined,
  });
  return Response.json({ text: result.text.trim() });
}

function tooLarge() {
  return refuse(413, "That recording is too long. Keep it under 2 minutes.");
}

function refuse(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
