import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast, parseColor, passes, checkPair, relativeLuminance } from '../contrast.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'contrast.mjs');
const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('black on white is 21', () => near(contrast('#000', '#fff').ratio, 21, 1e-9));
test('#777 on #fff is 4.48 and fails text', () => {
  const { ratio } = contrast('#777', '#fff');
  assert.equal(ratio.toFixed(2), '4.48');
  assert.equal(passes(ratio, 4.5), false);
});
test('#767676 on #fff is 4.54 and passes text', () => {
  const { ratio } = contrast('#767676', '#fff');
  assert.equal(ratio.toFixed(2), '4.54');
  assert.equal(passes(ratio, 4.5), true);
});
test('never rounds before comparing', () => {
  assert.equal(passes(4.499, 4.5), false);
  assert.equal(passes(4.4999999, 4.5), false);
  assert.equal(passes(4.5, 4.5), true);
});
test('short, long, 8-digit and rgb() forms agree', () => {
  const a = contrast('#777', '#fff').ratio;
  near(contrast('#777777', '#ffffff').ratio, a, 1e-12);
  near(contrast('#777777ff', '#fff').ratio, a, 1e-12);
  near(contrast('rgb(119,119,119)', 'rgb(255 255 255)').ratio, a, 1e-12);
  near(contrast('rgba(119, 119, 119, 1)', '#fff').ratio, a, 1e-12);
});
test('alpha composites over bg', () => {
  // 50% black over white = #808080 (127.5 each channel)
  const half = contrast('#00000080', '#fff');
  const grey = contrast({ r: 255 * (1 - 128 / 255), g: 255 * (1 - 128 / 255), b: 255 * (1 - 128 / 255), a: 1 }, '#fff');
  near(half.ratio, grey.ratio, 1e-9);
  near(contrast('rgba(0,0,0,0.5)', '#fff').ratio, 3.977, 0.005);
  near(contrast('rgb(0 0 0 / 50%)', '#fff').ratio, 3.977, 0.005);
});
test('oklch achromatic matches hand calculation (linear = L^3)', () => {
  // oklch(0.5 0 0): linear grey = 0.125, luminance 0.125 (coefficients sum to 1)
  const c = parseColor('oklch(0.5 0 0)');
  near(relativeLuminance(c), 0.125, 0.125 * 0.005);
  near(contrast('oklch(0.5 0 0)', '#fff').ratio, 1.05 / 0.175, 6 * 0.005);
  near(contrast('oklch(1 0 0)', '#000').ratio, 21, 21 * 0.005);
  near(contrast('oklch(50% 0 0)', '#fff').ratio, 6, 6 * 0.005);
});
test('oklch red reference (css oklch(62.8% 0.2577 29.23) is #ff0000)', () => {
  const c = parseColor('oklch(0.628 0.2577 29.23)');
  near(relativeLuminance(c), 0.2126, 0.2126 * 0.005);
  near(contrast('oklch(0.628 0.2577 29.23)', '#fff').ratio, 4.0, 4.0 * 0.005);
});
test('oklch out of gamut is clipped, noted and unverified; in-gamut is not', () => {
  const r = contrast('oklch(0.7 0.4 150)', '#000');
  assert.ok(r.notes.some((n) => /clipped/.test(n)));
  assert.equal(r.unverified, true);
  assert.equal(checkPair({ fg: 'oklch(0.7 0.4 150)', bg: '#000' }).pass, false);
  assert.equal(contrast('oklch(0.7 0.1 150)', '#fff').unverified, false);
  assert.equal(contrast('oklch(0.5 0 0)', '#fff').notes.length, 0);
});
test('oklch hue units agree (deg, rad, grad, turn) and extra values are rejected', () => {
  const ref = relativeLuminance(parseColor('oklch(0.6 0.1 90)'));
  near(relativeLuminance(parseColor('oklch(0.6 0.1 90deg)')), ref, 1e-12);
  near(relativeLuminance(parseColor(`oklch(0.6 0.1 ${Math.PI / 2}rad)`)), ref, 1e-9);
  near(relativeLuminance(parseColor('oklch(0.6 0.1 100grad)')), ref, 1e-12);
  near(relativeLuminance(parseColor('oklch(0.6 0.1 0.25turn)')), ref, 1e-12);
  assert.throws(() => parseColor('oklch(0.6 0.1 90 5)'));
  assert.throws(() => parseColor('oklch(0.6 0.1)'));
});
test('negative chroma is clamped to 0 with a note', () => {
  const c = parseColor('oklch(0.5 -0.1 90)');
  near(relativeLuminance(c), 0.125, 0.001);
  assert.ok(c.notes.some((n) => /negative chroma/.test(n)));
});
test('rgb(): four values need a slash in space syntax', () => {
  assert.throws(() => parseColor('rgb(1 2 3 4)'));
  assert.throws(() => parseColor('rgb(1, 2, 3 / 0.5)'));
  assert.equal(parseColor('rgb(1, 2, 3, 0.5)').a, 0.5);
  assert.equal(parseColor('rgb(1 2 3 / 0.5)').a, 0.5);
});
test('translucent bg without backdrop is unverified; with backdrop it is computed', () => {
  const none = checkPair({ fg: '#000', bg: 'rgba(255,255,255,.5)', kind: 'text' });
  assert.equal(none.unverified, true);
  assert.equal(none.pass, false);
  const dark = checkPair({ fg: '#000', bg: 'rgba(255,255,255,.5)', kind: 'text', backdrop: '#000' });
  assert.equal(dark.unverified, false);
  near(dark.ratio, 5.3, 0.1);
  assert.throws(() => contrast('#000', 'rgba(255,255,255,.5)', { backdrop: 'rgba(0,0,0,.5)' }));
});
test('pair name is never [object Object]', () => {
  assert.throws(() => checkPair({ fg: { r: 0 }, bg: '#fff' }), /colour strings/);
  assert.equal(checkPair({ fg: '#000', bg: '#fff' }).name, '#000 on #fff');
});
test('bad colour throws', () => assert.throws(() => parseColor('banana')));
test('checkPair uses per-kind thresholds', () => {
  assert.equal(checkPair({ fg: '#777', bg: '#fff', kind: 'text' }).pass, false);
  assert.equal(checkPair({ fg: '#777', bg: '#fff', kind: 'large-text' }).pass, true);
  assert.equal(checkPair({ fg: '#777', bg: '#fff', kind: 'mark' }).pass, true);
  assert.equal(checkPair({ fg: '#aaa', bg: '#fff', kind: 'control-edge' }).pass, false);
});

test('CLI single pair', () => {
  const r = spawnSync(process.execPath, [CLI, '#767676', '#fff'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^4\.54:1/);
  const f = spawnSync(process.execPath, [CLI, '#777', '#fff'], { encoding: 'utf8' });
  assert.equal(f.status, 1);
  assert.match(f.stdout, /text \(4\.5\):\s+fail/);
});
test('CLI --pairs exits 1 on any failure, 0 otherwise', () => {
  const dir = mkdtempSync(join(tmpdir(), 'contrast-'));
  const bad = join(dir, 'bad.json');
  const good = join(dir, 'good.json');
  writeFileSync(bad, JSON.stringify([{ fg: '#000', bg: '#fff', kind: 'text', name: 'ok' }, { fg: '#777', bg: '#fff', kind: 'text', name: 'low' }]));
  writeFileSync(good, JSON.stringify([{ fg: '#000', bg: '#fff', kind: 'text', name: 'ok' }, { fg: '#777', bg: '#fff', kind: 'mark', name: 'mark' }]));
  const b = spawnSync(process.execPath, [CLI, '--pairs', bad], { encoding: 'utf8' });
  assert.equal(b.status, 1);
  assert.match(b.stdout, /FAIL.*low/);
  assert.equal(spawnSync(process.execPath, [CLI, '--pairs', good], { encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync(process.execPath, [CLI, 'nope', '#fff'], { encoding: 'utf8' }).status, 2);
});

test('CLI unverified translucent bg exits 1; --backdrop resolves it', () => {
  const a = spawnSync(process.execPath, [CLI, '#000', 'rgba(255,255,255,.5)'], { encoding: 'utf8' });
  assert.equal(a.status, 1);
  assert.match(a.stdout, /UNVERIFIED/);
  const b = spawnSync(process.execPath, [CLI, '#000', 'rgba(255,255,255,.5)', '--backdrop', '#fff'], { encoding: 'utf8' });
  assert.equal(b.status, 0);
});

test('strict numbers: junk that parseFloat or Number would accept is rejected', () => {
  for (const bad of ['rgb(0x10 0 0)', 'rgb(1e 0 0)', 'rgb(5%x 0 0)', 'rgb(1 2 3 / 0.5abc)', 'rgb(Infinity 0 0)', 'oklch(0.5 0.1 90degx)', 'oklch(0.5 0.1 1..2)', 'oklch(0x1 0 0)', 'rgb(  0 0)']) {
    assert.throws(() => parseColor(bad), undefined, bad);
  }
  assert.equal(parseColor('rgb(1e2 0 0)').r, 100);
  assert.equal(parseColor('rgb(50% 0 0)').r, 127.5);
  assert.equal(parseColor('rgb(.5, 0, 0)').r, 0.5);
});
test('CLI --backdrop without a value is a usage error', () => {
  for (const args of [['#000', '#fff', '--backdrop'], ['#000', '--backdrop', '--x', '#fff']]) {
    const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /--backdrop needs a colour/);
  }
});
