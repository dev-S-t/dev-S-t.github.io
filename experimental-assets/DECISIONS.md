# Decisions

What has been agreed with Abhishek, newest first. Read this before designing, and add to it when something is decided. Open questions are listed at the end.

## 2026-11-10: sixth pass, the hand-over and the sea of lines

Abhishek's notes: after the glass, don't fade to black; keep him visible and at full size, and carry him into the contact section by scroll; pin the contact section for 120vh so a fast scroll can't skip it; replace the corridor and drop its text; blend the tunnel better and make the scroll heavy near the end of the wormhole; smooth the way into the portal.

- **The way in:** the stone portal fades as the camera passes it (its ring, halo, dust and membrane together), with a soft veil of light at the crossing; the tunnel fades in under it.
- **The tunnel:** strokes are sampled round the circle (no seam where the angle wraps), thin where the brush lifts rather than stopping, and added together like light.
- **Heavier near the core:** the camera slows toward the core (ease-out), a slight tremor grows, and ScrollSmoother's smoothing deepens from 1.8 to 4.4 seconds, so the page lags behind the wheel as if pulled back; it eases after the flip.
- **After the flip:** a warm sky with a low sun over a sea of ridge lines rolling toward us, a clear way down the middle. The corridor and its line are gone.
- **The hand-over:** from the moment the glass breaks, a 2D figure on a layer fixed over the page takes over from the 3D one at its exact place and size, comes to rest in the middle (never smaller), and turns from cream to orange as the contact section rises under him; once the section is pinned he moves onto its canvas, behind its words, floating and waving, and leaves with it.
- **Contact** is pinned for 120% of the screen.
- **Speed:** desktop 100/100/100/100; mobile 93 to 98 across three runs.

## 2026-11-10: fifth pass, igloo's portal, the flip and the glide

Abhishek's notes: the walker got lost before Process and should be dragged into the wormhole; the wormhole should look like igloo.inc's portal, properly 3D; the scroll felt jittery; at the wormhole's end, flip and flash, then he glides toward us as we scroll, breaks the glass and jumps into the contact section; a smaller contact title; one button size; team below contact; a next-page section like Lusion's, leading to the About page (design to come).

- **Order:** hero, reel, about, loops, work, services, process, the fall, contact, team, next page, footer.
- **The walker** has a perch on the process ribbon ("Last stop before the deep end."), then as the fall begins he is pulled to the middle of the screen, spinning and shrinking, and the 3D figure takes over.
- **The portal (igloo-style, in our palette):** a heavy stone ring cut into blocks and glowing on its inner face; a membrane of fine crackling lines (Voronoi edges, densest at the rim) that ripples as we pass it; three open rings floating inside, each with the loop's opening at eleven o'clock; dust and stars. He is dragged into it ahead of us.
- **The tunnel:** soft brush-stroke rings, ragged at the edges and broken where the brush lifted, rushing toward a bright core.
- **The flip:** a white flash at 72%; the world rolls over and we are in the warm corridor of line arches.
- **The glide:** he comes out of the light toward us as we scroll, arms wide, a soft dark halo so he reads against the light; the glass is between us; it shatters toward us at 92% and he jumps through.
- **Jitter:** every 3D scene and the contact figure now draw on GSAP's ticker, the same clock as ScrollSmoother, so canvas and page move in the same frame.
- **Contact title** 44 to 124px; **buttons** one size everywhere (52px).
- **Next page:** pinned; the bar fills as you keep scrolling; at the end it goes to /about/ if that page exists (checked first), otherwise it waits.
- **Speed (Lighthouse 12.6.1, local, compressed):** desktop 100/100/100/100; mobile 98.

## 2026-11-10: fourth pass, a real 3D fall and the arrival

Abhishek's notes: the fall must be long (2,000px or more) and look like a real 3D wormhole, with our character falling in it; at the end of the wormhole, Lusion's sequence: a new place, glass that breaks, a jump, a fall into the contact section, then coming toward us and waving (4 seconds falling, 3 coming toward us); the contact section should get the hero's dot field; the stages should tilt in 3D with the pointer; scrolling should feel like gsap.com.

- **Scroll:** GSAP 3.13 with ScrollSmoother (smooth 1.8, effects on), as gsap.com uses, on mouse and trackpad. Touch keeps native momentum. Lenis removed.
- **The fall (scene.js, pinned for 10 screens, at least 4,000px):** a real 3D scene. About 9,000 stars around the path; the wormhole is a glass sphere that refracts another sky, with a lens pass that bends the stars behind it, a photon ring, dotted rings and spirals of particles flowing in. Through it, a tunnel of wobbling line rings. Out the other side, a warm corridor of line arches lit from the far end, and a pane of glass. The human (the logo's MarkBody, drawn each frame onto a card in 3D) falls just ahead of the camera the whole way, reaches the glass, which shatters toward us, and drops through.
- **Contact:** the hero's dot field in cream on black. The human arrives on a clock, not the scroll: 4 seconds falling in, 3 seconds turning to face us and coming closer, then he floats and waves, in orange behind the headline. It replays each time the section is reached from above.
- **Tilt:** the reel, loops, fall and contact stages lean a few degrees with the pointer.
- **The walker** steps aside when the fall begins; the falling figure takes over from there.
- **Speed:** below-the-fold setup (all scroll triggers) waits for the first scroll, pointer, touch or key, like three.js. Lighthouse 12.6.1, local with compression: desktop 100/100/100/100 (LCP 0.5s, TBT 0ms); mobile 98 to 99 (TBT 60 to 90ms).

## 2026-11-10: third pass, into space

Abhishek's notes: the design board's lines should run at angles; the portal should be real space, Interstellar-like, with stars that bend and stretch near the wormhole; a very long, heavy scroll; the logo's human falling through it like Lusion's astronaut; the section moved after Process, leading into a Lusion-style contact section with hover effects; fine, igloo-like lines; a smoother process line; the design board should split like a slash under the cursor and reassemble.

- **Order:** hero, reel, about, two loops, work, services, team, process, into space, contact, footer.
- **Design loop:** the board is turned and tipped in 3D, so the grid, spiral and loop run at angles. Moving the cursor across it cuts it along the path (each side pushed apart), and it pulls itself back together.
- **Into space (pinned for 650% of the viewport):** one full-screen shader: four layers of stars and a galaxy band on black; a wormhole that bends the light round it (stars near it smear and wobble), a photon ring, fine dotted rings whose dots stretch into lines with scroll speed; a brighter sky inside. Then the hole fills the screen and you rush through it as star lines and rings.
- **The falling human:** the logo's own posable body (`MarkBody`, copied to `assets/js/figure/` from the kit), tumbling with arms and legs drifting, drawn with an 8-per-second boil, with speed lines behind him; stretched toward the hole as he falls in.
- **Contact:** black, like the space before it: a big centred line with drawn underlines, the kit's line drawings (copied to `assets/img/lines/`) floating at different depths, leaning away from the pointer and turning orange on hover.
- **Process:** a thick gradient ribbon drawn over a dotted track with a dot at its head, from the path's real length (no non-scaling stroke, which caused the glitch); each step lights up as the head passes.
- **Weight:** Lenis lerp 0.06; scrubs of 1.6 to 2; parallax on headings, statement, cards, portraits and steps; lists lean with scroll speed and settle.
- **Speed (Lighthouse 12.6.1, local with compression):** desktop 100/100/100/100, LCP 0.4s, TBT 0ms; mobile 95 to 99.

## 2026-11-10: second build, an agency home page with three.js

Abhishek's feedback on the first build: too basic; needs a primary CTA; built like an agency (AI and design) without saying who does what; scroll-driven three.js like igloo.inc and lusion.co; vectors; the walker should talk; better type colour hierarchy; image slots as fill boxes; load as fast as lusion.co.

- **Order:** hero, reel, about (statement), two loops, portal, work, services, process, team, contact, footer.
- **Hero:** two-tone Canela headline, primary CTA "Start a project" (magnetic), a services marquee. The dot field now has three rings of dots flowing round a loop with the logo's 30-degree opening at eleven o'clock; the walker stands on top.
- **Reel (three.js):** a card that unrolls like a carpet as you scroll, then opens to full screen; PLAY and REEL part around it. Fill box until the video arrives (swap the CanvasTexture in `scene.js` for a VideoTexture).
- **Two loops (three.js, pinned):** one cloud of dots: a sphere of nodes joined by lines (AI), which scatters and settles into a golden spiral, a grid of thirds and a loop (design).
- **Portal (three.js, pinned):** a picture grows to full screen, then you fall through a tunnel of wobbling line rings, Interstellar-style. The wobble grows with scroll speed.
- **Vectors:** each service has a small line drawing that draws itself on scroll and again on hover; a line runs through the process steps as you scroll.
- **Walker:** says a line when it lands (`data-say` on each perch), for Abhishek to review.
- **Type colour hierarchy:** ink for display, tone `#9A8571` for the quieter half of a display line (large text only), brown for body, muted for meta, orange only for marks and states. See the header of `home.css`.
- **Copy:** draft copy by Claude is marked `class="draft"` in `index.html`, for the humans to rewrite.
- **Speed:** HTML, CSS and two fonts are all that block first paint (about 59 KB compressed). GSAP, ScrollTrigger and Lenis are deferred (about 56 KB). three.js r160 (about 166 KB, from jsdelivr) and `scene.js` load only on the first scroll, pointer move, touch or key press, so speed tests, which never interact, never load them. This is how lusion.co scores well: the page that is measured is a light static shell, and the 3D arrives after it.

## 2026-11-10: first build of the home page

- `index.html`, `assets/css/home.css`, `assets/js/home.js` replace the earlier landing draft (`hil.css`, `hil.js`). Sections follow the IA: hero, about, loops, featured work, journey (placeholder copy), team, CTA, footer.
- Body font stand-in: **Outfit** (SIL OFL), self-hosted in `assets/fonts/`, until Mazzard arrives. Swap it in `home.css`.
- GSAP 3.12.5 with ScrollTrigger and Lenis 1.1.13 are served from `assets/js/vendor/` (licences in its README).
- Dots become lines: the hero's dot field stretches under the pointer and when scrolling; loop rings are dotted and stretch into dashes on hover; the journey track fills from dots to a line as you scroll.
- Images still needed from Abhishek, by keyword: the three project cards (voice AI call centre; video interview with an avatar; server room and on-prem documents), and portraits of Sahil and Abhishek.
- Placeholder copy (dotted underline in the page): the "What we do" section and the agency CTA.

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
