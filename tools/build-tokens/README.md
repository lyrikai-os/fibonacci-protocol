# build-tokens

Part of **Lyrikai: Fibonacci Protocol for UI/UX Design Agents** - https://www.lyrikai.com (MIT License).

A zero-dependency Node 20+ generator. It reads the token master, `tokens/fp.tokens.json` (W3C Design Tokens Format Module 2025.10), resolves aliases and writes four outputs.

## Usage

```sh
node tools/build-tokens/build.mjs                # u = 1 into dist/
node tools/build-tokens/build.mjs --unit 4       # grid-locked profile into dist/u4/
node tools/build-tokens/build.mjs --all          # u = 1, 4 and 8 (npm run build:tokens)
node tools/build-tokens/build.mjs --tokens FILE --out DIR
npm test                                         # node --test tools/
```

| Output | What |
|---|---|
| `fp.css` | `:root` custom properties named `--fp-*` (FP-PLAT-02). Type is in rem; the fine-pointer `--fp-target` sits inside the pointer query (FP-PLAT-03). |
| `_fp.scss` | One variable per token (`$fp-space-13`) and a map, `$fp-tokens`. |
| `fp.tailwind.cjs` | A Tailwind preset: spacing, borderRadius, fontSize with lineHeight, transitionDuration, zIndex, maxWidth. |
| `design-system-tokens.json` | The list-shaped format for design-system tools: families of `{name, value, usage}`, and type groups of styles. |

## Profiles

`--unit 4` and `--unit 8` write the grid-locked profiles (FP-MATH-06) to `dist/u4/` and `dist/u8/`. Only layout lengths scale with u (FP-MATH-07): the space ladder, and the ladder targets, which become the smallest rung at or above the target floor. Hairline and stroke widths, radius, focus, containers and type are unchanged, and a pinned floor is never lowered (FP-TOKEN-06).

## Notes

- The master stores px at u = 1 (FP-TOKEN-04). The generator writes type in rem (FP-TOKEN-09).
- The protocol ships no colour values (FP-COLOR-01), so the colour family lists the `light` and `dark` themes and no tokens.
- The generators do not depend on Style Dictionary (FP-TOKEN-10).
- `dist/` is committed output. A test fails if it is stale: run `npm run build:tokens`.
- Snapshots are in `test/snapshots/`. After an intended change, run `UPDATE_SNAPSHOTS=1 npm test`.

Licensed under the MIT License. Homepage: https://www.lyrikai.com
