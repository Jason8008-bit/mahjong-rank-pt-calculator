# Contributing / 参与贡献 / 參與貢獻

Use Node.js 24 and Python 3.10 or newer. Install with `npm ci` and `python3 -m pip install -e '.[test]'` inside a virtual environment.

1. Describe the intended behavior and its input/output before changing an engine.
2. Keep `rankpt/engine.py`, `rankpt/rules.py` and `src/domain/rankpt.ts` behavior aligned; add a regression case for algorithm changes.
3. Keep the three README editions and their `docs/usage*.md` guides synchronized. Product facts and routes belong in `src/content/features.ts`.
4. Run `python3 -m pytest -q`, `npm run verify`, `npx playwright install chromium firefox webkit`, and `npm run test:browser` before submitting a change.
5. Explain the change, the checks run, and any model assumptions in the pull request. Avoid real players' private replays or personal data in fixtures.

参与修改时，请同步 Python/TypeScript 两套算法与简体中文、繁体中文、英文三版 README 和使用文档；涉及计分或概率时补充回归案例并运行完整检查。官网产品截图的来源和更新步骤见[截图说明](docs/screenshots.md)。

參與修改時，請同步 Python/TypeScript 兩套演算法與簡體中文、繁體中文、英文三版 README 和使用文件；涉及計分或機率時補充回歸案例並執行完整檢查。公開範例請使用虛構局面，避免包含真實玩家的私人牌譜或個人資料。

README screenshots come from the live TingQue website. Follow the [screenshot update instructions](docs/screenshots.md); browser test artifacts do not replace these images.

Contributions are made under the repository's [MIT License](LICENSE). The license applies to this repository's code and documentation; it does not grant rights to external services, their models or third-party trademarks.

Release preparation: align package.json, package-lock.json, pyproject.toml, the asset names in the three usage guides and the latest CHANGELOG version. List every public source file in scripts/release-files.json. After final edits and screenshots, run `npm run package:release`: it builds an isolated copy of those exact source files, treats build warnings as errors and verifies versions, fingerprints and paths before packaging. Ordinary `build:standalone` output is for local use; direct Python packaging requires unchanged output from `package:release`.

Build checks flag unlisted files in `src/` and `public/`, local modules, emitted assets and Vite configuration dependencies. Provenance is invalidated before compilation and written after successful output. `npm run test:release` uses actual builds to cover failed compilation, omitted modules and missing CSS imports/images outside `src/`. Temporary staging files are cleaned automatically.
