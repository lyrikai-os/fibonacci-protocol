// A small JSON Schema 2020-12 validator covering the keywords fp.config.schema.json uses:
// $ref (local), type, enum, const, pattern, minLength, minimum, minItems, items, properties,
// required, additionalProperties, allOf, anyOf, oneOf, not, if/then/else. Annotation keywords
// ($schema, $id, title, description, default, $defs) are ignored. Unknown keywords are ignored.

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function isType(v, t) {
  switch (t) {
    case 'string': return typeof v === 'string';
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'integer': return typeof v === 'number' && Number.isInteger(v);
    case 'boolean': return typeof v === 'boolean';
    case 'object': return v !== null && typeof v === 'object' && !Array.isArray(v);
    case 'array': return Array.isArray(v);
    case 'null': return v === null;
    default: return false;
  }
}

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function resolveRef(ref, root) {
  if (!ref.startsWith('#')) throw new Error(`unsupported $ref ${ref}`);
  let node = root;
  const parts = ref.slice(1).split('/').filter(Boolean).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  for (const p of parts) node = node?.[p];
  if (node === undefined) throw new Error(`unresolved $ref ${ref}`);
  return node;
}

/** Returns an array of { path, message } errors (empty when valid). */
export function validate(schema, data, root = schema) {
  const errors = [];
  walk(schema, data, '', errors, root);
  return errors;
}

function sub(schema, data, p, root) {
  const e = [];
  walk(schema, data, p, e, root);
  return e;
}

function walk(schema, data, p, errors, root) {
  if (schema === true || schema === undefined) return;
  if (schema === false) { errors.push({ path: p || '/', message: 'is not allowed' }); return; }
  const at = p || '/';

  if (schema.$ref) walk(resolveRef(schema.$ref, root), data, p, errors, root);

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => isType(data, t))) {
      errors.push({ path: at, message: `must be ${types.join(' or ')}, got ${typeOf(data)}` });
      return; // later keywords assume the type
    }
  }
  if (schema.const !== undefined && !deepEqual(schema.const, data)) {
    errors.push({ path: at, message: `must equal ${JSON.stringify(schema.const)}` });
  }
  if (schema.enum && !schema.enum.some((x) => deepEqual(x, data))) {
    errors.push({ path: at, message: `must be one of ${schema.enum.map((x) => JSON.stringify(x)).join(', ')}` });
  }
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && [...data].length < schema.minLength) errors.push({ path: at, message: `must have at least ${schema.minLength} character(s)` });
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(data)) errors.push({ path: at, message: `must match pattern ${schema.pattern}` });
  }
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push({ path: at, message: `must be >= ${schema.minimum}` });
    if (schema.maximum !== undefined && data > schema.maximum) errors.push({ path: at, message: `must be <= ${schema.maximum}` });
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push({ path: at, message: `must have at least ${schema.minItems} item(s)` });
    if (schema.uniqueItems && new Set(data.map((x) => JSON.stringify(x))).size !== data.length) errors.push({ path: at, message: 'must not contain duplicate items' });
    if (schema.items !== undefined) data.forEach((x, i) => walk(schema.items, x, `${p}/${i}`, errors, root));
  }
  if (isType(data, 'object')) {
    for (const r of schema.required || []) {
      if (!(r in data)) errors.push({ path: at, message: `is missing required property "${r}"` });
    }
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(data)) {
      if (k in props) walk(props[k], v, `${p}/${k}`, errors, root);
      else if (schema.additionalProperties === false) errors.push({ path: `${p}/${k}`, message: 'is not an allowed property' });
      else if (isType(schema.additionalProperties, 'object')) walk(schema.additionalProperties, v, `${p}/${k}`, errors, root);
    }
  }
  for (const s of schema.allOf || []) walk(s, data, p, errors, root);
  if (schema.anyOf && !schema.anyOf.some((s) => sub(s, data, p, root).length === 0)) {
    errors.push({ path: at, message: 'must match at least one of the allowed alternatives' });
  }
  if (schema.oneOf) {
    const n = schema.oneOf.filter((s) => sub(s, data, p, root).length === 0).length;
    if (n !== 1) errors.push({ path: at, message: `must match exactly one alternative (matched ${n})` });
  }
  if (schema.not && sub(schema.not, data, p, root).length === 0) errors.push({ path: at, message: 'must not match the excluded schema' });
  if (schema.if !== undefined) {
    const ok = sub(schema.if, data, p, root).length === 0;
    if (ok && schema.then) walk(schema.then, data, p, errors, root);
    if (!ok && schema.else) walk(schema.else, data, p, errors, root);
  }
}
