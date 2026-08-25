/* AI اليوم — client rendering */
(function () {
  "use strict";

  const CATEGORY_LABELS = {
    models: "النماذج",
    tools: "الأدوات",
    research: "الأبحاث",
    companies: "الشركات",
    regulation: "التنظيم",
    other: "متفرقات",
  };

  const DIFFICULTY_LABELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };

  const state = {
    news: [],
    category: "all",
    query: "",
    difficulty: "all",
  };

  const $ = (id) => document.getElementById(id);

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return res.json();
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* ---------- Dates ---------- */

  function formatGregorian(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat("ar-u-ca-gregory", { dateStyle: "full" }).format(d);
  }

  function formatHijri(dateStr) {
    try {
      const d = new Date(dateStr + "T12:00:00");
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { dateStyle: "full" }).format(d);
    } catch {
      return "";
    }
  }

  function formatShortDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat("ar-u-ca-gregory", { day: "numeric", month: "long", year: "numeric" }).format(d);
  }

  /* ---------- Theme ---------- */

  function initTheme() {
    const saved = localStorage.getItem("ai-today-theme");
    if (saved) document.documentElement.dataset.theme = saved;
    updateThemeButton();
    $("themeToggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("ai-today-theme", next);
      updateThemeButton();
    });
  }

  function updateThemeButton() {
    $("themeToggle").textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
  }

  /* ---------- Mobile nav ---------- */

  function initNav() {
    const toggle = $("navToggle");
    const nav = $("mainNav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  /* ---------- Hero ---------- */

  function renderHero(edition) {
    $("todayDate").textContent = formatGregorian(edition.date);
    const hijri = formatHijri(edition.date);
    if (hijri) {
      const kicker = document.querySelector(".hero-kicker");
      kicker.textContent = `نشرة الذكاء الاصطناعي اليومية • ${hijri}`;
    }

    const top = [...edition.news].sort((a, b) => (b.importance || 0) - (a.importance || 0))[0];
    if (top) {
      $("topStory").innerHTML = `
        <div class="top-story-tag">أهم خبر اليوم</div>
        <h2 class="top-story-title">${escapeHtml(top.title)}</h2>
        <p class="top-story-summary">${escapeHtml(top.summary)}</p>
        <a class="top-story-link" href="${escapeHtml(top.source.url)}" target="_blank" rel="noopener">
          اقرأ من المصدر <span aria-hidden="true">←</span>
        </a>`;
    }

    const modelCount = edition.models.length;
    const stats = [
      { value: edition.news.length, label: "خبراً اليوم" },
      { value: modelCount, label: "إصدارات نماذج" },
      { value: (edition.knowledgeCount ?? 0), label: "مهارة في القاعدة المعرفية" },
    ];
    $("heroStats").innerHTML = stats
      .map((s) => `<div class="stat-card"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`)
      .join("");
  }

  /* ---------- Important ---------- */

  function renderImportant(edition) {
    const list = $("importantList");
    if (!edition.highlights || edition.highlights.length === 0) {
      $("important").hidden = true;
      return;
    }
    const icons = { info: "ℹ️", warning: "⚠️", critical: "🚨" };
    $("important").hidden = false;
    list.innerHTML = edition.highlights
      .map((h) => `
        <div class="important-item level-${escapeHtml(h.level || "info")}">
          <span class="important-icon">${icons[h.level] || icons.info}</span>
          <p class="important-text">
            ${escapeHtml(h.text)}
            ${h.url ? `<a href="${escapeHtml(h.url)}" target="_blank" rel="noopener">المصدر ←</a>` : ""}
          </p>
        </div>`)
      .join("");
  }

  /* ---------- News ---------- */

  function renderCategoryFilters(news) {
    const counts = {};
    news.forEach((n) => { counts[n.category] = (counts[n.category] || 0) + 1; });
    const cats = Object.keys(counts).filter((c) => CATEGORY_LABELS[c]);
    const box = $("categoryFilters");
    box.innerHTML =
      `<button class="filter-chip active" data-cat="all">الكل (${news.length})</button>` +
      cats.map((c) => `<button class="filter-chip" data-cat="${escapeHtml(c)}">${CATEGORY_LABELS[c]} (${counts[c]})</button>`).join("");
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      box.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.dataset.cat;
      renderNews();
    });
  }

  function newsCard(n) {
    const stars = (n.importance || 0) >= 4 ? `<span class="news-importance" title="خبر عالي الأهمية">★</span>` : "";
    return `
      <article class="news-card">
        <div class="news-card-top">
          <span class="news-category">${CATEGORY_LABELS[n.category] || CATEGORY_LABELS.other}</span>
          ${stars}
        </div>
        <h3 class="news-title">${escapeHtml(n.title)}</h3>
        <p class="news-summary">${escapeHtml(n.summary)}</p>
        <div class="news-meta">
          <span>${escapeHtml(n.source.name)}</span>
          <a class="news-source-link" href="${escapeHtml(n.source.url)}" target="_blank" rel="noopener">المصدر ←</a>
        </div>
      </article>`;
  }

  function renderNews() {
    const q = state.query.trim();
    const items = state.news.filter((n) => {
      if (state.category !== "all" && n.category !== state.category) return false;
      if (q && !(n.title + " " + n.summary).includes(q)) return false;
      return true;
    });
    $("newsGrid").innerHTML = items.map(newsCard).join("");
    $("newsEmpty").hidden = items.length > 0;
  }

  function initNewsControls() {
    let debounce;
    $("newsSearch").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = e.target.value;
        renderNews();
      }, 180);
    });
  }

  /* ---------- Models ---------- */

  function renderModels(models) {
    $("modelsGrid").innerHTML = models
      .map((m) => {
        const initials = (m.org || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
        const specs = Object.entries(m.specs || {})
          .map(([k, v]) => `<span class="spec-chip">${escapeHtml(k)}: ${escapeHtml(v)}</span>`)
          .join("");
        return `
        <article class="model-card">
          <div class="model-head">
            <div class="model-org-avatar">${escapeHtml(initials)}</div>
            <div>
              <div class="model-name">${escapeHtml(m.name)}</div>
              <div class="model-org">${escapeHtml(m.org)}</div>
            </div>
          </div>
          <p class="model-highlights">${escapeHtml(m.highlights)}</p>
          <div class="model-specs">${specs}</div>
          <div class="model-meta">
            <span>${formatShortDate(m.releaseDate)}</span>
            ${m.url ? `<a href="${escapeHtml(m.url)}" target="_blank" rel="noopener">التفاصيل ←</a>` : ""}
          </div>
        </article>`;
      })
      .join("");
  }

  /* ---------- Knowledge ---------- */

  function renderKnowledgeFilters(knowledge) {
    const levels = ["beginner", "intermediate", "advanced"];
    const box = $("knowledgeFilters");
    box.innerHTML =
      `<button class="filter-chip active" data-level="all">الكل (${knowledge.length})</button>` +
      levels
        .filter((l) => knowledge.some((k) => k.difficulty === l))
        .map((l) => {
          const count = knowledge.filter((k) => k.difficulty === l).length;
          return `<button class="filter-chip" data-level="${l}">${DIFFICULTY_LABELS[l]} (${count})</button>`;
        })
        .join("");
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      box.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.difficulty = btn.dataset.level;
      renderKnowledgeList();
    });
  }

  function renderKnowledgeList() {
    const box = $("knowledgeList");
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const code = btn.nextElementSibling.textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "تم النسخ ✓";
        setTimeout(() => (btn.textContent = "نسخ"), 1600);
      });
    });

    box.render = function (knowledge) {
      box.dataset.items = JSON.stringify(knowledge.map((k) => k.id));
      box.innerHTML = knowledge
        .filter((k) => state.difficulty === "all" || k.difficulty === state.difficulty)
        .map((k) => {
          const steps = (k.steps || [])
            .map((s, i) => `
              <div class="knowledge-step">
                <span class="step-number">${i + 1}</span>
                <div>
                  <div class="step-title">${escapeHtml(s.title)}</div>
                  <div class="step-detail">${escapeHtml(s.detail)}</div>
                </div>
              </div>`)
            .join("");
          const code = k.code
            ? `<div class="knowledge-code">
                 <button class="copy-btn" type="button">نسخ</button>
                 <pre><code>${escapeHtml(k.code)}</code></pre>
               </div>`
            : "";
          const resources = (k.resources || [])
            .map((r) => `<a class="resource-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.name)} ←</a>`)
            .join("");
          const tags = (k.tags || [])
            .map((t) => `<span class="knowledge-tag">#${escapeHtml(t)}</span>`)
            .join("");
          return `
          <details class="knowledge-card" id="kb-${escapeHtml(k.id)}">
            <summary class="knowledge-head">
              <span class="knowledge-title-wrap">
                <span class="knowledge-title">${escapeHtml(k.title)}</span>
                <span class="difficulty-chip difficulty-${escapeHtml(k.difficulty)}">${DIFFICULTY_LABELS[k.difficulty] || ""}</span>
              </span>
              <span class="knowledge-chevron">▼</span>
            </summary>
            <div class="knowledge-body">
              <p class="knowledge-why">${escapeHtml(k.why)}</p>
              <div class="knowledge-steps">${steps}</div>
              ${code}
              <div class="knowledge-resources">${resources}</div>
              <div class="knowledge-footer">
                <span>أُضيفت: ${formatShortDate(k.addedAt)}</span>
                ${tags}
              </div>
            </div>
          </details>`;
        })
        .join("");
    };
  }

  /* ---------- Archive ---------- */

  function renderArchive(index) {
    const list = $("archiveList");
    if (!index.editions || index.editions.length === 0) {
      list.innerHTML = `<p class="empty-state">لا توجد نشرات مؤرشفة بعد — ستظهر هنا بعد أول تحديث يومي.</p>`;
      return;
    }
    list.innerHTML = index.editions
      .map((ed) => `
        <button class="archive-item" data-date="${escapeHtml(ed.date)}">
          <span class="archive-date">🗓️ ${formatShortDate(ed.date)}</span>
          <span class="archive-headlines">${(ed.topHeadlines || []).map(escapeHtml).join(" • ")}</span>
          <span style="color:var(--accent);font-weight:700">استعراض ←</span>
        </button>`)
      .join("");

    list.addEventListener("click", (e) => {
      const item = e.target.closest(".archive-item");
      if (item) loadArchiveDay(item.dataset.date);
    });
  }

  async function loadArchiveDay(date) {
    const detail = $("archiveDetail");
    detail.hidden = false;
    detail.innerHTML = `<p class="empty-state">جارٍ تحميل نشرة ${formatShortDate(date)}…</p>`;
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const ed = await fetchJson(`data/archive/${date}.json`);
      detail.innerHTML = `
        <div class="archive-detail-head">
          <h3 class="archive-detail-title">نشرة ${formatShortDate(date)}</h3>
          <button class="archive-close" type="button" id="archiveClose">إغلاق ✕</button>
        </div>
        <div class="archive-news-list">
          ${ed.news.map((n) => `
            <div class="archive-news-item">
              <span class="news-category">${CATEGORY_LABELS[n.category] || CATEGORY_LABELS.other}</span>
              <span style="flex:1">${escapeHtml(n.title)}</span>
              <a href="${escapeHtml(n.source.url)}" target="_blank" rel="noopener" title="المصدر">←</a>
            </div>`).join("")}
        </div>`;
      $("archiveClose").addEventListener("click", () => {
        detail.hidden = true;
        detail.innerHTML = "";
      });
    } catch {
      detail.innerHTML = `<p class="empty-state">تعذّر تحميل نشرة هذا اليوم.</p>`;
    }
  }

  /* ---------- Footer / meta ---------- */

  function renderMeta(edition) {
    const stamp = edition.generatedAt
      ? new Intl.DateTimeFormat("ar-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })
          .format(new Date(edition.generatedAt))
      : "—";
    $("updatedAt").textContent = stamp;
    $("footerUpdated").textContent = `آخر تحديث: ${stamp}`;
  }

  /* ---------- Boot ---------- */

  async function boot() {
    initTheme();
    initNav();
    initNewsControls();
    renderKnowledgeList();

    try {
      const [edition, knowledge, archive] = await Promise.all([
        fetchJson("data/latest.json"),
        fetchJson("data/knowledge.json"),
        fetchJson("data/archive.json").catch(() => ({ editions: [] })),
      ]);

      state.news = edition.news || [];
      edition.knowledgeCount = knowledge.entries ? knowledge.entries.length : 0;

      renderHero(edition);
      renderImportant(edition);
      renderCategoryFilters(state.news);
      renderNews();
      renderModels(edition.models || []);
      renderKnowledgeFilters(knowledge.entries || []);
      $("knowledgeList").render(knowledge.entries || []);
      renderArchive(archive);
      renderMeta(edition);
    } catch (err) {
      console.error(err);
      $("todayDate").textContent = new Intl.DateTimeFormat("ar-u-ca-gregory", { dateStyle: "full" }).format(new Date());
      $("topStory").querySelector(".top-story-title").textContent = "تعذّر تحميل ملفات البيانات";
      $("topStory").querySelector(".top-story-summary").textContent =
        "شغّل سكربت التحديث أو افتح الصفحة عبر خادم محلي (راجع README.md).";
    }
  }

  boot();
})();
