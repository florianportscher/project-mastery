/**
 * Where the server runs, from the system environment variables Vercel sets.
 * Server-side only: these variables are not exposed to the browser.
 */
export function isVercelDeployment(): boolean {
  return Boolean(process.env.VERCEL);
}

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** The commit Vercel deployed, or undefined outside a deployment. */
export function deployedCommit(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_SHA || undefined;
}
