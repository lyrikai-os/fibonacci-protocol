import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../lib/schema.mjs';
import { baseConfig } from './helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const specDir = path.resolve(here, '../../../spec');
const schema = JSON.parse(fs.readFileSync(path.join(specDir, 'fp.config.schema.json'), 'utf8'));
const errs = (cfg) => validate(schema, cfg).map((e) => `${e.path} ${e.message}`);

test('validator: type, enum, const, pattern, minimum, minLength, minItems', () => {
  const s = { type: 'object', required: ['a'], additionalProperties: false, properties: {
    a: { type: 'integer', minimum: 2 }, b: { enum: ['x', 'y'] }, c: { const: 7 }, d: { type: 'string', pattern: '^a+$', minLength: 2 }, e: { type: 'array', minItems: 1, items: { type: 'number' } } } };
  assert.deepEqual(validate(s, { a: 2, b: 'x', c: 7, d: 'aa', e: [1.5] }), []);
  assert.match(validate(s, {})[0].message, /missing required property "a"/);
  assert.match(validate(s, { a: 1 })[0].message, />= 2/);
  assert.match(validate(s, { a: 2.5 })[0].message, /integer/);
  assert.match(validate(s, { a: 2, b: 'z' })[0].message, /one of/);
  assert.match(validate(s, { a: 2, c: 8 })[0].message, /equal 7/);
  assert.equal(validate(s, { a: 2, d: 'b' }).length, 2);
  assert.match(validate(s, { a: 2, e: [] })[0].message, /at least 1/);
  assert.match(validate(s, { a: 2, e: ['s'] })[0].path, /\/e\/0/);
  assert.match(validate(s, { a: 2, zz: 1 })[0].message, /not an allowed property/);
});

test('validator: $ref, allOf, anyOf, oneOf, not, if/then/else', () => {
  const s = { $defs: { n: { type: 'number' } }, type: 'object', properties: { x: { $ref: '#/$defs/n' } },
    allOf: [{ if: { properties: { k: { const: 1 } }, required: ['k'] }, then: { required: ['m'] }, else: { required: ['z'] } }],
    anyOf: [{ required: ['p'] }, { required: ['q'] }], not: { required: ['bad'] } };
  assert.deepEqual(validate(s, { x: 1, k: 1, m: 1, p: 1 }), []);
  assert.ok(validate(s, { x: 'a', k: 1, m: 1, p: 1 }).length);
  assert.ok(validate(s, { k: 1, p: 1 }).some((e) => /"m"/.test(e.message)));
  assert.ok(validate(s, { k: 2, p: 1 }).some((e) => /"z"/.test(e.message)));
  assert.ok(validate(s, { k: 2, z: 1 }).some((e) => /at least one/.test(e.message)));
  assert.ok(validate(s, { k: 2, z: 1, p: 1, bad: 1 }).some((e) => /must not match/.test(e.message)));
  assert.ok(validate({ oneOf: [{ type: 'string' }, { type: 'string', minLength: 1 }] }, 'a').length === 1);
});

test('fp.config.schema.json: a minimal configuration is valid', () => {
  assert.deepEqual(errs(baseConfig()), []);
});

test('fp.config.schema.json: required fields, enums, additional properties', () => {
  assert.ok(errs({}).some((m) => /"fp"/.test(m)));
  assert.ok(errs(baseConfig({ level: 'FP-3' })).some((m) => /\/level/.test(m)));
  assert.ok(errs(baseConfig({ platform: 'ios' })).some((m) => /\/platform/.test(m)));
  assert.ok(errs(baseConfig({ unit: 3 })).some((m) => /\/unit/.test(m)));
  assert.ok(errs(baseConfig({ extra: 1 })).some((m) => /\/extra is not an allowed/.test(m)));
  assert.ok(errs(baseConfig({ fp: '2.0.0' })).some((m) => /\/fp/.test(m)));
  assert.ok(errs(baseConfig({ type: { body: 12 } })).some((m) => /\/type\/body/.test(m)));
  assert.ok(errs(baseConfig({ has: { motion: true } })).some((m) => /has is missing|"timeLimits"/.test(m)));
  assert.ok(errs(baseConfig({ source: [] })).some((m) => /at least 1/.test(m)));
});

test('fp.config.schema.json: conditionals (snap needs snap.source, fine pointer needs a reason)', () => {
  assert.ok(errs(baseConfig({ mode: 'snap' })).some((m) => /"snap"/.test(m)));
  assert.ok(errs(baseConfig({ mode: 'snap', snap: {} })).some((m) => /"source"/.test(m)));
  assert.deepEqual(errs(baseConfig({ mode: 'snap', snap: { source: ['a.css'] } })), []);
  assert.ok(errs(baseConfig({ pointer: 'fine' })).some((m) => /pointerReason/.test(m)));
  assert.deepEqual(errs(baseConfig({ pointer: 'fine', pointerReason: 'desktop only' })), []);
});

test('fp.config.schema.json: exceptions (data needs a source), themes, pairs, overrides per unit', () => {
  const exc = { value: '10px', where: '.a', reason: 'data', rule: 'FP-SPACE-01', status: 'accepted' };
  assert.ok(errs(baseConfig({ exceptions: [exc] })).some((m) => /"source"/.test(m)));
  assert.deepEqual(errs(baseConfig({ exceptions: [{ ...exc, source: 'api' }] })), []);
  assert.ok(errs(baseConfig({ exceptions: [{ ...exc, reason: 'nope', source: 'x' }] })).some((m) => /\/reason/.test(m)));
  assert.ok(errs(baseConfig({ exceptions: [{ ...exc, rule: 'SPACE-1', source: 'x' }] })).some((m) => /\/rule/.test(m)));
  assert.ok(errs(baseConfig({ themes: [{ name: 'dark' }] })).some((m) => /at least one/.test(m)));
  assert.deepEqual(errs(baseConfig({ themes: [{ name: 'dark', selector: '[data-theme="dark"]' }] })), []);
  assert.ok(errs(baseConfig({ pairs: [{ fg: 'not a ref', bg: '#fff', kind: 'text' }] })).some((m) => /\/fg/.test(m)));
  assert.ok(errs(baseConfig({ pairs: [{ fg: '#fff', bg: '#000', kind: 'big' }] })).some((m) => /\/kind/.test(m)));
  const ov = (unit, to) => baseConfig({ mode: 'snap', unit, snap: { source: ['a.css'], overrides: [{ token: '--space-16', to, reason: 'r' }] } });
  assert.deepEqual(errs(ov(1, 21)), []);
  assert.ok(errs(ov(1, 16)).some((m) => /overrides\/0\/to/.test(m)));
  assert.deepEqual(errs(ov(4, 52)), []);
  assert.ok(errs(ov(4, 55)).some((m) => /overrides\/0\/to/.test(m)));
  assert.deepEqual(errs(ov(8, 64)), []);
  assert.ok(errs(ov(8, 13 * 4)).some((m) => /overrides\/0\/to/.test(m)));
});

test('every vector configuration validates against the schema', () => {
  const dir = path.join(specDir, 'test-vectors');
  for (const d of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, d.name, 'fp.config.json'), 'utf8'));
    assert.deepEqual(errs(cfg), [], d.name);
  }
});

test('the example in 02-integration-modes.md validates', () => {
  const md = fs.readFileSync(path.join(specDir, '02-integration-modes.md'), 'utf8');
  const m = /```json\n([\s\S]*?)\n```/.exec(md);
  assert.ok(m);
  assert.deepEqual(errs(JSON.parse(m[1])), []);
});
