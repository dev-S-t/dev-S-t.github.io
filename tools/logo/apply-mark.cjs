// Put the current nav mark into every page (matches the mark whatever order its attributes are in).
const fs = require('fs'), path = require('path');
const root = require('path').resolve(__dirname, '../..') + '/';
const mark = fs.readFileSync(process.argv[2] || (__dirname + '/mark-inline.svg'), 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name.startsWith('.') || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0;
for (const f of walk(root).filter((f) => f.endsWith('index.html'))) {
  let s = fs.readFileSync(f, 'utf8');
  const re = /<svg(?=[^>]*\bclass="mark")[^>]*>[\s\S]*?<\/svg>/;
  if (!re.test(s)) continue;
  s = s.replace(re, () => mark); fs.writeFileSync(f, s); n++;
}
console.log('pages', n);
