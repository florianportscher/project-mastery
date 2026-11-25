import type { ModelMessage } from "ai";

/**
 * An archived model call (a line of a case's `calls.jsonl.gz`,
 * docs/agents/cases.md) turned back into what `pnpm replay` sends, without
 * any I/O. Langfuse stores a call's prompt and answer as GenAI messages:
 * `{ role, content }` for the system prompt, `{ role, parts }` for the rest.
 */

export type ArchivedCall = {
  id: string;
  traceName: string;
  model: string | null;
  startTime: string;
  metadata: Record<string, unknown>;
  cost: number | null;
  input: unknown;
  output: unknown;
};

type GenAiPart = {
  type: string;
  content?: unknown;
  id?: string;
  name?: string;
  arguments?: unknown;
  response?: unknown;
};

type GenAiMessage = { role: string; content?: unknown; parts?: GenAiPart[] };

/** A tool as the call offered it: its name, description and JSON schema. */
export type ArchivedTool = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

/** A call that replay cannot send, with the reason. */
export class ReplayError extends Error {}

const parsed = (value: unknown): unknown =>
  typeof value === "string" ? JSON.parse(value) : value;

/** The archived prompt: its system text, the other messages and the tools. */
export function archivedPrompt(input: unknown): {
  system: string | null;
  messages: GenAiMessage[];
  tools: ArchivedTool[];
} {
  const value = parsed(input);
  const all = (
    Array.isArray(value)
      ? value
      : ((value as { messages?: unknown })?.messages ?? [])
  ) as GenAiMessage[];
  const tools = Array.isArray(value)
    ? []
    : ((value as { tools?: ArchivedTool[] })?.tools ?? []);
  const system = all.find((m) => m.role === "system");
  return {
    system: typeof system?.content === "string" ? system.content : null,
    messages: all.filter((m) => m.role !== "system"),
    tools,
  };
}

const text = (part: GenAiPart) =>
  typeof part.content === "string" ? part.content : "";

type AssistantPart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown };

/**
 * The messages as AI SDK model messages. Reasoning is left out, as a new
 * call makes its own. A page image (archived as its Material and page) is
 * refused: the replay would need the Material's file.
 */
export function toModelMessages(messages: GenAiMessage[]): ModelMessage[] {
  const toolNames = new Map<string, string>();
  const result: ModelMessage[] = [];
  for (const message of messages) {
    const parts =
      message.parts ??
      (typeof message.content === "string"
        ? [{ type: "text", content: message.content }]
        : []);
    if (parts.some((p) => p.type === "file" || p.type === "image"))
      throw new ReplayError(
        "This call sent page images; replay sends text calls only.",
      );
    if (message.role === "user") {
      result.push({
        role: "user",
        content: parts
          .filter((p) => p.type === "text")
          .map((p) => ({ type: "text" as const, text: text(p) })),
      });
    } else if (message.role === "assistant") {
      const content = parts.flatMap((p): AssistantPart[] => {
        if (p.type === "text" && text(p))
          return [{ type: "text" as const, text: text(p) }];
        if (p.type === "tool_call" && p.id && p.name) {
          toolNames.set(p.id, p.name);
          return [
            {
              type: "tool-call" as const,
              toolCallId: p.id,
              toolName: p.name,
              input: p.arguments ?? {},
            },
          ];
        }
        return [];
      });
      if (content.length > 0) result.push({ role: "assistant", content });
    } else if (message.role === "tool") {
      result.push({
        role: "tool",
        content: parts
          .filter((p) => p.type === "tool_call_response" && p.id)
          .map((p) => ({
            type: "tool-result" as const,
            toolCallId: p.id!,
            toolName: toolNames.get(p.id!) ?? "unknown",
            output:
              typeof p.response === "string"
                ? { type: "text" as const, value: p.response }
                : {
                    type: "json" as const,
                    value: (p.response ?? null) as never,
                  },
          })),
      });
    }
  }
  return result;
}

/**
 * The data a build call offered: the JSON of its one user message, which
 * the build's prompt builders write (`MAP_CALL_REPLAYS`).
 */
export function offeredData(messages: GenAiMessage[]): unknown {
  const user = messages.find((m) => m.role === "user");
  const body = (user?.parts ?? []).map(text).join("");
  try {
    return JSON.parse(body);
  } catch {
    throw new ReplayError(
      "The call's user message is not the JSON of its data.",
    );
  }
}

/** A call's answer: its text, its tool calls and, for JSON text, the value. */
export type Answer = {
  text: string;
  toolCalls: Array<{ name: string; input: unknown }>;
  json: unknown;
};

const jsonOf = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/** The archived answer of a call. */
export function archivedAnswer(output: unknown): Answer {
  const messages = (parsed(output) ?? []) as GenAiMessage[];
  const parts = messages.flatMap((m) => m.parts ?? []);
  const answerText = parts
    .filter((p) => p.type === "text")
    .map(text)
    .join("\n");
  return {
    text: answerText,
    toolCalls: parts
      .filter((p) => p.type === "tool_call")
      .map((p) => ({ name: p.name ?? "", input: p.arguments })),
    json: jsonOf(answerText),
  };
}

/** The length of each top-level list in a JSON answer, such as `kcs`. */
function listCounts(json: unknown): Record<string, number> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return Object.fromEntries(
    Object.entries(json)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, (value as unknown[]).length]),
  );
}

/** One line comparing two answers: lengths, tool calls and list counts. */
export function compareLine(before: Answer, after: Answer): string {
  const tools = (a: Answer) =>
    a.toolCalls.map((t) => t.name).join(", ") || "none";
  const counts = [
    ...new Set([
      ...Object.keys(listCounts(before.json)),
      ...Object.keys(listCounts(after.json)),
    ]),
  ].map(
    (key) =>
      `${key} ${listCounts(before.json)[key] ?? 0} → ${listCounts(after.json)[key] ?? 0}`,
  );
  return [
    `text ${before.text.length} → ${after.text.length} chars`,
    `tools ${tools(before)} → ${tools(after)}`,
    ...counts,
  ].join(" · ");
}
