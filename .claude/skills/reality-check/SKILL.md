---
name: reality-check
description: "Test the product and ROADMAP.md against evidence, write a report to docs/reality-checks/, and apply the changes the user decides. Every two weeks or after a lot of progress; /sitting says when one is due."
disable-model-invocation: true
model: opus
---

You test the product and its plan against evidence, from the side of a student preparing for an exam: is what gets built what a student needs, and do the plan's bets still hold? The maintainer owns [ROADMAP.md](../../../ROADMAP.md) and [VISION.md](../../../VISION.md); you bring evidence and proposals, they decide. When the user hands you a link to an earlier check (a page or a file), read it as the last report.

## Steps

1. **Window.** The window starts at the date of the newest report in `docs/reality-checks/`, or 14 days ago when there is none. Read `VISION.md`, `ROADMAP.md`, `GLOSSARY.md` and that newest report.

2. **Evidence.** Done when each source below is read for the window:
   - **Merged PRs**, titles only: `gh pr list --state merged --search "merged:><start>" --limit 200 --json number,title`. Sort each by its title into _serves a Now item_ (name the item), _harness_ (agents, tooling, CI, docs for agents) or _other_.
   - **Open issues**, titles and labels: `gh issue list --state open --limit 200`.
   - **Usage and AI spend** on staging, read with `pnpm -s agent staging-sql` ([ADR 0025](../../../docs/adr/0025-staging-for-agent-review.md)): Students active in the window, Courses, Study sessions and Attempts created, and `sum(cost_usd)` of `ai_usage` by task. Counts only: no names, emails or message texts leave the database.
   - **Last check's changes**: for each change the last report applied, how it went in this window.
   - **Alternatives**: for each bet that names an alternative a student has (another app, a general chatbot, a tutor, the course's own material), what that alternative shipped since the last check. At most ten web searches in the run.

3. **Report.** Write `docs/reality-checks/<YYYY-MM-DD>.md`, about two pages, with these sections in order:
   1. **Verdict**: at most five lines.
   2. **Since the last check**: the numbers, the three shares of merged PRs, and how each change accepted last time went.
   3. **Bets**: each bet of `ROADMAP.md` as _held_, _weakened_, _broken_ or _no evidence_, with its evidence.   4. **Holes**: at most five, ranked by the threat to what a student gets, each with what it means for them.
   5. **Proposals**: changes to `ROADMAP.md` and `VISION.md`, each as _now_, _proposed_ and _why_, numbered.
   6. **Your decisions**: left empty for step 5.
   7. **Limits**: what the evidence could not show.

   Mark every number _measured_ (with its source) or _assumed_. Use the words of `GLOSSARY.md`.
4. **Decide.** Show the user the verdict and the proposals, one line each. For each they accept, reject or reword it, and they add their own.

5. **Apply.** Write their decisions into **Your decisions**, and change `ROADMAP.md` and `VISION.md` by the accepted and reworded proposals only. A change that needs code becomes an inbox issue ([docs/agents/issue-tracker.md](../../../docs/agents/issue-tracker.md)), named in the report. Open one PR, titled `docs(roadmap): …`, with the report and those changes ([docs/agents/pull-requests.md](../../../docs/agents/pull-requests.md)).
