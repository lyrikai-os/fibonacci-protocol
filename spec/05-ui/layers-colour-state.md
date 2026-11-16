# 5.6 UI: layers, colour, state

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

This page is informative in version 1.0. The contrast and colour-alone rules (FP-A11Y-01, FP-A11Y-14) are normative now.

## Layers

### FP-LAYER-01 · Layer roles

A Native system SHOULD name five layers and give them these values: base 1, raised 2, overlay 3, popover 13, toast 21. The values 5 and 8 are left for the adopter. The rule is the order: a higher layer is never in the way of the one below, and never hides a focused element entirely (FP-A11Y-17). The numbers are a convention.

- **Level:** FP-3 · **Status:** informative · **Applies when:** mode: native · **Test:** self-report, `layer.roles` · **Evidence:** convention (protocol choice)


### FP-LAYER-02 · Hosts keep their layers

In Overlay and Snap the host's z-index scale is kept.

- **Level:** FP-3 · **Status:** informative · **Applies when:** mode: overlay or snap · **Test:** self-report, `layer.host` · **Evidence:** convention (protocol choice)


## Colour

### FP-COLOR-01 · Colour is slots

The protocol defines slots, not hues. Per theme: `ground`, `surface`, `raised`, `ink`, `muted`, `control`, `accent`, `on-accent`, `focus`, and one slot per state. The protocol ships no normative colour value.

- **Level:** FP-3 · **Status:** informative · **Applies when:** mode: native · **Test:** machine, `color.slots` · **Evidence:** convention (protocol choice)


### FP-COLOR-02 · Light and dark

A Native system SHOULD provide a light and a dark theme. Each theme MUST pass the contrast floors on its own (FP-A11Y-01).

- **Level:** FP-3 · **Status:** informative · **Applies when:** mode: native · **Test:** machine, `color.themes` · **Evidence:** convention (protocol choice)


### FP-COLOR-03 · Hosts keep their colours

In Overlay and Snap the protocol does not ask for any change to the host's colours beyond what the contrast floors require. Where a host colour fails a floor, the floor wins (FP-A11Y-01) and the change is reported (FP-AGENT-08).

- **Level:** FP-3 · **Status:** informative · **Applies when:** mode: overlay or snap · **Test:** self-report, `color.host` · **Evidence:** convention (protocol choice)


### FP-COLOR-04 · Accent is not a state

The `accent` slot SHOULD NOT be reused as a state colour, and the `focus` slot MUST NOT be a state colour (FP-A11Y-12).

- **Level:** FP-3 · **Status:** informative · **Applies when:** always · **Test:** self-report, `color.accent` · **Evidence:** convention (protocol choice)


## The eight-state grammar

A state is shown by a form first, then a word, then (optionally) a colour.

| Identifier | Meaning | Form |
|---|---|---|
| `open` | available, nothing happening | hollow ring |
| `attention` | waiting on the person | solid disc inside a ring |
| `active` | in progress | solid disc |
| `waiting` | waiting on something else | ring broken into 4 arcs |
| `review` | ready to be checked | horizontal bar |
| `done` | finished and accepted | solid disc with a check, in ink |
| `blocked` | cannot continue | ring with a bar struck through |
| `quiet` | off or dormant | small centred dot, no ring |

### FP-STATE-01 · State identifiers

A system that uses the grammar SHOULD use the eight identifiers in the table. The words shown to people are the adopter's.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** machine, `state.identifiers` · **Evidence:** convention (protocol choice)


### FP-STATE-02 · State forms

Each state SHOULD have the form in the table. Forms differ by silhouette: by what is filled, what is open and how many separate parts there are. They do not differ only by dash length, line weight or opacity, so they can be told apart at small sizes and without colour. No two states may share a form.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** self-report, `state.forms` · **Evidence:** convention (protocol choice)


### FP-STATE-03 · Mark size

A state mark SHOULD be at least 13 with a stroke of 2, in platform units at every u, wherever its form is meant to be read. Under 13, the word MUST be present.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** machine, `state.mark-size` · **Evidence:** convention (protocol choice)


### FP-STATE-04 · Chips grow with their text

A chip SHOULD have a minimum height of 21 in platform units and MUST NOT have a fixed height (FP-A11Y-04).

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** machine, `state.chip-height` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/)


### FP-STATE-05 · Animation keeps the mark readable

An animated state MUST NOT take its mark under 3:1 at any point in the animation. The mark SHOULD stay solid while a ring or halo around it animates.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** self-report, `state.animation-contrast` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.w3.org/TR/WCAG22/)


### FP-STATE-06 · Quiet is muted, not faded

The `quiet` mark SHOULD use the `muted` slot at full opacity, not `ink` at a low opacity.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** self-report, `state.quiet` · **Evidence:** convention (protocol choice)


### FP-STATE-07 · Done has no hue

The `done` state SHOULD be drawn in `ink` with a check and no state colour, so that `done` and `blocked` never differ only as green against red.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** self-report, `state.done` · **Evidence:** convention (protocol choice)


### FP-STATE-08 · Tint

A state chip's fill SHOULD be the state colour at 0.090 and its edge the state colour at 0.618. The state's word MUST still pass 4.5:1 on that fill.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: states · **Test:** machine, `state.tint` · **Evidence:** convention (protocol choice)


### FP-STATE-09 · Disabled

A disabled control SHOULD be shown by a dashed `control` edge and a word that stays readable, not by lowered opacity alone.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: controls · **Test:** self-report, `state.disabled` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.3 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
