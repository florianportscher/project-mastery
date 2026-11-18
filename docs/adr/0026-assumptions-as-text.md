# Assumptions as text

> Supersedes [ADR 0024](0024-kcs-without-sources.md).

**Context.** ADR 0024 turned what the Materials assume but never explain into KCs without rows in `kc_sources`, so new knowledge had something to dock onto. The first Update map on a real Course (Linear Algebra I, #248) showed the cost. Such a KC needed its own rules in four places: `retire_unsourced_kcs` kept it while a live KC built on it, the Topic tree placed it by the KC that built on it, the Priority rule counted it, and the prompts and the KC panel marked it. It sat in Topic and Readiness state although the Student can learn nothing about it from the Materials, and it gave the tutor a KC with nothing to cite. The map's reason to exist is what the Materials teach.

**Decision.** A KC is something the Materials teach, and every live KC has at least one source. What a KC assumes and no KC means stays on the assuming KC as text.

- **Where it lives.** `kcs.assumes` is a jsonb array of `{ name, description }`, one entry per name (compared case-insensitively). There is no new table, origin or state.
- **Where entries come from (#315).** The extraction call sees every KC stored so far (`knownKcs`) and gives Prerequisites by id; what it uses that no listed KC teaches it answers as `outside`, up to 3 entries, which go straight into `kcs.assumes`. There is no matching call and no embedding of entries. This replaces the matching by the 5 nearest KCs (#249): linking with the whole map in view found 82% of the reference Prerequisites against 58%.
- **Asking again.** When an update stores new KCs, the text entries of KCs from earlier builds are asked once against them, 50 entries per call, each call offered every new KC. A match removes the entry and, for an earlier KC, adds the Prerequisite; a later KC is no link, since a forward link could make the cycle check drop real Prerequisites. The step handles 100 entries at a time.
- **Retiring.** `retire_unsourced_kcs` retires every live KC without sources, with no exception.
- **Use.** The tutor reads `assumes` as facts about what a KC builds on, to check the Student's footing and explain from the Course's notation.

**Consequences.** The map holds only what the Materials teach, so Topic state, the study plan and Readiness count KCs a Student can actually learn from them. A Student who lacks something the Course assumes meets it as text in the tutor's context, not as a node, and cannot be taught or scheduled on it as a KC. Text that no later update's KCs mean stays on its KC for good. The migration deleted the KCs without sources and marked every extraction unmatched. Since #315, an entry is only as good as the extraction call's view: an entry for something the Course teaches later than the unit, in a Material uploaded after it, is caught only by the asking again on that upload.
