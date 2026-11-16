// Compare a report with an expected-results file (the format of spec/test-vectors/*/expected.json).
// Only the keys present in the expected file are compared. Free-text keys (message, note, about) are ignored.
const IGNORE = new Set(['message', 'note', 'about', 'vector', 'spec']);

const eq = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eq(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).filter((k) => !IGNORE.has(k)); const kb = Object.keys(b).filter((k) => !IGNORE.has(k));
    return ka.length === kb.length && ka.every((k) => k in b && eq(a[k], b[k]));
  }
  return a === b;
};

/** Does `got` carry every (non-ignored) key of `want` with an equal value? */
const covers = (got, want) => Object.keys(want).every((k) => IGNORE.has(k) || (k in got && eq(got[k], want[k])));

const show = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !IGNORE.has(k) && !['line', 'exception', 'evidence'].includes(k))));

/** Match two lists as multisets, by the keys the expected entries carry. */
function compareList(name, got, want, diffs) {
  const pool = [...got];
  for (const w of want) {
    const i = pool.findIndex((g) => covers(g, w));
    if (i < 0) diffs.push(`${name}: expected ${show(w)} was not produced`);
    else pool.splice(i, 1);
  }
  for (const g of pool) diffs.push(`${name}: unexpected ${show(g)}`);
}

export function compareExpected(report, expected) {
  const diffs = [];
  if (!('result' in expected)) diffs.push('expected file has no "result": nothing to compare the run against');
  if ('result' in expected && report.result !== expected.result) diffs.push(`result: expected ${expected.result}, got ${report.result}`);
  if ('checkedValues' in expected && report.checkedValues !== expected.checkedValues) diffs.push(`checkedValues: expected ${expected.checkedValues}, got ${report.checkedValues}`);
  if ('claim' in expected && report.claim !== expected.claim) diffs.push(`claim: expected "${expected.claim}", got "${report.claim}"`);
  if ('outputFirstLine' in expected && report.outputFirstLine !== expected.outputFirstLine) diffs.push(`outputFirstLine: expected "${expected.outputFirstLine}", got "${report.outputFirstLine}"`);
  if ('claimState' in expected && report.claimState !== expected.claimState) diffs.push(`claimState: expected ${expected.claimState}, got ${report.claimState}`);
  if ('candidate' in expected && report.candidate !== expected.candidate) diffs.push(`candidate: expected "${expected.candidate}", got "${report.candidate}"`);
  for (const k of ['openItems', 'applicableSelfReport']) if (k in expected && JSON.stringify(report[k] ?? null) !== JSON.stringify(expected[k])) diffs.push(`${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(report[k])}`);
  if ('coverage' in expected && !eq(report.coverage ?? null, expected.coverage)) diffs.push(`coverage: expected ${JSON.stringify(expected.coverage)}, got ${JSON.stringify(report.coverage)}`);
  if ('final' in expected && !Object.entries(expected.final).every(([k, v]) => report.final?.[k] === v)) diffs.push(`final: expected ${JSON.stringify(expected.final)}, got ${JSON.stringify(report.final)}`);
  if ('findings' in expected) compareList('findings', report.findings ?? [], expected.findings, diffs);
  if ('mapping' in expected) compareList('mapping', report.mapping ?? [], expected.mapping, diffs);
  if ('overrides' in expected) compareList('overrides', report.overrides ?? [], expected.overrides, diffs);
  if ('orderBreaches' in expected) compareList('orderBreaches', report.orderBreaches ?? [], expected.orderBreaches, diffs);
  if ('pairs' in expected) compareList('pairs', report.pairs ?? [], expected.pairs, diffs);
  if ('merges' in expected) {
    const norm = (m) => ({ ...m, tokens: [...m.tokens].sort() });
    compareList('merges', (report.merges ?? []).map(norm), expected.merges.map(norm), diffs);
  }
  return diffs;
}
