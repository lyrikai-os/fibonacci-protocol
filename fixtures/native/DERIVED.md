# Derived from an in-house template


Part of the Fibonacci Protocol fixtures, https://www.lyrikai.com (MIT unless this folder says otherwise).

This fixture is derived from an in-house template; see the Lineage note in spec/index.md. It is a corrected copy: the template's token values were taken as the starting point and changed where they did not meet the protocol's guardrails. This file lists every change. Anything not listed was kept (space ladder 1 to 377, radius 2 / 5 / 8 / 13 / 21, container widths 610 / 987 / 1597, the φ split, colour slot values, uppercase tracked labels).

The fixture is a subset: it has the desk colour slots (light and dark), the accent, focus and two status slots, one button, one chip, one card, one console layout and one loop. The template's other parts are not carried over.

| # | Template | Fixture | Rule |
|---|---|---|---|
| 1 | Body 13 px (`fs.13`) | 16 px (`--fp-type-0`, 1rem) | FP-A11Y-07 body anchor; FP-TYPE-04 rem |
| 2 | Body leading 1.618 on 13 px | 1.618 kept, on 16 px, for running text only | FP-TYPE-07 |
| 3 | Small text 11 px | 13 px (`--fp-type-n1`); 11 px only as `--fp-type-micro` for non-interactive metadata (`.stamp`) | FP-TYPE-05, FP-A11Y-08 |
| 4 | Labels, chips and buttons 10 px, line height 13 px | 13 px (`--fp-type-n1`), line height 1.382 unitless | FP-TYPE-06, FP-A11Y-08, FP-TYPE-07, FP-TYPE-08, FP-TYPE-13 |
| 5 | Heading 21 px, leading 1.618 | 20 px (`--fp-type-1`), leading 1.236 | FP-TYPE-01, FP-TYPE-07 (1.618 only for running text) |
| 6 | Title 34 px, leading 1.15 | 33 px (`--fp-type-3`), leading 1.236 | FP-TYPE-01, FP-TYPE-07 |
| 7 | Display 55 px, leading 1 | 68 px (`--fp-type-6`), leading 1.146; 55 is step 5 and odd steps above 4 are not used | FP-TYPE-02, FP-TYPE-07 |
| 8 | Display XL 89 px, leading 1 | 110 px (`--fp-type-8`), leading 1.146; 89 is step 7 (not in the CSS sample, listed for the mapping) | FP-TYPE-02, FP-TYPE-07 |
| 9 | Type sizes in px | rem | FP-TYPE-04 |
| 10 | Control hit area `ctl-hit` 55 as a fixed token, drawn height 34 | Drawn height 34 kept; hit area is `--fp-target` (55, or 34 for a fine pointer only), never smaller than the ladder target | FP-CTRL-01, FP-CTRL-02 |
| 11 | Pill radius 999 px | `--fp-radius-pill` (9999px) | FP-RADIUS-03 |
| 12 | `size.stack-h` 254 (144 + 2 x 55), described in the template as the one derived value off the ladder | Dropped; stacks use `gap` | FP-SPACE-01, FP-SPACE-04 (a sum of rungs is not a derived pattern) |
| 13 | Ambient loops (shimmer 2 s, pulse 3 s, breathe 5 s, drift 8 s) with no stated pause control | One loop kept (breathe, 5 s, opacity only). A page-level control pauses all loops (`[data-motion="paused"]`, wired in `index.html`); the loop stops under `prefers-reduced-motion`. Shimmer, pulse and drift dropped from the fixture | FP-A11Y-09, FP-A11Y-10 |
| 14 | Interaction timings 100 / 150 / 200 / 300 / 500 ms | `--fp-duration-144` | FP-3 is informative in 1.0; used for consistency, not required |
| 15 | Spacing, size, radius and layer tokens under the template's own prefix | `--fp-space-*`, `--fp-radius-*`, `--fp-layer-*` from `dist/fp.css` | FP-PLAT-02 |
| 16 | Console 987 + 610 as two fixed widths | One `--fp-layout: phi-split` grid, `1.618fr 1fr`, from the 987 breakpoint; one column below it; container limit `--fp-container-987` | FP-LAYOUT-01, FP-LAYOUT-05, FP-LAYOUT-06 |
| 17 | Layer tokens 1 / 2 / 3 / 13 / 21 | Same values, as `--fp-layer-*` (not used in the sample CSS) | FP-PLAT-02 |
| 18 | Status shown by form and word | Kept: the chip has a mark and a word; the hue only backs them up | FP-A11Y-14 |

Colour: every desk and status slot value used here was tested against the floors (4.5:1 for text, 3:1 for control marks and the focus ring) in both themes by `fp-check`, and none needed a change.
