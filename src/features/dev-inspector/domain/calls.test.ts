import { describe, expect, it } from "vitest";
import { callFlags, callsByUnit } from "@/features/dev-inspector/domain/calls";
import type { DevCall } from "@/features/dev-inspector/types";

const call = (over: Partial<DevCall> & { id: string }): DevCall => ({
  name: "extract-chapter",
  model: null,
  startTime: "2026-11-20T10:00:00Z",
  endTime: null,
  level: "DEFAULT",
  statusMessage: null,
  inputTokens: 0,
  outputTokens: 0,
  cost: null,
  materialId: null,
  unitKey: null,
  ...over,
});

describe("callFlags", () => {
  it("marks error calls as failed", () => {
    const flags = callFlags([
      call({ id: "a", level: "ERROR" }),
      call({ id: "b" }),
    ]);
    expect([...flags.failed]).toEqual(["a"]);
  });

  it("marks a unit call retried when a later call of its name ran for the unit", () => {
    const flags = callFlags([
      call({
        id: "late",
        unitKey: "c1/content/0",
        startTime: "2026-11-20T10:05:00Z",
      }),
      call({ id: "early", unitKey: "c1/content/0" }),
      call({
        id: "other-name",
        name: "extract-exercises",
        unitKey: "c1/content/0",
      }),
      call({ id: "batch-1", name: "parse-batch" }),
      call({ id: "batch-2", name: "parse-batch" }),
    ]);
    expect([...flags.retried]).toEqual(["early"]);
  });
});

describe("callsByUnit", () => {
  it("groups unit calls by key in time order and leaves out the others", () => {
    const byUnit = callsByUnit([
      call({ id: "b", unitKey: "u", startTime: "2026-11-20T10:05:00Z" }),
      call({ id: "a", unitKey: "u" }),
      call({ id: "course" }),
    ]);
    expect([...byUnit.keys()]).toEqual(["u"]);
    expect(byUnit.get("u")!.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
