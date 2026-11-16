# Source: Material Web


Part of the Fibonacci Protocol fixtures, https://www.lyrikai.com (MIT unless this folder says otherwise).

Values in `host/md-sys.css` come from the public package `@material/web`, version 2.5.0, licence Apache-2.0, Copyright 2023 Google LLC (notice in `LICENSE-material` and `NOTICE`). The name is used only to identify the source; no endorsement is implied.

| What | Exact file |
|---|---|
| Colour roles (scheme mapping to palette entries) | https://unpkg.com/@material/web@2.5.0/tokens/versions/v0_192/_md-sys-color.scss |
| Palette values the roles point to (`primary40`, `neutral98`, `neutral6` and so on) | https://unpkg.com/@material/web@2.5.0/tokens/versions/v0_192/_md-ref-palette.scss |
| Type scale (size and line height of body-large, body-medium, label-large, title-medium, headline-small) | https://unpkg.com/@material/web@2.5.0/tokens/versions/v0_192/_md-sys-typescale.scss |
| Shape (corner radii) | https://unpkg.com/@material/web@2.5.0/tokens/versions/v0_192/_md-sys-shape.scss |
| Licence text | https://unpkg.com/@material/web@2.5.0/LICENSE |

The source files are SCSS maps. The hex values in `host/md-sys.css` are the palette entries that the role points to in the light scheme (`:root`) and the dark scheme (`[data-theme="dark"]`); the custom property names follow Material Web's `--md-sys-*` convention. `tokens/fp.css` is a copy of `dist/fp.css` of this repository (MIT). `host/host-components.css` and `src/fp-card/card.css` are written for this fixture.
