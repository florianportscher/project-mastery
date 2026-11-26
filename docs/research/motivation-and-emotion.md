# Motivation, emotion and habit

- **Field**: educational and social psychology of motivation and achievement emotions, with the behavioural science of habits, plans and nudges.
- **Scope**: why students start, keep going and come back; what they feel while learning and how those feelings change learning; how praise, rewards, game elements, plans, reminders and session length act on that. How memory works is in the learning science report (LS); students' judgments of their own learning are in the assessment and metacognition report (AM); a tutor's moment-to-moment moves are in the human tutoring report (TUT).
- **Date**: 2026-11-26.
- **Outline started from**: what a textbook chapter or major review covers: Deci & Ryan, Ryan & Deci 2000 (self-determination theory); Lepper et al. 1973, Deci, Koestner & Ryan 1999, Cameron & Pierce 1994 (rewards); Patall et al. 2008 (choice); Reeve (autonomy-supportive teaching); Eccles, Wigfield & Eccles 2000 (expectancy-value); Bandura 1977 (self-efficacy); Hidi & Renninger 2006 (interest); Hulleman & Harackiewicz 2009 (utility value); Pekrun 2006 (control-value theory); Hembree 1988 (test anxiety); Martin & Marsh 2008 (buoyancy); D'Mello & Graesser (confusion, affect dynamics); Baker et al. 2010 (boredom); Csikszentmihalyi 1990 (flow); Mueller & Dweck 1998, Henderlong & Lepper 2002 (praise); Dweck, Sisk et al. 2018 (mindset); Credé et al. 2017 (grit); Sailer & Homner 2020 (gamification); Steel 2007 (procrastination); Gollwitzer & Sheeran 2006 (implementation intentions); Oettingen, Duckworth (mental contrasting); Lally et al. 2010, Wood (habits); Walton & Cohen 2011 (belonging); Hagger et al. 2016 (ego depletion). The search added the newer meta-analyses (Howard 2021, Camacho-Morles 2021, Macnamara 2023, Burnette 2023, Huntley 2019, Singh 2024), the failed replications (Li & Bates 2019, Myers 2021) and the at-scale null results (Kizilcec 2020, Oreopoulos & Petronijevic 2019), and the claims on breaks (Biwer 2023) and attention span (Bradbury 2016).
- **Search tools**: PubMed (citation matching and abstracts, which covered most psychology journals), the Crossref API (DOIs, and abstracts where publishers deposit them), web search (abstracts on repositories and publisher pages) and alphaXiv. About 48 search calls.
- **Could not reach**: Consensus (the plan's monthly allowance was used up on the first call) and Elicit (the account's plan has no API access); the OpenAlex and Semantic Scholar APIs refused with rate limits; Springer and Elsevier pages, so several meta-analyses in _Educational Psychology Review_ and _Learning and Instruction_ are **located** only or checked through repository copies; books, which are **located** but not read. alphaXiv returned only 2026 LLM-tutoring preprints, which belong to the LLM report, so no claim cites it.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Most of this evidence is correlational and self-reported: students rate their motivation or emotions on questionnaires, and studies link the ratings to grades. Where an experiment exists it is named. Samples are mostly school and university students in Western countries; effect sizes are standardised mean differences (_d_ or _g_; 0.2 small, 0.5 medium, 0.8 large) or correlations (_r_ or _ρ_; .1 small, .3 medium, .5 large).

## Claims

### Why students engage

**MOT-1. Motivation that comes from interest or from valuing the material (autonomous motivation) goes with better performance, persistence and well-being; motivation from rewards, pressure or guilt (controlled motivation) does not.**
Grade A (meta-analysis of correlational studies). Self-determination theory explains motivation through three needs, autonomy, competence and relatedness, whose support yields self-motivation and whose thwarting diminishes it ([Ryan 2000][ryan2000]). Across 344 samples (223,209 students), intrinsic motivation related to success and well-being, personal value (identified regulation) to persistence; external regulation was unrelated to performance and persistence and related to lower well-being; guilt- and ego-driven motives (introjected regulation) went with persistence but also with ill-being ([Howard 2021][howard2021]). Boundary: correlational, so motivation may follow success as much as cause it.

**MOT-2. Giving students meaningful choice and a voice raises their intrinsic motivation and effort, and teachers can learn to teach in this autonomy-supportive way.**
Grade A. Across 41 studies, choice enhanced intrinsic motivation, effort, task performance and perceived competence; effects were largest with two to four successive choices and when no reward followed the choice ([Patall 2008][patall2008]). Training teachers to give rationales, acknowledge negative feelings, use non-controlling language and offer choice changes how they teach, and their students' motivation follows ([Su 2011][su2011]; [Reeve 2021][reeve2021]). Boundary: the choice effect was larger for instructionally irrelevant choices (which colour, which example) than for choices about the learning itself ([Patall 2008][patall2008]).

**MOT-3. Expected tangible rewards for doing an interesting task lower the wish to do it unrewarded later (the overjustification effect), while informative positive feedback raises it.**
Grade A. Across 128 experiments, rewards contingent on engagement, completion or performance undermined free-choice intrinsic motivation (_d_ = −0.40, −0.36, −0.28), and positive feedback enhanced it (_d_ = 0.33); tangible rewards harmed children more than college students ([Deci 1999][deci1999]). Boundary: the effect applies to tasks already found interesting; for dull tasks, and for unexpected rewards, it is weak or absent. How large and general the undermining is was disputed in competing meta-analyses (see Contested).

**MOT-4. Students persist in what they expect to master; belief in one's own capability for a task (self-efficacy) is among the strongest non-cognitive predictors of grades, and it grows mainly from one's own successes.**
Grade A for the correlation, C for the theory. Expectancy-value theory explains choice and persistence by the expectation of success and the value of the task, the value having parts for interest, importance, usefulness and cost ([Wigfield 2000][wigfield2000]); self-efficacy is Bandura's task-specific version of expectancy ([Bandura 1977][bandura1977]). Across 241 data sets on university grade point average, performance self-efficacy was the strongest of 50 correlates, ahead of school grades and admission tests ([Richardson 2012][richardson2012]). Mastery experience is typically the strongest source of self-efficacy, ahead of watching others, persuasion and physical state ([Usher 2008][usher2008]). Boundary: high self-efficacy follows past achievement, so part of the correlation is prior success.

**MOT-5. Asking students to write how the material connects to their own life or goals (a utility-value intervention) raises interest and grades, mostly for students who expect to do poorly.**
Grade A for motivation interventions in general, B for utility value. A randomised field experiment in high school science raised interest and grades for students with low expectations of success ([Hulleman 2009][hulleman2009]); in a four-semester double-blind trial in introductory biology (_N_ = 1,040), it closed 61% of the gap for first-generation minority students ([Harackiewicz 2016][harackiewicz2016]). Motivation interventions in authentic settings average _d_ = 0.49, with randomised designs smaller than quasi-experiments ([Lazowski 2016][lazowski2016]). Boundary: across 247 online courses with a quarter of a million students, value-relevance messages raised completion only for students in developing countries in courses that had such a gap; scaling cut the average effect of behavioural interventions by an order of magnitude ([Kizilcec 2020][kizilcec2020]).

**MOT-6. Interest that a situation sparks (situational interest) can grow into a lasting personal interest, but only when it is sustained and supported over time.**
Grade C (theory with developmental studies). The four-phase model runs from triggered and maintained situational interest to emerging and well-developed individual interest ([Hidi 2006][hidi2006]). Boundary: the model describes rather than tests interventions; how fast phases move is not known.

**MOT-7. A sense of belonging matters: a brief intervention that frames early social adversity as common and temporary raised grades for students from a stigmatised group.**
Grade B. In a randomised trial (_N_ = 92), the belonging intervention raised African American students' grade point average over three years and halved the achievement gap, without students recalling it as influential ([Walton 2011][walton2011]). Boundary: a small single trial, built for and effective in a group whose belonging is under threat; it was expected to help European American students less, and it did.

### Emotions while learning

**MOT-8. Achievement emotions follow from two appraisals, how much control the student feels over the activity and its outcome, and how much they value it (control-value theory).**
Grade C for the theory, A for its correlational support. High control and value give enjoyment, hope and pride; high value with low control gives anxiety and, at the extreme, hopelessness; low value gives boredom ([Pekrun 2006][pekrun2006]). Across 186 studies of technology-based learning, enjoyment correlated positively with control, cognitive support and achievement and anxiety negatively, consistent with the theory and largely independent of the type of environment ([Loderer 2020][loderer2020]).

**MOT-9. Emotions and achievement drive each other: enjoyment and pride predict later achievement, and achievement predicts later enjoyment, while anxiety, shame, anger, boredom and hopelessness predict lower achievement and are fed by it.**
Grade A (longitudinal and meta-analytic, correlational). Five annual waves of 3,425 German students showed these reciprocal effects with intelligence and socio-economic status controlled ([Pekrun 2017][pekrun2017]). Across 68 studies, enjoyment correlated with performance at _ρ_ = .27, anger at −.35 and boredom at −.25, while frustration was near zero (−.02); links were strongest in secondary school ([Camacho-Morles 2021][camachomorles2021]). Boundary: the longitudinal study is mathematics only; frustration's weak link fits MOT-15.

### Test anxiety and buoyancy

**MOT-10. Test anxiety (exam nerves) relates to lower exam scores and grades at a small to moderate size, and rises with high stakes and perceived difficulty.**
Grade A (meta-analysis, correlational). Across 238 studies since Hembree's 1988 meta-analysis, test anxiety was negatively related to standardised tests, entrance exams and grade point average; self-esteem predicted it strongly, and perceived difficulty and high stakes went with more of it ([von der Embse 2018][vonderembse2018]). Boundary: the worry component, rather than physical arousal, is thought to carry the effect (model's knowledge, no source checked).

**MOT-11. Test anxiety can be reduced: behaviour therapy and cognitive-behavioural therapy work best, and a brief message that reframes nervous arousal as useful (reappraisal) helped first-year students.**
Grade A for treatment, B for reappraisal. Across 44 randomised trials with university students, interventions reduced test anxiety (_g_ = −0.76) and raised academic performance (_g_ = 0.37), with most support for behaviour therapy, and with publication bias and weak reporting ([Huntley 2019][huntley2019]). An e-mail paragraph the night before the first exam, framing anxiety as neutral or helpful, reduced worry and raised exam and course performance for first-year students but not for older ones ([Brady 2018][brady2018]); the approach goes back to reappraising arousal before a standardised test ([Jamieson 2010][jamieson2010]). Boundary: the related expressive-writing intervention (writing out worries just before the exam) worked in its original trials ([Ramirez 2011][ramirez2011]) but did not in a later classroom test ([Myers 2021][myers2021]).

**MOT-12. Material learned through retrieval practice holds up better under stress, and students report less exam nervousness after regular low-stakes quizzing.**
Grade B. Participants who learned by retrieval practice were immune to the memory impairment that acute stress caused in those who restudied ([Smith 2016][smith2016]); in a survey of 1,408 middle and high school students, 72% said classroom retrieval practice made them less nervous for tests ([Agarwal 2014][agarwal2014]). Boundary: the survey is self-report; one laboratory experiment for the stress effect. Links to LS-6.

**MOT-13. Coping well with everyday setbacks such as a poor mark, a deadline or a hard problem (academic buoyancy) is distinct from resilience to major adversity, and anxiety is its strongest negative predictor.**
Grade B (longitudinal, correlational). In 598 high school students, self-efficacy, engagement and teacher-student relationships predicted buoyancy, and anxiety explained most of its variance, negatively ([Martin 2008][martin2008]). Boundary: little intervention evidence; buoyancy is measured by self-report.

### Confusion, frustration, boredom and flow

**MOT-14. Confusion at an impasse helps learning when the student resolves it; confusion left unresolved turns into frustration and then boredom.**
Grade B. Experiments that induced confusion with contradictory information found better learning when the confusion was resolved ([D'Mello 2014][dmello2014]); the affect dynamics model describes the path from engagement to confusion, and on to frustration and boredom when impasses stay unresolved ([D'Mello 2012][dmello2012]). Boundary: induced confusion helped on complex conceptual material, not on simple recall; the predicted transitions have not always replicated (see Contested). Fits productive failure (LS-19).

**MOT-15. Boredom is the most damaging learning emotion: it persists once it starts, predicts lower achievement and precedes disengaged behaviour such as gaming the system, while frustration is less persistent and less harmful.**
Grade A. Comparing three computer-based learning environments, boredom was the most persistent state, went with poorer learning and preceded gaming the system; frustration did not ([Baker 2010][baker2010]). Across 29 studies (19,052 students), boredom correlated with academic outcomes at _r_ = −.24, more strongly for boredom in class than while studying ([Tze 2016][tze2016]), in line with MOT-9. Boundary: boredom arises both from too little challenge and from too much (low control, MOT-8).

**MOT-16. Students are most absorbed (in flow) when the challenge matches their skill, goals are clear and they feel in control, and absorption goes with better performance.**
Grade B (meta-analyses of correlational studies). Challenge-skill balance related moderately to flow, alongside clear goals and a sense of control ([Fong 2015][fong2015]); learning flow correlated with academic performance at _r_ = .43 across 13 studies ([Zhang 2023][zhang2023]). The concept comes from Csikszentmihalyi ([Csikszentmihalyi 1990][csikszentmihalyi1990]). Boundary: few studies, a wide interval, and no experiment that manipulates challenge in a learning setting.

### Praise, mindset and game elements

**MOT-17. Praise for being clever or for the person makes students more fragile after failure than praise for effort, strategy and process; inflated praise discourages students with low self-esteem from taking on challenges.**
Grade B (experiments, one failed replication). Fifth graders praised for intelligence showed less persistence, enjoyment and performance after failure than those praised for effort ([Mueller 1998][mueller1998]); person praise and criticism produced more helpless responses than process praise and criticism ([Kamins 1999][kamins1999]); parents' process praise of toddlers predicted their beliefs about ability five years later ([Gunderson 2013][gunderson2013]); inflated praise reduced challenge seeking in children with low self-esteem ([Brummelman 2014][brummelman2014]). Praise helps when it is sincere, attributes success to controllable causes, supports autonomy, avoids social comparison and sets attainable standards ([Henderlong 2002][henderlong2002]). Boundary: a close replication with 624 Chinese children found none of the motivation effects of the original ([Li 2019][li2019]); this fits feedback aimed at the person rather than the task (LS-21).

**MOT-18. Believing ability can grow (growth mindset) correlates only weakly with achievement, and growth mindset interventions have small average effects, near zero in the best-controlled studies, with benefits concentrated in lower-achieving students.**
Grade A. Two meta-analyses found weak overall effects for both the correlation and interventions, with possible benefit for students of low socio-economic status or academically at risk ([Sisk 2018][sisk2018]). Across 63 studies, the effect was _d_ = 0.05, non-significant after correcting for publication bias, and _d_ = 0.02 in the six highest-quality studies ([Macnamara 2023][macnamara2023]). A meta-analysis focused on targeted groups and high-fidelity delivery found _d_ = 0.14 for achievement with a prediction interval from −0.08 to 0.35 ([Burnette 2023][burnette2023]); a preregistered national US study raised grades among lower-achieving students, where peer norms supported the message ([Yeager 2019][yeager2019]).

**MOT-19. Game elements (points, badges, leaderboards, stories; gamification) raise learning outcomes modestly on average, but effects on motivation are less stable and can fade or reverse over a term.**
Grade A for the average, B for the boundaries. A meta-analysis found _g_ = 0.49 for cognitive outcomes, stable in rigorous studies, and less stable effects for motivation (_g_ = 0.36) and behaviour (_g_ = 0.25), where game fiction and social interaction moderated the effect ([Sailer 2020][sailer2020]). In a semester-long course, students with badges, a leaderboard and coins became less motivated and satisfied and scored lower on the final exam ([Hanus 2015][hanus2015]); over a 14-week course the effect of gamification declined after a few weeks (a novelty effect) before partly recovering ([Rodrigues 2022][rodrigues2022]). Boundary: rewards attached to interesting tasks can undermine motivation (MOT-3).

### Procrastination, plans, habits and reminders

**MOT-20. Students put off tasks they find aversive, whose payoff is far away, and that they doubt they can do; procrastination goes with lower grades.**
Grade A (meta-analyses, correlational). Across 691 correlations, the strongest predictors were task aversiveness, delay of the reward, low self-efficacy and impulsiveness, along with low conscientiousness, distractibility and poor organisation, as temporal motivation theory predicts ([Steel 2007][steel2007]). Across 33 studies (38,529 participants), procrastination was negatively related to academic performance, with the size depending on how both were measured ([Kim 2015][kim2015]).

**MOT-21. Procrastination can be reduced, most by cognitive-behavioural interventions.**
Grade A. Across 24 intervention studies, procrastination dropped and stayed down at follow-up, with cognitive-behavioural therapy stronger than other approaches ([van Eerde 2018][vaneerde2018]); a meta-analysis of randomised trials found _g_ = 0.34 against control, 0.55 for cognitive-behavioural therapy ([Rozental 2018][rozental2018]). Boundary: few trials, many with small samples and self-reported procrastination.

**MOT-22. Planning exactly when, where and how to act ("if it is 7 pm after dinner, I open the flashcards"; implementation intentions, if-then plans) helps people act on their goals, and pairing the plan with picturing the obstacle (mental contrasting, WOOP) helps too.**
Grade A. Across 94 tests, implementation intentions had a medium-to-large effect on goal attainment (_d_ = .65) ([Gollwitzer 2006][gollwitzer2006]). Mental contrasting with implementation intentions had a smaller effect (_g_ = 0.34), larger when delivered in interaction with a person than on paper, with publication bias ([Wang 2021][wang2021]). Boundary: in online courses at scale, plan-making raised engagement in the first weeks but not completion ([Kizilcec 2020][kizilcec2020]).

**MOT-23. A habit forms by repeating a behaviour in a stable context until it runs automatically; this takes about two months on average, with wide variation, and missing a single day does not reset it.**
Grade B. Daily repetition in the same context ("after breakfast") made automaticity rise along an asymptotic curve, reaching its plateau after 18 to 254 days, and a single missed opportunity did not materially affect the process ([Lally 2010][lally2010]). A systematic review of 20 studies found median times of 59 to 66 days with a range of 4 to 335 days, and stronger habits for morning and self-chosen behaviours ([Singh 2024][singh2024]). Habit research has been applied to study routines ([Fiorella 2020][fiorella2020]). Boundary: the studies concern health behaviours such as flossing or exercise, not studying.

**MOT-24. Light-touch reminders and coaching messages rarely change students' grades.**
Grade B. Across nearly 25,000 students on three campuses, online and text-message coaching improved some measures of mental health and study time but no academic outcome; students studied far less than planned whether coached or not ([Oreopoulos 2019][oreopoulos2019]). Behavioural interventions that worked in single courses lost an order of magnitude of their effect across 247 online courses ([Kizilcec 2020][kizilcec2020]). Boundary: a timely message that changes how a student reads their own situation (MOT-11) can work where a generic reminder does not.

**MOT-25. There is no fixed attention span of 10 to 15 minutes, and willpower is not a tank that empties; short planned breaks in self-study reduce fatigue at the same output.**
Grade C. The claimed 10–15 minute decline in lecture attention rests on few, flawed studies, and variation between teachers is larger than variation over time ([Bradbury 2016][bradbury2016]; [Wilson 2007][wilson2007]). A multi-lab replication of ego depletion (self-control as a resource used up by an earlier task) found _d_ = 0.04 ([Hagger 2016][hagger2016]). Students who took a short break after each 12 or 24 minutes of study reported less fatigue and more concentration and motivation than those who chose their own breaks, and finished the same work in less time ([Biwer 2023][biwer2023]). Boundary: one short study on breaks, with later work favouring self-chosen breaks (see Contested); the strongest reason for short, repeated sessions is spacing (LS-8), not attention.

## Terms

Research name, with the everyday name in brackets where they differ.

- Autonomous motivation (wanting to; interest, personal value) vs controlled motivation (having to; rewards, pressure, guilt); intrinsic and extrinsic motivation; amotivation (not seeing the point): MOT-1.
- Autonomy support (giving choice and reasons); basic psychological needs (autonomy, competence, relatedness): MOT-1, MOT-2.
- Overjustification effect (rewards killing interest): MOT-3.
- Expectancy and value (can I do it, do I want to); self-efficacy (confidence for a specific task); mastery experience (past success): MOT-4.
- Utility value (relevance, "what is this good for"): MOT-5. Situational and individual interest (curiosity sparked vs lasting passion): MOT-6.
- Social belonging (feeling you fit in): MOT-7.
- Achievement emotions; control-value appraisals (feeling in control, caring about it): MOT-8, MOT-9.
- Test anxiety (exam nerves; worry and physical arousal); reappraisal (reframing nerves as useful); expressive writing (writing out worries): MOT-10, MOT-11.
- Academic buoyancy (bouncing back from everyday setbacks): MOT-13.
- Impasse, productive confusion (being stuck in a useful way); gaming the system (clicking through hints to get the answer): MOT-14, MOT-15.
- Flow (being in the zone); challenge-skill balance (not too hard, not too easy): MOT-16.
- Person praise vs process praise ("you're smart" vs "good strategy"); inflated praise: MOT-17.
- Implicit theories of intelligence (growth vs fixed mindset): MOT-18. Grit (perseverance and passion): Contested.
- Gamification (points, badges, leaderboards, streaks); novelty effect (wears off): MOT-19.
- Temporal motivation theory; task aversiveness (dreading the task): MOT-20.
- Implementation intentions (if-then plans); mental contrasting (WOOP: wish, outcome, obstacle, plan): MOT-22.
- Habit automaticity (doing it without deciding): MOT-23. Nudges (reminders, prompts): MOT-24.
- Ego depletion (willpower running out); systematic breaks (Pomodoro technique): MOT-25.

## Contested and open

- **Rewards and intrinsic motivation.** A meta-analysis found rewards had little overall harm to intrinsic motivation ([Cameron 1994][cameron1994]); the later meta-analysis found reliable undermining by expected tangible rewards ([Deci 1999][deci1999]), and the debate went on in published comments ([Lepper 1999][lepper1999]). Both sides agree that verbal feedback does not harm and that unexpected rewards matter little.
- **Mindset.** Whether growth mindset interventions work at all is disputed between [Macnamara 2023][macnamara2023] (no effect after bias correction) and [Burnette 2023][burnette2023] (small, heterogeneous effects for targeted groups); the foundational praise study did not replicate in China ([Li 2019][li2019]).
- **Grit.** Grit is barely distinct from conscientiousness and only moderately related to performance; its perseverance facet carries what predictive value it has ([Credé 2017][crede2017]).
- **Expressive writing for exams.** Original positive trials ([Ramirez 2011][ramirez2011]) against a null classroom test ([Myers 2021][myers2021]).
- **Affect dynamics.** The confusion-frustration-boredom path ([D'Mello 2012][dmello2012]) has not always matched data, and [Baker 2010][baker2010] found frustration less harmful than expected.
- **Breaks.** Fixed breaks gave less fatigue than self-chosen ones in one study ([Biwer 2023][biwer2023]); a 2025 follow-up from the same group reportedly found fatigue rising faster with fixed breaks (known only from a search summary; the paper was not located).
- **Scaling.** Brief motivation interventions with medium effects in single trials shrink sharply at scale ([Kizilcec 2020][kizilcec2020]; [Oreopoulos 2019][oreopoulos2019]); randomised designs give smaller effects than quasi-experiments ([Lazowski 2016][lazowski2016]).
- **Measurement.** Motivation and emotions are mostly self-reported on questionnaires; most findings in MOT-1, MOT-4, MOT-9 and MOT-20 are correlational, and direction is often unclear.

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor included; the synthesis decides what the app does.

1. **Build competence the student can see.** Self-efficacy grows mainly from one's own successes (MOT-4), and enjoyment and achievement feed each other (MOT-9). A tutor that lets the Student succeed at a task just within reach, and makes that progress visible against their own past, supports both. Comparing with other students works against it (MOT-17).
2. **Support autonomy, not compliance.** Offer a few real choices (what to practise next, which example), give the reason for a hard task, and acknowledge that it is hard (MOT-2). Do not rely on rewards for work the Student already finds interesting (MOT-3).
3. **Connect the material to the Student's goals.** A short prompt to say what a topic is useful for raises interest, especially for those who expect to struggle (MOT-5), but expect small effects at scale.
4. **Treat confusion as a signal, not a failure.** Let the Student stay with an impasse long enough to resolve it, and step in before confusion becomes frustration and boredom (MOT-14). Boredom is the state to watch for most: it persists and leads to disengagement such as asking for the answer (MOT-15). Boredom can mean the work is too easy or too hard (MOT-8, MOT-16).
5. **Praise the process, sincerely and specifically.** Comment on strategies and effort tied to the task, not on the person, and avoid inflated praise (MOT-17, LS-21). Do not rely on mindset messages to raise achievement (MOT-18).
6. **Lower exam anxiety through preparation and framing.** Regular low-stakes retrieval makes knowledge hold up under stress (MOT-12, LS-6). Near an exam, framing nerves as normal and useful can help first-time exam takers (MOT-11). Severe anxiety is a matter for treatment, not for a tutor (MOT-11).
7. **Help the Student plan, then build a routine.** If-then plans for when and where to study (MOT-22), repeated in a stable context, form a habit over weeks, and a missed day does not undo it (MOT-23). Streak mechanics that punish a single missed day contradict this, and game elements fade (MOT-19).
8. **Do not count on reminders.** Generic nudges rarely change outcomes (MOT-24); a well-timed message that changes how the Student reads their situation can (MOT-11).
9. **Keep sessions short and spaced for memory, not for attention.** No fixed attention limit or depletable willpower supports a hard cap on session length (MOT-25); spacing (LS-8) and planned short breaks do.

**Conflicts with other fields.** The practice that learning science favours feels harder and less productive (LS-23), which lowers felt control and enjoyment (MOT-8, MOT-9): a tutor has to keep difficulty desirable without letting it become hopelessness or boredom. Choice (MOT-2) conflicts with spacing and interleaving schedules when students choose massed practice of what they already know (LS-8, LS-10); the metacognition report (AM) covers why students choose badly. Feedback that names errors (LS-20, LS-22) has to be delivered in a way that keeps the Student's sense of competence (MOT-4, MOT-17). How a human tutor balances these moment to moment is the subject of the human tutoring report (TUT).

## Sources

Links go to the DOI where one exists. Abstracts were read through PubMed, Crossref, or repository and publisher pages found by web search.

**Verified** (abstract or text checked): [Agarwal 2014][agarwal2014], [Baker 2010][baker2010], [Biwer 2023][biwer2023], [Bradbury 2016][bradbury2016], [Brady 2018][brady2018], [Brummelman 2014][brummelman2014], [Burnette 2023][burnette2023], [Camacho-Morles 2021][camachomorles2021], [Credé 2017][crede2017], [Deci 1999][deci1999], [Fong 2015][fong2015], [Gollwitzer 2006][gollwitzer2006], [Gunderson 2013][gunderson2013], [Hagger 2016][hagger2016], [Harackiewicz 2016][harackiewicz2016], [Henderlong 2002][henderlong2002], [Howard 2021][howard2021], [Hulleman 2009][hulleman2009], [Huntley 2019][huntley2019], [Kamins 1999][kamins1999], [Kim 2015][kim2015], [Kizilcec 2020][kizilcec2020], [Lally 2010][lally2010], [Lazowski 2016][lazowski2016], [Li 2019][li2019], [Loderer 2020][loderer2020], [Macnamara 2023][macnamara2023], [Martin 2008][martin2008], [Mueller 1998][mueller1998], [Myers 2021][myers2021], [Oreopoulos 2019][oreopoulos2019], [Patall 2008][patall2008], [Pekrun 2017][pekrun2017], [Ramirez 2011][ramirez2011], [Richardson 2012][richardson2012], [Rodrigues 2022][rodrigues2022], [Rozental 2018][rozental2018], [Ryan 2000][ryan2000], [Sailer 2020][sailer2020], [Singh 2024][singh2024], [Sisk 2018][sisk2018], [Smith 2016][smith2016], [Steel 2007][steel2007], [Tze 2016][tze2016], [Usher 2008][usher2008], [van Eerde 2018][vaneerde2018], [Walton 2011][walton2011], [Wang 2021][wang2021], [Yeager 2019][yeager2019], [Zhang 2023][zhang2023].

**Located** (exists, content not checked): [Bandura 1977][bandura1977], [Cameron 1994][cameron1994], [Csikszentmihalyi 1990][csikszentmihalyi1990] (book), [D'Mello 2012][dmello2012], [D'Mello 2014][dmello2014] (findings checked only through press coverage), [Fiorella 2020][fiorella2020], [Hanus 2015][hanus2015] (findings checked only through secondary summaries), [Hidi 2006][hidi2006], [Jamieson 2010][jamieson2010], [Lepper 1999][lepper1999], [Pekrun 2006][pekrun2006], [Reeve 2021][reeve2021], [Su 2011][su2011], [Wigfield 2000][wigfield2000], [Wilson 2007][wilson2007].

**From memory**: none. Two statements rest on the model's knowledge without a checked source: that the worry component carries test anxiety's effect (MOT-10), and the 2025 follow-up on breaks (Contested), which only a search summary describes.

[agarwal2014]: https://doi.org/10.1016/j.jarmac.2014.07.002
[baker2010]: https://doi.org/10.1016/j.ijhcs.2009.12.003
[bandura1977]: https://doi.org/10.1037/0033-295X.84.2.191
[biwer2023]: https://doi.org/10.1111/bjep.12593
[bradbury2016]: https://doi.org/10.1152/advan.00109.2016
[brady2018]: https://doi.org/10.1037/edu0000219
[brummelman2014]: https://doi.org/10.1177/0956797613514251
[burnette2023]: https://doi.org/10.1037/bul0000368
[camachomorles2021]: https://doi.org/10.1007/s10648-020-09585-3
[cameron1994]: https://doi.org/10.2307/1170677
[crede2017]: https://doi.org/10.1037/pspp0000102
[csikszentmihalyi1990]: https://search.worldcat.org/search?q=ti%3AFlow+au%3ACsikszentmihalyi+optimal+experience
[deci1999]: https://doi.org/10.1037/0033-2909.125.6.627
[dmello2012]: https://doi.org/10.1016/j.learninstruc.2011.10.001
[dmello2014]: https://doi.org/10.1016/j.learninstruc.2012.05.003
[fiorella2020]: https://doi.org/10.1007/s10648-020-09525-1
[fong2015]: https://doi.org/10.1080/17439760.2014.967799
[gollwitzer2006]: https://doi.org/10.1016/S0065-2601(06)38002-1
[gunderson2013]: https://doi.org/10.1111/cdev.12064
[hagger2016]: https://doi.org/10.1177/1745691616652873
[hanus2015]: https://doi.org/10.1016/j.compedu.2014.08.019
[harackiewicz2016]: https://doi.org/10.1037/pspp0000075
[henderlong2002]: https://doi.org/10.1037/0033-2909.128.5.774
[hidi2006]: https://doi.org/10.1207/s15326985ep4102_4
[howard2021]: https://doi.org/10.1177/1745691620966789
[hulleman2009]: https://doi.org/10.1126/science.1177067
[huntley2019]: https://doi.org/10.1016/j.janxdis.2019.01.007
[jamieson2010]: https://doi.org/10.1016/j.jesp.2009.08.015
[kamins1999]: https://doi.org/10.1037/0012-1649.35.3.835
[kim2015]: https://doi.org/10.1016/j.paid.2015.02.038
[kizilcec2020]: https://doi.org/10.1073/pnas.1921417117
[lally2010]: https://doi.org/10.1002/ejsp.674
[lazowski2016]: https://doi.org/10.3102/0034654315617832
[lepper1999]: https://doi.org/10.1037/0033-2909.125.6.669
[li2019]: https://doi.org/10.1037/xge0000669
[loderer2020]: https://doi.org/10.1016/j.learninstruc.2018.08.002
[macnamara2023]: https://doi.org/10.1037/bul0000352
[martin2008]: https://doi.org/10.1016/j.jsp.2007.01.002
[mueller1998]: https://doi.org/10.1037/0022-3514.75.1.33
[myers2021]: https://doi.org/10.1186/s41235-021-00309-x
[oreopoulos2019]: https://www.nber.org/papers/w26059
[patall2008]: https://doi.org/10.1037/0033-2909.134.2.270
[pekrun2006]: https://doi.org/10.1007/s10648-006-9029-9
[pekrun2017]: https://doi.org/10.1111/cdev.12704
[ramirez2011]: https://doi.org/10.1126/science.1199427
[reeve2021]: https://doi.org/10.1080/00461520.2020.1862657
[richardson2012]: https://doi.org/10.1037/a0026838
[rodrigues2022]: https://doi.org/10.1186/s41239-021-00314-6
[rozental2018]: https://doi.org/10.3389/fpsyg.2018.01588
[ryan2000]: https://doi.org/10.1037/0003-066X.55.1.68
[sailer2020]: https://doi.org/10.1007/s10648-019-09498-w
[singh2024]: https://doi.org/10.3390/healthcare12232488
[sisk2018]: https://doi.org/10.1177/0956797617739704
[smith2016]: https://doi.org/10.1126/science.aah5067
[steel2007]: https://doi.org/10.1037/0033-2909.133.1.65
[su2011]: https://doi.org/10.1007/s10648-010-9142-7
[tze2016]: https://doi.org/10.1007/s10648-015-9301-y
[usher2008]: https://doi.org/10.3102/0034654308321456
[vaneerde2018]: https://doi.org/10.1016/j.edurev.2018.09.002
[walton2011]: https://doi.org/10.1126/science.1198364
[wang2021]: https://doi.org/10.3389/fpsyg.2021.565202
[wigfield2000]: https://doi.org/10.1006/ceps.1999.1015
[wilson2007]: https://doi.org/10.1177/009862830703400202
[yeager2019]: https://doi.org/10.1038/s41586-019-1466-y
[zhang2023]: https://doi.org/10.3389/fpsyg.2023.1270642
