// Regression tests from the adversary's probes (reviews/phase3-checker-tokens-r1.md). Each folder in test/probes/ is one probe;
// expected.json says what the checker must answer. The configuration's `fp` is set to the spec version read from
// spec/rules.json, except for s-fpver, which tests the version check itself.
//
// Probes the checker deliberately does NOT turn into a fail (spec reasons):
//   l-media     `--fp-layout: phi-split` and `grid-template-columns` are in different rules; FP-LAYOUT-01 says "in the same CSS rule".
//   (s-color5: `#12345` is now refused by the schema's colour pattern, so it is a configuration failure.)
//   th-ld       `light-dark()` colours are not resolved; the pair is `not-run`, not a pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../lib/check.mjs';
import { SPEC } from './helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const probes = path.join(here, 'probes');
const expected = JSON.parse(fs.readFileSync(path.join(probes, 'expected.json'), 'utf8'));

const names = fs.readdirSync(probes, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();

test('every probe folder has an expected answer, and the other way round', () => {
  assert.deepEqual(Object.keys(expected).sort(), names);
});

for (const name of names) {
  test(`probe ${name}`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-probe-'));
    try {
      fs.cpSync(path.join(probes, name), tmp, { recursive: true });
      const cfgFile = path.join(tmp, 'fp.config.json');
      const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
      if (name !== 's-fpver') cfg.fp = SPEC;
      fs.writeFileSync(cfgFile, JSON.stringify(cfg));
      const r = runCheck({ dir: tmp });
      const checks = [...new Set([...r.findings.filter((f) => f.result !== 'exception').map((f) => f.check), ...(r.pairs ?? []).filter((p) => p.result !== 'pass').map((p) => `pair:${p.result}`)])].sort();
      const want = expected[name];
      assert.equal(r.result, want.result, `result (checks: ${checks.join(', ')})`);
      assert.deepEqual(checks, want.checks ?? []);
      assert.equal(Boolean(r.configErrors), Boolean(want.configError));
      if (r.result !== 'pass') assert.equal(r.claim, null, 'a run that did not pass makes no claim');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
}

// The probes that were false passes before the review, stated outright so a regression names itself.
test('false passes now fail or are not-run', () => {
  for (const n of ['classvar', 'scopedvar', 'mediavar', 'fb', 'rad30', 'radvw', 'radem', 'roundredef', 'th-compound', 'th-typo', 'th-media', 'th-nomatch', 'th-notheme', 'th-mediaroot', 'scope-none', 'scope-typo', 'sn-calc', 'sn-radius', 'sn-em', 't-calc', 't-clamp', 't-vw', 't-kw', 't-pct', 't-scoped', 't-shortvar', 't-bodylist', 't-bodyroot', 'em', 'unitless', 'thick', 'pt-low', 'pt-u4', 'pt-coarse', 'lname', 'excfile', 'excglob', 'excrule', 'l-mm', 'l-nested', 'c-marked2']) {
    assert.notEqual(expected[n].result, 'pass', n);
  }
});
