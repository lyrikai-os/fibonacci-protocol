// Small shared helpers. No dependencies.
export const PHI = (1 + Math.sqrt(5)) / 2;

/** Round half up to `digits` decimals (FP-MATH-08). A tiny epsilon absorbs binary noise. */
export function roundHalfUp(x, digits = 0) {
  const f = 10 ** digits;
  return Math.floor(x * f + 0.5 + 1e-9) / f;
}

/** Truncate (not round) to `digits` decimals; a contrast ratio is never rounded (FP-A11Y-02). */
export function truncate(x, digits = 3) {
  const f = 10 ** digits;
  return Math.floor(x * f + 1e-9) / f;
}

export const posix = (p) => p.split('\\').join('/');
export const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Lines (1-based) of a character offset. */
export function lineAt(text, idx) {
  let n = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

export const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
export const CONTAINERS = [610, 987, 1597];
export const RADIUS_SET = [0, 2, 3, 5, 8, 13, 21];
export const FIXED_DETAIL_SET = [0, 1, 2, 3];

/** The length ladder at unit u (FP-MATH-03, FP-MATH-06, FP-MATH-07): F x u for F >= 1, sub-unit 1 and 2, containers fixed. */
export function ladder(u = 1) {
  const set = new Set([1, 2]);
  for (const f of FIB) set.add(f * u);
  for (const c of CONTAINERS) set.add(c);
  return [...set].sort((a, b) => a - b);
}

export function isRung(px, u = 1) {
  const v = Math.abs(px);
  return v === 0 || ladder(u).includes(v);
}
