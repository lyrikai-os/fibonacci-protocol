// A plain-CSS reader (FP-CONF-08): style rules, nested rules, at-rules, custom properties.
// It does not compute the cascade and does not read CSS-in-JS, preprocessor source or inline style attributes.
import { collapse, lineAt } from './util.mjs';

/** Replace comments by spaces of equal length, keeping newlines, so offsets and line numbers stay true. */
export function stripComments(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      const q = c; out += c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') { out += text[i++]; } out += text[i++]; }
      out += text[i] ?? '';
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
    } else out += c;
  }
  return out;
}

/** Scan from `i` to the first top-level `{`, `;` or `}`; returns [index, char]. Respects strings, () and []. */
function scanTo(text, i) {
  let paren = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; i++; }
    } else if (c === '(' || c === '[') paren++;
    else if (c === ')' || c === ']') paren = Math.max(0, paren - 1);
    else if (paren === 0 && (c === '{' || c === ';' || c === '}')) return [i, c];
  }
  return [text.length, ''];
}

/** Find the `}` matching the `{` at `i`. */
function matchBrace(text, i) {
  let depth = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; i++; }
    } else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return text.length;
}

const GROUPING = /^@(media|supports|layer|container|document|scope|starting-style)\b/i;
const OPAQUE = /^@(font-face|page|property|counter-style|font-feature-values|font-palette-values|view-transition|position-try)\b/i;

/**
 * parseCss(text, { file, lineOffset }) -> { rules, customProps, atRules }
 * rules: [{ selector, decls: [{ prop, value, important, line }], line, at: [prelude...], kind }]
 *   kind: 'style' | 'keyframe' | 'opaque'
 */
export function parseCss(source, { file = '', lineOffset = 0 } = {}) {
  const text = stripComments(source);
  const rules = [];
  const customProps = [];
  const atRules = [];

  function parseBody(start, end, ctx) {
    // ctx: { selector, at: [], kind, rule }
    let i = start;
    while (i < end) {
      while (i < end && /\s/.test(text[i])) i++;
      if (i >= end) break;
      const [idx, ch] = scanTo(text, i);
      const stop = Math.min(idx, end);
      const head = text.slice(i, stop);
      const headTrim = head.trim();
      if (ch === '{' && idx < end) {
        const close = matchBrace(text, idx);
        const inner = [idx + 1, Math.min(close, end)];
        const isCustomDecl = /^--[^\s:]*\s*:/.test(headTrim);
        if (isCustomDecl) {
          // custom property whose value holds braces
          addDecl(head, ctx, lineAt(source, i) + lineOffset, text.slice(i, close + 1).replace(/^[^:]*:/, ''));
          i = close + 1;
          if (text[i] === ';') i++;
          continue;
        }
        if (headTrim.startsWith('@')) {
          atRules.push({ prelude: collapse(headTrim), file, line: lineAt(source, i) + lineOffset });
          if (GROUPING.test(headTrim)) {
            const at = [...ctx.at, collapse(headTrim)];
            if (ctx.rule && ctx.kind === 'style') {
              // a conditional group nested in a style rule is a rule of the same selector (CSS nesting), linked to its parent
              const r = { selector: ctx.selector, decls: [], line: lineAt(source, i) + lineOffset, at, kind: 'style', parent: ctx.rule };
              rules.push(r);
              parseBody(inner[0], inner[1], { selector: ctx.selector, at, kind: 'style', rule: r });
            } else parseBody(inner[0], inner[1], { selector: ctx.selector, at, kind: ctx.kind, rule: null });
          } else if (/^@(-\w+-)?keyframes\b/i.test(headTrim)) {
            parseBody(inner[0], inner[1], { selector: '', at: [...ctx.at, collapse(headTrim)], kind: 'keyframes', rule: null });
          } else if (OPAQUE.test(headTrim)) {
            const r = { selector: collapse(headTrim), decls: [], line: lineAt(source, i) + lineOffset, at: ctx.at, kind: 'opaque' };
            rules.push(r);
            parseBody(inner[0], inner[1], { selector: r.selector, at: ctx.at, kind: 'opaque', rule: r });
          } else {
            parseBody(inner[0], inner[1], { selector: ctx.selector, at: [...ctx.at, collapse(headTrim)], kind: ctx.kind, rule: null });
          }
        } else {
          const sel = collapse(headTrim);
          const full = ctx.kind === 'style' && ctx.selector ? (sel.includes('&') ? sel.replace(/&/g, ctx.selector) : `${ctx.selector} ${sel}`) : sel;
          const kind = ctx.kind === 'keyframes' ? 'keyframe' : 'style';
          const r = { selector: full, decls: [], line: lineAt(source, i) + lineOffset, at: ctx.at, kind };
          rules.push(r);
          parseBody(inner[0], inner[1], { selector: full, at: ctx.at, kind, rule: r });
        }
        i = close + 1;
      } else {
        // declaration or statement at-rule, ends at ; or }
        if (headTrim) {
          if (headTrim.startsWith('@')) atRules.push({ prelude: collapse(headTrim), file, line: lineAt(source, i) + lineOffset });
          else if (ctx.rule) addDecl(head, ctx, lineAt(source, i + (head.length - head.trimStart().length)) + lineOffset);
        }
        i = stop + 1;
      }
    }
  }

  function addDecl(head, ctx, line, valueOverride) {
    let prop, value;
    if (valueOverride !== undefined) {
      prop = head.slice(0, head.indexOf(':')).trim();
      value = valueOverride;
    } else {
      const c = head.indexOf(':');
      if (c < 0) return;
      prop = head.slice(0, c).trim();
      value = head.slice(c + 1);
    }
    let important = false;
    value = collapse(value);
    if (/!\s*important$/i.test(value)) { important = true; value = value.replace(/\s*!\s*important$/i, ''); }
    if (!prop) return;
    const decl = { prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value, important, line };
    ctx.rule.decls.push(decl);
    if (decl.prop.startsWith('--')) customProps.push({ name: decl.prop, value, selector: ctx.selector, at: ctx.at, file, line });
  }

  parseBody(0, text.length, { selector: '', at: [], kind: 'style', rule: null });
  return { rules, customProps, atRules };
}

/** Pull `<style>` blocks out of an HTML file, with the line each starts on. */
export function extractStyleBlocks(html) {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const bodyStart = m.index + m[0].indexOf('>') + 1;
    out.push({ css: m[1], lineOffset: lineAt(html, bodyStart) - 1 });
  }
  return out;
}

/** Split a selector list on top-level commas. */
export function splitSelectors(sel) {
  const out = []; let depth = 0; let cur = '';
  for (const c of sel) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
