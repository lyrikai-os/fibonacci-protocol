#!/usr/bin/env node
// Lyrikai: Fibonacci Protocol for UI/UX Design Agents (MIT) - https://www.lyrikai.com
// WCAG 2.x contrast checker. Dependency-free, Node 20+.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const THRESHOLDS = {
  text: 4.5,
  'large-text': 3,
  mark: 3,
  'control-edge': 3,
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const GAMUT_EPS = 1e-6;

const NUM = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?';
const NUM_RE = new RegExp(`^${NUM}$`, 'i');
const PCT_RE = new RegExp(`^(${NUM})%$`, 'i');

function parseNum(tok, pctScale = 1) {
  if (tok === 'none') return 0;
  const p = PCT_RE.exec(tok);
  if (p) return (parseFloat(p[1]) / 100) * pctScale;
  if (!NUM_RE.test(tok)) throw new Error(`bad number: ${tok}`);
  return parseFloat(tok);
}
function parseAlpha(tok) {
  if (tok === undefined) return 1;
  return clamp01(parseNum(tok, 1));
}
function parseHue(tok) {
  if (tok === 'none') return 0;
  const m = new RegExp(`^(${NUM})(deg|rad|grad|turn)?$`, 'i').exec(tok);
  if (!m) throw new Error(`bad hue: ${tok}`);
  const v = parseFloat(m[1]);
  switch ((m[2] || '').toLowerCase()) {
    case 'rad': return (v * 180) / Math.PI;
    case 'grad': return v * 0.9;
    case 'turn': return v * 360;
    default: return v;
  }
}

/** Parse a CSS-ish colour. Returns {r,g,b,a,notes,clipped}: r,g,b in 0..255 (sRGB, may be fractional), a in 0..1. */
export function parseColor(input) {
  if (typeof input !== 'string') throw new Error(`colour must be a string, got ${JSON.stringify(input)}`);
  const s = input.trim().toLowerCase();
  const notes = [];
  let m;
  if ((m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s))) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1, notes, clipped: false };
  }
  if ((m = /^rgba?\(\s*(.+?)\s*\)$/.exec(s))) {
    const body = m[1];
    let toks;
    if (body.includes(',')) {
      if (body.includes('/')) throw new Error(`bad rgb(): ${input}`);
      toks = body.split(/\s*,\s*/);
      if (toks.length < 3 || toks.length > 4) throw new Error(`bad rgb(): ${input}`);
    } else {
      const [chans, alpha, extra] = body.split(/\s*\/\s*/);
      if (extra !== undefined) throw new Error(`bad rgb(): ${input}`);
      toks = chans.split(/\s+/);
      if (toks.length !== 3) throw new Error(`bad rgb(): ${input}`);
      if (alpha !== undefined) toks.push(alpha.trim());
    }
    const [r, g, b] = toks.slice(0, 3).map((t) => parseNum(t, 255));
    return { r: Math.min(255, Math.max(0, r)), g: Math.min(255, Math.max(0, g)), b: Math.min(255, Math.max(0, b)), a: parseAlpha(toks[3]), notes, clipped: false };
  }
  if ((m = /^oklch\(\s*(.+?)\s*\)$/.exec(s))) {
    const [body, alpha, extra] = m[1].split(/\s*\/\s*/);
    if (extra !== undefined) throw new Error(`bad oklch(): ${input}`);
    const toks = body.split(/[\s,]+/).filter(Boolean);
    if (toks.length !== 3) throw new Error(`bad oklch() (needs exactly L C H): ${input}`);
    const L = parseNum(toks[0], 1);
    let C = parseNum(toks[1], 0.4);
    const H = parseHue(toks[2]);
    if (C < 0) { notes.push('negative chroma clamped to 0'); C = 0; }
    const lin = oklchToLinearSrgb(L, C, H);
    const clipped = lin.some((v) => v < -GAMUT_EPS || v > 1 + GAMUT_EPS);
    if (clipped) notes.push(`oklch out of sRGB gamut, clipped per channel (not gamut-mapped): ${input}`);
    const [r, g, b] = lin.map((v) => linearToSrgb(clamp01(v)) * 255);
    return { r, g, b, a: parseAlpha(alpha), notes, clipped };
  }
  throw new Error(`unsupported colour: ${input}`);
}

export function oklchToLinearSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
  ];
}

export function linearToSrgb(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

const srgbToLinear = (c8) => {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Composite a colour with alpha over an opaque background (sRGB space, as browsers do). */
export function composite(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * Returns {ratio, notes, fg, bg, unverified, reason}.
 * A translucent bg needs opts.backdrop (opaque colour); without it the result is unverified.
 * An out-of-gamut oklch input is clipped, so the ratio is only an estimate and the result is unverified.
 */
export function contrast(fgIn, bgIn, opts = {}) {
  const fg0 = typeof fgIn === 'string' ? parseColor(fgIn) : fgIn;
  const bg0 = typeof bgIn === 'string' ? parseColor(bgIn) : bgIn;
  const notes = [...(fg0.notes || []), ...(bg0.notes || [])];
  let unverified = false;
  let reason = '';
  let bg = bg0;
  if (bg0.a < 1) {
    if (opts.backdrop === undefined) {
      unverified = true;
      reason = 'translucent background without a backdrop colour';
      bg = composite(bg0, { r: 255, g: 255, b: 255, a: 1 });
      notes.push('background has alpha and no backdrop was given: ratio below assumes white and is NOT a verdict');
    } else {
      const back = typeof opts.backdrop === 'string' ? parseColor(opts.backdrop) : opts.backdrop;
      if (back.a < 1) throw new Error('backdrop must be opaque');
      notes.push(...(back.notes || []));
      if (back.clipped) { unverified = true; reason = 'out of gamut'; }
      bg = composite(bg0, back);
    }
  }
  if (fg0.clipped || bg0.clipped) {
    unverified = true;
    reason = reason ? `${reason}; out of gamut` : 'out of gamut';
  }
  const fg = fg0.a < 1 ? composite(fg0, bg) : fg0;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return { ratio: (hi + 0.05) / (lo + 0.05), notes, fg, bg, unverified, reason };
}

/** Compare the unrounded ratio against the threshold. 4.499 fails 4.5. */
export const passes = (ratio, threshold) => ratio >= threshold;

const label = (c) => (typeof c === 'string' ? c : JSON.stringify(c));

export function checkPair({ fg, bg, kind = 'text', name, backdrop }) {
  if (!(kind in THRESHOLDS)) throw new Error(`unknown kind "${kind}" (use ${Object.keys(THRESHOLDS).join(', ')})`);
  if (typeof fg !== 'string' || typeof bg !== 'string') throw new Error('fg and bg must be colour strings');
  const { ratio, notes, unverified, reason } = contrast(fg, bg, { backdrop });
  const threshold = THRESHOLDS[kind];
  const pass = !unverified && passes(ratio, threshold);
  return { name: name ?? `${label(fg)} on ${label(bg)}`, fg, bg, kind, ratio, threshold, pass, unverified, reason, notes };
}

const fmt = (r) => r.toFixed(2); // display only; never used for comparison

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    console.log("usage: contrast.mjs '#fg' '#bg' [--backdrop '#colour']\n       contrast.mjs --pairs pairs.json\nexit: 0 all pass, 1 a pair fails or is unverified, 2 usage/parse error");
    return args.length === 0 ? 2 : 0;
  }
  try {
    if (args[0] === '--pairs') {
      if (!args[1]) throw new Error('--pairs needs a file');
      const pairs = JSON.parse(readFileSync(args[1], 'utf8'));
      if (!Array.isArray(pairs)) throw new Error('pairs file must be a JSON array');
      let failed = 0;
      for (const p of pairs) {
        const r = checkPair(p);
        if (!r.pass) failed++;
        const tag = r.unverified ? 'UNVERIFIED' : r.pass ? 'PASS' : 'FAIL';
        console.log(`${tag}  ${fmt(r.ratio)}:1  need ${r.threshold}  [${r.kind}]  ${r.name}${r.unverified ? `  (${r.reason})` : ''}`);
        for (const n of r.notes) console.log(`      note: ${n}`);
      }
      console.log(`${pairs.length - failed}/${pairs.length} pass`);
      return failed ? 1 : 0;
    }
    const pos = [];
    let backdrop;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--backdrop') {
        backdrop = args[++i];
        if (backdrop === undefined || backdrop.startsWith('--')) throw new Error('--backdrop needs a colour value');
      }
      else pos.push(args[i]);
    }
    if (pos.length !== 2) throw new Error('expected two colours');
    const { ratio, notes, unverified, reason } = contrast(pos[0], pos[1], { backdrop });
    console.log(`${fmt(ratio)}:1`);
    if (unverified) {
      console.log(`UNVERIFIED (${reason}): no pass/fail verdict`);
      for (const n of notes) console.log(`note: ${n}`);
      return 1;
    }
    console.log(`text (4.5):       ${passes(ratio, 4.5) ? 'pass' : 'fail'}`);
    console.log(`large text (3):   ${passes(ratio, 3) ? 'pass' : 'fail'}`);
    console.log(`non-text (3):     ${passes(ratio, 3) ? 'pass' : 'fail'}`);
    for (const n of notes) console.log(`note: ${n}`);
    return passes(ratio, 4.5) ? 0 : 1;
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main(process.argv);
