import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

const digest = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

function sourceDigest(root: string): string {
  const names: unknown = JSON.parse(readFileSync(resolve(root, 'scripts/release-files.json'), 'utf8'));
  if (!Array.isArray(names) || names.some(name => typeof name !== 'string') || new Set(names).size !== names.length) {
    throw new Error('Release file list must contain unique paths');
  }
  const manifest = (names as string[]).sort().map(name => {
    const parts = name.split('/');
    const path = resolve(root, name);
    if (isAbsolute(name) || name.includes('\\') || parts.some(part => !part || part === '.' || part === '..') ||
        parts.some((_, i) => lstatSync(resolve(root, ...parts.slice(0, i + 1))).isSymbolicLink()) ||
        relative(realpathSync(root), realpathSync(path)).startsWith('..') || !lstatSync(path).isFile()) {
      throw new Error(`Invalid release file: ${name}`);
    }
    return `${digest(readFileSync(path))}  ${name}\n`;
  }).join('');
  return digest(manifest);
}

/** Bind the HTML to the exact public source tree that built it. */
export function buildProvenance(): Plugin {
  let root = '';
  let output = '';
  let source = '';
  let publicDirectory = '';
  let configDependencies: string[] = [];
  let allowed = new Set<string>();
  function requireListed(id: string) {
    const path = id.split(/[?#]/)[0];
    if (!isAbsolute(path) || !existsSync(path)) return; // Virtual modules have no source file.
    const name = relative(root, path).split(sep).join('/');
    if (name.startsWith('../') || isAbsolute(name)) {
      if (path.split(sep).join('/').includes('/node_modules/')) return;
      throw new Error(`Unlisted build input outside the project: ${path}`);
    }
    if (!name.startsWith('node_modules/') && !allowed.has(name)) throw new Error(`Unlisted build input: ${name}; update scripts/release-files.json`);
  }
  function checkTree(directory: string) {
    if (!directory || !existsSync(directory)) return;
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
      if (entry.name === '.DS_Store') continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) checkTree(path);
      else requireListed(path);
    }
  }
  return {
    name: 'tingque-build-provenance',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      output = resolve(root, config.build.outDir);
      publicDirectory = config.publicDir;
      configDependencies = config.configFileDependencies;
    },
    buildStart() {
      rmSync(resolve(output, '.build-provenance.json'), {force: true});
      source = sourceDigest(root);
      allowed = new Set(JSON.parse(readFileSync(resolve(root, 'scripts/release-files.json'), 'utf8')));
      checkTree(resolve(root, 'src'));
      checkTree(publicDirectory);
      configDependencies.forEach(requireListed);
    },
    generateBundle(_options, bundle) {
      for (const id of this.getModuleIds()) requireListed(id);
      for (const item of Object.values(bundle)) {
        if (item.type === 'asset') item.originalFileNames.forEach(name => requireListed(resolve(root, name)));
      }
    },
    writeBundle() {
      if (!source || source !== sourceDigest(root)) throw new Error('Public source changed during the build; run the build again');
      writeFileSync(resolve(output, '.build-provenance.json'), JSON.stringify({
        schema_version: 1,
        version: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version,
        source_manifest_sha256: source,
        html_sha256: digest(readFileSync(resolve(output, 'index.html'))),
      }, null, 2) + '\n');
    },
  };
}
