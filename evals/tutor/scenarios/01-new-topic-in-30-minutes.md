# 01 A beginner, 30 minutes, a new Topic and two due Reviews

A whole Study session. The Student chose 30 minutes on the Today card. Two KCs of "Logic and proof" are due for Review, and the next Topic, "Sets and maps", is new to them.

## Setup

```json
{
  "examInDays": 42,
  "goal": "good_grade",
  "minutes": 30,
  "attempts": [
    {
      "kcs": [
        "Tautologies: contraposition and De Morgan",
        "Quantifiers and their negation"
      ],
      "daysAgo": 2
    },
    {
      "kcs": ["Logical connectives and truth tables", "Proof techniques"],
      "daysAgo": 6
    }
  ]
}
```

The proposal holds two due Reviews ("Logical connectives and truth tables", "Proof techniques") and the next Topic "Sets and maps", nothing of which is learned (checked with a mock run on 2026-11-14).

## Persona

A first-semester student, three weeks into the course. They did the logic part last week and have never worked with maps between sets. Motivated, a little intimidated by notation, easily overwhelmed by long text. They want the AI to lead.

## Moves

At most 12 messages.

1. Opens with the Today card's message: "Let's start."
2. Answers the due Reviews honestly: the truth-table one right, the proof-technique one half right (mixes up contraposition and contradiction).
3. Reads the first explanation of "Sets and maps" and does its task: gets image right and mixes up image and preimage once.
4. Once, after an explanation, sends "Show me an example."
5. If a reply explains more than about a screen without a task, says "Sorry, that's a lot at once."
6. Does the following tasks: right when the explanation was clear, otherwise a plausible partial answer.
7. Answers the final check, with one part only partly right.
8. If the AI has not wrapped up by the 11th message, sends "Let's wrap up."

## Expected behaviour

What Claude Opus 5.5 would do as the tutor with the same context and tools. Score each item 0 to 2 (2 met, 1 partly or late, 0 not met).

1. **Opening.** The first reply, before any `ask`, says where the Student stands (logic done, two ideas to refresh), today's goal, a plan of at most three steps for 30 minutes (the Reviews first, then the first block of maps) and why maps matter (later Topics that build on them, what old exams ask). Only then a question or an explanation.
2. **Blocks.** The new Topic is explained first, in blocks of two to four KCs that belong together, each followed by one task that needs all of them and takes minutes. At most 6 Questions in the 30 minutes, Reviews included. No yes/no or true/false question without its reason.
3. **Explanations add to the Materials.** Why the idea exists, a concrete case or small table before the formal statement, the script's statement with its page as a link from a tool result (`getTopic` before teaching), the typical trap (image versus preimage).
4. **Evidence rules.** Reviews are asked through `ask` and graded with help `none`; a block's task right after its explanation with help `some`; the half-right answer is `partial`, not `full`; a typing slip with a clear meaning is no error.
5. **Final check.** One `ask` without help covering every KC worked on today and not yet shown without help, a visible part per KC.
6. **Ends in time with a recap.** With about 5 minutes left, or on "Let's wrap up.", it goes to the final check; then three lines: what the Student can do now, what stays open, what comes next.
7. **No bookkeeping words.** Nothing about grading, recording, counting, attempts, help, schedules or dates, and no ids, tool names or "KC", "band", "recall".
8. **Pace follows the answers.** After the image/preimage mix-up, it splits the task and explains only the missing part; after sure answers, bigger steps and fewer checks.
