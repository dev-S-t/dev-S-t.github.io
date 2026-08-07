# Case Study 4: Filtering Signal From a Thousand Messages a Day

- **Client:** An independent musician (engagement held by TechieMaya)
- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [WhatsApp Dispatch Automation](/projects/whatsapp-dispatch.md)

## Problem
Active across dozens of community groups, receiving 1,000+ messages a day. Buried in that volume were the few that actually mattered — a booking request, a performance inquiry, someone asking about sessions — with no way to surface them short of reading everything. Separately, every time he had something to announce (a show, a release, a class), he had to manually repost it across a long list of individual contacts and groups.

## Analysis
Not a chatbot problem. Inbound, it's a filtering-and-routing problem. Outbound, it's a fan-out problem. Both needed to sit on infrastructure that could already see message traffic across many groups simultaneously — which meant the expensive part was already built.

## Solution & Architecture
Extended the existing WhatsApp gateway rather than building anything new, adding three services on the same connection layer:
- Messages from **unknown senders** route to a dedicated support agent handling service inquiries and class bookings.
- A **monitoring service** continuously scans his groups and forwards only genuinely relevant messages into a private admin group — cutting daily read volume from 1,000+ down to whatever actually needs a response.
- A **forwarding service** lets him post once into the admin group; a mapping table then fans that message out to the correct set of destination contacts and groups automatically.

## Outcome
Two structurally different problems — too much inbound noise, too much outbound manual effort — solved by extending one existing piece of infrastructure instead of standing up two new systems.
