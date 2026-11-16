# Contributing

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)*

Thank you for reading the protocol closely. This guide is about changing a rule, because that is where care is needed: the specification is generated, other files are generated from it, and the protocol's honesty rules are part of what it promises. Fixes to a tool, a typo in a README or a clearer sentence follow the same path in a smaller form: change the source, regenerate, run the tests.

Status: the text is a release candidate. Changes during a release candidate are errata (something the text says that is wrong, unclear or untestable); a new rule or a change in what a rule requires is a bigger step and is discussed first.

## What is generated, and what is not

Do not edit these by hand. They are rebuilt, and a hand edit is lost or fails the checks.

| Generated | From | Command |
|---|---|---|
| `spec/*.md`, `spec/*/*.md`, `spec/rules.json` | `tools/specgen/a.src`, `b.src`, `c.src` | `npm run build:spec` (runs `gen.py`, then `vectors.py` for `spec/test-vectors/`) |
| `dist/` (CSS, SCSS, Tailwind preset, token list; u = 1, 4, 8) | `tokens/fp.tokens.json` | `npm run build:tokens` |
| `skills/lyrikai-fibonacci/`, `agent-pack/` | `spec/rules.json` and the templates in `tools/build-pack/` | `npm run build:pack` |

Edit the sources. The `.src` format is described at the top of `tools/specgen/gen.py`: a file starts with `=== spec/<file>.md | <title> | <plan section>`, and a rule is an `@R` line (ID, title, level, normative or informative, machine or self-report with its check name, evidence) followed by the rule text and `@@`. `@applies` and `@basis` are optional lines. `{{name}}` places a generated table or value.

## Proposing a rule change

1. **Open with the reason.** Say what is wrong or missing, and which rule ID or area it touches. Show the case that fails: a config, a snippet of CSS, an agent transcript.
2. **Edit the source** in `tools/specgen/`, not the generated page. Keep the rule's five fields (level, status, applies when, test, evidence) accurate. A rule is `machine` only if a checker can decide it from source files; otherwise it is `self-report`.
3. **Never reuse a rule ID.** A retired ID stays retired. FP-CONF-13 was never assigned, and that gap is deliberate.
4. **Label the evidence** (see the honesty rules below). This is part of the rule, not an afterthought.
5. **Regenerate** everything that depends on the source:

   ```sh
   npm run build:spec
   npm run build:tokens
   npm run build:pack
   ```

   If you changed a token value, change `tokens/fp.tokens.json` first. If you changed a version string, change it in the generators too: the version is written into the specification, the tokens, the pack and the tools.
6. **Update the test vectors if a machine test changed.** `tools/specgen/vectors.py` writes `spec/test-vectors/`: small inputs, an `fp.config.json` and an `expected.json` for each case. A new or changed machine rule needs a vector that passes and one that fails, so that a checker can be built against it. The expected results are computed from the rule text, not from a checker.
7. **Run the checker and the tests.**

   ```sh
   npm test
   npm run check:pack
   node tools/fp-check/fp-check.mjs showcase
   node tools/fp-check/fp-check.mjs fixtures/native
   ```

   `npm test` runs every test under `tools/`, including `fp-check` against all published vectors. If the checker and a vector disagree, one of them or the rule text is wrong: fix the text so that it is unambiguous, then the vector or the checker. Do not leave a test failing on purpose and do not loosen it to pass.
8. **Run the release guard** on the whole tree, with your own private list of names (kept outside the repository; this repository ships none):

   ```sh
   node tools/check-public/check-public.mjs . --no-git --deny path/to/your/deny.json
   ```

   It fails on private links and paths, secrets, banned claims, a missing link to https://www.lyrikai.com in Markdown files, and a licence problem. See `tools/check-public/README.md`.
9. **Add a line to `CHANGELOG.md`** under the next version, saying what changed in plain words and which rules it touches.

## The honesty rules

The protocol makes three promises: every rule is cited or labelled, accessibility floors and platform defaults always win, and φ may frame data but never shape it. A change that weakens one of them will not be accepted. In practice:

- **Every rule carries exactly one evidence label** (FP-HONEST-01): `cited` (the rule restates a requirement of the linked source), `convention`, `convention (protocol choice)` or `contested`. A convention may add a cited basis for the fact it rests on; a basis is not the same as a source that requires the rule. The reason for a rule is never "because it is φ".
- **Banned words** (FP-HONEST-02): the specification, the docs and any claim must not describe φ, Fibonacci numbers or a design that uses them as sacred, divine, perfect, magic, nature's code, a universal law, the most beautiful or scientifically proven. `tools/check-public` checks for these.
- **Claims never made** (FP-HONEST-03): the Parthenon, the Great Pyramid, the Mona Lisa and company logos were not designed on φ; φ is not the ratio people find most pleasing; people are not "wired" for φ; Fibonacci numbers are not universal in nature.
- **A claim says what was tested** (FP-HONEST-04): a conformance claim states level, mode, unit, platform and version, and nothing about quality or beauty.
- **Invent nothing** (FP-HONEST-05): no invented numbers, names or results presented as real. Sample content is allowed when it is labelled "Demonstration content" or "Sample data" in visible text.
- **Null results are stated** (FP-HONEST-06): where the text discusses preference for φ, the null and mixed results sit beside the positive ones.
- **Cite what you add.** A new statement of fact about people, plants, platforms or standards needs a source you have read, with its link. If you cannot find one, label the rule `convention` and say so.

## Tools, fixtures, the showcase

- **Checker changes.** `tools/fp-check/` is built from the specification text. Behaviour the text does not decide belongs in the text first. Add a unit test next to the change in `tools/fp-check/test/`.
- **Fixtures.** `fixtures/` holds one sample system per mode and a `faults/` folder of copies with exactly one seeded fault each. A fixture that uses third-party values keeps that source's licence and notice in its own folder; see `fixtures/README.md`.
- **The showcase.** `showcase/index.html` must stay a single static page with no external scripts, no autoplay and sample content labelled as sample, and `node tools/fp-check/fp-check.mjs showcase` must pass. If you change its colours, change the pairs in `showcase/fp.config.json` and check them with `node tools/contrast/contrast.mjs`.

## Licence

By contributing you agree that your contribution is offered under the MIT License of this repository (see [LICENSE](LICENSE)), except for a fixture folder that carries its own licence notice.

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.2 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
