---
type: concept
status: draft
aliases:
  - Neural Networks
  - Neural Net
  - Artificial Neural Network
courses:
  - SAIL
sources:
  - "[[SRC - But What Is a Neural Network]]"
  - "[[SRC - AI, Machine Learning, Deep Learning, and Generative AI Explained]]"
part_of:
  - "[[Deep Learning]]"
related:
  - "[[Parameter]]"
  - "[[Hidden Layer]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> A neural network is a layered mathematical structure that turns an input, such as the pixels of an image, into an output, such as which digit the image shows. 3Blue1Brown builds one to recognize handwritten digits and concludes that ==the entire network is "just a function"==, one that takes in 784 numbers and returns 10 ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 10]]). IBM's explainer describes neural networks as a way to simulate how the human brain works, "at least to the extent that we understand" it, and the basis of [[Deep Learning|deep learning]] ([[IBM Technology - AI, Machine Learning, Deep Learning, and Generative AI Explained (transcript)|IBM Technology video, ch. 4]]).

## Key Points
**Structure** (3Blue1Brown's digit example)
- A **neuron** is "a thing that holds a number" between 0 and 1, called its **activation** ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 3]]).
- The input layer has 784 neurons, one for each pixel of a 28×28 image, holding its grayscale value ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 3]]). The output layer has 10 neurons, one per digit; the brightest is the network's answer ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 4]]).
- Between them are [[Hidden Layer|hidden layers]], here two of 16 neurons each, an arbitrary choice ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 4]]).
- The activations in one layer determine those in the next, loosely like groups of biological neurons firing and causing others to fire ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 4]]).

**Why layers?** ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 5]])
- The hope is that each layer handles a level of abstraction: little edges, then loops and lines, then digits. Speech parsing breaks down the same way: sounds, syllables, words, phrases.
- Whether a trained network actually does this is a separate question.

**How one layer drives the next** ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 6–7]])
- Each connection has a **weight**; a neuron takes the weighted sum of the previous layer's activations, adds a **bias**, and passes the result through the [[Sigmoid Function|sigmoid function]] to land between 0 and 1. See [[Parameter]].
- This network has almost exactly 13,000 weights and biases, "knobs and dials" that change its behavior.
- In compact form, each layer-to-layer step is a matrix-vector product, which libraries compute very fast ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 9]]).

**Learning** ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 8]])
- "Learning" means getting the computer to find a setting for all those weights and biases that solves the problem.
- 3Blue1Brown argues that knowing what the weights and biases mean is better than treating the network as a total black box, because it gives you a starting point when the network misbehaves.

## Why It Matters
- IBM calls a network "deep" when it has multiple layers, and notes that with so many layers it can be hard to work out why the network gives the results it does ([[IBM Technology - AI, Machine Learning, Deep Learning, and Generative AI Explained (transcript)|IBM Technology video, ch. 4]]). See [[Algorithmic Transparency]].
- Large language models are built from the same pieces at vastly larger scale; see [[Large Language Model]].
