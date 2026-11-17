Large Language Models explained briefly - 3Blue1Brown

https://youtu.be/LPZh9BOjkQs?si=xTtvswe1p2Sk2Jyq

Transcript:
Chapter 1: How chatbots work
0:011 second[Submit subtitle corrections at criblate.com] Imagine you happen across a short movie script that describes a scene between a person and their AI assistant.
0:077 secondsThe script has what the person asks the AI, but the AI's response has been torn off.
0:1313 secondsSuppose you also have this powerful magical machine that can take any text and provide a sensible prediction of what word comes next.
0:2121 secondsYou could then finish the script by feeding in what you have to the machine, seeing what it would predict to start the AI's answer, and then repeating this over and over with a growing script completing the dialogue.
0:3333 secondsWhen you interact with a chatbot, this is exactly what's happening.
Chapter 2: Large language models
0:3737 secondsA large language model is a sophisticated mathematical function that predicts what word comes next for any piece of text.
0:4444 secondsInstead of predicting one word with certainty, though, what it does is assign a probability to all possible next words.
0:5151 secondsTo build a chatbot, what you do is lay out some text that describes an interaction between a user and a hypothetical AI assistant, you add on whatever
0:5959 secondsthe user types in as the first part of the interaction, and then have the model repeatedly predict the next word that such a hypothetical AI assistant would say in response, and that's what's presented to the user.
1:131 minute, 13 secondsIn doing this, the output tends to look a lot more natural if you allow it to select less likely words along the way at random.
1:201 minute, 20 secondsSo what this means is even though the model itself is deterministic, a given prompt typically gives a different answer each time it's run.
Chapter 3: Training and parameters
1:281 minute, 28 secondsModels learn how to make these predictions by processing an enormous amount of text, typically pulled from the internet.
1:341 minute, 34 secondsFor a standard human to read the amount of text that was used to train GPT-3, for example, if they read non-stop 24-7, it would take over 2600 years.
1:441 minute, 44 secondsLarger models since then train on much, much more. You can think of training a little bit like tuning the dials on a big machine.
1:521 minute, 52 secondsThe way that a language model behaves is entirely determined by these many different continuous values, usually called parameters or weights.
2:012 minutes, 1 secondChanging those parameters will change the probabilities that the model gives for the next word on a given input.
2:072 minutes, 7 secondsWhat puts the large in large language model is how they can have hundreds of billions of these parameters.
Chapter 4: Learning through refinement
2:152 minutes, 15 secondsNo human ever deliberately sets those parameters.
2:182 minutes, 18 secondsInstead, they begin at random, meaning the model just outputs gibberish, but they're repeatedly refined based on many example pieces of text.
2:272 minutes, 27 secondsOne of these training examples could be just a handful of words, or it could be thousands, but in either case, the way this works is to
2:342 minutes, 34 secondspass in all but the last word from that example into the model and compare the prediction that it makes with the true last word from the example.
2:432 minutes, 43 secondsAn algorithm called backpropagation is used to tweak all of the parameters in such a way that it makes the model a little more likely to choose the true last word and a little less likely to choose all the others.
2:552 minutes, 55 secondsWhen you do this for many, many trillions of examples, not only does the model start to give more accurate predictions on the training data,
3:033 minutes, 3 secondsbut it also starts to make more reasonable predictions on text that it's never seen before.
3:093 minutes, 9 secondsGiven the huge number of parameters and the enormous amount of training data, the scale of computation involved in training a large language model is mind-boggling.
Chapter 5: Computational scale
3:193 minutes, 19 secondsTo illustrate, imagine that you could perform one billion additions and multiplications every single second.
3:263 minutes, 26 secondsHow long do you think it would take for you to do all of the operations involved in training the largest language models? Do you think it would take a year?
3:363 minutes, 36 secondsMaybe something like 10,000 years? The answer is actually much more than that. It's well over 100 million years.
3:453 minutes, 45 secondsThis is only part of the story, though. This whole process is called pre-training.
Chapter 6: Pre-training and RLHF
3:493 minutes, 49 secondsThe goal of auto-completing a random passage of text from the internet is very different from the goal of being a good AI assistant.
3:563 minutes, 56 secondsTo address this, chatbots undergo another type of training, just as important, called reinforcement learning with human feedback.
4:044 minutes, 4 secondsWorkers flag unhelpful or problematic predictions, and their corrections further change the model's parameters, making them more likely to give predictions that users prefer.
4:144 minutes, 14 secondsLooking back at the pre-training, though, this staggering amount of computation is only made possible by using special computer chips that are optimized for running many operations in parallel, known as GPUs.
Chapter 7: The role of GPUs
4:284 minutes, 28 secondsHowever, not all language models can be easily parallelized.
4:324 minutes, 32 secondsPrior to 2017, most language models would process text one word at a time, but then a team of researchers at Google introduced a new model known as the transformer.
Chapter 8: Transformer architecture
4:434 minutes, 43 secondsTransformers don't read text from the start to the finish, they soak it all in at once, in parallel.
4:494 minutes, 49 secondsThe very first step inside a transformer, and most other language models for that matter, is to associate each word with a long list of numbers.
4:574 minutes, 57 secondsThe reason for this is that the training process only works with continuous values, so you have to somehow encode language using numbers,
5:055 minutes, 5 secondsand each of these lists of numbers may somehow encode the meaning of the corresponding word.
5:105 minutes, 10 secondsWhat makes transformers unique is their reliance on a special operation known as attention.
5:165 minutes, 16 secondsThis operation gives all of these lists of numbers a chance to talk to one another and refine the meanings they encode based on the context around, all done in parallel.
5:275 minutes, 27 secondsFor example, the numbers encoding the word bank might be changed based on the context surrounding it to somehow encode the more specific notion of a riverbank.
5:375 minutes, 37 secondsTransformers typically also include a second type of operation known as a feed-forward neural network, and this gives the model extra capacity to store more patterns about language learned during training.
Chapter 9: Attention mechanism
5:495 minutes, 49 secondsAll of this data repeatedly flows through many different iterations of these two fundamental operations, and as it does so,
5:565 minutes, 56 secondsthe hope is that each list of numbers is enriched to encode whatever information might be needed to make an accurate prediction of what word follows in the passage.
6:076 minutes, 7 secondsAt the end, one final function is performed on the last vector in this sequence, which now has had a chance to be influenced by all the other context from the input text,
6:166 minutes, 16 secondsas well as everything the model learned during training, to produce a prediction of the next word.
6:226 minutes, 22 secondsAgain, the model's prediction looks like a probability for every possible next word.
Chapter 10: Emergent behavior
6:286 minutes, 28 secondsAlthough researchers design the framework for how each of these steps work, it's important to understand that the specific behavior is an emergent phenomenon based on how those hundreds of billions of parameters are tuned during training.
6:426 minutes, 42 secondsThis makes it incredibly challenging to determine why the model makes the exact predictions that it does.
6:486 minutes, 48 secondsWhat you can see is that when you use large language model predictions to autocomplete a prompt, the words that it generates are uncannily fluent, fascinating, and even useful.
Chapter 11: Further learning resources
7:057 minutes, 5 secondsIf you're a new viewer and you're curious about more details on how transformers and attention work, boy do I have some material for you.
7:127 minutes, 12 secondsOne option is to jump into a series I made about deep learning, where we visualize and motivate the details of attention and all the other steps in a transformer.
7:227 minutes, 22 secondsAlso, on my second channel I just posted a talk I gave a couple months ago about this topic for the company TNG in Munich.
7:297 minutes, 29 secondsSometimes I actually prefer the content I make as a casual talk rather than a produced video, but I leave it up to you which one of these feels like the better follow-on.

