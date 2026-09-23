[简体中文](usage.md) | [繁體中文](usage.zh-TW.md) | [English](usage.en.md)

# TingQue · Usage and development

[Back to project overview](../README.en.md)

This repository opens the **toolkit frontend, independently runnable rank-analysis engine, Python reference implementation and tests**. The application's other four entries open TingQue's corresponding services; their server-side models and inference systems are outside this repository.

## Use rank analysis immediately

Extract `tingque-open-tool-v0.1.5-web.zip` and double-click `index.html`. No Python or Node.js installation is needed for that build. Rank analysis and JSON/CSV export work offline; TingQue destinations require a network connection.

1. Set the round, honba, riichi sticks and the four scores in fixed initial seat order.
2. Select Tenhou four-player East-South pt or enter custom placement points.
3. Press the calculation button to compare placement probabilities, pt and outcome changes.
4. Change perspective, filter and sort outcomes, expand details, or export all 160 outcomes.

The default East 1 state has four scores of 25,000 and Tokujou/fourth-dan pt: each placement is 25%, with **+3.75 pt** per seat. Editing inputs displays a reminder to recalculate. Scores and results stay in the current page and are not uploaded. The web interface is in Simplified Chinese.

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

On Windows, create the environment with `py -m venv .venv`, use `.venv\Scripts\python.exe` for `python`, and `.venv\Scripts\rankpt.exe` for the CLI. Alternatively run `python -m rankpt.cli analyze examples/request.json`. Omit the input file or use `-` to read JSON from standard input. Files and stdin are decoded as UTF-8 with an optional UTF-8 BOM; output and errors also use UTF-8. Invalid input writes to standard error and exits with code 2. Integral JSON values such as `0.0` and `2.5e4` are accepted; booleans, fractional values and infinity are rejected.

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

A Plackett–Luce heuristic combines score differences across all 24 finishing orders, with temperature `2000 × max(8 − kyoku_idx, 1)`. Expected pt is the sum of each placement probability times its pt value. This is separate from TingQue's replay AI model.

The 160 outcomes consist of **108 ron + 36 tsumo + 16 exhaustive-draw scenarios**. Each returns score transfers, the next state, all four placement distributions and pt changes. Outcome occurrence probabilities are not modeled; averaging the scenarios equally does not produce a strategy expectation.

Built-in pt follows the [official Tenhou four-player East-South table](https://tenhou.net/man/#DAN). Tsumo divides an equivalent total score and rounds each payment up to 100; it is not a complete fu/han payment table. See the detailed [input contract, algorithm and boundaries](algorithm.md) in Chinese.

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

`verify` runs lint, type checking, unit/component tests, field-by-field Python/TypeScript parity, public-copy checks, release regressions using actual builds, and both builds. Parity covers 7 fixed cases, 100 seeded cases spanning all 12 rounds, and 8 raw JSON edge cases; every valid case includes all 160 outcomes, at an absolute tolerance of `1e-12`. On Windows set `$env:PYTHON='.venv\Scripts\python.exe'` before parity; on macOS/Linux you may use `export PYTHON="$PWD/.venv/bin/python"`.

Browser tests run in Chromium, Firefox and WebKit, covering desktop, mobile widths, text contrast, keyboard error focus, exports and offline `file://` use. Opening the source HTML directly displays launch instructions.

`package:release` copies the listed source files to a temporary directory and builds the standalone page from that exact archive content, then writes source/web ZIPs and SHA-256 checksums to `release/`. Build warnings stop a release. Packaging checks source/HTML fingerprints, matching versions, isolated-build provenance and paths, rejecting missing assets, stale builds and symlinks. Use `build:standalone` for ordinary builds; direct Python packaging only accepts unchanged artifacts produced by `package:release`. Run `npm run package:release` again after editing code, documentation or screenshots. A GitHub Actions workflow is included; the same local commands work for a GitCode checkout.

## Model assumptions

Only four-player East-South games are modeled; hands, the wall and player strength are not inputs. Under the simplified end condition, South 4 or later ends when the highest score reaches 30,000; West 4 always ends. Ties use initial seat order. Bankruptcy termination, abortive draws, multiple ron, complete dealer continuation/end conditions and terminal unclaimed riichi-stick allocation are not implemented. The 160 scenarios are representative, not exhaustive of every legal outcome.

Use the local results for comparison, teaching and research, rather than official scoring or empirically calibrated win-rate prediction. Agreement between implementations does not establish agreement with real-world probabilities.

## Contributions and license

Model, rule and interface improvements are welcome; see [Contributing](../CONTRIBUTING.md). Repository code and documentation use the [MIT License](../LICENSE); bundled components have [third-party notices](../THIRD_PARTY_NOTICES.md). The license does not cover the external services' models or inference systems.
