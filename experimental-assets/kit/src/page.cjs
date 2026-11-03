// The collection page: every asset in this kit, shown in paper or ink, each with Save buttons (SVG, and PNG for
// still pictures) and one ZIP of everything. Writes index.html (a full document, for opening locally) and
// page.html (the same page without the document shell, for publishing as an Artifact).
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '..');
const M = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));

const NOTES = {
  'story-ship': 'The ship hovers with its opening turned down and beams him up through it. It turns the opening to 11 o\'clock and lands; his arms go up and over into the mark; it flies off.',
  'story-reach': 'Inside the circle he jumps for the gap at 11 o\'clock and can\'t reach it. Hands up, he stretches for the top and bends his arms over his head toward the gap.',
  'story-mimic': 'He copies a peak, a box and a line with his arms, and none is right. A circle comes down over him opening first; inside, he copies that one, and it is right.',
  'story-meteor': 'The circle comes down like a meteor with him curled up inside. It settles; he gets up, a little dizzy, and makes the mark.',
  'story-bubble': 'A circle is drawn round him like a pen stroke, from the opening and back to it. He pushes at its walls from inside, then makes the mark.',
  'story-wheel': 'It starts as the mark. His arms come down, he runs, the circle rolls like a wheel, and he comes home to the mark.',
  'story-orbit': 'He walks right round the outside of a small floating circle, upside down underneath it, finds the opening at 11 o\'clock and drops in.',
  'loader-orbit': 'He runs round the outside of the ring and leaps the opening at 11 o\'clock, lap after lap. No ending: it loops for as long as the wait lasts.',
  'loader-wheel': 'He runs inside the ring and it rolls from wall to wall; at each wall he stops, looks back over his shoulder, turns and runs the other way.',
  'agents-zoom': 'Agents on the loop, for ever: the view goes into one small ring and finds the same figure and the same three rings inside.',
  loop: 'A fingerprint with a loop pattern. A scan passes down it and the ridges swell.',
  'in-sync': 'Two sets of rings, one circling the other; broad moire bands sweep round.',
  strings: 'The figure pulls one string aside, lets go, and watches it ring out.',
  sweep: 'The mark with even rays all round it, open at 11 o\'clock. A hand goes round once every 12 seconds and crosses the opening at 11.',
  'starry-3': 'Starry Night II\'s whirlpools with the stream running through them. The stream comes in from behind the cypress and parts at the great whirlpool: the upper half arches over the top and rolls into the spiral; the lower half bends down and passes underneath. At the second whirlpool it parts again: its lower lines roll into the spiral from below, the upper ones rise over the top and flow out to the right. No hard edge: where the stream meets the sky its strokes thin, thin out and fade, and the sky\'s strokes beside it are a little bolder.',
  'starry-2': 'A copy of Starry Night, sky only: no village, the figure on the mountains, more sky so the moon is bigger. The wind is one stream of lines: it rises from behind the cypress, wraps over the great whirlpool and its inner lines roll up into it like a carpet; the rest swing down in an S, roll into the second whirlpool, and flow out under the moon. Every line of a whirlpool is a line of the stream. The open sky is fine strokes traced like the fingerprint\'s ridges, lying along the stream beside it. The stars are lights it flows round: a core and rings of strokes, bold close in and thinning out. A crescent moon with its dark side lit in fine rings. The stars breathe, the moon glows, the sky shimmers, the cypress sways.',
  starry: 'One version, ink and paper at once: the painting\'s night in brush strokes. The strokes are not alike: the open sky is very fine, small strokes; round each star they grow bold the nearer they are, in rings, and thin out as they go; the great swirl and its partner are spirals, fine in the eye and bolder at the rim; a wave of middling strokes runs through the middle of the sky. A crescent in an orb of fine rings. Paper mountains in ink strokes, a dark village with paper houses and a church spire, a black cypress of three flames, and a small figure in light, watching. The swirls turn, the stars breathe, the sky shimmers, the cypress sways.',
  constellation: 'The still of the film Constellation: many loops, each a whole mark, placed on the lines of the mark and joined along them, so the lines between them draw it. Posts run along the lines; no line crosses an opening at 11. Stars on ink.',
  watching: 'The lettering\'s eyes look about and blink.',
  eyes: 'The lockup. The lettering\'s eyes look about, find the figure in the mark, narrow at him; he hops and sways his arms over his head, and they go happy. A 12 second cycle of the film Eyes.',
  walk: 'The figure walking, in six stop-motion frames.',
  'draw-on': 'The mark paints itself, stroke by stroke, then starts again.',
  scroll: 'A ring slides down a line: there is more below.',
  thinking: 'Three rings turn in turn, for waiting and working.',
  listening: 'Open rings spread from a small one, for a voice coming in.',
  searching: 'Hand at his brow, he looks one way, then the other.',
  hello: 'He waves.'
};
// the films: rendered by video/render.mjs, copied into films/
const FILMS = [
  { id: 'film-arrival2', idea: true, dur: 62, name: 'Arrival v2', note: 'Arrival with room to breathe. With the telescope out, a small dotted circle sways up and down as it does while he searches, then locks on the planet\'s dot, and the close-up opens out of it on two dashed lines and stays long enough to read. The planet is far off, so it no longer moves when he dodges; it only grows, faster and faster, while he gets smaller in the picture. The air gets a stage of its own: it feels faster (everything shakes, the streaks and the trail speed up), the trail\'s lines catch fire and flames lick round the front of the loop, and only then does the loop burn. On the ground he looks up at the sky he fell from, then left, then right, hears the clock tick, and walks to the edge: a slow start, a glance, then a real walk, slowing at the edge.' },
  { id: 'film-cycle2', idea: true, cycle: true, dur: 93, res: '1280 &times; 720', name: 'Fall and Arrival v2, round and round', note: 'Fall from its first second, then Arrival v2, which ends where Fall began: on repeat it never stops. This is the 720p page copy; the full-size cut is joined from the renders with ffmpeg.' },
  { id: 'film-arrival', idea: true, dur: 47, name: 'Arrival', note: 'Where the 404 page\'s meteor lands. It starts on the last frame of Fall and ends on its first. His arms come down out of the ring and he steers: rocks come at him down the line from five o\'clock and he dodges them with his body and arms, the trail bending where he has been. A small planet, far off; he pulls out a telescope (click, click), sees a loop there, and points. It comes up from five o\'clock, bigger and bigger; in its air the loop burns from the opening, both ends, round to his feet, until he is on one foot on the last bit and then on nothing. He drops onto the planet, flat now, gets up, dusts off, looks about, walks right to an edge, and studies a loop whose opening is going round like a clock. Then Fall begins.' },
  { id: 'film-cycle', idea: true, cycle: true, dur: 78, res: '1280 &times; 720', name: 'Fall and Arrival, round and round', note: 'Fall from its first second, then Arrival, which ends where Fall began: on repeat it never stops. This is the 720p page copy; the full-size cut is joined from the renders with ffmpeg.' },
  { id: 'film-both', idea: true, dur: 67, res: '1280 &times; 720', name: 'Fall, then Constellation', note: 'The two new films as one: what the mark means, then what the site is. This is the 720p page copy; the full-size cut is joined from the renders with ffmpeg.' },
  { id: 'film-fall', idea: true, dur: 34, name: 'Fall', note: 'The cliff, told again. The loop is there from the first frame, at the heart of the site\'s tunnel of lines, its opening going round like the hand of a clock. When it reaches eleven he runs and jumps, and goes in by the opening, feet first. He lands on the inside of its curve (the legs: back foot low, front foot up the curve) and the knock sends it falling down the 30 degree line with him riding it: his balance, a carve, a hop, a hand trailed along the wall. Faster, the lines outside wrap round into the site\'s meteor. Then the loop rocks and shakes; he reaches up, elbows bent, then arms straight toward its walls, and bends them round inside it in its own shape. The rocking stops. The mark falls on, as it does on the 404 page.' },
  { id: 'film-constellation', idea: true, dur: 34, name: 'Constellation', note: 'Loops, with every loop in its place. One keeper in the AI loop casts a line; it runs to the next loop, a keeper drops in, and it runs on and branches. Pulling back, the loops sit on the lines of the mark: the head ring (the AI loop at its top), down the spine, out along both arms, down the legs and round the outer loop both ways. The lines between the keepers draw one human in a loop, and its three openings at eleven stay open. At the end each keeper raises his arms into the mark, in a wave from the first.' },
  { id: 'film-idea', idea: true, dur: 88, res: '1280 &times; 720', name: 'All three', note: 'Keeper, Loops and Open as one film: what the mark means, what the site is, and the reader let in. This is the 720p page copy; the full-size cut is joined from the renders with ffmpeg.' },
  { id: 'film-keeper', idea: true, dur: 30, name: 'Keeper', note: 'What the mark means. A human at the edge of the site\'s tunnel of lines, watching it change, while a clock ticks. On the eleventh tick he dives in. The pressure draws his loop round him from the front, so its opening is the wake at eleven; he lands on its curve and rides it (the legs); the wind bends his arms into its shape (in sync with the field he keeps); and the field settles into rings round him. Kept.' },
  { id: 'film-loops', idea: true, dur: 32, name: 'Loops', note: 'What the site is. One keeper watches the AI loop; when something changes he casts a line out through the opening. The dark is full of empty loops, openings in step, waiting. Keepers arrive, each field drawn its own way, all joined by lines that carry posts back and forth. At the end the gesture of the mark runs from keeper to keeper.' },
  { id: 'film-open', idea: true, dur: 28, name: 'Open', note: 'The reader\'s side. Noise everywhere, and one calm loop someone is keeping. He looks at you (his head ring becomes an eye, like the o\'s of the lettering) and beckons; the camera goes in through the opening, the one way in, and the noise falls away. You watch his field with him; then he holds it.' },
  { id: 'film-open2', idea: true, dur: 28, name: 'Open, again', note: 'Open without the eye: his head stays his head. He notices you coming through the noise, turns and waves, and beckons; the camera goes in by the opening and the noise falls away. The first Open is kept above.' },
  { id: 'film-loop-kept', loop: true, dur: 10, name: 'Kept', note: 'The mark in its calm rings, the rings drifting slowly outward from it, paper.' },
  { id: 'film-loop-edge', loop: true, dur: 10, name: 'Edge', note: 'The site\'s tunnel of lines, moving into the distance, and him on the cliff edge, breathing, watching it.' },
  { id: 'film-loop-island', loop: true, dur: 10, name: 'Island', note: 'A field of noise, always moving, and one loop that is kept: calm lines inside it, ink.' },
  { id: 'film-eyes', sting: true, dur: 13, name: 'Eyes', note: 'The lockup, as the site shows it. The o\'s of the lettering are eyes: they look at you, blink, look about, and find the mark. The camera follows their gaze along the word to it. The figure in the mark turns his head toward them. Back to the eyes: they narrow, glance at you (who, him?), and look back. He hops and sways his arms ring over his head from side to side: hello. The eyes go happy, and the camera pulls back to the lockup, the eyes on you again.' },
  { id: 'film-keepup', dur: 29, name: 'Keep Up', note: 'The field streams past and its flow turns his loop like a wheel. He walks to keep his place; it quickens, and he jogs, runs, sprints, the lines all streaks. His foot catches: he goes down on his face, the floor drags him up the side, and he tumbles over and over in one place. Then he plants his back foot, steps his front foot up the curve and comes up standing on the slope, in the stance of the mark. He wobbles, finds it, and rides the wheel instead of running it, hands on his hips. You cannot outrun the field; you can ride it.' },
  { id: 'film-readings', dur: 21, name: 'Both Readings', note: 'The picture split down the middle, paper and ink, and his loop on the seam: both readings of where AI is going. He looks at the paper side and its lines go calm; he steps toward it and it floods the picture. A crack from the other side: its lines go wild and it floods back. He is yanked from side to side, then stops, shakes his head, and stands on the seam. The loop starts to come apart along it; he reaches into both halves and pulls them together, then holds them: his arms up over his head, straight, and round into a ring. The mark, half white, half black.' },
  { id: 'film-stuck', dur: 22, name: 'Stuck', note: 'A gag about the mark: its head is wider than its opening. A bird lands on his loop and sings. He walks to the opening, jumps, grips either side and chins himself up to look out; his head gets halfway and sticks, pinched, legs kicking. The bird hops over and looks at him. He braces his feet on the wall and shoves, pops back in, and lands on his bottom, seeing stars. Then the bird hops in through the opening without any trouble at all and settles on his head. He lets it stay.' },
  { id: 'film-showtime', name: 'Showtime', note: 'A human cannonball. He bows, climbs into the cannon and is fired across the tent, squeezes in through the ring\'s opening, splats on the far wall and lands in a heap. He gets up and surfs the rocking ring, arms going round to keep his balance, until it settles. Then the finish: TA-DA.' },
  { id: 'film-storm', name: 'Storm', note: 'A cloud stops over his ring, and the rain can only get in through the opening, onto his head. He steps a foot up out of the puddle, covers his head, strains until his arms reach over the top, and the elbows bend round into an umbrella just as the rain stops. One last drop finds the gap.' },
  { id: 'film-gap', name: 'The Gap', note: 'His world is a ring, open at eleven. He walks to the edge, looks down, backs away, runs and leaps it. Then the camera pulls back: other worlds, other walkers, each one jumping its own gap.' },
  { id: 'film-strings', name: 'Strings', note: 'He brushes a string by accident and hears it. He plucks his way up the row, then runs back down it with his arm out, a glissando to the lowest note, and sits down to listen.' },
  { id: 'film-uphill', name: 'Uphill', note: 'Inside his ring he runs at a hill, stalls, and rolls back onto his seat. He walks it back, takes a run-up and makes the crest; on the way down the ring takes him round once, all the way.' }
].map((f) => ({ ...f, mark: f.id === 'film-showtime' || f.id === 'film-storm', mb: (fs.statSync(path.join(OUT, 'films', f.id + '.mp4')).size / 1048576).toFixed(1) }));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const kb = (a) => `${a.kb < 1 ? '<1' : a.kb} KB`;
const img = (a, cls = '') => `<img class="${cls}" data-paper="${a.files.paper}" data-ink="${a.files.ink}" src="${a.files.paper}" alt="${esc(a.name)}" width="${a.w}" height="${a.h}" loading="lazy">`;
const saves = (a, png) => `<div class="saves"><button type="button" data-save="svg" data-id="${a.id}">Save SVG</button>${png ? `<button type="button" data-save="png" data-id="${a.id}" data-scale="${png}">Save PNG</button>` : ''}<span class="said" aria-live="polite"></span></div>`;
const count = (n, extra) => `<span class="count">${n}${extra ? ' &middot; ' + extra : ''}</span>`;

// the zoom leads the stories: the figure and the circle again, going on for ever instead of ending in the mark
const zoom = M.animations.filter((a) => a.id === 'agents-zoom');
const stories = [...zoom, ...M.stories].map((a) => `<article class="story" id="${a.id}"><div class="stage">${img(a)}</div><h3>${a.name}</h3><p>${NOTES[a.id] || ''}</p><p class="meta">${a.w} &times; ${a.h} &middot; ${a.id === 'agents-zoom' ? 'loops for ever' : a.id === 'story-wheel' ? 'starts and ends in the mark' : 'ends in the mark'} &middot; ${kb(a)}</p>${saves(a, 0)}</article>`).join('');
const backgrounds = M.backgrounds.map((a) => `<article class="bg" id="${a.id}"><div class="frame">${img(a)}</div>` +
  `<div class="cap"><h3>${a.name}</h3><p>${NOTES[a.id] || ''}</p><p class="meta">${a.w} &times; ${a.h} &middot; covers any section &middot; ${kb(a)}</p>${saves(a, 2)}</div></article>`).join('');
const isLoader = (a) => a.id.startsWith('loader-');
const filmCard = (f) => `<article class="film" id="${f.id}"><video ${f.loop ? 'autoplay muted loop' : f.cycle ? 'controls loop' : 'controls'} playsinline preload="metadata" poster="films/${f.id}.jpg" src="films/${f.id}.mp4" width="1920" height="1080" aria-label="${esc(f.name)}"></video>` +
  `<div class="cap"><h3>${f.name}</h3><p>${f.note}</p><p class="meta">${f.res || '1920 &times; 1080'} &middot; 30 fps &middot; ${f.dur || 24} s &middot; ${f.loop ? 'no sound &middot; the last frame runs into the first' : 'with sound'}${f.mark || f.idea ? ' &middot; ends in the mark' : ''} &middot; ${f.mb} MB</p><div class="saves"><button type="button" data-save="mp4" data-file="films/${f.id}.mp4">Save MP4</button><span class="said" aria-live="polite"></span></div></div></article>`;
const films = `<h3 class="sub">The idea</h3><p class="sublead">Many loops, each kept by one human who follows a field closely; the mark as a human keeping a field.</p>` + FILMS.filter((f) => f.idea).map(filmCard).join('') +
  `<h3 class="sub">Section loops</h3><p class="sublead">Ten seconds each, silent, seamless: for playing on repeat behind a section.</p>` + FILMS.filter((f) => f.loop).map(filmCard).join('') +
  `<h3 class="sub">Stings</h3><p class="sublead">Short pieces with the lockup itself, for an intro or an outro.</p>` + FILMS.filter((f) => f.sting).map(filmCard).join('') +
  `<h3 class="sub">Stories</h3>` + FILMS.filter((f) => !f.idea && !f.loop && !f.sting).map(filmCard).join('');
const loaders = M.animations.filter(isLoader).map((a) => `<article class="anim" style="--w:${Math.min(a.w, 560)}px"><div class="stage">${img(a)}</div>` +
  `<h3>${a.name}</h3><p>${NOTES[a.id] || ''}</p><p class="meta">${a.w} &times; ${a.h} &middot; loops for ever &middot; ${kb(a)}</p>${saves(a, 0)}</article>`).join('');
const animations = M.animations.filter((a) => a.id !== 'agents-zoom' && !isLoader(a)).map((a) => `<article class="anim" style="--w:${Math.min(a.w, 560)}px"><div class="stage">${img(a)}</div>` +
  `<h3>${a.name}</h3><p>${NOTES[a.id] || ''}</p><p class="meta">${a.w} &times; ${a.h} &middot; ${kb(a)}</p>${saves(a, 0)}</article>`).join('');
const lineup = (list) => list.map((a) => `<figure>${img(a)}<figcaption><span>${a.name}</span>${saves(a, 4)}</figcaption></figure>`).join('');
const dividers = M.dividers.map((a) => `<figure class="div">${img(a)}<figcaption><span>${a.name}</span><span class="meta">${a.w} &times; ${a.h}</span>${saves(a, 1)}</figcaption></figure>`).join('');
const all = Object.values(M).flat();

const content = `<title>AI Loop Assets</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500&family=Kalnia:wght@300;400;500&family=Workbench&display=swap">
<style>
/* layout: one column of full-width sections; backgrounds run edge to edge of the column, the small pieces sit on shared grounds */
:root {
  --paper: #F3F1EC; --ink: #0D0D0C;
  --ground: var(--paper); --line: var(--ink); --soft: #5d5b56; --rule: #cfccc4; --well: #e8e5dd;
  --f-display: "Kalnia", Georgia, serif; --f-text: "Geologica", system-ui, sans-serif; --f-data: "Workbench", ui-monospace, Consolas, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ground: var(--ink); --line: var(--paper); --soft: #a8a59e; --rule: #34332f; --well: #1b1a18; color-scheme: dark; } }
:root[data-theme="dark"] { --ground: var(--ink); --line: var(--paper); --soft: #a8a59e; --rule: #34332f; --well: #1b1a18; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ground); color: var(--line); font: 300 16px/1.55 var(--f-text); }
.wrap { max-width: 1240px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 48px); padding-block: 28px 80px; display: grid; gap: clamp(56px, 8vw, 104px); }
h1, h2, h3 { font-family: var(--f-display); font-weight: 400; margin: 0; text-wrap: balance; letter-spacing: -0.01em; }
h1 { font-size: clamp(56px, 10vw, 132px); line-height: .9; }
h2 { font-size: clamp(36px, 5vw, 64px); line-height: 1; }
h3 { font-size: 26px; line-height: 1.1; }
p { margin: 0; max-width: 62ch; }
.meta, .count, button, figcaption span { font-family: var(--f-data); font-size: 12.5px; letter-spacing: .03em; }
.meta { color: var(--soft); }
header { display: grid; gap: 22px; padding-top: 12px; }
header .word { width: min(560px, 100%); height: auto; }
header .lead { font-size: 19px; }
.bar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; padding-block: 14px; border-block: 1px solid var(--rule); position: sticky; top: env(safe-area-inset-top, 0px); background: var(--ground); z-index: 2; }
.switch { display: inline-flex; border: 1px solid var(--line); border-radius: 99px; padding: 3px; }
.switch button { border: 0; border-radius: 99px; padding: 6px 14px; }
.switch button[aria-pressed="true"] { background: var(--line); color: var(--ground); }
button { font-family: var(--f-data); background: none; color: var(--line); border: 1px solid var(--line); border-radius: 99px; padding: 5px 12px; cursor: pointer; }
button:hover { background: var(--line); color: var(--ground); }
button:focus-visible { outline: 2px solid var(--line); outline-offset: 3px; }
.bar .note { color: var(--soft); font-size: 14px; }
section { display: grid; gap: 28px; }
section > header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 18px; padding: 0; }
.count { color: var(--soft); }
/* backgrounds: big frames, the caption beside on wide screens */
.bg { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 20px 28px; align-items: end; }
.bg .frame { border-radius: 18px; overflow: hidden; background: var(--well); aspect-ratio: 16 / 9; }
.bg .frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cap { display: grid; gap: 10px; align-content: end; min-width: 0; }
@media (max-width: 820px) { .bg { grid-template-columns: minmax(0, 1fr); } }
/* films: the player large, the caption beside it on wide screens */
.films { display: grid; gap: 44px; }
.films .sub { font-size: clamp(28px, 3vw, 40px); margin-top: 12px; }
.films .sublead { color: var(--soft); margin-top: -28px; }
.film { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 18px 28px; align-items: end; }
.film video { width: 100%; height: auto; aspect-ratio: 16 / 9; display: block; border-radius: 18px; background: var(--well); outline: 1px solid var(--rule); outline-offset: -1px; }
@media (max-width: 820px) { .film { grid-template-columns: minmax(0, 1fr); } }
/* stories: big stages, two to a row on wide screens */
.stories { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 40px 28px; }
.story { display: grid; gap: 8px; min-width: 0; align-content: start; }
.story .stage img { width: 100%; height: auto; }
/* animations: each on its own patch of ground, as wide as it needs */
.anims { display: flex; flex-wrap: wrap; gap: 36px 28px; align-items: flex-start; }
.anim { flex: 1 1 max(var(--w), 260px); max-width: 100%; display: grid; gap: 8px; min-width: 0; align-content: start; }
.stage { background: var(--well); border-radius: 18px; min-height: 220px; display: grid; place-items: center; padding: 28px; outline: 1px solid var(--rule); outline-offset: -1px; }
.stage img { max-width: 100%; height: auto; }
/* vectors: a lineup on one ground, names underneath */
.lineup { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0; background: var(--well); border-radius: 18px; padding: 18px 10px 10px; outline: 1px solid var(--rule); outline-offset: -1px; }
.lineup figure { margin: 0; display: grid; gap: 6px; justify-items: center; padding: 8px; }
.lineup img { width: 140px; height: 140px; }
figcaption { display: grid; gap: 6px; justify-items: center; text-align: center; }
.saves { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.lineup .saves { justify-content: center; }
.saves button { font-size: 11.5px; padding: 4px 10px; }
.said { font-family: var(--f-data); font-size: 11.5px; color: var(--soft); }
.dividers { display: grid; gap: 22px; }
.div { margin: 0; display: grid; gap: 8px; background: var(--well); border-radius: 18px; padding: 20px; outline: 1px solid var(--rule); outline-offset: -1px; }
.div img { width: 100%; height: auto; }
.div figcaption { grid-auto-flow: column; justify-content: start; align-items: center; gap: 14px; justify-items: start; }
[data-saves="off"] .saves, [data-saves="off"] [data-save] { display: none; }
footer { color: var(--soft); font-size: 14px; border-top: 1px solid var(--rule); padding-top: 18px; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
</style>
<div class="wrap" data-saves="off">
  <header>
    <img class="word" data-paper="${M.animations.find((a) => a.id === 'watching').files.paper}" data-ink="${M.animations.find((a) => a.id === 'watching').files.ink}" src="${M.animations.find((a) => a.id === 'watching').files.paper}" alt="human-in-loop" width="553" height="85">
    <h1>Assets</h1>
    <p class="lead">Films and loaders with the figure and the circle, stories, backgrounds, small animations and vector pieces for the AI loop on human-in-loop.dev. All lines or their absence, in paper and in ink, drawn from the site's own mark, lettering and figure.</p>
  </header>
  <div class="bar">
    <div class="switch" role="group" aria-label="Show the assets in">
      <button type="button" id="t-paper" data-theme-pick="paper" aria-pressed="true">Paper</button>
      <button type="button" id="t-ink" data-theme-pick="ink" aria-pressed="false">Ink</button>
    </div>
    <button type="button" id="zip" data-save="zip">Save everything (ZIP)</button>
    <span class="note" id="where">The files are beside this page, in folders by kind.</span>
  </div>
  <section aria-labelledby="h-fm"><header><h2 id="h-fm">Films</h2>${count(FILMS.length)}</header><div class="films">${films}</div></section>
  <section aria-labelledby="h-ld"><header><h2 id="h-ld">Loaders</h2>${count(M.animations.filter(isLoader).length, 'no ending')}</header><div class="anims">${loaders}</div></section>
  <section aria-labelledby="h-st"><header><h2 id="h-st">Stories</h2>${count(M.stories.length + zoom.length, 'the figure and the circle')}</header><div class="stories">${stories}</div></section>
  <section aria-labelledby="h-bg"><header><h2 id="h-bg">Backgrounds</h2>${count(M.backgrounds.length, 'all moving')}</header>${backgrounds}</section>
  <section aria-labelledby="h-an"><header><h2 id="h-an">Animations</h2>${count(M.animations.length - zoom.length - M.animations.filter(isLoader).length, 'clear ground')}</header><div class="anims">${animations}</div></section>
  <section aria-labelledby="h-fg"><header><h2 id="h-fg">The figure</h2>${count(M.figures.length, 'clear ground')}</header><div class="lineup">${lineup(M.figures)}</div></section>
  <section aria-labelledby="h-ob"><header><h2 id="h-ob">Objects</h2>${count(M.objects.length, 'clear ground')}</header><div class="lineup">${lineup(M.objects)}</div></section>
  <section aria-labelledby="h-dv"><header><h2 id="h-dv">Dividers</h2>${count(M.dividers.length, '1600 wide')}</header><div class="dividers">${dividers}</div></section>
  <footer>The films are made in video/: each is drawn frame by frame from a script, with its sound made to match, and the ZIP leaves them out. Every other moving piece stands still for readers who ask for less motion. Backgrounds cover a section of any shape; the rest sit on a clear ground, in ink lines for paper pages and paper lines for ink pages.</footer>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script>
(() => {
  const ALL = ${JSON.stringify(all.map((a) => ({ id: a.id, w: a.w, h: a.h, files: a.files })))};
  const byId = Object.fromEntries(ALL.map((a) => [a.id, a]));
  const root = document.documentElement, wrap = document.querySelector('.wrap');
  // which ground the previews use: the page's own theme first, then the viewer's choice
  const dark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  let theme = dark() ? 'ink' : 'paper';
  try { theme = localStorage.getItem('kit-theme') || theme; } catch (e) {}
  function show(t) {
    theme = t;
    document.querySelectorAll('img[data-paper]').forEach((im) => { im.src = im.dataset[t]; });
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themePick === t)));
    document.querySelectorAll('.stage, .lineup, .div').forEach((el) => { el.style.background = t === 'ink' ? '#0D0D0C' : '#F3F1EC'; });
  }
  document.querySelectorAll('[data-theme-pick]').forEach((b) => b.addEventListener('click', () => { show(b.dataset.themePick); try { localStorage.setItem('kit-theme', theme); } catch (e) {} }));
  show(theme);

  // saving needs the viewer's downloads; without it (a local copy) the buttons stay hidden
  let downloads = null;
  const ready = window.claude && typeof window.claude.use === 'function' ? window.claude.use('downloads') : Promise.resolve(null);
  ready.then((d) => { downloads = d; if (d) { wrap.dataset.saves = 'on'; document.getElementById('where').textContent = 'Save any piece below, or everything at once.'; } }).catch(() => {});
  const say = (btn, text) => { const s = btn.closest('.saves'); const out = s && s.querySelector('.said'); if (out) { out.textContent = text; setTimeout(() => { out.textContent = ''; }, 4000); } };
  const text = (file) => fetch(file).then((r) => { if (!r.ok) throw new Error(file); return r.text(); });
  const png = (svgText, w, h) => new Promise((res, rej) => {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' })), im = new Image();
    im.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url); c.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'); };
    im.onerror = () => rej(new Error('svg')); im.src = url;
  });
  const failed = (btn, e) => say(btn, e && e.code === 'declined' ? 'Not saved' : e && e.code === 'rate_limited' ? 'One moment, then try again' : 'Could not save this file');
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-save]'); if (!btn || !downloads) return;
    try {
      if (btn.dataset.save === 'zip') {
        if (!window.JSZip) { btn.textContent = 'ZIP unavailable here'; return; }
        btn.disabled = true; btn.textContent = 'Packing...';
        const zip = new JSZip();
        for (const a of ALL) for (const f of Object.values(a.files)) zip.file(f, await text(f));
        await downloads.save({ filename: 'ai-loop-assets.zip', data: await zip.generateAsync({ type: 'blob' }) });
        btn.textContent = 'Save everything (ZIP)'; btn.disabled = false; return;
      }
      if (btn.dataset.save === 'mp4') {
        const r = await fetch(btn.dataset.file); if (!r.ok) throw new Error(btn.dataset.file);
        await downloads.save({ filename: btn.dataset.file.split('/').pop(), data: await r.blob() }); say(btn, 'Saved'); return;
      }
      const a = byId[btn.dataset.id], file = a.files[theme], name = file.split('/').pop(), svg = await text(file);
      if (btn.dataset.save === 'svg') await downloads.save({ filename: name, data: svg });
      else { const k = +btn.dataset.scale || 2; await downloads.save({ filename: name.replace(/\\.svg$/, '@' + k + 'x.png'), data: await png(svg, a.w * k, a.h * k) }); }
      say(btn, 'Saved');
    } catch (e) {
      if (btn.dataset.save === 'zip') { btn.textContent = 'Save everything (ZIP)'; btn.disabled = false; }
      failed(btn, e);
    }
  });
})();
</script>
`;

fs.writeFileSync(path.join(OUT, 'page.html'), content);
fs.writeFileSync(path.join(OUT, 'index.html'), '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>\n' + content + '</body></html>\n');
console.log('page.html', Math.round(content.length / 1024) + ' KB;', all.length, 'assets');
