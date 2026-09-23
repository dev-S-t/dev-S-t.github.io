# VOAG — Enterprise Voice AI SaaS

- **Author / Lead:** Sahil Tomar (dev-S-t) @ TechieMaya
- **Key Metrics:** 1,000+ daily calls in Mr. LADs app, sub-300ms p95 latency
- **Client Vertical Tuning:** Higher-education follow-up, real estate cold calling, Dubai travel agency B2B outreach

## Production Architecture
- **Dual Infrastructure:** DigitalOcean self-hosted LiveKit (India) + UAE local LAN SIP gateway (SIM card ➡️ modem ➡️ SIP gateway ➡️ LiveKit on LAN behind NAT).
- **Worker Scaling:** Regional low-latency workers + 3 bulk GCP Cloud Run workers. LiveKit agents expect always-on connections, yet run on scale-to-zero Cloud Run through a keep-alive, hold, and polling layer (about 30% lower infrastructure cost). GitHub Actions + Docker containers.
- **Provider Layer:** Gemini Realtime, Sarvam (regional Indian languages), Ultravox; Cartesia as the primary TTS layer, with Cartesia and Fish Audio voice cloning for brand-matched voices.
- **Mid-Call Fire-and-Forget RAG:** Google File Search API RAG fired asynchronously during calls without latency pauses. Includes file-explorer admin UI and testing playground.
- **Data Layer:** Relational SQL schema for the platform, designed end to end by Sahil.
- **Call Evaluation:** Recorded call audio and transcripts; scored by an LLM-as-a-judge plus human review for task completion, grounding, and word-level language confusion across Indic languages; reviewer-annotated error spans feed a correction lexicon applied from the next call onward.
