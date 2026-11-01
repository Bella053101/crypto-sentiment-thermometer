# Crypto 情緒溫度計 · Crypto Sentiment Thermometer

**Live site: https://bella053101.github.io/crypto-sentiment-thermometer/**

整體加密市場與 BTC、ETH、SOL 的 Fear & Greed 指數：最新讀值、情緒區間、近 30 天走勢，以及與昨日、上週、上月、去年同期的比較。中英雙語。

The Fear & Greed index for the overall crypto market, BTC, ETH and SOL: latest readings, sentiment zones, a 30-day trend, and comparisons with yesterday, last week, last month and a year ago. Bilingual (中文 / English).

> 本頁僅整理市場情緒資訊，指數不能預測價格，也不構成任何投資或買賣建議。
> This page summarizes market sentiment only. The index does not predict prices and is not investment or trading advice.

## 運作方式 · How it works

1. 開啟頁面時，先用內建備份資料（`data/snapshot.js`）畫出完整頁面。
   The page first draws itself from built-in backup data (`data/snapshot.js`).
2. 瀏覽器直接呼叫 [CryptoKeyhole Fear & Greed API](https://cryptokeyhole.com/fear-and-greed-index/api/)，不需要 API key 或後端伺服器，成功後換成即時資料。
   The browser then calls the CryptoKeyhole API directly (no API key, no backend) and switches to live data.
3. 頁面開著時每 30 分鐘自動更新；API 連不上時會清楚標示正在使用備份資料。
   While open it refreshes every 30 minutes; if the API is unreachable, it clearly says it is showing backup data.

## 檔案 · Files

| 檔案 File | 用途 Purpose |
|---|---|
| `index.html` | 頁面結構 Page structure |
| `style.css` | 版面與淺色／深色主題 Layout, light and dark themes |
| `app.js` | 讀取 API、中英文字、圖表 API calls, text in both languages, charts |
| `data/snapshot.js` | 備份資料 Backup data |
| `update_snapshot.js` | 更新備份資料 Refresh the backup: `node update_snapshot.js` |

純 HTML、CSS、JavaScript，沒有任何套件或建置步驟。Plain HTML, CSS and JavaScript, with no dependencies or build step.

## 資料來源 · Data source

Fear & Greed Index by [CryptoKeyhole](https://cryptokeyhole.com/fear-and-greed-index/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
