// Runs fp-check on every spec/test-vectors/<n>/ folder and compares with its expected.json.
// A failing test here is a disagreement between the checker and a vector; see the README.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../lib/check.mjs';
import { compareExpected } from '../lib/compare.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const vectorsDir = path.resolve(here, '../../../spec/test-vectors');
const index = JSON.parse(fs.readFileSync(path.join(vectorsDir, 'index.json'), 'utf8'));

test('index.json lists every vector folder', () => {
  const folders = fs.readdirSync(vectorsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  assert.deepEqual(index.vectors.map((v) => v.vector).sort(), folders);
});

for (const v of index.vectors) {
  test(`vector ${v.vector} (${v.result})`, () => {
    const dir = path.join(vectorsDir, v.vector);
    const expected = JSON.parse(fs.readFileSync(path.join(dir, v.expected ?? 'expected.json'), 'utf8'));
    const report = runCheck({ dir, configPath: path.join(dir, v.config ?? 'fp.config.json') });
    const diffs = compareExpected(report, expected);
    assert.equal(report.result, v.result, 'result differs from index.json');
    assert.deepEqual(diffs, [], `differs from expected.json:\n  ${diffs.join('\n  ')}`);
  });
}
