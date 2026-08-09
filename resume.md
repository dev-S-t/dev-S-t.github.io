# Sahil Tomar (dev-S-t) — Technical Resume

> **AI Solutions Engineer & Voice AI Specialist**  
> Custom Domain: https://human-in-loop.dev | Download PDF Resume: [sahil-tomar-resume.pdf](https://human-in-loop.dev/assets/sahil-tomar-resume.pdf)

---

## 1. Contact Information
- **Email:** dev.sahil.tomar@gmail.com
- **WhatsApp:** [Primary WhatsApp (wa.link/r8csgy)](https://wa.link/r8csgy) | [Secondary WhatsApp (wa.link/l2oedq)](https://wa.link/l2oedq)
- **GitHub:** [github.com/dev-S-t](https://github.com/dev-S-t)
- **LinkedIn:** [linkedin.com/in/dev-s-t](https://www.linkedin.com/in/dev-s-t/)
- **ORCID:** [0009-0005-9222-9121](https://orcid.org/0009-0005-9222-9121)
- **Location:** Ghaziabad, Uttar Pradesh, India (Open to Remote / Delhi NCR / Bengaluru / Pune)

---

## 2. Professional Summary
- **AI Solutions Engineer leading the Voice AI vertical (VOAG) at TechieMaya** — production real-time voice infrastructure on LiveKit/WebRTC and SIP telephony, running **1,000+ calls/day at sub-200ms p95 latency**.
- Owns systems end to end: architecture, deployment inside client infrastructure under NAT and compliance constraints, and production monitoring. Builds agentic systems with Google ADK, RAG over private data, and generative media pipelines.

---

## 3. Work Experience

### AI Solutions Engineer (Intern → Full-Time Contract) — TechieMaya
*Apr. 2025 – Present · Remote (Dubai, UAE)*

#### VOAG — Enterprise Voice AI SaaS (Mr. LADs App)
- **Lead the Voice AI vertical:** scaled to **1,000+ calls/day at sub-200ms p95 latency**; replaced persistent WebSockets with an *async polling layer* waking Cloud Run workers on demand, cutting infrastructure cost **30%**.
- **Hybrid cloud SIP:** engineered a UAE telephony bridge (SIM -> modem -> SIP -> LiveKit) deployed *inside a client's own VM behind a strict NAT gateway* for ultra-low-latency local calling; self-hosted LiveKit across India and UAE regions with tenant-aware call routing.
- **Agentic workflows:** built a tenant-aware tool registry over OAuth 2.0 enabling live calendar scheduling, omnichannel messaging, and human handoff mid-call; added *fire-and-forget RAG* so agents reference long documents without conversational dead air.
- **Multi-provider & delivery:** integrated Gemini Live, Sarvam, and Ultravox for cost/language routing; containerised all workers with **GitHub Actions** CI/CD, plus a playground for testing agents against the production pipeline.

#### WhatsApp Dispatch Automation — B2B Luxury Ground Transport (Dubai)
- Built a Go gateway (`whatsmeow`) for group-chat messaging unsupported by Meta's official API, paired with a **Google ADK multi-agent system** — orchestrator, booking agent, and support agent — resolving flight, maps, fleet-availability and fare data via tools, and asking targeted follow-ups on incomplete requests.
- Cut booking turnaround **from ~30 minutes to under 1 minute**; extended the same gateway for a second client with message-monitoring and multi-mapping forwarding services across 1,000+ daily community messages.

#### MAGe — Multi-Agent Media Generation Engine
- Hierarchical agent pipeline (creative director -> scriptwriter -> reference selector -> generator -> reviewer) producing on-brand video ads from a **Playwright**-scraped brand profile, using Google Veo with frame-carry continuity and FFmpeg assembly.
- Added Reddit trend intelligence for creative direction and per-session API cost accounting via Python `contextvars` across concurrent async workers.

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

### Machine Learning Intern — Infosys Springboard
*Mar. 2024 – Jul. 2024 · Remote*
- Built a hybrid fraud-detection pipeline on a highly imbalanced **400+ feature** dataset (ARIMA/Prophet + XGBoost), achieving **96% fraud recall** with an optimised F1-score.

---

## 4. Major Production Projects
1. **[AnyAssist — Multi-Tenant RAG Platform](https://human-in-loop.dev/projects/anyassist/):** GCP, LiteLLM, LightRAG, FastAPI, Google ADK. Self-service document chat SaaS with strict per-tenant vector isolation; LiteLLM gateway handles cross-provider routing, rate limiting, and per-tenant cost tracking.
2. **[Privacy-First On-Premise RAG](https://human-in-loop.dev/projects/privacy-rag/):** Inverted RAG topology over A2A protocol for compliance-sensitive clients.
3. **[WhatsApp Dispatch Automation](https://human-in-loop.dev/projects/whatsapp-dispatch/):** B2B group dispatch for Dubai luxury transport client (`whatsmeow` Go + Google ADK) plus musician community vertical.
4. **[VOAG — Enterprise Voice AI SaaS](https://human-in-loop.dev/projects/voag/):** 1,000+ daily calls in Mr. LADs app, sub-200ms latency, UAE LAN SIP modem architecture.
5. **[Hireups — Real-Time AI Avatar Interviewer](https://human-in-loop.dev/projects/hireups/):** Photorealistic video avatar interviewer built on Gemini Realtime & LiveKit GCP for MGS via Quantashift.
6. **[MAGe — Multi-Agent Advertising & Media Generation Engine](https://human-in-loop.dev/projects/mage/):** Google Veo, Playwright brand crawler, Cartesia voice, Subreddit trend intelligence, session `contextvars` cost accounting.
7. **[UniBias — Live Attention Tracker](https://human-in-loop.dev/projects/unibias/):** Privacy-first tracker analyzing periodic webcam and screen frames to detect distraction, with no recording.
8. **[Blood Bank Demand-Forecasting System](https://human-in-loop.dev/projects/blood-bank/):** IEEE-published SARIMA/XGBoost dynamic micro-expiry simulation reducing platelet wastage from 11.2% to 2.5%.

---

## 5. Technical Skills Inventory
- **Languages & Infra:** Python (AsyncIO), Go, SQL, Docker, GCP (Cloud Run, Compute Engine, Vertex AI), DigitalOcean
- **Voice & Real-Time:** LiveKit (WebRTC), SIP/VoIP bridging, WebSockets, Gemini Live API, Sarvam, Ultravox, streaming STT/TTS
- **AI & Agents:** Google ADK, LangGraph, LiteLLM, LightRAG, Multi-Agent Systems, A2A Protocol, RAG, Vector DBs
- **Generative Media:** Google Veo, Imagen, Cartesia TTS, FFmpeg, Playwright
- **Backend & DevOps:** FastAPI, REST APIs, OAuth 2.0, Redis, NGINX, GitHub Actions (CI/CD), Fail2Ban

---

## 6. Scholarly Publication
- **A Demand-Driven Software Approach with Dynamic Micro-Expiry and Just-in-Time Processing to Reduce Platelet Wastage in Blood Banks**  
  *IEEE IC2PCT 2026, pp. 978–983* — [IEEE Xplore #11584332](https://ieeexplore.ieee.org/document/11584332) | [Full Publication Page](https://human-in-loop.dev/publications/)  
  Co-author — led problem formulation, forecasting-model development (SARIMA/XGBoost; SARIMA lowest MAE at 5.85), and simulation software execution. Reduced simulated wastage **11.2% -> 2.5%** while holding **99.1%** fulfillment; validated over 30 iterations (paired t-tests, p < 1.22 × 10⁻¹²).

---

## 7. Education & Extracurricular Leadership
- **Ajay Kumar Garg Engineering College (AKGEC)** — B.Tech in Computer Science (Sept. 2022 – Jun. 2026), CGPA 8.0, Ghaziabad, India.
  - Coordinator, Cloud Computing Cell: organized ML and cloud workshops for 200+ students.
  - Coordinator, Centre of Metaverse: led "Rescue X", a VR first-responder platform, to **Top 5** at National IDE Boot-camp 2025.

---

## 8. Professional Certifications
- Building AI Voice Agents for Production, LiveKit / DeepLearning.AI (Sep. 2025)
- Foundations of Responsible AI (Sep. 2025)
- Complete Data Science, ML, DL & NLP Bootcamp, Udemy (Jul. 2025)
- Fundamentals of Deep Learning, NVIDIA DLI (Mar. 2025)
