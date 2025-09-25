#!/usr/bin/env node
const fs = require('fs'),
  path = require('path');
const pats = [
  'InputHTMLAttributes',
  'ButtonHTMLAttributes',
  'LabelHTMLAttributes',
  'SelectHTMLAttributes',
  'TextareaHTMLAttributes',
  'HTMLAttributes',
];
const walk = d =>
  fs.existsSync(d)
    ? fs.readdirSync(d).flatMap(n => {
        const f = path.join(d, n),
          s = fs.statSync(f);
        return s.isDirectory() ? walk(f) : f.endsWith('.tsx') ? [f] : [];
      })
    : [];
const find = c => {
  const re = /export\s+interface\s+([A-Za-z0-9_]+Props)([\s\S]*?)\{/g,
    res = [];
  let m;
  while ((m = re.exec(c))) {
    const i = m.index;
    res.push({
      iface: m[1],
      header: c.slice(i, Math.min(c.length, i + 1000)).split('{')[0],
      index: i,
    });
  }
  return res;
};
const base = path.join(process.cwd(), 'components'),
  files = walk(base);
if (!files.length) {
  console.error('No components');
  process.exit(1);
}
let bad = false;
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const ex = find(c);
  const issues = ex.filter(e => !pats.some(p => e.header.includes(p)));
  if (issues.length) {
    bad = true;
    for (const e of issues) {
      const line = c.slice(0, e.index).split('\n').length;
      console.log(`✳️ REVIEW ${f}:${line} -> ${e.iface}`);
    }
  } else {
    for (const e of ex) {
      const line = c.slice(0, e.index).split('\n').length;
      console.log(`✅ OK ${f}:${line} -> ${e.iface}`);
    }
  }
}
process.exit(bad ? 2 : 0);
