import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../lib/check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
/** The specification version, read from spec/rules.json so the tests follow a revision. */
export const SPEC = JSON.parse(fs.readFileSync(path.resolve(here, '../../../spec/rules.json'), 'utf8')).version;
export const SPEC_RE = SPEC.replace(/\./g, '\\.');

export const HAS_NONE = { motion: false, timeLimits: false, controls: false, charts: false, generatedArt: false, states: false };

export function baseConfig(over = {}) {
  return { fp: SPEC, mode: 'native', level: 'FP-1', platform: 'web', unit: 1, has: HAS_NONE, source: ['*.css'], pairs: [{ fg: '#1a1a1a', bg: '#ffffff', kind: 'text' }], ...over };
}

/** Write files (name -> text) plus fp.config.json into a fresh temp folder and run the checker. */
export function run(files, config = {}, opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-check-test-'));
  try {
    for (const [name, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
      fs.writeFileSync(path.join(dir, name), typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    }
    fs.writeFileSync(path.join(dir, 'fp.config.json'), JSON.stringify(baseConfig(config), null, 2));
    return runCheck({ dir, ...opts });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Findings of one check name. */
export const by = (report, check) => report.findings.filter((f) => f.check === check);
