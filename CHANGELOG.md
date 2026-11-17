# Changelog

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

This file lists what changed in the specification, the tokens and the tools. Version 1.0.0 is the first release; the entries after it are the release candidates that led to it. Rule IDs are never reused, and a change to what a rule means is listed here.

## 1.0.0

The first release. The text, tokens and tools are those of 1.0.0-rc.5 with the version string set to `1.0.0` everywhere (`fp` in `fp.config.json`, claims, headers and footers) and the status lines changed from "release candidate" to "released". No rule changed.

## 1.0.0-rc.4

The fourth release candidate. A claim now needs evidence, not only machine tests.

### Specification

- **Evidence file.** The self-report answers live in `fp-evidence.json` beside `fp.config.json`, validated by the new `spec/fp-evidence.schema.json` (FP-CONF-06, FP-CONF-14). A claim is valid only when every applicable self-report item has a `pass` or `n/a` answer with evidence; the `self-assessed` suffix is dropped only when every item was assessed independently.
- **Candidate claims.** With machine tests passing and items still open, the output is a candidate line (`candidate · <claim> · open <n>`), which must not be published as a claim.
- **Agent report.** FP-AGENT-14 requires an agent to write its report to `fp-report.md` beside `fp.config.json`, in a fixed section order.
- Breakpoint conditions are not lengths under test. There are now 21 test vectors and 187 rules (127 normative, 60 informative).

### Checker and agent pack

- `fp-check` reads and validates `fp-evidence.json`, reports `claimState` (`valid` or `candidate`) and `openItems`, and exits 0 for a candidate whose machine tests pass, 1 for a failed rule, a pending exception or an item answered `fail`, and 2 when the tests cannot run. A Snap literal that is not on a rung fails FP-SPACE-01 where it is used (from rc.3 follow-up).
- The pack and the skill carry the report file and the evidence file.

### Repository

- `showcase/` gains `fp-evidence.json`, with answers for 22 of its 27 applicable self-report items, each from a measurement made in a browser; five stay open, so the page is a candidate. The measurements found three controls below the target size (a standalone link, the navigation links and the skip link); they were fixed.
- `README.md` and `CONTRIBUTING.md` describe the evidence step, valid claims against candidates, and the report file.

## 1.0.0-rc.5

The fifth release candidate, after two final whole-diff reviews.

### Specification

- An applicable self-report item can no longer be answered `n/a`: whether a rule applies is decided by the configuration alone, so such an entry fails the rule and the run. Open items are called open, not pending.
- A checker's text output heads the machine result `MACHINE TESTS: PASS` (or `FAIL`, `PENDING`, `NOT-RUN`), never `RESULT: PASS`, so that a pass above a candidate line is not read as a claim. `"independent": true` is stated to be an unverifiable statement by whoever writes the evidence file.
- A `large-text` contrast pair declares its `size`; HTML that contradicts a `has` flag is tested; removing a focus outline is a fail; contrast is tested against every definition of a colour; evidence labels were corrected where a source only states a fact. There are 24 test vectors.

### Repository

- `npm test` now runs `node --test tools/ fixtures/`, so the fixtures are covered.
- `package.json` gains `repository`, `bugs` and `author`; a `.gitignore` is added (`node_modules/`, `.DS_Store`, `*.log`, `*.fp-original`).
- The showcase is at rc.5. Its one `n/a` answer (FP-A11Y-19) is now a `pass` stating the fact (no status messages; grep count 0), and a newly applicable item, FP-CTRL-04, is answered from the earlier measurements. It stays a candidate with five judgement items open.
- `README.md` explains that `fp-check` needs a clone of this repository, the `independent` caveat, the `MACHINE TESTS` heading, and names the licences of the two fixtures that carry third-party notices.

## 1.0.0-rc.3 (superseded in rc.4: candidate)

The third release candidate. It follows the fixtures, a pilot of agents using the skill, and a hardening review of the checker.

### Specification

- **Agents.** The floor-versus-consent rule is stated once, in FP-AGENT-03. A new rule, FP-AGENT-13, covers working in the adopter's files. There are now 186 rules (126 normative, 60 informative).
- **Configuration.** The `fp.config.json` field table is part of the text of FP-MODE-02.
- **Splits.** The split tokens are written as `fr` tracks, so they can be used directly as grid tracks.
- **Snap.** One drift bound is stated, in place of two.
- The version string is `1.0.0-rc.3` everywhere.

### Tokens and agent pack

- `--fp-split-major` and `--fp-split-minor` are `1.618fr` and `1fr`; `--fp-radius-round` is `50%`; the Tailwind preset has fixes. `dist/` is regenerated.
- The agent pack bundles the configuration schema, carries the revised consent wording and adds a first-run checklist.

### Checker

- `fp-check` tests a `var()` against every definition, matches themes after normalising them, handles radius, relative units and computed type sizes, treats Snap literals and controls, applies the single drift bound and reports each off-ladder value once. It resolves a bare `var(--fp-*)` to its published default. Every probe from an adversarial review is a regression test: 265 tests, and 18 of 18 vectors pass.

### Repository

- Fixtures for each mode (Primer for Snap, Material 3 for Overlay in an Apache-2.0 folder, and Native), each with seeded-fault copies.
- `README.md`, `CONTRIBUTING.md`, this file and `showcase/index.html`, which passes `fp-check` as a self-assessed FP-2 Native claim (superseded in rc.4: candidate) and uses the split tokens as its grid tracks.

## 1.0.0-rc.2

The second release candidate. It follows an independent build of the checker, `fp-check`, from the specification text alone. Where that checker and the first set of test vectors disagreed, the specification was made explicit rather than the checker bent.

### Specification

- **Declared markers.** A φ split (FP-LAYOUT-01) is tested only when `--fp-layout: phi-split` is written in the same CSS rule as its `grid-template-columns`; a container limit (FP-LAYOUT-05) is identified by its `--fp-container-*` token, and a rule marked `--fp-layout: container` must set its limit with one. A ratio that merely lies near φ, or a class name, no longer declares anything.
- **Type rule attribution.** The unused odd steps 5 and 7 (53, 55, 86, 89 from body 16) fail FP-TYPE-02 (step range), not FP-TYPE-01. Under `type.align: fibonacci`, the replaced rounded value (20) fails FP-TYPE-03. FP-TYPE-11 now says the `inherit` and `400` placeholders in list-shaped token files mean "the adopter's choice".
- **Snap.** Merged groups now include `target` tokens raised to the same ladder target, and the checker lists them by name (FP-SNAP-06). The drift rule (FP-SNAP-03) defines the top rung with the container widths included: 1597 at u = 1 and u = 4, 3016 at u = 8.
- **Schema.** The u = 8 rung list had 1136; it is 1152. The `$id` and description carry the new version.
- **Web platform page.** The web custom-property table (spec/08-platforms/web.md) gained the line, easing, layer, split and constant groups, `--fp-radius-round`, `--fp-target-coarse` and the two target-floor tokens, and a note that the marker properties `--fp-layout: phi-split` and `--fp-layout: container` carry no value.
- **Wording.** Consent wording in the agent protocol was tightened. The index now says that `fp-check` ships in this repository and gives the command to run it, `node tools/fp-check/fp-check.mjs [folder with fp.config.json]`.
- The version string is `1.0.0-rc.2` everywhere (`fp` in `fp.config.json`, claims, headers and footers).

### Tokens and agent pack

- `dist/` is regenerated for u = 1, 4 and 8 with `--fp-radius-round` (50%) added.
- The skill `/lyrikai-fibonacci`, `AGENTS.md`, the Cursor rule and `FP-AGENT.md` are regenerated from the new specification; `reference/rules.json` and `reference/fp.css` in the skill follow.

### Checker

- `fp-check` passes all 18 published test vectors. The four rc.1 disagreements (target merges in vectors 08 and 09, and FP-TYPE-02 and FP-TYPE-03 attribution in vectors 11 and 12) are resolved in the specification.
- The checker reads the declared markers above in place of the rc.1 heuristics (a ratio within 5% of φ, a selector containing `phi` or `golden`, a `max-width` of 500 px or more, a radius of 999 px or more).
- Pill is `--fp-radius-pill` or the literal `9999px`; round is `--fp-radius-round` or `50%`; any other large radius fails the radius set.

### Repository

- A showcase page, `showcase/index.html`, built on `dist/fp.css`, with its own `fp.config.json`.
- Fixtures for each mode (Snap, Overlay, Native) with seeded-fault copies the checker must catch; see `fixtures/README.md`.
- `README.md`, `CONTRIBUTING.md` and this file.

## 1.0.0-rc.1

The first release candidate.

- **Specification.** Version 1.0 text for every area: core math (the Fibonacci ladder times a base unit u, with grid-locked profiles at u = 4 and u = 8, and the container widths 610, 987 and 1597), the three integration modes (Overlay, Snap, Native), conformance (levels FP-1 to FP-4b, Guard and Agent rules, the claim string), accessibility guardrails, UI rules for space, radius, type, layout, controls, motion, layers, colour and the eight-state grammar, art, data visualisation, platforms (web, iOS and macOS, Android, print, slides and email), the agent protocol, and evidence and honesty. 185 rules: 125 normative and 60 informative. In version 1.0 a claim names FP-1 or FP-2 on the web.
- **Generator.** The specification pages and `spec/rules.json` are generated from one set of sources in `tools/specgen/`, so the pages, the index and the machine-readable rules cannot drift. `spec/fp.config.schema.json` and 18 test vectors for the core machine tests are included.
- **Tokens.** A token master in the W3C Design Tokens Format Module 2025.10 and zero-dependency generators for CSS custom properties, SCSS, a Tailwind preset and a design-system token list, at u = 1, 4 and 8.
- **Skill and agent pack.** The `/lyrikai-fibonacci` skill (Agent Skills format, offline) and an agent pack for tools that read `AGENTS.md`, Cursor rules, or a single file. Generated from the specification by `tools/build-pack/`.
- **Checker.** `fp-check`, the reference conformance checker, written independently of the vector script. 14 of the 18 vectors agreed; the four disagreements were left failing for rc.2.
- **Release guards.** `tools/contrast/` (WCAG 2.x contrast, never rounded) and `tools/check-public/` (links, secrets, banned claims, licence) for what may be published.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
