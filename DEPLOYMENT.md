# 🚀 Deploy Your Price API (Free)

## Quick diagnosis of the original issue

The app was trying a public proxy first and even had a fallback to the Anthropic API without authentication headers. That fallback cannot work as written. I changed the app so it now:

1. tries **your own `/api/prices` backend first**,
2. falls back to a public proxy only if needed,
3. keeps cached prices if both fail.

I also fixed the PWA paths so the app works both at the domain root and inside a subfolder.

---

## Option 1: Deploy on Vercel (recommended)

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Deploy.

Once deployed, the frontend will automatically call:

```text
https://YOUR_PROJECT.vercel.app/api/prices
```

No extra change is needed in `index.html` anymore.

---

## Local test

```bash
npm install -g vercel
vercel dev
```

Then open:

- App: `http://localhost:3000`
- API: `http://localhost:3000/api/prices`

Expected API response:

```json
{
  "success": true,
  "count": 3,
  "prices": {
    "ATW": 711.5,
    "TGC": 775.25,
    "SMI": 8240
  }
}
```

---

## Notes

- `package.json` now uses ESM (`"type": "module"`) to match `export default` in `api/prices.js`.
- The service worker and manifest now use relative paths, so they work better after deployment.
- If you host only the static files (without serverless functions), the app will still try the public proxy as fallback.
