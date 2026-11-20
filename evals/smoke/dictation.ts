import { readFile } from "node:fs/promises";
import { transcribeDictation } from "@/features/dictation/server";
import { AI_TASKS } from "@/lib/ai/models";
import { signInAsUser } from "@/lib/supabase/admin";
import { result, type SmokeCheck } from "./smoke-check";

/**
 * 11 s of public-domain speech (whisper.cpp's `samples/jfk.wav`), recorded
 * by Chromium's MediaRecorder as `audio/webm;codecs=opus`, as a Student's
 * Dictation arrives.
 */
const RECORDING = "e2e/files/dictation.webm";

/**
 * Sends the recording through the Dictation handler as a Student and checks
 * the text and its one priced `ai_usage` row.
 */
export const dictationSmoke: SmokeCheck = {
  name: "dictation",
  usage: "pnpm smoke dictation (one 11 s recording through the handler)",
  maxCalls: 1,
  model: AI_TASKS.transcribe.model,
  async run({ supabase, studentId }) {
    const client = await signInAsUser(supabase, studentId);
    const response = await transcribeDictation({
      request: new Request("http://localhost/api/dictation", {
        method: "POST",
        headers: { "content-type": "audio/webm;codecs=opus" },
        body: await readFile(RECORDING),
      }),
      supabase: client,
    });
    const body = await response.text();
    console.info(`${response.status}: ${body}`);
    const text = response.ok ? (JSON.parse(body) as { text: string }).text : "";

    const usage = await supabase
      .from("ai_usage")
      .select("task, cost_usd, estimated")
      .eq("owner", studentId);
    if (usage.error) throw new Error(usage.error.message);
    const rows = usage.data;
    return [
      result("answers 200", response.ok, String(response.status)),
      result(
        'the text contains "country"',
        text.toLowerCase().includes("country"),
        JSON.stringify(text),
      ),
      result(
        "one non-estimated transcribe row with a cost",
        rows.length === 1 &&
          rows[0]!.task === "transcribe" &&
          !rows[0]!.estimated &&
          Number(rows[0]!.cost_usd) > 0,
        JSON.stringify(rows),
      ),
    ];
  },
};
