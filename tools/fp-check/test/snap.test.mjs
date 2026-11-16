import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, by } from './helpers.mjs';
import { mapLength, mapTarget, nearest, driftPct, findMerges, findOrderBreaches, ladderTarget } from '../lib/snap.mjs';
import { runCheck } from '../lib/check.mjs';
import { baseConfig } from './helpers.mjs';

const snap = (css, over = {}) => run({ 'a.css': css }, { mode: 'snap', snap: { source: ['a.css'] }, ...over });
const row = (r, t) => r.mapping.find((m) => m.token === t);

test('nearest rung: ties go up, and the 25% drift limit is exact (FP-SNAP-02, FP-SNAP-03)', () => {
  assert.equal(nearest(4, [3, 5]), 5);
  assert.deepEqual(mapLength(4, 'space', 1), { snapped: 5, drift: 25 });
  assert.equal(mapLength(6, 'space', 4).snapped, null);
  assert.equal(mapLength(6, 'space', 4).nearest, 8);
  assert.equal(mapLength(16, 'space', 4).snapped, 20);
  assert.equal(mapLength(0, 'space', 4).snapped, 0);
  assert.equal(mapLength(1, 'space', 4).note, 'exempt by value');
  assert.equal(mapLength(2, 'space', 1).note, undefined);
  assert.equal(mapLength(32, 'radius', 1).snapped, null);
  assert.equal(mapLength(12, 'radius', 4).snapped, 13);
  // beyond 1.25 x the top rung is never snapped
  assert.equal(mapLength(2100, 'space', 1).snapped, null);
  assert.equal(mapLength(1900, 'space', 1).snapped, 1597);
  assert.equal(driftPct(16, 21), 31.3);
  assert.equal(driftPct(24, 34), 41.7);
});

test('u = 8 cannot snap 4 or 12 (FP-MATH-06)', () => {
  assert.equal(mapLength(4, 'space', 8).snapped, null);
  assert.equal(mapLength(12, 'space', 8).snapped, null);
  assert.equal(mapLength(14, 'space', 8).snapped, 16);
  assert.equal(mapLength(20, 'space', 8).snapped, 24);
});

test('appendix tables: 4-based grid at u=1 and u=4, 8-based grid at u=1 and u=8', () => {
  const four = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128];
  assert.deepEqual(four.map((v) => mapLength(v, 'space', 1).snapped), [2, 5, 5, 8, 13, 13, 21, 21, 34, 34, 34, 34, 34, 55, 55, 89, 89, 89, 144]);
  assert.deepEqual(four.map((v) => mapLength(v, 'space', 4).snapped), [2, 4, null, 8, 12, 20, 20, 20, 32, 32, 32, 32, 52, 52, 52, 84, 84, 136, 136]);
  const eight = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72];
  assert.deepEqual(eight.map((v) => mapLength(v, 'space', 1).snapped), [2, 5, 5, 8, 8, 13, 13, 13, 21, 21, 34, 34, 34, 55, 55, 55, 89]);
  assert.deepEqual(eight.map((v) => mapLength(v, 'space', 8).snapped), [2, null, null, 8, 8, null, 16, 16, 24, 24, 40, 40, 40, 40, 64, 64, 64]);
});

test('targets never shrink (FP-SNAP-04): ladder target by u and pointer', () => {
  assert.deepEqual([1, 4, 8].map((u) => ladderTarget(u, 'both')), [55, 52, 64]);
  assert.deepEqual([1, 4, 8].map((u) => ladderTarget(u, 'fine')), [34, 32, 24]);
  assert.equal(mapTarget(44, 1, 'both').snapped, 55);
  assert.equal(mapTarget(64, 1, 'both').snapped, 89);
  assert.equal(mapTarget(64, 1, 'both').keepAllowed, true);
  assert.equal(mapTarget(32, 1, 'fine').snapped, 34);
  assert.equal(mapTarget(20, 8, 'fine').snapped, 24);
});

test('merges and order breaches', () => {
  const rows = [{ token: 'a', role: 'space', original: 4, snapped: 5, final: 5 }, { token: 'b', role: 'space', original: 6, snapped: 5, final: 5 }, { token: 'c', role: 'space', original: 8, snapped: 8, final: 8 }];
  assert.deepEqual(findMerges(rows), [{ role: 'space', rung: 5, tokens: ['a', 'b'] }]);
  assert.deepEqual(findOrderBreaches(rows), []);
  rows[0].final = 13;
  assert.equal(findOrderBreaches(rows).length, 1);
});

test('Snap: exemption is by declared role, never by value (FP-SNAP-01)', () => {
  const r = snap(':root{--a:16px;--b:24px;--icon:16px;--pad:16px}', { roles: [{ match: '--icon', role: 'icon' }] });
  assert.equal(row(r, '--a').snapped, 13);
  assert.equal(row(r, '--b').snapped, 21);
  assert.equal(row(r, '--icon').snapped, 16);
  assert.equal(row(r, '--icon').note, 'exempt by role, unchanged');
  assert.deepEqual(r.merges, []); // two tokens that were already equal lose nothing, so they are not a merge
});

test('Snap: a radius is a radius by name or by use, and maps to the radius set', () => {
  const r = snap(':root{--radius-1:6px;--thing:6px;--s:6px}.a{border-radius:var(--thing)}');
  assert.equal(row(r, '--radius-1').role, 'radius');
  assert.equal(row(r, '--thing').role, 'radius');
  assert.equal(row(r, '--s').role, 'space');
  assert.equal(row(r, '--radius-1').snapped, 5);
});

test('Snap: tokens already pointing at a protocol token and --fp-* names are left alone', () => {
  const r = snap(':root{--fp-space-13:13px;--x:var(--fp-space-13);--y:7px}');
  assert.deepEqual(r.mapping.map((m) => m.token), ['--x', '--y']);
  assert.equal(row(r, '--x').snapped, 13);
});

test('Snap: a DTCG dimension token file can hold the host tokens', () => {
  const r = run({ 'host.tokens.json': { spacing: { $type: 'dimension', sm: { $value: { value: 6, unit: 'px' } }, md: { $value: '16px' } } }, 'a.css': '.a{gap:8px}' }, { mode: 'snap', source: ['a.css'], snap: { source: ['host.tokens.json'] } });
  assert.deepEqual(r.mapping.map((m) => [m.token, m.snapped]), [['spacing.sm', 5], ['spacing.md', 13]]);
});

test('Snap: bare literals in the scope are mapped and listed; one that cannot be snapped needs an exception', () => {
  const r = snap('.a{padding:16px;border-radius:32px;border-width:1px}');
  assert.deepEqual(r.literals.map((l) => [l.property, l.original, l.snapped]), [['padding', 16, 13], ['border-radius', 32, null]]);
  assert.equal(r.result, 'fail');
  assert.equal(by(r, 'snap.unsnappable').length, 1);
  const ok = snap('.a{border-radius:32px}', { exceptions: [{ value: '32px', where: '.a', reason: 'snap-drift', rule: 'FP-SNAP-03', status: 'accepted' }] });
  assert.equal(ok.result, 'pass');
  const stroke = snap('.a{border-width:4px}');
  assert.equal(stroke.result, 'fail');
});

test('Snap: a snap-drift exception must say snap-drift, and a pending one makes the run pending', () => {
  const css = ':root{--radius-2xl:32px}';
  const wrong = snap(css, { exceptions: [{ value: '32px', where: '--radius-2xl', reason: 'host-token', rule: 'FP-SNAP-03', status: 'accepted' }] });
  assert.equal(wrong.result, 'fail');
  const pending = snap(css, { exceptions: [{ value: '32px', where: '--radius-2xl', reason: 'snap-drift', rule: 'FP-SNAP-03', status: 'pending' }] });
  assert.equal(pending.result, 'pending');
  assert.equal(by(pending, 'snap.unsnappable')[0].result, 'pending');
});

test('Snap overrides: limit 38.2%, order kept, exempt and unknown tokens refused (FP-SNAP-07)', () => {
  const css = ':root{--a:12px;--b:16px;--c:20px;--icon:16px}';
  const ov = (list) => snap(css, { roles: [{ match: '--icon', role: 'icon' }], snap: { source: ['a.css'], overrides: list } });
  const good = ov([{ token: '--b', to: 21, reason: 'r' }]);
  assert.equal(good.result, 'pass');
  assert.equal(good.final['--b'], 21);
  assert.deepEqual(good.merges, [{ role: 'space', rung: 13, tokens: ['--a', '--b'] }]);
  const far = ov([{ token: '--b', to: 34, reason: 'r' }]);
  assert.equal(far.result, 'fail');
  assert.equal(far.final['--b'], 13);
  assert.equal(ov([{ token: '--icon', to: 21, reason: 'r' }]).result, 'fail');
  assert.equal(ov([{ token: '--nope', to: 21, reason: 'r' }]).result, 'fail');
  assert.equal(ov([{ token: '--c', to: 13, reason: 'r' }]).orderBreaches.length, 0);
  assert.equal(ov([{ token: '--b', to: 21, reason: 'r' }, { token: '--c', to: 13, reason: 'r' }]).orderBreaches.length, 1);
  // 55 -> 34 drifts 38.18%: inside the limit; 34 -> 21 drifts 38.24%: outside it
  const inside = snap(':root{--x:55px}', { snap: { source: ['a.css'], overrides: [{ token: '--x', to: 34, reason: 'r' }] } });
  assert.equal(inside.overrides[0].result, 'pass');
  const outside = snap(':root{--x:34px}', { snap: { source: ['a.css'], overrides: [{ token: '--x', to: 21, reason: 'r' }] } });
  assert.equal(outside.overrides[0].result, 'fail');
});

test('Snap: control heights need the target or drawn role (FP-SNAP-11)', () => {
  const css = ':root{--ctl:44px;--drawn:40px}button{min-height:var(--ctl)} a.btn{height:40px} input{height:var(--drawn)} .card{height:50px}';
  const r = snap(css, { roles: [{ match: '--ctl', role: 'target' }, { match: '--drawn', role: 'drawn' }], has: { motion: false, timeLimits: false, controls: true, charts: false, generatedArt: false, states: false } });
  assert.deepEqual(by(r, 'snap.control-height').map((f) => f.selector), ['a.btn']);
});

test('Snap: a published table is verified when it exists', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-check-snap-'));
  try {
    fs.writeFileSync(path.join(dir, 'a.css'), ':root{--a:4px;--b:6px}');
    fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig({ mode: 'snap', snap: { source: ['a.css'] } })));
    assert.deepEqual(runCheck({ dir }).advisoryNotRun, ['snap.merge-listed']);
    fs.writeFileSync(path.join(dir, 'fp-snap.md'), '| --a | 4 | 5 |');
    assert.equal(runCheck({ dir }).result, 'fail');
    fs.writeFileSync(path.join(dir, 'fp-snap.md'), '| --a | 4 | 5 |\n| --b | 6 | 5 |');
    assert.equal(runCheck({ dir }).result, 'pass');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
