# Lyrikai: Fibonacci Protocol for UI/UX Design Agents: AGENTS.md

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

Copy this file into a project's `AGENTS.md` (or merge it), or place it in the global location your tool reads (see [README.md](README.md)). It is for Codex and other tools that read `AGENTS.md`.

## When to apply the protocol

Apply the Fibonacci Protocol when any of these is true, and stay in it until the user says `off`:

- The user types `/lyrikai-fibonacci` or says "use Fibonacci design principles".
- The user asks for a Fibonacci spacing scale, a "golden ratio design system" or phi-based tokens.
- The project has an `fp.config.json` at its root.

Otherwise do not apply it, and do not suggest it unprompted beyond one line.

## What to do

1. If a skill named `lyrikai-fibonacci` is installed, use it. It has the six verbs (`on`, `off`, `init`, `check`, `explain <rule-ID>`, `map`) and works offline.
2. If not, read [FP-AGENT.md](FP-AGENT.md) (every normative rule with its ID, grouped by level) and follow it. Start with FP-AGENT-01 to FP-AGENT-12.
3. Read `fp.config.json` first. If there is none, ask the user once for mode (overlay, snap, native), level (FP-1 or FP-2), platform (web) and unit (1, 4 or 8). If no one can answer, use unit 1, pointer `both`, platform `web`, `type.align` `formula`; with no mode and level, run the checks, change nothing and report.
4. Decide in this order, first match wins: accessibility floors; data honesty; the platform anchor; the host's mode and tokens; the ladder or type scale by role; phi for proportion; report what could not be kept.
5. Ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; changing a host token's value in Overlay. Write `fp.config.json` only after showing it and getting a yes, except in a run where no one can answer (then record `pending` items and continue).
6. Lengths come from the ladder: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377 (times the unit), plus container widths 610, 987, 1597. Use the `--fp-*` tokens in `skills/lyrikai-fibonacci/reference/fp.css`. Type sizes come from the type scale, never the ladder.
7. Before saying "done": run the reference checker if it is installed (otherwise your own script or by hand, and say which); report mode, level, unit, platform; list every `FP-OFF` and `FP-CHANGE` line, every exception and every `n/a`; put recommendations under "Suggestions"; name the rule IDs applied; state `pass`, `fail`, `pending` or `not-run`. Without the reference checker the claim ends in `self-assessed`. Never claim a pass without evidence.
8. Never say a design is better, more beautiful or more harmonious because it uses phi or Fibonacci numbers.

End protocol output with this line:

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · spec 1.0.0-rc.2 · MIT License · https://www.lyrikai.com

MIT License. Lyrikai: Fibonacci Protocol for UI/UX Design Agents, spec 1.0.0-rc.2. https://www.lyrikai.com
