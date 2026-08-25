#!/usr/bin/env node
/**
 * AI اليوم — MCP tools & skills directory from ModelScope.
 *
 * Fetches the top MCP servers from ModelScope's public marketplace API
 * (overall top + top per category), adds Arabic names/descriptions via GLM
 * (cached — only new/changed entries are translated), and writes data/mcp.json.
 *
 * Usage:
 *   ZAI_API_KEY=... node scripts/update-mcp.mjs   # real run
 *   node scripts/update-mcp.mjs --fetch-only      # list sources, no AI call
 *   node scripts/update-mcp.mjs --dry-run         # no network, no write
 *
 * Env: ZAI_API_KEY, GLM_MODEL (default glm-4.5-flash), ZAI_BASE_URL
 */

import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const MCP_PATH = path.join(DATA, "mcp.json");

const DRY_RUN = process.argv.includes("--dry-run");
const FETCH_ONLY = process.argv.includes("--fetch-only");
const API_KEY = process.env.ZAI_API_KEY || "";
const MODEL = process.env.GLM_MODEL || "glm-4.5-flash";
const BASE_URL = process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4";

const MS_API = "https://modelscope.cn/openapi/v1/mcp/servers";
const TARGET_COUNT = 150;
const PER_CATEGORY = 12;

const CATEGORIES = [
  "search", "developer-tools", "browser-automation", "knowledge-and-memory",
  "file-systems", "communication", "research-and-data", "finance",
  "location-services", "entertainment-and-media", "customer-and-marketing",
  "calendar-management", "art-and-culture", "other",
];

const log = (msg) => console.log(`[mcp] ${msg}`);

async function timedFetch(url, opts = {}, ms = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function listMcpServers({ page = 1, size = 50, category = "" } = {}) {
  const body = {
    page_number: page,
    page_size: Math.min(size, 100),
    search: "",
    filter: category ? { category } : {},
  };
  const res = await timedFetch(MS_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "User-Agent": "ai-today-newsletter/1.0" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.mcp_server_list || [];
}

function toEntry(server) {
  const en = server.locales?.en || {};
  const zh = server.locales?.zh || {};
  return {
    id: server.id,
    nameEn: (en.name || server.id.split("/").pop() || server.id).trim(),
    nameZh: (zh.name || server.chinese_name || server.name || "").trim(),
    nameAr: "",
    descEn: (en.description || "").trim(),
    descZh: (zh.description || server.description || "").trim(),
    descAr: "",
    categories: (server.categories || []).filter(Boolean),
    logo: server.logo_url || "",
    views: server.view_count || 0,
    url: `https://modelscope.cn/mcp/servers/${server.id}`,
  };
}

async function collect() {
  const byId = new Map();

  async function fetchWithRetry(opts, tries = 3) {
    for (let i = 1; i <= tries; i++) {
      try {
        return await listMcpServers(opts);
      } catch (err) {
        if (i === tries) throw err;
        await new Promise((r) => setTimeout(r, 3000 * i)); // backoff for 429s
      }
    }
  }

  // ModelScope rate-limits burst parallel requests — run with limited concurrency.
  async function runPool(jobs, limit = 3) {
    const results = [];
    let idx = 0;
    await Promise.all(Array.from({ length: limit }, async () => {
      while (idx < jobs.length) {
        const my = idx++;
        results[my] = await jobs[my]();
      }
    }));
    return results;
  }

  const jobs = [
    async () => fetchWithRetry({ size: 100, page: 1 }).catch((e) => { log(`overall list failed: ${e.message}`); return []; }),
    ...CATEGORIES.map((cat) =>
      async () => fetchWithRetry({ size: PER_CATEGORY, page: 1, category: cat })
        .catch((e) => { log(`category ${cat} failed: ${e.message}`); return []; })
    ),
  ];
  const results = await runPool(jobs, 3);
  results.flat().forEach((server) => {
    if (server?.id && !byId.has(server.id)) byId.set(server.id, server);
  });
  log(`collected ${byId.size} unique servers`);
  return [...byId.values()].map(toEntry).sort((a, b) => b.views - a.views).slice(0, TARGET_COUNT);
}

/* ---------------- Arabic translation (batched, cached) ---------------- */

async function translateBatch(entries) {
  const payload = entries.map((e, i) => ({ i, name: e.nameEn.slice(0, 80), desc: (e.descEn || e.descZh).slice(0, 400) }));
  const prompt = `Translate the following MCP tool names and descriptions into Arabic.
Rules: keep technical terms, product names, and acronyms in Latin script (e.g. "MCP", "API", "GitHub").
Respond with ONLY a valid JSON object: {"t": [{"i": 0, "nameAr": "...", "descAr": "..."}]} with one item per input.

ITEMS:
${JSON.stringify(payload)}`;

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a precise Arabic technical translator. You always reply with strict, valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  };

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await timedFetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
      }, 300000);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (text.includes("response_format")) { delete body.response_format; throw new Error("response_format rejected, retrying without"); }
        throw new Error(`API HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      const extracted = content.match(/\{[\s\S]*\}/)?.[0] || content;
      const parsed = JSON.parse(extracted);
      const map = new Map((parsed.t || []).map((x) => [x.i, x]));
      let applied = 0;
      entries.forEach((e, i) => {
        const tr = map.get(i);
        if (tr && tr.nameAr) {
          e.nameAr = String(tr.nameAr).trim();
          e.descAr = String(tr.descAr || "").trim();
          applied++;
        }
      });
      return applied;
    } catch (err) {
      lastErr = err;
      log(`translate attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 8000));
    }
  }
  throw lastErr;
}

/* ---------------- main ---------------- */

async function readJsonIfExists(p, fallback) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  log(`mode=${DRY_RUN ? "dry-run" : FETCH_ONLY ? "fetch-only" : "live"}, model=${MODEL}`);

  if (DRY_RUN) {
    log("dry-run: nothing fetched, nothing written.");
    return;
  }

  const previous = await readJsonIfExists(MCP_PATH, { servers: [] });
  const prevById = new Map((previous.servers || []).map((s) => [s.id, s]));

  const servers = await collect();
  log(`top ${servers.length} servers selected (by views)`);

  if (FETCH_ONLY) {
    console.log(servers.slice(0, 15).map((s) => `- [${(s.categories[0] || "?")}] ${s.nameEn} (${s.views} views)`).join("\n"));
    return;
  }

  if (!API_KEY) throw new Error("ZAI_API_KEY is not set (needed for Arabic translation)");

  // Restore cached Arabic for unchanged entries (same English source text).
  let restored = 0;
  servers.forEach((s) => {
    const prev = prevById.get(s.id);
    if (prev && prev.nameAr && prev.descEn === s.descEn && prev.nameEn === s.nameEn) {
      s.nameAr = prev.nameAr;
      s.descAr = prev.descAr;
      restored++;
    }
  });
  log(`restored cached Arabic for ${restored}/${servers.length}`);

  const missing = servers.filter((s) => !s.nameAr);
  log(`needs translation: ${missing.length}`);
  let translated = 0;
  for (let i = 0; i < missing.length; i += 40) {
    const batch = missing.slice(i, i + 40);
    const n = await translateBatch(batch);
    translated += n;
    log(`batch ${Math.floor(i / 40) + 1}: translated ${n}/${batch.length}`);
  }

  const notTranslated = servers.filter((s) => !s.nameAr).length;
  if (notTranslated > 0) log(`warning: ${notTranslated} entries still untranslated (UI falls back to English)`);

  await access(DATA).catch(() => mkdir(DATA, { recursive: true }));
  await writeFile(MCP_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), servers }, null, 2) + "\n", "utf8");
  log(`wrote data/mcp.json (${servers.length} servers, ${translated} newly translated)`);
}

main().catch((err) => {
  console.error(`[mcp] FATAL: ${err.message}`);
  process.exit(1);
});
