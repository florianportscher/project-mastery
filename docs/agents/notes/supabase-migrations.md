# Supabase migrations on a shared database

Verified 2026-11-27 with CLI 3.2.0 against a throwaway `postgres:17-alpine` container, two scratch `supabase/` folders (minimal `config.toml`: `project_id = "x"`), and `.github/workflows/migrate-staging.sh`.

- **The CLI compares versions only.** A version in the database's history without a local file makes `supabase db push` fail with `DbPushMissingLocalError` (text logs with `--agent no` do not contain that code).
- **Placeholders plus `--include-all`.** An empty `<version>_on_staging.sql` for each remote-only version (`supabase migration list --remote=… --output-format json`, entries whose `local` is empty) satisfies the check. Without `--include-all` the push asks for it when the branch's migration is older than the newest remote one. With both, only the branch's own migration is applied; the history keeps the other PR's name, and a later push from the other branch reports "up to date".
- **A failing migration** still fails: `DbPushApplyError` with the database error in the log, exit 1.
- **Scratch folders need a minimal `config.toml`.** A copy of the repo's config fails with `DbConfigLoadError` (missing templates).
- The CLI prints its WARN and update notices on stderr, so `migration list … > file.json` stays valid JSON.
