# Learning science

- **Field**: cognitive psychology of learning and memory, with what neuroscience adds.
- **Scope**: how people encode, keep and use knowledge, and which study and teaching conditions change that. Motivation, emotion, metacognition, interface design and tutoring as a craft each have their own report and appear here only where a learning-science finding depends on them.
- **Date**: 2026-11-26.
- **Search tools**: Consensus (semantic search over Semantic Scholar, OpenAlex and PubMed; free plan, abstracts only), PubMed, alphaXiv; about 38 searches. Every source below was returned by one of them in this session.
- **Could not reach**: Elicit (the account's plan has no API access, so every call was refused); full texts behind paywalls, so effect sizes come from abstracts; books except through their abstracts or reviews; alphaXiv returned only computational and machine-learning work on forgetting curves, so no claim cites it. No general web search was run: the paper connectors covered every topic.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies.

Most of the evidence comes from university students and school pupils in Western countries: a systematic review of classroom retrieval practice found only 6% of experiments ran outside WEIRD countries ([Agarwal 2021][agarwal2021]). Effect sizes are standardised mean differences (_d_ or _g_); 0.2 is small, 0.5 medium, 0.8 large.

## Claims

### Memory and prior knowledge

**LS-1. Working memory holds only a few new elements at once, while long-term memory has no practical limit and stores knowledge as schemas that working memory can then handle as single units.**
Grade C (theory and reviews). The limit sits around three to five chunks for new, unrelated items ([Cowan 2001][cowan2001]); cognitive load theory builds instructional design on this split between a narrow working memory and a vast long-term memory ([Sweller 1998][sweller1998]; [Sweller 2019][sweller2019]). Boundary: the exact number is contested, and some models treat the limit as a resource spread across items rather than a slot count ([Ma 2014][ma2014]). The limit applies to new information; organised prior knowledge bypasses it.

**LS-2. How hard a task is depends on the student as much as on the material: the same Problem overloads a novice and is routine for someone whose long-term memory already links its elements.**
Grade C (theory with supporting experiments). Element interactivity, the number of elements that must be held together, is counted against what the student already knows ([Chen 2023][chen2023ei]; [Leahy 2019][leahy2019]). Boundary: element interactivity has no agreed measure, which makes the claim hard to test (see Contested).

**LS-3. Students remember and understand more when they produce the content themselves (generate, explain, summarise, draw, teach) than when they read it.**
Grade A. The generation effect is about _d_ = 0.40 across 86 studies ([Bertsch 2007][bertsch2007]) and depends on how constrained the generation is ([McCurdy 2020][mccurdy2020]); generating parts of a text beats reading it (_g_ = 0.41), not explained by extra time on task ([Schindler 2023][schindler2023]). Generative learning theory groups such activities as selecting, organising and integrating new material with prior knowledge ([Fiorella 2015][fiorella2015]). Boundary: the benefit is largest when the generation task adds processing the material does not already prompt ([Schindler 2023][schindler2023]).

**LS-4. Prior knowledge strongly predicts where a student ends up, but not how much they gain; its effect on learning can be positive, negative or nil depending on conditions.**
Grade A. Across 8,776 effect sizes, pretest and posttest correlate at _r_ = .53, but pretest and normalised gain at _r_ = −.06 with a very wide spread ([Simonsmeier 2021][simonsmeier2021]). A review names 16 mechanisms through which prior knowledge helps or hinders, including interference ([Schneider 2025][schneider2025]); an experiment that induced domain knowledge found no effect on new learning ([Buchin 2025][buchin2025]). Boundary: mostly correlational data.

**LS-5. Misconceptions yield more to explanations that name the wrong idea and say why it is wrong than to plain correct exposition.**
Grade A. Refutation texts beat ordinary texts (_g_ = 0.41, 44 comparisons) across many contexts ([Schroeder 2022][schroeder2022]); a preregistered meta-analysis of 294 effect sizes confirms a consistent advantage ([Danielson 2024][danielson2024]). Boundary: nearly all studies concern science misconceptions.

### Retrieval, spacing and sequence

**LS-6. Recalling material from memory (practice testing) produces more durable learning than restudying it.**
Grade A. Meta-analyses find a medium advantage over restudy, larger for recall than for recognition tests ([Rowland 2014][rowland2014]; [Adesope 2017][adesope2017]). It holds in classrooms: _g_ = 0.50 across 222 studies and 48,000 students ([Yang 2021][yang2021]), _g_ = 0.37 in school classrooms ([Ruitenburg 2026][ruitenburg2026]), _d_ = 0.56 in psychology courses ([Schwieren 2017][schwieren2017]), and in health professions education ([Trumble 2023][trumble2023]). Boundary: corrective feedback, format match between practice and exam, and repetitions moderate it ([Yang 2021][yang2021]); a mathematics meta-analysis found no robust testing effect (_g_ = 0.18, CI crossing zero, few studies) ([Murray 2025][murray2025]); many studies confound the direct benefit with a benefit for material studied after the test ([Gereau 2026][gereau2026]).

**LS-7. Retrieval practice transfers moderately to new question formats and applications, but much less without elaborated retrieval and when the final test asks something different from what was practised.**
Grade A. Transfer _d_ = 0.40 across 192 effect sizes; strongest across test formats, to application and inference questions and medical diagnosis problems ([Pan 2018][pan2018]). After publication-bias correction, transfer often disappears unless retrieval was elaborated, responses were congruent and initial test performance was good ([Pan 2018][pan2018]).

**LS-8. Spreading study over several sessions beats massing it into one, and the best gap grows with how long the knowledge must last.**
Grade A. 839 assessments show that the gap that maximises retention increases with the retention interval ([Cepeda 2006][cepeda2006]). Classroom effects: _d_ = 0.54 ([Mawson 2025][mawson2025]), _g_ = 0.20 in schools ([Ruitenburg 2026][ruitenburg2026]); second-language learning shows medium-to-large effects, with equal and expanding gaps equivalent ([Kim 2022][kim2022]); mathematics _g_ = 0.28 ([Murray 2025][murray2025]). Spacing retrieval sessions adds to retrieval ([Latimier 2021][latimier2021]; [Carpenter 2022][carpenter2022]). Boundary: retention depends more on the number of sessions an item appears in than on how repetitions are split among them ([Walsh 2022][walsh2022]).

**LS-9. Practising until correct recall and then relearning to criterion in several later spaced sessions gives large, durable retention for little extra time.**
Grade B. Successive relearning beat single-session learning by _d_ = 1.52 to 4.19 ([Rawson 2018][rawson2018]); three correct recalls initially plus three widely spaced relearning sessions was the efficient schedule for conceptual material ([Rawson 2011][rawson2011]). A semester-long classroom study controlled exposure time and found better recall, plus better metacognition and lower anxiety ([Higham 2022][higham2022]). Boundary: few research groups, mostly definitions and facts.

**LS-10. Mixing Problems or examples of different types (interleaving) helps students tell similar categories apart, but not for every kind of material.**
Grade A. Overall _g_ = 0.42 across 59 studies; largest for paintings and visual material, small for mathematics (_g_ = 0.34), unclear for expository texts, and reversed for word lists (_g_ = −0.39); stronger when categories look alike ([Brunmair 2019][brunmair2019]). The effect extends to rock types, birdcalls and tastes ([Do 2023][do2023]; [Abel 2023][abel2023]). Boundary: when students search for a rule rather than memorise examples, blocking can be better ([Little 2025][little2025]); interleaving and spacing need distinct explanations ([Chen 2021][chen2021si]).

**LS-11. Attempting questions before studying the answers (pretesting) improves memory for those questions, even when the attempts are wrong, but not for the rest of the material.**
Grade A. Specific effect _g_ = 0.54, general effect _g_ = 0.04 ([St. Hilaire 2023][sthilaire2023]); works with texts, videos and lectures when the correct answer follows ([Pan 2023][pan2023]) and in older adults ([Mera 2025][mera2025]). Boundary: the advantage disappears after a few retrieval repetitions; a pretest is most useful to skip what a student already knows ([Wilschut 2026][wilschut2026]).

### Explaining and elaborating

**LS-12. Prompting students to explain to themselves why steps or statements hold improves learning.**
Grade A. Self-explanation prompts _g_ = 0.55 across 69 effect sizes, across subjects and task types ([Bisra 2018][bisra2018]). In mathematics the effect is small to moderate on immediate tests, stronger with scaffolded explanations, and weakly evidenced over delays or in classrooms ([Rittle-Johnson 2017][rittlejohnson2017]). Self-explaining beat writing explanations for a fictitious student ([Lachner 2020][lachner2020]). Boundary: benefits decline with very complex material and low prior knowledge ([Gao 2025][gao2025]).

**LS-13. Asking "why is this true?" about facts (elaborative interrogation) helps, mainly when students have the prior knowledge to answer.**
Grade B. Rated moderate utility, short of high because of limited classroom evidence ([Dunlosky 2013][dunlosky2013]). With long texts, it works only with support such as marked main ideas or given questions ([Boudreau 1999][boudreau1999]), and an undergraduate study found it can hinder outside specific conditions ([Jáñez 2025][janez2025]). Boundary: the benefit depends on prior knowledge and, for long texts, on support; classroom evidence is limited.

**LS-14. Comparing two or more examples that share a structure lets students abstract the principle and apply it to new cases; a single example rarely transfers.**
Grade B. Students who compared two story analogues formed a problem schema that predicted transfer, while principles or diagrams given with one analogue did not ([Gick 1983][gick1983]). Comparing two negotiation cases beat studying them separately ([Gentner 2003][gentner2003]). Spontaneous transfer across contexts is hard and needs schema-focused support ([Catrambone 1989][catrambone1989]). Boundary: the cited studies are small laboratory experiments with adults; no meta-analysis was found.

### Guidance, examples and the path to independence

**LS-15. Novices learn more from studying worked examples than from solving the same Problems unaided.**
Grade A. Worked examples improve mathematics performance (_g_ = 0.48, 55 studies), with correct examples more useful than incorrect ones ([Barbieri 2023][barbieri2023]); example-problem pairs beat problem solving alone for novices ([van Gog 2011][vangog2011]); examples reduce load and help transfer ([Chen 2023][chen2023we]). Boundary: evidence is mostly from well-structured domains such as mathematics, physics and programming ([Crissman 2006][crissman2006]).

**LS-16. Guidance that helps novices hinders students who already know the material (expertise reversal).**
Grade A. Across 60 experiments, low prior knowledge students learn more from high-assistance instruction (_d_ = 0.51) and high prior knowledge students from low assistance (_d_ = −0.43) ([Tetzlaff 2025][tetzlaff2025]; [Kalyuga 2007][kalyuga2007]). Boundary: evidence is weaker for younger students and for humanities and language learning; withholding help from experts matters less than giving it to novices ([Tetzlaff 2025][tetzlaff2025]). A rapid schema-based test of knowledge level correlated up to .92 with traditional tests in a fraction of the time and could steer the choice of instruction ([Kalyuga 2004][kalyuga2004]).

**LS-17. Moving from full worked examples to independent problem solving by removing steps one at a time (fading) beats switching abruptly, and fading adapted to each student beats a fixed schedule.**
Grade B. Fading improved near transfer, and removing the last steps first worked better than removing the first ([Renkl 2002][renkl2002]; [Renkl 2003][renkl2003]); adaptive fading inside a tutoring system beat fixed fading in a lab and a classroom experiment ([Salden 2009][salden2009]). Boundary: few studies, in well-structured domains; the fading gain was for near transfer.

**LS-18. Unguided discovery teaches less than explicit instruction, while discovery with guidance (feedback, examples, scaffolds, prompts to explain) teaches more than either.**
Grade A. Unassisted discovery vs explicit instruction _d_ = −0.38; enhanced discovery vs other instruction _d_ = 0.30 ([Alfieri 2011][alfieri2011]). Guidance in inquiry learning helps learning outcomes (_d_ = 0.50) ([Lazonder 2016][lazonder2016]). The advantage of guidance recedes once prior knowledge is high ([Kirschner 2006][kirschner2006]).

**LS-19. Struggling with a Problem before being taught the solution can improve conceptual understanding, provided instruction follows.**
Grade A, contested. Problem solving then instruction beat instruction then problem solving (_g_ = 0.36, 53 studies; up to 0.58 with high fidelity to Productive Failure) ([Sinha 2021][sinha2021]). Boundary: reversed for primary-school children and for domain-general skills ([Sinha 2021][sinha2021]); observing another student's failed attempts worked as well or better ([Hartmann 2021][hartmann2021]; [Braas 2025][braas2025]). The design space lies between pure discovery and pure instruction ([Kapur 2016][kapur2016]).

### Errors and feedback

**LS-20. Making errors helps learning when corrective feedback follows, and confidently held errors are the most likely to be corrected.**
Grade B. Errorful learning with feedback outperforms error avoidance in laboratory studies; analysis of the reasoning behind a mistake matters ([Metcalfe 2016][metcalfe2016]; [Mera 2021][mera2021]). High-confidence errors are corrected more often, and the effect lasts a week, but those errors also return when the correction is forgotten ([Butler 2011][butler2011]). Boundary: mostly general-knowledge and vocabulary items.

**LS-21. Feedback helps learning on average, but its effect varies widely and a large share of feedback makes performance worse, especially feedback aimed at the person rather than the task.**
Grade A. Educational feedback _d_ = 0.48 across 435 studies, with large heterogeneity explained largely by its information content ([Wisniewski 2020][wisniewski2020]). Across 607 effect sizes, over a third of feedback interventions decreased performance; effects weaken as feedback moves attention from the task towards the self ([Kluger 1996][kluger1996]). Feedback works when it answers where the student is going, how they are doing and what to do next ([Hattie 2007][hattie2007]).

**LS-22. Feedback that explains why an answer is right or wrong helps more than feedback that only says right or wrong.**
Grade A. In computer-based environments, elaborated feedback _g_ = 0.49, correct-answer feedback 0.32, right/wrong only 0.05; elaborated feedback especially helps higher-order outcomes ([Van der Kleij 2015][vanderkleij2015]). Feedback works best when students cannot simply copy the answer from it ([Bangert-Drowns 1991][bangertdrowns1991]). Boundary: the best timing is unsettled (see Contested).

### Effort and its misreading

**LS-23. Conditions that make practice feel harder and slower (spacing, interleaving, retrieval) often produce better long-term learning, and performance during practice is a poor guide to it.**
Grade B. Learning and performance can dissociate in both directions ([Soderstrom 2015][soderstrom2015]); difficulties that work are those that prompt the processing learning needs ([Ruitenburg 2026][ruitenburg2026]; [Binks 2026][binks2026]). Students misjudge them: after massed practice pupils were grossly overconfident, after spaced practice accurate ([Emeny 2021][emeny2021]); students rated varied retrieval cues less effective although they worked better ([Butowska 2024][butowska2024]); students prefer blocking ([Li 2025][li2025]). Perceived effort reads as poor learning and drives students away from these conditions ([de Bruin 2023][debruin2023]). Boundary: not every difficulty is desirable; hard-to-read fonts help memory only under narrow conditions and often not at all ([Weißgerber 2017][weissgerber2017]; [Muhmenthaler 2026][muhmenthaler2026]).

### Attention and sleep

**LS-24. Attention split during learning lowers what is retained, even when immediate comprehension seems fine.**
Grade B. Laptop multitasking lowered test scores for the user and for peers who could see the screen ([Sana 2012][sana2012]); allowing devices in lectures did not reduce in-class quiz scores but lowered later exam scores ([Glass 2018][glass2018]); media multitasking, unlike mind wandering, was associated with worse learning ([Wammes 2018][wammes2018]); a review links media multitasking to lower recall, comprehension and self-regulation, which students misjudge ([May 2018][may2018]). Boundary: the studies are of students in lecture settings; one-to-one study was not searched.

**LS-25. Sleep supports memory: losing sleep before learning impairs encoding, and sleep after learning helps consolidate it.**
Grade A, with caution. Total sleep deprivation before learning _g_ = 0.62, after learning _g_ = 0.28, with publication bias and low power ([Newbury 2021][newbury2021]); restricting sleep to 3–6.5 hours impairs memory formation about as much (_g_ = 0.29) ([Crowley 2024][crowley2024]); sleep benefits motor memory consolidation (_g_ = 0.43) ([Schmid 2020][schmid2020]). Boundary: effects on emotional and on false memories appear only under particular methods ([Lipinska 2019][lipinska2019]; [Newbury 2019][newbury2019]).

### What neuroscience adds

**LS-26. Neuroscience describes how memories are consolidated (replay of new memories during sleep, gradual reorganisation from hippocampus-dependent to schema-like neocortical memory), which fits the behavioural findings on sleep, spacing and schemas.**
Grade B for the mechanisms, C for their educational use. Hippocampal replay during slow-wave sleep, with sleep spindles, favours transforming episodic memory into schema-like neocortical memory ([Brodt 2023][brodt2023]; [Kumral 2023][kumral2023]); memories move from detailed to gist and schema representations ([Sekeres 2018][sekeres2018]); cueing memories during sleep strengthens them (_g_ = 0.29) ([Hu 2020][hu2020]). Boundary: the classical consolidation concept is itself questioned ([Moscovitch 2022][moscovitch2022]).

**LS-27. Neuroscience has not yet produced a teaching method that behavioural research had not already found; whether a method works is shown by what students can do afterwards, not by brain measures.**
Grade C. No current example of neuroscience motivating a new effective teaching method; behaviour is the relevant test ([Bowers 2016][bowers2016]); brain imaging mostly confirms what educators already know ([Donoghue 2019][donoghue2019]). Counterpoint: the gap is narrowing with portable imaging of teacher–student interaction ([Tan 2023][tan2023]), and neuroscience can still offer opportunities ([Varma 2008][varma2008]).

### Myths and weak techniques

**LS-28. Matching instruction to a student's preferred "learning style" (visual, auditory and so on) does not improve learning.**
Grade A. Almost no study meets the design needed to test the claim, and those that do contradict it ([Pashler 2008][pashler2008]; [Aslaksen 2018][aslaksen2018]); experiments that followed that design, with real course material, found no match benefit ([Rogowsky 2015][rogowsky2015]; [Melzner 2024][melzner2024]). Across 17 meta-analyses, matching studies show _d_ = 0.04 ([Hattie 2025][hattie2025]). One meta-analysis found _g_ = 0.31, but only 26% of outcomes showed the crossover the hypothesis needs, and study quality was low ([Clinton-Lisell 2024][clintonlisell2024]). Students do have preferences and differ in specific abilities; the claim that fails is that matching to preference helps ([Pashler 2008][pashler2008]).

**LS-29. Rereading, highlighting and summarising without training are popular and weak; practice testing and spacing do more for the same time.**
Grade A. Rated low utility next to high utility for practice testing and distributed practice ([Dunlosky 2013][dunlosky2013]); a meta-analysis of the same ten techniques ranks distributed practice and practice testing highest and underlining and summarisation lowest ([Donoghue 2021][donoghue2021]). Rereading and highlighting are the techniques students use most ([Urrizola 2022][urrizola2022]; [Yüksel 2024][yuksel2024]). Boundary: most outcomes were factual; [Donoghue 2021][donoghue2021] found larger effects for lower-ability students.

**LS-30. Other popular brain beliefs lack support: left-brained and right-brained learners, using only 10% of the brain, the Mozart effect, sugar harming attention.**
Grade C (the cited sources are surveys of what teachers believe, not tests of the claims; none tests the 10%, Mozart or sugar claims). Teachers believed about half of the neuromyths presented, and more brain knowledge did not protect against them ([Dekker 2012][dekker2012]); training reduces but does not remove them, and learning styles is the most endorsed ([Macdonald 2017][macdonald2017]; [Torrijos-Muelas 2021][torrijosmuelas2021]; [Grospietsch 2021][grospietsch2021]).

**LS-31. Brain training, chess, music and working memory exercises do not improve general reasoning or school achievement (far transfer); practice improves what is practised and similar tasks.**
Grade A. Effects shrink with study quality and vanish with active controls ([Sala 2017][sala2017]); in a second-order meta-analysis, far transfer is null after correcting for placebo and publication bias while near transfer exists ([Sala 2019][sala2019]; [Gobet 2022][gobet2022]). Boundary: a reanalysis claims a small far-transfer effect for music (_g_ = 0.23) ([Bigand 2021][bigand2021]).

**LS-32. The claim that handwriting notes beats typing them did not replicate.**
Grade B. Two direct replications of the original study found no reliable difference on quizzes; mini meta-analyses agree ([Morehead 2019][morehead2019]; [Urry 2021][urry2021]). Boundary: the studies are of students taking lecture notes; other tasks and ages were not tested.

## Contested and open

- **Testing effect with complex material.** One camp argues the testing effect shrinks or disappears as element interactivity rises ([van Gog 2015][vangog2015]; [Hanham 2017][hanham2017]); the other answers that element interactivity was never measured and that complex-material studies show the effect ([Karpicke 2015][karpicke2015]); a dissertation manipulating complexity found the effect throughout ([Bedwell 2018][bedwell2018]). Bears on LS-6 for worked Problems.
- **Instruction first or problem first.** Worked examples (LS-15) and productive failure (LS-19) seem to point opposite ways. The camps disagree on inquiry vs direct instruction ([Kirschner 2006][kirschner2006]; [de Jong 2023][dejong2023]); both accept that guidance and prior knowledge decide the outcome.
- **Prior knowledge paradox.** Whether prior knowledge helps new learning (LS-4) is open; the "knowledge is power" view and the meta-analytic null coexist ([Schneider 2025][schneider2025]).
- **Self-explanation with worked examples.** Self-explanation helps in general (LS-12), but adding self-explanation prompts to worked examples gave a negative moderator effect in mathematics ([Barbieri 2023][barbieri2023]).
- **Feedback timing.** Classroom studies tend to favour immediate feedback, laboratory studies delayed ([Kulik 1988][kulik1988]); for texts, feedback right after reading beats feedback during reading ([Swart 2019][swart2019]); [Van der Kleij 2015][vanderkleij2015] found immediate feedback better for lower-order outcomes, without a significant interaction.
- **Mathematics.** Retrieval practice and spacing effects are smaller or not robust in mathematics ([Murray 2025][murray2025]), while interleaving is small but positive ([Brunmair 2019][brunmair2019]).
- **Working memory capacity.** Fixed slots (about four) vs a flexible resource ([Cowan 2001][cowan2001]; [Ma 2014][ma2014]; [Morra 2024][morra2024]).
- **Systems consolidation** as a concept ([Moscovitch 2022][moscovitch2022]) and music's far transfer ([Bigand 2021][bigand2021]) remain disputed.
- **Sampling.** Most classroom studies are WEIRD ([Agarwal 2021][agarwal2021]); sleep studies are underpowered ([Newbury 2021][newbury2021]); expertise reversal is weaker in humanities and languages ([Tetzlaff 2025][tetzlaff2025]).

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor included; the synthesis decides what the app does.

1. **Make the Student produce, not read.** Retrieval (LS-6), generation (LS-3) and self-explanation (LS-12) beat reading and rereading (LS-29). A tutor that explains well but asks for little recall builds the familiarity that students mistake for knowledge (LS-23). An explanation can follow an attempt (LS-11, LS-19), but this is contested and suits students with some prior knowledge; novices learn more from worked examples first (item 2, LS-15, and Contested).
2. **Fit guidance to what the Student already knows, and keep re-fitting it.** Novices need worked examples and step-level help (LS-15, LS-18); students who know the material learn more from Problems with little help (LS-16). Moving from one to the other works best in steps adapted to the Student (LS-17). This requires estimating knowledge often, and short targeted checks can do it (LS-16). A fixed level of help per Course fails both groups.
3. **Space and mix practice across Study sessions.** Reviews spread over days, with the gap growing towards the exam date (LS-8), and relearning to criterion in several sessions (LS-9) give durable recall. Interleaving pays off where Problem types look alike and must be told apart (LS-10), and less for unrelated facts or rule-finding.
4. **Treat errors as useful, and correct them with reasons.** Attempts that go wrong help if correction follows (LS-11, LS-20). Feedback should say why, point at the task and the next step, and not judge the person (LS-21, LS-22). For a confidently held error, name the wrong idea and why it fails (LS-5, LS-20), and revisit it later because it tends to return (LS-20).
5. **Do not trust a smooth session as proof of learning.** Fast, correct answers during massed practice can overstate what will last (LS-23). Evidence of learning comes from delayed, varied retrieval (LS-7, LS-8).
6. **Prefer several examples to one.** To teach a principle that must transfer, compare two or more examples that differ on the surface (LS-14); expect little far transfer without that (LS-31).
7. **Drop the myths.** No learning-style profiles (LS-28), no brain-based claims (LS-27, LS-30), no promise that general training improves thinking (LS-31). Sleep and focused attention matter for retention (LS-24, LS-25); this report has no finding on what a tutor can do about them.

**Conflicts with other fields.** The conditions that work best (retrieval, spacing, interleaving, struggling first) feel harder and less productive, so they collide with motivation and persistence (report MOT) and with students' own judgments of learning (report AM): the S2D2 framework names exactly this problem ([de Bruin 2023][debruin2023]). Students' preferences, as in learning styles, are a matter of autonomy and engagement, not of effectiveness, which the motivation report weighs. Cognitive load (LS-1, LS-2) is also what interface design (report UX) manages, and how much guidance to give (LS-16, LS-18) is the core question for the human tutoring and ITS reports.

[abel2023]: https://consensus.app/papers/details/w:4aa79e71-f25a-4671-93cd-6463d0b9685c/?utm_source=claude_desktop
[adesope2017]: https://consensus.app/papers/details/w:d2a0a0a6-14ad-4efd-a287-11d7ad86a2c2/?utm_source=claude_desktop
[agarwal2021]: https://consensus.app/papers/details/w:d75ede03-68ab-4a33-86db-d4049f68e80c/?utm_source=claude_desktop
[alfieri2011]: https://consensus.app/papers/details/w:11920e18-5e7d-463c-a21f-b5206e189d37/?utm_source=claude_desktop
[aslaksen2018]: https://consensus.app/papers/details/w:a140fb59-9136-46bf-ac38-c84af57a2f0a/?utm_source=claude_desktop
[bangertdrowns1991]: https://consensus.app/papers/details/w:9dd110bc-b821-48e4-aca1-f24b455d2e71/?utm_source=claude_desktop
[barbieri2023]: https://consensus.app/papers/details/w:aa273fe8-34ad-42d7-974d-53857bf5defc/?utm_source=claude_desktop
[bedwell2018]: https://consensus.app/papers/details/w:539d5abd-5998-48b7-8fd7-f303f04aa263/?utm_source=claude_desktop
[bertsch2007]: https://consensus.app/papers/details/w:0567eafc-44df-44d0-87c9-51dcf865c87d/?utm_source=claude_desktop
[bigand2021]: https://consensus.app/papers/details/w:0b33be0f-0f06-49b1-88f4-5bbcfe13519d/?utm_source=claude_desktop
[binks2026]: https://consensus.app/papers/details/w:475793a4-9a25-4628-ab23-efe2d5ddecb3/?utm_source=claude_desktop
[bisra2018]: https://consensus.app/papers/details/w:97d163d8-0b36-4f1c-bb65-861c927e9526/?utm_source=claude_desktop
[boudreau1999]: https://consensus.app/papers/details/w:375fbbaf-aea1-4406-bd14-a84896be467f/?utm_source=claude_desktop
[bowers2016]: https://consensus.app/papers/details/w:fb6c979a-44fc-4e04-b943-7c10957b8c96/?utm_source=claude_desktop
[braas2025]: https://consensus.app/papers/details/w:c080c452-5058-46e8-8bed-bdc5176dcfe7/?utm_source=claude_desktop
[brodt2023]: https://doi.org/10.1016/j.neuron.2023.03.005
[brunmair2019]: https://consensus.app/papers/details/w:26bb7cec-0325-46d2-b3e6-7bd28b340c65/?utm_source=claude_desktop
[buchin2025]: https://consensus.app/papers/details/w:38651a1f-e4d4-4013-b00e-f7f4ee4b0696/?utm_source=claude_desktop
[butler2011]: https://consensus.app/papers/details/w:bfb2f3f1-0442-433f-9003-a1f45cab8c64/?utm_source=claude_desktop
[butowska2024]: https://consensus.app/papers/details/w:662821e3-93c5-4774-80bc-a71332f839f2/?utm_source=claude_desktop
[carpenter2022]: https://consensus.app/papers/details/w:8b7abddc-f3bf-4487-8185-c46694487418/?utm_source=claude_desktop
[catrambone1989]: https://consensus.app/papers/details/w:517fe63d-f6cf-4091-b0f7-c3ae688e0a85/?utm_source=claude_desktop
[cepeda2006]: https://consensus.app/papers/details/w:14cfe6df-714a-424f-8b5c-1ff92565bac4/?utm_source=claude_desktop
[chen2021si]: https://consensus.app/papers/details/w:f0450f8a-3d4d-42bc-a2ba-8af7805e2a73/?utm_source=claude_desktop
[chen2023ei]: https://consensus.app/papers/details/w:8414acae-38af-4cab-bd21-cea98efb66a8/?utm_source=claude_desktop
[chen2023we]: https://consensus.app/papers/details/w:e0c1acfb-51a5-4218-a3b0-42a842ef9d94/?utm_source=claude_desktop
[clintonlisell2024]: https://consensus.app/papers/details/w:662676b8-f3c4-4c19-8fc9-3338b4f26c4d/?utm_source=claude_desktop
[cowan2001]: https://consensus.app/papers/details/w:4bbf290f-81d0-4274-9172-4e592cc2424c/?utm_source=claude_desktop
[crissman2006]: https://consensus.app/papers/details/w:48a9c832-eb13-4e54-9a24-88bbd7358c89/?utm_source=claude_desktop
[crowley2024]: https://consensus.app/papers/details/w:54b85a2d-f548-4102-9ac8-9b7fc9607716/?utm_source=claude_desktop
[danielson2024]: https://consensus.app/papers/details/w:06424db9-91b5-4008-9f9c-78eed8b107dc/?utm_source=claude_desktop
[debruin2023]: https://consensus.app/papers/details/w:7f542a07-7ed1-4bc1-a158-3f12b4387408/?utm_source=claude_desktop
[dejong2023]: https://consensus.app/papers/details/w:6490b740-3af2-44d5-8d66-2dc1b8c7cae6/?utm_source=claude_desktop
[dekker2012]: https://consensus.app/papers/details/w:d6153ce5-5138-47f9-9662-ad6a9d0b9dab/?utm_source=claude_desktop
[do2023]: https://consensus.app/papers/details/w:470e98ab-9433-45df-b6e4-76d861fa9273/?utm_source=claude_desktop
[donoghue2019]: https://consensus.app/papers/details/w:7896c2d8-79c3-47fc-bee1-cd50583ae4e6/?utm_source=claude_desktop
[donoghue2021]: https://consensus.app/papers/details/w:e8825eed-31f1-4688-8090-61fad5c16a3b/?utm_source=claude_desktop
[dunlosky2013]: https://consensus.app/papers/details/w:963ffed7-eead-4f23-951d-0a4b16798b03/?utm_source=claude_desktop
[emeny2021]: https://consensus.app/papers/details/w:88102f5c-b18f-4c3e-9872-e61a7e03399b/?utm_source=claude_desktop
[fiorella2015]: https://consensus.app/papers/details/w:da4f5f0d-c62f-4611-a05b-51e8d57e0700/?utm_source=claude_desktop
[gao2025]: https://consensus.app/papers/details/w:bf8e3c64-3663-42f0-87d6-55516cd150a3/?utm_source=claude_desktop
[gentner2003]: https://consensus.app/papers/details/w:38977f9b-4efc-442f-858e-ade762d3ba22/?utm_source=claude_desktop
[gereau2026]: https://consensus.app/papers/details/w:ee4ca0fa-83ba-4efc-8fff-06fa06793cd8/?utm_source=claude_desktop
[gick1983]: https://consensus.app/papers/details/w:c502abc4-dd6f-479d-9c85-e2a78411e95d/?utm_source=claude_desktop
[glass2018]: https://consensus.app/papers/details/w:78f64a86-494d-4cf0-b5b2-c7c187724382/?utm_source=claude_desktop
[gobet2022]: https://consensus.app/papers/details/w:af0b2573-9395-449c-b034-ccbb251cae10/?utm_source=claude_desktop
[grospietsch2021]: https://consensus.app/papers/details/w:a3b3959a-de78-4019-8e26-1bab90d139a4/?utm_source=claude_desktop
[hanham2017]: https://consensus.app/papers/details/w:9454d006-4f6d-4146-9420-b1984dc49b07/?utm_source=claude_desktop
[hartmann2021]: https://consensus.app/papers/details/w:294a46ae-dddc-4413-a3b3-b966810e30a5/?utm_source=claude_desktop
[hattie2007]: https://consensus.app/papers/details/w:05a62e16-1d9a-419a-bbb1-3c496aa1662c/?utm_source=claude_desktop
[hattie2025]: https://consensus.app/papers/details/w:767fd738-ac08-4e0d-8786-49fc9034265a/?utm_source=claude_desktop
[higham2022]: https://consensus.app/papers/details/w:9df2be94-8976-4f1a-b56e-0f8340e6b07f/?utm_source=claude_desktop
[hu2020]: https://doi.org/10.1037/bul0000223
[janez2025]: https://consensus.app/papers/details/w:7afd6c44-e52d-4bb4-8cfd-0607c93d1a7f/?utm_source=claude_desktop
[kalyuga2004]: https://consensus.app/papers/details/w:9d9033c4-8b73-443a-acae-a84ef1231757/?utm_source=claude_desktop
[kalyuga2007]: https://consensus.app/papers/details/w:28620be4-c7cb-4055-939a-890bfa7c74cb/?utm_source=claude_desktop
[kapur2016]: https://consensus.app/papers/details/w:f3bebdef-a75e-4e65-98a0-c74cbb8350c8/?utm_source=claude_desktop
[karpicke2015]: https://consensus.app/papers/details/w:8f7ba270-6436-44dc-9615-d09a0802e18d/?utm_source=claude_desktop
[kim2022]: https://consensus.app/papers/details/w:e2f1ae0c-1d75-418f-95e5-5e433e165be1/?utm_source=claude_desktop
[kirschner2006]: https://consensus.app/papers/details/w:a2e37e13-7c72-4c13-bb51-19391802bb2d/?utm_source=claude_desktop
[kluger1996]: https://consensus.app/papers/details/w:8e6ce7d4-2ab4-426c-a088-abb96237f605/?utm_source=claude_desktop
[kulik1988]: https://consensus.app/papers/details/w:4ae9eedb-f78b-4e18-89e0-46c48c2763cd/?utm_source=claude_desktop
[kumral2023]: https://doi.org/10.1016/j.neuropsychologia.2023.108661
[lachner2020]: https://consensus.app/papers/details/w:37642dfe-12c5-4e81-83aa-757754424f89/?utm_source=claude_desktop
[latimier2021]: https://consensus.app/papers/details/w:e50af449-d0bc-44f3-a382-b6341b450aa2/?utm_source=claude_desktop
[lazonder2016]: https://consensus.app/papers/details/w:a76adb2f-a630-44bb-b41b-9c989c3f1d3f/?utm_source=claude_desktop
[leahy2019]: https://consensus.app/papers/details/w:11575b17-0513-493c-a29d-98965030fd7c/?utm_source=claude_desktop
[li2025]: https://consensus.app/papers/details/w:9668c4f8-bbff-40b2-88e4-2508e7df305d/?utm_source=claude_desktop
[lipinska2019]: https://doi.org/10.3389/fpsyg.2019.01014
[little2025]: https://consensus.app/papers/details/w:2d86e6d0-4612-45ef-9300-3f3931b6d927/?utm_source=claude_desktop
[ma2014]: https://consensus.app/papers/details/w:28c78ea7-bae1-4872-ba7d-556c4e14d244/?utm_source=claude_desktop
[macdonald2017]: https://consensus.app/papers/details/w:c82b1e3d-8ddf-4f2a-87cd-85de7e2192de/?utm_source=claude_desktop
[mawson2025]: https://consensus.app/papers/details/w:d642f7a6-59ec-493a-9809-39b10cf828d6/?utm_source=claude_desktop
[may2018]: https://consensus.app/papers/details/w:1515d34a-9367-4e6b-b6fa-62b94b6bf50c/?utm_source=claude_desktop
[mccurdy2020]: https://consensus.app/papers/details/w:298d41ff-0502-4311-884a-980320d52f12/?utm_source=claude_desktop
[melzner2024]: https://consensus.app/papers/details/w:9d3bd2a1-8435-4b16-8783-2a4521ed4da0/?utm_source=claude_desktop
[mera2021]: https://consensus.app/papers/details/w:476785d7-3404-4223-9157-c143fbaa3d85/?utm_source=claude_desktop
[mera2025]: https://consensus.app/papers/details/w:f4ec58ae-763a-4bbd-b601-855690bfb9bf/?utm_source=claude_desktop
[metcalfe2016]: https://consensus.app/papers/details/w:81a1960d-3feb-4472-b160-df8b62ca16f5/?utm_source=claude_desktop
[morehead2019]: https://consensus.app/papers/details/w:af160b66-cd17-4f7c-be74-42c7390d1e1d/?utm_source=claude_desktop
[morra2024]: https://consensus.app/papers/details/w:3e9e244b-f5e5-4741-be29-447110b4003a/?utm_source=claude_desktop
[moscovitch2022]: https://doi.org/10.12703/r/11-33
[muhmenthaler2026]: https://consensus.app/papers/details/w:f45ca8df-6831-4cad-9b41-92b45e5d7009/?utm_source=claude_desktop
[murray2025]: https://consensus.app/papers/details/w:2b4fe717-a922-423e-ac99-d4b24c00feb4/?utm_source=claude_desktop
[newbury2019]: https://doi.org/10.3758/s13423-018-1528-4
[newbury2021]: https://consensus.app/papers/details/w:57fa707f-434e-45f2-80a0-d6408618df7a/?utm_source=claude_desktop
[pan2018]: https://consensus.app/papers/details/w:86b3c8b8-3ed4-49af-8430-48560986f0d3/?utm_source=claude_desktop
[pan2023]: https://consensus.app/papers/details/w:d3d8488f-afd6-40e2-aad0-4128cf371447/?utm_source=claude_desktop
[pashler2008]: https://consensus.app/papers/details/w:5bab3361-eaad-4350-ad62-c8129e87f9e9/?utm_source=claude_desktop
[rawson2011]: https://consensus.app/papers/details/w:43c3ab25-3c09-42ed-8253-84300ca98c66/?utm_source=claude_desktop
[rawson2018]: https://consensus.app/papers/details/w:06a16740-abbb-4317-9fd3-70713610220e/?utm_source=claude_desktop
[renkl2002]: https://consensus.app/papers/details/w:3015f296-2231-480c-a3bc-a6b5c0fe3cf3/?utm_source=claude_desktop
[renkl2003]: https://consensus.app/papers/details/w:897fd5ee-caed-4217-87be-feb080b35e5e/?utm_source=claude_desktop
[rittlejohnson2017]: https://consensus.app/papers/details/w:7e095caa-5c1a-485d-b02c-038e1693fab4/?utm_source=claude_desktop
[rogowsky2015]: https://consensus.app/papers/details/w:cc728213-e137-491b-a29a-1aab4800a950/?utm_source=claude_desktop
[rowland2014]: https://consensus.app/papers/details/w:a4e0cdf1-c227-4a7a-9d4c-7f632fd5f2c9/?utm_source=claude_desktop
[ruitenburg2026]: https://consensus.app/papers/details/w:08a94097-7a5b-468e-b319-4fa0764eadcb/?utm_source=claude_desktop
[sala2017]: https://consensus.app/papers/details/w:ace15933-dcd0-43b6-80c1-834da30dcd05/?utm_source=claude_desktop
[sala2019]: https://consensus.app/papers/details/w:4941143d-29fa-412c-b279-55095a7a004a/?utm_source=claude_desktop
[salden2009]: https://consensus.app/papers/details/w:9861bf74-9b0d-4b90-94bb-cc3f69655ba3/?utm_source=claude_desktop
[sana2012]: https://consensus.app/papers/details/w:d0370c75-8e9f-4aba-bcab-308ee5e8a60a/?utm_source=claude_desktop
[schindler2023]: https://consensus.app/papers/details/w:7682d55d-5ac5-4c63-9916-69c5198bdb0f/?utm_source=claude_desktop
[schmid2020]: https://doi.org/10.1016/j.neubiorev.2020.07.028
[schneider2025]: https://consensus.app/papers/details/w:bd3e3898-cc3d-469d-991e-b9491ccd3364/?utm_source=claude_desktop
[schroeder2022]: https://consensus.app/papers/details/w:6668ef99-3564-41cf-8345-f8a9c2b60035/?utm_source=claude_desktop
[schwieren2017]: https://consensus.app/papers/details/w:eebfc957-956d-4dd3-8b82-c18cdf41755e/?utm_source=claude_desktop
[sekeres2018]: https://doi.org/10.1016/j.neulet.2018.05.006
[simonsmeier2021]: https://consensus.app/papers/details/w:d1f1b799-5de8-4c63-8538-00c56defa247/?utm_source=claude_desktop
[sinha2021]: https://consensus.app/papers/details/w:dfb3808e-1da8-4eef-a4c3-0bad9b91c8e3/?utm_source=claude_desktop
[soderstrom2015]: https://consensus.app/papers/details/w:7df87de6-150f-4d75-bbfd-466b55b29958/?utm_source=claude_desktop
[sthilaire2023]: https://consensus.app/papers/details/w:538022d8-3af5-435b-9fab-48ef4280b8e5/?utm_source=claude_desktop
[swart2019]: https://consensus.app/papers/details/w:9d7efe44-10b9-4af0-ba5f-4a62b6938027/?utm_source=claude_desktop
[sweller1998]: https://consensus.app/papers/details/w:667729fe-dd9e-4b6a-9059-df4366253d4c/?utm_source=claude_desktop
[sweller2019]: https://consensus.app/papers/details/w:1c4be440-05eb-4614-8bba-971684c32a53/?utm_source=claude_desktop
[tan2023]: https://consensus.app/papers/details/w:b10a116c-c247-4ac0-b168-6df837063c31/?utm_source=claude_desktop
[tetzlaff2025]: https://consensus.app/papers/details/w:7ebc984e-215f-4560-ac7e-b97dad8ce15e/?utm_source=claude_desktop
[torrijosmuelas2021]: https://consensus.app/papers/details/w:cc43d1fb-b277-4e39-b925-6d6a5e48ef1a/?utm_source=claude_desktop
[trumble2023]: https://consensus.app/papers/details/w:f9d008c1-6a07-4ceb-a0b0-76a619e90139/?utm_source=claude_desktop
[urrizola2022]: https://consensus.app/papers/details/w:6f7037c5-a04f-4879-8f83-38cf25a2003b/?utm_source=claude_desktop
[urry2021]: https://consensus.app/papers/details/w:5cb5e520-19a8-48f7-8032-3dd90d940281/?utm_source=claude_desktop
[vanderkleij2015]: https://consensus.app/papers/details/w:01d1999d-30d6-4333-9fce-afa0991be482/?utm_source=claude_desktop
[vangog2011]: https://doi.org/10.1016/j.cedpsych.2010.10.004
[vangog2015]: https://consensus.app/papers/details/w:65c3a76f-2eea-44ac-a9c0-e9771b9251b9/?utm_source=claude_desktop
[varma2008]: https://consensus.app/papers/details/w:1bfb039a-30c9-4f67-94d3-63467c786cae/?utm_source=claude_desktop
[walsh2022]: https://consensus.app/papers/details/w:b7e10c07-0946-486e-8813-237762addc36/?utm_source=claude_desktop
[wammes2018]: https://consensus.app/papers/details/w:4e030820-bddd-4d91-843b-9aeba3bca99e/?utm_source=claude_desktop
[weissgerber2017]: https://consensus.app/papers/details/w:b02ea424-d646-47eb-a982-4babf861713f/?utm_source=claude_desktop
[wilschut2026]: https://consensus.app/papers/details/w:e6fa1e8e-bc4a-4456-955f-e16f01a24f9a/?utm_source=claude_desktop
[wisniewski2020]: https://consensus.app/papers/details/w:db6510ed-85ee-4fbd-b4f6-55171a2fcab9/?utm_source=claude_desktop
[yang2021]: https://consensus.app/papers/details/w:0707b1d3-6e30-475c-82b4-35e4981bebb2/?utm_source=claude_desktop
[yuksel2024]: https://consensus.app/papers/details/w:1676159b-bc1c-4deb-936d-5a42f6f6282d/?utm_source=claude_desktop
