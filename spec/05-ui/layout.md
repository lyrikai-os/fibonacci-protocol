# 5.3 UI: layout

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

### FP-LAYOUT-01 · The φ split

A two-part layout whose parts have unequal weight and both hold content (text and figure, main and detail) SHOULD split 61.8 to 38.2, written `1.618fr 1fr`. Only a split that is declared as a φ split is tested. A split is declared by writing the custom property `--fp-layout: phi-split` in the same CSS rule as its `grid-template-columns`; nothing else (a ratio that happens to be near φ, a class name) makes a split "declared". A declared split MUST have exactly two tracks whose ratio is 61.8 to 38.2 within 0.1, in either order: `1.618fr 1fr`, `61.8% 38.2%`, or the tokens `--fp-split-major` (`1.618fr`) and `--fp-split-minor` (`1fr`), as in `grid-template-columns: var(--fp-split-major) var(--fp-split-minor)`. A navigation rail or sidebar of fixed width is not a φ split and takes a rung for its width.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `layout.phi-split` · **Evidence:** convention


### FP-LAYOUT-02 · Equal content gets equal columns

Content of equal weight (cards in a grid, bars in a chart, a host's column grid) MUST NOT be forced into a φ split. Equal columns are correct and are never flagged (FP-CONF-09).

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** self-report, `layout.equal-allowed` · **Evidence:** convention (protocol choice)


### FP-LAYOUT-03 · Growth by Fibonacci pairs

A box that needs a fixed proportion SHOULD take a pair of adjacent rungs for its sides: 144 × 233, 233 × 377, 377 × 610. The ratio of such a pair is close to φ.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `layout.pairs` · **Evidence:** convention


### FP-LAYOUT-04 · Focal convention

A single main element MAY be placed at one of the four crossings of the lines at 38.2% and 61.8% of the frame. A point at 73.5% across and 61.8% down is also in use as a placement convention. Neither is the pole of a golden spiral (which lies near 72.4% across and 27.6% along the short side of a φ rectangle), and neither is supported by evidence of preference.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `layout.focal` · **Evidence:** convention (protocol choice)


### FP-LAYOUT-05 · Container widths

In Native, a container's width limit MUST be 610, 987 or 1597 platform units (at every u), or a derived value of one of them (FP-SPACE-04). On the web it MUST be written as `max-inline-size` (or `max-width`), never as a fixed width, so that the container shrinks and the page still reflows at 320 (FP-A11Y-13). A checker identifies a container limit by its token, not by its size: a `max-inline-size` or `max-width` that uses a `--fp-container-*` token passes; a `width` or `inline-size` that uses one fails; and a rule marked `--fp-layout: container` MUST set its limit with one of the three tokens. Any other width is an ordinary layout length and is tested against the ladder (FP-SPACE-01).

- **Level:** FP-2 · **Status:** normative · **Applies when:** mode: native · **Test:** machine, `layout.container-widths` · **Evidence:** convention (protocol choice)


### FP-LAYOUT-06 · Native breakpoints

A Native system SHOULD use breakpoints at 610 (below it: one column) and 987 (from it: a φ split is available). Between 610 and 986 a layout uses one column or an equal grid; this band covers tablets in portrait. A Native system MAY instead keep its platform's breakpoints if it declares them. No breakpoint system in common use is derived from φ.

- **Level:** FP-2 · **Status:** informative · **Applies when:** mode: native · **Test:** self-report, `layout.breakpoints` · **Evidence:** convention (protocol choice)


### FP-LAYOUT-07 · Hosts keep their breakpoints

In Overlay and Snap the host's breakpoints and window size classes MUST be kept. Breakpoint values are not tested in these modes. Platforms publish their own breakpoints, none of them derived from φ.

- **Level:** FP-2 · **Status:** normative · **Applies when:** mode: overlay or snap · **Test:** self-report, `layout.host-breakpoints` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes)


Reflow at 320 CSS px is required in every mode by FP-A11Y-13.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
