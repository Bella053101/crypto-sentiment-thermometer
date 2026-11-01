/* Crypto 情緒溫度計：純 HTML / CSS / JavaScript，不需要任何套件
   流程：先用內建備份資料畫出完整頁面 → 呼叫 CryptoKeyhole API 取得即時資料 → 重畫
   ※ 本頁只整理市場情緒資訊，不預測價格，也不提供買賣建議。 */
'use strict';

(() => {
  // ============================================================
  // 1. 設定
  // ============================================================
  const API = 'https://cryptokeyhole.com/api/v1/fear-and-greed';
  const REFRESH_MS = 30 * 60 * 1000; // 頁面開著時每 30 分鐘自動更新
  const TIMEOUT_MS = 15 * 1000;

  const COINS = [
    { coin: 'MARKET', query: '?limit=30', name: { zh: '整體市場', en: 'Overall market' }, short: { zh: '市場', en: 'Market' } },
    { coin: 'BTC', query: '?coin=btc&limit=30', name: { zh: 'Bitcoin', en: 'Bitcoin' }, short: { zh: 'BTC', en: 'BTC' } },
    { coin: 'ETH', query: '?coin=eth&limit=30', name: { zh: 'Ethereum', en: 'Ethereum' }, short: { zh: 'ETH', en: 'ETH' } },
    { coin: 'SOL', query: '?coin=sol&limit=30', name: { zh: 'Solana', en: 'Solana' }, short: { zh: 'SOL', en: 'SOL' } },
  ];

  // 情緒區間（CryptoKeyhole API 文件的定義）
  const BANDS = [
    { key: 'extreme-fear', zh: '極度恐懼', en: 'Extreme Fear', min: 0, max: 24 },
    { key: 'fear', zh: '恐懼', en: 'Fear', min: 25, max: 44 },
    { key: 'neutral', zh: '中性', en: 'Neutral', min: 45, max: 55 },
    { key: 'greed', zh: '貪婪', en: 'Greed', min: 56, max: 75 },
    { key: 'extreme-greed', zh: '極度貪婪', en: 'Extreme Greed', min: 76, max: 100 },
  ];
  const PERIODS = ['yesterday', 'lastWeek', 'lastMonth', 'lastYear'];

  // ============================================================
  // 2. 中英文字
  // ============================================================
  const I18N = {
    zh: {
      title: 'Crypto 情緒溫度計',
      refresh: '重新整理',
      sub: 'Fear & Greed 指數 0–100：數字越低越恐懼、越高越貪婪。點選任一張卡片，可在走勢圖突顯該指數。',
      lede: '整體加密市場目前 {mv} 分，屬於「{ml}」，比去年同期 {my} 分。三個幣種中 {hc} 讀值最高（{hv}），{lc} 最低（{lv}）。',
      statusLoading: '讀取即時資料中…',
      statusLive: '即時資料・更新於 {t}',
      statusSnapshot: '備份資料・{t}',
      noticeOffline: '目前無法連線到 CryptoKeyhole API，頁面顯示的是 {t} 的備份資料。稍後按「重新整理」再試一次。',
      noticePartial: '部分指數無法更新（{list}），這些指數顯示的是先前的資料。',
      vsPrev: '較前一日 ',
      pts: ' 分',
      noteOpen: '當日未結算，數值仍會變動',
      noteClosed: '已結算',
      noteDelayed: 'API 延遲，尚無今日讀值',
      scaleLow: '0 恐懼',
      scaleHigh: '貪婪 100',
      trendTitle: '近 30 天走勢',
      trendNote: '每日讀值，背景色為情緒區間；Y 軸依資料範圍放大。空心圓點表示當日仍為 open（未結算）。',
      trendAria: '四個指數近 30 天的 Fear & Greed 走勢',
      all: '全部',
      focusAria: '突顯指數',
      howTitle: '怎麼讀這個指數',
      howNote: '依 CryptoKeyhole 的定義，把 0–100 分成五個情緒區間。',
      defs: [
        ['open／closed', 'open 表示當日資料還在更新，數值可能變動；closed 表示已結算。'],
        ['為什麼日期不一樣', '個別指數的 API 有時延遲一天，這時最新一筆會停在前一天。卡片會照實顯示各自的日期與狀態。'],
        ['這不是買賣訊號', '指數只反映市場情緒，不能預測價格，也不構成投資建議。'],
      ],
      compareTitle: '與過去比較',
      compareNote: '各指數的目前讀值，以及 API 提供的昨日、上週、上月與去年同期讀值。圓點顏色為當時的情緒區間；滑鼠停在數字上可看日期。',
      compareHead: ['指數', '目前', '昨日', '上週', '上月', '去年同期'],
      aboutTitle: '這個頁面能做什麼',
      valuesTitle: '提供的價值',
      values: [
        ['一眼看懂市場情緒', '整體市場與 BTC、ETH、SOL 的最新讀值、情緒區間，以及當天是否已結算，都在第一屏。'],
        ['看趨勢，不只看單日', '30 天走勢加上與上週、上月、去年同期的比較，看出情緒是在升溫還是降溫。'],
        ['在同一把尺上比較幣種', '四個指數畫在同一張圖、同一個 0–100 刻度，點卡片即可單獨突顯一個。'],
        ['資料即時且透明', '每次開啟都直接讀取 API；頁首顯示資料狀態與更新時間，每張卡片標示資料日期與 open／closed。'],
        ['誠實呈現資料狀態', 'open、API 延遲與離線備份都照實標示，不把未結算的數字當成定案，也不給買賣建議。'],
        ['適合教學與報告', '中英雙語，可用於期中展示、課堂討論，並與 Google 試算表版本互相對照。'],
      ],
      stepsTitle: '頁面怎麼運作',
      steps: [
        ['開啟頁面時，瀏覽器直接呼叫 CryptoKeyhole 免費 API。', '整體市場與 BTC、ETH、SOL 各一次，不需要 API key，也不需要後端伺服器。'],
        ['取得最新讀值、30 天歷史與過去讀值後畫出整個頁面。', '頁面開著時每 30 分鐘自動重新抓取，也可以按「重新整理」。'],
        ['API 無法連線時，改用內建的備份資料。', '頁首與提示列會標示這是哪一天的備份，不會把舊資料當成即時資料。'],
        ['純 HTML、CSS、JavaScript，放在任何地方都能用。', '直接雙擊 index.html，或上傳到 GitHub Pages 等靜態網站即可。'],
      ],
      disclaimer: '本頁僅整理市場情緒資訊，指數不能預測價格，也不構成任何投資或買賣建議。',
      cardsAria: '最新讀值',
    },
    en: {
      title: 'Crypto Sentiment Thermometer',
      refresh: 'Refresh',
      sub: 'The Fear & Greed index runs from 0 to 100: lower means more fear, higher means more greed. Click a card to highlight that index in the trend chart.',
      lede: 'The overall crypto market reads {mv}, in the {ml} zone, {my} points versus a year ago. Of the three coins, {hc} reads highest ({hv}) and {lc} lowest ({lv}).',
      statusLoading: 'Loading live data…',
      statusLive: 'Live data · updated {t}',
      statusSnapshot: 'Backup data · {t}',
      noticeOffline: 'The CryptoKeyhole API cannot be reached right now, so this page shows backup data from {t}. Press Refresh to try again later.',
      noticePartial: 'Some indexes could not be updated ({list}); they show their previous data.',
      vsPrev: 'vs. previous day ',
      pts: ' pts',
      noteOpen: 'Today is not settled yet; the value may change',
      noteClosed: 'Settled',
      noteDelayed: 'API delayed; no reading for today yet',
      scaleLow: '0 Fear',
      scaleHigh: 'Greed 100',
      trendTitle: 'Last 30 days',
      trendNote: 'Daily readings over the sentiment zones; the Y axis zooms to the data. A hollow dot means that day is still open (not settled).',
      trendAria: 'Fear & Greed trend for four indexes over the last 30 days',
      all: 'All',
      focusAria: 'Highlight an index',
      howTitle: 'How to read the index',
      howNote: 'CryptoKeyhole splits 0–100 into five sentiment zones.',
      defs: [
        ['Open / closed', 'Open means the day is still being updated and may change; closed means it is settled.'],
        ['Why the dates differ', 'The API sometimes runs a day late for one index, so its latest reading is from the day before. Each card shows its own date and status.'],
        ['Not a trading signal', 'The index reflects market mood only. It does not predict prices and is not investment advice.'],
      ],
      compareTitle: 'Compared with the past',
      compareNote: 'Each index now, and its reading yesterday, a week ago, a month ago and a year ago, as the API reports them. Dot color is the zone at that time; hover a number to see its date.',
      compareHead: ['Index', 'Now', 'Yesterday', 'Last week', 'Last month', 'A year ago'],
      aboutTitle: 'What this page is for',
      valuesTitle: 'What you get',
      values: [
        ['Market mood at a glance', 'The latest reading, zone and settled status for the overall market, BTC, ETH and SOL, all on the first screen.'],
        ['Trends, not just one day', 'A 30-day trend plus week, month and year comparisons show whether sentiment is heating up or cooling down.'],
        ['Coins on one scale', 'All four indexes share one chart and one 0–100 scale; click a card to single one out.'],
        ['Live and transparent', 'Every visit reads the API directly; the header shows the data status and update time, and each card shows its date and open/closed status.'],
        ['Honest about the data', 'Open days, API delays and offline backups are labeled as such; unsettled numbers are never shown as final, and there is no buy or sell advice.'],
        ['Ready for class and reports', 'Bilingual, so it works for presentations and class discussion, alongside the Google Sheets version.'],
      ],
      stepsTitle: 'How the page works',
      steps: [
        ['When the page opens, the browser calls the free CryptoKeyhole API.', 'One call each for the overall market, BTC, ETH and SOL. No API key and no backend server.'],
        ['It draws the page from the latest readings, 30-day history and past readings.', 'While open, it refetches every 30 minutes; you can also press Refresh.'],
        ['If the API cannot be reached, it falls back to built-in backup data.', 'The header and notice bar say which day the backup is from, so old data is never shown as live.'],
        ['Plain HTML, CSS and JavaScript that runs anywhere.', 'Double-click index.html, or upload the folder to a static host such as GitHub Pages.'],
      ],
      disclaimer: 'This page summarizes market sentiment only. The index does not predict prices and is not investment or trading advice.',
      cardsAria: 'Latest readings',
    },
  };

  // ============================================================
  // 3. 狀態
  // ============================================================
  const state = {
    lang: initialLang(),
    focus: null,
    data: {},          // { MARKET: {...}, BTC: {...}, ... }
    source: 'snapshot', // 'live' | 'snapshot'
    fetchedAt: null,
    loading: false,
    attempted: false,   // 是否已經試過連線 API（試過才顯示離線提示）
    failed: [],         // 這次更新失敗的指數
  };

  function initialLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'zh') return q;
    try {
      const saved = localStorage.getItem('fng-lang');
      if (saved === 'en' || saved === 'zh') return saved;
    } catch (e) { /* 無法使用 localStorage 時用預設值 */ }
    return 'zh';
  }

  const t = (key) => I18N[state.lang][key];
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    if (parent) parent.append(n);
    return n;
  };
  const coinInfo = (coin) => COINS.find((c) => c.coin === coin);
  const seriesColor = (coin) => `var(--s-${coin.toLowerCase()})`;
  const bandByKey = (key) => BANDS.find((b) => b.key === key) || null;
  const bandOf = (v) => BANDS.find((b) => v >= b.min && v <= b.max) || null;
  const bandKey = (raw, value) => {
    const k = raw ? String(raw).toLowerCase().replace(/_/g, '-') : '';
    return bandByKey(k) ? k : (bandOf(value) || {}).key || '';
  };
  const bandName = (key) => { const b = bandByKey(key); return b ? b[state.lang] : '—'; };
  const signed = (n) => (n == null || isNaN(n) ? '—' : n > 0 ? `+${n}` : String(n));
  const fmtTime = (iso) => {
    const d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return '—';
    return d.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false }).slice(0, 16) + (state.lang === 'en' ? ' (Taipei)' : '（台北）');
  };
  const fill = (target, template, values) => {
    target.replaceChildren();
    template.split(/\{(\w+)\}/).forEach((part, i) => {
      target.append(i % 2 ? el('b', null, values[part] ?? '—') : document.createTextNode(part));
    });
  };

  // 量測文字寬度（給圖表留邊界）
  const ctx = document.createElement('canvas').getContext('2d');
  const textWidth = (text, size = 12, weight = 400) => {
    ctx.font = `${weight} ${size}px "Noto Sans TC", system-ui, sans-serif`;
    return ctx.measureText(text).width;
  };

  // ============================================================
  // 4. 資料：API 與備份共用同一個整理函式
  // ============================================================
  function normalize(coin, j) {
    if (!j || !Array.isArray(j.history)) throw new Error('API 回傳缺少 history');
    const history = j.history
      .filter((h) => h && h.date && h.value != null && !isNaN(Number(h.value)))
      .map((h) => {
        const value = Math.round(Number(h.value));
        return { date: String(h.date).slice(0, 10), value, band: bandKey(h.band, value), status: h.status || 'unknown' };
      })
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (!history.length) throw new Error('沒有可用的歷史資料');
    const value = j.value != null && !isNaN(Number(j.value)) ? Math.round(Number(j.value)) : history[history.length - 1].value;
    const prev = {};
    PERIODS.forEach((k) => {
      const p = j.previous && j.previous[k];
      prev[k] = p && p.value != null && !isNaN(Number(p.value))
        ? { date: p.date ? String(p.date).slice(0, 10) : '', value: Math.round(Number(p.value)), band: bandKey(p.band, Number(p.value)) }
        : null;
    });
    return {
      coin, value, band: bandKey(j.band, value),
      date: j.date ? String(j.date).slice(0, 10) : history[history.length - 1].date,
      status: j.status || 'unknown', delayed: j.delayed === true, updatedAt: j.updatedAt || null,
      history, prev,
    };
  }

  function loadSnapshot() {
    const snap = window.FNG_SNAPSHOT;
    if (!snap || !snap.raw) return;
    COINS.forEach(({ coin }) => {
      try { state.data[coin] = normalize(coin, snap.raw[coin]); } catch (e) { /* 備份缺這個指數就略過 */ }
    });
    state.source = 'snapshot';
    state.fetchedAt = snap.fetchedAt;
  }

  async function fetchOne(c) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API + c.query, { signal: ctrl.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return normalize(c.coin, await res.json());
    } finally {
      clearTimeout(timer);
    }
  }

  async function refresh() {
    if (state.loading) return;
    state.loading = true;
    renderStatus();
    const results = await Promise.allSettled(COINS.map(fetchOne));
    const failed = [];
    results.forEach((r, i) => {
      const coin = COINS[i].coin;
      if (r.status === 'fulfilled') state.data[coin] = r.value;
      else failed.push(coin);
    });
    state.failed = failed;
    if (failed.length < COINS.length) {
      state.source = 'live';
      state.fetchedAt = new Date().toISOString();
    }
    state.loading = false;
    state.attempted = true;
    render();
  }

  // ============================================================
  // 5. 畫面
  // ============================================================
  function render() {
    renderStatic();
    renderStatus();
    renderLede();
    renderCards();
    renderFocus();
    renderTrend();
    renderBands();
    renderCompare();
    renderAbout();
  }

  function renderStatic() {
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-Hant';
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $('#cards').setAttribute('aria-label', t('cardsAria'));
    $('#focus').setAttribute('aria-label', t('focusAria'));
  }

  function renderStatus() {
    const s = $('#status');
    const notice = $('#notice');
    $('#refresh').disabled = state.loading;
    if (state.loading) {
      s.dataset.state = 'loading';
      s.textContent = t('statusLoading');
      return;
    }
    const when = fmtTime(state.fetchedAt);
    s.dataset.state = state.source;
    s.textContent = t(state.source === 'live' ? 'statusLive' : 'statusSnapshot').replace('{t}', when);
    if (state.source === 'snapshot' && state.attempted) {
      notice.textContent = t('noticeOffline').replace('{t}', when);
      notice.hidden = false;
    } else if (state.failed.length) {
      notice.textContent = t('noticePartial').replace('{list}', state.failed.join(', '));
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  }

  function renderLede() {
    const m = state.data.MARKET;
    const coins = ['BTC', 'ETH', 'SOL'].map((c) => state.data[c]).filter(Boolean).sort((a, b) => b.value - a.value);
    const hi = coins[0], lo = coins[coins.length - 1];
    fill($('#lede'), t('lede'), {
      mv: m ? String(m.value) : '—',
      ml: m ? bandName(m.band) : '—',
      my: m && m.prev.lastYear ? signed(m.value - m.prev.lastYear.value) : '—',
      hc: hi ? hi.coin : '—', hv: hi ? String(hi.value) : '—',
      lc: lo ? lo.coin : '—', lv: lo ? String(lo.value) : '—',
    });
  }

  function renderCards() {
    const box = $('#cards');
    const all = Object.values(state.data).flatMap((d) => d.history.map((h) => h.value));
    const range = all.length ? [Math.min(...all) - 2, Math.max(...all) + 2] : [0, 100];
    box.replaceChildren(...COINS.map((c) => {
      const d = state.data[c.coin];
      const card = el('article', 'card');
      card.dataset.coin = c.coin;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', String(state.focus === c.coin));

      const head = el('div', 'card-head');
      const sw = el('span', 'swatch');
      sw.style.background = seriesColor(c.coin);
      const h3 = el('h3', null, c.name[state.lang]);
      h3.append(el('span', 'ticker', c.coin));
      head.append(sw, h3);
      card.append(head);
      if (!d) { card.append(el('p', 'note', '—')); return card; }

      const reading = el('div', 'reading');
      reading.append(el('b', 'value', String(d.value)));
      const labels = el('div', 'labels');
      const b = bandByKey(d.band);
      const pill = el('span', `pill b-${d.band}`, b ? b.en : '—');
      labels.append(pill);
      if (state.lang === 'zh') labels.append(el('span', 'zh-label', b ? b.zh : '—'));
      reading.append(labels);
      card.append(reading);

      // 0–100 刻度條
      const scale = el('div', 'scale');
      const track = el('div', 'track');
      BANDS.forEach((band) => {
        const seg = el('span', `b-${band.key}`);
        seg.style.width = ((band.key === 'extreme-greed' ? 100 : band.max + 1) - band.min) + '%';
        track.append(seg);
      });
      const mark = el('i', 'mark');
      mark.style.left = Math.max(0, Math.min(100, d.value)) + '%';
      track.append(mark);
      const ends = el('div', 'ends');
      ends.append(el('span', null, t('scaleLow')), el('span', null, t('scaleHigh')));
      scale.append(track, ends);
      card.append(scale);

      // 較前一日
      const delta = el('p', 'delta', t('vsPrev'));
      const change = d.prev.yesterday ? d.value - d.prev.yesterday.value : null;
      const db = el('b', change > 0 ? 'up' : change < 0 ? 'down' : '', signed(change));
      delta.append(db, document.createTextNode(change == null ? '' : t('pts')));
      card.append(delta);

      // 30 天小走勢（四張卡共用 Y 軸範圍）
      const spark = el('div', 'spark');
      spark.append(sparkline(d, range));
      card.append(spark);

      // 日期與狀態
      const meta = el('p', 'meta');
      meta.append(el('span', null, d.date), el('span', `chip ${d.status}`, d.status));
      if (d.status === 'open') meta.append(el('span', null, t('noteOpen')));
      if (d.status === 'closed') meta.append(el('span', null, t('noteClosed')));
      if (d.delayed) meta.append(el('span', 'delay', t('noteDelayed')));
      card.append(meta);
      return card;
    }));
  }

  function sparkline(d, [lo, hi]) {
    const W = 240, H = 48, pad = 5;
    const pts = d.history;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': `${coinInfo(d.coin).short[state.lang]} 30d` });
    if (pts.length < 2) return root;
    const x = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
    const y = (v) => H - pad - ((v - lo) / (hi - lo || 1)) * (H - pad * 2);
    const color = seriesColor(d.coin);
    const id = `sg-${d.coin}`;
    const grad = svg('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 }, svg('defs', {}, root));
    [[0, 0.26], [0.25, 0.16], [0.5, 0.08], [0.75, 0.03], [1, 0]].forEach(([o, a]) => {
      svg('stop', { offset: o, style: `stop-color:${color};stop-opacity:${a}` }, grad);
    });
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    svg('path', { d: `${line}L${x(pts.length - 1).toFixed(1)},${H - pad}L${x(0).toFixed(1)},${H - pad}Z`, style: `fill:url(#${id})` }, root);
    svg('path', { d: line, style: `fill:none;stroke:${color};stroke-width:2;stroke-linejoin:round;stroke-linecap:round`, 'vector-effect': 'non-scaling-stroke' }, root);
    return root;
  }

  function renderFocus() {
    const box = $('#focus');
    const items = [{ coin: '', label: t('all') }, ...COINS.map((c) => ({ coin: c.coin, label: c.short[state.lang] }))];
    box.replaceChildren(...items.map((it) => {
      const b = el('button', null, it.label);
      b.type = 'button';
      b.dataset.focus = it.coin;
      b.setAttribute('aria-pressed', String((state.focus || '') === it.coin));
      return b;
    }));
  }

  function renderTrend() {
    const host = $('#trend');
    host.replaceChildren();
    const series = COINS.map((c) => state.data[c.coin]).filter(Boolean);
    if (!series.length) return;

    const dates = [...new Set(series.flatMap((s) => s.history.map((h) => h.date)))].sort();
    const vals = series.flatMap((s) => s.history.map((h) => h.value));
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 6) / 5) * 5);
    const hi = Math.min(100, Math.ceil((Math.max(...vals) + 6) / 5) * 5);

    const W = Math.max(280, host.clientWidth);
    const H = Math.max(260, Math.min(380, Math.round(W * 0.42)));
    const yTicks = [];
    for (let v = lo; v <= hi; v += 5) if (v % 10 === 0 || hi - lo <= 30) yTicks.push(v);
    const short = (coin) => coinInfo(coin).short[state.lang];
    const ends = series.map((s) => ({ coin: s.coin, last: s.history[s.history.length - 1] }));
    const ml = Math.ceil(Math.max(...yTicks.map((v) => textWidth(String(v), 11)))) + 10;
    const mr = Math.ceil(Math.max(...ends.map((e) => textWidth(`${short(e.coin)} ${e.last.value}`, 12, 700)))) + 18;
    const mt = 10, mb = 26;
    const x = (date) => ml + (dates.indexOf(date) * (W - ml - mr)) / Math.max(1, dates.length - 1);
    const y = (v) => mt + ((hi - v) * (H - mt - mb)) / (hi - lo || 1);

    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('trendAria') });
    host.append(root);

    // 情緒區間背景
    BANDS.forEach((b) => {
      const top = Math.min(hi, b.key === 'extreme-greed' ? 100 : b.max + 1);
      const bottom = Math.max(lo, b.min);
      if (top <= bottom) return;
      const g = svg('g', { class: `b-${b.key}` }, root);
      svg('rect', { x: ml, y: y(top), width: W - ml - mr, height: y(bottom) - y(top), style: 'fill:var(--band);fill-opacity:.1' }, g);
      if (y(bottom) - y(top) >= 16) svg('text', { class: 'band-name', x: ml + 6, y: y(top) + 13 }, g).textContent = b[state.lang];
    });

    // 座標軸
    yTicks.forEach((v) => {
      svg('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), style: 'stroke:var(--grid)' }, root);
      svg('text', { class: 'axis', x: ml - 8, y: y(v) + 4, 'text-anchor': 'end' }, root).textContent = v;
    });
    const step = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor((W - ml - mr) / 70))));
    dates.forEach((d, i) => {
      if ((dates.length - 1 - i) % step !== 0) return; // 從最後一天往回取，確保最新日期有標
      const [, mm, dd] = d.split('-');
      svg('text', { class: 'axis', x: x(d), y: H - 8, 'text-anchor': 'middle' }, root).textContent = `${+mm}/${+dd}`;
    });
    svg('line', { x1: ml, x2: W - mr, y1: H - mb, y2: H - mb, style: 'stroke:var(--muted);stroke-opacity:.5' }, root);

    // 線條：有突顯時其他指數變淡，突顯的畫在最上層
    const ordered = series.slice().sort((a, b) => (a.coin === state.focus) - (b.coin === state.focus));
    ordered.forEach((s) => {
      const on = !state.focus || s.coin === state.focus;
      const color = seriesColor(s.coin);
      const d = s.history.map((h, i) => `${i ? 'L' : 'M'}${x(h.date).toFixed(1)},${y(h.value).toFixed(1)}`).join('');
      svg('path', { d, style: `fill:none;stroke:${color};stroke-width:${s.coin === state.focus ? 3 : 2};stroke-linejoin:round;stroke-linecap:round;opacity:${on ? 1 : 0.22}` }, root);
      const last = s.history[s.history.length - 1];
      svg('circle', { cx: x(last.date), cy: y(last.value), r: 4, style: `fill:${last.status === 'open' ? 'var(--panel)' : color};stroke:${color};stroke-width:2;opacity:${on ? 1 : 0.3}` }, root);
    });

    // 線尾標籤：名稱＋最新讀值，彼此避開
    const labels = ends.map((e) => ({ ...e, ly: y(e.last.value) + 4 })).sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < labels.length; i++) labels[i].ly = Math.max(labels[i].ly, labels[i - 1].ly + 15);
    const over = labels.length ? labels[labels.length - 1].ly - (H - mb) : 0;
    if (over > 0) labels.forEach((l) => { l.ly -= over; });
    labels.forEach((l) => {
      const on = !state.focus || l.coin === state.focus;
      svg('text', { class: 'end-label', x: W - mr + 8, y: l.ly, style: `fill:${seriesColor(l.coin)};opacity:${on ? 1 : 0.4}` }, root)
        .textContent = `${short(l.coin)} ${l.last.value}`;
    });

    // 滑過提示
    const hover = svg('g', { style: 'display:none' }, root);
    const rule = svg('line', { y1: mt, y2: H - mb, style: 'stroke:var(--muted);stroke-dasharray:3 3' }, hover);
    const dots = series.map((s) => svg('circle', { r: 4, style: `fill:${seriesColor(s.coin)};stroke:var(--panel);stroke-width:1.5` }, hover));
    const tip = el('div', 'tip');
    tip.hidden = true;
    host.append(tip);
    const overlay = svg('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, style: 'fill:transparent;cursor:crosshair' }, root);
    const show = (evt) => {
      const box = root.getBoundingClientRect();
      const px = ((evt.clientX - box.left) * W) / box.width;
      const idx = Math.max(0, Math.min(dates.length - 1, Math.round(((px - ml) * (dates.length - 1)) / (W - ml - mr))));
      const date = dates[idx];
      hover.style.display = '';
      rule.setAttribute('x1', x(date));
      rule.setAttribute('x2', x(date));
      tip.replaceChildren(el('div', 'tip-date', date));
      series.forEach((s, i) => {
        const p = s.history.find((h) => h.date === date);
        dots[i].style.display = p ? '' : 'none';
        if (!p) return;
        dots[i].setAttribute('cx', x(date));
        dots[i].setAttribute('cy', y(p.value));
        const row = el('div', 'tip-row');
        const sw = el('i');
        sw.style.background = seriesColor(s.coin);
        row.append(sw, el('span', null, `${short(s.coin)} ${p.value}`), el('span', null, bandName(p.band) + (p.status === 'open' ? ' · open' : '')));
        tip.append(row);
      });
      tip.hidden = false;
      const cx = (x(date) * host.clientWidth) / W;
      const tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(host.clientWidth - tw, cx > host.clientWidth / 2 ? cx - tw - 12 : cx + 12)) + 'px';
      tip.style.top = '8px';
    };
    overlay.addEventListener('pointermove', show);
    overlay.addEventListener('pointerdown', show);
    overlay.addEventListener('pointerleave', () => { hover.style.display = 'none'; tip.hidden = true; });
  }

  function renderBands() {
    $('#bands').replaceChildren(...BANDS.slice().reverse().map((b) => {
      const li = el('li', `b-${b.key}`);
      const name = el('span', null, b[state.lang]);
      if (state.lang === 'zh') name.append(el('small', null, b.en));
      li.append(el('i'), name, el('span', 'range', `${b.min}–${b.max}`));
      return li;
    }));
    $('#defs').replaceChildren(...t('defs').flatMap(([dt, dd]) => [el('dt', null, dt), el('dd', null, dd)]));
  }

  function renderCompare() {
    const head = t('compareHead');
    $('#compare-head').replaceChildren(...head.map((h) => { const th = el('th', null, h); th.scope = 'col'; return th; }));
    $('#compare-body').replaceChildren(...COINS.map((c) => {
      const d = state.data[c.coin];
      const tr = el('tr');
      const th = el('th', null, c.coin === 'MARKET' ? c.short[state.lang] : c.coin);
      th.scope = 'row';
      tr.append(th);
      const cells = d
        ? [{ value: d.value, band: d.band, date: d.date }, ...PERIODS.map((k) => d.prev[k])]
        : [null, null, null, null, null];
      cells.forEach((cell, i) => {
        const td = el('td', i === 0 ? 'now' : null);
        if (!cell) { td.textContent = '—'; } else {
          td.append(el('span', `dot b-${cell.band}`), document.createTextNode(String(cell.value)));
          if (cell.date) td.title = cell.date;
        }
        tr.append(td);
      });
      return tr;
    }));
  }

  function renderAbout() {
    $('#values').replaceChildren(...t('values').map(([title, text]) => {
      const li = el('li');
      li.append(el('b', null, title), el('p', null, text));
      return li;
    }));
    $('#steps').replaceChildren(...t('steps').map(([title, text]) => {
      const li = el('li', null, title);
      li.append(el('p', null, text));
      return li;
    }));
  }

  // ============================================================
  // 6. 互動
  // ============================================================
  function setFocus(coin) {
    state.focus = coin || null;
    document.querySelectorAll('.card[data-coin]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.coin === state.focus)));
    renderFocus();
    renderTrend();
  }

  document.addEventListener('click', (e) => {
    const lang = e.target.closest('[data-lang]');
    if (lang) {
      state.lang = lang.dataset.lang === 'en' ? 'en' : 'zh';
      try { localStorage.setItem('fng-lang', state.lang); } catch (err) { /* 略過 */ }
      render();
      return;
    }
    const f = e.target.closest('[data-focus]');
    if (f) { setFocus(f.dataset.focus); return; }
    const card = e.target.closest('.card[data-coin]');
    if (card && !e.target.closest('a')) setFocus(state.focus === card.dataset.coin ? null : card.dataset.coin);
  });
  document.addEventListener('keydown', (e) => {
    const card = e.target.closest && e.target.closest('.card[data-coin]');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setFocus(state.focus === card.dataset.coin ? null : card.dataset.coin);
    }
  });
  $('#refresh').addEventListener('click', refresh);

  // 寬度改變時重畫走勢圖
  let lastWidth = 0;
  new ResizeObserver(() => {
    const w = $('#trend').clientWidth;
    if (Math.abs(w - lastWidth) < 2) return;
    lastWidth = w;
    requestAnimationFrame(renderTrend);
  }).observe($('#trend'));

  // 頁面開著時定期更新；從背景切回來且超過更新間隔也會更新
  setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - new Date(state.fetchedAt || 0).getTime() > REFRESH_MS) refresh();
  });

  // ============================================================
  // 7. 啟動：先用備份畫好整頁，再抓即時資料
  // ============================================================
  loadSnapshot();
  render();
  refresh();
})();
