/** The commit Vercel deployed, or undefined outside a deployment. */
export function deployedCommit(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_SHA || undefined;
}
