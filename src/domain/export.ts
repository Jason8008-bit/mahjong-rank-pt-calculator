import { ptValues, type Analysis, type AnalysisRequest } from './rankpt';

export function toJSON(request: AnalysisRequest, result: Analysis): string {
  return JSON.stringify({schema_version: 1, model: 'plackett-luce-heuristic-v1', request, result}, null, 2);
}
export function toCSV(request: AnalysisRequest, result: Analysis): string {
  const seats = [0, 1, 2, 3];
  const header = ['input_round', 'input_honba', 'input_kyotaku', ...seats.map(s => `input_score_${s}`),
    ...seats.map(s => `pt_rank_${s + 1}`), 'kind', 'winner', 'loser', 'base_score', 'tenpai',
    ...seats.map(s => `delta_${s}`), 'next_round', 'next_honba', 'next_kyotaku', 'game_over',
    ...seats.map(s => `next_score_${s}`), ...seats.flatMap(s => seats.map(r => `seat_${s}_rank_${r + 1}`)),
    ...seats.map(s => `pt_ev_${s}`), ...seats.map(s => `ev_diff_${s}`)];
  const rows = result.endings.map(e => [request.kyoku_idx, request.honba, request.kyotaku, ...request.scores,
    ...ptValues(request), e.kind, e.winner ?? '', e.loser ?? '', e.base_score ?? '', e.tenpai?.join('|') ?? '',
    ...e.deltas, e.next_state.kyoku_idx, e.next_state.honba, e.next_state.kyotaku, e.next_state.game_over,
    ...e.next_state.scores, ...e.rank_prob.flat(), ...e.pt_ev, ...e.ev_diff]);
  // All cells are engine-generated numeric values, booleans or fixed enum strings.
  return '\uFEFF' + [header, ...rows].map(row => row.join(',')).join('\r\n') + '\r\n';
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
