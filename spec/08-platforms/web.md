# 8.1 Platforms: web

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.4 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

### FP-PLAT-01 · Web units

On the web, 1 u is 1 CSS px. Protocol space tokens are written in px by default and MAY be written in rem (value ÷ 16). Protocol type is written in rem with 16 px equal to 1rem (FP-TYPE-04).

- **Level:** FP-1 · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `plat.web-units` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)


### FP-PLAT-02 · Web custom properties

The protocol's CSS custom properties MUST use the `--fp-` prefix and these names. A host's own properties are never renamed.

- **Level:** FP-1 · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `plat.web-tokens` · **Evidence:** convention (protocol choice)


| Group | Names | Named for | Scales with u |
|---|---|---|---|
| Space | `--fp-space-1` … `--fp-space-377` | the Fibonacci number F; the value is F × u | yes |
| Container | `--fp-container-610`, `-987`, `-1597` | the value | no |
| Radius | `--fp-radius-2`, `-3`, `-5`, `-8`, `-13`, `-21`, `--fp-radius-pill` (9999px), `--fp-radius-round` (50%); 0 has no token | the value | no |
| Line | `--fp-line-hairline` (1), `--fp-line-stroke-2`, `--fp-line-stroke-3` | the role and value | no |
| Focus | `--fp-focus-gap` (2), `--fp-focus-ring` (3) | the role | no |
| Target | `--fp-target` (the ladder target for the current pointer: coarse by default, fine inside the pointer query), `--fp-target-coarse` (always the coarse ladder target) | the role | yes |
| Target floor | `--fp-target-floor-coarse` (44), `--fp-target-floor-fine` (24) | the role | no |
| Type | `--fp-type-n1`, `--fp-type-0` … `--fp-type-8`, `--fp-type-micro` | the step k (`n1` is −1) | no |
| Leading | `--fp-leading-body`, `-dense`, `-small`, `-heading`, `-display` | the role | no |
| Duration | `--fp-duration-89`, `-144`, `-233`, `-377` | the value in ms | no |
| Easing | `--fp-easing-standard`, `--fp-easing-enter`, `--fp-easing-exit` | the role | no |
| Layer | `--fp-layer-base` (1), `-raised` (2), `-overlay` (3), `-popover` (13), `-toast` (21) | the role | no |
| Tone | `--fp-tone-1` … `--fp-tone-5` | the power of 1/φ | no |
| Split | `--fp-split-major` (`1.618fr`), `--fp-split-minor` (`1fr`) | the role; grid tracks, usable directly in `grid-template-columns` | no |
| Constants | `--fp-math-phi`, `--fp-math-phi-inverse`, `--fp-math-phi-inverse-squared`, `--fp-math-phi-root`, `--fp-math-golden-angle-degrees`, `--fp-math-golden-angle-radians`, `--fp-math-hash-constant` | the constant (FP-MATH-01) | no |

The type tokens for steps 5 and 7 exist so that the list is complete; FP-TYPE-02 does not allow them in use. Two marker properties declare layout intent to a checker and carry no value of their own: `--fp-layout: phi-split` (FP-LAYOUT-01) and `--fp-layout: container` (FP-LAYOUT-05).

### FP-PLAT-03 · Web pointer queries

The fine-pointer ladder target (34 at u = 1; see the table in [controls](../05-ui/controls.md)) MUST be written inside `@media (pointer: fine) and (not (any-pointer: coarse))`, unless the configuration declares `pointer: fine`. Outside that query `--fp-target` is the coarse value (55 at u = 1).

- **Level:** Guard · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `plat.web-pointer` · **Evidence:** convention (protocol choice)


### FP-PLAT-04 · Tailwind preset

The Tailwind preset SHOULD expose the ladder as the spacing scale, the radius set, the type scale with its leading, and the duration ladder, under the same names as the tokens.

- **Level:** FP-1 · **Status:** informative · **Applies when:** platform: web · **Test:** machine, `plat.web-tailwind` · **Evidence:** convention (protocol choice)


Web values in one place, at u = 1: body 16 px (1rem); micro 11 px; ladder target 55, or 34 under a fine pointer; target minimum 24 CSS px; reflow at 320 CSS px; containers 610, 987, 1597 as maximum widths.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.4 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
