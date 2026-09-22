# 截图来源 / 截圖來源 / Screenshot sources

实测与截取日期 / 實測與擷取日期 / Captured: 2026-09-21（段位分析 / 段位分析 / rank analysis）· 2026-09-22（牌谱复盘两图 / 牌譜複盤兩圖 / the two replay images）.

README中的前三张图来自本次在[TingQue.ai](https://tingque.ai/)实际完成的牌谱解析和段位计算。最后一张是本仓库运行后的本地分析器界面。图片中的百分比对应具体局面。

⚠️ 关于「匿名」：官网报告截图使用了页面的「匿名」选项，**它只把玩家名替换为玩家A–D，不隐藏手牌**（隐藏手牌是另一个独立选项，默认关闭）。因此「开启匿名」不等于可以安全公开——本次之所以能公开，是因为所用牌谱本身是公开示例牌谱。**换用任何非公开牌谱前，必须同时开启隐藏手牌，并重新评估是否可公开。**

README中的前三張圖來自本次在[TingQue.ai](https://tingque.ai/)實際完成的牌譜解析和段位計算。最後一張是本儲存庫執行後的本機分析器介面。圖片中的百分比對應具體局面。

⚠️ 關於「匿名」：官網報告截圖使用了頁面的「匿名」選項，**它只把玩家名替換為玩家A–D，不隱藏手牌**（隱藏手牌是另一個獨立選項，預設關閉）。因此「開啟匿名」不等於可以安全公開——本次之所以能公開，是因為所用牌譜本身是公開範例牌譜。**換用任何非公開牌譜前，必須同時開啟隱藏手牌，並重新評估是否可公開。**

The first three README images were captured after completing replay analysis and a rank calculation on [TingQue.ai](https://tingque.ai/). The final image shows this repository's local analyzer. Percentages in the images refer to particular positions.

⚠️ About the anonymous option: the website screenshots used the page's anonymous display, which **only replaces player names with Player A–D — it does not conceal hands** (concealing hands is a separate option, off by default). Enabling anonymity therefore does not by itself make a report safe to publish; these images are publishable because the underlying replay is a public sample. **Before using any non-public replay, enable hand concealment as well and re-assess whether it may be published.**

| 文件 / File | 实际内容 / 實際內容 / Actual content | 来源 / Source |
| --- | --- | --- |
| [tingque-replay.jpg](images/tingque-replay.jpg) | 东1第13巡，实际打4筒、AI推荐东 / 東1第13巡，實際打4筒、AI推薦東 / East 1, turn 13: played 4-pin versus recommended East | 本次生成的听雀报告 / 本次產生的聽雀報告 / Report generated in this session |
| [tingque-replay-analysis.jpg](images/tingque-replay-analysis.jpg) | 同一决策点的候选、危险度、听牌率 / 同一決策點的候選、危險度、聽牌率 / Candidates, danger and tenpai at the same decision | 同一报告的分析面板 / 同一報告的分析面板 / Analysis panel of the same report |
| [tingque-rank-analysis.jpg](images/tingque-rank-analysis.jpg) | 南3局的输入、顺位概率、pt期望及结局 / 南3局的輸入、順位機率、pt期望及結局 / South 3 inputs, placement probabilities, expected pt and outcomes | [官网段位分析 / 官網段位分析 / Website rank analyzer](https://tingque.ai/rankpt) |
| [analyzer.png](images/analyzer.png) | 开源下载版的本地段位分析 / 開源下載版的本機段位分析 / Local analyzer in the open-source download | [浏览器测试 / 瀏覽器測試 / Browser test](../tests/browser.spec.ts) |

## 牌谱与输入 / 牌譜與輸入 / Replay and inputs

公开天凤牌谱 / 公開天鳳牌譜 / Public Tenhou replay:

本次使用的是 2016 年的一局天凤四人东南战牌谱（13个小局）。**此处不登载该牌谱的编号与直链**——截图虽已匿名显示，但一旦给出原局地址，任何人都能把玩家A–D 对回真实账号，而报告中含有针对具体一手的评价。要复核下方数值，可在官网自行解析任一牌谱。

本次使用的是 2016 年的一局天鳳四人東南戰牌譜（13個小局）。**此處不登載該牌譜的編號與直連**——截圖雖已匿名顯示，但一旦給出原局地址，任何人都能把玩家A–D 對回真實帳號，而報告中含有針對具體一手的評價。要複核下方數值，可在官網自行解析任一牌譜。

A 2016 Tenhou four-player East–South replay (13 hands) was used. **Its replay ID and direct link are deliberately omitted here** — the screenshots are anonymised, but publishing the original replay address would let anyone map Player A–D back to real accounts, and the report contains judgements about individual discards. To reproduce the figures below, analyse any replay of your own on the website.

该牌谱也是[kobalab/tenhou-log](https://github.com/kobalab/tenhou-log)使用文档中的公开示例。本次先确认原始XML可读取，包含13个小局，再在听雀完成解析；选择起家东视角、开启匿名，并定位分歧列表第4项「东1局 第13巡」。截图中的55.9%是该手推荐东的推荐度，73.0%是该主视角整场与AI的一致率，均不代表模型总体准确率。

該牌譜也是[kobalab/tenhou-log](https://github.com/kobalab/tenhou-log)使用文件中的公開範例。本次先確認原始XML可讀取，包含13個小局，再在聽雀完成解析；選擇起家東視角、開啟匿名，並定位分歧清單第4項「東1局 第13巡」。截圖中的55.9%是該手推薦東的推薦度，73.0%是該主視角整場與AI的一致率，均不代表模型整體準確率。

This replay is a public example in the [kobalab/tenhou-log documentation](https://github.com/kobalab/tenhou-log). Its XML was checked and contained 13 hands before submission to TingQue. The capture uses the initial East player's viewpoint, anonymous display and divergence entry 4, East 1 / turn 13. The 55.9% value is the recommendation score for East at that decision; 73.0% is that player's agreement with the AI across this match. Neither is a benchmark of overall model accuracy.

官网段位分析的输入为南3局、0本场、0供托、四家39,000／28,000／18,000／15,000点、特上四段；官网按百点输入为390／280／180／150。点击「分析」后，截图中的四家pt EV依次为+72.0、+29.0、−26.2、−59.7。本地截图使用东1、四家25,000点、特上四段的默认输入。

官網段位分析的輸入為南3局、0本場、0供託、四家39,000／28,000／18,000／15,000點、特上四段；官網按百點輸入為390／280／180／150。點擊「分析」後，截圖中的四家pt EV依序為+72.0、+29.0、−26.2、−59.7。本機截圖使用東1、四家25,000點、特上四段的預設輸入。

The website rank calculation uses South 3, zero honba and deposits, scores of 39,000 / 28,000 / 18,000 / 15,000 and Tokujou / 4-dan. The website expects scores in hundreds: 390 / 280 / 180 / 150. After calculation, its displayed pt EV values are +72.0, +29.0, −26.2 and −59.7. The local screenshot uses the default East 1 position with four scores of 25,000 and the same preset.

## 更新 / Update

官网图片通过实际操作页面后截取，按浏览器返回的原始JPEG字节保存；截图前滚动到对应功能区域。更新时核对页面状态、玩家匿名显示、三版README图注、来源与校验值，再重新打包。

🔴 **换图必查两条，缺一条就不要提交**：① 所用牌谱是否为公开示例牌谱——非公开牌谱一律不可用作对外截图；② **手牌可见性是否已确认**——只勾「匿名」只替换玩家名，手牌仍然全部可见；**仅当牌谱本身已公开时才可以只开匿名**（本仓库现有截图即属此种），其余一切情况必须同时开启隐藏手牌。另外，不要在本文件或README里登载牌谱编号或原局直链。

官網圖片透過實際操作頁面後擷取，按瀏覽器回傳的原始JPEG位元組保存；截圖前捲動至對應功能區域。更新時核對頁面狀態、玩家匿名顯示、三版README圖說、來源與校驗值，再重新打包。

🔴 **換圖必查兩條，缺一條就不要提交**：① 所用牌譜是否為公開範例牌譜——非公開牌譜一律不可用作對外截圖；② **手牌可見性是否已確認**——只勾「匿名」只替換玩家名，手牌仍然全部可見；**僅當牌譜本身已公開時才可以只開匿名**（本儲存庫現有截圖即屬此種），其餘一切情況必須同時開啟隱藏手牌。另外，不要在本文件或README裡登載牌譜編號或原局直連。

Website screenshots retain the browser's original JPEG bytes, with the page scrolled to the relevant functional area before capture. When updating them, verify the page state and anonymous labels, synchronize all three README captions and the source/checksum records, then rebuild the release.

🔴 **Two mandatory checks before committing a replacement screenshot:** (1) the replay must be a public sample replay — never use a non-public replay for outward-facing images; (2) **hand visibility must be settled** — the anonymous option alone only replaces player names, leaving every hand visible; **anonymity alone is acceptable only when the replay is itself public** (as it is for the images in this repository), and hand concealment must be enabled in every other case. Also, never publish a replay ID or a direct replay link in this file or in any README.

本地截图 / 本機截圖 / Local screenshot:

```bash
npm run build
UPDATE_SCREENSHOTS=1 npm run test:browser -- --project=chromium --grep 'desktop:'
```

PowerShell:

```powershell
npm run build
$env:UPDATE_SCREENSHOTS='1'
npm run test:browser -- --project=chromium --grep 'desktop:'
Remove-Item Env:UPDATE_SCREENSHOTS
```

该命令仅更新`analyzer.png`。該命令僅更新`analyzer.png`。This command updates `analyzer.png` only.

官网实测图片SHA-256 / 官網實測圖片SHA-256 / Live website screenshot SHA-256:

```text
d999ac3e8bf0e5aa0d82b5ef728e32061fb9a1cfd49152879db1de3cf2d1679b  tingque-replay.jpg
4f7670c40cceadfe1241bab8e33523a1e111bb736fba8f0d8d498308bf11ed07  tingque-replay-analysis.jpg
93d5936f81bca60f0a773c5408300240a61477b77b39da2bed73c8fb06f8f0be  tingque-rank-analysis.jpg
```
