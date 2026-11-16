# 8.1 Platforms: web

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

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
| Radius | `--fp-radius-2`, `-3`, `-5`, `-8`, `-13`, `-21`, `--fp-radius-pill` | the value | no |
| Focus | `--fp-focus-gap` (2), `--fp-focus-ring` (3) | the role | no |
| Target | `--fp-target` | the role; the ladder target for the pointer | yes |
| Type | `--fp-type-n1`, `--fp-type-0` … `--fp-type-8`, `--fp-type-micro` | the step k (`n1` is −1) | no |
| Leading | `--fp-leading-body`, `-dense`, `-small`, `-heading`, `-display` | the role | no |
| Duration | `--fp-duration-89`, `-144`, `-233`, `-377` | the value in ms | no |
| Tone | `--fp-tone-1` … `--fp-tone-5` | the power of 1/φ | no |

### FP-PLAT-03 · Web pointer queries

The fine-pointer ladder target (34 at u = 1; see the table in [controls](../05-ui/controls.md)) MUST be written inside `@media (pointer: fine) and (not (any-pointer: coarse))`, unless the configuration declares `pointer: fine`. Outside that query `--fp-target` is the coarse value (55 at u = 1).

- **Level:** Guard · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `plat.web-pointer` · **Evidence:** convention (protocol choice)


### FP-PLAT-04 · Tailwind preset

The Tailwind preset SHOULD expose the ladder as the spacing scale, the radius set, the type scale with its leading, and the duration ladder, under the same names as the tokens.

- **Level:** FP-1 · **Status:** informative · **Applies when:** platform: web · **Test:** machine, `plat.web-tailwind` · **Evidence:** convention (protocol choice)


Web values in one place, at u = 1: body 16 px (1rem); micro 11 px; ladder target 55, or 34 under a fine pointer; target minimum 24 CSS px; reflow at 320 CSS px; containers 610, 987, 1597 as maximum widths.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
