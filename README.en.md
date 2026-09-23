[简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

# TingQue · 听雀

TingQue is a Japanese mahjong analysis and training toolkit. It includes AI replay review, rank analysis, first-discard simulation, hand inference and AI practice. Replay analysis supports four-player and three-player games from Tenhou, Mahjong Soul and Mahjong Hime.

**Official website: [https://tingque.ai/](https://tingque.ai/)**

**Replay review**

![Replay review: played tile compared with the AI recommendation](docs/images/tingque-replay.jpg)

## Features

| Capability | What it does |
| --- | --- |
| **AI replay review** | Tenhou and Mahjong Soul replay links and Mahjong Hime share codes; four- and three-player games; move candidates, recommendation scores, disagreements, mistakes, tenpai/risk estimates, placement forecasts, playback and sharing; multiple styles for four-player games. |
| **Rank analysis** | Enter the round, honba, riichi sticks, four scores, table and rank; estimate placement distributions and rank-pt expectation across 160 representative outcomes, with custom pt, filters and exports. |
| **First-discard simulation** | Select 1–4 candidates for the dealer's first discard, run AI continuations, and compare score expectation, win rate, deal-in rate and placement distributions. |
| **Hand inference** | In a four-player report, infer the concealed hand of an opponent with at least two open melds from public information; inspect up to 40 candidates with shanten, waits and point references. |
| **AI practice** | Invite 1–4 AI players to four-player East-only or East-South games, choosing balanced, closed-hand attack, open-hand attack or defensive styles individually. |

![Analysis panel: opponent danger and tenpai estimates](docs/images/tingque-replay-analysis.jpg)

**Rank analysis**

![Rank analysis: placement probabilities and expected pt](docs/images/tingque-rank-analysis.jpg)

## AI model

TingQue's model is further trained from a mainstream AI model. Based on internal matches, replay comparisons and real-world testing, its overall performance is well ahead of the mainstream AI models on the market and on par with high-strength models.

The model provides candidate action recommendations and position analysis for replays. Reports include recommendation scores, tenpai estimates, tile danger and placement forecasts, with different strategic styles available for comparison.

Four-player analysis and practice offer **balanced, closed-hand attack, open-hand attack and defensive** styles. Three-player review uses the balanced style, marks riichi players for tenpai and provides aggregate risk estimates. First-discard simulation, hand inference and AI practice are four-player features.

## Supported platforms and replay import

| Platform | Import method | Game types |
| --- | --- | --- |
| **Tenhou** | Paste the replay link. | Four-player and three-player. |
| **Mahjong Soul** | Paste the replay link. | Four-player and three-player. |
| **Mahjong Hime (雀姬)** | Share the replay in the game and import the copied share code; currently limited to the mainland Chinese servers. | Four-player and three-player. |

Tenhou-format replay JSON is also supported, with one replay per line for batch import.

Importing a replay produces a report with move-by-move playback, candidate recommendations and position metrics. Disagreement navigation locates decisions where the actual move differs from the AI recommendation.

## Using the features

- **AI replay review**: imported replays produce agreement and mistake-rate summaries, move-by-move analysis and playback. Navigate disagreements, switch strategic styles or generate a sharing link.
- **Rank analysis**: enter the round, four scores and pt configuration to view score transfers, placement probabilities and pt changes after ron, tsumo and draws. Switch perspective, filter and sort outcomes, and export JSON or CSV.
- **First-discard simulation**: enter the dealer's hand, dora indicator and position, then select 1–4 candidates for simulated play. Results list expected score, win rate, deal-in rate and placement distributions.
- **Hand inference**: select an opponent with at least two open melds in a four-player report. Inspect up to 40 candidate hands with shanten, waits and score references, and compare them with the actual hand.
- **AI practice**: select 1–4 AI players, their individual styles and East-only or East–South rules. Participate in a four-player match or use four AI players for an AI-only game. A replay link is provided after the match.

## Website and access

For feature access and further information, visit [TingQue at tingque.ai](https://tingque.ai/).

## Frontend development and builds

**Node.js 24** is recommended; Node.js 22.13+ in the 22 series and the 24 series are supported. From the repository root:

```bash
npm ci
npm run dev
```

Open the local address printed in the terminal. Build the regular static site and standalone edition:

```bash
npm run build
npm run build:standalone
npm run preview
```

Use `dist/` for static hosting, or double-click `dist-standalone/index.html`. The regular `dist/index.html` needs a static server. Fonts come from the system; local computation has no external API dependency.

## Python library and CLI

Requires **Python 3.10+**, with no third-party runtime dependencies. On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
rankpt analyze examples/request.json > result.json
python -m pytest -q
```

See [Usage and development](docs/usage.en.md) for Windows setup and CLI input details. Alternatively run `python -m rankpt.cli analyze examples/request.json`; omit the file or use `-` to read JSON from standard input.

```python
from rankpt import analyze

result = analyze({
    "kyoku_idx": 0, "honba": 0, "kyotaku": 0,
    "scores": [25000, 25000, 25000, 25000],
    "table": "特上", "dan": "四段"
})
print(result["pt_ev"])  # approximately [3.75, 3.75, 3.75, 3.75]
print(len(result["endings"]))  # 160
```

## How it calculates

Rank analysis uses a Plackett–Luce heuristic to estimate placements from score differences and remaining rounds, then combines placement probabilities with pt values. The 160 representative outcomes comprise **108 ron, 36 tsumo and 16 exhaustive-draw scenarios**, each returning transfers, the next state and pt changes.

See the [algorithm notes](docs/algorithm.md) for the input contract, scoring and model assumptions, or [Usage and development](docs/usage.en.md) for full operating instructions.

## Project structure

```text
src/content/          Capability copy and destinations
src/components/       Inputs, charts, outcome tables and page components
src/domain/           TypeScript engine, exports and unit tests
src/App.tsx           Product page
rankpt/engine.py      Python reference engine
rankpt/rules.py       Rank-pt and score constants
rankpt/cli.py         JSON command-line interface
fixtures/ examples/   Parity cases and runnable input
scripts/              Parity, copy checks and release packaging
tests/                Python unit tests and browser acceptance
docs/                 Algorithm notes and actual interface screenshots
```

## Checks and release packages

Prepare the Python environment above, then run:

```bash
python -m pytest -q
npm run verify
npx playwright install chromium firefox webkit
npm run test:browser
npm run package:release
```

`verify` runs lint, type checking, unit/component tests, field-by-field Python/TypeScript parity, copy checks, release regressions and both builds. Browser tests cover desktop and mobile interaction, exports and standalone use in Chromium, Firefox and WebKit.

`package:release` builds from a copy of the listed public source files and produces source/web ZIPs and SHA-256 checksums in `release/`. GitHub Actions provides automated checks; the same local commands work for GitCode. See [Usage and development](docs/usage.en.md) for environment setup, cross-platform steps and release details.

## Contributions and license

Model, rule and interface improvements are welcome; see [Contributing](CONTRIBUTING.md). Repository code and documentation use the [MIT License](LICENSE); bundled components have [third-party notices](THIRD_PARTY_NOTICES.md). The license does not cover the external services' models or inference systems.
