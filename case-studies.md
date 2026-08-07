# Engineering Case Studies — Sahil Tomar (dev-S-t)

Most of my project write-ups describe what got built. This page describes how I got there — the problem as it was first handed to me, what I found once I dug in, why the obvious first approach usually didn't hold, and the architecture that did.

---

## Case Study 1: Data That Can't Leave the Building
- **Problem:** Client needed AI over internal documents but refused external data transmission.
- **Solution:** Inverted RAG topology over Agent-to-Agent (A2A) protocol; local reasoning agents deploy directly onto client network with hybrid dense vector + keyword search.

## Case Study 2: Multi-Tenant AI Without Cross-Contamination
- **Problem:** Serving multiple clients on shared infrastructure without cross-tenant data leaks or untracked cost spikes.
- **Solution:** Agent-per-tenant architecture (Google ADK), logical vector namespace isolation, LiteLLM cost/routing gateway.

## Case Study 3: 30 Minutes to Under a Minute — Automating a Manual Dispatch Desk
- **Problem:** Dubai luxury transport company ran B2B bookings manually via WhatsApp groups (~30 min turnaround).
- **Solution:** `whatsmeow` Go connection layer + Python/Google ADK multi-agent system + Cloud Run Flight Data service. Turnaround dropped to <1 min.

## Case Study 4: Filtering Signal From a Thousand Messages a Day
- **Problem:** Musician received 1,000+ daily community messages, burying booking inquiries.
- **Solution:** Extended WhatsApp gateway with group monitoring service forwarding actionable messages to private admin group, plus fan-out forwarding service.

## Case Study 5: Unblocking a Real-Time Avatar Product After Months Stuck
- **Problem:** Client (MGS / Quantashift) internal team stuck for months getting LiveKit video working for AI avatar interviewer.
- **Solution:** Self-hosted LiveKit on GCP (VM, Cloud Run, ZeroSSL private server) + Gemini Realtime + Groq/Ultravox fallback chain.

## Case Study 6: One Voice Platform, Two Opposite Conversational Goals
- **Problem:** Higher-ed consultancy needed unhurried follow-up; real estate needed persistent cold-calling.
- **Solution:** VOAG platform on DigitalOcean + UAE LAN SIP modem architecture, regional low-latency workers + Cloud Run auto-scale workers, multi-provider routing (Gemini/Sarvam/Ultravox), fire-and-forget Google File Search RAG.

## Case Study 7: Consistent Brand Content Without a Social Media Manager
- **Problem:** SMBs lack social media managers, causing post uncertainty and slow creative execution.
- **Solution:** MAGe engine: Playwright brand crawler + vision model brand profile, multi-agent pipeline (Veo + Cartesia + FFmpeg frame anchoring), Subreddit sentiment scanner, session `contextvars` cost accounting.
