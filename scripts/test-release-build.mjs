import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

async function fixture(run) {
  const parent = resolve(root, 'node_modules/.cache');
  await mkdir(parent, {recursive: true});
  const directory = await mkdtemp(resolve(parent, 'tingque-release-'));
  try {
    for (const name of JSON.parse(await readFile(resolve(root, 'scripts/release-files.json'), 'utf8'))) {
      await mkdir(dirname(resolve(directory, name)), {recursive: true});
      await copyFile(resolve(root, name), resolve(directory, name));
    }
    await run(directory);
  } finally { await rm(directory, {recursive: true, force: true}); }
}

const compile = directory => build({root: directory, mode: 'standalone', logLevel: 'silent', configFile: resolve(directory, 'vite.config.ts')});

test('a failed real Vite build invalidates provenance and cannot package old HTML', async () => {
  await fixture(async directory => {
    await compile(directory);
    const entry = resolve(directory, 'src/main.tsx');
    await writeFile(entry, await readFile(entry, 'utf8') + "\nimport './missing-release-probe.css';\n");
    await assert.rejects(compile(directory));
    await assert.rejects(access(resolve(directory, 'dist-standalone/.build-provenance.json')));
    const result = spawnSync(python, [resolve(directory, 'scripts/package-release.py')], {encoding: 'utf8'});
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /package:release/);
  });
});

test('real Vite builds reject a runtime module omitted from the source archive', async () => {
  await fixture(async directory => {
    const entry = resolve(directory, 'src/main.tsx');
    await writeFile(resolve(directory, 'src/release-probe.ts'), "export const probe = 'missing-source';\n");
    await writeFile(entry, await readFile(entry, 'utf8') + "\nimport {probe} from './release-probe';\ndocument.documentElement.dataset.probe = probe;\n");
    await assert.rejects(compile(directory), /Unlisted build input/);
  });
});

test('real Vite builds reject an inlined CSS image outside src/public omitted from the archive', async () => {
  await fixture(async directory => {
    await mkdir(resolve(directory, 'assets'));
    await writeFile(resolve(directory, 'assets/release-probe.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>');
    const css = resolve(directory, 'src/styles.css');
    await writeFile(css, await readFile(css, 'utf8') + '\nbody { background-image: url(../assets/release-probe.svg); }\n');
    await compile(directory);
    const direct = spawnSync(python, [resolve(directory, 'scripts/package-release.py')], {encoding: 'utf8'});
    assert.notEqual(direct.status, 0);
    assert.match(direct.stderr, /isolated source/);
    const packaged = spawnSync(process.execPath, [resolve(directory, 'scripts/package-release.mjs')], {encoding: 'utf8'});
    assert.equal(packaged.error, undefined);
    assert.notEqual(packaged.status, 0);
    assert.match(packaged.stderr, /Release build warning/);
    await assert.rejects(access(resolve(directory, 'release')));
  });
});

test('isolated packaging rejects an omitted CSS import outside src/public', async () => {
  await fixture(async directory => {
    await mkdir(resolve(directory, 'assets'));
    await writeFile(resolve(directory, 'assets/release-probe.css'), 'body { outline: 1px solid red; }');
    const css = resolve(directory, 'src/styles.css');
    const original = await readFile(css, 'utf8');
    assert.match(original, /^@charset[^\n]+\n/);
    await writeFile(css, original.replace(/^(@charset[^\n]+\n)/, '$1@import "../assets/release-probe.css";\n'));
    const packaged = spawnSync(process.execPath, [resolve(directory, 'scripts/package-release.mjs')], {encoding: 'utf8'});
    assert.equal(packaged.error, undefined);
    assert.notEqual(packaged.status, 0);
    assert.match(packaged.stderr, /release-probe\.css/);
    await assert.rejects(access(resolve(directory, 'release')));
  });
});
