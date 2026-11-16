# contrast

Part of **Lyrikai: Fibonacci Protocol for UI/UX Design Agents** - https://www.lyrikai.com (MIT licensed).

A dependency-free Node 20+ WCAG 2.x contrast checker (relative luminance and contrast ratio).

## Usage

```
node contrast.mjs '#fg' '#bg'
node contrast.mjs --pairs pairs.json
```

Single pair prints the ratio to two decimals plus pass/fail for text (4.5), large text (3) and non-text (3). Rounding is for display only: the unrounded ratio is compared, so 4.499 fails 4.5.

`pairs.json` is an array of `{ "fg": "#767676", "bg": "#fff", "kind": "text", "name": "body" }`. Kinds and minimums: `text` 4.5, `large-text` 3, `mark` 3, `control-edge` 3.

## Colour formats

- `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`
- `rgb()` / `rgba()`, comma or space syntax, optional `/ alpha`, percentages
- `oklch(L C H [/ alpha])`: exactly three values; hue in deg, rad, grad or turn; negative chroma is clamped to 0 with a note. Converted OKLab to linear sRGB.
- rgb() with a space separator takes an alpha only after a slash; the comma form takes four values.

Alpha on the foreground is composited over the background in sRGB (as browsers do).

**Translucent backgrounds need a backdrop.** `node contrast.mjs '#000' 'rgba(255,255,255,.5)' --backdrop '#000'`, or a `backdrop` field in a pairs.json entry. Without one the result is `UNVERIFIED` (no pass/fail verdict, exit 1), because the answer depends on what sits behind.

**Out-of-gamut oklch is unverified.** The channels are clipped, not gamut-mapped, so the ratio is only an estimate; the pair is reported `UNVERIFIED (out of gamut)` and exits 1. Pick an in-gamut colour.

**8-bit note.** Colours are not quantised to 8 bits before the maths (a composited or oklch colour keeps fractional channels). A browser paints 8-bit values, so a ratio sitting within about 0.01 of a threshold can differ from what is on screen.

## Exit codes

- `0` pass (single pair: passes text 4.5; pairs: all pass)
- `1` fail or unverified
- `2` usage or parse error

## Tests

`node --test`. Vectors: black on white 21, `#777` on white 4.48 (fails text), `#767676` on white 4.54 (passes), alpha compositing, and oklch checked against hand-derived values (achromatic luminance equals L cubed; CSS red).

MIT License. See https://www.lyrikai.com
