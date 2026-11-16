// Which rules apply (FP-CONF-11) and the per-rule result table.

/** Machine checks this checker implements. A machine rule whose check is not here is reported `not-run`. */
export const IMPLEMENTED = new Set([
  'math.ladder', 'math.unit', 'math.unit-profile', 'math.fixed-detail', 'math.rounding', 'math.zero-negative',
  'mode.config-present', 'mode.config-schema', 'mode.single', 'mode.roles', 'mode.level-ceiling',
  'mode.overlay-resolved', 'mode.overlay-coverage', 'mode.native',
  'snap.exempt-by-role', 'snap.nearest', 'snap.drift', 'snap.unsnappable', 'snap.target-up', 'snap.control-height',
  'snap.monotonic', 'snap.merge-listed', 'snap.override', 'snap.level-cap',
  'conf.claim-format', 'conf.v1-levels', 'conf.no-pending', 'conf.not-run', 'conf.not-applicable',
  'a11y.contrast', 'a11y.contrast-exact', 'a11y.body-anchor', 'a11y.min-text',
  'space.on-ladder', 'space.derived', 'space.exceptions', 'radius.set', 'radius.pill-round',
  'type.scale', 'type.step-range', 'type.align', 'type.units', 'type.micro', 'type.leading', 'type.leading-unitless',
  'type.leading-declared', 'type.measure-max', 'layout.phi-split', 'layout.container-widths',
  'plat.web-units', 'plat.web-tokens', 'plat.web-pointer',
  'token.dtcg', 'token.types', 'token.names', 'token.master-unit', 'token.themes', 'token.extensions', 'token.root-metadata', 'token.type-rem',
  'honest.banned-words', 'honest.claim-wording',
]);

/** Checks whose result is the roll-up of other checks' findings. */
const ALIAS = {
  'math.ladder': ['space.on-ladder'],
  'space.exceptions': ['space.on-ladder', 'radius.set', 'math.fixed-detail'],
  'mode.overlay-resolved': ['space.on-ladder', 'radius.set', 'math.fixed-detail'],
  'mode.native': ['space.on-ladder', 'radius.set', 'math.fixed-detail'],
  'mode.level-ceiling': ['a11y.body-anchor'],
  'conf.v1-levels': [], 'conf.claim-format': [], 'conf.not-run': [], 'honest.claim-wording': [],
};

const FLAG = { 'has: time limits': 'timeLimits', 'has: generated art': 'generatedArt' };

export function applicability(rule, ctx) {
  const { config } = ctx;
  const na = (reason) => ({ applies: false, reason });
  if (rule.test?.check === 'conf.not-applicable') return { applies: true };
  const w = rule.appliesWhen.trim();
  let cond = null;
  if (w === 'always' || w === 'the report') cond = { applies: true };
  else if (w === 'a checker' || w === 'the specification') cond = na(`binds ${w === 'a checker' ? 'a checker' : 'the specification'}, not an adopter's system; not part of a run`);
  else if (w.startsWith('mode:')) {
    const modes = w.slice(5).split(/\s+or\s+/).map((s) => s.trim());
    cond = modes.includes(config.mode) ? { applies: true } : na(`mode is ${config.mode}`);
  } else if (w.startsWith('platform:')) {
    const ps = w.slice(9).split(/\s+or\s+/).map((s) => s.trim());
    cond = ps.includes(config.platform) ? { applies: true } : na(`platform is ${config.platform}`);
  } else if (w.startsWith('has:')) {
    const key = FLAG[w] ?? w.slice(4).trim();
    cond = config.has?.[key] === true ? { applies: true } : na(`no ${{ motion: 'motion', controls: 'controls', charts: 'charts', states: 'state indicators', timeLimits: 'time limits', generatedArt: 'generated art' }[key] ?? key}`);
  } else if (w === 'protocol-owned type') {
    cond = config.level === 'FP-2' || config.mode === 'native' ? { applies: true } : na('host type is not tested at FP-1');
  } else if (w === 'protocol token files') {
    cond = ctx.tokenFiles > 0 || config.mode === 'native' ? { applies: true } : na('no protocol token files in the scope');
  } else cond = { applies: true };
  if (!cond.applies) return cond;

  if (rule.level === 'Agent') return na('agent conformance is separate and is not part of a system claim (FP-CONF-12)');
  if (['FP-3', 'FP-4a', 'FP-4b'].includes(rule.level)) return na(`${rule.level} cannot be claimed in version 1.0 (FP-CONF-05)`);
  if (rule.level === 'FP-2' && config.level !== 'FP-2') return na('claim is FP-1: FP-2 rules do not apply');
  if (rule.status === 'informative') return na('informative: binds no claim in version 1.0');
  return { applies: true };
}

export function rollup(rules, ctx, checkRes) {
  const out = [];
  for (const rule of rules) {
    const base = { id: rule.id, check: rule.test.check, kind: rule.test.kind, level: rule.level, status: rule.status };
    const a = applicability(rule, ctx);
    if (!a.applies) { out.push({ ...base, result: 'n/a', reason: a.reason }); continue; }
    if (rule.test.kind === 'self-report') { out.push({ ...base, result: 'self-report', reason: 'needs evidence from the adopter (FP-CONF-06)' }); continue; }
    const check = rule.test.check;
    if (ctx.invalidConfig && check !== 'mode.config-schema' && check !== 'mode.config-present') { out.push({ ...base, result: 'not-run', reason: 'the configuration is invalid' }); continue; }
    if (!IMPLEMENTED.has(check)) { out.push({ ...base, result: 'not-run', reason: 'not implemented by this checker' }); continue; }
    if (rule.appliesWhen === 'protocol token files' && ctx.tokenFiles === 0) { out.push({ ...base, result: 'not-run', reason: 'Native ships token files but none was found in the scope' }); continue; }
    let res = checkRes.get(check);
    let result = res?.result ?? 'pass';
    for (const a2 of ALIAS[check] ?? []) {
      const r2 = checkRes.get(a2);
      if (r2 && ['fail', 'not-run', 'pending'].includes(r2.result)) { result = ['fail', 'not-run', 'pending'].indexOf(r2.result) < ['fail', 'not-run', 'pending'].indexOf(result) || result === 'pass' ? r2.result : result; res = res || r2; }
    }
    out.push({ ...base, result, ...(res?.messages?.length ? { reason: res.messages.join('; ') } : {}) });
  }
  return out;
}
