# Lyrikai: Fibonacci Protocol for UI/UX Design Agents: AGENTS.md

{{HEADER}}

Copy this file into a project's `AGENTS.md` (or merge it), or place it in the global location your tool reads (see [README.md](README.md)). It is for Codex and other tools that read `AGENTS.md`.

## When to apply the protocol

Apply the Fibonacci Protocol when any of these is true, and stay in it until the user says `off`:

- The user types `/lyrikai-fibonacci` or says "use Fibonacci design principles".
- The user asks for a Fibonacci spacing scale, a "golden ratio design system" or phi-based tokens.
- The project has an `fp.config.json` at its root.

Otherwise do not apply it, and do not suggest it unprompted beyond one line.

## What to do

1. If a skill named `lyrikai-fibonacci` is installed, use it. It has the six verbs (`on`, `off`, `init`, `check`, `explain <rule-ID>`, `map`) and works offline. In this repository it is the folder `skills/lyrikai-fibonacci/` (its guide is `skills/lyrikai-fibonacci/SKILL.md`). To install it, copy that folder to `.agents/skills/` in a project or `~/.agents/skills/` for all projects (Codex), or `.claude/skills/` or `~/.claude/skills/` (Claude Code), or `.cursor/skills/` (Cursor).
2. If not, read [FP-AGENT.md](FP-AGENT.md) (every normative rule with its ID, grouped by level) and follow it. Start with FP-AGENT-01 to FP-AGENT-14.
3. Read `fp.config.json` first. If there is none, ask the user once for mode (overlay, snap, native), level (FP-1 or FP-2), platform (web) and unit (1, 4 or 8). If no one can answer, use what the request states and unit 1, pointer `both`, platform `web`, `type.align` `formula`; with no mode and level, run the checks, change nothing and report. The file must validate against `skills/lyrikai-fibonacci/reference/fp.config.schema.json` (also `fp.config.schema.json` beside this file); its field table is rule FP-MODE-02 in [FP-AGENT.md](FP-AGENT.md); a working example is `skills/lyrikai-fibonacci/reference/fp.config.example.json`. Do not guess the shape.
4. Decide in this order, first match wins: accessibility floors; data honesty; the platform anchor; the host's mode and tokens; the ladder or type scale by role; phi for proportion; report what could not be kept.
5. Ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; changing a host token's value in Overlay. Writing `fp.config.json`: in an interactive session, show it and wait for a yes; in a non-interactive run, a request to apply the protocol is itself the consent to write it, recording exactly the values used and listing which were defaults. Floors win in every mode: a host value that fails a Guard floor is changed to the smallest value that passes and reported as `FP-CHANGE ... reason=floor`; ask first only in an interactive Overlay session; in Snap and Native, and in every non-interactive run, make it and report `status=accepted` (FP-AGENT-03). Anything else that needs a yes in a non-interactive run is left unchanged and recorded as `pending`; continue to the end (FP-AGENT-04).
6. Lengths come from the ladder: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377 (times the unit), plus container widths 610, 987, 1597. Use the `--fp-*` tokens in `skills/lyrikai-fibonacci/reference/fp.css`. Type sizes come from the type scale, never the ladder.
7. Before saying "done": run the reference checker if you have the protocol repository (otherwise your own script or by hand, and say which); report mode, level, unit, platform; list every `FP-OFF` and `FP-CHANGE` line, every exception and every `n/a`; put recommendations under "Suggestions"; name the rule IDs applied; state `pass`, `fail`, `pending` or `not-run`. Without the reference checker the claim ends in `self-assessed`. Never claim a pass without evidence. The reference checker is run from the protocol repository: `node <repo>/tools/fp-check/fp-check.mjs <folder>` (the adopter's folder has no `tools/`). `check` needs a clone of the protocol repository; without one, use the self-report path and say so. An applicable self-report item with no evidence is **open**: use that word only, never `not-run` or `failed`. `n/a` is not allowed on an applicable item; change the declaration that makes it apply instead (FP-CONF-06). fp-check's text output says `MACHINE TESTS: PASS` above a candidate line: a machine pass is not a claim. Print the claim, or the candidate line, exactly as it prints it. Colour pairs in `pairs` have kind `text`, `large-text` (needs `size` `{px, weight}`) or `mark`. Grid-locked token files for u = 4 and u = 8 are `dist/u4/fp.css` and `dist/u8/fp.css` in the protocol repository; the skill bundles only u = 1.
8. Edit the adopter's own files in place; make no parallel copy, but keep `<file>.fp-original` beside each changed file when the folder is not under version control (FP-AGENT-13). Write the whole report to `fp-report.md` beside `fp.config.json`, eight sections in order: Claim, State, FP-OFF, FP-CHANGE, Exemptions added, Suggestions, Rules, About line (FP-AGENT-14). Snapped lengths go in the Snap table, never `FP-CHANGE`. Breakpoints in `@media` and `@container` are not lengths under test: never an `FP-OFF` line. Record self-report answers in `fp-evidence.json` (valid against `fp-evidence.schema.json`), never invent evidence (record only what you gathered); without it, report the candidate line exactly as fp-check prints it (FP-CONF-06). Declare every colour pair in use in `pairs` (FP-A11Y-20). `FP-CHANGE` reasons are `floor`, `scale`, `snap` or `layout`.
9. Never say a design is better, more beautiful or more harmonious because it uses phi or Fibonacci numbers.

End protocol output with this line:

{{ABOUT}}

MIT License. {{ABOUT_SHORT}}
