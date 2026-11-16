// The type scale (FP-TYPE-01 to FP-TYPE-03, FP-TYPE-07) on the web.
import { PHI, FIB } from './util.mjs';

export const MICRO_PX = 11;

const half = (x) => Math.floor(x + 0.5 + 1e-9);

/** Usable steps: -1 to 4, then even steps from 4 up (FP-TYPE-02). */
export const USABLE_STEPS = [-1, 0, 1, 2, 3, 4, 6, 8, 10, 12];
export const ODD_STEPS = [5, 7, 9, 11];

/** The size of step k at `body`, with or without the Fibonacci substitution (FP-TYPE-03). */
export function stepSize(k, body = 16, align = 'formula') {
  const raw = body * PHI ** (k / 2);
  if (align === 'fibonacci') {
    const f = FIB.find((n) => Math.abs(n - raw) <= 0.04 * raw);
    if (f !== undefined) return f;
  }
  return half(raw);
}

export const formulaSize = (k, body) => stepSize(k, body, 'formula');

/** Resolve a size in px to { step, kind } or null. kind: usable | odd. */
export function findStep(px, body, align, tol = 0.005) {
  for (const k of USABLE_STEPS) if (Math.abs(stepSize(k, body, align) - px) <= tol) return { step: k, kind: 'usable' };
  for (const k of ODD_STEPS) if (Math.abs(stepSize(k, body, align) - px) <= tol) return { step: k, kind: 'odd' };
  if (align === 'fibonacci') {
    for (const k of ODD_STEPS) if (Math.abs(stepSize(k, body, 'formula') - px) <= tol) return { step: k, kind: 'odd' };
  }
  // Under fibonacci, the unsubstituted rounded value of a usable step is the "formula" size that was replaced.
  if (align === 'fibonacci') {
    for (const k of USABLE_STEPS) {
      if (stepSize(k, body, 'formula') !== stepSize(k, body, 'fibonacci') && Math.abs(stepSize(k, body, 'formula') - px) <= tol) return { step: k, kind: 'replaced' };
    }
  }
  return null;
}

/** Line heights allowed at a step (FP-TYPE-07). Web, body = step 0. */
export function allowedLeading(step) {
  if (step === 'micro') return [1.382];
  if (step === -1) return [1.382, 1.236];
  if (step === 0) return [1.618, 1.5, 1.382, 1.236];
  if (step >= 1 && step <= 3) return [1.382, 1.236];
  if (step === 4) return [1.146, 1.382];
  return [1.146];
}

export const sameRatio = (a, b) => Math.abs(a - b) < 0.0005;
