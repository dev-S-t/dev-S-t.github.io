// Builds the kit into this folder: every asset in paper and ink, plus manifest.json for the collection page.
// usage (from experimental-assets/kit): node src/build.cjs [group ...]   groups: backgrounds animations vectors stories
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '..');
const only = process.argv.slice(2);
const manifest = fs.existsSync(path.join(OUT, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')) : {};

function write(group, items) {
  fs.mkdirSync(path.join(OUT, group), { recursive: true });
  manifest[group] = [];
  for (const it of items) {
    const t0 = Date.now(), draw = it.make(), files = {};
    // most assets come in paper and ink; one drawn in both at once (themes: ['both']) is a single file, served for either
    if (it.themes && it.themes[0] === 'both') { const file = `${group}/${it.id}.svg`; fs.writeFileSync(path.join(OUT, file), draw('both')); files.paper = files.ink = file; }
    else for (const theme of it.themes || ['paper', 'ink']) {
      const file = `${group}/${it.id}-${theme}.svg`, svg = draw(theme);
      fs.writeFileSync(path.join(OUT, file), svg); files[theme] = file;
    }
    const kb = Math.round(fs.statSync(path.join(OUT, Object.values(files)[0])).size / 1024);
    manifest[group].push({ id: it.id, name: it.name, note: it.note || '', w: it.w, h: it.h, files, kb });
    console.log(group.padEnd(12), it.id.padEnd(14), kb + ' KB', (Date.now() - t0) + ' ms');
  }
}

const B = require('./backgrounds.cjs');
if (!only.length || only.includes('backgrounds')) write('backgrounds', B.list.map(([id, name, make, themes]) => ({ id, name, make, themes, w: B.W, h: B.H })));
const A = require('./animations.cjs'), Z = require('./zoom.cjs'), LD = require('./loaders.cjs');
if (!only.length || only.includes('animations')) write('animations', [...Z.list, ...LD.list, ...A.list].map(([id, name, make, w, h]) => ({ id, name, make, w, h })));
const ST = require('./story.cjs');
if (!only.length || only.includes('stories')) write('stories', ST.list.map(([id, name, make, w, h]) => ({ id, name, make, w, h })));
const V = require('./vectors.cjs');
for (const g of ['figures', 'objects', 'dividers']) if (!only.length || only.includes(g) || only.includes('vectors')) write(g, V[g].map(([id, name, make, w, h]) => ({ id, name, make, w, h })));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
