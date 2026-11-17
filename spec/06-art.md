# 6. Art and illustration (FP-4a)

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

This section is informative in version 1.0. It covers art that is grown by the sequence: dot fields, spirals, branching forms.

The golden angle and Fibonacci counts are the one place where these numbers are measured in nature, and even there they are not universal. In a study of 657 sunflowers, 74% of spiral counts were plain Fibonacci numbers and about 18% were not Fibonacci at all ([Swinton and Ochu, 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4892450)).

## Growth rules

### FP-ART-01 · Golden-angle placement

Elements placed around a centre or along a stem SHOULD be turned by the golden angle from one to the next: the n-th element sits at angle n × 137.50776°, computed from the closed form (FP-MATH-02).

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.golden-angle` · **Evidence:** convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4)


### FP-ART-02 · Vogel spiral

A filled disc of elements SHOULD use Vogel's model: the n-th element at radius c × √n and angle n × the golden angle, where c sets the spacing.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.vogel` · **Evidence:** convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4)


### FP-ART-03 · Fibonacci counts

Counts SHOULD be Fibonacci numbers where the form allows: 89, 144, 233 or 377 elements in a spiral field (so that the visible spiral arms come in adjacent Fibonacci numbers without being drawn); 1, 1, 2, 3, 5, 8, 13 branches per order in a branching form.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** self-report, `art.counts` · **Evidence:** convention


### FP-ART-04 · Captions state the rule and the real count

A caption or description of generated art MUST state the rule used and the real numbers ("89 placed", not "about 90"), MUST say when a count was reduced ("89 seeds, 73 placed"), and MUST NOT claim that the form is how nature always works (FP-HONEST-03).

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** self-report, `art.captions` · **Evidence:** convention (protocol choice)


## Determinism

### FP-ART-05 · Same inputs, same output

A generator MUST produce byte-identical output from the same inputs on the same implementation. Across implementations, outputs SHOULD match when coordinates are compared with a tolerance of 0.01 unit. Byte identity across implementations is not promised, because `sin`, `cos` and `sqrt` may differ in the last bit between engines.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.determinism` · **Evidence:** convention (protocol choice)


### FP-ART-06 · Variation comes from an integer hash

A generator MUST NOT use a system random source, the clock, or a hash built on floating-point `sin`. Variation MUST come from the 32-bit integer hash below, which uses only integer operations that every engine computes identically.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.hash` · **Evidence:** convention (protocol choice)


```js
// fpHash(seed, i, k) -> a number in [0, 1). All arithmetic is 32-bit unsigned.
function fpHash(seed, i, k) {
  let h = (seed ^ Math.imul(i, 0x9E3779B9) ^ Math.imul(k, 0x85EBCA6B)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B);
  h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
```

0x9E3779B9 is 2654435769, the whole part of 2³² / φ. The three mixing lines are the 32-bit finalizer of MurmurHash3. Test vectors:

| seed | i | k | 32-bit result | as a number in [0, 1) |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0.0000000000 |
| 0 | 1 | 0 | 2462723854 | 0.5733975801 |
| 0 | 0 | 1 | 3413276431 | 0.7947153484 |
| 1 | 1 | 1 | 254826929 | 0.0593315179 |
| 89 | 21 | 34 | 766799383 | 0.1785343939 |
| 2654435769 | 377 | 610 | 1094901692 | 0.2549266657 |
| 0 | 4294967295 | 0 | 918526378 | 0.2138610878 |

### FP-ART-07 · Output format

Generated SVG MUST write coordinates with exactly 2 decimal places, attributes in a fixed order and elements in generation order, with no timestamps and no locale-dependent number formatting.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.output-format` · **Evidence:** convention (protocol choice)


## SVG rules

### FP-ART-08 · Structure

An SVG MUST have a `viewBox`, padded so that no stroke is clipped, and MUST NOT fix its width or height. It MUST NOT contain scripts, embedded raster images or references to external files.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.svg-structure` · **Evidence:** convention (protocol choice)


### FP-ART-09 · Paint

Art SHOULD be inline SVG painted with `currentColor`, with tone set by opacity on groups, so that it follows the theme and survives forced colours. Art SHOULD NOT be delivered as a CSS mask. Stroked art SHOULD use round caps and joins. `vector-effect: non-scaling-stroke` SHOULD be used only for glyphs drawn at 55 or smaller.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.svg-paint` · **Evidence:** convention (protocol choice)


### FP-ART-10 · Accessible name

An SVG that carries meaning MUST have `role="img"` and a `<title>` or an accessible label. A decorative SVG MUST be hidden from assistive technology. A meaningful mark MUST have at least 3:1 contrast (FP-A11Y-01).

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** machine, `art.svg-name` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/)


### FP-ART-11 · Art that moves

Animated art is subject to FP-A11Y-09, FP-A11Y-10 and FP-A11Y-11. Under reduced motion it MUST show its finished state.

- **Level:** FP-4a · **Status:** informative · **Applies when:** has: generated art · **Test:** self-report, `art.motion` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
