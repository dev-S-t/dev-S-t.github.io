# Case Study 3: 30 Minutes to Under a Minute — Automating a Manual Dispatch Desk

- **Client:** A Dubai-based luxury ground transportation company (engagement held by TechieMaya)
- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [WhatsApp Dispatch Automation](/projects/whatsapp-dispatch.md)

## Problem
The company ran their entire B2B partner booking flow through WhatsApp groups. A partner posted a request; a human had to notice it, manually check vehicle and driver availability, calculate a fare, and reply. Typical turnaround was around 30 minutes with staff on hand — and well over two hours for requests arriving outside working hours. WhatsApp's official Business API offers no support for reading or acting on group messages, so there was no vendor-sanctioned automation path at all.

## Analysis
Two distinct problems stacked. First: get a working connection into group chats, which the official API structurally does not permit. Second, once that's solved: real booking requests are messy — missing details, a flight time that doesn't line up with the requested pickup window, contradictory information. This couldn't be keyword matching. It needed to actually reason about what was missing or inconsistent and ask the right follow-up question, or it would just generate confidently wrong bookings faster than humans generated correct ones.

## Solution & Architecture
A connection layer built on the `whatsmeow` Go library, managing the WhatsApp session directly — reading, receiving, and sending messages, read receipts, typing indicators.

On top of that, a Python multi-agent system on Google ADK:
- An **orchestrator** supervising sub-agents and managing shared context.
- A **booking agent** extracting request details and filling gaps via tools (layered Google Maps queries, flight data lookups, driver/vehicle availability, fare estimation). Asks targeted follow-ups when details are missing or contradictory.
- A **support agent** handling cancellations, modifications, and inquiries.

A separate **Flight Data service** runs independently on Cloud Run as the shared flight-lookup backend.

## Outcome
Turnaround dropped from ~30 minutes (2+ hours off-hours) to under a minute, with no recurring WhatsApp Business API costs, since the integration never routes through the paid official channel.
