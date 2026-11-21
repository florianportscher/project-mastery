# Deploy facts

Verified in #309, #329 and #333 and their sessions. See also [ADR 0030](../../adr/0030-migrations-from-github-actions.md).

- **Re-runs:** after a failed release run use "Re-run failed jobs": "Re-run all jobs" finds no new release and skips both jobs.
- **Vercel CLI:** the workflow pins `vercel@66.2.0`. `vercel@41.0.0` rejects `supportsCancellation` in `vercel.json` as an unknown property and fails at `vercel build`; 66.2.0 accepts it. Change the pin only after running `vercel build` against the repo's `vercel.json`.
- **Vercel token:** `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are secrets of the `database-production` environment, so only a job on `main` that the maintainer approved can read them. The token's own scope in Vercel is not recorded here and the agent account cannot read it: look in the Vercel dashboard before relying on it.
- **Migrations URL:** `supabase db push` runs from GitHub runners, which have no IPv6. The direct connection (`db.<ref>.supabase.co`) is IPv6-only and fails with `ECONNREFUSED`. Use the IPv4 session pooler URI (`postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`, Supabase dashboard under Connect, Session pooler). Production reads it from `SUPABASE_DB_URL` in `database-production`, staging from the repo secret `STAGING_DB_URL`.
- **What the agent account can read:** secret names and environments only, never values. `gh secret list` shows the repo secret `STAGING_DB_URL`; `gh api repos/<owner>/<repo>/environments` shows `database-production`, `Preview` and `Production`. The Actions default workflow permissions (`actions/permissions/workflow`) return 403.
