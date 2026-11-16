# 1. Core math

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

This section defines the numbers everything else uses: the constants, the length ladder, the base unit and the rounding rules.

## Constants

| Name | Closed form | Value |
|---|---|---|
| φ | (1 + √5) / 2 | 1.6180339887 |
| 1/φ | φ − 1 | 0.6180339887 |
| 1/φ² | 2 − φ | 0.3819660113 |
| √φ | φ^(1/2) | 1.2720196495 |
| Golden angle (degrees) | 360 / φ² = 180 (3 − √5) | 137.50776 |
| Golden angle (radians) | π (3 − √5) | 2.39996323 |
| Fibonacci hashing constant | ⌊2³² / φ⌋ | 2654435769 (0x9E3779B9) |

### FP-MATH-01 · Constants

A checker, a generator or a protocol token file MUST use the values in the constants table, to at least the precision shown. φ is (1 + √5) / 2. The golden angle is 360° / φ², which is 137.50776° (2.39996323 radians).

- **Level:** FP-1 · **Status:** normative · **Applies when:** a checker · **Test:** machine, `math.constants` · **Evidence:** convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4)


### FP-MATH-02 · Compute from the closed form

Code MUST compute the golden angle and φ from their closed forms in double precision. The approximations 137.5 and 137.508 MAY appear in prose and MUST NOT appear in computation.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `math.no-approximate-angle` · **Evidence:** convention (protocol choice)


## The ladder

| n | F(n) | u = 1 | u = 4 | u = 8 | Typical use at u = 1 only |
|---|---|---|---|---|---|
| 2 | 1 | 1 | 4 | 8 | hairline |
| 3 | 2 | 2 | 8 | 16 | bar, strip, fine gap |
| 4 | 3 | 3 | 12 | 24 | ring, tight gap |
| 5 | 5 | 5 | 20 | 40 | inner gap |
| 6 | 8 | 8 | 32 | 64 | control gap |
| 7 | 13 | 13 | 52 | 104 | gap, small padding |
| 8 | 21 | 21 | 84 | 168 | card padding |
| 9 | 34 | 34 | 136 | 272 | panel padding, control height (fine pointer) |
| 10 | 55 | 55 | 220 | 440 | page top, touch target |
| 11 | 89 | 89 | 356 | 712 | section gap |
| 12 | 144 | 144 | 576 | 1152 | box |
| 13 | 233 | 233 | 932 | 1864 | box, card width |
| 14 | 377 | 377 | 1508 | 3016 | box, card height |
| 15 | 610 | 610 | 610 (fixed) | 610 (fixed) | container |
| 16 | 987 | 987 | 987 (fixed) | 987 (fixed) | container |
| 17 | 1597 | 1597 | 1597 (fixed) | 1597 (fixed) | container |

The container widths 610, 987 and 1597 are fixed in platform units at every u (FP-MATH-07).

### FP-MATH-03 · The length ladder

The ladder is F(n) × u for the Fibonacci numbers 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233 and 377, plus the container widths 610, 987 and 1597. Any of these values is "on the ladder". No other value is.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.ladder` · **Evidence:** convention (protocol choice)


### FP-MATH-04 · The ladder covers lengths only

The ladder governs space, size, radius and stroke. It MUST NOT be used to choose a type size (see FP-TYPE-01), an interaction duration (see FP-MOTION-01) or any quantity that encodes data (see FP-VIZ-01).

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** self-report, `math.ladder-scope` · **Evidence:** convention (protocol choice)


### FP-MATH-05 · Base unit u

One u is one platform unit: 1 CSS px on the web (0.0625 rem), 1 pt on iOS and macOS, 1 dp on Android, 1 pt in print. The default is u = 1. A system MUST declare exactly one u per platform in `fp.config.json`.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.unit` · **Evidence:** convention (protocol choice)


### FP-MATH-06 · Grid-locked profiles u = 4 and u = 8

A system MAY declare u = 4 or u = 8 so that every rung stays on its 4 or 8 grid. No other value of u is allowed in version 1.0. Below u, only the sub-unit values 1 and 2 are on the ladder. There are no filler steps: a value the profile lacks is kept unchanged only as a declared exception (FP-SPACE-05), or the system uses Overlay. u = 4 is the recommended profile for a 4-based grid; it has no 16 and no 24. u = 8 SHOULD be used only by a system that has no 4 or 12 tokens, because neither can be snapped at u = 8.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.unit-profile` · **Evidence:** convention (protocol choice); basis: [cited source](https://m1.material.io/layout/metrics-keylines.html)


### FP-MATH-07 · Fine-detail lengths and containers do not scale with u

u scales layout lengths: space, box sizes and ladder target sizes. The following MUST be given in platform units at every u, as if u were 1: hairline and stroke widths (0, 1, 2 or 3); the radius set (FP-RADIUS-01); the focus ring (FP-A11Y-12); state marks and chip height (FP-STATE-03, FP-STATE-04); chart band gaps (FP-VIZ-09); and the container widths 610, 987 and 1597 (FP-LAYOUT-05). Icon sizes are not checked at all: an icon is exempt only as a token with the `icon` role (FP-MODE-10), and a bare length is never treated as an icon.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.fixed-detail` · **Evidence:** convention (protocol choice)


### FP-MATH-08 · Rounding

A length derived from φ and written as a fixed value MUST be rounded half-up to a whole platform unit. A length the browser derives at run time (a percentage, an `fr` track, a `calc()` on a runtime box) is not rounded by the author and is exempt. A φ percentage is written to one decimal place (61.8 and 38.2). A type size is rounded half-up to a whole px, pt or sp. A contrast ratio MUST NOT be rounded (FP-A11Y-02). Drift and coverage are compared with their limits as exact values, with no tolerance (a drift of exactly 25% passes; anything above fails), and are shown rounded half-up, drift to one decimal place and coverage to a whole percent.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.rounding` · **Evidence:** convention (protocol choice)


### FP-MATH-09 · Zero, negative and sub-unit values

0 is always on the ladder. The negative of a rung is on the ladder. Fractions of a platform unit MUST NOT be used as lengths, except where the platform draws a device hairline.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `math.zero-negative` · **Evidence:** convention (protocol choice)


## Token names

Space tokens are named for their Fibonacci number, not their value: `--fp-space-13` is 13 × u, so it is 13 at u = 1 and 52 at u = 4. Tokens that do not scale with u are named for their value: `--fp-radius-8` is always 8. Type steps are `--fp-type-0`, `--fp-type-1` and so on; negative steps are written `--fp-type-n1`; micro is `--fp-type-micro`. The full list is in FP-PLAT-02.

## Why Fibonacci numbers, honestly

Two properties are arithmetic and useful. First, adjacent rungs add up to the next rung (5 + 8 = 13, 8 + 13 = 21), which keeps nested radii in the set (FP-RADIUS-02). Second, the ratio of adjacent rungs settles at φ, so a step up the ladder is always about the same proportional jump. Neither property is evidence that the result looks better. The choice of this ladder is a convention.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
