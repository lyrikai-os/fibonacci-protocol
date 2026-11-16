import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseConfig, SPEC } from './helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(here, '../fp-check.mjs');
const vectors = path.resolve(here, '../../../spec/test-vectors');
const fp = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

function project(css, cfg = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-check-cli-'));
  fs.writeFileSync(path.join(dir, 'a.css'), css);
  fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig(cfg)));
  return dir;
}

test('exit 0 on a pass, 1 on a fail', () => {
  const ok = project('.a{gap:8px}'); const bad = project('.a{gap:7px}');
  try {
    const a = fp(ok); assert.equal(a.status, 0); assert.match(a.stdout, /RESULT: PASS/); assert.match(a.stdout, /CANDIDATE \(not a claim\): candidate · FP-1 · Native/); assert.equal(JSON.parse(fp(ok, '--json').stdout).claimState, 'candidate');
    const b = fp(bad); assert.equal(b.status, 1); assert.match(b.stdout, /RESULT: FAIL/); assert.match(b.stdout, /FP-SPACE-01/);
  } finally { fs.rmSync(ok, { recursive: true }); fs.rmSync(bad, { recursive: true }); }
});

test('exit 2 on a usage error, a missing configuration and a not-run result', () => {
  assert.equal(fp('--nope').status, 2);
  assert.equal(fp('--config').status, 2);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-check-cli-'));
  const css = project('.a{padding:var(--missing)}');
  try {
    const m = fp(empty); assert.equal(m.status, 2); assert.match(m.stderr, /fp\.config\.json not found/);
    const n = fp(css); assert.equal(n.status, 2); assert.match(n.stdout, /RESULT: NOT-RUN/);
  } finally { fs.rmSync(empty, { recursive: true }); fs.rmSync(css, { recursive: true }); }
});

test('--json prints the report; --config picks another file', () => {
  const dir = project('.a{gap:8px}');
  try {
    const j = JSON.parse(fp(dir, '--json').stdout);
    assert.equal(j.result, 'pass'); assert.equal(j.spec, SPEC); assert.ok(Array.isArray(j.rules));
    fs.copyFileSync(path.join(dir, 'fp.config.json'), path.join(dir, 'other.json'));
    assert.equal(JSON.parse(fp(dir, '--config', 'other.json', '--json').stdout).config, 'other.json');
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('--expect: exit 0 when the report matches, 1 when it differs', () => {
  const v = path.join(vectors, '02-ladder-u1-fail');
  const same = fp(v, '--expect', path.join(v, 'expected.json'));
  assert.equal(same.status, 0); assert.match(same.stdout, /Matches/);
  const other = fp(v, '--expect', path.join(vectors, '01-ladder-u1-pass', 'expected.json'));
  assert.equal(other.status, 1); assert.match(other.stdout, /Differs/);
});

test('--help', () => { const h = fp('--help'); assert.equal(h.status, 0); assert.match(h.stdout, /Usage: fp-check/); });
