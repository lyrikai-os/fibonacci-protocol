import test from 'node:test';
import assert from 'node:assert/strict';
import { SPEC } from './helpers.mjs';
import { PHI, ladder, isRung, roundHalfUp, truncate, RADIUS_SET } from '../lib/util.mjs';
import { globToRegExp, matchesAny } from '../lib/glob.mjs';
import { parseColor, contrastRatio, testPair } from '../lib/contrast.mjs';
import { stepSize, findStep, allowedLeading } from '../lib/type.mjs';
import { checkTokenDoc, flatten, dimensionPx } from '../lib/dtcg.mjs';
import { compareExpected } from '../lib/compare.mjs';

test('FP-MATH-01 constants: phi, 1/phi, golden angle, hashing constant', () => {
  assert.ok(Math.abs(PHI - 1.6180339887) < 1e-10);
  assert.ok(Math.abs(PHI - 1 - 0.6180339887) < 1e-10);
  assert.ok(Math.abs(2 - PHI - 0.3819660113) < 1e-10);
  assert.ok(Math.abs(Math.sqrt(PHI) - 1.2720196495) < 1e-10);
  assert.ok(Math.abs(360 / PHI ** 2 - 137.50776) < 1e-5);
  assert.ok(Math.abs(Math.PI * (3 - Math.sqrt(5)) - 2.39996323) < 1e-8);
  assert.equal(Math.floor(2 ** 32 / PHI), 2654435769);
});

test('FP-MATH-03 the ladder at u = 1, 4 and 8 (01-core-math.md table)', () => {
  assert.deepEqual(ladder(1), [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]);
  assert.deepEqual(ladder(4), [1, 2, 4, 8, 12, 20, 32, 52, 84, 136, 220, 356, 576, 610, 932, 987, 1508, 1597]);
  assert.deepEqual(ladder(8), [1, 2, 8, 16, 24, 40, 64, 104, 168, 272, 440, 610, 712, 987, 1152, 1597, 1864, 3016]);
  assert.ok(isRung(-13) && isRung(0) && !isRung(4) && !isRung(2440, 4) && isRung(610, 4));
});

test('FP-MATH-08 rounding: half up, never on a contrast ratio', () => {
  assert.equal(roundHalfUp(0.5), 1); assert.equal(roundHalfUp(2.5), 3); assert.equal(roundHalfUp(37.5), 38);
  assert.equal(roundHalfUp(31.25, 1), 31.3); assert.equal(roundHalfUp(34.375, 1), 34.4);
  assert.equal(truncate(4.4999, 3), 4.499);
  assert.equal(truncate(4.5, 3), 4.5);
});

test('the radius set', () => assert.deepEqual(RADIUS_SET, [0, 2, 3, 5, 8, 13, 21]));

test('globs: *, **, ?, {a,b}', () => {
  assert.ok(globToRegExp('src/**/*.css').test('src/a/b/c.css'));
  assert.ok(globToRegExp('src/**/*.css').test('src/c.css'));
  assert.ok(!globToRegExp('src/*.css').test('src/a/c.css'));
  assert.ok(globToRegExp('*.{css,html}').test('x.html'));
  assert.ok(!globToRegExp('*.css').test('x.scss'));
  assert.ok(globToRegExp('a?.css').test('ab.css'));
  assert.ok(matchesAny('./dist/x.css', ['dist/*.css']));
});

test('contrast: WCAG relative luminance, exact, never rounded (13-contrast vector values)', () => {
  const w = parseColor('#fff');
  assert.equal(contrastRatio(parseColor('#000'), w), 21);
  assert.equal(testPair(parseColor('#767676'), w, 'text').ratio, 4.542);
  assert.equal(testPair(parseColor('#767676'), w, 'text').pass, true);
  assert.equal(testPair(parseColor('#777'), w, 'text').pass, false);
  assert.equal(testPair(parseColor('#949494'), w, 'mark').pass, true);
  assert.equal(testPair(parseColor('#959595'), w, 'large-text').pass, false);
  assert.equal(testPair(parseColor('#777777'), w, 'text').ratio, 4.478);
  // 4.499 fails: no rounding up to 4.5
  const near = parseColor('#767676');
  assert.ok(testPair(near, w, 'text').exact >= 4.5 && testPair(parseColor('#777777'), w, 'text').exact < 4.5);
});

test('contrast: colour syntaxes', () => {
  assert.deepEqual(parseColor('#abc'), { r: 170, g: 187, b: 204, a: 1 });
  assert.equal(parseColor('rgb(0 0 0 / 50%)').a, 0.5);
  assert.deepEqual(parseColor('hsl(0 0% 100%)'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor({ colorSpace: 'srgb', components: [1, 0, 0] }), { r: 255, g: 0, b: 0, a: 1 });
  assert.equal(parseColor('not a colour'), null);
});

test('FP-TYPE-01 and FP-TYPE-03: the scale tables in 05-ui/type.md (web, iOS, macOS)', () => {
  const row = (b, a) => [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => stepSize(k, b, a));
  assert.deepEqual(row(16, 'formula'), [13, 16, 20, 26, 33, 42, 53, 68, 86, 110]);
  assert.deepEqual(row(16, 'fibonacci'), [13, 16, 21, 26, 34, 42, 55, 68, 89, 110]);
  assert.deepEqual(row(17, 'formula'), [13, 17, 22, 28, 35, 45, 57, 72, 92, 117]);
  assert.deepEqual(row(17, 'fibonacci'), [13, 17, 21, 28, 34, 45, 55, 72, 89, 117]);
  assert.deepEqual(row(13, 'formula'), [10, 13, 17, 21, 27, 34, 43, 55, 70, 89]);
});

test('type: step lookup and allowed leading', () => {
  assert.deepEqual(findStep(20, 16, 'formula'), { step: 1, kind: 'usable' });
  assert.deepEqual(findStep(53, 16, 'formula'), { step: 5, kind: 'odd' });
  assert.deepEqual(findStep(20, 16, 'fibonacci'), { step: 1, kind: 'replaced' });
  assert.equal(findStep(14, 16, 'formula'), null);
  assert.deepEqual(allowedLeading(0), [1.618, 1.5, 1.382, 1.236]);
  assert.deepEqual(allowedLeading(6), [1.146]);
  assert.deepEqual(allowedLeading('micro'), [1.382]);
});

test('dtcg: flatten, aliases and dimension values', () => {
  const l = flatten({ a: { $type: 'dimension', b: { $value: { value: 1, unit: 'rem' } }, c: { d: { $value: '{a.b}' } } } });
  assert.deepEqual(l.map((x) => [x.path, x.type]), [['a.b', 'dimension'], ['a.c.d', 'dimension']]);
  assert.equal(dimensionPx({ value: 1, unit: 'rem' }), 16);
  assert.equal(dimensionPx('13px'), 13);
  assert.equal(dimensionPx({ value: 1, unit: 'pt' }), null);
});

test('dtcg: FP-TOKEN-03 names must not begin with $ (as a token) or hold { } .', () => {
  const p = checkTokenDoc({ $extensions: { 'com.lyrikai.fp': { homepage: 'https://www.lyrikai.com', spec: SPEC, unit: 1 } }, 'a.b': { $type: 'dimension', 'x{y}': { $value: { value: 1, unit: 'px' } } } }, 'x.tokens.json');
  assert.equal(p['token.names'].length, 2);
  assert.equal(checkTokenDoc({}, 'x.json')['token.dtcg'].length, 1);
});

test('compareExpected: only the keys the expected file has are compared; messages are ignored', () => {
  const report = { result: 'fail', findings: [{ file: 'a', selector: '.x', check: 'c', rule: 'R', result: 'fail', message: 'm', line: 3 }], checkedValues: 4 };
  assert.deepEqual(compareExpected(report, { result: 'fail', checkedValues: 4, findings: [{ file: 'a', selector: '.x', check: 'c', rule: 'R', result: 'fail', message: 'other' }] }), []);
  assert.equal(compareExpected(report, { result: 'pass' }).length, 1);
  assert.equal(compareExpected(report, { result: 'fail', findings: [] }).length, 1);
  assert.equal(compareExpected(report, { result: 'fail', findings: [{ file: 'a', selector: '.y' }] }).length, 2);
  assert.deepEqual(compareExpected(report, { vector: 'x', about: 'y', result: 'fail' }), []);
  assert.equal(compareExpected(report, {}).length, 1); // an empty expected file proves nothing
});
