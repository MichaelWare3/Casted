# Deploying CASTED to Vercel

CASTED is a Vite + React app with serverless **Edge functions** (in `/api`) that
proxy TMDB, Groq, and Unsplash so your API keys stay **server-side** and never
ship to the browser.

- **Production:** the app calls `/api/tmdb/*`, `/api/groq`, `/api/unsplash`. The
  functions add the secret keys. Nothing sensitive is in the client bundle.
- **Local dev (`npm run dev`):** the app calls the providers directly using your
  `VITE_*` keys from `.env`, so you don't need to run the functions locally.

---

## 1. Push the project to GitHub

```bash
cd /path/to/CASTED
git init           # if it isn't a repo yet
git add .
git commit -m "CASTED — ready to deploy"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/casted.git
git branch -M main
git push -u origin main
```

`.env` is gitignored, so your local keys are **not** committed. Good.

## 2. Import into Vercel

1. Go to https://vercel.com → **Add New… → Project**.
2. Import your `casted` GitHub repo.
3. Vercel auto-detects **Vite**. Leave the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
   - The `/api` folder is detected as serverless functions automatically.

## 3. Add environment variables (the important part)

In the import screen (or later under **Settings → Environment Variables**), add
these **server-side** keys. Note: **no `VITE_` prefix** — that prefix is what
exposes a var to the browser, which is exactly what we're avoiding.

| Name                   | Value                     |
| ---------------------- | ------------------------- |
| `GROQ_API_KEY`         | your Groq key             |
| `TMDB_API_KEY`         | your TMDB key             |
| `UNSPLASH_ACCESS_KEY`  | your Unsplash access key  |

Apply them to **Production** (and Preview if you want preview deploys to work).

⚠️ Do **not** add the `VITE_TMDB_API_KEY` / `VITE_GROQ_API_KEY` /
`VITE_UNSPLASH_ACCESS_KEY` versions in Vercel — if you do, they'd be baked into
the public bundle and defeat the proxy.

## 4. Deploy

Click **Deploy**. You'll get a live URL like `https://casted.vercel.app`.
Every push to `main` redeploys automatically.

## 5. Verify it's live and secure

- Open the site — Home/Browse/Daily Drop should load films, Cast Me and The
  Director should work.
- Open dev tools → **Network**: API calls should go to `/api/tmdb/...`,
  `/api/groq`, `/api/unsplash` — **not** to `api.themoviedb.org` or
  `api.groq.com`, and your keys should not appear anywhere in the page source or
  the JS bundle.
- Quick check: `view-source` + search for your key — it should not be found.

## 6. (Optional) Custom domain

**Settings → Domains → Add** your domain and follow the DNS instructions. The
free `*.vercel.app` URL works immediately either way.

---

## Local development

```bash
npm install
cp .env.example .env     # then fill in the VITE_* keys for dev
npm run dev
```

## Notes & recommendations

- **Rotate keys** if they were ever shipped publicly before this change (e.g. an
  earlier static deploy). Old keys may already be compromised.
- **Social preview image:** add an `og:image` for richer link previews. Drop a
  1200×630 PNG at `public/og-image.png` and add
  `<meta property="og:image" content="https://YOUR_DOMAIN/og-image.png" />` to
  `index.html`. (Your shareable Cast Me card art is a great basis for it.)
- **Groq free tier** is ~100k tokens/day. The app already falls back to a smaller
  model and to a curated character pool when rate-limited, but for real traffic
  consider Groq's paid tier.
