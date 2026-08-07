# Case Study 2: Multi-Tenant AI Without Cross-Contamination

- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [AnyAssist Multi-Tenant RAG](/projects/anyassist.md)

## Problem
Many businesses want the same fundamental thing: a support agent that knows their content and can talk to their customers. Building dedicated infrastructure per business doesn't scale. Naive shared infrastructure risks one tenant's data or conversational context surfacing in another's session.

## Analysis
The RAG pipeline itself is well-understood and wasn't the hard part. The hard part was making it safely multi-tenant: strict isolation, per-client cost visibility (the business model breaks the moment one tenant sends 100× the traffic of another and nobody can see it), and avoiding hard-locking every client to a single model vendor.

## Solution & Architecture
An agent-per-tenant model on Google's Agent Development Kit (ADK), with logical namespace isolation in the vector store so tenants never share an index.

A LiteLLM gateway sits between the agents and the underlying models, handling cross-provider routing, rate limiting, and per-tenant cost attribution — which makes moving a client between model providers a configuration change rather than a rebuild.

## Outcome
One backend serving multiple distinct clients securely, with per-tenant cost visibility designed in from the start instead of retrofitted once billing became a problem.
