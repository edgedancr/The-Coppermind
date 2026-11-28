---
type: framework
status: verified
aliases:
  - ODNI AI Ethics Framework for the Intelligence Community
  - ODNI AI Ethics Principles
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - AI Ethics Framework for the Intelligence Community]]"
counters:
  - "[[Undesired Bias]]"
  - "[[Model Drift]]"
applies_to:
  - "[[United States Intelligence Community]]"
  - "[[Artificial Intelligence]]"
requires:
  - "[[Explainable AI]]"
  - "[[Human Decision Point]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-28
---
> [!summary]
> SAIL introduced the Office of the [[Director of National Intelligence]] (ODNI) AI Ethics Framework for the [[United States Intelligence Community|Intelligence Community]] by first correcting two common misconceptions about AI.[^1] SAIL also described it as the kind of multi-dimensional framework that complements the [[Three-Ps Risk Framework]].[^2] The framework itself (v1.0, June 2020) is ODNI's ethics guide for IC personnel who procure, design, build, use, or manage AI: ten principles for how AI should be used, each paired with questions to work through across the AI's lifecycle.[^3]

## Components
ODNI says AI use "must match the Intelligence Community's unique mission purposes, authorities, and responsibilities," and lists ten things AI should do.[^3] Each matches one group of questions in the rest of the document:
1. **Purpose: goals and risks.** Use AI only when it is an appropriate means to a defined purpose after weighing the risks.[^3] Ask whether a non-AI method could reach the goal with less risk, who benefits and who is at risk, and what false positive and false negative rates would cost.[^4]
2. **Legal obligations and policy.** Respect individual rights and liberties and use lawfully obtained data.[^3] Work with legal, records, classification, and civil liberties and privacy staff on the authorities that govern the data and the AI itself.[^4]
3. **Human judgment and accountability.** Build in human judgment at appropriate stages; ==the assessed risk sets where and how much a human is involved==.[^3][^5] Name an accountable human who knows they hold that role.[^5] See [[Human Decision Point]].
4. **Undesired bias and objectivity.** Identify and mitigate [[Undesired Bias|undesired bias]] as far as practicable without undermining the AI's usefulness.[^3][^5] See [[Algorithmic Bias]].
5. **Testing.** Test at a level matched to foreseeable risks, before deployment, including against adversarial attacks and security threats at every level of the stack.[^3][^6]
6. **Builds, versions, and evolutions.** Keep each iteration accountable; document data provenance and version control so auditors can tell which version produced which output.[^3][^6][^7] Watch for [[Model Drift|data drift]].[^6]
7. **Documentation.** Record what the AI is for, what it is not for, how it was designed, and its limitations.[^3][^7]
8. **Transparency: explainability and interpretability.** Use explainable methods so users, overseers, and the public understand how and why the AI produced its outputs.[^3][^7] See [[Explainable AI]].
9. **Periodic review.** Check the AI at a documented interval to confirm it still serves its purpose.[^3][^8]
10. **Stewardship and accountability.** Before deployment, make clear who maintains, monitors, updates, and decommissions the AI, and who can stop its use.[^3][^8]

## How to Use It
- ODNI calls it ==not a checklist but "a living document"== meant to give "a reasoned approach to judgment" and to help document considerations across the AI lifecycle; some concepts may not apply in every case.[^3]
- It is used alongside each agency's own procedures.[^3]
- Consumers, technologists, developers, mission personnel, risk managers, civil liberties and privacy officers, and legal counsel should use it together, and everyone involved should be trained to answer its questions.[^3]

## Misconceptions About AI
1. **"AI is just a tool."**[^1]
	- Many people imagine AI like a car or a calculator: a useful, predictable machine that does what we tell it. But a calculator cannot mimic human emotion or produce false information with total conviction.
	- AI is a tool, but a fundamentally different one. It learns patterns from enormous amounts of data and can generate ideas, arguments, essays, and emotional language without any human-like understanding.
	- The comparison to earlier inventions fails: a car builder in 1900 understood the basic form and limits of what they were building, but today's AI developers admit they do not fully understand how models reach some outputs and cannot predict all failure modes. ==AI is a system with emerging behaviors.== See [[Emergent Behavior]].
	- We no longer need to learn the machine's language to converse with it; the machine has learned ours.
2. **"AI is neutral."** AI is trained on vast amounts of human-written text, including the internet, and that text is full of human biases.[^1]

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]
[^2]: [[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]
[^3]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=1|ODNI framework, p. 1]]
[^4]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=2|ODNI framework, p. 2]]
[^5]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=3|ODNI framework, p. 3]]
[^6]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=4|ODNI framework, p. 4]]
[^7]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=5|ODNI framework, p. 5]]
[^8]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=6|ODNI framework, p. 6]]
