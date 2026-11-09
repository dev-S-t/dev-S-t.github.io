# Decisions

What has been agreed with Abhishek, newest first. Read this before designing, and add to it when something is decided. Open questions are listed at the end.

## 2026-11-10: humour, the scroll character, fonts

- **Humour:** Claude writes the hover lines. The aim is a smile of recognition: small, human truths, in the spirit of "So much experience :O" on the resume button. Abhishek reviews them. Set them small, in the body face, so they stay minimal.
- **Scroll character:** the logo's figure is the human who travels with the reader through the page. It may walk, fall, wave, sit, ride the loop or draw itself on, as section 2 of `DESIGN.md` allows; its shape is never redrawn. Start from `experimental-assets/kit/video/mark.js`, `markbody.js` and `markfig.js`.
- **Fonts:**
  - Canela Thin: Abhishek's file is Commercial Type's desktop font (EULA, "All rights reserved"). Subset to Latin WOFF2 (14 KB) in `assets/fonts/local/`, which git ignores. It stays local until a Canela web licence is confirmed.
  - Mazzard (Pepper Type, Oleh Lishchuk, "All rights reserved"): the zip came from GraphicUX.com, not the foundry, and holds only MazzardH Black and Black Italic. Those are too heavy for body text and UI. Not set up yet; needs the text weights and a licence that allows web use.

## 2026-11-10: colour, and how the references work

- **Dark ground:** `#4A1E1A` (oxblood) in place of oryzo's green, for now.
- **Line and particle effects:** in the manner of igloo.inc. **Card and vector motion on scroll and hover:** in the manner of lusion.co. Build our own versions of these techniques; do not copy their code, models or media.

### How the references do it (studied 2026-11-10)

**adasilv2.framer.website (humour).** Every interactive element has a resting state and a hover state, and the hover state reveals a short, casual line under or beside it, set small in a plain sans: "So much experience :O" under a fanned stack of company logos, "Press me!" under a toolbox, "... thinking about moving pixels..." under the illustration. Objects move as they reveal: the logo stack fans out; project cards are folders that tilt, scale up and let their screens slide out while the description appears. Section subtitles are jokes too ("Blood, sweat, and tears were sacrificed", "Faking it until I made it"). Built with Framer component variants.

**igloo.inc (lines and particles).** One WebGL scene in three.js r165, with GSAP and ScrollTrigger driving a camera along the scroll. Behind the pointer runs a GPU fluid simulation (splat, curl, vorticity, divergence, pressure, advection passes); the fluid's velocity pushes the image, with a chromatic, rainbow-edged smear that follows the cursor. Particles are point sprites whose size scales with a `progress` value, so shapes assemble and dissolve as you scroll. Text is MSDF, drawn in the scene. Post-processing: bokeh, god rays, Kawase blur, SMAA, dithering. Cost: about 15 MB over 95 requests (KTX2 textures 10.5 MB, Draco models 0.5 MB, music 2.9 MB, JS 0.56 MB). Its own scroll handling barely responds to a normal wheel in an embedded browser.

**lusion.co (cards and vectors).** three.js r158 on three canvases, about 300 KB of JS and 186 KB of fonts before media. Scrolling is smoothed with heavy inertia. A thick ribbon draws itself across the page as you scroll, and a small video card beside the intro grows into the full-width reel. A thin outlined line trails the cursor. Headings are split into characters that rise and rotate into place. Project titles are odometers: each letter is a column of four copies that slides on hover with a stagger. Buttons roll their label up by 100% and fill their background, on `cubic-bezier(0.35, 0, 0, 1)` and `cubic-bezier(0.4, 0, 0.1, 1)`.

### What this means for our performance rule

igloo.inc and lusion.co both trade load time for spectacle; neither would load in under a second. To keep both, the page renders as plain HTML, CSS and inline SVG first, with all text present, and the WebGL layer (one canvas for the dot and line field and the pointer effects) loads after first paint and only on devices that can run it. Prefer a small WebGL library or raw WebGL over the full three.js where the effect allows.

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
  | green | `#445231`, `#5D6C49` | **not used**; their main background |
  | **oxblood (ours)** | **`#4A1E1A`** | **replaces the green as the dark ground, for now; may change once seen in use** (2026-11-10) |

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

- How loud the humour should be next to "minimal, slight luxury".
- A web licence for Canela Thin; Mazzard's text weights and a web licence.
- How to measure "under a second, top scores".
- What to keep from the current landing draft.
