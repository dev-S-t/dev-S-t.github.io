# Audalimo — WhatsApp AI Dispatcher

- **Author / Lead:** Sahil Tomar (dev-S-t)
- **Domain:** WhatsApp Business API, Asynchronous Queue Systems, Automated Fleet Dispatch

## Technical Architecture
Audalimo provides automated dispatch capabilities over WhatsApp. To bypass Meta API rate and concurrency restrictions, the system utilizes an asynchronous gateway layer managing outbound rate throttling, retry backoff, and webhook state tracking.
