// Lyrikai: Fibonacci Protocol for UI/UX Design Agents - https://www.lyrikai.com (MIT License)
// Tests for tools/build-tokens/build.mjs. Run: node --test tools/
// Set UPDATE_SNAPSHOTS=1 to rewrite test/snapshots/ after an intended change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as B from '../build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, 'snapshots');
const require = createRequire(import.meta.url);
const master = B.loadMaster();
const version = JSON.parse(fs.readFileSync(path.join(B.ROOT, 'package.json'), 'utf8')).version;
const outputs = (u) => B.buildAll(master, { u, version });
const tokensAt = (u) => B.prepare(master, u);
const byId = (tokens) => Object.fromEntries(tokens.map((t) => [t.id, t]));
const cssVars = (css) => Object.fromEntries([...css.matchAll(/^\s*(--fp-[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2]]));

function snapshot(name, text) {
  const file = path.join(SNAP, name);
  if (process.env.UPDATE_SNAPSHOTS || !fs.existsSync(file)) {
    fs.mkdirSync(SNAP, { recursive: true });
    fs.writeFileSync(file, text);
    return;
  }
  assert.equal(text, fs.readFileSync(file, 'utf8'), `snapshot ${name} differs; run UPDATE_SNAPSHOTS=1 npm test if intended`);
}

// ------------------------------------------------------------ DTCG shape

test('master: valid DTCG 2025.10 structure', () => {
  assert.deepEqual(B.validate(master), []);
});

test('master: every token has $value, a resolvable $type, and object dimensions', () => {
  const flat = B.flatten(master);
  assert.ok(flat.length > 60);
  for (const t of flat) {
    assert.ok('raw' in t && t.raw !== undefined, t.id);
    assert.ok(['dimension', 'duration', 'cubicBezier', 'number', 'color'].includes(t.type), `${t.id} type ${t.type}`);
    if (t.type === 'dimension' && typeof t.raw !== 'string') {
      assert.equal(typeof t.raw, 'object', t.id);
      assert.equal(typeof t.raw.value, 'number', t.id);
      assert.ok(['px', 'rem'].includes(t.raw.unit), t.id);
    }
    if (t.type === 'duration') assert.ok(['ms', 's'].includes(t.raw.unit), t.id);
  }
});

test('master: root metadata lives in $extensions, not bare keys (FP-TOKEN-07)', () => {
  const ext = master.$extensions['com.lyrikai.fp'];
  assert.equal(ext.homepage, 'https://www.lyrikai.com');
  assert.equal(ext.unit, 1);
  assert.match(ext.spec, /^\d+\.\d+\.\d+/);
  for (const k of ['homepage', 'spec', 'unit', 'version']) assert.ok(!(k in master), `bare root key ${k}`);
});

test('master: names and per-token metadata (FP-TOKEN-03, FP-TOKEN-06)', () => {
  const walk = (n) => {
    for (const [k, v] of Object.entries(n)) {
      if (k.startsWith('$')) continue;
      assert.ok(!/[{}.]/.test(k), k);
      if (v && typeof v === 'object' && !('$value' in v)) walk(v);
    }
  };
  walk(master);
  for (const t of B.flatten(master)) assert.match(t.ext.rule ?? '', /^FP-[A-Z0-9]+-\d+$/, t.id);
  const pinned = B.flatten(master).filter((t) => t.ext.pinnedFloor).map((t) => t.id).sort();
  assert.deepEqual(pinned, ['target.coarse', 'target.fine', 'target.floor-coarse', 'target.floor-fine', 'type.0', 'type.micro']);
});

test('validate rejects broken masters', () => {
  const bad = (mutate) => {
    const d = structuredClone(master);
    mutate(d);
    return B.validate(d);
  };
  assert.ok(bad((d) => (d.space['13'].$value = 13)).length, 'bare number dimension');
  assert.ok(bad((d) => (d.space['1.5'] = structuredClone(d.space['13']))).length, 'dot in name');
  assert.ok(bad((d) => delete d.$extensions).length, 'no root metadata');
  assert.ok(bad((d) => (d.homepage = 'x')).length, 'bare root key');
  assert.ok(bad((d) => delete d.space.$type).length, 'type not inherited');
  assert.ok(bad((d) => (d.duration['89'].$value = { value: 89, unit: 'px' })).length, 'bad duration unit');
  assert.ok(bad((d) => delete d.radius['2'].$extensions).length, 'no rule');
});

// -------------------------------------------------------------- aliases

test('aliases resolve to the value they point at', () => {
  const t = byId(tokensAt(1));
  assert.deepEqual(t['focus.gap'].value, { value: 2, unit: 'px' });
  assert.deepEqual(t['focus.ring'].value, { value: 3, unit: 'px' });
  assert.equal(t['focus.ring'].alias, 'line.stroke-3');
  assert.equal(t['space.13'].alias, null);
});

test('alias to a missing token and alias cycles are errors', () => {
  const mk = (a, b) => ({ $type: 'number', g: { a: { $value: a }, b: { $value: b } } });
  assert.throws(() => B.resolve(B.flatten(mk('{g.zzz}', 1))), /no token/);
  assert.throws(() => B.resolve(B.flatten(mk('{g.b}', '{g.a}'))), /cycle/);
  assert.deepEqual(B.resolve(B.flatten(mk('{g.b}', 7)))[0].value, 7);
});

// ------------------------------------------------------------ snapshots

for (const u of [1, 4, 8]) {
  test(`snapshots: u = ${u} outputs`, () => {
    for (const [file, text] of Object.entries(outputs(u))) snapshot(`u${u}.${file}`, text);
  });
}

test('dist/ is up to date with the master', () => {
  for (const u of [1, 4, 8]) {
    for (const [file, text] of Object.entries(outputs(u))) {
      const p = path.join(B.ROOT, 'dist', u === 1 ? '' : `u${u}`, file);
      assert.equal(fs.readFileSync(p, 'utf8'), text, `${p} is stale; run npm run build:tokens`);
    }
  }
});

test('CLI writes the four outputs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));
  const r = spawnSync(process.execPath, [path.join(B.ROOT, 'tools/build-tokens/build.mjs'), '--unit', '4', '--out', dir]);
  assert.equal(r.status, 0, String(r.stderr));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'u4')).sort(), ['_fp.scss', 'design-system-tokens.json', 'fp.css', 'fp.tailwind.cjs']);
  const bad = spawnSync(process.execPath, [path.join(B.ROOT, 'tools/build-tokens/build.mjs'), '--unit', '3', '--out', dir]);
  assert.notEqual(bad.status, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------- u = 4 and u = 8

test('u = 4 profile: layout lengths scale, fine details do not (FP-MATH-06, FP-MATH-07)', () => {
  const t = byId(tokensAt(4));
  const px = (id) => t[id].value.value;
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
  for (const n of fib) assert.equal(px(`space.${n}`), n * 4);
  assert.equal(px('space.13'), 52);
  assert.equal(px('target.coarse'), 52);
  assert.equal(px('target.fine'), 32);
  for (const n of [610, 987, 1597]) assert.equal(px(`container.${n}`), n);
  for (const n of [2, 3, 5, 8, 13, 21]) assert.equal(px(`radius.${n}`), n);
  assert.equal(px('line.hairline'), 1);
  assert.equal(px('focus.gap'), 2);
  assert.equal(px('focus.ring'), 3);
  assert.equal(px('type.0'), 16);
  assert.equal(px('type.micro'), 11);
  const css = cssVars(outputs(4)['fp.css']);
  assert.equal(css['--fp-space-13'], '52px');
  assert.equal(css['--fp-type-0'], '1rem');
});

test('u = 8 profile and floors never lowered (FP-TOKEN-06)', () => {
  const t = byId(tokensAt(8));
  assert.equal(t['space.8'].value.value, 64);
  assert.equal(t['target.coarse'].value.value, 64);
  assert.equal(t['target.fine'].value.value, 24);
  for (const u of [1, 4, 8]) {
    const x = byId(tokensAt(u));
    assert.ok(x['target.coarse'].value.value >= 44);
    assert.ok(x['target.fine'].value.value >= 24);
    assert.equal(x['type.0'].value.value, 16);
    assert.equal(x['type.micro'].value.value, 11);
  }
  assert.throws(() => B.applyUnit(B.resolve(B.flatten(master)), 3), /FP-MATH-06/);
  assert.throws(() => B.applyUnit(B.resolve(B.flatten(master)), 16), /FP-MATH-06/);
});

// ------------------------------------------------------- list format

test('list format: shape, name rules, usage notes', () => {
  for (const u of [1, 4, 8]) {
    const d = JSON.parse(outputs(u)['design-system-tokens.json']);
    assert.equal(typeof d.name, 'string');
    assert.equal(d.version, version);
    assert.ok(Array.isArray(d.color.themes) && d.color.themes.every((x) => x.id && x.name));
    assert.ok(Array.isArray(d.color.tokens));
    assert.ok(Array.isArray(d.type.fonts));
    assert.equal(typeof d.type.families, 'object');
    for (const g of d.type.groups) {
      assert.ok(d.type.families[g.family], `family ${g.family}`);
      for (const s of g.styles) {
        assert.match(s.name, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/);
        assert.equal(typeof s.fontSize, 'string');
        assert.equal(typeof s.lineHeight, 'number');
        assert.equal(typeof s.fontWeight, 'number');
      }
    }
    const seen = new Set();
    for (const [fam, v] of Object.entries(d)) {
      if (['name', 'version', 'type'].includes(fam)) continue;
      assert.ok(Array.isArray(v.tokens), fam);
      for (const tk of v.tokens) {
        assert.match(tk.name, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/);
        assert.ok(!seen.has(tk.name), `duplicate name ${tk.name}`);
        seen.add(tk.name);
        assert.equal(typeof tk.value, 'string');
        assert.ok(tk.usage.length > 0, `usage ${tk.name}`);
      }
    }
    for (const fam of ['spacing', 'radius']) assert.ok(d[fam].tokens.length > 0);
  }
});

// ------------------------------------------- values against the spec

const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
const TYPE_BODY16 = { n1: 13, 0: 16, 1: 20, 2: 26, 3: 33, 4: 42, 5: 53, 6: 68, 7: 86, 8: 110 };
const LEADING = { body: 1.618, dense: 1.5, small: 1.382, heading: 1.236, display: 1.146 };

test('CSS: ladder, radius, containers, focus, hairline (FP-MATH-03, FP-RADIUS-01, FP-PLAT-02)', () => {
  const css = cssVars(outputs(1)['fp.css']);
  for (const n of FIB) assert.equal(css[`--fp-space-${n}`], `${n}px`);
  assert.ok(!('--fp-space-0' in css) && !('--fp-space-4' in css) && !('--fp-space-6' in css));
  for (const n of [610, 987, 1597]) assert.equal(css[`--fp-container-${n}`], `${n}px`);
  for (const n of [2, 3, 5, 8, 13, 21]) assert.equal(css[`--fp-radius-${n}`], `${n}px`);
  assert.equal(css['--fp-radius-pill'], '9999px');
  assert.equal(css['--fp-radius-round'], '50%');
  assert.ok(!('--fp-radius-0' in css));
  assert.equal(css['--fp-focus-gap'], '2px');
  assert.equal(css['--fp-focus-ring'], '3px');
  assert.equal(css['--fp-line-hairline'], '1px');
});

test('CSS: type scale for body 16 in rem, micro floor, leading (FP-TYPE-01, -04, -05, -07)', () => {
  const css = cssVars(outputs(1)['fp.css']);
  const phi = (1 + Math.sqrt(5)) / 2;
  for (const [k, px] of Object.entries(TYPE_BODY16)) {
    const kk = k === 'n1' ? -1 : Number(k);
    assert.equal(px, Math.floor(16 * phi ** (kk / 2) + 0.5), `table vs formula k=${kk}`);
    assert.equal(css[`--fp-type-${k}`], `${px / 16}rem`, `type ${k}`);
  }
  assert.equal(css['--fp-type-micro'], '0.6875rem');
  for (const [k, v] of Object.entries(LEADING)) assert.equal(css[`--fp-leading-${k}`], String(v));
  for (const v of Object.entries(css).filter(([k]) => k.startsWith('--fp-type-')).map(([, x]) => x)) assert.match(v, /rem$/);
});

test('CSS: targets, pointer query, durations, easing, layers, tone (FP-CTRL-01, FP-PLAT-03, FP-MOTION)', () => {
  const css = outputs(1)['fp.css'];
  const v = cssVars(css);
  assert.equal(v['--fp-target-coarse'], '55px');
  assert.equal(v['--fp-target-floor-coarse'], '44px');
  assert.equal(v['--fp-target-floor-fine'], '24px');
  const root = css.slice(0, css.indexOf('@media'));
  const media = css.slice(css.indexOf('@media'));
  assert.match(root, /--fp-target: 55px;/);
  assert.match(media, /@media \(pointer: fine\) and \(not \(any-pointer: coarse\)\) \{\s+:root \{\s+--fp-target: 34px;/);
  assert.ok(!/34px/.test(root.replace('--fp-space-34: 34px;', '')), 'fine target outside the query');
  for (const n of [89, 144, 233, 377]) assert.equal(v[`--fp-duration-${n}`], `${n}ms`);
  assert.equal(v['--fp-easing-standard'], 'cubic-bezier(0.4, 0, 0.2, 1)');
  assert.equal(v['--fp-easing-enter'], 'cubic-bezier(0, 0, 0.2, 1)');
  assert.equal(v['--fp-easing-exit'], 'cubic-bezier(0.4, 0, 1, 1)');
  assert.deepEqual([v['--fp-layer-base'], v['--fp-layer-raised'], v['--fp-layer-overlay'], v['--fp-layer-popover'], v['--fp-layer-toast']], ['1', '2', '3', '13', '21']);
  assert.deepEqual([1, 2, 3, 4, 5].map((i) => v[`--fp-tone-${i}`]), ['0.618', '0.382', '0.236', '0.146', '0.09']);
  assert.deepEqual([v['--fp-split-major'], v['--fp-split-minor']], ['1.618fr', '1fr']);
});

test('constants match the closed forms (FP-MATH-01)', () => {
  const t = byId(tokensAt(1));
  const phi = (1 + Math.sqrt(5)) / 2;
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} vs ${b}`);
  close(t['math.phi'].value, phi);
  close(t['math.phi-inverse'].value, phi - 1);
  close(t['math.phi-inverse-squared'].value, 2 - phi);
  close(t['math.phi-root'].value, Math.sqrt(phi));
  close(t['math.golden-angle-degrees'].value, 137.50776405003785);
  close(t['math.golden-angle-radians'].value, 2.399963229728653);
  assert.equal(t['math.hash-constant'].value, 2654435769);
});

test('SCSS: variables and map carry every token', () => {
  const scss = outputs(1)['_fp.scss'];
  const css = cssVars(outputs(1)['fp.css']);
  assert.match(scss, /^\$fp-space-13: 13px;$/m);
  assert.match(scss, /^\$fp-type-n1: 0\.8125rem;$/m);
  assert.match(scss, /^\$fp-target-fine: 34px;$/m);
  assert.match(scss, /\$fp-tokens: \(/);
  const decls = [...scss.matchAll(/^\$fp-([a-z0-9-]+): ([^;\n]+);$/gm)];
  const mapKeys = [...scss.matchAll(/^ {2}"([a-z0-9-]+)": \$fp-/gm)];
  assert.equal(mapKeys.length, decls.length, 'map has one entry per variable');
  assert.equal(new Set(mapKeys.map((m) => m[1])).size, mapKeys.length);
  for (const [, name, val] of decls.filter(([, n]) => n !== 'tokens' && n !== 'target-fine')) {
    if (name === 'target') continue;
    assert.equal(css[`--fp-${name}`], val, name);
  }
});

test('Tailwind preset: ladder, radius, type with leading, durations, z-index, widths (FP-PLAT-04)', () => {
  const file = path.join(os.tmpdir(), `fp-tw-${process.pid}.cjs`);
  fs.writeFileSync(file, outputs(1)['fp.tailwind.cjs']);
  const { theme } = require(file);
  fs.rmSync(file);
  for (const n of FIB) assert.equal(theme.spacing[n], `${n}px`);
  assert.equal(theme.spacing[0], '0px');
  assert.equal(theme.borderRadius[0], '0px');
  assert.equal(theme.borderRadius[13], '13px');
  assert.equal(theme.borderRadius.pill, '9999px');
  assert.equal(theme.borderRadius.round, '50%');
  for (const [k, px] of Object.entries(TYPE_BODY16)) {
    const lead = k === 'n1' ? 1.382 : k === '0' ? 1.618 : Number(k) <= 3 ? 1.236 : 1.146;
    assert.deepEqual(theme.fontSize[k], [`${px / 16}rem`, { lineHeight: String(lead) }], `fontSize ${k}`);
  }
  assert.deepEqual(theme.fontSize.micro, ['0.6875rem', { lineHeight: '1.382' }]);
  assert.deepEqual(theme.transitionDuration, { DEFAULT: '233ms', 89: '89ms', 144: '144ms', 233: '233ms', 377: '377ms' });
  assert.equal(theme.extend.zIndex.toast, '21');
  assert.deepEqual(theme.extend.maxWidth, { 610: '610px', 987: '987px', 1597: '1597px' });
});

test('fine target is documented as pointer-query only (FP-PLAT-03)', () => {
  assert.match(outputs(1)['_fp.scss'], /\/\/ Valid only inside the pointer query[^\n]*\n\$fp-target-fine: 34px;/);
  const d = JSON.parse(outputs(1)['design-system-tokens.json']);
  assert.match(d.target.tokens.find((x) => x.name === 'target-fine').usage, /only inside the pointer query/);
});

test('Tailwind u = 4 and u = 8 keep the sub-unit 1 and 2 (FP-MATH-06)', () => {
  for (const u of [4, 8]) {
    const file = path.join(os.tmpdir(), `fp-tw${u}-${process.pid}.cjs`);
    fs.writeFileSync(file, outputs(u)['fp.tailwind.cjs']);
    const { theme } = require(file);
    fs.rmSync(file);
    assert.equal(theme.spacing['sub-1'], '1px');
    assert.equal(theme.spacing['sub-2'], '2px');
    assert.equal(theme.spacing[13], `${13 * u}px`);
  }
});

test('units outside px/rem are numbers with the unit in $extensions (FP-TOKEN-02)', () => {
  const t = byId(tokensAt(1));
  assert.equal(t['radius.round'].type, 'number');
  assert.equal(t['radius.round'].ext.unit, '%');
  assert.equal(t['split.major'].value, 1.618);
  assert.equal(t['split.major'].ext.unit, 'fr');
  assert.equal(t['split.minor'].value, 1);
});

test('list format values match the spec tables', () => {
  const d = JSON.parse(outputs(1)['design-system-tokens.json']);
  const val = (fam, name) => d[fam].tokens.find((x) => x.name === name)?.value;
  for (const n of FIB) assert.equal(val('spacing', `space-${n}`), `${n}px`);
  assert.equal(val('target', 'target-coarse'), '55px');
  assert.equal(val('target', 'target-fine'), '34px');
  const styles = Object.fromEntries(d.type.groups.flatMap((g) => g.styles).map((s) => [s.name, s]));
  assert.equal(styles['type-0'].fontSize, '1rem');
  assert.equal(styles['type-0'].lineHeight, 1.618);
  assert.equal(styles['type-0-dense'].lineHeight, 1.5);
  assert.equal(styles['type-n1'].fontSize, '0.8125rem');
  assert.equal(styles['type-micro'].fontSize, '0.6875rem');
  assert.equal(styles['type-4-display'].lineHeight, 1.146);
  assert.ok(!('type-5' in styles) && !('type-7' in styles), 'unused odd steps are not offered');
});

test('no private names or paths in outputs', () => {
  for (const u of [1, 4, 8]) {
    for (const text of Object.values(outputs(u))) {
      assert.ok(!/\/(Users|home)\/|claude\.ai|cursor\.com/i.test(text));
      assert.ok(text.includes('https://www.lyrikai.com') || text.trim().startsWith('{'));
    }
  }
});
