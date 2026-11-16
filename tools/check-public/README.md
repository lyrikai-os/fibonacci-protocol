# check-public

Part of **Lyrikai: Fibonacci Protocol for UI/UX Design Agents** - https://www.lyrikai.com (MIT licensed).

A dependency-free Node 20+ tool that guards what may be published. It lists the files of a tree and fails with `path:line: [kind] message` findings. It reads every file and reports anything it could not read: text, UTF-16 text (with or without a byte-order mark), and the ASCII and UTF-16 strings inside binaries.

## What it checks

| kind | what |
|---|---|
| `private-link` | Links to the Claude web app and the Cursor origin or codebase hosts; local home, temp and volume paths for macOS, Linux and Windows; home-relative paths; home environment variables. File names and symlink targets are checked too. Each line is also checked after decoding percent-escapes, numeric entities, unicode and hex escapes, escaped slashes, compatibility characters and joined string concatenations (`'a' + 'b'`); calls that build a string from parts are out of reach. Only the bare Linux-home route (the segment alone, nothing after it) may be exempt as a site link; a user folder after it, and every other local path, is flagged. A `..` step after an install path is flagged. The install paths `~/.claude/`, `~/.cursor/`, `~/.codex/` and `~/.agents/` are fine, as are site-relative links such as `[Home](/home/)` and paths glued to a host name. |
| `in-house-name` | Names and prefixes from the **private deny file** (see below). Nothing is built in. Names match case-insensitively with word bounds, with any run of spaces, dashes or underscores between words. An entry written `{"name": "...", "caseSensitive": true}` matches case-sensitively, but its Title-case and UPPER-case forms match too (only other casings are free). Zero-width and other format characters (soft hyphen, zero-width space and joiner) are stripped before matching. A name split over a line break is caught by also matching each line joined to the next; it is reported on the first line. Prefixes match only in token context: after `--`, `.`, `#`, a quote or a backtick, or after a space on a line with a class or style attribute, so prose such as a hyphenated word is not hit; write `{"prefix": "xx-", "anywhere": true}` to match everywhere. A name also matches inside path-like tokens (the machine user name inside a dash-joined project path). Output says only "deny entry N", never the name. |
| `banned-claim` | In markdown (`.md`, `.mdx`), HTML and SVG text, the `description` and `$description` values of JSON, and comments in `.mjs`, `.js`, `.ts`. See the list below. |
| `secret` | AWS key ids (long-lived and temporary) and secret-key names, key/password/secret/token assignments (also quoted JSON), Anthropic, OpenAI, Slack, live payment and GitHub tokens, JWTs, private key blocks, and `.env` files (not `.env.example`). Documentation placeholders (angle brackets, variable references, repeated x or stars, "changeme") are not password findings. Messages never echo the value. |
| `missing-link` | Every file matching `requireLinkIn` (default `**/*.md`, `**/*.mdx`, case-insensitive) and every `SKILL.md` must contain the exact URL `https://www.lyrikai.com` (a longer host such as `www.lyrikai.com.example` does not count). |
| `license` | `LICENSE` (or `.md`/`.txt`) in the **scanned root only** must start with `MIT License` and contain the MIT permission sentence. |
| `unscannable` | A file or directory that could not be read. |
| `symlink` | A symlink whose target leaves the scanned root. The link target text is scanned too. |

Banned claim words. Do not claim any of these:

- sacred
- divine
- perfect (but "perfect fourth", "perfect fifth", octave and unison are fine)
- magic
- nature's code, nature's perfect
- universal law
- most beautiful
- scientifically proven

## Escapes (banned claims only)

A banned word is not reported when:

- the line, or the line before, carries the marker `check-public: allow-banned`;
- the same sentence contains the word "contested";
- the text before it on the line reads like a rule, such as "must not describe ... as:" (also "do not claim", "never call", "shall not state");
- it is a list item under a header line such as "Do not claim:" or "Banned words".

The rule form must be one sentence: the negated verb, then "as" or a colon, then the banned word directly in that list. Only other banned words, commas, quotes, articles and "or"/"and" may sit between; any other word breaks the escape.

**These escapes never apply to links, paths, secrets or names.** No inline marker can silence those.

## Usage

```
node check-public.mjs <dir> [--allow allow.json] [--deny deny.json] [--release] [--git | --no-git] [--json]
```

- **Files listed.** When the directory is inside a git work tree (default), the files are `git ls-files --cached --others --exclude-standard`, so ignored files are skipped and nothing untracked is missed. `--no-git` walks the directory instead (skipping `.git` and `node_modules`). `--git` insists on git mode.
- **`--deny deny.json`.** The private list: `{"denyNames": ["Some Name", {"name": "Other", "caseSensitive": true}], "denyPrefixes": ["xx-"]}`. Keep the file **outside the public repo**. This repo ships no names.
- **`--release`.** The release gate, run from the public repo root. It reads each file from the **git index** (`git show :path`, not the working tree) and **fails on a dirty tree**, including untracked files. It needs `--deny` and `--deny-sha256 <hex>`: the sha256 of the deny file's bytes, which must match (so a swapped or stubbed list is refused; record the hash in the private notes and update it whenever the list changes). The deny file needs **at least 10 names of 3 or more characters** (a stub list is refused), always checks the LICENSE, and **refuses `ignorePaths`**. Every `allow` entry must have a literal root-anchored path (no globs, no leading slash, no `..`), a 64-hex `lineSha256`, and an exact string that is not only a domain, a path stem or a token prefix (under 12 characters, or ending in a slash, dash, underscore, dot or colon, is refused). A bad entry is a config error (exit 2).
- **`--deny-sha256 <hex>`.** Optional outside release mode: refuses to run unless the deny file's sha256 matches. Compute it with `shasum -a 256 deny.json`.
- **`--json`.** Prints `{ok, mode, scanned, total, counts, findings: [{path, line, kind, message}]}`.

`allow.json` (all keys optional; the one shipped here sets `requireLicense` to false only because this folder is not a repo root):

```json
{
  "ignorePaths": ["vendor/**"],
  "requireLinkIn": ["**/*.md"],
  "requireLicense": true,
  "allow": [
    { "path": "docs/lineage.md", "string": "the exact text", "lineSha256": "optional sha256 of the whole line" }
  ]
}
```

Outside release mode, each `allow` entry exempts one exact string, only in files matching `path`, and only where the string encloses the finding; with `lineSha256` the whole line must also match. An entry with an empty path or string is a placeholder and does nothing. Globs: `**` crosses folders, `*` and `?` do not, case-insensitive; a glob with no slash matches at any depth. Built-in always-allowed public strings: `/lyrikai-fibonacci`, `skills/lyrikai-fibonacci/`, `com.lyrikai.fp`, `lyrikai-os/fibonacci-protocol`, `www.lyrikai.com`, `Lyrikai`.

Check this tool's own folder with no markers: `node check-public.mjs . --allow allow.json`.

## Known limits

- Base64 `data:` URIs are not decoded, so a path inside one is not seen.
- UTF-16 text that starts after more than 8000 ASCII bytes is treated as binary (its UTF-16 strings are still extracted, but line numbers are lost).
- Strings built by a function call from parts are not reassembled.

## Exit codes

- `0` no findings
- `1` one or more findings
- `2` usage or config error, including `--release` without a deny file

## Tests

`node --test`. Every fixture is built in the system temp directory at test time from string fragments, and fake secrets are assembled at run time, so this repo holds no literal hits and a secret scanner stays quiet.

MIT License. See https://www.lyrikai.com
