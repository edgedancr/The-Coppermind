---
type: glossary
status: draft
aliases:
  - Sigmoid
  - Logistic Curve
  - ReLU
  - Rectified Linear Unit
courses:
  - SAIL
sources:
  - "[[SRC - But What Is a Neural Network]]"
part_of:
  - "[[Neural Network]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> **Sigmoid function:** a function, also called the logistic curve, that squishes any number into the range between 0 and 1: very negative inputs end up near 0 and positive ones near 1 ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 6]]). Early [[Neural Network|neural networks]] used it to set each neuron's activation, but in 3Blue1Brown's closing conversation Lisha Li says few modern networks do; **ReLU** (rectified linear unit), which simply takes the maximum of zero and the input, is much easier to train and works well for very deep networks ([[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 12]]).

**Used in:** [[Neural Network]]
