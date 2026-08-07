# Case Study 1: Data That Can't Leave the Building

- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [Privacy-First On-Prem RAG](/projects/privacy-rag.md)

## Problem
A client needed AI-powered access to their own internal documents and knowledge base, but would not send that data to any external service — regardless of encryption or access-control guarantees offered. That rules out essentially every standard RAG architecture, all of which assume documents get uploaded somewhere the model can reach.

## Analysis
This wasn't a modeling problem, it was a topology problem. No amount of security assurance around a hosted vector store satisfies a hard requirement that data never leaves the network. The real question was whether the reasoning could happen where the data already lives, rather than moving the data to where the reasoning happens.

## Solution & Architecture
Inverted the usual model: the reasoning agent deploys onto the client's own infrastructure instead of documents shipping out to a cloud pipeline. Built over an Agent-to-Agent (A2A) protocol, so any external system — another agent, a human-facing tool — can query it and get a useful answer without the underlying documents ever crossing the client's network boundary.

The local index pairs dense vector (semantic) search with keyword search, because embedding similarity alone degrades sharply across mixed document types: contracts, spreadsheets, scanned text, source code.

## Outcome
A repeatable pattern for "AI over data that can't move" — now the standard offering for any client with the same constraint, rather than a one-off build.
