# Test vectors

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

Each folder holds one case: the input files, an `fp.config.json` that validates against [fp.config.schema.json](../fp.config.schema.json), and `expected.json`, the result a conforming checker gives. [index.json](index.json) lists them.

The expected results are computed from the rule text by a small reference script, not by a published checker. They cover the core machine tests: lengths on the ladder at u = 1 and u = 4, the derived patterns, roles and exceptions, Snap mapping (ties, merges, drift, targets, overrides, order), the type scale in both alignments, contrast on declared pairs, the `n/a` contradiction test and Overlay coverage. They do not yet cover shorthand edge cases, `@media` blocks, themes, or the self-report rules.

A finding identifies a declaration by file, selector, property and value, once per written value. `checkedValues` and coverage count longhand values after shorthand expansion (FP-MODE-05). Drift is exact when compared with a limit and is shown rounded half-up to one decimal place. A `result` of `exception` means a declared, accepted exception covered the value; `pending` means a pending one did.

| Vector | Expected result | What it shows |
|---|---|---|
| [01-ladder-u1-pass](01-ladder-u1-pass/) | pass | Every checked length is a rung, 0, intrinsic, or in its fixed set. Negative rungs pass. |
| [02-ladder-u1-fail](02-ladder-u1-fail/) | fail | Off-ladder lengths, an off-set radius and an off-set stroke each fail. In a shorthand each value is tested. |
| [03-ladder-u4](03-ladder-u4/) | fail | At u = 4 the rungs are F × 4 plus the sub-unit values 1 and 2. Radius, stroke and container widths stay in platform units. 13 and 16 are not rungs; 2440 (610 × 4) is not a rung. |
| [04-derived](04-derived/) | fail | The two derived patterns pass: a φ split of a container, and a container minus one ladder token. Rung arithmetic, chaining, a non-rung operand, a non-φ factor, and a literal 987px in place of the container token fail. |
| [05-roles-and-exceptions](05-roles-and-exceptions/) | fail | Overlay tests resolved values. A host token that resolves to a rung passes; an icon-role token is not tested; a host token that is not a rung fails unless it is a declared exception (addressed by token or by selector). A pending exception makes the run pending when nothing else fails; here .b fails outright. |
| [06-snap-u1](06-snap-u1/) | pass | A 4-based scale at u = 1: nearest rung, ties go up (4 → 5), drift at most 25%, merges listed. Radii map to the radius set; 32 is over 25% from 21 and is not snapped. The values that cannot be snapped are declared as accepted snap-drift exceptions, so the run passes. |
| [07-snap-u4](07-snap-u4/) | pass | The same scale at u = 4: 2 is a sub-unit value and is kept; 6 drifts 33% and is not snapped; 16 is a tie between 12 and 20 and goes up. The values that cannot be snapped are declared as accepted snap-drift exceptions, so the run passes. |
| [08-snap-targets](08-snap-targets/) | pass | Target tokens end at no less than max(original, ladder target) and have no drift limit: 32, 40 and 44 become 55; 64 may stay or become 89. A drawn-role token and an icon-role token are unchanged. The three targets that end at 55 are listed as a merged group (FP-SNAP-06). Order is kept within a role group only: target 32 → 55 beside spacing 36 → 34 is not a breach. |
| [09-snap-targets-fine](09-snap-targets-fine/) | pass | The same tokens with pointer: fine declared. The ladder target is 34, so 32 becomes 34, 40 and 44 become 55 (the smallest rung at or above the original), and 64 may stay. |
| [10-snap-overrides](10-snap-overrides/) | fail | Overrides: 16 → 21 (31.3%) passes; 24 → 34 (41.7%) is over 38.2% and fails, so 24 stays at its nearest rung; 20 → 13 (35%) is within the limit but breaks order against 16 → 21, which fails FP-SNAP-05. |
| [11-type-scale-formula](11-type-scale-formula/) | fail | Type sizes by formula from body 16. 20 is a step and 21 is not. Micro passes only through its token. A px size, a fixed or missing line height, 1.618 on a heading, fail; the unused odd step 5 (53) fails the step-range rule (FP-TYPE-02), not the scale rule. |
| [12-type-scale-fibonacci](12-type-scale-fibonacci/) | fail | The same input with type.align: fibonacci. Now 21 is the step, and 20, the value it replaced, fails the alignment rule (FP-TYPE-03). 53 still fails the step-range rule. |
| [13-contrast](13-contrast/) | fail | Contrast on declared pairs, never rounded: #767676 on white passes for text and #777777 does not; #949494 passes at 3:1 and #959595 does not. Ratios are shown truncated to three decimals. |
| [14-na-contradiction](14-na-contradiction/) | fail | has.motion and has.controls are declared false, but the scope has a transition and a button selector. FP-CONF-11 fails twice: a rule may not be marked n/a when its condition is true. |
| [15-na-consistent](15-na-consistent/) | pass | The same input with has.motion and has.controls declared true. No contradiction. |
| [16-overlay-coverage](16-overlay-coverage/) | pass | Overlay: only the scope is tested. Coverage is the checked values in the scope divided by those in the whole source, counted after shorthand expansion (padding: 21px is four values, gap: 8px is two). The legacy file is outside the scope and is not flagged. |
| [17-snap-u1-undeclared](17-snap-u1-undeclared/) | fail | The twin of 06-snap-u1 with no exceptions declared. The values that cannot be snapped are kept without a snap-drift exception, which fails FP-SNAP-10. |
| [18-snap-u4-undeclared](18-snap-u4-undeclared/) | fail | The twin of 07-snap-u4 with no exceptions declared. The values that cannot be snapped are kept without a snap-drift exception, which fails FP-SNAP-10. |

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
