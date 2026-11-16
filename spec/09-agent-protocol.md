# 9. Agent protocol

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

This section is written for a design agent: any model or tool that makes or edits a design on a person's behalf. It is the source from which the agent pack and the `/lyrikai-fibonacci` skill are generated.

The rules here have the level **Agent**. They describe the agent, not the design system, and are not part of a system's claim (FP-CONF-12).

## Start

### FP-AGENT-01 · Read the configuration, or ask once

Before designing, an agent MUST read `fp.config.json`. If there is none, it MUST ask the user once for mode, level, platform and unit, and proceed with the answer. If it cannot ask, it uses what the request states and these defaults for the rest: unit 1, pointer `both`, platform `web`, `type.align` `formula`. Mode and level have no default: without them the agent runs the checks, changes nothing and reports. An agent MAY suggest another unit (for example u = 4 for a 4-based grid) but MUST NOT apply a unit the user did not state or accept. Writing the configuration depends on whether anyone can answer. In an interactive session the agent shows the configuration and waits for a yes before writing it (this is what `init` does). In a non-interactive run, a request to apply the protocol is itself the consent to write a configuration that records exactly the values used; the report MUST list which were defaults.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.config` · **Evidence:** convention (protocol choice)


## Decision order

### FP-AGENT-02 · Decision order

When rules pull in different directions, an agent MUST decide in this order, and the first that applies wins:

1. Accessibility floors ([section 4](04-accessibility.md)).
2. Data honesty (FP-VIZ-01, FP-VIZ-04, FP-VIZ-05, FP-VIZ-06).
3. The platform anchor (body size, units, target floor).
4. The host's mode and its tokens.
5. The ladder or the type scale, chosen by role.
6. φ, for proportion.
7. Report what could not be kept.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.order` · **Evidence:** convention (protocol choice)


### FP-AGENT-03 · Consent

A declared `snap` mode, in the configuration or in the user's request, is the user's consent to build and apply the Snap table. An agent MUST ask before: adding or changing a Snap override; adding an exception whose reason is not `floor` or `data`; and changing the value of any host token in Overlay.

A host value that fails a Guard floor (a colour pair under its contrast floor, a target under its minimum, text that cannot be resized) is the one case with its own rule, the same in every mode. The floor wins: the value is changed, never left failing. The agent makes the smallest change that meets the floor (for a colour: move its lightness, keep its hue, stop at the first value that passes) and reports it as an `FP-CHANGE` line with `reason=floor`. In an interactive session in Overlay, the agent asks before making the change. In Snap and Native, and in every non-interactive run in any mode, it makes the change without asking and reports it with `status=accepted`.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.consent` · **Evidence:** convention (protocol choice)


### FP-AGENT-12 · Exemptions an agent declares are listed

An agent MAY add `roles` entries for tokens whose role is plain from their name and use. Because an exemption reduces what is tested, the report MUST list every exemption the agent added, with the token and the role, under its own heading.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.exemptions-listed` · **Evidence:** convention (protocol choice)


### FP-AGENT-04 · Non-interactive runs do not stall

When no one is available to answer, an agent MUST NOT wait. It applies what it has consent for, makes the floor changes FP-AGENT-03 allows, leaves anything else that needs a yes unchanged, records each such item as an `FP-OFF` or `FP-CHANGE` line with `status=pending`, and continues to the end. The result of such a run is `pending` (FP-CONF-07).

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.non-interactive` · **Evidence:** convention (protocol choice)


## Before saying "done"

### FP-AGENT-05 · Done-checks

Before reporting that work is done, an agent MUST: run the machine tests with the reference checker (`node tools/fp-check/fp-check.mjs`) if it is available, and otherwise with its own script or by hand, saying which; answer the self-report items that apply, with evidence; state mode, level, unit and platform; list every exception and every `n/a` with its reason; put anything it would recommend but may not apply without consent (another unit, an override) under a heading "Suggestions"; and state the result as `pass`, `fail`, `pending` or `not-run`. The claim ends with `self-assessed` as FP-CONF-14 requires.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.done-checks` · **Evidence:** convention (protocol choice)


### FP-AGENT-06 · Name the rules used

An agent MUST name the rule IDs it applied, so that a person can look each one up.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.rule-ids` · **Evidence:** convention (protocol choice)


### FP-AGENT-07 · Report every off-ladder value

Each length or type size an agent could not keep on the ladder or the scale MUST be reported on one line in this form:

`FP-OFF <where> value=<v> nearest=<lower>/<upper> reason=<floor|host-token|data|content|platform|snap-drift> rule=<ID> status=<accepted|pending>`

A reason of `floor` is `accepted` at once. A reason of `data` is `accepted` at once only if the line also carries `source=<where the data comes from>`. Any other reason is `pending` until the user accepts it; accepted records are written to `exceptions` in `fp.config.json`.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** machine, `agent.fp-off` · **Evidence:** convention (protocol choice)


Example: `FP-OFF src/card.css:14 value=44px nearest=34/55 reason=host-token rule=FP-SPACE-01 status=pending`

### FP-AGENT-08 · Report every change to a host value

An agent MUST NOT change a value without saying so, and MUST NOT present a snapped design as identical to the original. Snapped lengths are reported in the Snap table (FP-SNAP-08). Every other change to something the host had (a body size raised to the anchor, a colour changed to meet a contrast floor, a type size replaced by a step) MUST be reported on one line in this form:

`FP-CHANGE <where> from=<old> to=<new> reason=<floor|scale|snap|layout> rule=<ID> status=<accepted|pending>`

The reasons: `floor`, a Guard floor required it; `scale`, a type size or line height was replaced by the protocol's; `snap`, a non-length value changed as part of Snap; `layout`, a layout rule required it (a φ split, a container limit, reflow at 320).

`<where>` is a file and line, a selector or a token address. One line MAY cover several places when `from`, `to`, `reason` and `rule` are the same for all of them: the places are listed, separated by commas.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** machine, `agent.fp-change` · **Evidence:** convention (protocol choice)


Example: `FP-CHANGE tokens.css:8 from=14px to=1rem reason=floor rule=FP-A11Y-07 status=accepted`

### FP-AGENT-13 · Work in the adopter's files

An agent writes its changes into the adopter's own source files, in place; the original stays in version control, and no parallel copy is made unless the user asks for one. A property the checker does not test (`box-shadow`, `transform`, `letter-spacing`; the list is in FP-CONF-08) is left as it is. `outline-offset` and `border-width` are tested, against 0, 1, 2 and 3. Lengths in inline `style` attributes are outside a checker's reach: the agent moves them into CSS where it can and lists the rest in the report. The agent sets every `has` value truthfully, from what it sees in the scope.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.in-place` · **Evidence:** convention (protocol choice)


### FP-AGENT-09 · No aesthetic claims

An agent MUST NOT say that a design is more beautiful, more natural, more harmonious or better because it uses φ or Fibonacci numbers. It MAY say that the design is consistent and which rules it meets. Evidence: the agent's report, read by a person or swept for the banned words (FP-HONEST-02).

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.no-aesthetic-claims` · **Evidence:** convention (protocol choice); basis: [cited source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063)


## The skill

### FP-AGENT-10 · Skill verbs

The `/lyrikai-fibonacci` skill MUST provide exactly these verbs:

- `on [FP-1|FP-2|FP-3|FP-4a|FP-4b] [overlay|snap|native]`: turn the protocol on for the conversation. With no arguments it prints the current state. If there is no `fp.config.json`, it asks once for mode, level, platform and unit (FP-AGENT-01). The phrase "use Fibonacci design principles" is the same activation.
- `off`: turn it off.
- `init`: show a starter `fp.config.json` and write it only on a yes. `init` is interactive by definition; a non-interactive run writes its configuration under FP-AGENT-01 instead.
- `check`: run the reference checker where the repository is present, with `node tools/fp-check/fp-check.mjs [folder]` (Node.js, no packages, offline), and otherwise work through the same tests by hand; then report rule IDs, `FP-OFF` and `FP-CHANGE` lines and the result.
- `explain <rule-ID>`: print the rule's text, level, status, applies-when, test and evidence, from the copy of `rules.json` the skill carries.
- `map`: print the Snap table for the user's tokens in the format of FP-SNAP-08 (one row per token: name, role, original, snapped, drift, merged group, override reason), with the "what breaks" block. The rungs come from FP-MATH-03 at the declared unit (FP-MATH-06; the lists are also in `fp.config.schema.json` under `$defs`). It changes nothing.

A request for a level that is informative in this version MUST be answered with that fact.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.skill-verbs` · **Evidence:** convention (protocol choice)


### FP-AGENT-11 · About line

The skill's output MUST end with a line that names the protocol, the spec version it was built from and https://www.lyrikai.com. The skill MUST carry a copy of the agent rules and of `rules.json` so that it works offline.

- **Level:** Agent · **Status:** normative · **Applies when:** always · **Test:** self-report, `agent.about-line` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
