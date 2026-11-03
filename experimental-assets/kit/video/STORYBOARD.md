# Films: storyboard

Three short films starring the figure. Rules we work to:

- No arms-into-the-mark morph, and no logo forming at the end. The ring is a world, a wheel, a harp frame: something
  he lives with, never something his arms turn into.
- Motion from the skeleton in `rig.js`: bones keep their length, feet stay planted, every move has a wind-up and a
  follow-through. Each film is one pure function of time.
- One ink, one paper. Hand-drawn boil (the lines re-drawn 12 times a second). No words on screen.
- 1920 x 1080, 30 fps, sound synthesised to the picture (`audio.cjs`).

---

## 1. The Gap (ink, 24 s)

Logline: he walks the rim of his ring-shaped world. At eleven o'clock the ring is open. He has to jump it, and he
is not the only one.

| time | shot | what happens | read |
|---|---|---|---|
| 0.0-3.6 | close, the camera rides with him | he walks the curved rim, stars drifting | a small world |
| 3.6-5.0 | close | the rim ends in front of him; he stops at the edge and leans over to look down | the gap |
| 5.0-6.9 | close | his toe nudges a pebble off the edge; it falls a long way into the dark (a long whistle, no landing) | how deep |
| 6.9-7.6 | close | he straightens up; a gulp | scared |
| 7.6-9.6 | close | he backs away, a few steps, still watching the edge | decides |
| 9.6-10.4 | medium | a step back into a crouch; rocks once; still | wind-up |
| 10.4-11.4 | medium, camera lags | sprint to the edge | commit |
| 11.4-12.6 | wider, slow motion at the top | the leap: arms up, legs trailing, the gap underneath | the moment |
| 12.6-13.4 | medium | lands, the knees take it, two stumbling steps, arms wheel, steady | made it |
| 13.4-15.4 | medium | turns round to look at the gap; a small fist; turns back | quiet pride |
| 15.4-17.4 | pulling back | walks on; the camera pulls away; his world is small | |
| 17.4-19.2 | pulled back | another ring nearby, another figure: it waves; he stops and waves back | not alone |
| 19.2-22.5 | pulling right back | dozens of ring worlds, each with its walker, and here and there one leaps its gap | many loops, each kept by someone |
| 22.5-24 | wide | hold; fade | |

Sound: a low pad, footsteps on the beat of the gait, the pebble's falling whistle, a whoosh and held breath over
the leap, a thump on landing, a small chime for the fist, soft plucks as each world appears.

## 2. Strings (paper, 24 s)

Logline: he walks into a row of taut strings, brushes one by accident, and finds out it sings.

| time | shot | what happens | read |
|---|---|---|---|
| 0.0-3.0 | wide | a row of strings floor to ceiling; he walks in from the left between them | |
| 3.0-4.4 | wide | his shoulder brushes one: a faint note. He stops, looks at it | curious |
| 4.4-6.4 | medium | he reaches up, pulls it aside, lets go: it rings and shivers | delight |
| 6.4-9.0 | medium | the next one, and the next: the notes go up | he gets it |
| 9.0-15.0 | tracking | he walks along plucking a tune, a small hop on the high note | playing |
| 15.0-18.5 | tracking, faster | he runs with his arm out and sweeps a whole run of strings: a glissando | joy |
| 18.5-21.0 | wide | he stops and turns: the whole field is ringing and settling | listens |
| 21.0-24.0 | wide | he sits down, leans back on his hands; the last chord fades; strings still | content |

Sound: plucked strings (Karplus-Strong) tuned to a pentatonic scale, low to high from left to right, so whatever he
plays is in tune. Light footsteps. A room reverb.

## 3. Uphill (paper, 24 s)

Logline: inside his wheel he tries to run up a hill, rolls back, takes a run at it, and crests it, and the way down
is faster than he can run.

| time | shot | what happens | read |
|---|---|---|---|
| 0.0-3.0 | tracking | the ring rolls along flat ground; he jogs inside it | |
| 3.0-6.0 | tracking | the slope starts; he leans in and runs harder; the ring slows, stops | effort |
| 6.0-8.0 | tracking | it rolls back; he is carried backwards, trips and sits; the ring rocks to rest in the dip | defeat |
| 8.0-10.0 | medium | he gets up, looks up the hill, turns and walks away from it | |
| 10.0-11.0 | medium | turns back: the run-up | resolve |
| 11.0-15.0 | tracking | sprints; the ring rolls fast down the dip and up the hill; slows near the top; teeters on the crest | will it |
| 15.0-18.5 | tracking | over: downhill the ring outruns him; he lifts his feet and goes round with it, a full loop inside his own ring | the loop |
| 18.5-21.5 | tracking | on the flat it slows; he lands on his feet, dizzy, finds his balance | |
| 21.5-24.0 | wide | walks on, the ring rolling away along the ground | onward |

Sound: footsteps inside a drum, the ring's low rumble rising and falling with its speed, a creak at the crest, a
rising whoosh down the hill, a bright note on landing.

---

# Films that end in the mark

What the mark is, as a body: a figure surfing the inside of its loop. The back foot is low, the front foot steps up the
curve, knees bent and bowed out, the legs and spine softly curved (never rigid sticks). Its arms are a ring round the
head, open at eleven like the head and the loop. A stick figure's arms are far too short for that ring, so a film
must give him a reason to get there, and the arms must move naturally:

- **Approach 1 (elbows):** two straight parts with a visible elbow reaching up over the head; reaching further, over
  the top; then the elbow's angle goes and the straight parts bend round into the ring.
- **Approach 2 (the Reach story's good moment, reversed):** the arms rise in front of his face, point for point, into
  the ring.
- The legs are never morphed: they get there by stepping up or by balancing on a moving curve.

`markbody.js` is that body: the mark's proportions (big open-ring head, soft S spine, short bending legs), arms with
elbows that can round off into one arc of the same length, and the mark itself as one of its poses. The first try at
this (First Light, Firefly) grew the arms along the circle and morphed the legs at the end; Sahil rejected both.

## 6. Showtime (ink, 24 s): approach 2

Logline: a human cannonball act. He flies into the ring through its opening, lands in a heap, surfs it while it
rocks, and finishes with TA-DA.

| time | what happens | read |
|---|---|---|
| 0-3 | spotlight; he bows | showman |
| 3-4 | points across at the ring; its spotlight comes on | the target |
| 4-5.3 | hops up and dives head first into the cannon | |
| 5.3-7 | a hand waves from the muzzle; the fuse burns; drumroll | |
| 7 | BOOM | |
| 7-8.6 | a high arc across the tent | |
| 8.6-9 | squeezes in through the opening at eleven; SPLAT on the far wall | comedy |
| 9-10.5 | slides down into a heap; the ring rocks on the floor | |
| 10.5-15.5 | gets up and surfs the rocking ring, feet planted where the mark's are, arms going round for balance; a near fall | the legs, earned |
| 15.5-17.2 | the ring settles, opening at eleven; a breath; TA-DA, arms up in front of his face into the ring; cymbal | the mark |
| 17.2-24 | applause, confetti; the brush mark | |

## 7. Storm (paper, 24 s): approach 1

Logline: a cloud parks over the opening, and the ring keeps the rain out everywhere else. He tries to cover his head
with arms too short for it, until they make an umbrella, just as the rain stops.

| time | what happens | read |
|---|---|---|
| 0-5 | sunny; he lounges, whistling, one foot up on his knee; a small cloud drifts over and stops above the opening | |
| 5.5 | a drop on his head | |
| 6-7 | he sits up, holds out a hand: another drop in his palm; thunder | |
| 7.5-9 | rain, all of it coming in through the opening; he gets up, turns, hands to his head (they only reach its sides) | too short |
| 9-11.5 | water pools in the bottom of the ring; he shakes a wet foot and steps it up the curve | the legs, earned |
| 11.7 | lightning | |
| 12-15 | he strains: the hands creep up over the top, elbows out; reaching further toward the opening, two straight parts with an elbow | approach 1 |
| 15-16 | the elbows' angle goes, the arms bend round into an umbrella | |
| 16.4-17.2 | the rain stops | of course |
| 19 | one last drop comes down through all three openings, into his head | |
| 19-24 | sun, birds, the brush mark | |

---

# Films about the idea

What the site and the mark mean, from the logo's own Stories chapter: human-in-loop.dev is a place of many loops,
each kept by one human who follows a field closely and posts what changed and what they make of it. Loops look
different from each other; lines are what they share. In the mark the outer loop is the field (the heaviest stroke,
it holds everything), the arms hold it from inside in its own shape (in sync with the field), the head is attention
(the part that watches), the legs stand on the field (and in the fall ride it like a surfboard), and one wedge opens
all three at eleven o'clock: one way in, every loop open to readers, and the eleventh hour (whatever AI turns into,
until then there are humans watching). The site's own picture of this is its home page: a tunnel of lines, and one
small human at the edge of a cliff, watching it. These films use that picture. Their line fields are contours of one
scalar field (`field.js`), the way the site draws its own.

## 8. Keeper (paper, 30 s): what the mark means

| time | what happens | meaning |
|---|---|---|
| 0-4 | the site's tunnel of lines, moving | the field: AI, changing |
| 4-8 | the camera finds him on the cliff edge, watching | a human at the edge |
| 1-11 | a clock ticks, eleven times; the field quickens | the pace of change; the eleventh hour |
| 8-11 | he leans over, backs up, crouches, runs | the choice |
| 11 | on the eleventh tick he dives in | |
| 11-13 | down the 30 degree line: the rings stretch into streamlines and part round him | in the field, at speed |
| 12.4-13.7 | the pressure draws his loop, from the front round both sides; the ends meet at the back, so the opening is the wake at eleven | the loop takes the heat |
| 13.4-14.2 | he turns feet first and lands on its leading curve | the legs: standing on the field, riding it |
| 14.6-17.8 | the wind takes his arms back over his head, elbows first, then bends them into the loop's own shape | the arms: in sync with what he keeps |
| 18.6-23.5 | the fall slows; the streamlines curl into calm rings round him | the field, kept |
| 23-30 | the mark at the centre of its rings, as the site draws its own name | |

## 9. Loops (ink, 32 s): what the site is

| time | what happens | meaning |
|---|---|---|
| 0-4 | night; one human sits in the AI loop, watching its field (the tunnel, small) | one loop, one keeper |
| 4-6 | something changes in the field; he gets up and leans in | following a field closely |
| 7-8 | he casts a line out through the opening | posting what changed; the way out is the way in |
| 8-10 | pulling back: the dark is full of empty loops, openings all in step | loops waiting for their keepers |
| 9-16 | the line reaches one; a keeper drops in through its opening; a different field comes alive (a grid); it casts on, and on: ripples, hatching, waves, cells, a spiral, contours | many loops, each different |
| 16-24 | lines cross-link; posts run along them both ways | lines are what they share |
| 24-26 | the first keeper raises his arms into the mark; the gesture runs along the lines to every keeper | humans in sync |
| 26-32 | a night of kept loops, a few still empty | |

## 11. Fall (paper, 34 s): Keeper, told right

Notes it answers: the loop must already be there and he must go into it; after that it falls into the site's meteor;
the arms need a reason to round.

| time | what happens | meaning |
|---|---|---|
| 0-7.6 | the tunnel of lines, with the loop at its heart; its opening goes round an hour a tick, five to eleven; he watches from the cliff edge | the field; the eleventh hour |
| 5.2-7.5 | he backs up for a run, gets set | the choice |
| 7.6-9.5 | at eleven he runs and jumps; the arc meets the 30 degree line at the opening | one way in |
| 9.5-11.1 | in feet first; lands on the inside of the curve at five; slides down into the stance, front foot staying up the curve | the legs: from the landing |
| 9.8-17.2 | the knock starts the loop falling; he surfs it: balance, a carve, a hop, a hand on the wall, a fist | riding the field |
| 16.6-21 | faster; the lines outside wrap into the site's meteor (its six dashed lines, its streaks) | the fall, as the site draws it |
| 17.2-20.2 | the loop rocks and shakes and throws him about | the pressure |
| 20.2-23.5 | he reaches up, elbows bent; further, arms straight toward its walls; the straight arms bend round inside it in its own shape; the rocking stops | the arms: holding the loop's shape from inside keeps it true |
| 24-34 | the brush mark, falling like the 404 page's meteor | |

## 12. Constellation (ink, 34 s): Loops, told right

Note it answers: the lines between loops were random; placed right, they can draw something.

| time | what happens | meaning |
|---|---|---|
| 0-7.9 | night; the AI keeper watches his field; it changes; he gets up and throws a line out through the opening | one loop, one keeper, posting what changed |
| 7.9-19.5 | the line runs on like a fuse; each loop it reaches gets a keeper (dropping in by the opening) and a field of its own; it branches | many loops, each kept, each different |
| 9-20.5 | pulling back: the loops sit on the lines of the mark, head ring first (the AI loop at its top), then spine, arms, legs, outer loop | |
| 20.5-24 | the whole: the lines between the keepers draw one human in a loop; no line crosses the openings at eleven | the site is the mark, made of its keepers |
| 24.4-28 | each keeper raises his arms into the mark, in a wave in the order the line reached them; the brush mark shows faintly behind | humans in sync |

## 13. Arrival (paper, 46.6 s): where the 404 page's meteor lands

His brief: start from Fall's end; planets and meteoroids pass and he steers clear with his hands and body; a distant
planet, a comical telescope, he decides to go; it comes from five o'clock (the 11-to-5 line), bigger and bigger; in
its atmosphere the loop burns from the gap until it is gone, clean; he falls onto a surface big enough to look flat,
gets up, dusts off, looks for something, walks right, finds the edge and studies the rotating loop; Fall again.

| time | what happens |
|---|---|
| 0-2.1 | Fall's last frame (the site's meteor); the brush mark gives way to the figure in the same pose |
| 2.1-3.7 | his arms come down out of the ring, point for point, to steering arms |
| 4.4-13.5 | rocks down the line; he dodges (the loop moves sideways, the trail bends along his path, the loop banks): a big one, a close shave over the top (he ducks), a ringed planet drifting by, a hard swerve |
| 12.4 | a small planet appears at five o'clock |
| 14.2-17.7 | the telescope: from behind his back, pulled out (click, click), aimed at it; the view: a loop in its rings over the planet's horizon |
| 17.75-18.7 | he points: there |
| 18.8-26 | he steers it to dead ahead; it grows; its air (rings) appears |
| 24.5-28.5 | the view turns until the fall is straight down |
| 26.6-30.3 | the loop burns back from the opening, both ends, fire and smoke streaming up; the fire reaches his back foot, he lifts it; the last bit under his front foot goes |
| 30.3-31.1 | a beat on nothing, then down onto the planet (now the flat top of Fall's cliff) |
| 31.1-35.5 | face down; up on his hands; up; dusts himself off; shakes his head |
| 35.5-37.4 | looks left, looks right, scratches his head |
| 37.4-42.6 | walks right; the lines over the ground turn into the tunnel; the edge, and the loop at the tunnel's heart, opening ticking round |
| 42.6-46.6 | a start at the edge, leans in, hand to chin, his head following the ticks; the last tick brings the opening to five, and the picture is Fall's first second |

`film-arrival.js` uses Fall's own pieces (`film-fall.js` exports its tunnel field, clock, cliff, trail numbers and
streaks), draws Fall's frames itself for its last 0.2 s, and starts on Fall's time 32.5 so the trail, streaks and
bob carry on. `out/cycle.mp4` is Fall from 1.0 s then Arrival: played on repeat it has no end.

## 13b. Arrival v2 (paper, 61.8 s): the same story with room to breathe

His notes on Arrival: the section from the telescope to the landing was rushed. The circle in the telescope came
and went too fast to read and nothing said the dot was what he was looking at; the planet moved when he dodged
(it is far: it should not), and it grew in jerks; the atmosphere was missing as a stage (it should feel faster,
shake, the streamlines turn to fire, then the loop burns); and after dusting off he walked to the cliff rigidly
without looking for anything. `film-arrival2.js`, beside the first one:

| time | what happens |
|---|---|
| 0-14.5 | as Arrival |
| 14.55-15.4 | the telescope comes out, click, click |
| 15.4-18.4 | a small dotted circle sways up and down as the telescope does: searching |
| 18.4-18.6 | it settles on the planet's dot and locks (four small marks round it, a tick) |
| 18.6-23.9 | the close-up opens out of the circle on two dashed lines (the cone), and holds: that planet, a loop in its rings on its horizon, its opening ticking round; he leans in, a little bounce |
| 23.9-25.9 | it closes back into the circle; the telescope goes away; he points |
| 25.9-33.2 | he steers for it; the planet stays where it is (no parallax), growing smoothly and faster and faster; the camera pulls back a little and moves him up and left to give it room, so it is a whole circle in the frame, its rings of air round it, when he flies into them |
| 33-35.5 | the air: the camera goes in close on him and the land drops out of the picture; everything shakes, the streaks run faster and longer, the trail's dashes race |
| 35-37 | the trail's lines catch fire; flames lick round the front of the loop and along the trail; sparks |
| 37-41 | the loop burns back from the opening, both ends; the back foot comes up as the fire reaches it; the last bit goes |
| 40.25-41.7 | the camera comes back out and the land rises into view; the last bit goes; a beat on nothing; down onto the planet |
| 41.7-46 | face down, up, dusts off, shakes his head |
| 46-50.8 | looks up at the sky he fell from; left; right; a tick from over there and he listens, hand by his head; nods |
| 50.8-57.8 | the walk: two careful steps, a glance, then a steady walk (feet planted, knees, bob, arms) slowing at the edge |
| 57.8-61.8 | the edge, as Arrival, and Fall's first second |

## The order of 20 October

Five pieces, each made on its own (no shared frames or parts): Eyes the film, Eyes the animation, Keep Up, Both
Readings, and a new gag, Stuck.

### 14. Eyes (paper, 12.8 s, a sting): `film-eyes.js`
The lockup, crisp (no boil). Wide: the eyes look at you, blink, look about, find the mark. The camera follows their
gaze along the word to the mark (close); his head ring turns toward them. Pan back: the eyes narrow, glance at you,
look back. Pan to him: he hops and sways his arms ring over his head from side to side, from the shoulder (the arms
stay the ring). Pan to the eyes: happy (^ ^). Out to the lockup, the eyes on you. The animation (`animations/eyes`, a
12 s SVG cycle) is the same acting on the whole lockup without the camera.

### 15. Keep Up (paper, 29 s): `film-keepup.js`
The field streams left and turns the loop like a water wheel. Walk (1-5), jog (5-8), run (8-10), sprint (10-13.6,
legs blurred, sweat). The trip (13.6), face down, dragged up the side (14-14.75), a tucked tumble in place that comes
out upright (14.75-17.25), back foot planted, front foot steps up the curve (17.55-18.15), up into the mark's stance
on the slope (18.6), wobbles settling (to 21), riding: looks down, then watches the field go by, then hands on hips.

### 16. Both Readings (paper and ink, 21 s): `film-readings.js`
Split down the middle, the loop on the seam. Looks left: paper calms; steps to it, it floods (seam moves). A crack:
ink goes wild and floods back. Yanked side to side (7.9-10.3), stops, shakes his head. The loop parts along the
seam; he reaches into both halves and pulls them shut; arms up (elbows bent), straight in a V, then round into the
ring, front foot braced up the curve. The mark, half white, half black.

### 17. Stuck (ink, 22 s): `film-stuck.js`
A bird lands on the loop and sings. He walks to the opening, jumps, grips either side and chins up: his head goes
halfway into the opening and sticks (it is wider than the gap), pinched, legs kicking; the bird hops over and looks.
He braces and shoves; pop; lands on his bottom, seeing stars, rubs his head. The bird hops in through the opening
with no trouble at all and settles on his head; he looks up at it and lets it stay.
