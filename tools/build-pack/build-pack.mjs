#!/usr/bin/env node
// Lyrikai: Fibonacci Protocol for UI/UX Design Agents - agent pack generator.
// MIT License. https://www.lyrikai.com
//
// Generates the /lyrikai-fibonacci skill and the agent pack from spec/rules.json,
// spec/index.md and dist/fp.css, so they cannot drift from the specification.
//
//   node tools/build-pack/build-pack.mjs [--root <repo>] [--check]
//
// --check writes nothing and exits 1 if any generated file is missing or differs.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const LEVEL_ORDER = ['Agent', 'Guard', 'FP-1', 'FP-2', 'FP-3', 'FP-4a', 'FP-4b'];
const LEVEL_TITLE = {
  Agent: 'Agent rules (how a design agent behaves)',
  Guard: 'Guard rules (the base of every level)',
  'FP-1': 'FP-1: space and radius',
  'FP-2': 'FP-2: type, layout and grids',
  'FP-3': 'FP-3: motion and the state grammar',
  'FP-4a': 'FP-4a: art and illustration',
  'FP-4b': 'FP-4b: data visualisation',
};

const idKey = (id) => id.split('-').map((p) => (/^\d+$/.test(p) ? p.padStart(4, '0') : p)).join('-');
const byId = (a, b) => (idKey(a.id) < idKey(b.id) ? -1 : idKey(a.id) > idKey(b.id) ? 1 : 0);

// Relative spec links do not exist in the pack: keep the text, drop the target.
const plainLinks = (s) => s.replace(/\[([^\]]+)\]\((?!https?:)[^)]*\)/g, '$1');

export function context(root) {
  const rulesPath = join(root, 'spec', 'rules.json');
  const rulesJson = readFileSync(rulesPath, 'utf8');
  const spec = JSON.parse(rulesJson);
  const version = spec.version;
  const url = spec.homepage;
  const index = readFileSync(join(root, 'spec', 'index.md'), 'utf8');
  const m = index.match(/\*\*2\. Write `fp\.config\.json`\*\*[\s\S]*?```json\n([\s\S]*?)\n```/);
  if (!m) throw new Error('quick-start config block not found in spec/index.md');
  const config = JSON.parse(m[1]);
  config.fp = version;
  return {
    spec,
    version,
    url,
    rulesJson,
    schema: readFileSync(join(root, 'spec', 'fp.config.schema.json'), 'utf8'),
    css: readFileSync(join(root, 'dist', 'fp.css'), 'utf8'),
    configExample: JSON.stringify(config, null, 2) + '\n',
    name: spec.name,
    header: `*${spec.name} · version ${version} · MIT License · [www.lyrikai.com](${url})*`,
    about: `${spec.name} · spec ${version} · MIT License · ${url}`,
    aboutShort: `${spec.name}, spec ${version}. ${url}`,
  };
}

function ruleBlock(r) {
  const test = `${r.test.kind}, \`${r.test.check}\``;
  const ev = r.evidence.label + (r.evidence.url ? ` (${r.evidence.url})` : '');
  return [
    `#### ${r.id} · ${r.title}`,
    '',
    plainLinks(r.text).trim(),
    '',
    `- **Applies when:** ${r.appliesWhen} · **Test:** ${test} · **Evidence:** ${ev}`,
    '',
  ].join('\n');
}

export function buildAgentMd(c) {
  const rules = c.spec.rules;
  const norm = rules.filter((r) => r.status === 'normative');
  const info = rules.filter((r) => r.status !== 'normative');
  const L = [];
  L.push(`# ${c.name}: FP-AGENT, the protocol in one file`, '', c.header, '');
  L.push(
    'This file is the whole protocol for a design agent, for any LLM or tool. It is generated from `spec/rules.json`, so it matches the specification exactly. Normative rules are binding and tested: their ID, title and text are given in full. Informative rules are guidance that binds no claim in this version: they are listed at the end.',
    '',
    `Activation: the user types \`/lyrikai-fibonacci on\` or says "use Fibonacci design principles". The agent rules (FP-AGENT-01 to FP-AGENT-13) come first; they are not part of a system's claim (FP-CONF-12). Version 1.0 claims are FP-1 or FP-2 on the web only (FP-CONF-05).`,
    '',
    `Counts: ${norm.length} normative rules, ${info.length} informative rules, ${rules.length} in all.`,
    '',
    '## Normative rules',
    ''
  );
  for (const lvl of LEVEL_ORDER) {
    const g = norm.filter((r) => r.level === lvl);
    if (!g.length) continue;
    L.push(`### ${LEVEL_TITLE[lvl] ?? lvl} (${g.length})`, '');
    for (const r of lvl === 'Agent' ? [...g].sort(byId) : g) L.push(ruleBlock(r));
  }
  L.push('## Informative rules', '', 'Published as guidance. They bind no claim in this version. A request for a level that is informative (FP-3, FP-4a, FP-4b) is answered with that fact. Use `explain <rule-ID>` or `reference/rules.json` for the text.', '');
  for (const lvl of LEVEL_ORDER) {
    const g = info.filter((r) => r.level === lvl);
    if (!g.length) continue;
    L.push(`### ${LEVEL_TITLE[lvl] ?? lvl} (${g.length})`, '');
    for (const r of g) L.push(`- ${r.id} · ${r.title}`);
    L.push('');
  }
  L.push('---', '', `${c.header.slice(1, -1).replace(/\[www\.lyrikai\.com\]\([^)]*\)/, `[www.lyrikai.com](${c.url})`)}`, '');
  return L.join('\n');
}

const fill = (tpl, c, extra = {}) => {
  const vars = {
    VERSION: c.version,
    URL: c.url,
    HEADER: c.header,
    ABOUT: c.about,
    ABOUT_SHORT: c.aboutShort,
    DATE_NOTE: 'the build date of this pack (November 2026)',
    ...extra,
  };
  return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`unknown placeholder {{${k}}}`);
    return vars[k];
  });
};

/** Returns { relativePath: content } for every generated file. */
export function generate(root) {
  const c = context(root);
  const t = (n) => readFileSync(join(here, 'templates', n), 'utf8');
  const agentMd = buildAgentMd(c);
  const S = 'skills/lyrikai-fibonacci';
  const A = 'agent-pack';
  return {
    [`${S}/SKILL.md`]: fill(t('SKILL.md.tpl'), c),
    [`${S}/reference/FP-AGENT.md`]: agentMd,
    [`${S}/reference/rules.json`]: c.rulesJson,
    [`${S}/reference/fp.config.schema.json`]: c.schema,
    [`${S}/reference/fp.css`]: c.css,
    [`${S}/reference/fp.config.example.json`]: c.configExample,
    [`${A}/AGENTS.md`]: fill(t('AGENTS.md.tpl'), c),
    [`${A}/cursor/fibonacci-protocol.mdc`]: fill(t('fibonacci-protocol.mdc.tpl'), c),
    [`${A}/FP-AGENT.md`]: agentMd,
    [`${A}/fp.config.schema.json`]: c.schema,
    [`${A}/README.md`]: fill(t('README.md.tpl'), c),
  };
}

export function main(argv) {
  const args = argv.slice(2);
  const ri = args.indexOf('--root');
  const root = resolve(ri >= 0 ? args[ri + 1] : join(here, '..', '..'));
  const check = args.includes('--check');
  const files = generate(root);
  const stale = [];
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, rel);
    const cur = existsSync(p) ? readFileSync(p, 'utf8') : null;
    if (cur === content) continue;
    if (check) stale.push(rel);
    else {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, content);
      console.log(`wrote ${rel}`);
    }
  }
  if (check) {
    if (stale.length) {
      for (const s of stale) console.error(`out of date: ${s}`);
      console.error('run: node tools/build-pack/build-pack.mjs');
      return 1;
    }
    console.log(`ok: ${Object.keys(files).length} generated files are up to date`);
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv);
}
