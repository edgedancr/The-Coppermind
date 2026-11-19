---
type: summary
status: draft
courses:
  - SAIL
sources:
  - "[[SRC - But What Is a Neural Network]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
## Executive Summary
3Blue1Brown's first deep-learning video sets out to show what a [[Neural Network|neural network]] is "not as a buzzword but as a piece of math," using the classic task of recognizing handwritten digits.[^1] It builds a network of 784 input neurons, two [[Hidden Layer|hidden layers]] of 16, and 10 outputs, in which the activations of one layer determine the next.[^2] It explains the hope that layers break recognition into pieces, from edges to loops to digits,[^3] and the [[Parameter|weights and biases]] and [[Sigmoid Function|sigmoid function]] that make that possible.[^4] Its conclusion: the whole network is "just a function," one with about 13,000 parameters.[^5]

## Main Points
- A neuron is "a thing that holds a number" between 0 and 1.[^6]
- "Learning" means finding a setting for all the weights and biases that solves the problem.[^7]
- Layer-to-layer transitions are matrix-vector products, which is why linear algebra matters so much in machine learning.[^8]
- In a closing conversation, Lisha Li notes that few modern networks use sigmoid; ReLU is easier to train.[^9]

## Themes
- Demystifying "neural networks" by showing the math.
- Layers of abstraction.

## Key Takeaways
- Explicit: understanding what weights and biases mean gives you a starting point when a network doesn't behave as expected, instead of treating it as a black box.[^7]
- [inferred] The structure is simple even though the resulting function is enormously complicated.

## Footnotes
[^1]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 2]]
[^2]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 3–4]]
[^3]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 5]]
[^4]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 6]]
[^5]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 10]]
[^6]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 3]]
[^7]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 8]]
[^8]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 9]]
[^9]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 12]]
