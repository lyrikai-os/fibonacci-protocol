# 5.1 UI: space, radius, lines

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](../index.md)

## Space

### FP-SPACE-01 · Lengths are on the ladder

Every checked layout length in scope (the list is in [03-conformance.md](../03-conformance.md)) MUST resolve to one of: a rung of the declared u; 0; an intrinsic value; a derived value (FP-SPACE-04); or a declared exception (FP-SPACE-05). The test is on the resolved value in every mode, so a host token passes where its value is a rung.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `space.on-ladder` · **Evidence:** convention (protocol choice)


### FP-SPACE-02 · Role table

In Native at u = 1, rungs SHOULD be used for these roles: 1 hairline; 2 bars and strips; 3 rings and tight gaps; 5 inner gaps; 8 gaps between controls and padding inside pills; 13 gaps and small padding; 21 card and figure padding; 34 panel padding; 55 page top and rows; 89 gaps between sections; 144, 233 and 377 box sizes; 610, 987 and 1597 container widths.

- **Level:** FP-1 · **Status:** informative · **Applies when:** mode: native · **Test:** self-report, `space.roles` · **Evidence:** convention


### FP-SPACE-03 · Choose a rung by role

In Native and in Overlay a new value MUST be chosen by its role, not by rounding a remembered number to the nearest rung. Nearest-rung arithmetic belongs to Snap only (FP-SNAP-02).

- **Level:** FP-1 · **Status:** normative · **Applies when:** mode: native or overlay · **Test:** self-report, `space.by-role` · **Evidence:** convention


### FP-SPACE-04 · Derived values

A length that is not a rung is allowed when it is exactly one of two derived patterns, written as a single operation with no chaining: (a) a φ split of a container: the container multiplied by 0.618 or 0.382; (b) a container minus one ladder token. A container is a runtime box (`100%`, `100vw`, `100vh`, `100cqi`, and their logical and dynamic forms) or a container-width token (610, 987 or 1597 platform units). A checker MUST verify that the container operand is one of these: a container width counts only when written as its token (`var(--fp-container-987)`), so a literal `987px` inside `calc()` is not a container and fails. A split of a container-width token is written as a rounded fixed value (FP-MATH-08); a split of a runtime box is left to the browser and is not rounded. Arithmetic on two rungs is not a derived pattern: every whole number is a sum of Fibonacci numbers, so allowing it would allow anything.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `space.derived` · **Evidence:** convention (protocol choice)


### FP-SPACE-05 · Exceptions are declared

Any other off-ladder length MUST be listed in `exceptions` in `fp.config.json` with its value, where it is used, a reason (`floor`, `host-token`, `data`, `content`, `platform` or `snap-drift`), the rule it departs from and a status. An exception with the reason `data` MUST also name its data source. An undeclared off-ladder length, including undeclared arithmetic, fails.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `space.exceptions` · **Evidence:** convention (protocol choice)


## Radius

### FP-RADIUS-01 · Radius set

A corner radius MUST resolve to one of 0, 2, 3, 5, 8, 13 or 21, in platform units at every u, or `pill`, or `round` (50%). Suggested roles: 2 for bars and strips, 8 for small tiles, 13 for cards and figures, 21 for outer frames. In Snap, a host radius maps to the nearest value of this set (FP-SNAP-02).

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `radius.set` · **Evidence:** convention (protocol choice)


### FP-RADIUS-02 · Nested radii

The radius of an inner corner SHOULD equal the outer radius minus the padding between them, with a floor of 0, so the corners stay concentric. When the padding is the value one or two below the outer radius in the set, the result is itself in the set (21 − 8 = 13, 13 − 8 = 5, 13 − 5 = 8, 8 − 5 = 3), because adjacent Fibonacci numbers differ by the one before. A result that is not in the set MUST be rounded down to the next value in the set.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** self-report, `radius.nesting` · **Evidence:** convention


### FP-RADIUS-03 · Pill and round

`pill` is written as the token `--fp-radius-pill` or the literal `9999px`, and nothing else: a checker does not know an element's height, so another large radius (999px, 100px) fails the radius set. `round` is written as `--fp-radius-round` or the literal `50%`, on an element of equal width and height. 0 is written as `0` and has no token. A bar or strip SHOULD use 2, not `pill`.

- **Level:** FP-1 · **Status:** normative · **Applies when:** always · **Test:** machine, `radius.pill-round` · **Evidence:** convention


## Lines, tone and elevation

| Token | Power | Value |
|---|---|---|
| `--fp-tone-1` | φ^−1 | 0.618 |
| `--fp-tone-2` | φ^−2 | 0.382 |
| `--fp-tone-3` | φ^−3 | 0.236 |
| `--fp-tone-4` | φ^−4 | 0.146 |
| `--fp-tone-5` | φ^−5 | 0.090 |

### FP-LINE-01 · Hairlines

A hairline is 1 platform unit wide. Its strength SHOULD be ink at tone-5, tone-4 or tone-3 (0.090, 0.146, 0.236).

- **Level:** FP-1 · **Status:** informative · **Applies when:** always · **Test:** self-report, `line.hairline` · **Evidence:** convention (protocol choice)


### FP-LINE-02 · A hairline is never the only edge of a control

A hairline is decoration. The edge that identifies a control MUST have at least 3:1 contrast against the adjacent colour (WCAG 2.2, 1.4.11). In the protocol's own colour slots that edge is the `control` slot. A hairline at tone-3 is under 2:1 on a plain ground and cannot serve as a control edge. Evidence: the edge and ground declared as a `mark` pair that passes.

- **Level:** Guard · **Status:** normative · **Applies when:** has: controls · **Test:** self-report, `line.control-edge` · **Evidence:** cited ([source](https://www.w3.org/TR/WCAG22/))


### FP-LINE-03 · Tone ladder

Opacity steps SHOULD come from the tone ladder: 0.618, 0.382, 0.236, 0.146 and 0.090. An opacity MUST NOT take text under 4.5:1 or a meaningful mark under 3:1 (FP-A11Y-01).

- **Level:** FP-1 · **Status:** informative · **Applies when:** always · **Test:** self-report, `line.tone` · **Evidence:** convention (protocol choice)


### FP-LINE-04 · Elevation

A Native system SHOULD separate surfaces with hairlines and ground steps rather than shadows, blur or glow. This is a recommendation for the Native profile only: a host in Overlay or Snap keeps its elevation. Where a Native system does write a shadow, its offset and blur SHOULD be rungs. Shadows are not tested in version 1.0.

- **Level:** FP-1 · **Status:** informative · **Applies when:** mode: native · **Test:** self-report, `line.elevation` · **Evidence:** convention

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
