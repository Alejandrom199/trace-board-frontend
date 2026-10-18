import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(readFileSync('contracts-manifest.json', 'utf8'));
const version = JSON.parse(readFileSync('packages/contracts/package.json', 'utf8')).version;
const files = {};
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const name = directory + '/' + entry.name;
    if (entry.isDirectory()) walk(name);
    else files[name] = createHash('sha256').update(readFileSync(name, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
  }
}
walk('packages/contracts/src');
if (manifest.version !== version || Object.keys(files).length !== Object.keys(manifest.files).length || Object.entries(files).some(([name, hash]) => manifest.files[name] !== hash)) {
  console.error('El contrato cambió: sincroniza su versión y contracts-manifest.json en frontend y backend.'); process.exitCode = 1;
} else console.log('Contratos: versión y ' + Object.keys(files).length + ' archivos coinciden con el manifiesto.');
