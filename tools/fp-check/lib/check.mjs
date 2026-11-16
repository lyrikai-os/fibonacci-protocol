// The checker: reads fp.config.json and the source, runs the machine tests, returns a report object.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collapse, posix, PHI, ladder, isRung, CONTAINERS, FIB, RADIUS_SET, FIXED_DETAIL_SET, roundHalfUp } from './util.mjs';
import { walk, expandGlobs, matchesAny, globToRegExp } from './glob.mjs';
import { validate } from './schema.mjs';
import { parseCss, extractStyleBlocks, splitSelectors } from './css.mjs';
import { splitValue, splitArgs, matchParen, VarTable, resolveVars, classifyToken, expandAtoms, propertyFamily, fineKind, CONTAINER_BOX, CONTAINER_TOKEN } from './values.mjs';
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
      return { dir: d, rules: JSON.parse(fs.readFileSync(rp, 'utf8')), schema: JSON.parse(fs.readFileSync(sp, 'utf8')) };
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
  /** ctx: { values: [..], selector, tokens: [..], file, line, reason? } -> the matching exception or null. */
  find(ctx) {
    let pend = null;
    this.list.forEach((e, i) => {
      if (ctx.reason && e.reason !== ctx.reason) return;
      if (!ctx.values.some((v) => valuesEqual(e.value, v))) return;
      if (!this.whereMatches(e.where, ctx)) return;
      this.used.add(i);
      if (e.status === 'accepted') pend = pend && pend.status === 'accepted' ? pend : e;
      else if (!pend) pend = e;
    });
    return pend;
  }
  whereMatches(where, ctx) {
    const w = collapse(where);
    const sels = [collapse(ctx.selector || ''), ...splitSelectors(ctx.selector || '').map(collapse)];
    if (sels.includes(w)) return true;
    if (ctx.tokens?.some((t) => t === w || (w.includes('*') && new RegExp('^' + w.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(t)))) return true;
    const m = /^(.*):(\d+)$/.exec(w);
    if (m && ctx.file && (ctx.file === m[1] || ctx.file.endsWith('/' + m[1])) && Number(m[2]) === ctx.line) return true;
    if (ctx.file && (ctx.file === w || ctx.file.endsWith('/' + w))) return true;
    return false;
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
      if (/\sstyle\s*=\s*["']/i.test(html)) note(`${f}: inline style attributes are not read (FP-CONF-08)`);
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
  // The protocol's own properties resolve to their published values when the source does not define them.
  const proto = (name, value) => { if (!vars.has(name)) vars.add({ name, value, selector: ':root' }); };
  for (const n of FIB) proto(`--fp-space-${n}`, `${n * u}px`);
  for (const n of CONTAINERS) proto(`--fp-container-${n}`, `${n}px`);
  for (const n of [2, 3, 5, 8, 13, 21]) proto(`--fp-radius-${n}`, `${n}px`);
  proto('--fp-radius-pill', '9999px'); proto('--fp-radius-round', '50%');
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

  function layoutTest(text, written) {
    const c = classifyToken(text);
    switch (c.kind) {
      case 'length': return rungTest(c.px);
      case 'calc': { const d = derivedTest(written); return d.status === 'fail' ? { ...d, also: ['space.derived'] } : d; }
      case 'minmax': {
        const inner = text.slice(text.indexOf('(') + 1, text.length - 1);
        let res = { status: 'pass' };
        for (const a of splitArgs(inner)) {
          const ca = classifyToken(a);
          let r = { status: 'pass' };
          if (ca.kind === 'length') r = rungTest(ca.px);
          else if (ca.kind === 'calc') { r = derivedTest(a); if (r.status === 'fail') r.also = ['space.derived']; }
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
        return { status: 'fail', message: `${fmt(v)} is not in the radius set 0, 2, 3, 5, 8, 13, 21, pill or round` };
      }
      return FIXED_DETAIL_SET.includes(Math.abs(v)) ? { status: 'pass' } : { status: 'fail', message: `${fmt(v)} is not 0, 1, 2 or 3` };
    }
    if (c.kind === 'calc' || c.kind === 'minmax') {
      if (/^calc\(\s*infinity\b/i.test(text)) return { status: 'pass' };
      return { status: 'fail', message: 'calc() is only accepted in the two derived patterns for layout lengths (FP-CONF-08)' };
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

  function processDecl(file, rule, decl, inScope) {
    const prop = decl.prop;
    const fam = propertyFamily(prop);
    if (!fam) return;
    const written = splitValue(decl.value);
    const flat = [];
    written.forEach((w, i) => {
      if (/var\(/i.test(w)) {
        const r = resolveVars(w, vars);
        const subs = splitValue(r.text);
        for (const s of subs.length ? subs : [r.text]) flat.push({ text: s, origin: i, chain: r.chain, unresolved: r.unresolved });
      } else flat.push({ text: w, origin: i, chain: [], unresolved: [] });
    });
    const atoms = expandAtoms(prop, flat.map((f) => f.text));
    const key = fam === 'layout' ? 'layout' : fineKind(prop);
    const per = new Map(); // origin -> { status, message, tests, also }
    let counted = 0;
    for (const atom of atoms) {
      const f = flat[atom.index];
      if (!f) continue;
      let c = classifyToken(f.text);
      if (f.unresolved.length) c = { kind: 'var' };
      if (c.kind === 'var' && atom.maybe) continue;
      if (atom.maybe && c.kind !== 'length' && c.kind !== 'zero') continue;
      const isCountable = c.kind === 'length' || c.kind === 'calc' || (c.kind === 'minmax' && splitArgs(f.text.slice(f.text.indexOf('(') + 1, f.text.length - 1)).some((a) => ['length', 'calc'].includes(classifyToken(a).kind)));
      if (isCountable) counted += atom.mult;
      if (c.kind === 'relative') note(`${file}:${decl.line} ${prop}: ${f.text} is relative to a font size and is not resolved by the checker`);
      for (const n of f.chain) if (fam === 'radius') radiusTokensUsed.add(n);
      if (!inScope) continue;
      let r;
      if (mode === 'snap' && (key === 'layout' || key === 'radius')) {
        // Snap maps tokens and bare literals alike; the resolved value is not ladder-tested here (FP-SNAP-02).
        if (c.kind === 'length' && !f.chain.length) literalDecls.push({ file, rule, decl, f, key, px: c.px, written: written[f.origin] });
        r = { status: 'pass' };
      } else if (c.kind === 'var') r = { status: 'not-run', message: `cannot resolve ${f.unresolved.join(', ')} within the source` };
      else {
        const rs = rolesOf(f.chain);
        const exempt = [...rs].some((x) => EXEMPT_ROLES.has(x));
        if (exempt) r = { status: 'pass', message: 'exempt by role' };
        else if (rs.has('target') && c.kind === 'length' && c.px >= ladderTarget(u, pointer)) r = { status: 'pass', message: 'target token' };
        else r = key === 'layout' ? layoutTest(f.text, written[f.origin]) : fineTest(key, f.text);
      }
      const cur = per.get(f.origin) || { status: 'pass', also: [] };
      if (RESULT_ORDER.indexOf(r.status) < RESULT_ORDER.indexOf(cur.status)) { cur.status = r.status; cur.message = r.message; }
      if (r.also) cur.also.push(...r.also);
      per.set(f.origin, cur);
    }
    if (inScope) counts.inScope += counted;
    counts.inSource += counted;
    if (counted > 0) anyChecked = anyChecked || inScope;
    if (!inScope) return;

    for (const [origin, r] of per) {
      const { check, rule: ruleId } = CHECKS[key];
      const chain = flat.filter((f) => f.origin === origin).flatMap((f) => f.chain);
      const whole = flat.filter((f) => f.origin === origin).map((f) => f.text).join(' ');
      let result = r.status;
      let exc = null;
      if (result === 'fail' || result === 'not-run') {
        exc = exceptions.find({ values: [written[origin], whole], selector: rule.selector, tokens: chain, file, line: decl.line });
        if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      }
      if (mode === 'snap' && result === 'pass' && !chain.length && counted > 0) {
        // a bare literal in Snap is mapped by the same rules and listed under "literals"
      }
      if (result === 'pass') { mark(check, 'pass'); continue; }
      mark(check, result, r.message);
      for (const a of r.also ?? []) mark(a, result, r.message);
      addFinding({ file, selector: rule.selector, property: prop, value: written[origin], resolved: whole, check, rule: ruleId, result, line: decl.line, ...(r.message ? { message: r.message } : {}), ...(exc ? { exception: exc.reason } : {}) });
    }
  }

  // FP-2 type, FP-LAYOUT, FP-TYPE-09 --------------------------------------------------------------
  function typeRule(file, rule, inScope) {
    if (!inScope || level !== 'FP-2' || rule.kind !== 'style') return;
    const get = (p) => [...rule.decls].reverse().find((d) => d.prop === p);
    const fs_ = get('font-size'); const lh = get('line-height'); const font = get('font');
    let sizeText = null; let sizeWritten = null; let sizeProp = 'font-size'; let sizeLine = rule.line; let lhText = null; let lhWritten = null; let lhLine = rule.line; let lhProp = 'line-height';
    if (fs_) { sizeWritten = fs_.value; sizeLine = fs_.line; }
    if (lh) { lhWritten = lh.value; lhLine = lh.line; }
    if (font && !/^(inherit|initial|unset|revert|caption|icon|menu|message-box|small-caption|status-bar)$/i.test(font.value)) {
      const toks = splitValue(font.value);
      const i = toks.findIndex((t) => { const c = classifyToken(resolveVars(t, vars).text); return c.kind === 'length' || c.kind === 'relative' || (c.kind === 'intrinsic' && c.unit === '%'); });
      if (i >= 0 && (!fs_ || font.line > fs_.line)) { sizeWritten = toks[i]; sizeProp = 'font'; sizeLine = font.line; if (toks[i + 1] === '/' && toks[i + 2]) { lhWritten = toks[i + 2]; lhProp = 'font'; lhLine = font.line; } }
    }
    if (sizeWritten === null) return;
    const r = resolveVars(sizeWritten, vars);
    sizeText = r.text;
    const c = classifyToken(sizeText);
    const isMicro = /^var\(\s*--fp-type-micro\s*\)$/.test(sizeWritten) || rolesOf(r.chain).has('micro');
    if (r.unresolved.length) {
      addFinding({ file, selector: rule.selector, property: sizeProp, value: sizeWritten, check: 'type.scale', rule: 'FP-TYPE-01', result: 'not-run', message: `cannot resolve ${r.unresolved.join(', ')}`, line: sizeLine });
      mark('type.scale', 'not-run');
      return;
    }
    if (rolesOf(r.chain).has('type') === false && (c.kind === 'intrinsic' || c.kind === 'unknown' || c.kind === 'calc' || c.kind === 'minmax')) {
      if (c.kind === 'calc' || c.kind === 'minmax') note(`${file}:${sizeLine} ${sizeProp}: ${sizeText} is a computed size and is not tested`);
      return;
    }
    const sel = rule.selector;
    const finding = (p, value, check, ruleId, message, line, resolved) => {
      let result = 'fail';
      const exc = exceptions.find({ values: [value, resolved ?? value], selector: sel, tokens: r.chain, file, line });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark(check, result, message);
      addFinding({ file, selector: sel, property: p, value, resolved, check, rule: ruleId, result, message, line });
    };
    let px = null;
    if (c.kind === 'length' || c.kind === 'zero') {
      px = c.px;
      if (c.kind === 'length' && c.unit !== 'rem') finding(sizeProp, sizeWritten, 'type.units', 'FP-TYPE-04', /^(html|:root)$/i.test(rule.selector) ? 'the root font size must not be set in px' : 'a type size is written in rem', sizeLine, sizeText);
      else mark('type.units', 'pass');
    } else if (c.kind === 'relative') {
      finding(sizeProp, sizeWritten, 'type.units', 'FP-TYPE-04', 'a type size is written in rem', sizeLine, sizeText);
    } else if (c.kind === 'intrinsic') return; // keywords and percentages (a root of 100%) are not sizes

    let stepKey = null;
    if (isMicro) {
      if (px !== null && Math.abs(px - MICRO_PX) > 0.005) finding(sizeProp, sizeWritten, 'type.micro', 'FP-TYPE-05', `micro is ${MICRO_PX}px, found ${fmt(px)}`, sizeLine, sizeText);
      else mark('type.micro', 'pass');
      stepKey = 'micro';
    } else if (px !== null) {
      const s = findStep(px, bodyPx, align);
      if (!s) finding(sizeProp, sizeWritten, 'type.scale', 'FP-TYPE-01', `${fmt(px)} is not a step of the scale`, sizeLine, sizeText);
      else if (s.kind === 'odd') finding(sizeProp, sizeWritten, 'type.step-range', 'FP-TYPE-02', `${fmt(px)} is step ${s.step}: odd steps above 4 are not used`, sizeLine, sizeText);
      else if (s.kind === 'replaced') finding(sizeProp, sizeWritten, 'type.align', 'FP-TYPE-03', `${fmt(px)} is replaced by ${stepSize(s.step, bodyPx, 'fibonacci')} under type.align fibonacci`, sizeLine, sizeText);
      else { mark('type.scale', 'pass'); mark('type.step-range', 'pass'); mark('type.align', 'pass'); stepKey = s.step; }
      if (/^(html\s+)?body$/i.test(rule.selector.trim()) && px < 16 - 0.005) finding(sizeProp, sizeWritten, 'a11y.body-anchor', 'FP-A11Y-07', `body text ${fmt(px)} is below the 16px anchor`, sizeLine, sizeText);
      else mark('a11y.body-anchor', 'pass');
      if (px < MICRO_PX - 0.005) finding(sizeProp, sizeWritten, 'a11y.min-text', 'FP-A11Y-08', `${fmt(px)} is below the 11px floor`, sizeLine, sizeText);
      else mark('a11y.min-text', 'pass');
    }

    // leading
    if (lhWritten === null) {
      let result = 'fail';
      const exc = exceptions.find({ values: ['', sizeWritten], selector: sel, tokens: [], file, line: sizeLine });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark('type.leading-declared', result, 'no line-height in the rule that sets font-size');
      addFinding({ file, selector: sel, property: 'line-height', value: null, check: 'type.leading-declared', rule: 'FP-TYPE-13', result, message: 'no line-height in the rule that sets font-size', line: sizeLine });
      return;
    }
    mark('type.leading-declared', 'pass');
    const lr = resolveVars(lhWritten, vars);
    if (/^(inherit|initial|unset|revert)$/i.test(lr.text)) return;
    if (!/^[+-]?(\d*\.)?\d+$/.test(lr.text)) {
      finding(lhProp, lhWritten, 'type.leading-unitless', 'FP-TYPE-08', 'line height is not a unitless ratio', lhLine, lr.text);
      return;
    }
    mark('type.leading-unitless', 'pass');
    if (stepKey === null) return;
    const ratio = Number(lr.text);
    const allowed = allowedLeading(stepKey);
    if (allowed.some((a) => sameRatio(a, ratio))) mark('type.leading', 'pass');
    else finding(lhProp, lhWritten, 'type.leading', 'FP-TYPE-07', `line height ${lr.text} is not allowed at step ${stepKey}`, lhLine, lr.text);
  }

  function layoutExtras(file, rule, decl, inScope) {
    if (!inScope || level !== 'FP-2') return;
    const prop = decl.prop;
    const r = resolveVars(decl.value, vars);
    const add = (check, ruleId, message, resolved) => {
      let result = 'fail';
      const exc = exceptions.find({ values: [decl.value, resolved ?? r.text], selector: rule.selector, tokens: r.chain, file, line: decl.line });
      if (exc) result = exc.status === 'accepted' ? 'exception' : 'pending';
      mark(check, result, message);
      addFinding({ file, selector: rule.selector, property: prop, value: decl.value, resolved: resolved ?? r.text, check, rule: ruleId, result, message, line: decl.line });
    };
    if (prop === 'grid-template-columns') {
      const declared = rule.decls.some((d) => d.prop === '--fp-layout' && /^phi-split$/i.test(d.value));
      if (declared) {
        let t = splitValue(r.text);
        if (/^var\(\s*--fp-split-(major|minor)\s*\)\s+var\(\s*--fp-split-(major|minor)\s*\)$/.test(r.text)) t = ['1.618fr', '1fr'];
        const nums = t.length === 2 ? t.map((x) => { const m = /^([\d.]+)(fr|%)$/.exec(x); return m ? { n: parseFloat(m[1]), u: m[2] } : null; }) : [];
        if (nums.length === 2 && nums.every(Boolean) && nums[0].u === nums[1].u && nums[0].n > 0 && nums[1].n > 0) {
          const share = (nums[0].n / (nums[0].n + nums[1].n)) * 100;
          const near = Math.abs(share - 61.8) <= 0.1 + 1e-9 || Math.abs(share - 38.2) <= 0.1 + 1e-9;
          if (near) mark('layout.phi-split', 'pass');
          else add('layout.phi-split', 'FP-LAYOUT-01', `split ${roundHalfUp(share, 1)} to ${roundHalfUp(100 - share, 1)} is not 61.8 to 38.2`);
        } else add('layout.phi-split', 'FP-LAYOUT-01', 'a declared phi split has exactly two tracks, in fr or %, or --fp-split-major and --fp-split-minor');
      }
    }
    if (/^(max-inline-size|max-width)$/.test(prop)) {
      const m = /^([\d.]+)ch$/.exec(r.text);
      if (m) {
        if (parseFloat(m[1]) > 80) add('type.measure-max', 'FP-TYPE-09', `${m[1]}ch is more than 80 characters per line`);
        else mark('type.measure-max', 'pass');
      }
    }
    // FP-LAYOUT-05: a container limit is identified by its token, not by its size (Native, FP-2)
    if (mode === 'native' && /^(max-inline-size|max-width|width|inline-size)$/.test(prop)) {
      const usesToken = /--fp-container-(610|987|1597)/.test(decl.value);
      const isMax = /^max-/.test(prop);
      if (usesToken && isMax) mark('layout.container-widths', 'pass');
      else if (usesToken) add('layout.container-widths', 'FP-LAYOUT-05', `a container is written as max-inline-size or max-width, never as a fixed ${prop}`);
      else if (isMax && rule.decls.some((d) => d.prop === '--fp-layout' && /^container$/i.test(d.value))) add('layout.container-widths', 'FP-LAYOUT-05', 'a rule marked --fp-layout: container sets its limit with a --fp-container-* token');
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
        if (inScope && /^(animation|transition)(-|$)/.test(decl.prop) && !/^none$/i.test(decl.value)) hasSeen.motion.push(`${f}:${decl.line} ${decl.prop}`);
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
  function runSnap() {
    const rows = [];
    const seen = new Set();
    const addRow = (name, px, file, line) => {
      if (seen.has(name) || name.startsWith('--fp-') || px === null || px === 0) return;
      seen.add(name);
      const rs = rolesOf([name]);
      const exemptRole = [...rs].find((x) => EXEMPT_ROLES.has(x));
      const radius = radiusTokensUsed.has(name) || /radius|rounded|corner/i.test(name);
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
    // bare literals in the scope (FP-SNAP-02, listed under "literals")
    const literals = [];
    for (const l of literalDecls) {
      const row = { file: l.file, selector: l.rule.selector, property: l.decl.prop, original: l.px, ...mapLength(l.px, l.key === 'radius' ? 'radius' : 'space', u), role: l.key === 'radius' ? 'radius' : 'space' };
      literals.push(row);
      if (row.snapped === null) {
        const exc = exceptions.find({ values: [l.written, `${fmt(l.px)}px`], selector: l.rule.selector, tokens: [], file: l.file, line: l.decl.line, reason: 'snap-drift' });
        const result = exc ? (exc.status === 'accepted' ? 'exception' : 'pending') : 'fail';
        mark('snap.unsnappable', result, 'literal kept unchanged');
        report.findings.push({ file: l.file, selector: l.rule.selector, property: l.decl.prop, value: l.written, check: 'snap.unsnappable', rule: 'FP-SNAP-10', result, line: l.decl.line, message: result === 'fail' ? 'kept unchanged; no snap-drift exception is declared' : 'kept unchanged; declared as a snap-drift exception' });
      }
    }
    report.literals = literals;
    // overrides (FP-SNAP-07)
    const overrides = [];
    const finalOf = new Map();
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
    for (const r of rows.filter((x) => x.snapped === null && !x.exempt)) {
      const exc = exceptions.find({ values: [`${fmt(r.original)}px`, String(r.original)], selector: '', tokens: [r.token], file: r.file, line: r.line, reason: 'snap-drift' });
      let result = 'fail'; let message = 'kept unchanged; no snap-drift exception is declared';
      if (exc) { result = exc.status === 'accepted' ? 'exception' : 'pending'; message = exc.status === 'accepted' ? 'kept unchanged; declared as a snap-drift exception' : 'kept unchanged; the snap-drift exception is still pending'; }
      mark('snap.unsnappable', result, message);
      snapFindings.push({ token: r.token, value: `${fmt(r.original)}px`, check: 'snap.unsnappable', rule: 'FP-SNAP-10', result, message });
    }
    mark('snap.unsnappable', 'pass');
    report.findings.push(...snapFindings);
    for (const o of overrides) mark('snap.override', o.result, o.message);
    mark('snap.override', 'pass');
    for (const b of breaches) mark('snap.monotonic', 'fail', `${b.tokens.join(' > ')}`);
    mark('snap.monotonic', 'pass');
    mark('snap.exempt-by-role', 'pass'); mark('snap.nearest', 'pass'); mark('snap.drift', 'pass'); mark('snap.target-up', 'pass'); mark('snap.level-cap', 'pass');
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

    // FP-SNAP-06: the merges listed above are the machine test; the published table is a self-report item (FP-SNAP-08).
    mark('snap.merge-listed', 'pass');
    // FP-SNAP-11: control heights
    for (const f of [...parsed.keys()].filter((x) => scopeSet.has(x) && sourceFiles.includes(x))) {
      for (const rule of parsed.get(f).rules) {
        if (rule.kind !== 'style' || !INTERACTIVE_ELEMENT.test(rule.selector)) continue;
        for (const d of rule.decls) {
          if (!/^(height|min-height|block-size|min-block-size)$/.test(d.prop)) continue;
          const r = resolveVars(d.value, vars);
          const c = classifyToken(r.text);
          if (c.kind === 'zero' || c.kind === 'intrinsic') continue;
          const rs = rolesOf(r.chain);
          if (!rs.has('target') && !rs.has('drawn')) {
            const exc = exceptions.find({ values: [d.value, r.text], selector: rule.selector, tokens: r.chain, file: f, line: d.line });
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
    const out = [];
    const base = (name) => { const v = vars.get(name); return v; };
    const themeVar = (theme, name) => {
      if (theme.selector) {
        const e = (vars.entries.get(name) || []).filter((x) => collapse(x.selector) === collapse(theme.selector) && x.at.length === 0);
        if (e.length) return e[e.length - 1].value;
      }
      if (theme.media) {
        const e = (vars.entries.get(name) || []).filter((x) => x.at.some((a) => collapse(a).toLowerCase().includes(collapse(theme.media).toLowerCase())));
        if (e.length) return e[e.length - 1].value;
      }
      if (theme.files?.length) {
        const fl = new Set(expandGlobs(dir, theme.files, all));
        const e = (vars.entries.get(name) || []).filter((x) => fl.has(x.file));
        if (e.length) return e[e.length - 1].value;
      }
      return undefined;
    };
    const themeTokens = (theme) => {
      if (!theme.files?.length) return null;
      const fl = new Set(expandGlobs(dir, theme.files, all));
      const m = new Map();
      for (const f of fl) { const d = jsonDocs.get(f); if (d) for (const l of flatten(d)) m.set(l.path, l); }
      return m;
    };
    const resolveColor = (ref, theme, depth = 0) => {
      if (depth > 15) return null;
      if (ref.startsWith('#')) return parseColor(ref);
      if (ref.startsWith('--')) {
        let v = themeVar(theme, ref); if (v === undefined) v = base(ref);
        if (v === undefined) return null;
        const vm = /^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(v.trim());
        if (vm) return resolveColor(vm[1], theme, depth + 1);
        return parseColor(v);
      }
      const tt = themeTokens(theme);
      const tok = (tt && tt.get(ref)) || tokenByPath.get(ref);
      if (!tok) return null;
      const by = tt || tokenByPath;
      const val = resolveAlias(tok.token.$value, tt ? new Map([...tokenByPath, ...tt]) : tokenByPath);
      return parseColor(val);
    };
    for (const theme of themes) {
      for (const p of config.pairs) {
        const fg = resolveColor(p.fg, theme); const bg = resolveColor(p.bg, theme);
        const rec = { fg: p.fg, bg: p.bg, kind: p.kind, ...(theme.name ? { theme: theme.name } : {}) };
        if (!fg || !bg) {
          Object.assign(rec, { ratio: null, required: null, check: 'a11y.contrast', rule: 'FP-A11Y-01', result: 'not-run', message: `cannot resolve ${!fg ? p.fg : p.bg} to a colour` });
          mark('a11y.contrast', 'not-run', rec.message); mark('a11y.contrast-exact', 'not-run', rec.message);
        } else if (fg.a < 1 || bg.a < 1) {
          Object.assign(rec, { ratio: null, required: null, check: 'a11y.contrast', rule: 'FP-A11Y-01', result: 'not-run', message: 'a colour with transparency has no fixed contrast without compositing' });
          mark('a11y.contrast', 'not-run', rec.message); mark('a11y.contrast-exact', 'not-run', rec.message);
        } else {
          const t = testPair(fg, bg, p.kind);
          Object.assign(rec, { ratio: t.ratio, required: t.required, check: 'a11y.contrast', rule: 'FP-A11Y-01', result: t.pass ? 'pass' : 'fail' });
          mark('a11y.contrast', rec.result, `${p.fg} on ${p.bg}: ${t.ratio} < ${t.required}`); mark('a11y.contrast-exact', rec.result);
        }
        out.push(rec);
      }
    }
    return out;
  }

  // ---- FP-PLAT: web custom properties --------------------------------------------------------------------
  for (const [f, p] of parsed) {
    if (!scopeSet.has(f)) continue;
    for (const cp of p.customProps) {
      if (!cp.name.startsWith('--fp-')) continue;
      const bad = (check, ruleId, message) => {
        mark(check, 'fail', message);
        report.findings.push({ file: f, selector: cp.selector, property: cp.name, value: cp.value, check, rule: ruleId, result: 'fail', message, line: cp.line });
      };
      const fam = /^--fp-(space|container|radius|focus|type|leading|duration|tone)-(.+)$/.exec(cp.name);
      if (fam) {
        const allowed = { space: FIB.map(String), container: CONTAINERS.map(String), radius: ['2', '3', '5', '8', '13', '21', 'pill', 'round'], focus: ['gap', 'ring'], type: ['n1', '0', '1', '2', '3', '4', '5', '6', '7', '8', 'micro'], leading: ['body', 'dense', 'small', 'heading', 'display'], duration: ['89', '144', '233', '377'], tone: ['1', '2', '3', '4', '5'] }[fam[1]];
        if (!allowed.includes(fam[2])) { bad('plat.web-tokens', 'FP-PLAT-02', `${cp.name} is not a protocol name`); continue; }
        mark('plat.web-tokens', 'pass');
        const r = resolveVars(cp.value, vars); const c = classifyToken(r.text);
        if (fam[1] === 'space' && c.kind === 'length') {
          if (Math.abs(c.px - Number(fam[2]) * u) > 1e-6) bad('plat.web-units', 'FP-PLAT-01', `${cp.name} should be ${Number(fam[2]) * u}px at u=${u}, found ${fmt(c.px)}px`);
          else mark('plat.web-units', 'pass');
        }
        if ((fam[1] === 'container' || (fam[1] === 'radius' && fam[2] !== 'pill')) && c.kind === 'length' && Math.abs(c.px - Number(fam[2])) > 1e-6) bad('plat.web-units', 'FP-PLAT-01', `${cp.name} does not scale with u and should be ${fam[2]}px, found ${fmt(c.px)}px`);
        if (fam[1] === 'type' && c.kind === 'length' && c.unit !== 'rem') bad('plat.web-units', 'FP-PLAT-01', `${cp.name}: protocol type is written in rem`);
      }
      if (cp.name === '--fp-target' && pointer !== 'fine') {
        const c = classifyToken(resolveVars(cp.value, vars).text);
        const fineV = ladderTarget(u, 'fine');
        const inQuery = cp.at.some((a) => /pointer:\s*fine/i.test(a) && /not\s*\(\s*any-pointer:\s*coarse\s*\)/i.test(a));
        if (c.kind === 'length' && Math.abs(c.px - fineV) < 1e-6 && !inQuery) bad('plat.web-pointer', 'FP-PLAT-03', `--fp-target is the fine value ${fineV} outside @media (pointer: fine) and (not (any-pointer: coarse))`);
        else mark('plat.web-pointer', 'pass');
      }
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
  report.result = result;
  report.unread = unread;

  finalizeRules(report, spec, config, checkRes, { tokenFiles: protocolTokenFiles.filter((x) => scopeSet.has(x)).length });

  // ---- claim (FP-CONF-04, FP-CONF-14) --------------------------------------------------------------------------------
  const selfReport = report.rules.filter((r) => r.result === 'self-report').length;
  if (result === 'pass') {
    const parts = [level, modeName(mode), `u=${u}`, config.platform];
    if (mode === 'overlay') parts.push(`scope ${scopeGlobs.join(', ')}`, `coverage ${report.coverage.percent}%`, `exceptions ${exceptionsUsed()}`);
    parts.push(`spec ${SPEC_VERSION}`);
    // FP-CONF-14: the suffix stays unless another named party assessed every self-report item; the report names who ran the tests.
    parts.push('self-assessed');
    report.claim = parts.join(' · ');
  } else {
    report.claim = null;
    report.claimNote = result === 'pending' ? 'No claim: pending exceptions (FP-CONF-07).' : result === 'not-run' ? 'No claim: machine tests did not run (FP-CONF-14).' : 'No claim: the run failed.';
  }
  report.ranBy = `fp-check ${TOOL_VERSION} (reference checker)`;
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
