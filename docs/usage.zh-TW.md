[简体中文](usage.md) | [繁體中文](usage.zh-TW.md) | [English](usage.en.md)

# 聽雀 TingQue · 使用與開發

[返回專案介紹](../README.zh-TW.md)

本儲存庫開源**工具前端、可獨立執行的段位分析引擎、Python參考實作及配套測試**。另外四項能力透過頁面中的對應入口連至TingQue；其伺服器端模型與推論系統不包含在此儲存庫中。

## 立即使用段位分析

使用發行套件 `tingque-open-tool-v0.1.5-web.zip`，解壓縮後按兩下 `index.html`，即可在瀏覽器本機計算。無須安裝Python或Node.js。離線狀態可完成段位分析及JSON/CSV匯出；TingQue功能入口需要網路連線。

1. 設定場局、本場、供託與以起家為基準固定座位的四家點數。
2. 選擇天鳳四人半莊pt，或自訂四個順位的pt。
3. 點擊「计算段位期望」，比較順位機率、pt與各結局變化。
4. 可切換觀察座位、篩選結局、排序、展開詳細資訊；匯出一律包含全部160項。

預設為東1、四家25,000點、特上四段，四個順位各25%，每家期望為 **+3.75 pt**。修改輸入後會提示重新計算；點數與結果保留在目前頁面，不會上傳。網頁介面使用簡體中文，上述按鈕名稱與實際介面一致。

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

Windows可用`py -m venv .venv`建立環境，再以`.venv\Scripts\python.exe`取代`python`；命令列程式為`.venv\Scripts\rankpt.exe`。也可執行`python -m rankpt.cli analyze examples/request.json`；省略檔案或填入`-`即可從標準輸入讀取JSON。輸入統一以UTF-8讀取，檔案與標準輸入均支援UTF-8 BOM；輸出與錯誤也統一使用UTF-8。輸入錯誤會寫入標準錯誤並回傳結束代碼2。整數值可採用`0.0`或`2.5e4`等JSON數值寫法；布林值、非整數與無窮值仍會被拒絕。

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

順位估計採用Plackett–Luce啟發式模型，溫度為`2000 × max(8 − kyoku_idx, 1)`，依點差彙總24種終局順序；pt期望為各順位機率乘以對應pt後的總和。它不使用牌譜AI模型。

160項結局由 **108項榮和 + 36項自摸 + 16項流局** 組成。每項輸出點數轉移、局後狀態、四家順位與pt變化。這些結局沒有各自的發生機率，不能以等權重平均當作策略收益。

內建pt依據[天鳳官方四人東南戰表](https://tenhou.net/man/#DAN)。自摸採用等價總點數分攤，並將各筆支付向上取整至100點；未依符、翻實作完整支付表。詳細的[輸入規格、演算法與規則邊界](algorithm.md)以簡體中文說明。

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

`verify`依序執行lint、型別檢查、單元與介面測試、Python/TypeScript逐欄位比對、公開文案檢查、真實建置的發行回歸測試，以及兩種建置。比對包含7組固定輸入、涵蓋全部12個場局的100組固定種子輸入，以及8組原始JSON邊界輸入；每組有效輸入都檢查全部160項結局，絕對誤差上限為`1e-12`。Windows執行比對前可設定`$env:PYTHON='.venv\Scripts\python.exe'`；macOS/Linux可使用`export PYTHON="$PWD/.venv/bin/python"`。

瀏覽器測試在Chromium、Firefox與WebKit中涵蓋桌面、行動裝置寬度、文字對比度、鍵盤錯誤提示、匯出，以及離線`file://`執行。直接開啟原始碼的HTML時會顯示啟動說明。

`package:release`先將發行清單中的檔案複製到暫存目錄，只用這份待封裝的原始碼建置單一檔案網頁，再於`release/`產生原始碼ZIP、網頁ZIP與SHA-256清單；建置警告會阻止發行。打包時核對原始碼與HTML指紋、版本、隔離建置記錄及路徑，拒絕缺少資源、過期建置或符號連結。`build:standalone`用於日常建置；直接執行Python打包只接受由`package:release`產生且未被更動的成品。修改原始碼、文件或截圖後，請重新執行`npm run package:release`。GitHub Actions提供自動檢查設定；GitCode可使用相同的本機命令。

## 模型假設

僅支援四人半莊；不讀取手牌、牌山或玩家實力。南4起，最高分達到30,000點即依簡化規則結束；西4強制結束，同分依起家座位順序優先。未實作飛人結束、途中流局、多家和了、完整連莊終局分支，以及終局剩餘供託分配。160項為代表性結局，並非全部實戰可能。

因此，本機結果適合局面比較、教學與研究，不作為正式計分器或經實戰校準的勝率預測。兩種實作一致，不代表模型機率與真實對局機率一致。

## 貢獻與授權

歡迎改進模型、規則與介面，詳見[貢獻說明](../CONTRIBUTING.md)。儲存庫的程式碼及文件採用[MIT License](../LICENSE)，第三方元件詳見[授權聲明](../THIRD_PARTY_NOTICES.md)；授權範圍不包含外部服務的模型與推論系統。
