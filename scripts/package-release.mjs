import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { build, createLogger } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const packager = resolve(root, 'scripts/package-release.py');
const { values } = parseArgs({options: {output: {type: 'string'}, help: {type: 'boolean', short: 'h'}}});

function runPython(args) {
  const result = spawnSync(python, [packager, ...args], {stdio: 'inherit'});
  if (result.error) throw new Error(`Cannot run ${python}: ${result.error.message}. Set PYTHON to your Python executable.`);
  if (result.status !== 0) throw new Error(`Release preparation or packaging failed (exit ${result.status})`);
}

let staging;
try {
  if (values.help) runPython(['--help']);
  else {
    const destination = resolve(values.output || resolve(root, 'release'));
    const output = resolve(root, 'dist-standalone');
    await rm(resolve(output, '.build-provenance.json'), {force: true});
    const parent = resolve(root, 'node_modules/.cache');
    await mkdir(parent, {recursive: true});
    staging = await mkdtemp(resolve(parent, 'tingque-package-'));
    runPython(['--prepare', staging]);
    // Build only files that the source archive will contain, including assets
    // inlined by CSS processing that never appear in the final module graph.
    const logger = createLogger();
    logger.warn = message => { throw new Error(`Release build warning: ${message}`); };
    logger.warnOnce = logger.warn;
    await build({root: staging, mode: 'standalone', configFile: resolve(staging, 'vite.config.ts'), customLogger: logger});
    const stagedOutput = resolve(staging, 'dist-standalone');
    const provenance = JSON.parse(await readFile(resolve(stagedOutput, '.build-provenance.json'), 'utf8'));
    provenance.isolated_source_build = true;
    await mkdir(output, {recursive: true});
    await copyFile(resolve(stagedOutput, 'index.html'), resolve(output, 'index.html'));
    await writeFile(resolve(output, '.build-provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
    // Revalidate originals to detect edits made during staging or compilation.
    runPython(['--output', destination]);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (staging) await rm(staging, {recursive: true, force: true});
}
