import { MockLanguageModelV4 } from "ai/test";
import { useMockModels } from "@/lib/ai/testing";

/** A draft whose numbers all come from its program; fits either schema. */
export const DRAFT = {
  change: "new_values",
  statement:
    "A turbojet takes in {{mass_flow}} at {{v_0}}, which leaves at {{v_e}}. Compute the thrust.",
  solution: "$F = \\dot m (v_e - v_0)$, so the thrust is {{thrust_kN}}.",
  program:
    "mass_flow = 50 kg/s\nv_0 = 250 m/s\nv_e = 600 m/s\nthrust_kN = to(mass_flow * (v_e - v_0), kN)",
  finalAnswers: [{ variable: "thrust_kN", unit: "kN" }],
};

const usage = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** A `generate` model answering in turn, the last answer from then on. */
export function useGenerateModel(...answers: Array<object | Error>) {
  let call = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async () => {
      const answer = answers[Math.min(call++, answers.length - 1)]!;
      if (answer instanceof Error) throw answer;
      return {
        content: [{ type: "text", text: JSON.stringify(answer) }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      };
    },
  });
  useMockModels({ generate: model });
  return model;
}
