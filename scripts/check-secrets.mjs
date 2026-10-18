import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = process.cwd();
const forbidden = /(^|\/)(?:\.git|\.local|\.next|node_modules|dist|out|coverage|test-results|playwright-report|\.playwright-mcp)(\/|$)|^docs\/(?:vector-precios|screenshots)(\/|$)|(^|\/)\.env(?!\.example$)(?:\.|$)|\.(?:pem|key|p12|pfx|dump|backup|log)$|\.tsbuildinfo$|(^|\/)next-env\.d\.ts$/i;
const placeholders = /^(?:YOUR_PASSWORD|CHANGE_ME|REPLACE_ME|example|placeholder|\*+|<[^>]+>|\$\{.+\})$/i;
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['aws-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['provider-token', /\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/],
  ['public-credential-variable', /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|DATABASE_URL)\b/],
];
function issues(text) {
  const found = [];
  for (const [label, pattern] of patterns) if (pattern.test(text)) found.push(label);
  for (const match of text.matchAll(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:'"/@]+:([^\s'"@]+)@/g)) {
    const value = match[1].startsWith('\\') ? match[1].slice(1) : match[1];
    if (!placeholders.test(value)) found.push('database-password');
  }
  for (const match of text.matchAll(/\b(?:password|passwd|api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*['"]([^'"\r\n]{8,})['"]/gi)) {
    if (!placeholders.test(match[1])) found.push('literal-credential');
  }
  return [...new Set(found)];
}
const token = ['ghp', '_', 'a'.repeat(36)].join('');
assert(issues(token).includes('github-token'));
assert(issues('postgresql://user:' + 'real-value' + '@localhost/db').includes('database-password'));
assert(issues('postgresql://user:YOUR_PASSWORD@localhost/db').length === 0);
assert(issues('const password = process.env.DB_PASSWORD;').length === 0);
assert(issues(['-----BEGIN ', 'PRIVATE KEY-----'].join('')).includes('private-key'));
assert(forbidden.test('.local/database.json'));
assert(forbidden.test('apps/api/.env.local'));
assert(!forbidden.test('apps/api/.env.example'));

const probe = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', windowsHide: true });
if (existsSync(resolve(root, '.git')) && probe.status !== 0) throw new Error('No se pudo leer Git; revisa permisos/propietario antes del escaneo');
const inGit = probe.status === 0 && resolve(probe.stdout.trim()) === root;
let files = [];
let indexed = new Set();
if (inGit) {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('No se pudo obtener el inventario Git');
  files = [...new Set(result.stdout.split('\0').filter(Boolean))];
  const staged = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (staged.status !== 0) throw new Error('No se pudo obtener el índice Git');
  indexed = new Set(staged.stdout.split('\0').filter(Boolean));
} else {
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      const name = relative(root, path).split(sep).join('/');
      if (forbidden.test(name)) continue;
      if (entry.isDirectory()) walk(path); else files.push(name);
    }
  }
  walk(root);
}
// Compare candidate files with generated local credentials without printing their values.
const local = resolve(root, '.local/database.json');
const known = existsSync(local) ? JSON.parse(readFileSync(local, 'utf8')) : {};
const secrets = [known.adminPassword, known.appPassword].filter(value => typeof value === 'string' && value.length > 8);
const failures = [];
function inspect(name, content, label) {
  if (content.length > 2 * 1024 * 1024 || content.includes(0)) { failures.push(name + ': ' + label + ' binario/archivo grande requiere revisión'); return; }
  const text = content.toString('utf8');
  for (const issue of issues(text)) failures.push(name + ': ' + label + ' ' + issue);
  if (secrets.some(secret => text.includes(secret))) failures.push(name + ': ' + label + ' credencial local detectada');
}
for (const name of files) {
  const path = resolve(root, name);
  if (!path.startsWith(root + sep) || forbidden.test(name)) { failures.push(name + ': archivo privado/generado no publicable'); continue; }
  if (indexed.has(name)) {
    const snapshot = spawnSync('git', ['show', ':' + name], { cwd: root, windowsHide: true, maxBuffer: 3 * 1024 * 1024 });
    if (snapshot.status !== 0) { failures.push(name + ': no se pudo revisar el índice'); continue; }
    inspect(name, snapshot.stdout, 'índice');
  }
  if (!existsSync(path)) continue; // A tracked deletion has no current payload.
  if (lstatSync(path).isSymbolicLink()) { failures.push(name + ': enlace requiere revisión'); continue; }
  inspect(name, readFileSync(path), 'archivo');
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Secretos: ${files.length} archivos publicables revisados; 8 autocomprobaciones aprobadas; sin coincidencias. No sustituye revisión humana ni escaneo de historial.`);
