import type { DevCall } from "@/features/dev-inspector/types";

/** A call's suspect marks: it failed, or its unit was called again after it. */
export type CallFlags = {
  failed: Set<string>;
  retried: Set<string>;
};

/**
 * The Course's calls in time order, marked: a call failed when Langfuse
 * logged it as an error; a unit call was retried when a later call of the
 * same name ran for the same unit.
 */
export function callFlags(calls: readonly DevCall[]): CallFlags {
  const failed = new Set(
    calls.filter((call) => call.level === "ERROR").map((call) => call.id),
  );
  const retried = new Set<string>();
  const last = new Map<string, string>();
  for (const call of calls.toSorted((a, b) =>
    a.startTime.localeCompare(b.startTime),
  )) {
    if (!call.unitKey) continue;
    const key = `${call.name} ${call.unitKey}`;
    const before = last.get(key);
    if (before) retried.add(before);
    last.set(key, call.id);
  }
  return { failed, retried };
}

/** Each unit's calls by its key (`unitKey`), in time order. */
export function callsByUnit(calls: readonly DevCall[]): Map<string, DevCall[]> {
  return Map.groupBy(
    calls
      .filter((call) => call.unitKey !== null)
      .toSorted((a, b) => a.startTime.localeCompare(b.startTime)),
    (call) => call.unitKey!,
  );
}
