# Night log, 16 to 17 October

What was made overnight, and why. Everything is on the collection page:
`kit/index.html` (Films, "The idea" first). Nothing went to the site.

## The brief

Films that carry the site's idea and the logo's meaning. The meaning comes from the logo's own Stories chapter, so
the films don't invent a new one:
- human-in-loop.dev: many loops, each kept by one human who follows a field closely and posts what changed.
- The outer loop is the field. The arms hold it from inside in its own shape: in sync. The head is attention. The
  legs stand on the field, and in the fall ride it. One wedge opens all three at eleven: one way in, the eleventh
  hour.
- Loops look different; lines are what they share. The o's are eyes: someone is paying attention.

## Films

1. **Keeper** (30 s, paper): what the mark means. The site's own hero picture (a tunnel of lines, a human on the
   cliff edge) set moving. Eleven clock ticks; he dives in. The rings stretch into streamlines and part round him.
   The pressure draws his loop from the front round both sides, meeting at the back, so the opening is the wake at
   eleven. He lands on its curve and rides it (the legs, as you described them: surfing the loop). The wind sweeps
   his arms back (elbows first), then bends them into the loop's shape. The field settles into rings round him.
2. **Loops** (32 s, ink): what the site is. One keeper in the AI loop casts a line out through the opening. The dark
   is full of empty loops, openings in step. Keepers drop in; each field is drawn its own way (a grid, ripples,
   hatching, waves, cells, a spiral, contours). Lines join them and carry posts. The mark's gesture runs from keeper
   to keeper.
3. **Open** (28 s, ink): the reader's side. Noise everywhere, one calm kept loop. His head ring becomes an eye and
   looks at you; he beckons; the camera goes in through the opening and the noise falls away.

## How they are made

- `field.js`: every background line is a contour of one scalar field, the way the site draws its line fields.
  Blending fields morphs the lines (tunnel to streamlines to rings).
- `markbody.js`: the mark's own body, used by the logo films (both approaches you gave for the arms).
- `web.mjs`: line fields compress badly; page copies are two-pass encoded under 14 MB. The full-quality renders are
  in `video/out/` (`keeper.mp4` is 59 MB).

## Open questions for you

- The "eleventh hour" is only touched in Keeper (eleven ticks). There may be room for a film about it alone, but you
  once called landing copy built on the brand stories "stupid", so I kept it light.
- Loops shows other kinds of loops (grid, ripples...) as placeholders for future keepers' fields.

## Section loops (page v9)

Three 10 s silent loops for playing on repeat behind a section (`film-heroloops.js`). Each ends where it began: the
rings move exactly whole steps, the noise travels round a circle in its own space, and the boil repeats.
- **Kept**: the mark in calm rings that drift outward (paper).
- **Edge**: the site's tunnel of lines with him on the cliff edge, breathing (paper).
- **Island**: a field of noise around one kept, calm loop (ink).
Page copies are 5.4 MB each (`node web.mjs <film> --mb 6`). Renders use `render.mjs <film> --silent`.
The tunnel field had a faint seam along one line (an angle term that jumped at 180 degrees); it is fixed in both the
loop and `film-keeper.js`, but Keeper has not been re-rendered since the fix.

## Morning notes, 17 October: Fall and Constellation

Your notes: the idea films still did not make enough sense; Open is bad (it turned his head into an eye); the cliff
idea is good, but the loop must already be there and he must go into it, not have it form round him; after that it
should keep falling into the site's meteor, not settle into calm rings, and the arms need a real reason to round;
the lines in Loops are random, and placed right they could draw something. Two new films; nothing was deleted.

- **Fall** (34 s, paper, `film-fall.js`). The loop sits at the heart of the tunnel of lines from the first frame,
  its opening going round an hour a tick, like a clock hand. At eleven he runs and jumps; the arc of the jump meets
  the 30 degree line at the opening, so he goes in feet first by the one way in. He lands on the inside of the curve
  at five o'clock and slides down into the stance (front foot stays up the curve, back foot slides down: the legs
  come from the landing). The knock starts the loop falling down the line. He surfs: balance, a carve (the loop
  rolls under him), a hop, a hand trailed on the wall, a fist. The flow lines outside wrap into the site's meteor:
  the six dashed trail lines, widths and dash timing taken from the 404 page's own SVG, and its 70 streaks. Then the
  loop rocks and shakes and throws him about; he reaches up (elbows bent), further (arms straight, toward the
  walls), and the straight arms bend round inside the loop in its own shape. The rocking stops as they close: the
  reason for the arms is to steady the loop by holding its shape from inside. The ending is the site's fall.
- **Constellation** (34 s, ink, `film-constellation.js`). Loops, with the loops placed on the lines of the mark: six
  on the head ring (the AI loop at its top), one at the heart where the arms leave the spine, five along the front
  arm, three along the back arm, the feet on the outer loop, and the outer loop both ways from the feet up to the
  opening. The line from the AI keeper runs on like a fuse along those paths, and a keeper drops into each loop as it
  arrives. Pulled back, the lines between the keepers draw the mark, and no line crosses the three openings at
  eleven. Each keeper then raises his arms into the mark, in a wave in the order the line reached them, and the
  brush mark shows faintly behind.

Small changes: `markbody.js` can now squash the head ring with the body (`root.squashHead`, used only by Fall as he
zips through the opening); `web.mjs` takes `--mb` and `--w`; `audio.cjs` has a `buffet` sound.

## Arrival, and the cycle (page v14)

You liked Fall and asked for where the 404 page's meteor lands. `film-arrival.js` (46.6 s) starts on Fall's last
frame and ends on its first: rocks dodged along the 11-to-5 line, a ringed planet going by, the telescope and the loop
it shows on a far planet, the planet coming up from five o'clock, the dive turning straight down, the loop burning
back from the opening until he stands on nothing, the drop onto the flat planet (Fall's cliff top), getting up and
dusting off, the walk right, the edge, and the new loop ticking round to five. `out/cycle.mp4` (78 s) is Fall from
1.0 s then Arrival; on repeat it never ends. Also on the page: Open, again (Open without the eye), and the
Constellation still as a section background.
