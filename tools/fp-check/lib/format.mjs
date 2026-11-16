// Human-readable report.
export function formatText(r) {
  const L = [];
  L.push(`fp-check ${r.toolVersion} · spec ${r.spec} · https://www.lyrikai.com`);
  L.push(`config: ${r.config}   mode: ${r.mode}   level: ${r.level}   u=${r.unit}   platform: ${r.platform}`);
  L.push('');
  L.push(`RESULT: ${r.result.toUpperCase()}`);
  if (r.claim) L.push(`CLAIM:  ${r.claim}`);
  else if (r.candidate) { L.push(`CANDIDATE (not a claim): ${r.candidate}`); L.push(`  open: ${r.openItems.join(' ')}`); }
  else if (r.claimNote) L.push(`CLAIM:  none. ${r.claimNote}`);
  if (r.configErrors) { L.push('', 'Configuration problems (FP-MODE-02):'); for (const e of r.configErrors) L.push(`  - ${e}`); }
  if (r.coverage) L.push(`Overlay coverage: ${r.coverage.inScope} of ${r.coverage.inSource} checked values in scope (${r.coverage.percent}%); accepted exceptions used: ${r.exceptionsUsed}`);
  if (r.checkedValues !== undefined) L.push(`Checked values in scope: ${r.checkedValues}`);

  const bad = (r.findings ?? []);
  if (bad.length) {
    L.push('', 'Findings:');
    for (const f of bad) {
      const where = f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : f.token ?? f.has ?? '';
      const what = f.selector !== undefined ? `${f.selector} { ${f.property}: ${f.value} }` : f.token ? `${f.token} = ${f.value}` : f.has ? `has.${f.has}` : '';
      L.push(`  [${f.result}] ${f.rule} ${f.check}  ${where}  ${what}${f.message ? '  - ' + f.message : ''}`);
    }
  }
  if (r.overrides?.some((o) => o.result !== 'pass')) { L.push('', 'Snap overrides:'); for (const o of r.overrides) L.push(`  [${o.result}] ${o.token} ${o.original} -> ${o.to} (${o.drift}%)${o.message ? '  - ' + o.message : ''}`); }
  if (r.orderBreaches?.length) { L.push('', 'Order breaches (FP-SNAP-05):'); for (const b of r.orderBreaches) L.push(`  ${b.tokens.join(' / ')}: ${b.original.join(',')} became ${b.final.join(',')}`); }
  if (r.merges?.length) { L.push('', 'Merged groups (FP-SNAP-06):'); for (const m of r.merges) L.push(`  ${m.role} ${m.rung}: ${m.tokens.join(', ')}`); }
  if (r.pairs?.length) {
    L.push('', 'Contrast (declared pairs):');
    for (const p of r.pairs) L.push(`  [${p.result}] ${p.fg} on ${p.bg} (${p.kind}${p.theme ? ', ' + p.theme : ''}): ${p.ratio ?? 'n/a'} needs ${p.required ?? 'n/a'}${p.message ? '  - ' + p.message : ''}`);
  }
  if (r.rules) {
    const by = (res) => r.rules.filter((x) => x.result === res);
    const machine = r.rules.filter((x) => x.kind === 'machine');
    L.push('', `Rules: ${machine.filter((x) => x.result === 'pass').length} machine pass, ${machine.filter((x) => x.result === 'fail').length} fail, ${machine.filter((x) => x.result === 'pending').length} pending, ${machine.filter((x) => x.result === 'not-run').length} not-run, ${by('n/a').length} n/a, ${by('self-report').length} self-report`);
    for (const x of machine.filter((y) => ['fail', 'pending', 'not-run'].includes(y.result))) L.push(`  [${x.result}] ${x.id} ${x.check}${x.reason ? ' - ' + x.reason : ''}`);
    const sr = by('self-report');
    if (sr.length) {
      L.push('', `Self-report rules that need evidence from people (FP-CONF-06), ${sr.length}:`);
      L.push('  ' + sr.map((x) => x.id).join(' '));
    }
  }
  if (r.notes?.length) { L.push('', 'Notes:'); for (const n of r.notes.slice(0, 20)) L.push(`  - ${n}`); if (r.notes.length > 20) L.push(`  - ... ${r.notes.length - 20} more`); }
  L.push('', 'A passing run is not proof that a product is accessible (FP-CONF-10). Machine tests cannot show target sizes, reflow, colour-only states or pause controls.');
  return L.join('\n');
}
