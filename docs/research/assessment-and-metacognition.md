# Assessment and metacognition

- **Field**: educational assessment (formative assessment, feedback, testing, question design, mastery learning), learner modelling, and the psychology of metacognition and self-regulated learning.
- **Scope**: how checking what a learner knows changes their learning, how well answers and learners' own judgments reveal what they know, and how learners plan, monitor and evaluate their study. Retrieval practice, spacing and the content of feedback belong to the learning science report and are cited here by their `LS-` ids; motivation, anxiety and habit belong to report MOT; intelligent tutoring systems as a whole to report ITS.
- **Date**: 2026-11-26.
- **Outline started from**: what a textbook chapter or major review covers: Black & Wiliam 1998, Kingston & Nash 2011, Bennett 2011 (formative assessment); Hattie & Timperley 2007, Kluger & DeNisi 1996, Butler 1988, Butler & Winne 1995 (feedback); Bangert-Drowns et al. 1991, Roediger & Marsh 2005, Little et al. 2012, Agarwal 2019 (testing and question design); Bloom 1984, Kulik et al. 1990, Slavin 1987 (mastery learning); Corbett & Anderson 1995, Pavlik & Anderson 2005, Piech et al. 2015, Settles & Meeder 2016, Feng et al. 2009 (estimating knowledge); Kruger & Dunning 1999, Hacker et al. 2000, Koriat 1997, Nelson & Dunlosky 1991, Rhodes & Tauber 2011, Kornell & Bjork 2009, Thiede et al. 2003 (calibration and judgments of learning); Zimmerman 2002, Panadero 2017, Dignath & Büttner 2008, Kornell & Bjork 2007, Bjork, Dunlosky & Kornell 2013, Aleven et al. 2003 (self-regulated learning and help seeking). The search added Yang et al. 2022, Janssen et al. 2024, Lipko et al. 2009, Nederhand et al. 2020, Yan et al. 2022, Corral et al. 2025, the knowledge-tracing comparisons and the LLM comparison.
- **Search tools**: OpenAlex and Crossref APIs (DOIs, abstracts), PubMed (abstracts of the Psychonomic and memory papers), alphaXiv and the arXiv API (knowledge tracing), and web search for abstracts the APIs lacked. About 35 searches.
- **Could not reach**: Consensus (the plan's usage was used up at the first call) and Elicit (the plan has no API access); the Semantic Scholar API answered only "too many requests". Full texts behind paywalls, so effect sizes come from abstracts; where an abstract was missing (several Springer, Elsevier and APA papers), the work is **located**.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Effect sizes are standardised mean differences (_d_ or _g_; 0.2 small, 0.5 medium, 0.8 large) or correlations (_r_). Metacognition research measures accuracy two ways: **calibration** (does confidence match the level of performance, as in "I expect 80%" against 60%) and **resolution** (does confidence rank items correctly, known against unknown, often as a gamma correlation). Most evidence comes from Western university students and school pupils; most metacognition experiments use word pairs and short texts.

## Claims

Ids are stable and are not reused: AM-4, AM-20 and AM-25 were removed as outside the brief, so the numbering has gaps.

### Formative assessment and feedback

**AM-1. Checking learning during instruction and adjusting to it (formative assessment, assessment for learning) improves achievement, but by a small amount, well below the 0.4 to 0.7 often quoted.**
Grade A. The large figures go back to a narrative review ([Black 1998][black1998]). Of more than 300 studies, only 13 allowed effect sizes, with a weighted mean of _d_ = 0.20, larger in language arts (0.32) than in mathematics (0.17) or science (0.09) ([Kingston 2011][kingston2011]); reading across 48 studies and 116,051 pupils _d_ = 0.19, larger in small studies ([Xuan 2022][xuan2022]); an umbrella review of 13 meta-analyses found trivial to large effects and no negative ones ([Sortwell 2024][sortwell2024]). Boundary: "formative assessment" names no well-defined set of practices, so pooled effects mix very different interventions ([Bennett 2011][bennett2011]); almost all studies are K-12.

**AM-2. Feedback that addresses the task, the process or the learner's self-regulation helps; feedback about the person (praise, judgments of ability) helps little or harms, and a grade given with comments cancels the benefit of the comments.**
Grade A for the levels, B for grades. Feedback answers where the learner is going, how they are doing and what to do next, at the level of task, process, self-regulation or self, the last being least effective ([Hattie 2007][hattie2007]); over a third of feedback interventions lower performance, the more so as feedback draws attention to the self (LS-21, [Kluger 1996][kluger1996]). Pupils given comments kept their interest and performance; pupils given grades, or grades with comments, lost both ([Butler 1988][butler1988]). Explaining why an answer is right or wrong beats only marking it (LS-22). Boundary: the grades study is one classroom experiment with fifth and sixth graders; high achievers kept their interest under grades.

**AM-3. Feedback changes learning only when the learner engages with it and acts on it, and many students do not, for lack of strategies, of understanding of the feedback's terms, or of a chance to use it.**
Grade B. Feedback is part of self-regulation: learners interpret it through their own monitoring, and models put monitoring at the centre ([Butler 1995][butler1995]). In higher education students often leave feedback unused; its perceived usefulness drives use, and missing strategies or academic language hinder it ([Jonsson 2012][jonsson2012]). A review of 195 works collects the factors that make learners use feedback and the interventions that promote it, sorted into four recipience processes ([Winstone 2016][winstone2016]). Boundary: mostly surveys and qualitative studies of written coursework feedback.

### Testing and question design

**AM-5. Frequent low-stakes tests during a course raise final exam performance, mainly because recalling is itself practice (the testing effect).**
Grade A. Students who took at least one test during a 15-week term scored about half a standard deviation higher on the final exam than those who took none ([Bangert-Drowns 1991][bangertdrowns1991t]); classroom retrieval practice _g_ = 0.50 (LS-6). Boundary: how the benefit grows with the number of tests was not checked here; mathematics shows smaller effects (LS-6).

**AM-6. Recall questions (short answer, free recall) tend to train memory better than recognition questions (multiple choice), but multiple-choice questions with plausible wrong options can also make students retrieve, and wrong options can stick as false knowledge unless feedback follows.**
Grade B. Meta-analyses find a larger testing effect for recall (LS-6). After multiple-choice tests, students reproduced the lures they had read as answers, the more so the more lures they saw ([Roediger 2005][roediger2005]); feedback removes most of this and adds to the benefit ([Butler 2008][butler2008]). Competitive alternatives made students retrieve why each wrong option was wrong and helped later recall of related information ([Little 2012][little2012]). A randomised study found no difference between very short answer and multiple-choice practice, with more practice errors in the open format ([van Wijk 2024][vanwijk2024]). Boundary: open formats help only when students can retrieve enough of the answer (LS-6, LS-9).

**AM-7. Practice questions transfer to the kind of thinking they ask for: fact questions do not improve performance on application and reasoning questions, while application or mixed questions do.**
Grade B. In middle school and college classes, higher-order and mixed quizzes improved higher-order test performance and fact quizzes did not ([Agarwal 2019][agarwal2019]). Short-answer retrieval helped application questions after three rounds and a week's delay, not after one round and eight minutes ([Corral 2025][corral2025]). Retrieval transfers moderately overall (LS-7). Boundary: few studies, and "higher-order" is defined differently across them.

**AM-8. Requiring a criterion score on each unit before moving on, with corrective work for those below it (mastery learning), raises course exam results, most for weaker students, at the cost of more time.**
Grade A for course exams, contested for standardised tests. Across 108 controlled evaluations, mastery programmes improved examination performance, with stronger effects for weaker students and more time on task ([Kulik 1990][kulik1990]). Mastery learning was the step from conventional teaching towards the two standard deviations of one-to-one tutoring ([Bloom 1984][bloom1984]). A best-evidence synthesis of studies lasting at least four weeks found essentially no effect on standardised achievement tests ([Slavin 1990][slavin1990]; reply in [Guskey 1987][guskey1987]). Boundary: the effect depends on the criterion and on tests that match the units.

### Estimating what a learner knows

**AM-9. A single answer is weak evidence about a skill: learners guess right and slip wrong, so estimates of knowledge combine many answers per skill and treat each as probabilistic.**
Grade C (theory and modelling practice). Knowledge tracing models each skill as known or not, with probabilities of learning at each opportunity, of guessing and of slipping ([Corbett 1995][corbett1995]); later models replace this with logistic models over item difficulty and practice counts and with item response theory ([Pelánek 2017][pelanek2017]; [Desmarais 2011][desmarais2011]). Boundary: the parameters are fitted on many students; for one new learner, early estimates are uncertain (the cold-start problem).

**AM-10. Statistical learner models predict a learner's next answers well, and deep neural models add little over well-specified simpler ones; a general LLM predicts them worse than a small specialised model.**
Grade B. Deep knowledge tracing reported large gains over Bayesian knowledge tracing ([Piech 2015][piech2015]), but BKT extended with recency effects, ability differences and skill similarity matched it ([Khajah 2016][khajah2016]), and a simpler decoder with fewer parameters predicted better than DKT ([Vie 2023][vie2023]). Specialised knowledge-tracing models beat several LLMs at predicting students' answers, at a fraction of the cost and time ([Bhattacharyya 2026][bhattacharyya2026]). Boundary: benchmarks use large logs of closed-format answers on a fixed item bank; the LLM comparison is a single preprint.

**AM-11. An estimate of what a learner knows must include forgetting: models in which memory strength decays with time and grows with spaced practice predict later recall better than models that only count right and wrong.**
Grade B. An activation-based model with power-law decay fitted vocabulary retention and the spacing effect ([Pavlik 2005][pavlik2005]); half-life regression, estimating each word's half-life in a learner's memory, cut prediction error by over 45% against baselines and raised daily engagement by 12% ([Settles 2016][settles2016]). Forgetting is steep at first and slows (LS-33). Boundary: evidence is mostly vocabulary and fact items.

**AM-12. How much help a learner needed is evidence too: models that use hints requested and attempts made predict exam scores better than right-or-wrong scoring.**
Grade B. In an online system that tutors while it assesses, a model using interaction data, such as the assistance students needed, predicted end-of-year state test scores better than a model of test items scored right or wrong ([Feng 2009][feng2009]). Boundary: one system and one subject (middle school mathematics).

**AM-13. Data from practice predicts exam results (AM-12), and so does a student's monitoring accuracy; students' own predictions of their exam score are at best moderately accurate.**
Grade B. Monitoring accuracy measured at the start of a semester, even on unrelated general-knowledge items, predicted final exam scores ([Hartwig 2012][hartwig2012]). High-school students predicted their AP exam scores two months ahead with moderate accuracy (weighted κ = .62) ([Ober 2022][ober2022]); in college classes, low performers overpredicted and accuracy improved over exams mainly for high performers ([Hacker 2000][hacker2000]). Boundary: correlational, and single courses.

### Calibration and judgments of learning

**AM-14. Learners are often overconfident about how much they know, and the lowest performers overestimate most; how much of this pattern (the Dunning-Kruger effect) is psychological and how much a statistical artefact is disputed.**
Grade B. Participants in the bottom quartile on tests of grammar, logic and humour placed themselves around the 62nd percentile when they scored around the 12th ([Kruger 1999][kruger1999]); low performers overpredict their exam scores (AM-13). Regression to the mean and the bounds of percentile scales produce much of the pattern without a metacognitive deficit ([Magnus 2022][magnus2022]; [Gignac 2020][gignac2020]; [Mazor 2021][mazor2021]). Boundary: the asymmetry between low and high performers is firmer than its explanation (see Contested).

**AM-15. Learners judge their learning from cues they can feel, such as how fluent the material seems and whether the answer is in front of them, not from direct access to what they will remember, which creates illusions of competence.**
Grade B. Judgments of learning (JOLs) rest on intrinsic, extrinsic and mnemonic cues; practice improved resolution while it increased underconfidence ([Koriat 1997][koriat1997]). Judging while the answer is visible inflates confidence that fails at test ([Koriat 2005][koriat2005]); larger fonts raised JOLs without raising recall, even after warnings ([Rhodes 2008][rhodes2008]). Learners hold a faulty mental model of learning and read current performance and fluency as learning (LS-23; [Bjork 2013][bjork2013]). Boundary: mostly word pairs in laboratories.

**AM-16. Learners underestimate both how much they will forget and how much further study would help (stability bias).**
Grade B. Across 12 experiments, participants predicted little or no gain from repeated study despite large actual gains ([Kornell 2009][kornell2009]). Boundary: word-pair lists.

**AM-17. Judgments made after a delay, when the learner must retrieve rather than reread, are far more accurate than judgments made right after study; for texts, judgments are poor (correlations near .2) and improve when students first write a delayed summary or keywords.**
Grade A. Delaying JOLs raises their relative accuracy (_g_ = 0.93 across 112 effect sizes) ([Rhodes 2011][rhodes2011]); most of the improvement is real calibration, not a shift in rating style ([Weaver 1997][weaver1997]). For texts, the mean accuracy correlation is .18 across 115 studies; delayed summaries and delayed keywords help, and combinations add up ([Yang 2022][yang2022]; [Prinz 2020][prinz2020]). Writing delayed keywords improved monitoring, then the choice of what to reread, then comprehension ([Thiede 2003][thiede2003]). Boundary: part of the delayed-JOL benefit may come from the retrieval attempt changing memory itself ([Kelemen 1997][kelemen1997]).

**AM-18. Students overrate their own recall answers, often scoring wrong answers as correct; comparing an answer with a standard, best idea by idea, reduces this.**
Grade B. Middle-school students gave credit to 73% of their wrong definitions without a standard and 44% with the correct definition shown; checking each idea unit reduced overconfidence further ([Lipko 2009][lipko2009]). College students were overconfident even when grading others' answers, and idea-unit judgments helped ([Dunlosky 2011][dunlosky2011]). Boundary: definitions of key terms.

**AM-19. Training improves monitoring accuracy only a little; checking against the whole task, teaching metacognitive knowledge and giving external standards work, and simply asking for score estimates and returning results improves calibration over time.**
Grade A. Interventions for monitoring in problem solving _g_ = 0.25 across 35 studies; whole-task, metacognitive-knowledge and external-standard interventions helped, timing interventions hurt, and classroom effects were smaller than laboratory ones ([Janssen 2024][janssen2024]); a meta-analysis of strategy-instruction interventions addressed the same question ([Gutierrez 2022][gutierrez2022]). Secondary pupils who estimated their grade after each exam for a school year became better calibrated, whether or not they also reflected on the gap ([Nederhand 2020][nederhand2020]). Boundary: accuracy measures differ between studies.

### Self-regulated learning

**AM-21. Self-regulated learning (SRL) is a cycle: planning before a task (goals, strategy, time), monitoring and controlling during it, and evaluating afterwards, which feeds the next plan.**
Grade C (theory with broad support). Zimmerman's phases of forethought, performance and self-reflection are the best known of six major models, which share the cycle and differ in their weight on emotion, motivation and metacognition ([Zimmerman 2002][zimmerman2002]; [Panadero 2017][panadero2017]). Monitoring is the hub, and feedback, internal or external, drives it ([Butler 1995][butler1995]). Boundary: models, not a single tested theory; instruments are mostly self-reports.

**AM-22. Students' own study decisions follow faulty beliefs: they mostly reread, use self-testing to check rather than to learn, cram before deadlines, and drop material they believe they know too early.**
Grade B. Surveys find that students reread and use self-testing mainly to monitor their memory ([Kornell 2007][kornell2007]; [Karpicke 2009][karpicke2009]; as summarised by [Hartwig 2012b][hartwig2012b]). Self-testing and spaced scheduling correlate with GPA; low performers study late at night and are driven by deadlines ([Hartwig 2012b][hartwig2012b]). Being allowed to drop flashcards students thought they knew slightly but consistently hurt learning ([Kornell 2008][kornell2008]). People often misassess and mismanage their learning ([Bjork 2013][bjork2013]). Boundary: surveys of US college students.

**AM-23. Monitoring steers study: learners stop studying what they judge learned, so overconfidence ends study too early and lowers retention, while accurate monitoring leads to better study choices and better results.**
Grade B. Better monitoring led to better rereading choices and comprehension ([Thiede 2003][thiede2003]); overconfident learners stop studying too early and retain less ([Dunlosky 2012][dunlosky2012]; [Kornell 2008][kornell2008]); learners tend to study what is neither known nor too hard (the region of proximal learning) ([Metcalfe 2005][metcalfe2005]). Boundary: laboratory tasks with definitions and word pairs.

**AM-24. Training students in self-regulated learning strategies improves achievement, with small to medium effects at university and larger ones at school.**
Grade A. University SRL training _g_ = 0.38 across 49 studies, ranging from rehearsal (0.23) to attention and concentration (0.61) ([Theobald 2021][theobald2021]); school-level interventions average about 0.69 across outcomes ([Dignath 2008][dignath2008]); prompts and scaffolds for SRL help in computer-based environments ([Zheng 2016][zheng2016]). A strategy course taught first-year students which strategies work, changed their reported use, and narrowed the gap between low and high performers over the year ([Biwer 2022][biwer2022]). Boundary: knowing what works does not mean doing it; effortful strategies feel worse (LS-23).

**AM-26. Learners use on-demand help badly: some avoid help they need, others use it to get answers without thinking (gaming the system), and both go with less learning.**
Grade B. Learners in interactive environments often do not use help effectively, and good help seeking needs metacognitive skill ([Aleven 2003][aleven2003]). Students who gamed a tutor by exploiting hints and feedback to advance scored substantially lower on post-tests, controlling for prior knowledge ([Baker 2004][baker2004]). Boundary: mostly mathematics tutors in US schools.

## Terms

Research name, with the everyday name in brackets where they differ.

- Formative assessment, assessment for learning (checking understanding along the way); summative assessment (the exam that counts): AM-1.
- Feedback levels: task, process, self-regulation, self (praise): AM-2. Feedback literacy, proactive recipience (using feedback): AM-3.
- Testing effect, test-enhanced learning (quizzing yourself; practice exams): AM-5. Recall vs recognition (open questions vs multiple choice); lures (wrong options): AM-6. Transfer items, higher-order questions (application questions): AM-7.
- Mastery learning (don't move on until you've got it): AM-8.
- Knowledge tracing, learner model, student model (what the system thinks you know); guess and slip: AM-9 to AM-12.
- Judgment of learning, JOL (how sure you are you'll remember); confidence rating; calibration (being as good as you think); resolution (knowing which items you know): AM-14 to AM-19.
- Illusion of competence, fluency illusion ("it looked familiar"): AM-15. Stability bias: AM-16. Delayed-JOL effect (checking yourself later): AM-17.
- Dunning-Kruger effect ("unskilled and unaware"): AM-14.
- Self-regulated learning (managing your own studying): planning, monitoring, evaluating: AM-21 to AM-24.
- Help seeking; gaming the system (clicking through hints to get the answer): AM-26.

## Contested and open

- **How large formative assessment's effect is.** The often-quoted 0.4 to 0.7 rests on narrative reviews ([Black 1998][black1998]); controlled meta-analyses find about 0.2 ([Kingston 2011][kingston2011]; [Xuan 2022][xuan2022]), and critics say the construct is too loose to pool ([Bennett 2011][bennett2011]).
- **Mastery learning on standardised tests.** Positive on course exams ([Kulik 1990][kulik1990]), near zero on standardised tests in studies of four weeks or more ([Slavin 1990][slavin1990]).
- **Recall versus recognition formats.** Recall tends to win (LS-6), but well-built multiple choice can match it ([Little 2012][little2012]; [van Wijk 2024][vanwijk2024]); low initial success can erase the advantage of open formats.
- **The Dunning-Kruger effect.** A metacognitive deficit of the unskilled ([Kruger 1999][kruger1999]) or largely regression and scale bounds ([Magnus 2022][magnus2022]; [Gignac 2020][gignac2020])? That low performers overestimate is not in dispute; the reason is.
- **Delayed-JOL effect.** Better metamemory ([Weaver 1997][weaver1997]) or a retrieval attempt that changes memory ([Kelemen 1997][kelemen1997]).
- **Deep versus simple learner models.** Large reported gains for deep models ([Piech 2015][piech2015]) shrink against well-specified simple models ([Khajah 2016][khajah2016]; [Vie 2023][vie2023]); how any of these models handle open-ended answers in a new course is untested here.
- **Knowing versus doing.** Strategy training changes what students know and say they do ([Biwer 2022][biwer2022]); whether it changes behaviour under exam pressure, where effortful strategies feel worse (LS-23), is open.
- **Sampling.** Metacognition findings rest on word pairs and short texts; formative assessment on K-12 pupils; learner models on mathematics and language tutors.

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor included; the synthesis decides what the app does.

1. **Assess to teach, not only to measure.** Every question is practice (AM-5, LS-6). Ask questions at the level the exam asks, including application and reasoning, not only facts (AM-7); prefer recall, and when offering choices, make the wrong options plausible and always resolve them with feedback (AM-6).
2. **Feedback about the work, never the person, and with a next step.** Say what is right or wrong and why, and what to do next (AM-2, LS-22); avoid praise of ability and anything that reads as a grade on the Student (AM-2). Give the Student a chance to act on it at once, by retrying or revising (AM-3).
3. **Treat one answer as weak evidence and keep the estimate probabilistic.** Combine several Attempts per KC (AM-9), let recall decay between Reviews (AM-11), and count the help a Student needed as evidence (AM-12). Small specialised models predict answers better and cheaper than asking an LLM to guess (AM-10); an LLM is better placed to judge one answer than to forecast a learner.
4. **Do not trust the Student's sense of knowing, and do not let the tutor rely on it either.** "I've got it" after rereading or right after an explanation is a fluency cue (AM-15, AM-16). Check with a delayed attempt instead, after other material or in a later session (AM-17). Questions like "does that make sense?" collect exactly the immediate judgment that is least accurate.
5. **Make the Student's self-evaluation honest by giving a standard.** After a recall attempt, show the model answer idea by idea and let the Student compare (AM-18). Asking for a confidence or a predicted score and then showing the result is cheap and improves calibration over time (AM-19). A high-confidence error is worth extra attention (LS-20).
6. **Expect the Student to stop too early and to choose weak strategies.** Students drop material they think they know, cram and reread (AM-22, AM-23). A tutor that decides when a KC is learned from evidence, schedules Reviews and asks for recall makes the decisions students make badly. Mastery criteria per unit help, at a cost in time (AM-8); with an exam date the cost must be weighed against coverage.
7. **Build self-regulation, not only knowledge.** Planning, monitoring and evaluating can be taught and help (AM-21, AM-24). Showing the Student why a strategy works is worth little unless they then use it (AM-24, Contested).
8. **Design help so that it cannot be clicked through.** Some students avoid help, others mine it for answers (AM-26). Help that asks for an attempt before giving more, and a tutor that notices rapid help requests, address both; the ITS and tutoring reports cover how.

**Conflicts with other fields.** Honest self-evaluation and frequent checking show the Student their gaps, which can hurt confidence and motivation (report MOT), and AM-2's harm from grades touches the same question. Learning science favours struggle before help (LS-19) while AM-26 shows that students under-use help; the tutoring reports weigh how much to wait. Mastery learning (AM-8) and spacing across topics (LS-8, LS-10) pull in opposite directions on whether to finish a unit before moving on. Asking for confidence ratings adds steps that interface design (report UX) may want to keep few.

## Sources

Links go to the DOI where one exists, else to the arXiv page. Statuses rest on the abstracts read when the source was found.

**Verified** (abstract or text checked): [Agarwal 2019][agarwal2019], [Aleven 2003][aleven2003], [Baker 2004][baker2004], [Bangert-Drowns 1991][bangertdrowns1991t] (frequent testing; not the feedback review of the same year in report LS), [Bennett 2011][bennett2011], [Bhattacharyya 2026][bhattacharyya2026], [Biwer 2022][biwer2022], [Bjork 2013][bjork2013], [Black 1998][black1998], [Bloom 1984][bloom1984], [Butler 1988][butler1988], [Butler 1995][butler1995], [Corral 2025][corral2025], [Dignath 2008][dignath2008] (overall 0.69 confirmed; the outcome it covers was not), [Dunlosky 2011][dunlosky2011], [Feng 2009][feng2009], [Guskey 1987][guskey1987], [Hartwig 2012][hartwig2012], [Hartwig 2012b][hartwig2012b], [Janssen 2024][janssen2024], [Jonsson 2012][jonsson2012], [Kelemen 1997][kelemen1997], [Khajah 2016][khajah2016], [Kingston 2011][kingston2011], [Koriat 1997][koriat1997], [Koriat 2005][koriat2005], [Kornell 2008][kornell2008], [Kornell 2009][kornell2009], [Kruger 1999][kruger1999], [Kulik 1990][kulik1990], [Lipko 2009][lipko2009], [Little 2012][little2012], [Magnus 2022][magnus2022], [Nederhand 2020][nederhand2020], [Ober 2022][ober2022], [Panadero 2017][panadero2017], [Pavlik 2005][pavlik2005], [Piech 2015][piech2015], [Rhodes 2008][rhodes2008], [Rhodes 2011][rhodes2011], [Roediger 2005][roediger2005], [Settles 2016][settles2016], [Slavin 1990][slavin1990], [Sortwell 2024][sortwell2024], [Theobald 2021][theobald2021], [Thiede 2003][thiede2003], [van Wijk 2024][vanwijk2024], [Vie 2023][vie2023], [Weaver 1997][weaver1997], [Winstone 2016][winstone2016], [Xuan 2022][xuan2022], [Yang 2022][yang2022].

**Located** (exists, content not checked): [Butler 2008][butler2008], [Corbett 1995][corbett1995], [Desmarais 2011][desmarais2011], [Dunlosky 2012][dunlosky2012] (finding from citing papers), [Gignac 2020][gignac2020], [Gutierrez 2022][gutierrez2022], [Hacker 2000][hacker2000] (findings from secondary summaries), [Karpicke 2009][karpicke2009] (abstract read only in part), [Kornell 2007][kornell2007] (abstract too general to check the survey finding), [Mazor 2021][mazor2021], [Metcalfe 2005][metcalfe2005], [Pelánek 2017][pelanek2017], [Prinz 2020][prinz2020], [Zheng 2016][zheng2016], [Zimmerman 2002][zimmerman2002].

**From memory**: no source. Sources shared with the learning science report ([Hattie 2007][hattie2007], [Kluger 1996][kluger1996]) carry their status there (verified). The guess and slip parameters in AM-9 and the cold-start remark rest on the model's knowledge of the located sources.

[agarwal2019]: https://doi.org/10.1037/edu0000282
[aleven2003]: https://doi.org/10.3102/00346543073003277
[baker2004]: https://doi.org/10.1145/985692.985741
[bangertdrowns1991t]: https://doi.org/10.1080/00220671.1991.10702818
[bennett2011]: https://doi.org/10.1080/0969594X.2010.513678
[bhattacharyya2026]: https://arxiv.org/abs/2603.02830
[biwer2022]: https://doi.org/10.1007/s10459-022-10149-z
[bjork2013]: https://doi.org/10.1146/annurev-psych-113011-143823
[black1998]: https://doi.org/10.1080/0969595980050102
[bloom1984]: https://doi.org/10.3102/0013189X013006004
[butler1988]: https://doi.org/10.1111/j.2044-8279.1988.tb00874.x
[butler1995]: https://doi.org/10.3102/00346543065003245
[butler2008]: https://doi.org/10.3758/MC.36.3.604
[corbett1995]: https://doi.org/10.1007/BF01099821
[corral2025]: https://doi.org/10.1016/j.learninstruc.2025.102219
[desmarais2011]: https://doi.org/10.1007/s11257-011-9106-8
[dignath2008]: https://doi.org/10.1007/s11409-008-9029-x
[dunlosky2011]: https://doi.org/10.1080/17470218.2010.502239
[dunlosky2012]: https://doi.org/10.1016/j.learninstruc.2011.08.003
[feng2009]: https://doi.org/10.1007/s11257-009-9063-7
[gignac2020]: https://doi.org/10.1016/j.intell.2020.101449
[gutierrez2022]: https://doi.org/10.1037/edu0000674
[guskey1987]: https://doi.org/10.3102/00346543057002225
[hacker2000]: https://doi.org/10.1037/0022-0663.92.1.160
[hartwig2012]: https://doi.org/10.1111/j.2044-8279.2011.02038.x
[hartwig2012b]: https://doi.org/10.3758/s13423-011-0181-y
[hattie2007]: https://doi.org/10.3102/003465430298487
[janssen2024]: https://doi.org/10.1007/s10648-024-09936-4
[jonsson2012]: https://doi.org/10.1177/1469787412467125
[karpicke2009]: https://doi.org/10.1080/09658210802647009
[kelemen1997]: https://doi.org/10.1037/0278-7393.23.6.1394
[khajah2016]: https://arxiv.org/abs/1604.02416
[kingston2011]: https://doi.org/10.1111/j.1745-3992.2011.00220.x
[kluger1996]: https://doi.org/10.1037/0033-2909.119.2.254
[koriat1997]: https://doi.org/10.1037/0096-3445.126.4.349
[koriat2005]: https://doi.org/10.1037/0278-7393.31.2.187
[kornell2007]: https://doi.org/10.3758/BF03194055
[kornell2008]: https://doi.org/10.1080/09658210701763899
[kornell2009]: https://doi.org/10.1037/a0017350
[kruger1999]: https://doi.org/10.1037/0022-3514.77.6.1121
[kulik1990]: https://doi.org/10.3102/00346543060002265
[lipko2009]: https://doi.org/10.1037/a0017599
[little2012]: https://doi.org/10.1177/0956797612443370
[magnus2022]: https://doi.org/10.3389/fpsyg.2022.840180
[mazor2021]: https://doi.org/10.1038/s41562-021-01101-z
[metcalfe2005]: https://doi.org/10.1016/j.jml.2004.12.001
[nederhand2020]: https://doi.org/10.1007/s11409-020-09233-9
[ober2022]: https://doi.org/10.1080/0969594X.2022.2037508
[panadero2017]: https://doi.org/10.3389/fpsyg.2017.00422
[pavlik2005]: https://doi.org/10.1207/s15516709cog0000_14
[pelanek2017]: https://doi.org/10.1007/s11257-017-9193-2
[piech2015]: https://arxiv.org/abs/1506.05908
[prinz2020]: https://doi.org/10.1016/j.edurev.2020.100358
[rhodes2008]: https://doi.org/10.1037/a0013684
[rhodes2011]: https://doi.org/10.1037/a0021705
[roediger2005]: https://doi.org/10.1037/0278-7393.31.5.1155
[settles2016]: https://doi.org/10.18653/v1/P16-1174
[slavin1990]: https://doi.org/10.3102/00346543060002300
[sortwell2024]: https://doi.org/10.3390/su16177826
[theobald2021]: https://doi.org/10.1016/j.cedpsych.2021.101976
[thiede2003]: https://doi.org/10.1037/0022-0663.95.1.66
[vanwijk2024]: https://doi.org/10.1186/s12909-024-06538-0
[vie2023]: https://arxiv.org/abs/2309.12334
[weaver1997]: https://doi.org/10.1111/j.1467-9280.1997.tb00445.x
[winstone2016]: https://doi.org/10.1080/00461520.2016.1207538
[xuan2022]: https://doi.org/10.3389/fpsyg.2022.990196
[yang2022]: https://doi.org/10.3102/00346543221094083
[zheng2016]: https://doi.org/10.1007/s12564-016-9426-9
[zimmerman2002]: https://doi.org/10.1207/s15430421tip4102_2
