# Engineering Case Studies — Sahil Tomar (dev-S-t)

Most of my project write-ups describe what got built. This page describes how I got there — the problem as it was first handed to me, what I found once I dug in, why the obvious first approach usually didn't hold, and the architecture that did.

---

## 1. Data That Can't Leave the Building
- **Problem:** A client needed AI-powered access to their own internal documents and knowledge base, but would not send that data to any external service — regardless of encryption or access-control guarantees offered. That rules out essentially every standard RAG architecture, all of which assume documents get uploaded somewhere the model can reach.
- **Full Case Study:** [/case-studies/on-prem-privacy-rag.md](/case-studies/on-prem-privacy-rag.md) | [/case-studies/case-study-1/](/case-studies/case-study-1/)

## 2. Multi-Tenant AI Without Cross-Contamination
- **Problem:** Many businesses want the same fundamental thing: a support agent that knows their content and can talk to their customers. Building dedicated infrastructure per business doesn't scale. Naive shared infrastructure risks one tenant's data or conversational context surfacing in another's session.
- **Full Case Study:** [/case-studies/multi-tenant-isolation.md](/case-studies/multi-tenant-isolation.md) | [/case-studies/case-study-2/](/case-studies/case-study-2/)

## 3. 30 Minutes to Under a Minute — Automating a Manual Dispatch Desk
- **Problem:** The company ran their entire B2B partner booking flow through WhatsApp groups. A partner posted a request; a human had to notice it, manually check vehicle and driver availability, calculate a fare, and reply. Typical turnaround was around 30 minutes with staff on hand — and well over two hours for requests arriving outside working hours.
- **Full Case Study:** [/case-studies/manual-dispatch-automation.md](/case-studies/manual-dispatch-automation.md) | [/case-studies/case-study-3/](/case-studies/case-study-3/)

## 4. Filtering Signal From a Thousand Messages a Day
- **Problem:** Active across dozens of community groups, receiving 1,000+ messages a day. Buried in that volume were the few that actually mattered — a booking request, a performance inquiry, someone asking about sessions — with no way to surface them short of reading everything.
- **Full Case Study:** [/case-studies/message-filtering.md](/case-studies/message-filtering.md) | [/case-studies/case-study-4/](/case-studies/case-study-4/)

## 5. Unblocking a Real-Time Avatar Product After Months Stuck
- **Problem:** MGS's internal team had been blocked for months and could not get LiveKit's real-time video and infrastructure working — holding up a product meant to conduct interviews through a live photorealistic avatar rather than a plain audio bot.
- **Full Case Study:** [/case-studies/avatar-product-rescue.md](/case-studies/avatar-product-rescue.md) | [/case-studies/case-study-5/](/case-studies/case-study-5/)

## 6. One Voice Platform, Two Opposite Conversational Goals
- **Problem:** Different clients on the same voice platform needed fundamentally different conversational behavior. A higher-education consultancy wanted natural, unhurried outreach and follow-up calls — explicitly *not* salesy. A real estate client needed close to the opposite: a persistent, harder-to-brush-off cold-calling agent.
- **Full Case Study:** [/case-studies/one-platform-two-goals.md](/case-studies/one-platform-two-goals.md) | [/case-studies/case-study-6/](/case-studies/case-study-6/)

## 7. Consistent Brand Content Without a Social Media Manager
- **Problem:** Maintaining a consistent brand presence on social media effectively requires a dedicated social media manager. Most small and mid-size businesses don't have one, resulting in uncertainty about what to post and slow execution when recreating competitor concepts.
- **Full Case Study:** [/case-studies/brand-content-without-a-manager.md](/case-studies/brand-content-without-a-manager.md) | [/case-studies/case-study-7/](/case-studies/case-study-7/)
