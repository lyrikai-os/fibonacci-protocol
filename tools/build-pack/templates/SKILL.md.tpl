---
name: lyrikai-fibonacci
description: Turns on the Lyrikai Fibonacci Protocol for UI/UX design agents (spec {{VERSION}}) for a conversation, so that every length, radius, type size and target an agent writes or edits comes from one small set of numbers (the Fibonacci ladder times a base unit) while accessibility floors and data honesty always win. Use when the user types "/lyrikai-fibonacci" (verbs on, off, init, check, explain, map), says "use Fibonacci design principles", mentions "Fibonacci Protocol", or asks for a "golden ratio design system", Fibonacci spacing scale or phi-based tokens. It reads or creates fp.config.json, applies the protocol in Overlay, Snap or Native mode, and reports every off-ladder value and every changed host value with rule IDs. Works offline from bundled rules.
---

# Lyrikai: Fibonacci Protocol for UI/UX Design Agents: the `/lyrikai-fibonacci` skill

{{HEADER}}

This file is the operating guide. Detail lives in the bundled files at the end. Everything below is generated from the specification, spec {{VERSION}}, so it cannot drift from it. The protocol is a convention for internal consistency. It is not an aesthetic law, and you never say it makes a design better (FP-AGENT-09).

## Verbs

`/lyrikai-fibonacci <verb>`. These six verbs and no others (FP-AGENT-10).

| Verb | What you do |
|---|---|
| `on [FP-1\|FP-2\|FP-3\|FP-4a\|FP-4b] [overlay\|snap\|native]` | Turn the protocol on for this conversation. With no arguments, print the current state. If there is no `fp.config.json`, follow "Start" below. The phrase "use Fibonacci design principles" is the same as `on`. |
| `off` | Turn it off. Stop applying the rules. Say what was left in place (written files stay). |
| `init` | Show a starter `fp.config.json`; write it only after the user says yes. |
| `check` | Run the checks; report rule IDs, `FP-OFF` and `FP-CHANGE` lines, and the result. See "Check". |
| `explain <rule-ID>` | Print the rule's text, level, status, applies-when, test and evidence from `reference/rules.json`. |
| `map` | Print the Snap table for the user's tokens, with merges, drift and the "what breaks" block. Changes nothing. |

A request for a level that is informative in this version (FP-3, FP-4a, FP-4b) is answered with that fact: it is published as guidance and cannot be claimed in {{VERSION}} (FP-CONF-05). Version 1.0 claims are FP-1 or FP-2 on the web only. For any other platform, say the same.

## State: sticky until `off`

After `on`, the protocol stays on for the rest of the conversation. Every design task (new markup, CSS, tokens, a component, a review) follows the rules below until the user types `off`. Do not ask to re-enable it. If the conversation is long, restate the current state (mode, level, unit, platform) in one line at the start of a report.

## Start (FP-AGENT-01)

1. Look for `fp.config.json` at the project root. If it exists, read it and decide what to apply from it alone (FP-MODE-01). Check it against `fp.config.schema.json` if the project has it.
2. If there is none, ask the user once, in one message, for mode (`overlay`, `snap`, `native`), level (`FP-1` or `FP-2`), platform (`web`) and unit (`1`, `4` or `8`). Proceed with the answer. Do not ask again.
3. If you cannot ask (a non-interactive run, a pipeline), use what the request states and these defaults: unit `1`, pointer `both`, platform `web`, `type.align` `formula`. Mode and level have no default: without them, run the checks, change nothing, and report (FP-AGENT-01). Record each default you used in the report.
4. A request to apply the protocol is consent to write a configuration that records exactly the values used. In a non-interactive run, write it and list which values were defaults. In an interactive run, `init` still shows the file first (see "Consent").
5. You may suggest another unit, for example u = 4 for a 4-based grid. You must not apply a unit the user did not state or accept. Put the suggestion under "Suggestions".

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
- Ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; changing the value of any host token in Overlay, including a colour that fails a contrast floor.
- `init` writes a file only after you have shown its full content and received a yes. Never overwrite an existing `fp.config.json` without showing the difference and getting a yes.
- Never wait when no one can answer (FP-AGENT-04). Apply what you have consent for, leave anything that needs a yes unchanged, record each such item as an `FP-OFF` or `FP-CHANGE` line with `status=pending`, and continue to the end. The result of such a run is `pending` (FP-CONF-07).
- You may add `roles` entries for tokens whose role is plain from their name and use. List every one you add, with the token and the role, under the heading "Exemptions added" (FP-AGENT-12). An exemption reduces what is tested, so never add one to hide a failure.

## Working rules

Use these every time you write a length or a type size. Look the details up in `reference/FP-AGENT.md`.

- **Ladder (FP-MATH-03).** Lengths are F(n) x u for 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, plus container widths 610, 987, 1597. No other value is on the ladder. Below u only 1 and 2 count (FP-MATH-06). The ladder covers lengths only: never type sizes, durations or anything that encodes data (FP-MATH-04).
- **Tokens.** `reference/fp.css` holds the ready tokens at u = 1: `--fp-space-*`, `--fp-container-*`, `--fp-radius-*`, `--fp-focus-gap`, `--fp-focus-ring`, `--fp-target`. Use them by name (`padding: var(--fp-space-21)`). Do not hand-write a ladder value where a token exists. For u = 4 or u = 8 regenerate the values (multiply by u) and keep the names.
- **Radius (FP-RADIUS-01).** One of 0, 2, 3, 5, 8, 13, 21, `pill`, `round`.
- **Targets (FP-CTRL-01, FP-SNAP-04).** Coarse or unknown pointer: at least 55. Fine pointer: at least 34. Targets never shrink. A drawn height smaller than its hit area takes the `drawn` role.
- **Type (FP-2 only).** Type sizes come from the type scale, not the ladder (FP-TYPE-*). Every CSS rule that sets a protocol `font-size` also sets `line-height` in the same rule (FP-TYPE-13). Body stays at or above the platform anchor (16 on the web, FP-A11Y-07).
- **Overlay.** Keep the host system. Use protocol tokens only inside the declared `scope`. A host token that is used in the scope and is not a rung is replaced there by a protocol token, or declared once as an exception. Icons, type, breakpoints, drawn heights and micro type stay when given a role in `roles` (FP-MODE-10). Roles are declared, never inferred from a value.
- **Snap.** Host lengths move to the nearest rung (see `map`). Type is never snapped (FP-SNAP-09).
- **Native.** Build everything on the ladder and the type scale.
- **Name the rules.** Name the rule IDs you applied so a person can look each one up (FP-AGENT-06).
- **Words.** Never describe phi, Fibonacci numbers or a design that uses them as sacred, divine, perfect, magic, nature's code, a universal law, the most beautiful or scientifically proven (FP-HONEST-02). Say the design is consistent and which rules it meets (FP-AGENT-09). Invent nothing: no sources, no measurements (FP-HONEST-05).

## Check (`check`, and before saying "done": FP-AGENT-05)

1. **Run the machine tests.** If the reference checker is present (`tools/fp-check/` in the project, or an installed `fp-check`), run it as its README says, and say which tool and version ran. If it is absent, run your own script or check by hand against `reference/rules.json` (each rule with `"test": {"kind": "machine"}` names its check), and say which.
2. **Answer the self-report items** that apply (`"kind": "self-report"`), each with evidence: a file and line, a command and its output, a screenshot, or a measured value. An answer with no evidence is `not-run`.
3. **Mark non-applicable rules** `n/a` with a one-line reason (FP-CONF-11), from the `has` block of the configuration. Never mark `n/a` a rule whose condition is true.
4. **State** mode, level, unit and platform, and list every exception and every `n/a` with its reason.
5. **Put recommendations** you may not apply without consent (another unit, an override) under the heading "Suggestions".
6. **State the result** as one of `pass`, `fail`, `pending`, `not-run`.
   - `pass` only when every applicable machine test passed, every applicable self-report item has evidence, and no exception is `pending` (FP-CONF-07).
   - If the machine tests were not run, the result is `not-run` and no claim may be made. Never write "provisional pass" (FP-CONF-14).
   - **Never claim a pass without evidence.** If you did not run it, say you did not.
7. **Self-assessed.** If the reference checker did not run the machine tests, the claim ends with ` · self-assessed` and the report says what ran them (FP-CONF-04, FP-CONF-14).
8. **State the limits** (FP-CONF-10): which rules were machine-tested, self-reported, `n/a` and `not-run`. A passing run is not proof that a product is accessible.

Claim string (FP-CONF-04): `<level> · <mode> · u=<unit> · <platform> · spec <version>`. Overlay adds `scope <globs> · coverage <percent> · exceptions <count>` before the version. Example:

`FP-1 · Overlay · u=1 · web · scope src/components/card/** · coverage 12% · exceptions 0 · spec {{VERSION}} · self-assessed`

A skill or agent that meets every normative FP-AGENT rule may say it "follows the Fibonacci Protocol agent rules, spec {{VERSION}}". The FP-AGENT rules are not counted in a system's claim (FP-CONF-12).

## Reports

Report in this order: state (mode, level, unit, platform, which values were defaults); rules applied (IDs); `FP-OFF` lines; `FP-CHANGE` lines; Snap table (if Snap); "Exemptions added"; "Suggestions"; result and claim string.

**Off-ladder values (FP-AGENT-07).** One line per length or type size you could not keep on the ladder or scale:

`FP-OFF <where> value=<v> nearest=<lower>/<upper> reason=<floor|host-token|data|content|platform|snap-drift> rule=<ID> status=<accepted|pending>`

`floor` is `accepted` at once. `data` is `accepted` at once only with `source=<where the data comes from>`. Anything else is `pending` until the user accepts it; accepted records are written to `exceptions` in `fp.config.json`. Example: `FP-OFF src/card.css:14 value=44px nearest=34/55 reason=host-token rule=FP-SPACE-01 status=pending`

**Changed host values (FP-AGENT-08).** Never change a value without saying so and never present a snapped design as identical to the original. Snapped lengths go in the Snap table. Every other change, one line each:

`FP-CHANGE <where> from=<old> to=<new> reason=<floor|scale|snap> rule=<ID> status=<accepted|pending>`

`<where>` is a file and line, a selector or a token address. One line may cover several places when `from`, `to`, `reason` and `rule` are the same; list the places, comma-separated. Example: `FP-CHANGE tokens.css:8 from=14px to=1rem reason=floor rule=FP-A11Y-07 status=accepted`

## `explain <rule-ID>`

Read `reference/rules.json` (offline copy, spec {{VERSION}}). Find the entry whose `id` matches (case-insensitive). Print: ID and title; text; level; status; applies when; test (`kind`, `check`); evidence (`label`, and `url` or basis if present); the spec file it came from. If the status is `informative`, say it binds no claim in this version. If the ID is unknown, say so and suggest the closest IDs by prefix; never invent a rule. A shell one-liner: `node -e 'const r=require("./reference/rules.json").rules.find(x=>x.id===process.argv[1]);console.log(r||"unknown rule")' FP-SPACE-01`, run from the skill folder.

## `map`: the Snap table

Read the user's tokens and `fp.config.json` (`roles`, `unit`, `snap.overrides`). Change nothing. Compute and print:

1. **Exempt tokens.** Tokens with role `icon`, `type`, `breakpoint`, `drawn`, `micro` are left unchanged. `target` tokens follow the target rule. Exemption is by declared role, never by value; only 0 and the sub-unit values 1 and 2 are exempt by value (FP-SNAP-01).
2. **Nearest rung.** Each other length goes to the nearest ladder value (F(n) x u, FP-MATH-03) by absolute distance. Ties go up (FP-SNAP-02). Radii map to the radius set instead (FP-RADIUS-01).
3. **Drift** is |rung - value| / value. Automatic mappings must be at most 25% (FP-SNAP-03). A value that would drift more, or lies above 1.25 times the top rung, is kept and reported as `FP-OFF ... reason=snap-drift` (FP-SNAP-10).
4. **Targets** end at the larger of their original value and the ladder target, and never shrink (FP-SNAP-04). A control height with neither the `target` nor the `drawn` role is flagged (FP-SNAP-11).
5. **Order is kept** within each group: spacing and size lengths; radii; targets (FP-SNAP-05).
6. **Merges.** Tokens that land on one rung become one value; list each merged group by token name (FP-SNAP-06). An override moves one token of a group to another rung by role, at most 38.2% drift, order kept, with a reason in `snap.overrides`, and needs a yes first (FP-SNAP-07).

Print one row per token and per in-scope literal: name, role, original, snapped, drift, merged group, override reason. Then print the **what breaks** block, covering at least (FP-SNAP-08): additive spacing; a 4-unit baseline rhythm; half device pixels at 1.5x density for odd rungs at u = 1; icons of 16 and 24 inside 13 and 21 boxes; hierarchy lost in merges; visual-regression snapshots. The published table lives at `snap.table` (default `fp-snap.md`, beside `fp.config.json`); write it only after consent.

## About line (FP-AGENT-11)

When `on` runs, and at the end of every output this skill produces, the last line is exactly:

{{ABOUT}}

## Bundled files (work offline)

- `reference/FP-AGENT.md`: the single-file protocol: every normative rule's ID and text, grouped by level; informative rules as a short list.
- `reference/rules.json`: every rule with id, title, level, status, text, test, evidence, applies-when and source file. Used by `explain` and `check`.
- `reference/fp.css`: the ready `--fp-*` tokens at u = 1.
- `reference/fp.config.example.json`: the quick-start `fp.config.json`.

MIT License. {{ABOUT_SHORT}}
