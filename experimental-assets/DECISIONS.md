# Decisions

What has been agreed with Abhishek, newest first. Read this before designing, and add to it when something is decided. Open questions are listed at the end.

## 2026-11-09: first session

### Who

- Sahil Tomar, AI solution architect, keeps the AI loop. He designed the logo.
- Abhishek, product designer, keeps the UI/UX (design) loop.
- Human in Loop is a side project the two of them run.

### Information architecture

**Global home page (`/`)**, in this order:

1. Hero
2. About us
3. The loops: a visualisation of the different loops. Each loop is a domain (AI, design, cyber and so on), and each opens that keeper's portfolio.
4. Featured work
5. Top services / creative ideas / journey
6. Team
7. Call to action (an agency CTA)
8. Footer

**Each loop page** (a keeper's portfolio, for example the design loop is Abhishek's): hero, about the domain, featured projects, services, testimonials, founder portfolio, blog loop, CTA for that loop, footer.

**Loops planned:** AI (Sahil), UI/UX (Abhishek). Later: Abyss-Admin, Cyber, possibly an agency. Only AI and design exist now.

**Also on the list:** SEO and GEO for the landing page, an `/agent` page, optimising the loops, `/blog` or `/daily-updates`, ranking.

### Direction

- **Mood:** minimal, professional, with a slight touch of luxury. The story matters as much as conversion: the page is designed as one experience, and every section moves the story along.
- **Type:** Canela Web Thin for headings `h1` to `h6`. Mazzard for body text and UI.
- **Colour:** oryzo.ai's warm palette, without its greens. From that site:

  | Name there | Value | Use |
  | --- | --- | --- |
  | white | `#FFEDD7` | warm cream ground |
  | lightest | `#F6E0C6` | a second, darker cream |
  | black | `#100904` | near-black text |
  | brown | `#382416` | deep brown |
  | grey-brown | `#6C5F51` | muted text |
  | sand | `#BBAC97` | lines, borders |
  | orange | `#DC5000` | accent |
  | green | `#445231`, `#5D6C49` | **not used**; their main background, to be replaced by a warm colour (open) |

- **Motion:** GSAP, scroll-driven, very smooth, with a sense of weight. Every scroll should glide.
- **A character that travels the page on scroll**, in the way oryzo.ai carries its product through the page.
- **Humour:** elements that talk on hover, in the way adasilv2.framer.website does. Illustrations, and buttons and cards that show a small remark when you hover over them.
- **Lines:** everything is made of dots, and a dot drawn out becomes a line. Use that for richer, minimal, interactive vectors that respond to hover. The current use of lines is not wanted as it is.
- **Performance:** loads in under a second; top scores.
- **Images:** Abhishek supplies them as WebP when asked, given a keyword.

### References

- adasilv2.framer.website: humour and communication design; hover remarks.
- flatlineagency.com: minimalism and type (it uses Canela Web Thin with Suisse Intl, on `#F3F0E9`).
- oryzo.ai: a character carried through the page on scroll; the warm palette.

## Open questions

- Which warm colour replaces oryzo's green.
- Licences and font files for Canela Web Thin and Mazzard.
- Who the scroll character is.
- Who writes the hover remarks and other copy.
- How to measure "under a second, top scores".
- What to keep from the current landing draft.
