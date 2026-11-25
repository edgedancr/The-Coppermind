Text copy of [[IBM Research - What Is Human-Centered AI (2022).pdf]], made 2026-11-24 by `Tools/source-to-text/source_to_text.py` (its own text, 1 pages). Agents read this copy instead of the original to save tokens, but cite the original, never this copy. Each `## Page N` heading is page N of the PDF: cite it as `[[IBM Research - What Is Human-Centered AI (2022).pdf#page=N]]`. OCR and conversion can drop or garble words: check a quote against the original before relying on it.

---

## Page 1

Home
↳ Blog

Date

Explainer

6 minute read

31 Mar 2022

What is human-centered AI?

Authors
Werner Geyer
Justin Weisz

As AI researchers explore different domains such as sales, finance,
and human resources, IBM Research is taking a human-centered
approach in developing AI systems.

Claudio Santos Pinhanez
Elizabeth Daly

Topics
Fairness, Accountability, Transp…
Human-Centered AI
Trustworthy AI

Share

Despite increasing levels of automation enabled by AI — whether it’s AI driving
our vehicles, designing our drugs, determining what news and information we see,
and even deciding how our money is invested — the common thread among these
systems is the human element. AI’s long-term success is contingent upon our
acknowledgement that people are critical in its design, operation, and use.
Human-Centered AI (HCAI) is an emerging discipline intent on creating AI
systems that amplify and augment rather than displace human abilities. HCAI
seeks to preserve human control in a way that ensures artificial intelligence meets
our needs while also operating transparently, delivering equitable outcomes, and
respecting privacy.
IBM Research’s HCAI strategy is to rigorously investigate and design new forms of
human-AI interactions and experiences that enhance and extend human
capabilities for the good of our products, our clients, and society at large. To do
that, we take an interdisciplinary approach that involves researchers who
specialize in human-computer interaction (HCI), computer-supported cooperative
work, data visualization, and design in the context of AI. We explore three
important themes that we consider critical for the success of AI systems.

Human-AI collaboration and co-creation
Adhering to the core value that “human + AI” is better than either one individually,
we can develop novel user experiences and visualizations that foster human-AI
collaboration. We can also create frameworks for designing or evaluating humanAI interaction models and conduct theoretical work that develops and extends
theories of human-AI collaboration or co-creation.
Data science offers an excellent example of how people and AI can work together,
to augment our ability to glean meaningful insights from data. One of the biggest
challenges for data scientists is identifying and analyzing large, disparate data
sets in ways that derive new insights that help solve complex problems. To do
that, data scientists must build models and measure their performance. Then they
optimize those models by tuning their hyper-parameters and evaluate those
models for fairness and robustness.

“ We learned that the future of data science work will be a
collaboration between humans and AI systems, in which
both automation and human expertise are
indispensable.”

Using a human-centered approach, we first sought to understand the attitudes
that data scientists had in automating their work. In doing so, we learned that the
future of data science work will be a collaboration between humans and AI
systems, in which both automation and human expertise are indispensable.1
Those insights led IBM to develop our AutoAI technology, which enables data
scientists to produce more, higher-quality machine learning models faster, with
fewer errors.2 This also includes novel visualization techniques that make it easier
for data scientists to compare pipelines and understand how they rate against
different metrics of accuracy and bias.3

Responsible and human-compatible AI
This area covers all aspects of how human-centered AI systems can provide
positive and beneficial outcomes to their direct users, to those affected by their
operation, and to society in general. To achieve these outcomes, HCAI must be
fair and unbiased, secure, applied ethically, and used in service of users’ needs.

At NeurIPS 2021, we organized the
first workshop at NeurIPS on
Human-Centered AI, exploring
research questions that stem from
the increasingly wide-spread usage

Efforts to develop responsible and human-compatible AI take several factors into
account, including the need to understand how people engage with and trust AI
systems. There’s also a need to explain the operation of AI models and improve
peoples’ understanding of how AI systems operate. An HCAI strategy must also
gauge the negative consequences or potential misuse of AI systems, include ways
to mitigate human and AI biases, and be able to measure peoples’ perceptions (or
misperceptions) of AI systems.

of ML algorithms across all areas of
society. It focused on understanding
technical and design requirements
for HCAI systems, as well as how to
evaluate the efficacy and effects of
HCAI systems. The workshop was
major step toward building a hybrid
field of AI and human-computer
interaction.

Our collaborations with the IBM’s internal business units offer real-world
examples of responsible and human-compatible AI. In one instance, IBM
Research, the Chief Analytics Office, and the Chief Information Office partnered to
create a set of assets that infuse AI into the tools of IBM Sales and our business
partner ecosystem, including the SCORE engine.
SCORE uses AI techniques to learn from sales data and operational feedback from
IBM’s sellers, business partners, and clients to recommend the optimal BP to
receive each sales lead.4, 5 Explainable recommendations that provided clear
evidence as to why a business partner is recommended were critical to the
success of this AI system engendering trust in the system. The deployment and
uptake of SCORE has led to $214M in incremental revenue since 2018 and won
several prestigious awards.

“ Explainable recommendations that provided clear
evidence as to why a business partner is recommended
were critical to the success of this AI system engendering
trust in the system.”

As we explore different domains where AI can be applied, such as sales, finance,
and human resources, our researcher often leads to a generalizable, deeper
understanding that can result in AI design guidelines for ML practitioners. For
example, our research team has been developing explainable AI (XAI) guidelines
that can be leveraged by practitioners in multiple domains and for multiple use
cases. We are also leveraging data visualization approaches to support
interpretability, understanding, and interactive explorations of AI models, such as
GLTR, a tool to help humans detect automatically generated text, and GenNI, an
interactive visual system for high-level human-AI collaboration in producing
descriptive text.

Natural language interaction
Conversational user interfaces (CUIs) powered by advanced dialogue systems
have grown in popularity, and many intelligent assistants have been developed for
business, social, and emotional purposes. Under this theme, we are aiming to
understand the kinds of tasks appropriate for this medium, the task effectiveness,
and how to design engaging and delightful interactive experiences.
In one project, our team is investigating the use of formal and informal styles of
language by customer service AI-powered agents, both in speech- and text-based
chats. Since the use of formal language is connected to gender in many languages
and cultures, we are exploring cases where the machine impersonates either
female or male agents and considering a comparison with expectations for
human-based customer service.
Our initial findings seem to indicate a direction that challenges traditional gender
stereotypes of customer service in Brazil. In a Brazilian Portuguese context, we
found a preference for human agents to use more formal language but no
preferred use of formality for machine speech-based systems, such as Siri or
Alexa. However, in the case of text-based chatbots, we saw a strong preference
for female-portraying systems using informal language and male systems using
formal language.6, 7

The next frontiers for HCAI
As the technologies we develop become more intelligent and autonomous, our
interactions with those systems will transform. To effectively support true HumanAI partnerships, one important question is how to facilitate the AI system and the
user to negotiate a common objective, where traditionally AI solutions focus on
optimizing performance or accuracy, these metrics do not encapsulate other
objectives, like personalization, fairness and the many other objectives humans
trade-off on a day to day basis when making decisions.
A second frontier for Human-Centered AI is to investigate and understand the
design of AI systems that become creative partners. In the business world,
human-AI co-creativity involves subject matter experts working with an AI system
generating code, co-designing user experiences, and accelerating scientific
discovery.

The ACM IUI Conference on
Intelligent User Interfaces is the
premiere venue for work that spans
across cutting- edge artificial
intelligence and human-computer
interaction. From March 21-25,
2022, IBM Research participants
presented recent advances related to
our Human-Centered AI research
agenda. This year, many of our
papers focused on generative AI
across various areas including code
translation, co-creative systems, UX
modernization, and explainability.

We envision the user experience of creating both physical and digital artifacts will
become a partnership in which people will take the role of specification, goal
setting, steering, high-level creativity, curation, and governance, whereas AI will
augment human abilities through inspiration, creativity, low-level detail work, and
the ability to design at scale.

Learn more about:
Human-Centered AI: We design and investigate new forms of human-AI
interactions and experiences that enhance and extend human capabilities for the
good of our products, clients, and society at large.
Future of Finance: We're working on core technology innovations, from secure and
elastic microservices-based hybrid cloud solutions and advanced analytics for
finance, to AI blockchain, and quantum computing for the banking industry.

Subscribe to our Future Forward
newsletter and stay up to date on
the latest research news

References

Release

1.

Wang, D., Weisz, J. D., Muller, M., et al. Human-AI collaboration in data
science: Exploring data scientists' perceptions of automated AI.
Proceedings of the ACM on Human-Computer Interaction. 3(CSCW), 1-24.
(2019). ↩

2.

Wang, D., Andres, J., Weisz, J., et al. AutoDS: Towards Human-Centered
Automation of Data Science. In Proceedings of the 2021 CHI Conference
on Human Factors in Computing Systems CHI '21: Proceedings of the
2021 CHI Conference on Human Factors in Computing Systems. May
2021 Article No.: 79 Pages 1–12. ↩

3.

Weidele, D. K. I., Weisz, J. D., Oduor, E., et al. (2020, March). AutoAIViz:
opening the blackbox of automated artificial intelligence with conditional
parallel coordinates. IUI '20: Proceedings of the 25th International
Conference on Intelligent User Interfaces March 2020 Pages 308–312. ↩

4.

Alkan, Ö., Mattetti, M., Barros, S., Daly, E. Exploiting Heterogeneous Data
Sources through User Feedback for a Business Partner Recommender
System. Proceedings of the Joint Proceedings of the ACM IUI 2021
Workshops co-located with the 26th ACM Conference on Intelligent User
Interfaces (ACM IUI 2021) ↩

5.

Alkan, Ö., Daly, E., Vejsbjerg, I. Opportunity Team Builder for Sales Teams.
23rd International Conference on Intelligent User Interfaces. 2018. ↩

6.

P. Cavalin, V. H. A. Ribeiro, M. Vasconcelos, C. Pinhanez, J. Nogima and H.
Ferreira, Towards a Method to Classify Language Style for Enhancing
Conversational Systems. 2021 International Joint Conference on Neural
Networks (IJCNN), 2021, pp. 1-8. ↩

7.

From Disjoint Sets to Parallel Data to Train Seq2Seq Models for Sentiment
Transfer (Cavalin et al., Findings 2020) ↩

Explainer

Subs
cribe
news to our
lette
r

Release

Research

Introducing the IBM Granite 4.1
family of models

How IBM Granite became a
leader in responsible AI

LLMs have model cards. Now,
benchmarks do, too

Lightweight tools for ‘steering’
LLMs down the right path

Mike Murphy
29 Apr 2026

Kim Martineau
13 Feb 2026

Kim Martineau
16 Dec 2025

Kim Martineau
15 Oct 2025

AI

Computer Vision

Foundation Models

AI

Generative AI

Trustworthy AI

AI

Fairness, Accountability, Transp…

Generative AI

AI

AI Transparency

Generative AI
