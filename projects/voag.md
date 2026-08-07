# VOAG — Enterprise Voice AI SaaS

- **Author / Lead:** Sahil Tomar (dev-S-t) @ TechieMaya
- **Key Metrics:** 1,000+ daily calls in Mr. LADs app, sub-200ms p95 latency
- **Client Vertical Tuning:** Higher-education follow-up, real estate cold calling, Dubai travel agency B2B outreach

## Production Architecture
- **Dual Infrastructure:** DigitalOcean self-hosted LiveKit (India) + UAE local LAN SIP gateway (SIM card ➡️ modem ➡️ SIP gateway ➡️ LiveKit on LAN behind NAT).
- **Worker Scaling:** Regional low-latency workers + 3 bulk GCP Cloud Run workers (scale-to-zero woken via async polling layer). GitHub Actions + Docker containers.
- **Provider Layer:** Gemini Realtime, Sarvam (regional Indian languages), Ultravox.
- **Mid-Call Fire-and-Forget RAG:** Google File Search API RAG fired asynchronously during calls without latency pauses. Includes file-explorer admin UI and testing playground.
