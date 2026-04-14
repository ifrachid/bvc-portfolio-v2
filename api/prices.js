export default async function handler(req, res) {
  try {
    const url = "https://www.casablanca-bourse.com/fr/live-market/marche-actions-groupement?pwa";

    const response = await fetch(url);
    const html = await response.text();

    const prices = {};

    // استخراج tickers و prices
    const regex = /"ticker":"(.*?)".*?"last":(.*?),/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const ticker = match[1];
      const price = parseFloat(match[2]);

      if (!isNaN(price)) {
        prices[ticker] = price;
      }
    }

    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      count: Object.keys(prices).length,
      prices
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}