# Source: GitHub Primer


Part of the Fibonacci Protocol fixtures, https://www.lyrikai.com (MIT unless this folder says otherwise).
Values in this folder come from the public package `@primer/primitives`, version 11.10.0, licence MIT, Copyright (c) 2018 GitHub Inc. (notice in `LICENSE-primer`). The name is used only to identify the source; no endorsement is implied.

| What | Exact file |
|---|---|
| Base size scale (`--base-size-*`, originals in rem) | https://unpkg.com/@primer/primitives@11.10.0/dist/css/base/size/size.css |
| Functional sizes (`--control-small-size`, `--control-medium-size`, `--control-large-size`, `--control-medium-paddingInline-normal`, `--stack-gap-normal`, `--stack-padding-normal`) | https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/size/size.css |
| Semantic colours, light (`--bgColor-default`, `--bgColor-muted`, `--bgColor-accent-emphasis`, `--fgColor-default`, `--fgColor-muted`, `--fgColor-onEmphasis`, `--borderColor-default`, `--borderColor-emphasis`) | https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/themes/light.css |
| Semantic colours, dark (same names) | https://unpkg.com/@primer/primitives@11.10.0/dist/css/functional/themes/dark.css |
| Licence text | https://unpkg.com/@primer/primitives@11.10.0/LICENSE |

Only the tokens listed here are kept. Colour values are verbatim; Primer scopes themes with `data-color-mode` attributes, and this fixture uses `:root` (light) and `[data-theme="dark"]` instead. Size values are snapped (see `fp-snap.md`, which keeps every original); the original values are the ones in the files above.

`tokens/fp.css` is a copy of `dist/u4/fp.css` of this repository (MIT, https://www.lyrikai.com). The component CSS in `src/` is written for this fixture and is MIT like the rest of the repository.
