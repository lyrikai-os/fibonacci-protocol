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

test('the config schema is bundled in the skill and the pack, and each entry point names it', () => {
  const src = read('spec/fp.config.schema.json');
  assert.equal(read(`${SKILL}/reference/fp.config.schema.json`), src);
  assert.equal(read('agent-pack/fp.config.schema.json'), src);
  for (const rel of [`${SKILL}/SKILL.md`, 'agent-pack/AGENTS.md', 'agent-pack/cursor/fibonacci-protocol.mdc']) {
    const s = read(rel);
    assert.ok(s.includes('fp.config.schema.json'), `${rel} names the schema`);
    assert.ok(s.includes('FP-MODE-02'), `${rel} points to the FP-MODE-02 field table`);
  }
  const md = read(`${SKILL}/reference/FP-AGENT.md`);
  assert.ok(md.includes('| Field | Type | Required |'), 'FP-AGENT.md carries the field table');
});

test('AGENTS.md gives the skill path and the install paths', () => {
  const s = read('agent-pack/AGENTS.md');
  assert.ok(s.includes('skills/lyrikai-fibonacci/'));
  for (const p of ['.agents/skills/', '~/.agents/skills/', '.claude/skills/', '.cursor/skills/']) {
    assert.ok(s.includes(p), p);
  }
});

test('consent wording for non-interactive runs matches FP-AGENT-01 and FP-AGENT-03 in every entry point', () => {
  for (const rel of [`${SKILL}/SKILL.md`, 'agent-pack/AGENTS.md', 'agent-pack/cursor/fibonacci-protocol.mdc']) {
    const s = read(rel).replace(/\s+/g, ' ');
    assert.match(s, /non-interactive[^.]*a request to apply the protocol is (itself )?the consent to write/i, `${rel}: config consent`);
    assert.match(s, /reason=floor/, `${rel}: floor reason`);
    assert.match(s, /status=accepted/, `${rel}: floor accepted`);
    assert.match(s, /smallest/, `${rel}: smallest change`);
    assert.ok(!/write `?fp\.config\.json`? only after showing it and getting a yes\b(?! in an interactive)/i.test(s), `${rel}: old unconditional wording`);
  }
  // the source rules still say what the pack says
  const r = (id) => c.spec.rules.find((x) => x.id === id).text;
  assert.match(r('FP-AGENT-01'), /non-interactive run, a request to apply the protocol is itself the consent to write/);
  assert.match(r('FP-AGENT-03'), /every non-interactive run in any mode, it makes the change without asking/);
});

test('FP-CHANGE reasons in the pack match FP-AGENT-08 and include layout', () => {
  assert.match(c.spec.rules.find((x) => x.id === 'FP-AGENT-08').text, /floor\|scale\|snap\|layout/);
  for (const rel of [`${SKILL}/SKILL.md`, 'agent-pack/cursor/fibonacci-protocol.mdc']) {
    assert.ok(read(rel).includes('floor|scale|snap|layout'), rel);
  }
});

test('SKILL.md has the first-run checklist', () => {
  const s = read(`${SKILL}/SKILL.md`);
  const i = s.indexOf('## First run: checklist');
  assert.ok(i > 0);
  const sec = s.slice(i, s.indexOf('\n## ', i + 5));
  for (const t of ['fp.config.json', 'in place', 'FP-A11Y-20', 'node <repo>/tools/fp-check/fp-check.mjs <folder>', 'FP-OFF', 'FP-CHANGE', 'Suggestions', 'exactly as `fp-check` prints it']) {
    assert.ok(sec.includes(t), `first run lacks ${t}`);
  }
  assert.ok(s.includes('FP-AGENT-13'));
  assert.ok(s.split('\n').length < 350);
});

const ENTRY = [`${SKILL}/SKILL.md`, 'agent-pack/AGENTS.md', 'agent-pack/cursor/fibonacci-protocol.mdc'];
const flat = (rel) => read(rel).replace(/\s+/g, ' ');

test('1. fp-report.md: eight sections in order, in every entry point; first run says write it', () => {
  const order = ['Claim', 'State', 'FP-OFF', 'FP-CHANGE', 'Exemptions added', 'Suggestions', 'Rules', 'About line'];
  for (const rel of ENTRY) {
    const s = flat(rel);
    assert.ok(s.includes('fp-report.md'), `${rel} names fp-report.md`);
    assert.ok(s.includes('FP-AGENT-14'), `${rel} cites FP-AGENT-14`);
    let at = s.indexOf('fp-report.md');
    for (const sec of order) {
      const i = s.indexOf(sec, at);
      assert.ok(i >= 0, `${rel}: section "${sec}" missing or out of order`);
      at = i;
    }
    assert.match(s, /Snapped lengths (go|are recorded|are) in (the|that|this) (Snap )?table[^.]*never/i, `${rel}: snapped lengths not FP-CHANGE`);
  }
  const s = read(`${SKILL}/SKILL.md`);
  const sec = s.slice(s.indexOf('## First run: checklist'), s.indexOf('## Check'));
  assert.match(sec, /Write `fp-report\.md`/);
  assert.equal(c.spec.rules.find((x) => x.id === 'FP-AGENT-14').title, 'The report file');
});

test('2. evidence: fp-evidence.json explained, schema bundled, no invented evidence', () => {
  const src = read('spec/fp-evidence.schema.json');
  assert.equal(read(`${SKILL}/reference/fp-evidence.schema.json`), src);
  assert.equal(read('agent-pack/fp-evidence.schema.json'), src);
  for (const rel of ENTRY) {
    const s = flat(rel);
    assert.ok(s.includes('fp-evidence.json'), `${rel} names fp-evidence.json`);
    assert.ok(s.includes('fp-evidence.schema.json'), `${rel} names the evidence schema`);
    assert.match(s, /never invent evidence|invent evidence/i, `${rel}: no invented evidence`);
    assert.match(s, /candidate line/i, `${rel}: candidate line`);
  }
  const s = flat(`${SKILL}/SKILL.md`);
  assert.match(s, /valid only with complete evidence/);
  assert.match(s, /open/);
});

test('3. FP-AGENT-13: .fp-original kept when not under version control', () => {
  for (const rel of ENTRY) assert.ok(read(rel).includes('.fp-original'), rel);
  assert.match(c.spec.rules.find((x) => x.id === 'FP-AGENT-13').text, /\.fp-original/);
});

test('4. breakpoints in @media and @container are never an FP-OFF line', () => {
  for (const rel of ENTRY) {
    const s = flat(rel);
    assert.ok(s.includes('@media') && s.includes('@container'), rel);
    assert.match(s, /never an `FP-OFF` line/, rel);
  }
});

test('5. map/Snap table consent agrees with FP-AGENT-03', () => {
  const s = flat(`${SKILL}/SKILL.md`);
  assert.ok(!/write it only after consent/.test(s), 'stale map wording');
  assert.match(s, /A declared `snap` mode[^.]*is the consent to build and apply it/);
  assert.match(c.spec.rules.find((x) => x.id === 'FP-AGENT-03').text, /declared `snap` mode[^.]*consent to build and apply the Snap table/);
});

test('6. fp-check path is given from the protocol repository', () => {
  for (const rel of ENTRY) {
    const s = flat(rel);
    assert.ok(s.includes('node <repo>/tools/fp-check/fp-check.mjs <folder>'), `${rel} path`);
    assert.match(s, /protocol repository/, rel);
    assert.match(s, /no `tools\/`/, `${rel}: adopter folder has no tools/`);
    assert.ok(!/run `node tools\/fp-check/.test(s), `${rel}: bare relative path`);
  }
});

test('7. the .mdc can be acted on alone', () => {
  const s = flat('agent-pack/cursor/fibonacci-protocol.mdc');
  for (const t of ['FP-MODE-02', 'fp.config.schema.json', '`target`', '`drawn`', 'FP-SNAP-11', 'Snap', 'snap.table', 'what breaks', 'fp-report.md', 'fp-evidence.json']) {
    assert.ok(s.includes(t), `mdc lacks ${t}`);
  }
});
