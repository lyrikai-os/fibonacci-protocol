# 2. Integration modes

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

A system that already exists adopts the protocol in one of three modes. The mode is declared in a file, so that a person, an agent and a checker all read the same thing.

## The configuration file

### FP-MODE-01 · A configuration file declares the adoption

A system that claims conformance MUST have an `fp.config.json` at its root. A checker and the `/lyrikai-fibonacci` skill MUST decide what to test from this file alone.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `mode.config-present` · **Evidence:** convention (protocol choice)


### FP-MODE-02 · Configuration fields

The file MUST validate against [fp.config.schema.json](fp.config.schema.json). The field table and the token-address rule below are part of this rule. `fp` MUST equal the version string of the specification the system was checked against, written in full (for example `1.0.0-rc.5`).

| Field | Type | Required | Values and default |
|---|---|---|---|
| `fp` | string | yes | The spec version, in full. |
| `mode` | string | yes | `overlay`, `snap` or `native`. |
| `level` | string | yes | `FP-1` or `FP-2` in version 1.0. |
| `platform` | string | yes | `web` in version 1.0. (`ios`, `macos` and `android` are reserved for 1.1; print, slides and email are not platforms for a claim.) |
| `unit` | integer | no | `1`, `4` or `8`. Default `1`. |
| `pointer` | string | no | `fine`, `coarse` or `both`. Default `both`. `fine` declares a product used only with a mouse or trackpad, and needs a `pointerReason`. |
| `pointerReason` | string | when `pointer` is `fine` | Why no touch or coarse pointer is supported. |
| `type.body` | number | no | Body size in platform units. Default: the platform anchor (16 on the web). |
| `type.align` | string | no | `formula` or `fibonacci`. Default `formula`. |
| `has` | object | yes | Six true-or-false facts about what is inside the scope: `motion`, `timeLimits`, `controls`, `charts`, `generatedArt`, `states`. They decide which rules are `n/a` (FP-CONF-11). Only `motion` and `controls` are checked against the source by machine; the other four are the adopter's own statement. |
| `source` | array of globs | yes | Every file the product ships that holds lengths. |
| `scope` | array of globs | no | The files the claim covers. Default: the same as `source`. |
| `themes` | array | no | Each: `name`, and where the theme's colour values are found: `selector` (for example `[data-theme="dark"]`), `media` (for example `(prefers-color-scheme: dark)`) or `files` (globs). Default: one unnamed theme read from `:root`. Every theme the product ships MUST be listed, and every pair is tested in every theme. |
| `pairs` | array | yes | Each: `fg`, `bg` (token addresses or hex colours) and `kind`: `text`, `large-text` or `mark`. A `large-text` pair also needs `size`: `px` (the smallest size the pair is used at) and `weight` (FP-A11Y-02). Every pair in use in the scope is listed (FP-A11Y-20). |
| `roles` | array | no | Each: `match` (a token address or glob) and `role`: `icon`, `type`, `breakpoint`, `target`, `drawn` or `micro` (FP-MODE-10). Used in every mode. |
| `controls` | array of strings | no | Class selectors of interactive elements that are not interactive by their element name or ARIA role, for example `.btn` or `.nav-item` (FP-SNAP-11). |
| `snap.source` | array of globs | yes in Snap | The files that hold the host's tokens as they are now, after snapping. The original values are kept in the Snap table, which is the record of what changed. |
| `snap.table` | string | no | Path of the published Snap table. Default `fp-snap.md`. |
| `snap.overrides` | array | no | Each: `token`, `to` (a rung of the declared unit, or a value of the radius set) and `reason`. |
| `exceptions` | array | no | Each: `value`, `where`, `reason`, `rule`, `status`; plus `source` when the reason is `data`. `reason` is `floor`, `host-token`, `data`, `content`, `platform` or `snap-drift`. `status` is `accepted` or `pending`. `where` is a file and line, a selector, or a token address; a token address covers every use of that token. |

**Token addresses.** A token is addressed either by its CSS custom property name, starting with `--` (`--color-ink`), or by its path in a tokens file, with dots (`color.ink`). A glob uses `*` only, which matches any run of characters (`--icon-*`, `icon.*`). A file glob uses `*` and `**` as in common build tools.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `mode.config-schema` · **Evidence:** convention (protocol choice)


```json
{
  "fp": "1.0.0-rc.5",
  "mode": "snap",
  "level": "FP-1",
  "platform": "web",
  "unit": 1,
  "pointer": "both",
  "has": { "motion": true, "timeLimits": false, "controls": true, "charts": false, "generatedArt": false, "states": false },
  "source": ["src/**/*.css"],
  "themes": [
    { "name": "light", "selector": ":root" },
    { "name": "dark", "selector": "[data-theme=\"dark\"]" }
  ],
  "pairs": [
    { "fg": "--color-ink", "bg": "--color-ground", "kind": "text" },
    { "fg": "--color-control", "bg": "--color-ground", "kind": "mark" }
  ],
  "roles": [
    { "match": "--icon-*", "role": "icon" },
    { "match": "--control-height-*", "role": "target" },
    { "match": "--font-size-*", "role": "type" }
  ],
  "snap": {
    "source": ["tokens/**/*.css"],
    "overrides": [
      { "token": "--space-16", "to": 21, "reason": "Card padding must stay larger than the 12 gap." }
    ]
  },
  "exceptions": [
    { "value": "44px", "where": "src/vendor/datepicker.css:18", "reason": "host-token", "rule": "FP-SPACE-01", "status": "accepted" }
  ]
}
```

### FP-MODE-08 · One mode per scope

A scope MUST have exactly one mode. A product MAY hold several scopes with different modes, each with its own configuration and its own claim.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `mode.single` · **Evidence:** convention (protocol choice)


### FP-MODE-10 · Roles are declared

`roles` in the configuration gives a token a role, in every mode. A role is never inferred from a value: a bare length has no role. The roles are:

- `icon`: the width and height of an icon. Not tested and never snapped. The token MUST be used only for icons.
- `type`: a type size. Tested by the type rules at FP-2, never as a length.
- `breakpoint`: a breakpoint. Not tested in Overlay and Snap.
- `target`: the size of a control's hit area. It is at least the ladder target and never shrinks (FP-CTRL-01, FP-SNAP-04).
- `drawn`: the drawn height of a control whose hit area is larger than it looks. Left unchanged and never shrunk; the hit area is checked by FP-CTRL-02 and FP-CTRL-04.
- `micro`: the micro type size (FP-TYPE-05).

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `mode.roles` · **Evidence:** convention (protocol choice)


### FP-MODE-09 · The highest level each mode can claim

Native MAY claim FP-1 or FP-2. Snap and Overlay claim FP-1 by default, and at FP-1 the host's type is not tested at all. Snap or Overlay MAY claim FP-2 only when, inside the scope, the host's type sizes, body size and line heights are replaced by the protocol's (FP-TYPE-01 to FP-TYPE-09, FP-TYPE-12) and the layout rules that apply to every mode are met (FP-LAYOUT-01, FP-LAYOUT-02, FP-LAYOUT-07). A system whose body text stays below the body anchor (FP-A11Y-07) cannot claim FP-2 in any mode.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `mode.level-ceiling` · **Evidence:** convention (protocol choice)


| Rule group | Overlay FP-1 | Snap FP-1 | Any mode at FP-2 | Native only |
|---|---|---|---|---|
| Guard rules that apply | yes | yes | yes | — |
| Space and radius (FP-SPACE, FP-RADIUS) | in scope, by resolved value | all snapped tokens and in-scope literals | yes | — |
| Type scale, body anchor, leading, measure (FP-TYPE, FP-A11Y-07, FP-A11Y-08) | not tested | not tested | yes: host type is replaced | — |
| φ split and equal columns (FP-LAYOUT-01, FP-LAYOUT-02) | not tested | not tested | yes | — |
| Container widths and breakpoints (FP-LAYOUT-05, FP-LAYOUT-06) | — | — | — | yes |
| Tokens in the protocol's format (FP-TOKEN) | protocol token files only | protocol token files only | protocol token files only | protocol token files only |

## Overlay

Overlay adds the ladder beside the host's own tokens. Nothing the host has is changed.

### FP-MODE-03 · Overlay keeps the host system

In Overlay the protocol's tokens (`--fp-*`) MUST be added beside the host's tokens. The host keeps its spacing tokens, radius tokens, column grid, breakpoints, type, control sizes, elevation and z-index. A host token MUST NOT be changed without the user's consent (FP-AGENT-03).

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: overlay · **Test:** self-report, `mode.overlay-host-intact` · **Evidence:** convention (protocol choice)


### FP-MODE-04 · Overlay tests resolved values in the scope

Inside the declared scope, every checked declaration (the list is in [03-conformance.md](03-conformance.md)) MUST resolve, after following `var()` references, to a value that is on the ladder, in its fixed set (FP-MATH-07), intrinsic, derived (FP-SPACE-04) or a declared exception. It does not matter whether the value arrives through a protocol token, a host token or a literal: what is tested is the resolved value. A host token whose value is not a rung fails inside the scope unless it has a role that exempts it (FP-MODE-10) or is declared as an exception with the reason `host-token`. This rule sets what is read and how it is resolved; each off-ladder value is reported once, under the rule that owns its kind (FP-SPACE-01 for layout lengths, FP-RADIUS-01 for radii, FP-MATH-07 for strokes), never also under this one.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: overlay · **Test:** machine, `mode.overlay-resolved` · **Evidence:** convention (protocol choice)


### FP-MODE-05 · Overlay coverage and exceptions are reported

An Overlay report MUST state coverage: the checked values inside the scope, divided by the checked values in the whole `source`. The numerator counts values in files matched by `scope` only; the denominator counts values in every file matched by `source`, the scope's files included. Checked values are counted one way only: every checked declaration is expanded to its longhands (`padding: 12px 16px` becomes four values, `gap: 8px` two), and each longhand whose value is a length other than 0 or an intrinsic value counts once. The percentage is rounded half-up to a whole number. It MUST also state the number of accepted exceptions inside the scope. Both figures MUST appear in the claim (FP-CONF-04). A scope with no checked declarations MUST NOT be claimed. There is no minimum coverage: the figure is published so that a reader can judge the claim.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: overlay · **Test:** machine, `mode.overlay-coverage` · **Evidence:** convention (protocol choice)


## Snap

Snap maps a host's existing length tokens to the nearest rung, with a published table. It is lossy, and the protocol requires the loss to be shown.

**How Snap is written.** Snap changes the value of the host's token and keeps its name, or points the host's token at a protocol token (`--space-4: var(--fp-space-13)`). Either is allowed. A checker tests the resolved value. A bare literal inside the scope is treated exactly like a token: a checker maps it to its rung and lists it in the mapping under "literals", and the adopter changes it to that rung. A length that is still off the ladder after Snap, token or literal, fails FP-SPACE-01 where it is used, unless it is a declared exception; the mapping row is the suggested fix, not a pass. Snap needs the host's lengths as tokens (CSS custom properties or a tokens file); where a host has none, the adopter writes that file first. `snap.source` names the files that hold the tokens now; the original values live in the Snap table's "original" column, so the pre-snap files need not be kept.

### FP-SNAP-01 · Exemption is by declared role

A host token is exempt from nearest-rung mapping only if `roles` gives it a role (FP-MODE-10). `icon`, `type`, `breakpoint`, `drawn` and `micro` tokens are left unchanged. A `target` token is exempt from nearest-rung mapping and from the drift limit, and is mapped by FP-SNAP-04 instead. Exemption MUST NOT be decided by value: a 16 or 24 token with a spacing role is snapped. Only 0 and the sub-unit values 1 and 2 are exempt by value.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.exempt-by-role` · **Evidence:** convention (protocol choice)


### FP-SNAP-02 · Nearest rung, ties go up

Each non-exempt host length MUST map to the rung nearest to it by absolute distance. A radius maps to the nearest value of the radius set (FP-RADIUS-01), not the ladder. When two values are equally near, the larger MUST be chosen, because more space never shrinks a target or a separation.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.nearest` · **Evidence:** convention (protocol choice)


### FP-SNAP-03 · Drift limit of 25%

Drift is |rung − value| / value. An automatic mapping MUST have a drift of at most 25%. The top rung is the largest value on the ladder at the declared u, container widths included: 1597 at u = 1 and u = 4, 3016 at u = 8. This is the only definition of the limit: there is no separate range rule. A value above the top rung has the top rung as its nearest and is tested the same way. At u = 1 the worst case among whole values from 2 to the top rung is 4 → 5, at exactly 25%. The limit does not apply to `target` tokens (FP-SNAP-04).

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.drift` · **Evidence:** convention (protocol choice)


### FP-SNAP-10 · Values that cannot be snapped

A value whose nearest rung drifts more than 25% MUST NOT be snapped. It is kept unchanged and listed as an exception with the reason `snap-drift` (FP-SPACE-05).

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.unsnappable` · **Evidence:** convention (protocol choice)


### FP-SNAP-04 · Targets never shrink

A token with the `target` role MUST end at a value that is at least the larger of its original value and the ladder target (the smallest rung at or above the target floor, FP-CTRL-01). It SHOULD be the smallest rung that meets this. A host target that already meets it MAY be kept unchanged. Examples at u = 1 with a coarse pointer: 40 → 55; 44 → 55; 64 stays 64, or moves to 89. A target is never reported as drift. Where a host control is drawn at 40 with a 48 hit area, the 40 takes the `drawn` role and stays 40, and the 48 either stays as a host control that meets its platform minimum (FP-CTRL-04) or takes the `target` role and becomes 55.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.target-up` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)


### FP-SNAP-11 · Control heights never shrink

A token or literal that sets the `height`, `min-height`, `block-size` or `min-block-size` of an interactive element (a button, a link, an input, a select, a textarea, or an element with an interactive role) MUST have the `target` or the `drawn` role, and MUST NOT end smaller than it began. Interactive elements are recognised by element name and ARIA role in the selector, and by the class selectors listed in `controls` in the configuration (for example `.btn`); a class is never guessed to be interactive from its name. A checker flags such a declaration that has neither role. Without this, nearest-rung mapping would turn a 44 control into 34.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.control-height` · **Evidence:** convention (protocol choice)


### FP-SNAP-05 · The mapping keeps order

Order is kept within each group, not across groups. The groups are: spacing and size lengths; radii; and `target` tokens. Within one group, if host value a is less than or equal to host value b, the snapped value of a MUST be less than or equal to the snapped value of b, after overrides. A target of 32 that becomes 55 while a spacing value of 36 becomes 34 is not a breach.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.monotonic` · **Evidence:** convention (protocol choice)


### FP-SNAP-06 · Collisions merge by default

When two or more host tokens of the same group (spacing lengths, radii, or `target` tokens) end at one value, they have merged. Targets that are raised to the same ladder target are a merge like any other. A checker computes the mapping and lists every merged group by token name in its report; that is this rule's machine test, and it needs no file from the adopter. The published Snap table (FP-SNAP-08) MUST list the same groups. Where the published table exists at `snap.table`, a checker reads each token's original value from its first four columns (token, role, original, snapped) and computes drift and merges from those originals, so that tokens already snapped in the source are still shown with where they came from. Where the table does not exist, a checker takes the values in `snap.source` as the originals. Publishing the table is a self-report item, and a Snap claim is valid only when the table is published.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.merge-listed` · **Evidence:** convention (protocol choice)


### FP-SNAP-07 · Overrides

Any token of a merged group MAY be moved by hand to another rung, chosen by role, to keep a difference the design needs. Several tokens of one group MAY be moved. Each override MUST have a drift of at most 38.2%, the whole mapping MUST still keep order (FP-SNAP-05), and each override MUST be listed in `snap.overrides` with a reason.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.override` · **Evidence:** convention (protocol choice)


### FP-SNAP-08 · The published table states what breaks

A Snap table MUST be published with the system, at the path in `snap.table` (default `fp-snap.md`, beside `fp.config.json`). It MUST have one row per token and per in-scope literal, with: name, role, original value, snapped value, drift, the group it merged into, and any override reason. It MUST carry a "what breaks" block that covers at least: additive spacing; a 4-unit baseline rhythm; half device pixels at 1.5× density for odd rungs at u = 1; icons of 16 and 24 inside 13 and 21 boxes; hierarchy lost in merges; and visual-regression snapshots. Snapped lengths are recorded in this table and nowhere else: they are not repeated as `FP-CHANGE` lines.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** self-report, `snap.what-breaks` · **Evidence:** convention (protocol choice)


### FP-SNAP-09 · Snapping alone reaches FP-1

Snapping covers space and radius, so a system that only snaps MAY claim FP-1. Type is never snapped. FP-2 is reached as FP-MODE-09 describes.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: snap · **Test:** machine, `snap.level-cap` · **Evidence:** convention (protocol choice)


Worked Snap tables for a 4-based and an 8-based grid, with remedies for what breaks, are in [appendix-snap-tables.md](appendix-snap-tables.md).

## Native

### FP-MODE-06 · Native is full adoption

In Native every length in the source MUST be on the ladder or a declared exception, and no host token layer is assumed. To claim FP-2 a Native system also uses the protocol's type scale, layout rules and container widths.

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: native · **Test:** machine, `mode.native` · **Evidence:** convention (protocol choice)


### FP-MODE-07 · What an adopter may and may not change

An adopter MAY change: colour slot values, typefaces and weights, the words shown for states, icon artwork, and which rung a role uses. An adopter MUST NOT change: the ladder, the type-scale formula, any accessibility floor, or the rule that a state has a form and a word. A system that changes one of these is not conformant and MUST NOT make a claim.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** self-report, `mode.may-change` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
