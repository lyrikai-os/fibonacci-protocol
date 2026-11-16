#!/usr/bin/env node
// Lyrikai: Fibonacci Protocol for UI/UX Design Agents (MIT) - https://www.lyrikai.com
// Guards what may be published: private links and paths, in-house names (from a private deny file),
// banned claims, secrets, required link and LICENSE. Dependency-free, Node 20+.
// The source carries no literal hits: patterns are written so they do not match their own text.

import { readdirSync, lstatSync, readlinkSync, openSync, readSync, closeSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
import { join, relative, resolve, dirname, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://www.lyrikai.com';
const LINK_RE = /https:\/\/www\.lyrikai\.com(?![A-Za-z0-9-]|\.[A-Za-z0-9])/i;

/** Public strings that are always fine. Nothing private lives in this file: names come from --deny. */
export const DEFAULT_ALLOW_STRINGS = ['/lyrikai-fibonacci', 'skills/lyrikai-fibonacci/', 'com.lyrikai.fp', 'lyrikai-os/fibonacci-protocol', 'www.lyrikai.com', 'Lyrikai'];

const G = (re) => new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
const P = (...parts) => parts.join('');

// A path is private when it is not glued to a preceding word, and not a site-relative markdown/html link.
const NB = '(?<![\\w.\\-])';
// Only a site route (the Linux-home shape) may be a link target; local paths are never exempt.
const NB_SITE = P(NB, '(?<!\\]\\()', '(?<!href=")', '(?<!src=")');
const PRIVATE_LINKS = [
  [/\bclaude\.ai\b/i, 'claude web-app link'],
  [/\borigin\.cursor\.com\b/i, 'cursor origin link'],
  [/\bcursor\.com[/]codebase\b/i, 'cursor codebase link'],
  [new RegExp(P(NB, '/', 'Users', '/'), 'i'), 'local home path (macOS)'],
  [new RegExp(P(NB_SITE, '/', 'home', '/')), 'local home path (Linux)'],
  [new RegExp(P(NB, '/', 'home', '/(?=[^)"\'\\s\\]#?])')), 'local home path (Linux)'],
  [new RegExp(P(NB, '/private', '/tmp', '\\b')), 'local temp path'],
  [new RegExp(P(NB, '/tmp', '/')), 'local temp path'],
  [new RegExp(P(NB, '/var', '/folders', '/')), 'local temp path'],
  [new RegExp(P(NB, '/Vol', 'umes', '/')), 'local volume path'],
  [new RegExp(P('[A-Za-z]:[\\\\/]+', 'Users', '\\b'), 'i'), 'local home path (Windows)'],
  [new RegExp(P('(?<![\\w.\\-~])~', '/(?!\\.(?:claude|cursor|codex|agents)/(?![^\\s"\'`)]*\\.\\.))')), 'home-relative path'],
  [new RegExp(P('\\$\\{?HO', 'ME\\b\\}?')), 'home environment variable'],
  [new RegExp(P('%USERPROFIL', 'E%'), 'i'), 'home environment variable'],
].map(([re, label]) => [G(re), label]);

// Documentation placeholders are not secrets.
const PLACEHOLDER = /^(?:<.*|\$\{?\w+\}?|\{\{.*\}\}|\[.*\]|x{3,}|\*{3,}|\.{3,}|\u2026|your[_-]?\w*|changeme|change[_-]me|example\w*|placeholder\w*|password|secret|token|redacted|string|required|optional|none|null|true|false|undefined)$/i;
const SECRETS = [
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/aws_secret_access_ke[y]/i, 'AWS secret key name'],
  [/["']?api[_-]?key["']?\s*[:=]/i, 'api key assignment'],
  [/\bsk-ant-[A-Za-z0-9_-]{8,}/, 'Anthropic key'],
  [/\bsk-proj-[A-Za-z0-9_-]{8,}/, 'OpenAI project key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{8,}/, 'Slack token'],
  [/\b[sr]k_live_[A-Za-z0-9]{8,}/, 'live payment key'],
  [/\bpassword["']?\s*[:=]\s*["']?([^\s"',;]{3,})/i, 'password assignment', (m) => !PLACEHOLDER.test(m[1])],
  [/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./, 'JWT'],
  [/-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/, 'private key block'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'GitHub fine-grained token'],
  [/\b(?:secret|token)["']?\s*[:=]\s*["']([A-Za-z0-9/+_-]{20,})["']/i, 'secret or token assignment', (m) => !PLACEHOLDER.test(m[1])],
].map(([re, label, ok]) => [G(re), label, ok]);

const BANNED = [
  /\bsacred\b/i, /\bdivine\b/i, /\bperfect\b(?!\s+(?:fourths?|fifths?|octaves?|unisons?)\b)/i, /\bmagic(?:al)?\b/i,
  /\bnature['’]s (?:code|perfect)\b/i, /\buniversal laws?\b/i, /\bmost beautiful\b/i, /\bscientifically proven\b/i,
].map(G);
const NEG_VERBS = '(?:must not|do not|don\'?t|never|shall not|should not)\\s+(?:describe|claim|call|say|state|label)\\b';
const NEG_HEADER = new RegExp(`\\b${NEG_VERBS}[^.!?:]{0,60}:\\s*$`, 'i');
/**
 * True when the text before a banned word is a negated rule in the same sentence and the word sits in the
 * list that directly follows the "as" or colon: "must not describe X as: a, b, or c".
 */
function negatedBefore(before) {
  let last = null;
  for (const m of before.matchAll(new RegExp(`\\b${NEG_VERBS}`, 'ig'))) last = m;
  if (!last) return false;
  const seg = before.slice(last.index);
  if (/[.!?]\s/.test(seg)) return false;
  const rest = seg.slice(last[0].length);
  const k = rest.search(/:|\bas\b/i);
  if (k < 0) return false;
  let between = rest.slice(k).replace(/^(?::|as\b\s*:?)/i, '');
  between = between.replace(/\bperfect\s+(?:fourths?|fifths?|octaves?|unisons?)\b/gi, '');
  for (const re of BANNED) between = between.replace(G(re), '');
  return /^[\s,"'`\u201c\u201d\u2018\u2019*_()-]*(?:(?:or|and|a|an|the)[\s,"'`\u201c\u201d\u2018\u2019*_()-]*)*$/i.test(between);
}
const BANNED_HEADER = /\bbanned\s+(?:words?|claims?|phrases?)\b/i;
const MARKER_ALLOW_BANNED = /check-public:\s*allow-banned/;

const MD_RE = /\.(?:md|mdx|markdown)$/i;
const HTML_RE = /\.(?:html?|svg)$/i;
const JS_RE = /\.(?:mjs|cjs|js|ts)$/i;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** Glob to RegExp (case-insensitive): ** crosses dirs, * and ? do not. No slash in the glob means any depth. */
export function globToRegExp(glob) {
  const g = glob.replace(/\\/g, '/');
  const anyDepth = !g.includes('/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += escapeRe(c);
  }
  return new RegExp(`^${anyDepth ? '(?:.*/)?' : ''}${re}$`, 'i');
}
const matchAny = (res, p) => res.some((r) => r.test(p));

/** Decode common obfuscations so encoded paths and links still match. */
export function normalise(line) {
  let s = line;
  for (let i = 0; i < 2; i++) {
    s = s
      .replace(/%([0-9a-f]{2})/gi, (m, h) => { const c = parseInt(h, 16); return c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : m; })
      .replace(/&#x([0-9a-f]{1,4});/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d{1,4});/g, (m, d) => String.fromCharCode(Number(d)))
      .replace(/\\u([0-9a-f]{4})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u\{([0-9a-f]{1,6})\}/gi, (m, h) => { const c = parseInt(h, 16); return c <= 0x10ffff ? String.fromCodePoint(c) : m; })
      .replace(/\\x([0-9a-f]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/["'`]\s*\+\s*["'`]/g, '')
      .replace(/&period;/gi, '.').replace(/&sol;/gi, '/').replace(/\\\//g, '/');
  }
  return s.replace(/\p{Cf}/gu, '').normalize('NFKC');
}

export const MIN_DENY_NAMES = 10;

/** Deny entries: names (string or {name, caseSensitive}) and prefixes (string or {prefix, anywhere}). */
function compileDeny(denyNames = [], denyPrefixes = []) {
  const out = [];
  let idx = 0;
  for (const e of denyNames) {
    const name = typeof e === 'string' ? e : e.name;
    const cs = typeof e === 'object' && e.caseSensitive === true;
    const words = String(name).split(/[\s_-]+/).filter(Boolean).map(escapeRe);
    if (!words.length) continue;
    idx++;
    const joinWords = (ws) => ws.join('[\\s_-]*');
    let body = joinWords(words);
    if (cs) {
      // case-sensitive entries still match the title-case and UPPER-case forms
      const raw = String(name).split(/[\s_-]+/).filter(Boolean);
      const title = raw.map((w) => escapeRe(w[0].toUpperCase() + w.slice(1).toLowerCase()));
      const upper = raw.map((w) => escapeRe(w.toUpperCase()));
      body = [...new Set([joinWords(words), joinWords(title), joinWords(upper)])].join('|');
    }
    out.push({ idx, re: new RegExp(`(?<![A-Za-z0-9])(?:${body})(?![A-Za-z0-9])`, cs ? 'g' : 'gi') });
  }
  for (const e of denyPrefixes) {
    const pre = typeof e === 'string' ? e : e && e.prefix;
    if (!pre) continue;
    idx++;
    const body = `${escapeRe(String(pre))}(?=[A-Za-z0-9])`;
    if (typeof e === 'object' && e.anywhere === true) out.push({ idx, re: new RegExp(`(?<![A-Za-z0-9])${body}`, 'gi') });
    else {
      // Token context only: a leading "--", ".", "#", quote or backtick; or a space inside a class/style attribute line.
      out.push({ idx, re: new RegExp(`(?<=--|[.#"'\`])${body}`, 'gi') });
      out.push({ idx, re: new RegExp(`(?<=\\s)${body}`, 'gi'), when: /\bclass(?:Name|List)?\b|@apply|\bstyle\b/ });
    }
  }
  return out;
}

const GLOB_CHARS = /[*?[\]{}]/;
/** A release exemption string that is only a domain, a path stem or a token prefix would hide too much. */
export function weakExemption(str) {
  const t = String(str);
  if (/\s/.test(t)) return t.trim().length < 8;
  if (t.length < 12) return true;
  if (/[/\\_.:-]$/.test(t)) return true;
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(t)) return true;
  if (t.startsWith('/') && t.split('/').filter(Boolean).length <= 2) return true;
  return false;
}

function compileAllow(entries = [], release = false) {
  const out = [];
  for (const s of DEFAULT_ALLOW_STRINGS) out.push({ re: /.*/, string: s, sha: null });
  for (const e of entries) {
    if (!e || !e.path || !e.string) continue; // empty placeholder entries are ignored
    if (release) {
      const why = [];
      if (GLOB_CHARS.test(e.path) || e.path.startsWith('/') || e.path.startsWith('./') || e.path.split('/').includes('..')) why.push('path must be a literal root-anchored path');
      if (!/^[0-9a-f]{64}$/i.test(e.lineSha256 || '')) why.push('lineSha256 (64 hex) is required');
      if (weakExemption(e.string)) why.push('string is only a domain, path stem or token prefix, or too short');
      if (why.length) throw new Error(`release: allow entry for "${e.path}" rejected: ${why.join('; ')}`);
      out.push({ re: new RegExp(`^${escapeRe(e.path)}$`), string: e.string, sha: e.lineSha256.toLowerCase() });
    } else out.push({ re: globToRegExp(e.path), string: e.string, sha: e.lineSha256 || null });
  }
  return out;
}

function splitLines(text) { return text.split(/\r?\n/); }

/** 'utf16le' | 'utf16be' | 'binary' | 'text' from the first bytes. */
export function classify(head) {
  if (head.length >= 2 && head[0] === 0xff && head[1] === 0xfe) return 'utf16le';
  if (head.length >= 2 && head[0] === 0xfe && head[1] === 0xff) return 'utf16be';
  if (!head.includes(0)) return 'text';
  let odd = 0, even = 0;
  for (let i = 0; i < head.length; i++) if (head[i] === 0) { if (i % 2) odd++; else even++; }
  const nul = odd + even;
  if (nul >= head.length * 0.3) { if (odd >= nul * 0.9) return 'utf16le'; if (even >= nul * 0.9) return 'utf16be'; }
  return 'binary';
}
function decodeUtf16(buf, kind) {
  let b = buf;
  if (kind === 'utf16be') { b = Buffer.from(buf.subarray(0, buf.length - (buf.length % 2))); b.swap16(); }
  const t = b.toString('utf16le');
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}

function* readLines(file) {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1 << 20);
    const dec = new StringDecoder('utf8');
    let rest = '';
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      rest += dec.write(buf.subarray(0, n));
      const parts = rest.split(/\r?\n/);
      rest = parts.pop();
      yield* parts;
    }
    rest += dec.end();
    yield rest;
  } finally { closeSync(fd); }
}

function headOf(file) {
  const fd = openSync(file, 'r');
  try {
    const b = Buffer.alloc(8000);
    const n = readSync(fd, b, 0, 8000, null);
    return b.subarray(0, n);
  } finally { closeSync(fd); }
}

function* fileChunks(file) {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1 << 20);
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      yield Buffer.from(buf.subarray(0, n));
    }
  } finally { closeSync(fd); }
}

/** Printable ASCII runs (and UTF-16 runs) inside binary content. */
function* binaryStrings(chunks) {
  let tail = '';
  for (const chunk of chunks) {
    const text = tail + chunk.latin1Slice(0, chunk.length);
    tail = '';
    for (const r of text.match(/[\x20-\x7e]{6,}/g) || []) { if (text.endsWith(r)) tail = r; else yield r; }
    for (const r of text.match(/(?:[\x20-\x7e]\x00){6,}/g) || []) yield r.replace(/\x00/g, '');
    for (const r of text.match(/(?:\x00[\x20-\x7e]){6,}/g) || []) yield r.replace(/\x00/g, '');
  }
  if (tail) yield tail;
}

function indexContent(root, rel) {
  return execFileSync('git', ['-C', root, 'show', `:./${rel}`], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
}

function listFiles(root, useGit, release) {
  if (useGit) {
    const args = ['-C', root, 'ls-files', '-z', '--cached'];
    if (!release) args.push('--others', '--exclude-standard');
    const out = execFileSync('git', args, { maxBuffer: 1 << 28 });
    return [...new Set(out.toString('utf8').split('\0').filter(Boolean))].sort();
  }
  const files = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { files.push({ unreadable: relative(root, dir).split(sep).join('/') }); return; }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '.git' && e.name !== 'node_modules') walk(full); }
      else files.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(root);
  return files;
}

export function isGitRepo(root) {
  try { return execFileSync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'true'; } catch { return false; }
}

export function isDirty(root) {
  return execFileSync('git', ['-C', root, 'status', '--porcelain', '-z', '--untracked-files=all', '--', '.'], { maxBuffer: 1 << 28 }).length > 0;
}

/** Per-file scanner holding the cross-line state. */
class FileScan {
  constructor(rel, ctx) {
    this.rel = rel; this.ctx = ctx; this.findings = []; this.seen = new Set(); this.hasLink = false;
    this.prev = ''; this.listMode = false; this.inBlock = false;
    this.kindBanned = MD_RE.test(rel) ? 'text' : HTML_RE.test(rel) ? 'text' : /\.json$/i.test(rel) ? 'json' : JS_RE.test(rel) ? 'js' : null;
    this.isMd = MD_RE.test(rel);
  }
  add(line, kind, message) {
    const k = `${line}|${kind}|${message}`;
    if (this.seen.has(k)) return;
    this.seen.add(k);
    this.findings.push({ path: this.rel, line, kind, message });
  }
  allowed(raw, text, a, b) {
    for (const e of this.ctx.allow) {
      if (!e.re.test(this.rel)) continue;
      let i = text.indexOf(e.string);
      while (i !== -1) {
        if (i <= a && i + e.string.length >= b && (!e.sha || sha(raw) === e.sha)) return true;
        i = text.indexOf(e.string, i + 1);
      }
    }
    return false;
  }
  /** Links, paths, names, secrets. No inline marker can silence these. */
  hard(raw, ln, note = '') {
    const variants = [raw];
    const n = normalise(raw);
    if (n !== raw) variants.push(n);
    for (const v of variants) {
      for (const [re, label] of PRIVATE_LINKS) for (const m of v.matchAll(re)) if (!this.allowed(raw, v, m.index, m.index + m[0].length)) this.add(ln, 'private-link', `${label}${note}`);
      for (const d of this.ctx.deny) {
        if (d.when && !d.when.test(v)) continue;
        for (const m of v.matchAll(d.re)) if (!this.allowed(raw, v, m.index, m.index + m[0].length)) this.add(ln, 'in-house-name', `in-house name (deny entry ${d.idx})${note}`);
      }
      for (const [re, label, ok] of SECRETS) for (const m of v.matchAll(re)) if ((!ok || ok(m)) && !this.allowed(raw, v, m.index, m.index + m[0].length)) this.add(ln, 'secret', `possible secret: ${label}${note}`);
    }
    if (LINK_RE.test(raw)) this.hasLink = true;
  }
  /** Names split over a line break: match the previous line joined to this one, report the first line. */
  joined(prevRaw, raw, ln) {
    if (!this.ctx.deny.length || prevRaw === '' ) return;
    const joined = `${prevRaw}\n${raw}`;
    const variants = [joined];
    const n = normalise(joined);
    if (n !== joined) variants.push(n);
    for (const v of variants) {
      const cut = v === joined ? prevRaw.length : normalise(prevRaw).length;
      for (const d of this.ctx.deny) {
        if (d.when && !d.when.test(v)) continue;
        for (const m of v.matchAll(d.re)) {
          if (m.index < cut && m.index + m[0].length > cut + 1 && !this.allowed(joined, v, m.index, m.index + m[0].length)) this.add(ln - 1, 'in-house-name', `in-house name (deny entry ${d.idx}) split over a line break`);
        }
      }
    }
  }
  /** Banned claims. Escapes (markers, contested, do-not-claim) apply only here. */
  banned(raw, ln) {
    let text = raw;
    if (this.kindBanned === 'json') { if (!/"\$?description"\s*:/.test(raw)) return; }
    else if (this.kindBanned === 'js') {
      if (this.inBlock) { text = raw; if (raw.includes('*/')) this.inBlock = false; }
      else if (/^\s*\/\*/.test(raw) || /^\s*\*/.test(raw)) { text = raw; if (/^\s*\/\*/.test(raw) && !raw.includes('*/')) this.inBlock = true; }
      else { const i = raw.search(/(?<!:)\/\//); if (i === -1) return; text = raw.slice(i); }
    }
    // list-mode tracking (markdown only)
    if (this.isMd) {
      const isList = /^\s*([-*+>]|\d+[.)])\s/.test(raw);
      if (!isList && (NEG_HEADER.test(raw) || (BANNED_HEADER.test(raw) && (/^\s*#/.test(raw) || /:\s*$/.test(raw))))) this.listMode = true;
      else if (raw.trim() !== '' && !isList) this.listMode = false;
    }
    const markered = MARKER_ALLOW_BANNED.test(this.prev) || MARKER_ALLOW_BANNED.test(raw);
    for (const re of BANNED) {
      for (const m of text.matchAll(G(re))) {
        if (markered || this.allowed(raw, raw, raw.indexOf(text) + m.index, raw.indexOf(text) + m.index + m[0].length)) continue;
        const before = text.slice(0, m.index);
        const after = text.slice(m.index + m[0].length);
        const sentence = `${before.split(/[.!?;]\s/).pop()}${m[0]}${after.split(/[.!?;](?:\s|$)/)[0]}`;
        if (/\bcontested\b/i.test(sentence)) continue;
        if (negatedBefore(before)) continue;
        if (this.listMode && /^\s*([-*+>]|\d+[.)])\s/.test(raw)) continue;
        this.add(ln, 'banned-claim', `banned claim word "${m[0]}"`);
      }
    }
  }
  line(raw, ln) {
    this.hard(raw, ln);
    this.joined(this.prev, raw, ln);
    if (this.kindBanned) this.banned(raw, ln);
    this.prev = raw;
  }
}

function findLicense(root) {
  for (const n of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'License']) {
    const p = join(root, n);
    if (existsSync(p)) return p;
  }
  return null;
}

export function checkTree(rootIn, cfg = {}) {
  const root = resolve(rootIn);
  const release = cfg.release === true;
  if (release) {
    if ((cfg.ignorePaths || []).length) throw new Error('release: ignorePaths is not allowed');
    if (!isGitRepo(root)) throw new Error('release: the directory must be inside a git work tree');
    if (isDirty(root)) throw new Error('release: the working tree is dirty; commit or stash first (the scan reads the git index)');
  }
  const ctx = { deny: compileDeny(cfg.denyNames, cfg.denyPrefixes), allow: compileAllow(cfg.allow, release) };
  const ignoreRes = (cfg.ignorePaths || []).map(globToRegExp);
  const linkRes = (cfg.requireLinkIn || ['**/*.md', '**/*.mdx']).map(globToRegExp);
  const useGit = release ? true : cfg.git === undefined ? isGitRepo(root) : cfg.git;
  const findings = [];
  let scanned = 0;

  for (const entry of listFiles(root, useGit, release)) {
    if (typeof entry === 'object') { findings.push({ path: entry.unreadable || '.', line: 1, kind: 'unscannable', message: 'directory could not be read' }); continue; }
    const rel = entry;
    if (matchAny(ignoreRes, rel)) continue;
    const full = join(root, rel);
    const fs = new FileScan(rel, ctx);
    fs.hard(rel, 1, ' (in file name)');
    try {
      const st = lstatSync(full);
      if (st.isSymbolicLink()) {
        const target = readlinkSync(full);
        fs.hard(target, 1, ' (in symlink target)');
        const abs = resolve(dirname(full), target);
        const r = relative(root, abs);
        if (r.startsWith('..') || isAbsolute(r)) fs.add(1, 'symlink', 'symlink points outside the scanned root');
        findings.push(...fs.findings); scanned++;
        continue;
      }
      if (!st.isFile()) { findings.push({ path: rel, line: 1, kind: 'unscannable', message: 'not a regular file (directory or submodule)' }); continue; }
      const base = basename(rel);
      if (/^\.env(\..+)?$/i.test(base) && !/\.(?:example|sample|template)$/i.test(base)) fs.add(1, 'secret', 'environment file should not be published');
      const buf = release ? indexContent(root, rel) : null;
      const kind = classify(buf ? buf.subarray(0, 8000) : headOf(full));
      if (kind === 'text') {
        let ln = 0;
        for (const raw of buf ? splitLines(buf.toString('utf8')) : readLines(full)) fs.line(raw, ++ln);
      } else if (kind === 'utf16le' || kind === 'utf16be') {
        let ln = 0;
        for (const raw of splitLines(decodeUtf16(buf || readFileSync(full), kind))) fs.line(raw, ++ln);
      } else {
        for (const s of binaryStrings(buf ? [buf] : fileChunks(full))) fs.hard(s, 1, ' (binary file)');
      }
    } catch (e) {
      findings.push({ path: rel, line: 1, kind: 'unscannable', message: `could not be scanned: ${e.code || e.message}` });
      continue;
    }
    scanned++;
    findings.push(...fs.findings);
    if ((basename(rel).toLowerCase() === 'skill.md' || matchAny(linkRes, rel)) && !fs.hasLink) {
      findings.push({ path: rel, line: 1, kind: 'missing-link', message: `missing required link ${SITE}` });
    }
  }

  if (cfg.requireLicense !== false) {
    const lic = findLicense(root);
    if (!lic) findings.push({ path: 'LICENSE', line: 1, kind: 'license', message: 'no LICENSE file in the scanned root' });
    else {
      const t = readFileSync(lic, 'utf8').trimStart();
      if (!t.startsWith('MIT License')) findings.push({ path: relative(root, lic), line: 1, kind: 'license', message: 'LICENSE must start with "MIT License"' });
      else if (!t.includes('Permission is hereby granted, free of charge')) findings.push({ path: relative(root, lic), line: 1, kind: 'license', message: 'LICENSE lacks the MIT permission sentence' });
    }
  }
  return { scanned, findings, mode: release ? 'release (git index)' : useGit ? 'git' : 'walk' };
}

function loadJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { throw new Error(`cannot read ${p}: ${e.message}`); }
}

const USAGE = 'usage: check-public.mjs <dir> [--allow allow.json] [--deny deny.json] [--deny-sha256 hex] [--release] [--git|--no-git] [--json]\nexit: 0 clean, 1 findings, 2 usage error (--release without a full --deny file, with ignorePaths, or on a dirty tree is an error)';

function main(argv) {
  const args = argv.slice(2);
  const o = { denySha: null, json: false, allow: null, deny: null, dir: null, release: false, git: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') o.json = true;
    else if (a === '--release') o.release = true;
    else if (a === '--git') o.git = true;
    else if (a === '--no-git') o.git = false;
    else if (a === '--allow') o.allow = args[++i];
    else if (a === '--deny') o.deny = args[++i];
    else if (a === '--deny-sha256') o.denySha = (args[++i] || '').toLowerCase();
    else if (a === '-h' || a === '--help') { console.log(USAGE); return 0; }
    else if (!o.dir) o.dir = a;
    else { console.error(`unexpected argument: ${a}`); return 2; }
  }
  if (!o.dir) { console.error(USAGE); return 2; }
  try {
    if (o.release && !o.deny) throw new Error('--release needs --deny <file>: the private deny list must be supplied');
    if (o.denySha !== null && !/^[0-9a-f]{64}$/.test(o.denySha)) throw new Error('--deny-sha256 needs 64 hex characters');
    if (o.release && !o.denySha) throw new Error('--release needs --deny-sha256 <hex> to pin the deny file');
    if (o.denySha && !o.deny) throw new Error('--deny-sha256 needs --deny');
    if (o.deny && o.denySha && sha(readFileSync(o.deny)) !== o.denySha) throw new Error('the deny file does not match --deny-sha256 (changed or wrong file)');
    if (o.git === true && !isGitRepo(o.dir)) throw new Error('--git given but the directory is not inside a git work tree');
    const allow = o.allow ? loadJson(o.allow) : {};
    let deny = {};
    if (o.deny) {
      deny = loadJson(o.deny);
      if (Array.isArray(deny)) deny = { denyNames: deny };
      deny.denyNames = [...(deny.denyNames || []), ...(deny.deny || [])];
      if (o.release) {
        const names = deny.denyNames.map((e) => (typeof e === 'string' ? e : e && e.name)).filter((n) => typeof n === 'string' && n.trim().length >= 3);
        if (names.length < MIN_DENY_NAMES) throw new Error(`release: the deny file needs at least ${MIN_DENY_NAMES} names of 3 or more characters (found ${names.length})`);
      }
    } else console.error('warning: no --deny file given, in-house names are not checked');
    const cfg = {
      ignorePaths: allow.ignorePaths, requireLinkIn: allow.requireLinkIn, allow: allow.allow,
      requireLicense: o.release ? true : allow.requireLicense, denyNames: deny.denyNames, denyPrefixes: deny.denyPrefixes, git: o.git, release: o.release,
    };
    const { scanned, findings, mode } = checkTree(o.dir, cfg);
    const counts = {};
    for (const f of findings) counts[f.kind] = (counts[f.kind] || 0) + 1;
    if (o.json) console.log(JSON.stringify({ ok: findings.length === 0, mode, scanned, total: findings.length, counts, findings }, null, 2));
    else {
      for (const f of findings) console.log(`${f.path}:${f.line}: [${f.kind}] ${f.message}`);
      const by = Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ');
      console.log(`${findings.length === 0 ? 'OK' : 'FAIL'}: ${findings.length} finding(s) in ${scanned} file(s) scanned, ${mode} mode${by ? ` (${by})` : ''}`);
    }
    return findings.length ? 1 : 0;
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main(process.argv);
