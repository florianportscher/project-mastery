---
name: garden
description: "Garden the code that changed most since its last garden: simplify it, try to break the app on mock AI, fix small bugs, file larger ones, and open one PR that proves behaviour is unchanged. Run it in its own session."
argument-hint: "[--areas N]"
model: sonnet
disable-model-invocation: true
---

You coordinate one garden run into one PR, with no questions after the start: where something is open, decide and note it for the report. `builder` agents write all code. You start them, check their results and run git and GitHub, following [docs/agents/pull-requests.md](../../../docs/agents/pull-requests.md). Keep your own messages to a line or two.

The run is rare and its depth is the point: simplify and break run on Opus at high effort, and take as long as they need. Builders read their jobs in [jobs.md](jobs.md) themselves. A prompt holds what its step names here, verbatim, and nothing of your own: a limit you add replaces theirs, and the first run's added "do not touch other areas" and "keep fixes small" left it with nothing but removed `export` keywords. Waiting for builders and red checks work as in [`/build`](../build/SKILL.md) (`Waiting for a builder`, step 6 `Still red`). Below, `<date>` is today as `YYYY-MM-DD` and `<dir>` is `/tmp/garden-<date>`, written out literally in every command.

## Steps

1. **Worktree.** Run `tools/build/cleanup.sh`. `EnterWorktree` with the name `garden-<date>`, then run `tools/garden/setup.sh <N>` from its root, N from `--areas` (default 2). [docs/agents/worktrees.md](../../../docs/agents/worktrees.md) lists the commands the worktree accepts.

2. **Rejections.** For each closed garden PR that setup lists, read its comments and files (`gh pr view <pr> --comments --json files`) and record each change the maintainer rejected, with their reason and the files it touched: `pnpm -s garden:areas reject <pr> <area> "<change>" "<reason>" <file>...`. A PR closed without naming changes is one rejection of the whole PR per area it touched. Commit as `chore(garden): record rejected changes`.

3. **Before.** `pnpm -s garden:areas pick --areas <N>` gives the areas; none means nothing changed: stop and say so. Run `pnpm -s garden:areas measure <areas> --out <dir>/before.json`, `pnpm -s agent up` and `pnpm -s agent walk <dir>/walk-before`, before any change.

4. **Simplify.** For each area in turn, start one `builder` with `model: "opus"`, `effort: "high"` and without `isolation`. Its prompt: `Job: simplify`, the area name and the output of `pnpm -s garden:areas rejected <area>`. When it ends, check that the worktree is clean and that its handoff covers structure, seams and lines, each with changes or findings left and their reasons. A level missing or answered in a line without findings goes back to the same builder (`SendMessage`): "Examine the <level> level as jobs.md describes, then hand off again."

5. **Break.** Start one `builder` with `model: "opus"` and `effort: "high"`, its prompt `Job: break` and the area names. Check its handoff lists the assumptions it checked, each with its outcome; if not, send it back as in step 4. A run with no `refactor(garden)` or `fix(garden)` commit by now opens no PR: file the issues the handoffs name, go to step 8's last sentence, and report what the builders examined and why nothing changed. Otherwise push the branch.

6. **Review.** Start two `reviewer` agents in parallel on `git diff origin/main...HEAD`. Spec axis, brief: the jobs `simplify` and `break` in `.claude/skills/garden/jobs.md` and the builders' handoffs, plus every test assertion changed or deleted, each with whether its reason holds. Standards axis, brief: `AGENTS.md`, `docs/ARCHITECTURE.md` and the ADRs the diff touches, and for every change "is this simpler for the next agent?".

7. **Finish.** Start one `builder` on the default model with the prompt `Job: garden finish`, `<dir>`, the areas, every builder's handoff and both reports.

8. **PR.** Push, then `gh pr create --title "refactor(garden): garden <date>" --body-file docs/garden/<date>.md`; the scope `garden` keeps the run out of the next run's change counts. Run `tools/build/ready.sh <pr> docs/garden/<date>.md` in the background, and handle a red check as `/build` does. Stop the app (`pnpm -s agent down`) and leave the worktree with `ExitWorktree` (`keep`).

9. **Report.** One line: the PR link, or what blocked it, and the inbox issues filed.
