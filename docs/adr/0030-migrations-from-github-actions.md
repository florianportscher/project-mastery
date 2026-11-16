# Migrations from GitHub Actions

**Context.** Migrations reached staging and production by hand ([ADR 0025](0025-staging-for-agent-review.md), [ADR 0029](0029-agent-writes-to-staging.md)), so the maintainer ran Supabase commands, and a key that can change a schema had to live somewhere agents work.

**Decision.** `.github/workflows/migrate.yml` runs `supabase db push --remote="$SUPABASE_DB_URL" --yes` in two jobs. It runs only when `supabase/migrations/**` or the workflow file changes.

- **Migrate staging:** on a PR that is ready for review (not a draft, fork or bot PR), on every push to it, in the GitHub environment `database-staging`. The PR's preview then runs on the migrated staging database.
- **Migrate production:** on the push to `main` after a merge, in the environment `database-production`. That environment requires the maintainer's approval ("Review deployments"), allows only the `main` branch and does not let administrators bypass, so the secret is readable only by a job on `main` that the maintainer approved, and the workflow file it runs is one the maintainer merged.

Each environment holds the secret `SUPABASE_DB_URL`, a session pooler URI (port 5432), not the direct connection: that host is IPv6-only and GitHub runners cannot reach it, so each job stops early when it sees `db.<ref>.supabase.co`. Each job runs one at a time without cancelling a running one.

When staging holds a migration that the PR's branch lacks (another PR's, tried earlier), the push fails and the job names the version. Merging `main` into the branch, once the other PR is merged, clears it. Two PRs with migrations on staging at once are not supported.

**Consequences.** No agent or VM holds a database key that can change a schema, and the maintainer runs no Supabase command. The agent account has the `write` role, so it cannot change an environment, read a secret or approve a run. Any PR's workflow can read the staging secret: accepted, because staging holds no production data. Until the maintainer approves the production run, new code runs on the old schema. Rolling back a migration, and cleaning staging after a PR closes unmerged, stay by hand. This supersedes "applied by hand" in ADR 0025 and ADR 0029.
