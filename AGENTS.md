# AGENTS.md — Maintenance guide for AI coding agents (ZCode)

This file tells any AI agent (e.g. ZCode) how to maintain this site without
re-reading the whole codebase. If the user asks to "update the site", "add news",
"add a skill entry", or "fix the pipeline" — this is the reference.

## What this project is

**"AI اليوم"** — a static Arabic (RTL) landing page showing a daily AI newsletter:
news, new model releases, important info, and a growing knowledge base of
practical AI skills. Content lives in JSON files under `data/`; the page
(`index.html` + `assets/`) renders them client-side. No build step.

Pipeline: GitHub Actions cron (`.github/workflows/daily-update.yml`, daily 06:00 UTC)
runs `scripts/update-daily.mjs`, which fetches public sources, asks a GLM model
(Z.ai API, key in the `ZAI_API_KEY` secret) to curate an Arabic edition, commits
`data/*.json`, and the push triggers a Cloudflare Pages deploy.

## Data schemas (data/)

### data/latest.json — today's edition
```json
{
  "date": "YYYY-MM-DD",
  "generatedAt": "ISO-8601 timestamp",
  "news": [{
    "id": "n-2026-01-01-1",
    "title": "Arabic title",
    "summary": "Arabic summary, 2-3 sentences",
    "category": "models|tools|research|companies|regulation|other",
    "importance": 1-5,
    "source": { "name": "Hacker News", "url": "https://…" },
    "publishedAt": "YYYY-MM-DD"
  }],
  "models": [{
    "id": "m-…", "name": "Latin script", "org": "Latin script",
    "releaseDate": "YYYY-MM-DD", "highlights": "Arabic",
    "specs": { "context": "1M", "params": "32B" },
    "url": "https://…"
  }],
  "highlights": [{ "id": "h-…", "text": "Arabic", "level": "info|warning|critical", "url": "https://… | null" }]
}
```

### data/knowledge.json — cumulative knowledge base (the "مهارات ومعرفة" section)
```json
{ "entries": [{
    "id": "k-2026-01-01-slug",
    "title": "Arabic skill title",
    "why": "Arabic — why it matters",
    "difficulty": "beginner|intermediate|advanced",
    "steps": [{ "title": "Arabic imperative", "detail": "Arabic 1-2 sentences" }],
    "code": "optional short snippet, ltr",
    "resources": [{ "name": "…", "url": "https://…" }],
    "tags": ["…"], "addedAt": "YYYY-MM-DD"
}] }
```

### data/archive.json — `{ "editions": [{ "date": "YYYY-MM-DD", "topHeadlines": ["…", "…", "…"] }] }` (newest first)
### data/archive/YYYY-MM-DD.json — a full past edition (same shape as latest.json)

## Common tasks

### Run a real daily update locally
```bash
ZAI_API_KEY=xxx node scripts/update-daily.mjs
```
Flags: `--fetch-only` (test sources, no AI call), `--dry-run` (sample edition, no network).
The script rotates the previous `latest.json` into `data/archive/` automatically.

### Manually curate today's edition (no API key needed)
1. Use web search to find today's AI news.
2. Hand-write `data/latest.json` following the schema above (Arabic text, real URLs only).
3. If replacing an existing `latest.json` from a different date, first copy the old one to
   `data/archive/<old-date>.json` and prepend it to `data/archive.json`.
4. Commit + push — Cloudflare deploys automatically.

### Add a knowledge entry by hand
Append an entry object (see schema) to the TOP of `data/knowledge.json` `entries`
array with a unique `id` (`k-<date>-<slug>`) and today's `addedAt`. Keep ≤150 entries.

### Test the site locally
```bash
npx serve .            # or: python -m http.server
```
Must be served over HTTP (fetch of JSON files fails on file://).

### Things that must stay true
- Arabic UI, `dir="rtl"`, `lang="ar"`. Content fields Arabic; model names/orgs/code/URLs stay Latin.
- Never commit API keys. The key lives only in the GitHub secret `ZAI_API_KEY` (and locally as an env var).
- The script must never invent URLs — news items without a resolvable real source are dropped.
- `data/` is the only directory the Action commits.
