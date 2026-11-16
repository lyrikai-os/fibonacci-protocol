#!/usr/bin/env python3
"""Builds spec/*.md and spec/rules.json from the .src files in this folder.
One source, so the Markdown, the index and rules.json cannot drift.

Usage: python3 gen.py <path to spec/>

Source format (.src):
  === spec/<file>.md | <title> | <plan section>     starts a file
  @R <ID> | <title> | <level> | N or I | M or S <check> | <evidence>
  @applies <condition>          optional, default "always"
  @basis <url>                  optional: a cited source for the fact behind a convention
  <rule text>
  @@                            ends the rule
  {{name}}                      a generated table or value
Evidence: cited <url> | conv | choice | contested <url>
"""
import json, math, os, re, sys, glob, collections
from fractions import Fraction

def hu1(fr):
    """Round a Fraction half-up to one decimal place."""
    return math.floor(fr * 10 + Fraction(1, 2)) / 10

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
NAME = "Lyrikai: Fibonacci Protocol for UI/UX Design Agents"
VER = "1.0.0-rc.4"
HOME = "https://www.lyrikai.com"
PHI = (1 + 5 ** 0.5) / 2
FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]
LEVELS = ("Guard", "FP-1", "FP-2", "FP-3", "FP-4a", "FP-4b", "Agent")

# ---------- tables ----------
def t_ladder():
    rows = ["| n | F(n) | u = 1 | u = 4 | u = 8 | Typical use at u = 1 only |", "|---|---|---|---|---|---|"]
    use = {1: "hairline", 2: "bar, strip, fine gap", 3: "ring, tight gap", 5: "inner gap", 8: "control gap",
           13: "gap, small padding", 21: "card padding", 34: "panel padding, control height (fine pointer)",
           55: "page top, touch target", 89: "section gap", 144: "box", 233: "box, card width",
           377: "box, card height", 610: "container", 987: "container", 1597: "container"}
    for i, f in enumerate(FIB):
        big = f >= 610
        rows.append(f"| {i + 2} | {f} | {f} | {f if big else f * 4}{' (fixed)' if big else ''} | {f if big else f * 8}{' (fixed)' if big else ''} | {use[f]} |")
    return "\n".join(rows)

def r_half_up(x):
    return int(math.floor(x + 0.5))

def fib_sub(x):
    f = min(FIB, key=lambda v: abs(v - x))
    if abs(f - x) / x <= 0.04 and f != r_half_up(x):
        return f
    return None

def lead(k):
    return "1.618 running text · 1.5 dense" if k == 0 else "1.382" if k < 0 else "1.236" if k <= 3 else "1.146"

def use_k(k, size):
    if k == -1:
        return "UI: small text, control label" if size >= 13 else "UI: small text (too small for a control label)"
    if k == 0: return "UI: body"
    if k in (1, 2, 3): return "UI: heading"
    if k == 4: return "UI: largest heading · display"
    if k % 2 == 0: return "display"
    return "not used"

def name_k(k):
    return f"n{-k}" if k < 0 else str(k)

def t_type(body, unit):
    rows = [f"| Step k | Token | body × φ^(k/2) | Size ({unit}) | With `align: fibonacci` | Use | Leading |", "|---|---|---|---|---|---|---|"]
    for k in range(-1, 9):
        x = body * PHI ** (k / 2)
        s = r_half_up(x)
        fs = fib_sub(x)
        rows.append(f"| {k} | `--fp-type-{name_k(k)}` | {x:.2f} | {s} | {fs if fs else s} | {use_k(k, s)} | {lead(k)} |")
    return "\n".join(rows)

def t_typemap():
    rows = ["| Host size (px) | Nearest step k | Formula size | With `align: fibonacci` |", "|---|---|---|---|"]
    steps = [(k, 16 * PHI ** (k / 2)) for k in (-1, 0, 1, 2, 3, 4, 6, 8)]
    for h in [12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 30, 32, 36, 40, 45, 48, 57, 60, 64, 72]:
        k, x = min(steps, key=lambda kx: (round(abs(math.log(h / kx[1])), 9), -kx[0]))
        s = r_half_up(x); fs = fib_sub(x)
        rows.append(f"| {h} | {k} | {s} | {fs if fs else s} |")
    return "\n".join(rows)

def rungs(u):
    return ([1, 2] if u > 1 else []) + [f * u for f in FIB]

def snap(v, u):
    if v == 0: return ("0", "exempt")
    if u > 1 and v in (1, 2): return (str(v), "sub-unit, kept")
    L = rungs(u)
    r = min(L, key=lambda x: (abs(x - v), -x))
    d = Fraction(abs(r - v) * 100, v)
    if d > 25: return ("—", f"not snapped (nearest {r}, drift {hu1(d):.1f}%): exception")
    return (str(r), f"{hu1(d):.1f}%")

def t_snap(vals, us):
    head = "| Host value |" + "".join(f" u = {u} rung | drift |" for u in us)
    rows = [head, "|---|" + "---|---|" * len(us)]
    for v in vals:
        row = f"| {v} |"
        for u in us:
            a, b = snap(v, u)
            row += f" {a} | {b} |"
        rows.append(row)
    return "\n".join(rows)

def merges(vals, u):
    m = collections.OrderedDict(); kept = []; unsn = []
    for v in vals:
        a, b = snap(v, u)
        if "kept" in b: kept.append(v)
        elif a == "—": unsn.append(v)
        elif b != "exempt": m.setdefault(a, []).append(v)
    parts = [f"{{{', '.join(map(str, vs))}}} → {r}" for r, vs in m.items() if len(vs) > 1]
    s = f"of {len(vals)} host values, {sum(len(x) for x in m.values())} are snapped onto {len(m)} rungs"
    if kept: s += f", {len(kept)} sub-unit value{'s' if len(kept) > 1 else ''} ({', '.join(map(str, kept))}) kept"
    if unsn: s += f", {len(unsn)} not snapped ({', '.join(map(str, unsn))})"
    return s + ". Merges: " + ("; ".join(parts) if parts else "none") + "."

G4 = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128]
G8 = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72]

def imul(a, b): return (a * b) & 0xFFFFFFFF
def fphash(seed, i, k):
    h = (seed ^ imul(i & 0xFFFFFFFF, 0x9E3779B9) ^ imul(k & 0xFFFFFFFF, 0x85EBCA6B)) & 0xFFFFFFFF
    h ^= h >> 16; h = imul(h, 0x85EBCA6B); h ^= h >> 13; h = imul(h, 0xC2B2AE35); h ^= h >> 16
    return h
def t_hash():
    rows = ["| seed | i | k | 32-bit result | as a number in [0, 1) |", "|---|---|---|---|---|"]
    for s, i, k in [(0, 0, 0), (0, 1, 0), (0, 0, 1), (1, 1, 1), (89, 21, 34), (2654435769, 377, 610), (0, 4294967295, 0)]:
        h = fphash(s, i, k)
        rows.append(f"| {s} | {i} | {k} | {h} | {h / 4294967296:.10f} |")
    return "\n".join(rows)

def t_const():
    ga = 360 / PHI ** 2
    rows = ["| Name | Closed form | Value |", "|---|---|---|",
            f"| φ | (1 + √5) / 2 | {PHI:.10f} |", f"| 1/φ | φ − 1 | {1 / PHI:.10f} |",
            f"| 1/φ² | 2 − φ | {1 / PHI ** 2:.10f} |", f"| √φ | φ^(1/2) | {PHI ** 0.5:.10f} |",
            f"| Golden angle (degrees) | 360 / φ² = 180 (3 − √5) | {ga:.5f} |",
            f"| Golden angle (radians) | π (3 − √5) | {math.pi * (3 - 5 ** 0.5):.8f} |",
            f"| Fibonacci hashing constant | ⌊2³² / φ⌋ | {int(2 ** 32 / PHI)} (0x9E3779B9) |"]
    return "\n".join(rows)

def t_tone():
    rows = ["| Token | Power | Value |", "|---|---|---|"]
    for n in range(1, 6):
        rows.append(f"| `--fp-tone-{n}` | φ^−{n} | {PHI ** -n:.3f} |")
    return "\n".join(rows)

def t_leading():
    rows = ["| Text | Token | Ratio | Formula |", "|---|---|---|---|"]
    for nm, tok, n in [("Running text: paragraphs of prose at body size", "body", 1),
                       ("Small text, and any single-line label at any interface step", "small", 2),
                       ("Headings (steps 1 to 3)", "heading", 3), ("Display (step 4 and up)", "display", 4)]:
        rows.append(f"| {nm} | `--fp-leading-{tok}` | {1 + PHI ** -n:.3f} | 1 + φ^−{n} |")
    rows.append("| Dense body: body-size text in tables, lists and forms | `--fp-leading-dense` | 1.500 | fixed |")
    return "\n".join(rows)

TFLOORS = [("Web, coarse or unknown pointer", 44, "44 CSS px (protocol choice; the WCAG AA minimum is 24)"),
           ("Web, fine pointer only", 24, "24 CSS px (WCAG AA minimum)"), ("iOS and iPadOS", 44, "44 pt"),
           ("Android", 48, "48 dp"), ("macOS", 28, "28 pt")]
def up(fl, u): return min(f * u for f in FIB if f * u >= fl)
def t_targets():
    rows = ["| Platform and pointer | Target floor | Ladder target at u = 1 | u = 4 | u = 8 |", "|---|---|---|---|---|"]
    for nm, fl, note in TFLOORS:
        rows.append(f"| {nm} | {note} | {up(fl, 1)} | {up(fl, 4)} | {up(fl, 8)} |")
    return "\n".join(rows)

def t_css():
    L = [":root {"]
    L += [f"  --fp-space-{f}: {f}px;" for f in FIB if f <= 377]
    L += [f"  --fp-container-{f}: {f}px;" for f in (610, 987, 1597)]
    L += [f"  --fp-radius-{r}: {r}px;" for r in (2, 3, 5, 8, 13, 21)]
    L += ["  --fp-radius-pill: 9999px;", "  --fp-focus-gap: 2px;", "  --fp-focus-ring: 3px;", "  --fp-target: 55px;", "}",
          "@media (pointer: fine) and (not (any-pointer: coarse)) {", "  :root { --fp-target: 34px; }", "}"]
    return "```css\n/* Fibonacci Protocol " + VER + " · FP-1 tokens at u = 1 · MIT · " + HOME + " */\n" + "\n".join(L) + "\n```"

TABLES = {
    "ladder": t_ladder, "const": t_const, "tone": t_tone, "leading": t_leading, "hash": t_hash,
    "targets": t_targets, "css": t_css, "typemap": t_typemap, "ver": lambda: VER,
    "type16": lambda: t_type(16, "px or sp"), "type17": lambda: t_type(17, "pt"), "type13": lambda: t_type(13, "pt"),
    "snap4": lambda: t_snap(G4, [1, 4]), "snap8": lambda: t_snap(G8, [1, 8]),
    "merge4_1": lambda: merges(G4, 1), "merge4_4": lambda: merges(G4, 4),
    "merge8_1": lambda: merges(G8, 1), "merge8_8": lambda: merges(G8, 8),
}

# ---------- parse ----------
EV = {"conv": "convention", "choice": "convention (protocol choice)", "cited": "cited", "contested": "contested"}
files, rules = [], []
cur = None

def ev_md(e):
    s = e["label"] + (f" ([source]({e['url']}))" if "url" in e else "")
    if "basis" in e: s += f"; basis: [cited source]({e['basis']['url']})"
    return s

for sp in sorted(glob.glob(os.path.join(HERE, "*.src"))):
    lines = open(sp, encoding="utf-8").read().split("\n")
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("=== "):
            p, title, plan = [x.strip() for x in ln[4:].split("|")]
            cur = {"path": p, "title": title, "plan": plan, "body": []}
            files.append(cur)
        elif ln.startswith("@R "):
            f = [x.strip() for x in ln[3:].split("|")]
            assert len(f) == 6, ln
            rid, title, level, st, test, ev = f
            assert re.fullmatch(r"FP-[A-Z0-9]+-\d\d", rid), rid
            assert level in LEVELS, ln
            assert st in ("N", "I"), ln
            tk, tc = test.split(" ", 1)
            assert tk in ("M", "S"), ln
            evp = ev.split(" ", 1)
            assert evp[0] in EV, ln
            if evp[0] == "cited": assert len(evp) == 2, ln
            applies, basis, text = "always", None, []
            i += 1
            while lines[i].strip() != "@@":
                if lines[i].startswith("@applies "): applies = lines[i][9:].strip()
                elif lines[i].startswith("@basis "): basis = lines[i][7:].strip()
                else: text.append(lines[i])
                i += 1
            e = {"label": EV[evp[0]]}
            if len(evp) == 2: e["url"] = evp[1].strip()
            if basis:
                assert evp[0] in ("conv", "choice"), "basis only on conventions: " + ln
                e["basis"] = {"label": "cited", "url": basis}
            assert rid not in [x["id"] for x in rules], "duplicate " + rid
            r = {"id": rid, "title": title, "level": level, "status": "normative" if st == "N" else "informative",
                 "appliesWhen": applies,
                 "test": {"kind": "machine" if tk == "M" else "self-report", "check": tc.strip()},
                 "evidence": e, "text": "\n".join(text).strip(), "file": p}
            rules.append(r)
            cur["body"].append(f"### {rid} · {title}\n\n{r['text']}\n\n- **Level:** {level} · **Status:** {r['status']} · "
                               f"**Applies when:** {applies} · **Test:** {r['test']['kind']}, `{r['test']['check']}` · "
                               f"**Evidence:** {ev_md(e)}\n")
        else:
            cur["body"].append(ln)
        i += 1

def rule_table():
    rows = ["| ID | Title | Level | Status | Applies when | Test | Evidence |", "|---|---|---|---|---|---|---|"]
    for r in rules:
        anchor = r["file"].replace("spec/", "")
        rows.append(f"| [{r['id']}]({anchor}) | {r['title']} | {r['level']} | {r['status']} | {r['appliesWhen']} | "
                    f"{r['test']['kind']}: `{r['test']['check']}` | {ev_md(r['evidence'])} |")
    return "\n".join(rows)

def counts():
    c = collections.Counter((r["level"], r["status"]) for r in rules)
    rows = ["| Level | Normative | Informative | Total |", "|---|---|---|---|"]
    tn = ti = 0
    for lv in LEVELS:
        n, i_ = c[(lv, "normative")], c[(lv, "informative")]
        tn += n; ti += i_
        rows.append(f"| {lv} | {n} | {i_} | {n + i_} |")
    rows.append(f"| **All** | **{tn}** | **{ti}** | **{tn + ti}** |")
    return "\n".join(rows)

def filemap():
    rows = ["| File | Plan section | Holds | Rules |", "|---|---|---|---|"]
    for f in files:
        ids = [r["id"] for r in rules if r["file"] == f["path"]]
        pre = sorted(set(x.rsplit("-", 1)[0] for x in ids))
        p = f["path"].replace("spec/", "")
        rows.append(f"| [{p}]({p}) | {f['plan']} | {f['title']} | {', '.join('`' + q + '`' for q in pre) or '—'} ({len(ids)}) |")
    rows.append("| [rules.json](rules.json) | — | Every rule in machine-readable form, with its text; generated from the same source as these pages | all |")
    rows.append("| [fp.config.schema.json](fp.config.schema.json) | 2 | JSON Schema (2020-12) for `fp.config.json` | — |")
    rows.append("| [fp-evidence.schema.json](fp-evidence.schema.json) | 3 | JSON Schema (2020-12) for `fp-evidence.json` | — |")
    rows.append("| [test-vectors/](test-vectors/README.md) | 3 | Inputs and expected results for the core machine tests | — |")
    return "\n".join(rows)

def checklist():
    ok = {"always": "always", "the report": "always (tested on the report)", "mode: overlay": "always",
          "mode: native or overlay": "always", "mode: overlay or snap": "always", "platform: web": "always",
          "protocol token files": "only if you ship token files in the protocol's format"}
    rows = ["| Rule | Title | Test | Needed |", "|---|---|---|---|"]
    for r in rules:
        if r["status"] != "normative" or r["level"] not in ("Guard", "FP-1"): continue
        a = r["appliesWhen"]
        need = ok.get(a) or (("only if `" + a.replace("has: ", "has.").replace("time limits", "timeLimits").replace("generated art", "generatedArt") + "` is true in your configuration") if a.startswith("has: ") else None)
        if not need: continue
        rows.append(f"| [{r['id']}]({r['file'].replace('spec/', '')}) | {r['title']} | {r['test']['kind']} | {need} |")
    return "\n".join(rows)

TABLES.update({"rules": rule_table, "counts": counts, "filemap": filemap, "checklist": checklist})

known = set(r["id"] for r in rules) | {"FP-CONF-13"}  # FP-CONF-13 was never assigned; the text says so
sub = lambda s: re.sub(r"\{\{(\w+)\}\}", lambda m: TABLES[m.group(1)](), s)
for r in rules:
    r["text"] = sub(r["text"])
for f in files:
    body = sub("\n".join(f["body"]))
    for ref in re.findall(r"FP-[A-Z0-9]+-\d\d", body):
        assert ref in known, f"unknown rule reference {ref} in {f['path']}"
    depth = f["path"].count("/") - 1
    idx = "../" * depth + "index.md"
    head = (f"# {f['title']}\n\n*{NAME} · version {VER} · MIT License · [www.lyrikai.com]({HOME})*"
            + ("" if f["path"].endswith("index.md") else f" · [Index]({idx})") + "\n")
    foot = f"\n---\n\n{NAME} · version {VER} · MIT License · [www.lyrikai.com]({HOME})\n"
    dest = os.path.join(OUT, f["path"].replace("spec/", "", 1))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(head + "\n" + body.strip("\n") + "\n" + foot)

js = {"name": NAME, "version": VER, "license": "MIT", "homepage": HOME, "rules": rules}
open(os.path.join(OUT, "rules.json"), "w", encoding="utf-8").write(json.dumps(js, indent=2, ensure_ascii=False) + "\n")
print(len(files), "files,", len(rules), "rules")
print(counts())
