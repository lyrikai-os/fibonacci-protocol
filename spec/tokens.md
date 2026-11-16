# Tokens

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

These rules apply to token files written in the protocol's format: the protocol's own published tokens, and the tokens of any system that chooses to ship such files. No mode requires them. A system that ships none, in Overlay, Snap or Native, has these rules as `n/a`.

### FP-TOKEN-01 · Token format

A protocol token file MUST follow the Design Tokens Format Module 2025.10: a token is an object with `$value`; `$type` is set on the token or inherited from its group; files end in `.tokens.json`.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.dtcg` · **Evidence:** cited ([source](https://www.designtokens.org/tr/2025.10/))


### FP-TOKEN-02 · Types and units

A length is a `dimension` with the value `{ "value": <number>, "unit": "px" }` or `"rem"`. A time is a `duration` with `{ "value": <number>, "unit": "ms" }` or `"s"`. A colour is a colour object with `colorSpace` and `components`. Ratios, opacities and layer values are `number`. Easing is `cubicBezier`.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.types` · **Evidence:** cited ([source](https://www.designtokens.org/tr/2025.10/))


### FP-TOKEN-03 · Names

A token or group name MUST NOT begin with `$` and MUST NOT contain `{`, `}` or `.`. A space token is named for its Fibonacci number, not its value: group `space`, token `13`, is 13 × u (13 px at u = 1, 52 px at u = 4). Radius and container tokens are named for their value, which does not change with u.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.names` · **Evidence:** cited ([source](https://www.designtokens.org/tr/2025.10/))


### FP-TOKEN-04 · The master is in platform units

The master stores every length and every type size as a px number, lengths already multiplied by the declared u, and records u in the file metadata (FP-TOKEN-07). Values in other units are produced by the generators: rem for web type (FP-TOKEN-09), and pt, dp and mm for other platforms, because the format has no such units. A type size of 16 px in the master becomes `1rem` in the generated web output; the two rules do not conflict.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.master-unit` · **Evidence:** convention (protocol choice)


### FP-TOKEN-05 · Themes

In version 1.0, light and dark colour values are two files (`color.light.tokens.json`, `color.dark.tokens.json`).

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.themes` · **Evidence:** convention (protocol choice)


### FP-TOKEN-06 · Rule metadata

Each protocol token MUST carry `$extensions["com.lyrikai.fp"]` with `rule`, the ID of the rule that defines it. It MAY also carry `formula` (for example `"F(7) × u"`), `level`, `status` and `evidence`. A token that holds an accessibility floor (body size, micro, target) MUST carry `"pinnedFloor": true`; a generator or theme MUST NOT emit a smaller value for such a token.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.extensions` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.designtokens.org/tr/2025.10/)


### FP-TOKEN-07 · File metadata

The homepage (`https://www.lyrikai.com`), the spec version and the unit u MUST be recorded in a root-level `$extensions["com.lyrikai.fp"]` object. They MUST NOT be bare root keys, which the format would read as groups.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.root-metadata` · **Evidence:** convention (protocol choice)


### FP-TOKEN-08 · Generated outputs

From the master, the protocol's generators MUST produce: CSS custom properties (FP-PLAT-02), SCSS variables, a Tailwind preset, and a list-shaped `tokens.json` for design-system tools. Each output is covered by a snapshot test. This rule binds the protocol's own repository; an adopter generates only what it uses.

- **Level:** FP-1 · **Status:** normative · **Applies when:** the specification · **Test:** machine, `token.outputs` · **Evidence:** convention (protocol choice)


### FP-TOKEN-09 · Type in rem

Generated web type sizes MUST be in rem (FP-TYPE-04): the generator divides the master's px value by 16. This rule is about generated web outputs (CSS, SCSS, the Tailwind preset), not the master file. Generated space is in px by default and MAY be in rem.

- **Level:** FP-1 · **Status:** normative · **Applies when:** protocol token files · **Test:** machine, `token.type-rem` · **Evidence:** convention (protocol choice)


### FP-TOKEN-10 · Style Dictionary compatibility

The master SHOULD build under Style Dictionary 4 and 5. Known gaps (object-form dimensions, partial 2025.10 support) are listed with the tokens, and the protocol's own generators do not depend on it.

- **Level:** FP-1 · **Status:** informative · **Applies when:** protocol token files · **Test:** machine, `token.style-dictionary` · **Evidence:** convention (protocol choice); basis: [cited source](https://styledictionary.com/info/dtcg/)


```json
{
  "$extensions": { "com.lyrikai.fp": { "homepage": "https://www.lyrikai.com", "spec": "1.0.0-rc.2", "unit": 1 } },
  "space": {
    "$type": "dimension",
    "13": {
      "$value": { "value": 13, "unit": "px" },
      "$description": "Gap, small padding.",
      "$extensions": { "com.lyrikai.fp": { "rule": "FP-MATH-03", "formula": "F(7) × u" } }
    }
  },
  "target": {
    "$type": "dimension",
    "coarse": {
      "$value": { "value": 55, "unit": "px" },
      "$extensions": { "com.lyrikai.fp": { "rule": "FP-CTRL-01", "pinnedFloor": true } }
    }
  }
}
```

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
