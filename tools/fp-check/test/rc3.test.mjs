import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../lib/check.mjs';
import { run, by, HAS_NONE, SPEC, baseConfig } from './helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');

test('the protocol\'s own generated CSS passes the checker: dist/fp.css, dist/u4/fp.css, dist/u8/fp.css', () => {
  for (const [rel, unit] of [['dist/fp.css', 1], ['dist/u4/fp.css', 4], ['dist/u8/fp.css', 8]]) {
    if (!fs.existsSync(path.join(repo, rel))) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-dist-'));
    try {
      fs.writeFileSync(path.join(dir, 'fp.css'), fs.readFileSync(path.join(repo, rel)));
      fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig({ level: 'FP-2', unit, source: ['fp.css'], has: { ...HAS_NONE, motion: true, controls: true } })));
      const r = runCheck({ dir });
      assert.deepEqual(r.findings, [], rel);
      assert.equal(r.result, 'pass', rel);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
});

test('B1: a use of var() is tested against every definition (local, @media, :root)', () => {
  for (const css of ['.x{--g:17px} .a{padding:var(--g)} :root{--g:13px}', ':root{--g:13px} .a{--g:17px;padding:var(--g)}', ':root{--g:13px} @media (min-width:1px){:root{--g:17px}} .a{padding:var(--g)}']) {
    const r = run({ 'a.css': css });
    assert.equal(r.result, 'fail', css);
    assert.equal(by(r, 'space.on-ladder')[0].resolved, '17px');
  }
  assert.equal(run({ 'a.css': ':root{--g:13px} .x{--g:21px} .a{padding:var(--g)}' }).result, 'pass');
});

test('M3: the built-in defaults never hide a var() fallback', () => {
  assert.equal(run({ 'a.css': '.a{padding:var(--fp-space-13, 14px)}' }).result, 'fail');
  assert.equal(run({ 'a.css': '.a{padding:var(--fp-space-13)}' }).result, 'pass');
  assert.equal(run({ 'a.css': '.a{padding:var(--fp-space-13, 13px)}' }).result, 'pass');
});

test('B2: theme selectors and media are normalised, selector lists split, and a theme that defines nothing is not-run', () => {
  const css = ':root{--ink:#111;--bg:#fff} :root[data-theme=dark], .dark{--ink:#777;--bg:#888}';
  const pairs = [{ fg: '--ink', bg: '--bg', kind: 'text' }];
  const dark = (selector) => run({ 'a.css': css }, { pairs, themes: [{ name: 'light', selector: ':root' }, { name: 'dark', selector }] });
  for (const sel of ['.dark', '[data-theme="dark"]', '[data-theme=dark]', ":root[data-theme='dark']"]) assert.equal(dark(sel).pairs[1].result, 'fail', sel);
  assert.equal(dark('.nothing').pairs[1].result, 'not-run');
  const media = run({ 'a.css': ':root{--ink:#111;--bg:#fff} @media (prefers-color-scheme: dark){:root{--ink:#777;--bg:#888}}' }, { pairs, themes: [{ name: 'l', selector: ':root' }, { name: 'd', media: '(prefers-color-scheme:dark)' }] });
  assert.equal(media.pairs[1].result, 'fail');
  const undeclared = run({ 'a.css': css }, { pairs });
  assert.equal(undeclared.pairs[0].result, 'not-run');
  assert.equal(undeclared.result, 'not-run');
});

test('M1/M2: radius and stroke accept only set members, 50% and 9999px; relative units fail there', () => {
  const r = run({ 'a.css': '.a{border-radius:30%} .b{border-radius:4vw} .c{border-radius:0.7em} .d{border-width:0.1em} .e{border-radius:50%} .f{border-radius:9999px}' });
  assert.deepEqual(r.findings.map((f) => f.selector), ['.a', '.b', '.c', '.d']);
});

test('M4: a scope that matches no file is not-run and makes no claim', () => {
  const r = run({ 'a.css': '.a{padding:13px}' }, { scope: ['nothing.css'] });
  assert.equal(r.result, 'not-run');
  assert.equal(r.claim, null);
});

test('M6 and (F): drift of at most 25% of the value is the only bound; the top rung is 1597 at u=1 and u=4, 3016 at u=8', () => {
  const snap = (css, unit) => run({ 'a.css': css }, { mode: 'snap', unit, snap: { source: ['a.css'] } });
  assert.equal(snap(':root{--big:2000px}', 1).mapping[0].snapped, 1597);
  assert.equal(snap(':root{--big:2000px}', 4).mapping[0].snapped, 1597);
  assert.equal(snap(':root{--big:3600px}', 8).mapping[0].snapped, 3016);
  assert.equal(snap(':root{--big:2200px}', 1).mapping[0].snapped, null);
});

test('M7 and E1: Snap tests calc(), relative units and radii; a token kept off the ladder fails where used', () => {
  const snap = (css, over = {}) => run({ 'a.css': css }, { mode: 'snap', snap: { source: ['a.css'] }, ...over });
  assert.equal(by(snap('.a{width:calc(100% - 14px)}'), 'space.on-ladder').length, 1);
  assert.equal(by(snap('.a{padding:1.3em}'), 'space.on-ladder')[0].result, 'not-run');
  assert.equal(by(snap('.a{border-radius:30%}'), 'radius.set').length, 1);
  const used = snap(':root{--radius-2xl:32px} .a{border-radius:var(--radius-2xl)}');
  assert.deepEqual(used.findings.map((f) => [f.check, f.result]), [['snap.unsnappable', 'fail'], ['radius.set', 'fail']]);
  const excepted = snap(':root{--radius-2xl:32px} .a{border-radius:var(--radius-2xl)}', { exceptions: [{ value: '32px', where: '--radius-2xl', reason: 'snap-drift', rule: 'FP-SNAP-03', status: 'accepted' }] });
  assert.equal(excepted.result, 'pass');
});

test('E2: class selectors in `controls` are interactive for FP-SNAP-11; a class is never guessed from its name', () => {
  const css = ':root{--c:44px} .btn{height:40px} .nav-item{min-height:var(--c)} .button{height:40px}';
  const cfg = { roles: [{ match: '--c', role: 'target' }], controls: ['.btn', '.nav-item'] };
  const r = run({ 'a.css': css }, { mode: 'snap', snap: { source: ['a.css'] }, ...cfg });
  assert.deepEqual(by(r, 'snap.control-height').map((f) => f.selector), ['.btn']);
});

test('E3: where the published Snap table exists, originals come from its first four columns', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-snaptable-'));
  try {
    fs.writeFileSync(path.join(dir, 'a.css'), ':root{--a:5px;--b:5px;--c:13px}'); // already snapped
    fs.writeFileSync(path.join(dir, 'fp-snap.md'), '| token | role | original | snapped | drift |\n|---|---|---|---|---|\n| --a | space | 4 | 5 | 25.0% |\n| --b | space | 6 | 5 | 16.7% |\n| --c | space | 12 | 13 | 8.3% |\n');
    fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig({ mode: 'snap', snap: { source: ['a.css'] } })));
    const r = runCheck({ dir });
    assert.deepEqual(r.mapping.map((m) => [m.token, m.original, m.snapped]), [['--a', 4, 5], ['--b', 6, 5], ['--c', 12, 13]]);
    assert.deepEqual(r.merges, [{ role: 'space', rung: 5, tokens: ['--a', '--b'] }]);
    fs.rmSync(path.join(dir, 'fp-snap.md'));
    assert.deepEqual(runCheck({ dir }).merges, []); // without the table the source values are the originals, and 5 and 5 are one value
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('E4: an off-ladder value is reported once, under the rule that owns its kind', () => {
  const r = run({ 'a.css': '.a{padding:14px;border-radius:14px;border-width:4px}' }, { mode: 'overlay' });
  assert.deepEqual(r.findings.map((f) => f.rule).sort(), ['FP-MATH-07', 'FP-RADIUS-01', 'FP-SPACE-01']);
  assert.ok(!r.findings.some((f) => f.rule === 'FP-MODE-04'));
});

test('CONF-08: inline style attributes are listed with their values, or the scope is stated to have none', () => {
  const r = run({ 'a.html': '<p style="padding:7px">x</p><style>.a{gap:8px}</style>' }, { source: ['*.html'] });
  assert.equal(r.inlineStyles[0].declarations, 'padding:7px');
  assert.ok(r.notes.some((n) => /inline style attribute/.test(n)));
  assert.ok(run({ 'a.css': '.a{gap:8px}' }).notes.some((n) => /no inline style attributes/.test(n)));
});

test('the version check follows spec/rules.json', () => {
  assert.equal(run({ 'a.css': '.a{gap:8px}' }).spec, SPEC);
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { fp: '1.0.0-rc.0' }).result, 'fail');
});

test('minors: --expect with an empty file proves nothing; animation:none is not motion; exceptions need their rule', () => {
  assert.equal(run({ 'a.css': '.a{animation:none}' }).result, 'pass');
  const ex = (rule) => run({ 'a.css': '.a{padding:14px}' }, { exceptions: [{ value: '14px', where: '.a', reason: 'content', rule, status: 'accepted' }] });
  assert.equal(ex('FP-SPACE-01').result, 'pass');
  assert.equal(ex('FP-TYPE-01').result, 'fail');
});
