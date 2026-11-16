# 5.2 UI: type

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.4 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

Type has its own scale. It is not the length ladder, and type sizes are tested by ratio, not as lengths.

These rules apply at FP-2 and above, in any mode, and to any system that uses the protocol's type tokens. At FP-1 in Overlay or Snap the host's type is not tested (FP-MODE-09).

## The scale

### FP-TYPE-01 · The type scale formula

Every type size MUST equal round(body × φ^(k/2)) for a whole number k, where body is the body size (FP-A11Y-07) and rounding is half-up to a whole px, pt or sp. Each step multiplies by √φ (about 1.272), so every second step is exactly φ apart. The only other accepted values are a declared Fibonacci substitute (FP-TYPE-03) and the micro token (FP-TYPE-05). The idea of a modular type scale is established practice; this ratio and these steps are the protocol's choice.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.scale` · **Evidence:** convention (protocol choice); basis: [cited source](https://alistapart.com/article/more-meaningful-typography/)


Web and Android (body 16):

| Step k | Token | body × φ^(k/2) | Size (px or sp) | With `align: fibonacci` | Use | Leading |
|---|---|---|---|---|---|---|
| -1 | `--fp-type-n1` | 12.58 | 13 | 13 | UI: small text, control label | 1.382 |
| 0 | `--fp-type-0` | 16.00 | 16 | 16 | UI: body | 1.618 running text · 1.5 dense |
| 1 | `--fp-type-1` | 20.35 | 20 | 21 | UI: heading | 1.236 |
| 2 | `--fp-type-2` | 25.89 | 26 | 26 | UI: heading | 1.236 |
| 3 | `--fp-type-3` | 32.93 | 33 | 34 | UI: heading | 1.236 |
| 4 | `--fp-type-4` | 41.89 | 42 | 42 | UI: largest heading · display | 1.146 |
| 5 | `--fp-type-5` | 53.28 | 53 | 55 | not used | 1.146 |
| 6 | `--fp-type-6` | 67.78 | 68 | 68 | display | 1.146 |
| 7 | `--fp-type-7` | 86.21 | 86 | 89 | not used | 1.146 |
| 8 | `--fp-type-8` | 109.67 | 110 | 110 | display | 1.146 |

iOS (body 17 pt at the default Dynamic Type size):

| Step k | Token | body × φ^(k/2) | Size (pt) | With `align: fibonacci` | Use | Leading |
|---|---|---|---|---|---|---|
| -1 | `--fp-type-n1` | 13.36 | 13 | 13 | UI: small text, control label | 1.382 |
| 0 | `--fp-type-0` | 17.00 | 17 | 17 | UI: body | 1.618 running text · 1.5 dense |
| 1 | `--fp-type-1` | 21.62 | 22 | 21 | UI: heading | 1.236 |
| 2 | `--fp-type-2` | 27.51 | 28 | 28 | UI: heading | 1.236 |
| 3 | `--fp-type-3` | 34.99 | 35 | 34 | UI: heading | 1.236 |
| 4 | `--fp-type-4` | 44.51 | 45 | 45 | UI: largest heading · display | 1.146 |
| 5 | `--fp-type-5` | 56.61 | 57 | 55 | not used | 1.146 |
| 6 | `--fp-type-6` | 72.01 | 72 | 72 | display | 1.146 |
| 7 | `--fp-type-7` | 91.60 | 92 | 89 | not used | 1.146 |
| 8 | `--fp-type-8` | 116.52 | 117 | 117 | display | 1.146 |

macOS (body 13 pt):

| Step k | Token | body × φ^(k/2) | Size (pt) | With `align: fibonacci` | Use | Leading |
|---|---|---|---|---|---|---|
| -1 | `--fp-type-n1` | 10.22 | 10 | 10 | UI: small text (too small for a control label) | 1.382 |
| 0 | `--fp-type-0` | 13.00 | 13 | 13 | UI: body | 1.618 running text · 1.5 dense |
| 1 | `--fp-type-1` | 16.54 | 17 | 17 | UI: heading | 1.236 |
| 2 | `--fp-type-2` | 21.03 | 21 | 21 | UI: heading | 1.236 |
| 3 | `--fp-type-3` | 26.76 | 27 | 27 | UI: heading | 1.236 |
| 4 | `--fp-type-4` | 34.03 | 34 | 34 | UI: largest heading · display | 1.146 |
| 5 | `--fp-type-5` | 43.29 | 43 | 43 | not used | 1.146 |
| 6 | `--fp-type-6` | 55.07 | 55 | 55 | display | 1.146 |
| 7 | `--fp-type-7` | 70.05 | 70 | 70 | not used | 1.146 |
| 8 | `--fp-type-8` | 89.10 | 89 | 89 | display | 1.146 |

### FP-TYPE-02 · Step ranges

Interface text MUST use steps −1 to 4. Display text (large, short, few words) MUST use even steps from 4 upward, so that display sizes are whole φ steps apart. Odd steps above 4 are not used. A size that is the value of step 5 or 7 (53, 55, 86 or 89 from body 16) fails this rule, `type.step-range`, not the scale rule.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.step-range` · **Evidence:** convention (protocol choice)


### FP-TYPE-03 · Fibonacci substitution

A system MAY set `type.align` to `fibonacci`. Then, at any step where a Fibonacci number lies within 4% of the unrounded value, that number replaces the rounded value (on the web: 21, 34, 55 and 89 in place of 20, 33, 53 and 86). The choice applies to the whole system. The default is `formula`. Under `fibonacci`, the rounded value that was replaced (20 on the web) fails this rule, `type.align`. Under `formula`, a Fibonacci number that is not a formula value (21 on the web) is simply off the scale and fails FP-TYPE-01.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.align` · **Evidence:** convention (protocol choice)


### FP-TYPE-04 · Units

On the web a protocol type size MUST be written in `rem` (size ÷ 16), and the root font size MUST NOT be set in px. On Android it MUST be written in `sp`. On iOS and macOS it MUST be applied so that it follows the user's text size setting.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.units` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)


### FP-TYPE-05 · Micro text

"Micro" is a named floor value, not a step of the scale: 11 px on the web, 11 sp on Android, 11 pt on iOS, 10 pt on macOS. It is accepted only through the `--fp-type-micro` token or a token given the `micro` role; a bare 11 fails the scale test. Micro MUST be used only for non-interactive metadata.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.micro` · **Evidence:** convention (protocol choice)


### FP-TYPE-06 · Control labels

The label of a control MUST be at least the larger of step −1 and 13 (px, pt or sp). On macOS, where step −1 is 10, this means 13.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** self-report, `type.control-label` · **Evidence:** convention (protocol choice)


### FP-TYPE-12 · Replacing a host's type sizes

To reach FP-2, each host type size in the scope is replaced by a step. The role fixes or bounds the step, and the ratio chooses within the bound. Body text (paragraphs, and the default text of the page) becomes step 0, whatever its old size. The value typed into an input becomes step 0. Every other text maps to the usable step (FP-TYPE-02) nearest in ratio (the smallest |ln(size ÷ step)|), a tie going to the larger step, and then: a control label (button, link, tab, field label) is raised to step −1 if it fell below it; a heading keeps the step the ratio gives, which may be step 0 or −1 for a small heading. No text maps below step −1 unless it is non-interactive metadata, which MAY become micro. Host line heights are replaced by the leading of FP-TYPE-07. Only a CSS rule that sets `font-size` is mapped; an element that inherits its size (a table cell, a link inside navigation) follows whatever it inherits from and is not listed. The mapping MUST be listed in the report, one row per host size.

- **Level:** FP-2 · **Status:** normative · **Applies when:** mode: overlay or snap · **Test:** self-report, `type.host-mapping` · **Evidence:** convention (protocol choice)


Nearest step for common host sizes, body 16 (role still comes first):

| Host size (px) | Nearest step k | Formula size | With `align: fibonacci` |
|---|---|---|---|
| 12 | -1 | 13 | 13 |
| 13 | -1 | 13 | 13 |
| 14 | -1 | 13 | 13 |
| 15 | 0 | 16 | 16 |
| 16 | 0 | 16 | 16 |
| 17 | 0 | 16 | 16 |
| 18 | 0 | 16 | 16 |
| 20 | 1 | 20 | 21 |
| 22 | 1 | 20 | 21 |
| 24 | 2 | 26 | 26 |
| 28 | 2 | 26 | 26 |
| 30 | 3 | 33 | 34 |
| 32 | 3 | 33 | 34 |
| 36 | 3 | 33 | 34 |
| 40 | 4 | 42 | 42 |
| 45 | 4 | 42 | 42 |
| 48 | 4 | 42 | 42 |
| 57 | 6 | 68 | 68 |
| 60 | 6 | 68 | 68 |
| 64 | 6 | 68 | 68 |
| 72 | 6 | 68 | 68 |

## Leading

| Text | Token | Ratio | Formula |
|---|---|---|---|
| Running text: paragraphs of prose at body size | `--fp-leading-body` | 1.618 | 1 + φ^−1 |
| Small text, and any single-line label at any interface step | `--fp-leading-small` | 1.382 | 1 + φ^−2 |
| Headings (steps 1 to 3) | `--fp-leading-heading` | 1.236 | 1 + φ^−3 |
| Display (step 4 and up) | `--fp-leading-display` | 1.146 | 1 + φ^−4 |
| Dense body: body-size text in tables, lists and forms | `--fp-leading-dense` | 1.500 | fixed |

### FP-TYPE-07 · Leading by size and role

Line height MUST follow the text's role first and its step second: 1.618 for running text (paragraphs of prose at body size); 1.5 for dense body (body-size text in tables, lists and forms); 1.382 for small text, for any single-line label and for the value in an input, at any interface step; 1.236 for a heading at any step up to 3, including a small heading at step 0 or −1; 1.146 for display text and headings at step 4 and above. 1.618 MUST NOT be used for anything except running text. Platforms tighten leading as size grows, which these values follow; the values themselves, and 1.618 for running text in particular, are this protocol's convention and are looser than any platform default.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.leading` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography)


### FP-TYPE-08 · Line height is unitless

A protocol line height MUST be a unitless ratio, not a fixed length, so that it scales with the text and survives a user's spacing override (FP-A11Y-04).

- **Level:** FP-2 · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `type.leading-unitless` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/)


### FP-TYPE-13 · Line height is declared with the size

Every CSS rule that sets a protocol `font-size` MUST set `line-height` in the same rule. A checker does not compute inheritance, so it tests each `line-height` against the `font-size` beside it; a `font-size` with no `line-height` in its rule fails this rule.

- **Level:** FP-2 · **Status:** normative · **Applies when:** platform: web · **Test:** machine, `type.leading-declared` · **Evidence:** convention (protocol choice)


## Measure

### FP-TYPE-09 · Longest line

A column of running text MUST NOT exceed 80 characters per line (40 for Chinese, Japanese and Korean text). On the web this is written as `max-inline-size` in `ch`. The figure is the one WCAG gives at level AAA (1.4.8); requiring it at this level is the protocol's choice.

- **Level:** FP-2 · **Status:** normative · **Applies when:** always · **Test:** machine, `type.measure-max` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/)


### FP-TYPE-10 · Target measure

Running text SHOULD be set at 45 to 75 characters per line; the default is `max-inline-size: 66ch`. This range is a print convention. On screens the evidence that line length matters much is weak.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `type.measure-target` · **Evidence:** contested ([source](https://webtypography.net/2.1.2))


### FP-TYPE-11 · No typeface is required

The protocol names no typeface, weight, tracking or letter case. These are the adopter's choices. Where an output format requires a font family or a weight for each type token (the list-shaped `design-system-tokens.json`), the protocol's files carry the placeholders `inherit` and `400`. They mean "the adopter's choice" and are not recommendations.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `type.typeface` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.4 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
