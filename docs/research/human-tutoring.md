# Human tutoring

- **Field**: research on one-to-one and small-group tutoring by people: effect sizes, tutorial dialogue, expert, ordinary and peer tutors, scaffolding.
- **Scope**: how much tutoring by people helps, where the benefit comes from, what effective tutors do (questioning, hinting, explaining, diagnosing, handling errors and emotion) and what novice and peer tutors get wrong. Memory, practice and feedback in general are the learning science report (`LS-` ids), and reply form and turn-taking the learning interfaces report (`UX-` ids); both are cited, not repeated. Computer tutors appear only as evidence about human tutoring; intelligent tutoring systems have their own report.
- **Date**: 2026-11-26.
- **Outline started from**: Bloom 1984 (two sigma); Cohen, Kulik & Kulik 1982 (tutoring meta-analysis); VanLehn 2011 (interaction plateau) and VanLehn et al. 2007; Wood, Bruner & Ross 1976 and Wood, Wood & Middleton 1978 (scaffolding, contingent tutoring); Lepper et al. 1993 and Lepper & Woolverton 2002 (expert tutors); Graesser, Person & Magliano 1995, Graesser & Person 1994, Person et al. 1994 and 1995 (naturalistic tutoring, the five-step frame, questions, politeness); Graesser's AutoTutor work (expectation and misconception tailored dialogue); Chi et al. 2001, 2004 and 2008; Merrill et al. 1992; Hume et al. 1996 (hints); Koedinger & Aleven 2007 (assistance dilemma); Schwartz & Bransford 1998; van de Pol et al. 2010 (scaffolding review); Roscoe & Chi 2007 (peer tutors); Nickow, Oreopoulos & Quan 2020 (tutoring RCTs). The search added von Hippel 2024, Kraft, Schueler & Falken 2026, Guryan et al. 2023, Herppich et al. 2016, van de Pol et al. 2015, Belland et al. 2017, Kobayashi 2019, Ogan et al. 2012 and a 2026 trial with volunteer tutors.
- **Search tools**: web search (about 33 searches, for abstracts, abstract-level summaries and articles), the Crossref API (DOIs and abstracts, about 30 lookups), alphaXiv (one search, recent analyses of tutoring transcripts) and the arXiv API (preprint abstracts). About 40 search calls, not counting DOI lookups.
- **Could not reach**: Consensus (the plan's allowance for the period was used up on the first call); Elicit (the account's plan has no API access); PubMed was not used, since little of this field is indexed there; full texts behind paywalls and scanned PDFs, so most effect sizes come from abstracts; book chapters, which are **located** but not read.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

The effect-size evidence comes mostly from school pupils in the United States and Britain, in reading and mathematics. The process evidence (what tutors say and do) comes from small samples of recorded sessions, often a few tutors each, in subjects from research methods and algebra to physics, physiology, history and computer programming. Effect sizes are standardised mean differences (_d_ or _g_); 0.2 is small, 0.5 medium, 0.8 large.

## Claims

### How much tutoring helps

**TUT-1. Tutoring by people raises achievement reliably, by about a third of a standard deviation on average in randomised trials, with wide variation between programmes.**
Grade A. An early meta-analysis of 65 school tutoring programmes found that tutored pupils outperformed controls and liked the subject more ([Cohen 1982][cohen1982]). Across 89 randomised trials from preschool to secondary school, the pooled effect is 0.29 ([Nickow 2024][nickow2024]), revised down from 0.37 in the working paper ([Nickow 2020][nickow2020]). A large trial of daily mathematics tutoring for secondary pupils in Chicago raised test scores by 0.18 to 0.40 and grades in other subjects too, and the gains persisted into later years ([Guryan 2023][guryan2023]). Boundary: almost all trials are school programmes alongside classes; there are few trials with adults learning for an exam on their own.

**TUT-2. Bloom's claim that tutoring raises achievement by two standard deviations (two sigma) does not hold as a general estimate.**
Grade A (against the claim). The figure came from two short dissertation studies ([Bloom 1984][bloom1984]). A re-reading of them finds three-week experiments, tests on narrow unfamiliar topics, and tutoring bundled with mastery learning (quizzes, corrective feedback and retests), which alone accounted for about half the gain; none of the 96 trials in the 2020 review reached two sigma ([von Hippel 2024][vonhippel2024]). Narrow tests inflate effects: in the 1982 data tutoring raised scores by 0.84 on tests built for the programme against 0.27 on broad standardised tests ([von Hippel 2024][vonhippel2024]). A review of human tutoring against no tutoring found _d_ = 0.79, not 2.0 ([VanLehn 2011][vanlehn2011]). Boundary: the two-sigma studies are not wrong about their own setting; they show what tutoring plus mastery learning can do on a short unit with an aligned test.

**TUT-3. Tutoring helps most up to the grain of single steps: feedback and hints on each step of a solution are nearly as effective as a human tutor, and finer-grained interaction adds little (the interaction plateau).**
Grade B. In a review of experiments, human tutoring beat no tutoring by _d_ = 0.79, step-based computer tutors by 0.76 and answer-based systems (feedback only on the final answer) by 0.31 ([VanLehn 2011][vanlehn2011]). Boundary: few of the human tutoring studies were rigorous, and the human tutors were mostly not experts; the plateau is a pattern across different studies, not one experiment.

**TUT-4. Effects shrink as programmes grow, and depend on who tutors, how often and when.**
Grade A. In 282 randomised trials, the studies most like large-scale programmes aimed at standardised tests show effects a third to a half as large as the full sample, and effects decline steeply with programme size ([Kraft 2026][kraft2026]). Teachers and paraprofessionals (trained, paid tutors without a teaching licence) produce larger effects than volunteers and parents, as do sessions during the school day and at least three times a week ([Nickow 2024][nickow2024]; [Nickow 2020][nickow2020]). Boundary: these are school programmes; dosage and tutor type are correlated with other design features.

**TUT-5. A tutoring dialogue beats reading the same content only when the content is beyond what the learner could handle alone.**
Grade B. In seven experiments on qualitative physics, with all groups covering the same content, spoken and typed human tutoring and two dialogue-based computer tutors beat studying a text by a large margin only when novices studied material written for more advanced students; when the material matched the learner's level, dialogue was no better than reading ([VanLehn 2007][vanlehn2007]). Boundary: one domain and university students; it suggests tutoring earns its cost in the zone where help is needed, which fits LS-16.

### Where the benefit comes from

**TUT-6. Tutoring works mainly through what the learner constructs during it, not through the tutor's explanations: tutors who only prompt teach about as well as tutors who also explain.**
Grade B. When tutors were barred from giving explanations and feedback and only prompted, students learned just as much, through more scaffolding episodes and more of their own reading and reasoning ([Chi 2001][chi2001]). Students who watched a recorded tutoring session together and discussed it learned as much as the tutee; tutoring was effective when the tutee constructed knowledge, alone or with the tutor, not when the tutor conveyed it ([Chi 2008][chi2008]). This matches the advantage of generating over receiving (LS-3) and the ICAP ordering (UX-15). Boundary: physics, with capable students who could read the text; what weaker readers took from reading was limited ([Chi 2001][chi2001]).

**TUT-7. Ordinary, untrained tutors follow a five-step frame (tutor asks, student answers, tutor gives brief feedback, both improve the answer together, tutor checks understanding), and their benefit comes from collaborative problem solving, question answering and explanation around concrete examples, not from sophisticated strategies.**
Grade B. Recorded sessions of graduate students tutoring research methods and of older pupils tutoring algebra showed collaborative problem solving, questions and answers, and explanations tied to specific examples as the most prominent components, with ordinary tutors rather than experts ([Graesser 1995][graesser1995]). The frame is a widely observed pattern in human tutoring ([VanLehn 2007][vanlehn2007]). Its last two steps are what distinguish tutoring from the classroom pattern of question, answer and evaluation. The step-by-step wording above rests on the model's knowledge and a secondary summary of the paper. Boundary: descriptive; it explains why ordinary tutoring works, not that the frame is optimal.

**TUT-8. Tutors work from an expected answer: they hold the parts a good answer must contain and the misconceptions students typically bring, and they draw out missing parts with progressively more specific moves before stating them (expectation and misconception tailored dialogue).**
Grade C for human tutors. The sequence runs from a general invitation to say more (a pump), to a hint, to a prompt for a single missing word, to the tutor stating the part (an assertion), with a correction when a known misconception appears; the pattern was derived from human tutoring and built into the AutoTutor programme ([Nye 2014][nye2014]; [Graesser 2016][graesser2016]). Boundary: the description of human tutors comes from the same research group's corpus analyses; whether the computer version works belongs to the ITS report.

### What expert tutors do

**TUT-9. Tutors judged highly effective ask far more than they tell, prefer hints to answers, give feedback indirectly, let students find and fix their own errors, and track the student's confidence and engagement as closely as their knowledge.**
Grade C. Lepper's studies of expert tutors in elementary mathematics describe tutors who pursue motivational goals (confidence, challenge, curiosity, a sense of control) alongside cognitive ones ([Lepper 1993][lepper1993]) and summarise their style as intelligent, nurturant, Socratic, progressive, indirect, reflective and encouraging (the INSPIRE model) ([Lepper 2002][lepper2002]). A coding of expert sessions into dialogue modes found lecture and scaffolding the most frequent ([Cade 2008][cade2008]), so experts do explain. Boundary: small observational samples, expert status by reputation, and no controlled test of which of these behaviours cause learning.

**TUT-10. Pedagogical expertise does not guarantee interactive tutoring: in one study, tutors with more expertise were less interactive and their students learned less.**
Grade B (one study). Among 46 tutors, the more pedagogically expert were less interactive and, as a consequence, fostered less learning than those with less expertise ([Herppich 2016][herppich2016]). The authors expected the opposite. Together with TUT-6, it points to interaction itself, not the tutor's credentials, as what carries the effect. Boundary: one study, one setting; earlier work found experts more interactive.

### Scaffolding, hints and when to tell

**TUT-11. Scaffolding means taking over the parts of a task the learner cannot yet manage, so they can complete the rest, and handing them back as competence grows; its defining features are contingency (help fitted to the learner's current performance), fading and transfer of responsibility.**
Grade C (framework). The term comes from a study of tutors helping young children build a block structure, which named functions such as recruiting interest, simplifying the task, keeping the goal in view, marking critical features, controlling frustration and demonstrating ([Wood 1976][wood1976]). A review of a decade of classroom research identified contingency, fading and transfer of responsibility as its core and found few effectiveness studies, which suggested it works ([van de Pol 2010][vandepol2010]).

**TUT-12. Contingent help, more specific after a failure and less after a success, outperforms fixed strategies, but only when learners also get time to work on their own.**
Grade B. With young children learning a construction task, a contingent strategy taught more than three fixed strategies modelled on less successful mothers' teaching ([Wood 1978][wood1978]); the rule is to increase help after failure and reduce it after success ([Wood 1996][wood1996]). In a classroom experiment with 30 teachers and 768 pupils aged 12 to 15, highly contingent support raised achievement only when groups had much independent working time; with frequent teacher visits, less contingent support did better, and the authors conclude scaffolding is not unequivocally effective ([van de Pol 2015][vandepol2015]). Boundary: few experiments, very different ages.

**TUT-13. Designed scaffolds (prompts, partial structure, hints) built into problem-solving tasks improve learning substantially across ages.**
Grade A for computer-based scaffolding. Across 144 experiments in science, technology, engineering and mathematics, scaffolding had _g_ = 0.46 on cognitive outcomes, largest for principles and for adults; whether the scaffolds faded or not made no detectable difference ([Belland 2017][belland2017]). Boundary: STEM and problem-centred lessons only; the fading result contrasts with LS-17 (see Contested).

**TUT-14. Tutors favour hints that let students produce the answer themselves, ordered from general to specific, and they face a trade-off: too little help leaves students floundering, too much does the thinking for them (the assistance dilemma).**
Grade C. Expert physiology tutors gave hints often, to prompt recall of knowledge students had but did not use and to prompt inferences ([Hume 1993][hume1993]; [Hume 1996][hume1996]). Wood's contingent tutors moved from general verbal prompts to specific instructions and only then to demonstration (TUT-12). The trade-off between giving and withholding help is named and studied experimentally in computer tutors ([Koedinger 2007][koedinger2007]). Boundary: descriptions of tutor behaviour; the controlled evidence on hint design is in the ITS report, and learners' misuse of hints in AM-26.

**TUT-15. Explaining works when the learner lacks the knowledge to construct it and is ready to use it; explanations given before a learner has engaged with the problem, or to a learner who could produce them, add little.**
Grade B. Dialogue beat text only for content above the learner's level (TUT-5), prompting without explanation sufficed for capable students (TUT-6), and students learned more from a lecture after first analysing contrasting cases than from the lecture alone ("a time for telling") ([Schwartz 1998][schwartz1998]). Unguided discovery is weaker than explicit instruction (LS-18), and novices learn more from worked examples than from solving unaided (LS-15). Boundary: the timing of explanation against attempts is contested (LS-19).

**TUT-16. Socratic questioning, leading a learner to an answer through a sequence of questions, is a hallmark of tutors judged expert, but controlled comparisons with explaining show small or unreliable differences, and ordinary tutors rarely use it.**
Grade C. Expert tutors are described as Socratic ([Lepper 2002][lepper2002]). A comparison of Socratic and didactic tutoring in basic electronics favoured the Socratic style ([Rosé 2001][rose2001]), but a later account reports the learning difference as a non-significant trend ([VanLehn 2007][vanlehn2007]). Ordinary tutors rely on the five-step frame instead (TUT-7). Boundary: the evidence is mostly descriptive.

**TUT-17. Students ask far more questions in tutoring than in class, and the quality of their questions, not the number, goes with achievement.**
Grade B. Student questions were about 240 times as frequent in tutoring as in classrooms, while tutor questions were only slightly more frequent than teacher questions; question quality correlated with achievement once students had some tutoring experience, and students needed training to ask good ones ([Graesser 1994][graesser1994]).

### Diagnosing, errors and emotion

**TUT-18. Tutors are poor at diagnosing what a student misunderstands, and a student's "yes" to "Do you understand?" says almost nothing; the quality of the student's own answers is the best evidence.**
Grade B. Tutors judged students' correct understanding against their own knowledge and were poor at detecting students' alternative understanding (misconceptions) ([Chi 2004][chi2004]). In 44 recorded sessions, students' answers to comprehension-gauging questions were very misleading, while the quality of their answers to content questions was the most reliable indicator of understanding ([Person 1994][person1994]). Boundary: student and graduate tutors; the expert tutors of TUT-9 are described as diagnosing better, but without measurement.

**TUT-19. Conversational politeness works against tutoring: tutors soften or skip negative feedback and avoid hard questions, and students avoid admitting they do not understand.**
Grade C. Students may avoid saying they do not understand so as not to seem impolite, and tutors may avoid questions that would expose a student's gaps ([Person 1994][person1994]); politeness rules of conversation are argued to inhibit effective tutoring ([Person 1995][person1995]). Boundary: an argument from discourse analysis of a few corpora, not a controlled test. It fits the evidence that clear task feedback beats vague feedback (LS-22).

**TUT-20. Effective tutors treat errors as material to work with: they let students find and repair errors that teach something, and intervene quickly on errors that would derail the solution.**
Grade C. Expert tutors let students make productive errors and correct themselves ([Lepper 2002][lepper2002]); a comparison of human tutors and intelligent tutoring systems describes tutors guiding students through error recovery rather than correcting at once ([Merrill 1992][merrill1992]). Errors followed by correction help learning, and confidently held errors are the most corrected (LS-20). Boundary: descriptive; which errors to let run is a judgment the studies do not formalise.

**TUT-21. Effective tutors manage emotion and motivation as part of the task: they control frustration, protect confidence and keep the challenge right, and their cognitive and motivational goals sometimes conflict.**
Grade C. Frustration control is one of the original scaffolding functions ([Wood 1976][wood1976]), and expert tutors track confidence and engagement (TUT-9). In tutoring for an introductory programming course, a strategy that serves learning can lower motivation and the reverse ([Boyer 2008][boyer2008]). Confusion helps only when resolved (MOT-14), and praise for ability backfires (MOT-17). Boundary: small corpora; the motivation report holds the controlled evidence.

**TUT-22. Rapport is named by tutors and students as part of good tutoring, but evidence that it causes learning is thin and correlational.**
Grade C. In a study of 12 pairs of secondary-school peer tutors, friends learned more than strangers, and playful teasing by tutees went with larger gains for their tutors among friends but with lower learning among strangers ([Ogan 2012][ogan2012]). A search for studies testing rapport as a cause of learning found none; the rest of the literature is practitioner guidance and perception surveys. Boundary: rapport may matter mainly through engagement and attendance, which tutoring at scale depends on (TUT-4).

### Novice and peer tutors

**TUT-23. Peer tutoring helps both sides: tutees learn, and tutors learn too, more when they teach interactively.**
Grade A. Tutors in school programmes gained in understanding and attitudes as their tutees did ([Cohen 1982][cohen1982]); a later meta-analysis of peer tutoring examined which arrangements work best ([Leung 2015][leung2015]). Preparing to teach (_g_ = 0.35) and then teaching (_g_ = 0.56) beat studying without that expectation, and interactive teaching beat non-interactive ([Kobayashi 2019][kobayashi2019]). Boundary: tutor gains are often modest (TUT-24).

**TUT-24. Novice and peer tutors tell too much: they lecture and deliver answers rather than drawing out the learner's thinking, even after training, and they talk most of the session.**
Grade B. Peer tutors show a pervasive knowledge-telling bias, delivering knowledge rather than developing it, even when trained ([Roscoe 2007][roscoe2007]). In a 2026 trial with 1,030 volunteer tutors in online SAT mathematics sessions, tutors talked 91.5% of the time; automated feedback raised their eliciting of learner ideas and learner reasoning by 8–15% but did not change the share of talk ([Demszky 2026][demszky2026], preprint). Untrained tutors also check understanding with "Do you understand?" (TUT-18). Boundary: TUT-10 shows that expert tutors can show the same pattern.

**TUT-25. Structuring the interaction, by training tutors in question sequences and explanation or by giving them feedback on their moves, improves the dialogue and learning.**
Grade B. Pupils trained to ask each other sequenced questions and to explain could scaffold each other's higher-order thinking ([King 1998][king1998]); feedback on talk moves shifted volunteer tutors towards eliciting reasoning ([Demszky 2026][demszky2026]). Boundary: effects on the balance of talk were absent, and training tutors to adopt specific strategies is hard (TUT-24).

## Terms

Research name, with the everyday name in brackets where they differ.

- Two sigma (two standard deviations, the "two-sigma problem"); mastery learning (move on only after showing you know it): TUT-2.
- Interaction granularity: answer-based, step-based, substep-based (feedback on the final answer, on each step, within a step); interaction plateau: TUT-3.
- High-dosage tutoring (frequent tutoring, three or more sessions a week); paraprofessional tutor (trained tutor without a teaching licence): TUT-1, TUT-4.
- Interactive, constructive and tutor-centred learning (the student doing the thinking versus the tutor doing it): TUT-6.
- Five-step tutoring frame; IRE (question, answer, evaluation: the classroom pattern): TUT-7.
- Expectation and misconception tailored dialogue; pump, hint, prompt, assertion (say more, a nudge, fill in a word, telling): TUT-8.
- INSPIRE model (the traits of expert tutors): TUT-9.
- Scaffolding (support that is taken away again); contingency (help that fits the moment); fading (gradually less help); transfer of responsibility (handing over control): TUT-11, TUT-12.
- Hint ladder, graded hints (from a nudge to the answer); assistance dilemma (how much to help): TUT-14.
- A time for telling (explain after the student has wrestled with it): TUT-15.
- Socratic questioning (teaching by questions); didactic tutoring (teaching by explaining): TUT-16.
- Comprehension-gauging question ("Do you understand?"): TUT-18.
- Face threat, politeness strategies (not wanting to embarrass the other): TUT-19, TUT-22.
- Productive errors (mistakes worth letting a student find): TUT-20.
- Peer tutoring, reciprocal tutoring (students teaching students); learning by teaching (the protégé effect); knowledge telling and knowledge building (lecturing versus thinking it through): TUT-23, TUT-24.
- Talk moves (eliciting, revoicing, building on a student's idea): TUT-24, TUT-25.

## Contested and open

- **How big the effect is.** Two sigma survives in popular writing; the trial evidence puts typical effects near 0.3 and lower at scale ([von Hippel 2024][vonhippel2024]; [Nickow 2024][nickow2024]; [Kraft 2026][kraft2026]). The 0.79 human tutoring estimate ([VanLehn 2011][vanlehn2011]) rests on few studies, and narrow tests inflate effects (TUT-2).
- **Is tutoring's benefit interaction or something human?** The interaction plateau (TUT-3) and the prompt-only result (TUT-6) say the benefit is step-level interaction and learner construction, which a machine can provide. Expert tutor studies (TUT-9, TUT-21) stress motivation, relationship and attention, which those comparisons do not measure, and school trials cannot separate them (TUT-4).
- **Expert tutors.** Their described behaviour (TUT-9) comes from small observational studies, and one study found experts less interactive and less effective (TUT-10). What expertise means in tutoring is not settled.
- **Fading.** Fading worked examples beats an abrupt switch (LS-17), but in a large scaffolding meta-analysis fading made no detectable difference ([Belland 2017][belland2017]), and contingent support helped only with enough independent work time ([van de Pol 2015][vandepol2015]).
- **Socratic versus didactic.** Experts are described as Socratic, but the controlled comparison is weak (TUT-16), and for novices explanation and worked examples are often better (TUT-15, LS-15).
- **When to tell.** Explanation after an attempt ([Schwartz 1998][schwartz1998]; LS-19) versus guidance first (LS-15, LS-18) remains open; the answer seems to depend on prior knowledge (TUT-5, LS-16).
- **Rapport.** Widely assumed, rarely tested as a cause (TUT-22).
- **Who the evidence covers.** Most trials are school pupils in reading and mathematics; the process studies are small and mostly STEM. There is little on adults preparing for exams alone, on written chat tutoring between people, or on subjects such as law, history or languages.

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor in a Chat included; the synthesis decides what the app does.

1. **Aim for what tutoring actually delivers.** Expect gains near a third of a standard deviation, not two (TUT-1, TUT-2), and attribute them to step-level interaction (TUT-3). A tutor that works on each step of the Student's own solution is doing the part that matters; one that only marks final answers is not.
2. **Let the Student do the constructing.** Prompting without explaining teaches as well for capable learners (TUT-6), and peer and novice tutors fail by telling (TUT-24). The default turn asks for the Student's next step, reasoning or answer; the tutor talks less than the Student.
3. **Explain when the Student cannot get there, and after they have tried.** Dialogue pays off for content beyond the Student's level (TUT-5), and explanation lands best after an attempt (TUT-15). Novices still need worked examples (LS-15), so asking is not a rule for every Student and every moment.
4. **Climb a hint ladder, one rung at a time.** Start with a general nudge, get more specific after each failure and less after each success, and state the answer only when the Student cannot produce it (TUT-8, TUT-12, TUT-14). Leave room to work: contingency helps only with independent work time (TUT-12).
5. **Track the expected answer and the likely misconceptions.** Know what a complete answer to the current Question or Exercise contains and which wrong ideas are common, and draw out the missing parts before stating them (TUT-8).
6. **Diagnose from what the Student produces, never from "Do you understand?".** Ask the Student to answer, explain or apply instead (TUT-18). Assume a misconception is possible even when the Student's words sound right, since tutors systematically miss them (TUT-18).
7. **Be clear about errors, and choose which to let run.** Say plainly when something is wrong; politeness that hides it costs learning (TUT-19). Let an instructive error play out so the Student can find it, but stop one that would waste the session (TUT-20, LS-20).
8. **Watch confidence and frustration as closely as knowledge.** Repair frustration before it turns to giving up, keep the challenge achievable, praise strategy not ability (TUT-21, MOT-14, MOT-17). Rapport may help engagement, but it is not evidence of learning (TUT-22).
9. **Invite the Student's questions, and treat good ones as progress.** Students ask far more in tutoring than in class, and the quality of their questions tracks achievement (TUT-17).
10. **Expect dosage and continuity to matter.** Frequent, regular sessions work better than occasional ones (TUT-4); the tutor's effect depends on the Student coming back.

**Conflicts with other fields.** Asking rather than telling (items 2 and 4) conflicts with worked examples for novices (LS-15, LS-16) and with short replies (UX-17): a hint ladder costs turns, and some Students need the full explanation first. Clear negative feedback (item 7) must coexist with the motivation report's warnings about judging the person (MOT-17, LS-21). Hints are only useful if the Student uses them well, and many do not (AM-26). Whether a machine can supply the motivational and relational part of tutoring (item 8) is open; the ITS and LLM reports (ITS, LLM) take it up.

## Sources

Links go to the DOI where one exists. Statuses rest on the abstracts or abstract-level summaries read during the search.

**Verified** (abstract or text checked): [Belland 2017][belland2017], [Chi 2001][chi2001], [Chi 2004][chi2004] (through abstract excerpts quoted in citing papers), [Chi 2008][chi2008], [Cohen 1982][cohen1982], [Demszky 2026][demszky2026] (preprint), [Graesser 1994][graesser1994], [Graesser 1995][graesser1995], [Guryan 2023][guryan2023], [Herppich 2016][herppich2016], [Hume 1993][hume1993], [Kobayashi 2019][kobayashi2019], [Kraft 2026][kraft2026] (through the working paper's abstract), [Nickow 2020][nickow2020], [Nickow 2024][nickow2024], [Ogan 2012][ogan2012], [Person 1994][person1994], [Roscoe 2007][roscoe2007], [van de Pol 2010][vandepol2010], [van de Pol 2015][vandepol2015], [VanLehn 2007][vanlehn2007], [VanLehn 2011][vanlehn2011], [von Hippel 2024][vonhippel2024] (article), [Wood 1978][wood1978].

**Located** (exists, content not checked): [Bloom 1984][bloom1984], [Boyer 2008][boyer2008], [Cade 2008][cade2008], [Graesser 2016][graesser2016], [Hume 1996][hume1996], [King 1998][king1998], [Koedinger 2007][koedinger2007], [Lepper 1993][lepper1993], [Lepper 2002][lepper2002] (book chapter; an abstract-level summary was read), [Leung 2015][leung2015], [Merrill 1992][merrill1992], [Nye 2014][nye2014], [Person 1995][person1995], [Rosé 2001][rose2001], [Schwartz 1998][schwartz1998], [Wood 1976][wood1976] (the functions through secondary summaries), [Wood 1996][wood1996].

**From memory**: none. The step-by-step wording of the five-step frame (TUT-7) rests on the model's knowledge of a verified work.

[belland2017]: https://doi.org/10.3102/0034654316670999
[bloom1984]: https://doi.org/10.2307/1175554
[boyer2008]: https://doi.org/10.1007/978-3-540-69132-7_28
[cade2008]: https://doi.org/10.1007/978-3-540-69132-7_50
[chi2001]: https://doi.org/10.1207/s15516709cog2504_1
[chi2004]: https://doi.org/10.1207/s1532690xci2203_4
[chi2008]: https://doi.org/10.1080/03640210701863396
[cohen1982]: https://doi.org/10.3102/00028312019002237
[demszky2026]: https://arxiv.org/abs/2611.07072
[graesser1994]: https://doi.org/10.3102/00028312031001104
[graesser1995]: https://doi.org/10.1002/acp.2350090604
[graesser2016]: https://doi.org/10.1007/s40593-015-0086-4
[guryan2023]: https://doi.org/10.1257/aer.20210434
[herppich2016]: https://doi.org/10.1007/s11251-015-9363-8
[hume1993]: https://escholarship.org/uc/item/9x92v40r
[hume1996]: https://doi.org/10.1207/s15327809jls0501_2
[king1998]: https://doi.org/10.1037/0022-0663.90.1.134
[kobayashi2019]: https://doi.org/10.1111/jpr.12221
[koedinger2007]: https://doi.org/10.1007/s10648-007-9049-0
[kraft2026]: https://doi.org/10.3102/00346543261446660
[lepper1993]: https://doi.org/10.4324/9780203052594-8
[lepper2002]: https://stafforini.com/works/lepper-2002-wisdom-practice-lessons/
[leung2015]: https://doi.org/10.1037/a0037698
[merrill1992]: https://doi.org/10.1207/s15327809jls0203_2
[nickow2020]: https://doi.org/10.3386/w27476
[nickow2024]: https://doi.org/10.3102/00028312231208687
[nye2014]: https://doi.org/10.1007/s40593-014-0029-5
[ogan2012]: https://doi.org/10.1007/978-3-642-30950-2_2
[person1994]: https://doi.org/10.1016/1041-6080(94)90010-8
[person1995]: https://doi.org/10.1207/s1532690xci1302_1
[roscoe2007]: https://doi.org/10.3102/0034654307309920
[rose2001]: https://www.inf.ed.ac.uk/publications/report/1183.html
[schwartz1998]: https://doi.org/10.1207/s1532690xci1604_4
[vandepol2010]: https://doi.org/10.1007/s10648-010-9127-6
[vandepol2015]: https://doi.org/10.1007/s11251-015-9351-z
[vanlehn2007]: https://doi.org/10.1080/03640210709336984
[vanlehn2011]: https://doi.org/10.1080/00461520.2011.611369
[vonhippel2024]: https://www.educationnext.org/two-sigma-tutoring-separating-science-fiction-from-science-fact/
[wood1976]: https://doi.org/10.1111/j.1469-7610.1976.tb00381.x
[wood1978]: https://doi.org/10.1177/016502547800100203
[wood1996]: https://doi.org/10.1080/0305498960220101
