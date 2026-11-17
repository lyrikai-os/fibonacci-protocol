# Lyrikai: Fibonacci Protocol for UI/UX Design Agents

*Version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

One small set of numbers and one ratio, used the same way everywhere in a design system, so that a person or an agent reaching for a value always reaches for the same few. This repository holds the specification, the design tokens, a checker, and a skill that makes a design agent follow the protocol.

**Status: released, version 1.0.0.** Version 1.0 binds FP-1 (space and radius) and FP-2 (type, layout and grids); the other areas are published as guidance. See [CHANGELOG.md](CHANGELOG.md).

See it working: [showcase/index.html](showcase/index.html) is a static page built on `dist/fp.css` (a candidate, not a claim: its machine tests pass and a few judgement items are open), in light and dark, with sample content labelled as sample. Open the file in a browser; it needs no server and loads no external scripts.

## What it is, and what it is not

The Fibonacci Protocol is a **convention for internal consistency**. It gives a design system the Fibonacci numbers times a base unit for lengths, a type scale stepped by φ (about 1.618), and a few proportions and timings. That is the whole claim: one set of numbers used everywhere makes a system easier to keep consistent and easier for an agent to follow.

It is **not an aesthetic law.** φ is a design convention here, not a law of beauty. The evidence that people prefer φ is weak and contested: a 2016 review finds a universal preference weak and likely to vanish under bias-free methods, and the usual famous examples do not hold up. The protocol therefore makes three promises and no others:

1. Every rule is cited, or labelled "convention" or "contested".
2. Accessibility floors and platform defaults sit outside the scale and always win.
3. φ may frame data but never shape it.

The evidence, with the null and mixed results beside the positive ones, is in [spec/10-evidence-honesty.md](spec/10-evidence-honesty.md). Out of scope in every version: brand colours, typefaces, logos, components, and any claim that a design is better because it uses φ.

## Who it is for

- **Design systems.** Add the protocol to a system you already have, or build a new one on it, and get machine checks that say what was and was not tested.
- **Design agents.** The `/lyrikai-fibonacci` skill makes Claude Code, Codex, Cursor or any other agent use the same numbers, report every off-ladder value and every changed host value by rule ID, and never claim that the result is better.

## Three modes

| You have | Use | You change | Highest level |
|---|---|---|---|
| A design system you want to keep as it is | **Overlay** | Nothing. You add `--fp-*` tokens and use them in a scope you choose. | FP-1; FP-2 only if the scope's type is replaced |
| A 4- or 8-based spacing scale you are willing to move | **Snap** | Your spacing and radius values move to the nearest rung, by a published table. | FP-1 by snapping; FP-2 when type is replaced |
| A new system, or one you will rebuild | **Native** | Everything is built on the ladder and the type scale. | FP-2 |

## Conformance levels and the version ladder

Levels are cumulative. A **Guard** rule (accessibility, data honesty, the claim itself) is the base of every level: one applicable Guard rule that fails voids the claim.

| Level | Covers |
|---|---|
| FP-1 | Space and radius |
| FP-2 | FP-1 plus type, layout and grids |
| FP-3 | FP-2 plus motion and the state grammar |
| FP-4a, FP-4b | Art and illustration; data visualisation. Separate badges. |

What changes between versions is how much of this is normative, that is, binding and tested:

| Area | 1.0 | 1.1 | 1.2 |
|---|---|---|---|
| Core math, modes, conformance, accessibility guardrails, data-honesty guard, evidence rules | normative | | |
| FP-1 space and radius; FP-2 type, layout and grids; on the web | normative | | |
| Tokens (format, CSS, SCSS, Tailwind); agent protocol; checker definitions | normative | | |
| FP-3 motion and the state grammar | informative | normative | |
| FP-4a art; FP-4b data visualisation | informative | normative (the checker reads SVG) | |
| iOS, macOS and Android | informative; body anchors and target floors are stated | normative | |
| Print, slides and email | informative | informative | normative |

In version 1.0 a claim names **FP-1 or FP-2** and the platform **web**. Everything else is published as guidance and cannot be claimed yet. There are 187 rules (127 normative, 60 informative); [spec/index.md](spec/index.md) lists them all.

## Quick start: five minutes, Overlay or Native on the web

You need Node.js 20 or later. There are no packages to install.

**1. Copy the tokens.** Copy [`dist/fp.css`](dist/fp.css) into your project and load it. It defines the `--fp-*` custom properties at u = 1. For a 4- or 8-based grid use `dist/u4/` or `dist/u8/` instead. The same tokens come as SCSS (`_fp.scss`), a Tailwind preset (`fp.tailwind.cjs`) and a design-tool list (`design-system-tokens.json`).

**2. Write `fp.config.json`** at the root of your project. Here is a small Native FP-1 example; `source` is everything the product ships, and `pairs` lists every text and mark colour pair in use.

```json
{
  "fp": "1.0.0",
  "mode": "native",
  "level": "FP-1",
  "platform": "web",
  "unit": 1,
  "has": { "motion": false, "timeLimits": false, "controls": true, "charts": false, "generatedArt": false, "states": false },
  "source": ["src/**/*.css"],
  "pairs": [
    { "fg": "#1b1a17", "bg": "#fbfaf7", "kind": "text" }
  ]
}
```

For Overlay, set `"mode": "overlay"` and add `"scope"`, the part of the source where you will keep to the ladder. [spec/index.md](spec/index.md#fp-1-overlay-in-five-steps) walks through it step by step, and [spec/fp.config.schema.json](spec/fp.config.schema.json) is the schema.

**3. Use the tokens.** In your CSS, take every margin, padding, gap, size and radius from the ladder: `padding: var(--fp-space-21)`, `gap: var(--fp-space-8)`, `border-radius: var(--fp-radius-13)`, `min-block-size: var(--fp-target)`.

**4. Run the checker.** From a clone of this repository, pass the folder that holds your `fp.config.json`:

```sh
node tools/fp-check/fp-check.mjs path/to/your/project
```

It runs the machine tests locally, with no network, and prints one result per rule. Its text output heads the machine result `MACHINE TESTS: PASS` (or `FAIL`, `PENDING`, `NOT-RUN`), never "result" or "claim", because a pass of the machine tests is not a claim. With no evidence file yet, a clean run shows that heading above a **candidate** line:

```text
MACHINE TESTS: PASS
CANDIDATE (not a claim): candidate · FP-1 · Native · u=1 · web · spec 1.0.0 · self-assessed · open 22
```

**5. Answer the self-report items.** Some rules only people can decide (target sizes, reflow, colour-only states and the like). The run lists the ones that apply. Write your answers in `fp-evidence.json`, beside `fp.config.json` ([schema](spec/fp-evidence.schema.json)):

```json
{
  "fp": "1.0.0",
  "adopter": "Your team or name",
  "items": {
    "FP-A11Y-13": { "result": "pass", "evidence": "Measured at 320 px: no horizontal scroll outside the data table.", "by": "Your name" }
  }
}
```

Each item is `pass` or `fail`, with evidence that says what was measured and what was found, and who assessed it. An item with no entry, or with empty evidence, is **open**. An applicable item is never answered `n/a`: whether a rule applies is decided by `fp.config.json` alone, so state the fact as a `pass` (for example "no status messages on this page") or leave the item open. Never answer an item you did not check. When every applicable item is answered and the machine tests pass, the run prints the claim and `claimState` is `valid`.

Exit codes: `0` the machine tests pass (the claim is valid or still a candidate), `1` a rule failed, an exception is pending or an item was answered `fail`, `2` the tests could not run (bad input, nothing to check). With `--json`, read `claimState` (`valid` or `candidate`), `claim` (null for a candidate) and `openItems`. See [tools/fp-check/README.md](tools/fp-check/README.md) for options and for what it does not check. Check contrast on its own with `node tools/contrast/contrast.mjs '#fg' '#bg'`.

## Install the `/lyrikai-fibonacci` skill

`fp-check` and the other tools need a clone of this repository; they are not part of the skill. The skill on its own works offline from its bundled rules and gives you the self-report path: the agent applies the rules, answers the self-report items with evidence and writes `fp-report.md`, but the machine tests are only run if the agent can run `tools/fp-check/fp-check.mjs` from a clone, and otherwise it says which it used (its own script, or by hand).

The skill makes a design agent follow the protocol when asked. It works offline from bundled rules. Switch it on with `/lyrikai-fibonacci on` (or say "use Fibonacci design principles") and off with `/lyrikai-fibonacci off`. Folder paths come from each tool's own documentation as read in November 2026; if a path no longer works, follow the linked page. The full install notes are in [agent-pack/README.md](agent-pack/README.md).

**Claude Code.** Copy `skills/lyrikai-fibonacci/` to `~/.claude/skills/lyrikai-fibonacci/` for all your projects, or to `.claude/skills/lyrikai-fibonacci/` inside a repository to share it with the team. Keep the `reference/` folder beside `SKILL.md`. Source: https://code.claude.com/docs/en/skills

**Codex.** Copy `skills/lyrikai-fibonacci/` to `.agents/skills/lyrikai-fibonacci/` in the repository, or to `~/.agents/skills/lyrikai-fibonacci/` for all projects; invoke it with `$lyrikai-fibonacci`. Or place `agent-pack/AGENTS.md` at the repository root (append it if you already have one) and keep `FP-AGENT.md` beside it. Sources: https://developers.openai.com/codex/skills and https://developers.openai.com/codex/guides/agents-md

**Cursor.** Copy `agent-pack/cursor/fibonacci-protocol.mdc` to `.cursor/rules/fibonacci-protocol.mdc` and `agent-pack/FP-AGENT.md` into the project, or copy the skill folder to `.cursor/skills/` or `~/.cursor/skills/`. Sources: https://cursor.com/docs/context/rules and https://cursor.com/docs/context/skills

**Any other tool.** Give the agent `agent-pack/FP-AGENT.md` as context (a rules file, a system prompt, an attachment). It holds the whole protocol for an agent in one file.

Check the install by asking `/lyrikai-fibonacci explain FP-SPACE-01`: it should print the rule's text, level, status, test and evidence.

## Repository layout

| Path | What |
|---|---|
| [`spec/`](spec/index.md) | The specification, `rules.json` (every rule in machine-readable form), the `fp.config.json` schema and [test vectors](spec/test-vectors/README.md). Generated from `tools/specgen/`. |
| [`tokens/`](tokens/fp.tokens.json) | The token master, in the W3C Design Tokens Format (2025.10). |
| [`dist/`](dist/fp.css) | Generated tokens: CSS, SCSS, Tailwind preset and design-tool list, at u = 1, 4 (`u4/`) and 8 (`u8/`). |
| [`skills/lyrikai-fibonacci/`](skills/lyrikai-fibonacci/SKILL.md) | The `/lyrikai-fibonacci` skill (Agent Skills format) with its offline reference. |
| [`agent-pack/`](agent-pack/README.md) | `AGENTS.md`, a Cursor rule and `FP-AGENT.md`, for tools that do not read skills. |
| [`showcase/`](showcase/index.html) | A static demonstration page. Its machine tests pass under `fp-check`; because a few self-report items are still open, it is a candidate, not a claim. |
| [`fixtures/`](fixtures/README.md) | Three sample systems, one per mode, with seeded-fault copies the checker must catch. |
| [`tools/fp-check/`](tools/fp-check/README.md) | The reference conformance checker. |
| [`tools/contrast/`](tools/contrast/README.md) | A WCAG 2.x contrast checker. |
| [`tools/build-tokens/`](tools/build-tokens/README.md) | Generates `dist/` from the token master. |
| [`tools/build-pack/`](tools/build-pack/build-pack.mjs) | Generates the skill and the agent pack from the specification. |
| [`tools/specgen/`](tools/specgen/gen.py) | The sources of the specification text, and its generators. |
| [`tools/check-public/`](tools/check-public/README.md) | The release guard: links, secrets, banned claims, licence. |

## Tests

```sh
npm test
```

This runs `node --test tools/ fixtures/` (Node 20, no dependencies). It covers the checker (289 tests, including all 24 published test vectors), the fixtures suite (each sample system is checked and each seeded fault must be caught; 21 tests), the token and pack generators, the contrast tool and the release guard. Other scripts are in [package.json](package.json): `npm run build:spec`, `build:tokens`, `build:pack`, `check:pack` and `fp-check`. To propose a change to a rule, read [CONTRIBUTING.md](CONTRIBUTING.md).

## How to claim conformance

1. Write an `fp.config.json`, declaring every colour pair in use.
2. Run `fp-check`. Fix every fail and resolve every pending exception; a result with pending exceptions is not a pass.
3. Answer every applicable self-report item in `fp-evidence.json`, with evidence you gathered (see the quick start).
4. Run `fp-check` again. A **valid claim** is printed only when the machine tests pass and no item is open:

```text
FP-2 · Native · u=1 · web · spec 1.0.0 · self-assessed
FP-1 · Overlay · u=1 · web · scope src/components/card/** · coverage 12% · exceptions 0 · spec 1.0.0 · self-assessed
```

If items are open the checker prints `candidate · <claim string> · open <n>` and lists the open rule IDs. A candidate line is not a claim: do not publish it or quote it as one.

The claim format is `<level> · <mode> · u=<unit> · <platform> · spec <version>`, with `scope <globs> · coverage <percent> · exceptions <count>` added before the version in Overlay. The claim ends in `self-assessed` unless every applicable item was assessed by someone other than the adopter (marked `"independent": true` in `fp-evidence.json`, with a different `by`). `"independent": true` is a statement by whoever writes the file; the checker cannot verify it, only read it. A reader who relies on a claim without the suffix is relying on that statement and on the named assessor.

A claim says what was tested. It never says that a design is more beautiful, more natural or better, and a passing run is not a statement that a product is accessible. A system's claim and an agent's claim are separate: the agent rules do not count toward a system's claim.

### Reports by an agent

An agent that uses the skill writes its report to `fp-report.md` beside `fp.config.json`: the claim (or the candidate line and the open rule IDs, or the result), the state (mode, level, unit, platform, what ran the tests), every off-ladder value (`FP-OFF`), every change to a host value (`FP-CHANGE`), exemptions added, suggestions, the rules used, and the About line (FP-AGENT-14).

## Licence

This repository is MIT licensed; see [LICENSE](LICENSE) (`package.json` says `MIT` too). Two fixtures carry third-party values and keep their own notices in their own folders:

- `fixtures/material-overlay/` is **Apache-2.0** (token values from Google's `@material/web`); see its `NOTICE` and `LICENSE-material`.
- `fixtures/primer-snap/` keeps GitHub's **MIT** notice for the Primer values; see `LICENSE-primer`.

## Lineage

The protocol grew out of design systems built in-house at Lyrikai during 2026; see [Lineage in spec/index.md](spec/index.md#lineage).

## Credits

Created by Lyrikai ([www.lyrikai.com](https://www.lyrikai.com)). Co-authored by Claude (Anthropic): Claude Fable drafted the specification; Claude Opus and Claude Sonnet built the tools and reviewed the work.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
