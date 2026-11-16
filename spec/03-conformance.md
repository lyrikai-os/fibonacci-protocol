# 3. Conformance

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

## Levels

### FP-CONF-01 · Guard rules are the base of every level

Every claim, at every level and in every mode, requires every normative Guard rule that applies to the system to pass. One applicable Guard rule that fails voids the claim. A Guard rule that does not apply is recorded as `n/a` (FP-CONF-11) and does not affect the claim. Guard rules are tested on the scope of the claim: the files in `scope` and every view those files style.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.guard-base` · **Evidence:** convention (protocol choice)


### FP-CONF-02 · Levels are cumulative

FP-1 covers space and radius. FP-2 requires FP-1 and adds type, layout and grids. FP-3 requires FP-2 and adds motion and the state grammar.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.cumulative` · **Evidence:** convention (protocol choice)


### FP-CONF-03 · FP-4a and FP-4b are separate badges

FP-4a (art and illustration) and FP-4b (data visualisation) each require only the applicable Guard rules and their own rules. Either MAY be claimed without FP-1 to FP-3.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.badges` · **Evidence:** convention (protocol choice)


### FP-CONF-04 · The claim string

A claim MUST be written as `<level> · <mode> · u=<unit> · <platform> · spec <version>`. An Overlay claim MUST add `scope <globs> · coverage <percent> · exceptions <count>` before the version. A claim MUST end with ` · self-assessed` unless FP-CONF-14 allows it to be dropped. When the machine tests pass but self-report rules are still open (FP-CONF-06), there is no claim yet. A checker then prints a candidate line instead, in the form `candidate · <the claim string> · open <count>`, and lists the open rule IDs. In its text output a checker heads the machine result `MACHINE TESTS: PASS` (or `FAIL`, `PENDING`, `NOT-RUN`), never `RESULT: PASS`, so that a pass of the machine tests above a candidate line is not read as a claim. A candidate line MUST NOT be published or quoted as a claim.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `conf.claim-format` · **Evidence:** convention (protocol choice)


### FP-CONF-05 · Version 1.0 claims: FP-1 and FP-2, on the web

Under version 1.0 a claim MAY name FP-1 or FP-2 only, and its platform MUST be `web`. FP-3, FP-4a, FP-4b and the other platforms are published as guidance and MUST NOT be claimed until a later version makes them normative.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `conf.v1-levels` · **Evidence:** convention (protocol choice)


### FP-CONF-12 · Agent conformance is separate

The FP-AGENT rules describe an agent or a skill, not a design system. They MUST NOT be counted in a system's claim. An agent or skill that meets every normative FP-AGENT rule MAY say that it "follows the Fibonacci Protocol agent rules, spec <version>".

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** self-report, `conf.agent-separate` · **Evidence:** convention (protocol choice)


## Results

### FP-CONF-11 · Not applicable

Every rule states when it applies. Where that condition is false for the system under test, the rule's result MUST be `n/a`, with a reason of one line (for example "no charts", "platform is web", "mode is overlay"). An `n/a` result is not a failure and needs no evidence beyond the reason. A rule MUST NOT be marked `n/a` when its condition is true: `n/a` comes from the configuration alone, and an `n/a` written into `fp-evidence.json` for an applicable rule fails FP-CONF-06. The `has:` conditions are read from `has` in the configuration, and a checker MUST fail this rule when the source contradicts a `false`: `has.motion` is contradicted by any `animation`, `transition` or `@keyframes` in the scope, and by a `<marquee>` element or an SVG `<animate>`, `<animateTransform>` or `<animateMotion>` element in any HTML file the checker reads; `has.controls` by any selector in the scope that names `button`, `a`, `input`, `select`, `textarea`, `summary`, `[role="button"]`, `:focus`, `:focus-visible` or `:hover`, and by any of these elements in an HTML file the checker reads: `button`, `a` with `href`, `input`, `select`, `textarea`, `summary`, or an element whose `role` is `button`, `link`, `checkbox`, `radio`, `tab` or `switch`. The other four (`timeLimits`, `charts`, `generatedArt`, `states`) cannot be read from CSS in version 1.0 and are the adopter's statement, which MUST be honest: `has.states` is true wherever the scope shows status of any kind (badges, alerts, validation messages, progress, online or offline marks).

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.not-applicable` · **Evidence:** convention (protocol choice)


The conditions used in this specification are:

| Applies when | True when |
|---|---|
| always | every system |
| the specification | this document and its publisher only; `n/a` for an adopter's system and not part of a run |
| a checker | any tool that runs the machine tests; `n/a` for an adopter's system and not part of a run |
| the report | every run; tested on the report and the claim, not on the product |
| mode: overlay, snap or native (also "native or overlay", "overlay or snap") | `mode` in the configuration has that value, or one of the two named |
| level: FP-2 and up | the claim is FP-2 or higher, in any mode |
| protocol-owned type | the system uses the protocol's type tokens: always at FP-2 and up, and in Native |
| platform: web, ios, macos or android (also "ios or macos") | `platform` in the configuration has that value. A claim covers one platform; a product on several platforms makes one claim for each |
| has: motion | `has.motion` is true: the scope shows anything that moves, blinks, scrolls or transitions on its own or on interaction |
| has: time limits | `has.timeLimits` is true: the scope removes or changes anything after a set time without the user asking |
| has: controls | `has.controls` is true: the scope has interactive elements |
| has: charts | `has.charts` is true: the scope shows data graphics |
| has: generated art | `has.generatedArt` is true: the scope ships art made by a generator |
| has: states | `has.states` is true: the scope shows status or state indicators |
| protocol token files | the system ships token files in the protocol's format (`*.tokens.json`). A system in any mode, Native included, that ships none has these rules as `n/a` |

FP-CONF-13 was never assigned; the number is not in use.

### FP-CONF-06 · Machine tests, self-report and the evidence file

Each rule names its test. A machine test is one that can be decided from the inputs listed under "Checker inputs", locally, with no network. A self-report item MUST be answered with evidence: a measurement, a screenshot, a file reference or a recorded check. A self-report item that applies and has no evidence is open (see below): it is not a failure and not `not-run`, and it holds back the claim. A SHOULD inside a normative rule is a recommendation: not following it is reported as "recommendation not followed", with the reason, and does not fail the rule.

Self-report answers are recorded in a file, `fp-evidence.json`, beside `fp.config.json`. It MUST validate against [fp-evidence.schema.json](fp-evidence.schema.json). It holds `fp` (the spec version), `adopter` (who is making the claim), and `items`: one entry for each applicable self-report rule, keyed by rule ID, with `result` (`pass` or `fail`), `evidence` (text, a file path or a URL) and `by` (who assessed it). An entry MAY add `"independent": true` when `by` is neither the adopter nor a person or agent working for the adopter.

A self-report rule is applicable when it is normative, its level is within the claim (Guard, FP-1, and FP-2 for an FP-2 claim), and its applies-when condition is true for the configuration. A checker works this list out from `rules.json` and the configuration, and reads the file:

- an applicable rule with no entry, or with empty `evidence`, is **open**. "Open" is the only word for this state;
- an entry with `result` `fail` fails this rule and the run;
- an entry with `result` `n/a` on an applicable rule fails this rule and the run. Whether a rule applies is decided only by the configuration (`mode`, `level`, `platform`, `has`, `roles`), never by the evidence file. An adopter who believes a rule does not apply changes the declaration that makes it apply, and a checker can contradict that declaration (FP-CONF-11). A rule that applies but finds nothing to act on (a scope with no status messages, for FP-A11Y-19) is answered `pass`, with that fact as the evidence. An `n/a` entry is accepted only for a rule the configuration already makes not applicable, where it changes nothing;
- the claim is valid only when the machine tests pass, no exception is pending, and no applicable self-report rule is open.

Two things are reported separately and never merged. The **machine result** (`result` in a report: `pass`, `fail`, `pending` or `not-run`) covers the machine tests, this one included. The **claim state** (`claimState`) is `valid` when there is a claim, `candidate` when the machine result is `pass` but rules are open, and `none` otherwise.

`"independent": true` is a statement by whoever writes the file. A checker cannot verify it; it only reads it. A reader who relies on a claim without the `self-assessed` suffix is relying on that statement and on the named assessor.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `conf.evidence` · **Evidence:** convention (protocol choice)


### FP-CONF-07 · A pass needs zero pending exceptions

A run passes a level only when every applicable machine test passes, every applicable self-report item has evidence, and no exception has the status `pending`. A run with pending exceptions reports the result `pending`, which is not a pass and MUST NOT be claimed.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `conf.no-pending` · **Evidence:** convention (protocol choice)


### FP-CONF-14 · Machine tests not run, and self-assessment

If the machine tests of a level have not been run, each has the result `not-run`, the run's result is `not-run`, and no claim may be made. The report MUST say what ran the machine tests: the reference checker and its version, another tool, or a person. A claim MUST end with `self-assessed` when either of these is true: the machine tests were not run by the reference checker; or the self-report items were answered by the adopter, or by an agent working for the adopter. This is the normal case, including after a clean run of the reference checker. The suffix is dropped only when the reference checker ran the machine tests and a party other than the adopter assessed every applicable self-report item and is named in the report. A checker decides this from `fp-evidence.json`: the suffix stays if any applicable item's `by` is the adopter or lacks `"independent": true`. Words such as "provisional pass" MUST NOT be used.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `conf.not-run` · **Evidence:** convention (protocol choice)


## Checker inputs

### FP-CONF-08 · What a checker reads and how it classifies

A checker for version 1.0 reads: plain CSS files, and `<style>` blocks in HTML files, named by `source` and `scope`; and token files in the protocol's format. It does not read CSS-in-JS, preprocessor source or inline `style` attributes. Compile the first two to CSS first, or report them as `not-run`. Lengths in inline `style` attributes are a self-report item: the report lists them with their values, or states that the scope has none. It MUST expand shorthands, follow `var()` references within the source to a resolved value, and accept `calc()` only in the two derived patterns (FP-SPACE-04). It MUST classify each value before testing it:

- **Layout lengths** (tested against the ladder at the declared u): `margin`, `padding`, `gap`, `inset`, `width`, `height`, `inline-size`, `block-size`, their `min-` and `max-` forms, and every longhand and logical form of these (`margin-inline`, `padding-block-start`, `row-gap`, `top`, `inset-inline-end` and so on).
- **Fine detail** (tested against fixed sets in platform units, whatever u is): `border-radius` and its longhands against the radius set; `border-width`, `outline-width` and `outline-offset` against 0, 1, 2 and 3.
- **Type** (`font-size`, `line-height`): tested by FP-TYPE rules at FP-2 and up, never as lengths. A checker does not compute the cascade: it tests a `line-height` against the `font-size` declared in the same rule (FP-TYPE-13).
- **Not tested in version 1.0:** `box-shadow`, `transform`, `background-position`, `letter-spacing`, SVG geometry, and everything else.
- **Never lengths under test:** a width or height written inside the condition of `@media` or `@container` (a breakpoint). Hosts keep their breakpoints (FP-LAYOUT-07), so a breakpoint is not checked, not snapped and never reported as an `FP-OFF` line, in any mode. The declarations inside the block are read as usual.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.classify` · **Evidence:** convention (protocol choice)


### FP-CONF-09 · What a checker never flags

A checker MUST NOT flag: equal-width columns or a host's column grid; equal-width bars in a chart; tokens with the `icon`, `type`, `breakpoint`, `drawn` or `micro` role; `target` tokens that meet FP-SNAP-04; intrinsic values (`%`, `fr`, `auto`, `ch`, `min-content`, `max-content`, `fit-content`); unitless line heights; z-index and opacity values; and anything outside the scope.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** machine, `conf.not-flagged` · **Evidence:** convention (protocol choice)


### FP-CONF-10 · The limits of a check are stated

A report MUST state which rules were machine-tested, which were self-reported, which were `n/a` and which were `not-run`. Target sizes, reflow, colour-only states and pause controls cannot be proved from source files. A passing run MUST NOT be described as proof that a product is accessible.

- **Level:** Guard · **Status:** normative · **Applies when:** a checker · **Test:** self-report, `conf.limits-stated` · **Evidence:** convention (protocol choice)


## What each level tests

| Level | Machine tests | Self-report items |
|---|---|---|
| Guard | contrast on declared pairs; a `has` value contradicted by the source; banned words; claim format; pending exceptions | target sizes; focus; reflow at 320; state never by colour alone; pause control; flashes; time limits; reduced motion; data honesty |
| FP-1 | every checked length resolves to the ladder, a fixed set, an intrinsic value, a derived pattern or a declared exception; Snap table validity; Overlay coverage | the Snap "what breaks" block; the may-change list |
| FP-2 | type sizes by formula; step ranges; body anchor; rem units; leading by size; unitless line heights; measure at most 80 characters; φ split ratio where declared; Native container widths | host type mapping; equal columns; reflow |
| FP-3 | durations on the ms ladder; easing set; loop total time in CSS | state forms; undo window |
| FP-4a | constants; hash test vectors; SVG structure (from version 1.1) | captions; art motion |
| FP-4b | none in version 1.0 | the full list in [07-data-viz.md](07-data-viz.md) |

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
