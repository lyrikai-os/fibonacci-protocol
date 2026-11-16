# 5.5 UI: motion

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

This page is informative in version 1.0. The accessibility rules for motion and time (FP-A11Y-09, FP-A11Y-10, FP-A11Y-11, FP-A11Y-18) are normative now.

### FP-MOTION-01 · Interaction durations

A transition triggered by an interaction SHOULD last 89, 144, 233 or 377 ms. These Fibonacci values sit inside, or 11 ms under, the 100 to 500 ms band that usability guidance gives for interface animation.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** machine, `motion.durations` · **Evidence:** convention (protocol choice); basis: [cited source](https://www.nngroup.com/articles/animation-duration/)


### FP-MOTION-02 · Duration by role

89 ms: feedback (press, toggle). 144 ms: a small element entering or leaving (tooltip, fade). 233 ms: a standard change (menu, panel). 377 ms: a large surface (sheet, dialog, page). An exit SHOULD use the value one below its enter.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** self-report, `motion.roles` · **Evidence:** convention


### FP-MOTION-03 · Ceiling

610 ms MAY be used only for a full-surface move, with a stated reason. Nothing triggered by an interaction SHOULD run longer.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** machine, `motion.ceiling` · **Evidence:** convention (protocol choice); basis: [cited source](https://m1.material.io/motion/duration-easing.html)


### FP-MOTION-04 · Easing

Easing SHOULD be one of: standard `cubic-bezier(0.4, 0, 0.2, 1)`; enter `cubic-bezier(0, 0, 0.2, 1)`; exit `cubic-bezier(0.4, 0, 1, 1)`. Bounce and overshoot SHOULD NOT be used. An easing curve derived from φ has no evidence behind it and is not part of the protocol.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** machine, `motion.easing` · **Evidence:** convention


### FP-MOTION-05 · Ambient loops

The period of an ambient loop SHOULD be 2, 3, 5 or 8 seconds. Every loop is subject to FP-A11Y-09: it stops within 5 seconds of total running time (for example 2 s × 2) or it has a pause control.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** machine, `motion.loops` · **Evidence:** convention (protocol choice)


### FP-MOTION-06 · What a loop may change

A loop SHOULD change opacity, or a ring around a mark, and nothing else. Words SHOULD NOT move or blink. A loop SHOULD NOT cause layout to shift.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: motion · **Test:** self-report, `motion.loop-properties` · **Evidence:** convention


### FP-MOTION-07 · Undo window

A notice that offers Undo and goes away by itself is a time limit and MUST meet FP-A11Y-18; it is a status message and MUST meet FP-A11Y-19. The simplest way to meet both: show the notice with `role="status"`, and keep Undo available somewhere else (a menu, a history list) after the notice has gone, so that the notice sets no limit on the action. The notice itself SHOULD stay for 8 seconds and SHOULD pause while it has pointer hover or keyboard focus. The 8 seconds are a convention.

- **Level:** FP-3 · **Status:** informative · **Applies when:** has: time limits · **Test:** self-report, `motion.grace` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
