import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

// Static imports, exports, literal dynamic imports and require calls are checked.
// Computed module names are rejected in feature code. Runtime code generation is outside this check.
const root = process.cwd();
const projects = ['apps/web', 'apps/api', 'packages/contracts'].filter(name => fs.existsSync(path.join(root, name, 'src')));
let src; let config; let project;
function selectProject(name) {
  project = name; src = path.join(root, name, 'src');
  const base = path.join(root, name);
  const file = ts.readConfigFile(path.join(base, 'tsconfig.json'), ts.sys.readFile);
  config = ts.parseJsonConfigFileContent(file.config, ts.sys, base);
}
const applicationProject = projects.find(name => name.startsWith('apps/'));
if (!applicationProject) throw new Error('No se encontró una aplicación para comprobar');
selectProject(applicationProject);
const failures = [];
let count = 0;
const banned = /^(react(?:-dom)?(?:\/|$)|next(?:\/|$)|@xyflow\/|tldraw(?:\/|$)|@tldraw\/|zustand(?:\/|$)|@prisma\/|@supabase\/|@nestjs\/|pg(?:\/|$)|node:|fs$|path$)/;
const browserGlobals = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'navigator', 'process', 'XMLHttpRequest', 'FileReader', 'indexedDB']);
function info(file) {
  const relative = path.relative(src, file).replaceAll('\\', '/');
  const match = /^features\/([^/]+)\/(domain|application|infrastructure|presentation)\//.exec(relative);
  return { relative, feature: /^features\/([^/]+)\//.exec(relative)?.[1], layer: match?.[2] };
}
function report(file, node, message) { const location = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()); failures.push(`${path.relative(root, file)}:${location.line + 1} ${message}`); }
function check(file, contents = fs.readFileSync(file, 'utf8')) {
  count++;
  const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true);
  const from = info(file);
  function dependency(node, module) {
    if (project === 'apps/web' && /^(pg(?:\/|$)|@prisma\/|@nestjs\/|@traceboard\/api(?:\/|$))/.test(module)) report(file, node, 'El frontend no puede importar backend o acceso SQL');
    if (project === 'packages/contracts' && banned.test(module)) report(file, node, 'Contratos no pueden depender de UI o infraestructura');
    if (module.endsWith('.css')) {
      if (from.layer === 'domain' || from.layer === 'application') report(file, node, 'Las capas internas no pueden importar estilos');
      else if (!fs.existsSync(module.startsWith('.') ? path.resolve(path.dirname(file), module) : path.join(root, 'node_modules', module))) report(file, node, 'Hoja de estilos no resuelta');
      return;
    }
    if ((from.layer === 'domain' || from.layer === 'application') && banned.test(module)) report(file, node, `Dependencia externa prohibida: ${module}`);
    const resolved = ts.resolveModuleName(module, file, config.options, ts.sys).resolvedModule?.resolvedFileName;
    if (!resolved) { if (module.startsWith('.') || module.startsWith('@/')) report(file, node, `Import local no resuelto: ${module}`); return; }
    const normalized = resolved.replaceAll('\\', '/');
    const webRoot = path.join(root, 'apps/web').replaceAll('\\', '/');
    const apiRoot = path.join(root, 'apps/api').replaceAll('\\', '/');
    if ((project === 'apps/web' && normalized.startsWith(apiRoot + '/')) || (project === 'apps/api' && normalized.startsWith(webRoot + '/')) || (project === 'packages/contracts' && (normalized.startsWith(webRoot + '/') || normalized.startsWith(apiRoot + '/')))) report(file, node, 'Dependencia entre aplicaciones prohibida; usar contratos y API');
    const to = info(resolved);
    if (to.relative.startsWith('..')) return;
    if (from.feature && from.feature === to.feature) {
      if (from.layer === 'domain' && to.layer !== 'domain') report(file, node, 'El dominio solo puede importar dominio');
      if (from.layer === 'application' && !['domain', 'application'].includes(to.layer)) report(file, node, 'Aplicación no puede importar adaptadores');
      if (from.layer === 'infrastructure' && !['domain', 'application', 'infrastructure'].includes(to.layer)) report(file, node, 'Infraestructura no puede importar presentación');
    }
    if (to.feature && from.feature !== to.feature && to.relative !== `features/${to.feature}/index.ts`) report(file, node, 'Consumir otros módulos por index.ts');
    // Imports of a feature entry point are allowed; shared code cannot bypass this rule.
    const internalMatch = /^features\/([^/]+)\/(.+)$/.exec(to.relative);
    if (internalMatch && from.feature !== internalMatch[1] && internalMatch[2] !== 'index.ts') report(file, node, 'Import externo de detalles internos');
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) dependency(node, node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) dependency(node, argument.text);
      else if (from.feature) report(file, node, 'Imports computados no permitidos en módulos');
    }
    const propertyName = node.parent && (ts.isPropertyAssignment(node.parent) || ts.isPropertySignature(node.parent) || ts.isPropertyDeclaration(node.parent)) && node.parent.name === node;
    if (from.layer === 'domain' && ts.isIdentifier(node) && !propertyName && browserGlobals.has(node.text)) report(file, node, `El dominio no puede acceder a ${node.text}`);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else if (/\.tsx?$/.test(file)) check(file); } }
if (process.argv.includes('--self-test')) {
  const probes = applicationProject === 'apps/web' ? [
    ['features/investigation/domain/probe.ts', "import React from 'react';", true],
    ['features/investigation/domain/probe.ts', "export { default } from 'next/link';", true],
    ['features/investigation/domain/probe.ts', "import('../infrastructure/local-storage');", true],
    ['features/investigation/domain/probe.ts', "window.localStorage.getItem('test');", true],
    ['features/investigation/application/probe.ts', "import { loadWorkspace } from '../infrastructure/local-storage';", true],
    ['app/probe.ts', "import { addCard } from '../features/investigation/application/actions';", true],
    ['features/investigation/domain/probe.ts', "const labels = { document: 'Documento', process: 'Proceso' };", false],
    ['app/probe.ts', "import { InvestigationApp } from '../features/investigation';", false],
    ['app/probe.ts', "import { Pool } from 'pg';", true],
    ['app/probe.ts', "import '../../../api/src/main';", true],
  ] : [
    ['features/investigations/domain/probe.ts', "import React from 'react';", true],
    ['features/investigations/domain/probe.ts', "export { default } from 'next/link';", true],
    ['features/investigations/domain/probe.ts', "import('../infrastructure/postgres-repository.js');", true],
    ['features/investigations/domain/probe.ts', "process.env.DATABASE_URL;", true],
    ['features/investigations/application/probe.ts', "import '../infrastructure/postgres-repository.js';", true],
    ['probe.ts', "import './features/investigations/application/investigations.js';", true],
    ['features/investigations/domain/probe.ts', "const labels = { document: 'Documento', process: 'Proceso' };", false],
    ['probe.ts', "import './features/investigations/index.js';", false],
    ['features/investigations/domain/probe.ts', "import { Pool } from 'pg';", true],
    ['features/investigations/domain/probe.ts', "import { Injectable } from '@nestjs/common';", true],
  ];
  for (const [relative, contents, mustFail] of probes) {
    failures.length = 0;
    check(path.join(src, relative), contents);
    if (Boolean(failures.length) !== mustFail) throw new Error(`Fallo de autocomprobación: ${relative} ${contents}`);
  }
  failures.length = 0; count = 0;
  console.log('Arquitectura: 10 pruebas positivas/negativas del verificador aprobadas.');
}
for (const name of projects) { selectProject(name); walk(src); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Arquitectura: ${count} archivos comprobados, sin imports prohibidos.`);
