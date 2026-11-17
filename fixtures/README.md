# Fixtures

Three sample systems, one per integration mode, that show an existing design system adopting **Lyrikai: Fibonacci Protocol for UI/UX Design Agents** ([www.lyrikai.com](https://www.lyrikai.com)), plus seeded-fault copies that the checker must catch. Spec 1.0.0.

| Folder | Mode and level | What it shows |
|---|---|---|
| [primer-snap/](primer-snap/) | Snap, FP-2, u = 4 | GitHub Primer's base size scale snapped to the u = 4 ladder (its recommended profile for a 4-based grid), with the published Snap table `fp-snap.md`, a target role for control sizes, one declared `snap-drift` exception (the 6 token), and the protocol's type scale replacing host type in the scope. |
| [material-overlay/](material-overlay/) | Overlay, FP-1, u = 1 | Material 3 tokens left untouched in `host/`; one scoped component (`src/fp-card/`) takes every length from `--fp-*` tokens (`tokens/fp.css`, a copy of `dist/fp.css`) and keeps Material's colours and type. Coverage and exceptions are in the claim. |
| [native/](native/) | Native, FP-2, u = 1 | A system built on the ladder and the type scale from the start: ladder lengths, type steps, leading, a declared φ split, a 55 hit area around a 34 drawn button, a loop with a pause control and a reduced-motion stop. Derived from an in-house template, see the Lineage note in [spec/index.md](../spec/index.md); every correction is in [native/DERIVED.md](native/DERIVED.md). |

Each fixture has `fp.config.json`, the CSS it names, a `SOURCE.md` or `DERIVED.md`, and a `faults/` folder.

## Faults

Each folder in `faults/` is a full copy of its fixture with exactly one change, and an `expected.json` that names the rule IDs that must fail (`mustFail`):

| Fixture | Faults |
|---|---|
| primer-snap | `unsnapped-padding-16` (FP-SPACE-01), `control-height-no-role` (FP-SNAP-11), `unsnappable-literal-6` (FP-SNAP-10), `failing-contrast` (FP-A11Y-01), `motion-false-with-transition` (FP-CONF-11), `undeclared-drift` (FP-SNAP-10) |
| material-overlay | `unsnapped-padding-16` (FP-SPACE-01), `host-token-off-ladder` (FP-SPACE-01), `failing-contrast` (FP-A11Y-01), `motion-false-with-transition` (FP-CONF-11), `pill-radius-999` (FP-RADIUS-01) |
| native | `evidence-answered-fail` (FP-CONF-06), `unsnapped-padding-16` (FP-SPACE-01, FP-MODE-06), `off-scale-font-size` (FP-TYPE-01), `body-below-anchor` (FP-A11Y-07), `failing-contrast` (FP-A11Y-01), `motion-false-with-animation` (FP-CONF-11) |


## Evidence

Each fixture has an `fp-evidence.json` (FP-CONF-06) with the self-report answers the author actually checked: reflow, 200% text, text spacing, targets and focus were measured in a headless browser on `preview.html` (`native/index.html` for Native); other items are read from the CSS and say so. Items not assessed are left out, so each fixture is a **candidate** and `expected-open.json` lists the open items and why: primer-snap FP-TYPE-12, material-overlay and native FP-RADIUS-02. `run.test.mjs` accepts a pass only if `claimState` is `valid`, or `candidate` with exactly those open items.

## Run

From the repository root (Node 20, no packages):

```sh
node tools/fp-check/fp-check.mjs fixtures/primer-snap
node tools/fp-check/fp-check.mjs fixtures/material-overlay
node tools/fp-check/fp-check.mjs fixtures/native
node tools/fp-check/fp-check.mjs fixtures/native/faults/failing-contrast --json
node --test fixtures/run.test.mjs
```

A fixture exits 0 with a claim ending `self-assessed`; a fault exits 1 and the rule IDs in its `expected.json` have the result `fail` in the `--json` report.

## Licences

- This folder and its contents are MIT, like the rest of the repository, except where a folder says otherwise: see the root [LICENSE](../LICENSE).
- [primer-snap/](primer-snap/) holds values from `@primer/primitives` 11.10.0, MIT, Copyright (c) 2018 GitHub Inc. (`primer-snap/LICENSE-primer`).
- [material-overlay/](material-overlay/) holds values from `@material/web` 2.5.0 and is **Apache-2.0**, separately licensed from the repository's MIT (`material-overlay/NOTICE`, `material-overlay/LICENSE-material`).
- Primer and Material names identify sources only; no endorsement is implied.
