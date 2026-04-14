export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const targetUrl = "https://www.casablanca-bourse.com/fr/live-market/marche-actions-groupement?pwa";

  async function fetchText(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  function extractPrices(html) {
    const prices = {};

    const patterns = [
      /"ticker":"(.*?)".*?"last":(.*?),/g,
      /"symbol":"(.*?)".*?"last":(.*?),/g,
      /"ticker":"(.*?)".*?"price":"(.*?)"/g
    ];

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(html)) !== null) {
        const ticker = String(match[1] || "").trim().toUpperCase();
        const raw = String(match[2] || "").replace(",", ".").trim();
        const price = parseFloat(raw);

        if (ticker && !Number.isNaN(price)) {
          prices[ticker] = price;
        }
      }
    }

    return prices;
  }

  try {
    let html = "";

    try {
      html = await fetchText(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
    } catch (directError) {
      const proxyUrl =
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl);

      html = await fetchText(proxyUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });
    }

    const prices = extractPrices(html);

    if (!Object.keys(prices).length) {
      return res.status(502).json({
        success: false,
        error: "No prices parsed from source"
      });
    }

    return res.status(200).json({
      success: true,
      count: Object.keys(prices).length,
      prices,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "fetch failed"
    });
  }
}