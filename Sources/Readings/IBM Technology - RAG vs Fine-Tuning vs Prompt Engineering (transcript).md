RAG vs Fine-Tuning vs Prompt Engineering: Optimizing AI Models - IBM Technology

https://www.youtube.com/watch?v=zYGDpG-pTho

Transcript:

Chapter 1: Improving model responses
0:000 secondsRemember how back in the day people would Google themselves, you type your name into a search engine and you see what it knows about you?
0:088 secondsWell, the modern equivalent of that is to do the same thing with a chatbot. So when I ask a large language model, who is Martin Keen?
0:1818 secondsWell, the response varies greatly depending upon which model I'm asking, because different models, they have different training data sets, they have a different knowledge cutoff dates.
0:2828 secondsSo what a given model knows about me, well, it differs greatly. But how could we improve the model's answer?
0:3636 secondsWell, there's three ways. So let's start with a model here, and we're gonna see how we can improve its responses.
0:4444 secondsWell, the first thing it could do is it could go out and it could perform a search, a search for new data that either wasn't in its training data set,
0:5454 secondsor it was just data that became available after the model finished training, and then it could incorporate those results from the search back into its answer.
1:031 minute, 3 secondsThat is called RAG or Retrieval Augmented Generation. That's one method.
1:121 minute, 12 secondsOr we could pick a specialized model, a model that's been trained on, let's say, transcripts of these videos.
1:211 minute, 21 secondsThat would be an example of something called fine tuning, or we could ask the model a query that better specifies what we're looking for.
1:361 minute, 36 secondsSo maybe the LLM already knows plenty about the Martin Keens of the world, but let's tell the model that we're referring to the Martin keen who works at IBM, rather than the Martin Keen that founded Keen Shoes.
1:501 minute, 50 secondsThat is an example of prompt engineering.
1:551 minute, 55 secondsThree ways to get better outputs out of large language models, each with their pluses and minuses. Let's start with RAG.
2:052 minutes, 5 secondsSo let's break it down. First there's retrieval. So retrieval of external up-to-date information. Then there's augmentation.
2:142 minutes, 14 secondsThat's augmentation of the original prompt with the retrieved information added in. And then finally there's generation.
2:222 minutes, 22 secondsThat's generation of a response based on all of this enriched context. So we can think of it like this.
2:302 minutes, 30 secondsSo we start with a query and the query comes in to a large language model.
2:402 minutes, 40 secondsNow, what RAG is gonna do is it's first going to go searching through a corpus of information.
2:482 minutes, 48 secondsSo we have this corpus here full of some sort of data. Now, perhaps, that's your organization's documents.
2:562 minutes, 56 secondsSo it might be spreadsheets, PDFs, internal wikis, you know, stuff like that, But unlike a typical search engine that just matches keywords,
3:073 minutes, 7 secondsRAG converts both your question, the query, and all of the documents into something called vector embeddings.
3:183 minutes, 18 secondsSo these are all converted into vectors. essentially turning words and phrases into long lists of numbers that capture their meaning.
3:273 minutes, 27 secondsSo when you ask a query like, what was our company's revenue growth last quarter?
3:343 minutes, 34 secondsWell, RAG will find documents that are mathematically similar in meaning to your question, even if they don't use the exact same words.
3:413 minutes, 41 secondsSo it might find documents mentioning fourth quarter performance or quarterly sales.
3:483 minutes, 48 secondsThose don't contain the keyword revenue growth, but they are semantically similar.
3:543 minutes, 54 secondsNow, once RAG finds the relevant information, it adds this information back into your original query before passing it to the language model.
4:064 minutes, 6 secondsSo instead of the model just kind of guessing based on its training data, it can now generate a response that incorporates your actual facts and figures.
4:154 minutes, 15 secondsSo this makes RAG particularly valuable when you are looking for information that is up to date,
4:244 minutes, 24 secondsand it's also very valuable when you need in to add in information that is domain specific as well, but there are some costs to this.
4:384 minutes, 38 secondsLet's go with the red pen. So one cost, that would be the cost of performance.
4:454 minutes, 45 secondsfor performing all of this, because you have this retrieval step here, and that adds latency to each query compared to a simple prompt to a model.
4:554 minutes, 55 secondsThere are also costs related to just kind of the processing of this as well.
5:015 minutes, 1 secondSo if we think about what we're having to do here, we've got documents that need to be vector embeddings, and we need to store these vector embedding in a database.
5:115 minutes, 11 secondsAll of this adds to processing costs, it adds to infrastructure costs to make this solution work. All right, next up, fine tuning.
Chapter 2: Fine-tuning explained
5:205 minutes, 20 secondsSo remember how we discussed getting better answers about me by training a model specifically on, let's say, my video transcripts.
5:265 minutes, 26 secondsWell, that is fine tuning in action.
5:305 minutes, 30 secondsSo what we do with fine tuning is we take a model, but specifically an existing model.
5:405 minutes, 40 secondsand that existing model has broad knowledge. And then we're gonna give it additional specialized training on a focused data set.
5:515 minutes, 51 secondsSo this is now specialized to what we want to develop particular expertise on.
5:585 minutes, 58 secondsNow, during fine tuning, we're updating the model's internal parameters through additional training.
6:056 minutes, 5 secondsSo the model starts out with some weights here. like this, and those weights were optimized during its initial pre-training.
6:166 minutes, 16 secondsAnd as we fine tune, we're making small adjustments here to the model's weights using this specialized data set.
6:266 minutes, 26 secondsSo this is being incorporated. Now this process typically uses supervised learning where we provide input-output pairs that demonstrate the kind of responses we want.
6:376 minutes, 37 secondsSo for example, if we're fine-tuning for technical support, we might provide thousands of examples of customer queries, and those would be paired with correct technical responses.
6:506 minutes, 50 secondsThe model adjusts its weights through back propagation to minimize the difference between its predicted outputs and the targeted responses.
6:586 minutes, 58 secondsSo we're not just teaching the model new facts here, we're actually modifying how it processes information.
7:067 minutes, 6 secondsThe model is learning to recognize domain-specific patterns.
7:117 minutes, 11 secondsSo, fine-tuning shows its strength when you particularly need a model that has very deep domain expertise.
7:227 minutes, 22 secondsThat's what we can really add in with fine tuning, and also, it's much faster, specifically at inference time.
7:317 minutes, 31 secondsSo when we are putting the queries in, it's faster than RAG because it doesn't need to search through external data,
7:387 minutes, 38 secondsand because the knowledge is kind of baked into the model's weights, you don't need to maintain a separate vector database, but there's some downsides as well.
7:467 minutes, 46 secondsWell, there's certainly issues here with the training complexity of all of this.
7:547 minutes, 54 secondsYou're going to need thousands of high quality training examples. There are also issues with computational cost.
8:058 minutes, 5 secondsThe computational cost for training this model can be substantial and is going to require a whole bunch of GPUs.
8:128 minutes, 12 secondsAnd there's also challenges related to maintenance as well because unlike RAG where you can easily add new documents to your knowledge base at any point.
8:228 minutes, 22 secondsUpdating a fine-tune model requires another round of training and then perhaps most importantly of all there is a risk of something called catastrophic forgetting.
8:378 minutes, 37 secondsNow that's when the model loses some of its general capabilities while it's busy learning these specialized ones.
8:448 minutes, 44 secondsSo finally let's explore prompt engineering.
Chapter 3: Prompt engineering
8:488 minutes, 48 secondsNow specifying Martin Keen who works at IBM versus Martin Keene who founded Keene Shoes, that's prompt engineering, but at its most basic.
8:578 minutes, 57 secondsPrompt engineering goes far beyond simple clarification.
9:019 minutes, 1 secondSo let's think about when we input a prompt, the model receives this prompt and it processes it through a series of layers,
9:169 minutes, 16 secondsand these layers are essentially tension mechanisms and each one focuses on different aspects of your prompt text that came in.
9:259 minutes, 25 secondsAnd by including specific elements in your prompt, so examples or context or how you want the format to look, you're directing the model's attention to relevant patterns it learned during training.
9:389 minutes, 38 secondsSo for example, telling a model to think about this step-by-step, that activates patterns it learnt from training data where methodical reasoning led to accurate results.
9:499 minutes, 49 secondsSo a well-engineered prompt can transform a model's output without any additional training or without data retrieval.
9:599 minutes, 59 secondsSo take an example of a prompt. Let's say we say, is this code secure? Not a very good prompt.
10:0810 minutes, 8 secondsAn engineered prompt, it might read a bit more like this. It's much more detailed. Now.
10:1410 minutes, 14 secondsWe haven't changed the model, we haven't added new data, we've just better activated its existing capabilities.
10:2310 minutes, 23 secondsNow I think the benefits to this are pretty obvious.
10:2610 minutes, 26 secondsOne is that we don't need to change any of our back-end infrastructure here because there are no infrastructure changes at all in order to prompt better, it's all on the user.
10:3910 minutes, 39 secondsThere's also the benefit that by doing this, You get to see immediate responses and immediate results to what you do.
10:5010 minutes, 50 secondsWe don't have to add in new training data or any kind of data processing, but of course there are some limitations to this as well.
10:5810 minutes, 58 secondsPrompt engineering is as much an art as it is a science.
11:0111 minutes, 1 secondSo there is certainly a good amount of trial and error in this sort of process to find effective prompts,
11:1011 minutes, 10 secondsand you're also limited in what you can do here, you're limited to existing knowledge because you're not able to actually add anything else in here.
11:2311 minutes, 23 secondsNo additional amount of prompt engineering is going to teach it truly new information. You're not going to the model anything that's outdated in the model.
11:3311 minutes, 33 secondsSo we've talked about now RAG as being one option and we talked about fine tuning as being another one.
Chapter 4: Combining strategies
11:4411 minutes, 44 secondsAnd now, just now, we've talked about prompt engineering as well
11:5111 minutes, 51 secondsand I've really talked about those as three different distinct things here, but they're commonly used actually in combination.
12:0212 minutes, 2 secondsWe might use all three together. So consider a legal AI system. RAG, that could retrieve specific cases and recent court decisions.
12:1212 minutes, 12 secondsThe prompt engineering part, that could make sure that we follow proper legal document formats by asking for it.
12:1912 minutes, 19 secondsAnd then fine-tuning, that can help the model master firm-specific policies. I mean, basically, we can think of it like this.
12:2712 minutes, 27 secondsWe can think that prompt engineering offers flexibility and immediate results, but it can't extend knowledge.
12:3412 minutes, 34 secondsRAG, that can extend knowledge, it provides up-to-date information, but with computational overhead.
12:3912 minutes, 39 secondsand then fine-tuning, that enables deep domain expertise, but it requires significant resources and maintenance.
12:4712 minutes, 47 secondsBasically, it comes down to picking the methods that work for you. You know, we've, we sure come a long way from vanity searching on Google.

