// Value reading: tokenising, var() resolution, length classification, shorthand expansion (FP-CONF-08).
import { collapse } from './util.mjs';

/** Split a CSS value on top-level whitespace (and keep `/` as its own token). */
export function splitValue(v) {
  const out = []; let cur = ''; let depth = 0; let q = null;
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    if (q) { cur += c; if (c === '\\') cur += v[++i] ?? ''; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (depth === 0 && /\s/.test(c)) { if (cur) { out.push(cur); cur = ''; } continue; }
    if (depth === 0 && c === '/') { if (cur) { out.push(cur); cur = ''; } out.push('/'); continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

/** Split function arguments on top-level commas. */
export function splitArgs(s) {
  const out = []; let cur = ''; let depth = 0;
  for (const c of s) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** Index of the `)` matching the `(` at i. */
export function matchParen(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    if (s[i] === '(') d++;
    else if (s[i] === ')') { d--; if (d === 0) return i; }
  }
  return -1;
}

/**
 * VarTable: name -> value, chosen the simple way (FP-CONF-08 does not ask for the cascade):
 * the last declaration on :root or html outside an at-rule, else the last declaration anywhere.
 */
export class VarTable {
  constructor() { this.entries = new Map(); }
  add({ name, value, selector = '', at = [], file = '', line = 0 }) {
    if (!this.entries.has(name)) this.entries.set(name, []);
    this.entries.get(name).push({ value, selector, at, file, line });
  }
  get(name) {
    const list = this.entries.get(name);
    if (!list || !list.length) return undefined;
    const root = list.filter((e) => /^(:root|html)$/i.test(e.selector) && e.at.length === 0);
    return (root.length ? root[root.length - 1] : list[list.length - 1]).value;
  }
  has(name) { return this.entries.has(name); }
  hasRoot(name) { return (this.entries.get(name) || []).some((e) => /^(:root|html)$/i.test(e.selector) && e.at.length === 0); }
  /** Every distinct value the property is given anywhere in the source, the primary one first. */
  all(name) {
    const list = this.entries.get(name);
    if (!list || !list.length) return [];
    const first = this.get(name);
    return [first, ...new Set(list.map((e) => e.value))].filter((v, i, a) => a.indexOf(v) === i);
  }
}

/**
 * Resolve var() against EVERY definition of each variable (local, @media and :root alike).
 * Returns alternatives [{ text, chain, unresolved }], the primary one first, at most 64.
 * A var() with no definition uses its fallback if it has one, else `protoDefault(name)` (the protocol's published value).
 */
export function resolveAll(text, vars, protoDefault, depth = 0, seen = []) {
  const m = /var\(/i.exec(text);
  if (!m) return [{ text: depth === 0 && !seen.length ? collapse(text) : text, chain: [], unresolved: [] }];
  const open = m.index + 3;
  const close = matchParen(text, open);
  if (close < 0) return [{ text: text, chain: [], unresolved: [] }];
  const args = splitArgs(text.slice(open + 1, close));
  const name = args[0];
  const prefix = text.slice(0, m.index);
  const tails = resolveAll(text.slice(close + 1), vars, protoDefault, depth + 1, seen);
  const sources = [];
  const defs = depth > 20 || seen.includes(name) ? [] : vars.all(name);
  for (const d of defs) sources.push(d);
  const pd = protoDefault?.(name);
  if (defs.length && pd !== undefined && !vars.hasRoot(name)) sources.push(pd);
  if (!defs.length) {
    if (args.length > 1) sources.push(args.slice(1).join(','));
    else if (pd !== undefined) sources.push(pd);
  }
  let heads;
  if (!sources.length) heads = [{ text: text.slice(m.index, close + 1), chain: [name], unresolved: [name] }];
  else {
    heads = [];
    for (const v of sources) for (const h of resolveAll(v, vars, protoDefault, depth + 1, [...seen, name])) heads.push({ text: h.text, chain: [name, ...h.chain], unresolved: h.unresolved });
  }
  const out = []; const seenKey = new Set();
  for (const h of heads) for (const t of tails) {
    const text2 = depth === 0 && !seen.length ? collapse(prefix + h.text + t.text) : prefix + h.text + t.text;
    const key = text2 + '|' + h.unresolved.join() + t.unresolved.join();
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    out.push({ text: text2, chain: [...h.chain, ...t.chain], unresolved: [...h.unresolved, ...t.unresolved] });
    if (out.length >= 64) return out;
  }
  return out;
}

/**
 * Resolve every var() in `text`.
 * Returns { text, chain: [var names followed], unresolved: [names] }.
 */
export function resolveVars(text, vars, depth = 0, seen = []) {
  const chain = []; const unresolved = [];
  let out = ''; let i = 0;
  while (i < text.length) {
    const m = /var\(/ig; m.lastIndex = i;
    const f = m.exec(text);
    if (!f) { out += text.slice(i); break; }
    out += text.slice(i, f.index);
    const open = f.index + 3;
    const close = matchParen(text, open);
    if (close < 0) { out += text.slice(f.index); break; }
    const args = splitArgs(text.slice(open + 1, close));
    const name = args[0];
    chain.push(name);
    let val = vars.get(name);
    if (val === undefined || seen.includes(name) || depth > 20) {
      if (args.length > 1) val = args.slice(1).join(',');
      else { unresolved.push(name); out += text.slice(f.index, close + 1); i = close + 1; continue; }
      const inner = resolveVars(val, vars, depth + 1, seen);
      chain.push(...inner.chain); unresolved.push(...inner.unresolved);
      out += inner.text;
    } else {
      const inner = resolveVars(val, vars, depth + 1, [...seen, name]);
      chain.push(...inner.chain); unresolved.push(...inner.unresolved);
      out += inner.text;
    }
    i = close + 1;
  }
  return { text: collapse(out), chain, unresolved };
}

const ABS_PX = { px: 1, pt: 96 / 72, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, q: 96 / 101.6 };
const INTRINSIC_UNITS = /^(%|fr|ch|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|svi|svb|lvi|lvb|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax)$/i;
const RELATIVE_UNITS = /^(em|ex|cap|ic|lh|rlh|rex|rcap|ric)$/i;
const BORDER_KEYWORDS = { thin: 1, medium: 3, thick: 5 };
const INTRINSIC_WORDS = new Set(['auto', 'min-content', 'max-content', 'fit-content', 'stretch', 'none', 'inherit', 'initial', 'unset', 'revert', 'revert-layer', 'normal', '-webkit-fill-available', '-moz-available', 'contain', 'cover', 'infinity', 'currentcolor', 'transparent']);

const NUM = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i;

/**
 * Classify one value token. Kinds:
 * zero | length (px) | intrinsic | relative | calc | minmax | keyword | unknown
 */
export function classifyToken(tok) {
  const t = tok.trim();
  const low = t.toLowerCase();
  const m = NUM.exec(t);
  if (m) {
    const n = parseFloat(m[1]); const unit = m[2].toLowerCase();
    if (unit === '' ) return n === 0 ? { kind: 'zero', px: 0 } : { kind: 'unknown', n };
    if (unit === 'rem') return n === 0 ? { kind: 'zero', px: 0 } : { kind: 'length', px: n * 16, unit, n };
    if (unit in ABS_PX) return n === 0 ? { kind: 'zero', px: 0 } : { kind: 'length', px: n * ABS_PX[unit], unit, n };
    if (INTRINSIC_UNITS.test(unit)) return { kind: 'intrinsic', unit, n };
    if (RELATIVE_UNITS.test(unit)) return { kind: 'relative', unit, n };
    return { kind: 'unknown' };
  }
  if (low in BORDER_KEYWORDS) return { kind: 'length', px: BORDER_KEYWORDS[low], unit: 'keyword' };
  if (INTRINSIC_WORDS.has(low)) return { kind: 'intrinsic' };
  if (/^(fit-content|env|attr|anchor|anchor-size|stretch)\(/i.test(t)) return { kind: 'intrinsic' };
  if (/^calc\(/i.test(t) && matchParen(t, 4) === t.length - 1) return { kind: 'calc' };
  if (/^(-webkit-|-moz-)?calc\(/i.test(t)) return { kind: 'calc' };
  if (/^(min|max|clamp)\(/i.test(t) && matchParen(t, t.indexOf('(')) === t.length - 1) return { kind: 'minmax' };
  if (/^var\(/i.test(t)) return { kind: 'var' };
  return { kind: 'unknown' };
}

/** Convert a classified length to px, or null. */
export const toPx = (tok) => { const c = classifyToken(tok); return c.kind === 'zero' ? 0 : c.kind === 'length' ? c.px : null; };

// ---- Property tables -------------------------------------------------------------------------

const SIDES = ['top', 'right', 'bottom', 'left'];
const LAYOUT_BASES = ['margin', 'padding'];

/** Properties that are layout lengths, with how many longhands a written value list covers. */
const LAYOUT_SHORTHAND4 = new Set(['margin', 'padding', 'inset', 'scroll-margin-NOT']); // 1-4 values
const LAYOUT_SHORTHAND2 = new Set([
  'margin-inline', 'margin-block', 'padding-inline', 'padding-block', 'inset-inline', 'inset-block',
  'gap', 'grid-gap'
]);
const LAYOUT_SINGLE = new Set([
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline-start', 'margin-inline-end', 'margin-block-start', 'margin-block-end',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline-start', 'padding-inline-end', 'padding-block-start', 'padding-block-end',
  'top', 'right', 'bottom', 'left',
  'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end',
  'row-gap', 'column-gap', 'grid-row-gap', 'grid-column-gap',
  'width', 'height', 'inline-size', 'block-size',
  'min-width', 'min-height', 'min-inline-size', 'min-block-size',
  'max-width', 'max-height', 'max-inline-size', 'max-block-size'
]);

const RADIUS_SINGLE = new Set([
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-start-start-radius', 'border-start-end-radius', 'border-end-start-radius', 'border-end-end-radius'
]);
const BORDER_WIDTH_SINGLE = new Set([
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-inline-start-width', 'border-inline-end-width', 'border-block-start-width', 'border-block-end-width',
  'outline-width', 'outline-offset'
]);

/** Fan a box shorthand's n written values out to longhand multiplicities [m0, m1, ...]. */
function boxMultiplicity(n, sides) {
  if (sides === 4) {
    if (n === 1) return [4];
    if (n === 2) return [2, 2];
    if (n === 3) return [1, 2, 1];
    return [1, 1, 1, 1];
  }
  if (n === 1) return [2];
  return [1, 1];
}

/**
 * Describe how a declaration's property is checked.
 * Returns null when the property is not tested in version 1.0 (FP-CONF-08), else
 * { family: 'layout' | 'radius' | 'border-width', prop }.
 */
export function propertyFamily(prop) {
  const p = prop.toLowerCase();
  if (LAYOUT_SINGLE.has(p) || LAYOUT_SHORTHAND4.has(p) || LAYOUT_SHORTHAND2.has(p)) return 'layout';
  if (p === 'border-radius' || RADIUS_SINGLE.has(p)) return 'radius';
  if (p === 'border-width' || p === 'border-block-width' || p === 'border-inline-width' || BORDER_WIDTH_SINGLE.has(p) || p === 'border' || /^border-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end)$/.test(p) || p === 'outline') return 'border-width';
  return null;
}

/** The fixed set a fine-detail property is tested against. */
export function fineKind(prop) {
  const p = prop.toLowerCase();
  if (p === 'border-radius' || RADIUS_SINGLE.has(p)) return 'radius';
  if (p === 'outline-offset') return 'offset';
  return 'stroke';
}

/**
 * Expand a declaration into written value atoms.
 * `tokens` are the written (unresolved) value tokens. Returns [{ index, mult }] where index points to
 * the written token and `mult` is how many longhands it covers; tokens that carry no length (keywords
 * in a border shorthand, the `/` of a radius) are omitted.
 */
export function expandAtoms(prop, tokens, classifyFn = classifyToken) {
  const p = prop.toLowerCase();
  const fam = propertyFamily(p);
  if (!fam) return [];
  const idx = tokens.map((_, i) => i);
  if (fam === 'layout') {
    if (LAYOUT_SINGLE.has(p)) return idx.length ? [{ index: 0, mult: 1 }] : [];
    const sides = LAYOUT_SHORTHAND4.has(p) ? 4 : 2;
    const n = Math.min(idx.length, sides);
    const mult = boxMultiplicity(n, sides);
    return idx.slice(0, n).map((i) => ({ index: i, mult: mult[i] }));
  }
  if (fam === 'radius') {
    if (RADIUS_SINGLE.has(p)) return tokens.length ? tokens.slice(0, 2).map((_, i) => ({ index: i, mult: i === 0 ? 1 : 0 })) : [];
    const slash = tokens.indexOf('/');
    const h = slash < 0 ? idx : idx.slice(0, slash);
    const v = slash < 0 ? [] : idx.slice(slash + 1);
    const hm = boxMultiplicity(Math.min(h.length, 4), 4);
    const atoms = h.slice(0, 4).map((i, k) => ({ index: i, mult: hm[k] }));
    for (const i of v.slice(0, 4)) atoms.push({ index: i, mult: 0 });
    return atoms;
  }
  // border-width family
  if (p === 'border-width' || p === 'border-block-width' || p === 'border-inline-width') {
    const sides = p === 'border-width' ? 4 : 2;
    const n = Math.min(idx.length, sides);
    const mult = boxMultiplicity(n, sides);
    return idx.slice(0, n).map((i) => ({ index: i, mult: mult[i] }));
  }
  if (BORDER_WIDTH_SINGLE.has(p)) return tokens.length ? [{ index: 0, mult: 1 }] : [];
  // border / border-* / outline: the first token that is a width (length or thin|medium|thick)
  const total = p === 'border' ? 4 : (p === 'outline' || /^border-(top|right|bottom|left)$/.test(p)) ? 1 : 2;
  for (const i of idx) {
    const c = classifyFn(tokens[i]);
    if (c.kind === 'length' || c.kind === 'zero') return [{ index: i, mult: total }];
    if (c.kind === 'var') return [{ index: i, mult: total, maybe: true }];
  }
  return [];
}

export const CONTAINER_BOX = /^100(?:[dsl]?(?:vw|vh|vi|vb|vmin|vmax)|cq(?:w|h|i|b|min|max)|%)$/i;
export const CONTAINER_TOKEN = /^var\(\s*--fp-container-(610|987|1597)\s*\)$/;
