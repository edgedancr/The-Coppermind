---
type: case-study
status: draft
aliases:
  - PredPol Drug Crime Prediction Algorithm
courses:
  - SAIL
sources:
  - "[[SRC - Algorithmic Bias and Fairness (Crash Course AI 18)]]"
year: 2012
example_of:
  - "[[Positive Feedback Loop]]"
  - "[[Algorithmic Bias]]"
related:
  - "[[Intelligence-Led Policing]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> PredPol is a drug-crime prediction algorithm that, according to Crash Course AI, has been in use since 2012 in many large cities, including Los Angeles and Chicago ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]). Crash Course uses it to show ==how an algorithm can create a positive feedback loop that amplifies past bias== ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).

## What Happened
- PredPol was trained on data heavily biased by past housing segregation and past cases of police bias ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).
- It sent police more often to neighborhoods where many racial minorities lived. Arrests there rose, the arrest data was fed back into the algorithm, and it predicted more drug arrests there and sent police back again ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).
- Neighborhoods where police weren't sent produced no arrests, so no data about crime there reached the algorithm, even though crime might have existed there ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).

## What Went Wrong
- The algorithm's own outputs shaped the data it learned from, "amplifying what happened in the past" whether or not that was good ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]). See [[Positive Feedback Loop]].
- Crash Course's analogy: a new principal hired to raise a school's average grades keeps a watchlist of students with bad grades and punishes them for missed homework, while students not on the list can slack off and get away with it ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).

## Lessons
- Crash Course reports that algorithms like PredPol are still in use, with more effort now to monitor and adjust how they process data, and leaves it to the viewer to judge whether this is fair ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).
- See [[Algorithmic Bias]]. For intelligence in police work, compare [[Intelligence-Led Policing]].
