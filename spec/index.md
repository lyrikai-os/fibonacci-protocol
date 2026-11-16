# Lyrikai: Fibonacci Protocol for UI/UX Design Agents

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

**Status:** release candidate 1.0.0-rc.5. This text is proposed for release as version 1.0.0 and is published for final review. It is not yet a release. The reference checker, `fp-check`, ships in this repository (see "Running the checker" below).

## What this is

The Fibonacci Protocol is a convention for internal consistency. It gives a design system one small set of numbers (the Fibonacci sequence times a base unit) and one ratio (φ, about 1.618) to use for lengths, type steps, proportions and timings, so that a person or an agent reaching for a value always reaches for the same few.

It is not an aesthetic law. The evidence that people prefer φ is weak and contested. A 2016 review concludes that a universal preference for the golden ratio is weak and may vanish under bias-free methods, and that individuals differ widely ([review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063)). This protocol's own reading of that literature is that people tend to prefer moderately elongated rectangles over squares and slivers, and that nothing singles out φ. The protocol therefore makes three promises and no others:

1. Every rule is cited, or labelled "convention" or "contested".
2. Accessibility floors and platform defaults sit outside the scale and always win.
3. φ may frame data but never shape it.

## Choose a mode

| You have | Use | You change | Highest level |
|---|---|---|---|
| A design system you want to keep as it is | **Overlay** | Nothing. You add `--fp-*` tokens and use them in a scope you choose. | FP-1; FP-2 only if the scope's type is replaced (FP-MODE-09) |
| A 4- or 8-based spacing scale you are willing to move | **Snap** | Your spacing and radius values move to the nearest rung, by a published table. | FP-1 by snapping; FP-2 when type is replaced |
| A new system, or one you will rebuild | **Native** | Everything is built on the ladder and the type scale. | FP-2 |

## FP-1 Overlay in five steps

This is the smallest adoption. It changes nothing your system already has.

**1. Add the tokens.** Copy this block into your CSS.

```css
/* Fibonacci Protocol 1.0.0-rc.5 · FP-1 tokens at u = 1 · MIT · https://www.lyrikai.com */
:root {
  --fp-space-1: 1px;
  --fp-space-2: 2px;
  --fp-space-3: 3px;
  --fp-space-5: 5px;
  --fp-space-8: 8px;
  --fp-space-13: 13px;
  --fp-space-21: 21px;
  --fp-space-34: 34px;
  --fp-space-55: 55px;
  --fp-space-89: 89px;
  --fp-space-144: 144px;
  --fp-space-233: 233px;
  --fp-space-377: 377px;
  --fp-container-610: 610px;
  --fp-container-987: 987px;
  --fp-container-1597: 1597px;
  --fp-radius-2: 2px;
  --fp-radius-3: 3px;
  --fp-radius-5: 5px;
  --fp-radius-8: 8px;
  --fp-radius-13: 13px;
  --fp-radius-21: 21px;
  --fp-radius-pill: 9999px;
  --fp-focus-gap: 2px;
  --fp-focus-ring: 3px;
  --fp-target: 55px;
}
@media (pointer: fine) and (not (any-pointer: coarse)) {
  :root { --fp-target: 34px; }
}
```

**2. Write `fp.config.json`** at the root of the project. `source` is everything the product ships; `scope` is the part where you will keep to the ladder.

```json
{
  "fp": "1.0.0-rc.5",
  "mode": "overlay",
  "level": "FP-1",
  "platform": "web",
  "unit": 1,
  "has": { "motion": true, "timeLimits": false, "controls": true, "charts": false, "generatedArt": false, "states": false },
  "source": ["src/**/*.css"],
  "scope": ["src/components/card/**/*.css"],
  "roles": [
    { "match": "--icon-*", "role": "icon" }
  ],
  "pairs": [
    { "fg": "--color-text", "bg": "--color-page", "kind": "text" },
    { "fg": "--color-border-control", "bg": "--color-page", "kind": "mark" }
  ]
}
```

**3. Use the tokens in the scope.** Inside the scope, every margin, padding, gap, inset, size and radius resolves to a rung: `padding: var(--fp-space-21)`, `gap: var(--fp-space-8)`, `border-radius: var(--fp-radius-13)`. One of your own tokens is fine where its value is already a rung (8, for example). A token of yours that is used in the scope and is not a rung (a 16 gap, say) is either replaced there by a protocol token or declared once as an exception, with the token's name as `where`. Icon sizes are left alone when the icon tokens are given the `icon` role, as above. Your type, colours, breakpoints and grid stay as they are.

**4. Check.** Every rule in the list below gets a result. Run the machine tests on the scope; answer each self-report item with evidence, in a file `fp-evidence.json` beside `fp.config.json` (one entry per rule: `result`, `evidence`, `by`; FP-CONF-06). The rules are tested on the scope: the files in `scope` and every view those files style. They say nothing about the rest of the product, and the claim names the scope so that a reader can see that. A rule whose "needed" condition is false for you is recorded as `n/a` with a one-line reason (FP-CONF-11). Test vectors for the machine tests are in [test-vectors/](test-vectors/README.md).

This is the complete list for a web, Overlay, FP-1 claim, generated from [rules.json](rules.json):

| Rule | Title | Test | Needed |
|---|---|---|---|
| [FP-MATH-03](01-core-math.md) | The length ladder | machine | always |
| [FP-MATH-04](01-core-math.md) | The ladder covers lengths only | self-report | always |
| [FP-MATH-05](01-core-math.md) | Base unit u | machine | always |
| [FP-MATH-06](01-core-math.md) | Grid-locked profiles u = 4 and u = 8 | machine | always |
| [FP-MATH-07](01-core-math.md) | Fine-detail lengths and containers do not scale with u | machine | always |
| [FP-MATH-08](01-core-math.md) | Rounding | machine | always |
| [FP-MATH-09](01-core-math.md) | Zero, negative and sub-unit values | machine | always |
| [FP-MODE-01](02-integration-modes.md) | A configuration file declares the adoption | machine | always |
| [FP-MODE-02](02-integration-modes.md) | Configuration fields | machine | always |
| [FP-MODE-08](02-integration-modes.md) | One mode per scope | machine | always |
| [FP-MODE-10](02-integration-modes.md) | Roles are declared | machine | always |
| [FP-MODE-09](02-integration-modes.md) | The highest level each mode can claim | machine | always |
| [FP-MODE-03](02-integration-modes.md) | Overlay keeps the host system | self-report | always |
| [FP-MODE-04](02-integration-modes.md) | Overlay tests resolved values in the scope | machine | always |
| [FP-MODE-05](02-integration-modes.md) | Overlay coverage and exceptions are reported | machine | always |
| [FP-MODE-07](02-integration-modes.md) | What an adopter may and may not change | self-report | always |
| [FP-CONF-04](03-conformance.md) | The claim string | machine | always (tested on the report) |
| [FP-CONF-05](03-conformance.md) | Version 1.0 claims: FP-1 and FP-2, on the web | machine | always (tested on the report) |
| [FP-CONF-06](03-conformance.md) | Machine tests, self-report and the evidence file | machine | always (tested on the report) |
| [FP-CONF-07](03-conformance.md) | A pass needs zero pending exceptions | machine | always (tested on the report) |
| [FP-CONF-14](03-conformance.md) | Machine tests not run, and self-assessment | machine | always (tested on the report) |
| [FP-A11Y-16](04-accessibility.md) | Floors win over the ladder | self-report | always |
| [FP-A11Y-01](04-accessibility.md) | Contrast floors | machine | always |
| [FP-A11Y-02](04-accessibility.md) | Large text and no rounding | machine | always |
| [FP-A11Y-20](04-accessibility.md) | Every pair in use is declared | self-report | always |
| [FP-A11Y-03](04-accessibility.md) | Text can be resized | self-report | always |
| [FP-A11Y-04](04-accessibility.md) | Text spacing can be overridden | self-report | always |
| [FP-A11Y-05](04-accessibility.md) | Target size minimums | self-report | only if `has.controls` is true in your configuration |
| [FP-A11Y-06](04-accessibility.md) | Unknown or mixed pointers are treated as coarse | self-report | only if `has.controls` is true in your configuration |
| [FP-A11Y-09](04-accessibility.md) | Pause, stop or hide | self-report | only if `has.motion` is true in your configuration |
| [FP-A11Y-10](04-accessibility.md) | Reduced motion | self-report | only if `has.motion` is true in your configuration |
| [FP-A11Y-11](04-accessibility.md) | Three flashes | self-report | only if `has.motion` is true in your configuration |
| [FP-A11Y-18](04-accessibility.md) | Time limits | self-report | only if `has.timeLimits` is true in your configuration |
| [FP-A11Y-19](04-accessibility.md) | Status messages | self-report | always |
| [FP-A11Y-12](04-accessibility.md) | Focus is always visible | self-report | only if `has.controls` is true in your configuration |
| [FP-A11Y-17](04-accessibility.md) | Focus is not hidden | self-report | only if `has.controls` is true in your configuration |
| [FP-A11Y-13](04-accessibility.md) | Reflow at 320 | self-report | always |
| [FP-A11Y-14](04-accessibility.md) | State is never shown by colour alone | self-report | always |
| [FP-SPACE-01](05-ui/space-radius.md) | Lengths are on the ladder | machine | always |
| [FP-SPACE-03](05-ui/space-radius.md) | Choose a rung by role | self-report | always |
| [FP-SPACE-04](05-ui/space-radius.md) | Derived values | machine | always |
| [FP-SPACE-05](05-ui/space-radius.md) | Exceptions are declared | machine | always |
| [FP-RADIUS-01](05-ui/space-radius.md) | Radius set | machine | always |
| [FP-RADIUS-02](05-ui/space-radius.md) | Nested radii | self-report | always |
| [FP-RADIUS-03](05-ui/space-radius.md) | Pill and round | machine | always |
| [FP-LINE-02](05-ui/space-radius.md) | A hairline is never the only edge of a control | self-report | only if `has.controls` is true in your configuration |
| [FP-CTRL-01](05-ui/controls.md) | Protocol targets are at least the ladder target | self-report | only if `has.controls` is true in your configuration |
| [FP-CTRL-02](05-ui/controls.md) | Drawn height and hit area are separate | self-report | only if `has.controls` is true in your configuration |
| [FP-CTRL-03](05-ui/controls.md) | Small interactive parts | self-report | only if `has.controls` is true in your configuration |
| [FP-CTRL-04](05-ui/controls.md) | Host controls keep their size if they meet the floor | self-report | only if `has.controls` is true in your configuration |
| [FP-VIZ-01](07-data-viz.md) | φ frames, never data | self-report | only if `has.charts` is true in your configuration |
| [FP-VIZ-04](07-data-viz.md) | Bars start at zero and are equally wide | self-report | only if `has.charts` is true in your configuration |
| [FP-VIZ-05](07-data-viz.md) | No bent scales, no blended measures | self-report | only if `has.charts` is true in your configuration |
| [FP-VIZ-06](07-data-viz.md) | Not measured is not zero | self-report | only if `has.charts` is true in your configuration |
| [FP-PLAT-01](08-platforms/web.md) | Web units | machine | always |
| [FP-PLAT-02](08-platforms/web.md) | Web custom properties | machine | always |
| [FP-PLAT-03](08-platforms/web.md) | Web pointer queries | machine | always |
| [FP-HONEST-02](10-evidence-honesty.md) | Banned words | machine | always (tested on the report) |
| [FP-HONEST-03](10-evidence-honesty.md) | Claims that are never made | self-report | always |
| [FP-HONEST-04](10-evidence-honesty.md) | A claim says what was tested | machine | always (tested on the report) |
| [FP-HONEST-05](10-evidence-honesty.md) | Invent nothing | self-report | always |
| [FP-TOKEN-01](tokens.md) | Token format | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-02](tokens.md) | Types and units | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-03](tokens.md) | Names | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-04](tokens.md) | The master is in platform units | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-05](tokens.md) | Themes | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-06](tokens.md) | Rule metadata | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-07](tokens.md) | File metadata | machine | only if you ship token files in the protocol's format |
| [FP-TOKEN-09](tokens.md) | Type in rem | machine | only if you ship token files in the protocol's format |

If you later go on to FP-2, note one rule that catches people out: every CSS rule that sets a `font-size` must also set `line-height` in the same rule (FP-TYPE-13).

**5. State the claim.** It exists only when the machine tests pass and every self-report item in the list has an entry with evidence. Until then the checker prints a candidate line and the number of items still open, which is not a claim. The claim has exactly this form:

`FP-1 · Overlay · u=1 · web · scope src/components/card/** · coverage 12% · exceptions 0 · spec 1.0.0-rc.5 · self-assessed`

### Running the checker

`fp-check` is the reference checker and ships in this repository. It needs Node.js and no packages, and it works offline:

`node tools/fp-check/fp-check.mjs [folder with fp.config.json]`

It runs the machine tests, reads `fp-evidence.json`, and prints either the claim or, while self-report items are open, a candidate line with their count. The claim ends with `self-assessed` when the adopter answered the self-report items; that part is dropped only when someone independent of the adopter assessed them and is named in the evidence file (FP-CONF-14).

## Scope and versions

Every area is written in version 1.0. What changes between versions is how much of it is normative, that is, binding and tested.

| Area | 1.0 | 1.1 | 1.2 |
|---|---|---|---|
| Core math, integration modes, conformance, accessibility guardrails, data-honesty guard, evidence rules | normative | | |
| FP-1 space and radius; FP-2 type, layout and grids; on the web | normative | | |
| Tokens (format, CSS, SCSS, Tailwind) | normative | | |
| Agent protocol and checker definitions (CSS and tokens JSON) | normative | | |
| FP-3 motion and the state grammar | informative | normative | |
| FP-4a art and illustration; FP-4b data visualisation | informative | normative (the checker reads SVG) | |
| iOS, macOS and Android (Swift, Kotlin, design-tool variables) | informative; body anchors and target floors are stated | normative | |
| Print, slides and email | informative | informative | normative |

In version 1.0 a claim names FP-1 or FP-2 and the platform `web` (FP-CONF-05). Out of scope in every version: brand colours, typefaces, logos, components, and any claim that a design is better because it uses φ.

## Conformance overview

- **Guard** rules are the base of every level. A Guard rule that applies and fails voids the claim; a Guard rule that does not apply is recorded as `n/a` (FP-CONF-01, FP-CONF-11).
- **FP-1**: space and radius. **FP-2**: FP-1 plus type, layout and grids. **FP-3**: FP-2 plus motion and the state grammar. Levels are cumulative (FP-CONF-02).
- **FP-4a** (art and illustration) and **FP-4b** (data visualisation) are separate badges (FP-CONF-03).
- **Agent** rules describe how a design agent behaves. They are a separate list: they do not count toward a system's claim (FP-CONF-12).
- Each rule has one of five results: `pass`, `fail`, `n/a`, `pending` or `not-run` (FP-CONF-07, FP-CONF-11, FP-CONF-14).

## How to claim conformance

1. Write an `fp.config.json` (FP-MODE-01, FP-MODE-02; schema in [fp.config.schema.json](fp.config.schema.json)).
2. Run the machine tests for the level and answer the self-report items with evidence, in `fp-evidence.json` (FP-CONF-06; schema in [fp-evidence.schema.json](fp-evidence.schema.json)).
3. Resolve every pending exception; a result with pending exceptions is not a pass (FP-CONF-07).
4. State the claim in the fixed form (FP-CONF-04): `FP-2 · Snap · u=1 · web · spec 1.0.0-rc.5 · self-assessed`. The last part stays unless the self-report items were assessed by someone other than the adopter (FP-CONF-14).

A claim says what was tested. It never says that a design is more beautiful, more natural or better (FP-HONEST-04). A passing run is not a statement that a product is accessible (FP-CONF-10).

## How to read a rule

Each rule has an ID, a title, the rule text, and five fields:

- **Level**: Guard, FP-1, FP-2, FP-3, FP-4a, FP-4b or Agent.
- **Status**: normative (binding, tested) or informative (published guidance that binds no claim in this version).
- **Applies when**: the condition under which the rule is tested. Where the condition is false the result is `n/a`.
- **Test**: `machine` (it can be decided from source files; the name is the check's name) or `self-report` (the adopter or agent answers with evidence).
- **Evidence**: the label describes the rule itself. `cited`: the rule restates a requirement of the linked source (a standard or a format). A source that only states a fact, such as a paper or a measurement, is never a citation for a rule: it is a basis. `convention`: common practice with no controlled evidence. `convention (protocol choice)`: a choice made by this protocol. `contested`: published evidence points both ways. A convention may add a **basis**: a cited source for the fact the choice rests on. A basis does not make the rule itself a cited requirement.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are used as defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). **In an informative rule** these words say what the rule will require once it becomes normative; in this version they bind no claim. **In a normative rule**, MUST and MUST NOT decide pass or fail; SHOULD is a recommendation: not following it does not fail the rule, and the report says "recommendation not followed" with the reason. A rule whose condition is "the specification" or "a checker" binds this document or a checker, not an adopter's system, and is never part of a system's run. Rule IDs have the form `FP-<AREA>-NN` and are never reused. FP-CONF-13 was never assigned. Level names (FP-1 to FP-4b) never take a second number, so the two cannot be confused.

## Rule counts

| Level | Normative | Informative | Total |
|---|---|---|---|
| Guard | 49 | 2 | 51 |
| FP-1 | 47 | 6 | 53 |
| FP-2 | 17 | 10 | 27 |
| FP-3 | 0 | 22 | 22 |
| FP-4a | 0 | 12 | 12 |
| FP-4b | 0 | 8 | 8 |
| Agent | 14 | 0 | 14 |
| **All** | **127** | **60** | **187** |

## File map

| File | Plan section | Holds | Rules |
|---|---|---|---|
| [index.md](index.md) | — | Lyrikai: Fibonacci Protocol for UI/UX Design Agents | — (0) |
| [01-core-math.md](01-core-math.md) | 1 | 1. Core math | `FP-MATH` (9) |
| [02-integration-modes.md](02-integration-modes.md) | 2 | 2. Integration modes | `FP-MODE`, `FP-SNAP` (21) |
| [03-conformance.md](03-conformance.md) | 3 | 3. Conformance | `FP-CONF` (13) |
| [04-accessibility.md](04-accessibility.md) | 4 | 4. Accessibility guardrails | `FP-A11Y` (20) |
| [05-ui/space-radius.md](05-ui/space-radius.md) | 5 | 5.1 UI: space, radius, lines | `FP-LINE`, `FP-RADIUS`, `FP-SPACE` (12) |
| [05-ui/type.md](05-ui/type.md) | 5 | 5.2 UI: type | `FP-TYPE` (13) |
| [05-ui/layout.md](05-ui/layout.md) | 5 | 5.3 UI: layout | `FP-LAYOUT` (7) |
| [05-ui/controls.md](05-ui/controls.md) | 5 | 5.4 UI: controls and targets | `FP-CTRL` (5) |
| [05-ui/motion.md](05-ui/motion.md) | 5 | 5.5 UI: motion | `FP-MOTION` (7) |
| [05-ui/layers-colour-state.md](05-ui/layers-colour-state.md) | 5 | 5.6 UI: layers, colour, state | `FP-COLOR`, `FP-LAYER`, `FP-STATE` (15) |
| [06-art.md](06-art.md) | 6 | 6. Art and illustration (FP-4a) | `FP-ART` (11) |
| [07-data-viz.md](07-data-viz.md) | 7 | 7. Data visualisation (FP-4b) | `FP-VIZ` (12) |
| [08-platforms/web.md](08-platforms/web.md) | 8 | 8.1 Platforms: web | `FP-PLAT` (4) |
| [08-platforms/apple.md](08-platforms/apple.md) | 8 | 8.2 Platforms: iOS and macOS | `FP-PLAT` (3) |
| [08-platforms/android.md](08-platforms/android.md) | 8 | 8.3 Platforms: Android | `FP-PLAT` (2) |
| [08-platforms/print-slides-email.md](08-platforms/print-slides-email.md) | 8 | 8.4 Platforms: print, slides, email | `FP-PLAT` (3) |
| [09-agent-protocol.md](09-agent-protocol.md) | 9 | 9. Agent protocol | `FP-AGENT` (14) |
| [10-evidence-honesty.md](10-evidence-honesty.md) | 10 | 10. Evidence and honesty | `FP-HONEST` (6) |
| [tokens.md](tokens.md) | deliverable | Tokens | `FP-TOKEN` (10) |
| [appendix-snap-tables.md](appendix-snap-tables.md) | 2 | Appendix: worked Snap tables | — (0) |
| [rules.json](rules.json) | — | Every rule in machine-readable form, with its text; generated from the same source as these pages | all |
| [fp.config.schema.json](fp.config.schema.json) | 2 | JSON Schema (2020-12) for `fp.config.json` | — |
| [fp-evidence.schema.json](fp-evidence.schema.json) | 3 | JSON Schema (2020-12) for `fp-evidence.json` | — |
| [test-vectors/](test-vectors/README.md) | 3 | Inputs and expected results for the core machine tests | — |

## Glossary

- **Basis**: a cited source for the fact behind a convention.
- **Claim**: the one-line statement of what was tested (FP-CONF-04).
- **Coverage**: in Overlay, the checked values inside the scope divided by those in the whole source, counted after shorthands are expanded to longhands (FP-MODE-05). It measures how much of the product the claim is about. It does not measure how many declarations use protocol tokens: inside the scope every checked value is on the ladder or a declared exception.
- **Drift**: how far a snapped value moved, as a share of the original: |rung − value| / value.
- **Candidate**: the line a checker prints when the machine tests pass but self-report rules are open. It is not a claim.
- **Exception**: an off-ladder value that is declared, with a reason, in `fp.config.json`.
- **Floor**: a minimum set by an accessibility standard or a platform, pinned outside the scale.
- **Guard**: the rules every claim rests on: accessibility, honesty and conformance mechanics.
- **Host**: the existing design system that adopts the protocol.
- **Ladder**: the Fibonacci numbers 1 to 377, each multiplied by the base unit u, plus the container widths 610, 987 and 1597.
- **Open**: said of an applicable self-report rule with no entry, or no evidence, in `fp-evidence.json`.
- **φ split**: a division of a length into 61.8% and 38.2%.
- **Protocol-owned**: a token or value the protocol supplies (`--fp-*`), as opposed to one the host already had.
- **Rung**: one value on the ladder.
- **Step k**: a position on the type scale, counted in half-steps of φ from the body size.
- **u**: the base unit, in platform units (px, pt, dp). Default 1; 4 and 8 are the grid-locked profiles.

## Rule table

| ID | Title | Level | Status | Applies when | Test | Evidence |
|---|---|---|---|---|---|---|
| [FP-MATH-01](01-core-math.md) | Constants | FP-1 | normative | a checker | machine: `math.constants` | convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4) |
| [FP-MATH-02](01-core-math.md) | Compute from the closed form | FP-4a | informative | has: generated art | machine: `math.no-approximate-angle` | convention (protocol choice) |
| [FP-MATH-03](01-core-math.md) | The length ladder | FP-1 | normative | always | machine: `math.ladder` | convention (protocol choice) |
| [FP-MATH-04](01-core-math.md) | The ladder covers lengths only | FP-1 | normative | always | self-report: `math.ladder-scope` | convention (protocol choice) |
| [FP-MATH-05](01-core-math.md) | Base unit u | FP-1 | normative | always | machine: `math.unit` | convention (protocol choice) |
| [FP-MATH-06](01-core-math.md) | Grid-locked profiles u = 4 and u = 8 | FP-1 | normative | always | machine: `math.unit-profile` | convention (protocol choice); basis: [cited source](https://m1.material.io/layout/metrics-keylines.html) |
| [FP-MATH-07](01-core-math.md) | Fine-detail lengths and containers do not scale with u | FP-1 | normative | always | machine: `math.fixed-detail` | convention (protocol choice) |
| [FP-MATH-08](01-core-math.md) | Rounding | FP-1 | normative | always | machine: `math.rounding` | convention (protocol choice) |
| [FP-MATH-09](01-core-math.md) | Zero, negative and sub-unit values | FP-1 | normative | always | machine: `math.zero-negative` | convention (protocol choice) |
| [FP-MODE-01](02-integration-modes.md) | A configuration file declares the adoption | FP-1 | normative | always | machine: `mode.config-present` | convention (protocol choice) |
| [FP-MODE-02](02-integration-modes.md) | Configuration fields | FP-1 | normative | always | machine: `mode.config-schema` | convention (protocol choice) |
| [FP-MODE-08](02-integration-modes.md) | One mode per scope | FP-1 | normative | always | machine: `mode.single` | convention (protocol choice) |
| [FP-MODE-10](02-integration-modes.md) | Roles are declared | FP-1 | normative | always | machine: `mode.roles` | convention (protocol choice) |
| [FP-MODE-09](02-integration-modes.md) | The highest level each mode can claim | FP-1 | normative | always | machine: `mode.level-ceiling` | convention (protocol choice) |
| [FP-MODE-03](02-integration-modes.md) | Overlay keeps the host system | FP-1 | normative | mode: overlay | self-report: `mode.overlay-host-intact` | convention (protocol choice) |
| [FP-MODE-04](02-integration-modes.md) | Overlay tests resolved values in the scope | FP-1 | normative | mode: overlay | machine: `mode.overlay-resolved` | convention (protocol choice) |
| [FP-MODE-05](02-integration-modes.md) | Overlay coverage and exceptions are reported | FP-1 | normative | mode: overlay | machine: `mode.overlay-coverage` | convention (protocol choice) |
| [FP-SNAP-01](02-integration-modes.md) | Exemption is by declared role | FP-1 | normative | mode: snap | machine: `snap.exempt-by-role` | convention (protocol choice) |
| [FP-SNAP-02](02-integration-modes.md) | Nearest rung, ties go up | FP-1 | normative | mode: snap | machine: `snap.nearest` | convention (protocol choice) |
| [FP-SNAP-03](02-integration-modes.md) | Drift limit of 25% | FP-1 | normative | mode: snap | machine: `snap.drift` | convention (protocol choice) |
| [FP-SNAP-10](02-integration-modes.md) | Values that cannot be snapped | FP-1 | normative | mode: snap | machine: `snap.unsnappable` | convention (protocol choice) |
| [FP-SNAP-04](02-integration-modes.md) | Targets never shrink | FP-1 | normative | mode: snap | machine: `snap.target-up` | convention (protocol choice); basis: [cited source](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| [FP-SNAP-11](02-integration-modes.md) | Control heights never shrink | FP-1 | normative | mode: snap | machine: `snap.control-height` | convention (protocol choice) |
| [FP-SNAP-05](02-integration-modes.md) | The mapping keeps order | FP-1 | normative | mode: snap | machine: `snap.monotonic` | convention (protocol choice) |
| [FP-SNAP-06](02-integration-modes.md) | Collisions merge by default | FP-1 | normative | mode: snap | machine: `snap.merge-listed` | convention (protocol choice) |
| [FP-SNAP-07](02-integration-modes.md) | Overrides | FP-1 | normative | mode: snap | machine: `snap.override` | convention (protocol choice) |
| [FP-SNAP-08](02-integration-modes.md) | The published table states what breaks | FP-1 | normative | mode: snap | self-report: `snap.what-breaks` | convention (protocol choice) |
| [FP-SNAP-09](02-integration-modes.md) | Snapping alone reaches FP-1 | FP-1 | normative | mode: snap | machine: `snap.level-cap` | convention (protocol choice) |
| [FP-MODE-06](02-integration-modes.md) | Native is full adoption | FP-1 | normative | mode: native | machine: `mode.native` | convention (protocol choice) |
| [FP-MODE-07](02-integration-modes.md) | What an adopter may and may not change | FP-1 | normative | always | self-report: `mode.may-change` | convention (protocol choice) |
| [FP-CONF-01](03-conformance.md) | Guard rules are the base of every level | Guard | normative | a checker | machine: `conf.guard-base` | convention (protocol choice) |
| [FP-CONF-02](03-conformance.md) | Levels are cumulative | Guard | normative | a checker | machine: `conf.cumulative` | convention (protocol choice) |
| [FP-CONF-03](03-conformance.md) | FP-4a and FP-4b are separate badges | Guard | normative | a checker | machine: `conf.badges` | convention (protocol choice) |
| [FP-CONF-04](03-conformance.md) | The claim string | Guard | normative | the report | machine: `conf.claim-format` | convention (protocol choice) |
| [FP-CONF-05](03-conformance.md) | Version 1.0 claims: FP-1 and FP-2, on the web | Guard | normative | the report | machine: `conf.v1-levels` | convention (protocol choice) |
| [FP-CONF-12](03-conformance.md) | Agent conformance is separate | Guard | normative | a checker | self-report: `conf.agent-separate` | convention (protocol choice) |
| [FP-CONF-11](03-conformance.md) | Not applicable | Guard | normative | a checker | machine: `conf.not-applicable` | convention (protocol choice) |
| [FP-CONF-06](03-conformance.md) | Machine tests, self-report and the evidence file | Guard | normative | the report | machine: `conf.evidence` | convention (protocol choice) |
| [FP-CONF-07](03-conformance.md) | A pass needs zero pending exceptions | Guard | normative | the report | machine: `conf.no-pending` | convention (protocol choice) |
| [FP-CONF-14](03-conformance.md) | Machine tests not run, and self-assessment | Guard | normative | the report | machine: `conf.not-run` | convention (protocol choice) |
| [FP-CONF-08](03-conformance.md) | What a checker reads and how it classifies | Guard | normative | a checker | machine: `conf.classify` | convention (protocol choice) |
| [FP-CONF-09](03-conformance.md) | What a checker never flags | Guard | normative | a checker | machine: `conf.not-flagged` | convention (protocol choice) |
| [FP-CONF-10](03-conformance.md) | The limits of a check are stated | Guard | normative | a checker | self-report: `conf.limits-stated` | convention (protocol choice) |
| [FP-A11Y-16](04-accessibility.md) | Floors win over the ladder | Guard | normative | always | self-report: `a11y.precedence` | convention (protocol choice) |
| [FP-A11Y-01](04-accessibility.md) | Contrast floors | Guard | normative | always | machine: `a11y.contrast` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-02](04-accessibility.md) | Large text and no rounding | Guard | normative | always | machine: `a11y.contrast-exact` | cited ([source](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)) |
| [FP-A11Y-20](04-accessibility.md) | Every pair in use is declared | Guard | normative | always | self-report: `a11y.pairs-complete` | convention (protocol choice) |
| [FP-A11Y-03](04-accessibility.md) | Text can be resized | Guard | normative | always | self-report: `a11y.text-resize` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-04](04-accessibility.md) | Text spacing can be overridden | Guard | normative | always | self-report: `a11y.text-spacing` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-07](04-accessibility.md) | Body anchors | FP-2 | normative | protocol-owned type | machine: `a11y.body-anchor` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography) |
| [FP-A11Y-08](04-accessibility.md) | Smallest text | FP-2 | normative | protocol-owned type | machine: `a11y.min-text` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography) |
| [FP-A11Y-05](04-accessibility.md) | Target size minimums | Guard | normative | has: controls | self-report: `a11y.target-size` | cited ([source](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) |
| [FP-A11Y-06](04-accessibility.md) | Unknown or mixed pointers are treated as coarse | Guard | normative | has: controls | self-report: `a11y.pointer` | convention (protocol choice) |
| [FP-A11Y-09](04-accessibility.md) | Pause, stop or hide | Guard | normative | has: motion | self-report: `a11y.pause` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-10](04-accessibility.md) | Reduced motion | Guard | normative | has: motion | self-report: `a11y.reduced-motion` | convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |
| [FP-A11Y-11](04-accessibility.md) | Three flashes | Guard | normative | has: motion | self-report: `a11y.flash` | cited ([source](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold)) |
| [FP-A11Y-18](04-accessibility.md) | Time limits | Guard | normative | has: time limits | self-report: `a11y.time-limits` | cited ([source](https://www.w3.org/TR/WCAG22/#timing-adjustable)) |
| [FP-A11Y-19](04-accessibility.md) | Status messages | Guard | normative | platform: web | self-report: `a11y.status-messages` | cited ([source](https://www.w3.org/TR/WCAG22/#status-messages)) |
| [FP-A11Y-12](04-accessibility.md) | Focus is always visible | Guard | normative | has: controls | self-report: `a11y.focus` | cited ([source](https://www.w3.org/TR/WCAG22/#focus-visible)) |
| [FP-A11Y-17](04-accessibility.md) | Focus is not hidden | Guard | normative | has: controls | self-report: `a11y.focus-not-obscured` | cited ([source](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum)) |
| [FP-A11Y-13](04-accessibility.md) | Reflow at 320 | Guard | normative | platform: web | self-report: `a11y.reflow` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-14](04-accessibility.md) | State is never shown by colour alone | Guard | normative | always | self-report: `a11y.colour-alone` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-A11Y-15](04-accessibility.md) | Forced colours and high contrast | Guard | informative | always | self-report: `a11y.forced-colours` | convention (protocol choice) |
| [FP-SPACE-01](05-ui/space-radius.md) | Lengths are on the ladder | FP-1 | normative | always | machine: `space.on-ladder` | convention (protocol choice) |
| [FP-SPACE-02](05-ui/space-radius.md) | Role table | FP-1 | informative | mode: native | self-report: `space.roles` | convention |
| [FP-SPACE-03](05-ui/space-radius.md) | Choose a rung by role | FP-1 | normative | mode: native or overlay | self-report: `space.by-role` | convention |
| [FP-SPACE-04](05-ui/space-radius.md) | Derived values | FP-1 | normative | always | machine: `space.derived` | convention (protocol choice) |
| [FP-SPACE-05](05-ui/space-radius.md) | Exceptions are declared | FP-1 | normative | always | machine: `space.exceptions` | convention (protocol choice) |
| [FP-RADIUS-01](05-ui/space-radius.md) | Radius set | FP-1 | normative | always | machine: `radius.set` | convention (protocol choice) |
| [FP-RADIUS-02](05-ui/space-radius.md) | Nested radii | FP-1 | normative | always | self-report: `radius.nesting` | convention |
| [FP-RADIUS-03](05-ui/space-radius.md) | Pill and round | FP-1 | normative | always | machine: `radius.pill-round` | convention |
| [FP-LINE-01](05-ui/space-radius.md) | Hairlines | FP-1 | informative | always | self-report: `line.hairline` | convention (protocol choice) |
| [FP-LINE-02](05-ui/space-radius.md) | A hairline is never the only edge of a control | Guard | normative | has: controls | self-report: `line.control-edge` | cited ([source](https://www.w3.org/TR/WCAG22/)) |
| [FP-LINE-03](05-ui/space-radius.md) | Tone ladder | FP-1 | informative | always | self-report: `line.tone` | convention (protocol choice) |
| [FP-LINE-04](05-ui/space-radius.md) | Elevation | FP-1 | informative | mode: native | self-report: `line.elevation` | convention |
| [FP-TYPE-01](05-ui/type.md) | The type scale formula | FP-2 | normative | always | machine: `type.scale` | convention (protocol choice); basis: [cited source](https://alistapart.com/article/more-meaningful-typography/) |
| [FP-TYPE-02](05-ui/type.md) | Step ranges | FP-2 | normative | always | machine: `type.step-range` | convention (protocol choice) |
| [FP-TYPE-03](05-ui/type.md) | Fibonacci substitution | FP-2 | normative | always | machine: `type.align` | convention (protocol choice) |
| [FP-TYPE-04](05-ui/type.md) | Units | FP-2 | normative | always | machine: `type.units` | convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size) |
| [FP-TYPE-05](05-ui/type.md) | Micro text | FP-2 | normative | always | machine: `type.micro` | convention (protocol choice) |
| [FP-TYPE-06](05-ui/type.md) | Control labels | FP-2 | normative | always | self-report: `type.control-label` | convention (protocol choice) |
| [FP-TYPE-12](05-ui/type.md) | Replacing a host's type sizes | FP-2 | normative | mode: overlay or snap | self-report: `type.host-mapping` | convention (protocol choice) |
| [FP-TYPE-07](05-ui/type.md) | Leading by size and role | FP-2 | normative | always | machine: `type.leading` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography) |
| [FP-TYPE-08](05-ui/type.md) | Line height is unitless | FP-2 | normative | platform: web | machine: `type.leading-unitless` | convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/) |
| [FP-TYPE-13](05-ui/type.md) | Line height is declared with the size | FP-2 | normative | platform: web | machine: `type.leading-declared` | convention (protocol choice) |
| [FP-TYPE-09](05-ui/type.md) | Longest line | FP-2 | normative | always | machine: `type.measure-max` | convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/) |
| [FP-TYPE-10](05-ui/type.md) | Target measure | FP-2 | informative | always | self-report: `type.measure-target` | contested ([source](https://webtypography.net/2.1.2)) |
| [FP-TYPE-11](05-ui/type.md) | No typeface is required | FP-2 | informative | always | self-report: `type.typeface` | convention (protocol choice) |
| [FP-LAYOUT-01](05-ui/layout.md) | The φ split | FP-2 | normative | always | machine: `layout.phi-split` | convention |
| [FP-LAYOUT-02](05-ui/layout.md) | Equal content gets equal columns | FP-2 | normative | always | self-report: `layout.equal-allowed` | convention (protocol choice) |
| [FP-LAYOUT-03](05-ui/layout.md) | Growth by Fibonacci pairs | FP-2 | informative | always | self-report: `layout.pairs` | convention |
| [FP-LAYOUT-04](05-ui/layout.md) | Focal convention | FP-2 | informative | always | self-report: `layout.focal` | convention (protocol choice) |
| [FP-LAYOUT-05](05-ui/layout.md) | Container widths | FP-2 | normative | mode: native | machine: `layout.container-widths` | convention (protocol choice) |
| [FP-LAYOUT-06](05-ui/layout.md) | Native breakpoints | FP-2 | informative | mode: native | self-report: `layout.breakpoints` | convention (protocol choice) |
| [FP-LAYOUT-07](05-ui/layout.md) | Hosts keep their breakpoints | FP-2 | normative | mode: overlay or snap | self-report: `layout.host-breakpoints` | convention (protocol choice); basis: [cited source](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes) |
| [FP-CTRL-01](05-ui/controls.md) | Protocol targets are at least the ladder target | Guard | normative | has: controls | self-report: `ctrl.target-rung` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| [FP-CTRL-02](05-ui/controls.md) | Drawn height and hit area are separate | Guard | normative | has: controls | self-report: `ctrl.hit-area` | convention (protocol choice) |
| [FP-CTRL-03](05-ui/controls.md) | Small interactive parts | Guard | normative | has: controls | self-report: `ctrl.small-parts` | convention (protocol choice) |
| [FP-CTRL-04](05-ui/controls.md) | Host controls keep their size if they meet the floor | Guard | normative | has: controls | self-report: `ctrl.host` | convention (protocol choice) |
| [FP-CTRL-05](05-ui/controls.md) | Space between targets | Guard | informative | has: controls | self-report: `ctrl.spacing` | convention (protocol choice); basis: [cited source](https://support.google.com/accessibility/android/answer/7101858) |
| [FP-MOTION-01](05-ui/motion.md) | Interaction durations | FP-3 | informative | has: motion | machine: `motion.durations` | convention (protocol choice); basis: [cited source](https://www.nngroup.com/articles/animation-duration/) |
| [FP-MOTION-02](05-ui/motion.md) | Duration by role | FP-3 | informative | has: motion | self-report: `motion.roles` | convention |
| [FP-MOTION-03](05-ui/motion.md) | Ceiling | FP-3 | informative | has: motion | machine: `motion.ceiling` | convention (protocol choice); basis: [cited source](https://m1.material.io/motion/duration-easing.html) |
| [FP-MOTION-04](05-ui/motion.md) | Easing | FP-3 | informative | has: motion | machine: `motion.easing` | convention |
| [FP-MOTION-05](05-ui/motion.md) | Ambient loops | FP-3 | informative | has: motion | machine: `motion.loops` | convention (protocol choice) |
| [FP-MOTION-06](05-ui/motion.md) | What a loop may change | FP-3 | informative | has: motion | self-report: `motion.loop-properties` | convention |
| [FP-MOTION-07](05-ui/motion.md) | Undo window | FP-3 | informative | has: time limits | self-report: `motion.grace` | convention (protocol choice) |
| [FP-LAYER-01](05-ui/layers-colour-state.md) | Layer roles | FP-3 | informative | mode: native | self-report: `layer.roles` | convention (protocol choice) |
| [FP-LAYER-02](05-ui/layers-colour-state.md) | Hosts keep their layers | FP-3 | informative | mode: overlay or snap | self-report: `layer.host` | convention (protocol choice) |
| [FP-COLOR-01](05-ui/layers-colour-state.md) | Colour is slots | FP-3 | informative | mode: native | machine: `color.slots` | convention (protocol choice) |
| [FP-COLOR-02](05-ui/layers-colour-state.md) | Light and dark | FP-3 | informative | mode: native | machine: `color.themes` | convention (protocol choice) |
| [FP-COLOR-03](05-ui/layers-colour-state.md) | Hosts keep their colours | FP-3 | informative | mode: overlay or snap | self-report: `color.host` | convention (protocol choice) |
| [FP-COLOR-04](05-ui/layers-colour-state.md) | Accent is not a state | FP-3 | informative | always | self-report: `color.accent` | convention (protocol choice) |
| [FP-STATE-01](05-ui/layers-colour-state.md) | State identifiers | FP-3 | informative | has: states | machine: `state.identifiers` | convention (protocol choice) |
| [FP-STATE-02](05-ui/layers-colour-state.md) | State forms | FP-3 | informative | has: states | self-report: `state.forms` | convention (protocol choice) |
| [FP-STATE-03](05-ui/layers-colour-state.md) | Mark size | FP-3 | informative | has: states | machine: `state.mark-size` | convention (protocol choice) |
| [FP-STATE-04](05-ui/layers-colour-state.md) | Chips grow with their text | FP-3 | informative | has: states | machine: `state.chip-height` | convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/) |
| [FP-STATE-05](05-ui/layers-colour-state.md) | Animation keeps the mark readable | FP-3 | informative | has: states | self-report: `state.animation-contrast` | convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/) |
| [FP-STATE-06](05-ui/layers-colour-state.md) | Quiet is muted, not faded | FP-3 | informative | has: states | self-report: `state.quiet` | convention (protocol choice) |
| [FP-STATE-07](05-ui/layers-colour-state.md) | Done has no hue | FP-3 | informative | has: states | self-report: `state.done` | convention (protocol choice) |
| [FP-STATE-08](05-ui/layers-colour-state.md) | Tint | FP-3 | informative | has: states | machine: `state.tint` | convention (protocol choice) |
| [FP-STATE-09](05-ui/layers-colour-state.md) | Disabled | FP-3 | informative | has: controls | self-report: `state.disabled` | convention (protocol choice) |
| [FP-ART-01](06-art.md) | Golden-angle placement | FP-4a | informative | has: generated art | machine: `art.golden-angle` | convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4) |
| [FP-ART-02](06-art.md) | Vogel spiral | FP-4a | informative | has: generated art | machine: `art.vogel` | convention; basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4) |
| [FP-ART-03](06-art.md) | Fibonacci counts | FP-4a | informative | has: generated art | self-report: `art.counts` | convention |
| [FP-ART-04](06-art.md) | Captions state the rule and the real count | FP-4a | informative | has: generated art | self-report: `art.captions` | convention (protocol choice) |
| [FP-ART-05](06-art.md) | Same inputs, same output | FP-4a | informative | has: generated art | machine: `art.determinism` | convention (protocol choice) |
| [FP-ART-06](06-art.md) | Variation comes from an integer hash | FP-4a | informative | has: generated art | machine: `art.hash` | convention (protocol choice) |
| [FP-ART-07](06-art.md) | Output format | FP-4a | informative | has: generated art | machine: `art.output-format` | convention (protocol choice) |
| [FP-ART-08](06-art.md) | Structure | FP-4a | informative | has: generated art | machine: `art.svg-structure` | convention (protocol choice) |
| [FP-ART-09](06-art.md) | Paint | FP-4a | informative | has: generated art | machine: `art.svg-paint` | convention (protocol choice) |
| [FP-ART-10](06-art.md) | Accessible name | FP-4a | informative | has: generated art | machine: `art.svg-name` | convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/) |
| [FP-ART-11](06-art.md) | Art that moves | FP-4a | informative | has: generated art | self-report: `art.motion` | convention (protocol choice) |
| [FP-VIZ-01](07-data-viz.md) | φ frames, never data | Guard | normative | has: charts | self-report: `viz.frames-not-data` | convention (protocol choice) |
| [FP-VIZ-04](07-data-viz.md) | Bars start at zero and are equally wide | Guard | normative | has: charts | self-report: `viz.bars` | convention; basis: [cited source](https://ar5iv.arxiv.org/html/1907.02035) |
| [FP-VIZ-05](07-data-viz.md) | No bent scales, no blended measures | Guard | normative | has: charts | self-report: `viz.scales` | convention (protocol choice) |
| [FP-VIZ-06](07-data-viz.md) | Not measured is not zero | Guard | normative | has: charts | self-report: `viz.not-measured` | convention (protocol choice) |
| [FP-VIZ-02](07-data-viz.md) | The data sets the aspect | FP-4b | informative | has: charts | self-report: `viz.aspect` | contested ([source](https://www.tableau.com/research/publications/empirical-model-slope-ratio-comparisons)) |
| [FP-VIZ-03](07-data-viz.md) | Nice-number ticks | FP-4b | informative | has: charts | machine: `viz.ticks` | convention; basis: [cited source](https://www.ri.cmu.edu/publications/nice-numbers-for-graph-labels) |
| [FP-VIZ-07](07-data-viz.md) | Sequential colour | FP-4b | informative | has: charts | self-report: `viz.sequential` | convention; basis: [cited source](https://bids.github.io/colormap/) |
| [FP-VIZ-08](07-data-viz.md) | Categorical colour | FP-4b | informative | has: charts | self-report: `viz.categorical` | convention |
| [FP-VIZ-09](07-data-viz.md) | Bar gaps and ends | FP-4b | informative | has: charts | self-report: `viz.bar-gaps` | convention (protocol choice) |
| [FP-VIZ-10](07-data-viz.md) | Stat tiles | FP-4b | informative | has: charts | self-report: `viz.stat-tile` | convention (protocol choice) |
| [FP-VIZ-11](07-data-viz.md) | Sparklines | FP-4b | informative | has: charts | self-report: `viz.sparkline` | convention (protocol choice) |
| [FP-VIZ-12](07-data-viz.md) | Dot fields | FP-4b | informative | has: charts | self-report: `viz.dot-field` | convention (protocol choice); basis: [cited source](https://doi.org/10.1016/0025-5564(79)90080-4) |
| [FP-PLAT-01](08-platforms/web.md) | Web units | FP-1 | normative | platform: web | machine: `plat.web-units` | convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size) |
| [FP-PLAT-02](08-platforms/web.md) | Web custom properties | FP-1 | normative | platform: web | machine: `plat.web-tokens` | convention (protocol choice) |
| [FP-PLAT-03](08-platforms/web.md) | Web pointer queries | Guard | normative | platform: web | machine: `plat.web-pointer` | convention (protocol choice) |
| [FP-PLAT-04](08-platforms/web.md) | Tailwind preset | FP-1 | informative | platform: web | machine: `plat.web-tailwind` | convention (protocol choice) |
| [FP-PLAT-05](08-platforms/apple.md) | iOS anchors | Guard | normative | platform: ios | self-report: `plat.ios-anchors` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography) |
| [FP-PLAT-06](08-platforms/apple.md) | macOS anchors | Guard | normative | platform: macos | self-report: `plat.macos-anchors` | convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| [FP-PLAT-07](08-platforms/apple.md) | SwiftUI mapping | FP-2 | informative | platform: ios or macos | self-report: `plat.swiftui` | convention (protocol choice) |
| [FP-PLAT-08](08-platforms/android.md) | Android anchors | Guard | normative | platform: android | self-report: `plat.android-anchors` | convention (protocol choice); basis: [cited source](https://support.google.com/accessibility/android/answer/7101858) |
| [FP-PLAT-09](08-platforms/android.md) | Compose mapping | FP-2 | informative | platform: android | self-report: `plat.compose` | convention (protocol choice) |
| [FP-PLAT-10](08-platforms/print-slides-email.md) | Print | FP-2 | informative | always | self-report: `plat.print` | convention (protocol choice) |
| [FP-PLAT-11](08-platforms/print-slides-email.md) | Slides | FP-2 | informative | always | self-report: `plat.slides` | convention (protocol choice) |
| [FP-PLAT-12](08-platforms/print-slides-email.md) | Email | FP-2 | informative | always | self-report: `plat.email` | convention (protocol choice) |
| [FP-AGENT-01](09-agent-protocol.md) | Read the configuration, or ask once | Agent | normative | always | self-report: `agent.config` | convention (protocol choice) |
| [FP-AGENT-02](09-agent-protocol.md) | Decision order | Agent | normative | always | self-report: `agent.order` | convention (protocol choice) |
| [FP-AGENT-03](09-agent-protocol.md) | Consent | Agent | normative | always | self-report: `agent.consent` | convention (protocol choice) |
| [FP-AGENT-12](09-agent-protocol.md) | Exemptions an agent declares are listed | Agent | normative | always | self-report: `agent.exemptions-listed` | convention (protocol choice) |
| [FP-AGENT-04](09-agent-protocol.md) | Non-interactive runs do not stall | Agent | normative | always | self-report: `agent.non-interactive` | convention (protocol choice) |
| [FP-AGENT-05](09-agent-protocol.md) | Done-checks | Agent | normative | always | self-report: `agent.done-checks` | convention (protocol choice) |
| [FP-AGENT-14](09-agent-protocol.md) | The report file | Agent | normative | always | machine: `agent.report-file` | convention (protocol choice) |
| [FP-AGENT-06](09-agent-protocol.md) | Name the rules used | Agent | normative | always | self-report: `agent.rule-ids` | convention (protocol choice) |
| [FP-AGENT-07](09-agent-protocol.md) | Report every off-ladder value | Agent | normative | always | machine: `agent.fp-off` | convention (protocol choice) |
| [FP-AGENT-08](09-agent-protocol.md) | Report every change to a host value | Agent | normative | always | machine: `agent.fp-change` | convention (protocol choice) |
| [FP-AGENT-13](09-agent-protocol.md) | Work in the adopter's files | Agent | normative | always | self-report: `agent.in-place` | convention (protocol choice) |
| [FP-AGENT-09](09-agent-protocol.md) | No aesthetic claims | Agent | normative | always | self-report: `agent.no-aesthetic-claims` | convention (protocol choice); basis: [cited source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063) |
| [FP-AGENT-10](09-agent-protocol.md) | Skill verbs | Agent | normative | always | self-report: `agent.skill-verbs` | convention (protocol choice) |
| [FP-AGENT-11](09-agent-protocol.md) | About line | Agent | normative | always | self-report: `agent.about-line` | convention (protocol choice) |
| [FP-HONEST-01](10-evidence-honesty.md) | Every rule carries an evidence label | Guard | normative | the specification | machine: `honest.labels` | convention (protocol choice) |
| [FP-HONEST-02](10-evidence-honesty.md) | Banned words | Guard | normative | the report | machine: `honest.banned-words` | convention (protocol choice) |
| [FP-HONEST-03](10-evidence-honesty.md) | Claims that are never made | Guard | normative | always | self-report: `honest.banned-claims` | convention; basis: [cited source](https://webarchive.lib.cuhk.edu.hk/20210329125916mp_/http://www.math.cuhk.edu.hk/~pschan/uged1533/markowsky.pdf) |
| [FP-HONEST-04](10-evidence-honesty.md) | A claim says what was tested | Guard | normative | the report | machine: `honest.claim-wording` | convention (protocol choice) |
| [FP-HONEST-05](10-evidence-honesty.md) | Invent nothing | Guard | normative | always | self-report: `honest.invent-nothing` | convention (protocol choice) |
| [FP-HONEST-06](10-evidence-honesty.md) | Null results are stated | Guard | normative | the specification | self-report: `honest.null-results` | convention (protocol choice); basis: [cited source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063) |
| [FP-TOKEN-01](tokens.md) | Token format | FP-1 | normative | protocol token files | machine: `token.dtcg` | cited ([source](https://www.designtokens.org/tr/2025.10/)) |
| [FP-TOKEN-02](tokens.md) | Types and units | FP-1 | normative | protocol token files | machine: `token.types` | cited ([source](https://www.designtokens.org/tr/2025.10/)) |
| [FP-TOKEN-03](tokens.md) | Names | FP-1 | normative | protocol token files | machine: `token.names` | cited ([source](https://www.designtokens.org/tr/2025.10/)) |
| [FP-TOKEN-04](tokens.md) | The master is in platform units | FP-1 | normative | protocol token files | machine: `token.master-unit` | convention (protocol choice) |
| [FP-TOKEN-05](tokens.md) | Themes | FP-1 | normative | protocol token files | machine: `token.themes` | convention (protocol choice) |
| [FP-TOKEN-06](tokens.md) | Rule metadata | FP-1 | normative | protocol token files | machine: `token.extensions` | convention (protocol choice); basis: [cited source](https://www.designtokens.org/tr/2025.10/) |
| [FP-TOKEN-07](tokens.md) | File metadata | FP-1 | normative | protocol token files | machine: `token.root-metadata` | convention (protocol choice) |
| [FP-TOKEN-08](tokens.md) | Generated outputs | FP-1 | normative | the specification | machine: `token.outputs` | convention (protocol choice) |
| [FP-TOKEN-09](tokens.md) | Type in rem | FP-1 | normative | protocol token files | machine: `token.type-rem` | convention (protocol choice) |
| [FP-TOKEN-10](tokens.md) | Style Dictionary compatibility | FP-1 | informative | protocol token files | machine: `token.style-dictionary` | convention (protocol choice); basis: [cited source](https://styledictionary.com/info/dtcg/) |

## Lineage

The Fibonacci Protocol grew out of design systems built in-house at Lyrikai during 2026: interface systems that used a Fibonacci ladder for space and radius, and an art practice that grew illustrations from the golden angle. The protocol restates what those systems had in common in a brand-neutral form, corrects what did not meet accessibility floors, and drops what could not be supported by evidence. The Native test fixture is a corrected copy derived from one of them and is labelled as derived.

## Licence

MIT License. Third-party values used as test fixtures keep their own licences and notices in their own folders.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
