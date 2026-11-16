import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCheck } from '../lib/check.mjs';
import { baseConfig, SPEC } from './helpers.mjs';

function project(css, cfg, evidence) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-evidence-'));
  fs.writeFileSync(path.join(dir, 'a.css'), css);
  fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig(cfg)));
  if (evidence) fs.writeFileSync(path.join(dir, 'fp-evidence.json'), JSON.stringify(typeof evidence === 'function' ? evidence(dir) : evidence));
  return dir;
}
const check = (...a) => { const d = project(...a); try { return runCheck({ dir: d }); } finally { fs.rmSync(d, { recursive: true, force: true }); } };
const full = (ids, over = {}, extra = {}) => ({ fp: SPEC, adopter: 'Acme', items: Object.fromEntries(ids.map((id) => [id, { result: 'pass', evidence: 'see evidence/' + id + '.md', by: 'Acme', ...over }])), ...extra });

test('applicable self-report rules come from rules.json: normative, within the level, applies-when true', () => {
  const r1 = check('.a{gap:8px}', {});
  assert.ok(r1.applicableSelfReport.includes('FP-MATH-04'));
  assert.ok(!r1.applicableSelfReport.includes('FP-TYPE-06'), 'FP-2 rule at an FP-1 claim');
  assert.ok(!r1.applicableSelfReport.includes('FP-A11Y-05'), 'has.controls is false');
  assert.ok(!r1.applicableSelfReport.includes('FP-CONF-10'), 'binds a checker');
  const r2 = check('.a{gap:8px}', { level: 'FP-2', has: { motion: false, timeLimits: false, controls: true, charts: false, generatedArt: false, states: false } });
  assert.ok(r2.applicableSelfReport.includes('FP-TYPE-06') && r2.applicableSelfReport.includes('FP-A11Y-05'));
  assert.ok(!r2.applicableSelfReport.includes('FP-LINE-01'), 'informative');
});

test('no evidence file: a candidate line, the open IDs, no claim, machine result pass', () => {
  const r = check('.a{gap:8px}', {});
  assert.equal(r.result, 'pass'); assert.equal(r.claimState, 'candidate'); assert.equal(r.claim, null);
  assert.equal(r.candidate, `candidate · FP-1 · Native · u=1 · web · spec ${SPEC} · self-assessed · open ${r.applicableSelfReport.length}`);
  assert.deepEqual(r.openItems, r.applicableSelfReport);
});

test('complete evidence by the adopter: a valid claim that keeps self-assessed', () => {
  const ids = check('.a{gap:8px}', {}).applicableSelfReport;
  const r = check('.a{gap:8px}', {}, full(ids));
  assert.equal(r.claimState, 'valid'); assert.deepEqual(r.openItems, []);
  assert.equal(r.claim, `FP-1 · Native · u=1 · web · spec ${SPEC} · self-assessed`);
  assert.ok(r.rules.find((x) => x.id === 'FP-MATH-04').reason.startsWith('Acme'));
});

test('an empty evidence string leaves the rule open; a missing entry too', () => {
  const ids = check('.a{gap:8px}', {}).applicableSelfReport;
  const ev = full(ids); ev.items['FP-MATH-04'].evidence = ''; delete ev.items['FP-MODE-07'];
  const r = check('.a{gap:8px}', {}, ev);
  assert.deepEqual(r.openItems, ['FP-MATH-04', 'FP-MODE-07']);
  assert.match(r.candidate, / · open 2$/);
});

test('the suffix is dropped only when every item is independent and by is not the adopter', () => {
  const ids = check('.a{gap:8px}', {}).applicableSelfReport;
  const indep = check('.a{gap:8px}', {}, full(ids, { by: 'Auditor Ltd', independent: true }));
  assert.equal(indep.claim, `FP-1 · Native · u=1 · web · spec ${SPEC}`);
  const mixed = full(ids, { by: 'Auditor Ltd', independent: true }); mixed.items['FP-MATH-04'].independent = false;
  assert.ok(check('.a{gap:8px}', {}, mixed).claim.endsWith('self-assessed'));
  const sameAsAdopter = full(ids, { by: 'Acme', independent: true });
  assert.ok(check('.a{gap:8px}', {}, sameAsAdopter).claim.endsWith('self-assessed'));
});

test('an item answered fail fails the run', () => {
  const ids = check('.a{gap:8px}', {}).applicableSelfReport;
  const ev = full(ids); ev.items['FP-A11Y-03'].result = 'fail';
  const r = check('.a{gap:8px}', {}, ev);
  assert.equal(r.result, 'fail'); assert.equal(r.claim, null); assert.equal(r.claimState, 'none');
  assert.ok(r.findings.some((f) => f.check === 'conf.evidence' && f.selfReport === 'FP-A11Y-03'));
});

test('an invalid or wrong-version evidence file fails conf.evidence', () => {
  assert.equal(check('.a{gap:8px}', {}, { fp: SPEC, items: {} }).result, 'fail'); // adopter missing
  assert.equal(check('.a{gap:8px}', {}, { fp: '1.0.0-rc.0', adopter: 'A', items: {} }).result, 'fail');
  assert.equal(check('.a{gap:8px}', {}, { fp: SPEC, adopter: 'A', items: { 'FP-MATH-04': { result: 'maybe', evidence: 'x', by: 'A' } } }).result, 'fail');
});

test('a pending exception or a failing machine test gives no candidate either', () => {
  const r = check('.a{gap:7px}', {});
  assert.equal(r.claimState, 'none'); assert.equal(r.candidate, undefined);
});

test('FP-CONF-08: widths inside @media and @container conditions are never tested; declarations inside are', () => {
  const css = '@media (min-width: 700px) and (max-width:999px){.a{gap:8px}} @media (width >= 701px){.b{gap:8px}} @container card (min-width: 333px){.c{gap:7px}}';
  const r = check(css, { has: { motion: false, timeLimits: false, controls: false, charts: false, generatedArt: false, states: false } });
  assert.deepEqual(r.findings.map((f) => f.selector), ['.c']);
});
