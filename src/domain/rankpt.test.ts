import { describe, expect, it } from 'vitest';
import { analyze, rankProb, DEFAULT_REQUEST } from './rankpt';

describe('rank-pt analysis', () => {
  it('returns uniform probabilities, correct East-South pt and 160 scenarios', () => {
    const result = analyze(DEFAULT_REQUEST);
    expect(result.endings).toHaveLength(160);
    for (const row of result.rank_prob) for (const p of row) expect(p).toBeCloseTo(.25, 12);
    for (const ev of result.pt_ev) expect(ev).toBeCloseTo(3.75, 12);
    expect(result.endings.filter(e => e.kind === 'ron')).toHaveLength(108);
    expect(result.endings.filter(e => e.kind === 'tsumo')).toHaveLength(36);
  });
  it('matches a hand-computed child tsumo with honba and a riichi stick', () => {
    const result = analyze({ ...DEFAULT_REQUEST, honba: 1, kyotaku: 1 });
    const ending = result.endings.find(e => e.kind === 'tsumo' && e.winner === 1 && e.base_score === 8000)!;
    expect(ending.deltas).toEqual([-4100, 9300, -2100, -2100]);
    expect(ending.next_state.kyotaku).toBe(0);
    expect(ending.ev_diff[1]).toBeGreaterThan(0);
  });
  it('preserves conditional placements under huge score gaps', () => {
    const p = rankProb(11, [1000000, 50000, 25000, -100000]);
    p.forEach(row => expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12));
    for (let col = 0; col < 4; col++) expect(p.reduce((sum, row) => sum + row[col], 0)).toBeCloseTo(1, 12);
    expect(p[1][1]).toBeGreaterThan(.99);
  });
  it('retains terminal round and seat-priority tie-break', () => {
    const result = analyze({ ...DEFAULT_REQUEST, kyoku_idx: 11 });
    expect(result.endings.every(e => e.next_state.kyoku_idx === 11 && e.next_state.game_over)).toBe(true);
    const draw = result.endings.find(e => e.kind === 'ryuukyoku' && e.tenpai?.every(x => x === 0))!;
    expect(draw.pt_ev).toEqual([75, 30, 0, -90]);
  });
  it('supports a custom pt table', () => {
    const result = analyze({ ...DEFAULT_REQUEST, table: 'custom', custom_pt: {first: 90, second: 45, third: 0, fourth: -135} });
    result.pt_ev.forEach(ev => expect(ev).toBeCloseTo(0, 12));
  });
  it('conserves score transfers and normalized distributions in all outcomes', () => {
    const request = { ...DEFAULT_REQUEST, kyoku_idx: 6, honba: 3, kyotaku: 2, scores: [36000, 31000, 21000, 10000] };
    const original = JSON.stringify(request);
    const result = analyze(request);
    expect(JSON.stringify(request)).toBe(original);
    for (const ending of result.endings) {
      expect(ending.deltas.reduce((a, b) => a + b, 0)).toBe(ending.kind === 'ryuukyoku' ? 0 : 2000);
      ending.rank_prob.forEach(row => expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12));
      for (let col = 0; col < 4; col++) expect(ending.rank_prob.reduce((a, row) => a + row[col], 0)).toBeCloseTo(1, 12);
      expect(ending.next_state.scores).toEqual(request.scores.map((score, seat) => score + ending.deltas[seat]));
    }
  });
  it.each([
    {kyoku_idx: 12}, {kyoku_idx: true}, {honba: .5}, {honba: 101}, {kyotaku: -1},
    {scores: [NaN, 25000, 25000, 25000]}, {scores: [25001, 25000, 25000, 25000]},
    {scores: [true, 25000, 25000, 25000]}, {scores: [25000]}, {scores: null}, {scores: Array(4)},
    {custom_pt: {first: 1}}, {table: '__proto__'}, {dan: null},
  ])('rejects malformed input %j', patch => {
    expect(() => analyze({ ...DEFAULT_REQUEST, ...patch } as never)).toThrow();
  });
});
