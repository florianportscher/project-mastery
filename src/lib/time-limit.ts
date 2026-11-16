import "server-only";
import vm from "node:vm";

/** Thrown by `withinTime` when the code ran over its limit. */
export class TimeLimitError extends Error {
  override name = "TimeLimitError";
}

// Made on first use: one context serves every call, as each runs to its end
// or its stop before the next starts.
let runner: { context: vm.Context; script: vm.Script } | undefined;

/**
 * Runs synchronous code and stops it after `ms` milliseconds with a
 * `TimeLimitError`, so code whose running time its input decides cannot hold
 * the server's one thread. Node's `vm` stops the whole call stack, also in
 * functions defined outside the context. Whatever `run` throws passes
 * through. It bounds time, not memory: keep `ms` short for code that can
 * allocate fast.
 */
export function withinTime<T>(ms: number, run: () => T): T {
  runner ??= {
    context: vm.createContext({}),
    script: new vm.Script("run()"),
  };
  runner.context.run = run;
  try {
    return runner.script.runInContext(runner.context, { timeout: ms }) as T;
  } catch (error) {
    if ((error as { code?: unknown }).code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
      throw new TimeLimitError(`The code ran longer than ${ms} ms.`);
    }
    throw error;
  } finally {
    runner.context.run = undefined;
  }
}
