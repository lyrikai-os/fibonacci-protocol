import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkTree, globToRegExp, normalise } from '../check-public.mjs';

// Every fixture is built at run time from fragments, so this repo holds no literal hits.
const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, '..', 'check-public.mjs');
const SITE = 'https://www.lyrikai.com';
const LICENSE = 'MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy.\n';
const w = (...p) => p.join('');
const CLAUDE = w('claude', '.', 'ai');
const PRIVP = w('/', 'Users', '/me/x');
const BW = w('sac', 'red');
const DENY10 = { denyNames: ['Zebra Crossing', 'Quokka', 'lk-zed', 'Alpha Beta', 'Gamma Delta', 'Epsilon', 'Zeta Eta', 'Theta Iota', 'Kappa Lambda', 'Mu Nu'], denyPrefixes: [] };
const DENY = { denyNames: ['Zebra Crossing', { name: 'Quokka', caseSensitive: true }, 'lk-zed'], denyPrefixes: ['zq-'] };

function mk(files, { license = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'cp-'));
  if (license) writeFileSync(join(dir, 'LICENSE'), LICENSE);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}
function mkRepo(files, { commit = true } = {}) {
  const dir = mk(files);
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t.invalid', ...a], { stdio: 'ignore' });
  git('init', '-q');
  if (commit) { git('add', '-A'); git('commit', '-q', '-m', 'x'); }
  return dir;
}
const doc = (body) => `# T\n\n${SITE}\n${body}\n`;
const kinds = (r) => r.findings.map((f) => f.kind);
const scan = (dir, cfg = {}) => checkTree(dir, { git: false, ...cfg });

test('clean tree passes', () => {
  const r = scan(mk({ 'README.md': doc('Fine text.'), 'a/b.txt': 'nothing\n' }));
  assert.deepEqual(r.findings, []);
});
test('private web-app link flagged with line', () => {
  const r = scan(mk({ 'README.md': doc(`see https://${CLAUDE}/chat/1`) }));
  assert.deepEqual(r.findings.map((f) => [f.kind, f.line]), [['private-link', 4]]);
});
test('path variants: home, tmp, volumes, env vars, tilde, windows', () => {
  const lines = [PRIVP, w('/home', '/me'), w("/private", "/tm", "p/x"), w("/tm", "p/x"), w('/var', '/folders/a'), w('/Vol', 'umes/D'), w('/users', '/me'),
    w('$HO', 'ME/x'), w('${HO', 'ME}/x'), w('%USERPRO', 'FILE%\\x'), w('C:\\', 'Users', '\\me'), w('see ~', '/notes')];
  const r = scan(mk({ 'x.txt': lines.join('\n') + '\n' }));
  assert.deepEqual([...new Set(r.findings.map((f) => f.line))], lines.map((_, i) => i + 1));
});
test('false positives avoided: install paths, site-relative links, word-glued paths', () => {
  const r = scan(mk({ 'x.txt': [w('~', '/.claude/skills'), w('~', '/.cursor/x'), w('~', '/.codex/x'), w('~', '/.agents/x'), w('[Home](/ho', 'me/)'), w('href="/ho', 'me/"'), w('https://example.com/', 'home/page')].join('\n') + '\n' }));
  assert.deepEqual(r.findings, []);
});
test('encoded variants are caught', () => {
  const variants = [w('/Us', '%65rs/me'), w('%2F', 'Users', '%2Fme'), w('&#47;', 'Users/me'), w(CLAUDE.replace('.', '&#46;')), w(CLAUDE.replace('.', '%2E')), w(CLAUDE.replace('.', '\\u002e')), w('https:\\/\\/', CLAUDE)];
  variants.forEach((v) => assert.ok(scan(mk({ 'x.txt': `${v}\n` })).findings.length > 0, v));
  assert.equal(normalise(w('a%2Eb')), 'a.b');
});
test('every match on a line is reported, not just the first', () => {
  const r = scan(mk({ 'x.txt': `${PRIVP} and https://${CLAUDE}/a\n` }));
  assert.equal(r.findings.filter((f) => f.kind === 'private-link').length, 2);
});
test('deny list: names joined by space/dash/underscore, case rules, prefixes, no duplicates', () => {
  const r = scan(mk({ 'x.txt': ['zebra crossing', 'Zebra-Crossing', 'ZEBRA_CROSSING', 'Quokka', 'quokka island', 'lk-zed and lk_zed', 'class zq-btn', 'zq alone', 'zebrafish'].join('\n') + '\n' }), DENY);
  assert.deepEqual(r.findings.map((f) => f.line), [1, 2, 3, 4, 6, 7]);
  assert.ok(r.findings.every((f) => !/zebra|quokka/i.test(f.message)), 'messages must not echo deny names');
});
test('no deny list means no name findings (defaults are empty)', () => {
  assert.deepEqual(scan(mk({ 'x.txt': 'Zebra Crossing\n' })).findings, []);
});
test('secrets: many shapes, never echoed', () => {
  const lines = [w('AK', 'IA', 'ABCDEFGHIJKLMNOP'), w('AS', 'IA', 'ABCDEFGHIJKLMNOP'), w('"api', '_key": "x"'), w('aws_secret', '_access_key_id'), w('sk-', 'ant-', 'abcdefghijkl'), w('sk-', 'proj-', 'abcdefghijkl'),
    w('xo', 'xb-', '1234567890'), w('sk_', 'live_', 'abcdefghijkl'), w('pass', 'word=hunter22'), w('ey', 'JhbGciOiJIUzI1NiJ9.', 'ey', 'JzdWIiOiIxMjM0NTY3ODkwIn0.sig'),
    w('-----BEGIN ', 'RSA PRIVATE KEY-----'), w('gh', 'p_', 'a'.repeat(36)), w('github_', 'pat_', 'B'.repeat(30))];
  const r = scan(mk({ 'x.txt': lines.join('\n') + '\n', '.env': 'A=1\n', '.env.example': 'A=\n' }));
  assert.deepEqual([...new Set(r.findings.filter((f) => f.path === 'x.txt').map((f) => f.line))], lines.map((_, i) => i + 1));
  assert.equal(r.findings.filter((f) => f.path === '.env').length, 1);
  assert.equal(r.findings.filter((f) => f.path === '.env.example').length, 0);
  assert.ok(r.findings.every((f) => !/hunter22|abcdefghijkl/.test(f.message)));
});
test('markers and "contested" never silence links, paths, secrets or names', () => {
  const r = scan(mk({ 'README.md': doc(`<!-- check-public: allow-banned -->\n<!-- check-public: ignore-file -->\n<!-- check-public: ignore-line --> contested ${PRIVP} https://${CLAUDE}/x ${w('gh', 'p_', 'a'.repeat(36))} Zebra Crossing`) }), DENY);
  assert.deepEqual([...new Set(kinds(r))].sort(), ['in-house-name', 'private-link', 'secret']);
});
test('allow entries: scoped to path and exact string; sha pins the line', () => {
  const line = `see ${PRIVP}`;
  const dir = mk({ 'a.txt': `${line}\n`, 'b.txt': `${line}\n` });
  const sha256 = createHash('sha256').update(line).digest('hex');
  const r = scan(dir, { allow: [{ path: 'a.txt', string: PRIVP }] });
  assert.deepEqual(r.findings.map((f) => f.path), ['b.txt']);
  assert.equal(scan(dir, { allow: [{ path: '*.txt', string: PRIVP, lineSha256: sha256 }] }).findings.length, 0);
  assert.equal(scan(dir, { allow: [{ path: '*.txt', string: PRIVP, lineSha256: 'deadbeef' }] }).findings.length, 2);
  assert.equal(scan(dir, { allow: [{ path: '', string: '' }] }).findings.length, 2); // empty placeholder does nothing
  assert.equal(scan(dir, { allow: [{ path: 'a.txt', string: 'me' }] }).findings.length, 2); // must enclose the match
});
test('banned claims: all words, perfect fourth exception, other file types', () => {
  const words = ['sacred', 'divine', 'perfect', 'magic', "nature's code", 'universal law', 'most beautiful', 'scientifically proven'];
  const r = scan(mk({ 'a.md': words.map((x) => `It is ${x}.`).join('\n') + `\n${SITE}\n` }));
  assert.equal(r.findings.filter((f) => f.kind === 'banned-claim').length, words.length);
  assert.deepEqual(scan(mk({ 'a.md': `${SITE}\nA perfect fourth and a perfect fifth.\n` })).findings, []);
  const files = scan(mk({ 'a.html': `<p>${BW}</p>`, 'a.svg': `<desc>${BW}</desc>`, 'a.json': `{\n "$description": "${BW}",\n "name": "${BW}"\n}\n`, 'a.mjs': `const x = 1; // ${BW}\n/* ${BW}\n ${BW} */\nconst ${BW} = 1;\n`, 'a.txt': `${BW}\n` }));
  const got = files.findings.filter((f) => f.kind === 'banned-claim').map((f) => `${f.path}:${f.line}`);
  assert.deepEqual(got, ['a.html:1', 'a.json:2', 'a.mjs:1', 'a.mjs:2', 'a.mjs:3', 'a.svg:1']);
});
test('banned-claim escapes: contested sentence, marker, MUST NOT describe, do-not-claim list; but not "never claim much"', () => {
  const md = [SITE, `${BW} is contested.`, '<!-- check-public: allow-banned -->', 'divine', `It MUST NOT describe a design as: ${BW}, divine, perfect, or magic.`, 'Do not claim:', `- ${BW}`, '- divine', '', 'We never claim much, but it is divine.', `This is ${BW}. Others call it contested.`].join('\n');
  const r = scan(mk({ 'a.md': md }));
  assert.deepEqual(r.findings.map((f) => f.line), [10, 11]);
});
test('required link: exact url, not a lookalike host; README.MD and .mdx covered; SKILL.md covered', () => {
  const r = scan(mk({ 'a.md': 'https://www.lyrikai.com.evil.example/\n', 'B.MD': 'none\n', 'c.mdx': 'none\n', 'skills/SKILL.md': 'none\n', 'ok.md': `${SITE}/path\n` }));
  assert.deepEqual(r.findings.filter((f) => f.kind === 'missing-link').map((f) => f.path).sort(), ['B.MD', 'a.md', 'c.mdx', 'skills/SKILL.md']);
  assert.deepEqual(scan(mk({ 'x.md': 'none\n' }), { requireLinkIn: [] }).findings, []);
});
test('license: root only, must start with MIT License and have the permission sentence', () => {
  assert.deepEqual(kinds(scan(mk({ 'x.txt': 'hi\n' }, { license: false }))), ['license']);
  const parentOnly = mk({ 'sub/x.txt': 'hi\n' });
  assert.deepEqual(kinds(scan(join(parentOnly, 'sub'))), ['license']);
  assert.deepEqual(kinds(scan(mk({ 'LICENSE': 'See the MIT License somewhere\n' }, { license: false }))), ['license']);
  assert.deepEqual(kinds(scan(mk({ 'LICENSE': 'MIT License\nnothing else\n' }, { license: false }))), ['license']);
  assert.deepEqual(scan(mk({ 'x.txt': 'hi\n' }), { requireLicense: false }).findings, []);
});
test('binary files are scanned for strings; big files stream; unreadable and symlinks are reported', () => {
  const dir = mk({});
  writeFileSync(join(dir, 'bin.dat'), Buffer.concat([Buffer.from([0, 1, 2, 0]), Buffer.from(`xx ${PRIVP} yy`), Buffer.from([0, 0])]));
  writeFileSync(join(dir, 'big.txt'), 'a\n'.repeat(3_000_000) + `${PRIVP}\n`);
  writeFileSync(join(dir, 'locked.txt'), 'x\n');
  chmodSync(join(dir, 'locked.txt'), 0);
  symlinkSync(w('/etc', '/hosts'), join(dir, 'link'));
  const r = scan(dir);
  const by = (k) => r.findings.filter((f) => f.kind === k).map((f) => f.path);
  assert.deepEqual(by("private-link").sort(), ["big.txt", "bin.dat"]);
  assert.equal(r.findings.find((f) => f.path === 'big.txt').line, 3_000_001);
  assert.deepEqual(by('symlink'), ['link']);
  if (process.getuid && process.getuid() !== 0) assert.deepEqual(by('unscannable'), ['locked.txt']);
});
test('git mode lists tracked and untracked files, skips ignored; walk mode skips .git and node_modules', () => {
  const dir = mk({ '.gitignore': 'ignored.txt\n', 'ignored.txt': `${PRIVP}\n`, 'seen.txt': `${PRIVP}\n`, 'node_modules/p/i.txt': `${PRIVP}\n` });
  execFileSync('git', ['-C', dir, 'init', '-q']);
  const g = checkTree(dir, { git: true });
  assert.equal(g.mode, 'git');
  assert.deepEqual(g.findings.map((f) => f.path).sort(), ['node_modules/p/i.txt', 'seen.txt']);
  assert.equal(checkTree(dir).mode, 'git'); // auto
  const wk = checkTree(dir, { git: false });
  assert.equal(wk.mode, 'walk');
  assert.deepEqual(wk.findings.map((f) => f.path).sort(), ['ignored.txt', 'seen.txt']);
});
test('ignorePaths and globs', () => {
  assert.ok(globToRegExp('**/*.md').test('a/b/c.md'));
  assert.ok(globToRegExp('**/*.md').test('c.MD'));
  assert.ok(!globToRegExp('a/*.md').test('a/b/c.md'));
  assert.deepEqual(scan(mk({ 'skip/x.txt': `${PRIVP}\n` }), { ignorePaths: ['skip/**'] }).findings, []);
});
test('CLI: output format, json, exit codes, release needs a full --deny', () => {
  const dir = mk({ 'README.md': doc(`link https://${CLAUDE}/x`) });
  const bad = spawnSync(process.execPath, [CLI, dir, '--no-git'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^README\.md:4: \[private-link\] /m);
  const rel = spawnSync(process.execPath, [CLI, dir, '--release'], { encoding: 'utf8' });
  assert.equal(rel.status, 2);
  assert.match(rel.stderr, /--release needs --deny/);
  const small = join(tmpdir(), `deny-small-${process.pid}.json`);
  writeFileSync(small, JSON.stringify(DENY));
  const sha1 = createHash('sha256').update(JSON.stringify(DENY)).digest('hex');
  const r2 = spawnSync(process.execPath, [CLI, dir, '--release', '--deny', small, '--deny-sha256', sha1], { encoding: 'utf8' });
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /at least 10 names/);
  const full = join(tmpdir(), `deny-full-${process.pid}.json`);
  writeFileSync(full, JSON.stringify(DENY10));
  const repo = mkRepo({ 'README.md': doc(`link https://${CLAUDE}/x`) });
  const shaFull = createHash('sha256').update(JSON.stringify(DENY10)).digest('hex');
  const noSha = spawnSync(process.execPath, [CLI, repo, '--release', '--deny', full], { encoding: 'utf8' });
  assert.equal(noSha.status, 2);
  assert.match(noSha.stderr, /--deny-sha256/);
  const wrong = spawnSync(process.execPath, [CLI, repo, '--release', '--deny', full, '--deny-sha256', 'a'.repeat(64)], { encoding: 'utf8' });
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /does not match/);
  assert.equal(spawnSync(process.execPath, [CLI, repo, '--release', '--deny', full, '--deny-sha256', 'zz'], { encoding: 'utf8' }).status, 2);
  const r3 = spawnSync(process.execPath, [CLI, repo, '--release', '--deny', full, '--deny-sha256', shaFull, '--json'], { encoding: 'utf8' });
  assert.equal(r3.status, 1);
  const j = JSON.parse(r3.stdout);
  assert.equal(j.findings[0].kind, 'private-link');
  assert.match(j.mode, /release/);
  const ok = spawnSync(process.execPath, [CLI, mk({ 'README.md': doc('fine') }), '--no-git'], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.equal(spawnSync(process.execPath, [CLI], { encoding: 'utf8' }).status, 2);
});
test('self scan of this tool folder passes with no markers (walk and git modes)', () => {
  const root = join(HERE, '..');
  for (const mode of ['--no-git', '--git']) {
    const r = spawnSync(process.execPath, [CLI, root, '--allow', join(root, 'allow.json'), mode], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout);
  }
});

// ---- round 2 fixes ----
const sha256 = (t) => createHash('sha256').update(t).digest('hex');

test('N1: only the Linux-home route shape is exempt as a link; local paths in links never are', () => {
  const r = scan(mk({ 'x.txt': [w('[a](/Us', 'ers/me/x)'), w('href="/Us', 'ers/me"'), w('src="/tm', 'p/x"'), w('[b](/private', '/tm', 'p/x)'), w('[Home](/home', '/)'), w('href="/home', '/"')].join('\n') + '\n' }));
  assert.deepEqual([...new Set(r.findings.map((f) => f.line))], [1, 2, 3, 4]);
});
test('N2: release exemptions need literal root-anchored path, lineSha256 and a non-weak string; ignorePaths refused', () => {
  const line = `see ${PRIVP}`;
  const repo = mkRepo({ 'a.txt': `${line}\n`, 'docs/b.txt': 'x\n' });
  const good = { path: 'a.txt', string: line, lineSha256: sha256(line) };
  assert.equal(checkTree(repo, { release: true, allow: [good] }).findings.length, 0);
  for (const bad of [{ ...good, path: '*.txt' }, { ...good, path: 'a.txt', lineSha256: undefined }, { ...good, path: '/a.txt' }, { ...good, path: '../a.txt' },
    { ...good, string: w('/Us', 'ers/') }, { ...good, string: 'example.com' }, { ...good, string: w('sk-', 'ant-') }, { ...good, string: w('gh', 'p_') }]) {
    assert.throws(() => checkTree(repo, { release: true, allow: [bad] }), /rejected/, JSON.stringify(bad));
  }
  assert.throws(() => checkTree(repo, { release: true, ignorePaths: ['docs/**'] }), /ignorePaths/);
  assert.equal(checkTree(repo, { release: true, allow: [{ path: '', string: '' }] }).findings.length, 1); // placeholder inert
  assert.equal(checkTree(repo, { release: true, allow: [{ ...good, lineSha256: 'f'.repeat(64) }] }).findings.length, 1); // wrong sha
});
test('N3: release reads the git index, needs git, fails on dirty or untracked', () => {
  const repo = mkRepo({ 'a.txt': `${PRIVP}\n` });
  const r = checkTree(repo, { release: true });
  assert.equal(r.mode, 'release (git index)');
  assert.equal(r.findings.filter((f) => f.kind === 'private-link').length, 1);
  writeFileSync(join(repo, 'a.txt'), 'changed\n');
  assert.throws(() => checkTree(repo, { release: true }), /dirty/);
  execFileSync('git', ['-C', repo, 'checkout', '-q', 'a.txt']);
  writeFileSync(join(repo, 'new.txt'), 'x\n');
  assert.throws(() => checkTree(repo, { release: true }), /dirty/);
  assert.throws(() => checkTree(mk({ 'a.txt': 'x\n' }), { release: true }), /git work tree/);
});
test('N4: file names are scanned', () => {
  const r = scan(mk({ [w('notes-', CLAUDE, '.txt')]: 'x\n', [w('a-', 'Users', '-zzuser1-b.txt')]: 'x\n' }), { denyNames: ['zzuser1'] });
  assert.deepEqual(r.findings.map((f) => [f.kind, f.line]).sort(), [['in-house-name', 1], ['private-link', 1]]);
  assert.ok(r.findings.every((f) => /file name/.test(f.message)));
});
test('N5: deny names inside path-like tokens (machine user name)', () => {
  const r = scan(mk({ 'x.txt': [w('-Us', 'ers-zzuser1-proj'), w('/x/', 'zzuser1/y'), 'zzuser10'].join('\n') + '\n' }), { denyNames: ['zzuser1'] });
  assert.deepEqual(r.findings.map((f) => f.line), [1, 2]);
});
test('N6: negation escape is limited to the same sentence after the verb', () => {
  const md = [SITE, 'We must not describe it, and it is sacred.', 'We never claim it. It is sacred as can be.', 'We must not describe it as: sacred.', 'We never claim much, but note this is not a long header sentence that goes on and on and on: ', '- sacred', 'We never claim:', '- magic'].join('\n');
  const r = scan(mk({ 'a.md': md }));
  assert.deepEqual(r.findings.map((f) => f.line), [2, 3, 6]);
});
test('N7: home-relative install paths with parent steps are flagged', () => {
  const r = scan(mk({ 'x.txt': [w('~', '/.claude/x'), w('~', '/.claude/../x'), w('~', '/.cursor/a/../../b'), w('"~', '/.agents/ok"')].join('\n') + '\n' }));
  assert.deepEqual(r.findings.map((f) => f.line), [2, 3]);
});
test('N8: documentation placeholders are not password findings; real values are', () => {
  const lines = [w('pass', 'word: <your-password>'), w('pass', 'word=${DB_PASS}'), w('pass', 'word: changeme'), w('pass', 'word: ********'), w('pass', 'word: xxxxxx'), w('pass', 'word=hunter22'), w('"pass', 'word": "s3cretvalue"')];
  assert.deepEqual(scan(mk({ 'x.txt': lines.join('\n') + '\n' })).findings.map((f) => f.line), [6, 7]);
});
test('M2: UTF-16 text (BOM LE, BOM BE, no BOM) and UTF-16 strings in binaries are scanned', () => {
  const dir = mk({});
  const text = `line one\n${PRIVP}\n`;
  writeFileSync(join(dir, 'le.txt'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]));
  const be = Buffer.from(text, 'utf16le'); be.swap16();
  writeFileSync(join(dir, 'be.txt'), Buffer.concat([Buffer.from([0xfe, 0xff]), be]));
  writeFileSync(join(dir, 'nobom.txt'), Buffer.from(text, 'utf16le'));
  writeFileSync(join(dir, 'blob.bin'), Buffer.concat([Buffer.from([1, 0, 2, 255, 0]), Buffer.from(`aa ${PRIVP} bb`, 'utf16le'), Buffer.from([0, 9])]));
  const r = scan(dir);
  assert.deepEqual(r.findings.filter((f) => f.kind === 'private-link').map((f) => `${f.path}:${f.line}`).sort(), ['be.txt:2', 'blob.bin:1', 'le.txt:2', 'nobom.txt:2']);
});
test('M3: hex escapes, braced unicode escapes and string concatenation', () => {
  const dir = mk({ 'x.js': [w(CLAUDE.replace('.', '\\x2e')), w(CLAUDE.replace('.', '\\u{2e}')), w("var a = '/Us", "' + 'ers/me';"), w('var b = "https://cla', '" + "ude.ai/x";')].join('\n') + '\n' });
  assert.deepEqual([...new Set(scan(dir).findings.map((f) => f.line))], [1, 2, 3, 4]);
});
test('prefix context: hyphenated prose is fine; token contexts are flagged', () => {
  const deny = { denyPrefixes: ['zq-', { prefix: 'ww-', anywhere: true }] };
  const lines = ['an zq-hoc plan', 'use zq-extra here', '.zq-btn {}', '"zq-token"', '--zq-color: red', '<div class="a zq-b">', "'zq-x'", 'plain ww-thing', '#zq-id'];
  assert.deepEqual(scan(mk({ 'x.txt': lines.join('\n') + '\n' }), deny).findings.map((f) => f.line), [3, 4, 5, 6, 7, 8, 9]);
});

// ---- round 3 fixes ----
test('R1: a name split across a line break is caught and reported on its first line', () => {
  const r = scan(mk({ 'x.txt': 'ok\nZebra\nCrossing here\nlk-\nzed\nZebra-\nCrossing\nQuokk\nplain\n' }), DENY);
  assert.deepEqual(r.findings.map((f) => f.line), [2, 4, 6]);
  assert.ok(r.findings.every((f) => /line break/.test(f.message)));
  assert.deepEqual(scan(mk({ 'x.txt': 'Zebra\n\nCrossing\n' }), DENY).findings, []); // a blank line between is not a join
});
test('R3: case-sensitive entries also match Title and UPPER case; lowercase stays free; format characters are stripped', () => {
  const lines = ['Quokka', 'QUOKKA', 'quokka', 'QuOkKa', w('Quo', '\u00ad', 'kka'), w('Qu', '\u200b', 'okka'), w('Zeb', '\u200d', 'ra Crossing')];
  const r = scan(mk({ 'x.txt': lines.join('\n') + '\n' }), DENY);
  assert.deepEqual(r.findings.map((f) => f.line), [1, 2, 5, 6, 7]);
});
test('R5: a password value starting with an angle bracket is a placeholder', () => {
  const r = scan(mk({ 'x.txt': [w('pass', 'word: <your password>'), w('pass', 'word: <redacted'), w('pass', 'word: realvalue1')].join('\n') + '\n' }));
  assert.deepEqual(r.findings.map((f) => f.line), [3]);
});
test('R2: the banned word must directly follow the negated as/colon, in the list', () => {
  const md = [SITE,
    `It must not describe a design as: ${BW}, divine, perfect, a universal law, the most beautiful, or scientifically proven.`,
    `It must not describe a design as "${BW}" or "divine".`,
    `It must not describe a design as lovely and ${BW}.`,
    `It must not describe the design well: it is not ${BW}.`,
    `We never claim it as: ${BW}, perfect fourth, divine.`,
    `We must not describe things as magic, but it is ${BW}.`].join('\n');
  assert.deepEqual(scan(mk({ 'a.md': md })).findings.map((f) => f.line), [4, 5, 7]);
});
test('R4: a user folder after the Linux-home route inside a link is flagged; only the bare route is exempt', () => {
  const r = scan(mk({ 'x.txt': [w('[a](/ho', 'me/me/x)'), w('href="/ho', 'me/me"'), w('[b](/ho', 'me/)'), w('href="/ho', 'me/"'), w('[c](/ho', 'me/#top)')].join('\n') + '\n' }));
  assert.deepEqual(r.findings.map((f) => f.line), [1, 2]);
});
