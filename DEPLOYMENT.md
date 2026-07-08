iPhone-friendly deployment


Upload all files to GitHub.
Deploy on Vercel.
Open the Vercel URL in Safari on iPhone.
Test the app in Safari first.
If prices load, use Share > Add to Home Screen — do this once only.


Notes:


/api/prices intentionally returns an empty/fallback response.
The app tries live prices from the browser through a public proxy.
If live fetch fails, the app keeps the last synced prices in local cache and shows the sync status.
Do NOT remove and re-add the Home Screen icon after updates. On iOS, deleting and
re-adding a "Add to Home Screen" PWA icon creates a brand new storage container
(WKWebView), which wipes all locally saved data (portfolio, prices, dividends).
Since this app has no active Service Worker caching the code, simply closing and
reopening the existing Home Screen icon is enough to pick up the latest deployed
version from Vercel — no reinstall needed, and your saved data stays intact.
