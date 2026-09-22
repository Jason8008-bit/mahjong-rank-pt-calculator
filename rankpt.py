"""四人日本麻将（半庄）段位 pt 分析器核心。

纯规则实现：pt 表查询、点数转移、结局枚举、终局判定（简化）。
顺位概率由 HeuristicRankModel 给出（解析式近似，可替换为更精确的顺位模型）。

局编码：kyoku_idx 0..11 = 东1..东4(0-3)、南1..南4(4-7)、西1..西4(8-11)；亲 = kyoku_idx % 4。
终局判定（简化）：南4 及之后每局结束且头名 ≥30000 则终局；西4 强制终局；
同分按座位序（起家优先）。
"""

from __future__ import annotations

import itertools
import math
from dataclasses import dataclass

import rankpt_rules as config  # 模块名带前缀，避免与你项目里的 config 撞名

REGULAR_KYOKU = 8    # 半庄正规局数（东1..南4）
MAX_KYOKU_IDX = 11   # 西4，强制终局
GOAL_SCORE = 30000   # 南4 起头名达标线（简化终局判定）


def _ceil100(x: int) -> int:
    """向上取整到百点。"""
    return -(-x // 100) * 100


# ---------------------------------------------------------------- pt 表

@dataclass(frozen=True)
class PtTable:
    first: int
    second: int
    third: int
    fourth: int

    def as_list(self) -> list[int]:
        return [self.first, self.second, self.third, self.fourth]


def resolve_pt_table(table: str, dan: str, custom: PtTable | None = None) -> PtTable:
    """按想定卓(1-3位)+想定段位(4位)查 pt 表；custom 优先覆盖。"""
    if custom is not None:
        return custom
    try:
        first, second, third = config.PT_TABLES[table]
        fourth = config.DAN_FOURTH_PT[dan]
    except (KeyError, TypeError) as e:
        raise ValueError(f"未知的想定卓/想定段位: {e.args[0]}") from None
    return PtTable(first, second, third, fourth)


# ---------------------------------------------------------------- 点数转移

def score_transfer(kind: str, winner: int | None, loser: int | None,
                   base_score: int | None, oya: int, honba: int, kyotaku: int,
                   tenpai: list[int] | None = None) -> list[int]:
    """单一结局的四家点数变动。

    - ron：放铳者付素点 + 本场 300 全付；供托归和了者。
    - tsumo：base_score 为等价总点数，三家分摊——亲付双倍侧（子和了时亲付
      总额/2、子各付/4；亲和了时三家各付/3），百点向上取整近似（故实收
      可能略高于等价总点数，与真实规则的自摸取整同性质）；本场各家 +100；
      供托归和了者。
    - ryuukyoku：听牌 0/4 家不转移；1家 +3000/-1000×3；2家 +1500/-1500×2；
      3家 +1000×3/-3000。本场/供托不产生转移（携入下一局）。

    返回 deltas[4]；除供托流入外总和为 0。
    """
    deltas = [0, 0, 0, 0]
    if kind == "ron":
        pay = base_score + 300 * honba
        deltas[loser] -= pay
        deltas[winner] += pay + 1000 * kyotaku
    elif kind == "tsumo":
        for s in range(4):
            if s == winner:
                continue
            if winner == oya:
                per = _ceil100(-(-base_score // 3))
            elif s == oya:
                per = _ceil100(-(-base_score // 2))
            else:
                per = _ceil100(-(-base_score // 4))
            deltas[s] -= per + 100 * honba
        deltas[winner] = -sum(deltas) + 1000 * kyotaku
    elif kind == "ryuukyoku":
        n = sum(tenpai)
        if n in (1, 2, 3):
            gain = config.RYUKYOKU_TENPAI_TOTAL // n
            lose = config.RYUKYOKU_TENPAI_TOTAL // (4 - n)
            deltas = [gain if t else -lose for t in tenpai]
    else:
        raise ValueError(f"未知结局类型: {kind}")
    return deltas


# ---------------------------------------------------------------- 结局枚举

@dataclass
class Ending:
    kind: str                      # "ron" | "tsumo" | "ryuukyoku"
    winner: int | None
    loser: int | None
    base_score: int | None
    deltas: list[int]
    next_state: dict               # {kyoku_idx, honba, kyotaku, scores, game_over}
    tenpai: list[int] | None = None  # 仅 ryuukyoku


def _next_state(kind: str, winner: int | None, tenpai: list[int] | None,
                kyoku_idx: int, honba: int, kyotaku: int,
                new_scores: list[int]) -> dict:
    oya = kyoku_idx % 4
    if kind == "ryuukyoku":
        renchan = bool(tenpai[oya])
        next_honba = honba + 1
        next_kyotaku = kyotaku          # 供托携入下一局
    else:
        renchan = winner == oya
        next_honba = honba + 1 if renchan else 0
        next_kyotaku = 0                # 供托已归和了者
    next_kyoku = kyoku_idx if renchan else kyoku_idx + 1
    # 终局判定（简化）：西4 强制终局；南4 及之后头名 ≥30000 终局
    game_over = kyoku_idx >= MAX_KYOKU_IDX or (
        kyoku_idx >= REGULAR_KYOKU - 1 and max(new_scores) >= GOAL_SCORE)
    if game_over:
        next_kyoku = kyoku_idx
    return {"kyoku_idx": next_kyoku, "honba": next_honba,
            "kyotaku": next_kyotaku, "scores": new_scores, "game_over": game_over}


def enumerate_endings(kyoku_idx: int, honba: int, kyotaku: int,
                      scores: list[int]) -> list[Ending]:
    """枚举本局全部结局：荣和 4和了者×3放铳者×9档 =108、自摸 4×9档 =36、
    流局听牌组合 2^4 =16，共 160 项。"""
    oya = kyoku_idx % 4
    endings: list[Ending] = []

    def add(kind, winner, loser, base, tenpai=None):
        deltas = score_transfer(kind, winner, loser, base, oya, honba, kyotaku, tenpai)
        new_scores = [s + d for s, d in zip(scores, deltas)]
        ns = _next_state(kind, winner, tenpai, kyoku_idx, honba, kyotaku, new_scores)
        endings.append(Ending(kind, winner, loser, base, deltas, ns, tenpai))

    for winner in range(4):
        tiers = config.RON_SCORES_PARENT if winner == oya else config.RON_SCORES_CHILD
        for base in tiers:
            for loser in range(4):
                if loser != winner:
                    add("ron", winner, loser, base)
            add("tsumo", winner, None, base)
    for combo in itertools.product((0, 1), repeat=4):
        add("ryuukyoku", None, None, None, list(combo))
    return endings


# ---------------------------------------------------------------- 顺位概率

class HeuristicRankModel:
    """顺位概率启发式模型。

    解析式 Plackett-Luce：权重 w_i = exp(score_i / T)，温度 T = BASE_TEMP ×
    剩余局数（局数越少分差越"定局"，分布越集中）。对 24 种终局排列求概率后
    汇总为 4×4 顺位分布。性质：每行和 =1、每列和 =1；分高者的一位概率
    不低于分低者。本场/供托不参与。
    """

    BASE_TEMP = 2000.0

    def rank_prob(self, kyoku_idx: int, honba: int, kyotaku: int,
                  scores: list[int]) -> list[list[float]]:
        remaining = max(REGULAR_KYOKU - kyoku_idx, 1)
        temp = self.BASE_TEMP * remaining
        prob = [[0.0] * 4 for _ in range(4)]
        for perm in itertools.permutations(range(4)):
            p = 1.0
            for index, seat in enumerate(perm):
                remaining_seats = perm[index:]
                top = max(scores[s] for s in remaining_seats)
                weights = [math.exp((scores[s] - top) / temp) for s in remaining_seats]
                p *= weights[0] / sum(weights)
            for rank, seat in enumerate(perm):
                prob[seat][rank] += p
        return prob


# ---------------------------------------------------------------- analyze

def _final_pt(scores: list[int], pt: PtTable) -> list[float]:
    """终局按分数定序（同分起家优先），返回各座位所得 pt。"""
    order = sorted(range(4), key=lambda s: (-scores[s], s))
    pts = pt.as_list()
    out = [0.0] * 4
    for rank, seat in enumerate(order):
        out[seat] = float(pts[rank])
    return out


def _integer(value, name: str, low: int, high: int, step: int = 1) -> int:
    if type(value) not in (int, float) or not low <= value <= high or value % step:
        raise ValueError(f"{name} 须为 {low}..{high} 内的整数，步长 {step}")
    return int(value)


def _validated_request(req: dict) -> dict:
    """Copy and normalize JSON integer values without changing caller-owned data."""
    if not isinstance(req, dict):
        raise ValueError("输入须为 JSON 对象")
    for key in ("kyoku_idx", "honba", "kyotaku", "scores"):
        if key not in req:
            raise ValueError(f"缺少字段: {key}")
    normalized = dict(req)
    normalized["kyoku_idx"] = _integer(req["kyoku_idx"], "kyoku_idx", 0, MAX_KYOKU_IDX)
    normalized["honba"] = _integer(req["honba"], "honba", 0, 100)
    normalized["kyotaku"] = _integer(req["kyotaku"], "kyotaku", 0, 100)
    scores = req["scores"]
    if not isinstance(scores, (list, tuple)) or len(scores) != 4:
        raise ValueError("scores 须为 4 家点数")
    normalized["scores"] = [_integer(score, f"scores[{index}]", -100000, 1000000, 100)
                            for index, score in enumerate(scores)]
    custom = req.get("custom_pt")
    if custom is not None:
        if isinstance(custom, PtTable):
            custom = dict(zip(("first", "second", "third", "fourth"), custom.as_list()))
        if not isinstance(custom, dict) or set(custom) != {"first", "second", "third", "fourth"}:
            raise ValueError("custom_pt 须包含且仅包含 first/second/third/fourth")
        normalized["custom_pt"] = {key: _integer(value, f"custom_pt.{key}", -1000, 1000)
                                   for key, value in custom.items()}
    else:
        table, dan = req.get("table", "特上"), req.get("dan", "四段")
        if not isinstance(table, str) or table not in config.PT_TABLES:
            raise ValueError("未知的想定卓")
        if not isinstance(dan, str) or dan not in config.DAN_FOURTH_PT:
            raise ValueError("未知的想定段位")
    return normalized


def analyze(req: dict) -> dict:
    """主入口。

    req: {kyoku_idx, honba, kyotaku, scores[4], table, dan, custom_pt?}
    返回 {"rank_prob": 4x4, "pt_ev": [4], "endings": [...每项含局后 pt_ev 与 ev_diff]}。
    """
    req = _validated_request(req)
    kyoku_idx = req["kyoku_idx"]
    honba = req["honba"]
    kyotaku = req["kyotaku"]
    scores = list(req["scores"])
    custom = req.get("custom_pt")
    if isinstance(custom, dict):
        custom = PtTable(**custom)
    pt = resolve_pt_table(req.get("table", "特上"), req.get("dan", "四段"), custom)
    pts = pt.as_list()
    model = HeuristicRankModel()

    def pt_ev_of(rank_prob):
        return [sum(p * v for p, v in zip(row, pts)) for row in rank_prob]

    rank_prob = model.rank_prob(kyoku_idx, honba, kyotaku, scores)
    pt_ev = pt_ev_of(rank_prob)

    endings_out = []
    for e in enumerate_endings(kyoku_idx, honba, kyotaku, scores):
        ns = e.next_state
        # 局后顺位分布：终局=确定性 one-hot，非终局=启发式模型
        if ns["game_over"]:
            order = sorted(range(4), key=lambda s: (-ns["scores"][s], s))
            post_rank = [[0.0] * 4 for _ in range(4)]
            for rank, seat in enumerate(order):
                post_rank[seat][rank] = 1.0
            post = _final_pt(ns["scores"], pt)
        else:
            post_rank = model.rank_prob(
                ns["kyoku_idx"], ns["honba"], ns["kyotaku"], ns["scores"])
            post = pt_ev_of(post_rank)
        endings_out.append({
            "kind": e.kind, "winner": e.winner, "loser": e.loser,
            "base_score": e.base_score, "tenpai": e.tenpai,
            "deltas": e.deltas, "next_state": ns,
            "rank_prob": post_rank,
            "pt_ev": post,
            "ev_diff": [a - b for a, b in zip(post, pt_ev)],
        })
    return {"rank_prob": rank_prob, "pt_ev": pt_ev, "endings": endings_out}
