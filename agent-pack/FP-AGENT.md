# Lyrikai: Fibonacci Protocol for UI/UX Design Agents: FP-AGENT, the protocol in one file

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

This file is the whole protocol for a design agent, for any LLM or tool. It is generated from `spec/rules.json`, so it matches the specification exactly. Normative rules are binding and tested: their ID, title and text are given in full. Informative rules are guidance that binds no claim in this version: they are listed at the end.

Activation: the user types `/lyrikai-fibonacci on` or says "use Fibonacci design principles". The agent rules (FP-AGENT-01 to FP-AGENT-12) come first; they are not part of a system's claim (FP-CONF-12). Version 1.0 claims are FP-1 or FP-2 on the web only (FP-CONF-05).

Counts: 125 normative rules, 60 informative rules, 185 in all.

## Normative rules

### Agent rules (how a design agent behaves) (12)

#### FP-AGENT-01 · Read the configuration, or ask once

Before designing, an agent MUST read `fp.config.json`. If there is none, it MUST ask the user once for mode, level, platform and unit, and proceed with the answer. If it cannot ask, it uses what the request states and these defaults for the rest: unit 1, pointer `both`, platform `web`, `type.align` `formula`. Mode and level have no default: without them the agent runs the checks, changes nothing and reports. An agent MAY suggest another unit (for example u = 4 for a 4-based grid) but MUST NOT apply a unit the user did not state or accept. Writing the configuration depends on whether anyone can answer. In an interactive session the agent shows the configuration and waits for a yes before writing it (this is what `init` does). In a non-interactive run, a request to apply the protocol is itself the consent to write a configuration that records exactly the values used; the report MUST list which were defaults.

- **Applies when:** always · **Test:** self-report, `agent.config` · **Evidence:** convention (protocol choice)

#### FP-AGENT-02 · Decision order

When rules pull in different directions, an agent MUST decide in this order, and the first that applies wins:

1. Accessibility floors (section 4).
2. Data honesty (FP-VIZ-01, FP-VIZ-04, FP-VIZ-05, FP-VIZ-06).
3. The platform anchor (body size, units, target floor).
4. The host's mode and its tokens.
5. The ladder or the type scale, chosen by role.
6. φ, for proportion.
7. Report what could not be kept.

- **Applies when:** always · **Test:** self-report, `agent.order` · **Evidence:** convention (protocol choice)

#### FP-AGENT-03 · Consent

A declared `snap` mode, in the configuration or in the user's request, is the user's consent to build and apply the Snap table. An agent MUST ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; and changing the value of any host token in Overlay, including a colour that fails a contrast floor.

- **Applies when:** always · **Test:** self-report, `agent.consent` · **Evidence:** convention (protocol choice)

#### FP-AGENT-04 · Non-interactive runs do not stall

When no one is available to answer, an agent MUST NOT wait. It applies what it has consent for, leaves anything that needs a yes unchanged, records each such item as an `FP-OFF` or `FP-CHANGE` line with `status=pending`, and continues to the end. The result of such a run is `pending` (FP-CONF-07).

- **Applies when:** always · **Test:** self-report, `agent.non-interactive` · **Evidence:** convention (protocol choice)

#### FP-AGENT-05 · Done-checks

Before reporting that work is done, an agent MUST: run the machine tests with the reference checker (`node tools/fp-check/fp-check.mjs`) if it is available, and otherwise with its own script or by hand, saying which; answer the self-report items that apply, with evidence; state mode, level, unit and platform; list every exception and every `n/a` with its reason; put anything it would recommend but may not apply without consent (another unit, an override) under a heading "Suggestions"; and state the result as `pass`, `fail`, `pending` or `not-run`. The claim ends with `self-assessed` as FP-CONF-14 requires.

- **Applies when:** always · **Test:** self-report, `agent.done-checks` · **Evidence:** convention (protocol choice)

#### FP-AGENT-06 · Name the rules used

An agent MUST name the rule IDs it applied, so that a person can look each one up.

- **Applies when:** always · **Test:** self-report, `agent.rule-ids` · **Evidence:** convention (protocol choice)

#### FP-AGENT-07 · Report every off-ladder value

Each length or type size an agent could not keep on the ladder or the scale MUST be reported on one line in this form:

`FP-OFF <where> value=<v> nearest=<lower>/<upper> reason=<floor|host-token|data|content|platform|snap-drift> rule=<ID> status=<accepted|pending>`

A reason of `floor` is `accepted` at once. A reason of `data` is `accepted` at once only if the line also carries `source=<where the data comes from>`. Any other reason is `pending` until the user accepts it; accepted records are written to `exceptions` in `fp.config.json`.

- **Applies when:** always · **Test:** machine, `agent.fp-off` · **Evidence:** convention (protocol choice)

#### FP-AGENT-08 · Report every change to a host value

An agent MUST NOT change a value without saying so, and MUST NOT present a snapped design as identical to the original. Snapped lengths are reported in the Snap table (FP-SNAP-08). Every other change to something the host had (a body size raised to the anchor, a colour changed to meet a contrast floor, a type size replaced by a step) MUST be reported on one line in this form:

`FP-CHANGE <where> from=<old> to=<new> reason=<floor|scale|snap> rule=<ID> status=<accepted|pending>`

`<where>` is a file and line, a selector or a token address. One line MAY cover several places when `from`, `to`, `reason` and `rule` are the same for all of them: the places are listed, separated by commas.

- **Applies when:** always · **Test:** machine, `agent.fp-change` · **Evidence:** convention (protocol choice)

#### FP-AGENT-09 · No aesthetic claims

An agent MUST NOT say that a design is more beautiful, more natural, more harmonious or better because it uses φ or Fibonacci numbers. It MAY say that the design is consistent and which rules it meets. Evidence: the agent's report, read by a person or swept for the banned words (FP-HONEST-02).

- **Applies when:** always · **Test:** self-report, `agent.no-aesthetic-claims` · **Evidence:** convention (protocol choice)

#### FP-AGENT-10 · Skill verbs

The `/lyrikai-fibonacci` skill MUST provide exactly these verbs:

- `on [FP-1|FP-2|FP-3|FP-4a|FP-4b] [overlay|snap|native]`: turn the protocol on for the conversation. With no arguments it prints the current state. If there is no `fp.config.json`, it asks once for mode, level, platform and unit (FP-AGENT-01). The phrase "use Fibonacci design principles" is the same activation.
- `off`: turn it off.
- `init`: show a starter `fp.config.json` and write it only on a yes. `init` is interactive by definition; a non-interactive run writes its configuration under FP-AGENT-01 instead.
- `check`: run the reference checker where the repository is present, with `node tools/fp-check/fp-check.mjs [folder]` (Node.js, no packages, offline), and otherwise work through the same tests by hand; then report rule IDs, `FP-OFF` and `FP-CHANGE` lines and the result.
- `explain <rule-ID>`: print the rule's text, level, status, applies-when, test and evidence, from the copy of `rules.json` the skill carries.
- `map`: print the Snap table for the user's tokens in the format of FP-SNAP-08 (one row per token: name, role, original, snapped, drift, merged group, override reason), with the "what breaks" block. The rungs come from FP-MATH-03 at the declared unit (FP-MATH-06; the lists are also in `fp.config.schema.json` under `$defs`). It changes nothing.

A request for a level that is informative in this version MUST be answered with that fact.

- **Applies when:** always · **Test:** self-report, `agent.skill-verbs` · **Evidence:** convention (protocol choice)

#### FP-AGENT-11 · About line

The skill's output MUST end with a line that names the protocol, the spec version it was built from and https://www.lyrikai.com. The skill MUST carry a copy of the agent rules and of `rules.json` so that it works offline.

- **Applies when:** always · **Test:** self-report, `agent.about-line` · **Evidence:** convention (protocol choice)

#### FP-AGENT-12 · Exemptions an agent declares are listed

An agent MAY add `roles` entries for tokens whose role is plain from their name and use. Because an exemption reduces what is tested, the report MUST list every exemption the agent added, with the token and the role, under its own heading.

- **Applies when:** always · **Test:** self-report, `agent.exemptions-listed` · **Evidence:** convention (protocol choice)

### Guard rules (the base of every level) (49)

#### FP-CONF-01 · Guard rules are the base of every level

Every claim, at every level and in every mode, requires every normative Guard rule that applies to the system to pass. One applicable Guard rule that fails voids the claim. A Guard rule that does not apply is recorded as `n/a` (FP-CONF-11) and does not affect the claim. Guard rules are tested on the scope of the claim: the files in `scope` and every view those files style.

- **Applies when:** a checker · **Test:** machine, `conf.guard-base` · **Evidence:** convention (protocol choice)

#### FP-CONF-02 · Levels are cumulative

FP-1 covers space and radius. FP-2 requires FP-1 and adds type, layout and grids. FP-3 requires FP-2 and adds motion and the state grammar.

- **Applies when:** a checker · **Test:** machine, `conf.cumulative` · **Evidence:** convention (protocol choice)

#### FP-CONF-03 · FP-4a and FP-4b are separate badges

FP-4a (art and illustration) and FP-4b (data visualisation) each require only the applicable Guard rules and their own rules. Either MAY be claimed without FP-1 to FP-3.

- **Applies when:** a checker · **Test:** machine, `conf.badges` · **Evidence:** convention (protocol choice)

#### FP-CONF-04 · The claim string

A claim MUST be written as `<level> · <mode> · u=<unit> · <platform> · spec <version>`. An Overlay claim MUST add `scope <globs> · coverage <percent> · exceptions <count>` before the version. A claim MUST end with ` · self-assessed` unless FP-CONF-14 allows it to be dropped.

- **Applies when:** the report · **Test:** machine, `conf.claim-format` · **Evidence:** convention (protocol choice)

#### FP-CONF-05 · Version 1.0 claims: FP-1 and FP-2, on the web

Under version 1.0 a claim MAY name FP-1 or FP-2 only, and its platform MUST be `web`. FP-3, FP-4a, FP-4b and the other platforms are published as guidance and MUST NOT be claimed until a later version makes them normative.

- **Applies when:** the report · **Test:** machine, `conf.v1-levels` · **Evidence:** convention (protocol choice)

#### FP-CONF-12 · Agent conformance is separate

The FP-AGENT rules describe an agent or a skill, not a design system. They MUST NOT be counted in a system's claim. An agent or skill that meets every normative FP-AGENT rule MAY say that it "follows the Fibonacci Protocol agent rules, spec <version>".

- **Applies when:** the report · **Test:** self-report, `conf.agent-separate` · **Evidence:** convention (protocol choice)

#### FP-CONF-11 · Not applicable

Every rule states when it applies. Where that condition is false for the system under test, the rule's result MUST be `n/a`, with a reason of one line (for example "no charts", "platform is web", "mode is overlay"). An `n/a` result is not a failure and needs no evidence beyond the reason. A rule MUST NOT be marked `n/a` when its condition is true. The `has:` conditions are read from `has` in the configuration, and a checker MUST fail this rule when the source contradicts a `false`: `has.motion` is contradicted by any `animation`, `transition` or `@keyframes` in the scope; `has.controls` by any selector in the scope that names `button`, `a`, `input`, `select`, `textarea`, `summary`, `[role="button"]`, `:focus`, `:focus-visible` or `:hover`. The other four (`timeLimits`, `charts`, `generatedArt`, `states`) cannot be read from CSS in version 1.0 and are the adopter's statement.

- **Applies when:** a checker · **Test:** machine, `conf.not-applicable` · **Evidence:** convention (protocol choice)

#### FP-CONF-06 · Machine tests and self-report

Each rule names its test. A machine test is one that can be decided from the inputs listed under "Checker inputs", locally, with no network. A self-report item MUST be answered with evidence: a measurement, a screenshot, a file reference or a recorded check. A self-report item that applies and has no evidence counts as failed. A SHOULD inside a normative rule is a recommendation: not following it is reported as "recommendation not followed", with the reason, and does not fail the rule.

- **Applies when:** the report · **Test:** self-report, `conf.evidence` · **Evidence:** convention (protocol choice)

#### FP-CONF-07 · A pass needs zero pending exceptions

A run passes a level only when every applicable machine test passes, every applicable self-report item has evidence, and no exception has the status `pending`. A run with pending exceptions reports the result `pending`, which is not a pass and MUST NOT be claimed.

- **Applies when:** the report · **Test:** machine, `conf.no-pending` · **Evidence:** convention (protocol choice)

#### FP-CONF-14 · Machine tests not run, and self-assessment

If the machine tests of a level have not been run, each has the result `not-run`, the run's result is `not-run`, and no claim may be made. The report MUST say what ran the machine tests: the reference checker and its version, another tool, or a person. A claim MUST end with `self-assessed` when either of these is true: the machine tests were not run by the reference checker; or the self-report items were answered by the adopter, or by an agent working for the adopter. This is the normal case, including after a clean run of the reference checker. The suffix is dropped only when the reference checker ran the machine tests and a party other than the adopter assessed every applicable self-report item and is named in the report. Words such as "provisional pass" MUST NOT be used.

- **Applies when:** the report · **Test:** machine, `conf.not-run` · **Evidence:** convention (protocol choice)

#### FP-CONF-08 · What a checker reads and how it classifies

A checker for version 1.0 reads: plain CSS files, and `<style>` blocks in HTML files, named by `source` and `scope`; and token files in the protocol's format. It does not read CSS-in-JS, preprocessor source or inline `style` attributes; compile those to CSS first, or report them as `not-run`. It MUST expand shorthands, follow `var()` references within the source to a resolved value, and accept `calc()` only in the two derived patterns (FP-SPACE-04). It MUST classify each value before testing it:

- **Layout lengths** (tested against the ladder at the declared u): `margin`, `padding`, `gap`, `inset`, `width`, `height`, `inline-size`, `block-size`, their `min-` and `max-` forms, and every longhand and logical form of these (`margin-inline`, `padding-block-start`, `row-gap`, `top`, `inset-inline-end` and so on).
- **Fine detail** (tested against fixed sets in platform units, whatever u is): `border-radius` and its longhands against the radius set; `border-width`, `outline-width` and `outline-offset` against 0, 1, 2 and 3.
- **Type** (`font-size`, `line-height`): tested by FP-TYPE rules at FP-2 and up, never as lengths. A checker does not compute the cascade: it tests a `line-height` against the `font-size` declared in the same rule (FP-TYPE-13).
- **Not tested in version 1.0:** `box-shadow`, `transform`, `background-position`, `letter-spacing`, SVG geometry, and everything else.

- **Applies when:** a checker · **Test:** machine, `conf.classify` · **Evidence:** convention (protocol choice)

#### FP-CONF-09 · What a checker never flags

A checker MUST NOT flag: equal-width columns or a host's column grid; equal-width bars in a chart; tokens with the `icon`, `type`, `breakpoint`, `drawn` or `micro` role; `target` tokens that meet FP-SNAP-04; intrinsic values (`%`, `fr`, `auto`, `ch`, `min-content`, `max-content`, `fit-content`); unitless line heights; z-index and opacity values; and anything outside the scope.

- **Applies when:** a checker · **Test:** machine, `conf.not-flagged` · **Evidence:** convention (protocol choice)

#### FP-CONF-10 · The limits of a check are stated

A report MUST state which rules were machine-tested, which were self-reported, which were `n/a` and which were `not-run`. Target sizes, reflow, colour-only states and pause controls cannot be proved from source files. A passing run MUST NOT be described as proof that a product is accessible.

- **Applies when:** the report · **Test:** self-report, `conf.limits-stated` · **Evidence:** convention (protocol choice)

#### FP-A11Y-16 · Floors win over the ladder

Where a ladder value, a type step, a φ proportion or a Snap mapping would break a rule in this section, the rule in this section MUST be followed and the off-ladder value reported as an exception with the reason `floor`.

- **Applies when:** always · **Test:** self-report, `a11y.precedence` · **Evidence:** convention (protocol choice)

#### FP-A11Y-01 · Contrast floors

Text MUST have a contrast ratio of at least 4.5:1 against its background. Large text MUST have at least 3:1. Control edges, focus rings and meaningful marks MUST have at least 3:1 against adjacent colours. The test runs on every pair declared in `fp.config.json` (`text` 4.5:1; `large-text` and `mark` 3:1), in every declared theme; every theme the product ships MUST be declared. A state colour MUST also pass on its own tint fill. Where a host colour fails, the floor wins: the change is reported (FP-AGENT-08) and, in Overlay, needs the user's consent.

- **Applies when:** always · **Test:** machine, `a11y.contrast` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-A11Y-02 · Large text and no rounding

Large text is text of at least 24 px, or at least 18.67 px (14 pt) when bold. A contrast ratio MUST NOT be rounded: 4.499:1 fails.

- **Applies when:** always · **Test:** machine, `a11y.contrast-exact` · **Evidence:** cited (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

#### FP-A11Y-20 · Every pair in use is declared

The `pairs` list MUST name every combination of text colour and background, and of control edge or meaningful mark and adjacent colour, that the scope uses. A checker cannot find pairs on its own, so a missing pair is a failed self-report, not a pass. Evidence: the list of colour tokens used in the scope, each matched to the pairs it appears in.

- **Applies when:** always · **Test:** self-report, `a11y.pairs-complete` · **Evidence:** convention (protocol choice)

#### FP-A11Y-03 · Text can be resized

All text, the host's included, MUST be resizable to 200% without loss of content or function (WCAG 2.2, 1.4.4 Resize Text, level AA). How the host achieves this is the host's choice. The units the protocol's own type uses are set by FP-TYPE-04.

- **Applies when:** always · **Test:** self-report, `a11y.text-resize` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-A11Y-04 · Text spacing can be overridden

No content may be lost when a user sets line height to 1.5 times the font size, paragraph spacing to 2 times, letter spacing to 0.12 times and word spacing to 0.16 times. A box that holds text MUST NOT have a fixed height; use a minimum height. Evidence: a screenshot or measurement with these overrides applied. (WCAG 2.2, 1.4.12 Text Spacing, level AA.)

- **Applies when:** always · **Test:** self-report, `a11y.text-spacing` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-A11Y-05 · Target size minimums

A pointer target MUST be at least 24 by 24 CSS px on the web (WCAG 2.2, 2.5.8, level AA, with its spacing exception). On iOS it MUST be at least 44 by 44 pt, on Android 48 by 48 dp and on macOS 28 by 28 pt, the platforms' published values. No scale, ratio or Snap mapping may produce a target under these. The larger values the protocol asks of its own controls are in FP-CTRL-01.

- **Applies when:** has: controls · **Test:** self-report, `a11y.target-size` · **Evidence:** cited (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

#### FP-A11Y-06 · Unknown or mixed pointers are treated as coarse

When `pointer` is `both` or not declared, the coarse-pointer target MUST be the base. The fine-pointer value MAY be applied only inside `@media (pointer: fine) and (not (any-pointer: coarse))` or the platform's equivalent, or when the configuration declares `pointer: fine` with a reason.

- **Applies when:** has: controls · **Test:** self-report, `a11y.pointer` · **Evidence:** convention (protocol choice)

#### FP-A11Y-09 · Pause, stop or hide

Any motion, blinking or scrolling that starts on its own, runs for more than 5 seconds in total and is shown beside other content MUST either stop by itself within 5 seconds or have a visible control to pause, stop or hide it. The 5 seconds are total running time, not the period of one loop: an endless 2-second pulse is over the limit. One page-level control that pauses all motion satisfies this rule. (WCAG 2.2, 2.2.2 Pause, Stop, Hide, level A.)

- **Applies when:** has: motion · **Test:** self-report, `a11y.pause` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-A11Y-10 · Reduced motion

When the user asks for reduced motion (`prefers-reduced-motion: reduce`, or the platform's Reduce Motion setting), every loop and every movement (a change of position, size or rotation) MUST stop, with no exception. A change of colour or opacity is not movement; it MAY remain if it lasts at most 89 ms, and longer ones MUST be shortened or removed. Reduced motion MUST NOT shorten a wait such as an undo window (FP-A11Y-18).

- **Applies when:** has: motion · **Test:** self-report, `a11y.reduced-motion` · **Evidence:** convention (protocol choice)

#### FP-A11Y-11 · Three flashes

Nothing may flash more than three times in any one-second period, unless the flash is below the general flash and red flash thresholds. A slow fade whose luminance changes by less than 10% is not a flash. (WCAG 2.2, 2.3.1, level A.)

- **Applies when:** has: motion · **Test:** self-report, `a11y.flash` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold)

#### FP-A11Y-18 · Time limits

A notice, a prompt or an option that goes away by itself after a set time is a time limit. For each one, at least one of these MUST hold: the user can turn the limit off; the user can adjust it to at least ten times the default; the user is warned and can extend it, by a simple action, with at least 20 seconds to do so, at least ten times; or the limit is essential. Pausing on hover or focus alone does not meet this. A notice whose action stays available elsewhere after the notice has gone (for example an Undo that remains in a menu or history) sets no time limit on that action. (WCAG 2.2, 2.2.1, level A.)

- **Applies when:** has: time limits · **Test:** self-report, `a11y.time-limits` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/#timing-adjustable)

#### FP-A11Y-19 · Status messages

A message that reports a result or a state without taking focus (a toast, an "Undo" notice, a saved indicator) MUST be exposed through a role or property, such as `role="status"`, so that assistive technology can present it without a change of focus. (WCAG 2.2, 4.1.3, level AA.)

- **Applies when:** platform: web · **Test:** self-report, `a11y.status-messages` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/#status-messages)

#### FP-A11Y-12 · Focus is always visible

Every keyboard-operable element MUST show a visible focus indicator when it has keyboard focus, and the indicator MUST NOT be removed (WCAG 2.2, 2.4.7). The indicator MUST have at least 3:1 contrast against adjacent colours (1.4.11). The protocol's own ring is a gap of 2 and a ring of 3, in platform units at every u, drawn in the `focus` slot, which MUST NOT be a state colour; a host in Overlay or Snap MAY keep its own indicator if it meets the first two sentences. Evidence: a screenshot of each kind of control with keyboard focus, and the ring and its ground declared as a `mark` pair that passes.

- **Applies when:** has: controls · **Test:** self-report, `a11y.focus` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/#focus-visible)

#### FP-A11Y-17 · Focus is not hidden

When an element receives keyboard focus it MUST NOT be entirely hidden by content the author placed over it, such as a sticky header, a toast or a popover. (WCAG 2.2, 2.4.11, level AA.)

- **Applies when:** has: controls · **Test:** self-report, `a11y.focus-not-obscured` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum)

#### FP-A11Y-13 · Reflow at 320

Content MUST be usable at a width of 320 CSS px without scrolling in two directions. This holds in every mode and whatever breakpoints are in use. Content that needs two dimensions to be understood, such as a data table, a map or a diagram, MAY scroll inside its own region while the page itself does not. Evidence: the page's scroll width measured at a 320 px viewport.

- **Applies when:** platform: web · **Test:** self-report, `a11y.reflow` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-A11Y-14 · State is never shown by colour alone

A state, an action or a distinction MUST NOT be carried by colour alone. Each state has a form and a word, or a form and an accessible name. Evidence: a list of every state, error and selection the scope shows, with the form or word that carries each one besides colour, or a greyscale screenshot in which each can still be told apart.

- **Applies when:** always · **Test:** self-report, `a11y.colour-alone` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-LINE-02 · A hairline is never the only edge of a control

A hairline is decoration. The edge that identifies a control MUST have at least 3:1 contrast against the adjacent colour (WCAG 2.2, 1.4.11). In the protocol's own colour slots that edge is the `control` slot. A hairline at tone-3 is under 2:1 on a plain ground and cannot serve as a control edge. Evidence: the edge and ground declared as a `mark` pair that passes.

- **Applies when:** has: controls · **Test:** self-report, `line.control-edge` · **Evidence:** cited (https://www.w3.org/TR/WCAG22/)

#### FP-CTRL-01 · Protocol targets are at least the ladder target

The target size of a protocol-owned control (any control in Native; any `target` token in Snap) MUST be at least the ladder target for its platform and pointer: at u = 1, 55 for touch and for any coarse or unknown pointer, and 34 where the pointer is fine. A larger rung MAY be used. A host control that is not protocol-owned is governed by FP-CTRL-04.

- **Applies when:** has: controls · **Test:** self-report, `ctrl.target-rung` · **Evidence:** convention (protocol choice)

#### FP-CTRL-02 · Drawn height and hit area are separate

The drawn height of a control MAY be smaller than its target size, provided the hit area reaches the target size. For example a control drawn 34 high carries a hit area 55 high on touch. Hit areas of neighbouring targets MUST NOT overlap. Neighbours are targets in the same layer; a control in a layer above (a toast, a popover) is not a neighbour of what it covers, and is governed by FP-A11Y-17.

- **Applies when:** has: controls · **Test:** self-report, `ctrl.hit-area` · **Evidence:** convention (protocol choice)

#### FP-CTRL-03 · Small interactive parts

A mark, glyph or chip that acts as a control MUST have the full hit area of FP-CTRL-01, however small it is drawn.

- **Applies when:** has: controls · **Test:** self-report, `ctrl.small-parts` · **Evidence:** convention (protocol choice)

#### FP-CTRL-04 · Host controls keep their size if they meet the floor

A host control that is not given the `target` role is not tested against the ladder. It MUST meet the target minimum of its platform (FP-A11Y-05). A host target of 44 or 48 therefore passes as it is; it does not have to become 55.

- **Applies when:** mode: overlay or snap · **Test:** self-report, `ctrl.host` · **Evidence:** convention (protocol choice)

#### FP-VIZ-01 · φ frames, never data

φ, Fibonacci numbers and the ladder MAY set a chart's container ratio, margins, gaps and legend spacing. They MUST NOT set a scale, a tick position, a bar's length or thickness, an area that encodes a value, or a baseline.

- **Applies when:** has: charts · **Test:** self-report, `viz.frames-not-data` · **Evidence:** convention (protocol choice)

#### FP-VIZ-04 · Bars start at zero and are equally wide

A bar's length encodes its value, so a bar chart's value axis MUST start at zero, and bars in one series MUST have equal thickness. A line chart MAY start its axis elsewhere, with the axis labelled.

- **Applies when:** has: charts · **Test:** self-report, `viz.bars` · **Evidence:** cited (https://ar5iv.arxiv.org/html/1907.02035)

#### FP-VIZ-05 · No bent scales, no blended measures

A scale MUST NOT be broken, bent or truncated for appearance. Different measures MUST NOT be summed or blended into one mark.

- **Applies when:** has: charts · **Test:** self-report, `viz.scales` · **Evidence:** convention (protocol choice)

#### FP-VIZ-06 · Not measured is not zero

A value that has not been measured MUST be shown as not measured (an empty mark and words), never as 0 or 0%. Sample or placeholder data MUST be labelled as such (FP-HONEST-05).

- **Applies when:** has: charts · **Test:** self-report, `viz.not-measured` · **Evidence:** convention (protocol choice)

#### FP-PLAT-03 · Web pointer queries

The fine-pointer ladder target (34 at u = 1; see the table in controls) MUST be written inside `@media (pointer: fine) and (not (any-pointer: coarse))`, unless the configuration declares `pointer: fine`. Outside that query `--fp-target` is the coarse value (55 at u = 1).

- **Applies when:** platform: web · **Test:** machine, `plat.web-pointer` · **Evidence:** convention (protocol choice)

#### FP-PLAT-05 · iOS anchors

On iOS and iPadOS: 1 u is 1 pt; body is 17 pt at the default Dynamic Type size; no text under 11 pt; text MUST follow Dynamic Type; a target is at least 44 pt and the ladder target is 55 pt.

- **Applies when:** platform: ios · **Test:** self-report, `plat.ios-anchors` · **Evidence:** convention (protocol choice)

#### FP-PLAT-06 · macOS anchors

On macOS: 1 u is 1 pt; body is 13 pt; no text under 10 pt; a target is at least 28 pt and the ladder target is 34 pt.

- **Applies when:** platform: macos · **Test:** self-report, `plat.macos-anchors` · **Evidence:** convention (protocol choice)

#### FP-PLAT-08 · Android anchors

On Android: 1 u is 1 dp; type is in sp; body is 16 sp (the Material body-large size); no text under 11 sp; a target is at least 48 dp and the ladder target is 55 dp, with at least 8 dp between targets.

- **Applies when:** platform: android · **Test:** self-report, `plat.android-anchors` · **Evidence:** convention (protocol choice)

#### FP-HONEST-01 · Every rule carries an evidence label

Every rule in this specification MUST carry exactly one label: `cited`, with a source whose requirement the rule restates; `convention`; `convention (protocol choice)`; or `contested`. A convention MAY add a basis: a cited source for the fact it rests on. A basis MUST NOT be presented as if the source required the rule. The reason for a rule MUST NOT be "because it is φ".

- **Applies when:** the specification · **Test:** machine, `honest.labels` · **Evidence:** convention (protocol choice)

#### FP-HONEST-02 · Banned words

A conformance claim or report, and the protocol's own text, MUST NOT describe φ, Fibonacci numbers or a design that uses them as: sacred, divine, perfect, magic, nature's code, a universal law, the most beautiful, or scientifically proven. The names of the musical intervals used for type ratios ("perfect fourth", "perfect fifth") and this list itself are excepted.

- **Applies when:** the report · **Test:** machine, `honest.banned-words` · **Evidence:** convention (protocol choice)

#### FP-HONEST-03 · Claims that are never made

The following MUST NOT be claimed: that the Parthenon, the Great Pyramid, the Mona Lisa, or any company logo was designed on φ; that φ is the ratio people find most pleasing; that people are "wired" for φ; that Fibonacci numbers are universal in nature.

- **Applies when:** always · **Test:** self-report, `honest.banned-claims` · **Evidence:** cited (https://webarchive.lib.cuhk.edu.hk/20210329125916mp_/http://www.math.cuhk.edu.hk/~pschan/uged1533/markowsky.pdf)

#### FP-HONEST-04 · A claim says what was tested

A conformance claim MUST state the level, mode, unit, platform and version (FP-CONF-04) and nothing about quality or beauty.

- **Applies when:** the report · **Test:** machine, `honest.claim-wording` · **Evidence:** convention (protocol choice)

#### FP-HONEST-05 · Invent nothing

A design or a document made under the protocol MUST NOT present invented numbers, names or results as real. An unknown in real content is written as a marked placeholder, such as `[name]`. Made-up sample content (sample people, sample figures) is allowed when it is labelled as below. Demonstration content MUST be labelled in visible text, either beside the content or once at the top of the view, with the words "Demonstration content" or "Sample data" or their translation.

- **Applies when:** always · **Test:** self-report, `honest.invent-nothing` · **Evidence:** convention (protocol choice)

#### FP-HONEST-06 · Null results are stated

Where this specification discusses preference for φ, it MUST state the null and mixed results beside the positive ones.

- **Applies when:** the specification · **Test:** self-report, `honest.null-results` · **Evidence:** convention (protocol choice)

### FP-1: space and radius (47)

#### FP-MATH-01 · Constants

A checker, a generator or a protocol token file MUST use the values in the constants table, to at least the precision shown. φ is (1 + √5) / 2. The golden angle is 360° / φ², which is 137.50776° (2.39996323 radians).

- **Applies when:** a checker · **Test:** machine, `math.constants` · **Evidence:** cited (https://en.wikipedia.org/wiki/Golden_angle)

#### FP-MATH-03 · The length ladder

The ladder is F(n) × u for the Fibonacci numbers 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233 and 377, plus the container widths 610, 987 and 1597. Any of these values is "on the ladder". No other value is.

- **Applies when:** always · **Test:** machine, `math.ladder` · **Evidence:** convention (protocol choice)

#### FP-MATH-04 · The ladder covers lengths only

The ladder governs space, size, radius and stroke. It MUST NOT be used to choose a type size (see FP-TYPE-01), an interaction duration (see FP-MOTION-01) or any quantity that encodes data (see FP-VIZ-01).

- **Applies when:** always · **Test:** self-report, `math.ladder-scope` · **Evidence:** convention (protocol choice)

#### FP-MATH-05 · Base unit u

One u is one platform unit: 1 CSS px on the web (0.0625 rem), 1 pt on iOS and macOS, 1 dp on Android, 1 pt in print. The default is u = 1. A system MUST declare exactly one u per platform in `fp.config.json`.

- **Applies when:** always · **Test:** machine, `math.unit` · **Evidence:** convention (protocol choice)

#### FP-MATH-06 · Grid-locked profiles u = 4 and u = 8

A system MAY declare u = 4 or u = 8 so that every rung stays on its 4 or 8 grid. No other value of u is allowed in version 1.0. Below u, only the sub-unit values 1 and 2 are on the ladder. There are no filler steps: a value the profile lacks is kept unchanged only as a declared exception (FP-SPACE-05), or the system uses Overlay. u = 4 is the recommended profile for a 4-based grid; it has no 16 and no 24. u = 8 SHOULD be used only by a system that has no 4 or 12 tokens, because neither can be snapped at u = 8.

- **Applies when:** always · **Test:** machine, `math.unit-profile` · **Evidence:** convention (protocol choice)

#### FP-MATH-07 · Fine-detail lengths and containers do not scale with u

u scales layout lengths: space, box sizes and ladder target sizes. The following MUST be given in platform units at every u, as if u were 1: hairline and stroke widths (0, 1, 2 or 3); the radius set (FP-RADIUS-01); the focus ring (FP-A11Y-12); state marks and chip height (FP-STATE-03, FP-STATE-04); chart band gaps (FP-VIZ-09); and the container widths 610, 987 and 1597 (FP-LAYOUT-05). Icon sizes are not checked at all: an icon is exempt only as a token with the `icon` role (FP-MODE-10), and a bare length is never treated as an icon.

- **Applies when:** always · **Test:** machine, `math.fixed-detail` · **Evidence:** convention (protocol choice)

#### FP-MATH-08 · Rounding

A length derived from φ and written as a fixed value MUST be rounded half-up to a whole platform unit. A length the browser derives at run time (a percentage, an `fr` track, a `calc()` on a runtime box) is not rounded by the author and is exempt. A φ percentage is written to one decimal place (61.8 and 38.2). A type size is rounded half-up to a whole px, pt or sp. A contrast ratio MUST NOT be rounded (FP-A11Y-02). Drift and coverage are compared with their limits as exact values, with no tolerance (a drift of exactly 25% passes; anything above fails), and are shown rounded half-up, drift to one decimal place and coverage to a whole percent.

- **Applies when:** always · **Test:** machine, `math.rounding` · **Evidence:** convention (protocol choice)

#### FP-MATH-09 · Zero, negative and sub-unit values

0 is always on the ladder. The negative of a rung is on the ladder. Fractions of a platform unit MUST NOT be used as lengths, except where the platform draws a device hairline.

- **Applies when:** always · **Test:** machine, `math.zero-negative` · **Evidence:** convention (protocol choice)

#### FP-MODE-01 · A configuration file declares the adoption

A system that claims conformance MUST have an `fp.config.json` at its root. A checker and the `/lyrikai-fibonacci` skill MUST decide what to test from this file alone.

- **Applies when:** always · **Test:** machine, `mode.config-present` · **Evidence:** convention (protocol choice)

#### FP-MODE-02 · Configuration fields

The file MUST validate against fp.config.schema.json. The field table below is part of this rule. `fp` MUST equal the version string of the specification the system was checked against, written in full (for example `1.0.0-rc.2`).

- **Applies when:** always · **Test:** machine, `mode.config-schema` · **Evidence:** convention (protocol choice)

#### FP-MODE-08 · One mode per scope

A scope MUST have exactly one mode. A product MAY hold several scopes with different modes, each with its own configuration and its own claim.

- **Applies when:** always · **Test:** machine, `mode.single` · **Evidence:** convention (protocol choice)

#### FP-MODE-10 · Roles are declared

`roles` in the configuration gives a token a role, in every mode. A role is never inferred from a value: a bare length has no role. The roles are:

- `icon`: the width and height of an icon. Not tested and never snapped. The token MUST be used only for icons.
- `type`: a type size. Tested by the type rules at FP-2, never as a length.
- `breakpoint`: a breakpoint. Not tested in Overlay and Snap.
- `target`: the size of a control's hit area. It is at least the ladder target and never shrinks (FP-CTRL-01, FP-SNAP-04).
- `drawn`: the drawn height of a control whose hit area is larger than it looks. Left unchanged and never shrunk; the hit area is checked by FP-CTRL-02 and FP-CTRL-04.
- `micro`: the micro type size (FP-TYPE-05).

- **Applies when:** always · **Test:** machine, `mode.roles` · **Evidence:** convention (protocol choice)

#### FP-MODE-09 · The highest level each mode can claim

Native MAY claim FP-1 or FP-2. Snap and Overlay claim FP-1 by default, and at FP-1 the host's type is not tested at all. Snap or Overlay MAY claim FP-2 only when, inside the scope, the host's type sizes, body size and line heights are replaced by the protocol's (FP-TYPE-01 to FP-TYPE-09, FP-TYPE-12) and the layout rules that apply to every mode are met (FP-LAYOUT-01, FP-LAYOUT-02, FP-LAYOUT-07). A system whose body text stays below the body anchor (FP-A11Y-07) cannot claim FP-2 in any mode.

- **Applies when:** always · **Test:** machine, `mode.level-ceiling` · **Evidence:** convention (protocol choice)

#### FP-MODE-03 · Overlay keeps the host system

In Overlay the protocol's tokens (`--fp-*`) MUST be added beside the host's tokens. The host keeps its spacing tokens, radius tokens, column grid, breakpoints, type, control sizes, elevation and z-index. A host token MUST NOT be changed without the user's consent (FP-AGENT-03).

- **Applies when:** mode: overlay · **Test:** self-report, `mode.overlay-host-intact` · **Evidence:** convention (protocol choice)

#### FP-MODE-04 · Overlay tests resolved values in the scope

Inside the declared scope, every checked declaration (the list is in 03-conformance.md) MUST resolve, after following `var()` references, to a value that is on the ladder, in its fixed set (FP-MATH-07), intrinsic, derived (FP-SPACE-04) or a declared exception. It does not matter whether the value arrives through a protocol token, a host token or a literal: what is tested is the resolved value. A host token whose value is not a rung fails inside the scope unless it has a role that exempts it (FP-MODE-10) or is declared as an exception with the reason `host-token`.

- **Applies when:** mode: overlay · **Test:** machine, `mode.overlay-resolved` · **Evidence:** convention (protocol choice)

#### FP-MODE-05 · Overlay coverage and exceptions are reported

An Overlay report MUST state coverage: the checked values inside the scope, divided by the checked values in the whole `source`. Checked values are counted one way only: every checked declaration is expanded to its longhands (`padding: 12px 16px` becomes four values, `gap: 8px` two), and each longhand whose value is a length other than 0 or an intrinsic value counts once. The percentage is rounded half-up to a whole number. It MUST also state the number of accepted exceptions inside the scope. Both figures MUST appear in the claim (FP-CONF-04). A scope with no checked declarations MUST NOT be claimed. There is no minimum coverage: the figure is published so that a reader can judge the claim.

- **Applies when:** mode: overlay · **Test:** machine, `mode.overlay-coverage` · **Evidence:** convention (protocol choice)

#### FP-SNAP-01 · Exemption is by declared role

A host token is exempt from nearest-rung mapping only if `roles` gives it a role (FP-MODE-10). `icon`, `type`, `breakpoint`, `drawn` and `micro` tokens are left unchanged. A `target` token is exempt from nearest-rung mapping and from the drift limit, and is mapped by FP-SNAP-04 instead. Exemption MUST NOT be decided by value: a 16 or 24 token with a spacing role is snapped. Only 0 and the sub-unit values 1 and 2 are exempt by value.

- **Applies when:** mode: snap · **Test:** machine, `snap.exempt-by-role` · **Evidence:** convention (protocol choice)

#### FP-SNAP-02 · Nearest rung, ties go up

Each non-exempt host length MUST map to the rung nearest to it by absolute distance. A radius maps to the nearest value of the radius set (FP-RADIUS-01), not the ladder. When two values are equally near, the larger MUST be chosen, because more space never shrinks a target or a separation.

- **Applies when:** mode: snap · **Test:** machine, `snap.nearest` · **Evidence:** convention (protocol choice)

#### FP-SNAP-03 · Drift limit of 25%

Drift is |rung − value| / value. An automatic mapping MUST have a drift of at most 25%. The top rung is the largest value on the ladder at the declared u, container widths included: 1597 at u = 1 and u = 4, 3016 at u = 8. At u = 1 the nearest rung meets the limit for every whole value from 2 up to 1.25 times the top rung (1996); the worst case is 4 → 5. The limit does not apply to `target` tokens (FP-SNAP-04).

- **Applies when:** mode: snap · **Test:** machine, `snap.drift` · **Evidence:** convention (protocol choice)

#### FP-SNAP-10 · Values that cannot be snapped

A value whose nearest rung drifts more than 25%, or that lies above 1.25 times the top rung, MUST NOT be snapped. It is kept unchanged and listed as an exception with the reason `snap-drift` (FP-SPACE-05).

- **Applies when:** mode: snap · **Test:** machine, `snap.unsnappable` · **Evidence:** convention (protocol choice)

#### FP-SNAP-04 · Targets never shrink

A token with the `target` role MUST end at a value that is at least the larger of its original value and the ladder target (the smallest rung at or above the target floor, FP-CTRL-01). It SHOULD be the smallest rung that meets this. A host target that already meets it MAY be kept unchanged. Examples at u = 1 with a coarse pointer: 40 → 55; 44 → 55; 64 stays 64, or moves to 89. A target is never reported as drift. Where a host control is drawn at 40 with a 48 hit area, the 40 takes the `drawn` role and stays 40, and the 48 either stays as a host control that meets its platform minimum (FP-CTRL-04) or takes the `target` role and becomes 55.

- **Applies when:** mode: snap · **Test:** machine, `snap.target-up` · **Evidence:** convention (protocol choice)

#### FP-SNAP-11 · Control heights never shrink

A token or literal that sets the `height`, `min-height`, `block-size` or `min-block-size` of an interactive element (a button, a link, an input, a select, a textarea, or an element with an interactive role) MUST have the `target` or the `drawn` role, and MUST NOT end smaller than it began. A checker flags such a declaration that has neither role. Without this, nearest-rung mapping would turn a 44 control into 34.

- **Applies when:** mode: snap · **Test:** machine, `snap.control-height` · **Evidence:** convention (protocol choice)

#### FP-SNAP-05 · The mapping keeps order

Order is kept within each group, not across groups. The groups are: spacing and size lengths; radii; and `target` tokens. Within one group, if host value a is less than or equal to host value b, the snapped value of a MUST be less than or equal to the snapped value of b, after overrides. A target of 32 that becomes 55 while a spacing value of 36 becomes 34 is not a breach.

- **Applies when:** mode: snap · **Test:** machine, `snap.monotonic` · **Evidence:** convention (protocol choice)

#### FP-SNAP-06 · Collisions merge by default

When two or more host tokens of the same group (spacing lengths, radii, or `target` tokens) end at one value, they have merged. Targets that are raised to the same ladder target are a merge like any other. A checker computes the mapping and lists every merged group by token name in its report; that is this rule's machine test, and it needs no file from the adopter. The published Snap table (FP-SNAP-08) MUST list the same groups. A checker for version 1.0 does not read the published table: publishing it is a self-report item, and a Snap claim is valid only when the table is published.

- **Applies when:** mode: snap · **Test:** machine, `snap.merge-listed` · **Evidence:** convention (protocol choice)

#### FP-SNAP-07 · Overrides

Any token of a merged group MAY be moved by hand to another rung, chosen by role, to keep a difference the design needs. Several tokens of one group MAY be moved. Each override MUST have a drift of at most 38.2%, the whole mapping MUST still keep order (FP-SNAP-05), and each override MUST be listed in `snap.overrides` with a reason.

- **Applies when:** mode: snap · **Test:** machine, `snap.override` · **Evidence:** convention (protocol choice)

#### FP-SNAP-08 · The published table states what breaks

A Snap table MUST be published with the system, at the path in `snap.table` (default `fp-snap.md`, beside `fp.config.json`). It MUST have one row per token and per in-scope literal, with: name, role, original value, snapped value, drift, the group it merged into, and any override reason. It MUST carry a "what breaks" block that covers at least: additive spacing; a 4-unit baseline rhythm; half device pixels at 1.5× density for odd rungs at u = 1; icons of 16 and 24 inside 13 and 21 boxes; hierarchy lost in merges; and visual-regression snapshots.

- **Applies when:** mode: snap · **Test:** self-report, `snap.what-breaks` · **Evidence:** convention (protocol choice)

#### FP-SNAP-09 · Snapping alone reaches FP-1

Snapping covers space and radius, so a system that only snaps MAY claim FP-1. Type is never snapped. FP-2 is reached as FP-MODE-09 describes.

- **Applies when:** mode: snap · **Test:** machine, `snap.level-cap` · **Evidence:** convention (protocol choice)

#### FP-MODE-06 · Native is full adoption

In Native every length in the source MUST be on the ladder or a declared exception, and no host token layer is assumed. To claim FP-2 a Native system also uses the protocol's type scale, layout rules and container widths.

- **Applies when:** mode: native · **Test:** machine, `mode.native` · **Evidence:** convention (protocol choice)

#### FP-MODE-07 · What an adopter may and may not change

An adopter MAY change: colour slot values, typefaces and weights, the words shown for states, icon artwork, and which rung a role uses. An adopter MUST NOT change: the ladder, the type-scale formula, any accessibility floor, or the rule that a state has a form and a word. A system that changes one of these is not conformant and MUST NOT make a claim.

- **Applies when:** always · **Test:** self-report, `mode.may-change` · **Evidence:** convention (protocol choice)

#### FP-SPACE-01 · Lengths are on the ladder

Every checked layout length in scope (the list is in 03-conformance.md) MUST resolve to one of: a rung of the declared u; 0; an intrinsic value; a derived value (FP-SPACE-04); or a declared exception (FP-SPACE-05). The test is on the resolved value in every mode, so a host token passes where its value is a rung.

- **Applies when:** always · **Test:** machine, `space.on-ladder` · **Evidence:** convention (protocol choice)

#### FP-SPACE-03 · Choose a rung by role

In Native and in Overlay a new value MUST be chosen by its role, not by rounding a remembered number to the nearest rung. Nearest-rung arithmetic belongs to Snap only (FP-SNAP-02).

- **Applies when:** mode: native or overlay · **Test:** self-report, `space.by-role` · **Evidence:** convention

#### FP-SPACE-04 · Derived values

A length that is not a rung is allowed when it is exactly one of two derived patterns, written as a single operation with no chaining: (a) a φ split of a container: the container multiplied by 0.618 or 0.382; (b) a container minus one ladder token. A container is a runtime box (`100%`, `100vw`, `100vh`, `100cqi`, and their logical and dynamic forms) or a container-width token (610, 987 or 1597 platform units). A checker MUST verify that the container operand is one of these: a container width counts only when written as its token (`var(--fp-container-987)`), so a literal `987px` inside `calc()` is not a container and fails. A split of a container-width token is written as a rounded fixed value (FP-MATH-08); a split of a runtime box is left to the browser and is not rounded. Arithmetic on two rungs is not a derived pattern: every whole number is a sum of Fibonacci numbers, so allowing it would allow anything.

- **Applies when:** always · **Test:** machine, `space.derived` · **Evidence:** convention (protocol choice)

#### FP-SPACE-05 · Exceptions are declared

Any other off-ladder length MUST be listed in `exceptions` in `fp.config.json` with its value, where it is used, a reason (`floor`, `host-token`, `data`, `content`, `platform` or `snap-drift`), the rule it departs from and a status. An exception with the reason `data` MUST also name its data source. An undeclared off-ladder length, including undeclared arithmetic, fails.

- **Applies when:** always · **Test:** machine, `space.exceptions` · **Evidence:** convention (protocol choice)

#### FP-RADIUS-01 · Radius set

A corner radius MUST resolve to one of 0, 2, 3, 5, 8, 13 or 21, in platform units at every u, or `pill`, or `round` (50%). Suggested roles: 2 for bars and strips, 8 for small tiles, 13 for cards and figures, 21 for outer frames. In Snap, a host radius maps to the nearest value of this set (FP-SNAP-02).

- **Applies when:** always · **Test:** machine, `radius.set` · **Evidence:** convention (protocol choice)

#### FP-RADIUS-02 · Nested radii

The radius of an inner corner SHOULD equal the outer radius minus the padding between them, with a floor of 0, so the corners stay concentric. When the padding is the value one or two below the outer radius in the set, the result is itself in the set (21 − 8 = 13, 13 − 8 = 5, 13 − 5 = 8, 8 − 5 = 3), because adjacent Fibonacci numbers differ by the one before. A result that is not in the set MUST be rounded down to the next value in the set.

- **Applies when:** always · **Test:** self-report, `radius.nesting` · **Evidence:** convention

#### FP-RADIUS-03 · Pill and round

`pill` is written as the token `--fp-radius-pill` or the literal `9999px`, and nothing else: a checker does not know an element's height, so another large radius (999px, 100px) fails the radius set. `round` is written as `--fp-radius-round` or the literal `50%`, on an element of equal width and height. 0 is written as `0` and has no token. A bar or strip SHOULD use 2, not `pill`.

- **Applies when:** always · **Test:** machine, `radius.pill-round` · **Evidence:** convention

#### FP-PLAT-01 · Web units

On the web, 1 u is 1 CSS px. Protocol space tokens are written in px by default and MAY be written in rem (value ÷ 16). Protocol type is written in rem with 16 px equal to 1rem (FP-TYPE-04).

- **Applies when:** platform: web · **Test:** machine, `plat.web-units` · **Evidence:** convention (protocol choice)

#### FP-PLAT-02 · Web custom properties

The protocol's CSS custom properties MUST use the `--fp-` prefix and these names. A host's own properties are never renamed.

- **Applies when:** platform: web · **Test:** machine, `plat.web-tokens` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-01 · Token format

A protocol token file MUST follow the Design Tokens Format Module 2025.10: a token is an object with `$value`; `$type` is set on the token or inherited from its group; files end in `.tokens.json`.

- **Applies when:** protocol token files · **Test:** machine, `token.dtcg` · **Evidence:** cited (https://www.designtokens.org/tr/2025.10/)

#### FP-TOKEN-02 · Types and units

A length is a `dimension` with the value `{ "value": <number>, "unit": "px" }` or `"rem"`. A time is a `duration` with `{ "value": <number>, "unit": "ms" }` or `"s"`. A colour is a colour object with `colorSpace` and `components`. Ratios, opacities and layer values are `number`. Easing is `cubicBezier`.

- **Applies when:** protocol token files · **Test:** machine, `token.types` · **Evidence:** cited (https://www.designtokens.org/tr/2025.10/)

#### FP-TOKEN-03 · Names

A token or group name MUST NOT begin with `$` and MUST NOT contain `{`, `}` or `.`. A space token is named for its Fibonacci number, not its value: group `space`, token `13`, is 13 × u (13 px at u = 1, 52 px at u = 4). Radius and container tokens are named for their value, which does not change with u.

- **Applies when:** protocol token files · **Test:** machine, `token.names` · **Evidence:** cited (https://www.designtokens.org/tr/2025.10/)

#### FP-TOKEN-04 · The master is in platform units

The master stores every length and every type size as a px number, lengths already multiplied by the declared u, and records u in the file metadata (FP-TOKEN-07). Values in other units are produced by the generators: rem for web type (FP-TOKEN-09), and pt, dp and mm for other platforms, because the format has no such units. A type size of 16 px in the master becomes `1rem` in the generated web output; the two rules do not conflict.

- **Applies when:** protocol token files · **Test:** machine, `token.master-unit` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-05 · Themes

In version 1.0, light and dark colour values are two files (`color.light.tokens.json`, `color.dark.tokens.json`).

- **Applies when:** protocol token files · **Test:** machine, `token.themes` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-06 · Rule metadata

Each protocol token MUST carry `$extensions["com.lyrikai.fp"]` with `rule`, the ID of the rule that defines it. It MAY also carry `formula` (for example `"F(7) × u"`), `level`, `status` and `evidence`. A token that holds an accessibility floor (body size, micro, target) MUST carry `"pinnedFloor": true`; a generator or theme MUST NOT emit a smaller value for such a token.

- **Applies when:** protocol token files · **Test:** machine, `token.extensions` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-07 · File metadata

The homepage (`https://www.lyrikai.com`), the spec version and the unit u MUST be recorded in a root-level `$extensions["com.lyrikai.fp"]` object. They MUST NOT be bare root keys, which the format would read as groups.

- **Applies when:** protocol token files · **Test:** machine, `token.root-metadata` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-08 · Generated outputs

From the master, the protocol's generators MUST produce: CSS custom properties (FP-PLAT-02), SCSS variables, a Tailwind preset, and a list-shaped `tokens.json` for design-system tools. Each output is covered by a snapshot test. This rule binds the protocol's own repository; an adopter generates only what it uses.

- **Applies when:** the specification · **Test:** machine, `token.outputs` · **Evidence:** convention (protocol choice)

#### FP-TOKEN-09 · Type in rem

Generated web type sizes MUST be in rem (FP-TYPE-04): the generator divides the master's px value by 16. This rule is about generated web outputs (CSS, SCSS, the Tailwind preset), not the master file. Generated space is in px by default and MAY be in rem.

- **Applies when:** protocol token files · **Test:** machine, `token.type-rem` · **Evidence:** convention (protocol choice)

### FP-2: type, layout and grids (17)

#### FP-A11Y-07 · Body anchors

Protocol-owned body text MUST be at least the platform default: 16 px on the web (written as `1rem`), 17 pt on iOS at the default Dynamic Type size, 16 sp on Android, 13 pt on macOS. φ MUST NOT be used to choose the body size. These anchors are the platforms' own defaults; treating them as a minimum is this protocol's choice. A host in Overlay or Snap at FP-1 keeps its own body size; a system whose body stays below the anchor cannot claim FP-2 (FP-MODE-09).

- **Applies when:** protocol-owned type · **Test:** machine, `a11y.body-anchor` · **Evidence:** convention (protocol choice)

#### FP-A11Y-08 · Smallest text

No protocol-owned text may be smaller than 11 px, 11 pt or 11 sp, except on macOS where the floor is 10 pt. Text at this floor ("micro", FP-TYPE-05) MUST NOT be used for a control label or for content needed to operate the interface. Apple and Material publish 11 as their smallest sizes; applying it to the web is this protocol's choice.

- **Applies when:** protocol-owned type · **Test:** machine, `a11y.min-text` · **Evidence:** convention (protocol choice)

#### FP-TYPE-01 · The type scale formula

Every type size MUST equal round(body × φ^(k/2)) for a whole number k, where body is the body size (FP-A11Y-07) and rounding is half-up to a whole px, pt or sp. Each step multiplies by √φ (about 1.272), so every second step is exactly φ apart. The only other accepted values are a declared Fibonacci substitute (FP-TYPE-03) and the micro token (FP-TYPE-05). The idea of a modular type scale is established practice; this ratio and these steps are the protocol's choice.

- **Applies when:** always · **Test:** machine, `type.scale` · **Evidence:** convention (protocol choice)

#### FP-TYPE-02 · Step ranges

Interface text MUST use steps −1 to 4. Display text (large, short, few words) MUST use even steps from 4 upward, so that display sizes are whole φ steps apart. Odd steps above 4 are not used. A size that is the value of step 5 or 7 (53, 55, 86 or 89 from body 16) fails this rule, `type.step-range`, not the scale rule.

- **Applies when:** always · **Test:** machine, `type.step-range` · **Evidence:** convention (protocol choice)

#### FP-TYPE-03 · Fibonacci substitution

A system MAY set `type.align` to `fibonacci`. Then, at any step where a Fibonacci number lies within 4% of the unrounded value, that number replaces the rounded value (on the web: 21, 34, 55 and 89 in place of 20, 33, 53 and 86). The choice applies to the whole system. The default is `formula`. Under `fibonacci`, the rounded value that was replaced (20 on the web) fails this rule, `type.align`. Under `formula`, a Fibonacci number that is not a formula value (21 on the web) is simply off the scale and fails FP-TYPE-01.

- **Applies when:** always · **Test:** machine, `type.align` · **Evidence:** convention (protocol choice)

#### FP-TYPE-04 · Units

On the web a protocol type size MUST be written in `rem` (size ÷ 16), and the root font size MUST NOT be set in px. On Android it MUST be written in `sp`. On iOS and macOS it MUST be applied so that it follows the user's text size setting.

- **Applies when:** always · **Test:** machine, `type.units` · **Evidence:** convention (protocol choice)

#### FP-TYPE-05 · Micro text

"Micro" is a named floor value, not a step of the scale: 11 px on the web, 11 sp on Android, 11 pt on iOS, 10 pt on macOS. It is accepted only through the `--fp-type-micro` token or a token given the `micro` role; a bare 11 fails the scale test. Micro MUST be used only for non-interactive metadata.

- **Applies when:** always · **Test:** machine, `type.micro` · **Evidence:** convention (protocol choice)

#### FP-TYPE-06 · Control labels

The label of a control MUST be at least the larger of step −1 and 13 (px, pt or sp). On macOS, where step −1 is 10, this means 13.

- **Applies when:** always · **Test:** self-report, `type.control-label` · **Evidence:** convention (protocol choice)

#### FP-TYPE-12 · Replacing a host's type sizes

To reach FP-2, each host type size in the scope is replaced by a step. The role fixes or bounds the step, and the ratio chooses within the bound. Body text (paragraphs, and the default text of the page) becomes step 0, whatever its old size. The value typed into an input becomes step 0. Every other text maps to the usable step (FP-TYPE-02) nearest in ratio (the smallest |ln(size ÷ step)|), a tie going to the larger step, and then: a control label (button, link, tab, field label) is raised to step −1 if it fell below it; a heading keeps the step the ratio gives, which may be step 0 or −1 for a small heading. No text maps below step −1 unless it is non-interactive metadata, which MAY become micro. Host line heights are replaced by the leading of FP-TYPE-07. The mapping MUST be listed in the report, one row per host size.

- **Applies when:** mode: overlay or snap · **Test:** self-report, `type.host-mapping` · **Evidence:** convention (protocol choice)

#### FP-TYPE-07 · Leading by size and role

Line height MUST follow the text's role first and its step second: 1.618 for running text (paragraphs of prose at body size); 1.5 for dense body (body-size text in tables, lists and forms); 1.382 for small text, for any single-line label and for the value in an input, at any interface step; 1.236 for a heading at any step up to 3, including a small heading at step 0 or −1; 1.146 for display text and headings at step 4 and above. 1.618 MUST NOT be used for anything except running text. Platforms tighten leading as size grows, which these values follow; the values themselves, and 1.618 for running text in particular, are this protocol's convention and are looser than any platform default.

- **Applies when:** always · **Test:** machine, `type.leading` · **Evidence:** convention (protocol choice)

#### FP-TYPE-08 · Line height is unitless

A protocol line height MUST be a unitless ratio, not a fixed length, so that it scales with the text and survives a user's spacing override (FP-A11Y-04).

- **Applies when:** platform: web · **Test:** machine, `type.leading-unitless` · **Evidence:** convention (protocol choice)

#### FP-TYPE-13 · Line height is declared with the size

Every CSS rule that sets a protocol `font-size` MUST set `line-height` in the same rule. A checker does not compute inheritance, so it tests each `line-height` against the `font-size` beside it; a `font-size` with no `line-height` in its rule fails this rule.

- **Applies when:** platform: web · **Test:** machine, `type.leading-declared` · **Evidence:** convention (protocol choice)

#### FP-TYPE-09 · Longest line

A column of running text MUST NOT exceed 80 characters per line (40 for Chinese, Japanese and Korean text). On the web this is written as `max-inline-size` in `ch`. The figure is the one WCAG gives at level AAA (1.4.8); requiring it at this level is the protocol's choice.

- **Applies when:** always · **Test:** machine, `type.measure-max` · **Evidence:** convention (protocol choice)

#### FP-LAYOUT-01 · The φ split

A two-part layout whose parts have unequal weight and both hold content (text and figure, main and detail) SHOULD split 61.8 to 38.2, written `1.618fr 1fr`. Only a split that is declared as a φ split is tested. A split is declared by writing the custom property `--fp-layout: phi-split` in the same CSS rule as its `grid-template-columns`; nothing else (a ratio that happens to be near φ, a class name) makes a split "declared". A declared split MUST have exactly two tracks whose ratio is 61.8 to 38.2 within 0.1, in either order: `1.618fr 1fr`, `61.8% 38.2%`, or the tokens `--fp-split-major` and `--fp-split-minor`. A navigation rail or sidebar of fixed width is not a φ split and takes a rung for its width.

- **Applies when:** always · **Test:** machine, `layout.phi-split` · **Evidence:** convention

#### FP-LAYOUT-02 · Equal content gets equal columns

Content of equal weight (cards in a grid, bars in a chart, a host's column grid) MUST NOT be forced into a φ split. Equal columns are correct and are never flagged (FP-CONF-09).

- **Applies when:** always · **Test:** self-report, `layout.equal-allowed` · **Evidence:** convention (protocol choice)

#### FP-LAYOUT-05 · Container widths

In Native, a container's width limit MUST be 610, 987 or 1597 platform units (at every u), or a derived value of one of them (FP-SPACE-04). On the web it MUST be written as `max-inline-size` (or `max-width`), never as a fixed width, so that the container shrinks and the page still reflows at 320 (FP-A11Y-13). A checker identifies a container limit by its token, not by its size: a `max-inline-size` or `max-width` that uses a `--fp-container-*` token passes; a `width` or `inline-size` that uses one fails; and a rule marked `--fp-layout: container` MUST set its limit with one of the three tokens. Any other width is an ordinary layout length and is tested against the ladder (FP-SPACE-01).

- **Applies when:** mode: native · **Test:** machine, `layout.container-widths` · **Evidence:** convention (protocol choice)

#### FP-LAYOUT-07 · Hosts keep their breakpoints

In Overlay and Snap the host's breakpoints and window size classes MUST be kept. Breakpoint values are not tested in these modes. Platforms publish their own breakpoints, none of them derived from φ.

- **Applies when:** mode: overlay or snap · **Test:** self-report, `layout.host-breakpoints` · **Evidence:** convention (protocol choice)

## Informative rules

Published as guidance. They bind no claim in this version. A request for a level that is informative (FP-3, FP-4a, FP-4b) is answered with that fact. Use `explain <rule-ID>` or `reference/rules.json` for the text.

### Guard rules (the base of every level) (2)

- FP-A11Y-15 · Forced colours and high contrast
- FP-CTRL-05 · Space between targets

### FP-1: space and radius (6)

- FP-SPACE-02 · Role table
- FP-LINE-01 · Hairlines
- FP-LINE-03 · Tone ladder
- FP-LINE-04 · Elevation
- FP-PLAT-04 · Tailwind preset
- FP-TOKEN-10 · Style Dictionary compatibility

### FP-2: type, layout and grids (10)

- FP-TYPE-10 · Target measure
- FP-TYPE-11 · No typeface is required
- FP-LAYOUT-03 · Growth by Fibonacci pairs
- FP-LAYOUT-04 · Focal convention
- FP-LAYOUT-06 · Native breakpoints
- FP-PLAT-07 · SwiftUI mapping
- FP-PLAT-09 · Compose mapping
- FP-PLAT-10 · Print
- FP-PLAT-11 · Slides
- FP-PLAT-12 · Email

### FP-3: motion and the state grammar (22)

- FP-MOTION-01 · Interaction durations
- FP-MOTION-02 · Duration by role
- FP-MOTION-03 · Ceiling
- FP-MOTION-04 · Easing
- FP-MOTION-05 · Ambient loops
- FP-MOTION-06 · What a loop may change
- FP-MOTION-07 · Undo window
- FP-LAYER-01 · Layer roles
- FP-LAYER-02 · Hosts keep their layers
- FP-COLOR-01 · Colour is slots
- FP-COLOR-02 · Light and dark
- FP-COLOR-03 · Hosts keep their colours
- FP-COLOR-04 · Accent is not a state
- FP-STATE-01 · State identifiers
- FP-STATE-02 · State forms
- FP-STATE-03 · Mark size
- FP-STATE-04 · Chips grow with their text
- FP-STATE-05 · Animation keeps the mark readable
- FP-STATE-06 · Quiet is muted, not faded
- FP-STATE-07 · Done has no hue
- FP-STATE-08 · Tint
- FP-STATE-09 · Disabled

### FP-4a: art and illustration (12)

- FP-MATH-02 · Compute from the closed form
- FP-ART-01 · Golden-angle placement
- FP-ART-02 · Vogel spiral
- FP-ART-03 · Fibonacci counts
- FP-ART-04 · Captions state the rule and the real count
- FP-ART-05 · Same inputs, same output
- FP-ART-06 · Variation comes from an integer hash
- FP-ART-07 · Output format
- FP-ART-08 · Structure
- FP-ART-09 · Paint
- FP-ART-10 · Accessible name
- FP-ART-11 · Art that moves

### FP-4b: data visualisation (8)

- FP-VIZ-02 · The data sets the aspect
- FP-VIZ-03 · Nice-number ticks
- FP-VIZ-07 · Sequential colour
- FP-VIZ-08 · Categorical colour
- FP-VIZ-09 · Bar gaps and ends
- FP-VIZ-10 · Stat tiles
- FP-VIZ-11 · Sparklines
- FP-VIZ-12 · Dot fields

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
