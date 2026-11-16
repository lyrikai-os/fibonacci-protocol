#!/usr/bin/env node
// Lyrikai: Fibonacci Protocol for UI/UX Design Agents - https://www.lyrikai.com (MIT License)
//
// Reads the DTCG 2025.10 token master (tokens/fp.tokens.json) and writes:
//   fp.css, _fp.scss, fp.tailwind.cjs, design-system-tokens.json
// No dependencies. Node 20 or later.
//
//   node tools/build-tokens/build.mjs [--unit 1|4|8] [--all] [--tokens FILE] [--out DIR]
//
// --unit 4 or 8 writes a grid-locked profile (FP-MATH-06). Only layout lengths scale
// with u (FP-MATH-07): the space ladder and the ladder targets. Hairlines, strokes,
// radius, focus, containers and type stay as they are.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
export const HOMEPAGE = 'https://www.lyrikai.com';
export const EXT_KEY = 'com.lyrikai.fp';
export const UNITS = [1, 4, 8];
const REM_BASE = 16;
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

// ---------------------------------------------------------------- loading

export function loadMaster(file = path.join(ROOT, 'tokens', 'fp.tokens.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Walk the master into a flat list. $type is inherited from the nearest group. */
export function flatten(doc) {
  const out = [];
  const walk = (node, trail, inherited) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if (child === null || typeof child !== 'object' || Array.isArray(child)) continue;
      const p = [...trail, key];
      if ('$value' in child) {
        out.push({
          path: p,
          id: p.join('.'),
          type: child.$type ?? inherited,
          raw: child.$value,
          description: child.$description ?? '',
          ext: child.$extensions?.[EXT_KEY] ?? {},
        });
      } else {
        walk(child, p, child.$type ?? inherited);
      }
    }
  };
  walk(doc, [], doc.$type);
  return out;
}

const isAlias = (v) => typeof v === 'string' && /^\{[^{}]+\}$/.test(v);

/** Resolve aliases ("{group.token}") to the value they point at. Cycles are errors. */
export function resolve(tokens) {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const done = new Map();
  const get = (t, chain = []) => {
    if (done.has(t.id)) return done.get(t.id);
    if (!isAlias(t.raw)) {
      done.set(t.id, t.raw);
      return t.raw;
    }
    const target = t.raw.slice(1, -1);
    if (chain.includes(t.id)) throw new Error(`alias cycle: ${[...chain, t.id].join(' -> ')}`);
    const next = byId.get(target);
    if (!next) throw new Error(`alias ${t.raw} in ${t.id} points at no token`);
    const v = get(next, [...chain, t.id]);
    done.set(t.id, v);
    return v;
  };
  return tokens.map((t) => ({ ...t, alias: isAlias(t.raw) ? t.raw.slice(1, -1) : null, value: structuredClone(get(t)) }));
}

// ------------------------------------------------------------- validation

/** Returns a list of error strings; empty when the master is valid. */
export function validate(doc) {
  const errors = [];
  const root = doc.$extensions?.[EXT_KEY];
  if (!root) errors.push('root: missing $extensions["com.lyrikai.fp"] (FP-TOKEN-07)');
  else {
    if (root.homepage !== HOMEPAGE) errors.push(`root: homepage must be ${HOMEPAGE}`);
    if (typeof root.spec !== 'string' || !root.spec) errors.push('root: spec version missing');
    if (typeof root.unit !== 'number') errors.push('root: unit missing');
  }
  for (const k of Object.keys(doc)) {
    if (!k.startsWith('$')) {
      const g = doc[k];
      if (typeof g !== 'object' || g === null) errors.push(`root: bare key "${k}" is not a group (FP-TOKEN-07)`);
    }
  }
  const checkName = (n, where) => {
    if (n.startsWith('$') || /[{}.]/.test(n)) errors.push(`${where}: bad name "${n}" (FP-TOKEN-03)`);
  };
  const walk = (node, trail, inherited) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      checkName(key, trail.join('.') || 'root');
      const id = [...trail, key].join('.');
      if (child && typeof child === 'object' && '$value' in child) {
        const type = child.$type ?? inherited;
        if (!type) errors.push(`${id}: no $type (set or inherited)`);
        const v = child.$value;
        if (isAlias(v)) {
          /* checked by resolve() */
        } else if (type === 'dimension') {
          if (!(v && typeof v === 'object' && typeof v.value === 'number' && ['px', 'rem'].includes(v.unit)))
            errors.push(`${id}: dimension must be {value:number, unit:"px"|"rem"} (FP-TOKEN-02)`);
        } else if (type === 'duration') {
          if (!(v && typeof v === 'object' && typeof v.value === 'number' && ['ms', 's'].includes(v.unit)))
            errors.push(`${id}: duration must be {value:number, unit:"ms"|"s"} (FP-TOKEN-02)`);
        } else if (type === 'cubicBezier') {
          if (!(Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number') && v[0] >= 0 && v[0] <= 1 && v[2] >= 0 && v[2] <= 1))
            errors.push(`${id}: cubicBezier must be four numbers with x in [0,1]`);
        } else if (type === 'number') {
          if (typeof v !== 'number') errors.push(`${id}: number must be a JSON number`);
        } else if (type === 'color') {
          if (!(v && typeof v === 'object' && typeof v.colorSpace === 'string' && Array.isArray(v.components)))
            errors.push(`${id}: color must have colorSpace and components (FP-TOKEN-02)`);
        } else if (type) {
          errors.push(`${id}: unsupported $type "${type}"`);
        }
        const ext = child.$extensions?.[EXT_KEY];
        if (!ext || typeof ext.rule !== 'string' || !/^FP-[A-Z0-9]+-\d+$/.test(ext.rule))
          errors.push(`${id}: $extensions["com.lyrikai.fp"].rule missing (FP-TOKEN-06)`);
      } else if (child && typeof child === 'object' && !Array.isArray(child)) {
        walk(child, [...trail, key], child.$type ?? inherited);
      } else {
        errors.push(`${[...trail, key].join('.')}: not a token or group`);
      }
    }
  };
  walk(doc, [], doc.$type);
  try {
    resolve(flatten(doc));
  } catch (e) {
    errors.push(String(e.message));
  }
  return errors;
}

// ---------------------------------------------------------------- profiles

const SCALED_SPACE_GROUP = 'space';

/**
 * Apply a grid-locked unit. The master is at u = 1. Space scales by u; the ladder
 * targets become the smallest rung F x u at or above the target floor. Nothing else
 * changes (FP-MATH-07). A pinned floor is never lowered (FP-TOKEN-06).
 */
export function applyUnit(tokens, u) {
  if (!UNITS.includes(u)) throw new Error(`unit must be one of ${UNITS.join(', ')} (FP-MATH-06)`);
  if (u === 1) return tokens.map((t) => ({ ...t }));
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
  const byId = new Map(tokens.map((t) => [t.id, t]));
  return tokens.map((t) => {
    const next = { ...t, value: structuredClone(t.value) };
    if (t.path[0] === SCALED_SPACE_GROUP) next.value.value = t.value.value * u;
    if (t.path[0] === 'target' && (t.path[1] === 'coarse' || t.path[1] === 'fine')) {
      const floor = byId.get(`target.floor-${t.path[1]}`).value.value;
      const rung = fib.map((f) => f * u).find((r) => r >= floor);
      next.value.value = rung;
      if (t.ext.pinnedFloor && rung < floor) throw new Error(`${t.id}: pinned floor would be lowered`);
    }
    return next;
  });
}

/** Master -> resolved, unit-applied token list. */
export function prepare(doc, u = 1) {
  const errors = validate(doc);
  if (errors.length) throw new Error('invalid master:\n' + errors.join('\n'));
  if (doc.$extensions[EXT_KEY].unit !== 1) throw new Error('master must be at u = 1');
  return applyUnit(resolve(flatten(doc)), u);
}

// ----------------------------------------------------------------- values

const num = (n) => String(Number(n.toFixed(12)));
const isType = (t) => t.path[0] === 'type';

/** CSS text of a token value. Type sizes are rem (FP-TOKEN-09); other px stay px. */
export function cssValue(t) {
  const v = t.value;
  switch (t.type) {
    case 'dimension':
      if (v.unit === 'px' && isType(t)) return `${num(v.value / REM_BASE)}rem`;
      return `${num(v.value)}${v.unit}`;
    case 'duration':
      return `${num(v.value)}${v.unit}`;
    case 'cubicBezier':
      return `cubic-bezier(${v.map(num).join(', ')})`;
    case 'number':
      return num(v);
    default:
      throw new Error(`cannot write ${t.id} of type ${t.type}`);
  }
}

/** Token name without the --fp- prefix: the path joined by hyphens. */
export const slug = (t) => t.path.join('-');

function banner(prefix, u) {
  return [
    `${prefix} Lyrikai: Fibonacci Protocol for UI/UX Design Agents`,
    `${prefix} ${HOMEPAGE} - MIT License`,
    `${prefix} Generated by tools/build-tokens/build.mjs from tokens/fp.tokens.json. Do not edit.`,
    `${prefix} u = ${u}`,
  ];
}

// ---------------------------------------------------------------- outputs

export function buildCss(tokens, { u = 1 } = {}) {
  const head = ['/*', ...banner(' *', u), ' */'];
  const lines = [...head, ':root {'];
  let last = '';
  for (const t of tokens) {
    if (t.path[0] === 'target' && t.path[1] === 'fine') continue; // inside the pointer query only (FP-PLAT-03)
    if (t.path[0] !== last) {
      if (last) lines.push('');
      last = t.path[0];
    }
    if (t.id === 'target.coarse') lines.push(`  --fp-target: ${cssValue(t)};`);
    lines.push(`  --fp-${slug(t)}: ${cssValue(t)};`);
  }
  lines.push('}', '');
  const fine = tokens.find((t) => t.id === 'target.fine');
  lines.push('@media (pointer: fine) and (not (any-pointer: coarse)) {', '  :root {', `    --fp-target: ${cssValue(fine)};`, '  }', '}', '');
  return lines.join('\n');
}

export function buildScss(tokens, { u = 1 } = {}) {
  const lines = [...banner('//', u), ''];
  for (const t of tokens) lines.push(`$fp-${slug(t)}: ${cssValue(t)};`);
  lines.push('', '$fp-tokens: (');
  tokens.forEach((t, i) => lines.push(`  "${slug(t)}": $fp-${slug(t)}${i === tokens.length - 1 ? '' : ','}`));
  lines.push(');', '');
  return lines.join('\n');
}

export const LEADING_FOR_STEP = { n1: 'small', 0: 'body', 1: 'heading', 2: 'heading', 3: 'heading', 4: 'display', 5: 'display', 6: 'display', 7: 'display', 8: 'display', micro: 'small' };

export function buildTailwind(tokens, { u = 1 } = {}) {
  const group = (g, fn) => Object.fromEntries(tokens.filter((t) => t.path[0] === g).map((t) => [t.path.slice(1).join('-'), fn(t)]));
  const lead = Object.fromEntries(tokens.filter((t) => t.path[0] === 'leading').map((t) => [t.path[1], num(t.value)]));
  const preset = {
    theme: {
      spacing: { 0: '0px', ...group('space', cssValue) },
      borderRadius: group('radius', cssValue),
      fontSize: group('type', (t) => [cssValue(t), { lineHeight: lead[LEADING_FOR_STEP[t.path[1]]] }]),
      transitionDuration: group('duration', cssValue),
      extend: {
        zIndex: group('layer', (t) => String(t.value)),
        maxWidth: group('container', cssValue),
        transitionTimingFunction: group('easing', cssValue),
      },
    },
  };
  const head = banner('//', u);
  return `${head.join('\n')}\n'use strict';\n\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`;
}

const FAMILY_ORDER = ['color', 'type', 'spacing', 'radius', 'container', 'line', 'focus', 'target', 'leading', 'duration', 'easing', 'layer', 'tone', 'math', 'split'];
const GROUP_FAMILY = { space: 'spacing' };

const USAGE_FALLBACK = (t) => t.description || `Protocol token ${t.id}.`;

export function buildList(tokens, { u = 1, version = '1.0.0' } = {}) {
  const fams = {};
  for (const t of tokens) {
    if (isType(t)) continue;
    const fam = GROUP_FAMILY[t.path[0]] ?? t.path[0];
    (fams[fam] ??= []).push({ name: slug(t), value: cssValue(t), usage: USAGE_FALLBACK(t) });
  }
  const leadVal = Object.fromEntries(tokens.filter((t) => t.path[0] === 'leading').map((t) => [t.path[1], t.value]));
  const style = (t, name, lead) => ({ name, fontSize: cssValue(t), lineHeight: leadVal[lead ?? LEADING_FOR_STEP[t.path[1]]], fontWeight: 400 });
  const typeTok = Object.fromEntries(tokens.filter(isType).map((t) => [t.path[1], t]));
  const st = (k, lead) => style(typeTok[k], `type-${k}${lead ? '-dense' : ''}`, lead);
  const out = {
    name: 'Lyrikai Fibonacci Protocol',
    version,
    color: { themes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }], tokens: [] },
    type: {
      fonts: [],
      families: { default: 'inherit' },
      groups: [
        { name: 'Interface', family: 'default', styles: [st('n1'), st('0'), st('0', 'dense'), st('1'), st('2'), st('3'), st('4')] },
        { name: 'Display', family: 'default', styles: [st('4'), st('6'), st('8')].map((s) => ({ ...s, name: s.name + '-display' })) },
        { name: 'Metadata', family: 'default', styles: [st('micro')] },
      ],
    },
  };
  for (const f of FAMILY_ORDER) if (fams[f]) out[f] = { tokens: fams[f] };
  return out;
}

/** Everything one profile writes, as {relative file: text}. */
export function buildAll(doc, { u = 1, version } = {}) {
  const tokens = prepare(doc, u);
  const spec = doc.$extensions[EXT_KEY].spec;
  const opts = { u, spec, version: version ?? spec };
  return {
    'fp.css': buildCss(tokens, opts),
    '_fp.scss': buildScss(tokens, opts),
    'fp.tailwind.cjs': buildTailwind(tokens, opts),
    'design-system-tokens.json': JSON.stringify(buildList(tokens, opts), null, 2) + '\n',
  };
}

// -------------------------------------------------------------------- CLI

function main(argv) {
  const args = { unit: 1, all: false, tokens: path.join(ROOT, 'tokens', 'fp.tokens.json'), out: path.join(ROOT, 'dist') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--unit') args.unit = Number(argv[++i]);
    else if (a === '--all') args.all = true;
    else if (a === '--tokens') args.tokens = path.resolve(argv[++i]);
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('usage: build.mjs [--unit 1|4|8] [--all] [--tokens FILE] [--out DIR]\n' + HOMEPAGE);
      return 0;
    } else throw new Error(`unknown argument ${a}`);
  }
  const doc = loadMaster(args.tokens);
  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const units = args.all ? UNITS : [args.unit];
  for (const u of units) {
    const dir = u === 1 ? args.out : path.join(args.out, `u${u}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const [file, text] of Object.entries(buildAll(doc, { u, version }))) {
      fs.writeFileSync(path.join(dir, file), text);
      console.log(path.relative(process.cwd(), path.join(dir, file)));
    }
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`build-tokens: ${e.message}`);
    process.exitCode = 1;
  }
}
