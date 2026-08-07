# Case Study 6: One Voice Platform, Two Opposite Conversational Goals

- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [VOAG Enterprise Voice AI SaaS](/projects/voag.md)

## Problem
Different clients on the same voice platform needed fundamentally different conversational behavior. A higher-education consultancy wanted natural, unhurried outreach and follow-up calls — explicitly *not* salesy — to take pressure off their human counselors. A real estate client needed close to the opposite: a persistent, harder-to-brush-off cold-calling agent, because real estate cold calls are otherwise trivially easy to end in five seconds.

## Analysis
A single generically-tuned voice bot fails at least one of these outright. And underneath both sits a harder constraint: neither use case works at all if the conversation doesn't feel genuinely real-time. Past roughly 200ms round-trip, an agent starts getting talked over, feels robotic, and breaks the premise the entire product rests on.

## Solution & Architecture
Built VOAG so that *how a call is handled* is separate from *what a call sounds like*.

On infrastructure: LiveKit self-hosted rather than LiveKit Cloud. The UAE deployment runs a SIM card through a modem into a SIP gateway directly into the self-hosted LiveKit server, all on the same LAN — eliminating a network hop and holding latency down. That required custom deployment work specifically because of NAT constraints in the client's environment, made harder by LiveKit having stripped most SIP documentation after launching their own phone number product.

Calls route by originating number and tenant ID to either the UAE instance or the self-hosted Indian instance — two dedicated low-latency workers for those paths, plus three bulk-handling workers for general volume. The main API and batch manager stay on a small always-available VM so requests are answered instantly, while call workers run on Cloud Run with auto-scale and scale-to-zero, woken on demand through an async polling layer rather than holding persistent connections open.

On behavior: per-tenant configuration controls tone, pacing, and conversational goal — so the same infrastructure serves both a low-pressure counselor-style agent and a deliberately persistent cold-caller without maintaining two codebases.

## Outcome
One platform handling 1,000+ calls a day across genuinely different use cases — education outreach, real estate cold calling, and B2B partnership outreach for a travel agency — with no per-client fork of the underlying system.
