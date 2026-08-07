# Hireups — Real-Time AI Interviewer with Photorealistic Avatar

- **Engagement:** Quantashift Consultancy Services (Contracted to MGS Technology Pvt Ltd)
- **Sole Engineer:** Sahil Tomar (dev-S-t)
- **Domain:** Photorealistic Video Avatar, LiveKit WebRTC, Gemini Realtime, Multi-LLM Uptime Fallbacks

## System Architecture
- **Model Engine:** Gemini Realtime audio-native model with 1-second language switching (English & Arabic production scope).
- **Three GCP Deployments:** GCP Compute Engine VM, GCP Cloud Run (persistent WebRTC connection handling), and client private server (custom LiveKit release build with ZeroSSL certificate integration).
- **Reliability Chain:** Automated failover from Gemini Live to Groq or Ultravox if primary audio stream drops mid-interview.
