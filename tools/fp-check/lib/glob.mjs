import fs from 'node:fs';
import path from 'node:path';
import { posix } from './util.mjs';

/** Glob to RegExp: `*` any run inside a segment, `**` any run of segments, `?` one char, `{a,b}` alternation. */
export function globToRegExp(glob) {
  let g = posix(glob).replace(/^\.\//, '');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = g.indexOf('}', i);
      if (end < 0) re += '\\{';
      else {
        const alts = g.slice(i + 1, end).split(',').map((a) => a.replace(/[.+^$()|[\]\\]/g, '\\$&'));
        re += '(?:' + alts.join('|') + ')';
        i = end;
      }
    } else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

export function matchesAny(relPath, globs) {
  const p = posix(relPath).replace(/^\.\//, '');
  return globs.some((g) => globToRegExp(g).test(p));
}

const SKIP_DIRS = new Set(['node_modules', '.git']);

export function walk(dir, rel = '') {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else if (e.isFile()) out.push(r);
  }
  return out.sort();
}

export function expandGlobs(dir, globs, all = walk(dir)) {
  const res = globs.map(globToRegExp);
  return all.filter((f) => res.some((re) => re.test(f)));
}
