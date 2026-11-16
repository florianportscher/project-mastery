# Roadmap

The long-term plan. [VISION.md](VISION.md) says what the product is; this file says what comes in which order. `/reality-check` tests it against evidence.

## Now

1. **Paid models.** Move parsing, the map build and the tutor to faster, stronger paid models. Every call goes through one gateway and each task's model is set in [one file](src/lib/ai/models.ts), so switching takes a small change, not a redesign.
   - Done when: Not set yet.

## Next

2. **Evals.** Bring back automated evals of the map build and the tutor, with a frontier model as judge, and tune both against them.
3. **Tests with students.** Have real students prepare for a real exam with the app, and use their sessions to fix what gets in their way.
4. **Polish.** Fix the remaining bugs and shorten the path from the first upload to the first Study session.

## Later

Not set yet.

## Not doing

Not set yet.

## Bets

Not set yet. A bet is an assumption the plan rests on, with what would show it wrong.
