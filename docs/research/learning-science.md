# Learning science

- **Field**: cognitive psychology of learning and memory, with what neuroscience adds.
- **Scope**: how people encode, keep and use knowledge, and which study and teaching conditions change that. Motivation, emotion, metacognition, interface design (multimedia and dual coding included) and tutoring as a craft each have their own report and appear here only where a learning-science finding depends on them.
- **Date**: 2026-11-26; revised the same day to the epic's source rules.
- **Outline started from**: what a textbook chapter or major review covers: Ebbinghaus (forgetting); Miller, Cowan (working memory); Craik & Lockhart, Morris, Bransford & Franks (encoding); Chase & Simon, Ericsson (expertise); Sweller (cognitive load); Roediger & Karpicke 2006, Karpicke & Roediger 2008 (retrieval); Cepeda et al. 2006 (spacing); Kornell & Bjork 2008 (interleaving); Bjork & Bjork (desirable difficulties); Chi et al. 1989 (self-explanation); Sweller & Cooper 1985, Kalyuga et al. 2003 (worked examples); Kirschner, Sweller & Clark 2006 (guidance); Butterfield & Metcalfe 2001, Kluger & DeNisi 1996, Hattie & Timperley 2007, Shute 2008 (errors, feedback); Barnett & Ceci 2002 (transfer); Diekelmann & Born 2010 (sleep); Pashler et al. 2008, Howard-Jones 2014 (myths); Dunlosky et al. 2013; _Make It Stick_ (Brown, Roediger & McDaniel 2014). The comparison added LS-33 to LS-35 and these works as sources.
- **Search tools**: Consensus (semantic search over Semantic Scholar, OpenAlex and PubMed; free plan, abstracts only), PubMed, web search, and the Crossref and Semantic Scholar APIs for DOIs and abstracts; alphaXiv was tried. About 38 searches for the first version and about 20 for the revision.
- **Could not reach**: Elicit (the account's plan has no API access); full texts behind paywalls, so effect sizes come from abstracts; books, which are **located** but not read; alphaXiv returned only machine-learning work on forgetting curves, so no claim cites it.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Most of the evidence comes from university students and school pupils in Western countries: a systematic review of classroom retrieval practice found only 6% of experiments ran outside WEIRD countries ([Agarwal 2021][agarwal2021]). Effect sizes are standardised mean differences (_d_ or _g_); 0.2 is small, 0.5 medium, 0.8 large.

## Claims

### Memory and prior knowledge

**LS-1. Working memory (short-term memory) holds only a few new elements at once, while long-term memory has no practical limit and stores knowledge as schemas that working memory can then handle as single units.**
Grade C (theory and reviews). The limit sits around three to five chunks for new, unrelated items ([Cowan 2001][cowan2001]), revising the older "seven plus or minus two" ([Miller 1956][miller1956]); cognitive load theory builds instructional design on this split between a narrow working memory and a vast long-term memory ([Sweller 1988][sweller1988]; [Sweller 1998][sweller1998]; [Sweller 2019][sweller2019]). Boundary: the exact number is contested, and some models treat the limit as a resource spread across items rather than a slot count ([Ma 2014][ma2014]). The limit applies to new information; organised prior knowledge bypasses it (LS-35).

**LS-2. How hard a task is depends on the student as much as on the material: the same Problem overloads a novice and is routine for someone whose long-term memory already links its elements.**
Grade C (theory with supporting experiments). Element interactivity, the number of elements that must be held together, is counted against what the student already knows ([Chen 2023][chen2023ei]; [Leahy 2019][leahy2019]). Boundary: element interactivity has no agreed measure, which makes the claim hard to test (see Contested).

**LS-3. Students remember and understand more when they produce the content themselves (generate, explain, summarise, draw, teach) than when they read it (the generation effect).**
Grade A. First shown with word pairs ([Slamecka 1978][slamecka1978]), the generation effect is about _d_ = 0.40 across 86 studies ([Bertsch 2007][bertsch2007]) and depends on how constrained the generation is ([McCurdy 2020][mccurdy2020]); generating parts of a text beats reading it (_g_ = 0.41), not explained by extra time on task ([Schindler 2023][schindler2023]). Generative learning theory groups such activities as selecting, organising and integrating new material with prior knowledge ([Fiorella 2015][fiorella2015]). Boundary: the benefit is largest when the generation task adds processing the material does not already prompt ([Schindler 2023][schindler2023]).

**LS-4. Prior knowledge strongly predicts where a student ends up, but not how much they gain; its effect on learning can be positive, negative or nil depending on conditions.**
Grade A. Across 8,776 effect sizes, pretest and posttest correlate at _r_ = .53, but pretest and normalised gain at _r_ = −.06 with a very wide spread ([Simonsmeier 2021][simonsmeier2021]). A review names 16 mechanisms through which prior knowledge helps or hinders, including interference ([Schneider 2025][schneider2025]); an experiment that induced domain knowledge found no effect on new learning ([Buchin 2025][buchin2025]). Boundary: mostly correlational data.

**LS-5. Misconceptions yield more to explanations that name the wrong idea and say why it is wrong (refutation, myth-busting) than to plain correct exposition.**
Grade A. Refutation texts beat ordinary texts (_g_ = 0.41, 44 comparisons) across many contexts ([Schroeder 2022][schroeder2022]); a preregistered meta-analysis of 294 effect sizes confirms a consistent advantage ([Danielson 2024][danielson2024]). Boundary: nearly all studies concern science misconceptions.

**LS-33. Forgetting is fast at first and slows over time (the forgetting curve), and what is relearned comes back faster than it was first learned (savings).**
Grade A. Ebbinghaus measured the curve on himself by the savings method ([Ebbinghaus 1913][ebbinghaus1913]); a 70-hour replication reproduced it ([Murre 2015][murre2015]); 210 published data sets fit the same few negatively accelerated functions, such as power and logarithmic ([Rubin 1996][rubin1996]). Boundary: the available data cannot tell these functions apart, autobiographical memory fits them least ([Rubin 1996][rubin1996]), and the classic curves use nonsense syllables and word lists; how fast meaningful material is forgotten depends on how it was learned (LS-6, LS-8).

**LS-34. Processing material for its meaning (deep processing) leaves a more durable memory than processing its surface, but what matters most is that the processing during study matches what the test will ask (transfer-appropriate processing).**
Grade B. Judging a word's meaning led to better recall and recognition than judging its typeface or rhyme ([Craik 1972][craik1972]; [Craik 1975][craik1975]), with a large effect immediately and a medium-to-large one after a day, while the rate of forgetting stayed the same ([Peng 2024][peng2024]). Yet studying rhymes beat studying meanings on a rhyme test ([Morris 1977][morris1977]): retrieval works when its cues match what was encoded (encoding specificity) ([Tulving 1973][tulving1973]). Changing the room between study and test has a reliable but small effect, which shrinks when students process meaning or mentally reinstate the context ([Smith 2001][smith2001]). Boundary: "depth" has no independent measure, and most studies use word lists.

**LS-35. Expertise rests on a large store of domain-specific patterns: experts take in meaningful configurations as single chunks that novices must handle piece by piece; deliberate practice builds this, but explains less of the differences between people than once claimed.**
Grade B for chunking, A for deliberate practice. Chess masters recall meaningful positions far better than weaker players, which the chunking theory explains ([Chase 1973][chase1973]); a replication and simulations put the store at about 50,000 chunks ([Gobet 1996][gobet1996]; [Gobet 1998][gobet1998]). Deliberate practice was proposed as the main cause of expert performance ([Ericsson 1993][ericsson1993]); a meta-analysis found it explains 26% of performance variance in games, 21% in music, 18% in sports, 4% in education and under 1% in professions ([Macnamara 2014][macnamara2014]). Boundary: chess dominates the chunking evidence; practice is mostly measured retrospectively.

### Retrieval, spacing and sequence

**LS-6. Recalling material from memory (retrieval practice or practice testing; active recall, self-testing) produces more durable learning than restudying it.**
Grade A. Students who took recall tests on prose passages retained more a week later than students who restudied, though restudy won on a test five minutes later and made students more confident ([Roediger 2006][roediger2006]); once vocabulary was recalled correctly, further testing improved delayed recall while further study did not ([Karpicke 2008][karpicke2008]); reviews describe retrieval as a strong enhancer of long-term retention, stronger with feedback ([Roediger 2011][roediger2011]; [Brown 2014][brown2014]). Meta-analyses find a medium advantage over restudy, larger for recall than for recognition tests ([Rowland 2014][rowland2014]; [Adesope 2017][adesope2017]). It holds in classrooms: _g_ = 0.50 across 222 studies and 48,000 students ([Yang 2021][yang2021]), _g_ = 0.37 in school classrooms ([Ruitenburg 2026][ruitenburg2026]). Boundary: corrective feedback, format match between practice and exam, and repetitions moderate it ([Yang 2021][yang2021]); a mathematics meta-analysis found no robust testing effect (_g_ = 0.18, CI crossing zero, few studies) ([Murray 2025][murray2025]); many studies confound the direct benefit with a benefit for material studied after the test ([Gereau 2026][gereau2026]).

**LS-7. Retrieval practice transfers moderately to new question formats and applications, but much less without elaborated retrieval and when the final test asks something different from what was practised.**
Grade A. Transfer _d_ = 0.40 across 192 effect sizes; strongest across test formats, to application and inference questions and medical diagnosis problems ([Pan 2018][pan2018]). After publication-bias correction, transfer often disappears unless retrieval was elaborated, responses were congruent and initial test performance was good ([Pan 2018][pan2018]).

**LS-8. Spreading study over several sessions (distributed practice; spaced repetition) beats massing it into one (cramming), and the best gap grows with how long the knowledge must last.**
Grade A. 839 assessments show that the gap that maximises retention increases with the retention interval ([Cepeda 2006][cepeda2006]). Classroom effects: _d_ = 0.54 ([Mawson 2025][mawson2025]), _g_ = 0.20 in schools ([Ruitenburg 2026][ruitenburg2026]); second-language learning shows medium-to-large effects, with equal and expanding gaps equivalent ([Kim 2022][kim2022]); mathematics _g_ = 0.28 ([Murray 2025][murray2025]). Spacing retrieval sessions adds to retrieval ([Latimier 2021][latimier2021]; [Carpenter 2022][carpenter2022]). Boundary: retention depends more on the number of sessions an item appears in than on how repetitions are split among them ([Walsh 2022][walsh2022]).

**LS-9. Practising until correct recall and then relearning to criterion in several later spaced sessions (successive relearning) gives large, durable retention for little extra time.**
Grade B. Successive relearning beat single-session learning by _d_ = 1.52 to 4.19 ([Rawson 2018][rawson2018]); three correct recalls initially plus three widely spaced relearning sessions was the efficient schedule for conceptual material ([Rawson 2011][rawson2011]). A semester-long classroom study controlled exposure time and found better recall, plus better metacognition and lower anxiety ([Higham 2022][higham2022]). Boundary: few research groups, mostly definitions and facts.

**LS-10. Mixing Problems or examples of different types (interleaving; mixed practice) helps students tell similar categories apart, but not for every kind of material.**
Grade A. Interleaving paintings by different artists improved recognising new paintings by each artist, although learners rated blocking as more effective ([Kornell 2008][kornell2008]). Overall _g_ = 0.42 across 59 studies; largest for paintings and visual material, small for mathematics (_g_ = 0.34), unclear for expository texts, and reversed for word lists (_g_ = −0.39); stronger when categories look alike ([Brunmair 2019][brunmair2019]). Boundary: when students search for a rule rather than memorise examples, blocking can be better ([Little 2025][little2025]); interleaving and spacing need distinct explanations ([Chen 2021][chen2021si]).

**LS-11. Attempting questions before studying the answers (pretesting, prequestions; guessing first) improves memory for those questions, even when the attempts are wrong, but not for the rest of the material.**
Grade A. Specific effect _g_ = 0.54, general effect _g_ = 0.04 ([St. Hilaire 2023][sthilaire2023]); works with texts, videos and lectures when the correct answer follows ([Pan 2023][pan2023]). Boundary: the advantage disappears after a few retrieval repetitions; a pretest is most useful to skip what a student already knows ([Wilschut 2026][wilschut2026]).

### Explaining and elaborating

**LS-12. Prompting students to explain to themselves why steps or statements hold (self-explanation) improves learning.**
Grade A. Students who learned more from worked physics examples generated more and better self-explanations and monitored their understanding more accurately ([Chi 1989][chi1989]). Self-explanation prompts _g_ = 0.55 across 69 effect sizes, across subjects and task types ([Bisra 2018][bisra2018]). In mathematics the effect is small to moderate on immediate tests, stronger with scaffolded explanations, and weakly evidenced over delays or in classrooms ([Rittle-Johnson 2017][rittlejohnson2017]). Boundary: benefits decline with very complex material and low prior knowledge ([Gao 2025][gao2025]).

**LS-13. Asking "why is this true?" about facts (elaborative interrogation) helps, mainly when students have the prior knowledge to answer.**
Grade B. Rated moderate utility, short of high because of limited classroom evidence ([Dunlosky 2013][dunlosky2013]). With long texts, it works only with support such as marked main ideas or given questions ([Boudreau 1999][boudreau1999]), and an undergraduate study found it can hinder outside specific conditions ([Jáñez 2025][janez2025]). Boundary: the benefit depends on prior knowledge and, for long texts, on support; classroom evidence is limited.

**LS-14. Comparing two or more examples that share a structure lets students abstract the principle and apply it to new cases; a single example rarely transfers.**
Grade B. Students who compared two story analogues formed a problem schema that predicted transfer, while principles or diagrams given with one analogue did not ([Gick 1983][gick1983]). Comparing two negotiation cases beat studying them separately ([Gentner 2003][gentner2003]). Spontaneous transfer across contexts is hard and needs schema-focused support ([Catrambone 1989][catrambone1989]); how far a context lies from the learning context (domain, setting, time, format) is a taxonomy for why far transfer is rare ([Barnett 2002][barnett2002]). Boundary: the cited studies are small laboratory experiments with adults; no meta-analysis was found.

### Guidance, examples and the path to independence

**LS-15. Novices learn more from studying worked examples (step-by-step solutions) than from solving the same Problems unaided.**
Grade A. In the original algebra experiments, worked examples took less time to process than conventional Problems and led to better later problem solving ([Sweller 1985][sweller1985]). Worked examples improve mathematics performance (_g_ = 0.48, 55 studies), with correct examples more useful than incorrect ones ([Barbieri 2023][barbieri2023]); example-problem pairs beat problem solving alone for novices ([van Gog 2011][vangog2011]); examples reduce load and help transfer ([Chen 2023][chen2023we]). Boundary: evidence is mostly from well-structured domains such as mathematics, physics and programming ([Crissman 2006][crissman2006]).

**LS-16. Guidance that helps novices hinders students who already know the material (expertise reversal).**
Grade A. Named and reviewed within cognitive load theory ([Kalyuga 2003][kalyuga2003]; [Kalyuga 2007][kalyuga2007]); across 60 experiments, low prior knowledge students learn more from high-assistance instruction (_d_ = 0.51) and high prior knowledge students from low assistance (_d_ = −0.43) ([Tetzlaff 2025][tetzlaff2025]). Boundary: evidence is weaker for younger students and for humanities and language learning; withholding help from experts matters less than giving it to novices ([Tetzlaff 2025][tetzlaff2025]). A rapid schema-based test of knowledge level correlated up to .92 with traditional tests in a fraction of the time and could steer the choice of instruction ([Kalyuga 2004][kalyuga2004]).

**LS-17. Moving from full worked examples to independent problem solving by removing steps one at a time (fading) beats switching abruptly, and fading adapted to each student beats a fixed schedule.**
Grade B. Fading improved near transfer, and removing the last steps first worked better than removing the first ([Renkl 2002][renkl2002]; [Renkl 2003][renkl2003]); adaptive fading inside a tutoring system beat fixed fading in a lab and a classroom experiment ([Salden 2009][salden2009]). Boundary: few studies, in well-structured domains; the fading gain was for near transfer.

**LS-18. Unguided discovery teaches less than explicit instruction, while discovery with guidance (feedback, examples, scaffolds, prompts to explain) teaches more than either.**
Grade A. Unassisted discovery vs explicit instruction _d_ = −0.38; enhanced discovery vs other instruction _d_ = 0.30 ([Alfieri 2011][alfieri2011]). Guidance in inquiry learning helps learning outcomes (_d_ = 0.50) ([Lazonder 2016][lazonder2016]). The advantage of guidance recedes once prior knowledge is high ([Kirschner 2006][kirschner2006]).

**LS-19. Struggling with a Problem before being taught the solution (productive failure) can improve conceptual understanding, provided instruction follows.**
Grade A, contested. Problem solving then instruction beat instruction then problem solving (_g_ = 0.36, 53 studies; up to 0.58 with high fidelity to Productive Failure) ([Sinha 2021][sinha2021]). Boundary: reversed for primary-school children and for domain-general skills ([Sinha 2021][sinha2021]); observing another student's failed attempts worked as well or better ([Hartmann 2021][hartmann2021]; [Braas 2025][braas2025]). The design space lies between pure discovery and pure instruction ([Kapur 2016][kapur2016]).

### Errors and feedback

**LS-20. Making errors helps learning when corrective feedback follows, and confidently held errors are the most likely to be corrected (the hypercorrection effect).**
Grade B. Errorful learning with feedback outperforms error avoidance in laboratory studies; analysis of the reasoning behind a mistake matters ([Metcalfe 2017][metcalfe2016]; [Mera 2021][mera2021]). Errors made with high confidence were the most likely to be corrected on a retest ([Butterfield 2001][butterfield2001]), the effect lasts a week, but those errors also return when the correction is forgotten ([Butler 2011][butler2011]). Boundary: mostly general-knowledge and vocabulary items.

**LS-21. Feedback helps learning on average, but its effect varies widely and a large share of feedback makes performance worse, especially feedback aimed at the person rather than the task.**
Grade A. Educational feedback _d_ = 0.48 across 435 studies, with large heterogeneity explained largely by its information content ([Wisniewski 2020][wisniewski2020]). Across 607 effect sizes, over a third of feedback interventions decreased performance; effects weaken as feedback moves attention from the task towards the self ([Kluger 1996][kluger1996]). Feedback works when it answers where the student is going, how they are doing and what to do next ([Hattie 2007][hattie2007]).

**LS-22. Feedback that explains why an answer is right or wrong (elaborated feedback) helps more than feedback that only says right or wrong.**
Grade A. In computer-based environments, elaborated feedback _g_ = 0.49, correct-answer feedback 0.32, right/wrong only 0.05; elaborated feedback especially helps higher-order outcomes ([Van der Kleij 2015][vanderkleij2015]). Feedback works best when students cannot simply copy the answer from it ([Bangert-Drowns 1991][bangertdrowns1991]). A review of formative feedback reaches the same direction ([Shute 2008][shute2008]). Boundary: the best timing is unsettled (see Contested).

### Effort and its misreading

**LS-23. Conditions that make practice feel harder and slower (desirable difficulties: spacing, interleaving, retrieval) often produce better long-term learning, and performance during practice is a poor guide to it.**
Grade B. The term comes from Bjork's work on difficulties that slow practice but help retention ([Bjork 2011][bjork2011]; [Brown 2014][brown2014]). Learning and performance can dissociate in both directions ([Soderstrom 2015][soderstrom2015]); difficulties that work are those that prompt the processing learning needs ([Ruitenburg 2026][ruitenburg2026]; [Binks 2026][binks2026]). Students misjudge them: restudy raised confidence while testing raised retention ([Roediger 2006][roediger2006]); learners rated blocking more effective after interleaving had worked better for them ([Kornell 2008][kornell2008]); after massed practice pupils were grossly overconfident, after spaced practice accurate ([Emeny 2021][emeny2021]); students rated varied retrieval cues less effective although they worked better ([Butowska 2024][butowska2024]); students prefer blocking ([Li 2025][li2025]). Perceived effort reads as poor learning and drives students away from these conditions ([de Bruin 2023][debruin2023]). Boundary: not every difficulty is desirable; hard-to-read fonts help memory only under narrow conditions and often not at all ([Weißgerber 2017][weissgerber2017]; [Muhmenthaler 2026][muhmenthaler2026]).

### Attention and sleep

**LS-24. Attention split during learning (media multitasking) lowers what is retained, even when immediate comprehension seems fine.**
Grade B. Laptop multitasking lowered test scores for the user and for peers who could see the screen ([Sana 2013][sana2012]); allowing devices in lectures did not reduce in-class quiz scores but lowered later exam scores ([Glass 2018][glass2018]); media multitasking, unlike mind wandering, was associated with worse learning ([Wammes 2019][wammes2018]); a review links media multitasking to lower recall, comprehension and self-regulation, which students misjudge ([May 2018][may2018]). Boundary: the studies are of students in lecture settings; one-to-one study was not searched.

**LS-25. Sleep supports memory: losing sleep before learning impairs encoding, and sleep after learning helps consolidate it.**
Grade A, with caution. Total sleep deprivation before learning _g_ = 0.62, after learning _g_ = 0.28, with publication bias and low power ([Newbury 2021][newbury2021]); restricting sleep to 3–6.5 hours impairs memory formation about as much (_g_ = 0.29) ([Crowley 2024][crowley2024]); sleep benefits motor memory consolidation (_g_ = 0.43) ([Schmid 2020][schmid2020]). Boundary: effects on emotional and on false memories appear only under particular methods ([Lipinska 2019][lipinska2019]; [Newbury 2019][newbury2019]).

### What neuroscience adds

**LS-26. Neuroscience describes how memories are consolidated (replay of new memories during sleep, gradual reorganisation from hippocampus-dependent to schema-like neocortical memory), which fits the behavioural findings on sleep, spacing and schemas.**
Grade B for the mechanisms, C for their educational use. During slow-wave sleep, slow oscillations, spindles and ripples coordinate the reactivation of hippocampus-dependent memories and their redistribution to the neocortex ([Diekelmann 2010][diekelmann2010]); this replay favours transforming episodic memory into schema-like neocortical memory ([Brodt 2023][brodt2023]; [Kumral 2023][kumral2023]); memories move from detailed to gist and schema representations ([Sekeres 2018][sekeres2018]); cueing memories during sleep strengthens them (_g_ = 0.29) ([Hu 2020][hu2020]). Boundary: the classical consolidation concept is itself questioned ([Moscovitch 2022][moscovitch2022]).

**LS-27. Neuroscience has not yet produced a teaching method that behavioural research had not already found; whether a method works is shown by what students can do afterwards, not by brain measures.**
Grade C. No current example of neuroscience motivating a new effective teaching method; behaviour is the relevant test ([Bowers 2016][bowers2016]); brain imaging mostly confirms what educators already know ([Donoghue 2019][donoghue2019]); messages crossing from neuroscience to education are often distorted ([Howard-Jones 2014][howardjones2014]). Counterpoint: the gap is narrowing with portable imaging of teacher–student interaction ([Tan 2023][tan2023]), and neuroscience can still offer opportunities ([Varma 2008][varma2008]).

### Myths and weak techniques

**LS-28. Matching instruction to a student's preferred "learning style" (visual, auditory and so on; the meshing hypothesis) does not improve learning.**
Grade A. Almost no study meets the design needed to test the claim, and those that do contradict it ([Pashler 2008][pashler2008]; [Aslaksen 2018][aslaksen2018]); experiments that followed that design, with real course material, found no match benefit ([Rogowsky 2015][rogowsky2015]; [Melzner 2024][melzner2024]). Across 17 meta-analyses, matching studies show _d_ = 0.04 ([Hattie 2025][hattie2025]). One meta-analysis found _g_ = 0.31, but only 26% of outcomes showed the crossover the hypothesis needs, and study quality was low ([Clinton-Lisell 2024][clintonlisell2024]). Students do have preferences and differ in specific abilities; the claim that fails is that matching to preference helps ([Pashler 2008][pashler2008]).

**LS-29. Rereading, highlighting and summarising without training are popular and weak; practice testing (self-testing) and distributed practice (spacing) do more for the same time.**
Grade A. Rated low utility next to high utility for practice testing and distributed practice ([Dunlosky 2013][dunlosky2013]); a meta-analysis of the same ten techniques ranks distributed practice and practice testing highest and underlining and summarisation lowest ([Donoghue 2021][donoghue2021]). Rereading and highlighting are the techniques students use most ([Urrizola 2022][urrizola2022]; [Yüksel 2024][yuksel2024]). Boundary: most outcomes were factual; [Donoghue 2021][donoghue2021] found larger effects for lower-ability students.

**LS-30. Other popular brain beliefs lack support: left-brained and right-brained learners, the Mozart effect, sugar harming attention, using only 10% of the brain.**
Grade B for the first three; the 10% claim rests on the model's knowledge, as no search found a test of it. Across 1,011 resting-state scans, lateralisation was a local property of brain networks, with no whole-brain "left-brained" or "right-brained" type ([Nielsen 2013][nielsen2013]). Little evidence remains for a specific Mozart effect: any music raised spatial scores about as much, and effects depended on the lab ([Pietschnig 2010][pietschnig2010]). In 23 blinded studies, sugar did not affect children's behaviour or cognition ([Wolraich 1995][wolraich1995]). Teachers believed about half of the neuromyths presented, and more brain knowledge did not protect against them ([Dekker 2012][dekker2012]); training reduces but does not remove them, and learning styles is the most endorsed ([Macdonald 2017][macdonald2017]; [Torrijos-Muelas 2021][torrijosmuelas2021]).

**LS-31. Brain training, chess, music and working memory exercises do not improve general reasoning or school achievement (far transfer); practice improves what is practised and similar tasks.**
Grade A. Effects shrink with study quality and vanish with active controls ([Sala 2017][sala2017]); in a second-order meta-analysis, far transfer is null after correcting for placebo and publication bias while near transfer exists ([Sala 2019][sala2019]; [Gobet 2022][gobet2022]). Boundary: a reanalysis claims a small far-transfer effect for music (_g_ = 0.23) ([Bigand 2021][bigand2021]).

**LS-32. The claim that handwriting notes beats typing them did not replicate.**
Grade B. Two direct replications of the original study found no reliable difference on quizzes; mini meta-analyses agree ([Morehead 2019][morehead2019]; [Urry 2021][urry2021]). Boundary: the studies are of students taking lecture notes; other tasks and ages were not tested.

## Terms

Research name, with the everyday name in brackets where they differ.

- Retrieval practice, practice testing (active recall, self-testing, flashcards): LS-6, LS-7.
- Distributed practice (spaced repetition; opposite: cramming); successive relearning: LS-8, LS-9.
- Interleaved practice (mixed practice; opposite: blocked practice): LS-10.
- Pretesting, prequestions (guessing before learning): LS-11.
- Generation effect (producing instead of reading): LS-3.
- Self-explanation (explaining to yourself); elaborative interrogation (asking "why?"): LS-12, LS-13.
- Refutation text (myth-busting explanation): LS-5.
- Worked example (step-by-step solution); fading; expertise reversal: LS-15 to LS-17.
- Productive failure (struggle first): LS-19. Hypercorrection (confident errors fixed most easily): LS-20.
- Desirable difficulties (practice that feels hard but pays off): LS-23.
- Working memory (short-term memory); chunking; deliberate practice: LS-1, LS-35.
- Forgetting curve; savings (relearning is faster): LS-33.
- Levels of processing (deep versus shallow processing); encoding specificity (context-dependent memory): LS-34.
- Consolidation (memories settling, much of it in sleep): LS-25, LS-26.
- Media multitasking (distraction by devices): LS-24. Meshing hypothesis (learning styles): LS-28. Far transfer (brain training): LS-31.

## Contested and open

- **Testing effect with complex material.** One camp argues the testing effect shrinks or disappears as element interactivity rises ([van Gog 2015][vangog2015]; [Hanham 2017][hanham2017]); the other answers that element interactivity was never measured and that complex-material studies show the effect ([Karpicke 2015][karpicke2015]); a dissertation manipulating complexity found the effect throughout ([Bedwell 2018][bedwell2018]). Bears on LS-6 for worked Problems.
- **Instruction first or problem first.** Worked examples (LS-15) and productive failure (LS-19) seem to point opposite ways. The camps disagree on inquiry vs direct instruction ([Kirschner 2006][kirschner2006]; [de Jong 2023][dejong2023]); both accept that guidance and prior knowledge decide the outcome.
- **Prior knowledge paradox.** Whether prior knowledge helps new learning (LS-4) is open; the "knowledge is power" view and the meta-analytic null coexist ([Schneider 2025][schneider2025]), while expertise research (LS-35) treats domain knowledge as the core of skill.
- **Self-explanation with worked examples.** Self-explanation helps in general (LS-12), but adding self-explanation prompts to worked examples gave a negative moderator effect in mathematics ([Barbieri 2023][barbieri2023]).
- **Feedback timing.** Classroom studies tend to favour immediate feedback, laboratory studies delayed ([Kulik 1988][kulik1988]); for texts, feedback right after reading beats feedback during reading ([Swart 2019][swart2019]); [Van der Kleij 2015][vanderkleij2015] found immediate feedback better for lower-order outcomes, without a significant interaction.
- **Mathematics.** Retrieval practice and spacing effects are smaller or not robust in mathematics ([Murray 2025][murray2025]), while interleaving is small but positive ([Brunmair 2019][brunmair2019]).
- **Working memory capacity.** Fixed slots (about four, earlier seven) vs a flexible resource ([Miller 1956][miller1956]; [Cowan 2001][cowan2001]; [Ma 2014][ma2014]; [Morra 2024][morra2024]).
- **Deliberate practice.** How much of expert performance practice explains is disputed between the original account and the meta-analysis ([Ericsson 1993][ericsson1993]; [Macnamara 2014][macnamara2014]).
- **Systems consolidation** as a concept ([Moscovitch 2022][moscovitch2022]) and music's far transfer ([Bigand 2021][bigand2021]) remain disputed.
- **Sampling.** Most classroom studies are WEIRD ([Agarwal 2021][agarwal2021]); sleep studies are underpowered ([Newbury 2021][newbury2021]); expertise reversal is weaker in humanities and languages ([Tetzlaff 2025][tetzlaff2025]).

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor included; the synthesis decides what the app does.

1. **Make the Student produce, not read.** Retrieval (LS-6), generation (LS-3) and self-explanation (LS-12) beat reading and rereading (LS-29). A tutor that explains well but asks for little recall builds the familiarity that students mistake for knowledge (LS-23). An explanation can follow an attempt (LS-11, LS-19), but this is contested and suits students with some prior knowledge; novices learn more from worked examples first (item 2, LS-15, and Contested).
2. **Fit guidance to what the Student already knows, and keep re-fitting it.** Novices need worked examples and step-level help (LS-15, LS-18); students who know the material learn more from Problems with little help (LS-16). Moving from one to the other works best in steps adapted to the Student (LS-17). This requires estimating knowledge often, and short targeted checks can do it (LS-16). A fixed level of help per Course fails both groups.
3. **Space and mix practice across Study sessions.** Forgetting is steep at first (LS-33), so Reviews spread over days, with the gap growing towards the exam date (LS-8), and relearning to criterion in several sessions (LS-9) give durable recall. Interleaving pays off where Problem types look alike and must be told apart (LS-10), and less for unrelated facts or rule-finding.
4. **Practise the way the exam asks.** Recall transfers best to the format and kind of question practised (LS-7, LS-34); practice should ask for meaning, not surface features (LS-34).
5. **Treat errors as useful, and correct them with reasons.** Attempts that go wrong help if correction follows (LS-11, LS-20). Feedback should say why, point at the task and the next step, and not judge the person (LS-21, LS-22). For a confidently held error, name the wrong idea and why it fails (LS-5, LS-20), and revisit it later because it tends to return (LS-20).
6. **Do not trust a smooth session as proof of learning.** Fast, correct answers during massed practice can overstate what will last (LS-23). Evidence of learning comes from delayed, varied retrieval (LS-7, LS-8).
7. **Prefer several examples to one.** To teach a principle that must transfer, compare two or more examples that differ on the surface (LS-14); expect little far transfer without that (LS-31).
8. **Drop the myths.** No learning-style profiles (LS-28), no brain-based claims (LS-27, LS-30), no promise that general training improves thinking (LS-31). Sleep and focused attention matter for retention (LS-24, LS-25); this report has no finding on what a tutor can do about them.

**Conflicts with other fields.** The conditions that work best (retrieval, spacing, interleaving, struggling first) feel harder and less productive, so they collide with motivation and persistence (report MOT) and with students' own judgments of learning (report AM): the S2D2 framework names exactly this problem ([de Bruin 2023][debruin2023]). Students' preferences, as in learning styles, are a matter of autonomy and engagement, not of effectiveness, which the motivation report weighs. Cognitive load (LS-1, LS-2) is also what interface design (report UX) manages, and how much guidance to give (LS-16, LS-18) is the core question for the human tutoring and ITS reports.

## Sources

Links go to the DOI where one exists. Statuses for the first version's sources rest on the abstracts read when they were found; the revision re-read the abstracts of those it searched again.

**Verified** (abstract or text checked): [Adesope 2017][adesope2017], [Agarwal 2021][agarwal2021], [Alfieri 2011][alfieri2011], [Aslaksen 2018][aslaksen2018], [Bangert-Drowns 1991][bangertdrowns1991], [Barbieri 2023][barbieri2023], [Bedwell 2018][bedwell2018], [Bertsch 2007][bertsch2007], [Bigand 2021][bigand2021], [Binks 2026][binks2026], [Bisra 2018][bisra2018], [Boudreau 1999][boudreau1999], [Bowers 2016][bowers2016], [Braas 2025][braas2025], [Brodt 2023][brodt2023], [Brunmair 2019][brunmair2019], [Buchin 2025][buchin2025], [Butler 2011][butler2011], [Butowska 2024][butowska2024], [Butterfield 2001][butterfield2001], [Carpenter 2022][carpenter2022], [Catrambone 1989][catrambone1989], [Cepeda 2006][cepeda2006], [Chen 2021][chen2021si], [Chen 2023 (element interactivity)][chen2023ei], [Chen 2023 (worked examples)][chen2023we], [Chi 1989][chi1989], [Clinton-Lisell 2024][clintonlisell2024], [Cowan 2001][cowan2001], [Craik 1975][craik1975], [Crissman 2006][crissman2006], [Crowley 2024][crowley2024], [Danielson 2024][danielson2024], [de Bruin 2023][debruin2023], [de Jong 2023][dejong2023], [Dekker 2012][dekker2012], [Diekelmann 2010][diekelmann2010], [Donoghue 2019][donoghue2019], [Donoghue 2021][donoghue2021], [Dunlosky 2013][dunlosky2013], [Emeny 2021][emeny2021], [Fiorella 2015][fiorella2015], [Gao 2025][gao2025], [Gentner 2003][gentner2003], [Gereau 2026][gereau2026], [Gick 1983][gick1983], [Glass 2018][glass2018], [Gobet 1996][gobet1996], [Gobet 1998][gobet1998], [Gobet 2022][gobet2022], [Hanham 2017][hanham2017], [Hartmann 2021][hartmann2021], [Hattie 2007][hattie2007], [Hattie 2025][hattie2025], [Higham 2022][higham2022], [Howard-Jones 2014][howardjones2014], [Hu 2020][hu2020], [Jáñez 2025][janez2025], [Kalyuga 2004][kalyuga2004], [Kalyuga 2007][kalyuga2007], [Kapur 2016][kapur2016], [Karpicke 2008][karpicke2008], [Karpicke 2015][karpicke2015], [Kim 2022][kim2022], [Kirschner 2006][kirschner2006], [Kluger 1996][kluger1996], [Kornell 2008][kornell2008], [Kulik 1988][kulik1988], [Kumral 2023][kumral2023], [Latimier 2021][latimier2021], [Lazonder 2016][lazonder2016], [Leahy 2019][leahy2019], [Li 2025][li2025], [Lipinska 2019][lipinska2019], [Little 2025][little2025], [Ma 2014][ma2014], [Macdonald 2017][macdonald2017], [Macnamara 2014][macnamara2014], [Mawson 2025][mawson2025], [May 2018][may2018], [McCurdy 2020][mccurdy2020], [Melzner 2024][melzner2024], [Mera 2021][mera2021], [Metcalfe 2017][metcalfe2016], [Morehead 2019][morehead2019], [Morra 2024][morra2024], [Morris 1977][morris1977], [Moscovitch 2022][moscovitch2022], [Muhmenthaler 2026][muhmenthaler2026], [Murray 2025][murray2025], [Murre 2015][murre2015], [Newbury 2019][newbury2019], [Newbury 2021][newbury2021], [Nielsen 2013][nielsen2013], [Pan 2018][pan2018], [Pan 2023][pan2023], [Pashler 2008][pashler2008], [Peng 2024][peng2024], [Pietschnig 2010][pietschnig2010], [Rawson 2011][rawson2011], [Rawson 2018][rawson2018], [Renkl 2002][renkl2002], [Renkl 2003][renkl2003], [Rittle-Johnson 2017][rittlejohnson2017], [Roediger 2006][roediger2006], [Roediger 2011][roediger2011], [Rogowsky 2015][rogowsky2015], [Rowland 2014][rowland2014], [Rubin 1996][rubin1996], [Ruitenburg 2026][ruitenburg2026], [Sala 2017][sala2017], [Sala 2019][sala2019], [Salden 2009][salden2009], [Sana 2013][sana2012], [Schindler 2023][schindler2023], [Schmid 2020][schmid2020], [Schneider 2025][schneider2025], [Schroeder 2022][schroeder2022], [Sekeres 2018][sekeres2018], [Simonsmeier 2021][simonsmeier2021], [Sinha 2021][sinha2021], [Smith 2001][smith2001], [Soderstrom 2015][soderstrom2015], [St. Hilaire 2023][sthilaire2023], [Swart 2019][swart2019], [Sweller 1985][sweller1985], [Sweller 1998][sweller1998], [Sweller 2019][sweller2019], [Tan 2023][tan2023], [Tetzlaff 2025][tetzlaff2025], [Torrijos-Muelas 2021][torrijosmuelas2021], [Urrizola 2022][urrizola2022], [Urry 2021][urry2021], [Van der Kleij 2015][vanderkleij2015], [van Gog 2011][vangog2011], [van Gog 2015][vangog2015], [Varma 2008][varma2008], [Walsh 2022][walsh2022], [Wammes 2019][wammes2018], [Weißgerber 2017][weissgerber2017], [Wilschut 2026][wilschut2026], [Wisniewski 2020][wisniewski2020], [Wolraich 1995][wolraich1995], [Yang 2021][yang2021], [Yüksel 2024][yuksel2024].

**Located** (exists, content not checked): [Barnett 2002][barnett2002], [Bjork 2011][bjork2011], [Brown 2014][brown2014] (book), [Chase 1973][chase1973], [Craik 1972][craik1972], [Ebbinghaus 1913][ebbinghaus1913] (book), [Ericsson 1993][ericsson1993], [Kalyuga 2003][kalyuga2003], [Miller 1956][miller1956], [Shute 2008][shute2008], [Slamecka 1978][slamecka1978], [Sweller 1988][sweller1988], [Tulving 1973][tulving1973].

**From memory**: none. The 10% part of LS-30 rests on the model's knowledge without a source.

[adesope2017]: https://doi.org/10.3102/0034654316689306
[agarwal2021]: https://doi.org/10.1007/s10648-021-09595-9
[alfieri2011]: https://doi.org/10.1037/a0021017
[aslaksen2018]: https://doi.org/10.3389/fpsyg.2018.01538
[bangertdrowns1991]: https://doi.org/10.3102/00346543061002213
[barbieri2023]: https://doi.org/10.1007/s10648-023-09745-1
[barnett2002]: https://doi.org/10.1037/0033-2909.128.4.612
[bedwell2018]: https://consensus.app/papers/details/w:539d5abd-5998-48b7-8fd7-f303f04aa263/
[bertsch2007]: https://doi.org/10.3758/bf03193441
[bigand2021]: https://doi.org/10.3758/s13421-021-01226-6
[binks2026]: https://doi.org/10.1111/jep.70349
[bisra2018]: https://doi.org/10.1007/s10648-018-9434-x
[bjork2011]: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf
[boudreau1999]: https://doi.org/10.55016/ojs/ajer.v45i2.54666
[bowers2016]: https://doi.org/10.1037/rev0000025
[braas2025]: https://doi.org/10.1007/s11251-025-09706-x
[brodt2023]: https://doi.org/10.1016/j.neuron.2023.03.005
[brown2014]: https://search.worldcat.org/oclc/859168651
[brunmair2019]: https://doi.org/10.1037/bul0000209
[buchin2025]: https://doi.org/10.1037/xap0000520
[butler2011]: https://doi.org/10.3758/s13423-011-0173-y
[butowska2024]: https://doi.org/10.1073/pnas.2413511121
[butterfield2001]: https://doi.org/10.1037/0278-7393.27.6.1491
[carpenter2022]: https://doi.org/10.1038/s44159-022-00089-1
[catrambone1989]: https://doi.org/10.1037/0278-7393.15.6.1147
[cepeda2006]: https://doi.org/10.1037/0033-2909.132.3.354
[chase1973]: https://doi.org/10.1016/0010-0285(73)90004-2
[chen2021si]: https://doi.org/10.1007/s10648-021-09613-w
[chen2023ei]: https://doi.org/10.1007/s10648-023-09782-w
[chen2023we]: https://doi.org/10.1080/01443410.2023.2273762
[chi1989]: https://doi.org/10.1207/s15516709cog1302_1
[clintonlisell2024]: https://doi.org/10.3389/fpsyg.2024.1428732
[cowan2001]: https://doi.org/10.1017/s0140525x01003922
[craik1972]: https://doi.org/10.1016/s0022-5371(72)80001-x
[craik1975]: https://doi.org/10.1037/0096-3445.104.3.268
[crissman2006]: https://consensus.app/papers/details/w:48a9c832-eb13-4e54-9a24-88bbd7358c89/
[crowley2024]: https://doi.org/10.1016/j.neubiorev.2024.105929
[danielson2024]: https://doi.org/10.1080/00461520.2024.2365628
[debruin2023]: https://doi.org/10.1007/s10648-023-09766-w
[dejong2023]: https://doi.org/10.1016/j.edurev.2023.100536
[dekker2012]: https://doi.org/10.3389/fpsyg.2012.00429
[diekelmann2010]: https://doi.org/10.1038/nrn2762
[donoghue2019]: https://consensus.app/papers/details/w:7896c2d8-79c3-47fc-bee1-cd50583ae4e6/
[donoghue2021]: https://doi.org/10.3389/feduc.2021.581216
[dunlosky2013]: https://doi.org/10.1177/1529100612453266
[ebbinghaus1913]: https://doi.org/10.1037/10011-000
[emeny2021]: https://doi.org/10.1002/acp.3814
[ericsson1993]: https://doi.org/10.1037/0033-295x.100.3.363
[fiorella2015]: https://doi.org/10.1017/cbo9781107707085
[gao2025]: https://doi.org/10.1080/0020739x.2025.2556867
[gentner2003]: https://doi.org/10.1037/0022-0663.95.2.393
[gereau2026]: https://doi.org/10.1037/xlm0001634
[gick1983]: https://doi.org/10.1016/0010-0285(83)90002-6
[glass2018]: https://doi.org/10.1080/01443410.2018.1489046
[gobet1996]: https://doi.org/10.3758/bf03200937
[gobet1998]: https://doi.org/10.1080/741942359
[gobet2022]: https://doi.org/10.1177/17456916221091830
[hanham2017]: https://doi.org/10.1002/acp.3324
[hartmann2021]: https://doi.org/10.1007/s11251-020-09528-z
[hattie2007]: https://doi.org/10.3102/003465430298487
[hattie2025]: https://doi.org/10.1007/s10648-025-10002-w
[higham2022]: https://doi.org/10.1037/edu0000693
[howardjones2014]: https://doi.org/10.1038/nrn3817
[hu2020]: https://doi.org/10.1037/bul0000223
[janez2025]: https://doi.org/10.1080/02702711.2025.2482627
[kalyuga2003]: https://doi.org/10.1207/s15326985ep3801_4
[kalyuga2004]: https://doi.org/10.1037/0022-0663.96.3.558
[kalyuga2007]: https://doi.org/10.1007/s10648-007-9054-3
[kapur2016]: https://doi.org/10.1080/00461520.2016.1155457
[karpicke2008]: https://doi.org/10.1126/science.1152408
[karpicke2015]: https://doi.org/10.1007/s10648-015-9309-3
[kim2022]: https://doi.org/10.1111/lang.12479
[kirschner2006]: https://doi.org/10.1207/s15326985ep4102_1
[kluger1996]: https://doi.org/10.1037/0033-2909.119.2.254
[kornell2008]: https://doi.org/10.1111/j.1467-9280.2008.02127.x
[kulik1988]: https://doi.org/10.3102/00346543058001079
[kumral2023]: https://doi.org/10.1016/j.neuropsychologia.2023.108661
[latimier2021]: https://doi.org/10.1007/s10648-020-09572-8
[lazonder2016]: https://doi.org/10.3102/0034654315627366
[leahy2019]: https://doi.org/10.4324/9780429283895-18
[li2025]: https://doi.org/10.1037/edu0000909
[lipinska2019]: https://doi.org/10.3389/fpsyg.2019.01014
[little2025]: https://doi.org/10.3390/bs15050662
[ma2014]: https://doi.org/10.1038/nn.3655
[macdonald2017]: https://doi.org/10.3389/fpsyg.2017.01314
[macnamara2014]: https://doi.org/10.1177/0956797614535810
[mawson2025]: https://doi.org/10.3390/bs15060771
[may2018]: https://doi.org/10.1186/s41239-018-0096-z
[mccurdy2020]: https://doi.org/10.3758/s13423-020-01762-3
[melzner2024]: https://doi.org/10.1007/s11251-024-09689-1
[mera2021]: https://doi.org/10.3758/s13423-021-02022-8
[metcalfe2016]: https://doi.org/10.1146/annurev-psych-010416-044022
[miller1956]: https://doi.org/10.1037/h0043158
[morehead2019]: https://doi.org/10.1007/s10648-019-09468-2
[morra2024]: https://doi.org/10.5334/joc.387
[morris1977]: https://doi.org/10.1016/s0022-5371(77)80016-9
[moscovitch2022]: https://doi.org/10.12703/r/11-33
[muhmenthaler2026]: https://doi.org/10.1080/09658211.2026.2742962
[murray2025]: https://doi.org/10.1007/s10648-025-10035-1
[murre2015]: https://doi.org/10.1371/journal.pone.0120644
[newbury2019]: https://doi.org/10.3758/s13423-018-1528-4
[newbury2021]: https://doi.org/10.1037/bul0000348
[nielsen2013]: https://doi.org/10.1371/journal.pone.0071275
[pan2018]: https://doi.org/10.1037/bul0000151
[pan2023]: https://doi.org/10.1007/s10648-023-09814-5
[pashler2008]: https://doi.org/10.1111/j.1539-6053.2009.01038.x
[peng2024]: https://doi.org/10.3758/s13421-024-01599-4
[pietschnig2010]: https://doi.org/10.1016/j.intell.2010.03.001
[rawson2011]: https://doi.org/10.1037/a0023956
[rawson2018]: https://doi.org/10.1037/xap0000146
[renkl2002]: https://doi.org/10.1080/00220970209599510
[renkl2003]: https://doi.org/10.1207/s15326985ep3801_3
[rittlejohnson2017]: https://doi.org/10.1007/s11858-017-0834-z
[roediger2006]: https://doi.org/10.1111/j.1467-9280.2006.01693.x
[roediger2011]: https://doi.org/10.1016/j.tics.2010.09.003
[rogowsky2015]: https://doi.org/10.1037/a0037478
[rowland2014]: https://doi.org/10.1037/a0037559
[rubin1996]: https://doi.org/10.1037/0033-295x.103.4.734
[ruitenburg2026]: https://doi.org/10.1007/s10648-026-10225-5
[sala2017]: https://doi.org/10.1177/0963721417712760
[sala2019]: https://doi.org/10.1525/collabra.203
[salden2009]: https://doi.org/10.1111/j.1756-8765.2008.01011.x
[sana2012]: https://doi.org/10.1016/j.compedu.2012.10.003
[schindler2023]: https://doi.org/10.1007/s10648-023-09758-w
[schmid2020]: https://doi.org/10.1016/j.neubiorev.2020.07.028
[schneider2025]: https://doi.org/10.1016/j.lindif.2025.102744
[schroeder2022]: https://doi.org/10.1007/s10648-021-09656-z
[sekeres2018]: https://doi.org/10.1016/j.neulet.2018.05.006
[shute2008]: https://doi.org/10.3102/0034654307313795
[simonsmeier2021]: https://doi.org/10.1080/00461520.2021.1939700
[sinha2021]: https://doi.org/10.3102/00346543211019105
[slamecka1978]: https://doi.org/10.1037/0278-7393.4.6.592
[smith2001]: https://doi.org/10.3758/bf03196157
[soderstrom2015]: https://doi.org/10.1177/1745691615569000
[sthilaire2023]: https://doi.org/10.3758/s13423-023-02353-8
[swart2019]: https://doi.org/10.1016/j.edurev.2019.100296
[sweller1985]: https://doi.org/10.1207/s1532690xci0201_3
[sweller1988]: https://doi.org/10.1207/s15516709cog1202_4
[sweller1998]: https://doi.org/10.1023/a:1022193728205
[sweller2019]: https://doi.org/10.1007/s10648-019-09465-5
[tan2023]: https://doi.org/10.1016/j.neuroimage.2023.120367
[tetzlaff2025]: https://doi.org/10.1016/j.learninstruc.2025.102142
[torrijosmuelas2021]: https://doi.org/10.3389/fpsyg.2020.591923
[tulving1973]: https://doi.org/10.1037/h0020071
[urrizola2022]: https://doi.org/10.1080/0142159x.2022.2137016
[urry2021]: https://doi.org/10.1177/0956797620965541
[vanderkleij2015]: https://doi.org/10.3102/0034654314564881
[vangog2011]: https://doi.org/10.1016/j.cedpsych.2010.10.004
[vangog2015]: https://doi.org/10.1007/s10648-015-9310-x
[varma2008]: https://doi.org/10.3102/0013189x08317687
[walsh2022]: https://doi.org/10.3758/s13421-022-01361-8
[wammes2018]: https://doi.org/10.1016/j.compedu.2018.12.007
[weissgerber2017]: https://doi.org/10.1016/j.learninstruc.2017.02.004
[wilschut2026]: https://doi.org/10.1037/xap0000540
[wisniewski2020]: https://doi.org/10.3389/fpsyg.2019.03087
[wolraich1995]: https://doi.org/10.1001/jama.1995.03530200053037
[yang2021]: https://doi.org/10.1037/bul0000309
[yuksel2024]: https://doi.org/10.1007/s11409-023-09372-9
