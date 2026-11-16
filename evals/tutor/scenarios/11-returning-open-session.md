# 11 A returning Student, Open, an unclear question and an untaught idea

A whole Study session without a chosen length (Open, as when a session starts by typing). The Student comes back after a few days, finds a question unclear, meets an idea they have not been taught, and wraps up early.

## Setup

```json
{
  "examInDays": 30,
  "goal": "good_grade",
  "memory": [{ "daysAgo": 3, "text": "Prefers short replies." }],
  "attempts": [
    {
      "kcs": [
        "Tautologies: contraposition and De Morgan",
        "Quantifiers and their negation"
      ],
      "daysAgo": 6
    },
    {
      "kcs": ["Logical connectives and truth tables", "Proof techniques"],
      "topics": ["Sets and maps"],
      "daysAgo": 2
    }
  ]
}
```

Nothing is set for the session's length. The proposal holds two due Reviews ("Tautologies: contraposition and De Morgan", "Quantifiers and their negation") and the next Topic "Groups", nothing of which is learned (checked with a mock run on 2026-11-14).

## Persona

A student coming back after a busy week. Reads quickly and sometimes misreads, asks when something is unclear rather than guessing. Friendly, a bit tired, wants to stop after about 20 minutes.

## Moves

At most 12 messages.

1. Opens by typing: "Hi, I'm back. What should we do?"
2. On the first question, says it is unclear: "Sorry, I don't get what you're asking. Do you mean the whole set or one element?" (adapted to the question).
3. Answers the question when it comes again in clearer words, correctly.
4. When a question touches an idea the AI has not explained in this session and the Student has never seen, says "I haven't seen this before." If no such question comes by the 6th message, sends "Explain it differently." after the next explanation instead.
5. Does the task after that explanation, with one typing slip that leaves the meaning clear (such as "injectiv" or a missing bracket).
6. Asks once: "How long have we been at it?"
7. After about 7 messages, sends the quick reply "Let's wrap up."
8. Answers the final check, one part partly right.
9. If the AI offers to go on, says "No, let's stop here."

## Expected behaviour

What Claude Opus 5.5 would do as the tutor with the same context and tools. Score each item 0 to 2 (2 met, 1 partly or late, 0 not met).

1. **Opening.** The first reply, before any `ask`, says where the Student stands (from the context alone: logic and sets done, two ideas to refresh), today's goal, a plan of at most three steps without a fixed length and why the Topic matters (later Topics that build on it, what old exams ask).
2. **Blocks.** A new idea is explained in a block of two to four KCs, then one task that needs them. About one Question per 5 minutes at most. No yes/no or true/false question without its reason.
3. **Explanations add to the Materials.** Why the idea exists, a concrete case or small table before the formal statement, the script's statement with its page as a link from a tool result, the typical trap. "Explain it differently." gets the same idea another way, not the same text again.
4. **Evidence rules.** The unclear question is closed with `closeQuestion` and asked again in clearer words, not graded. "I haven't seen this before" on an untaught idea is closed with `closeQuestion`, not graded `wrong`, then taught. The typing slip is no error. A task right after its explanation is graded with help `some`.
5. **Final check.** One `ask` without help over every KC worked on today and not yet shown without help, a visible part per KC.
6. **Ends with a recap.** On "Let's wrap up." it goes to the final check, then three lines: what the Student can do now, what stays open, what comes next. "How long have we been at it?" is answered from the context (minutes running, no length chosen).
7. **No bookkeeping words.** Nothing about grading, recording, counting, attempts, help, schedules or dates, and no ids, tool names or "KC", "band", "recall".
8. **Pace follows the answers.** Short replies, as the Memory says; after the partly right answer, only the missing part again.
