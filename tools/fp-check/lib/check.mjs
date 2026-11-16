// The checker: reads fp.config.json and the source, runs the machine tests, returns a report object.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lineAt, collapse, posix, PHI, ladder, isRung, CONTAINERS, FIB, RADIUS_SET, FIXED_DETAIL_SET, roundHalfUp } from './util.mjs';
import { walk, expandGlobs, matchesAny, globToRegExp } from './glob.mjs';
import { validate } from './schema.mjs';
import { parseCss, extractStyleBlocks, splitSelectors } from './css.mjs';
import { splitValue, splitArgs, matchParen, VarTable, resolveVars, resolveAll, classifyToken, expandAtoms, propertyFamily, fineKind, CONTAINER_BOX, CONTAINER_TOKEN } from './values.mjs';
import { parseColor, testPair } from './contrast.mjs';
import { findStep, stepSize, allowedLeading, sameRatio, MICRO_PX } from './type.mjs';
import { flatten, resolveAlias, dimensionPx, checkTokenDoc } from './dtcg.mjs';
import { EXEMPT_ROLES, ladderTarget, mapLength, mapTarget, findMerges, findOrderBreaches, driftPct } from './snap.mjs';
import { applicability, rollup } from './rules.mjs';

export class UsageError extends Error {}

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_VERSION = '0.1.0';

export function loadSpec(specDir) {
  const candidates = [specDir, process.env.FP_SPEC_DIR, path.resolve(HERE, '../../../spec'), path.resolve(HERE, '../spec')].filter(Boolean);
  for (const d of candidates) {
    const rp = path.join(d, 'rules.json'); const sp = path.join(d, 'fp.config.schema.json');
    if (fs.existsSync(rp) && fs.existsSync(sp)) {
      const ep = path.join(d, 'fp-evidence.schema.json');
      return { dir: d, rules: JSON.parse(fs.readFileSync(rp, 'utf8')), schema: JSON.parse(fs.readFileSync(sp, 'utf8')), evidenceSchema: fs.existsSync(ep) ? JSON.parse(fs.readFileSync(ep, 'utf8')) : null };
    }
  }
  throw new UsageError('cannot find the specification (rules.json and fp.config.schema.json); pass --spec <dir> or set FP_SPEC_DIR');
}

const CODE_EXT = /\.(jsx?|tsx?|mjs|cjs|scss|sass|less|styl|stylus|vue|svelte|astro|pcss|postcss)$/i;
const RESULT_ORDER = ['fail', 'not-run', 'pending', 'exception', 'pass'];
const worst = (a, b) => (RESULT_ORDER.indexOf(a) <= RESULT_ORDER.indexOf(b) ? a : b);
const SELECT_INTERACTIVE = /(^|[\s>+~,(])(button|a|input|select|textarea|summary)(?![\w-])|\[role=["']?button["']?\]|:focus(?![\w-])|:focus-visible|:hover/i;
const INTERACTIVE_ELEMENT = /(^|[\s>+~,(])(button|a|input|select|textarea)(?![\w-])|\[role=["']?(button|link|checkbox|menuitem|tab|switch|option|radio)["']?\]/i;
const modeName = (m) => ({ overlay: 'Overlay', snap: 'Snap', native: 'Native' })[m] ?? m;
const pct = (n) => (Number.isInteger(n) ? String(n) : String(roundHalfUp(n, 3)));

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new UsageError(`cannot read ${file}: ${e.message}`); }
}

/** Normalise a value for exception comparison. */
function normValue(v) { return String(v).replace(/\s+/g, '').toLowerCase(); }
function valuesEqual(a, b) {
  if (a === undefined || b === undefined || a === null || b === null) return false;
  if (normValue(a) === normValue(b)) return true;
  const ca = classifyToken(String(a).trim()); const cb = classifyToken(String(b).trim());
  const pa = ca.kind === 'zero' ? 0 : ca.kind === 'length' ? ca.px : null;
  const pb = cb.kind === 'zero' ? 0 : cb.kind === 'length' ? cb.px : null;
  return pa !== null && pb !== null && Math.abs(pa - pb) < 1e-9;
}

class Exceptions {
  constructor(list) { this.list = list || []; this.used = new Set(); }
  /** ctx: { values: [..], selector, tokens: [..], file, line, reason?, rules? } -> the matching exception or null.
   *  An exception matches by value, by `where` (a selector, a token address, or file:line) and by the rule it departs from. */
  find(ctx) {
    let pick = null;
    this.list.forEach((e, i) => {
      if (ctx.reason && e.reason !== ctx.reason) return;
      if (ctx.rules && !ctx.rules.includes(e.rule)) return;
      if (!ctx.values.some((v) => valuesEqual(e.value, v))) return;
      if (!this.whereMatches(e.where, ctx)) return;
      this.used.add(i);
      if (e.status === 'accepted') pick = pick && pick.status === 'accepted' ? pick : e;
      else if (!pick) pick = e;
    });
    return pick;
  }
  whereMatches(where, ctx) {
    const w = collapse(where);
    const sels = [collapse(ctx.selector || ''), ...splitSelectors(ctx.selector || '').map(collapse)];
    if (sels.includes(w)) return true;
    if (ctx.tokens?.includes(w)) return true; // a token address covers every use of that token
    const m = /^(.*):(\d+)$/.exec(w);
    return Boolean(m && ctx.file && (ctx.file === m[1] || ctx.file.endsWith('/' + m[1])) && Number(m[2]) === ctx.line);
  }
}

function compileRoles(roles) {
  return (roles || []).map((r) => ({ re: new RegExp('^' + r.match.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), role: r.role, match: r.match }));
}

export function runCheck({ dir, configPath, specDir } = {}) {
  dir = path.resolve(dir || '.');
  const spec = loadSpec(specDir);
  const SPEC_VERSION = spec.rules.version;
  const cfgFile = path.resolve(configPath ? (path.isAbsolute(configPath) ? configPath : path.resolve(configPath)) : path.join(dir, 'fp.config.json'));
  if (!fs.existsSync(cfgFile)) throw new UsageError(`fp.config.json not found at ${cfgFile} (FP-MODE-01)`);
  const config = readJson(cfgFile);

  const report = {
    tool: 'fp-check', toolVersion: TOOL_VERSION, spec: SPEC_VERSION, dir, config: posix(path.relative(dir, cfgFile)).startsWith('..') ? posix(cfgFile) : posix(path.relative(dir, cfgFile)),
    result: 'pass', claim: null, notes: [], findings: [],
  };
  const checkRes = new Map(); // check -> { result, count }
  const note = (m) => report.notes.push(m);
  const mark = (check, result, msg) => {
    const cur = checkRes.get(check) || { result: 'pass', count: 0, messages: [] };
    cur.result = worst(cur.result, result === 'exception' ? 'pass' : result);
    if (result !== 'pass' && result !== 'exception') { cur.count++; if (msg && cur.messages.length < 3) cur.messages.push(msg); }
    checkRes.set(check, cur);
  };

  // ---- FP-MODE-01, FP-MODE-02: configuration ----------------------------------------------------
  mark('mode.config-present', 'pass');
  const schemaErrors = validate(spec.schema, config);
  const versionMismatch = typeof config.fp === 'string' && config.fp !== SPEC_VERSION;
  if (schemaErrors.length || versionMismatch) {
    const msgs = schemaErrors.map((e) => `${e.path} ${e.message}`);
    if (versionMismatch) msgs.push(`/fp "${config.fp}" does not equal the specification version checked against, "${SPEC_VERSION}" (FP-MODE-02)`);
    mark('mode.config-schema', 'fail', msgs[0]);
    report.configErrors = msgs;
    report.result = 'fail';
    report.mode = config.mode; report.level = config.level; report.unit = config.unit ?? 1; report.platform = config.platform;
    finalizeRules(report, spec, config, checkRes, { invalidConfig: true });
    return report;
  }
  mark('mode.config-schema', 'pass');
  mark('mode.single', 'pass');
  mark('mode.roles', 'pass');

  const u = config.unit ?? 1;
  const mode = config.mode; const level = config.level; const pointer = config.pointer ?? 'both';
  const bodyPx = config.type?.body ?? 16; const align = config.type?.align ?? 'formula';
  Object.assign(report, { mode, level, unit: u, platform: config.platform, pointer });
  mark('math.unit', 'pass'); mark('math.unit-profile', 'pass');
  const sourceGlobs = config.source; const scopeGlobs = config.scope ?? config.source;
  const roles = compileRoles(config.roles);
  const exceptions = new Exceptions(config.exceptions);

  // ---- files --------------------------------------------------------------------------------------
  const all = walk(dir);
  const sourceFiles = expandGlobs(dir, sourceGlobs, all).filter((f) => f !== report.config);
  const scopeSet = new Set(expandGlobs(dir, scopeGlobs, all));
  const snapFiles = mode === 'snap' ? expandGlobs(dir, config.snap?.source ?? [], all) : [];
  const themeFiles = new Set();
  for (const t of config.themes ?? []) for (const f of expandGlobs(dir, t.files ?? [], all)) themeFiles.add(f);
  const toRead = [...new Set([...sourceFiles, ...snapFiles, ...themeFiles])];

  const parsed = new Map(); // file -> { rules, customProps, atRules }
  const jsonDocs = new Map(); // file -> doc
  const unread = [];
  for (const f of toRead) {
    const ext = path.extname(f).toLowerCase();
    const text = () => fs.readFileSync(path.join(dir, f), 'utf8');
    if (ext === '.css') parsed.set(f, parseCss(text(), { file: f }));
    else if (ext === '.html' || ext === '.htm') {
      const merged = { rules: [], customProps: [], atRules: [] };
      const html = text();
      for (const m of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
        (report.inlineStyles ||= []).push({ file: f, line: lineAt(html, m.index), declarations: collapse(m[1] ?? m[2]) });
      }
      for (const b of extractStyleBlocks(html)) {
        const p = parseCss(b.css, { file: f, lineOffset: b.lineOffset });
        merged.rules.push(...p.rules); merged.customProps.push(...p.customProps); merged.atRules.push(...p.atRules);
      }
      parsed.set(f, merged);
    } else if (ext === '.json') {
      try { jsonDocs.set(f, JSON.parse(text())); } catch (e) { note(`${f}: not valid JSON (${e.message}); not read`); unread.push(f); }
    } else if (CODE_EXT.test(f)) {
      unread.push(f);
      note(`${f}: CSS-in-JS or preprocessor source is not read (FP-CONF-08); compile it to CSS first. Its rules are not-run.`);
    }
  }
  const unreadInScope = unread.filter((f) => scopeSet.has(f) || sourceFiles.includes(f));

  // ---- variables and tokens -------------------------------------------------------------------------
  const vars = new VarTable();
  for (const [f, p] of parsed) for (const c of p.customProps) vars.add(c);
  // The protocol's own properties resolve to their published values when the source does not define them
  // and the var() has no fallback (FP-PLAT-02 table).
  const typeRem = (k) => `${stepSize(k, bodyPx, align) / 16}rem`;
  const PROTO_FIXED = { 'line-hairline': '1px', 'line-stroke-2': '2px', 'line-stroke-3': '3px', 'focus-gap': '2px', 'focus-ring': '3px', 'target-floor-coarse': '44px', 'target-floor-fine': '24px',
    'type-micro': '0.6875rem', 'leading-body': '1.618', 'leading-dense': '1.5', 'leading-small': '1.382', 'leading-heading': '1.236', 'leading-display': '1.146',
    'split-major': '1.618fr', 'split-minor': '1fr', 'layer-base': '1', 'layer-raised': '2', 'layer-overlay': '3', 'layer-popover': '13', 'layer-toast': '21',
    'radius-pill': '9999px', 'radius-round': '50%' };
  const protoDefault = (name) => {
    const m = /^--fp-(.+)$/.exec(name);
    if (!m) return undefined;
    const n = m[1];
    if (n in PROTO_FIXED) return PROTO_FIXED[n];
    let x;
    if ((x = /^space-(\d+)$/.exec(n)) && FIB.includes(+x[1])) return `${+x[1] * u}px`;
    if ((x = /^container-(\d+)$/.exec(n)) && CONTAINERS.includes(+x[1])) return `${x[1]}px`;
    if ((x = /^radius-(\d+)$/.exec(n)) && [2, 3, 5, 8, 13, 21].includes(+x[1])) return `${x[1]}px`;
    if ((x = /^duration-(\d+)$/.exec(n)) && [89, 144, 233, 377].includes(+x[1])) return `${x[1]}ms`;
    if (n === 'target') return `${ladderTarget(u, pointer)}px`;
    if (n === 'target-coarse') return `${ladderTarget(u, 'both')}px`;
    if ((x = /^type-(n1|[0-8])$/.exec(n))) return typeRem(x[1] === 'n1' ? -1 : +x[1]);
    return undefined;
  };
  const tokenByPath = new Map(); // DTCG dotted path -> { token, type, file }
  for (const [f, doc] of jsonDocs) for (const l of flatten(doc)) tokenByPath.set(l.path, { ...l, file: f });
  const protocolTokenFiles = [...jsonDocs.keys()].filter((f) => jsonDocs.get(f)?.$extensions?.['com.lyrikai.fp'] || /\.tokens\.json$/.test(f));

  const rolesOf = (names) => { const s = new Set(); for (const n of names) for (const r of roles) if (r.re.test(n)) s.add(r.role); return s; };
  const hide = { get: (n) => (/^--fp-container-(610|987|1597)$/.test(n) ? undefined : vars.get(n)), has: (n) => vars.has(n) };

  // ---- declaration pass -----------------------------------------------------------------------------
  const counts = { inScope: 0, inSource: 0 };
  const radiusTokensUsed = new Set();
  const literalDecls = []; // for snap: literal lengths in scope
  const hasSeen = { motion: [], controls: [] };
  const ladderRungs = ladder(u);
  let anyChecked = false;

  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(roundHalfUp(n, 4)));

  function rungTest(px) {
    const v = Math.abs(px);
    if (Math.abs(v - Math.round(v)) > 1e-6) return { status: 'fail', message: `${fmt(px)}px is a fraction of a platform unit`, also: ['math.zero-negative', 'math.rounding'] };
    return ladderRungs.includes(Math.round(v)) ? { status: 'pass' } : { status: 'fail', message: `${fmt(px)} is not a rung at u=${u}` };
  }

  function calcOperands(inner) {
    const toks = []; let cur = ''; let depth = 0;
    const push = () => { if (cur) { toks.push(cur); cur = ''; } };
    for (const c of inner) {
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && /\s/.test(c)) { push(); continue; }
      if (depth === 0 && (c === '*' || c === '/')) { push(); toks.push(c); continue; }
      cur += c;
    }
    push();
    return toks;
  }

  function isContainer(tok) {
    if (CONTAINER_BOX.test(tok)) return true;
    const m = CONTAINER_TOKEN.exec(tok);
    if (!m) return false;
    const def = vars.get(`--fp-container-${m[1]}`);
    if (def === undefined) return true;
    const c = classifyToken(resolveVars(def, vars).text);
    return c.kind === 'length' && Math.abs(c.px - Number(m[1])) < 1e-9;
  }
  function isLadderToken(tok) {
    const r = resolveVars(tok, vars);
    const c = classifyToken(r.text);
    if (c.kind === 'length') return c.px > 0 && Math.abs(c.px - Math.round(c.px)) < 1e-6 && ladderRungs.includes(Math.round(c.px));
    const m = /^var\(\s*--fp-space-(\d+)\s*\)$/.exec(tok);
    return Boolean(m && FIB.includes(Number(m[1])));
  }
  /** FP-SPACE-04: exactly one of the two derived patterns, single operation, no chaining. */
  function derivedTest(writtenTok) {
    const partial = resolveVars(writtenTok, hide).text;
    const m = /^(?:-webkit-|-moz-)?calc\((.*)\)$/is.exec(partial);
    if (!m) return { status: 'fail', message: 'not a derived pattern (FP-SPACE-04)' };
    const t = calcOperands(m[1]);
    if (t.length === 3) {
      const [a, op, b] = t;
      if (op === '*') {
        const factor = (x) => { const n = Number(x); return n === 0.618 || n === 0.382; };
        if ((isContainer(a) && factor(b)) || (isContainer(b) && factor(a))) return { status: 'pass' };
        return { status: 'fail', message: 'a split must be a container times 0.618 or 0.382 (FP-SPACE-04)' };
      }
      if (op === '-') {
        if (!isContainer(a)) return { status: 'fail', message: `"${a}" is not a container: a container is 100%, 100vw, 100vh, 100cqi or a --fp-container-N token (FP-SPACE-04)` };
        if (!isLadderToken(b)) return { status: 'fail', message: `"${b}" is not a ladder token at u=${u} (FP-SPACE-04)` };
        return { status: 'pass' };
      }
    }
    return { status: 'fail', message: 'calc() is not one of the two derived patterns, or it chains operations (FP-SPACE-04)' };
  }

  const relativeNotRun = (text) => ({ status: 'not-run', message: `${text} depends on a font size the checker does not compute` });

  function layoutTest(text, written) {
    const c = classifyToken(text);
    switch (c.kind) {
      case 'length': return rungTest(c.px);
      case 'calc': { const d = derivedTest(written); return d.status === 'fail' ? { ...d, also: ['space.derived'] } : d; }
      case 'relative': return relativeNotRun(text);
      case 'unknown': return c.n !== undefined ? { status: 'fail', message: `${text} is a number without a unit, not a length` } : { status: 'pass' };
      case 'minmax': {
        const inner = text.slice(text.indexOf('(') + 1, text.length - 1);
        let res = { status: 'pass' };
        for (const a of splitArgs(inner)) {
          const ca = classifyToken(a);
          let r = { status: 'pass' };
          if (ca.kind === 'length') r = rungTest(ca.px);
          else if (ca.kind === 'calc') { r = derivedTest(a); if (r.status === 'fail') r.also = ['space.derived']; }
          else if (ca.kind === 'relative') r = relativeNotRun(a);
          if (r.status !== 'pass') { res = r; break; }
        }
        return res;
      }
      default: return { status: 'pass' };
    }
  }

  function fineTest(kind, text) {
    const c = classifyToken(text);
    if (c.kind === 'length') {
      const v = c.px;
      if (Math.abs(v - Math.round(v)) > 1e-6) return { status: 'fail', message: `${fmt(v)}px is a fraction of a platform unit`, also: ['math.zero-negative', 'math.rounding'] };
      if (kind === 'radius') {
        if (RADIUS_SET.includes(v) || v === 9999) return { status: 'pass' };
        return { status: 'fail', message: `${fmt(v)} is not in the radius set 0, 2, 3, 5, 8, 13, 21, pill (9999px) or round (50%)` };
      }
      return FIXED_DETAIL_SET.includes(Math.abs(v)) ? { status: 'pass' } : { status: 'fail', message: `${fmt(v)} is not 0, 1, 2 or 3` };
    }
    if (c.kind === 'calc' || c.kind === 'minmax') {
      if (/^calc\(\s*infinity\b/i.test(text)) return { status: 'pass' };
      return { status: 'fail', message: 'calc() is only accepted in the two derived patterns for layout lengths (FP-CONF-08)' };
    }
    if (c.kind === 'relative') return { status: 'fail', message: `${text} is not a platform unit: ${kind === 'radius' ? 'a radius is a set member, 50% or 9999px' : 'a stroke is 0, 1, 2 or 3'}` };
    if (c.kind === 'unknown' && c.n !== undefined) return { status: 'fail', message: `${text} is a number without a unit, not a length` };
    if (c.kind === 'intrinsic' && kind === 'radius') {
      if (c.unit === '%' && c.n === 50) return { status: 'pass' };
      if (c.unit) return { status: 'fail', message: `${text} is not in the radius set: round is 50% and pill is 9999px` };
    }
    return { status: 'pass' };
  }

  const CHECKS = {
    layout: { check: 'space.on-ladder', rule: 'FP-SPACE-01' },
    radius: { check: 'radius.set', rule: 'FP-RADIUS-01' },
    stroke: { check: 'math.fixed-detail', rule: 'FP-MATH-07' },
    offset: { check: 'math.fixed-detail', rule: 'FP-MATH-07' },
  };

  function addFinding(f) { report.findings.push(f); }

  const snapNames = new Set(); // host token names that Snap maps (filled below, before the declaration pass)
  const snapUses = []; // declarations that use a token Snap maps, checked after the mapping is known (FP-SPACE-01 where used)

  function processDecl(file, rule, decl, inScope) {
    const prop = decl.prop;
    const fam = propertyFamily(prop);
    if (!fam) return;
    const written = splitValue(decl.value);
    // every definition of every variable in the source is tested (local, @media and :root alike)
    const altsByTok = written.map((w) => (/var\(/i.test(w) ? resolveAll(w, vars, protoDefault) : [{ text: w, chain: [], unresolved: [] }]));
    const K = Math.min(64, Math.max(1, ...altsByTok.map((a) => a.length)));
    const key = fam === 'layout' ? 'layout' : fineKind(prop);
    const per = new Map(); // origin -> { status, message, whole, chain, also }
    let counted = 0;
    for (let k = 0; k < K; k++) {
      const flat = [];
      written.forEach((w, i) => {
        const a = altsByTok[i][Math.min(k, altsByTok[i].length - 1)];
        const subs = splitValue(a.text);
        for (const sub of subs.length ? subs : [a.text]) flat.push({ text: sub, origin: i, chain: a.chain, unresolved: a.unresolved, whole: a.text });
      });
      const atoms = expandAtoms(prop, flat.map((f) => f.text));
      for (const atom of atoms) {
        const f = flat[atom.index];
        if (!f) continue;
        let c = classifyToken(f.text);
        if (f.unresolved.length) c = { kind: 'var' };
        if (c.kind === 'var' && atom.maybe) continue;
        if (atom.maybe && c.kind !== 'length' && c.kind !== 'zero') continue;
        const isCountable = c.kind === 'length' || c.kind === 'calc' || (c.kind === 'minmax' && splitArgs(f.text.slice(f.text.indexOf('(') + 1, f.text.length - 1)).some((a) => ['length', 'calc'].includes(classifyToken(a).kind)));
        if (k === 0 && isCountable) counted += atom.mult;
        if (k === 0) for (const n of f.chain) if (fam === 'radius') radiusTokensUsed.add(n);
        if (!inScope) continue;
        let r;
        const rs = rolesOf(f.chain);
        const exempt = [...rs].some((x) => EXEMPT_ROLES.has(x));
        if (c.kind === 'var') r = { status: 'not-run', message: `cannot resolve ${f.unresolved.join(', ')} within the source` };
        else if (exempt) r = { status: 'pass', message: 'exempt by role' };
        else if (rs.has('target') && c.kind === 'length' && c.px >= ladderTarget(u, pointer)) r = { status: 'pass', message: 'target token' };
        else {
          const mappedToken = mode === 'snap' && (key === 'layout' || key === 'radius') && c.kind === 'length' && f.chain.length > 0 && f.chain.every((n) => snapNames.has(n) || n.startsWith('--fp-'));
          // Snap: bare literals (and values through a local property Snap does not map) are listed with their mapping
          if (mode === 'snap' && (key === 'layout' || key === 'radius') && c.kind === 'length' && !mappedToken && k === 0) literalDecls.push({ file, rule, decl, f, key, px: c.px, written: written[f.origin] });
          // a length still off the ladder after Snap fails where it is used; one Snap cannot move is FP-SNAP-10's finding alone
          const cannotSnap = mode === 'snap' && !mappedToken && (key === 'layout' || key === 'radius') && c.kind === 'length' && mapLength(Math.abs(c.px), key === 'radius' ? 'radius' : 'space', u).snapped === null;
          r = cannotSnap ? { status: 'pass' } : key === 'layout' ? layoutTest(f.text, written[f.origin]) : fineTest(key, f.text);
        }
        const cur = per.get(f.origin) || { status: 'pass', also: [], whole: f.whole, chain: f.chain };
        if (RESULT_ORDER.indexOf(r.status) < RESULT_ORDER.indexOf(cur.status)) { cur.status = r.status; cur.message = r.message; cur.whole = f.whole; cur.chain = f.chain; }
        if (r.also) cur.also.push(...r.also);
        per.set(f.origin, cur);
      }
    }
    if (inScope) counts.inScope += counted;
    counts.inSource += counted;
    if (counted > 0) anyChecked = anyChecked || inScope;
    if (!inScope) return;

    const { check, rule: ruleId } = CHECKS[key];
    for (const [origin, r] of per) {
      let result = r.status; let exc = null;
      if (result === 'fail' || result === 'not-run') {
        exc = exceptions.find({ values: [written[origin], r.whole], selector: rule.selector, tokens: r.chain, file, line: decl.line, rules: [ruleId, ...(/^calc|^min|^max|^clamp/i.test(written[origin]) ? ['FP-SPACE-04'] : []), ...(mode === 'snap' ? ['FP-SNAP-03', 'FP-SNAP-10'] : [])] });
        if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      }
      if (result === 'pass') { mark(check, 'pass'); continue; }
      mark(check, result, r.message);
      for (const a of r.also ?? []) mark(a, result, r.message);
      addFinding({ file, selector: rule.selector, property: prop, value: written[origin], resolved: r.whole, check, rule: ruleId, result, line: decl.line, ...(r.message ? { message: r.message } : {}), ...(exc ? { exception: exc.reason } : {}) });
    }
  }

  // FP-2 type, FP-LAYOUT, FP-TYPE-09 --------------------------------------------------------------
  const FONT_KEYWORDS = /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller|math)$/i;
  const KEEP_KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/i;
  const lastItem = (sel) => splitSelectors(sel).map((i) => collapse(i));

  function typeRule(file, rule, inScope) {
    if (!inScope || level !== 'FP-2' || rule.kind !== 'style') return;
    const get = (p) => [...rule.decls].reverse().find((d) => d.prop === p);
    const fsD = get('font-size'); const lhD = get('line-height'); const fontD = get('font');
    const sel = rule.selector;
    const items = lastItem(sel);
    const isRoot = items.length > 0 && items.every((i) => /^(html|:root)$/i.test(i));
    const isBody = items.some((i) => /(^|[\s>+~])body$/i.test(i));
    const useFont = fontD && !/^(inherit|initial|unset|revert|caption|icon|menu|message-box|small-caption|status-bar)$/i.test(fontD.value) && (!fsD || fontD.line > fsD.line);

    // combos: one per definition of each variable involved
    const combos = [];
    let sizeProp = 'font-size'; let sizeWritten = null; let sizeLine = rule.line; let lhProp = 'line-height'; let lhWritten = null; let lhLine = rule.line;
    if (useFont) {
      sizeProp = 'font'; lhProp = 'font'; sizeLine = lhLine = fontD.line; sizeWritten = fontD.value;
      for (const alt of resolveAll(fontD.value, vars, protoDefault)) {
        const toks = splitValue(alt.text);
        const i = toks.findIndex((t) => { const c = classifyToken(t); return c.kind === 'length' || c.kind === 'relative' || (c.kind === 'intrinsic' && c.unit) || FONT_KEYWORDS.test(t); });
        if (i < 0) continue;
        const hasLh = toks[i + 1] === '/' && toks[i + 2] !== undefined;
        combos.push({ size: { text: toks[i], chain: alt.chain, unresolved: alt.unresolved }, lh: hasLh ? { text: toks[i + 2], chain: alt.chain, unresolved: [] } : null, written: toks[i], lhWritten: hasLh ? toks[i + 2] : null });
      }
      lhWritten = combos.some((c) => c.lh) ? fontD.value : null;
    } else {
      if (fsD) { sizeWritten = fsD.value; sizeLine = fsD.line; }
      if (lhD) { lhWritten = lhD.value; lhLine = lhD.line; }
      if (sizeWritten === null) return;
      const sa = resolveAll(sizeWritten, vars, protoDefault);
      const la = lhWritten !== null ? resolveAll(lhWritten, vars, protoDefault) : null;
      const K = Math.min(64, Math.max(sa.length, la ? la.length : 1));
      for (let k = 0; k < K; k++) combos.push({ size: sa[Math.min(k, sa.length - 1)], lh: la ? la[Math.min(k, la.length - 1)] : null, written: sizeWritten, lhWritten });
    }
    if (!combos.length) return;

    const seen = new Set();
    const finding = (p, value, check, ruleId, message, line, resolved, chain) => {
      const key = [p, check, resolved, message].join('|');
      if (seen.has(key)) return; seen.add(key);
      let result = 'fail';
      const exc = exceptions.find({ values: [value, resolved ?? value], selector: sel, tokens: chain ?? [], file, line, rules: [ruleId] });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark(check, result, message);
      addFinding({ file, selector: sel, property: p, value, resolved, check, rule: ruleId, result, message, line });
    };

    let missingLh = false;
    for (const combo of combos) {
      const { size } = combo;
      const w = combo.written;
      if (size.unresolved.length) { finding(sizeProp, w, 'type.scale', 'FP-TYPE-01', `cannot resolve ${size.unresolved.join(', ')}`, sizeLine, size.text, size.chain); const f = report.findings[report.findings.length - 1]; f.result = 'not-run'; mark('type.scale', 'not-run'); continue; }
      const text = size.text;
      if (KEEP_KEYWORDS.test(text)) continue;
      const c = classifyToken(text);

      if (isRoot) {
        // the root font size keeps 1rem at 16px: never px, never a percentage other than 100% (FP-TYPE-04, FP-PLAT-01)
        if (c.kind === 'length' || c.kind === 'relative') finding(sizeProp, w, 'type.units', 'FP-TYPE-04', 'the root font size must not be set in px', sizeLine, text, size.chain);
        else if (c.kind === 'intrinsic' && c.unit === '%' && c.n !== 100) finding(sizeProp, w, 'type.units', 'FP-TYPE-04', 'the root font size is 100% so that 1rem is 16px', sizeLine, text, size.chain);
        continue;
      }

      const isMicro = /^var\(\s*--fp-type-micro\s*\)$/.test(w) || rolesOf(size.chain).has('micro');
      let px = null;
      if (FONT_KEYWORDS.test(text) || c.kind === 'calc' || c.kind === 'minmax' || (c.kind === 'intrinsic') || (c.kind === 'unknown')) {
        finding(sizeProp, w, 'type.scale', 'FP-TYPE-01', `${text} is not a step of the scale: a type size is a fixed rem value`, sizeLine, text, size.chain);
        continue;
      }
      if (c.kind === 'length' || c.kind === 'zero') {
        px = c.px;
        if (c.kind === 'length' && c.unit !== 'rem') finding(sizeProp, w, 'type.units', 'FP-TYPE-04', 'a type size is written in rem', sizeLine, text, size.chain);
        else mark('type.units', 'pass');
      } else if (c.kind === 'relative') finding(sizeProp, w, 'type.units', 'FP-TYPE-04', 'a type size is written in rem', sizeLine, text, size.chain);

      let stepKey = null;
      if (isMicro) {
        if (px !== null && Math.abs(px - MICRO_PX) > 0.005) finding(sizeProp, w, 'type.micro', 'FP-TYPE-05', `micro is ${MICRO_PX}px, found ${fmt(px)}`, sizeLine, text, size.chain);
        else mark('type.micro', 'pass');
        stepKey = 'micro';
      } else if (px !== null) {
        const st = findStep(px, bodyPx, align);
        if (!st) finding(sizeProp, w, 'type.scale', 'FP-TYPE-01', `${fmt(px)} is not a step of the scale`, sizeLine, text, size.chain);
        else if (st.kind === 'odd') finding(sizeProp, w, 'type.step-range', 'FP-TYPE-02', `${fmt(px)} is step ${st.step}: odd steps above 4 are not used`, sizeLine, text, size.chain);
        else if (st.kind === 'replaced') finding(sizeProp, w, 'type.align', 'FP-TYPE-03', `${fmt(px)} is replaced by ${stepSize(st.step, bodyPx, 'fibonacci')} under type.align fibonacci`, sizeLine, text, size.chain);
        else { mark('type.scale', 'pass'); mark('type.step-range', 'pass'); mark('type.align', 'pass'); stepKey = st.step; }
        if (isBody && px < 16 - 0.005) finding(sizeProp, w, 'a11y.body-anchor', 'FP-A11Y-07', `body text ${fmt(px)} is below the 16px anchor`, sizeLine, text, size.chain);
        else if (isBody) mark('a11y.body-anchor', 'pass');
        if (px < MICRO_PX - 0.005) finding(sizeProp, w, 'a11y.min-text', 'FP-A11Y-08', `${fmt(px)} is below the 11px floor`, sizeLine, text, size.chain);
        else mark('a11y.min-text', 'pass');
      }

      // leading
      if (!combo.lh) { missingLh = true; continue; }
      mark('type.leading-declared', 'pass');
      const lt = combo.lh.text;
      if (KEEP_KEYWORDS.test(lt)) continue;
      if (!/^[+-]?(\d*\.)?\d+$/.test(lt)) { finding(lhProp, combo.lhWritten, 'type.leading-unitless', 'FP-TYPE-08', 'line height is not a unitless ratio', lhLine, lt, combo.lh.chain); continue; }
      mark('type.leading-unitless', 'pass');
      if (stepKey === null) continue;
      const allowed = allowedLeading(stepKey);
      if (allowed.some((a) => sameRatio(a, Number(lt)))) mark('type.leading', 'pass');
      else finding(lhProp, combo.lhWritten, 'type.leading', 'FP-TYPE-07', `line height ${lt} is not allowed at step ${stepKey}`, lhLine, lt, combo.lh.chain);
    }
    if (missingLh) {
      let result = 'fail';
      const exc = exceptions.find({ values: ['', sizeWritten ?? ''], selector: sel, tokens: [], file, line: sizeLine, rules: ['FP-TYPE-13'] });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark('type.leading-declared', result, 'no line-height in the rule that sets font-size');
      addFinding({ file, selector: sel, property: 'line-height', value: null, check: 'type.leading-declared', rule: 'FP-TYPE-13', result, message: 'no line-height in the rule that sets font-size', line: sizeLine });
    }
  }

  function layoutExtras(file, rule, decl, inScope) {
    if (!inScope || level !== 'FP-2') return;
    const prop = decl.prop;
    const alts = resolveAll(decl.value, vars, protoDefault);
    const r = alts[0];
    const add = (check, ruleId, message, resolved) => {
      let result = 'fail';
      const exc = exceptions.find({ values: [decl.value, resolved ?? r.text], selector: rule.selector, tokens: r.chain, file, line: decl.line, rules: [ruleId] });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark(check, result, message);
      addFinding({ file, selector: rule.selector, property: prop, value: decl.value, resolved: resolved ?? r.text, check, rule: ruleId, result, message, line: decl.line });
    };
    const marker = (name, value) => rule.decls.some((d) => d.prop === name && d.value.toLowerCase() === value) || (rule.parent?.decls ?? []).some((d) => d.prop === name && d.value.toLowerCase() === value);
    if (prop === 'grid-template-columns' && marker('--fp-layout', 'phi-split')) {
      for (const alt of alts) {
        const t = splitValue(alt.text);
        const nums = t.length === 2 ? t.map((x) => { const m = /^([\d.]+)(fr|%)$/.exec(x); return m ? { n: parseFloat(m[1]), u: m[2] } : null; }) : [];
        if (nums.length === 2 && nums.every(Boolean) && nums[0].u === nums[1].u && nums[0].n > 0 && nums[1].n > 0) {
          const share = (nums[0].n / (nums[0].n + nums[1].n)) * 100;
          if (Math.abs(share - 61.8) <= 0.1 + 1e-9 || Math.abs(share - 38.2) <= 0.1 + 1e-9) mark('layout.phi-split', 'pass');
          else add('layout.phi-split', 'FP-LAYOUT-01', `split ${roundHalfUp(share, 1)} to ${roundHalfUp(100 - share, 1)} is not 61.8 to 38.2`, alt.text);
        } else add('layout.phi-split', 'FP-LAYOUT-01', 'a declared phi split has exactly two tracks, in fr or %, or --fp-split-major and --fp-split-minor', alt.text);
      }
    }
    if (/^(max-inline-size|max-width)$/.test(prop)) {
      for (const alt of alts) {
        for (const m of alt.text.matchAll(/([\d.]+)ch\b/g)) {
          if (parseFloat(m[1]) > 80) { add('type.measure-max', 'FP-TYPE-09', `${m[1]}ch is more than 80 characters per line`, alt.text); break; }
          mark('type.measure-max', 'pass');
        }
      }
    }
    // FP-LAYOUT-05: a container limit is identified by its token, not by its size (Native, FP-2)
    if (mode === 'native' && /^(max-inline-size|max-width|width|inline-size)$/.test(prop)) {
      const isTokenOnly = /^var\(\s*--fp-container-(610|987|1597)\s*\)$/.test(decl.value.trim());
      const usesToken = /--fp-container-(610|987|1597)/.test(decl.value);
      const isMax = /^max-/.test(prop);
      if (isTokenOnly && isMax) mark('layout.container-widths', 'pass');
      else if (usesToken && !isMax) add('layout.container-widths', 'FP-LAYOUT-05', `a container is written as max-inline-size or max-width, never as a fixed ${prop}`);
      else if (isMax && marker('--fp-layout', 'container')) add('layout.container-widths', 'FP-LAYOUT-05', 'a rule marked --fp-layout: container sets its limit with a bare --fp-container-* token');
    }
  }

  if (mode === 'snap') {
    for (const f of snapFiles) {
      for (const cp of parsed.get(f)?.customProps ?? []) if (!cp.name.startsWith('--fp-')) snapNames.add(cp.name);
      const doc = jsonDocs.get(f);
      if (doc) for (const l of flatten(doc)) snapNames.add(l.path);
    }
  }
  for (const f of [...parsed.keys()].filter((x) => sourceFiles.includes(x)).sort()) {
    const p = parsed.get(f);
    const inScope = scopeSet.has(f);
    for (const rule of p.rules) {
      if (rule.kind === 'opaque') continue;
      for (const decl of rule.decls) {
        processDecl(f, rule, decl, inScope);
        layoutExtras(f, rule, decl, inScope);
        if (inScope && /^(animation|transition)(-|$)/.test(decl.prop) && !/^(none|initial|unset|revert)?(\s+0s)*$/i.test(decl.value.trim())) hasSeen.motion.push(`${f}:${decl.line} ${decl.prop}`);
      }
      typeRule(f, rule, inScope);
      if (inScope && rule.kind === 'style' && rule.selector && SELECT_INTERACTIVE.test(rule.selector)) hasSeen.controls.push(`${f}:${rule.line} ${rule.selector}`);
    }
    if (inScope) for (const a of p.atRules) if (/^@(-\w+-)?keyframes\b/i.test(a.prelude)) hasSeen.motion.push(`${f}:${a.line} ${a.prelude}`);
  }

  // ---- FP-CONF-11: has.* contradicted by the source ----------------------------------------------------
  mark('conf.not-applicable', 'pass');
  for (const k of ['motion', 'controls']) {
    if (config.has[k] === false && hasSeen[k].length) {
      mark('conf.not-applicable', 'fail', `has.${k}`);
      addFinding({ has: k, declared: false, check: 'conf.not-applicable', rule: 'FP-CONF-11', result: 'fail', message: `has.${k} is false but the scope contains ${k}`, evidence: hasSeen[k].slice(0, 5) });
    }
  }

  // ---- Overlay coverage (FP-MODE-05) -----------------------------------------------------------------
  const exceptionsUsed = () => (config.exceptions || []).filter((e, i) => e.status === 'accepted' && exceptions.used.has(i)).length;
  if (mode === 'overlay') {
    if (counts.inScope === 0) { mark('mode.overlay-coverage', 'fail', 'the scope has no checked declarations'); note('The scope has no checked declarations: it MUST NOT be claimed (FP-MODE-05).'); }
    else mark('mode.overlay-coverage', 'pass');
    report.coverage = { inScope: counts.inScope, inSource: counts.inSource, percent: counts.inSource ? roundHalfUp((counts.inScope / counts.inSource) * 100, 0) : 0 };
  }
  report.checkedValues = counts.inScope;

  // ---- Snap -----------------------------------------------------------------------------------------
  if (mode === 'snap') runSnap();
  function parseSnapTable(text) {
    // rows of a markdown table: | token | role | original | snapped | ... (FP-SNAP-06)
    const rows = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/^`|`$/g, ''));
      if (cells.length < 4) continue;
      const m = /^(-?[\d.]+)(px|rem)?$/.exec(cells[2]);
      if (!m) continue;
      rows.set(cells[0], { role: cells[1], original: parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1) });
    }
    return rows;
  }

  function runSnap() {
    const rows = [];
    const seen = new Set();
    const tablePath = path.join(dir, config.snap?.table ?? 'fp-snap.md');
    const table = fs.existsSync(tablePath) ? parseSnapTable(fs.readFileSync(tablePath, 'utf8')) : null;
    if (table) report.snapTable = { path: posix(path.relative(dir, tablePath)), rows: table.size };
    const addRow = (name, srcPx, file, line) => {
      if (seen.has(name) || name.startsWith('--fp-')) return;
      const fromTable = table?.get(name);
      const px = fromTable ? fromTable.original : srcPx; // FP-SNAP-06: originals come from the published table when it exists
      if (px === null || px === 0) return;
      seen.add(name);
      const rs = rolesOf([name]);
      const exemptRole = [...rs].find((x) => EXEMPT_ROLES.has(x));
      const radius = radiusTokensUsed.has(name) || /radius|rounded|corner/i.test(name) || (fromTable && /^radius$/i.test(fromTable.role));
      const base = { token: name, file, line };
      if (exemptRole) rows.push({ ...base, role: exemptRole, original: px, snapped: px, drift: 0, note: 'exempt by role, unchanged', exempt: true });
      else if (rs.has('target')) rows.push({ ...base, role: 'target', original: px, ...mapTarget(px, u, pointer) });
      else rows.push({ ...base, role: radius ? 'radius' : 'space', original: px, ...mapLength(px, radius ? 'radius' : 'space', u) });
    };
    for (const f of snapFiles.sort()) {
      const p = parsed.get(f);
      if (p) {
        const names = new Set();
        for (const cp of p.customProps) {
          if (names.has(cp.name)) continue; names.add(cp.name);
          const r = resolveVars(`var(${cp.name})`, vars);
          if (r.unresolved.length) continue;
          const c = classifyToken(r.text);
          if (c.kind === 'length') addRow(cp.name, c.px, f, cp.line);
        }
      }
      const doc = jsonDocs.get(f);
      if (doc) {
        const leaves = flatten(doc); const by = new Map(leaves.map((l) => [l.path, l]));
        for (const l of leaves) { if (l.type !== 'dimension') continue; const px = dimensionPx(resolveAlias(l.token.$value, by)); if (px) addRow(l.path, px, f, 0); }
      }
    }
    // bare literals in the scope, and values that reach a declaration through a local property Snap does not map (FP-SNAP-02)
    const literals = [];
    for (const l of literalDecls) {
      const row = { file: l.file, selector: l.rule.selector, property: l.decl.prop, original: l.px, ...mapLength(l.px, l.key === 'radius' ? 'radius' : 'space', u), role: l.key === 'radius' ? 'radius' : 'space' };
      literals.push(row);
      if (row.snapped === null) {
        const exc = exceptions.find({ values: [l.written, `${fmt(l.px)}px`], selector: l.rule.selector, tokens: l.f.chain, file: l.file, line: l.decl.line, rules: ['FP-SNAP-10', 'FP-SNAP-03', 'FP-SPACE-01', 'FP-RADIUS-01'] });
        const result = exc ? (exc.status === 'accepted' ? 'exception' : 'pending') : 'fail';
        mark('snap.unsnappable', result, 'literal kept unchanged');
        report.findings.push({ file: l.file, selector: l.rule.selector, property: l.decl.prop, value: l.written, check: 'snap.unsnappable', rule: 'FP-SNAP-10', result, line: l.decl.line, message: result === 'fail' ? 'kept unchanged; no snap-drift exception is declared' : 'kept unchanged; declared as a snap-drift exception' });
      }
    }
    report.literals = literals;
    // overrides (FP-SNAP-07)
    const overrides = [];
    for (const r of rows) { r.final = r.snapped === null ? r.original : r.snapped; }
    for (const o of config.snap?.overrides ?? []) {
      const row = rows.find((r) => r.token === o.token);
      const rec = { token: o.token, original: row?.original ?? null, to: o.to, drift: null, check: 'snap.override', rule: 'FP-SNAP-07', result: 'pass', message: '' };
      if (!row) { rec.result = 'fail'; rec.message = 'token is not in snap.source'; }
      else if (row.exempt) { rec.result = 'fail'; rec.message = `token is exempt by role (${row.role}) and is never snapped`; rec.drift = driftPct(row.original, o.to); }
      else {
        rec.drift = driftPct(row.original, o.to);
        const over = Math.abs(o.to - row.original) * 1000 > 382 * row.original;
        if (over) { rec.result = 'fail'; rec.message = `drift ${rec.drift}% is over 38.2%`; }
        else if (row.role === 'radius' && !RADIUS_SET.includes(o.to)) { rec.result = 'fail'; rec.message = `${o.to} is not in the radius set`; }
        else if (row.role === 'target' && o.to < row.minimum) { rec.result = 'fail'; rec.message = `a target never ends below ${row.minimum}`; }
        else row.final = o.to;
        if (rec.result === 'pass') row.override = o.reason;
      }
      overrides.push(rec);
    }
    const breaches = findOrderBreaches(rows.filter((r) => !r.exempt));
    const merges = findMerges(rows.filter((r) => !r.exempt));
    // unsnappable (FP-SNAP-10)
    const snapFindings = [];
    const unsnappable = new Map(); // token -> exception result
    for (const r of rows.filter((x) => x.snapped === null && !x.exempt)) {
      const exc = exceptions.find({ values: [`${fmt(r.original)}px`, String(r.original)], selector: '', tokens: [r.token], file: r.file, line: r.line, reason: 'snap-drift', rules: ['FP-SNAP-10', 'FP-SNAP-03', 'FP-SPACE-01', 'FP-RADIUS-01'] });
      let result = 'fail'; let message = 'kept unchanged; no snap-drift exception is declared';
      if (exc) { result = exc.status === 'accepted' ? 'exception' : 'pending'; message = exc.status === 'accepted' ? 'kept unchanged; declared as a snap-drift exception' : 'kept unchanged; the snap-drift exception is still pending'; }
      unsnappable.set(r.token, { result, value: r.original });
      mark('snap.unsnappable', result, message);
      snapFindings.push({ token: r.token, value: `${fmt(r.original)}px`, check: 'snap.unsnappable', rule: 'FP-SNAP-10', result, message });
    }
    mark('snap.unsnappable', 'pass');
    report.findings.push(...snapFindings);
    mark('snap.exempt-by-role', 'pass'); mark('snap.nearest', 'pass'); mark('snap.drift', 'pass'); mark('snap.target-up', 'pass'); mark('snap.level-cap', 'pass');
    for (const o of overrides) mark('snap.override', o.result, o.message);
    mark('snap.override', 'pass');
    for (const b of breaches) mark('snap.monotonic', 'fail', `${b.tokens.join(' > ')}`);
    mark('snap.monotonic', 'pass');
    mark('snap.merge-listed', 'pass'); // the merges listed in the report are this rule's machine test (FP-SNAP-06)
    mark('snap.control-height', 'pass');

    const outRows = rows.map((r) => {
      const o = { token: r.token, role: r.role, original: r.original, snapped: r.snapped };
      if (r.nearest !== undefined) o.nearest = r.nearest;
      if (r.minimum !== undefined) { o.minimum = r.minimum; o.keepAllowed = r.keepAllowed; }
      o.drift = r.drift;
      if (r.note) o.note = r.note;
      if (r.override) o.override = r.override;
      return o;
    });
    report.mapping = outRows;
    report.merges = merges;
    if ((config.snap?.overrides ?? []).length || overrides.length) report.overrides = overrides;
    report.orderBreaches = breaches;
    report.final = Object.fromEntries(rows.map((r) => [r.token, r.final]));

    // FP-SNAP-11: control heights. Interactive = element name, ARIA role, or a class listed in `controls`.
    const classRes = (config.controls ?? []).map((c) => new RegExp(`${c.replace(/[.+^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`));
    const interactive = (sel) => INTERACTIVE_ELEMENT.test(sel) || classRes.some((re) => re.test(sel));
    for (const f of [...parsed.keys()].filter((x) => scopeSet.has(x) && sourceFiles.includes(x))) {
      for (const rule of parsed.get(f).rules) {
        if (rule.kind !== 'style' || !interactive(rule.selector)) continue;
        for (const d of rule.decls) {
          if (!/^(height|min-height|block-size|min-block-size)$/.test(d.prop)) continue;
          const r = resolveVars(d.value, vars);
          const c = classifyToken(r.text);
          if (c.kind === 'zero' || c.kind === 'intrinsic') continue;
          const rs = rolesOf(r.chain);
          if (!rs.has('target') && !rs.has('drawn')) {
            const exc = exceptions.find({ values: [d.value, r.text], selector: rule.selector, tokens: r.chain, file: f, line: d.line, rules: ['FP-SNAP-11'] });
            const result = exc ? (exc.status === 'accepted' ? 'exception' : 'pending') : 'fail';
            mark('snap.control-height', result, 'control height without a target or drawn role');
            report.findings.push({ file: f, selector: rule.selector, property: d.prop, value: d.value, resolved: r.text, check: 'snap.control-height', rule: 'FP-SNAP-11', result, line: d.line, message: 'the height of an interactive element needs the target or drawn role' });
          }
        }
      }
    }
  }

  // ---- contrast (FP-A11Y-01, FP-A11Y-02) -----------------------------------------------------------------
  report.pairs = runContrast();
  function runContrast() {
    const themes = config.themes?.length ? config.themes : [{ name: null }];
    const normSel = (x) => collapse(x).toLowerCase().replace(/\[\s*([^\]=~|^$*\s]+)\s*([~|^$*]?=)\s*(["']?)([^\]"']*)\3\s*\]/g, '[$1$2"$4"]');
    const stripRoot = (x) => x.replace(/^(:root|html)(?=[\[.#:])/, '');
    const normMedia = (x) => x.toLowerCase().replace(/\s+/g, '').replace(/^@media/, '');
    const selMatches = (entrySel, themeSel) => {
      const t = normSel(themeSel);
      return splitSelectors(entrySel).some((i) => { const n = normSel(i); return n === t || stripRoot(n) === stripRoot(t); });
    };
    const isBase = (e) => /^(:root|html)$/i.test(e.selector.trim()) && e.at.length === 0;
    const themeFilesSet = (theme) => new Set(expandGlobs(dir, theme.files ?? [], all));
    const own = (theme, name) => {
      const list = vars.entries.get(name) || [];
      let e = [];
      if (theme.selector && !/^(:root|html)$/i.test(theme.selector.trim())) e = list.filter((x) => selMatches(x.selector, theme.selector) && !x.at.some((a) => /@media/i.test(a) && theme.media === undefined && false));
      else if (theme.selector) e = list.filter(isBase);
      if (!e.length && theme.media) e = list.filter((x) => x.at.some((a) => normMedia(a).includes(normMedia(theme.media))));
      if (!e.length && theme.files?.length) { const fl = themeFilesSet(theme); e = list.filter((x) => fl.has(x.file)); }
      return e.length ? e[e.length - 1].value : undefined;
    };
    const declared = (x) => themes.some((t) => (t.selector && selMatches(x.selector, t.selector)) || (t.media && x.at.some((a) => normMedia(a).includes(normMedia(t.media)))) || (t.files?.length && themeFilesSet(t).has(x.file)));
    const themeTokens = (theme) => {
      if (!theme.files?.length) return null;
      const m = new Map();
      for (const f of themeFilesSet(theme)) { const d = jsonDocs.get(f); if (d) for (const l of flatten(d)) m.set(l.path, l); }
      return m;
    };
    const colourOf = (ref, theme, depth = 0) => {
      if (depth > 15) return { err: 'reference loop' };
      if (ref.startsWith('#')) return { c: parseColor(ref) };
      if (ref.startsWith('--')) {
        let v = theme.name === null ? undefined : own(theme, ref);
        if (v === undefined) v = vars.get(ref);
        if (v === undefined) return { err: `${ref} is not defined` };
        const vm = /^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(v.trim());
        if (vm) return colourOf(vm[1], theme, depth + 1);
        return { c: parseColor(v), raw: v };
      }
      const tt = themeTokens(theme);
      const tok = (tt && tt.get(ref)) || tokenByPath.get(ref);
      if (!tok) return { err: `${ref} is not defined` };
      return { c: parseColor(resolveAlias(tok.token.$value, tt ? new Map([...tokenByPath, ...tt]) : tokenByPath)) };
    };
    const out = [];
    for (const theme of themes) {
      for (const p of config.pairs) {
        const rec = { fg: p.fg, bg: p.bg, kind: p.kind, ...(theme.name ? { theme: theme.name } : {}) };
        const notRun = (message) => { Object.assign(rec, { ratio: null, required: null, check: 'a11y.contrast', rule: 'FP-A11Y-01', result: 'not-run', message }); mark('a11y.contrast', 'not-run', message); mark('a11y.contrast-exact', 'not-run', message); out.push(rec); };
        const isNonBase = theme.name !== null && !(theme.selector && /^(:root|html)$/i.test(theme.selector.trim()) && !theme.media && !theme.files);
        if (isNonBase && ![p.fg, p.bg].some((x) => x.startsWith('--') && own(theme, x) !== undefined) && !themeTokens(theme)?.has(p.fg) && !themeTokens(theme)?.has(p.bg)) { notRun(`theme "${theme.name}" defines neither ${p.fg} nor ${p.bg}: its selector, media query or files match nothing`); continue; }
        // an override of a pair's colour that no declared theme covers (FP-A11Y-01: every theme the product ships is declared)
        const stray = [p.fg, p.bg].filter((x) => x.startsWith('--')).flatMap((x) => (vars.entries.get(x) || []).filter((e) => !isBase(e) && !declared(e)));
        if (!isNonBase && stray.length) { notRun(`${stray[0].file}:${stray[0].line} sets a pair colour under "${stray[0].at.concat(stray[0].selector).join(' ')}", which no declared theme covers`); continue; }
        const fg = colourOf(p.fg, theme); const bg = colourOf(p.bg, theme);
        if (fg.err || bg.err || !fg.c || !bg.c) { notRun(fg.err || bg.err || `cannot resolve ${!fg.c ? p.fg : p.bg} to a colour`); continue; }
        if (fg.c.a < 1 || bg.c.a < 1) { notRun('a colour with transparency has no fixed contrast without compositing'); continue; }
        const t = testPair(fg.c, bg.c, p.kind);
        Object.assign(rec, { ratio: t.ratio, required: t.required, check: 'a11y.contrast', rule: 'FP-A11Y-01', result: t.pass ? 'pass' : 'fail' });
        mark('a11y.contrast', rec.result, `${p.fg} on ${p.bg}: ${t.ratio} < ${t.required}`); mark('a11y.contrast-exact', rec.result);
        out.push(rec);
      }
    }
    return out;
  }

  // ---- FP-PLAT: web custom properties --------------------------------------------------------------------
  const PLAT_NAMES = /^--fp-(space-(1|2|3|5|8|13|21|34|55|89|144|233|377)|container-(610|987|1597)|radius-(2|3|5|8|13|21|pill|round)|line-(hairline|stroke-2|stroke-3)|focus-(gap|ring)|target|target-coarse|target-floor-(coarse|fine)|type-(n1|[0-8]|micro)|leading-(body|dense|small|heading|display)|duration-(89|144|233|377)|easing-(standard|enter|exit)|layer-(base|raised|overlay|popover|toast)|tone-[1-5]|split-(major|minor)|math-(phi|phi-inverse|phi-inverse-squared|phi-root|golden-angle-degrees|golden-angle-radians|hash-constant)|layout)$/;
  const sameValue = (a, b) => { const ca = classifyToken(a); const cb = classifyToken(b); const pa = ca.kind === 'length' || ca.kind === 'zero' ? ca.px : null; const pb = cb.kind === 'length' || cb.kind === 'zero' ? cb.px : null; return (pa !== null && pb !== null) ? Math.abs(pa - pb) < 1e-6 : normValue(a) === normValue(b); };
  for (const [f, p] of parsed) {
    if (!scopeSet.has(f)) continue;
    for (const cp of p.customProps) {
      if (!cp.name.startsWith('--fp-')) continue;
      const bad = (check, ruleId, message) => {
        mark(check, 'fail', message);
        report.findings.push({ file: f, selector: cp.selector, property: cp.name, value: cp.value, check, rule: ruleId, result: 'fail', message, line: cp.line });
      };
      if (!PLAT_NAMES.test(cp.name)) { bad('plat.web-tokens', 'FP-PLAT-02', `${cp.name} is not a protocol name (FP-PLAT-02 table)`); continue; }
      mark('plat.web-tokens', 'pass');
      const r = resolveAll(cp.value, vars, protoDefault)[0];
      if (r.unresolved.length) continue;
      if (cp.name === '--fp-target') {
        const inQuery = cp.at.some((a) => /pointer:\s*fine/i.test(a) && /not\s*\(\s*any-pointer:\s*coarse\s*\)/i.test(a));
        const want = pointer === 'fine' || inQuery ? ladderTarget(u, 'fine') : ladderTarget(u, 'both');
        if (!sameValue(r.text, `${want}px`)) bad('plat.web-pointer', 'FP-PLAT-03', inQuery || pointer === 'fine' ? `--fp-target under a fine pointer is ${want}, found ${r.text}` : `--fp-target outside @media (pointer: fine) and (not (any-pointer: coarse)) is the coarse value ${want}, found ${r.text}`);
        else mark('plat.web-pointer', 'pass');
        continue;
      }
      const want = protoDefault(cp.name);
      if (want !== undefined && !sameValue(r.text, want)) {
        const fam = /^--fp-(space|container|radius|line|focus|target|type)/.exec(cp.name);
        bad(fam ? 'plat.web-units' : 'plat.web-tokens', fam ? 'FP-PLAT-01' : 'FP-PLAT-02', `${cp.name} should be ${want}, found ${r.text}`);
      } else if (want !== undefined) mark('plat.web-units', 'pass');
    }
  }

  // ---- token files in the protocol's format ----------------------------------------------------------------
  for (const f of protocolTokenFiles.filter((x) => scopeSet.has(x))) {
    const problems = checkTokenDoc(jsonDocs.get(f), path.basename(f), { unit: u });
    for (const [check, list] of Object.entries(problems)) {
      const rid = spec.rules.rules.find((r) => r.test?.check === check)?.id;
      if (!list.length) mark(check, 'pass');
      for (const m of list) { mark(check, 'fail', m); report.findings.push({ file: f, check, rule: rid, result: 'fail', message: m }); }
    }
    const b = path.basename(f);
    if (/^color\.(light|dark)\.tokens\.json$/.test(b)) {
      const other = b.includes('light') ? 'dark' : 'light';
      const sibling = path.join(path.dirname(f), `color.${other}.tokens.json`);
      if (!all.includes(posix(sibling))) { mark('token.themes', 'fail', `${b} has no ${other} file`); report.findings.push({ file: f, check: 'token.themes', rule: 'FP-TOKEN-05', result: 'fail', message: `light and dark colour values are two files; color.${other}.tokens.json is missing` }); }
      else mark('token.themes', 'pass');
    }
  }

  // ---- banned words (FP-HONEST-02) ---------------------------------------------------------------------------
  mark('honest.banned-words', 'pass');
  const banned = /\b(sacred|divine|perfect(?! (?:fourth|fifth))|magic(?:al)?|nature'?s code|universal law|most beautiful|scientifically proven)\b/i;
  (function scan(v, p) {
    if (typeof v === 'string') { const m = banned.exec(v); if (m) { mark('honest.banned-words', 'fail', `"${m[0]}" at ${p}`); report.findings.push({ check: 'honest.banned-words', rule: 'FP-HONEST-02', result: 'fail', where: p, message: `"${m[0]}" must not describe φ, Fibonacci numbers or a design that uses them` }); } }
    else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${p}/${i}`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${p}/${k}`);
  })(config, '');

  // ---- pending exceptions (FP-CONF-07) ------------------------------------------------------------------------
  const pendingDeclared = (config.exceptions || []).filter((e) => e.status === 'pending');
  mark('conf.no-pending', pendingDeclared.length ? 'pending' : 'pass');
  for (const [i, e] of (config.exceptions || []).entries()) if (!exceptions.used.has(i) && mode !== 'snap') note(`exception ${i} (${e.value} at ${e.where}) matched no checked value in the scope`);

  // ---- self-report evidence (FP-CONF-06, FP-CONF-14) -----------------------------------------------------------------
  // A self-report rule is applicable when it is normative, within the claim level, and its applies-when is true for the configuration.
  const tokenFileCount = protocolTokenFiles.filter((x) => scopeSet.has(x)).length;
  const applicableSR = spec.rules.rules.filter((r) => r.test.kind === 'self-report' && applicability(r, { config, tokenFiles: tokenFileCount }).applies).map((r) => r.id);
  const evidencePath = path.join(path.dirname(cfgFile), 'fp-evidence.json');
  let evidence = null;
  const evFail = (message, extra = {}) => { mark('conf.evidence', 'fail', message); report.findings.push({ check: 'conf.evidence', rule: 'FP-CONF-06', result: 'fail', message, ...extra }); };
  mark('conf.evidence', 'pass');
  if (fs.existsSync(evidencePath)) {
    try { evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8')); } catch (e) { evFail(`fp-evidence.json is not valid JSON: ${e.message}`); }
    if (evidence) {
      const errs = spec.evidenceSchema ? validate(spec.evidenceSchema, evidence) : [];
      if (errs.length) { for (const e of errs.slice(0, 10)) evFail(`fp-evidence.json ${e.path} ${e.message}`); evidence = null; }
      else if (evidence.fp !== SPEC_VERSION) { evFail(`fp-evidence.json fp "${evidence.fp}" does not equal the specification version "${SPEC_VERSION}"`); evidence = null; }
    }
    report.evidenceFile = posix(path.relative(dir, evidencePath));
  }
  const items = evidence?.items ?? {};
  const openItems = []; const answered = [];
  for (const id of applicableSR) {
    const it = items[id];
    if (!it || typeof it.evidence !== 'string' || it.evidence.trim() === '') { openItems.push(id); continue; }
    answered.push(id);
    if (it.result === 'fail') evFail(`${id}: the self-report item is answered "fail" by ${it.by}: ${it.evidence}`, { selfReport: id });
  }
  for (const id of Object.keys(items)) if (!applicableSR.includes(id)) note(`fp-evidence.json has an entry for ${id}, which is not an applicable self-report rule here`);
  report.applicableSelfReport = applicableSR;
  report.openItems = openItems;
  const allIndependent = Boolean(evidence) && applicableSR.length > 0 && applicableSR.every((id) => { const it = items[id]; return it && it.independent === true && it.by.trim().toLowerCase() !== String(evidence.adopter).trim().toLowerCase() && it.by.trim().toLowerCase() !== 'adopter'; });

  // ---- result ----------------------------------------------------------------------------------------------------
  let result = 'pass';
  let hasFail = false; let hasNotRun = false; let hasPending = false;
  for (const f of report.findings) { if (f.result === 'fail') hasFail = true; else if (f.result === 'not-run') hasNotRun = true; else if (f.result === 'pending') hasPending = true; }
  for (const p of report.pairs) { if (p.result === 'fail') hasFail = true; else if (p.result === 'not-run') hasNotRun = true; }
  for (const o of report.overrides ?? []) if (o.result === 'fail') hasFail = true;
  if ((report.orderBreaches ?? []).length) hasFail = true;
  if (mode === 'overlay' && counts.inScope === 0) hasFail = true;
  if (!anyChecked && mode !== 'snap' && counts.inScope === 0) note('No checked layout length was found in the scope.');
  if (unreadInScope.length) hasNotRun = true;
  if (pendingDeclared.length) hasPending = true;
  if (hasFail) result = 'fail'; else if (hasNotRun) result = 'not-run'; else if (hasPending) result = 'pending'; else result = 'pass';
  if (!sourceFiles.length) { result = 'not-run'; note('No source file matched `source`: nothing was read.'); }
  else if (![...scopeSet].some((f) => parsed.has(f) || jsonDocs.has(f))) { result = 'not-run'; note('No file in `scope` was read: the scope matches nothing (a glob typo?).'); }
  if (report.inlineStyles?.length) note(`${report.inlineStyles.length} inline style attribute(s) are not read; their lengths are a self-report item (FP-CONF-08). See inlineStyles in the report.`);
  else note('The scope has no inline style attributes.');
  report.result = result;
  report.unread = unread;

  finalizeRules(report, spec, config, checkRes, { tokenFiles: protocolTokenFiles.filter((x) => scopeSet.has(x)).length });

  // ---- claim (FP-CONF-04, FP-CONF-06, FP-CONF-14) ---------------------------------------------------------------------
  for (const r of report.rules) {
    if (r.result !== 'self-report') continue;
    if (openItems.includes(r.id)) { r.reason = 'open: no evidence in fp-evidence.json (FP-CONF-06)'; continue; }
    const it = items[r.id];
    r.result = it.result === 'n/a' ? 'n/a' : it.result; r.reason = `${it.by}: ${it.evidence}`; r.independent = it.independent === true;
  }
  report.ranBy = `fp-check ${TOOL_VERSION} (reference checker)`;
  report.claimState = 'none';
  if (result === 'pass') {
    const parts = [level, modeName(mode), `u=${u}`, config.platform];
    if (mode === 'overlay') parts.push(`scope ${scopeGlobs.join(', ')}`, `coverage ${report.coverage.percent}%`, `exceptions ${exceptionsUsed()}`);
    parts.push(`spec ${SPEC_VERSION}`);
    // FP-CONF-14: the suffix stays unless every applicable item was assessed by an independent party who is not the adopter.
    if (!allIndependent) parts.push('self-assessed');
    const claimString = parts.join(' · ');
    if (openItems.length === 0) { report.claim = claimString; report.claimState = 'valid'; }
    else {
      report.claim = null; report.claimState = 'candidate';
      report.candidate = `candidate · ${claimString} · open ${openItems.length}`;
      report.claimNote = `Candidate only, not a claim: ${openItems.length} applicable self-report item(s) are open (FP-CONF-06, FP-CONF-04).`;
    }
  } else {
    report.claim = null;
    report.claimNote = result === 'pending' ? 'No claim: pending exceptions (FP-CONF-07).' : result === 'not-run' ? 'No claim: machine tests did not run (FP-CONF-14).' : 'No claim: the run failed.';
  }
  report.exceptionsUsed = exceptionsUsed();
  return report;
}

function finalizeRules(report, spec, config, checkRes, extra) {
  const ctx = { config, report, tokenFiles: extra.tokenFiles ?? 0, invalidConfig: extra.invalidConfig };
  report.rules = rollup(spec.rules.rules, ctx, checkRes);
  const tally = { pass: 0, fail: 0, 'n/a': 0, 'not-run': 0, pending: 0, 'self-report': 0 };
  for (const r of report.rules) tally[r.result] = (tally[r.result] ?? 0) + 1;
  report.summary = tally;
}
