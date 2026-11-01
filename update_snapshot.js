// 更新網頁內建的備份資料（API 無法連線時使用）。
// 執行：node outputs/web/update_snapshot.js
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://cryptokeyhole.com/api/v1/fear-and-greed';
const COINS = [['MARKET', '?limit=30'], ['BTC', '?coin=btc&limit=30'], ['ETH', '?coin=eth&limit=30'], ['SOL', '?coin=sol&limit=30']];

async function main() {
  const raw = {};
  for (const [coin, query] of COINS) {
    const res = await fetch(API + query);
    if (!res.ok) throw new Error(`${coin}: HTTP ${res.status}`);
    const j = await res.json();
    if (!Array.isArray(j.history) || j.history.length === 0) throw new Error(`${coin}: 沒有 history`);
    // 只保留網頁用得到的欄位
    raw[coin] = {
      value: j.value, label: j.label, band: j.band, date: j.date, status: j.status,
      delayed: j.delayed, updatedAt: j.updatedAt, previous: j.previous,
      history: j.history.map((h) => ({ date: h.date, value: h.value, label: h.label, band: h.band, status: h.status })),
    };
  }
  const out = path.join(__dirname, 'data', 'snapshot.js');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const snapshot = { fetchedAt: new Date().toISOString(), raw };
  fs.writeFileSync(out, '// 備份資料：由 update_snapshot.js 產生，請勿手動修改\nwindow.FNG_SNAPSHOT = ' + JSON.stringify(snapshot) + ';\n');
  console.log('已寫入', out, Object.entries(raw).map(([c, r]) => `${c} ${r.value} ${r.date} ${r.status}`).join('｜'));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
