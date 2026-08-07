# Case Study 7: Consistent Brand Content Without a Social Media Manager

- **Author:** Sahil Tomar (dev-S-t)
- **Related System:** [MAGe Media Generation Engine](/projects/mage.md)

## Problem
Maintaining a consistent brand presence on social media effectively requires a dedicated social media manager — daily posting, on-brand creative, and staying current with what's actually working. Most small and mid-size businesses don't have one, and two failure modes follow directly: not knowing what to post, and slow execution when recreating competitor concepts.

## Analysis
Two problems needing two different solutions in one system. The "what to post" gap needs live trend signal about what's currently resonating, not static best practices. The "make it ours" gap needs the brand's actual visual identity encoded somewhere the generation pipeline can enforce automatically — otherwise you get generic output that needs a human to fix, which defeats the purpose.

A third failure mode had to be designed around: a single "describe your ad" prompt burns an entire generation cycle before anyone discovers the output isn't what they wanted. For video generation, that's expensive in both time and API cost.

## Solution & Architecture
The pipeline starts by scraping the client's own website with Playwright — visual style, typography, logos, color palette, product imagery — and passes that through a multimodal vision model to infer brand voice, audience, and differentiators. The result is a structured, persistent brand profile that every later stage is checked against, which makes "with our logo and our colors" automatic rather than a manual step.

From there, a small hierarchy of specialist agents each owns one stage rather than one long prompt chain:
- **Creative Director:** Proposes a few distinct directions grounded in the brand profile.
- **Script Writer:** Turns an approved direction into a shot-by-shot script.
- **Reference Selector:** Maps specific brand assets to specific scenes.
- **Dialogue & Voice:** Chooses and times a Cartesia TTS voice against the script.
- **Video Generator:** Splits longer scripts into segments generated with Google's Veo model and stitched with FFmpeg — carrying the final frame of each segment forward as the visual anchor for the next.
- **Reviewer Agent:** Checks assembled results against the script before presentation.

A separate trend tool pulls trending posts and audience sentiment from relevant subreddits, giving live signal on what's currently landing in a given niche.

The interface is step-by-step rather than single-prompt. Session token/render cost accounting is metered per session using Python `contextvars`.

## Outcome
A system where a business without a social media manager gets both halves of the problem covered: suggestions for what to post grounded in current trends, and finished on-brand creative from a handful of guided decisions rather than a design brief and a week of turnaround.
