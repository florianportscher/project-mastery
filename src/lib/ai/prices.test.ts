// @vitest-environment node
import { expect, test, vi } from "vitest";
import { AI_TASKS, type TaskConfig } from "./models";
import { AUDIO_PRICES, MODEL_PRICES } from "./prices";

vi.mock("server-only", () => ({}));

// Every default model of a task.
const configuredModels = new Set(
  Object.values<TaskConfig>(AI_TASKS).map((config) => config.model),
);

test.each([...configuredModels])("%s has a price", (id) => {
  expect({ ...MODEL_PRICES, ...AUDIO_PRICES }).toHaveProperty([id]);
});
