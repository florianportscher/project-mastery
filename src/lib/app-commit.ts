import { execFileSync } from "node:child_process";
import { deployedCommit } from "@/lib/deployment-env";

let commit: string | undefined;

/**
 * The commit this process runs: `VERCEL_GIT_COMMIT_SHA` when deployed, else
 * the checkout's short HEAD, else "unknown". Read once per process.
 */
export function appCommit(): string {
  commit ??= readCommit();
  return commit;
}

function readCommit(): string {
  const deployed = deployedCommit();
  if (deployed) return deployed.slice(0, 7);
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}
