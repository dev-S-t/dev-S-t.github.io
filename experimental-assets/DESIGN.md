# Human in Loop: design brief

For Claude, working with Abhishek. Read all of it before designing anything.

Abhishek is joining human-in-loop.dev as the keeper of the UI/UX loop. The first job is the landing page, on `abhishek-landing`. Sahil keeps the AI loop and wrote this brief with Claude.

There are two constants: **the logo** and **the idea that everything is made from lines**. Everything else belongs to Abhishek, including colour, type, size, layout, motion, mood, and what a line even is.

Most of this file explains how past work was done, so you can use the methods. It does not describe how the new work should look.

---

## Rules: copy this section into CLAUDE.md

Copy the subsections below, down to the next horizontal rule, into the repo's `CLAUDE.md`, below the branch rules that are already there. Those branch rules stay in force.

### The two constants

1. **The logo.** A hand-drawn stick figure in a loop. Use the files in `assets/img/` (`logo.svg`, `favicon.svg`, `wordmark.svg`) or generate from `tools/logo/logo-gen.cjs`. Never redraw it, restyle its shape, or replace it. Full notes are in `experimental-assets/DESIGN.md`, section 2.
2. **The design idea.** Everything is made from lines. The logo is lines, and so is whatever grows from it.

Nothing else is fixed.

### Abhishek decides everything else

- Colours, fonts, type sizes, layout, spacing, motion and mood are Abhishek's choices. Ask Abhishek. Do not choose for them and do not fall back on a safe default.
- Before designing anything new, find out what Abhishek has in mind. Show real options, wait for a pick, then build.
- Past work is reference, not precedent. The AI loop's black and off-white, its contour fields, topologies and dashes, its fonts and its stick-figure films are one person's reading of the idea. Do not copy them forward unless Abhishek asks for that.
- Keep the idea wide. A line can be a brush stroke, a pencil mark, chalk, thread, wire, a scribble, a dash, a light trail; thick or hair-thin; any colour; neat or rough. Do not narrow "lines" to whatever was done last.
- If a request seems to break a constant, say so and raise it with Sahil before going ahead.

### Words

- Copy comes from people. Do not invent, rewrite or polish site copy. Use placeholders, or ask.
- No emoji anywhere, in pages, assets, code comments or commit messages.

### Assets

- `assets/` holds the functional assets the live site uses. Do not put experiments there.
- `experimental-assets/` holds everything extra: drawings, films, loops, trials, saved pages. New experiments go there and get a link from `experimental-assets/index.html`.
- To use an experimental asset on a page, copy the file into `assets/`. Never link a page to `experimental-assets/`.
- Anything from outside (3D models, fonts, textures, images) needs a licence that allows it. Record its source and licence in the file header, or next to the file, and give the credit the licence requires.

### The site floor

The design is free, but these engineering requirements still hold. Details are in `experimental-assets/DESIGN.md`, section 9.

- All content stays as real text in the raw HTML and reads with JavaScript off. No text inside images.
- Keep every page's head tags, JSON-LD, `.md` mirrors, `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml` and URLs.
- The deployed output is static HTML with no build step on the site. A framework needs agreement first.
- Respect `prefers-reduced-motion`. Keep focus visible, contrast at WCAG AA and alt text on images.

---

## 1. The website

human-in-loop.dev is **a place of many loops**. Each loop is kept by one human who follows a field closely (AI, UI/UX, security, and more to come) and posts what changed and what they make of it. A loop page is also that human's portfolio.

This is not the "human approves the AI's output" meaning of the phrase. A loop is a field being watched, and the human is the one who keeps watching it. The site calls people "humans".

Loops may look different from each other. The line is what they share. So the UI/UX loop should not look like the AI loop unless Abhishek wants it to, and the landing page belongs to neither.

### Branches and pages

| Branch | What it is |
| --- | --- |
| `main` | The live site. Today the root is Sahil's AI loop and resume. |
| `abhishek-landing` | Start here. It is the landing draft plus the branch rules: the landing page at `/` and the AI loop moved to `/ai/`. |
| `abhishek-main` | `main` plus the branch rules. It has no landing draft. |

The landing page does not go to production until the other loops are ready. Sahil decides when.

### The landing draft

Files: `index.html`, `assets/css/hil.css`, `assets/js/hil.js`, `tools/landing/` (generators for its drawings: `art.cjs`, `type.cjs`). These exist on `abhishek-landing` only.

- It is a first draft by Claude, and nothing in it is settled, including its colours, its fonts (Newsreader and Martian Mono), its sections and its words. Ask Abhishek what to keep.
- The rough outline so far: hero, about us, a view of the loops, featured work, team, footer.
- Its copy is placeholder quality. Sahil rejected earlier landing copy built from brand stories. Direction and content should be agreed with the humans before sections are built out.
- Sahil has wanted the landing to have its own identity rather than a copy of the AI loop's look (its line scenes, its paper-and-ink palette, its fonts, nav and loader).

### Things Sahil has asked for across the site

These are Sahil's preferences, not constants, and Abhishek can overrule them. They are mainly useful as a warning about Claude's own habits.

- **The site must not read as AI-built.** Watch for these defaults: one centred column with empty sides, the usual font pairings, purple or blue gradient heroes, glassmorphism, uniform grids of rounded cards with soft shadows, icons in circles, pill badges, small uppercase labels above every heading, a big headline with two buttons, and the same treatment on every section. If you notice yourself reaching for one of these, stop and ask.
- **Sections are designed individually.** Share a reset and tokens, but let each section have its own design and keep its styles self-contained.
- **Responsiveness is per component.** Every part uses the space it gets at each width. Avoid a fixed container floating in blank margins on a wide screen.

---

## 2. The logo

Constant one. A hand-drawn stick figure in a loop.

| File | Use |
| --- | --- |
| `assets/img/logo.svg` | The mark in full detail, filled with `#0D0D0C`. |
| `assets/img/favicon.svg` | The mark drawn bolder, on a paper disc. |
| `assets/img/wordmark.svg` | The lettering "human in loop". It uses `currentColor`. The o's of "loop" are eyes; the landing draft moves their pupils with the pointer. |
| `assets/img/mark-stamp.svg` | A stamp concept kept for later. Not in use yet. |
| `tools/logo/logo-gen.cjs` | The generator. Exports `svg({ weight, texture, id, attrs, title, samples, decimals })`, `favicon`, and the stroke builders `arc`, `profile`, `outline`, `streaks`, `figure`. `tools/logo/README.txt` has notes. |

### What it means

Sahil's sketch was the start of it. The brush strokes keep the marks of a hand.

- **Outer loop:** the field. It is the heaviest stroke.
- **Middle ring:** the arms, holding the loop from inside in its own shape.
- **Inner ring:** the head, meaning attention.
- **S-shaped spine:** movement and joy. A person, not a pictogram.
- **Legs on the loop:** the human stands on the field. In the fall, the human rides the loop like a surfboard.
- **The opening:** one wedge cut through all three rings at eleven o'clock, exactly 30 degrees. That is one hour on a clock face: the eleventh hour, with humans still watching. It is also the one way in, because every loop stays open to readers.
- **Dry-brush streaks and round ends:** a hand made this.
- **Drawing order, if it draws itself:** loop, arms, head, spine, legs.

### What can and cannot change

- **Fixed:** the shape, its proportions and the opening. Do not redraw it, trace it, tidy it, or rebuild it in another style.
- **Allowed:** animating it. The figure may fall, walk, wave or draw itself on. Wherever the mark itself appears, it is the real mark. `experimental-assets/kit/video/mark.js`, `markbody.js` and `markfig.js` hold the mark as data and a posable body for this.
- **Not settled: its colour on a coloured page.** So far it has only appeared as ink on paper and paper on ink. If Abhishek's palette raises the question, ask Sahil rather than deciding it here. To recolour for a test, generate it or swap the fill; do not alter the paths.

---

## 3. The design idea, and how wide it is

Constant two. **Everything is made from lines.** The logo is a hand-drawn line figure in a hand-drawn line loop, so the rest of the site is drawn with the same kind of thing.

The idea is deliberately very wide. Sahil's words on it are hints rather than a specification, so don't turn them into one.

A line can be:

- **A material:** brush, dry brush, pencil, charcoal, chalk, ink, crayon, marker, thread, string, wire, neon, scratches in a surface, stitches, cracks, light trails, tracks in snow.
- **A weight:** one hair, a fat stroke, a stroke that swells and dies away, a mix of all of them.
- **A rhythm:** continuous, dashed, dotted, broken, doubled, scribbled.
- **A colour:** any colour, one or many, flat or changing along its length.
- **A character:** careful or careless, ruled or shaky, calm or wild, childlike or engineered.
- **A structure:** a single stroke, a contour map, a weave, a tangle, hatching, a spiral, a grid, a flow, a growth pattern, or something nobody has named.

And a line can do any job on the page:

- Letters drawn from strokes, or a typeface chosen because its strokes suit the page.
- Rules, borders, underlines, cursors, focus rings, buttons and form fields.
- Charts, icons, illustrations and maps.
- Shading and tone built from hatching, or a page's texture.
- Transitions and loaders, where a line travels instead of a box fading.
- 3D objects described by lines.

**How "everything" plays out on a real page gets worked out with Abhishek.** A flat colour might serve as ground for lines, or every edge might be drawn. If something on the page is not made of lines, such as a photo or a solid panel, ask how it should sit with the idea.

### What has been done so far

This is one reading, by one keeper, for one loop:

- Black `#0D0D0C` and off-white `#F3F1EC`, because the AI loop is about both readings of where AI is going.
- Contour fields, topologies, dashes and fingerprint-like streamlines.
- Engraved 3D heads and hands, and a stick-figure cast in short films.

The earlier decision log (`experimental-assets/pages/line-design-system.html`) and the AI loop's page mention "two colours a loop". That does not bind this work. **Any colour is open now.**

If everything you propose looks like the examples above, you have narrowed the idea. Try at least one direction that shares nothing with them except being made of lines and carrying the logo.

---

## 4. First session with Abhishek

Do this before designing. Keep it a conversation, a few questions at a time.

1. Show them `experimental-assets/index.html` and ask them to react: what do they like, what do they not, and why?
2. Ask what they want the UI/UX loop and the landing page to feel like. Ask for references: sites, painters, posters, films, objects, anything.
3. Ask about lines. What does a line look like to them? Which materials, weights and rhythms come to mind?
4. Ask about colour and type. Do they have a palette or a typeface in mind, or do they want to see options first?
5. Ask what to keep from the landing draft and what to drop. Do not assume any of it stays.
6. Ask how "everything is lines" should play out on a real page.

Then:

- Offer two or three truly different directions as small working samples in the browser. They should differ in idea, not only in colour. Each one uses the real logo and is built from lines.
- Save the samples in `experimental-assets/` with a link from `experimental-assets/index.html`.
- Wait for a pick. When feedback arrives, change what was asked for and leave the rest alone. If a screenshot is marked up, read the marks literally: what to keep, what is wrong, what is new.
- Write down what was decided in `experimental-assets/` (a short `DECISIONS.md` is enough) so the next session starts from it.

Treat a plain "no" as useful information. Don't defend a design; make the next one.

---

## 5. Where things are

Open `experimental-assets/index.html` through a local server (see section 9).

```
assets/                           Functional assets: what the live site uses
assets/js/lines.js                The AI loop's WebGL line engine
assets/js/models.js               3D models drawn in lines
tools/logo/                       The logo generator

experimental-assets/
  index.html                      Start here: links to everything
  DESIGN.md                       This file
  kit/index.html                  The collection, with previews of every asset and film
  kit/manifest.json               Every asset with size, note and files
  kit/backgrounds/                Section backgrounds, as SVG
  kit/animations/                 Small looping SVGs
  kit/figures/ objects/ dividers/ Everyday vector drawings, as SVG
  kit/stories/                    Short illustrated stories, as SVG
  kit/films/                      Short films and seamless loops: film-<id>.mp4 and a .jpg poster
  kit/src/                        Generators for all of the SVGs
  kit/video/                      Film sources and the render pipeline
  kit/video/STORYBOARD.md         How the first films were planned
  kit/video/NIGHT-LOG.md          A log of why films were made and what was learned
  pages/marks.html                The logo's explorations and its stories
  pages/line-design-system.html   The AI loop's decision log
  pages/line-type-lab.html        An interactive tool for trying fonts over a line field
```

The films in `kit/films/` are compressed web copies, mostly 1080p, each under about 15 MB. The large master renders are not stored, because they can be regenerated from `kit/video/`.

### What Sahil thought of the existing work

Use these as clues about taste. They are not rules for the new work.

- **Liked:** the Loop (fingerprint) background and Strings; the figure animations; the films The Gap, Strings and Uphill; Showtime and Storm; Fall, the first logo film Sahil felt made sense; Starry Night.
- **Liked with fixes wanted:** Arrival, which was rushed from telescope to landing (Arrival v2 is the attempt to fix that); Loops, a brilliant idea whose connecting lines looked random.
- **Rejected:** First Light and Firefly (their films are left out, though the source files remain); Open, where the head became a big eye; a Fall background, a spinning-rings loader, a Speaking animation and a waveform voice object; a double-spiral Starry III (rebuilt since).
- **No verdict yet:** Constellation, Open again, Eyes, Keep Up, Both Readings, Stuck, the section loops, the rebuilt Starry III.

The quality bar for drawn assets on the AI loop was the UniBias eye (`projects/unibias/`): a drawing that tracks the pointer, blinks and means something. Not everything needs an asset, but an asset should have a reason to exist.

---

## 6. Making fluid video and animation

Pick the lightest medium that does the job:

| Need | Use |
| --- | --- |
| Small loop, icon, loader, line drawing itself | SVG with CSS animation |
| Reacts to pointer or scroll, or a live field of lines | Canvas 2D or WebGL |
| Story with sound, or something too heavy to run live | A film, rendered with the pipeline below |
| Section background that repeats | A seamless film loop, muted, with a poster |

### The film pipeline

Everything is in `experimental-assets/kit/video/`. You need Node 22 or newer, Chrome and ffmpeg. `where.mjs` finds them on the PATH or in the usual install places, and the environment variables `CHROME`, `FFMPEG` and `FFPROBE` override it.

**The method: a film is one pure function of time.** `draw(ctx, t)` paints the whole frame for time `t`, from nothing, with no state carried between frames. This is why the motion comes out fluid. Any frame can be rendered alone and in any order, nothing drops out because a machine was slow, and the sound lines up exactly because it reads the same timeline.

```bash
cd experimental-assets/kit/video
node render.mjs fall --sheet 0:24:1
node render.mjs fall
node web.mjs fall --mb 6 --w 1600
```

- `render.mjs <film>` writes `out/<film>.mp4`. Headless Chrome draws each frame of `player.html` and pipes it to ffmpeg, along with the sound.
- `--sheet a:b:step` or `--sheet 0,1.5,3` writes a contact sheet. Options: `--cols`, `--w`, `--tag`, `--crop x,y,w,h`, `--from`, `--to`, `--silent`.
- `audio.cjs <film>` synthesises the sound from the film's cue list (footsteps, plucked strings, bells, whooshes, a pad, a hall reverb). `render.mjs` runs it for you; run it alone to redo only the sound.
- `web.mjs <film>` makes a compressed copy for the web in two passes. Its default 14 MB ceiling existed only because of an artifact size limit, so choose whatever suits the page.
- Renders go to `video/out/`, which is not committed.

**To make a new film:**

1. Write `film-<id>.js` in the same module form as the others. It registers `root.Films.<id>` and returns `{ id, title, W, H, fps, dur, theme, draw, events }`. `film-stuck.js` and `film-gap.js` are small ones to start from.
2. Add a `<script>` tag for it to `player.html`.
3. `events()` returns the sound cues as a sorted list with times. Use `--silent` if there is no sound.

To change the look, change `THEMES` in `ink.js` or pass your own colours and brush. Black and off-white, the stick figure and the boil are in those files only because the AI loop used them. Replace them freely: the method does not depend on them.

**Supporting pieces, all optional:**

- `rig.js`: a skeleton with fixed bone lengths and two-bone IK, so planted feet never slide. Walking and running are driven by distance travelled.
- `ink.js`: themes, noise, a brush ring, a camera, the hand-drawn boil.
- `field.js`: lines as contours of a scalar field `F(x, y)` by marching squares. Change the function and the lines follow, so a tunnel of rings can stretch into streamlines and curl back without anything being drawn by hand.
- `film-heroloops.js`: seamless loops, for section backgrounds.

**Seamless loops:** everything that moves completes whole cycles within `dur`. Rings advance exact whole steps, noise travels around a circle in noise space, and the boil repeats. Check by comparing the first frame with the last.

### The working loop

1. **Write the story first.** Make a table of beats with times, what happens and why it is there, then get it agreed. `STORYBOARD.md` is the model.
2. **Review on contact sheets, not full renders.** Render a sheet, look at it, fix it, render again. Use `--from` and `--to` for one passage, and `--crop` for a detail. Render the whole film only when the sheet is right.
3. **Watch the actual film once it is rendered.** A sheet can't show pacing or sound.

### What Sahil's notes taught us about motion

These came from real rejections, and they hold for any style:

- **Give every beat breathing room.** Most failures were rushed passages. Stretch the time before adding anything.
- **A story needs a reason.** Something has to want something. Generic drift doesn't make a film. Things must arrive from somewhere rather than appear from nothing.
- **Big changes get their own stage.** Don't compress a change of scale into a cut. A planet should still read as a whole circle when the figure reaches its air, and only then should the camera move in.
- **Growth is smooth and accelerating.** Use a monotone curve, not jerky keyframes. Use `smoother` easing (or better), and give moves a wind-up and a follow-through.
- **Far things have no parallax.** A zoom needs to be tied to its subject, for example a reticle that searches, locks on and opens into a close-up.
- **Bodies keep their size and weight.** Bones don't stretch. Feet don't slide. Characters are never rigid: a slight S in the spine, and after an action they look around with intent.
- **No morphs into the logo.** Reach it through a believable action or a point-for-point blend. The head stays a head.
- **Use brush strokes of many sizes,** from very fine to bold, boldest near the subject and thinning away. Break up large uniform masses with patchy opacity, and let edges fade into the ground rather than cutting them with a hard mask.
- **Flows must connect.** Lines start from a source and bend gradually. Debug tangles by drawing the bare lines in different colours.
- **Don't reuse frames between films.**
- **Change only what was marked.** A note about one part is not a licence to redo the rest.

### Motion on the page

- **SVG and CSS:** the kit's `animations/` show this. Every file includes a rule that stops the animation for readers who ask for less motion: `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`. To make a line draw itself, animate `stroke-dashoffset`; to make a brush stroke do it, mask the filled shape with a growing stroke.
- **Live fields:** `assets/js/lines.js` paints every section's line field on one WebGL2 canvas behind the content, and respects reduced motion. Read it for technique, including how the content stays readable without it.
- **Video on a page:** muted, `playsinline`, `loop` for backgrounds, a poster image, lazy loading. For reduced motion, show the poster and do not play.
- **Never make content wait for animation.** Text is there from the first paint.

---

## 7. New 2D objects from lines

Anything can be made from lines in code. These are the methods used so far, in `experimental-assets/kit/src/` unless noted. They are starting points, not the set of allowed ones.

**A brush stroke** is a filled outline around a centre line, with its width varying along its length. `tools/logo/logo-gen.cjs` has the builders: `arc` for a centre line, `profile` for the width along it (with pressure at the start and a lift at the end), `outline` to turn both into a shape, `streaks` for dry-brush marks. A simple width profile that tapers nicely:

```js
const PROFILE = [[0, 0.7], [0.18, 1], [0.45, 0.88], [0.72, 0.55], [0.9, 0.22], [1, 0]];
```

**A figure or object:** `figure.cjs` draws poses as strokes, and `vectors.cjs` builds figures, objects and dividers.

**A field of lines:**

- `flow.cjs`: evenly spaced streamlines (after Jobard and Lefer). Give it a direction field and a spacing, and the lines keep their distance, like fingerprint ridges. The Loop background is made this way.
- `kit/video/field.js`: contour lines of any function. A shape described by a formula becomes lines automatically.
- `backgrounds.cjs`: section backgrounds built from these.
- `starry.cjs`, `starry2.cjs`, `starry3.cjs`: a scene painted from thousands of strokes, with weight following a boldness map, a ribbon of parallel lines rolling into spirals (`pitch = k * D` so the turns tile), patchy opacity, and edges softened by distance from the boundary.

**Other ways in:**

- **Tone from weight:** a picture can become lines by letting darkness drive line weight or hatching density.
- **Tracing:** an image or photo can be traced into strokes, if the licence allows it.
- **Hand wobble:** add low-frequency noise (`lib.cjs` has `sn` and `fbm`) so no line is mechanically perfect, if the design wants that.
- **Real hand drawing:** Abhishek can draw and scan or trace by hand. Lines from a human's hand are the point of the logo, so ask if that is wanted.

**To build the kit:**

```bash
cd experimental-assets/kit
node src/build.cjs backgrounds animations vectors stories
node src/page.cjs
```

`build.cjs` writes assets in paper and ink variants by default, or a single file with `themes: ['both']`. Colours are in `L.THEMES` in `src/lib.cjs`, and some files have their own `PAPER` and `INK` constants. Change them, or pass your own. Add the new asset to a list in `src/`, and `page.cjs` rebuilds the collection page.

---

## 8. 3D objects as lines

Earlier decision on the AI loop: use existing 3D models drawn in lines where possible, and 2D otherwise. That is a useful start, but open to change.

### Getting a model

Check the licence on the model's own page. Aggregators and search summaries can be wrong, and licences vary per model on some sites.

- **Poly Haven, Kenney, Quaternius, ambientCG:** generally CC0. GLTF or GLB downloads are common.
- **Smithsonian Open Access:** real scanned objects, many public domain.
- **three.js examples and webxr-input-profiles:** where the current head and hand come from. Head: Lee Perry-Smith, CC BY 3.0 (credit required). Hand: WebXR generic hand, MIT.
- **Sketchfab, Poly Pizza:** mixed licences, often requiring credit. Check every model.
- **Make one:** in Blender, or procedurally in three.js from geometry.

Record the source, author and licence in the file header, as `assets/js/models.js` does, and add any visible credit the licence needs.

Host the model in `assets/` or load it from a stable, versioned URL. Load it lazily. Provide a fallback, because the page must read without it.

### Drawing it in lines

**The engraving shader** (`assets/js/models.js`, three.js with `GLTFLoader` and a `ShaderMaterial`). The model is not rendered as a surface; a fragment shader decides where the lines go.

- Take a value that changes over the surface, for example distance from the eye: `v = vDepth * uDensity`.
- Draw a line where `fract(v)` crosses a level, using `fwidth` for an even width at any scale:

```glsl
float lineAt(float v, float fw, float wpx) {
  float d = abs(fract(v + 0.5) - 0.5) / fw;
  return 1.0 - smoothstep(wpx * 0.5 - 0.7, wpx * 0.5 + 0.7, d);
}
```

- Thicken the lines where the surface is lit, which gives tone with nothing but line weight.
- Add a rim from the view angle to hold the silhouette.
- Choose a different `v` for different families of lines. Depth gives contours, a single axis gives parallel lines bending over the form, and a texture coordinate or noise gives something else.

**Other routes:**

- **Edges:** `THREE.EdgesGeometry` gives a model's hard edges as line segments. It needs rebuilding if the geometry changes, and thick lines need fat-line geometry, which can poke through the surface.
- **Depth to contours to SVG:** render a depth map once, run marching squares on it (`kit/video/field.js`), and export static vector lines. No WebGL on the page, so it is light and works with JavaScript off.
- **Blender:** Grease Pencil Line Art or Freestyle can produce line renders of a scene. Check the current version's docs; this route has not been tried here.

The look is open too. Those lines can be brush-like, coloured, broken or scribbled.

---

## 9. The site floor and how to preview

This is engineering, not design. It stays whatever the design becomes, because the site is written to be read by machines as well as people.

- **Head tags on every page:** title, meta description, canonical, Open Graph, Twitter, and the markdown alternate link.
- **JSON-LD** in the same place, and it must parse.
- **Do not break:** `.md` mirrors, `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml`. Keep existing URLs.
- **Content as text in the raw HTML,** readable with JavaScript off. Semantic structure: one `h1`, real headings, lists and tables, `nav`, `main`, `footer`.
- **Static output.** GitHub Pages serves the repo as is (`.nojekyll`, so `_config.yml` is ignored), with no build step on the site. Generators such as `tools/` run on your machine, and their output is committed.
- **Quality:** visible focus, WCAG AA contrast, alt text, `font-display: swap`, reduced motion respected. Pages hold up on phones and on wide screens.

Plain technical language in whatever words the humans provide. No hype.

**Preview from the repo root:**

```bash
npx -y http-server -p 4321 -c-1
```

Then open `http://localhost:4321/`. The asset hub is at `http://localhost:4321/experimental-assets/`.

**Before pushing page changes:** check the head tags on changed pages, parse the JSON-LD, read the page with JavaScript off, and look at it at four widths (for example 375, 768, 1280 and 1920).

---

## 10. Housekeeping

- **The repo is public.** Anything pushed can be seen by anyone, so nothing private goes in it.
- **`experimental-assets/` does not go to `main` without Sahil's say.** It is about 250 MB, and because of `.nojekyll`, everything on `main` is served publicly. Before opening a pull request, ask Sahil how to handle this folder. Promoted assets get copied into `assets/` and go through with the page.
- **Keep files under 100 MB** (GitHub's limit) and keep generated output out of commits. `experimental-assets/.gitignore` already excludes `kit/video/out/`.
- **Saved pages are history.** `pages/line-design-system.html` is the AI loop's working doc. Read it for reasoning, and don't treat its rules as rules for this loop.
- **Add to this file** when something is learned that the next session would need. Keep the two constants as they are.
