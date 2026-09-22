"""日本麻将（立直麻将）段位 pt 分析器。

实现分在三个模块：

    engine.py   计算引擎：pt 表查询、点数转移、结局枚举、顺位概率
    rules.py    规则常量：天凤官方東南戦 pt 表等 5 项，可按需替换
    cli.py      JSON 命令行入口（``python -m rankpt.cli`` 或装包后的 ``rankpt``）

公开用法不受目录调整影响，与历来一致：

    from rankpt import analyze
"""

from .engine import (
    GOAL_SCORE,
    MAX_KYOKU_IDX,
    REGULAR_KYOKU,
    Ending,
    HeuristicRankModel,
    PtTable,
    analyze,
    enumerate_endings,
    resolve_pt_table,
    score_transfer,
)

__all__ = [
    "GOAL_SCORE",
    "MAX_KYOKU_IDX",
    "REGULAR_KYOKU",
    "Ending",
    "HeuristicRankModel",
    "PtTable",
    "analyze",
    "enumerate_endings",
    "resolve_pt_table",
    "score_transfer",
]
