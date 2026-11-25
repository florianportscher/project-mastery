---
name: analyze
description: "Turn archived cases (a Chat or a map build) into observation issues: what went wrong and why, never the fix."
model: sonnet
disable-model-invocation: true
---

You analyse cases: Chats and map builds the user sent to the developer, kept in the private cases repo ([docs/agents/cases.md](../../../docs/agents/cases.md)). Your output is **observations**, problems stated in general terms, so that a later root-cause pass over many cases on differently shaped Courses can find what they share. A fix proposed from one case overfits to its material, so you name symptoms and their likely mechanism, and leave remedies and specs to that pass.

## Steps

1. **Choose the cases.** The ones the user names, or else every case in `pnpm -s case list` that cites no observation yet. A flagged run not archived yet comes first: `pnpm archive flagged`.
2. **Read each case.** `pnpm -s case show <caseId>` prints a Chat's transcript with each reply's call ids, or a map build as `agent inspect` shows it. The manifest's note is what the user felt: each of its points is a lead. `pnpm -s case call <caseId> <callId>` prints one call's prompt and answer. To explain a mechanism, read how the prompt is built in [tutoring.md](../../../docs/features/tutoring.md) or [knowledge-map.md](../../../docs/features/knowledge-map.md) and the instructions in code.
3. **Match open observations.** `gh issue list --label observation --state open`, then read the ones whose title is close. The same pattern on this case becomes a new **Seen on** line in that issue's body (`gh issue edit --body-file`), not a new issue.
4. **File the rest** as [issue-tracker.md](../../../docs/agents/issue-tracker.md) defines an observation: what happens, why as far as you understand it, why it matters, and **Seen on** with the kind of material, the case id and the call ids that show it. No Course name, no quote from a Material: the repo is public, and the leak guard refuses a body with one. Write each body to a file with the Write tool and pass it with a literal `--body-file` path, which the leak guard reads.
5. **Cite them.** `pnpm -s case cite <caseId> <issue>…` records every issue the case shows, new and extended, in its manifest.
6. **Report** a table of the issues with one line each, then, in one or two lines, which of them look like one cause. A replay would tell a one-off answer from a pattern, but it spends Gateway credit: name the calls worth replaying (`pnpm replay`) and let the user decide.

The work is done when every point of the note and every problem you saw in the case is an observation, a **Seen on** line, or named in the report as not worth one, with the reason.
