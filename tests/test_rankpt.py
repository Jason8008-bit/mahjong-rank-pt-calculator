"""段位 pt 分析器测试——手算样例逐项断言。"""

import pytest

from rankpt import (
    Ending,
    HeuristicRankModel,
    PtTable,
    analyze,
    enumerate_endings,
    resolve_pt_table,
    score_transfer,
)

TOL = 1e-9
EVEN = [25000, 25000, 25000, 25000]


# ---------------------------------------------------------------- score_transfer 手算样例

def test_ron_no_honba():
    """东1(亲=0) 0本场0供托：座位1荣和座位0素点8000 → [-8000,+8000,0,0]。"""
    d = score_transfer("ron", winner=1, loser=0, base_score=8000,
                       oya=0, honba=0, kyotaku=0)
    assert d == [-8000, 8000, 0, 0]
    assert sum(d) == 0


def test_ron_honba_and_kyotaku():
    """2本场1供托荣和：放铳者付 8000+600 全付，供托1000归和了者。"""
    d = score_transfer("ron", winner=1, loser=0, base_score=8000,
                       oya=0, honba=2, kyotaku=1)
    assert d == [-8600, 9600, 0, 0]
    assert sum(d) == 1000  # 供托流入


def test_tsumo_child_with_honba():
    """子(座位1)自摸等价8000、1本场：亲付4000+100、子各付2000+100。"""
    d = score_transfer("tsumo", winner=1, loser=None, base_score=8000,
                       oya=0, honba=1, kyotaku=0)
    assert d == [-4100, 8300, -2100, -2100]
    assert sum(d) == 0


def test_tsumo_oya():
    """亲自摸等价12000：三家各付4000。"""
    d = score_transfer("tsumo", winner=0, loser=None, base_score=12000,
                       oya=0, honba=0, kyotaku=0)
    assert d == [12000, -4000, -4000, -4000]


def test_tsumo_rounding_approx():
    """亲双倍侧近似：子自摸等价3900 → 亲付ceil100(1950)=2000、子各ceil100(975)=1000。"""
    d = score_transfer("tsumo", winner=1, loser=None, base_score=3900,
                       oya=0, honba=0, kyotaku=0)
    assert d == [-2000, 4000, -1000, -1000]
    assert sum(d) == 0


def test_ryuukyoku_tenpai_payments():
    """流局听牌收支：0/1/2/3/4 家听按 3000 总额分摊。"""
    f = lambda tp: score_transfer("ryuukyoku", None, None, None,
                                  oya=0, honba=0, kyotaku=0, tenpai=tp)
    assert f([0, 0, 0, 0]) == [0, 0, 0, 0]
    assert f([0, 1, 0, 0]) == [-1000, 3000, -1000, -1000]
    assert f([1, 1, 0, 0]) == [1500, 1500, -1500, -1500]   # 2家听
    assert f([1, 1, 1, 0]) == [1000, 1000, 1000, -3000]
    assert f([1, 1, 1, 1]) == [0, 0, 0, 0]


# ---------------------------------------------------------------- pt 表

def test_pt_table_lookup():
    # 天凤官方【東南戦（半庄）】表。
    # 4 位罚分只看段位、与卓无关：東南戦 = -(段位数 + 2) × 15。
    assert resolve_pt_table("特上", "四段") == PtTable(75, 30, 0, -90)
    assert resolve_pt_table("鳳凰", "十段") == PtTable(90, 45, 0, -180)
    assert resolve_pt_table("一般", "七段") == PtTable(30, 15, 0, -135)
    # 3 級及以下恒为 0（官网与两个第三方来源一致）
    assert resolve_pt_table("特上", "3級") == PtTable(75, 30, 0, 0)


def test_pt_table_custom_override():
    custom = PtTable(90, 45, 0, -135)
    assert resolve_pt_table("特上", "四段", custom) == custom


def test_pt_table_unknown_raises():
    with pytest.raises(ValueError):
        resolve_pt_table("不存在的卓", "四段")
    with pytest.raises(ValueError):
        resolve_pt_table("特上", "十一段")


# ---------------------------------------------------------------- 结局枚举

def test_enumerate_size_and_conservation():
    """160 项（108荣和+36自摸+16流局）；deltas 总和=0（供托流入除外）。"""
    endings = enumerate_endings(2, 1, 2, [24000, 26000, 25000, 25000])
    assert len(endings) == 160
    kinds = {}
    for e in endings:
        kinds[e.kind] = kinds.get(e.kind, 0) + 1
        expected = 2000 if e.kind in ("ron", "tsumo") else 0  # 供托2本 ×1000
        assert sum(e.deltas) == expected
        assert e.next_state["scores"] == [s + d for s, d in
                                          zip([24000, 26000, 25000, 25000], e.deltas)]
    assert kinds == {"ron": 108, "tsumo": 36, "ryuukyoku": 16}


def test_next_state_renchan_and_advance():
    endings = enumerate_endings(0, 0, 1, EVEN)  # 东1 亲=0
    ron_oya = next(e for e in endings
                   if e.kind == "ron" and e.winner == 0 and e.loser == 1
                   and e.base_score == 12000)
    assert ron_oya.next_state["kyoku_idx"] == 0      # 亲和了连庄
    assert ron_oya.next_state["honba"] == 1
    assert ron_oya.next_state["kyotaku"] == 0        # 供托被拿走
    ron_ko = next(e for e in endings
                  if e.kind == "ron" and e.winner == 1 and e.loser == 0
                  and e.base_score == 8000)
    assert ron_ko.next_state["kyoku_idx"] == 1       # 子和了进下一局
    assert ron_ko.next_state["honba"] == 0
    ryu_oya_tenpai = next(e for e in endings
                          if e.kind == "ryuukyoku" and e.tenpai == [1, 0, 0, 0])
    assert ryu_oya_tenpai.next_state["kyoku_idx"] == 0   # 亲听牌连庄
    assert ryu_oya_tenpai.next_state["honba"] == 1
    assert ryu_oya_tenpai.next_state["kyotaku"] == 1     # 供托携入
    assert not ryu_oya_tenpai.next_state["game_over"]


# ---------------------------------------------------------------- 顺位概率

def test_rank_prob_rows_sum_one_and_monotone():
    model = HeuristicRankModel()
    scores = [45000, 30000, 20000, 5000]
    prob = model.rank_prob(4, 0, 0, scores)
    for row in prob:
        assert abs(sum(row) - 1.0) < TOL
        assert all(0.0 <= p <= 1.0 for p in row)
    for rank in range(4):  # 每列和=1（每个顺位恰一人）
        assert abs(sum(prob[s][rank] for s in range(4)) - 1.0) < TOL
    # 分高者高位概率不低于分低者
    for i in range(3):
        assert prob[i][0] >= prob[i + 1][0] - TOL
    # 分高者期望顺位更优（严格递增）
    exp_rank = [sum((r + 1) * prob[s][r] for r in range(4)) for s in range(4)]
    assert exp_rank[0] < exp_rank[1] < exp_rank[2] < exp_rank[3]


def test_rank_prob_even_scores_uniform():
    prob = HeuristicRankModel().rank_prob(0, 0, 0, EVEN)
    for row in prob:
        for p in row:
            assert abs(p - 0.25) < 1e-6


def test_rank_prob_sharpens_late_game():
    """同一分差，剩余局数越少分布越集中（温度衰减）。"""
    scores = [33000, 25000, 22000, 20000]
    early = HeuristicRankModel().rank_prob(0, 0, 0, scores)   # 东1
    late = HeuristicRankModel().rank_prob(7, 0, 0, scores)    # 南4
    assert late[0][0] > early[0][0]


# ---------------------------------------------------------------- analyze

REQ_EVEN = {"kyoku_idx": 0, "honba": 0, "kyotaku": 0, "scores": EVEN,
            "table": "特上", "dan": "四段"}


def test_analyze_shape_and_even_pt_ev():
    out = analyze(REQ_EVEN)
    assert set(out) == {"rank_prob", "pt_ev", "endings"}
    assert len(out["rank_prob"]) == 4
    for row in out["rank_prob"]:
        assert abs(sum(row) - 1.0) < TOL
    # 均分局面：四个顺位等概率，pt_ev = (75+30+0-90)/4 = 3.75（特上卓 × 四段）
    for ev in out["pt_ev"]:
        assert abs(ev - 3.75) < 1e-6   # (75+30+0-90)/4 = 15/4，東南戦表
    assert len(out["endings"]) == 160
    for e in out["endings"]:
        assert len(e["deltas"]) == 4
        assert len(e["pt_ev"]) == 4
        for i in range(4):
            assert abs(e["ev_diff"][i] - (e["pt_ev"][i] - out["pt_ev"][i])) < TOL


def test_analyze_ron_ending_hand_calc():
    """东1局0本场0供托 25000×4：座位1荣和座位0素点8000 → deltas [-8000,+8000,0,0]。"""
    out = analyze(REQ_EVEN)
    e = next(e for e in out["endings"]
             if e["kind"] == "ron" and e["winner"] == 1 and e["loser"] == 0
             and e["base_score"] == 8000)
    assert e["deltas"] == [-8000, 8000, 0, 0]
    # 和了者 ev 上升、放铳者 ev 下降
    assert e["ev_diff"][1] > 0 > e["ev_diff"][0]


def test_analyze_tsumo_honba_ending():
    """1本场下子自摸分摊进入枚举表。"""
    out = analyze({**REQ_EVEN, "honba": 1})
    e = next(e for e in out["endings"]
             if e["kind"] == "tsumo" and e["winner"] == 1 and e["base_score"] == 8000)
    assert e["deltas"] == [-4100, 8300, -2100, -2100]


def test_analyze_custom_pt():
    out = analyze({**REQ_EVEN,
                   "custom_pt": {"first": 90, "second": 45, "third": 0, "fourth": -135}})
    for ev in out["pt_ev"]:  # 均分：(90+45+0-135)/4 = 0
        assert abs(ev - 0.0) < 1e-6


def test_analyze_game_over_south4():
    """南4结束且头名≥30000 → 终局，局后 pt_ev 为确定值。"""
    out = analyze({"kyoku_idx": 7, "honba": 0, "kyotaku": 0,
                   "scores": [40000, 30000, 20000, 10000],
                   "table": "特上", "dan": "四段"})
    e = next(e for e in out["endings"]
             if e["kind"] == "ron" and e["winner"] == 1 and e["loser"] == 2
             and e["base_score"] == 8000)
    # 新分 [40000,38000,12000,10000]，头名≥30000 → 终局
    assert e["next_state"]["game_over"] is True
    assert e["pt_ev"] == [75.0, 30.0, 0.0, -90.0]


def test_analyze_west4_forced_end_and_seat_tiebreak():
    """西4强制终局（即使头名<30000）；同分按座位序（起家优先）。"""
    out = analyze({"kyoku_idx": 11, "honba": 0, "kyotaku": 0,
                   "scores": EVEN, "table": "特上", "dan": "四段"})
    e = next(e for e in out["endings"]
             if e["kind"] == "ryuukyoku" and e["tenpai"] == [0, 0, 0, 0])
    assert e["next_state"]["game_over"] is True
    assert e["pt_ev"] == [75.0, 30.0, 0.0, -90.0]  # 全同分 → 起家优先定序


def test_analyze_rejects_bad_input():
    with pytest.raises(ValueError):
        analyze({**REQ_EVEN, "kyoku_idx": 12})
    with pytest.raises(ValueError):
        analyze({**REQ_EVEN, "honba": -1})
    with pytest.raises(ValueError):
        analyze({**REQ_EVEN, "scores": [25000, 25000, 25000]})


@pytest.mark.parametrize('patch', [
    {'kyoku_idx': True}, {'kyoku_idx': 0.5}, {'honba': 0.5},
    {'honba': 101}, {'kyotaku': 101}, {'kyotaku': False},
    {'scores': [float('nan'), 25000, 25000, 25000]},
    {'scores': [float('inf'), 25000, 25000, 25000]},
    {'scores': [True, 25000, 25000, 25000]},
    {'scores': [25101, 25000, 25000, 25000]},
    {'scores': [1000100, 25000, 25000, 25000]},
    {'scores': [-100100, 25000, 25000, 25000]},
    {'scores': '2500'}, {'scores': None},
    {'custom_pt': {'first': 75}}, {'custom_pt': 'invalid'},
    {'custom_pt': {'first': True, 'second': 30, 'third': 0, 'fourth': -90}},
    {'custom_pt': {'first': 1001, 'second': 30, 'third': 0, 'fourth': -90}},
    {'custom_pt': {'first': 75, 'second': 30, 'third': 0, 'fourth': -90, 'extra': 1}},
    {'table': []}, {'dan': None},
])
def test_validation_rejects_invalid_public_input(patch):
    with pytest.raises(ValueError):
        analyze({**REQ_EVEN, **patch})


@pytest.mark.parametrize('bad_req', [None, [], {}, {'kyoku_idx': 0}])
def test_missing_request_fields_are_value_errors(bad_req):
    with pytest.raises(ValueError):
        analyze(bad_req)


@pytest.mark.parametrize('scores', [
    [25700, 9200, 63700, 23800], [77000, 5200, 9500, 8300],
    [1000000, 50000, 25000, -100000],
])
def test_extreme_scores_preserve_probability_distribution(scores):
    prob = HeuristicRankModel().rank_prob(11, 0, 0, scores)
    for row in prob:
        assert sum(row) == pytest.approx(1, abs=1e-12)
        assert all(0 <= p <= 1 for p in row)
    for rank in range(4):
        assert sum(row[rank] for row in prob) == pytest.approx(1, abs=1e-12)
    # Very large leading score must not make the other three seats equally strong.
    if scores[0] == 1000000:
        assert prob[1][1] > .99


def test_terminal_round_never_leaves_input_domain():
    result = analyze({**REQ_EVEN, 'kyoku_idx': 11})
    assert all(e['next_state']['game_over'] for e in result['endings'])
    assert all(e['next_state']['kyoku_idx'] == 11 for e in result['endings'])


def test_json_integer_values_accept_decimal_and_exponent_notation_without_mutation():
    import copy
    import json
    request = json.loads('{"kyoku_idx":0.0,"honba":1e0,"kyotaku":-0.0,"scores":[2.5e4,25000.0,25000,25000],"custom_pt":{"first":75.0,"second":3e1,"third":-0.0,"fourth":-90.0}}')
    before = copy.deepcopy(request)
    expected = {"kyoku_idx": 0, "honba": 1, "kyotaku": 0, "scores": [25000] * 4,
                "custom_pt": {"first": 75, "second": 30, "third": 0, "fourth": -90}}
    assert analyze(request) == analyze(expected)
    assert request == before
    assert type(request['kyoku_idx']) is float


def test_integral_pttable_values_are_normalized_without_mutation():
    pt = PtTable(75.0, 30.0, 0.0, -90.0)
    assert analyze({**REQ_EVEN, 'custom_pt': pt}) == analyze(REQ_EVEN)
    assert type(pt.first) is float
