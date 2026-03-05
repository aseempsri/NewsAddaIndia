/**
 * Share market indices API - fetches Indian indices (Sensex, Nifty, etc.) for the ticker.
 * GET /api/market returns { success, data: [ { name, value, change, changePercent } ] }
 * Primary: NSE India (official, accurate). Fallback: Yahoo Finance quote/chart. Then static fallback.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Order and names we want to return
const INDEX_KEYS = [
  { key: 'Sensex', name: 'Sensex' },           // from BSE / Yahoo
  { key: 'Nifty 50', name: 'Nifty 50' },
  { key: 'Nifty Bank', name: 'Nifty Bank' },
  { key: 'Nifty IT', name: 'Nifty IT' },
  { key: 'Nifty Auto', name: 'Nifty Auto' },
  { key: 'Nifty Pharma', name: 'Nifty Pharma' },
  { key: 'Nifty FMCG', name: 'Nifty FMCG' },
  { key: 'Nifty Midcap 50', name: 'Nifty Midcap' }
];

const FALLBACK_DATA = [
  { name: 'Sensex', value: 80015, change: 899.71, changePercent: 1.14 },
  { name: 'Nifty 50', value: 24765, change: 287, changePercent: 1.17 },
  { name: 'Nifty Bank', value: 52500, change: 450, changePercent: 0.86 },
  { name: 'Nifty IT', value: 38500, change: 200, changePercent: 0.52 },
  { name: 'Nifty Auto', value: 24500, change: 180, changePercent: 0.74 },
  { name: 'Nifty Pharma', value: 20200, change: -30, changePercent: -0.15 },
  { name: 'Nifty FMCG', value: 59500, change: 220, changePercent: 0.37 },
  { name: 'Nifty Midcap', value: 54800, change: 350, changePercent: 0.64 }
];

const CACHE_MS = 1 * 60 * 1000; // 1 minute
let cached = null;
let cachedAt = 0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Fetch from NSE India (official) - requires session cookie */
async function fetchFromNSE() {
  const client = axios.create({
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/'
    }
  });
  const homeRes = await client.get('https://www.nseindia.com/');
  const setCookie = homeRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map((c) => c.split(';')[0]).join('; ') : (setCookie || '');
  const apiRes = await client.get('https://www.nseindia.com/api/allIndices', {
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });
  const data = apiRes.data?.data ?? apiRes.data;
  if (!data || !Array.isArray(data)) return null;
  const byName = {};
  for (const row of data) {
    const name = (row.name || row.index || row.symbol || row.identifier || '').trim();
    const ltp = row.last ?? row.close ?? row.ltp;
    const prevClose = row.previousClose ?? row.open;
    if (!name || (ltp == null && prevClose == null)) continue;
    const last = ltp != null ? Number(ltp) : Number(prevClose);
    const prev = prevClose != null ? Number(prevClose) : last;
    const change = prev !== 0 ? last - prev : (row.change != null ? Number(row.change) : 0);
    const changePercent = row.percChange != null ? Number(row.percChange) : (prev !== 0 ? (change / prev) * 100 : 0);
    byName[name] = { name, value: last, change, changePercent };
  }
  return byName;
}

/** Map our index keys to possible NSE names */
const NSE_NAME_MAP = {
  'Sensex': null, // NSE does not have Sensex; we use Yahoo for this one
  'Nifty 50': 'NIFTY 50',
  'Nifty Bank': 'NIFTY BANK',
  'Nifty IT': 'NIFTY IT',
  'Nifty Auto': 'NIFTY AUTO',
  'Nifty Pharma': 'NIFTY PHARMA',
  'Nifty FMCG': 'NIFTY FMCG',
  'Nifty Midcap 50': 'NIFTY MIDCAP 50'
};

function normalizeNSEKey(name) {
  if (!name) return '';
  const n = String(name).toUpperCase().replace(/\s+/g, ' ');
  if (n.includes('NIFTY') && n.includes('50') && !n.includes('BANK') && !n.includes('MID') && !n.includes('AUTO') && !n.includes('IT') && !n.includes('PHARMA') && !n.includes('FMCG')) return 'NIFTY 50';
  return n;
}

/** Yahoo v7 quote - used for Sensex and as fallback */
async function fetchFromYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const { data } = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': UA } });
  const q = data?.quoteResponse?.result?.[0];
  if (!q) return null;
  const price = q.regularMarketPrice ?? q.previousClose ?? q.regularMarketPreviousClose;
  const prev = q.previousClose ?? q.regularMarketPreviousClose ?? price;
  if (price == null) return null;
  const change = prev != null ? price - prev : (q.regularMarketChange ?? 0);
  const changePercent = prev && prev !== 0 ? (change / prev) * 100 : (q.regularMarketChangePercent ?? 0);
  return {
    value: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100
  };
}

/** Yahoo chart - fallback when quote fails */
async function fetchFromYahooChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const { data } = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0];
  let regular = meta.regularMarketPrice ?? meta.previousClose;
  if (quote && quote.close && quote.close.length) {
    const closes = quote.close.filter((c) => c != null);
    if (closes.length) regular = closes[closes.length - 1];
  }
  const previous = meta.previousClose ?? regular;
  const change = previous != null && regular != null ? regular - previous : 0;
  const changePercent = previous && previous !== 0 ? (change / previous) * 100 : 0;
  return {
    value: Math.round(regular * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100
  };
}

async function fetchYahooOne(symbol) {
  try {
    const r = await fetchFromYahooQuote(symbol);
    if (r != null && r.value > 0) return r;
  } catch (_) {}
  try {
    const r = await fetchFromYahooChart(symbol);
    if (r != null && r.value > 0) return r;
  } catch (_) {}
  return null;
}

router.get('/', async (req, res) => {
  try {
    if (cached && Date.now() - cachedAt < CACHE_MS) {
      return res.json({ success: true, data: cached });
    }

    let nseByKey = null;
    try {
      const raw = await fetchFromNSE();
      if (raw && Object.keys(raw).length > 0) {
        nseByKey = {};
        for (const [k, v] of Object.entries(raw)) {
          const norm = normalizeNSEKey(k);
          if (norm) nseByKey[norm] = v;
        }
      }
    } catch (e) {
      console.warn('[Market] NSE fetch failed:', e.message);
    }

    const data = [];
    for (let i = 0; i < INDEX_KEYS.length; i++) {
      const { key, name } = INDEX_KEYS[i];
      const fallback = FALLBACK_DATA[i];

      if (key === 'Sensex') {
        const yahoo = await fetchYahooOne('^BSESN');
        if (yahoo) {
          data.push({ name, ...yahoo });
        } else {
          data.push({ name: fallback.name, value: fallback.value, change: fallback.change, changePercent: fallback.changePercent });
        }
        continue;
      }

      const nseKey = NSE_NAME_MAP[key];
      if (nseByKey && nseKey) {
        const nseRow = nseByKey[nseKey] || nseByKey[nseKey.replace(/\s+/g, ' ')];
        if (nseRow && nseRow.value != null) {
          data.push({
            name,
            value: Math.round(nseRow.value * 100) / 100,
            change: Math.round((nseRow.change || 0) * 100) / 100,
            changePercent: Math.round((nseRow.changePercent || 0) * 100) / 100
          });
          continue;
        }
      }

      const yahooSymbol = { 'Nifty 50': '^NSEI', 'Nifty Bank': '^NSEBANK', 'Nifty IT': '^CNXIT', 'Nifty Auto': '^CNXAUTO', 'Nifty Pharma': '^CNXPHARMA', 'Nifty FMCG': '^CNXFMCG', 'Nifty Midcap 50': '^CNXMID' }[key];
      if (yahooSymbol) {
        const yahoo = await fetchYahooOne(yahooSymbol);
        if (yahoo) {
          data.push({ name, ...yahoo });
          continue;
        }
      }

      data.push({ name: fallback.name, value: fallback.value, change: fallback.change, changePercent: fallback.changePercent });
    }

    cached = data;
    cachedAt = Date.now();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Market] Error:', err.message);
    res.json({ success: true, data: FALLBACK_DATA });
  }
});

module.exports = router;
