# WhatsApp Dispatch Automation — Enterprise & Community

- **Author / Lead:** Sahil Tomar (dev-S-t)
- **Domain:** WhatsApp Session Automation (`whatsmeow` Go library), Google ADK Multi-Agent Orchestration, Cloud Run Services

## Enterprise Ground Transport (Dubai Client)
Automated B2B group-chat booking flow for a Dubai-based luxury ground transportation company.
- **Connection Layer (Go):** Built on `whatsmeow` handling session state, group messages, read receipts, and typing indicators.
- **Agent Layer (Python / Google ADK):** Orchestrator agent managing Booking Agent (Google Maps queries, flight data lookups, driver/vehicle availability, fare calculation) and Support Agent (cancellations, modifications).
- **Flight Data Service:** Python/ADK microservice on Cloud Run.
- **Result:** Booking turnaround reduced from ~30 minutes to under 1 minute.

## Musician Community Extension
- **Monitoring Service:** Scans community groups for booking/performance requests, surfacing actionable messages to private admin group.
- **Forwarding Service:** Fans out single admin announcements to targeted destination contacts/groups.
