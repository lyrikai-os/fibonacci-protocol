# 8.4 Platforms: print, slides, email

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

This page is informative. Print, slides and email are not `platform` values and cannot be named in a claim. The numbers here are protocol choices and arithmetic, not findings.

### FP-PLAT-10 · Print

In print, 1 u is 1 pt (0.3528 mm). φ SHOULD set the type area and the margins, not the sheet: standard sheets have their own ratios (the A series is 1 : 1.414; US Letter is 1 : 1.294) and are not changed.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `plat.print` · **Evidence:** convention (protocol choice)


### FP-PLAT-11 · Slides

A 16 : 9 slide has a ratio of 1.778, which is not φ. φ SHOULD set the split of the content: on a 1920-wide slide, 1187 and 733. Margins and gaps SHOULD be rungs.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `plat.slides` · **Evidence:** convention (protocol choice)


### FP-PLAT-12 · Email

Email SHOULD use one column about 610 wide, body text of 16 px, targets of 55 and no looping animation. Sizes are written in px, because many mail clients do not support rem or custom properties; this is why email is outside the web rules and cannot be claimed.

- **Level:** FP-2 · **Status:** informative · **Applies when:** always · **Test:** self-report, `plat.email` · **Evidence:** convention (protocol choice)

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
