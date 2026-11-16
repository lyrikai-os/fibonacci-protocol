import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCss, extractStyleBlocks, splitSelectors, stripComments } from '../lib/css.mjs';
import { splitValue, splitArgs, classifyToken, expandAtoms, resolveVars, VarTable, propertyFamily } from '../lib/values.mjs';

test('css: rules, declarations, important, line numbers', () => {
  const { rules } = parseCss('/* c */\n.a, .b { padding: 8px 1px !important;\n  margin:0 }\n.c{gap:2px}');
  assert.equal(rules.length, 2);
  assert.equal(rules[0].selector, '.a, .b');
  assert.deepEqual(rules[0].decls.map((d) => [d.prop, d.value, d.important, d.line]), [['padding', '8px 1px', true, 2], ['margin', '0', false, 3]]);
  assert.equal(rules[1].selector, '.c');
});

test('css: comments never hide or invent declarations', () => {
  assert.equal(stripComments('a/*x\ny*/b').length, 'a/*x\ny*/b'.length);
  const { rules } = parseCss('.a{ /* padding: 99px; */ gap: 3px; }');
  assert.deepEqual(rules[0].decls.map((d) => d.prop), ['gap']);
  const s = parseCss('.a{content:"/* not a comment */"; gap:2px}');
  assert.deepEqual(s.rules[0].decls.map((d) => d.prop), ['content', 'gap']);
});

test('css: at-rules, media, keyframes, nesting', () => {
  const { rules, atRules } = parseCss('@import "x.css"; @media (min-width: 610px) { .a { width: 5px } } @keyframes k { from { top: 0 } to { top: 1px } } .p { &:hover { gap: 1px } .q { gap: 2px } } @font-face { font-family: x; }');
  const sel = rules.map((r) => r.selector);
  assert.deepEqual(sel, ['.a', 'from', 'to', '.p', '.p:hover', '.p .q', '@font-face']);
  assert.deepEqual(rules[0].at, ['@media (min-width: 610px)']);
  assert.equal(rules.find((r) => r.selector === 'from').kind, 'keyframe');
  assert.equal(rules.find((r) => r.selector === '@font-face').kind, 'opaque');
  assert.ok(atRules.some((a) => /^@keyframes/.test(a.prelude)));
});

test('css: custom properties are collected with their selector and at-rules', () => {
  const { customProps } = parseCss(':root{--a: 1px; --B:calc(2px + 3px)} @media (x){ :root{--a:2px} }');
  assert.deepEqual(customProps.map((c) => [c.name, c.value, c.at.length]), [['--a', '1px', 0], ['--B', 'calc(2px + 3px)', 0], ['--a', '2px', 1]]);
});

test('html: <style> blocks keep their line numbers; inline style attributes are not read', () => {
  const html = '<html>\n<body style="padding:7px">\n<style>\n.a{gap:3px}\n</style></body>';
  const [b] = extractStyleBlocks(html);
  const { rules } = parseCss(b.css, { lineOffset: b.lineOffset });
  assert.equal(rules[0].decls[0].line, 4);
  assert.equal(extractStyleBlocks('<p style="gap:1px">').length, 0);
});

test('selectors split on top-level commas only', () => {
  assert.deepEqual(splitSelectors('a, b:not(.x, .y), c'), ['a', 'b:not(.x, .y)', 'c']);
});

test('values: splitValue keeps functions together and `/` apart', () => {
  assert.deepEqual(splitValue('calc(100% - 21px) var(--a, 3px)  8px'), ['calc(100% - 21px)', 'var(--a, 3px)', '8px']);
  assert.deepEqual(splitValue('10px 20px / 30px'), ['10px', '20px', '/', '30px']);
  assert.deepEqual(splitArgs('a, min(1px, 2px), c'), ['a', 'min(1px, 2px)', 'c']);
});

test('values: var() resolution follows chains, fallbacks and reports unresolved names', () => {
  const v = new VarTable();
  v.add({ name: '--a', value: 'var(--b)', selector: ':root' });
  v.add({ name: '--b', value: '8px', selector: ':root' });
  v.add({ name: '--c', value: '99px', selector: '.x' });
  v.add({ name: '--c', value: '5px', selector: ':root' });
  v.add({ name: '--loop', value: 'var(--loop)', selector: ':root' });
  assert.deepEqual(resolveVars('var(--a)', v), { text: '8px', chain: ['--a', '--b'], unresolved: [] });
  assert.equal(resolveVars('calc(var(--a) + var(--c))', v).text, 'calc(8px + 5px)');
  assert.equal(resolveVars('var(--zz, 3px)', v).text, '3px');
  assert.deepEqual(resolveVars('var(--zz)', v).unresolved, ['--zz']);
  assert.deepEqual(resolveVars('var(--loop)', v).unresolved, ['--loop']);
});

test('values: classification', () => {
  const k = (t) => classifyToken(t).kind;
  assert.equal(k('0'), 'zero'); assert.equal(k('0px'), 'zero'); assert.equal(k('-13px'), 'length');
  assert.equal(classifyToken('0.8125rem').px, 13); assert.equal(classifyToken('12pt').px, 16);
  for (const t of ['100%', '1fr', '66ch', '50vw', '100dvh', '10cqi', 'auto', 'min-content', 'max-content', 'fit-content', 'fit-content(20px)']) assert.equal(k(t), 'intrinsic', t);
  assert.equal(k('2em'), 'relative'); assert.equal(k('calc(1px + 2px)'), 'calc'); assert.equal(k('min(1px, 2px)'), 'minmax'); assert.equal(k('red'), 'unknown');
  assert.equal(k('var(--x)'), 'var');
});

test('values: shorthand expansion counts longhands (FP-CONF-08)', () => {
  const m = (p, v) => expandAtoms(p, splitValue(v)).map((a) => a.mult);
  assert.deepEqual(m('padding', '21px'), [4]);
  assert.deepEqual(m('padding', '12px 16px'), [2, 2]);
  assert.deepEqual(m('margin', '1px 2px 3px'), [1, 2, 1]);
  assert.deepEqual(m('inset', '1px 2px 3px 4px'), [1, 1, 1, 1]);
  assert.deepEqual(m('gap', '8px'), [2]);
  assert.deepEqual(m('gap', '12px 8px'), [1, 1]);
  assert.deepEqual(m('padding-inline', '5px'), [2]);
  assert.deepEqual(m('margin-block', '5px 8px'), [1, 1]);
  assert.deepEqual(m('padding-block-start', '5px'), [1]);
  assert.deepEqual(m('border-radius', '13px'), [4]);
  assert.deepEqual(m('border-radius', '1px 2px / 3px 4px'), [2, 2, 0, 0]);
  assert.deepEqual(m('border-width', '1px 2px'), [2, 2]);
  assert.deepEqual(m('border', '1px solid red'), [4]);
  assert.deepEqual(m('outline', 'thin dotted'), [1]);
  assert.deepEqual(m('width', '5px'), [1]);
  assert.deepEqual(m('box-shadow', '1px 1px red'), []);
});

test('values: which properties are checked and which are not (FP-CONF-08)', () => {
  for (const p of ['margin', 'padding-inline-end', 'row-gap', 'top', 'inset-block-start', 'min-inline-size', 'max-block-size', 'width', 'grid-gap']) assert.equal(propertyFamily(p), 'layout', p);
  for (const p of ['border-radius', 'border-top-left-radius']) assert.equal(propertyFamily(p), 'radius', p);
  for (const p of ['border-width', 'outline-width', 'outline-offset', 'border-top-width']) assert.equal(propertyFamily(p), 'border-width', p);
  for (const p of ['box-shadow', 'transform', 'background-position', 'letter-spacing', 'font-size', 'line-height', 'z-index', 'opacity', 'flex-basis']) assert.equal(propertyFamily(p), null, p);
});
