import { expect, it } from 'vitest';
import { analyze, DEFAULT_REQUEST } from './rankpt';
import { toCSV, toJSON } from './export';

it('exports all scenarios and the request independently of the visible table', () => {
  const result = analyze(DEFAULT_REQUEST);
  const payload = JSON.parse(toJSON(DEFAULT_REQUEST, result));
  expect(payload.request).toEqual(DEFAULT_REQUEST);
  expect(payload.result).toEqual(result);
  expect(payload.schema_version).toBe(1);
  const lines = toCSV(DEFAULT_REQUEST, result).trim().split('\r\n');
  expect(lines).toHaveLength(161);
  const headers = lines[0].replace('\uFEFF', '').split(',');
  expect(headers).toContain('seat_3_rank_4');
  expect(headers).toContain('input_score_0');
  expect(lines.every(line => line.replace('\uFEFF', '').split(',').length === headers.length)).toBe(true);
});
