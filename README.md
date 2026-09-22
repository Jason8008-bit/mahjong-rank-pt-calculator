[简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

# 日本麻将段位 pt 计算器

**按天凤官方东南战 pt 表，估计四家顺位概率与 pt 期望 · 纯前端、离线可跑**

输入场局、本场、供托与四家点数，选择想定卓与段位，得到顺位概率、pt 期望，以及 160 项代表性结局的对比。

**适用范围（先看这条，免得白试）：只支持天凤的东南战（半庄）四人麻将。** pt 表取自天凤官方「段級位制 ■４人打ち」。三人麻将与东风战都不支持；雀魂与雀姬的段位分除顺位点外还要计入终局素点，公式与 pt 表都与本仓库不同，因此也不适用。

本仓库由**听雀 TingQue**（[tingque.ai](https://tingque.ai/)）开源。听雀另有 AI 牌谱复盘、第一打模拟、局面逆推与 AI 陪练，见下方「五项核心能力」——**那四项的服务端模型与推理系统不在本仓库内**，仓库里可独立运行的只有段位分析。

**听雀 · 真实牌谱复盘报告**

![听雀真实报告：实际打牌与AI推荐对照](docs/images/tingque-replay.jpg)

图为公开天凤牌谱在听雀网站实际解析后的界面，展示东1第13巡的实际打牌与AI推荐对照。截图使用了页面的「匿名」选项，它只把玩家名替换为玩家A–D，不隐藏手牌。下载版界面见下方本地段位分析。

## 五项核心能力

| 功能 | 能力说明 |
| --- | --- |
| **AI 牌谱复盘** | 天凤、雀魂链接与雀姬分享码；四麻、三麻；逐手候选与推荐度、分歧与恶手、听牌率、危险度、顺位预测、整局回放与分享；四麻支持多种策略风格。 |
| **段位分析** | 输入场局、本场、供托、四家点数、想定卓与段位，估计顺位分布和 pt 期望，比较160项代表性结局；支持自定义pt、筛选与导出。 |
| **第一打模拟** | 为庄家第一打选择1–4张候选，让AI分别展开实打模拟，比较得点期望、和牌率、放铳率与顺位分布。 |
| **局面逆推** | 在四麻报告中，根据公开信息推测至少两组副露的对手手牌，列出最多40种候选及向听、待张与点数参考。 |
| **AI 陪练** | 呼叫1–4个AI进行四人东风或半庄对局，分别选择平衡、门清进攻、副露进攻或防守风格。 |

![听雀真实报告：三家危险度与听牌率](docs/images/tingque-replay-analysis.jpg)

上图是同一决策点的真实分析面板，包含候选推荐、危险度与听牌率；图中百分比对应这一局面的估计。

**听雀 · 段位分析实测**

![听雀官网实际计算结果：南3局的顺位概率与pt期望](docs/images/tingque-rank-analysis.jpg)

在官网输入南3局、39,000／28,000／18,000／15,000点，选择特上四段后实际计算所得。操作与截图来源见[截图说明](docs/screenshots.md)。

## 模型与分析深度

听雀的AI分析将推荐选择和具体局面联系起来：逐手候选、分歧定位、风险估计、顺位预测与不同策略风格可相互对照。模拟结果和手牌逆推提供进一步研究线索；AI估计并不等于确定答案，也不承诺某个胜率或段位提升幅度。

牌谱复盘支持天凤、雀魂的四麻与三麻链接，以及雀姬国内服四麻与三麻分享码。三麻使用平衡风格，听牌率标记立直家、危险度为综合估计；第一打模拟、局面逆推、AI陪练与本仓库段位分析适用于四麻。

本仓库开源**工具前端、独立运行的段位分析引擎、Python参考实现及配套测试**。另外四项能力通过页面中的对应入口连接TingQue；其服务端模型与推理系统不包含在此仓库中。

## 立即使用段位分析

使用发布包 `tingque-open-tool-v0.1.4-web.zip`，解压后双击 `index.html`，即可在浏览器本地计算。无需安装Python或Node.js。离线状态可完成段位分析及JSON/CSV导出；TingQue功能入口需要网络连接。

1. 设置场局、本场、供托与固定起家座位的四家点数。
2. 选择天凤四人半庄pt或自定义四个顺位的pt。
3. 点击“计算段位期望”，比较顺位概率、pt与各结局变化。
4. 可切换观察座位、筛选结局、排序、展开详情；导出始终包含全部160项。

默认东1四家25,000点、特上四段，四个顺位各25%，每家期望 **+3.75 pt**。修改输入后会提示重新计算；点数和结果保留在当前页面，不上传。

**开源下载版 · 本地段位分析**

![开源下载版实际界面：本地段位分析](docs/images/analyzer.png)

上图来自本仓库运行后的界面，与网页包中的本地段位分析对应。

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

Windows可用`py -m venv .venv`，再使用`.venv\Scripts\python.exe`替代`python`；命令行为`.venv\Scripts\rankpt.exe`。也可执行`python -m rankpt.cli analyze examples/request.json`；省略文件或填`-`可从标准输入读取JSON。输入统一按UTF-8读取，文件与标准输入均支持UTF-8 BOM；输出及错误统一使用UTF-8。错误写入标准错误并返回退出码2。整数值可使用`0.0`或`2.5e4`等JSON数值写法，布尔值、非整数与无穷值仍会被拒绝。

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

顺位估计采用Plackett–Luce启发式模型，温度为`2000 × max(8 − kyoku_idx, 1)`，按分差汇总24种终局顺序；pt期望为各顺位概率乘对应pt之和。它不使用牌谱AI模型。

160项结局由 **108项荣和 + 36项自摸 + 16项流局** 组成。每项输出点数转移、局后状态、四家顺位与pt变化。结局没有发生概率，不能等权平均后当作策略收益。

内置pt依据[天凤官方四人東南戦表](https://tenhou.net/man/#DAN)。自摸采用等价总点数分摊并向上取整至100点；未按符番实现完整支付表。详见[输入契约、算法与规则边界](docs/algorithm.md)。

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

`verify`依次执行lint、类型检查、单元/界面测试、Python/TypeScript逐字段比对、公开文案检查、真实构建的发布回归测试与两种构建。比对包含7组固定输入、覆盖全部12个场局的100组固定种子输入，以及8组原始JSON边界输入；每组有效输入检查全部160项结局，绝对误差阈值`1e-12`。Windows运行比对前可设置`$env:PYTHON='.venv\Scripts\python.exe'`；macOS/Linux可用`export PYTHON="$PWD/.venv/bin/python"`。

浏览器测试在Chromium、Firefox与WebKit中覆盖桌面、移动宽度、文字对比度、键盘错误提示、导出和断网`file://`运行。源码HTML直接打开时会显示启动说明。

`package:release`先把发布清单中的文件复制到临时目录，仅用这份待归档源码构建单文件网页，再在`release/`生成源码包、网页包和SHA-256清单；构建警告会阻止发布。打包时核验源码与HTML指纹、版本、隔离构建记录及路径，拒绝缺失资源、过期构建或符号链接。`build:standalone`用于日常构建；直接Python打包只接受由`package:release`生成且未被改动的成品。更改源码、文档或截图后，重新运行`npm run package:release`。GitHub Actions提供自动检查配置；GitCode可使用相同本地命令。

## 模型假设

仅支持四人半庄；不读取手牌、牌山或玩家实力。南4起最高分达到30,000点即按简化规则结束，西4强制结束，同分按起家座位优先。未实现飞人结束、途中流局、多家和了、完整连庄终局分支及终局剩余供托分配。160项是代表性结局，并非全部实战可能。

因此，本地结果适合局面比较、教学与研究，不作为正式计分器或经实战校准的胜率预测。两种实现一致不代表模型概率与真实对局概率一致。

## 贡献与许可

欢迎改进模型、规则与界面，见[贡献说明](CONTRIBUTING.md)。仓库代码及文档采用[MIT License](LICENSE)，第三方组件见[许可声明](THIRD_PARTY_NOTICES.md)；许可范围不包含外部服务的模型与推理系统。
