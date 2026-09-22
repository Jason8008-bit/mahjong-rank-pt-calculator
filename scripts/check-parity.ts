/** Compare every response field against the Python reference, including all 160 endings. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { analyze, TABLES, DANS, type AnalysisRequest } from '../src/domain/rankpt';

const fixtures = JSON.parse(readFileSync(new URL('../fixtures/requests.json', import.meta.url), 'utf8')) as AnalysisRequest[];
const rawCases = JSON.parse(readFileSync(new URL('../fixtures/raw-requests.json', import.meta.url), 'utf8')) as {name: string; json: string; valid: boolean}[];
let seed = 20260921;
const random = (max: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor(seed / 0x100000000 * max);
};
for (let i = 0; i < 100; i++) {
  fixtures.push({kyoku_idx: i % 12, honba: random(10), kyotaku: random(8),
    scores: Array.from({length: 4}, () => (random(1301) - 100) * 100),
    ...(random(2) ? {custom_pt: {first: random(151), second: random(61), third: 0, fourth: -random(181)}}
      : {table: Object.keys(TABLES)[random(4)], dan: Object.keys(DANS)[random(Object.keys(DANS).length)]})});
}
if (new Set(fixtures.map(x => x.kyoku_idx)).size !== 12) throw new Error('All 12 rounds must be covered');
const py = spawnSync(process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-c', `
import json, sys
from rankpt import analyze
payload = json.loads(sys.stdin.buffer.read().decode('utf-8'))
def check(raw):
    try:
        return {'valid': True, 'result': analyze(json.loads(raw))}
    except (ValueError, TypeError):
        return {'valid': False}
print(json.dumps({'structured': [analyze(x) for x in payload['requests']],
                 'raw': [check(x) for x in payload['raw']]}, allow_nan=False))
`],
  {cwd: new URL('..', import.meta.url), input: JSON.stringify({requests: fixtures, raw: rawCases.map(x => x.json)}), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
if (py.status !== 0) throw new Error(`Python reference failed: ${py.error?.message ?? py.stderr}`);
const references: {structured: unknown[]; raw: {valid: boolean; result?: unknown}[]} = JSON.parse(py.stdout);
let numbers = 0;
let maxError = 0;
function compare(actual: unknown, expected: unknown, path: string) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    const diff = Math.abs(actual - expected);
    numbers++;
    maxError = Math.max(maxError, diff);
    if (!Number.isFinite(actual) || diff > 1e-12) throw new Error(`${path}: ${actual} != ${expected} (Δ=${diff})`);
  } else if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) throw new Error(`${path}: array length mismatch`);
    actual.forEach((value, index) => compare(value, expected[index], `${path}[${index}]`));
  } else if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const a = actual as Record<string, unknown>;
    const b = expected as Record<string, unknown>;
    if (Object.keys(a).sort().join() !== Object.keys(b).sort().join()) throw new Error(`${path}: key mismatch`);
    for (const key of Object.keys(a)) compare(a[key], b[key], `${path}.${key}`);
  } else if (actual !== expected) throw new Error(`${path}: ${String(actual)} != ${String(expected)}`);
}
fixtures.forEach((request, index) => compare(analyze(request), references.structured[index], `case[${index}]`));
rawCases.forEach((item, index) => {
  let result: unknown;
  let valid = true;
  try { result = analyze(JSON.parse(item.json)); } catch { valid = false; }
  if (valid !== item.valid || references.raw[index].valid !== item.valid) throw new Error(`Raw JSON acceptance mismatch: ${item.name}`);
  if (valid) compare(result, references.raw[index].result, `raw[${item.name}]`);
});
console.log(`Parity PASS: ${fixtures.length} structured requests across 12 rounds + ${rawCases.length} raw JSON cases, ${numbers} numeric fields, max absolute error ${maxError}; tolerance 1e-12.`);
