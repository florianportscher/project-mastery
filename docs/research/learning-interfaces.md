# Learning interfaces

- **Field**: cognitive load theory, multimedia learning, and the human-computer interaction research on reading, attention, choice and trust that bears on learning.
- **Scope**: how the way material and interaction are presented changes what a learner can take in: load, multimedia design, reading on screens, conversational turns, mobile and handwritten input, interruptions and notifications, choice, defaults, progress display and manipulative design. Memory and practice are the learning science report (`LS-` ids) and are cited, not repeated; motivation, metacognition and tutoring craft have their own reports.
- **Date**: 2026-11-26.
- **Outline started from**: Sweller (cognitive load, element interactivity), Chandler & Sweller 1991 (split attention), Kalyuga et al. 1999 (redundancy), Paas 1992 (load ratings); Mayer's _Multimedia Learning_ and his twelve principles; Ginns 2005, 2006 and Ginns, Martin & Marsh 2013 (modality, contiguity, personalization meta-analyses); Rey 2012 (seductive details); Chi & Wylie 2014 (ICAP); Rowe 1986 (wait time); Delgado et al. 2018 (screen reading); Altmann & Trafton 2002, Mark et al. 2008, Stothart et al. 2015, Ward et al. 2017 (interruptions, phones); Anthony, Yang & Koedinger (handwriting input); Iyengar & Lepper 2000, Scheibehenne et al. 2010 (choice overload); Johnson & Goldstein 2003 (defaults); Kivetz et al. 2006, Villar et al. 2013 (progress); Gray et al. 2018, Mathur et al. 2019 (dark patterns); Parasuraman & Riley 1997 (automation misuse); Miller 1968 (response time). The search added Noetel et al. 2021, the signaling and segmenting meta-analyses, Leahy & Sweller 2011, the split-attention replications, Salmerón et al. 2023, Fitz et al. 2019, Oreopoulos & Petronijevic 2019, Patall et al. 2008, Bastani et al. 2025 and two 2026 preprints on LLM tutoring.
- **Search tools**: Consensus (five searches before the plan's allowance ran out), web search (about 25 searches, for abstracts and abstract-level summaries), alphaXiv (one search, LLM tutoring preprints), the Crossref API (DOIs, some abstracts) and the arXiv API (preprint abstracts). About 40 search calls in all, not counting DOI lookups.
- **Could not reach**: Elicit (the account's plan has no API access); OpenAlex and Semantic Scholar (rate-limited, and Semantic Scholar withholds Elsevier and APA abstracts); PubMed was not used, since little of this field is indexed there; full texts behind paywalls, so effect sizes come from abstracts; books, which are **located** but not read.

Evidence grades: **A** meta-analyses or several controlled trials; **B** single controlled trials or consistent correlational evidence; **C** theory, expert consensus or small studies. Source status: **verified** (found, and its abstract or text says what the claim says), **located** (the work exists, but its content could not be checked) or **from memory** (attributed from the model's knowledge, not found). Statuses are listed under Sources.

Most multimedia studies are short laboratory sessions with university students learning a few minutes of explanatory material, such as how lightning forms or how brakes work; the reading studies span school pupils to adults. Effect sizes are standardised mean differences (_d_ or _g_); 0.2 is small, 0.5 medium, 0.8 large.

## Claims

### Cognitive load

**UX-1. Learning is limited by working memory (LS-1), and the load on it has a part set by the material and the learner (intrinsic load) and a part set by how the material is presented (extraneous load); design can only remove the second.**
Grade C (theory with a large experimental programme behind it). Cognitive load theory derives its design effects from this split ([Sweller 1998][sweller1998]; [Sweller 2019][sweller2019]). A third kind, germane load (effort spent on building schemas), was later folded into intrinsic load because it could not be separated from it ([Sweller 2010][sweller2010]; [Kalyuga 2011][kalyuga2011]). Boundary: the load types are inferred from learning results and self-ratings ([Paas 1992][paas1992]), not measured independently (see Contested).

**UX-2. How heavy a piece of material is depends on how many of its elements must be held together at once (element interactivity), counted against what the learner already knows; teaching the parts before their interactions lowers it.**
Grade B. The same Problem is routine for someone with the schema and overwhelming for a novice (LS-2). Teaching the names and behaviour of components before a process that combines them (pre-training) helped in experiments ([Mayer 2002][mayer2002]), with a median _d_ = 0.46 across comparisons ([Mayer 2017][mayer2017]). Boundary: element interactivity has no agreed measure.

**UX-3. Information that must be read together should be shown together: separating a diagram from its labels, or an explanation from the formula it explains, forces the learner to integrate them in their head (split attention).**
Grade A. Integrated formats beat separated ones (_g_ = 0.63, 58 comparisons) ([Schroeder 2018][schroeder2018]); spatial and temporal contiguity help most with complex material ([Ginns 2006][ginns2006]) and are among the largest effects in an overview of 29 meta-analyses ([Noetel 2021][noetel2021]). The effect was first shown with geometry and engineering instructions ([Chandler 1991][chandler1991]). Boundary: some careful experiments did not replicate it ([Cammeraat 2020][cammeraat2020]; [Pouw 2019][pouw2019]), and load measures do not show that the integrated format reduces load, so why it works is open ([Schroeder 2020][schroeder2020]).

**UX-4. Information that disappears (speech, animation, text that scrolls away) costs more working memory than information that stays visible, and the cost grows with the length of each piece (the transient information effect).**
Grade B. A long spoken explanation of a graph taught pupils less than the same words in writing, reversing the usual modality advantage, while short spoken segments kept it ([Leahy 2011][leahy2011]). A scrolling page reduced understanding of complex texts, most for readers with low working memory capacity ([Sanchez 2009][sanchez2009]). Boundary: few studies; the effect is defined relative to segment length, which is not standardised.

**UX-5. Most design principles help novices, complex material and fixed-pace presentation most, and matter little or reverse for learners who know the material (expertise reversal).**
Grade A. Across 29 reviews, good design mattered more for complex materials and for system-paced presentations such as lectures than for self-paced ones such as websites ([Noetel 2021][noetel2021]). Signaling helps learners with low prior knowledge most ([Richter 2016][richter2016]); guidance that helps novices hinders experts (LS-16). Boundary: a large signaling meta-analysis found no prior-knowledge moderation ([Schneider 2018][schneider2018]), and segmenting helped high-knowledge learners more ([Rey 2019][rey2019]).

### Multimedia principles

**UX-6. Words with relevant pictures teach more than words alone (the multimedia principle), and pictures that show change over time (animation) can beat static ones.**
Grade B. The multimedia principle rests on a median _d_ = 1.67 from five comparisons in Mayer's own programme ([Mayer 2017][mayer2017]; [Mayer 2020][mayer2020]). Animations beat static pictures with a medium overall advantage ([Höffler 2007][hoffler2007]), confirmed among the robust effects in the overview ([Noetel 2021][noetel2021]). Boundary: only pictures that carry the content count; decorative pictures fall under UX-7. The underlying idea of separate verbal and pictorial channels (dual coding) is theory.

**UX-7. Interesting but irrelevant additions (seductive details: anecdotes, decorative images, jokes, background music) lower learning; leaving them out helps (coherence).**
Grade A. Meta-analyses find a reliable seductive detail effect, small to medium for retention and medium for transfer ([Rey 2012][rey2012]; [Sundararajan 2020][sundararajan2020]). The harm grows with the amount of digression ([Wesenberg 2026][wesenberg2026]) and comes from learners spending attention on the details, so telling them the details are irrelevant reduces it ([Kienitz 2023][kienitz2023]). Boundary: effect sizes vary with format and pacing; small amounts may be harmless ([Wesenberg 2026][wesenberg2026]).

**UX-8. Cues that point to the structure and the key elements (headings, highlighting, colour coding, arrows, "first… second…") improve learning (signaling).**
Grade A. Across 103 studies, _g_ = 0.53 for retention and 0.33 for transfer, with reduced cognitive load ([Schneider 2018][schneider2018]); _d_ = 0.38 in a second meta-analysis ([Alpizar 2020][alpizar2020]); signals linking text and pictures help, mainly for low prior knowledge ([Richter 2016][richter2016]). Boundary: effects vary widely, and the better-controlled studies show them more clearly ([Alpizar 2020][alpizar2020]).

**UX-9. Breaking an explanation into meaningful parts that the learner moves through at their own pace beats one continuous presentation (segmenting).**
Grade A. Across 88 comparisons, segmenting had small to medium effects on retention and transfer, reduced load and increased learning time ([Rey 2019][rey2019]). Boundary: the effect holds for system-paced segments too, so part of it is the pauses, not the control.

**UX-10. Giving learners control over pacing helps, but giving them control over what to study and in which order has no average effect.**
Grade A. The overall effect of learner control in educational technology is near zero (_g_ = 0.05, 29 effects) ([Karich 2014][karich2014]), in contrast to the segmenting benefit (UX-9). Boundary: few studies met the criteria; control over sequence may suit learners with more knowledge.

**UX-11. Explaining a picture in speech can beat explaining it in on-screen text (modality), but only for short segments that the learner cannot pace.**
Grade A with conditions. Meta-analyses support the modality effect ([Ginns 2005][ginns2005]; [Noetel 2021][noetel2021]), with a median _d_ = 0.72 in Mayer's programme ([Mayer 2017][mayer2017]); a later meta-analysis finds it mainly with system-paced presentation, dynamic pictures and short materials ([Wang 2016][wang2016]). Long spoken text reverses it (UX-4). Boundary: with self-paced material and text alone, there is no case for speech.

**UX-12. Repeating the same words on screen and in narration at the same time usually adds nothing and can hurt (redundancy), while short on-screen key terms beside narration can help.**
Grade B. Identical narration and text competed in experiments ([Kalyuga 1999][kalyuga1999]). A meta-analysis found spoken plus written text beat spoken alone for low prior knowledge learners, fixed-pace material and material without pictures, and that key terms beat verbatim text ([Adesope 2012][adesope2012]). Boundary: the direction depends on pictures, pacing and prior knowledge; the evidence is mixed (see Contested).

**UX-13. A conversational, personal style ("you", "we", direct address) teaches more than a formal impersonal one (personalization).**
Grade A. Across experiments with 3,312 students, conversational text improved retention (_d_ = 0.30) and transfer (_d_ = 0.54) and made processing more effective ([Ginns 2013][ginns2013]). On-screen characters (pedagogical agents) had a small positive effect ([Schroeder 2013][schroeder2013]). Boundary: the effect was small and non-significant in lessons longer than 35 minutes ([Ginns 2013][ginns2013]), so it may be a novelty or engagement effect.

### Reading, conversation and pace

**UX-14. People understand expository text slightly less well on screens than on paper, more so under time pressure (screen inferiority).**
Grade A. A meta-analysis of studies with 171,055 participants found an advantage for paper in both between- and within-participant designs, with no difference for narrative texts ([Delgado 2018][delgado2018]); handheld devices show a small paper advantage (_g_ ≈ −0.11) ([Salmerón 2023][salmeron2023]); a second meta-analysis compared performance, time and calibration on both media ([Clinton 2019][clinton2019]). Boundary: the effect is small and partly attributed to shallower reading habits on screens, not to the device.

**UX-15. Learning rises with the learner's own activity: producing an answer, an explanation or a summary beats receiving one, and building on another person's contribution in dialogue may beat both (the ICAP framework: interactive, constructive, active, passive).**
Grade B for constructive over passive (LS-3, LS-12), C for interactive over constructive. The framework orders engagement modes by observable behaviour and predicts learning I > C > A > P ([Chi 2014][chi2014]). Boundary: the interactive level depends on what the partner contributes; the framework classifies behaviour, not thought.

**UX-16. In classroom questioning, teachers wait under a second for an answer, and longer pauses after a question give longer and better answers (wait time).**
Grade C. The under-a-second pattern is documented in Rowe's review ([Rowe 1986][rowe1986]); the gains from waiting three seconds or more rest on the model's knowledge of the same review's body. Boundary: classroom speech, not written chat, where the learner sets their own reply time.

**UX-17. No controlled study has tested how long a written tutoring message should be; the indirect evidence points to short, focused turns.**
Grade C. In 1,718 logged moments of confusion with an LLM tutor, longer replies went with lower understanding in the student's next message, while concrete elaboration (an analogy or an example) went with higher ([Sharmin 2026][sharmin2026]). LLM tutors in a simulation intervened earlier and more often than human teachers and gave complete solutions instead of targeted hints ([Teo 2026][teo2026]). Coherence, segmenting and transient information (UX-4, UX-7, UX-9) predict the same direction. Boundary: correlational, one course, programming.

**UX-18. Chatbots for learning show large average effects in randomised studies, but mostly in short interventions, and unrestricted answer-giving AI can lower what students can do without it.**
Grade B. A meta-analysis of 24 randomised studies found a large effect, stronger in higher education and in short interventions, which the authors attribute to novelty ([Wu 2024][wu2024]). In a field experiment with about a thousand high school students, a ChatGPT-like assistant raised practice performance but lowered later exam grades by 17% compared with no access, while a version with tutoring safeguards largely avoided the harm ([Bastani 2025][bastani2025]). Boundary: the LLM report covers this field.

**UX-19. Delays in system response break the user's flow at known thresholds: about 0.1 s feels instant, about 1 s keeps the train of thought, about 10 s loses attention.**
Grade C. The thresholds go back to Miller's analysis of conversational transactions with computers ([Miller 1968][miller1968]) and are usability consensus; the exact numbers rest on the model's knowledge. Boundary: expert judgement, not learning outcomes.

### Mobile, input and attention

**UX-20. Learning with mobile devices works about as well as other well-designed instruction and better than many controls, with a moderate average effect.**
Grade A. Across 110 experimental and quasi-experimental studies, the mean effect was 0.523 ([Sung 2016][sung2016]). Boundary: the comparisons mix device, design and novelty; the result says mobile is a workable medium, not that it adds anything by itself.

**UX-21. Even brief interruptions in a multi-step task make people lose their place: a few seconds can double the errors in the steps that follow, and resuming takes time.**
Grade B. Interruptions of about 2.8 s doubled sequence errors and of 4.4 s tripled them, while errors within a step did not rise ([Altmann 2014][altmann2014]); pending goals decay in memory and need cues to be resumed ([Altmann 2002][altmann2002]); interrupted office workers compensate by working faster under more stress ([Mark 2008][mark2008]). Boundary: laboratory tasks; the cost depends on interruption length and on where in the task it falls.

**UX-22. A phone notification distracts even when it is not answered, and batching notifications at predictable times improves attention, while the mere presence of a phone has at most a small effect.**
Grade B. Receiving a call or text alert during an attention task raised errors to a level comparable with using the phone ([Stothart 2015][stothart2015]). In a field experiment, notifications delivered three times a day made people more attentive, productive and in control than notifications as they came, while turning them off entirely raised anxiety ([Fitz 2019][fitz2019]). The "brain drain" from a phone lying nearby ([Ward 2017][ward2017]) held only for working memory across 56 studies ([Parry 2023][parry2023]) and did not replicate in one study ([Hartmann 2020][hartmann2020]). Boundary: attention is also LS-24.

**UX-23. Reminders and nudges change engagement a little and achievement rarely.**
Grade B. Optimised practice reminders in a language app raised daily active users by 0.5% and new-user retention by 2%, and new reminder texts lose their effect as they become familiar ([Yancey 2020][yancey2020]). Text-message and online coaching for nearly 25,000 college students changed study time and wellbeing a little and grades not at all ([Oreopoulos 2019][oreopoulos2019]). Nudges in education work best for those most affected by the barrier they target ([Damgaard 2018][damgaard2018]). Boundary: the app study measures engagement, not learning.

**UX-24. Handwriting is a faster and more natural input for notation-heavy answers than typing, with similar learning, but the machine reading of handwriting is imperfect; drawing as a learning activity helps under conditions.**
Grade C. Entering equations by handwriting was about three times faster than typing and preferred by users ([Anthony 2005][anthony2005]); in an algebra tutor, handwriting gave similar learning in less time ([Anthony 2008][anthony2008]). Drawing to learn has benefits whose size depends on what it is compared with and how much guidance is given ([Fiorella 2018][fiorella2018]). Whether notes are handwritten or typed does not matter (LS-32). Boundary: no controlled research was found on photographing handwritten work for an AI to check; studies of photo-based answer apps are small and short.

### Choice, defaults, progress and trust

**UX-25. Too many options does not reliably demotivate (choice overload is not robust), but a few meaningful choices do raise motivation.**
Grade A. The famous jam-display study ([Iyengar 2000][iyengar2000]) did not generalise: across 50 experiments the mean choice overload effect was virtually zero ([Scheibehenne 2010][scheibehenne2010]); overload appears when the choice set is complex, the task difficult, preferences uncertain, or the goal is to minimise effort ([Chernev 2015][chernev2015]). Giving choices raised intrinsic motivation, most with two to four successive choices ([Patall 2008][patall2008]). Boundary: the overload moderators are the conditions a struggling learner is often in.

**UX-26. Whatever is preselected is chosen far more often (default effect).**
Grade A. Organ donation consent depends heavily on whether a country's form is opt-in or opt-out ([Johnson 2003][johnson2003]); across 58 studies the default effect is _d_ = 0.68 with large variation ([Jachimowicz 2019][jachimowicz2019]). Boundary: defaults work through effort, implied endorsement and reference points, so a default seen as self-serving weakens.

**UX-27. Showing progress helps only when it shows real advance: people work harder as a goal comes closer, a progress bar that moves slowly early on makes people quit, and points and badges give modest learning gains.**
Grade B. People accelerate as they near a reward, even with an illusion of progress ([Kivetz 2006][kivetz2006]). Across 32 experiments a constant progress indicator did not reduce survey drop-off; fast-then-slow indicators reduced it and slow-then-fast increased it ([Villar 2013][villar2013]). Game elements had positive effects on learning, stable for cognitive outcomes and less so for motivational and behavioural ones ([Sailer 2020][sailer2020]). Boundary: surveys and loyalty cards, not study; motivation is report MOT.

**UX-28. Interfaces that steer users against their interests (dark patterns: nagging, obstruction, hidden information, interface interference, forced action) are common and work, and only aggressive ones provoke a backlash.**
Grade B. Practitioners' examples fall into five strategies ([Gray 2018][gray2018]); a crawl of about 11,000 shopping sites found 1,818 instances ([Mathur 2019][mathur2019]); mild dark patterns more than doubled sign-ups to a dubious service without backlash, aggressive ones nearly quadrupled them and drew anger ([Luguri 2021][luguri2021]). Boundary: commerce and privacy settings, not learning.

**UX-29. People over-rely on automated advice, accepting wrong suggestions, and explanations alone do not prevent it; making them think first does, at the cost of liking the system less.**
Grade B. Over-reliance (misuse) and neglect after false alarms (disuse) are classic findings in automation ([Parasuraman 1997][parasuraman1997]). With AI decision support, people accepted wrong recommendations even with explanations, and interventions that forced them to decide before seeing the AI reduced over-reliance but were rated less favourably ([Buçinca 2021][bucinca2021]). Boundary: decision tasks, not learning; the learning analogue is UX-18.

## Terms

Research name, with the everyday name in brackets where they differ.

- Working memory (short-term memory); intrinsic, extraneous and germane load (how hard the content is, how hard the presentation makes it, effort spent learning): UX-1.
- Element interactivity (how many things you must juggle at once); pre-training (learning the parts first): UX-2.
- Split attention, spatial and temporal contiguity (keeping related things together): UX-3. Transient information (things that vanish, such as speech or scrolled-away text): UX-4.
- Expertise reversal (what helps beginners hinders experts): UX-5.
- Multimedia principle, dual coding (words plus pictures): UX-6. Coherence, seductive details (cutting fluff and fun facts): UX-7. Signaling, cueing (highlighting, headings): UX-8. Segmenting (bite-sized steps): UX-9. Learner control (choose your own path): UX-10. Modality (narrated rather than written explanation): UX-11. Redundancy (same words read and heard): UX-12. Personalization (conversational tone): UX-13.
- Screen inferiority (paper beats screen): UX-14. ICAP (interactive, constructive, active, passive engagement): UX-15. Wait time (pausing after a question): UX-16.
- Resumption lag (time to get back into a task); notification batching (notification summaries): UX-21, UX-22. Nudge (reminder): UX-23.
- Choice overload (too many options); default effect (preselected options): UX-25, UX-26. Goal gradient (speeding up near the finish); progress indicator (progress bar); gamification (points, badges, streaks): UX-27.
- Dark patterns (deceptive design): UX-28. Automation bias, over-reliance (trusting the machine too much); cognitive forcing (think first, then see the answer): UX-29.

## Contested and open

- **Measuring load.** Load types are inferred, not measured: self-ratings ([Paas 1992][paas1992]) are the main instrument, and critics argue the theory is hard to falsify as a result ([de Jong 2010][dejong2010]). Germane load was dropped as a separate kind ([Kalyuga 2011][kalyuga2011]). The split-attention evidence shows the problem: the effect holds, but load measures do not explain it ([Schroeder 2020][schroeder2020]).
- **Replication of multimedia effects.** Most principles come from short laboratory lessons, often from one programme, and some fail careful replications ([Cammeraat 2020][cammeraat2020]; [Pouw 2019][pouw2019]). Mayer's own median effects ([Mayer 2017][mayer2017]) are much larger than independent meta-analyses ([Noetel 2021][noetel2021]).
- **Modality and redundancy.** Whether spoken, written or both is best depends on segment length, pacing, pictures and prior knowledge ([Adesope 2012][adesope2012]; [Leahy 2011][leahy2011]; [Wang 2016][wang2016]); the simple "narrate, don't write" rule does not survive.
- **Prior knowledge as a moderator.** Expertise reversal predicts that design matters less for experts (UX-5), yet signaling was not moderated by prior knowledge ([Schneider 2018][schneider2018]) and segmenting helped experts more ([Rey 2019][rey2019]).
- **Choice overload.** Disputed between the original finding, the null meta-analysis and the moderator account ([Iyengar 2000][iyengar2000]; [Scheibehenne 2010][scheibehenne2010]; [Chernev 2015][chernev2015]).
- **Phones and attention.** Notifications cost attention (UX-22), but the mere-presence effect is small or absent ([Parry 2023][parry2023]; [Hartmann 2020][hartmann2020]).
- **Chat as a learning interface.** There is almost no controlled research on message length, pacing or turn structure in written tutoring chat; current evidence is logs and simulations of LLM tutors ([Sharmin 2026][sharmin2026]; [Teo 2026][teo2026]) and chatbot meta-analyses dominated by short studies ([Wu 2024][wu2024]).

## Implications for a tutor

This section alone thinks about tutoring software, an AI tutor in a chat included; the synthesis decides what the app does.

1. **Spend the Student's working memory on the content, not on the reply's form.** Cut what does not serve the current step: anecdotes, asides, decorative formatting, restated context (UX-1, UX-7). Keep each explanation and the thing it explains (formula, figure, quoted passage) together in the same message or on the same visible page (UX-3).
2. **Give one step per turn and let the Student set the pace.** Segmenting with learner pacing works (UX-9), long transient text overloads (UX-4), and longer tutor replies go with less understanding (UX-17). A reply that explains, then asks one thing, fits; a reply with three questions and a summary does not. This is the one place where the evidence is indirect, so the synthesis should treat length limits as a hypothesis to watch in Chats.
3. **Make structure visible.** Short headings, a bolded key term or a numbered sequence of steps are signals and help (UX-8); in chat they also replace the visual layout a textbook page has. Formatting used for decoration is the opposite (UX-7).
4. **Fit the amount of help to what the Student knows, and expect it to change.** Novices need parts before wholes (UX-2), integrated and signalled material (UX-3, UX-8) and worked steps (LS-15); experts are slowed by the same help (UX-5, LS-16).
5. **Write like a person talking to this Student,** with direct address and plain words (UX-13), but without turning tone into the method: the effect shrinks in long sessions.
6. **Ask, then wait, and let the Student produce.** The Student's turn is where learning happens (UX-15, LS-3, LS-6). An AI that answers its own questions in the same message removes the wait (UX-16). Unrestricted answer-giving harms later performance (UX-18), and people accept machine answers too readily (UX-29), which argues for asking for the Student's attempt before showing a solution.
7. **Design for phones and interruptions.** Mobile learning works (UX-20), but screens favour short, scannable text (UX-14), and Students on phones will be interrupted. A resumable Study session should show where the Student was and what was pending, since interruptions make people lose their place (UX-21). For notation-heavy subjects, handwriting or a photo of handwritten work is a natural input (UX-24), but its reading by the machine must be checkable by the Student.
8. **Notify rarely and predictably.** Each notification costs attention (UX-22); batched, predictable reminders beat a stream; reminders raise engagement a little and grades rarely (UX-23). A reminder is no substitute for a plan the Student believes in.
9. **Offer few, meaningful choices with a sensible default.** Defaults decide what most Students do (UX-26), so the default must be the choice the evidence supports; two to four real choices raise motivation, and long menus burden a struggling learner (UX-25). Free control over content and order adds little (UX-10).
10. **Show honest progress.** A progress display motivates when it reflects real advance and moves steadily; one that inflates early progress or stalls costs trust and persistence (UX-27). No streak guilt, fake urgency or obstruction to leave (UX-28): they work in the short run and are exactly what a learner should not have to resist.

**Conflicts with other fields.** Reducing load (UX-1, UX-7) can collide with desirable difficulties (LS-23): a smooth, easy-to-read reply may teach less than one that makes the Student retrieve and generate. The resolution in the literature is to cut extraneous load and keep the effort on the content. Short replies and asking first (items 2 and 6) conflict with the habit of explaining fully, which the human tutoring and ITS reports (TUT, ITS) address through how much and when to help. Gamification, progress and notifications (UX-22, UX-23, UX-27) are mainly motivation questions for report MOT, and over-reliance on AI answers (UX-18, UX-29) is a metacognition question for report AM and a product question for report LLM.

## Sources

Links go to the DOI where one exists. Statuses rest on the abstracts or abstract-level summaries read during the search.

**Verified** (abstract or text checked): [Adesope 2012][adesope2012], [Alpizar 2020][alpizar2020], [Altmann 2002][altmann2002], [Altmann 2014][altmann2014], [Anthony 2005][anthony2005], [Bastani 2025][bastani2025], [Buçinca 2021][bucinca2021], [Cammeraat 2020][cammeraat2020], [Chernev 2015][chernev2015], [Chi 2014][chi2014], [Damgaard 2018][damgaard2018], [Delgado 2018][delgado2018], [Fiorella 2018][fiorella2018], [Fitz 2019][fitz2019], [Ginns 2006][ginns2006], [Ginns 2013][ginns2013], [Höffler 2007][hoffler2007], [Jachimowicz 2019][jachimowicz2019], [Kalyuga 1999][kalyuga1999] (through the journal's 2011 reprint with commentary, linked), [Karich 2014][karich2014], [Kienitz 2023][kienitz2023], [Kivetz 2006][kivetz2006], [Leahy 2011][leahy2011], [Luguri 2021][luguri2021], [Mathur 2019][mathur2019], [Mayer 2017][mayer2017], [Noetel 2021][noetel2021], [Oreopoulos 2019][oreopoulos2019], [Parasuraman 1997][parasuraman1997], [Parry 2023][parry2023], [Patall 2008][patall2008], [Pouw 2019][pouw2019], [Rey 2012][rey2012], [Rey 2019][rey2019], [Richter 2016][richter2016], [Rowe 1986][rowe1986] (the under-a-second pattern only), [Sailer 2020][sailer2020], [Salmerón 2023][salmeron2023], [Sanchez 2009][sanchez2009], [Scheibehenne 2010][scheibehenne2010], [Schneider 2018][schneider2018], [Schroeder 2013][schroeder2013], [Schroeder 2018][schroeder2018], [Schroeder 2020][schroeder2020], [Sharmin 2026][sharmin2026] (preprint), [Stothart 2015][stothart2015], [Sundararajan 2020][sundararajan2020], [Sung 2016][sung2016], [Teo 2026][teo2026] (preprint), [Villar 2013][villar2013], [Wang 2016][wang2016], [Wesenberg 2026][wesenberg2026], [Wu 2024][wu2024], [Yancey 2020][yancey2020].

**Located** (exists, content not checked): [Anthony 2008][anthony2008], [Chandler 1991][chandler1991], [Clinton 2019][clinton2019], [de Jong 2010][dejong2010], [Ginns 2005][ginns2005], [Gray 2018][gray2018], [Hartmann 2020][hartmann2020], [Iyengar 2000][iyengar2000], [Johnson 2003][johnson2003], [Kalyuga 2011][kalyuga2011], [Mark 2008][mark2008], [Mayer 2002][mayer2002], [Mayer 2020][mayer2020] (book), [Miller 1968][miller1968], [Paas 1992][paas1992], [Sweller 1998][sweller1998], [Sweller 2010][sweller2010], [Sweller 2019][sweller2019], [Ward 2017][ward2017].

**From memory**: none. The effects of longer wait time in UX-16 and the exact response-time thresholds in UX-19 rest on the model's knowledge of located works.

[adesope2012]: https://doi.org/10.1037/a0026147
[alpizar2020]: https://doi.org/10.1007/s11423-020-09748-7
[altmann2002]: https://doi.org/10.1207/s15516709cog2601_2
[altmann2014]: https://doi.org/10.1037/a0030986
[anthony2005]: https://doi.org/10.1145/1056808.1056872
[anthony2008]: https://doi.org/10.1109/MMUL.2008.73
[bastani2025]: https://doi.org/10.1073/pnas.2422633122
[bucinca2021]: https://doi.org/10.1145/3449287
[cammeraat2020]: https://doi.org/10.1016/j.chb.2019.106203
[chandler1991]: https://doi.org/10.1207/s1532690xci0804_2
[chernev2015]: https://doi.org/10.1016/j.jcps.2014.08.002
[chi2014]: https://doi.org/10.1080/00461520.2014.965823
[clinton2019]: https://doi.org/10.1111/1467-9817.12269
[damgaard2018]: https://doi.org/10.2139/ssrn.3170243
[dejong2010]: https://doi.org/10.1007/s11251-009-9110-0
[delgado2018]: https://doi.org/10.1016/j.edurev.2018.09.003
[fiorella2018]: https://doi.org/10.1007/s10648-018-9444-8
[fitz2019]: https://doi.org/10.1016/j.chb.2019.07.016
[ginns2005]: https://doi.org/10.1016/j.learninstruc.2005.07.001
[ginns2006]: https://doi.org/10.1016/j.learninstruc.2006.10.001
[ginns2013]: https://doi.org/10.1007/s10648-013-9228-0
[gray2018]: https://doi.org/10.1145/3173574.3174108
[hartmann2020]: https://doi.org/10.1016/j.concog.2020.103033
[hoffler2007]: https://doi.org/10.1016/j.learninstruc.2007.09.013
[iyengar2000]: https://doi.org/10.1037/0022-3514.79.6.995
[jachimowicz2019]: https://doi.org/10.1017/bpp.2018.43
[johnson2003]: https://doi.org/10.1126/science.1091721
[kalyuga1999]: https://doi.org/10.1002/acp.1773
[kalyuga2011]: https://doi.org/10.1007/s10648-010-9150-7
[karich2014]: https://doi.org/10.3102/0034654314526064
[kienitz2023]: https://doi.org/10.1007/s11251-023-09632-w
[kivetz2006]: https://doi.org/10.1509/jmkr.43.1.39
[leahy2011]: https://doi.org/10.1002/acp.1787
[luguri2021]: https://doi.org/10.1093/jla/laaa006
[mark2008]: https://doi.org/10.1145/1357054.1357072
[mathur2019]: https://doi.org/10.1145/3359183
[mayer2002]: https://doi.org/10.1037/1076-898X.8.3.147
[mayer2017]: https://doi.org/10.1111/jcal.12197
[mayer2020]: https://doi.org/10.1017/9781316941355
[miller1968]: https://doi.org/10.1145/1476589.1476628
[noetel2021]: https://doi.org/10.3102/00346543211052329
[oreopoulos2019]: https://doi.org/10.3386/w26059
[paas1992]: https://doi.org/10.1037/0022-0663.84.4.429
[parasuraman1997]: https://doi.org/10.1518/001872097778543886
[parry2023]: https://doi.org/10.1080/15213269.2023.2286647
[patall2008]: https://doi.org/10.1037/0033-2909.134.2.270
[pouw2019]: https://doi.org/10.1037/xge0000578
[rey2012]: https://doi.org/10.1016/j.edurev.2012.05.003
[rey2019]: https://doi.org/10.1007/s10648-018-9456-4
[richter2016]: https://doi.org/10.1016/j.edurev.2015.12.003
[rowe1986]: https://doi.org/10.1177/002248718603700110
[sailer2020]: https://doi.org/10.1007/s10648-019-09498-w
[salmeron2023]: https://doi.org/10.1037/edu0000830
[sanchez2009]: https://doi.org/10.1177/0018720809352788
[scheibehenne2010]: https://doi.org/10.1086/651235
[schneider2018]: https://doi.org/10.1016/j.edurev.2017.11.001
[schroeder2013]: https://doi.org/10.2190/EC.49.1.a
[schroeder2018]: https://doi.org/10.1007/s10648-018-9435-9
[schroeder2020]: https://doi.org/10.1037/edu0000372
[sharmin2026]: https://arxiv.org/abs/2607.08952
[stothart2015]: https://doi.org/10.1037/xhp0000100
[sundararajan2020]: https://doi.org/10.1007/s10648-020-09522-4
[sung2016]: https://doi.org/10.1016/j.compedu.2015.11.008
[sweller1998]: https://doi.org/10.1023/A:1022193728205
[sweller2010]: https://doi.org/10.1007/s10648-010-9128-5
[sweller2019]: https://doi.org/10.1007/s10648-019-09465-5
[teo2026]: https://arxiv.org/abs/2607.21306
[villar2013]: https://doi.org/10.1177/0894439313497468
[wang2016]: https://doi.org/10.3724/SP.J.1042.2016.00335
[ward2017]: https://doi.org/10.1086/691462
[wesenberg2026]: https://doi.org/10.1007/s11251-026-09781-8
[wu2024]: https://doi.org/10.1111/bjet.13334
[yancey2020]: https://doi.org/10.1145/3394486.3403351
