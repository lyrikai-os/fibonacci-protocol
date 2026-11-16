# Snap table: Primer base sizes at u = 4

Published with fp.config.json (https://www.lyrikai.com) (FP-SNAP-08). Spec 1.0.0-rc.3. Host values: `@primer/primitives` 11.10.0 (MIT, Copyright (c) 2018 GitHub Inc.); see SOURCE.md. The name is used only to identify the source; no endorsement is implied.

Mode snap, u = 4, level FP-2 (the protocol's type scale replaces host type in scope). Values in px (Primer writes rem; 1rem = 16px).

| Name | Role | Original | Snapped | Drift | Merged group | Override reason |
|---|---|---|---|---|---|---|
| --base-size-2 | spacing | 2 | 2 | 0.0% | - | - |
| --base-size-4 | spacing | 4 | 4 | 0.0% | - | - |
| --base-size-6 | spacing | 6 | kept 6 (exception snap-drift; nearest 8 drifts 33.3%) | n/a | - | - |
| --base-size-8 | spacing | 8 | 8 | 0.0% | - | - |
| --base-size-12 | spacing | 12 | 12 | 0.0% | spacing 12 | - |
| --base-size-16 | spacing | 16 | 20 | 25.0% | spacing 20 | - |
| --base-size-20 | spacing | 20 | 20 | 0.0% | spacing 20 | - |
| --base-size-24 | spacing | 24 | 20 | 16.7% | spacing 20 | - |
| --base-size-28 | spacing | 28 | 32 | 14.3% | spacing 32 | - |
| --base-size-32 | spacing | 32 | 32 | 0.0% | spacing 32 | - |
| --base-size-36 | spacing | 36 | 32 | 11.1% | spacing 32 | - |
| --base-size-40 | spacing | 40 | 32 | 20.0% | spacing 32 | - |
| --base-size-44 | spacing | 44 | 52 | 18.2% | spacing 52 | - |
| --base-size-48 | spacing | 48 | 52 | 8.3% | spacing 52 | - |
| --base-size-64 | spacing | 64 | 52 | 18.8% | spacing 52 | - |
| --base-size-80 | spacing | 80 | 84 | 5.0% | spacing 84 | - |
| --base-size-96 | spacing | 96 | 84 | 12.5% | spacing 84 | - |
| --base-size-112 | spacing | 112 | 136 | 21.4% | spacing 136 | - |
| --base-size-128 | spacing | 128 | 136 | 6.3% | spacing 136 | - |
| --control-small-size | target | 28 | 52 | n/a (target) | target 52 | - |
| --control-medium-size | target | 32 | 52 | n/a (target) | target 52 | - |
| --control-large-size | target | 40 | 52 | n/a (target) | target 52 | - |
| --control-medium-paddingInline-normal | spacing | 12 | 12 | 0.0% | spacing 12 | - |
| --stack-gap-normal | spacing | 16 | 20 | 25.0% | spacing 20 | - |
| --stack-padding-normal | spacing | 16 | 20 | 25.0% | spacing 20 | - |

## Literals

| Where | Original | Snapped | Note |
|---|---|---|---|
| src/components.css .card border | 1px | 1px | fixed fine detail (FP-MATH-07), not snapped |
| src/components.css .btn border | 1px | 1px | fixed fine detail (FP-MATH-07), not snapped |

## Merged groups (FP-SNAP-06)

- spacing 12: --base-size-12, --control-medium-paddingInline-normal
- spacing 20: --base-size-16, --base-size-20, --base-size-24, --stack-gap-normal, --stack-padding-normal
- spacing 32: --base-size-28, --base-size-32, --base-size-36, --base-size-40
- spacing 52: --base-size-44, --base-size-48, --base-size-64
- spacing 84: --base-size-80, --base-size-96
- spacing 136: --base-size-112, --base-size-128
- target 52: --control-small-size, --control-medium-size, --control-large-size

No overrides.

## What breaks

| What breaks | Why here | What to do |
|---|---|---|
| Additive spacing | Primer 8 + 8 = 16 is a token; at u = 4 the 16 token is 20 and 8 + 8 is not 20. | Use `gap` for exact sums, or the next rung (8 + 12 = 20). |
| 4-unit baseline rhythm | u = 4 keeps rungs at multiples of 4, so a 4 baseline holds for spacing; type leading is unitless and does not sit on it. | Let unitless leading set text rhythm. |
| Half device pixels at 1.5x | u = 4 rungs are even, so this profile avoids the odd-rung issue of u = 1. | None needed. |
| Icons of 16 and 24 in 13 and 21 boxes | Primer icons are 16 and 24. This fixture uses no icons; at u = 4 the 20 rung is the box for a 16 icon. | Keep icon tokens exempt by role and centre the icon in a 20 or 32 box. |
| Hierarchy lost in merges | 44, 48, 64 merge into 52; 80, 96 into 84; 112, 128 into 136; 28 to 40 into 32; 16, 20, 24 into 20. | Add overrides (FP-SNAP-07) where a difference matters, or keep that area in Overlay. |
| Visual-regression snapshots | Every moved token changes baselines. | Re-baseline once, in the same change as this table. |
