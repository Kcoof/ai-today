# AI اليوم — نشرة الذكاء الاصطناعي اليومية

A daily Arabic AI newsletter landing page. Fully automatic pipeline:

```
GitHub Action (daily 06:00 UTC)
  → fetches news sources (HN, arXiv, HuggingFace, Reddit, RSS)
  → GLM (Z.ai API) curates + writes Arabic summaries
  → commits data/*.json
  → Cloudflare Pages deploys automatically
```

## One-time setup

### 1. Push this repo to GitHub

```bash
git remote add origin https://github.com/<your-user>/<repo>.git
git push -u origin main
```

### 2. Add your Z.ai API key as a GitHub secret

1. Get a key at [z.ai](https://z.ai) (model API / open platform).
2. In your repo: **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `ZAI_API_KEY` — Value: your key.

Optional: **Variables → Actions → New variable** `GLM_MODEL` (default `glm-4.6`).

### 3. Connect Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**
2. Select the repo and branch `main`.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** _(leave empty)_
   - **Build output directory:** `/`
4. **Save and Deploy.** Done — every push to `main` now deploys.

### 4. Test the pipeline

Repo → **Actions → Daily update → Run workflow** (manual button).
Watch the run turn green, then refresh your Pages URL.

## Local usage

```bash
node scripts/update-daily.mjs --fetch-only   # check news sources work
node scripts/update-daily.mjs --dry-run      # sample data, no API needed
ZAI_API_KEY=xxx node scripts/update-daily.mjs  # real edition (needs key)

npx serve .   # preview the site locally
```

## Project layout

| Path | Purpose |
|---|---|
| `index.html`, `assets/` | The Arabic RTL landing page (no build step) |
| `data/latest.json` | Today's edition (news, models, highlights) |
| `data/knowledge.json` | Growing skills/knowledge base |
| `data/archive/` + `data/archive.json` | Past editions |
| `scripts/update-daily.mjs` | The daily pipeline script |
| `.github/workflows/daily-update.yml` | Scheduled automation |
| `AGENTS.md` | Instructions for AI agents maintaining this site |

## Notes

- The GitHub Action schedule (`0 6 * * *` UTC = 09:00 Mecca time) can be edited
  in `.github/workflows/daily-update.yml`.
- Your API key is never stored in the repo — only in GitHub secrets.
- GitHub disables scheduled workflows after 60 days of no repo activity; a
  manual run or any commit re-enables it.
