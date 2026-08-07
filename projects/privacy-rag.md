# Privacy-First On-Prem RAG (A2A Protocol)

- **Author / Lead:** Sahil Tomar (dev-S-t) @ TechieMaya
- **Domain:** Inverted RAG Topology, Agent-to-Agent (A2A) Protocol, On-Premise Legal/Compliance Search

## Technical Architecture
- **Inverted RAG Topology:** Reasoning agents deploy locally onto the client's internal network; raw documents never leave the building.
- **A2A Protocol Interface:** External tools query local agent endpoints over A2A protocol while preserving zero third-party data egress.
- **Hybrid Search Index:** Pairs dense vector (semantic) search with keyword indexing across mixed document types (contracts, code, spreadsheets).
