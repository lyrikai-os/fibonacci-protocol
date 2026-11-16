import test from 'node:test';
import assert from 'node:assert/strict';
import { run, by, HAS_NONE } from './helpers.mjs';

const fails = (r) => r.findings.filter((f) => f.result === 'fail');

test('ladder at u=8: rungs are F x 8, sub-units 1 and 2, containers fixed', () => {
  const r = run({ 'a.css': '.a{padding:8px 16px 24px 40px;gap:2px;margin:1152px} .b{width:12px} .c{max-width:610px;height:104px}' }, { unit: 8 });
  assert.deepEqual(fails(r).map((f) => f.value), ['12px']);
  assert.equal(r.checkedValues, 4 + 2 + 4 + 1 + 1 + 1);
});

test('lengths: rem, pt, negatives, zero and intrinsic values', () => {
  const r = run({ 'a.css': '.a{padding:0.8125rem;margin:-1.3125rem;gap:12pt;width:auto;height:50vh;min-width:0;max-width:66ch;inset:0}' });
  // 13px ok, -21px ok, 12pt = 16px fails, intrinsic and zero are never flagged
  assert.deepEqual(fails(r).map((f) => [f.property, f.value]), [['gap', '12pt']]);
  assert.equal(r.checkedValues, 4 + 4 + 2);
});

test('fractions of a unit fail and are tagged for FP-MATH-08 and FP-MATH-09', () => {
  const r = run({ 'a.css': '.a{width:380.9px}' });
  assert.equal(fails(r).length, 1);
  assert.equal(r.rules.find((x) => x.check === 'math.zero-negative').result, 'fail');
  assert.equal(r.rules.find((x) => x.check === 'math.rounding').result, 'fail');
});

test('derived patterns (FP-SPACE-04): accepted and refused forms', () => {
  const css = `:root{--fp-container-987:987px;--fp-space-13:13px}
.ok1{width:calc(100% * 0.618)} .ok2{width:calc(0.382 * 100vw)} .ok3{width:calc(100% - var(--fp-space-13))}
.ok4{max-width:calc(var(--fp-container-987) - 21px)} .ok5{width:calc(100dvh - 8px)} .ok6{width:calc(var(--fp-container-987) * 0.618)}
.no1{width:calc(100% - 13px - 8px)} .no2{width:calc(50% - 13px)} .no3{width:calc(987px * 0.618)} .no4{width:calc(100% * 0.62)}
.no5{width:calc(8px + 13px)} .no6{width:calc(100% - 20px)} .no7{width:calc(13px - 100%)}`;
  const r = run({ 'a.css': css });
  assert.deepEqual(fails(r).map((f) => f.selector), ['.no1', '.no2', '.no3', '.no4', '.no5', '.no6', '.no7']);
  assert.equal(r.rules.find((x) => x.check === 'space.derived').result, 'fail');
});

test('derived pattern: a container token that is redefined to another width is refused', () => {
  const r = run({ 'a.css': ':root{--fp-container-987:900px} .a{width:calc(var(--fp-container-987) - 8px)}' });
  assert.deepEqual(by(r, 'space.on-ladder').map((f) => f.result), ['fail']);
  assert.deepEqual(by(r, 'plat.web-units').map((f) => f.result), ['fail']);
});

test('min(), max() and clamp() test each length argument', () => {
  const r = run({ 'a.css': '.a{width:min(100%, 610px)} .b{width:clamp(8px, 50%, 600px)}' });
  assert.deepEqual(fails(r).map((f) => f.selector), ['.b']);
});

test('fixed sets: radius, border-width, outline-width, outline-offset (u does not change them)', () => {
  const css = '.a{border-radius:13px 8px 0 21px;border-width:1px 2px 3px 0;outline:2px solid;outline-offset:-1px} .b{border-radius:9999px} .c{border-radius:50%} .d{border-radius:12px} .e{border:4px solid red} .f{outline-offset:5px} .g{border-radius:0.8125rem}';
  const r = run({ 'a.css': css }, { unit: 4 });
  assert.deepEqual(fails(r).map((f) => [f.selector, f.check]), [['.d', 'radius.set'], ['.e', 'math.fixed-detail'], ['.f', 'math.fixed-detail']]);
});

test('not tested in 1.0: box-shadow, transform, background-position, letter-spacing, z-index, intrinsic units', () => {
  const r = run({ 'a.css': '.a{box-shadow:3px 7px 11px red;transform:translate(7px);background-position:3px 5px;letter-spacing:0.3px;z-index:77;opacity:.3;flex-basis:17px;margin:3fr}' });
  assert.equal(r.checkedValues, 0);
  assert.deepEqual(r.findings, []);
});

test('@media and nested rules are read; a keyframe selector is reported as written', () => {
  const r = run({ 'a.css': '@media (min-width:610px){.a{gap:7px}} .b{ .c{padding:9px} } @keyframes k{from{top:6px}}' }, { has: { ...HAS_NONE, motion: true } });
  assert.deepEqual(fails(r).map((f) => [f.selector, f.value]), [['.a', '7px'], ['.b .c', '9px'], ['from', '6px']]);
});

test('exceptions: by token, by selector, by file:line, by file; pending; value must match', () => {
  const css = ':root{--x:20px}\n.a{gap:var(--x)}\n.b{margin:10px}\n.c{padding:6px}\n.d{top:7px}';
  const ex = (value, where, status = 'accepted', reason = 'host-token') => ({ value, where, reason, rule: 'FP-SPACE-01', status });
  const r = run({ 'a.css': css }, { exceptions: [ex('20px', '--x'), ex('10px', '.b'), ex('6px', 'a.css:4', 'pending'), ex('8px', '.d')] });
  const res = Object.fromEntries(r.findings.map((f) => [f.selector, f.result]));
  assert.deepEqual(res, { '.a': 'exception', '.b': 'exception', '.c': 'pending', '.d': 'fail' });
  assert.equal(r.result, 'fail');
  const ok = run({ 'a.css': css }, { exceptions: [ex('20px', '--x'), ex('10px', '.b'), ex('6px', 'a.css'), ex('7px', '.d')] });
  assert.equal(ok.result, 'pass');
  const pend = run({ 'a.css': '.c{padding:6px}' }, { exceptions: [ex('6px', '.c', 'pending')] });
  assert.equal(pend.result, 'pending');
  assert.equal(pend.claim, null);
});

test('roles exempt tokens: icon, drawn, breakpoint; a target token must reach the ladder target', () => {
  const css = ':root{--icon-md:16px;--btn-drawn:40px;--bp-md:700px;--ctl-a:44px;--ctl-b:55px}.a{width:var(--icon-md);height:var(--btn-drawn);min-width:var(--bp-md);padding:var(--ctl-a) var(--ctl-b)}';
  const roles = [{ match: '--icon-*', role: 'icon' }, { match: '--btn-drawn', role: 'drawn' }, { match: '--bp-*', role: 'breakpoint' }, { match: '--ctl-*', role: 'target' }];
  const r = run({ 'a.css': css }, { mode: 'overlay', roles });
  assert.deepEqual(fails(r).map((f) => f.value), ['var(--ctl-a)']);
  const fine = run({ 'a.css': css }, { mode: 'overlay', roles, pointer: 'fine', pointerReason: 'desktop only' });
  assert.deepEqual(fails(fine), []);
});

test('an unresolved var() cannot be tested: not-run, and the run is not-run', () => {
  const r = run({ 'a.css': '.a{padding:var(--tw-missing)}' });
  assert.equal(r.findings[0].result, 'not-run');
  assert.equal(r.result, 'not-run');
  assert.equal(r.claim, null);
});

test('CSS-in-JS and preprocessor source are not read: they are reported, and the run is not-run', () => {
  const r = run({ 'a.css': '.a{gap:8px}', 'b.scss': '.a{gap:7px}', 'c.tsx': 'const x = css`gap: 7px`' }, { source: ['*.css', '*.scss', '*.tsx'] });
  assert.deepEqual(r.unread.sort(), ['b.scss', 'c.tsx']);
  assert.equal(r.result, 'not-run');
});

test('no source file matched: not-run', () => {
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { source: ['nothing/**/*.css'] }).result, 'not-run');
});

test('scope narrows what is tested; Overlay coverage counts both (FP-MODE-05)', () => {
  const r = run({ 'a.css': '.a{padding:21px}', 'b.css': '.b{padding:20px}' }, { mode: 'overlay', scope: ['a.css'] });
  assert.equal(r.result, 'pass');
  assert.deepEqual(r.coverage, { inScope: 4, inSource: 8, percent: 50 });
  assert.match(r.claim, /^FP-1 · Overlay · u=1 · web · scope a\.css · coverage 50% · exceptions 0 · spec 1\.0\.0-rc\.1 · self-assessed$/);
  const rounded = run({ 'a.css': '.a{width:1px}', 'b.css': '.b{width:1px;height:1px}' }, { mode: 'overlay', scope: ['a.css'] });
  assert.equal(rounded.coverage.percent, 33);
  const half = run({ 'a.css': '.a{width:1px;height:1px;top:1px}', 'b.css': '.b{width:1px;height:1px;top:1px;left:1px;right:1px}' }, { mode: 'overlay', scope: ['a.css'] });
  assert.equal(half.coverage.percent, 38); // 3/8 = 37.5 rounds half up
});

test('Overlay: a scope with no checked declarations is not claimed', () => {
  const r = run({ 'a.css': '.a{color:red}' }, { mode: 'overlay' });
  assert.equal(r.result, 'fail');
  assert.equal(r.claim, null);
});

test('claim string: Native and Snap forms', () => {
  assert.equal(run({ 'a.css': '.a{gap:8px}' }).claim, 'FP-1 · Native · u=1 · web · spec 1.0.0-rc.1 · self-assessed');
  assert.equal(run({ 'a.css': '.a{gap:8px}' }, { unit: 4 }).claim, 'FP-1 · Native · u=4 · web · spec 1.0.0-rc.1 · self-assessed');
});

test('has.motion and has.controls: contradictions fail; true is not contradicted; other has values are not read', () => {
  const css = '.a{animation:x 1s} a:hover{color:red} @keyframes x{from{opacity:0}}';
  const r = run({ 'a.css': css }, { has: { ...HAS_NONE, charts: false } });
  assert.deepEqual(r.findings.filter((f) => f.check === 'conf.not-applicable').map((f) => f.has).sort(), ['controls', 'motion']);
  assert.equal(run({ 'a.css': css }, { has: { ...HAS_NONE, motion: true, controls: true } }).result, 'pass');
  for (const sel of ['button', 'a', 'input', 'select', 'textarea', 'summary', '[role="button"]', '.x:focus', '.x:focus-visible', '.x:hover', '.nav a']) {
    assert.equal(run({ 'a.css': `${sel}{gap:8px}` }).findings.length, 1, sel);
  }
  for (const sel of ['.button', '.a', '#input', '.x:focus-within', 'abbr']) assert.equal(run({ 'a.css': `${sel}{gap:8px}` }).findings.length, 0, sel);
});

test('contrast: themes by selector and by media; never rounded; unresolved colours are not-run', () => {
  const css = ':root{--ink:#767676;--bg:#fff} [data-theme="dark"]{--ink:#777;--bg:#fff} @media (prefers-color-scheme: dark){:root{--ink:#000;--bg:#000}}';
  const cfg = { pairs: [{ fg: '--ink', bg: '--bg', kind: 'text' }], themes: [{ name: 'light', selector: ':root' }, { name: 'dark', selector: '[data-theme="dark"]' }, { name: 'os', media: '(prefers-color-scheme: dark)' }] };
  const r = run({ 'a.css': css }, cfg);
  assert.deepEqual(r.pairs.map((p) => [p.theme, p.result]), [['light', 'pass'], ['dark', 'fail'], ['os', 'fail']]);
  assert.equal(r.pairs[1].ratio, 4.478);
  const un = run({ 'a.css': '.a{gap:8px}' }, { pairs: [{ fg: '--nope', bg: '#fff', kind: 'text' }] });
  assert.equal(un.pairs[0].result, 'not-run');
  assert.equal(un.result, 'not-run');
});

test('contrast: colours from a DTCG token file, by dotted address', () => {
  const tokens = { color: { $type: 'color', ink: { $value: { colorSpace: 'srgb', components: [0.1, 0.1, 0.1] } }, ground: { $value: '#ffffff' }, alias: { $value: '{color.ink}' } } };
  const r = run({ 'a.css': '.a{gap:8px}', 'c.tokens.json': tokens }, { source: ['*.css', '*.tokens.json'], pairs: [{ fg: 'color.alias', bg: 'color.ground', kind: 'text' }] });
  assert.equal(r.pairs[0].result, 'pass');
});

test('banned words in a configuration are found (FP-HONEST-02), the musical intervals are not', () => {
  const bad = run({ 'a.css': '.a{gap:8px}' }, { exceptions: [{ value: '6px', where: '.a', reason: 'content', rule: 'FP-SPACE-01', status: 'accepted', note: 'a perfect ratio' }] });
  assert.ok(bad.findings.some((f) => f.check === 'honest.banned-words'));
  const ok = run({ 'a.css': '.a{gap:8px}' }, { exceptions: [{ value: '6px', where: '.a', reason: 'content', rule: 'FP-SPACE-01', status: 'accepted', note: 'a perfect fourth' }] });
  assert.ok(!ok.findings.some((f) => f.check === 'honest.banned-words'));
});

test('an invalid configuration fails FP-MODE-02 and runs nothing else', () => {
  const r = run({ 'a.css': '.a{gap:7px}' }, { level: 'FP-3' });
  assert.equal(r.result, 'fail');
  assert.ok(r.configErrors.some((e) => /level/.test(e)));
  assert.equal(r.rules.find((x) => x.check === 'mode.config-schema').result, 'fail');
  assert.equal(r.rules.find((x) => x.check === 'space.on-ladder').result, 'not-run');
  assert.deepEqual(r.findings, []);
});

test('fp must equal the specification version checked against (FP-MODE-02)', () => {
  const r = run({ 'a.css': '.a{gap:8px}' }, { fp: '1.0.9' });
  assert.equal(r.result, 'fail');
  assert.ok(r.configErrors.some((e) => /1\.0\.9/.test(e)));
});

test('rules table: n/a with a reason, self-report listed, informative and later levels not part of a run', () => {
  const r = run({ 'a.css': '.a{gap:8px}' });
  const get = (id) => r.rules.find((x) => x.id === id);
  assert.equal(get('FP-MATH-03').result, 'pass');
  assert.equal(get('FP-MATH-04').result, 'self-report');
  assert.equal(get('FP-MODE-04').result, 'n/a');
  assert.match(get('FP-MODE-04').reason, /mode is native/);
  assert.equal(get('FP-TYPE-01').result, 'n/a');
  assert.match(run({ 'a.css': '.a{gap:8px}' }, { has: { ...HAS_NONE, motion: true } }).rules.find((x) => x.id === 'FP-MOTION-01').reason, /FP-3/);
  assert.equal(get('FP-AGENT-07').result, 'n/a');
  assert.equal(get('FP-CONF-01').result, 'n/a');
  assert.equal(get('FP-PLAT-05').result, 'n/a');
  assert.ok(r.rules.every((x) => ['pass', 'fail', 'n/a', 'not-run', 'self-report', 'pending'].includes(x.result)));
  assert.equal(r.rules.length, 185);
});
