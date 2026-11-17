# 8.3 Platforms: Android

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

This page is published as guidance in version 1.0; claims for this platform begin with version 1.1 (FP-CONF-05).

### FP-PLAT-08 · Android anchors

On Android: 1 u is 1 dp; type is in sp; body is 16 sp (the Material body-large size); no text under 11 sp; a target is at least 48 dp and the ladder target is 55 dp, with at least 8 dp between targets.

- **Level:** Guard · **Status:** normative · **Applies when:** platform: android · **Test:** self-report, `plat.android-anchors` · **Evidence:** convention (protocol choice); basis: [cited source](https://support.google.com/accessibility/android/answer/7101858)


### FP-PLAT-09 · Compose mapping

In Compose the ladder SHOULD be exposed as `Dp` constants named for their rung and the type scale as a `Typography` whose sizes are in sp. A host that follows an 8 dp grid adopts the protocol by Overlay, or by Snap with the result shown in [appendix-snap-tables.md](../appendix-snap-tables.md).

- **Level:** FP-2 · **Status:** informative · **Applies when:** platform: android · **Test:** self-report, `plat.compose` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
