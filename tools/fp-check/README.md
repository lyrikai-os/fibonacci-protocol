# fp-check

The reference conformance checker for **Lyrikai: Fibonacci Protocol for UI/UX Design Agents**, version 1.0.0-rc.3.
MIT License. [www.lyrikai.com](https://www.lyrikai.com)

`fp-check` reads an `fp.config.json` and the CSS it names, runs the protocol's machine tests locally (no network, no dependencies, Node 20), and reports one result per rule ID: `pass`, `fail`, `pending`, `n/a`, `not-run`, or `self-report` for the rules only people can answer.

It was written from the specification text (`spec/`) and checked against the published test vectors in `spec/test-vectors/`. It did not read the script that made the vectors. Where it and a vector disagree, the test is left failing and the disagreement is listed below.

## Use

```sh
node tools/fp-check/fp-check.mjs [dir] [--config fp.config.json] [--json] [--expect expected.json] [--spec <dir>]
```

| Option | Meaning |
|---|---|
| `dir` | Folder with `fp.config.json` and the source. Default `.`. Globs in `source`, `scope` and `snap.source` are relative to it. |
| `--config` | Another configuration file. Read from `dir` if it is there, else from the working directory. |
| `--json` | Print the full report as JSON (findings, mapping, merges, overrides, pairs, coverage, claim, the table of every rule). |
| `--expect` | Compare the report with an expected-results file (the format of `spec/test-vectors/*/expected.json`) and print the differences. |
| `--spec` | Folder with `rules.json` and `fp.config.schema.json`. Default: the repository's `spec/` (or `FP_SPEC_DIR`). |

Exit codes: `0` the machine tests pass (the claim is `valid` or still a `candidate`), or `--expect` matches; `1` fail, pending, or a self-report item answered `fail` (or `--expect` differs); `2` not-run or an input error (no configuration, bad option).

The specification is silent on exit codes, so this is the checker's decision. Basis: FP-CONF-04 and FP-CONF-06 make the machine result (`result`) and the claim state two separate things. A candidate line is "not a claim yet" but the machine tests passed (the vectors give `result: pass` with `claimState: candidate`), so a candidate exits 0; a script must read `claimState` (`valid`, `candidate` or `none`, in `--json`) before it publishes anything. FP-CONF-07 says pending "is not a pass", hence 1; FP-CONF-14 says not-run is not a pass and no claim may be made, hence 2.

### Evidence and the claim state

`fp-evidence.json` beside `fp.config.json` holds the self-report answers (FP-CONF-06); it is validated against `spec/fp-evidence.schema.json`. The checker works out the applicable self-report rules from `rules.json` (normative, within the claim level, applies-when true for the configuration), lists them as `applicableSelfReport`, and reads each entry:

- no entry, or empty `evidence`: the rule is **open** (`openItems`);
- `result: fail`: the run fails (`conf.evidence`);
- all machine tests pass, nothing pending, nothing open: `claimState: valid` and the claim is printed. The ` · self-assessed` suffix stays unless every applicable item has `independent: true` and a `by` other than the adopter (FP-CONF-14);
- machine tests pass but items are open: `claimState: candidate`; the checker prints `candidate · <claim string> · open <n>` and the open rule IDs, and `claim` is null. A candidate line must not be published or quoted as a claim (FP-CONF-04).

### Tests

```sh
cd tools/fp-check && node --test
```

`test/vectors.test.mjs` runs the checker on every vector folder and compares with its `expected.json`. The other test files cover the CSS reader, the value classifier, the JSON Schema validator, every check, Snap, the type scale, contrast, token files and the command line.

## What it checks

Configuration: validates `fp.config.json` against `fp.config.schema.json` with a small built-in JSON Schema 2020-12 validator (`$ref`, `type`, `enum`, `const`, `pattern`, `minimum`, `minLength`, `minItems`, `items`, `properties`, `required`, `additionalProperties`, `allOf`, `anyOf`, `oneOf`, `not`, `if`/`then`/`else`), and checks that `fp` equals the specification version.

Reading (FP-CONF-08): plain `.css`, `<style>` blocks in `.html`, and DTCG token files (`*.json`). Shorthands are expanded to longhands (`padding`, `margin`, `inset`, `gap`, logical pairs, `border-radius` with `/`, `border-width`, `border`, `outline`), `var()` is followed within the source (with fallbacks and chains), and `calc()` is accepted only in the two derived patterns. `@media`, `@supports`, `@layer`, `@container`, `@keyframes` and nested rules are read.

Machine tests implemented (62 of the 94 machine rules in `rules.json`; the other 32 are `n/a` in any adopter's run, see below):

| Area | Rules and check names |
|---|---|
| Lengths | FP-SPACE-01 `space.on-ladder` (rungs at the declared u, 0, intrinsic values, negatives, rem and absolute units); FP-SPACE-04 `space.derived` (container x 0.618 or 0.382, container minus one ladder token, container is `100%`/`100vw`/`100vh`/`100cqi` and forms or the `--fp-container-N` token, no chaining); FP-SPACE-05 `space.exceptions`; FP-MATH-03 `math.ladder`; FP-MATH-05/06 `math.unit`, `math.unit-profile`; FP-MATH-08/09 `math.rounding`, `math.zero-negative` (fractions of a unit) |
| Fine detail | FP-RADIUS-01 `radius.set` (0, 2, 3, 5, 8, 13, 21, pill, round); FP-RADIUS-03 `radius.pill-round`; FP-MATH-07 `math.fixed-detail` (border and outline widths and offsets 0 to 3, whatever u is) |
| Modes | FP-MODE-01/02/08/10 `mode.config-present`, `mode.config-schema`, `mode.single`, `mode.roles`; FP-MODE-04 `mode.overlay-resolved`; FP-MODE-05 `mode.overlay-coverage` (counted after shorthand expansion, rounded half up); FP-MODE-06 `mode.native`; FP-MODE-09 `mode.level-ceiling` |
| Snap | FP-SNAP-01 to 07, 09, 10, 11: `snap.exempt-by-role`, `snap.nearest` (ties up), `snap.drift` (at most 25%, exact), `snap.unsnappable`, `snap.target-up` (u and pointer aware), `snap.control-height`, `snap.monotonic` (order within a group), `snap.merge-listed`, `snap.override` (at most 38.2%), `snap.level-cap`. Tokens come from CSS custom properties or a DTCG file; bare literals in the scope are mapped and listed |
| Roles and exceptions | `icon`, `type`, `breakpoint`, `drawn`, `micro` exempt; `target` is exempt when it meets the ladder target; exceptions match by token address (any `var()` in the chain), selector, `file:line` or file, and by value; `pending` exceptions make the run `pending` (FP-CONF-07) |
| Contrast | FP-A11Y-01/02 `a11y.contrast`, `a11y.contrast-exact`: WCAG 2.x luminance on every declared pair in every declared theme (by selector, media query or files); the ratio is never rounded and is displayed truncated to three decimals |
| Type (FP-2) | FP-TYPE-01 `type.scale`, -02 `type.step-range`, -03 `type.align`, -04 `type.units`, -05 `type.micro`, -07 `type.leading`, -08 `type.leading-unitless`, -13 `type.leading-declared`, -09 `type.measure-max`; FP-A11Y-07/08 `a11y.body-anchor`, `a11y.min-text` |
| Layout (FP-2) | FP-LAYOUT-01 `layout.phi-split`; FP-LAYOUT-05 `layout.container-widths` (Native) |
| Applicability | FP-CONF-11 `conf.not-applicable`: `has.motion` contradicted by `animation`, `transition` or `@keyframes`; `has.controls` by `button`, `a`, `input`, `select`, `textarea`, `summary`, `[role="button"]`, `:focus`, `:focus-visible` or `:hover` |
| Web | FP-PLAT-01 `plat.web-units`, FP-PLAT-02 `plat.web-tokens`, FP-PLAT-03 `plat.web-pointer` on `--fp-*` custom properties |
| Token files | FP-TOKEN-01 to 07, 09: `token.dtcg`, `token.types`, `token.names`, `token.master-unit`, `token.themes`, `token.extensions`, `token.root-metadata`, `token.type-rem` |
| Report | FP-CONF-04/05/07/14 (`conf.claim-format`, `conf.v1-levels`, `conf.no-pending`, `conf.not-run`), FP-HONEST-02 `honest.banned-words`, FP-HONEST-04 `honest.claim-wording` |

Type tests run when `level` is `FP-2`, in every mode (the host's type in an Overlay or Snap scope is replaced by the protocol's, FP-MODE-09). At FP-1 type is not read.

### Declarations and readings the checker relies on (spec 1.0.0-rc.3)

- `var()` is tested against every definition of the variable in the source (`:root`, local rules, `@media`), not only the `:root` one. A `var()` with no definition uses its fallback, which is tested; only a bare `var(--fp-*)` with no fallback falls back to the protocol's published value.
- A phi split (FP-LAYOUT-01) is tested only when `--fp-layout: phi-split` is in the same rule (or the rule it is nested in) as `grid-template-columns`; it needs two tracks at 61.8 to 38.2 within 0.1 (`1.618fr 1fr`, `61.8% 38.2%`, or `--fp-split-major --fp-split-minor`).
- A container limit (FP-LAYOUT-05, Native, FP-2) is identified by a bare `--fp-container-*` token: in `max-width` or `max-inline-size` it passes, in `width` or `inline-size` it fails, and a rule marked `--fp-layout: container` must set its limit with one. Any other width is an ordinary length.
- Radius: set members, `--fp-radius-pill` or `9999px`, `--fp-radius-round` or `50%`. Any other percentage, viewport unit or relative unit fails. Strokes are 0, 1, 2 or 3; `thin`, `medium` and `thick` are read as 1, 3 and 5.
- Type (FP-2): a keyword size (`large`), a percentage (other than a 100% root), `calc()`, `clamp()` or a viewport size is not a step and fails FP-TYPE-01. The root font size is not px and is 100%.
- Themes: selectors and media queries are normalised (quotes, spaces, `:root` prefix) and selector lists are split. A theme that defines neither colour of a pair, and an override of a pair colour under a selector or media query that no declared theme covers, make the pair `not-run`.
- Snap: originals come from the published table's first four columns when `snap.table` exists, else from `snap.source`. Merges (targets included) are computed and listed. Drift of at most 25% of the value is the only bound; the top rung is 1597 at u = 1 and u = 4, 3016 at u = 8. Bare literals, and values that reach a declaration through a property Snap does not map, are mapped and listed under `literals`; a token kept off the ladder fails FP-SPACE-01 / FP-RADIUS-01 where it is used unless excepted. Interactive elements for FP-SNAP-11 are elements, ARIA roles and the classes in `controls`.
- Exceptions match by value, by `where` (a selector, a token address, or `file:line`) and by the rule they depart from.
- Each off-ladder value is reported once, under FP-SPACE-01, FP-RADIUS-01 or FP-MATH-07, never also FP-MODE-04.
- `pill` is 9999px only; the protocol's own `--fp-*` properties are checked against the FP-PLAT-02 table, including `--fp-target` (coarse outside the pointer query, fine inside) and `--fp-target-coarse`.
- Token rules apply only when protocol-format token files are in the scope. The report names the tool that ran the tests (`ranBy`); see the evidence section for the `self-assessed` suffix.
- Widths and heights written inside the condition of `@media` or `@container` (breakpoints) are never read; the declarations inside the block are (FP-CONF-08).
- Inline `style` attributes are not read; they are listed with their values in `inlineStyles`, or the report states the scope has none (self-report, FP-CONF-08).
- `em`, `ex`, `lh` and similar units depend on a font size the checker does not compute: they are `not-run` for layout lengths and fail for radius and strokes. Viewport, container and `%` units are intrinsic for layout (FP-CONF-09). A non-zero number with no unit is not a length and fails.
- `calc()` is allowed for layout lengths only in the derived patterns. `min()`, `max()` and `clamp()` test each length argument.
- Accepted exceptions counted in an Overlay claim are those that matched a checked value in the scope.

## What it does not check: self-report rules

These rules are decided by people with evidence (FP-CONF-06). `fp-check` lists the ones that apply to a run (`applicableSelfReport`) and reads the answers from `fp-evidence.json`; a rule without an answer stays `self-report` (open). It cannot show target sizes, reflow, colour-only states or pause controls (FP-CONF-10), and a passing run is not proof that a product is accessible.

- Guard: FP-A11Y-03 text resize, FP-A11Y-04 text spacing, FP-A11Y-05 target size, FP-A11Y-06 focus visible, FP-A11Y-09 to 11 motion and flashes, FP-A11Y-12 focus ring, FP-A11Y-13 reflow at 320, FP-A11Y-14, FP-A11Y-16 floors win, FP-A11Y-17, FP-A11Y-18 time limits, FP-A11Y-19, FP-A11Y-20 every pair declared, FP-LINE-02, FP-CTRL-01 to 04 control targets and hit areas, FP-VIZ-01, 04, 05, 06 data honesty, FP-HONEST-03 claims never made, FP-HONEST-05 invent nothing, FP-CONF-06, FP-CONF-10, FP-CONF-12
- FP-1: FP-MATH-04 ladder scope, FP-MODE-03 Overlay keeps the host, FP-MODE-07 what an adopter may change, FP-SPACE-03 choose by role, FP-RADIUS-02 nested radii, FP-SNAP-08 the published table's "what breaks" block
- FP-2: FP-TYPE-06 control labels, FP-TYPE-12 host type mapping, FP-LAYOUT-02 equal columns, FP-LAYOUT-07 host breakpoints
- Informative, FP-3, FP-4a, FP-4b, Agent and the other platforms: published as guidance; `n/a` for a version 1.0 claim (FP-CONF-05, FP-CONF-12)

Machine rules that are `n/a` in an adopter's run because they bind the checker or the specification, or are informative or for a later level: `math.constants`, `conf.guard-base`, `conf.cumulative`, `conf.badges`, `conf.classify`, `conf.not-flagged`, `honest.labels`, `token.outputs`, `token.style-dictionary`, `plat.web-tailwind`, `agent.fp-off`, `agent.fp-change`, and the FP-3, FP-4a and FP-4b checks (`motion.*`, `color.*`, `state.*`, `art.*`, `viz.ticks`, `math.no-approximate-angle`). The behaviour FP-CONF-08 and FP-CONF-09 describe is implemented and unit-tested; the constants of FP-MATH-01 are asserted in the tests.

### Not-run

Rules are `not-run`, and so is the run, when the machine tests cannot run:

- a file in `source` is CSS-in-JS or preprocessor source (`.js`, `.ts`, `.tsx`, `.scss`, `.less`, `.vue` and so on): compile it to CSS first (FP-CONF-08);
- a `var()` cannot be resolved inside the source, a colour in a declared pair cannot be resolved, or the `scope` matches no file;
- no file matched `source`.

Inline `style` attributes are not read; a note says so. 
## Disagreements and deliberate passes

All 18 vectors pass against spec 1.0.0-rc.3. `test/probes/` holds the adversary's probes as regression tests (`expected.json` is the answer for each). Probes that are deliberately not failed: `l-media` (the phi marker and the grid are in different rules; FP-LAYOUT-01 says the same rule), `sn-localvar` (in Snap a local property is a bare literal: mapped and listed, failing only if it cannot be snapped), `s-color5` and `th-ld` (reported `not-run`, not a pass), and the schema's 5-digit hex colour pattern is the spec's, not the checker's.

## License

MIT. Copyright the Lyrikai authors. [www.lyrikai.com](https://www.lyrikai.com)
