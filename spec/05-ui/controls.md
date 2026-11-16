# 5.4 UI: controls and targets

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

Two numbers are in play. The **target floor** is the least a target may be. The **ladder target** is the smallest rung at or above that floor: it is what the protocol's own controls use.

| Platform and pointer | Target floor | Ladder target at u = 1 | u = 4 | u = 8 |
|---|---|---|---|---|
| Web, coarse or unknown pointer | 44 CSS px (protocol choice; the WCAG AA minimum is 24) | 55 | 52 | 64 |
| Web, fine pointer only | 24 CSS px (WCAG AA minimum) | 34 | 32 | 24 |
| iOS and iPadOS | 44 pt | 55 | 52 | 64 |
| Android | 48 dp | 55 | 52 | 64 |
| macOS | 28 pt | 34 | 32 | 40 |

On the web the accessibility minimum is 24 CSS px (FP-A11Y-05). For coarse and unknown pointers the protocol sets its own floor at 44 CSS px, the figure WCAG gives as its enhanced target size (2.5.5, level AAA) and the same as the iOS value. That is a protocol choice, not a WCAG AA requirement.

### FP-CTRL-01 · Protocol targets are at least the ladder target

The target size of a protocol-owned control (any control in Native; any `target` token in Snap) MUST be at least the ladder target for its platform and pointer: at u = 1, 55 for touch and for any coarse or unknown pointer, and 34 where the pointer is fine. A larger rung MAY be used. A host control that is not protocol-owned is governed by FP-CTRL-04.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `ctrl.target-rung` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/accessibility)


### FP-CTRL-02 · Drawn height and hit area are separate

The drawn height of a control MAY be smaller than its target size, provided the hit area reaches the target size. For example a control drawn 34 high carries a hit area 55 high on touch. Hit areas of neighbouring targets MUST NOT overlap. Neighbours are targets in the same layer; a control in a layer above (a toast, a popover) is not a neighbour of what it covers, and is governed by FP-A11Y-17.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `ctrl.hit-area` · **Evidence:** convention (protocol choice)


### FP-CTRL-03 · Small interactive parts

A mark, glyph or chip that acts as a control MUST have the full hit area of FP-CTRL-01, however small it is drawn.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `ctrl.small-parts` · **Evidence:** convention (protocol choice)


### FP-CTRL-04 · Host controls keep their size if they meet the floor

A host control that is not given the `target` role is not tested against the ladder. It MUST meet the target minimum of its platform (FP-A11Y-05). A host target of 44 or 48 therefore passes as it is; it does not have to become 55.

- **Level:** Guard · **Status:** normative · **Applies when:** mode: overlay or snap · **Test:** self-report, `ctrl.host` · **Evidence:** convention (protocol choice)


### FP-CTRL-05 · Space between targets

Adjacent hit areas SHOULD be separated by at least 8 platform units.

- **Level:** Guard · **Status:** informative · **Applies when:** has: controls · **Test:** self-report, `ctrl.spacing` · **Evidence:** convention (protocol choice); basis: [cited source](https://support.google.com/accessibility/android/answer/7101858)


## Dense interfaces

A table of 34-high rows with a control in each row is the common hard case.

- **Fine pointer.** Under `(pointer: fine) and (not (any-pointer: coarse))`, rows and their controls are 34. Nothing else is needed.
- **Coarse or unknown pointer.** Either make the row itself the target (the whole 55-high row acts, with secondary actions in a menu), or keep rows at 55. Do not stack 55-high hit areas inside 34-high rows: they would overlap, which FP-CTRL-02 forbids.
- **Form rows.** A text field is drawn 34 or 55 high; its label is not part of the target. Checkboxes and radios drawn at 21 carry a 55 hit area that includes their label.
- **A control drawn smaller than its hit area.** A button drawn 40 high with a 48 hit area is common. In Overlay it passes as it is (FP-CTRL-04). In Snap, give the 40 the `drawn` role so that it is left alone; the 48 hit area stays, or takes the `target` role and becomes 55.
- **Desktop-only products.** A product that supports no touch or coarse pointer MAY declare `pointer: fine` with a reason in `fp.config.json`. The ladder target is then 34 throughout.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
