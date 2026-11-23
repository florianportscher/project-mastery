# Commands

Every command and slash skill of this repo, one line each, for the maintainer and for agents. `tools/commands-doc.test.ts` fails `pnpm check` when a `package.json` script or a `.claude/skills/` folder is missing here, so adding one means adding its line. Details live where the owner is named, not here.

## Daily work

| Command               | What it does                                                             |
| --------------------- | ------------------------------------------------------------------------ |
| `pnpm sitting`        | Starts a `/sitting` session (Sonnet): PRs and inbox, then the next shift |
| `pnpm shift <issues>` | Starts a `/build` session (Haiku) on the given spec issues               |
| `pnpm nit "<title>"`  | Files a one-line inbox issue                                             |
| `pnpm check`          | Lint, typecheck, format check and unit tests: what a PR must pass        |
| `pnpm dev`            | Starts the dev server                                                    |
| `pnpm build`          | Production build                                                         |
| `pnpm start`          | Serves the production build                                              |

## Checks and tests

| Command              | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `pnpm lint`          | ESLint, no warnings allowed                                     |
| `pnpm lint:fix`      | ESLint with autofix                                             |
| `pnpm typecheck`     | Generates route types, runs `tsc`                               |
| `pnpm format`        | Formats with Prettier                                           |
| `pnpm format:check`  | Checks formatting without changing files                        |
| `pnpm test`          | Unit tests in watch mode                                        |
| `pnpm test:run`      | Unit tests once                                                 |
| `pnpm test:coverage` | Unit tests with a coverage report                               |
| `pnpm test:e2e`      | Playwright tests; rebuilds the app first when the code is newer |
| `pnpm db:test`       | Database tests (Row Level Security) in `supabase/tests/`        |
| `pnpm db:lint`       | Lints the local database schema                                 |

## Local database

| Command                        | What it does                                           |
| ------------------------------ | ------------------------------------------------------ |
| `pnpm db:start`                | Starts local Supabase in Docker and applies migrations |
| `pnpm db:stop`                 | Stops it                                               |
| `pnpm db:status`               | Prints its URLs and keys                               |
| `pnpm db:reset`                | Recreates the local database from migrations           |
| `pnpm db:migration:new <name>` | Creates an empty migration file                        |
| `pnpm db:types`                | Regenerates `src/lib/supabase/database.types.ts`       |

In an agent worktree the local database is shared: see [worktrees.md](worktrees.md).

## Drive the app, read staging

`pnpm -s agent help` is the full, current list and the only place that explains each subcommand. In short:

| Command                                | What it does                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm -s agent up` · `down` · `status` | Start and stop the local stack and dev server                                                              |
| `pnpm -s agent login` · `open` · `act` | Drive the app in a browser as a test user, with compact page snapshots                                     |
| `pnpm -s agent check` · `sql` · `mail` | Compile and runtime errors, SQL with Row Level Security, the latest email                                  |
| `pnpm -s agent staging*`               | Read the staging project, and write to it for testing ([ADR 0029](../adr/0029-agent-writes-to-staging.md)) |
| `pnpm -s agent staging-reset-map <id>` | Delete a Course's whole map build on staging; Materials and chunks stay                                    |
| `pnpm -s agent inspect <courseId>`     | A Course's stored map build and its model calls as text: the first stop for a wrong map                    |

## Live AI and evals

These call real models and cost money; read [live-ai.md](live-ai.md) first.

| Command                 | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm smoke <name>`     | Runs one feature path once on a real model and checks it         |
| `pnpm gold <command>`   | Pulls, seeds or lists the gold Course snapshots in `evals/gold/` |
| `pnpm tutor-eval <cmd>` | Runs a tutoring scenario from `evals/tutor/scenarios/`           |
| `pnpm brief-eval <cmd>` | Runs a Brief scenario from `evals/brief/scenarios/`              |
| `pnpm metrics`          | Scores Chats in Langfuse                                         |
| `pnpm langfuse:models`  | Pushes the model prices in `src/lib/ai/prices.ts` to Langfuse    |

## Slash skills

Started in a Claude Code session. They live in `.claude/skills/`.

| Skill                 | What it does                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| `/sitting`            | Goes through the PRs and the inbox with you and lines up the next shift            |
| `/to-spec`            | Turns a grilling session's decisions into a one-page spec issue                    |
| `/build`              | Builds queued issues end to end, one worktree each, and opens PRs                  |
| `/grilling`           | Stress-tests a plan or decision by questioning you                                 |
| `/wait-what`          | Re-pitches the last message when it did not land                                   |
| `/reality-check`      | Tests the product and `ROADMAP.md` against evidence, writes `docs/reality-checks/` |
| `/showcase`           | Brings README, screenshots, demo and repo description up to date                   |
| `/run-app`            | Runs and drives the app with `pnpm -s agent`                                       |
| `/domain-modeling`    | Edits `GLOSSARY.md` and the ADRs                                                   |
| `/langfuse`           | Reads and changes Langfuse data and docs                                           |
| `/writing-for-agents` | Rules for writing skills, `AGENTS.md` and `CLAUDE.md`                              |
| `/retro`              | Reviews recent agent runs. Parked until launch                                     |

## Scripts the skills call

| Command                              | Owner                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `tools/build/setup.sh <issue>`       | `/build`: prepares the worktree and branch                                                                     |
| `tools/build/ready.sh <pr> <body>`   | `/build`: marks a PR ready and arms auto-merge                                                                 |
| `tools/build/cleanup.sh [issue ...]` | `/build`: removes finished worktrees                                                                           |
| `tools/sitting/waiting.sh [pr ...]`  | `/sitting`: what stands in the way of each waiting PR                                                          |
| `pnpm -s retro`                      | `/retro`: digests recent Claude Code runs. Parked                                                              |
| `pnpm -s garden`                     | `/garden`: areas with change counts and numbers; `pick`, `measure`, `write` for the ledger and report skeleton |

`pnpm prepare` installs the Git hooks and runs by itself on `pnpm install`.
