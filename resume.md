# Sahil Tomar (dev-S-t) — Technical Resume

> **AI Solutions Engineer & Voice AI Specialist**  
> Custom Domain: https://human-in-loop.dev | Download PDF Resume: [sahil-tomar-resume.pdf](https://human-in-loop.dev/assets/sahil-tomar-resume.pdf)

---

## 1. Contact Information
- **Email:** dev.sahil.tomar@gmail.com
- **WhatsApp:** [Primary WhatsApp (wa.link/r8csgy)](https://wa.link/r8csgy) | [Secondary WhatsApp (wa.link/l2oedq)](https://wa.link/l2oedq)
- **GitHub:** [github.com/dev-S-t](https://github.com/dev-S-t)
- **LinkedIn:** [linkedin.com/in/dev-s-t](https://www.linkedin.com/in/dev-s-t/)

---

## 2. Professional Summary
- **AI Solutions Engineer building production AI systems, not prototypes.** Leading TechieMaya's Voice AI vertical (VOAG): **1,000+ calls/day at sub-300ms p95 latency** on self-hosted LiveKit and SIP telephony, with multi-provider model routing and per-tenant cost tracking.
- Client-facing from scoping calls to go-live, shipping into constrained environments — client VMs, on-premise networks, strict NAT gateways — and staying accountable after launch, from evals and monitoring to cost tuning, with no ops team.
- Equally hands-on with multi-agent systems (Google ADK, LangGraph), RAG over private data, and real-time speech pipelines in **Python and Go** on GCP.

---

## 3. Work Experience

### AI Solutions Engineer — TechieMaya
*Apr. 2025 – Present · Remote (Dubai, UAE)*

#### VOAG — Enterprise Voice AI SaaS (Mr. LADs App)
- **Lead the Voice AI vertical:** scaled to **1,000+ calls/day at sub-300ms p95 latency**; kept LiveKit agents — built for always-on connections — running on serverless **Cloud Run** through a keep-alive, hold, and polling layer, cutting infrastructure cost **30%**.
- **Hybrid cloud SIP:** engineered a UAE telephony bridge (SIM -> modem -> SIP -> LiveKit) deployed *inside a client's own VM behind a strict NAT gateway*; self-hosted LiveKit across India and UAE with tenant-aware routing and **GitHub Actions**-driven CI/CD.
- **Agentic workflows & multi-provider routing:** built a tenant-aware tool registry over OAuth 2.0 for live calendar scheduling, omnichannel messaging, and mid-call human handoff; added *fire-and-forget RAG* for long-document reference with no conversational dead air, routed across Gemini Live, Sarvam, and Ultravox for cost/language optimisation, with **Cartesia** as the primary TTS layer (plus Fish Audio) for brand-matched *voice cloning*.
- **Call evals:** recorded audio and transcripts scored by an **LLM-as-a-judge** plus human review for task completion, grounding, and *word-level language confusion* across Indic languages; reviewer-annotated error spans feed a correction lexicon applied from the next call onward.
- **Ownership:** voice AI lead in client scoping meetings; administer GCP for VOAG and the wider company (least-privilege IAM, VM hardening, cost control); designed VOAG's complete relational SQL schema.

#### WhatsApp Dispatch Automation — B2B Luxury Ground Transport (Dubai)
- Built a Go gateway (`whatsmeow`) for group-chat messaging unsupported by Meta's official API, paired with a **Google ADK multi-agent system** (orchestrator, booking, support agents) resolving flight, maps, fleet-availability and fare data via tools — cutting booking turnaround **from ~30 minutes to under 1 minute**; extended the gateway to a second client for message-monitoring and forwarding across 1,000+ daily messages.

#### MAGe — Multi-Agent Media Generation Engine
- Hierarchical agent pipeline (creative director -> scriptwriter -> reference selector -> generator -> reviewer) producing on-brand video ads from a **Playwright**-scraped brand profile, using Google Veo with frame-carry continuity and FFmpeg assembly; tracks per-session API cost via Python `contextvars` across concurrent async workers.

#### Privacy-First On-Premise RAG (A2A Protocol)
- Inverted RAG topology for compliance-sensitive clients — the reasoning agent deploys *onto client infrastructure* over an **Agent-to-Agent protocol**, queryable by any external agent with **zero data exfiltration**; hybrid dense-vector and keyword index for mixed document types.

---

### Freelance Voice AI Consultant — Quantashift Consultancy Services (contracted to MGS Technology)
*Jan. 2026 – Mar. 2026 · Remote (Pune, India)*

#### Hireups — Real-Time AI Interviewer with Photorealistic Video Avatar
- Brought in after the internal team was blocked for months on LiveKit real-time *video*; delivered a **live photorealistic avatar interviewer** on Gemini's realtime audio-native model with sub-second, interruptible multilingual dialogue (English/Arabic in production).
- Shipped **three production deployments** — GCP VM, Cloud Run (non-trivial: LiveKit workers require persistent connections), and the client's private server, which needed a *custom LiveKit build* to satisfy ZeroSSL on an untrusted IP range.
- Rearchitected a failing WebRTC monolith into scalable GCP microservices; added a **multi-LLM failover mesh** (Gemini/Groq/Ultravox) for uninterrupted sessions, and moved proctoring inference in-browser (TensorFlow.js, MediaPipe, COCO-SSD) to eliminate server video compute.

---

## 4. Major Production Projects
1. **[Fraud Detection System — Infosys Springboard ML Internship](https://github.com/dev-S-t/FraudDetectionSystem):** ARIMA/Prophet, XGBoost. Hybrid fraud-detection pipeline on a highly imbalanced **400+ feature** dataset, achieving **96% fraud recall** with an optimised F1-score.
2. **[AnyAssist — Multi-Tenant RAG Platform](https://human-in-loop.dev/projects/anyassist/):** GCP, LiteLLM, LightRAG, FastAPI, Google ADK. Self-service document chat SaaS with strict per-tenant vector isolation; LiteLLM gateway handles cross-provider routing, rate limiting, and per-tenant cost tracking.
3. **[Privacy-First On-Premise RAG](https://human-in-loop.dev/projects/privacy-rag/):** Inverted RAG topology over A2A protocol for compliance-sensitive clients.
4. **[WhatsApp Dispatch Automation](https://human-in-loop.dev/projects/whatsapp-dispatch/):** B2B group dispatch for Dubai luxury transport client (`whatsmeow` Go + Google ADK) plus musician community vertical.
5. **[VOAG — Enterprise Voice AI SaaS](https://human-in-loop.dev/projects/voag/):** 1,000+ daily calls in Mr. LADs app, sub-300ms latency, UAE LAN SIP modem architecture.
6. **[Hireups — Real-Time AI Avatar Interviewer](https://human-in-loop.dev/projects/hireups/):** Photorealistic video avatar interviewer built on Gemini Realtime & LiveKit GCP for MGS via Quantashift.
7. **[MAGe — Multi-Agent Advertising & Media Generation Engine](https://human-in-loop.dev/projects/mage/):** Google Veo, Playwright brand crawler, Cartesia voice, Subreddit trend intelligence, session `contextvars` cost accounting.
8. **[UniBias — Live Attention Tracker](https://human-in-loop.dev/projects/unibias/):** Privacy-first tracker analyzing periodic webcam and screen frames to detect distraction, with no recording.
9. **[Blood Bank Demand-Forecasting System](https://human-in-loop.dev/projects/blood-bank/):** IEEE-published SARIMA/XGBoost dynamic micro-expiry simulation reducing platelet wastage from 11.2% to 2.5%.

---

## 5. Technical Skills Inventory
- **AI & Agents:** Google ADK, LangGraph, LiteLLM, LightRAG, Multi-Agent Systems, A2A Protocol, MCP, RAG, Vector DBs, LLM-as-a-judge
- **Languages & Cloud:** Python (AsyncIO), Go, JavaScript, SQL (schema design), Docker, GCP (Cloud Run, Compute Engine, Vertex AI, IAM), DigitalOcean
- **Voice & Real-Time Systems:** LiveKit (WebRTC), SIP/VoIP telephony, WebSockets, Gemini Live API, streaming STT/TTS
- **Backend & DevOps:** FastAPI, REST APIs, OAuth 2.0, Redis, NGINX, GitHub Actions (CI/CD), Fail2Ban

---

## 6. Scholarly Publication
- **A Demand-Driven Software Approach with Dynamic Micro-Expiry and Just-in-Time Processing to Reduce Platelet Wastage in Blood Banks**  
  *IEEE IC2PCT 2026, pp. 978–983* — [IEEE Xplore #11584332](https://ieeexplore.ieee.org/document/11584332) | [Full Publication Page](https://human-in-loop.dev/publications/)  
  Co-author — led problem formulation, forecasting-model development (SARIMA/XGBoost; SARIMA lowest MAE at 5.85), and simulation. Reduced simulated wastage **11.2% -> 2.5%** while holding **99.1%** fulfillment, statistically validated across 30 iterations (paired t-tests).

---

## 7. Education & Extracurricular Leadership
- **Ajay Kumar Garg Engineering College (AKGEC)** — B.Tech in Computer Science (Sept. 2022 – Jun. 2026), CGPA 8.0, Ghaziabad, India.
  - Coordinator, Cloud Computing Cell: organized ML and cloud workshops for 200+ students.
  - Coordinator, Centre of Metaverse: led "Rescue X", a VR first-responder platform, to **Top 5** at National IDE Boot-camp 2025.

---

## 8. Professional Certifications
- Google Cloud Associate Cloud Engineer (in progress)
- Building AI Voice Agents for Production, LiveKit / DeepLearning.AI (Sep. 2025)
- Foundations of Responsible AI (Sep. 2025)
- Complete Data Science, ML, DL & NLP Bootcamp, Udemy (Jul. 2025)
- Fundamentals of Deep Learning, NVIDIA DLI (Mar. 2025)
