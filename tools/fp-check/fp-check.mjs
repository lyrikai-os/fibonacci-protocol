#!/usr/bin/env node
// fp-check: the reference conformance checker for Lyrikai: Fibonacci Protocol for UI/UX Design Agents.
// MIT License. https://www.lyrikai.com
import fs from 'node:fs';
import path from 'node:path';
import { runCheck, UsageError, TOOL_VERSION } from './lib/check.mjs';
import { compareExpected } from './lib/compare.mjs';
import { formatText } from './lib/format.mjs';

const HELP = `fp-check ${TOOL_VERSION} - reference checker for Lyrikai: Fibonacci Protocol for UI/UX Design Agents (https://www.lyrikai.com)

Usage: fp-check [dir] [--config fp.config.json] [--json] [--expect expected.json] [--spec <dir>]

  dir        folder that holds fp.config.json and the source (default: .)
  --config   path to the configuration (default: <dir>/fp.config.json)
  --json     print the report as JSON
  --expect   compare the report with an expected-results file and report differences
  --spec     folder with rules.json and fp.config.schema.json (default: the repository's spec/)

Exit codes: 0 machine pass (claim valid or candidate; see claimState with --json) or --expect matches, 1 fail, pending or an item answered fail (or --expect differs), 2 not-run or an input error.`;

class Done extends Error {}

function parse(argv) {
  const o = { dir: null, config: null, json: false, expect: null, spec: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else if (a === '--config' || a === '--expect' || a === '--spec') {
      const v = argv[++i];
      if (v === undefined) throw new UsageError(`${a} needs a value`);
      o[a.slice(2)] = v;
    } else if (a.startsWith('--config=') || a.startsWith('--expect=') || a.startsWith('--spec=')) {
      const [k, ...rest] = a.slice(2).split('='); o[k] = rest.join('=');
    } else if (a.startsWith('-')) throw new UsageError(`unknown option ${a}`);
    else if (o.dir === null) o.dir = a;
    else throw new UsageError(`unexpected argument ${a}`);
  }
  return o;
}

try {
  const o = parse(process.argv.slice(2));
  if (o.help) { console.log(HELP); process.exitCode = 0; throw new Done(); }
  const dir = path.resolve(o.dir ?? '.');
  // --config is read relative to dir when the file is there, otherwise relative to the working directory.
  const configPath = !o.config ? undefined : path.isAbsolute(o.config) || !fs.existsSync(path.join(dir, o.config)) ? path.resolve(o.config) : path.join(dir, o.config);
  const report = runCheck({ dir, configPath, specDir: o.spec ?? undefined });
  let diffs = null;
  if (o.expect) {
    const expected = JSON.parse(fs.readFileSync(path.resolve(o.expect), 'utf8'));
    diffs = compareExpected(report, expected);
  }
  if (o.json) console.log(JSON.stringify(diffs ? { ...report, expect: { file: o.expect, ok: diffs.length === 0, differences: diffs } } : report, null, 2));
  else {
    console.log(formatText(report));
    if (diffs) console.log(diffs.length ? `\nDiffers from ${o.expect}:\n` + diffs.map((d) => '  - ' + d).join('\n') : `\nMatches ${o.expect}.`);
  }
  // process.exitCode, not process.exit(): a piped stdout must be flushed before the process ends.
  process.exitCode = diffs ? (diffs.length ? 1 : 0) : report.result === 'pass' ? 0 : report.result === 'not-run' ? 2 : 1;
} catch (e) {
  if (e instanceof Done) { /* help printed */ }
  else if (e instanceof UsageError) { console.error(`fp-check: ${e.message}\n\n${HELP}`); process.exitCode = 2; }
  else { console.error(e.stack || e.message); process.exitCode = 2; }
}
