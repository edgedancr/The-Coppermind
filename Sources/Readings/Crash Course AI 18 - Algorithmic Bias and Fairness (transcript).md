Algorithmic Bias and Fairness: Crash Course AI #18
https://www.youtube.com/watch?v=gV0_raKR2UQ

Transcript:

Hi, I’m Jabril and welcome back to CrashCourse AI.
0:033 secondsAlgorithms are just math and code, but algorithms are created by people and use our data, so biases that exist in the real world are mimicked or even exaggerated by AI systems.
0:1414 secondsThis idea is called algorithmic bias. Bias isn’t inherently a terrible thing. Our brains try to take shortcuts by finding patterns in data.
0:2323 secondsSo if you’ve only seen small, tiny dogs, you might see a Great Dane and be like “Whoa that dog is unnatural”
0:3030 secondsThis doesn’t become a problem unless we don’t acknowledge exceptions to patterns or unless we start treating certain groups of people unfairly.
0:3737 secondsAs a society, we have laws to prevent discrimination based on certain “protected classes” (like gender, race, or age) for things like employment or housing.
0:4646 secondsSo it’s important to be aware of the difference between bias, which we all have, and discrimination, which we can prevent.
0:5252 secondsAnd knowing about algorithmic bias can help us steer clear of a future where AI are used in harmful, discriminatory ways.
0:5959 secondsINTRO There are at least 5 types of algorithmic bias we should pay attention to.
Chapter 2: Data reflecting social bias
1:121 minute, 12 secondsFirst, training data can reflect hidden biases in society.
1:151 minute, 15 secondsFor example, if an AI was trained on recent news articles or books, the word “nurse” is more likely to refer to a “woman,” while the word “programmer” is more likely
1:231 minute, 23 secondsto refer to a “man.” And you can see this happening with a Google image search: “nurse” shows mostly women, while “programmer” mostly shows mostly men.
1:321 minute, 32 secondsWe can see how hidden biases in the data gets embedded in search engine AI.
1:361 minute, 36 secondsOf course, we know there are male nurses and female programmers and non-binary people doing both of these jobs!
1:421 minute, 42 secondsFor example, an image search for “programmer 1960” shows a LOT more women.
1:471 minute, 47 secondsBut AI algorithms aren’t very good at recognizing cultural biases that might change over time, and they could even be spreading hidden biases to more human brains.
1:551 minute, 55 secondst’s also tempting to think that if we just don’t collect or use training data that categorizes protected classes like race or gender, then our algorithms can’t possibly discriminate.
2:042 minutes, 4 secondsBut, protected classes may emerge as correlated features, which are features that aren’t explicitly in data but may be unintentionally correlated to a specific prediction.
2:142 minutes, 14 secondsFor example, because many places in the US are still extremely segregated, zip code can be strongly correlated to race.
2:202 minutes, 20 secondsA record of purchases can be strongly correlated to gender.
2:242 minutes, 24 secondsAnd a controversial 2017 paper showed that sexual orientation is strongly correlated with characteristics of a social media profile photo.
2:322 minutes, 32 secondsSecond, the training data may not have enough examples of each class, which can affect the accuracy of predictions.
Chapter 3: Insufficient data examples
2:382 minutes, 38 secondsFor example, many facial recognition AI algorithms are trained on data that includes way more examples of white peoples’ faces than other races.
2:462 minutes, 46 secondsOne story that made the news a few years ago is a passport photo checker with an AI system to warn if the person in the photo had blinked.
2:542 minutes, 54 secondsBut the system had a lot of trouble with photos of people of Asian descent.
2:582 minutes, 58 secondsBeing asked to take a photo again and again would be really frustrating if you’re just trying to renew your passport, which is already sort of a pain!
3:053 minutes, 5 secondsOr, let’s say, you got a cool gig programming a drone for IBM… but it has trouble recognizing your face because your skin’s too dark… for example.
Chapter 4: Quantifying complex features
3:153 minutes, 15 secondsThird, it’s hard to quantify certain features in training data. There are lots of things that are tough to describe with numbers.
3:223 minutes, 22 secondsLike can you really rate a sibling relationship with a number? It’s complicated!
3:263 minutes, 26 secondsYou love them, but you hate how messy they are, but you like cooking together, but you hate how your parents compare you... It’s so hard to quantify all that!
3:353 minutes, 35 secondsIn many cases, we try to build AI to evaluate complicated qualities of data, but sometimes we have to settle for easily measurable shortcuts.
3:433 minutes, 43 secondsOne recent example is trying to use AI to grade writing on standardized tests like SATs and GREs with the goal to save human graders time.
3:513 minutes, 51 secondsGood writing involves complex elements like clarity, structure, and creativity, but most of these qualities are hard to measure.
3:583 minutes, 58 secondsSo, instead, these AI focused on easier-to-measure elements like sentence length, vocabulary, and grammar, which don’t fully represent good writing… and made these AIs easier to fool.
4:094 minutes, 9 secondsSome students from MIT built a natural language program to create essays that made NO sense, but were rated highly by these grading algorithms.
4:164 minutes, 16 secondsThese AIs could also potentially be fooled by memorizing portions of “template” essays to influence the score, rather than actually writing a response to the prompt, all because of the training data that was used for these scoring AI.
Chapter 5: AI feedback loops
4:284 minutes, 28 secondsFourth, the algorithm could influence the data that it gets, creating a positive feedback loop.
4:334 minutes, 33 secondsA positive feedback loop basically means “amplifying what happened in the past”… whether or not this amplification is good.
4:394 minutes, 39 secondsAn example is PredPol’s drug crime prediction algorithm, which has been in use since 2012 in many large cities including LA and Chicago.
4:474 minutes, 47 secondsPredPol was trained on data that was heavily biased by past housing segregation and past cases of police bias.
4:534 minutes, 53 secondsSo, it would more frequently send police to certain neighborhoods where a lot of racial minority folks lived.
4:594 minutes, 59 secondsArrests in those neighborhoods increased, that arrest data was fed back into the algorithm, and the AI would predict more future drug arrests in those neighborhoods and send the police there again.
5:085 minutes, 8 secondsEven though there might be crime in neighborhoods where police weren’t being sent by this AI, because there weren't any arrests in those neighborhoods, data about them wasn’t fed back into the algorithm.
5:185 minutes, 18 secondsWhile algorithms like PredPol are still in use, to try and manage these feedback effects, there is currently more effort to monitor and adjust how they process data.
5:275 minutes, 27 secondsSo basically, this would be like a new principal who was hired to improve the average grades of a school, but he doesn’t really care about the students who already have good grades.
5:365 minutes, 36 secondsHe creates a watchlist of students who have really bad grades and checks up on them every week, and he ignores the students who keep up with good grades.
5:445 minutes, 44 secondsIf any of the students on his watchlist don’t do their homework that week, they get punished.
5:505 minutes, 50 secondsBut all of the students NOT on his watchlist can slack on their homework, and get away with it based on “what happened in the past.”
5:575 minutes, 57 secondsThis is essentially what’s happening with PredPol, and you can be the judge if you believe it’s fair or not. Finally, a group of people may mess with training data on purpose.
Chapter 6: Intentional data manipulation
6:066 minutes, 6 secondsFor example, in 2014, Microsoft released a chatbot named Xiaoice in China.
6:116 minutes, 11 secondsPeople could chat with Xiaoice so it would learn how to speak naturally on a variety of topics from these conversations. It worked great, and Xiaoice had over 40 million conversations with no incidents.
6:216 minutes, 21 secondsIn 2016, Microsoft tried the same thing in the U.S. by releasing the Twitterbot Tay.
6:266 minutes, 26 secondsTay trained on direct conversation threads on Twitter, and by playing games with users where they could get it to repeat what they were saying.
6:336 minutes, 33 secondsIn 12 hours after its release, after a “coordinated attack by a subset of people” who biased its data set, Tay started posting violent, sexist, anti-semitic, and racist Tweets.
6:436 minutes, 43 secondsThis kind of manipulation is usually framed as “joking” or “trolling,” but the fact that AI can be manipulated means we should take algorithmic predictions with a grain of salt.
Chapter 7: Hiring algorithm example
6:526 minutes, 52 secondsThis is why I don’t leave John-Green-Bot alone online…
6:556 minutes, 55 secondsThe common theme of algorithmic bias is that AI systems are trying to make good predictions, but they make mistakes.
7:027 minutes, 2 secondsSome of these mistakes may be harmless or mildly inconvenient, but others may have significant consequences.
7:087 minutes, 8 secondsTo understand the key limitations of AI in our current society, let’s go to the Thought Bubble.
7:137 minutes, 13 secondsLet’s say there’s an AI system called HireMe! that gives hiring recommendations to companies.
7:187 minutes, 18 secondsHireMe is being used by Robots Weekly, a magazine where John-Green-bot applied for an editorial job.
7:247 minutes, 24 secondsJust by chance, the last two people named “John” got fired from Robots Weekly and another three “Johns” didn’t make it through the hiring process.
7:317 minutes, 31 secondsSo, when John-Green-Bot applies for the job, HireMe! predicts that he’s only 24% likely to be employed by the company in 3 years.
7:397 minutes, 39 secondsSeeing this prediction, the hiring manager at Robots Weekly rejects John-Green-bot, and this data gets added to the HireMe! AI system.
7:477 minutes, 47 secondsJohn-Green-Bot is just another “John” that got rejected, even though he may have been the perfect robot for the job! Now, future “Johns” have an even lower chance to be hired.
7:567 minutes, 56 secondsIt’s a positive feedback loop, with some pretty negative consequences for John-Green-Bot.
8:018 minutes, 1 secondOf course, being named “John” isn’t a protected class, but this could apply to other groups of people. Plus, even though algorithms like HireMe!
8:098 minutes, 9 secondsAre great at establishing a link between two kinds of data, they can’t always clarify why they’re making predictions.
8:168 minutes, 16 secondsFor example, HireMe! may find that higher age is associated with lower knowledge of digital technologies, so the AI suggests hiring younger applicants.
8:258 minutes, 25 secondsNot only is this illegally discriminating against the protected class of “age,” but the implied link also might not be true.
8:328 minutes, 32 secondsJohn-Green-bot may be almost 40, but he runs a robot blog and is active in online communities like Nerdfighteria!
8:398 minutes, 39 secondsSo it’s up to humans interacting with AI systems like HireMe! to pay attention to recommendations and make sure they’re fair, or adjust the algorithms if not.
8:488 minutes, 48 secondsThanks, Thought Bubble! Monitoring AI for bias and discrimination sounds like a huge responsibility, so how can we do it?
Chapter 8: Solutions for fair AI
8:568 minutes, 56 secondsThe first step is just understanding that algorithms will be biased.
9:009 minutesIt’s important to be critical about AI recommendations, instead of just accepting that “the computer said so.”
9:069 minutes, 6 secondsThis is why transparency in algorithms is so important, which is the ability to examine inputs and outputs to understand why an algorithm is giving certain recommendations.
9:159 minutes, 15 secondsBut that's easier said than done when it comes to certain algorithms, like deep learning methods. Hidden layers can be tricky to interpret.
9:239 minutes, 23 secondsSecond, if we want to have less biased algorithms, we may need more training data on protected classes like race, gender, or age.
9:309 minutes, 30 secondsLooking at an algorithm’s recommendations for protected classes may be a good way to check it for discrimination. This is kind of a double-edged sword, though.
9:399 minutes, 39 secondsPeople who are part of protected classes may (understandably) be worried about handing over personal information.
9:449 minutes, 44 secondsIt may feel like a violation of privacy, or they might worry that algorithms will be misused to target rather than protect them.
9:529 minutes, 52 secondsEven if you aren’t actively working on AI systems, knowing about these algorithms and staying informed about artificial intelligence are really important as we shape the future of this field.
10:0210 minutes, 2 secondsAnyone, including you, can advocate for more careful, critical interpretation of algorithmic outputs to help protect human rights.
10:0910 minutes, 9 secondsSome people are even advocating that algorithms should be clinically tested and scrutinized in the same way that medicines are.
10:1510 minutes, 15 secondsAccording to these opinions, we should know if there are “side effects” before integrating AI in our daily lives. There’s nothing like that in the works yet.
10:2410 minutes, 24 secondsBut it took over 2400 years for the Hippocratic Oath to transform into current medical ethics guidelines.
10:3010 minutes, 30 secondsSo it may take some time for us to come up with the right set of practices.
10:3410 minutes, 34 secondsNext time, we have a lab and I’ll demonstrate how there are biases in even simple things like trying to adopt a cat or a dog. I’ll see ya then.
10:4210 minutes, 42 secondsSpeaking of understanding how bias and misinformation spread, you should check out this video on Deep Fakes I did with Above the Noise -- another PBSDS channel that gets into the research behind controversial issues.
10:5310 minutes, 53 secondsHead over to the video in the description to find out how detect deep fakes. Tell them Jabril sent you! Crash Course AI is produced in association with PBS Digital Studios!
11:0311 minutes, 3 secondsIf you want to help keep all Crash Course free for everybody, forever, you can join our community on Patreon.
11:0811 minutes, 8 secondsAnd if you want to learn more about prejudice and discrimination in humans, you can check out this episode of Crash Course Sociology.