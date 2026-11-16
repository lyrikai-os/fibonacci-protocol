# 4. Accessibility guardrails

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

These rules are floors. They sit outside the ladder and the type scale, and they always win. Each says when it applies; where it does not, its result is `n/a` (FP-CONF-11).

### FP-A11Y-16 · Floors win over the ladder

Where a ladder value, a type step, a φ proportion or a Snap mapping would break a rule in this section, the rule in this section MUST be followed and the off-ladder value reported as an exception with the reason `floor`.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `a11y.precedence` · **Evidence:** convention (protocol choice)


## Contrast

### FP-A11Y-01 · Contrast floors

Text MUST have a contrast ratio of at least 4.5:1 against its background. Large text MUST have at least 3:1. Control edges, focus rings and meaningful marks MUST have at least 3:1 against adjacent colours. The test runs on every pair declared in `fp.config.json` (`text` 4.5:1; `large-text` and `mark` 3:1), in every declared theme; every theme the product ships MUST be declared. A state colour MUST also pass on its own tint fill. Where a host colour fails, the floor wins: the change is reported (FP-AGENT-08) and, in Overlay, needs the user's consent.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** machine, `a11y.contrast` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-02 · Large text and no rounding

Large text is text of at least 24 px, or at least 18.67 px (14 pt) when bold. A contrast ratio MUST NOT be rounded: 4.499:1 fails.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** machine, `a11y.contrast-exact` · **Evidence:** cited ([source](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))


### FP-A11Y-20 · Every pair in use is declared

The `pairs` list MUST name every combination of text colour and background, and of control edge or meaningful mark and adjacent colour, that the scope uses. A checker cannot find pairs on its own, so a missing pair is a failed self-report, not a pass. Evidence: the list of colour tokens used in the scope, each matched to the pairs it appears in.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `a11y.pairs-complete` · **Evidence:** convention (protocol choice)


## Text

### FP-A11Y-03 · Text can be resized

All text, the host's included, MUST be resizable to 200% without loss of content or function (WCAG 2.2, 1.4.4 Resize Text, level AA). How the host achieves this is the host's choice. The units the protocol's own type uses are set by FP-TYPE-04.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `a11y.text-resize` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-04 · Text spacing can be overridden

No content may be lost when a user sets line height to 1.5 times the font size, paragraph spacing to 2 times, letter spacing to 0.12 times and word spacing to 0.16 times. A box that holds text MUST NOT have a fixed height; use a minimum height. Evidence: a screenshot or measurement with these overrides applied. (WCAG 2.2, 1.4.12 Text Spacing, level AA.)

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `a11y.text-spacing` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-07 · Body anchors

Protocol-owned body text MUST be at least the platform default: 16 px on the web (written as `1rem`), 17 pt on iOS at the default Dynamic Type size, 16 sp on Android, 13 pt on macOS. φ MUST NOT be used to choose the body size. These anchors are the platforms' own defaults; treating them as a minimum is this protocol's choice. A host in Overlay or Snap at FP-1 keeps its own body size; a system whose body stays below the anchor cannot claim FP-2 (FP-MODE-09).

- **Level:** FP-2 · **Status:** normative · **Applies when:** protocol-owned type · **Test:** machine, `a11y.body-anchor` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography)


### FP-A11Y-08 · Smallest text

No protocol-owned text may be smaller than 11 px, 11 pt or 11 sp, except on macOS where the floor is 10 pt. Text at this floor ("micro", FP-TYPE-05) MUST NOT be used for a control label or for content needed to operate the interface. Apple and Material publish 11 as their smallest sizes; applying it to the web is this protocol's choice.

- **Level:** FP-2 · **Status:** normative · **Applies when:** protocol-owned type · **Test:** machine, `a11y.min-text` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography)


## Targets

### FP-A11Y-05 · Target size minimums

A pointer target MUST be at least 24 by 24 CSS px on the web (WCAG 2.2, 2.5.8, level AA, with its spacing exception). On iOS it MUST be at least 44 by 44 pt, on Android 48 by 48 dp and on macOS 28 by 28 pt, the platforms' published values. No scale, ratio or Snap mapping may produce a target under these. The larger values the protocol asks of its own controls are in FP-CTRL-01.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `a11y.target-size` · **Evidence:** cited ([source](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html))


### FP-A11Y-06 · Unknown or mixed pointers are treated as coarse

When `pointer` is `both` or not declared, the coarse-pointer target MUST be the base. The fine-pointer value MAY be applied only inside `@media (pointer: fine) and (not (any-pointer: coarse))` or the platform's equivalent, or when the configuration declares `pointer: fine` with a reason.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `a11y.pointer` · **Evidence:** convention (protocol choice)


## Motion and time

### FP-A11Y-09 · Pause, stop or hide

Any motion, blinking or scrolling that starts on its own, runs for more than 5 seconds in total and is shown beside other content MUST either stop by itself within 5 seconds or have a visible control to pause, stop or hide it. The 5 seconds are total running time, not the period of one loop: an endless 2-second pulse is over the limit. One page-level control that pauses all motion satisfies this rule. (WCAG 2.2, 2.2.2 Pause, Stop, Hide, level A.)

- **Level:** Guard · **Status:** normative · **Applies when:** has: motion · **Test:** self-report, `a11y.pause` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-10 · Reduced motion

When the user asks for reduced motion (`prefers-reduced-motion: reduce`, or the platform's Reduce Motion setting), every loop and every movement (a change of position, size or rotation) MUST stop, with no exception. A change of colour or opacity is not movement; it MAY remain if it lasts at most 89 ms, and longer ones MUST be shortened or removed. Reduced motion MUST NOT shorten a wait such as an undo window (FP-A11Y-18).

- **Level:** Guard · **Status:** normative · **Applies when:** has: motion · **Test:** self-report, `a11y.reduced-motion` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)


### FP-A11Y-11 · Three flashes

Nothing may flash more than three times in any one-second period, unless the flash is below the general flash and red flash thresholds. A slow fade whose luminance changes by less than 10% is not a flash. (WCAG 2.2, 2.3.1, level A.)

- **Level:** Guard · **Status:** normative · **Applies when:** has: motion · **Test:** self-report, `a11y.flash` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold))


### FP-A11Y-18 · Time limits

A notice, a prompt or an option that goes away by itself after a set time is a time limit. For each one, at least one of these MUST hold: the user can turn the limit off; the user can adjust it to at least ten times the default; the user is warned and can extend it, by a simple action, with at least 20 seconds to do so, at least ten times; or the limit is essential. Pausing on hover or focus alone does not meet this. A notice whose action stays available elsewhere after the notice has gone (for example an Undo that remains in a menu or history) sets no time limit on that action. (WCAG 2.2, 2.2.1, level A.)

- **Level:** Guard · **Status:** normative · **Applies when:** has: time limits · **Test:** self-report, `a11y.time-limits` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/#timing-adjustable))


### FP-A11Y-19 · Status messages

A message that reports a result or a state without taking focus (a toast, an "Undo" notice, a saved indicator) MUST be exposed through a role or property, such as `role="status"`, so that assistive technology can present it without a change of focus. (WCAG 2.2, 4.1.3, level AA.)

- **Level:** Guard · **Status:** normative · **Applies when:** platform: web · **Test:** self-report, `a11y.status-messages` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/#status-messages))


## Focus, reflow and state

### FP-A11Y-12 · Focus is always visible

Every keyboard-operable element MUST show a visible focus indicator when it has keyboard focus, and the indicator MUST NOT be removed (WCAG 2.2, 2.4.7). The indicator MUST have at least 3:1 contrast against adjacent colours (1.4.11). The protocol's own ring is a gap of 2 and a ring of 3, in platform units at every u, drawn in the `focus` slot, which MUST NOT be a state colour; a host in Overlay or Snap MAY keep its own indicator if it meets the first two sentences. Evidence: a screenshot of each kind of control with keyboard focus, and the ring and its ground declared as a `mark` pair that passes.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `a11y.focus` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/#focus-visible))


### FP-A11Y-17 · Focus is not hidden

When an element receives keyboard focus it MUST NOT be entirely hidden by content the author placed over it, such as a sticky header, a toast or a popover. (WCAG 2.2, 2.4.11, level AA.)

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `a11y.focus-not-obscured` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum))


### FP-A11Y-13 · Reflow at 320

Content MUST be usable at a width of 320 CSS px without scrolling in two directions. This holds in every mode and whatever breakpoints are in use. Content that needs two dimensions to be understood, such as a data table, a map or a diagram, MAY scroll inside its own region while the page itself does not. Evidence: the page's scroll width measured at a 320 px viewport.

- **Level:** Guard · **Status:** normative · **Applies when:** platform: web · **Test:** self-report, `a11y.reflow` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-14 · State is never shown by colour alone

A state, an action or a distinction MUST NOT be carried by colour alone. Each state has a form and a word, or a form and an accessible name. Evidence: a list of every state, error and selection the scope shows, with the form or word that carries each one besides colour, or a greyscale screenshot in which each can still be told apart.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `a11y.colour-alone` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-A11Y-15 · Forced colours and high contrast

An interface SHOULD stay usable when the platform forces its own colours. Marks SHOULD be inline SVG painted with `currentColor`; information SHOULD NOT live only in a background image or a mask.

- **Level:** Guard · **Status:** informative · **Applies when:** always · **Test:** self-report, `a11y.forced-colours` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
