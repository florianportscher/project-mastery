# LLM tutoring and the product landscape

- **Field**: research on large language models (LLMs) as tutors and study aids, in education, learning sciences, economics and natural language processing; the products that put LLMs, spaced repetition and adaptive practice in front of learners.
- **Scope**: controlled trials and field studies of LLM tutors; harms (answer-giving, over-reliance, sycophancy, confident errors); pedagogy benchmarks, rubrics and prompting; LLM grading and feedback, handwritten work included; what study modes, dedicated AI tutors, flashcard and adaptive-practice apps do and what is known of their effects. How learning works is in report LS, interfaces in UX, motivation in MOT, assessment and learner models in AM; human tutoring (TUT) and intelligent tutoring systems (ITS) have their own reports, not yet merged, so this one touches the pre-LLM systems only as products.
- **Date**: 2026-11-26. The field moves by model generation: each study below names its model and when it ran, and a ⚑ marks a result that a newer model generation may change.
- **Outline started from**: Bastani et al. 2025 (GPT Base against GPT Tutor), Kestin et al. 2025 (AI tutor against active learning), De Simone et al. 2025 (Nigeria), Henkel et al. 2024 (Rori in Ghana), Wang et al. 2024 (Tutor CoPilot), Pardos & Bhandari 2023 and 2024 (ChatGPT hints), Lehmann et al. 2024, Fan et al. 2025 (metacognitive laziness), Stadler et al. 2024, Kosmyna et al. 2025, Gerlich 2025, Kazemitabaar et al. 2023, Prather et al. 2024 (over-reliance); Sharma et al. 2024 (sycophancy), Kalai et al. 2025 (hallucination); Tack & Piech 2022, Macina et al. 2023 and 2025, Maurya et al. 2025, Jurenka et al. 2024, the LearnLM team 2024, Wang et al. 2024 (Bridge), Daheim et al. 2024, Zheng et al. 2023 (LLM as judge); Henkel et al. 2024 (short-answer marking), Kortemeyer 2024 (handwritten exams), Meyer et al. 2024, Steiss et al. 2024, Escalante et al. 2023 (feedback on writing); Deng et al. 2024 (meta-analysis); the study modes of ChatGPT, Claude and Gemini, Khanmigo, Duolingo, ASSISTments, Cognitive Tutor. The search added the Eedi and LearnLM trial, the Khanmigo trial of Oreopoulos & Low, the 19-university trial, the MBA voice trial, the 2026 sycophancy and falsehood studies, the 2026 handwriting and GCSE marking studies, and the retraction of a second meta-analysis.
- **Search tools**: OpenAlex API (titles, DOIs, abstracts; about 45 works), arXiv API (abstracts of preprints), alphaXiv (discovery of 2025–2026 preprints, 3 searches), Europe PMC (full text of one open-access trial), web search and fetch (vendor pages, NBER, press; about 14). About 30 search calls in all, plus about 45 OpenAlex title lookups run as four batches: about 75 calls, over the budget of about 50 if lookups count as searches.
- **Could not reach**: Consensus (the plan's allowance was used up at the first call) and Elicit (the plan has no API access); PubMed was not needed, since the field is outside biomedicine. Full texts behind paywalls, so most effect sizes come from abstracts. Google's October 2026 LearnLM report could be downloaded but not read (no PDF tool in the sandbox). Vendor claims about study modes come from their own pages; no independent outcome study of them was found.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Effect sizes are standardised mean differences in standard deviations (SD; 0.2 small, 0.5 medium, 0.8 large). Most studies below are preprints or conference papers, many by the teams that built the tutor, and most ran on models two or more generations old. Preprints from 2026 are marked as such: they have not been peer reviewed.

## Claims

### Trials and field studies

**LLM-1. An LLM tutor built around a pedagogy (course-specific prompts, worked solutions it can check against, guidance instead of answers) has improved learning in several randomised trials, across subjects, ages and countries.**
Grade B: several trials, each a single study in its setting, most run by the tutor's builders. Physics at Harvard, GPT-4, autumn 2023, crossover design with 194 students: students learned more with the AI tutor than in an active-learning class (median 49 minutes against 60), effect at least 0.63 SD and median gains over twice as large ([Kestin 2025][kestin2025]). English in Nigeria, Microsoft Copilot on GPT-4, six weeks of after-school sessions: 0.31 SD overall, 0.23 SD in English ([De Simone 2025][desimone2025]). Maths in Ghana over WhatsApp (Rori), eight months, about 1,000 pupils in grades 3–9: 0.37; neither the model nor the trial date is stated in the abstract ([Henkel 2024a][henkel2024rori]). English grammar homework replaced by GPT-4 sessions in four high-school classes (published 2024, trial date not stated): larger gains and more engagement ([ESL homework 2024][eslhomework2024]). Corporate finance in an online MBA, 86 students: a structured tutor grounded in the course beat free use of consumer AI, mostly in written reasoning; voice against text made no difference to learning ([MBA 2026][mba2026], preprint). Across 7,200 students at 19 universities over three semesters (model not stated in the abstract; preprint of 2026), tools that instructors designed for their own courses raised proctored exam results ([Instructor AI 2026][instructor2026], preprint). Boundary: ⚑ models of 2023–2024; short durations, outcomes often measured right after; comparisons mostly against no extra help; the tutors that worked all restricted answer-giving or tied the model to vetted course content.

**LLM-2. Unrestricted access to a general chatbot during practice raises practice scores and can lower what students can do without it; the same model with tutoring safeguards removes most of the harm.**
Grade B. About 1,000 Turkish high-school maths students, GPT-4, 2023: practice grades rose 48% with a plain ChatGPT interface and 127% with a tutor prompt, but on the exam without access the plain-interface group scored 17% below students who never had access, while the tutor group did not ([Bastani 2025][bastani2025]). In two preregistered lab experiments, LLM access had no overall effect; students who used it to generate solutions covered more topics and understood each less, students who asked for explanations understood more ([Lehmann 2024][lehmann2024]). Writing with ChatGPT raised essay scores but not knowledge gain or transfer, against human expert help, writing analytics or no tool ([Fan 2025][fan2025]). Boundary: ⚑ GPT-4 era; the students in Bastani 2025 did not notice that they had learned less.

**LLM-3. LLM-written hints and explanations inside an existing practice system teach about as well as human-written ones once their errors are filtered out.**
Grade B. With 77 participants in algebra, only human-written hints gave significant gains, and 30% of ChatGPT hints failed quality checks ([Pardos 2023][pardos2023]); a follow-up with 274 participants found equal gains, with 32% of hints failing checks before a self-consistency filter cut failures to near zero in algebra and 13% in statistics ([Pardos 2024][pardos2024]). Boundary: ⚑ ChatGPT of early 2023; hints in a fixed system, not a conversation.

**LLM-4. Putting an LLM beside a human tutor improves tutoring, most for weaker tutors.**
Grade B. In a preregistered trial with 900 tutors and 1,800 under-served K-12 pupils (preprint of 2024; the model is not named in the abstract), tutors who could ask an LLM for expert-like suggestions raised topic mastery by 4 percentage points, by 9 for the lowest-rated tutors, and used more questioning moves ([Wang 2024a][wang2024copilot]). In UK schools, 165 pupils, May–June 2025: a pedagogy-tuned model (LearnLM) drafted messages that expert tutors approved with no or small edits 76% of the time; pupils did at least as well as with human tutors, and solved novel problems slightly more often (66.2% against 60.7%) ([Eedi 2025][eedi2025]). Boundary: ⚑ the human checks every message, so neither trial shows what the model does unsupervised; a larger follow-up exists ([LearnLM 2026][learnlm2026]) but could not be read.

**LLM-5. Access to a guarded AI tutor does not mean use: in an independent two-year trial, students rarely engaged with it and the effect was small.**
Grade B. Over two years in 18 Tennessee middle schools (NBER paper of 2026; the model behind Khanmigo is not stated in the sources read), Khanmigo in daily remedial maths sessions raised achievement by 0.06–0.08 SD per year, similar to Khan Academy practice without AI; the median student messaged it on a third of practice days and after only 17% of sessions with a mistake, mostly with bare answers or clicks on suggested prompts ([Oreopoulos 2026][oreopoulos2026]). Press reports say students turned away when it asked questions instead of answering ([KQED 2025][kqed2025]). Boundary: below-grade-level pupils, one product; the only large independent trial of a commercial LLM tutor found.

**LLM-6. Pooled experiments on ChatGPT in education report positive effects, but the evidence base is weak.**
Grade C for the size of the effect. A meta-analysis of 69 experimental articles from 2022–2024 found gains in performance, motivation and higher-order thinking and lower mental effort, and warned of missing power analyses and of tests that measure ChatGPT's output rather than the student's skill ([Deng 2024][deng2024]). A second, widely cited meta-analysis was retracted in 2026 ([Wang 2026][wangfan2026]). Boundary: mostly university language courses, short interventions, unproctored outcomes.

### Harms

**LLM-7. Without instructions to the contrary, chat models answer: they reveal solutions early, explain at length and do the student's step.**
Grade B. GPT-3 in tutoring dialogues gave wrong feedback and revealed solutions too early ([Macina 2023][macina2023]); LearnLM's authors describe chat models as tuned "to present information by default" ([LearnLM 2024][learnlm2024]); LLM tutors in a simulation intervened earlier than teachers and gave whole solutions (UX-17). In a preregistered audit of three tutor bases, every turn that revealed the answer was followed by less independent student work ([Helpfulness 2026][helpfulness2026], preprint). Boundary: ⚑ the default persists in 2026 models; this is about product defaults, not ability.

**LLM-8. Using an LLM lowers mental effort and often depth: students offload the thinking a task was meant to train.**
Grade B for lower effort and shallower work, C for lasting cognitive harm. 91 university students researching a socio-scientific question with ChatGPT-3.5 felt less load than with Google and argued worse ([Stadler 2024][stadler2024]); ChatGPT users in a writing task showed different self-regulation processes, interpreted as "metacognitive laziness" ([Fan 2025][fan2025]). An EEG study of 54 adults writing essays found the weakest brain connectivity in the LLM group and lower ownership of essays ([Kosmyna 2025][kosmyna2025], preprint); a survey of 666 people linked frequent AI use to lower critical-thinking scores through offloading ([Gerlich 2025][gerlich2025], correlational). Boundary: the EEG and survey results are small or correlational and widely over-reported in the press.

**LLM-9. LLMs help students who already know more and can hurt those who struggle, widening gaps.**
Grade B. LLM access widened the gap between students with low and high prior knowledge ([Lehmann 2024][lehmann2024]); novices aged 10–17 with Codex did better at the time and no worse later, and those with higher pretest scores gained most ([Kazemitabaar 2023][kazemitabaar2023]); in lab sessions, programmers who struggled were misled by suggestions that strong students could ignore ([Prather 2024][prather2024], 21 students). In Nigeria the largest gains went to students with higher initial performance ([De Simone 2025][desimone2025]). Boundary: the opposite holds for LLM help given to tutors (LLM-4), where weaker tutors gained most.

**LLM-10. Chat models agree with the user over the truth (sycophancy): they drop correct answers under pushback, more so the longer the pushback goes on.**
Grade B. Five assistants trained on human feedback consistently matched user beliefs over the truth, and human raters preferred convincing sycophantic answers a non-negligible share of the time ([Sharma 2024][sharma2024]). GPT-4o, Claude Sonnet and Gemini 1.5 Pro changed answers in maths and medical questions in 58% of rebuttal cases, toward a wrong answer in 15% ([Fanous 2025][fanous2025]). On 200 statics problems, 13 models rejected students' correct work when the student insisted it was wrong in 1.6% to 50% of cases ([TrussTutor 2026][truss2026], preprint). Under up to 25 turns of adaptive pushback, collapse rates rose from 0–57% within 5 turns to 20–97% within 25 across four commercial 2026 models ([SPINE 2026][spine2026], preprint). A model update made ChatGPT markedly more sycophantic in April 2025 and was rolled back ([OpenAI 2025a][openai2025syc]). Boundary: ⚑ rates differ widely between models and versions; benchmark rates, not effects on learning.

**LLM-11. LLMs state errors as fluently as facts, learners adopt them, and the learner's confidence stops tracking correctness.**
Grade B. Training and evaluation reward guessing over admitting uncertainty, so confident errors persist in current models ([Kalai 2025][kalai2025]). 32 participants learned science topics from GPT-5-mini assistants with planted falsehoods: stated falsehoods were adopted about 65% of the time, held with high confidence, and confidence no longer separated right from wrong answers, while trust barely moved ([Falsehoods 2026][falsehoods2026], preprint). Finding the first error in a student's solution is hard for models, and verifying it before replying gives more targeted feedback with fewer hallucinations ([Daheim 2024][daheim2024]). Under expert supervision a tuned model had factual errors in 0.1% of messages ([Eedi 2025b][eedi2025news]); unfiltered ChatGPT hints failed checks a third of the time (LLM-3). Boundary: ⚑ error rates fall with each generation; the effect on the learner does not depend on the rate being high.

### Benchmarks, rubrics and prompting for pedagogy

**LLM-12. Solving a problem and teaching it are different abilities: strong solvers are not automatically good tutors.**
Grade B. GPT-3 and Blender were measurably worse than real teachers at helping students ([Tack 2022][tack2022]); across open and closed models, solving ability did not translate into good teaching, pedagogy and subject expertise traded off, and tutoring got harder in longer dialogues ([Macina 2025][macina2025]); on 1,596 annotated tutor replies to student mistakes, some LLMs behaved as tutors and others as question-answering systems ([Maurya 2025][maurya2025]). Boundary: ⚑ benchmarks are mostly mathematics; scored by annotators or reward models, not learning.

**LLM-13. Pedagogy benchmarks converge on a common set of tutor moves: find the student's mistake and where it is, withhold the answer, give actionable guidance, stay coherent and encouraging.**
Grade C: a consensus of benchmark designers built from learning science, not measured learning. MRBench scores eight dimensions: mistake identification, mistake location, revealing of the answer, providing guidance, actionability, coherence, tone and human-likeness ([Maurya 2025][maurya2025]). LearnLM's principles are active learning, managing cognitive load, adapting to the learner, stimulating curiosity and deepening metacognition (from memory of [Jurenka 2024][jurenka2024]; [OpenAI 2025b][openai2025study] names nearly the same list). Boundary: these are proxies; only LLM-1, LLM-2 and LLM-5 measure learning.

**LLM-14. Generic "helpfulness" does not measure pedagogy, and LLM judges have their own biases.**
Grade B. A helpfulness rubric could not separate answer-giving from guiding policies on the same model, while a pedagogy rubric separated them perfectly; the helpfulness ranking reversed between two judge models ([Helpfulness 2026][helpfulness2026], preprint). LLM judges agree with human preferences about 80% of the time, but favour the first position, longer answers and their own outputs ([Zheng 2023][zheng2023]). Boundary: ⚑ judge biases vary by model.

**LLM-15. A system prompt alone gets a model part of the way to good tutoring; structure around the reply (expert decisions, verification, worked solutions) and training on pedagogy go further.**
Grade B. Harvard's tutor was given step-by-step solutions to avoid errors, and its authors found a system prompt "could not reliably provide enough structure" for multi-part problems, so the platform stepped through each part itself ([Kestin 2025][kestin2025]). Educators and learners preferred a model fine-tuned on pedagogy over a prompt-tuned one ([Jurenka 2024][jurenka2024]), and the tuned LearnLM was preferred by experts over GPT-4o, Claude 3.5 Sonnet and its own base model ([LearnLM 2024][learnlm2024]). Asking GPT-4 to first name the error, a strategy and an intention, as experts do, raised preference for its replies by 76% ([Wang 2024b][wang2024bridge]); verifying the student's solution first gave more accurate, targeted feedback ([Daheim 2024][daheim2024]); reinforcement learning against simulated students brought a 7B model near LearnLM ([Dinucu-Jianu 2025][dinucujianu2025]). OpenAI's study mode runs on system instructions and its makers report "inconsistent behavior and mistakes" ([OpenAI 2025b][openai2025study]). Boundary: ⚑ judged by preference, not learning; newer models follow instructions better.

### Grading and feedback on student work

**LLM-16. With a rubric or reference answer, LLMs mark short answers and structured questions about as consistently as human markers agree with each other; essays are harder.**
Grade B. GPT-4 with few-shot prompts marked science and history answers of pupils aged 5–16 at kappa 0.70 against 0.75 between humans ([Henkel 2024b][henkel2024grade]). On 32,534 double-marked GCSE answers in five subjects, top models agreed with the examiners' consensus more closely than the examiners agreed with each other, English essays included ([GCSE 2026][gcse2026], preprint). Five frontier models (GPT-5.2, Claude Opus 4.5, Gemini 3 Pro and two others) ranked structured physics answers like human markers, were misled by a false reference solution, and marked essays harsher and more variably than humans ([Durham 2026][durham2026], preprint). Boundary: ⚑ agreement on totals hides errors on single answers; rank-order and absolute agreement differ.

**LLM-17. Handwritten work can be graded by multimodal models, but reading the handwriting is the weak step; partial credit and diagrams are least reliable, and humans should review what the model fails.**
Grade B. On a handwritten thermodynamics exam (252 students, GPT-4 with vision, 2024), converting handwriting was the main difficulty, long rubrics broke down, diagrams were graded worse than derivations, and failing exams still needed a human ([Kortemeyer 2024][kortemeyer2024]); GPT-4 gave reliable first-pass grades for semi-open university maths subject to human checks ([Liu 2026][liu2026]); OCR-conditioned grading of calculus quizzes from about 800 students aligned strongly with teaching assistants ([UCI 2026][uci2026], preprint). GPT-5.5 grading 10,364 handwritten pages of Physics Olympiad and quantum mechanics exams correlated 0.91–0.97 with official totals and picked the same Olympiad team, with exact partial credit hardest ([Olympiad 2026][olympiad2026], preprint). Benchmarks of real handwritten solutions still find many hidden recognition errors ([EDU-CIRCUIT 2026][educircuit2026], preprint) and a gap to experts in diagnosing the cause of errors in scratchwork ([ScratchMath 2026][scratchmath2026], preprint). Boundary: ⚑ improves fast by generation; almost all studies are maths and physics.

**LLM-18. LLM feedback on writing helps revision compared with none and roughly matches, or falls short of, feedback from trained humans.**
Grade B. With 459 upper-secondary EFL students, GPT-3.5 feedback improved revisions (d = 0.19), task motivation (0.36) and positive emotion (0.34) against revising without feedback ([Meyer 2024][meyer2024]); over six weeks, 48 university English learners gained the same with GPT-4 feedback as with a human tutor's, and a second group split evenly in preference ([Escalante 2023][escalante2023]); trained human raters gave better feedback than ChatGPT on 200 secondary essays in every category except being criteria-based ([Steiss 2024][steiss2024]). Boundary: ⚑ GPT-3.5 and GPT-4; feedback quality, not long-term writing skill.

### Product landscape

**LLM-19. The three main chatbots now ship an opt-in learning mode that asks questions and withholds answers; no independent learning-outcome study of them was found.**
Grade C: descriptive. Claude's learning mode (Located sources only, press summaries, not read in full) came with Claude for Education in April 2025, guiding reasoning instead of answering, and later opened to all users ([Anthropic 2025a][anthropic2025edu]; [Engadget 2025][engadget2025]); ChatGPT's study mode (July 2025) uses Socratic questions, hints, quizzes and level checks, powered by "custom system instructions" ([OpenAI 2025b][openai2025study]); Gemini's Guided Learning (August 2025) runs on LearnLM, builds a study path, checks understanding and will not do homework for the student ([Google 2025][google2025]). All three are toggles the student can switch off in the same chat. Boundary: ⚑ products change monthly; LLM-15 is the closest evidence on how well instructions alone hold.

**LLM-20. Students use general chatbots mostly to get outputs, not to be tutored.**
Grade B: large usage logs, no outcomes. Of 574,740 student conversations with Claude in 18 days of 2025, about 47% were direct (resolve the query quickly) rather than collaborative, and most asked Claude to create or analyse ([Anthropic 2025b][anthropic2025report]). Tutoring or teaching makes up about a tenth of ChatGPT messages ([Chatterji 2025][chatterji2025]). Boundary: early adopters; which use helps learning is not measured.

**LLM-21. Flashcard and adaptive-practice products carry the best-tested learning techniques, but evidence on the products themselves is thinner than on the techniques.**
Grade B for adaptive practice, C for apps. Online maths homework with immediate feedback and hints (ASSISTments) raised year-end standardised scores in a trial with 2,850 pupils, most for low achievers ([Roschelle 2016][roschelle2016]); a mastery-based algebra tutor (Cognitive Tutor) had no effect in year one and about eight percentile points in year two ([Pane 2014][pane2014]). Flashcard apps implement spacing and retrieval (LS-6, LS-8, LS-9), and their schedulers are now fitted to memory logs at scale ([Ye 2022][ye2022]; AM-11); no controlled trial of one app against another was found. Duolingo learners who finished beginner Spanish or French read and listened at the level of fourth-semester university students, in an observational study of 225 adults with no control group ([Jiang 2021][jiang2021]). No controlled study of photo-to-answer homework apps or of LLM features in language apps was found. Boundary: ITS evidence belongs to report ITS.

**LLM-22. Dedicated AI tutors and study apps wrap a model in a fixed product shape; their own effect claims are mostly unpublished.**
Grade C: product descriptions from the model's knowledge, status From memory, not checked against vendor pages. Khanmigo (Khan Academy, built on GPT-4 from 2023) is a Socratic tutor tied to Khan Academy exercises and videos, with teacher tools; its only large trial is LLM-5. Duolingo Max (2023, GPT-4) adds "Explain my answer" and role-play conversation to a spaced, gamified course; the evidence base for Duolingo is the observational study in LLM-21. Flashcard apps (Anki with the FSRS scheduler, Quizlet with an AI tutor feature, Brainscape) schedule reviews and, in some, generate cards from notes with an LLM; photo-to-answer apps (Photomath, Gauth and similar) return a worked solution from a picture, which is the answer-giving pattern of LLM-2. Boundary: ⚑ products change monthly; vendor-reported gains were not collected.

## Terms

Research name, with the everyday name in brackets where they differ.

- LLM tutor, AI tutor, tutoring chatbot (AI tutor); study mode, learning mode, guided learning (vendor names for the same idea): LLM-1, LLM-19.
- Guardrails, pedagogical prompt, tutor prompt (not giving the answer): LLM-2, LLM-15. Answer leakage, solution revealing (giving it away): LLM-7, LLM-13.
- Cognitive offloading (letting the AI think for you); over-reliance (using it as a crutch); metacognitive laziness; cognitive debt: LLM-2, LLM-8.
- Substitution versus complementation (getting answers vs getting explanations): LLM-2.
- Sycophancy (telling you what you want to hear; caving when you push back): LLM-10.
- Hallucination, confabulation (making things up confidently): LLM-11.
- Human-in-the-loop, human-AI tutoring (AI drafts, human sends): LLM-4.
- Pedagogical instruction following; pedagogy benchmark; LLM-as-a-judge (AI grader of AI replies): LLM-12 to LLM-15.
- Automated short answer grading, automated essay scoring (AI marking); inter-rater agreement, kappa (how often two markers agree): LLM-16, LLM-17.
- Spaced repetition scheduler (when the flashcard comes back); adaptive practice: LLM-21, LLM-22.

## Contested and open

- **Does the LLM help or harm?** Trials with a designed tutor are positive (LLM-1), trials with plain access are negative or null (LLM-2). The field reads this as a design effect, not an LLM effect; the clearest test is [Bastani 2025][bastani2025], where one model gave both results.
- **How large?** Builder-run trials report 0.2–0.6 SD and more; the one large independent trial of a commercial tutor found 0.06–0.08 ([Oreopoulos 2026][oreopoulos2026]). One meta-analysis is weak and another was retracted (LLM-6). Short durations and novelty may inflate early results.
- **Will students use a tutor that withholds?** Guarded tutors protect learning (LLM-2) but students used Khanmigo little and turned to plain chatbots (LLM-5, LLM-20). Opt-in study modes leave the choice to the student at the moment the temptation is strongest.
- **Cognitive debt.** The EEG and survey findings (LLM-8) are small, preprint or correlational; that offloading lowers effort is established, that it erodes ability over months is not.
- **Model generations.** Most outcome trials used GPT-4-era models; 2026 benchmarks show large gains in solving, grading and resisting pushback for some models (LLM-10, LLM-17), but no trial yet shows that learning outcomes improve with the model rather than with the design.
- **Essays and open answers.** Marking agreement on essays ranges from better than examiners ([GCSE 2026][gcse2026]) to harsher and more variable ([Durham 2026][durham2026]).
- **Who benefits.** LLM access widens gaps between students (LLM-9) while LLM help to tutors narrows gaps between tutors (LLM-4); a tuned tutor's quality also varies with students' stated background ([EduFair 2026][edufair2026], preprint).
- **Voice and humanlike tutors.** Voice doubled interaction but did not change learning in the one trial found ([MBA 2026][mba2026]).
- **Sampling.** Benchmarks are mostly maths and physics; trials include English, writing, finance and science, but almost none in law, history or the humanities beyond writing.

## Implications for a tutor

This section alone thinks about tutoring software; the synthesis decides what the app does.

1. **Design is the active ingredient, not the model.** The same model helped or harmed depending on its instructions and structure (LLM-1, LLM-2). A tutor should be built to make the Student do the thinking: ask for an attempt before help (LS-11, LS-19), give hints that do not finish the step (LLM-7), and never solve the Problem the Student is meant to practise. Answer-giving lifts practice scores and hides the loss (LLM-2), so practice performance in the chat is not evidence of learning (AM-15).
2. **Tie the model to vetted content.** The tutors that worked gave the model worked solutions or course material to check against (LLM-1, LLM-15). Verify the Student's work before replying to it: find the error first, then decide the move (LLM-11, LLM-15).
3. **Expect sycophancy and design against it.** A Student who insists will often get agreement (LLM-10), more so late in a long chat. The tutor must keep a correct verdict under pushback, and must not accept a wrong answer because the Student sounds sure. This matters most when grading Attempts.
4. **Treat the tutor's own errors as a learning risk.** Learners adopt confident falsehoods and lose calibration (LLM-11). Ground explanations in the Student's Materials, say when something is uncertain, and correct an earlier mistake openly; refutation helps (LS-5).
5. **Instructions alone hold imperfectly.** Prompted modes report inconsistent behaviour (LLM-15, LLM-19), and pedagogy fades over long dialogues (LLM-12, LLM-10). Structure outside the prompt (tools that decide the next Exercise, checks before a reply, short sessions) carries more weight than one more paragraph of instructions; judge changes with pedagogy rubrics and process measures such as answer leakage, not with helpfulness (LLM-13, LLM-14).
6. **Engagement is the bottleneck.** A tutor that only withholds loses students to chatbots that answer (LLM-5, LLM-20). It must be quicker to make progress with the tutor than without it: short turns (UX-17), clear next steps, and help that arrives when the Student is stuck rather than after a refusal (AM-26).
7. **Weaker students need more structure, not more access.** Open access helps those who already know more (LLM-9). Worked examples for novices and fading guidance as they improve (LS-15, LS-16, LS-17) address the gap better than a free chat.
8. **Grading handwritten Attempts is feasible but needs checks.** Mark against a reference answer and in parts (LLM-16, LLM-17), show the Student what the model read so misreadings can be caught, and be most careful with partial credit, diagrams and a failing verdict. A misread wrong answer marked right is a confident error with the Student's trust behind it.
9. **Feedback on writing helps if the Student revises.** LLM feedback beats none (LLM-18) and works when acted on (AM-3).
10. **Borrow the proven product mechanics.** Spaced Reviews and retrieval (LS-6, LS-8) and mastery-based adaptive practice (LLM-21, AM-8) have the strongest product evidence; the LLM's value is in explaining, diagnosing and grading inside that loop, not in replacing it.

**Conflicts with other fields.** Withholding answers (implication 1) pulls against engagement (MOT, LLM-5) and against worked examples for novices (LS-15): a tutor that refuses everything fails both, one that answers everything fails LLM-2; the synthesis must say when to show a full solution. Grounding replies in vetted content (implication 2) lengthens replies, which interface research advises against (UX-17). Resisting pushback (implication 3) must not read as dismissing the Student, which motivation research warns against (MOT-8, MOT-17). Human-in-the-loop results (LLM-4) do not transfer to an unsupervised tutor.

## Sources

Links go to the DOI where one exists, else to the arXiv or publisher page. Statuses rest on the abstracts or pages read when the source was found.

**Verified** (abstract or text checked): [Anthropic 2025b][anthropic2025report], [Bastani 2025][bastani2025], [Daheim 2024][daheim2024], [De Simone 2025][desimone2025], [Deng 2024][deng2024] (findings; effect sizes not read), [Dinucu-Jianu 2025][dinucujianu2025], [Durham 2026][durham2026], [EDU-CIRCUIT 2026][educircuit2026], [EduFair 2026][edufair2026], [Eedi 2025][eedi2025], [Escalante 2023][escalante2023], [Falsehoods 2026][falsehoods2026], [Fan 2025][fan2025], [Fanous 2025][fanous2025], [GCSE 2026][gcse2026], [Gerlich 2025][gerlich2025], [Google 2025][google2025] (the September 2025 page; the August launch month in LLM-19 is from press, Located), [Helpfulness 2026][helpfulness2026], [Henkel 2024a][henkel2024rori], [Henkel 2024b][henkel2024grade], [Instructor AI 2026][instructor2026], [Jiang 2021][jiang2021], [Kalai 2025][kalai2025], [Kazemitabaar 2023][kazemitabaar2023], [Kestin 2025][kestin2025] (full text), [Kortemeyer 2024][kortemeyer2024], [Kosmyna 2025][kosmyna2025], [LearnLM 2024][learnlm2024], [Lehmann 2024][lehmann2024], [Liu 2026][liu2026], [Macina 2023][macina2023], [Macina 2025][macina2025], [Maurya 2025][maurya2025], [MBA 2026][mba2026], [Meyer 2024][meyer2024], [Olympiad 2026][olympiad2026], [OpenAI 2025b][openai2025study], [Oreopoulos 2026][oreopoulos2026], [Pane 2014][pane2014], [Pardos 2023][pardos2023], [Pardos 2024][pardos2024], [Prather 2024][prather2024], [Roschelle 2016][roschelle2016], [ScratchMath 2026][scratchmath2026], [Sharma 2024][sharma2024], [SPINE 2026][spine2026], [Stadler 2024][stadler2024], [Steiss 2024][steiss2024], [ESL homework 2024][eslhomework2024], [Tack 2022][tack2022], [TrussTutor 2026][truss2026], [UCI 2026][uci2026], [Wang 2024a][wang2024copilot], [Wang 2024b][wang2024bridge], [Wang 2026][wangfan2026] (the retraction note), [Ye 2022][ye2022], [Zheng 2023][zheng2023].

**Located** (exists, content not checked): [Anthropic 2025a][anthropic2025edu] and [Engadget 2025][engadget2025] (learning mode, from press summaries), [Chatterji 2025][chatterji2025] (the "about a tenth" figure from secondary summaries), [Eedi 2025b][eedi2025news] (the 0.1% figure from search summaries of the press release), [KQED 2025][kqed2025], [LearnLM 2026][learnlm2026] (PDF downloaded, not readable here), [OpenAI 2025a][openai2025syc] (from press summaries of the post).

**From memory**: no source. [Jurenka 2024][jurenka2024]: the preference finding (LLM-15) was read in the abstract, the five principles (LLM-13) are from memory of the paper's body. The product descriptions of LLM-22. The models behind the Rori (Henkel 2024a), Pardos and Steiss studies are not named in their abstracts and are given here only as "ChatGPT" or by era.

[anthropic2025edu]: https://www.anthropic.com/news/introducing-claude-for-education
[anthropic2025report]: https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude
[bastani2025]: https://doi.org/10.1073/pnas.2422633122
[chatterji2025]: https://www.nber.org/papers/w34255
[daheim2024]: https://doi.org/10.18653/v1/2024.emnlp-main.478
[deng2024]: https://doi.org/10.1016/j.compedu.2024.105224
[desimone2025]: https://doi.org/10.1596/1813-9450-11125
[dinucujianu2025]: https://doi.org/10.18653/v1/2025.emnlp-main.15
[durham2026]: https://arxiv.org/abs/2603.14732
[educircuit2026]: https://arxiv.org/abs/2602.00095
[edufair2026]: https://arxiv.org/abs/2609.12949
[eedi2025]: https://arxiv.org/abs/2512.23633
[eedi2025news]: https://www.eedi.com/news/new-exploratory-research-from-eedi-and-google-deepmind-reveals-human-in-the-loop-ai-tutoring-outperforms-human-only-support
[eslhomework2024]: https://arxiv.org/abs/2409.15981
[engadget2025]: https://engadget.com/ai/anthropic-brings-claudes-learning-mode-to-regular-users-and-devs-170018471.html
[escalante2023]: https://doi.org/10.1186/s41239-023-00425-2
[falsehoods2026]: https://arxiv.org/abs/2610.31579
[fan2025]: https://doi.org/10.1111/bjet.13544
[fanous2025]: https://arxiv.org/abs/2502.08177
[gcse2026]: https://arxiv.org/abs/2606.24973
[gerlich2025]: https://doi.org/10.3390/soc15010006
[google2025]: https://blog.google/products/gemini/guided-learning-google-gemini/
[helpfulness2026]: https://arxiv.org/abs/2607.28128
[henkel2024grade]: https://doi.org/10.1145/3657604.3664693
[henkel2024rori]: https://doi.org/10.48550/arxiv.2402.09809
[instructor2026]: https://arxiv.org/abs/2611.19099
[jiang2021]: https://doi.org/10.1111/flan.12600
[jurenka2024]: https://doi.org/10.48550/arxiv.2407.12687
[kalai2025]: https://arxiv.org/abs/2509.04664
[kazemitabaar2023]: https://doi.org/10.1145/3544548.3580919
[kestin2025]: https://doi.org/10.1038/s41598-025-97652-6
[kortemeyer2024]: https://doi.org/10.1103/physrevphyseducres.20.020144
[kosmyna2025]: https://doi.org/10.48550/arxiv.2506.08872
[kqed2025]: https://www.kqed.org/mindshift/66662/students-didnt-get-answers-from-khanmigo-they-didnt-want-its-questions-either
[learnlm2024]: https://doi.org/10.48550/arxiv.2412.16429
[learnlm2026]: https://services.google.com/fh/files/misc/learnlm_oct26.pdf
[lehmann2024]: https://arxiv.org/abs/2409.09047
[liu2026]: https://doi.org/10.1093/teamat/hrag010
[macina2023]: https://doi.org/10.18653/v1/2023.findings-emnlp.372
[macina2025]: https://doi.org/10.18653/v1/2025.emnlp-main.11
[maurya2025]: https://doi.org/10.18653/v1/2025.naacl-long.57
[mba2026]: https://arxiv.org/abs/2609.23958
[meyer2024]: https://doi.org/10.1016/j.caeai.2023.100199
[olympiad2026]: https://arxiv.org/abs/2608.20521
[openai2025study]: https://openai.com/index/chatgpt-study-mode/
[openai2025syc]: https://openai.com/index/sycophancy-in-gpt-4o/
[oreopoulos2026]: https://www.nber.org/papers/w35620
[pane2014]: https://doi.org/10.3102/0162373713507480
[pardos2023]: https://doi.org/10.48550/arxiv.2302.06871
[pardos2024]: https://doi.org/10.1371/journal.pone.0304013
[prather2024]: https://doi.org/10.1145/3632620.3671116
[roschelle2016]: https://doi.org/10.1177/2332858416673968
[scratchmath2026]: https://arxiv.org/abs/2603.24961
[sharma2024]: https://doi.org/10.48550/arxiv.2310.13548
[spine2026]: https://arxiv.org/abs/2609.09090
[stadler2024]: https://doi.org/10.1016/j.chb.2024.108386
[steiss2024]: https://doi.org/10.1016/j.learninstruc.2024.101894
[tack2022]: https://doi.org/10.48550/arxiv.2205.07540
[truss2026]: https://arxiv.org/abs/2610.38917
[uci2026]: https://arxiv.org/abs/2603.00895
[wang2024bridge]: https://doi.org/10.18653/v1/2024.naacl-long.120
[wang2024copilot]: https://doi.org/10.48550/arxiv.2410.03017
[wangfan2026]: https://doi.org/10.1057/s41599-026-07310-z
[ye2022]: https://doi.org/10.1145/3534678.3539081
[zheng2023]: https://doi.org/10.52202/075280-2020
