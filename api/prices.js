const SYMBOLS = [
  'ATW','IAM','BCP','CIH','BOA','MNG','TGC','ADI','AKT','CFG','RDS',
  'HPS','CSR','IMO','SNA','CMG','CAP','FBR','DYT','SMI','MUT','TQM','S2M','STR','NKL'
];

const ALIASES = {
  TGCC: 'TGC',
  TGC: 'TGC',
  DISTY: 'DYT',
  'DISTY TECHNOLOGIES': 'DYT',
  'FENIE BROSSETTE': 'FBR',
  'ATTIJARIWAFA BANK': 'ATW',
  'BANK OF AFRICA': 'BOA',
  'IMMORENTE INVEST': 'IMO',
  'CFG BANK': 'CFG',
  'CMGP GROUP': 'CMG',
  'CASH PLUS': 'CAP',
  ENNAKL: 'NKL'
};

function withHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function normalize(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function parsePrice(raw) {
  if (raw == null) return NaN;
  let value = String(raw).replace(/\u00A0/g, ' ').replace(/\s+/g, '').replace(/,/g, '.');
  value = value.replace(/[A-Z]{2,}|MAD|DH|MRU|USD|EUR/gi, '');
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

function detectPrice(html, symbol) {
  const patterns = [
    new RegExp(`current price of ${symbol} is ([0-9.,]+)`, 'i'),
    /"last_price"\s*:\s*([0-9.]+)/i,
    /"close"\s*:\s*([0-9.]+)/i,
    /"price"\s*:\s*"?([0-9.,]+)"?/i,
    /"formatted_price"\s*:\s*"([0-9.,]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parsePrice(match[1]);
      if (Number.isFinite(price) && price > 0) return price;
    }
  }
  return NaN;
}

async function fetchSymbol(symbol) {
  const url = `https://www.tradingview.com/symbols/CSEMA-${symbol}/`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BVCPortfolio/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`${symbol}: HTTP ${response.status}`);
  }

  const html = await response.text();
  const price = detectPrice(html, symbol);
  if (!Number.isFinite(price)) {
    throw new Error(`${symbol}: price not found`);
  }

  return [symbol, price];
}

export default async function handler(req, res) {
  withHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const requested = String(req.query?.symbols || '')
    .split(',')
    .map(normalize)
    .filter(Boolean)
    .map(s => ALIASES[s] || s);

  const symbols = requested.length ? [...new Set(requested)] : SYMBOLS;

  const settled = await Promise.allSettled(symbols.map(fetchSymbol));
  const prices = {};
  const errors = [];

  settled.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      const [symbol, price] = result.value;
      prices[symbol] = price;
    } else {
      errors.push({ symbol: symbols[idx], error: result.reason?.message || 'unknown error' });
    }
  });

  if (!Object.keys(prices).length) {
    res.status(502).json({
      success: false,
      error: 'No TradingView prices parsed',
      errors,
      updatedAt: new Date().toISOString()
    });
    return;
  }

  res.status(200).json({
    success: true,
    source: 'TradingView symbol pages',
    exchange: 'CSEMA',
    count: Object.keys(prices).length,
    prices,
    errors,
    updatedAt: new Date().toISOString()
  });
}
