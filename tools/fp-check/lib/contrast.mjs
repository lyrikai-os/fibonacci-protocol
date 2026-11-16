// Contrast on declared pairs (FP-A11Y-01, FP-A11Y-02). WCAG 2.x relative luminance. Ratios are never rounded.
import { truncate } from './util.mjs';

const NAMED = {
  white: '#ffffff', black: '#000000', red: '#ff0000', lime: '#00ff00', blue: '#0000ff', yellow: '#ffff00',
  cyan: '#00ffff', aqua: '#00ffff', magenta: '#ff00ff', fuchsia: '#ff00ff', silver: '#c0c0c0', gray: '#808080',
  grey: '#808080', maroon: '#800000', olive: '#808000', green: '#008000', purple: '#800080', teal: '#008080', navy: '#000080', orange: '#ffa500'
};

/** Parse a colour to { r, g, b, a } with r,g,b in 0..255, or null. Handles hex, rgb(), hsl(), a few names. */
export function parseColor(input) {
  if (input == null) return null;
  if (typeof input === 'object') return parseColorObject(input);
  let s = String(input).trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = /^rgba?\(\s*([^)]+)\)$/.exec(s);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = (p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    const out = { r: ch(parts[0]), g: ch(parts[1]), b: ch(parts[2]), a };
    return [out.r, out.g, out.b, out.a].some(Number.isNaN) ? null : out;
  }
  m = /^hsla?\(\s*([^)]+)\)$/.exec(s);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360;
    const sat = parseFloat(parts[1]) / 100; const l = parseFloat(parts[2]) / 100;
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat; const p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255, a };
  }
  return null;
}

function parseColorObject(o) {
  if (typeof o.hex === 'string') return parseColor(o.hex);
  const cs = String(o.colorSpace || '').toLowerCase();
  if ((cs === 'srgb' || cs === 'srgb-linear') && Array.isArray(o.components) && o.components.length >= 3) {
    const comp = o.components.map(Number);
    if (comp.some(Number.isNaN)) return null;
    const lin = cs === 'srgb-linear';
    const enc = (v) => (lin ? (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) : v);
    return { r: enc(comp[0]) * 255, g: enc(comp[1]) * 255, b: enc(comp[2]) * 255, a: o.alpha ?? 1 };
  }
  return null;
}

const lin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

export function contrastRatio(a, b) {
  const l1 = luminance(a); const l2 = luminance(b);
  const hi = Math.max(l1, l2); const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export const REQUIRED = { text: 4.5, 'large-text': 3, mark: 3 };

/** Test one pair. The comparison uses the exact ratio; only the display is truncated to 3 decimals. */
export function testPair(fg, bg, kind) {
  const required = REQUIRED[kind];
  const ratio = contrastRatio(fg, bg);
  return { ratio: truncate(ratio, 3), exact: ratio, required, pass: ratio >= required };
}
