# Intelligent tutoring systems

- **Field**: intelligent tutoring systems (ITS), artificial intelligence in education, educational data mining and learning engineering: software that models what a learner knows and adapts instruction to it.
- **Scope**: how much such systems help and under which conditions; the large deployments (Cognitive Tutor, AutoTutor, ASSISTments, Mindspark); the Knowledge-Learning-Instruction framework and knowledge components; step-based tutoring, feedback, hints, help seeking and gaming the system; learner models, mastery learning and review scheduling in software; what failed and why. Retrieval, spacing and worked examples as such belong to the learning science report (`LS-`), learner models as assessment and help seeking as self-regulation to report AM (`AM-`), boredom and confusion to report MOT (`MOT-`); this report cites their ids. Human tutoring is report TUT, LLM tutors are report LLM.
- **Date**: 2026-11-26.
- **Outline started from**: what a handbook chapter on ITS covers: Anderson et al. 1995, Koedinger et al. 1997, Corbett & Anderson 1995 and 2001, Ritter et al. 2007, Pane et al. 2014 (Cognitive Tutor, model tracing, knowledge tracing); Graesser et al. 2005, VanLehn et al. 2007, Nye, Graesser & Hu 2014 (AutoTutor and dialogue); Heffernan & Heffernan 2014, Feng et al. 2009, Roschelle et al. 2016 (ASSISTments); VanLehn 2006 and 2011, Kulik & Fletcher 2016, Ma et al. 2014, Steenbergen-Hu & Cooper 2013 and 2014 (effect sizes); Koedinger, Corbett & Perfetti 2012, Nathan & Koedinger 2000, Koedinger et al. 2013 (KLI, knowledge components, data-driven redesign); Aleven et al. 2003 and 2016, Roll et al. 2011, Baker et al. 2004 and 2006, Beck & Gong 2013, Mathan & Koedinger 2005, Aleven & Koedinger 2002, Salden et al. 2010 (step-based tutoring, help seeking, gaming, wheel-spinning); Pavlik et al. 2009, Beck & Chang 2007, Baker et al. 2008, Pelánek 2017, Settles & Meeder 2016, Lindsey et al. 2014, Tabibian et al. 2019, Doroudi et al. 2019 (learner models, mastery, scheduling); Koedinger et al. 2015 (doer effect); Dynarski et al. 2007, Muralidharan et al. 2019, Escueta et al. 2020 (large trials). The search added Létourneau et al. 2025, Leite et al. 2025, Lyu et al. 2026, Ye et al. 2022, Su et al. 2023, the open FSRS benchmark, Holstein et al. 2018 and Long & Aleven 2017.
- **Search tools**: OpenAlex API (abstracts, the most useful tool), Crossref API (DOIs, some abstracts), arXiv API (preprints), web search and web fetch (abstract summaries, report pages, the FSRS benchmark). About 30 search calls in all, not counting DOI batch lookups.
- **Could not reach**: Consensus (the plan's usage for this billing period was used up at the first call); Elicit, PubMed and alphaXiv were not used, since earlier reports found Elicit without API access and little of this field is in PubMed, and the arXiv API covered the preprints. Springer LNCS conference papers (AIED, ITS, UM) have no abstracts in OpenAlex or Crossref, so most of them are **located**; full texts behind paywalls, so effect sizes come from abstracts; the IOS Press page of the example-tracing paper refused automated access; a PDF of Koedinger et al. 1997 was fetched but could not be read without a PDF tool.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Effect sizes are standardised mean differences (_d_ or _g_; 0.2 small, 0.5 medium, 0.8 large; σ is the same unit). Most ITS evidence comes from mathematics, physics, programming and language vocabulary, from school pupils and undergraduates in the US; claims say where a finding has not been shown beyond such domains.

## Claims

### How much tutoring systems help

**ITS-1. Intelligent tutoring systems raise learning over conventional instruction by a small to moderate amount on average, with very wide spread between studies.**
Grade A. Across 50 controlled evaluations the median effect was 0.66 ([Kulik 2016][kulik2016]); across 107 effect sizes, _g_ = 0.42 against teacher-led large-group instruction, 0.57 against other computer instruction and 0.35 against textbooks, across subject areas from algebra to law, medicine and reading ([Ma 2014][ma2014]); for college students _g_ = 0.32 to 0.37 ([Steenbergen-Hu 2014][steenbergenhu2014]); for US school pupils _g_ = 0.27 in a 2025 meta-analysis ([Leite 2025][leite2025]). A 2025 review of 28 school studies found effects generally positive but smaller against non-intelligent computer systems ([Létourneau 2025][letourneau2025]). Boundary: what "ITS" means varies by review; the comparison condition decides much of the size.

**ITS-2. The size of the effect depends heavily on how it is measured: tests written by the developers show large gains, standardised tests and long implementations show small ones.**
Grade A. Improvement depended "to a great extent" on whether locally developed or standardised tests were used ([Kulik 2016][kulik2016]). For school mathematics, effects ranged from _g_ = 0.01 to 0.09, larger for interventions shorter than a school year and smaller for low achievers than for the general population ([Steenbergen-Hu 2013][steenbergenhu2013]); in college, earlier studies showed larger effects than recent ones ([Steenbergen-Hu 2014][steenbergenhu2014]). Boundary: alignment cuts both ways; a test that matches what was taught is fairer to a tutor that teaches a narrow curriculum, and less informative about transfer.

**ITS-3. Tutors that give feedback and help on each step of a solution are almost as effective as human tutors; tutors that only check the final answer are clearly weaker, and finer interaction than the step adds little (the interaction plateau).**
Grade A. In a review of experiments, human tutoring reached _d_ = 0.79 over no tutoring and step-based ITS 0.76, so ITS were nearly as effective; the widely believed 2.0 for human tutoring was not confirmed ([VanLehn 2011][vanlehn2011]). The review's figures for answer-based systems (about 0.3) and for substep-based ones (no better than step-based) are from memory of its full text. A meta-analysis found no significant difference between ITS and individual human tutoring (_g_ = −0.11) ([Ma 2014][ma2014]). Boundary: most comparisons are with novice or non-expert human tutors and in well-structured domains; college meta-analysis found human tutoring still ahead ([Steenbergen-Hu 2014][steenbergenhu2014]).

**ITS-4. A tutoring dialogue in natural language beats reading only when the material is beyond what the learner can handle alone; at the learner's level, a well-written text does as well.**
Grade B. In seven physics experiments covering the same content, human and computer tutorial dialogue beat reading with large effects when novices studied material written for intermediates, but not when the material matched their preparation ([VanLehn 2007][vanlehn2007]). Boundary: qualitative physics, college students; the systems were scripted dialogue tutors, not LLMs.

### Systems and deployments

**ITS-5. Cognitive Tutors model the skills of a domain as small rules (model tracing), check each student step against them, and give short immediate feedback; in the best cases students reached the same level in a third of the time.**
Grade B. Ten years of tutors for programming, geometry and algebra built on ACT theory showed usually, not always, significant gains; students learned in production-rule units, and the tutors worked better presented as tools than as imitations of human tutors ([Anderson 1995][anderson1995]). Used in Pittsburgh city schools as part of a whole algebra curriculum, the tutor raised learning, with a high share of low-income pupils ([Koedinger 1997][koedinger1997]). At scale, in a randomised trial across seven states, Cognitive Tutor Algebra I had no effect in the first year and a positive one in the second, about eight percentile points, significant in high schools only ([Pane 2014][pane2014]). Boundary: algebra and geometry; the curriculum and teacher training come with the software, so the tutor's own share is unclear ([Ritter 2007][ritter2007]).

**ITS-6. Conversational tutors that steer the learner's own explanation toward a set of expected ideas and correct anticipated misconceptions (expectation and misconception tailored dialogue, as in AutoTutor) produce learning gains across subjects.**
Grade B. Seventeen years of AutoTutor research report gains in computer literacy, physics and critical thinking, from co-constructed explanations, deep-reasoning questions and adapting to the emotions of low-knowledge learners; content mattered more than the voice or persona of the animated agent ([Nye 2014][nye2014]); its authors report gains on par with novice and expert human tutors ([Graesser 2016][graesser2016]). The family includes tutors for reading strategies ([Graesser 2005][graesser2005]). Boundary: mostly the developers' own studies; the "on par with humans" claim rests on comparisons ITS-4 qualifies.

**ITS-7. Homework with immediate feedback and hints, plus a report on each pupil's work for the teacher (ASSISTments), raised end-of-year standardised scores in a large randomised trial, most for low achievers.**
Grade B. In 43 Maine schools and 2,850 seventh graders, the online homework tool with teacher training raised scores on a state standardised mathematics test over existing homework practice; students with low prior achievement benefited most ([Roschelle 2016][roschelle2016]). A replication in 63 North Carolina schools reported a positive effect a year later ([Feng 2023][feng2023]). The platform lets researchers run randomised experiments inside teachers' regular assignments, in several subjects ([Heffernan 2014][heffernan2014]). Boundary: one subject and grade level; the teacher report is part of the treatment.

**ITS-8. Adaptive practice software that pitches each item at the pupil's actual level can produce large gains where pupils are far behind their grade.**
Grade B. In urban India, a lottery for an after-school program built on personalised software raised scores by 0.37σ in mathematics and 0.23σ in Hindi in 4.5 months, with similar absolute gains for all and much greater relative gains for weaker pupils ([Muralidharan 2019][muralidharan2019]). A review of experiments places adaptive computer-assisted learning among the more effective education technologies, more in mathematics than in reading ([Escueta 2020][escueta2020]). Boundary: the Indian pupils were several grades behind, where pitching at the right level matters most; the program included group instruction.

### Knowledge components and the KLI framework

**ITS-9. Learning can be analysed in units of knowledge components (KCs): pieces of knowledge, from facts to rules to principles, that a learner acquires separately and that explain performance across tasks; which kind of instruction helps depends on the kind of KC (the Knowledge-Learning-Instruction framework).**
Grade C (framework). KLI links instructional events to learning events and to knowledge changes, with three classes of learning: memory and fluency processes, induction and refinement processes, and understanding and sense-making processes; each leads to different instructional choices ([Koedinger 2012][koedinger2012]). Cognitive Tutor students learned in rule-sized units ([Anderson 1995][anderson1995]). Boundary: a framework for organising findings; KC models are built and tested mainly in structured domains.

**ITS-10. Experts are poor judges of which KCs a task needs and what is hard for novices (expert blind spot), so KC models built from student data beat those written from expertise.**
Grade B. Teachers and researchers ranked algebra problems by expected difficulty in a way that deviated systematically from students' actual performance; high-school teachers, with the most training, predicted worst ([Nathan 2000a][nathan2000a]; [Nathan 2000b][nathan2000b]). Students solved simple story problems better than the matching equations, the opposite of what practitioners believed ([Koedinger 2004][koedinger2004]). A tutor unit redesigned from data-driven KC discovery let students reach mastery more efficiently ([Koedinger 2013][koedinger2013]); a 2026 replication on four units chosen by topic found no difference in learning gains but more productive time and more mastered skills ([Lyu 2026][lyu2026]). Boundary: mathematics data; requires many students' logs.

### Step-based tutoring, feedback and hints

**ITS-11. Immediate feedback on each step makes practice efficient; what the feedback holds the learner to matters more than its timing, and letting learners catch some of their own errors can deepen understanding.**
Grade B. With a programming tutor, immediate feedback and correction gave the fastest learning, and all tutored groups did equally well on tests; students needed guidance to benefit from more control ([Corbett 2001b][corbett2001c]). Feedback based on an "intelligent novice" model, which let students make reasonable errors and then detect and correct them, gave deeper conceptual understanding and better transfer and retention ([Mathan 2005][mathan2005]). Explanatory feedback beats right-or-wrong (LS-22); errors help when corrected (LS-20). Boundary: spreadsheet and programming skills; small studies.

**ITS-12. Prompting students to explain their steps inside a tutor raises understanding and transfer at little cost.**
Grade B. Students who explained their steps, by naming the rule they used in a geometry Cognitive Tutor, learned with greater understanding and did better on transfer problems than students who did not ([Aleven 2002][aleven2002]); self-explanation in general, LS-12. Boundary: explanation by selecting a rule from a glossary; two classroom studies.

**ITS-13. Worked examples inside a tutor, faded as the learner's skill grows, help novices learn with less time; the gain disappears as expertise rises.**
Grade B. Cognitive Tutor studies tested fading worked examples adapted to each student's expertise ([Salden 2010][salden2010]); providing worked examples was among the strongest moderators of ITS effects in US schools ([Leite 2025][leite2025]). See LS-15, LS-16, LS-17. Boundary: the adaptive-over-fixed fading advantage comes from secondary summaries.

**ITS-14. On-demand hints help only so much: learners often use them badly, and teaching better help seeking changes how they use help but not how much they learn.**
Grade B. A tutor agent that gave feedback on help seeking made students use help more deliberately, even after the feedback stopped, without better domain learning ([Aleven 2016][aleven2016]; [Roll 2011][roll2011]). Hints typically run from a general prompt to a final hint that gives the step away (the bottom-out hint), and students who avoid help or skip to that last hint learn less (AM-26). Boundary: mathematics tutors; principle-based hints.

**ITS-15. Some students exploit the system to get answers without thinking (gaming the system: rapid guessing, clicking through hints), learn markedly less, and do it most on the steps they do not know; a tutor can detect gaming and respond.**
Grade B. Gaming went with poorer learning in the Cognitive Tutor ([Baker 2004][baker2004]); boredom precedes it (MOT-15). A tutor that detected gaming, gave supplementary exercises on the skipped material and showed an agent's displeasure reduced gaming, and gaming students who received many exercises learned considerably better ([Baker 2006][baker2006]). Boundary: detectors are trained per system from labelled logs.

### Learner models, mastery and scheduling

**ITS-16. Mastery learning in software tracks a probability that the learner knows each KC and keeps giving practice on it until that estimate passes a threshold (cognitive mastery), which individualises how much practice each learner gets.**
Grade B. Knowledge tracing updates this estimate after each step (AM-9; [Corbett 2001][corbett2001]); mastery learning in general raises course results at a cost in time (AM-8). Logistic models over practice counts (performance factors analysis) are a common alternative that handles several skills per step ([Pavlik 2009][pavlik2009]). Boundary: a threshold near 95% is the usual Cognitive Tutor setting (from memory).

**ITS-17. For mastery decisions, which data are used and where the threshold is set matter more than which learner model computes the estimate; model parameters can be unidentifiable from data.**
Grade B. With simulated and real data, the choice of data sources and the threshold mattered more than the modelling technique, and a simple moving average worked well ([Pelánek 2017][pelanek2017]). Deep models predict little better than well-specified simple ones (AM-10). Different BKT parameters can fit the same data equally well ([Beck 2007][beck2007]), and estimating guess and slip from context improves the model ([Baker 2008][baker2008]). Boundary: well-specified single KCs.

**ITS-18. Some learners fail to master a KC within about ten practice opportunities and rarely master it later (wheel-spinning); more of the same practice does not help them.**
Grade B. Wheel-spinning, defined as not reaching three correct answers in a row within ten opportunities, affected a substantial share of student-skill pairs in ASSISTments and Cognitive Tutor data ([Beck 2013][beck2013]). Boundary: the definition is tied to that mastery rule; the share was not checked here.

**ITS-19. Review scheduled from a model of each learner's memory beats fixed schedules for retention, and models trained on large review logs predict recall better than rule-based schedulers.**
Grade B. In a semester-long middle-school language course, personalised review gave 16.5% better retention than massed study and 10.0% better than one-size-fits-all spacing ([Lindsey 2014][lindsey2014]). Scheduling as optimal control ([Tabibian 2019][tabibian2019]) and memory models fitted to 220 million review logs cut review cost ([Ye 2022][ye2022]; [Su 2023][su2023]); in an open benchmark on about 350 million Anki reviews, fitted models (FSRS, and recurrent networks best) predict recall far better than a constant-retention baseline ([FSRS benchmark][fsrsbench]). Spacing itself, LS-8 and LS-9; forgetting in learner models, AM-11. Boundary: vocabulary and flashcard facts; better prediction is not yet shown to mean better learning beyond the Lindsey trial.

**ITS-20. Choosing the next activity by reinforcement learning beats simple sequencing in about half of studies, mostly when the policy is constrained by learning theory.**
Grade B. Over half of empirical comparisons found RL policies significantly better than baselines; RL succeeded most when constrained with ideas from cognitive psychology, and robust offline analyses helped where models were limited ([Doroudi 2019][doroudi2019]). Boundary: most studies sequence short, well-defined tasks.

### Learning engineering

**ITS-21. In online courses, doing interactive practice is associated with far more learning than watching or reading more (the doer effect).**
Grade B. In a psychology MOOC, a 1 SD increase in activities done was associated with more than six times the learning benefit of extra watching or reading, with causal-inference methods supporting a causal reading ([Koedinger 2015][koedinger2015]). Boundary: observational; one course family. Fits generation (LS-3).

**ITS-22. Tutors work through the people around them: showing teachers live data from the tutor improved learning, and so did showing students their own learner model when combined with self-assessment.**
Grade C. A mixed-reality tool that showed teachers real-time tutor analytics improved learning and narrowed the gap between students of different prior ability ([Holstein 2018][holstein2018]); college ITS effects point to the role of teachers ([Steenbergen-Hu 2014][steenbergenhu2014]); ASSISTments' teacher reports are part of its effect (ITS-7). An open learner model supporting self-assessment and shared problem selection was tested in two classroom experiments with 302 pupils, with better post-tests reported in secondary sources ([Long 2017][long2017]). Boundary: findings from summaries, not full texts; motivation from being watched may explain the teacher-tool effect.

### What failed and why

**ITS-23. Large independent trials of commercial tutoring software often found no effect, mainly where use was light or the product sat beside an unchanged curriculum.**
Grade A. In a national randomised trial of reading and mathematics software in 132 schools, test scores were not significantly higher in classrooms using the products ([Dynarski 2007][dynarski2007]); a second year found no significant difference overall, with one product positive ([Campuzano 2009][campuzano2009]). Cognitive Tutor showed nothing in its first implementation year (ITS-5). Boundary: products varied in how adaptive they were; usage was often far below plan.

**ITS-24. Hand-built tutors were expensive to author, so they covered few, well-structured domains.**
Grade C. Model-tracing tutors historically took about 200 to 300 hours of development per hour of instruction (from memory, also cited in secondary sources); example-tracing authoring tools cut this by a factor of 4 to 8 against historical estimates ([Aleven 2009][aleven2009]). Hence the concentration on algebra, geometry, physics and programming, with dialogue tutors (ITS-6) and adaptive practice (ITS-8, ITS-19) the main routes into other subjects. Boundary: cost figures are estimates, not controlled measures.

**ITS-25. Making the tutor look or act more human added little: persona, voice and richer dialogue mattered less than content, the step-level interaction and the learner's preparation.**
Grade B. Content mattered more than the voice or persona of AutoTutor's agent ([Nye 2014][nye2014]); Cognitive Tutors worked better presented as tools than as humans ([Anderson 1995][anderson1995]); finer interaction than the step gave no gain (ITS-3), and dialogue beat text only for material beyond the learner (ITS-4). Adapting to learning styles was not among what worked (LS-28). Boundary: pre-LLM dialogue systems, whose language ability was limited.

## Terms

Research name, with the everyday name in brackets where they differ.

- Intelligent tutoring system, ITS (adaptive tutor); computer-assisted instruction, CAI (answer-checking drill software): ITS-1, ITS-3.
- Step-based vs answer-based tutoring (checking each step vs only the final answer); interaction granularity, interaction plateau: ITS-3.
- Inner loop (help within a problem) and outer loop (choosing the next problem) ([VanLehn 2006][vanlehn2006]): ITS-11 to ITS-20.
- Model tracing (checking each step against a model of correct and buggy rules); production rule (one if-then skill): ITS-5.
- Expectation and misconception tailored dialogue (steering the student's explanation): ITS-6.
- Knowledge component, KC (one skill, fact or principle); Knowledge-Learning-Instruction framework, KLI; learning curve (error rate falling with practice): ITS-9, ITS-10.
- Expert blind spot (experts forgetting what is hard): ITS-10. Cognitive task analysis, data-driven redesign: ITS-10.
- Bottom-out hint (the hint that gives the answer away); help seeking, help abuse, help avoidance: ITS-14.
- Gaming the system (clicking through to the answer): ITS-15. Wheel-spinning (stuck practising without progress): ITS-18.
- Knowledge tracing, Bayesian knowledge tracing, BKT; performance factors analysis, PFA; item response theory, IRT; deep knowledge tracing, DKT (what the system thinks you know): ITS-16, ITS-17, AM-9, AM-10.
- Cognitive mastery, mastery threshold (don't move on until you've got it): ITS-16, ITS-17.
- Memory model, half-life regression, FSRS (the spaced repetition algorithm in flashcard apps): ITS-19.
- Instructional sequencing, reinforcement learning (choosing what comes next): ITS-20.
- Doer effect (learning by doing): ITS-21. Open learner model (showing you your progress map): ITS-22.

## Contested and open

- **How large the ITS effect is.** Median 0.66 in one review ([Kulik 2016][kulik2016]), 0.01 to 0.09 for school mathematics in another ([Steenbergen-Hu 2013][steenbergenhu2013]), about 0.3 in recent school and college meta-analyses. Test alignment, duration and comparison condition explain much of the gap (ITS-2); the "two sigma" of human tutoring that early tutor work aimed at ([Corbett 2001][corbett2001]) is itself larger than controlled studies find (ITS-3; report TUT).
- **Low achievers.** Larger relative gains for weaker pupils in ASSISTments and Mindspark (ITS-7, ITS-8), smaller effects for low achievers in the school mathematics meta-analysis (ITS-2).
- **Whether data-driven redesign generalises.** Efficiency gains on chosen units ([Koedinger 2013][koedinger2013]), no gain in learning on units chosen by topic ([Lyu 2026][lyu2026]).
- **Feedback timing.** Immediate feedback is most efficient for skill practice (ITS-11); for errors the learner could catch and for conceptual learning, the case for some delay or self-correction is open (ITS-11, LS-19).
- **Prediction versus learning.** Better-predicting learner and memory models (ITS-17, ITS-19, AM-10) are rarely tested for whether learners learn more; threshold and data choices matter more (ITS-17).
- **Sampling.** Most controlled evidence is from US mathematics, physics and programming classrooms and from vocabulary apps; open-ended subjects such as history, law or writing appear in meta-analyses but with few studies each.

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor included; the synthesis decides what the app does.

1. **Tutor the steps, not only the answer.** The gain of ITS over answer checking comes from responding to each step of the learner's work (ITS-3); a tutor that only grades final answers forgoes most of it. Richer conversation beyond the step adds little by itself (ITS-3, ITS-25).
2. **Pitch the material at the learner's level.** Dialogue helps most where the material is just beyond the learner (ITS-4); adaptive practice gains most where learners are behind (ITS-8). At the learner's level, a good text or example may be as good as dialogue, and cheaper in the learner's time.
3. **Plan in knowledge components, and do not trust intuition about what is hard.** Expert-written decompositions miss what novices find hard (ITS-10); evidence from the Student's own Attempts should revise the decomposition and the estimate (ITS-9, ITS-16).
4. **Make mastery decisions from evidence, with a sensible threshold and a stop rule.** Several Attempts per KC, decay over time (AM-11), and a threshold chosen with care matter more than model sophistication (ITS-17). When a Student is not progressing after many attempts, change the instruction, such as a worked example, a prerequisite or an explanation, rather than giving more of the same (ITS-18, ITS-13).
5. **Ask for explanations and use worked examples for novices.** Self-explanation prompts and faded examples are among the cheapest proven additions (ITS-12, ITS-13).
6. **Design help so it cannot be mined for answers, and notice when it is.** Graded hints ending in a bottom-out hint invite gaming (ITS-14, ITS-15); a tutor that sees rapid help requests or guessing can respond with extra practice on the skipped step rather than with the answer (ITS-15). Teaching help seeking alone does not raise learning (ITS-14).
7. **Schedule Reviews from a memory model.** Personalised review beats fixed spacing (ITS-19); a fitted model of forgetting is a proven part of the tutoring loop for facts and vocabulary, less tested for skills.
8. **Expect small effects at scale, and measure against the real exam.** Large gains on tutor-aligned tests shrink on independent ones (ITS-2, ITS-23); effects depend on use and on fitting into the learner's actual course (ITS-5, ITS-23). Showing progress data to the Student, or to a teacher where there is one, can help (ITS-22).
9. **Do not invest in seeming human.** Persona and voice matter less than content and the step-level loop (ITS-25).

**Conflicts with other fields.** Immediate step feedback (ITS-11) pulls against learning science's case for struggle before help (LS-19) and desirable difficulties (LS-23). Mastery loops (ITS-16) pull against interleaving and spacing across topics (LS-8, LS-10), as in report AM. Detecting gaming and wheel-spinning (ITS-15, ITS-18) touches report MOT: both follow boredom and frustration (MOT-15), so the response is also motivational. Pitching dialogue at material beyond the learner (ITS-4) must be weighed against cognitive load (report UX). LLM tutors change the cost of authoring (ITS-24) and the language limits behind ITS-4 and ITS-25; report LLM covers whether the findings carry over.

## Sources

Links go to the DOI where one exists, else to the page that was read. Statuses rest on the abstracts read when the source was found.

**Verified** (abstract or text checked): [Aleven 2002][aleven2002], [Aleven 2016][aleven2016], [Anderson 1995][anderson1995], [Baker 2006][baker2006] (abstract quoted in a search result), [Campuzano 2009][campuzano2009] (report summary page), [Corbett 2001b][corbett2001c], [Doroudi 2019][doroudi2019], [Dynarski 2007][dynarski2007] (report summary page), [FSRS benchmark][fsrsbench] (repository page; a benchmark, not peer reviewed), [Graesser 2016][graesser2016], [Heffernan 2014][heffernan2014], [Koedinger 2004][koedinger2004], [Koedinger 2012][koedinger2012], [Koedinger 2015][koedinger2015], [Kulik 2016][kulik2016], [Leite 2025][leite2025] (preprint), [Létourneau 2025][letourneau2025], [Lindsey 2014][lindsey2014], [Lyu 2026][lyu2026] (preprint, accepted at AIED 2026), [Ma 2014][ma2014], [Mathan 2005][mathan2005], [Muralidharan 2019][muralidharan2019], [Nathan 2000a][nathan2000a], [Nathan 2000b][nathan2000b], [Nye 2014][nye2014], [Pane 2014][pane2014], [Pavlik 2009][pavlik2009] (that PFA is an alternative to KT; its multi-skill advantage from the abstract's stated aim), [Pelánek 2017][pelanek2017], [Roschelle 2016][roschelle2016], [Steenbergen-Hu 2013][steenbergenhu2013], [Steenbergen-Hu 2014][steenbergenhu2014], [Su 2023][su2023], [Tabibian 2019][tabibian2019], [VanLehn 2007][vanlehn2007], [VanLehn 2011][vanlehn2011], [Ye 2022][ye2022].

**Located** (exists, content not checked): [Aleven 2009][aleven2009] (the 4 to 8 factor from citing papers), [Baker 2008][baker2008], [Beck 2007][beck2007], [Beck 2013][beck2013] (definition from citing papers), [Corbett 2001][corbett2001], [Escueta 2020][escueta2020] (abstract does not state the finding), [Feng 2023][feng2023] (study page and funder summary; the paper's venue and effect size not confirmed), [Graesser 2005][graesser2005], [Holstein 2018][holstein2018] (findings from the authors' later summaries), [Koedinger 1997][koedinger1997] (finding from the authors' 2015 retrospective), [Koedinger 2013][koedinger2013] (abstract sentence from a search result only), [Long 2017][long2017] (design from the abstract; outcome from secondary sources), [Ritter 2007][ritter2007], [Roll 2011][roll2011] (its finding through Aleven 2016), [Salden 2010][salden2010], [VanLehn 2006][vanlehn2006].

**From memory**: VanLehn 2011's figures for answer-based and substep-based systems (ITS-3), the 95% mastery threshold (ITS-16) and the 200 to 300 hours of authoring per hour of instruction (ITS-24). Sources shared with other reports ([Baker 2004][baker2004], verified in report AM) carry their status there.

[aleven2002]: https://doi.org/10.1207/s15516709cog2602_1
[aleven2009]: https://content.iospress.com/articles/international-journal-of-artificial-intelligence-in-education/jai19-2-02
[aleven2016]: https://doi.org/10.1007/s40593-015-0089-1
[anderson1995]: https://doi.org/10.1207/s15327809jls0402_2
[baker2004]: https://doi.org/10.1145/985692.985741
[baker2006]: https://doi.org/10.1007/11774303_39
[baker2008]: https://doi.org/10.1007/978-3-540-69132-7_44
[beck2007]: https://doi.org/10.1007/978-3-540-73078-1_17
[beck2013]: https://doi.org/10.1007/978-3-642-39112-5_44
[campuzano2009]: https://ies.ed.gov/ncee/pubs/20094041
[corbett2001]: https://doi.org/10.1007/3-540-44566-8_14
[corbett2001c]: https://doi.org/10.1145/365024.365111
[doroudi2019]: https://doi.org/10.1007/s40593-019-00187-x
[dynarski2007]: https://ies.ed.gov/use-work/resource-library/report/evaluation-report/effectiveness-reading-and-mathematics-software-products-findings-first-student-cohort
[escueta2020]: https://doi.org/10.1257/jel.20191507
[feng2023]: https://ies.ed.gov/use-work/awards/efficacy-assistments-online-homework-support-middle-school-mathematics-learning-replication-study
[fsrsbench]: https://github.com/open-spaced-repetition/srs-benchmark
[graesser2005]: https://doi.org/10.1207/s15326985ep4004_4
[graesser2016]: https://doi.org/10.1007/s40593-015-0086-4
[heffernan2014]: https://doi.org/10.1007/s40593-014-0024-x
[holstein2018]: https://doi.org/10.1007/978-3-319-93843-1_12
[koedinger1997]: https://kilthub.cmu.edu/articles/journal_contribution/Intelligent_Tutoring_Goes_To_School_in_the_Big_City/6470153/1
[koedinger2004]: https://doi.org/10.1207/s15327809jls1302_1
[koedinger2012]: https://doi.org/10.1111/j.1551-6709.2012.01245.x
[koedinger2013]: https://doi.org/10.1007/978-3-642-39112-5_43
[koedinger2015]: https://doi.org/10.1145/2724660.2724681
[kulik2016]: https://doi.org/10.3102/0034654315581420
[leite2025]: https://arxiv.org/abs/2511.04997
[letourneau2025]: https://doi.org/10.1038/s41539-025-00320-7
[lindsey2014]: https://doi.org/10.1177/0956797613504302
[long2017]: https://doi.org/10.1007/s11257-016-9186-6
[lyu2026]: https://arxiv.org/abs/2603.29094
[ma2014]: https://doi.org/10.1037/a0037123
[mathan2005]: https://doi.org/10.1207/s15326985ep4004_7
[muralidharan2019]: https://doi.org/10.1257/aer.20171112
[nathan2000a]: https://doi.org/10.2307/749750
[nathan2000b]: https://doi.org/10.1207/S1532690XCI1802_03
[nye2014]: https://doi.org/10.1007/s40593-014-0029-5
[pane2014]: https://doi.org/10.3102/0162373713507480
[pavlik2009]: https://doi.org/10.3233/978-1-60750-028-5-531
[pelanek2017]: https://doi.org/10.1145/3079628.3079667
[ritter2007]: https://doi.org/10.3758/BF03194060
[roll2011]: https://doi.org/10.1016/j.learninstruc.2010.07.004
[roschelle2016]: https://doi.org/10.1177/2332858416673968
[salden2010]: https://doi.org/10.1007/s11251-009-9107-8
[steenbergenhu2013]: https://doi.org/10.1037/a0032447
[steenbergenhu2014]: https://doi.org/10.1037/a0034752
[su2023]: https://doi.org/10.1109/TKDE.2023.3251721
[tabibian2019]: https://doi.org/10.1073/pnas.1815156116
[vanlehn2006]: https://doi.org/10.3233/IRG-2006-16(3)02
[vanlehn2007]: https://doi.org/10.1080/03640210709336984
[vanlehn2011]: https://doi.org/10.1080/00461520.2011.611369
[ye2022]: https://doi.org/10.1145/3534678.3539081
