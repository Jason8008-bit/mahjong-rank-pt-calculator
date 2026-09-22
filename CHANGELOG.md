# Changelog

## 0.1.4 — 2026-09-23

- Move the Python reference implementation into the `rankpt` package (`engine.py`, `rules.py`, `cli.py`) and the Python tests into `tests/`, so the repository root holds no loose modules.
- Keep the public API unchanged: `from rankpt import analyze` and the installed `rankpt` command behave exactly as before; the module entry point is now `python -m rankpt.cli`.
- Leave every rank-pt table and rule constant untouched; this release changes only import paths, two code comments and documentation references.

## 0.1.3 — 2026-09-21

- Use screenshots captured from an actual TingQue.ai replay analysis and rank calculation in all three README editions, with anonymous replay labels enabled.
- Label the website reports and downloadable local analyzer separately, and document each screenshot's source and update process.
- Retire the ambiguous local overview image; local screenshot automation updates only the analyzer image.
- Keep one neutral project-website link per README instead of repeating promotional calls to action.

## 0.1.2 — 2026-09-21

- Replace the Japanese README with a complete Traditional Chinese edition; the supported documentation languages are Simplified Chinese, Traditional Chinese and English.
- Synchronize language navigation, version validation, public-copy checks and archive contents for the three README editions.
- Align contribution guidance and standalone web-package instructions with the same three languages.

## 0.1.1 — 2026-09-21

- Build release HTML from an isolated copy of the exact archived source; reject build warnings, missing resources, stale builds, mismatched versions and symlinked release paths.
- Accept equivalent integral JSON numbers in both engines without mutating requests; normalize Python float values before computation.
- Read UTF-8 JSON consistently from files and stdin, accept a BOM, and report malformed/deeply nested input without a traceback.
- Show launch instructions when the source HTML cannot load; improve text contrast and focus invalid-input messages.
- Cover all 12 rounds and raw JSON edge cases in parity checks; add release regressions and Chromium, Firefox and WebKit acceptance checks.
- Correct the supported Node.js 22 minimum to 22.13.0 and refresh the three README editions.

## 0.1.0 — 2026-09-21

- Responsive TingQue interface with five capability introductions and their destinations.
- Browser-local four-player East-South placement and rank-pt analysis with 160 representative outcomes.
- Scenario filters, sorting, details, presets, custom pt, JSON and CSV export.
- Python reference library and CLI; numerical stability and input-validation fixes.
- A standalone HTML build for offline use, alongside a standard static-site build.
- Simplified Chinese, English and Japanese README editions, algorithm notes, tests and release tooling.
