[简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

# 听雀 TingQue

听雀（TingQue）是一套日本麻将分析与训练工具，包含 AI 牌谱复盘、段位分析、第一打模拟、局面逆推和 AI 陪练。牌谱分析支持天凤、雀魂和雀姬，覆盖四人麻将与三人麻将。

**官网地址：[https://tingque.ai/](https://tingque.ai/)**

**牌谱复盘**

![牌谱复盘：实际打牌与AI推荐对照](docs/images/tingque-replay.jpg)

## 功能概览

| 功能 | 能力说明 |
| --- | --- |
| **AI 牌谱复盘** | 天凤、雀魂链接与雀姬分享码；四麻、三麻；逐手候选与推荐度、分歧与恶手、听牌率、危险度、顺位预测、整局回放与分享；四麻支持多种策略风格。 |
| **段位分析** | 输入场局、本场、供托、四家点数、想定卓与段位，估计顺位分布和 pt 期望，比较160项代表性结局；支持自定义pt、筛选与导出。 |
| **第一打模拟** | 为庄家第一打选择1–4张候选，让AI分别展开实打模拟，比较得点期望、和牌率、放铳率与顺位分布。 |
| **局面逆推** | 在四麻报告中，根据公开信息推测至少两组副露的对手手牌，列出最多40种候选及向听、待张与点数参考。 |
| **AI 陪练** | 呼叫1–4个AI进行四人东风或半庄对局，分别选择平衡、门清进攻、副露进攻或防守风格。 |

![分析面板：危险度与听牌率](docs/images/tingque-replay-analysis.jpg)

**段位分析**

![段位分析：顺位概率与pt期望](docs/images/tingque-rank-analysis.jpg)

## AI 模型

听雀（TingQue）基于主流AI模型进行二次训练，经过内部对战训练，复盘比较以及实际测试的结果，得出的结论整体表现远优于市面上的主流AI模型。与高强模型实力相当。

模型用于牌谱中的候选动作推荐和局面分析。报告提供推荐度、听牌率、危险度与顺位预测，并可切换不同策略风格查看结果。

四麻支持**平衡、门清进攻、副露进攻、防守**四种策略风格，用于复盘比较和AI陪练。三麻使用平衡风格，听牌率标记立直家、危险度为综合估计；第一打模拟、局面逆推与AI陪练适用于四麻。

## 支持的平台与牌谱导入

| 平台 | 导入方式 | 对局类型 |
| --- | --- | --- |
| **天凤** | 粘贴对局牌谱链接。 | 四人麻将、三人麻将。 |
| **雀魂** | 粘贴对局牌谱链接。 | 四人麻将、三人麻将。 |
| **雀姬** | 从游戏中分享牌谱，复制分享码后导入；目前只支持国内服。 | 四人麻将、三人麻将。 |

另支持天凤格式牌谱 JSON，可在牌谱粘贴解析中按行批量导入。

导入后生成分析报告，包含逐手回放、候选推荐和局面指标。报告中的分歧导航可定位到实际选择与AI推荐不同的决策点。

## 功能使用说明

- **AI 牌谱复盘**：导入牌谱后，报告显示一致率、恶手率、逐手分析与回放。可跳转分歧点、切换策略风格，并生成分享链接。
- **段位分析**：输入场局、四家点数与pt配置，查看荣和、自摸、流局后的点数转移、顺位概率和pt变化；支持切换观察座位、筛选、排序与JSON/CSV导出。
- **第一打模拟**：输入庄家手牌、宝牌指示与局况，选择1–4张候选进行实打模拟，结果列出得点期望、和牌率、放铳率和顺位分布。
- **局面逆推**：在四麻报告中选择已有至少两组副露的对手，查看最多40种候选手牌及向听、待张、点数参考，并与实际手牌对照。
- **AI 陪练**：选择1–4个AI、各自的策略风格及东风或半庄规则。可参与四人对局，或设置4个AI进行对战；对局结束后提供牌谱链接。

## 官网与使用

功能使用与更多说明：[访问听雀 tingque.ai](https://tingque.ai/)。

## 前端开发与构建

推荐 **Node.js 24**；支持Node.js 22.13+的22系列或24系列。在仓库根目录运行：

```bash
npm ci
npm run dev
```

打开终端显示的本地地址。构建标准静态网站与单文件版：

```bash
npm run build
npm run build:standalone
npm run preview
```

`dist/`用于静态托管，`dist-standalone/index.html`可直接双击。普通`dist/index.html`应通过静态服务器访问。所有字体使用系统字体，段位计算不依赖外部接口。

## Python库与命令行

Python **3.10+**，运行时无第三方依赖。macOS/Linux：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
rankpt analyze examples/request.json > result.json
python -m pytest -q
```

Windows环境准备与命令行输入细节见[使用与开发](docs/usage.md)。也可使用`python -m rankpt.cli analyze examples/request.json`；省略文件或填`-`可从标准输入读取JSON。

```python
from rankpt import analyze

result = analyze({
    "kyoku_idx": 0, "honba": 0, "kyotaku": 0,
    "scores": [25000, 25000, 25000, 25000],
    "table": "特上", "dan": "四段"
})
print(result["pt_ev"])  # 约 [3.75, 3.75, 3.75, 3.75]
print(len(result["endings"]))  # 160
```

## 计算原理

段位分析采用Plackett–Luce启发式模型，结合分差与剩余局数估计顺位概率，再按各顺位的pt计算期望。160项代表性结局包括 **108项荣和、36项自摸与16项流局**，每项给出点数转移、局后状态及pt变化。

输入契约、计分方式与模型假设见[算法说明](docs/algorithm.md)；完整运行方式见[使用与开发](docs/usage.md)。

## 项目结构

```text
src/content/          五项能力的文案与入口
src/components/       输入、图表、结局表与页面组件
src/domain/           TypeScript计算引擎、导出与测试
src/App.tsx           产品页面
rankpt/engine.py      Python参考引擎
rankpt/rules.py       pt与点数常量
rankpt/cli.py         JSON命令行
fixtures/ examples/   对照案例与可运行输入
scripts/              跨语言校验、文案检查与发布打包
tests/                Python单元测试与浏览器验收
docs/                 算法说明与实际界面截图
```

## 检查与发布包

先准备上述Python环境，再运行：

```bash
python -m pytest -q
npm run verify
npx playwright install chromium firefox webkit
npm run test:browser
npm run package:release
```

`verify`执行lint、类型检查、单元与界面测试、Python/TypeScript逐字段比对、文案检查、发布回归与两种构建。浏览器测试覆盖Chromium、Firefox和WebKit的桌面与移动端交互、导出和单文件运行。

`package:release`从公开源码清单的副本构建网页，在`release/`生成源码包、网页包和SHA-256清单。GitHub Actions提供自动检查；GitCode可使用相同本地命令。环境设置、跨平台步骤与发布细节见[使用与开发](docs/usage.md)。

## 贡献与许可

欢迎改进模型、规则与界面，见[贡献说明](CONTRIBUTING.md)。仓库代码及文档采用[MIT License](LICENSE)，第三方组件见[许可声明](THIRD_PARTY_NOTICES.md)；许可范围不包含外部服务的模型与推理系统。
