# Case Study 5: Unblocking a Real-Time Avatar Product After Months Stuck

- **Client:** MGS Technology Pvt Ltd, via Quantashift Consultancy Services (Sole engineer)
- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [Hireups AI Avatar](/projects/hireups.md)

## Problem
MGS's internal team had been blocked for months and could not get LiveKit's real-time video and infrastructure working — holding up a product meant to conduct interviews through a live photorealistic avatar rather than a plain audio bot. What existed was audio-only.

## Analysis
The blocker wasn't the AI model, it was the real-time infrastructure layer. LiveKit had removed most of their SIP and self-hosting documentation after launching their own hosted phone number product. And the client's private server sat on an untrusted IP range, which broke standard certificate provisioning. That specific combination isn't documented anywhere, because it isn't a common one — which is exactly why an internal team without prior LiveKit experience stalled on it.

## Solution & Architecture
Self-hosted LiveKit on GCP rather than using LiveKit Cloud, driving a photorealistic video avatar through Gemini's realtime audio-native model — capable of understanding and responding in effectively any language and switching mid-conversation in roughly a second, though scoped to English and Arabic for this client's production requirements.

Three separate deployments:
- **A GCP VM** — the baseline working deployment.
- **Cloud Run** — considerably harder than it sounds, since LiveKit's workers require persistent connections, which works directly against Cloud Run's normal scale-to-zero behavior.
- **The client's own private server** — requiring ZeroSSL certificates because of the untrusted IP range, which in turn required a newer LiveKit release than had officially shipped. Rather than wait on an official release, a compatible build was assembled and deployed directly.

Reliability was handled with a fallback chain: if the primary Gemini Live connection drops mid-call, the system fails over to Groq or Ultravox rather than dropping the interview entirely.

## Outcome
A working real-time avatar interview system delivered end to end across three environments, inside a roughly two-month engagement, after the internal team had been stuck for months.
