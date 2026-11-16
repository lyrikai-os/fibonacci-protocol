import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run, by, HAS_NONE, SPEC, baseConfig } from './helpers.mjs';
import { runCheck } from '../lib/check.mjs';
import { unescapeCss } from '../lib/css.mjs';

const pairs = (css, cfg = {}, p = [{ fg: '--ink', bg: '--bg', kind: 'text' }]) => run({ 'a.css': css }, { pairs: p, ...cfg }).pairs;

test('A-M1: a pair is tested against every unconditional definition; !important wins; unresolvable is not-run', () => {
  const a = pairs(':root{--ink:#111;--bg:#fff} :root{--ink:#ddd}');
  assert.equal(a[0].result, 'fail'); assert.equal(a[0].definitionsTested, 2); assert.equal(a[0].ratio, 1.358);
  const b = pairs(':root{--ink:#111 !important;--bg:#fff} :root{--ink:#ddd}');
  assert.equal(b[0].result, 'pass'); assert.equal(b[0].definitionsTested, 1);
  assert.equal(pairs(':root{--bg:#fff}')[0].result, 'not-run');
  assert.equal(pairs(':root{--ink:#111;--bg:#fff} @media (x){:root{--ink:#ddd}}')[0].result, 'not-run', 'a conditional override no declared theme covers cannot be tested, so it is not a pass');
  const chain = pairs(':root{--c:#111;--c:#ddd;--ink:var(--c);--bg:#fff}');
  assert.equal(chain[0].result, 'fail');
});

test('A-M2: n/a on an applicable self-report item fails conf.evidence and the run', () => {
  const ids = run({ 'a.css': '.a{gap:8px}' }).applicableSelfReport;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-na-'));
  try {
    fs.writeFileSync(path.join(dir, 'a.css'), '.a{gap:8px}');
    fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig()));
    const items = Object.fromEntries(ids.map((id) => [id, { result: 'pass', evidence: 'x', by: 'A' }]));
    items['FP-MODE-07'] = { result: 'n/a', evidence: 'does not apply', by: 'A' };
    fs.writeFileSync(path.join(dir, 'fp-evidence.json'), JSON.stringify({ fp: SPEC, adopter: 'A', items }));
    const r = runCheck({ dir });
    assert.equal(r.result, 'fail'); assert.equal(r.claimState, 'none'); assert.deepEqual(r.openItems, []);
    assert.deepEqual(r.findings.map((f) => [f.item, f.check]), [['FP-MODE-07', 'conf.evidence']]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('A-M3: the text output starts with MACHINE TESTS, never RESULT; JSON keeps result and claimState', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-head-'));
  try {
    fs.writeFileSync(path.join(dir, 'a.css'), '.a{gap:8px}');
    fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig()));
    const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fp-check.mjs');
    const t = spawnSync(process.execPath, [cli, dir], { encoding: 'utf8' }).stdout;
    assert.equal(t.split('\n')[0], 'MACHINE TESTS: PASS');
    assert.ok(!/RESULT:/.test(t));
    assert.match(t, /CLAIM STATE: candidate/);
    const j = JSON.parse(spawnSync(process.execPath, [cli, dir, '--json'], { encoding: 'utf8' }).stdout);
    assert.equal(j.result, 'pass'); assert.equal(j.claimState, 'candidate'); assert.equal(j.outputFirstLine, 'MACHINE TESTS: PASS');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('A-M5: HTML markup contradicts has.controls and has.motion', () => {
  const html = (body) => run({ 'i.html': `<!doctype html><body>${body}</body>` }, { source: ['i.html'] });
  const has = (r) => r.findings.filter((f) => f.check === 'conf.not-applicable').map((f) => f.has).sort();
  for (const el of ['<button>x</button>', '<a href="/x">x</a>', '<input>', '<select></select>', '<textarea></textarea>', '<details><summary>s</summary></details>', '<div role="tab">t</div>', '<div role=switch>t</div>']) assert.deepEqual(has(html(el)), ['controls'], el);
  assert.deepEqual(has(html('<a name="x">anchor</a><div role="img">i</div>')), []);
  for (const el of ['<marquee>m</marquee>', '<svg><animate/></svg>', '<svg><animateTransform/></svg>', '<svg><animateMotion/></svg>']) assert.deepEqual(has(html(el)), ['motion'], el);
  assert.deepEqual(has(html('<!-- <button> --><script>var s="<button>"</script>')), [], 'comments and scripts are not markup');
});

test('A-M5: a11y.focus-outline-removed (FP-A11Y-12)', () => {
  const f = (css) => by(run({ 'a.css': css }, { has: { ...HAS_NONE, controls: true } }), 'a11y.focus-outline-removed').map((x) => x.selector);
  assert.deepEqual(f('.a:focus{outline:none}'), ['.a:focus']);
  assert.deepEqual(f('.a:focus-visible{outline:0}'), ['.a:focus-visible']);
  assert.deepEqual(f('.a:focus{outline-width:0}'), ['.a:focus']);
  assert.deepEqual(f('.a:focus{outline:none;box-shadow:0 0 0 3px red}'), []);
  assert.deepEqual(f('.a:focus{outline:0;border-color:red}'), []);
  assert.deepEqual(f('.a:focus{outline:2px solid red}'), []);
  assert.deepEqual(f('.a{outline:none}'), []);
  assert.deepEqual(f('.a:focus-within{outline:none}'), []);
});

test('FP-A11Y-02: large-text needs a size and qualifies only at 24px, or 18.67px bold; else it is tested as text', () => {
  const css = ':root{--ink:#949494;--bg:#fff}';
  const r = (size) => pairs(css, {}, [{ fg: '--ink', bg: '--bg', kind: 'large-text', size }])[0];
  assert.equal(r({ px: 24, weight: 400 }).result, 'pass');
  assert.equal(r({ px: 18.67, weight: 700 }).result, 'pass');
  const small = r({ px: 20, weight: 400 });
  assert.equal(small.result, 'fail'); assert.equal(small.required, 4.5); assert.equal(small.qualifiesAsLarge, false);
  assert.equal(r({ px: 18.66, weight: 700 }).result, 'fail');
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { pairs: [{ fg: '#949494', bg: '#fff', kind: 'large-text' }] }).result, 'fail', 'size is required by the schema');
});

test('CSS escapes in a property name are resolved before classification', () => {
  assert.equal(unescapeCss('pad\\64ing'), 'padding');
  assert.equal(unescapeCss('\\70 adding'), 'padding');
  assert.equal(run({ 'a.css': '.a{pad\\64ing:14px}' }).result, 'fail');
  assert.equal(run({ 'a.css': '.a{\\70 adding:14px}' }).result, 'fail');
});

test('the schema refuses 5- and 7-digit hex colours; FP-CTRL-04 follows has.controls', () => {
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { pairs: [{ fg: '#12345', bg: '#fff', kind: 'text' }] }).result, 'fail');
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { pairs: [{ fg: '#1234567', bg: '#fff', kind: 'text' }] }).result, 'fail');
  const off = run({ 'a.css': '.a{gap:8px}' }, { mode: 'overlay' });
  assert.ok(!off.applicableSelfReport.includes('FP-CTRL-04'));
  const on = run({ 'a.css': 'button{gap:8px}' }, { mode: 'overlay', has: { ...HAS_NONE, controls: true } });
  assert.ok(on.applicableSelfReport.includes('FP-CTRL-04'));
});
