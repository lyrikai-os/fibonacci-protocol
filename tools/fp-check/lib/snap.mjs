// Snap mapping (FP-SNAP-01 to FP-SNAP-07, FP-SNAP-10). Integer arithmetic where a limit is compared.
import { ladder, RADIUS_SET, roundHalfUp } from './util.mjs';

export const EXEMPT_ROLES = new Set(['icon', 'type', 'breakpoint', 'drawn', 'micro']);
export const TOP_RUNG = 1597;

/** Ladder target (FP-CTRL-01 table): coarse or unknown pointer vs fine, by u. */
export function ladderTarget(u, pointer) {
  const fine = pointer === 'fine';
  return ({ 1: fine ? 34 : 55, 4: fine ? 32 : 52, 8: fine ? 24 : 64 })[u];
}

/** Nearest candidate by absolute distance; a tie goes to the larger (FP-SNAP-02). */
export function nearest(v, candidates) {
  let best = null;
  for (const c of candidates) {
    const d = Math.abs(c - v);
    if (best === null || d < best.d || (d === best.d && c > best.c)) best = { c, d };
  }
  return best.c;
}

export const driftPct = (orig, to) => roundHalfUp((Math.abs(to - orig) / orig) * 100, 1);

/** Map one non-exempt length. Returns { snapped|null, nearest?, drift, note? }. */
export function mapLength(v, group, u) {
  if (v === 0 || v === 1 || v === 2) {
    // 0, 1 and 2 are exempt by value; at u = 1 they are also rungs, so no note is needed there.
    return { snapped: v, drift: 0, ...(v === 0 || v < u ? { note: 'exempt by value' } : {}) };
  }
  const candidates = group === 'radius' ? RADIUS_SET : ladder(u);
  const n = nearest(v, candidates);
  const over = Math.abs(n - v) * 4 > v || (group !== 'radius' && v > 1.25 * TOP_RUNG);
  if (over) return { snapped: null, nearest: n, drift: driftPct(v, n), note: 'drift over 25%: kept unchanged as an exception (snap-drift)' };
  return { snapped: n, drift: driftPct(v, n) };
}

/** Map a target token (FP-SNAP-04): never below max(original, ladder target). */
export function mapTarget(v, u, pointer) {
  const lt = ladderTarget(u, pointer);
  const minimum = Math.max(v, lt);
  const snapped = ladder(u).find((r) => r >= minimum) ?? minimum;
  return { snapped, minimum, keepAllowed: v >= lt, drift: null, note: 'target: never below max(original, ladder target); no drift limit' };
}

/** Group tokens that the default mapping (before overrides) sends to one rung; a merge holds at least two distinct originals. */
export function findMerges(rows) {
  const out = [];
  for (const role of ['space', 'radius', 'target']) {
    const by = new Map();
    for (const r of rows) {
      if (r.role !== role || r.snapped === null || r.snapped === undefined) continue;
      if (!by.has(r.snapped)) by.set(r.snapped, []);
      by.get(r.snapped).push(r);
    }
    for (const [rung, list] of by) {
      if (list.length > 1 && new Set(list.map((r) => r.original)).size > 1) out.push({ role, rung, tokens: list.map((r) => r.token) });
    }
  }
  return out;
}

/** Order within each group (FP-SNAP-05): adjacent pairs in original order must not decrease. */
export function findOrderBreaches(rows) {
  const out = [];
  for (const role of ['space', 'radius', 'target']) {
    const g = rows.filter((r) => r.role === role).sort((a, b) => a.original - b.original || a.final - b.final);
    for (let i = 0; i + 1 < g.length; i++) {
      const a = g[i]; const b = g[i + 1];
      if (a.final > b.final || (a.original === b.original && a.final !== b.final)) {
        out.push({ tokens: [a.token, b.token], original: [a.original, b.original], final: [a.final, b.final], check: 'snap.monotonic', rule: 'FP-SNAP-05', result: 'fail' });
      }
    }
  }
  return out;
}
