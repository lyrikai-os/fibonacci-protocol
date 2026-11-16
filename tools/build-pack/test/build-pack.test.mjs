// MIT License. Lyrikai: Fibonacci Protocol for UI/UX Design Agents. https://www.lyrikai.com
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, context } from '../build-pack.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const c = context(root);
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const SKILL = 'skills/lyrikai-fibonacci';

test('every normative rule ID appears in FP-AGENT.md (skill and pack)', () => {
  for (const rel of [`${SKILL}/reference/FP-AGENT.md`, 'agent-pack/FP-AGENT.md']) {
    const md = read(rel);
    const normative = c.spec.rules.filter((r) => r.status === 'normative');
    assert.ok(normative.length >= 125);
    for (const r of normative) {
      assert.ok(md.includes(`#### ${r.id} · ${r.title}`), `${r.id} missing in ${rel}`);
    }
  }
});

test('informative rules are listed by ID', () => {
  const md = read(`${SKILL}/reference/FP-AGENT.md`);
  for (const r of c.spec.rules.filter((r) => r.status !== 'normative')) {
    assert.ok(md.includes(`- ${r.id} · `), `${r.id} not listed`);
    assert.ok(!md.includes(`#### ${r.id} ·`), `${r.id} must not be in full`);
  }
});

test('the six verbs and the activation phrase are present in the skill', () => {
  const s = read(`${SKILL}/SKILL.md`);
  for (const v of ['on', 'off', 'init', 'check', 'explain <rule-ID>', 'map']) {
    assert.ok(new RegExp('^\\| `' + v.replace(/[<>-]/g, (m) => '\\' + m) + '[ `\\[]', 'm').test(s), `verb ${v}`);
  }
  assert.ok(s.includes('use Fibonacci design principles'));
  assert.ok(s.includes('/lyrikai-fibonacci'));
});

test('SKILL.md frontmatter is valid and small', () => {
  const s = read(`${SKILL}/SKILL.md`);
  const m = s.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'frontmatter');
  assert.match(m[1], /^name: lyrikai-fibonacci$/m);
  const d = m[1].match(/^description: (.+)$/m);
  assert.ok(d && !m[1].includes('\n  '), 'single-line description');
  for (const t of ['/lyrikai-fibonacci', 'use Fibonacci design principles', 'Fibonacci Protocol', 'golden ratio design system']) {
    assert.ok(d[1].includes(t), `description triggers on ${t}`);
  }
  assert.ok(s.split('\n').length < 350);
});

test('the About line carries the spec version and the site, in every generated file that prints it', () => {
  const about = `${c.name} · spec ${c.version} · MIT License · https://www.lyrikai.com`;
  assert.equal(c.about, about);
  for (const rel of [`${SKILL}/SKILL.md`, 'agent-pack/AGENTS.md', 'agent-pack/cursor/fibonacci-protocol.mdc', 'agent-pack/README.md']) {
    assert.ok(read(rel).includes(about), `${rel} lacks the About line`);
  }
  assert.equal(c.version, JSON.parse(read('spec/rules.json')).version);
});

test('every Markdown file has title, version, link and MIT note', () => {
  const files = Object.keys(generate(root)).filter((f) => f.endsWith('.md') || f.endsWith('.mdc'));
  assert.ok(files.length >= 6);
  for (const rel of files) {
    const s = read(rel).replace(/^---\n[\s\S]*?\n---\n/, '');
    assert.match(s, /^# Lyrikai: Fibonacci Protocol for UI\/UX Design Agents/m, rel);
    assert.ok(s.includes(c.version), `${rel} version`);
    assert.ok(s.includes('https://www.lyrikai.com'), `${rel} link`);
    assert.match(s, /MIT/, `${rel} MIT`);
  }
});

test('copies match their sources', () => {
  assert.equal(read(`${SKILL}/reference/rules.json`), read('spec/rules.json'));
  assert.equal(read(`${SKILL}/reference/fp.css`), read('dist/fp.css'));
  assert.equal(read('agent-pack/FP-AGENT.md'), read(`${SKILL}/reference/FP-AGENT.md`));
  const cfg = JSON.parse(read(`${SKILL}/reference/fp.config.example.json`));
  assert.equal(cfg.fp, c.version);
  assert.equal(cfg.mode, 'overlay');
});

test('Cursor rule has the required frontmatter and is not always on', () => {
  const s = read('agent-pack/cursor/fibonacci-protocol.mdc');
  const fm = s.match(/^---\n([\s\S]*?)\n---\n/)[1];
  assert.match(fm, /^description: .+/m);
  assert.match(fm, /^globs: .+/m);
  assert.match(fm, /^alwaysApply: false$/m);
});

test('no unresolved placeholders and no private paths', () => {
  for (const [rel, content] of Object.entries(generate(root))) {
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), `${rel} placeholder`);
    assert.ok(!/[/]Users[/]|[/]home[/][a-z]/.test(content), `${rel} path`);
  }
});

test('generated files are up to date (re-run equals committed)', () => {
  for (const [rel, content] of Object.entries(generate(root))) {
    assert.ok(existsSync(join(root, rel)), `${rel} missing; run build-pack.mjs`);
    assert.equal(read(rel), content, `${rel} is stale; run node tools/build-pack/build-pack.mjs`);
  }
});

test('generation is deterministic', () => {
  assert.deepEqual(generate(root), generate(root));
});
