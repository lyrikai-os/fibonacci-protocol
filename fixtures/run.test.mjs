// Fixture suite: every fixture passes fp-check, every seeded fault fails with the named rule ID.
// Run from the repository root:  node --test fixtures/run.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(here, '..', 'tools', 'fp-check', 'fp-check.mjs');

function run(dir) {
  const r = spawnSync(process.execPath, [checker, dir, '--json'], { encoding: 'utf8' });
  let report = null;
  try { report = JSON.parse(r.stdout); } catch { /* leave null */ }
  return { status: r.status, report, stderr: r.stderr };
}

const fixtures = fs.readdirSync(here, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(here, e.name, 'fp.config.json')))
  .map((e) => e.name)
  .sort();

test('there are three fixtures, one per mode', () => {
  assert.deepEqual(fixtures, ['material-overlay', 'native', 'primer-snap']);
});

for (const name of fixtures) {
  test(`${name}: fp-check passes (exit 0)`, () => {
    const { status, report, stderr } = run(path.join(here, name));
    const failing = report ? report.rules.filter((x) => x.result === 'fail' || x.result === 'pending').map((x) => x.id) : [];
    assert.equal(status, 0, `exit ${status}; failing rules: ${failing.join(', ')}; ${stderr}`);
    assert.equal(report.result, 'pass');
    assert.match(report.claim, /self-assessed$/);
  });

  const faultsDir = path.join(here, name, 'faults');
  if (!fs.existsSync(faultsDir)) continue;
  for (const fault of fs.readdirSync(faultsDir).sort()) {
    const dir = path.join(faultsDir, fault);
    const expected = JSON.parse(fs.readFileSync(path.join(dir, 'expected.json'), 'utf8'));
    test(`${name}/faults/${fault}: exit 1 and ${expected.mustFail.join(', ')} fails`, () => {
      const { status, report } = run(dir);
      assert.equal(status, 1);
      const failed = new Set(report.rules.filter((x) => x.result === 'fail').map((x) => x.id));
      for (const id of expected.mustFail) assert.ok(failed.has(id), `${id} did not fail; failed: ${[...failed].join(', ')}`);
    });
  }
}
