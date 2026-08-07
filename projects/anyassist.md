# AnyAssist — Multi-Tenant RAG Platform

- **Author / Lead:** Sahil Tomar (dev-S-t) @ TechieMaya
- **Domain:** Self-Service Document Chat, Google ADK, Multi-Tenant Vector DB Isolation, LiteLLM Gateway

## Technical Architecture
- **Agent-per-Tenant:** Built on Google ADK, providing dedicated agent logic per user session.
- **LiteLLM Gateway:** Cross-provider model routing, rate limiting, and real-time per-tenant cost attribution.
- **Namespace Vector Partitioning:** Shared vector storage partitioned via strict logical namespace boundaries to guarantee zero data leakage.
