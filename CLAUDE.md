# Branch rules

- All work happens on branches named `abhishek-*`. The base working branch is `abhishek-main`, created from `main`.
- Start new work by branching from `abhishek-main` (e.g. `abhishek-<topic>`), or commit directly to `abhishek-main`.
- Never commit to, push to, or merge into `main` (or any branch not prefixed `abhishek-`). Changes reach `main` only through a pull request that a human merges.
- A local `pre-push` hook (`.git/hooks/pre-push`) rejects pushes to any branch not named `abhishek-*`. Do not bypass it with `--no-verify`.

# Design rules

Copied from the "Rules" section of `experimental-assets/DESIGN.md`. The branch rules above stay in force.

## The two constants

1. **The logo.** A hand-drawn stick figure in a loop. Use the files in `assets/img/` (`logo.svg`, `favicon.svg`, `wordmark.svg`) or generate from `tools/logo/logo-gen.cjs`. Never redraw it, restyle its shape, or replace it. Its colour is free: each loop's keeper can colour it however they want for their loop, in any colour or a mix. It belongs to Sahil Tomar, and keepers use it by Sahil's permission. Before any work that touches the logo, refer to the logo page, `experimental-assets/pages/marks.html` (its text is in `experimental-assets/pages/marks.md`). Full notes are in `experimental-assets/DESIGN.md`, section 2.
2. **The design idea.** Everything is made from lines. The logo is lines, and so is whatever grows from it.

Nothing else is fixed.

## Abhishek decides everything else

- Colours, fonts, type sizes, layout, spacing, motion and mood are Abhishek's choices. Ask Abhishek. Do not choose for them and do not fall back on a safe default.
- Before designing anything new, find out what Abhishek has in mind. Show real options, wait for a pick, then build.
- Past work is reference, not precedent. The AI loop's black and off-white, its contour fields, topologies and dashes, its fonts and its stick-figure films are one person's reading of the idea. Do not copy them forward unless Abhishek asks for that.
- Keep the idea wide. A line can be a brush stroke, a pencil mark, chalk, thread, wire, a scribble, a dash, a light trail; thick or hair-thin; any colour; neat or rough. Do not narrow "lines" to whatever was done last.
- If a request seems to break a constant, say so and raise it with Sahil before going ahead.

## Words

- Copy comes from people. Do not invent, rewrite or polish site copy. Use placeholders, or ask.
- No emoji anywhere, in pages, assets, code comments or commit messages.

## Assets

- `assets/` holds the functional assets the live site uses. Do not put experiments there.
- `experimental-assets/` holds everything extra: drawings, films, loops, trials, saved pages. New experiments go there and get a link from `experimental-assets/index.html`.
- To use an experimental asset on a page, copy the file into `assets/`. Never link a page to `experimental-assets/`.
- Anything from outside (3D models, fonts, textures, images) needs a licence that allows it. Record its source and licence in the file header, or next to the file, and give the credit the licence requires.

## Abhishek's rules

Set by Abhishek on 2026-11-09. Decisions taken so far are in `experimental-assets/DECISIONS.md`; read it before designing.

1. Follow UX concepts and laws (for example Fitts, Hick, Jakob, Miller, proximity, the aesthetic-usability effect). Name the law when it drives a decision.
2. Design an experience, not a landing page or a website. Conversion matters, and so does the story: every section's design, typography, animation and colour should carry the narrative forward.
3. Minimal, professional, with a slight touch of luxury.
4. Performance comes first. Pages should load in under a second and score top marks. Prefer WebP images, subset and preload fonts, and add no script that does not earn its weight.
5. Humour is part of the experience. Claude writes the hover lines and other small jokes: short, human, the kind that makes someone smile because they recognise it (for example "So much experience :O" on a resume button). This is the one exception to "Copy comes from people" below; Abhishek reviews every line. Headlines and body copy still come from people.
6. Images come from Abhishek. When a page needs one, ask for it with a short keyword or brief, and he supplies a WebP file. Do not use stock or generated images in its place.

## The site floor

The design is free, but these engineering requirements still hold. Details are in `experimental-assets/DESIGN.md`, section 9.

- All content stays as real text in the raw HTML and reads with JavaScript off. No text inside images.
- Keep every page's head tags, JSON-LD, `.md` mirrors, `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml` and URLs.
- The deployed output is static HTML with no build step on the site. A framework needs agreement first.
- Respect `prefers-reduced-motion`. Keep focus visible, contrast at WCAG AA and alt text on images.

# Logo and design

- Read `experimental-assets/DESIGN.md` before designing anything. Two things are constant: the logo, and the idea that everything is made from lines.
- Refer to the logo page, `experimental-assets/pages/marks.html`, before any work that touches the logo. It shows the three marks, what every part means and how each was made. The file is large, so read its text in `experimental-assets/pages/marks.md`, and look at the page itself through a local server for the drawings.
- Mark A, Three Loops, is the main logo. Use the files in `assets/img/` and never redraw it. Its shape is fixed. Its colour is up to each loop's keeper: any colour or a mix. The loop colours on the logo page are mock-ups.
