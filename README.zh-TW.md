[简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

# 聽雀 TingQue

聽雀（TingQue）是一套日本麻將分析與訓練工具，包含 AI 牌譜復盤、段位分析、第一打模擬、局面逆推和 AI 陪練。牌譜分析支援天鳳、雀魂和雀姬，涵蓋四人麻將與三人麻將。

**官網網址：[https://tingque.ai/](https://tingque.ai/)**

**牌譜復盤**

![牌譜復盤：實際打牌與AI推薦對照](docs/images/tingque-replay.jpg)

## 功能概覽

| 功能 | 能力說明 |
| --- | --- |
| **AI 牌譜復盤** | 天鳳、雀魂連結與雀姬分享碼；四麻、三麻；逐手候選與推薦度、分歧與惡手、聽牌率、危險度、順位預測、整局回放與分享；四麻支援多種策略風格。 |
| **段位分析** | 輸入場局、本場、供託、四家點數、假定牌桌與段位，估計順位分布與 pt 期望，比較160項代表性結局；支援自訂pt、篩選與匯出。 |
| **第一打模擬** | 為莊家的第一打選擇1–4張候選牌，讓AI分別展開實打模擬，比較得點期望、和牌率、放銃率與順位分布。 |
| **局面逆推** | 在四麻報告中，根據公開資訊推測至少兩組副露的對手手牌，列出最多40種候選，以及向聽、待牌與點數參考。 |
| **AI 陪練** | 呼叫1–4個AI進行四人東風或半莊對局，分別選擇平衡、門清進攻、副露進攻或防守風格。 |

![分析面板：危險度與聽牌率](docs/images/tingque-replay-analysis.jpg)

**段位分析**

![段位分析：順位機率與pt期望](docs/images/tingque-rank-analysis.jpg)

## AI 模型

聽雀（TingQue）基於主流AI模型進行二次訓練，經過內部對戰訓練，復盤比較以及實際測試的結果，得出的結論整體表現遠優於市面上的主流AI模型。與高強模型實力相當。

模型用於牌譜中的候選動作推薦與局面分析。報告提供推薦度、聽牌率、危險度與順位預測，並可切換不同策略風格查看結果。

四麻支援**平衡、門清進攻、副露進攻、防守**四種策略風格，用於復盤比較與AI陪練。三麻使用平衡風格，聽牌率標記立直者、危險度為綜合估計；第一打模擬、局面逆推與AI陪練適用於四麻。

## 支援平台與牌譜匯入

| 平台 | 匯入方式 | 對局類型 |
| --- | --- | --- |
| **天鳳** | 貼上對局牌譜連結。 | 四人麻將、三人麻將。 |
| **雀魂** | 貼上對局牌譜連結。 | 四人麻將、三人麻將。 |
| **雀姬** | 從遊戲中分享牌譜，複製分享碼後匯入；目前只支援中國大陸伺服器。 | 四人麻將、三人麻將。 |

另支援天鳳格式牌譜 JSON，可在牌譜貼上解析中逐行批次匯入。

匯入後產生分析報告，包含逐手回放、候選推薦與局面指標。報告中的分歧導航可定位至實際選擇與AI推薦不同的決策點。

## 功能使用說明

- **AI 牌譜復盤**：匯入牌譜後，報告顯示一致率、惡手率、逐手分析與回放。可跳至分歧點、切換策略風格，並產生分享連結。
- **段位分析**：輸入場局、四家點數與pt設定，查看榮和、自摸、流局後的點數轉移、順位機率和pt變化；支援切換觀察座位、篩選、排序與JSON/CSV匯出。
- **第一打模擬**：輸入莊家手牌、寶牌指示與局況，選擇1–4張候選進行實打模擬，結果列出得點期望、和牌率、放銃率與順位分布。
- **局面逆推**：在四麻報告中選擇已有至少兩組副露的對手，查看最多40種候選手牌及向聽、待牌、點數參考，並與實際手牌對照。
- **AI 陪練**：選擇1–4個AI、各自的策略風格及東風或半莊規則。可參與四人對局，或設定4個AI進行對戰；對局結束後提供牌譜連結。

## 官網與使用

功能使用與更多說明：[前往聽雀 tingque.ai](https://tingque.ai/)。

## 前端開發與建置

建議使用 **Node.js 24**；支援22系列的Node.js 22.13以上版本，或24系列。在儲存庫根目錄執行：

```bash
npm ci
npm run dev
```

開啟終端機顯示的本機網址。建置標準靜態網站與單一檔案版本：

```bash
npm run build
npm run build:standalone
npm run preview
```

`dist/`用於靜態網站託管，`dist-standalone/index.html`可直接按兩下開啟。一般的`dist/index.html`應透過靜態伺服器存取。所有字型均使用系統字型，段位計算不依賴外部API。

## Python程式庫與命令列

需要Python **3.10以上版本**，執行時不依賴第三方套件。macOS/Linux：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
rankpt analyze examples/request.json > result.json
python -m pytest -q
```

Windows環境準備與命令列輸入細節見[使用與開發](docs/usage.zh-TW.md)。也可使用`python -m rankpt.cli analyze examples/request.json`；省略檔案或填`-`可從標準輸入讀取JSON。

```python
from rankpt import analyze

result = analyze({
    "kyoku_idx": 0, "honba": 0, "kyotaku": 0,
    "scores": [25000, 25000, 25000, 25000],
    "table": "特上", "dan": "四段"
})
print(result["pt_ev"])  # 約 [3.75, 3.75, 3.75, 3.75]
print(len(result["endings"]))  # 160
```

## 計算原理

段位分析採用Plackett–Luce啟發式模型，結合點差與剩餘局數估計順位機率，再依各順位的pt計算期望。160項代表性結局包括 **108項榮和、36項自摸與16項流局**，每項提供點數轉移、局後狀態及pt變化。

輸入規格、計分方式與模型假設見[演算法說明](docs/algorithm.md)；完整執行方式見[使用與開發](docs/usage.zh-TW.md)。

## 專案結構

```text
src/content/          五項能力的文案與入口
src/components/       輸入、圖表、結局表與頁面元件
src/domain/           TypeScript計算引擎、匯出與測試
src/App.tsx           產品頁面
rankpt/engine.py      Python參考引擎
rankpt/rules.py       pt與點數常數
rankpt/cli.py         JSON命令列程式
fixtures/ examples/   對照案例與可執行的輸入範例
scripts/              跨語言比對、文案檢查與發行打包
tests/                Python單元測試與瀏覽器驗收
docs/                 演算法說明與實際介面截圖
```

## 檢查與發行套件

先準備上述Python環境，再執行：

```bash
python -m pytest -q
npm run verify
npx playwright install chromium firefox webkit
npm run test:browser
npm run package:release
```

`verify`執行lint、型別檢查、單元與介面測試、Python/TypeScript逐欄位比對、文案檢查、發行回歸與兩種建置。瀏覽器測試涵蓋Chromium、Firefox和WebKit的桌面與行動裝置互動、匯出及單一檔案執行。

`package:release`從公開原始碼清單的副本建置網頁，於`release/`產生原始碼套件、網頁套件與SHA-256清單。GitHub Actions提供自動檢查；GitCode可使用相同本機命令。環境設定、跨平台步驟與發行細節見[使用與開發](docs/usage.zh-TW.md)。

## 貢獻與授權

歡迎改進模型、規則與介面，詳見[貢獻說明](CONTRIBUTING.md)。儲存庫的程式碼及文件採用[MIT License](LICENSE)，第三方元件詳見[授權聲明](THIRD_PARTY_NOTICES.md)；授權範圍不包含外部服務的模型與推論系統。
