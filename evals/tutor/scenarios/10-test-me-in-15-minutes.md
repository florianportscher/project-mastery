# 10 A Student who knows the Topic, 15 minutes, "I know this, test me."

A whole Study session. The Student chose 15 minutes and already knows most of the next Topic, "Groups", from a course at another university.

## Setup

```json
{
  "examInDays": 20,
  "goal": "pass",
  "minutes": 15,
  "memory": [
    {
      "daysAgo": 2,
      "text": "Took an algebra course at another university last year."
    }
  ],
  "attempts": [{ "topics": ["Logic and proof", "Sets and maps"], "daysAgo": 2 }]
}
```

Nothing is due. The proposal is the Topic "Groups" with its four KCs, nothing learned ("Relations and induction" is _if time allows_ for the goal "pass"; checked with a mock run on 2026-11-14). Check the context of the first reply before judging, and note in the run if the proposal differs.

## Persona

A second-year transfer student, quick and a little impatient, who does not want to sit through what they already know. Answers in short, precise sentences.

## Moves

At most 12 messages.

1. Opens with the Today card's message: "Let's start."
2. After the opening, sends the quick reply "I know this, test me."
3. Answers the question over the Topic: the group axioms, the rules and the homomorphism parts right; the subgroup part wrong (checks only that the subset is closed under the operation, and calls $\mathbb{N}$ a subgroup of $(\mathbb{Z}, +)$).
4. Does the task on subgroups after the AI explains it, correctly.
5. If the AI goes on to teach the other parts anyway, says "I got those right, didn't I?"
6. If the AI has not wrapped up by the 6th message, sends "Let's wrap up."
7. Answers the final check correctly.
8. If the AI offers to go on when the time is up, says "No, that's it for today."

## Expected behaviour

What Claude Opus 5.5 would do as the tutor with the same context and tools. Score each item 0 to 2 (2 met, 1 partly or late, 0 not met).

1. **Opening.** The first reply, before any `ask`, says where the Student stands (logic and sets done), today's goal, a plan of at most three steps for 15 minutes and why the Topic matters (later Topics that build on it, what old exams ask).
2. **Blocks.** "I know this, test me." gets one `ask` over the Topic's KCs with a visible part per KC, not one question per idea. Only the failed part is taught, then one task on it. At most 3 Questions in the 15 minutes. No yes/no or true/false question without its reason.
3. **Explanations add to the Materials.** The subgroup explanation says why closure alone is not enough, shows a concrete case, gives the script's subgroup criterion with its page as a link from a tool result, and names the typical trap the Student fell into (inverses).
4. **Evidence rules.** The Topic question is graded with help `none` and one result per KC: `full` for the three right parts, `wrong` or `partial` for subgroups. The task right after the subgroup explanation is graded with help `some`.
5. **Final check.** One `ask` without help over every KC worked on today and not yet shown without help (here subgroups), a visible part per KC; nothing already shown without help is asked again.
6. **Ends in time with a recap.** The final check comes with about 5 minutes left or on "Let's wrap up."; then three lines: what the Student can do now, what stays open, what comes next. When the time is up, it offers to stop or go on, and accepts the stop.
7. **No bookkeeping words.** Nothing about grading, recording, counting, attempts, help, schedules or dates, and no ids, tool names or "KC", "band", "recall".
8. **Pace follows the answers.** Sure, complete answers get no re-teaching and no extra checks; the error gets the missing part explained again and that part asked.
