# 8.2 Platforms: iOS and macOS

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

This page is published as guidance in version 1.0; claims for these platforms begin with version 1.1 (FP-CONF-05). The numbers are cited from Apple's Human Interface Guidelines. No Apple text or table is reproduced.

### FP-PLAT-05 · iOS anchors

On iOS and iPadOS: 1 u is 1 pt; body is 17 pt at the default Dynamic Type size; no text under 11 pt; text MUST follow Dynamic Type; a target is at least 44 pt and the ladder target is 55 pt.

- **Level:** Guard · **Status:** normative · **Applies when:** platform: ios · **Test:** self-report, `plat.ios-anchors` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/typography)


### FP-PLAT-06 · macOS anchors

On macOS: 1 u is 1 pt; body is 13 pt; no text under 10 pt; a target is at least 28 pt and the ladder target is 34 pt.

- **Level:** Guard · **Status:** normative · **Applies when:** platform: macos · **Test:** self-report, `plat.macos-anchors` · **Evidence:** convention (protocol choice); basis: [cited source](https://developer.apple.com/design/human-interface-guidelines/accessibility)


### FP-PLAT-07 · SwiftUI mapping

In SwiftUI a type step SHOULD use a system text style where that style's default size equals the step's size, and otherwise a custom size with scaled metrics, so that the size is the step's and still follows Dynamic Type. Space SHOULD use constants named for their rung. Safe areas and system margins belong to the platform and are not ladder values.

- **Level:** FP-2 · **Status:** informative · **Applies when:** platform: ios or macos · **Test:** self-report, `plat.swiftui` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.1 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
