#!/usr/bin/env node
/**
 * AI اليوم — daily edition builder.
 *
 * Fetches candidate stories from free public sources (Hacker News, arXiv,
 * HuggingFace, Reddit, RSS feeds), asks a GLM model (Z.ai API) to curate the
 * day's edition in Arabic, then writes the JSON data files the site renders.
 *
 * Usage:
 *   ZAI_API_KEY=... node scripts/update-daily.mjs           # real run
 *   node scripts/update-daily.mjs --fetch-only              # test sources, no AI call
 *   node scripts/update-daily.mjs --dry-run                 # sample edition, no network
 *
 * Env:
 *   ZAI_API_KEY   (required for real runs)  — https://z.ai model API key
 *   GLM_MODEL     (optional, default glm-4.6)
 *   ZAI_BASE_URL  (optional, default https://api.z.ai/api/paas/v4)
 */

import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const ARCHIVE_DIR = path.join(DATA, "archive");
const DRY_RUN = process.argv.includes("--dry-run");
const FETCH_ONLY = process.argv.includes("--fetch-only");

const API_KEY = process.env.ZAI_API_KEY || "";
const MODEL = process.env.GLM_MODEL || "glm-4.6";
const BASE_URL = process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4";

const CATEGORIES = ["models", "tools", "research", "companies", "regulation", "other"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const KNOWLEDGE_TRACKS = ["basics", "building", "security", "tools"];
const AI_KEYWORDS = [
  "ai", "artificial intelligence", "llm", "gpt", "chatgpt", "claude", "gemini",
  "llama", "openai", "anthropic", "deepmind", "mistral", "qwen", "deepseek",
  "kimi", "grok", "copilot", "transformer", "diffusion", "agent", "rag",
  "embedding", "multimodal", "inference", "fine-tun", "neural network",
  "machine learning", "generative", "chatbot", "text-to-", "mcp",
];

// Short keywords ("ai", "gpt") must start at a word boundary, otherwise
// "ai" would match "said"; long distinctive ones may appear anywhere.
const AI_REGEXES = AI_KEYWORDS.map((k) =>
  (k.length >= 5 && !/\b(ai|llm|gpt|mcp|rag)\b/.test(k))
    ? new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i")
);

const SECURITY_KEYWORDS = [
  "hack", "breach", "breached", "exploit", "vulnerab", "jailbreak",
  "prompt injection", "injection attack", "malware", "ransomware",
  "phishing", "cve-", "0-day", "zero-day", "backdoor", "data leak",
  "leaked", "intrusion", "attack", "compromis", "security incident",
  "watering hole", "supply chain attack",
];

const SECURITY_REGEXES = SECURITY_KEYWORDS.map((k) => new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

const log = (msg) => console.log(`[update] ${msg}`);
const today = () => new Date().toISOString().slice(0, 10);
const UA = "ai-today-newsletter/1.0";

/* ================================================================
 * Sources — each returns [{title, url, source, publishedAt, description}]
 * Every source is wrapped in try/catch: one failing source never
 * kills the run (e.g. Reddit blocks datacenter IPs at times).
 * ================================================================ */

async function timedFetch(url, opts = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function matchesAi(text) {
  const t = text.toLowerCase();
  return AI_REGEXES.some((r) => r.test(t));
}

function matchesSecurity(text) {
  const t = text.toLowerCase();
  return SECURITY_REGEXES.some((r) => r.test(t));
}

async function fetchHackerNews(cutoffHours = 48) {
  const since = Math.floor(Date.now() / 1000 - cutoffHours * 3600);
  const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=120&numericFilters=points>40,created_at_i>${since}`;
  const res = await timedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.hits || [])
    .filter((h) => matchesAi(`${h.title} ${h.url || ""}`))
    .slice(0, 30)
    .map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "Hacker News",
      publishedAt: (h.created_at || "").slice(0, 10),
      description: `Points: ${h.points || 0}, comments: ${h.num_comments || 0}`,
    }));
}

async function fetchArxiv() {
  const url = "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=25";
  const res = await timedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1).map((block) => {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
    };
    const link = block.match(/<link[^>]*href="([^"]+)"/);
    return {
      title: pick("title").replace(/\s+/g, " "),
      url: link ? link[1] : "",
      source: "arXiv",
      publishedAt: pick("published").slice(0, 10),
      description: pick("summary").slice(0, 220),
    };
  });
  return entries.filter((e) => e.title && e.url).slice(0, 15);
}

async function fetchHuggingFace() {
  const modelsRes = await timedFetch("https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=40");
  if (!modelsRes.ok) throw new Error(`models HTTP ${modelsRes.status}`);
  const models = await modelsRes.json();
  const modelItems = models
    .filter((m) => (m.downloads || 0) > 300)
    .slice(0, 12)
    .map((m) => ({
      title: `New model on HuggingFace: ${m.modelId}`,
      url: `https://huggingface.co/${m.modelId}`,
      source: "HuggingFace",
      publishedAt: (m.createdAt || "").slice(0, 10),
      description: `downloads ${m.downloads}, likes ${m.likes}`,
    }));
  const papersRes = await timedFetch("https://huggingface.co/api/daily_papers");
  const papers = papersRes.ok ? await papersRes.json() : [];
  const paperItems = papers.slice(0, 10).map((p) => ({
    title: p.paper ? p.paper.title : p.title || "",
    url: p.paper ? `https://huggingface.co/papers/${p.paper.id}` : "",
    source: "HF Papers",
    publishedAt: (p.publishedAt || "").slice(0, 10),
    description: `upvotes ${p.upvotes || 0}`,
  })).filter((p) => p.title && p.url);
  return [...modelItems, ...paperItems];
}

async function fetchReddit(sub) {
  const res = await timedFetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=20`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.data?.children || [])
    .map((c) => c.data)
    .filter((p) => !p.stickied)
    .slice(0, 10)
    .map((p) => ({
      title: p.title,
      url: `https://www.reddit.com${p.permalink}`,
      source: `r/${sub}`,
      publishedAt: new Date(p.created_utc * 1000).toISOString().slice(0, 10),
      description: `score ${p.score}`,
    }));
}

async function fetchRss(name, feedUrl) {
  const res = await timedFetch(feedUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return xml.split("<item>").slice(1).map((block) => {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    return {
      title: pick("title").replace(/<[^>]+>/g, ""),
      url: (linkMatch ? linkMatch[1] : "").trim(),
      source: name,
      publishedAt: (pick("pubDate") ? new Date(pick("pubDate")).toISOString().slice(0, 10) : ""),
      description: pick("description").replace(/<[^>]+>/g, "").slice(0, 200),
    };
  }).filter((i) => i.title && i.url).slice(0, 8);
}

/** Google News RSS search URL for a query, limited to the last 7 days. */
function googleNewsRss(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:7d")}&hl=en-US&gl=US&ceid=US:en`;
}

/**
 * Generic article-list scraper for provider news/blog pages without RSS.
 * Extracts anchors whose href contains one of `hrefHints`, with visible text
 * long enough to be an article title.
 */
async function scrapeArticleLinks(name, pageUrl, hrefHints = []) {
  const res = await timedFetch(pageUrl, { headers: { "User-Agent": UA } }, 25000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const anchors = html.matchAll(/<a\b[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g);
  const items = [];
  const seen = new Set();
  for (const m of anchors) {
    let href = m[1];
    if (href.startsWith("/")) href = new URL(href, pageUrl).href;
    if (!href.startsWith("http")) continue;
    if (hrefHints.length && !hrefHints.some((h) => href.includes(h))) continue;
    const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (title.length < 12 || title.length > 200) continue;
    const key = href.replace(/[#?].*$/, "");
    if (seen.has(key) || key === pageUrl.replace(/\/$/, "")) continue;
    seen.add(key);
    items.push({ title, url: key, source: name, publishedAt: "", description: "" });
    if (items.length >= 8) break;
  }
  if (items.length === 0) throw new Error("no article links found");
  return items;
}

/** llm-stats.com renders its leaderboard into the HTML — extract readable text. */
async function fetchLlmStatsText() {
  const res = await timedFetch("https://llm-stats.com/", { headers: { "User-Agent": UA } }, 30000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // The leaderboard sits near the top of the page content; keep a bounded window.
  return text.slice(0, 8000);
}

async function collectCandidates() {
  const jobs = [
    ["HackerNews", () => fetchHackerNews()],
    ["arXiv", () => fetchArxiv()],
    ["HuggingFace", () => fetchHuggingFace()],
    ["Reddit/ML", () => fetchReddit("MachineLearning")],
    ["Reddit/LocalLLaMA", () => fetchReddit("LocalLLaMA")],
    ["TheBatch", () => fetchRss("The Batch", "https://www.deeplearning.ai/the-batch/feed/")],
    ["TechCrunchAI", () => fetchRss("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/")],
    ["VentureBeatAI", () => fetchRss("VentureBeat AI", "https://venturebeat.com/category/ai/feed/")],
    // Official provider blogs (announcements: models, features, skills, plugins)
    ["OpenAI", () => fetchRss("OpenAI", "https://openai.com/news/rss.xml")],
    ["DeepMind", () => fetchRss("Google DeepMind", "https://deepmind.google/blog/rss.xml")],
    ["Anthropic", () => scrapeArticleLinks("Anthropic", "https://www.anthropic.com/news", ["/news/"])],
    ["Mistral", () => scrapeArticleLinks("Mistral AI", "https://mistral.ai/news/", ["/news/"])],
    ["MetaAI", () => scrapeArticleLinks("Meta AI", "https://ai.meta.com/blog/", ["/blog/"])],
    // JS-rendered provider pages → Google News RSS fallback (last 7 days)
    ["Kimi/Moonshot", () => fetchRss("Moonshot AI (news)", googleNewsRss("Kimi Moonshot AI model"))],
    ["Z.ai", () => fetchRss("Z.ai (news)", googleNewsRss("Z.ai GLM model release"))],
    ["Qwen", () => fetchRss("Qwen (news)", googleNewsRss("Qwen Alibaba model"))],
    ["DeepSeek", () => fetchRss("DeepSeek (news)", googleNewsRss("DeepSeek model"))],
    ["xAI", () => fetchRss("xAI (news)", googleNewsRss("Grok xAI model"))],
    // AI security
    ["Schneier", () => fetchRss("Schneier on Security", "https://www.schneier.com/feed/")],
  ];
  const results = await Promise.allSettled(jobs.map(([_, fn]) => fn()));
  const all = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      log(`source ${jobs[i][0]}: ${r.value.length} items`);
      all.push(...r.value);
    } else {
      log(`source ${jobs[i][0]} FAILED: ${r.reason?.message || r.reason} (continuing)`);
    }
  });
  // de-duplicate by URL; flag security-relevant items so the model notices them
  const seen = new Set();
  return all
    .filter((c) => {
      const key = c.url.replace(/[#?].*$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({ ...c, sec: matchesSecurity(`${c.title} ${c.description || ""}`) ? true : undefined }));
}

/* ================================================================
 * GLM call
 * ================================================================ */

function buildPrompt(candidates, recentKnowledgeTitles, yesterdayHeadlines, llmStatsText) {
  const compact = candidates.map((c, i) => ({
    i,
    t: c.title.slice(0, 140),
    s: c.source,
    d: c.publishedAt,
    n: (c.description || "").slice(0, 90),
    ...(c.sec ? { sec: true } : {}),
  }));

  return `You are the editor of "AI اليوم", a daily Arabic-language AI newsletter.

Below is a JSON array of ${compact.length} candidate stories collected from the web today
(index i, title t, source s, date d, notes n; sec=true marks security-relevant items).
The sources include the OFFICIAL news feeds of AI providers (OpenAI, Google DeepMind,
Anthropic, Moonshot/Kimi, Mistral, Z.ai, Meta, Qwen, DeepSeek, xAI) — pay special
attention to their announcements of new models, features, skills, and plugins.

YOUR TASKS:

1) NEWS: Pick the 8-12 MOST significant items for an Arabic-speaking AI enthusiast.
   For each: write an accurate Arabic title (concise) and an Arabic summary (2-3 sentences,
   informative, no fluff). Choose category: one of ${JSON.stringify(CATEGORIES)}.
   Rate importance 1-5 (5 = major breakthrough/industry-shaping). Reference the candidate by "sourceIndex".
   Feature/plugin/skill announcements from official provider blogs are valuable news (usually category "tools").

2) MODELS: From the candidates, extract actual NEW AI model releases/announcements
   (new checkpoint, version, or open-weights drop). Only include if genuinely a model release,
   max 6. Name and org in Latin script; highlights in Arabic; releaseDate as YYYY-MM-DD;
   specs as short strings (e.g. {"context": "1M", "params": "32B", "modality": "text+vision"}).
   Reference "sourceIndex" for the link.

3) HIGHLIGHTS: 0-3 items of important info the reader must know (major announcements,
   big funding, market moves). text in Arabic, level one of "info"/"warning"/"critical".
   Reference "sourceIndex" when applicable, otherwise null.

4) SECURITY: Pick 2-5 items about AI SECURITY specifically: AI-related hacks and breaches,
   prompt injections and jailbreaks, AI malware, leaked or discovered system prompts,
   model backdoors, AI-powered attacks. Fields: title and summary in Arabic (if the article
   reveals the actual prompt, technique, or vulnerability used, DESCRIBE it in the summary),
   type one of "breach"/"prompt-injection"/"jailbreak"/"malware"/"backdoor"/"policy",
   severity one of "info"/"warning"/"critical", and "sourceIndex". Only AI-related items.

5) BENCHMARKS: Based ONLY on the leaderboard text below (LLM Stats), build:
   topModels: the top 10 models as {name, org, score} exactly as they appear in the data
   (name/org Latin, score as displayed); highlights: 1-2 sentences in Arabic commenting on
   the current ranking (biggest mover, close races). Do NOT invent models or scores.

6) KNOWLEDGE ENTRY: Exactly ONE new entry for the "مهارات ومعرفة" section — a practical
   skill taught as knowledge: what it is, why it matters, and concrete steps of how to
   learn/add this skill. Vary the topic across days. AVOID these recent topics:
   ${JSON.stringify(recentKnowledgeTitles.slice(0, 12))}.
   Pick topics like: building a RAG system, fine-tuning a small model, writing good prompts,
   running local models, agents, evals, vector databases, AI safety basics, multimodal APIs…
   Fields: why (Arabic, 2 sentences), difficulty one of ${JSON.stringify(DIFFICULTIES)},
   track one of ${JSON.stringify(KNOWLEDGE_TRACKS)} (basics=أساسيات, building=بناء أنظمة,
   security=أمن, tools=أدوات — pick the closest fit),
   steps: 4-6 steps each {title (Arabic imperative), detail (Arabic, 1-2 sentences)},
   code: a SHORT runnable example snippet relevant to the skill (or "" if not applicable),
   resources: 1-3 well-known real URLs, tags: 2-4 Arabic or English tags,
   quickRef: ONE short Arabic sentence — the single key action to remember from this skill,
   quiz: 2-3 multiple-choice questions in Arabic that test understanding of the skill:
     {q: question, options: [3-4 short Arabic options], answer: index of correct option, explain: Arabic explanation why}.
   The wrong options must be plausible but clearly wrong to someone who read the steps.

HARD RULES:
- ALL free-text fields for news/models/highlights/security/knowledge must be in ARABIC (except
  model names, orgs, code, URLs, tags which stay Latin). Benchmarks topModels stays Latin.
- NEVER invent URLs. Use "sourceIndex" to reference candidates; the pipeline resolves links.
- Only reference indices that exist (0-${compact.length - 1}).
- Yesterday's top headlines (do NOT repeat them): ${JSON.stringify(yesterdayHeadlines)}

CANDIDATES:
${JSON.stringify(compact)}

LLM STATS LEADERBOARD TEXT (for task 5):
${llmStatsText || "(leaderboard unavailable today — return empty benchmarks object)"}

Respond with ONLY a valid JSON object, no markdown fences, exactly this shape:
{
  "news": [{"title": "...", "summary": "...", "category": "models", "importance": 4, "sourceIndex": 0}],
  "models": [{"name": "...", "org": "...", "releaseDate": "YYYY-MM-DD", "highlights": "...", "specs": {}, "sourceIndex": 0}],
  "highlights": [{"text": "...", "level": "info", "sourceIndex": 0}],
  "security": [{"title": "...", "summary": "...", "type": "breach", "severity": "warning", "sourceIndex": 0}],
  "benchmarks": {"topModels": [{"name": "...", "org": "...", "score": "..."}], "highlights": "..."},
  "knowledgeEntry": {"title": "...", "why": "...", "difficulty": "beginner", "track": "basics", "steps": [{"title": "...", "detail": "..."}], "code": "", "resources": [{"name": "...", "url": "..."}], "tags": ["..."], "quickRef": "...", "quiz": [{"q": "...", "options": ["...", "...", "..."], "answer": 0, "explain": "..."}]}
}`;
}

async function callGlm(prompt) {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a precise Arabic AI-news editor. You always reply with strict, valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 7000,
  };

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await timedFetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
      }, 300000); // large prompt + long generation needs well over 2 minutes
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      const extracted = content.match(/\{[\s\S]*\}/)?.[0] || content;
      return JSON.parse(extracted);
    } catch (err) {
      lastErr = err;
      log(`GLM attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 8000));
    }
  }
  throw new Error(`GLM API failed after 3 attempts: ${lastErr?.message}`);
}

/* ================================================================
 * Validation / normalization
 * ================================================================ */

const normalizeCategory = (c) => {
  const map = { model: "models", tool: "tools", research: "research", company: "companies", regulation: "regulation", policy: "regulation" };
  const k = String(c || "").toLowerCase().trim();
  return CATEGORIES.includes(k) ? k : (map[k] || "other");
};

function buildEdition(raw, candidates) {
  const date = today();
  const resolve = (idx) => (Number.isInteger(idx) && candidates[idx] ? candidates[idx] : null);

  const news = (raw.news || [])
    .map((n, i) => {
      const src = resolve(n.sourceIndex);
      if (!src || !n.title || !n.summary) return null;
      return {
        id: `n-${date}-${i + 1}`,
        title: String(n.title).trim(),
        summary: String(n.summary).trim(),
        category: normalizeCategory(n.category),
        importance: Math.min(5, Math.max(1, parseInt(n.importance, 10) || 3)),
        source: { name: src.source, url: src.url },
        publishedAt: src.publishedAt || date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.importance - a.importance);

  const models = (raw.models || [])
    .map((m, i) => {
      const src = resolve(m.sourceIndex);
      if (!m.name || !src) return null;
      return {
        id: `m-${date}-${i + 1}`,
        name: String(m.name).trim(),
        org: String(m.org || "").trim() || (src ? src.source : ""),
        releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(m.releaseDate) ? m.releaseDate : date,
        highlights: String(m.highlights || "").trim(),
        specs: typeof m.specs === "object" && m.specs ? m.specs : {},
        url: src.url,
      };
    })
    .filter(Boolean);

  const highlights = (raw.highlights || [])
    .map((h, i) => {
      if (!h.text) return null;
      const src = resolve(h.sourceIndex);
      const level = ["info", "warning", "critical"].includes(h.level) ? h.level : "info";
      return { id: `h-${date}-${i + 1}`, text: String(h.text).trim(), level, url: src ? src.url : null };
    })
    .filter(Boolean);

  const SECURITY_TYPES = ["breach", "prompt-injection", "jailbreak", "malware", "backdoor", "policy"];
  const security = (raw.security || [])
    .map((s, i) => {
      const src = resolve(s.sourceIndex);
      if (!s.title || !s.summary || !src) return null;
      return {
        id: `sec-${date}-${i + 1}`,
        title: String(s.title).trim(),
        summary: String(s.summary).trim(),
        type: SECURITY_TYPES.includes(s.type) ? s.type : "policy",
        severity: ["info", "warning", "critical"].includes(s.severity) ? s.severity : "info",
        url: src.url,
        source: src.source,
        date: src.publishedAt || date,
      };
    })
    .filter(Boolean);

  const rawBench = raw.benchmarks;
  const topModels = (rawBench && Array.isArray(rawBench.topModels) ? rawBench.topModels : [])
    .filter((m) => m && m.name)
    .slice(0, 10)
    .map((m) => ({ name: String(m.name).trim(), org: String(m.org || "").trim(), score: String(m.score ?? "").trim() }));
  const benchmarks = topModels.length
    ? {
        asOf: date,
        source: "LLM Stats",
        url: "https://llm-stats.com/",
        topModels,
        highlights: String(rawBench.highlights || "").trim(),
      }
    : null;

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  const ke = raw.knowledgeEntry;
  const sanitizeQuiz = (quiz) => (Array.isArray(quiz) ? quiz : [])
    .filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
    .slice(0, 4)
    .map((q) => ({ q: String(q.q).trim(), options: q.options.map(String), answer: q.answer, explain: String(q.explain || "").trim() }));
  const knowledgeEntry = ke && ke.title && Array.isArray(ke.steps) && ke.steps.length
    ? {
        id: `k-${date}-${slug(ke.title) || "skill"}`,
        title: String(ke.title).trim(),
        why: String(ke.why || "").trim(),
        difficulty: DIFFICULTIES.includes(ke.difficulty) ? ke.difficulty : "intermediate",
        track: KNOWLEDGE_TRACKS.includes(ke.track) ? ke.track : "basics",
        steps: ke.steps.slice(0, 8).map((s) => ({ title: String(s.title || ""), detail: String(s.detail || "") })),
        code: String(ke.code || "").trim(),
        resources: (ke.resources || []).filter((r) => r && r.url).slice(0, 4).map((r) => ({ name: String(r.name || "رابط"), url: String(r.url) })),
        tags: (ke.tags || []).slice(0, 5).map(String),
        quickRef: String(ke.quickRef || "").trim(),
        quiz: sanitizeQuiz(ke.quiz),
        addedAt: date,
      }
    : null;

  if (news.length === 0) throw new Error("model returned zero usable news items");
  return { date, generatedAt: new Date().toISOString(), news, models, highlights, security, benchmarks, knowledgeEntry };
}

/* ================================================================
 * File output
 * ================================================================ */

async function readJsonIfExists(p, fallback) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(p, obj) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function sampleEdition() {
  const date = today();
  return {
    date,
    generatedAt: new Date().toISOString(),
    news: [
      {
        id: `n-${date}-1`,
        title: "إصدار جديد لنموذج مفتوح المصدر يتصدر اهتمامات المطورين",
        summary: "هذه نشرة تجريبية تُستخدم لاختبار تصميم الصفحة قبل تشغيل خط التحديث الفعلي. استبدلها بتشغيل السكربت مع مفتاح API.",
        category: "models",
        importance: 5,
        source: { name: "مصدر تجريبي", url: "https://example.com" },
        publishedAt: date,
      },
    ],
    models: [],
    highlights: [{ id: `h-${date}-1`, text: "هذه نسخة تجريبية من النشرة.", level: "info", url: null }],
    security: [],
    benchmarks: null,
    knowledgeEntry: null,
  };
}

async function persist(edition) {
  await access(DATA).catch(() => mkdir(DATA, { recursive: true }));
  await access(ARCHIVE_DIR).catch(() => mkdir(ARCHIVE_DIR, { recursive: true }));

  // Rotate previous edition into the archive
  const previous = await readJsonIfExists(path.join(DATA, "latest.json"), null);
  if (previous && previous.date && previous.date !== edition.date) {
    await writeJson(path.join(ARCHIVE_DIR, `${previous.date}.json`), previous);
    log(`archived previous edition ${previous.date}`);
  }

  // Archive index
  const archiveIndex = await readJsonIfExists(path.join(DATA, "archive.json"), { editions: [] });
  if (previous && previous.date && previous.date !== edition.date) {
    const headlines = (previous.news || []).slice(0, 3).map((n) => n.title);
    archiveIndex.editions = [
      { date: previous.date, topHeadlines: headlines },
      ...archiveIndex.editions.filter((e) => e.date !== previous.date),
    ].slice(0, 90);
  }

  // Knowledge base (cumulative)
  const kb = await readJsonIfExists(path.join(DATA, "knowledge.json"), { entries: [] });
  if (edition.knowledgeEntry && !kb.entries.some((e) => e.id === edition.knowledgeEntry.id)) {
    kb.entries.unshift(edition.knowledgeEntry);
    log(`added knowledge entry: ${edition.knowledgeEntry.title}`);
  }
  kb.entries = kb.entries.slice(0, 150);

  await writeJson(path.join(DATA, "latest.json"), edition);
  await writeJson(path.join(DATA, "knowledge.json"), kb);
  await writeJson(path.join(DATA, "archive.json"), archiveIndex);
  log(`wrote data files for ${edition.date}: ${edition.news.length} news, ${edition.models.length} models`);
}

/* ================================================================
 * Main
 * ================================================================ */

async function main() {
  log(`mode=${DRY_RUN ? "dry-run" : FETCH_ONLY ? "fetch-only" : "live"}, model=${MODEL}`);

  if (DRY_RUN) {
    const edition = sampleEdition();
    const latestExists = existsSync(path.join(DATA, "latest.json"));
    if (!latestExists) {
      await persist(edition);
      log("dry-run seeded sample data (data/ was empty)");
    } else {
      log("dry-run: data already exists, nothing written. Sample edition:");
      console.log(JSON.stringify(edition, null, 2));
    }
    return;
  }

  const candidates = await collectCandidates();
  log(`total unique candidates: ${candidates.length}`);
  if (candidates.length < 10) throw new Error("too few candidates collected today — aborting instead of publishing junk");

  let llmStatsText = "";
  try {
    llmStatsText = await fetchLlmStatsText();
    log(`llm-stats leaderboard text: ${llmStatsText.length} chars`);
  } catch (err) {
    log(`llm-stats fetch FAILED: ${err.message} (benchmarks will be skipped)`);
  }

  if (FETCH_ONLY) {
    console.log(candidates.slice(0, 15).map((c) => `- [${c.source}${c.sec ? "/SEC" : ""}] ${c.title}`).join("\n"));
    return;
  }

  if (!API_KEY) {
    throw new Error("ZAI_API_KEY is not set — get a key at https://z.ai and export it, or use --dry-run / --fetch-only");
  }

  const kb = await readJsonIfExists(path.join(DATA, "knowledge.json"), { entries: [] });
  const previous = await readJsonIfExists(path.join(DATA, "latest.json"), null);
  const yesterdayHeadlines = previous ? (previous.news || []).slice(0, 5).map((n) => n.title) : [];

  const prompt = buildPrompt(candidates, kb.entries.map((e) => e.title), yesterdayHeadlines, llmStatsText);
  log(`prompt ready (${prompt.length} chars) — calling ${MODEL}…`);
  const raw = await callGlm(prompt);
  log("GLM response received, validating…");

  const edition = buildEdition(raw, candidates);
  await persist(edition);
  log("done ✓");
}

main().catch((err) => {
  console.error(`[update] FATAL: ${err.message}`);
  process.exit(1);
});
