#!/usr/bin/env python3
"""Writes spec/test-vectors/: small inputs, an fp.config.json and the expected
results for the core machine tests. The expected results are computed by the
minimal reference functions in this file, which follow the rule text. A checker
is built against these vectors.

Usage: python3 vectors.py <path to spec/test-vectors>
"""
import json, math, os, re, sys
from fractions import Fraction

def hu1(fr):
    """Round a Fraction half-up to one decimal place."""
    return math.floor(Fraction(fr) * 10 + Fraction(1, 2)) / 10

OUT = sys.argv[1]
VER = "1.0.0-rc.3"
NAME = "Lyrikai: Fibonacci Protocol for UI/UX Design Agents"
HOME = "https://www.lyrikai.com"
PHI = (1 + 5 ** 0.5) / 2
FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]
CONT = [610, 987, 1597]
RADIUS = [0, 2, 3, 5, 8, 13, 21]
STROKE = [0, 1, 2, 3]
EXEMPT_ROLES = ("icon", "type", "breakpoint", "drawn", "micro", "target")

def ladder(u):
    return sorted(set(([1, 2] if u > 1 else []) + [f * u for f in FIB] + CONT))

# ---------- CSS reading (flat rules only; enough for the vectors) ----------
def parse_css(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    rules = []
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", text):
        decls = [tuple(x.strip() for x in d.split(":", 1)) for d in body.split(";") if ":" in d]
        rules.append((" ".join(sel.split()), decls))
    return rules

def custom_props(rules):
    return {p: v for sel, ds in rules for p, v in ds if p.startswith("--")}

def split_values(v):
    out, depth, cur = [], 0, ""
    for ch in v:
        if ch == "(": depth += 1
        if ch == ")": depth -= 1
        if ch == " " and depth == 0:
            if cur: out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur: out.append(cur)
    return out

def resolve(tok, props, seen=()):
    m = re.fullmatch(r"var\((--[\w-]+)\)", tok)
    if m and m.group(1) in props and m.group(1) not in seen:
        return resolve(props[m.group(1)], props, seen + (m.group(1),))
    return tok

LAYOUT = re.compile(r"^((margin|padding)(-(top|right|bottom|left|inline|block)(-(start|end))?)?|(row-|column-)?gap|"
                    r"inset(-(inline|block)(-(start|end))?)?|top|right|bottom|left|(min-|max-)?(width|height|inline-size|block-size))$")
RADIUSP = re.compile(r"^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$")
STROKEP = re.compile(r"^(border(-(top|right|bottom|left|inline|block)(-(start|end))?)?-width|outline-width|outline-offset)$")
INTRINSIC = re.compile(r"^(0|auto|min-content|max-content|fit-content|-?\d+(\.\d+)?(%|fr|ch))$")
BOX = r"(100(%|vw|vh|cqi|cqb|dvw|dvh|svw|svh|lvw|lvh|vi|vb)|var\(--fp-container-(610|987|1597)\))"
BOX4 = ("margin", "padding", "inset", "border-radius", "border-width")
BOX2 = ("gap", "margin-inline", "margin-block", "padding-inline", "padding-block", "inset-inline", "inset-block")
def longhands(prop, toks):
    """The tokens of a declaration after shorthand expansion, one per longhand."""
    n = len(toks)
    if prop in BOX4 and n <= 4: return [toks[i] for i in {1: (0, 0, 0, 0), 2: (0, 1, 0, 1), 3: (0, 1, 2, 1), 4: (0, 1, 2, 3)}[n]]
    if prop in BOX2 and n <= 2: return [toks[i] for i in {1: (0, 0), 2: (0, 1)}[n]]
    return toks
PX = re.compile(r"^(-?\d+(\.\d+)?)px$")

def role_of(name, cfg):
    for r in cfg.get("roles", []):
        if re.fullmatch(re.escape(r["match"]).replace(r"\*", ".*"), name):
            return r["role"]
    return None

def derived_ok(val, props, u):
    m = re.fullmatch(r"calc\(\s*" + BOX + r"\s*\*\s*(0\.618|0\.382)\s*\)", val)
    if m: return True
    m = re.fullmatch(r"calc\(\s*" + BOX + r"\s*-\s*(\S+)\s*\)", val)
    if m:
        p = PX.match(resolve(m.group(4), props))
        return bool(p) and float(p.group(1)) in ladder(u)
    return False

def check_lengths(files, cfg):
    """space.on-ladder, radius.set, math.fixed-detail (stroke), space.exceptions."""
    u = cfg.get("unit", 1)
    exc = {e["where"]: e for e in cfg.get("exceptions", [])}
    findings, counted = [], 0
    for fname, text in files.items():
        rules = parse_css(text); props = custom_props(rules)
        for sel, decls in rules:
            for prop, val in decls:
                kind = "layout" if LAYOUT.match(prop) else "radius" if RADIUSP.match(prop) else "stroke" if STROKEP.match(prop) else None
                if not kind: continue
                toks = [val] if val.startswith("calc(") else split_values(val)
                for lt in longhands(prop, toks):
                    lr = resolve(lt, props)
                    if lr != "0" and not (kind == "layout" and INTRINSIC.match(lr)): counted += 1
                for tok in toks:
                    name = re.fullmatch(r"var\((--[\w-]+)\)", tok)
                    name = name.group(1) if name else None
                    res = resolve(tok, props)
                    if kind == "layout" and INTRINSIC.match(res): continue
                    if res == "0": continue
                    if name and role_of(name, cfg) in EXEMPT_ROLES: continue
                    ok = False; p = PX.match(res)
                    if kind == "layout":
                        ok = (p and abs(float(p.group(1))) in ladder(u)) or derived_ok(tok, props, u)
                        check, rule = "space.on-ladder", "FP-SPACE-01"
                    elif kind == "radius":
                        ok = (p and float(p.group(1)) in RADIUS) or res in ("9999px", "50%")
                        check, rule = "radius.set", "FP-RADIUS-01"
                    else:
                        ok = p and float(p.group(1)) in STROKE
                        check, rule = "math.fixed-detail", "FP-MATH-07"
                    if ok: continue
                    e = exc.get(sel) or (exc.get(name) if name else None)
                    result = "fail" if not e else ("exception" if e["status"] == "accepted" else "pending")
                    findings.append({"file": fname, "selector": sel, "property": prop, "value": tok, "resolved": res,
                                     "check": check, "rule": rule, "result": result})
    return findings, counted

# ---------- Snap ----------
def nearest(v, cands):
    r = min(cands, key=lambda x: (abs(x - v), -x))
    return r, Fraction(abs(r - v) * 100, v)

def snap_table(tokens, cfg):
    u = cfg.get("unit", 1); L = ladder(u); rows = []
    floor = 24 if cfg.get("pointer") == "fine" else 44
    lt = min(x for x in L if x >= floor)
    for name, v in tokens:
        role = role_of(name, cfg)
        row = {"token": name, "role": role or ("radius" if "radius" in name else "space"), "original": v}
        if role in ("icon", "type", "breakpoint", "drawn", "micro"):
            row.update(snapped=v, drift=0.0, note="exempt by role, unchanged")
        elif role == "target":
            need = max(v, lt)
            row.update(snapped=min(x for x in L if x >= need), minimum=need, keepAllowed=v >= lt, drift=None,
                       note="target: never below max(original, ladder target); no drift limit")
        elif v == 0 or (u > 1 and v in (1, 2)):
            row.update(snapped=v, drift=0.0, note="exempt by value")
        else:
            cands = [x for x in RADIUS if x] if row["role"] == "radius" else L
            if True:
                r, d = nearest(v, cands)
                if d > 25:
                    row.update(snapped=None, nearest=r, drift=hu1(d), note="drift over 25%: kept unchanged as an exception (snap-drift)")
                else:
                    row.update(snapped=r, drift=hu1(d))
        rows.append(row)
    groups = {}
    for r in rows:
        if r["role"] in ("space", "radius", "target") and r.get("snapped") is not None and "exempt" not in r.get("note", ""):
            groups.setdefault((r["role"], r["snapped"]), []).append(r["token"])
    merges = [{"role": k[0], "rung": k[1], "tokens": v} for k, v in groups.items() if len(v) > 1]
    return rows, merges

def snap_expected(tokens, cfg):
    """A value that cannot be snapped is kept only as a declared snap-drift exception (FP-SNAP-10)."""
    rows, merges = snap_table(tokens, cfg)
    exc = {e["where"]: e for e in cfg.get("exceptions", []) if e["reason"] == "snap-drift"}
    findings = []
    for r in rows:
        if r.get("snapped") is None:
            e = exc.get(r["token"])
            res = "fail" if not e else ("exception" if e["status"] == "accepted" else "pending")
            findings.append({"token": r["token"], "value": f"{r['original']}px", "check": "snap.unsnappable", "rule": "FP-SNAP-10", "result": res,
                             "message": "kept unchanged; " + ("declared as a snap-drift exception" if e else "no snap-drift exception is declared")})
    res = "fail" if any(f["result"] == "fail" for f in findings) else "pending" if any(f["result"] == "pending" for f in findings) else "pass"
    return {"result": res, "mapping": rows, "merges": merges, "findings": findings}

def check_overrides(tokens, cfg):
    u = cfg.get("unit", 1); L = ladder(u); out = []
    rows, _ = snap_table(tokens, cfg); final = {r["token"]: r["snapped"] for r in rows}
    orig = dict(tokens)
    for o in cfg.get("snap", {}).get("overrides", []):
        v = orig[o["token"]]; d = Fraction(abs(o["to"] - v) * 100, v)
        res = "pass"; why = ""
        if o["to"] not in L: res, why = "fail", "`to` is not a rung of the declared unit"
        elif d > Fraction(382, 10): res, why = "fail", f"drift {hu1(d):.1f}% is over 38.2%"
        else: final[o["token"]] = o["to"]
        out.append({"token": o["token"], "original": v, "to": o["to"], "drift": hu1(d), "check": "snap.override", "rule": "FP-SNAP-07", "result": res, "message": why})
    order = []
    sp = sorted([(v, n) for n, v in tokens if role_of(n, cfg) is None and final.get(n) is not None])
    for (va, a), (vb, b) in zip(sp, sp[1:]):
        if final[a] > final[b]:
            order.append({"tokens": [a, b], "original": [va, vb], "final": [final[a], final[b]], "check": "snap.monotonic", "rule": "FP-SNAP-05", "result": "fail"})
    return out, order, final

# ---------- type ----------
ALLOWED_STEPS = (-1, 0, 1, 2, 3, 4, 6, 8)
def classify_size(size, body, align):
    """Returns (step, None) when the size is accepted, else (None, (check, rule, message))."""
    table = {}
    for k in range(-1, 9):
        x = body * PHI ** (k / 2); formula = int(math.floor(x + 0.5))
        f = min(FIB, key=lambda q: abs(q - x)); sub = f if abs(f - x) / x <= 0.04 and f != formula else None
        table[k] = (formula, sub)
    for k, (formula, sub) in table.items():
        if size not in (formula, sub): continue
        if k not in ALLOWED_STEPS:
            return None, ("type.step-range", "FP-TYPE-02", f"{size:g} is the value of step {k}, which is not used")
        accepted = sub if (align == "fibonacci" and sub is not None) else formula
        if size == accepted: return k, None
        if align == "fibonacci":
            return None, ("type.align", "FP-TYPE-03", f"{size:g} is replaced by {sub} at step {k} under type.align: fibonacci")
    return None, ("type.scale", "FP-TYPE-01", f"{size:g} is not a step of the scale")

def check_type(files, cfg):
    body = cfg.get("type", {}).get("body", 16); align = cfg.get("type", {}).get("align", "formula")
    findings = []
    for fname, text in files.items():
        rules = parse_css(text); props = custom_props(rules)
        for sel, decls in rules:
            d = dict(decls)
            if "font-size" not in d: continue
            tok = d["font-size"]; name = re.fullmatch(r"var\((--[\w-]+)\)", tok); name = name.group(1) if name else None
            res = resolve(tok, props); k = None
            def add(check, rule, msg): findings.append({"file": fname, "selector": sel, "property": "font-size" if check in ("type.scale", "type.step-range", "type.align", "type.units", "type.micro") else "line-height", "value": d.get("font-size") if "leading" not in check else d.get("line-height"), "check": check, "rule": rule, "result": "fail", "message": msg})
            if name and (name == "--fp-type-micro" or role_of(name, cfg) == "micro"):
                k = "micro"
            else:
                m = re.fullmatch(r"(\d+(\.\d+)?)rem", res)
                if not m:
                    add("type.units", "FP-TYPE-04", "a type size is written in rem")
                    m2 = PX.match(res); size = float(m2.group(1)) if m2 else None
                else:
                    size = float(m.group(1)) * 16
                if size is not None:
                    k, bad = classify_size(size, body, align)
                    if bad: add(*bad)
            lh = d.get("line-height")
            if lh is None:
                add("type.leading-declared", "FP-TYPE-13", "no line-height in the rule that sets font-size")
            elif not re.fullmatch(r"\d+(\.\d+)?", lh):
                add("type.leading-unitless", "FP-TYPE-08", "line height is not a unitless ratio")
            elif float(lh) not in (1.618, 1.5, 1.382, 1.236, 1.146):
                add("type.leading", "FP-TYPE-07", "line height is not one of the five values")
            elif isinstance(k, int) and ((float(lh) in (1.618, 1.5) and k != 0) or (float(lh) == 1.146 and k < 4) or (float(lh) == 1.236 and k > 3)):
                add("type.leading", "FP-TYPE-07", f"line height {lh} is not allowed at step {k}")
    return findings

# ---------- contrast ----------
def lum(hexc):
    h = hexc.lstrip("#"); h = "".join(c * 2 for c in h) if len(h) == 3 else h
    ch = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in ch]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def check_contrast(files, cfg):
    props = {}
    for t in files.values(): props.update(custom_props(parse_css(t)))
    out = []
    for p in cfg["pairs"]:
        fg, bg = (resolve(f"var({x})", props) if x.startswith("--") else x for x in (p["fg"], p["bg"]))
        a, b = sorted((lum(fg), lum(bg)), reverse=True); ratio = (a + 0.05) / (b + 0.05)
        need = 4.5 if p["kind"] == "text" else 3.0
        out.append({"fg": p["fg"], "bg": p["bg"], "kind": p["kind"], "ratio": math.floor(ratio * 1000) / 1000, "required": need,
                    "check": "a11y.contrast", "rule": "FP-A11Y-01", "result": "pass" if ratio >= need else "fail"})
    return out

# ---------- n/a contradiction ----------
def check_has(files, cfg):
    text = "\n".join(files.values()); out = []
    sels = " ".join(s for s, _ in parse_css(text))
    motion = bool(re.search(r"(^|[\s;{])(animation|transition)(-[\w-]+)?\s*:|@keyframes", text))
    controls = bool(re.search(r"(^|[\s,>+~(])(button|a|input|select|textarea|summary)(?=[\s,.:#\[>+~{]|$)|\[role=\"button\"\]|:focus|:hover", sels))
    for key, seen in (("motion", motion), ("controls", controls)):
        if cfg["has"][key] is False and seen:
            out.append({"has": key, "declared": False, "check": "conf.not-applicable", "rule": "FP-CONF-11", "result": "fail",
                        "message": f"has.{key} is false but the scope contains {key}"})
    return out

# ---------- vectors ----------
HASN = {"motion": False, "timeLimits": False, "controls": False, "charts": False, "generatedArt": False, "states": False}
PAIR = [{"fg": "#1a1a1a", "bg": "#ffffff", "kind": "text"}]
def cfg(mode="native", level="FP-1", **kw):
    c = {"fp": VER, "mode": mode, "level": level, "platform": "web", "unit": 1, "has": dict(HASN), "source": ["input.css"], "pairs": PAIR}
    c.update(kw); return c

V = []
def vec(name, about, files, config, expected):
    V.append((name, about, files, config, expected))

def lengths_expected(files, config):
    f, n = check_lengths(files, config)
    res = "fail" if any(x["result"] == "fail" for x in f) else "pending" if any(x["result"] == "pending" for x in f) else "pass"
    return {"result": res, "checkedValues": n, "findings": f}

css = """.card { padding: 21px; gap: 8px; margin-block-end: 34px; border-radius: 13px; border-width: 1px; }
.page { padding-inline: 55px; max-inline-size: 987px; inset: 0; width: 100%; }
.pull { margin-top: -13px; }
.chip { border-radius: 9999px; min-height: 21px; }
"""
c = cfg(); vec("01-ladder-u1-pass", "Every checked length is a rung, 0, intrinsic, or in its fixed set. Negative rungs pass.", {"input.css": css}, c, lengths_expected({"input.css": css}, c))

css = """.a { padding: 16px; }
.b { gap: 12px 8px; }
.c { border-radius: 14px; }
.d { border-width: 4px; }
.e { margin-top: 13px; width: 240px; }
"""
c = cfg(); vec("02-ladder-u1-fail", "Off-ladder lengths, an off-set radius and an off-set stroke each fail. In a shorthand each value is tested.", {"input.css": css}, c, lengths_expected({"input.css": css}, c))

css = """.a { padding: 52px; gap: 12px; margin: 2px; }
.b { padding: 13px; }
.c { border-radius: 13px; border-width: 1px; }
.d { max-width: 610px; width: 2440px; }
.e { gap: 16px; }
"""
c = cfg(unit=4); vec("03-ladder-u4", "At u = 4 the rungs are F × 4 plus the sub-unit values 1 and 2. Radius, stroke and container widths stay in platform units. 13 and 16 are not rungs; 2440 (610 × 4) is not a rung.", {"input.css": css}, c, lengths_expected({"input.css": css}, c))

css = """:root { --fp-space-21: 21px; --fp-container-987: 987px; }
.a { width: calc(100% * 0.618); }
.b { width: calc(100% - 21px); }
.c { max-width: calc(var(--fp-container-987) - var(--fp-space-21)); }
.d { height: calc(100vh - 55px); }
.e { width: calc(21px + 13px); }
.f { width: calc(100% - 21px - 8px); }
.g { width: calc(100% - 20px); }
.h { width: calc(100% * 0.5); }
.i { max-width: calc(987px - 21px); }
"""
c = cfg(); vec("04-derived", "The two derived patterns pass: a φ split of a container, and a container minus one ladder token. Rung arithmetic, chaining, a non-rung operand, a non-φ factor, and a literal 987px in place of the container token fail.", {"input.css": css}, c, lengths_expected({"input.css": css}, c))

css = """:root { --icon-md: 16px; --space-4: 16px; --space-2: 8px; --gap-legacy: 20px; --row: 44px; }
.icon { width: var(--icon-md); height: var(--icon-md); }
.a { padding: var(--space-2); }
.b { padding: var(--space-4); }
.c { gap: var(--gap-legacy); }
.d { min-height: var(--row); }
.vendor { margin: 10px; }
"""
c = cfg(mode="overlay", roles=[{"match": "--icon-*", "role": "icon"}],
        exceptions=[{"value": "20px", "where": "--gap-legacy", "reason": "host-token", "rule": "FP-SPACE-01", "status": "accepted"},
                    {"value": "44px", "where": "--row", "reason": "host-token", "rule": "FP-SPACE-01", "status": "pending"},
                    {"value": "10px", "where": ".vendor", "reason": "platform", "rule": "FP-SPACE-01", "status": "accepted"}])
vec("05-roles-and-exceptions", "Overlay tests resolved values. A host token that resolves to a rung passes; an icon-role token is not tested; a host token that is not a rung fails unless it is a declared exception (addressed by token or by selector). A pending exception makes the run pending when nothing else fails; here .b fails outright.", {"input.css": css}, c, lengths_expected({"input.css": css}, c))

G4 = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128]
UNDECLARED = []
def tokens_css(toks): return ":root {\n" + "".join(f"  {n}: {v}px;\n" for n, v in toks) + "}\n"
toks = [(f"--space-{v}", v) for v in G4] + [("--radius-sm", 4), ("--radius-md", 6), ("--radius-lg", 12), ("--radius-xl", 16), ("--radius-2xl", 32)]
for nm, u, about in (("06-snap-u1", 1, "A 4-based scale at u = 1: nearest rung, ties go up (4 → 5), drift at most 25%, merges listed. Radii map to the radius set; 32 is over 25% from 21 and is not snapped."),
                     ("07-snap-u4", 4, "The same scale at u = 4: 2 is a sub-unit value and is kept; 6 drifts 33% and is not snapped; 16 is a tie between 12 and 20 and goes up.")):
    c0 = cfg(mode="snap", unit=u, snap={"source": ["input.css"]})
    kept = [r for r in snap_table(toks, c0)[0] if r.get("snapped") is None]
    c = dict(c0, exceptions=[{"value": f"{r['original']}px", "where": r["token"], "reason": "snap-drift", "rule": "FP-SNAP-03", "status": "accepted"} for r in kept])
    vec(nm, about + " The values that cannot be snapped are declared as accepted snap-drift exceptions, so the run passes.", {"input.css": tokens_css(toks)}, c, snap_expected(toks, c))
    UNDECLARED.append((nm, about, c0))

toks_g4 = toks
toks = [("--control-sm", 32), ("--control-md", 40), ("--control-lg", 44), ("--control-xl", 64), ("--button-drawn", 40), ("--space-36", 36), ("--icon-md", 16)]
c = cfg(mode="snap", snap={"source": ["input.css"]}, has=dict(HASN, controls=True),
        roles=[{"match": "--control-*", "role": "target"}, {"match": "--button-drawn", "role": "drawn"}, {"match": "--icon-*", "role": "icon"}])
G4TOKS = list(toks_g4)
rows, merges = snap_table(toks, c)
vec("08-snap-targets", "Target tokens end at no less than max(original, ladder target) and have no drift limit: 32, 40 and 44 become 55; 64 may stay or become 89. A drawn-role token and an icon-role token are unchanged. The three targets that end at 55 are listed as a merged group (FP-SNAP-06). Order is kept within a role group only: target 32 → 55 beside spacing 36 → 34 is not a breach.",
    {"input.css": tokens_css(toks)}, c, {"result": "pass", "mapping": rows, "merges": merges, "orderBreaches": []})
c2 = dict(c, pointer="fine", pointerReason="Desktop application; no touch input is supported.")
rows, merges = snap_table(toks, c2)
vec("09-snap-targets-fine", "The same tokens with pointer: fine declared. The ladder target is 34, so 32 becomes 34, 40 and 44 become 55 (the smallest rung at or above the original), and 64 may stay.",
    {"input.css": tokens_css(toks)}, c2, {"result": "pass", "mapping": rows, "merges": merges, "orderBreaches": []})

toks = [("--space-12", 12), ("--space-16", 16), ("--space-20", 20), ("--space-24", 24)]
c = cfg(mode="snap", snap={"source": ["input.css"], "overrides": [
    {"token": "--space-16", "to": 21, "reason": "Card padding must stay larger than the 12 gap."},
    {"token": "--space-24", "to": 34, "reason": "Section padding must stay larger than card padding."},
    {"token": "--space-20", "to": 13, "reason": "Deliberately breaks order, for the test."}]})
ov, order, final = check_overrides(toks, c)
vec("10-snap-overrides", "Overrides: 16 → 21 (31.3%) passes; 24 → 34 (41.7%) is over 38.2% and fails, so 24 stays at its nearest rung; 20 → 13 (35%) is within the limit but breaks order against 16 → 21, which fails FP-SNAP-05.",
    {"input.css": tokens_css(toks)}, c, {"result": "fail", "overrides": ov, "orderBreaches": order, "final": final})

css = """:root { --fp-type-micro: 0.6875rem; }
body { font-size: 1rem; line-height: 1.618; }
.small { font-size: 0.8125rem; line-height: 1.382; }
.h3 { font-size: 1.25rem; line-height: 1.236; }
.h3-fib { font-size: 1.3125rem; line-height: 1.236; }
.h1 { font-size: 2.625rem; line-height: 1.146; }
.display { font-size: 4.25rem; line-height: 1.146; }
.meta { font-size: var(--fp-type-micro); line-height: 1.382; }
.bad-size { font-size: 0.875rem; line-height: 1.382; }
.bad-unit { font-size: 16px; line-height: 1.5; }
.bad-bare-micro { font-size: 0.6875rem; line-height: 1.382; }
.bad-leading { font-size: 1.25rem; line-height: 1.618; }
.bad-fixed { font-size: 1rem; line-height: 24px; }
.bad-missing { font-size: 1rem; }
.bad-odd-step { font-size: 3.3125rem; line-height: 1.146; }
"""
for nm, al, about in (("11-type-scale-formula", "formula", "Type sizes by formula from body 16. 20 is a step and 21 is not. Micro passes only through its token. A px size, a fixed or missing line height, 1.618 on a heading, fail; the unused odd step 5 (53) fails the step-range rule (FP-TYPE-02), not the scale rule."),
                      ("12-type-scale-fibonacci", "fibonacci", "The same input with type.align: fibonacci. Now 21 is the step, and 20, the value it replaced, fails the alignment rule (FP-TYPE-03). 53 still fails the step-range rule.")):
    c = cfg(level="FP-2", type={"body": 16, "align": al})
    f = check_type({"input.css": css}, c)
    vec(nm, about, {"input.css": css}, c, {"result": "fail" if f else "pass", "findings": f})

css = ":root { --ink: #1a1a1a; --ground: #ffffff; --muted-ok: #767676; --muted-bad: #777777; --edge-ok: #949494; --edge-bad: #959595; --large: #949494; }\n"
c = cfg(pairs=[{"fg": "--ink", "bg": "--ground", "kind": "text"}, {"fg": "--muted-ok", "bg": "--ground", "kind": "text"},
               {"fg": "--muted-bad", "bg": "--ground", "kind": "text"}, {"fg": "--edge-ok", "bg": "--ground", "kind": "mark"},
               {"fg": "--edge-bad", "bg": "--ground", "kind": "mark"}, {"fg": "--large", "bg": "--ground", "kind": "large-text"}])
p = check_contrast({"input.css": css}, c)
vec("13-contrast", "Contrast on declared pairs, never rounded: #767676 on white passes for text and #777777 does not; #949494 passes at 3:1 and #959595 does not. Ratios are shown truncated to three decimals.",
    {"input.css": css}, c, {"result": "fail" if any(x["result"] == "fail" for x in p) else "pass", "pairs": p})

css = """.card { padding: 21px; transition: opacity 144ms; }
button:focus-visible { outline-width: 3px; outline-offset: 2px; }
"""
c = cfg(); f = check_has({"input.css": css}, c)
vec("14-na-contradiction", "has.motion and has.controls are declared false, but the scope has a transition and a button selector. FP-CONF-11 fails twice: a rule may not be marked n/a when its condition is true.",
    {"input.css": css}, c, {"result": "fail", "findings": f})
c = cfg(has=dict(HASN, motion=True, controls=True)); f = check_has({"input.css": css}, c)
vec("15-na-consistent", "The same input with has.motion and has.controls declared true. No contradiction.", {"input.css": css}, c, {"result": "pass", "findings": f})

files = {"src/card.css": ".card { padding: 21px; gap: 8px; border-radius: 13px; }\n.card-title { margin-bottom: 13px; }\n",
         "src/legacy.css": ".table { padding: 12px 16px; margin: 24px; }\n.row { height: 40px; gap: 10px; }\n"}
c = cfg(mode="overlay", source=["src/**/*.css"], scope=["src/card.css"])
fs, n_scope = check_lengths({"src/card.css": files["src/card.css"]}, c)
_, n_all = check_lengths(files, c)
vec("16-overlay-coverage", "Overlay: only the scope is tested. Coverage is the checked values in the scope divided by those in the whole source, counted after shorthand expansion (padding: 21px is four values, gap: 8px is two). The legacy file is outside the scope and is not flagged.",
    files, c, {"result": "pass", "findings": fs, "coverage": {"inScope": n_scope, "inSource": n_all, "percent": math.floor(Fraction(n_scope * 100, n_all) + Fraction(1, 2))},
               "claim": f"FP-1 · Overlay · u=1 · web · scope src/card.css · coverage {math.floor(Fraction(n_scope * 100, n_all) + Fraction(1, 2))}% · exceptions 0 · spec {VER} · self-assessed"})

for i, (nm, about, c0) in enumerate(UNDECLARED):
    vec(f"{17 + i}-{nm[3:]}-undeclared", "The twin of " + nm + " with no exceptions declared. The values that cannot be snapped are kept without a snap-drift exception, which fails FP-SNAP-10.",
        {"input.css": tokens_css(G4TOKS)}, c0, snap_expected(G4TOKS, c0))

# ---------- write ----------
index = []
for name, about, files, config, expected in V:
    d = os.path.join(OUT, name)
    for fn, text in files.items():
        p = os.path.join(d, fn); os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w", encoding="utf-8").write(text)
    open(os.path.join(d, "fp.config.json"), "w", encoding="utf-8").write(json.dumps(config, indent=2, ensure_ascii=False) + "\n")
    exp = {"vector": name, "spec": VER, "about": about}; exp.update(expected)
    open(os.path.join(d, "expected.json"), "w", encoding="utf-8").write(json.dumps(exp, indent=2, ensure_ascii=False) + "\n")
    index.append({"vector": name, "about": about, "result": expected["result"], "inputs": sorted(files), "config": "fp.config.json", "expected": "expected.json"})
open(os.path.join(OUT, "index.json"), "w", encoding="utf-8").write(json.dumps({"name": NAME, "version": VER, "license": "MIT", "homepage": HOME, "vectors": index}, indent=2, ensure_ascii=False) + "\n")
rows = "\n".join(f"| [{i['vector']}]({i['vector']}/) | {i['result']} | {i['about']} |" for i in index)
open(os.path.join(OUT, "README.md"), "w", encoding="utf-8").write(f"""# Test vectors

*{NAME} · version {VER} · MIT License · [www.lyrikai.com]({HOME})* · [Index](../index.md)

Each folder holds one case: the input files, an `fp.config.json` that validates against [fp.config.schema.json](../fp.config.schema.json), and `expected.json`, the result a conforming checker gives. [index.json](index.json) lists them.

The expected results are computed from the rule text by a small reference script, not by a published checker. They cover the core machine tests: lengths on the ladder at u = 1 and u = 4, the derived patterns, roles and exceptions, Snap mapping (ties, merges, drift, targets, overrides, order), the type scale in both alignments, contrast on declared pairs, the `n/a` contradiction test and Overlay coverage. They do not yet cover shorthand edge cases, `@media` blocks, themes, or the self-report rules.

A finding identifies a declaration by file, selector, property and value, once per written value. `checkedValues` and coverage count longhand values after shorthand expansion (FP-MODE-05). Drift is exact when compared with a limit and is shown rounded half-up to one decimal place. A `result` of `exception` means a declared, accepted exception covered the value; `pending` means a pending one did.

| Vector | Expected result | What it shows |
|---|---|---|
{rows}

---

{NAME} · version {VER} · MIT License · [www.lyrikai.com]({HOME})
""")
print(len(V), "vectors")
