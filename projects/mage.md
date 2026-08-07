# MAGe — Multi-Agent Advertising & Media Generation Engine

- **Author / Lead:** Sahil Tomar (dev-S-t)
- **Tech Stack:** Google Veo, Playwright, Cartesia TTS, FFmpeg, Subreddit Sentiment API, Python `asyncio` & `contextvars`

## Architecture Highlights
- **Playwright Brand Scraper:** Scrapes typography, logos, color palettes, and product images into persistent multimodal brand profiles.
- **Agent Hierarchy:** Creative Director, Script Writer, Reference Selector, Dialogue & Voice, Video Generator (Google Veo + FFmpeg frame-anchor stitching), and Reviewer Agent.
- **Trend Discovery:** Scans Subreddits for audience sentiment to generate live content recommendations.
- **Metering & State:** Session token/render cost accounting using Python `contextvars` and persistent React/Next.js guided decision UI.
