# iPhone-friendly deployment

1. Upload all files to GitHub.
2. Deploy on Vercel.
3. Open the Vercel URL in Safari on iPhone.
4. Test the app in Safari first.
5. If prices load, use Share > Add to Home Screen.

Notes:
- `/api/prices` intentionally returns an empty/fallback response.
- The app tries live prices from the browser through a public proxy.
- If live fetch fails, the app keeps the last synced prices in local cache and shows the sync status.
- On iPhone, remove the old Home Screen app before reinstalling a new version.
