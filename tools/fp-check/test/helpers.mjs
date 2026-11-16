import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCheck } from '../lib/check.mjs';

export const HAS_NONE = { motion: false, timeLimits: false, controls: false, charts: false, generatedArt: false, states: false };

export function baseConfig(over = {}) {
  return { fp: '1.0.0-rc.2', mode: 'native', level: 'FP-1', platform: 'web', unit: 1, has: HAS_NONE, source: ['*.css'], pairs: [{ fg: '#1a1a1a', bg: '#ffffff', kind: 'text' }], ...over };
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
