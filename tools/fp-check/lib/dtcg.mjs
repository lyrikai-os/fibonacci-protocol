// Token files in the protocol's format (DTCG 2025.10), FP-TOKEN-01 to FP-TOKEN-09.
export const EXT = 'com.lyrikai.fp';

/** Flatten a DTCG document to leaves: [{ path, token, type }]. Groups inherit $type. */
export function flatten(doc) {
  const out = [];
  (function rec(node, path, inherited) {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return;
    const type = node.$type ?? inherited;
    if ('$value' in node) { out.push({ path: path.join('.'), token: node, type }); return; }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      rec(v, [...path, k], type);
    }
  })(doc, [], undefined);
  return out;
}

/** Resolve {alias.path} references; returns the final $value or undefined. */
export function resolveAlias(value, byPath, depth = 0) {
  if (typeof value === 'string' && /^\{[^}]+\}$/.test(value) && depth < 20) {
    const t = byPath.get(value.slice(1, -1));
    return t ? resolveAlias(t.token.$value, byPath, depth + 1) : undefined;
  }
  return value;
}

/** A dimension value as px, or null. */
export function dimensionPx(v) {
  if (v && typeof v === 'object' && typeof v.value === 'number') {
    if (v.unit === 'px') return v.value;
    if (v.unit === 'rem') return v.value * 16;
  }
  if (typeof v === 'string') { const m = /^(-?[\d.]+)(px|rem)$/.exec(v.trim()); if (m) return parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1); }
  return null;
}

const RULE_ID = /^FP-[A-Z0-9]+-\d\d$/;
const PINNED = (path) => path === 'target' || path.startsWith('target.') || path === 'type.micro' || path === 'type.0' || path === 'type.body';

/** The FP-TOKEN machine tests on one protocol token document. Returns { check: [problems] }. */
export function checkTokenDoc(doc, fileName, { unit = 1 } = {}) {
  const p = { 'token.dtcg': [], 'token.types': [], 'token.names': [], 'token.master-unit': [], 'token.extensions': [], 'token.root-metadata': [], 'token.type-rem': [] };
  const add = (k, m) => p[k].push(m);
  if (!/\.tokens\.json$/.test(fileName)) add('token.dtcg', `${fileName}: a token file name ends in .tokens.json`);

  // names: every key that is not a $-property
  (function names(node, path) {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) { if (path.length > 0 && !['$value', '$type', '$description', '$extensions', '$deprecated'].includes(k)) add('token.names', `${[...path, k].join('/')}: a name must not begin with $`); continue; }
      if (/[{}.]/.test(k)) add('token.names', `${[...path, k].join('/')}: a name must not contain { } or .`);
      names(v, [...path, k]);
    }
  })(doc, []);

  const leaves = flatten(doc);
  const byPath = new Map(leaves.map((l) => [l.path, l]));
  for (const { path, token, type } of leaves) {
    if (!type) add('token.dtcg', `${path}: no $type on the token or an enclosing group`);
    const v = resolveAlias(token.$value, byPath);
    if (v === undefined) { add('token.dtcg', `${path}: $value is an alias that does not resolve`); continue; }
    if (type === 'dimension') {
      if (!(v && typeof v === 'object' && typeof v.value === 'number' && (v.unit === 'px' || v.unit === 'rem'))) add('token.types', `${path}: a dimension is { "value": number, "unit": "px" | "rem" }`);
    } else if (type === 'duration') {
      if (!(v && typeof v === 'object' && typeof v.value === 'number' && (v.unit === 'ms' || v.unit === 's'))) add('token.types', `${path}: a duration is { "value": number, "unit": "ms" | "s" }`);
    } else if (type === 'color') {
      if (!(v && typeof v === 'object' && typeof v.colorSpace === 'string' && Array.isArray(v.components))) add('token.types', `${path}: a colour has colorSpace and components`);
    } else if (type === 'cubicBezier') {
      if (!(Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number'))) add('token.types', `${path}: easing is cubicBezier [x1, y1, x2, y2]`);
    } else if (type === 'number') {
      if (typeof v !== 'number') add('token.types', `${path}: a ratio, opacity or layer is a number`);
    }
    const ext = token.$extensions?.[EXT];
    if (!ext || typeof ext.rule !== 'string' || !RULE_ID.test(ext.rule)) add('token.extensions', `${path}: $extensions["${EXT}"].rule must name a rule ID`);
    else if (PINNED(path) && ext.pinnedFloor !== true) add('token.extensions', `${path}: an accessibility floor must carry "pinnedFloor": true`);
    // FP-TOKEN-09 binds generated web type; the master is in px (FP-TOKEN-04). px and rem both pass; any other unit fails.
    if (path.startsWith('type.') && type === 'dimension' && v && typeof v === 'object' && v.unit !== 'rem' && v.unit !== 'px') add('token.type-rem', `${path}: web type sizes are in rem`);
    if (type === 'dimension' && v && typeof v === 'object' && v.unit !== 'px') add('token.master-unit', `${path}: the master stores lengths as px, found ${v.unit}`);
    if (path.startsWith('space.') && type === 'dimension') {
      const n = Number(path.slice(6)); const px = dimensionPx(v);
      if (Number.isInteger(n) && px !== null && Math.abs(px - n * unit) > 1e-9) add('token.master-unit', `${path}: expected ${n} x u = ${n * unit}px, found ${px}px`);
    }
  }

  // root metadata
  const rootExt = doc?.$extensions?.[EXT];
  if (!rootExt || typeof rootExt !== 'object') add('token.root-metadata', 'root $extensions["com.lyrikai.fp"] is missing');
  else {
    if (rootExt.homepage !== 'https://www.lyrikai.com') add('token.root-metadata', 'homepage must be https://www.lyrikai.com');
    if (typeof rootExt.spec !== 'string') add('token.root-metadata', 'spec version is missing');
    if (![1, 4, 8].includes(rootExt.unit)) add('token.root-metadata', 'unit must be 1, 4 or 8');
    else if (rootExt.unit !== unit) add('token.master-unit', `file records u=${rootExt.unit}, configuration declares u=${unit}`);
  }
  for (const [k, v] of Object.entries(doc || {})) {
    if (!k.startsWith('$') && (v === null || typeof v !== 'object' || Array.isArray(v))) add('token.root-metadata', `bare root key "${k}": metadata belongs in $extensions`);
  }
  return p;
}
