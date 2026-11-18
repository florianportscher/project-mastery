# Migrations from GitHub Actions

**Context.** Migrations reached staging and production by hand ([ADR 0025](0025-staging-for-agent-review.md), [ADR 0029](0029-agent-writes-to-staging.md)), so the maintainer ran Supabase commands, and a key that can change a schema had to live somewhere agents work.

**Decision.** `.github/workflows/migrate.yml` runs `supabase db push --remote="$SUPABASE_DB_URL" --yes` for staging, when `supabase/migrations/**` or the workflow file changes. Production runs the same command from `.github/workflows/release-please.yml`.

- **Migrate staging:** on a PR that is ready for review (not a draft, fork or bot PR), on every push to it, with the repo secret `STAGING_DB_URL`. The PR's preview then runs on the migrated staging database.
- **Migrate production:** when the maintainer merges the release-please PR and the release is created, from the release tag, in the environment `database-production`. That environment requires the maintainer's approval ("Review deployments"), allows only the `main` branch and does not let administrators bypass, so the secret is readable only by a job on `main` that the maintainer approved, and the workflow file it runs is one the maintainer merged. The job "Deploy production" (Vercel CLI, same environment, secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) needs it, so nothing deploys if the migration fails or is not approved. A merge to `main` alone migrates and deploys nothing; `vercel.json` turns off Vercel's own deploys from `main`.

`database-production` holds `SUPABASE_DB_URL`, a session pooler URI (port 5432). Staging has no environment: it holds no production data. Each job runs one at a time without cancelling a running one. Migrations stay backward compatible for one release cycle, because a rollback runs the old code on the new schema.

When staging holds a migration that the PR's branch lacks (another PR's, tried earlier), the push fails and the job names the version. Merging `main` into the branch, once the other PR is merged, clears it. Two PRs with migrations on staging at once are not supported.

**Consequences.** No agent or VM holds a database key that can change a schema, and the maintainer runs no Supabase command. The agent account has the `write` role, so it cannot change an environment, read a secret or approve a run. Any PR's workflow can read the staging secret: accepted, because staging holds no production data. Rolling back a migration, and cleaning staging after a PR closes unmerged, stay by hand. This supersedes "applied by hand" in ADR 0025 and ADR 0029.
