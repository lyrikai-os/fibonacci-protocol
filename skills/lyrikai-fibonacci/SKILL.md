---
name: lyrikai-fibonacci
description: Turns on the Lyrikai Fibonacci Protocol for UI/UX design agents (spec 1.0.0) for a conversation, so that every length, radius, type size and target an agent writes or edits comes from one small set of numbers (the Fibonacci ladder times a base unit) while accessibility floors and data honesty always win. Use when the user types "/lyrikai-fibonacci" (verbs on, off, init, check, explain, map), says "use Fibonacci design principles", mentions "Fibonacci Protocol", or asks for a "golden ratio design system", Fibonacci spacing scale or phi-based tokens. It reads or creates fp.config.json, applies the protocol in Overlay, Snap or Native mode, and reports every off-ladder value and every changed host value with rule IDs. Works offline from bundled rules.
---

# Lyrikai: Fibonacci Protocol for UI/UX Design Agents: the `/lyrikai-fibonacci` skill

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

This file is the operating guide. Detail lives in the bundled files at the end. Everything below is generated from the specification, spec 1.0.0, so it cannot drift from it. The protocol is a convention for internal consistency. It is not an aesthetic law, and you never say it makes a design better (FP-AGENT-09).

## Verbs

`/lyrikai-fibonacci <verb>`. These six verbs and no others (FP-AGENT-10).

| Verb | What you do |
|---|---|
| `on [FP-1\|FP-2\|FP-3\|FP-4a\|FP-4b] [overlay\|snap\|native]` | Turn the protocol on for this conversation. With no arguments, print the current state. If there is no `fp.config.json`, follow "Start" below. The phrase "use Fibonacci design principles" is the same as `on`. |
| `off` | Turn it off. Stop applying the rules. Say what was left in place (written files stay). |
| `init` | Show a starter `fp.config.json`; write it only after the user says yes (interactive session). |
| `check` | Run the checks; report rule IDs, `FP-OFF` and `FP-CHANGE` lines, and the result. See "Check". |
| `explain <rule-ID>` | Print the rule's text, level, status, applies-when, test and evidence from `reference/rules.json`. |
| `map` | Print the Snap table for the user's tokens, with merges, drift and the "what breaks" block. Changes nothing. |

A request for a level that is informative in this version (FP-3, FP-4a, FP-4b) is answered with that fact: it is published as guidance and cannot be claimed in 1.0.0 (FP-CONF-05). Version 1.0 claims are FP-1 or FP-2 on the web only. For any other platform, say the same.

## State: sticky until `off`

After `on`, the protocol stays on for the rest of the conversation. Every design task (new markup, CSS, tokens, a component, a review) follows the rules below until the user types `off`. Do not ask to re-enable it. If the conversation is long, restate the current state (mode, level, unit, platform) in one line at the start of a report.

## Start (FP-AGENT-01)

1. Look for `fp.config.json` at the project root. If it exists, read it and decide what to apply from it alone (FP-MODE-01). Check it against `fp.config.schema.json` if the project has it.
2. If there is none, ask the user once, in one message, for mode (`overlay`, `snap`, `native`), level (`FP-1` or `FP-2`), platform (`web`) and unit (`1`, `4` or `8`). Proceed with the answer. Do not ask again.
3. If you cannot ask (a non-interactive run, a pipeline), use what the request states and these defaults: unit `1`, pointer `both`, platform `web`, `type.align` `formula`. Mode and level have no default: without them, run the checks, change nothing, and report (FP-AGENT-01). Record each default you used in the report.
4. Writing the configuration depends on whether anyone can answer (FP-AGENT-01). In an interactive session, show the configuration and wait for a yes before writing it (this is what `init` does). In a non-interactive run, a request to apply the protocol is itself the consent to write a configuration that records exactly the values used; the report lists which were defaults.
5. The file must validate against `reference/fp.config.schema.json`. The field table (every field, type, default) is in FP-MODE-02 in `reference/FP-AGENT.md`; `reference/fp.config.example.json` is a working example. Do not guess the shape.
6. You may suggest another unit, for example u = 4 for a 4-based grid. You must not apply a unit the user did not state or accept. Put the suggestion under "Suggestions".

Choosing a mode: keep an existing design system as it is, use **Overlay** (add `--fp-*` tokens and use them in a scope; change nothing else). A 4- or 8-based scale the user is willing to move: **Snap** (spacing and radius move to the nearest rung by a published table). A new or rebuilt system: **Native**. Highest level: Overlay and Snap claim FP-1 by default and FP-2 only when the scope's type is replaced (FP-MODE-09); Native claims FP-1 or FP-2.

## Decision order (FP-AGENT-02)

When rules pull in different directions, decide in this order. The first that applies wins.

1. Accessibility floors (contrast, text resize, targets, reflow, reduced motion; FP-A11Y-*).
2. Data honesty (FP-VIZ-01, FP-VIZ-04, FP-VIZ-05, FP-VIZ-06).
3. The platform anchor (body size, units, target floor).
4. The host's mode and its tokens.
5. The ladder or the type scale, chosen by role.
6. phi, for proportion.
7. Report what could not be kept.

Never let the ladder shrink a target, drop a body size below the anchor, or bend a data value. Say so when a floor wins.

## Consent (FP-AGENT-03, FP-AGENT-04)

- A declared `snap` mode, in the configuration or in the user's request, is consent to build and apply the Snap table.
- Ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; changing the value of any host token in Overlay.
- **Floors win, the same in every mode.** A host value that fails a Guard floor (a colour pair under its contrast floor, a target under its minimum, text that cannot be resized) is changed, never left failing. Make the smallest change that meets the floor (for a colour: move its lightness, keep its hue, stop at the first value that passes) and report it as an `FP-CHANGE` line with `reason=floor`. In an interactive session in Overlay, ask before making the change. In Snap and Native, and in every non-interactive run in any mode, make it without asking and report it with `status=accepted` (FP-AGENT-03).
- In an interactive session `init` writes a file only after you have shown its full content and received a yes. Never overwrite an existing `fp.config.json` without showing the difference and getting a yes. In a non-interactive run, a request to apply the protocol is the consent to write it (FP-AGENT-01).
- Never wait when no one can answer (FP-AGENT-04). Apply what you have consent for, leave anything that needs a yes unchanged, record each such item as an `FP-OFF` or `FP-CHANGE` line with `status=pending`, and continue to the end. The result of such a run is `pending` (FP-CONF-07).
- You may add `roles` entries for tokens whose role is plain from their name and use. List every one you add, with the token and the role, under the heading "Exemptions added" (FP-AGENT-12). An exemption reduces what is tested, so never add one to hide a failure.

## Working rules

Use these every time you write a length or a type size. Look the details up in `reference/FP-AGENT.md`.

- **Ladder (FP-MATH-03).** Lengths are F(n) x u for 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, plus container widths 610, 987, 1597. No other value is on the ladder. Below u only 1 and 2 count (FP-MATH-06). The ladder covers lengths only: never type sizes, durations or anything that encodes data (FP-MATH-04).
- **Tokens.** `reference/fp.css` holds the ready tokens at u = 1: `--fp-space-*`, `--fp-container-*`, `--fp-radius-*`, `--fp-focus-gap`, `--fp-focus-ring`, `--fp-target`. Use them by name (`padding: var(--fp-space-21)`). Do not hand-write a ladder value where a token exists. This skill bundles only u = 1. For u = 4 or u = 8 use the grid-locked token files in the protocol repository, `dist/u4/fp.css` and `dist/u8/fp.css` (same names, values multiplied by u).
- **Radius (FP-RADIUS-01).** One of 0, 2, 3, 5, 8, 13, 21, `pill`, `round`.
- **Targets (FP-CTRL-01, FP-SNAP-04).** Coarse or unknown pointer: at least 55. Fine pointer: at least 34. Targets never shrink. A drawn height smaller than its hit area takes the `drawn` role.
- **Type (FP-2 only).** Type sizes come from the type scale, not the ladder (FP-TYPE-*). Every CSS rule that sets a protocol `font-size` also sets `line-height` in the same rule (FP-TYPE-13). Body stays at or above the platform anchor (16 on the web, FP-A11Y-07).
- **Overlay.** Keep the host system. Use protocol tokens only inside the declared `scope`. A host token that is used in the scope and is not a rung is replaced there by a protocol token, or declared once as an exception. Icons, type, breakpoints, drawn heights and micro type stay when given a role in `roles` (FP-MODE-10). Roles are declared, never inferred from a value.
- **Snap.** Host lengths move to the nearest rung (see `map`). Type is never snapped (FP-SNAP-09).
- **Native.** Build everything on the ladder and the type scale.
- **Work in the adopter's files (FP-AGENT-13).** Edit the project's own source in place; the original stays in version control; make no parallel copy unless asked. If the folder is not under version control, first keep `<file>.fp-original` beside each file you change and say so in the report. Leave untested properties (`box-shadow`, `transform`, `letter-spacing`; list in FP-CONF-08) as they are. `outline-offset` and `border-width` are tested against 0, 1, 2, 3. Move lengths in inline `style` attributes into CSS where you can and list the rest in the report. Set every `has` value truthfully from what you see in the scope.
- **Breakpoints are not lengths under test.** A width in `@media` or `@container` is a breakpoint: keep the host's (FP-LAYOUT-07, FP-CONF-09) and it is never an `FP-OFF` line.
- **Name the rules.** Name the rule IDs you applied so a person can look each one up (FP-AGENT-06).
- **Words.** Never describe phi, Fibonacci numbers or a design that uses them as sacred, divine, perfect, magic, nature's code, a universal law, the most beautiful or scientifically proven (FP-HONEST-02). Say the design is consistent and which rules it meets (FP-AGENT-09). Invent nothing: no sources, no measurements (FP-HONEST-05).

## First run: checklist

When the protocol is turned on for a project for the first time, do these in order.

1. Write `fp.config.json` (see "Start"), valid against `reference/fp.config.schema.json`. Validate it with fp-check (`node <repo>/tools/fp-check/fp-check.mjs <folder>`, run from the protocol repository; the adopter's folder has no `tools/`); a rejected configuration is exit 2 with the reason.
2. Edit the adopter's own files in place (FP-AGENT-13). Do not write a parallel copy. If the folder is not under version control, first keep `<file>.fp-original` beside each file you will change, and say so in the report.
3. Declare every colour pair in use in `pairs` (FP-A11Y-20), each as `fg`, `bg` and `kind`: `text` (4.5:1), `large-text` (3:1; it also needs `size` as `{px, weight}`, the smallest size the pair is used at, and qualifies only at 24 px, or 18.67 px with weight 700 or more) or `mark` (3:1). A pair that is used and not declared is not tested, and a missing pair is a failed self-report (FP-A11Y-20).
4. Answer every applicable self-report rule with evidence you gathered, in `fp-evidence.json` beside `fp.config.json` (see "Evidence").
5. Run fp-check from the protocol repository: `node <repo>/tools/fp-check/fp-check.mjs <folder>`. Fix what fails (floors first, per the decision order) and run it again. If the tool is absent, follow "Check" below and say so.
6. **Write `fp-report.md`** beside `fp.config.json` (FP-AGENT-14; see "Reports"). `FP-OFF`, `FP-CHANGE` and Suggestions go in that file, not only in chat. Snapped lengths go in the Snap table, never as `FP-CHANGE` lines.
7. Print the claim, or the candidate line, exactly as `fp-check` prints it, then the About line.

## Check (`check`, and before saying "done": FP-AGENT-05)

1. **Run the machine tests.** `check` needs a clone of the protocol repository, because `fp-check` lives there and is not bundled in this skill. Without a clone, take the self-report path: run your own script or check by hand against `reference/rules.json`, say so, and report `not-run` for the machine tests. If you have the clone, run `node <repo>/tools/fp-check/fp-check.mjs <folder>` from the protocol repository (add `--json` for the full report) and say which tool and version ran. Exit 0 is pass; 1 is fail or pending; 2 is not-run or an input error. Look for an installed `fp-check` if you do not have the repository. If it is absent, run your own script or check by hand against `reference/rules.json` (each rule with `"test": {"kind": "machine"}` names its check), and say which.
2. **Answer the self-report items** that apply (`"kind": "self-report"`), each with evidence: a file and line, a command and its output, a screenshot, or a measured value. An applicable item with no evidence is **open**: "open" is the only word for it, never `not-run` or `failed`, and it holds back the claim.
3. **Mark non-applicable rules** `n/a` with a one-line reason (FP-CONF-11), decided by the configuration alone (`mode`, `level`, `platform`, `has`, `roles`). `n/a` is not allowed on an applicable item, and an `n/a` in `fp-evidence.json` for one fails the run (FP-CONF-06): if you think a rule does not apply, change the declaration that makes it apply. A rule that applies but finds nothing to act on is answered `pass`, with that fact as the evidence.
4. **State** mode, level, unit and platform, and list every exception and every `n/a` with its reason.
5. **Put recommendations** you may not apply without consent (another unit, an override) under the heading "Suggestions".
6. **State the result** as one of `pass`, `fail`, `pending`, `not-run`.
   - `pass` only when every applicable machine test passed, every applicable self-report item has evidence, and no exception is `pending` (FP-CONF-07).
   - If the machine tests were not run, the result is `not-run` and no claim may be made. Never write "provisional pass" (FP-CONF-14).
   - **Never claim a pass without evidence.** If you did not run it, say you did not.
7. **Self-assessed.** If the reference checker did not run the machine tests, the claim ends with ` · self-assessed` and the report says what ran them (FP-CONF-04, FP-CONF-14). When `fp-check` ran, print the claim exactly as it prints it, character for character. Do not reword or shorten it.
8. **State the limits** (FP-CONF-10): which rules were machine-tested, self-reported, `n/a` and `not-run`. A passing run is not proof that a product is accessible.

Claim string (FP-CONF-04): `<level> · <mode> · u=<unit> · <platform> · spec <version>`. Overlay adds `scope <globs> · coverage <percent> · exceptions <count>` before the version. Example:

`FP-1 · Overlay · u=1 · web · scope src/components/card/** · coverage 12% · exceptions 0 · spec 1.0.0 · self-assessed`

A skill or agent that meets every normative FP-AGENT rule may say it "follows the Fibonacci Protocol agent rules, spec 1.0.0". The FP-AGENT rules are not counted in a system's claim (FP-CONF-12).

## Reports

**Write the report to `fp-report.md`, beside `fp.config.json` (FP-AGENT-14).** Eight sections, in this order, each present even when empty (an empty section says "none"):

1. **Claim**: the claim string, or the candidate line with the open rule IDs, or the result `fail`, `pending` or `not-run`.
2. **State**: mode, level, unit, platform, what ran the machine tests, which configuration values were defaults.
3. **FP-OFF**: one line per off-ladder value.
4. **FP-CHANGE**: one line per change to a host value that is not a snapped length. Snapped lengths are in the Snap table (FP-SNAP-08), never here.
5. **Exemptions added**: every `roles` entry you added.
6. **Suggestions**: what you would recommend but did not apply.
7. **Rules**: the rule IDs applied, and each `n/a` with its reason.
8. The About line, last.

Then give the user the same claim or candidate line in chat, and the path of the file.

**Off-ladder values (FP-AGENT-07).** One line per length or type size you could not keep on the ladder or scale:

`FP-OFF <where> value=<v> nearest=<lower>/<upper> reason=<floor|host-token|data|content|platform|snap-drift> rule=<ID> status=<accepted|pending>`

`floor` is `accepted` at once. `data` is `accepted` at once only with `source=<where the data comes from>`. Anything else is `pending` until the user accepts it; accepted records are written to `exceptions` in `fp.config.json`. Example: `FP-OFF src/card.css:14 value=44px nearest=34/55 reason=host-token rule=FP-SPACE-01 status=pending`

**Changed host values (FP-AGENT-08).** Never change a value without saying so and never present a snapped design as identical to the original. Snapped lengths go in the Snap table. Every other change, one line each:

`FP-CHANGE <where> from=<old> to=<new> reason=<floor|scale|snap|layout> rule=<ID> status=<accepted|pending>`

Reasons: `floor`, a Guard floor required it; `scale`, a type size or line height was replaced by the protocol's; `snap`, a non-length value changed as part of Snap; `layout`, a layout rule required it (a phi split, a container limit, reflow at 320).

`<where>` is a file and line, a selector or a token address. One line may cover several places when `from`, `to`, `reason` and `rule` are the same; list the places, comma-separated. Example: `FP-CHANGE tokens.css:8 from=14px to=1rem reason=floor rule=FP-A11Y-07 status=accepted`

## Evidence (`fp-evidence.json`)

Self-report answers are recorded in `fp-evidence.json` beside `fp.config.json`, valid against `reference/fp-evidence.schema.json` (FP-CONF-06). It holds `fp` (the spec version), `adopter` (who makes the claim) and `items`: one entry per applicable self-report rule, keyed by rule ID, each with `result` (`pass`, `fail` or `n/a`), `evidence` (text, a file path or a URL; for `n/a`, the reason) and `by` (who assessed it). Applicable means: normative, within the claim's level, and its applies-when condition true.

- A claim is valid only with complete evidence: an applicable rule with no entry or empty `evidence` is open, an entry with `result` `fail` fails the run, and the claim needs the machine tests to pass with no exception pending.
- **Never invent evidence.** Record only what you gathered: a measurement, a file and line, a command and its output. If you did not check it, leave it open.
- fp-check's text output prints `MACHINE TESTS: PASS` above a candidate line. A machine pass is not a claim: the claim state is `valid`, `candidate` or `none` (FP-CONF-06). Report "machine tests pass, claim not made" until nothing is open.
- With evidence missing, report the **candidate line** exactly as `fp-check` prints it, with the open rule IDs, and do not call it a claim.
- The `self-assessed` suffix stays when you, or the adopter, assessed the items; only an independent party named in `by` with `"independent": true` removes it (FP-CONF-14).

## `explain <rule-ID>`

Read `reference/rules.json` (offline copy, spec 1.0.0). Find the entry whose `id` matches (case-insensitive). Print: ID and title; text; level; status; applies when; test (`kind`, `check`); evidence (`label`, and `url` or basis if present); the spec file it came from. If the status is `informative`, say it binds no claim in this version. If the ID is unknown, say so and suggest the closest IDs by prefix; never invent a rule. A shell one-liner: `node -e 'const r=require("./reference/rules.json").rules.find(x=>x.id===process.argv[1]);console.log(r||"unknown rule")' FP-SPACE-01`, run from the skill folder.

## `map`: the Snap table

Read the user's tokens and `fp.config.json` (`roles`, `unit`, `snap.overrides`). Change nothing. Compute and print:

1. **Exempt tokens.** Tokens with role `icon`, `type`, `breakpoint`, `drawn`, `micro` are left unchanged. `target` tokens follow the target rule. Exemption is by declared role, never by value; only 0 and the sub-unit values 1 and 2 are exempt by value (FP-SNAP-01).
2. **Nearest rung.** Each other length goes to the nearest ladder value (F(n) x u, FP-MATH-03) by absolute distance. Ties go up (FP-SNAP-02). Radii map to the radius set instead (FP-RADIUS-01).
3. **Drift** is |rung - value| / value. Automatic mappings must be at most 25% (FP-SNAP-03). A value that would drift more, or lies above 1.25 times the top rung, is kept and reported as `FP-OFF ... reason=snap-drift` (FP-SNAP-10).
4. **Targets** end at the larger of their original value and the ladder target, and never shrink (FP-SNAP-04). A control height with neither the `target` nor the `drawn` role is flagged (FP-SNAP-11).
5. **Order is kept** within each group: spacing and size lengths; radii; targets (FP-SNAP-05).
6. **Merges.** Tokens that land on one rung become one value; list each merged group by token name (FP-SNAP-06). An override moves one token of a group to another rung by role, at most 38.2% drift, order kept, with a reason in `snap.overrides`, and needs a yes first (FP-SNAP-07).

Print one row per token and per in-scope literal: name, role, original, snapped, drift, merged group, override reason. Then print the **what breaks** block, covering at least (FP-SNAP-08): additive spacing; a 4-unit baseline rhythm; half device pixels at 1.5x density for odd rungs at u = 1; icons of 16 and 24 inside 13 and 21 boxes; hierarchy lost in merges; visual-regression snapshots. The published table lives at `snap.table` (default `fp-snap.md`, beside `fp.config.json`). A declared `snap` mode, in the configuration or the request, is the consent to build and apply it (FP-AGENT-03), so write it. `map` itself changes nothing: only the Snap run writes the table. Snapped lengths go in this table, never in `FP-CHANGE` lines.

## About line (FP-AGENT-11)

When `on` runs, and at the end of every output this skill produces, the last line is exactly:

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · spec 1.0.0 · MIT License · https://www.lyrikai.com

## Bundled files (work offline)

- `reference/FP-AGENT.md`: the single-file protocol: every normative rule's ID and text, grouped by level; informative rules as a short list.
- `reference/rules.json`: every rule with id, title, level, status, text, test, evidence, applies-when and source file. Used by `explain` and `check`.
- `reference/fp.config.schema.json`: the JSON Schema for `fp.config.json`. The field table is FP-MODE-02 in `FP-AGENT.md`.
- `reference/fp-evidence.schema.json`: the JSON Schema for `fp-evidence.json`.
- `reference/fp.css`: the ready `--fp-*` tokens at u = 1.
- `reference/fp.config.example.json`: the quick-start `fp.config.json`.

MIT License. Lyrikai: Fibonacci Protocol for UI/UX Design Agents, spec 1.0.0. https://www.lyrikai.com
