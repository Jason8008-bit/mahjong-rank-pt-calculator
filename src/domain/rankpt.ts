/** Four-player East-South what-if engine, kept in parity with rankpt.py. */
export interface PtTable { first: number; second: number; third: number; fourth: number }
export interface AnalysisRequest {
  kyoku_idx: number; honba: number; kyotaku: number; scores: number[];
  table?: string; dan?: string; custom_pt?: PtTable | null;
}
export interface NextState {
  kyoku_idx: number; honba: number; kyotaku: number; scores: number[]; game_over: boolean;
}
export type EndingKind = 'ron' | 'tsumo' | 'ryuukyoku';
export interface Ending {
  kind: EndingKind; winner: number | null; loser: number | null; base_score: number | null;
  tenpai: number[] | null; deltas: number[]; next_state: NextState;
  rank_prob: number[][]; pt_ev: number[]; ev_diff: number[];
}
export interface Analysis { rank_prob: number[][]; pt_ev: number[]; endings: Ending[] }
export const TABLES: Record<string, number[]> = { '一般': [30, 15, 0], '上級': [60, 15, 0], '特上': [75, 30, 0], '鳳凰': [90, 45, 0] };
export const DANS: Record<string, number> = {
  '新人': 0, '9級': 0, '8級': 0, '7級': 0, '6級': 0, '5級': 0, '4級': 0, '3級': 0,
  '2級': -15, '1級': -30, '初段': -45, '二段': -60, '三段': -75, '四段': -90,
  '五段': -105, '六段': -120, '七段': -135, '八段': -150, '九段': -165, '十段': -180,
};
export const ROUNDS = ['东1', '东2', '东3', '东4', '南1', '南2', '南3', '南4', '西1', '西2', '西3', '西4'];
export const SEATS = ['起家东', '起家南', '起家西', '起家北'];
export const DEFAULT_REQUEST: AnalysisRequest = {
  kyoku_idx: 0, honba: 0, kyotaku: 0, scores: [25000, 25000, 25000, 25000], table: '特上', dan: '四段',
};
const CHILD = [1000, 2000, 3900, 5200, 8000, 12000, 16000, 24000, 32000];
const PARENT = [1500, 2900, 5800, 7700, 12000, 18000, 24000, 36000, 48000];
const PT_KEYS = ['first', 'second', 'third', 'fourth'] as const;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const ceil100 = (value: number) => Math.ceil(value / 100) * 100;
const matrix = () => Array.from({length: 4}, () => [0, 0, 0, 0]);
function permutations(seats: number[]): number[][] {
  if (!seats.length) return [[]];
  return seats.flatMap(seat => permutations(seats.filter(x => x !== seat)).map(rest => [seat, ...rest]));
}
const PERMUTATIONS = permutations([0, 1, 2, 3]);
function integer(value: unknown, name: string, min: number, max: number, step = 1) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max || value % step !== 0) {
    throw new Error(`${name} 须为 ${min}..${max} 内的整数，步长 ${step}`);
  }
}
function validate(request: AnalysisRequest) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('输入须为对象');
  integer(request.kyoku_idx, '局数', 0, 11);
  integer(request.honba, '本场', 0, 100);
  integer(request.kyotaku, '供托', 0, 100);
  if (!Array.isArray(request.scores) || request.scores.length !== 4) throw new Error('须填写四家点数');
  for (let seat = 0; seat < 4; seat++) integer(request.scores[seat], SEATS[seat], -100000, 1000000, 100);
  if (request.custom_pt != null) {
    const custom = request.custom_pt;
    if (typeof custom !== 'object' || Array.isArray(custom) || Object.keys(custom).length !== 4 || !PT_KEYS.every(key => Object.hasOwn(custom, key))) {
      throw new Error('自定义 pt 须包含且仅包含四个顺位');
    }
    PT_KEYS.forEach(key => integer(custom[key], key, -1000, 1000));
  } else {
    const table = request.table === undefined ? '特上' : request.table;
    const dan = request.dan === undefined ? '四段' : request.dan;
    if (typeof table !== 'string' || !Object.hasOwn(TABLES, table)) throw new Error('未知的想定卓');
    if (typeof dan !== 'string' || !Object.hasOwn(DANS, dan)) throw new Error('未知的想定段位');
  }
}
export function ptValues(request: AnalysisRequest): number[] {
  return request.custom_pt ? PT_KEYS.map(key => request.custom_pt![key])
    : [...TABLES[request.table ?? '特上'], DANS[request.dan ?? '四段']];
}
/** Plackett–Luce conditional probabilities; re-scale each position to prevent underflow. */
export function rankProb(round: number, scores: number[]): number[][] {
  const temperature = 2000 * Math.max(8 - round, 1);
  const result = matrix();
  for (const order of PERMUTATIONS) {
    let probability = 1;
    for (let index = 0; index < 4; index++) {
      const remaining = order.slice(index);
      const top = Math.max(...remaining.map(seat => scores[seat]));
      const weights = remaining.map(seat => Math.exp((scores[seat] - top) / temperature));
      probability *= weights[0] / sum(weights);
    }
    order.forEach((seat, rank) => { result[seat][rank] += probability; });
  }
  return result;
}
function deterministicRank(scores: number[]): number[][] {
  const result = matrix();
  [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a] || a - b)
    .forEach((seat, rank) => { result[seat][rank] = 1; });
  return result;
}
export function analyze(request: AnalysisRequest): Analysis {
  validate(request);
  const {kyoku_idx: round, honba, kyotaku, scores} = request;
  const dealer = round % 4;
  const pts = ptValues(request);
  const expectation = (prob: number[][]) => prob.map(row => sum(row.map((p, rank) => p * pts[rank])));
  const rank_prob = rankProb(round, scores);
  const pt_ev = expectation(rank_prob);
  const endings: Ending[] = [];
  function add(kind: EndingKind, winner: number | null, loser: number | null, base: number | null, tenpai: number[] | null = null) {
    let deltas = [0, 0, 0, 0];
    if (kind === 'ron') {
      const pay = base! + 300 * honba;
      deltas[loser!] -= pay;
      deltas[winner!] += pay + 1000 * kyotaku;
    } else if (kind === 'tsumo') {
      for (let seat = 0; seat < 4; seat++) {
        if (seat === winner) continue;
        const divisor = winner === dealer ? 3 : seat === dealer ? 2 : 4;
        deltas[seat] -= ceil100(Math.ceil(base! / divisor)) + 100 * honba;
      }
      deltas[winner!] = -sum(deltas) + 1000 * kyotaku;
    } else {
      const count = sum(tenpai!);
      if (count > 0 && count < 4) deltas = tenpai!.map(ready => ready ? 3000 / count : -3000 / (4 - count));
    }
    const newScores = scores.map((score, seat) => score + deltas[seat]);
    const draw = kind === 'ryuukyoku';
    const repeat = draw ? !!tenpai![dealer] : winner === dealer;
    const game_over = round >= 11 || (round >= 7 && Math.max(...newScores) >= 30000);
    const nextRound = game_over || repeat ? round : round + 1;
    const next_state: NextState = {
      kyoku_idx: nextRound, honba: draw || repeat ? honba + 1 : 0,
      kyotaku: draw ? kyotaku : 0, scores: newScores, game_over,
    };
    const postRank = game_over ? deterministicRank(newScores) : rankProb(nextRound, newScores);
    const post = expectation(postRank);
    endings.push({kind, winner, loser, base_score: base, tenpai, deltas, next_state,
      rank_prob: postRank, pt_ev: post, ev_diff: post.map((ev, seat) => ev - pt_ev[seat])});
  }
  for (let winner = 0; winner < 4; winner++) {
    for (const base of winner === dealer ? PARENT : CHILD) {
      for (let loser = 0; loser < 4; loser++) if (loser !== winner) add('ron', winner, loser, base);
      add('tsumo', winner, null, base);
    }
  }
  for (let mask = 0; mask < 16; mask++) add('ryuukyoku', null, null, null, [3, 2, 1, 0].map(bit => (mask >> bit) & 1));
  return {rank_prob, pt_ev, endings};
}
