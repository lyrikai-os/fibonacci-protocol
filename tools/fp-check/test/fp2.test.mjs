import test from 'node:test';
import assert from 'node:assert/strict';
import { run, by, HAS_NONE } from './helpers.mjs';

const FP2 = { level: 'FP-2' };
const sel = (r, check) => by(r, check).map((f) => f.selector);

test('type is not tested at FP-1 (host type stays untouched)', () => {
  const r = run({ 'a.css': '.a{font-size:14px;line-height:20px}' });
  assert.deepEqual(r.findings, []);
});

test('type: steps of the formula at body 16, and at another body size', () => {
  const sizes = [13, 16, 20, 26, 33, 42, 68, 110].map((n) => `.s${n}{font-size:${n / 16}rem;line-height:1.236}`).join('');
  assert.deepEqual(by(run({ 'a.css': sizes }, FP2), 'type.scale'), []);
  const r18 = run({ 'a.css': '.a{font-size:1.125rem;line-height:1.5} .b{font-size:1rem;line-height:1.5}' }, { ...FP2, type: { body: 18 } });
  assert.deepEqual(sel(r18, 'type.scale'), ['.b']);
});

test('type: odd steps above 4 belong to FP-TYPE-02, a Fibonacci size under formula to FP-TYPE-01', () => {
  const r = run({ 'a.css': '.a{font-size:3.3125rem;line-height:1.146} .b{font-size:1.3125rem;line-height:1.236}' }, FP2);
  assert.deepEqual(r.findings.map((f) => [f.selector, f.check, f.rule]), [['.a', 'type.step-range', 'FP-TYPE-02'], ['.b', 'type.scale', 'FP-TYPE-01']]);
});

test('type.align fibonacci: the substitute passes and the replaced value fails FP-TYPE-03', () => {
  const css = '.a{font-size:1.3125rem;line-height:1.236} .b{font-size:1.25rem;line-height:1.236} .c{font-size:1.625rem;line-height:1.236} .d{font-size:3.4375rem;line-height:1.146}';
  const r = run({ 'a.css': css }, { ...FP2, type: { align: 'fibonacci' } });
  assert.deepEqual(r.findings.map((f) => [f.selector, f.check]), [['.b', 'type.align'], ['.d', 'type.step-range']]);
});

test('type: micro is accepted only through --fp-type-micro or a micro role', () => {
  const css = ':root{--fp-type-micro:0.6875rem;--small:0.6875rem;--wrong:0.75rem}.a{font-size:var(--fp-type-micro);line-height:1.382}.b{font-size:var(--small);line-height:1.382}.c{font-size:0.6875rem;line-height:1.382}.d{font-size:var(--wrong);line-height:1.382}';
  const r = run({ 'a.css': css }, { ...FP2, roles: [{ match: '--small', role: 'micro' }] });
  assert.deepEqual(r.findings.map((f) => [f.selector, f.check]), [['.c', 'type.scale'], ['.d', 'type.scale']]);
  const bad = run({ 'a.css': '.a{font-size:var(--m);line-height:1.382}:root{--m:0.75rem}' }, { ...FP2, roles: [{ match: '--m', role: 'micro' }] });
  assert.deepEqual(bad.findings.map((f) => f.check), ['type.micro']);
});

test('type: units. px, pt, em and a px root fail; rem, keywords and a % root do not', () => {
  const r = run({ 'a.css': 'html{font-size:16px;line-height:1.5} .a{font-size:1em;line-height:1.5} .b{font-size:12pt;line-height:1.5} .c{font-size:inherit} .d{font-size:larger} body{font-size:1rem;line-height:1.618}' }, FP2);
  assert.deepEqual(r.findings.filter((f) => f.check === 'type.units').map((f) => f.selector), ['html', '.a', '.b']);
  assert.match(by(r, 'type.units')[0].message, /root font size/);
  const ok = run({ 'a.css': 'html{font-size:100%} body{font-size:1rem;line-height:1.618}' }, FP2);
  assert.deepEqual(ok.findings, []);
});

test('type: leading by step (FP-TYPE-07), unitless (FP-TYPE-08), declared (FP-TYPE-13)', () => {
  const css = `.p{font-size:1rem;line-height:1.618} .d{font-size:1rem;line-height:1.5} .l{font-size:0.8125rem;line-height:1.382}
.h{font-size:1.625rem;line-height:1.236} .x{font-size:2.625rem;line-height:1.146} .y{font-size:4.25rem;line-height:1.236}
.z{font-size:0.8125rem;line-height:1.618} .pct{font-size:1rem;line-height:150%} .norm{font-size:1rem;line-height:normal} .no{font-size:1rem}
.f1{font:1rem/1.5 serif} .f2{font:1rem serif} .f3{font:1rem/24px serif}`;
  const r = run({ 'a.css': css }, FP2);
  assert.deepEqual(r.findings.map((f) => [f.selector, f.check]), [
    ['.y', 'type.leading'], ['.z', 'type.leading'], ['.pct', 'type.leading-unitless'], ['.norm', 'type.leading-unitless'], ['.no', 'type.leading-declared'], ['.f2', 'type.leading-declared'], ['.f3', 'type.leading-unitless'],
  ]);
  assert.equal(by(r, 'type.leading-declared')[0].value, null);
});

test('type: leading through var() and a leading token', () => {
  const r = run({ 'a.css': ':root{--lh:1.618;--sz:1rem} .a{font-size:var(--sz);line-height:var(--lh)} .b{font-size:1.625rem;line-height:var(--lh)}' }, FP2);
  assert.deepEqual(r.findings.map((f) => f.selector), ['.b']);
});

test('type: body anchor and smallest text', () => {
  const r = run({ 'a.css': 'body{font-size:0.875rem;line-height:1.5} .a{font-size:0.625rem;line-height:1.382}' }, FP2);
  assert.ok(by(r, 'a11y.body-anchor').length === 1);
  assert.ok(by(r, 'a11y.min-text').length === 1);
});

test('type: longest line is 80 characters', () => {
  const r = run({ 'a.css': '.a{max-inline-size:66ch} .b{max-width:81ch} .c{max-inline-size:80ch}' }, FP2);
  assert.deepEqual(sel(r, 'type.measure-max'), ['.b']);
});

test('layout: only a split declared with --fp-layout: phi-split is tested (FP-LAYOUT-01)', () => {
  const d = (cols, extra = '--fp-layout:phi-split;') => `.x{${extra}grid-template-columns:${cols}}`;
  const css = [d('1.618fr 1fr').replace('.x', '.ok'), d('1fr 1.618fr').replace('.x', '.ok2'), d('61.8% 38.2%').replace('.x', '.pct'), d('1.6fr 1fr').replace('.x', '.off'), d('1fr 1fr 1fr').replace('.x', '.three'),
    d('1.6fr 1fr', '').replace('.x', '.undeclared'), d('1fr 1fr', '').replace('.x', '.eq'), '.golden{grid-template-columns:2fr 1fr}', d('var(--fp-split-major) var(--fp-split-minor)').replace('.x', '.tok')].join('\n');
  const r = run({ 'a.css': css }, FP2);
  assert.deepEqual(sel(r, 'layout.phi-split'), ['.off', '.three']);
});

test('layout: container limits are identified by token (FP-LAYOUT-05)', () => {
  const css = '.a{max-width:var(--fp-container-987)} .b{width:var(--fp-container-987)} .c{--fp-layout:container;max-width:900px} .d{--fp-layout:container;max-inline-size:var(--fp-container-610)} .e{max-width:1000px} .f{width:987px}';
  const r = run({ 'a.css': css }, FP2);
  assert.deepEqual(sel(r, 'layout.container-widths'), ['.b', '.c']);
  assert.deepEqual(sel(r, 'space.on-ladder'), ['.c', '.e']);
  const overlay = run({ 'a.css': '.b{width:var(--fp-container-987)}' }, { ...FP2, mode: 'overlay' });
  assert.deepEqual(by(overlay, 'layout.container-widths'), []);
});

test('web tokens: names, values at u, and the fine pointer target (FP-PLAT-01 to FP-PLAT-03)', () => {
  const css = ':root{--fp-space-13:52px;--fp-space-16:16px;--fp-container-987:987px;--fp-radius-13:12px;--fp-type-0:1rem;--fp-target:55px;--fp-layer-base:1;--fp-easing-x:ease}';
  const r = run({ 'a.css': css }, { unit: 4 });
  assert.deepEqual(r.findings.map((f) => `${f.property} ${f.check}`).sort(), ['--fp-radius-13 plat.web-units', '--fp-space-16 plat.web-tokens']);
  const t = (v, extra = '') => run({ 'a.css': `:root{--fp-target:${v}} ${extra}` });
  assert.equal(by(t('34px'), 'plat.web-pointer').length, 1);
  assert.equal(by(t('55px'), 'plat.web-pointer').length, 0);
  const inQuery = run({ 'a.css': '@media (pointer: fine) and (not (any-pointer: coarse)){:root{--fp-target:34px}}' });
  assert.equal(by(inQuery, 'plat.web-pointer').length, 0);
  const fine = run({ 'a.css': ':root{--fp-target:34px}' }, { pointer: 'fine', pointerReason: 'desktop only' });
  assert.equal(by(fine, 'plat.web-pointer').length, 0);
});

test('protocol token files: the published master passes every FP-TOKEN machine test', () => {
  const doc = {
    $extensions: { 'com.lyrikai.fp': { homepage: 'https://www.lyrikai.com', spec: '1.0.0-rc.2', unit: 1 } },
    space: { $type: 'dimension', 13: { $value: { value: 13, unit: 'px' }, $extensions: { 'com.lyrikai.fp': { rule: 'FP-MATH-03' } } } },
    target: { $type: 'dimension', coarse: { $value: { value: 55, unit: 'px' }, $extensions: { 'com.lyrikai.fp': { rule: 'FP-CTRL-01', pinnedFloor: true } } } },
    type: { $type: 'dimension', 0: { $value: { value: 1, unit: 'rem' }, $extensions: { 'com.lyrikai.fp': { rule: 'FP-TYPE-01', pinnedFloor: true } } } },
  };
  const cfg = { source: ['*.tokens.json'], pairs: [{ fg: '#000', bg: '#fff', kind: 'text' }] };
  const ok = run({ 'fp.tokens.json': doc }, cfg);
  assert.deepEqual(ok.findings, []);
  assert.equal(ok.rules.find((x) => x.check === 'token.dtcg').result, 'pass');
  const broken = structuredClone(doc);
  delete broken.$extensions;
  broken.space[13].$value = { value: 14, unit: 'px' };
  broken.space['1.5'] = { $value: { value: 1, unit: 'px' }, $extensions: { 'com.lyrikai.fp': { rule: 'nope' } } };
  broken.target.coarse.$extensions['com.lyrikai.fp'].pinnedFloor = false;
  broken.type.$type = 'dimension'; broken.type[1] = { $value: 1.2, $extensions: { 'com.lyrikai.fp': { rule: 'FP-TYPE-01' } } };
  broken.homepage = 'https://www.lyrikai.com';
  const bad = run({ 'fp.tokens.json': broken }, cfg);
  const checks = new Set(bad.findings.map((f) => f.check));
  for (const c of ['token.root-metadata', 'token.master-unit', 'token.names', 'token.extensions', 'token.types']) assert.ok(checks.has(c), c);
  assert.equal(bad.result, 'fail');
});

test('token.themes: light and dark colour values are two files', () => {
  const colour = { $extensions: { 'com.lyrikai.fp': { homepage: 'https://www.lyrikai.com', spec: '1.0.0-rc.2', unit: 1 } }, color: { $type: 'color', ink: { $value: { colorSpace: 'srgb', components: [0, 0, 0] }, $extensions: { 'com.lyrikai.fp': { rule: 'FP-COLOR-01' } } } } };
  const r = run({ 'color.light.tokens.json': colour }, { source: ['*.tokens.json'] });
  assert.ok(by(r, 'token.themes').length === 1);
  const both = run({ 'color.light.tokens.json': colour, 'color.dark.tokens.json': colour }, { source: ['*.tokens.json'] });
  assert.equal(by(both, 'token.themes').length, 0);
});

test('without protocol-format token files the token rules are n/a (FP-CONF-11)', () => {
  const r = run({ 'a.css': '.a{gap:8px}' });
  assert.equal(r.rules.find((x) => x.check === 'token.dtcg').result, 'n/a');
  assert.equal(r.result, 'pass');
});
