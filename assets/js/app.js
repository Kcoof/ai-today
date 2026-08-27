/* AI اليوم — client rendering + AR/EN i18n */
(function () {
  "use strict";

  /* ================= i18n ================= */

  const I18N = {
    ar: {
      "nav.top": "الأهم اليوم",
      "nav.news": "الأخبار",
      "nav.models": "النماذج الجديدة",
      "nav.mcp": "أدوات MCP",
      "nav.benchmarks": "المعايير",
      "nav.knowledge": "مهارات ومعرفة",
      "nav.security": "أمن الذكاء الاصطناعي",
      "nav.important": "معلومات مهمة",
      "nav.archive": "الأرشيف",
      "important.title": "معلومات مهمة",
      "news.title": "الأخبار اليومية",
      "bench.title": "المعايير والترتيب",
      "bench.sub": "ترتيب أقوى النماذج حسب لوحة صدارة LLM Stats — يتحدث يومياً",
      "bench.rank": "الترتيب",
      "bench.model": "النموذج",
      "bench.org": "الشركة",
      "bench.score": "النتيجة",
      "bench.source": "المصدر:",
      "bench.highlights": "قراءة في الترتيب",
      "bench.llmstats": "لوحة LLM Stats",
      "bench.lmarena": "LMArena",
      "bench.aa": "Artificial Analysis",
      "bench.hfllm": "Open LLM Leaderboard",
      "bench.otherBoards": "لوحات صدارة أخرى:",
      "sec.title": "أمن الذكاء الاصطناعي",
      "sec.sub": "اختراقات وهجمات وثغرات تتعلق بالذكاء الاصطناعي — والأساليب والموجهات المستخدمة فيها",
      "sec.type.breach": "اختراق",
      "sec.type.prompt-injection": "حقن موجّهات",
      "sec.type.jailbreak": "كسر قيود",
      "sec.type.malware": "برمجية خبيثة",
      "sec.type.backdoor": "باب خلفي",
      "sec.type.policy": "سياسة وتنظيم",
      "sec.sev.info": "معلومة",
      "sec.sev.warning": "تحذير",
      "sec.sev.critical": "خطير",
      "sec.source": "المصدر ←",
      "meta.lastUpdate": "آخر تحديث للنشرة",
      "hero.kicker": "نشرة الذكاء الاصطناعي اليومية",
      "hero.loading": "جارٍ تحميل النشرة…",
      "hero.loadingHint": "إذا استمرت هذه الرسالة، فذلك يعني عدم توفّر ملف البيانات بعد.",
      "hero.failTitle": "تعذّر تحميل ملفات البيانات",
      "hero.failHint": "شغّل سكربت التحديث أو افتح الصفحة عبر خادم محلي (راجع README.md).",
      "stats.news": "خبراً اليوم",
      "stats.models": "إصدارات نماذج",
      "stats.security": "أخبار أمنية",
      "stats.knowledge": "مهارة في القاعدة المعرفية",
      "top.tag": "أهم خبر اليوم",
      "top.readSource": "اقرأ من المصدر",
      "news.source": "المصدر ←",
      "news.search": "ابحث في الأخبار…",
      "news.empty": "لا توجد أخبار مطابقة لبحثك.",
      "models.title": "النماذج الجديدة",
      "models.sub": "أحدث إصدارات نماذج الذكاء الاصطناعي حول العالم",
      "models.details": "التفاصيل ←",
      "mcp.title": "أدوات ومهارات MCP",
      "mcp.sub": "أفضل أدوات ووكلاء MCP من ModelScope — مترجمة للعربية، محدثة يومياً",
      "mcp.search": "ابحث في الأدوات…",
      "mcp.empty": "لا توجد أدوات مطابقة.",
      "mcp.more": "عرض المزيد",
      "mcp.views": "استخدام",
      "mcp.link": "الصفحة ←",
      "mcp.tool": "أداة MCP",
      "mcp.cat.search": "البحث",
      "mcp.cat.developer-tools": "أدوات المطورين",
      "mcp.cat.browser-automation": "أتمتة المتصفح",
      "mcp.cat.knowledge-and-memory": "المعرفة والذاكرة",
      "mcp.cat.file-systems": "أنظمة الملفات",
      "mcp.cat.communication": "التواصل",
      "mcp.cat.research-and-data": "الأبحاث والبيانات",
      "mcp.cat.finance": "المالية",
      "mcp.cat.location-services": "خدمات الموقع",
      "mcp.cat.entertainment-and-media": "الترفيه والوسائط",
      "mcp.cat.customer-and-marketing": "العملاء والتسويق",
      "mcp.cat.calendar-management": "إدارة التقويم",
      "mcp.cat.art-and-culture": "الفن والثقافة",
      "mcp.cat.travel-and-transportation": "السفر والنقل",
      "mcp.cat.version-control": "إدارة الإصدارات",
      "mcp.cat.other": "أخرى",
      "knowledge.title": "مهارات ومعرفة",
      "knowledge.sub": "قاعدة معرفية تنمو كل يوم: مهارة جديدة مع خطوات تعلّمها عملياً",
      "knowledge.copy": "نسخ",
      "knowledge.copied": "تم النسخ ✓",
      "knowledge.added": "أُضيفت:",
      "archive.title": "الأرشيف",
      "archive.sub": "تصفّح نشرات الأيام السابقة",
      "archive.empty": "لا توجد نشرات مؤرشفة بعد — ستظهر هنا بعد أول تحديث يومي.",
      "archive.view": "استعراض ←",
      "archive.loading": "جارٍ تحميل النشرة…",
      "archive.edition": "نشرة",
      "archive.fail": "تعذّر تحميل نشرة هذا اليوم.",
      "archive.close": "إغلاق ✕",
      "footer.updated": "آخر تحديث:",
      "footer.repo": "المستودع على GitHub",
      "a11y.skip": "تخطي إلى المحتوى",
      "track.basics": "أساسيات",
      "track.building": "بناء أنظمة",
      "track.security": "أمن",
      "track.tools": "أدوات",
      "kb.readTime": "دقيقة قراءة",
      "kb.trackLabel": "المسار:",
      "quiz.title": "اختبر فهمك",
      "quiz.score": "أجبت {got} من {total}",
      "quiz.retry": "إعادة المحاولة",
      "cheat.title": "ورقة مراجعة سريعة",
      "cheat.sub": "أهم نقطة من كل مهارة تعلمناها — سطر واحد لكل مهارة",
      "cheat.print": "طباعة",
      "palette.open": "بحث سريع (Ctrl+K)",
      "palette.placeholder": "ابحث… (أخبار، مهارات، نماذج، أقسام)",
      "palette.navigate": "تنقل",
      "palette.go": "فتح",
      "palette.section": "قسم",
      "palette.news": "خبر",
      "palette.skill": "مهارة",
      "palette.model": "نموذج",
      "palette.mcp": "أداة MCP",
      "palette.empty": "لا توجد نتائج",
      "palette.sections.news": "الأخبار اليومية",
      "palette.sections.models": "النماذج الجديدة",
      "palette.sections.benchmarks": "المعايير والترتيب",
      "palette.sections.knowledge": "مهارات ومعرفة",
      "palette.sections.security": "أمن الذكاء الاصطناعي",
      "palette.sections.archive": "الأرشيف",
      "filters.all": "الكل",
      "cat.models": "النماذج",
      "cat.tools": "الأدوات",
      "cat.research": "الأبحاث",
      "cat.companies": "الشركات",
      "cat.regulation": "التنظيم",
      "cat.other": "متفرقات",
      "diff.beginner": "مبتدئ",
      "diff.intermediate": "متوسط",
      "diff.advanced": "متقدم",
    },
    en: {
      "nav.top": "Top Story",
      "nav.news": "News",
      "nav.models": "New Models",
      "nav.mcp": "MCP Tools",
      "nav.benchmarks": "Benchmarks",
      "nav.knowledge": "Skills & Knowledge",
      "nav.security": "AI Security",
      "nav.important": "Important",
      "nav.archive": "Archive",
      "important.title": "Important Info",
      "news.title": "Daily News",
      "bench.title": "Benchmarks & Rankings",
      "bench.sub": "Top models according to the LLM Stats leaderboard — refreshed daily",
      "bench.rank": "Rank",
      "bench.model": "Model",
      "bench.org": "Organization",
      "bench.score": "Score",
      "bench.source": "Source:",
      "bench.highlights": "Reading the rankings",
      "bench.llmstats": "LLM Stats board",
      "bench.lmarena": "LMArena",
      "bench.aa": "Artificial Analysis",
      "bench.hfllm": "Open LLM Leaderboard",
      "bench.otherBoards": "Other leaderboards:",
      "sec.title": "AI Security",
      "sec.sub": "AI-related breaches, attacks and vulnerabilities — including the techniques and prompts behind them",
      "sec.type.breach": "Breach",
      "sec.type.prompt-injection": "Prompt injection",
      "sec.type.jailbreak": "Jailbreak",
      "sec.type.malware": "Malware",
      "sec.type.backdoor": "Backdoor",
      "sec.type.policy": "Policy",
      "sec.sev.info": "Info",
      "sec.sev.warning": "Warning",
      "sec.sev.critical": "Critical",
      "sec.source": "Source →",
      "meta.lastUpdate": "Last newsletter update",
      "hero.kicker": "The Daily AI Bulletin",
      "hero.loading": "Loading today's edition…",
      "hero.loadingHint": "If this message persists, the data files are not available yet.",
      "hero.failTitle": "Could not load data files",
      "hero.failHint": "Run the update script or serve this page over a local HTTP server (see README.md).",
      "stats.news": "stories today",
      "stats.models": "model releases",
      "stats.security": "security stories",
      "stats.knowledge": "skills in the knowledge base",
      "top.tag": "Top story of the day",
      "top.readSource": "Read the source",
      "news.source": "Source →",
      "news.search": "Search news…",
      "news.empty": "No news match your search.",
      "models.title": "New Models",
      "models.sub": "The latest AI model releases from around the world",
      "models.details": "Details →",
      "mcp.title": "MCP Tools & Skills",
      "mcp.sub": "The best MCP tools & agents from ModelScope — translated to Arabic, refreshed daily",
      "mcp.search": "Search tools…",
      "mcp.empty": "No matching tools.",
      "mcp.more": "Show more",
      "mcp.views": "uses",
      "mcp.link": "Page →",
      "mcp.tool": "MCP tool",
      "mcp.cat.search": "Search",
      "mcp.cat.developer-tools": "Developer Tools",
      "mcp.cat.browser-automation": "Browser Automation",
      "mcp.cat.knowledge-and-memory": "Knowledge & Memory",
      "mcp.cat.file-systems": "File Systems",
      "mcp.cat.communication": "Communication",
      "mcp.cat.research-and-data": "Research & Data",
      "mcp.cat.finance": "Finance",
      "mcp.cat.location-services": "Location Services",
      "mcp.cat.entertainment-and-media": "Entertainment & Media",
      "mcp.cat.customer-and-marketing": "Customer & Marketing",
      "mcp.cat.calendar-management": "Calendar",
      "mcp.cat.art-and-culture": "Art & Culture",
      "mcp.cat.travel-and-transportation": "Travel & Transport",
      "mcp.cat.version-control": "Version Control",
      "mcp.cat.other": "Other",
      "knowledge.title": "Skills & Knowledge",
      "knowledge.sub": "A knowledge base that grows daily: one new skill with practical steps each day",
      "knowledge.copy": "Copy",
      "knowledge.copied": "Copied ✓",
      "knowledge.added": "Added:",
      "archive.title": "Archive",
      "archive.sub": "Browse previous editions",
      "archive.empty": "No archived editions yet — they will appear here after the first daily update.",
      "archive.view": "View →",
      "archive.loading": "Loading edition…",
      "archive.edition": "Edition",
      "archive.fail": "Could not load this day's edition.",
      "archive.close": "Close ✕",
      "footer.updated": "Last update:",
      "footer.repo": "GitHub repository",
      "a11y.skip": "Skip to content",
      "track.basics": "Basics",
      "track.building": "Building",
      "track.security": "Security",
      "track.tools": "Tools",
      "kb.readTime": "min read",
      "kb.trackLabel": "Track:",
      "quiz.title": "Test yourself",
      "quiz.score": "You scored {got} of {total}",
      "quiz.retry": "Try again",
      "cheat.title": "Quick Reference Sheet",
      "cheat.sub": "The one key takeaway from every skill we've covered",
      "cheat.print": "Print",
      "palette.open": "Quick search (Ctrl+K)",
      "palette.placeholder": "Search… (news, skills, models, sections)",
      "palette.navigate": "navigate",
      "palette.go": "open",
      "palette.section": "Section",
      "palette.news": "news",
      "palette.skill": "skill",
      "palette.model": "model",
      "palette.mcp": "MCP tool",
      "palette.empty": "No results",
      "palette.sections.news": "Daily News",
      "palette.sections.models": "New Models",
      "palette.sections.benchmarks": "Benchmarks & Rankings",
      "palette.sections.knowledge": "Skills & Knowledge",
      "palette.sections.security": "AI Security",
      "palette.sections.archive": "Archive",
      "filters.all": "All",
      "cat.models": "Models",
      "cat.tools": "Tools",
      "cat.research": "Research",
      "cat.companies": "Companies",
      "cat.regulation": "Regulation",
      "cat.other": "Other",
      "diff.beginner": "Beginner",
      "diff.intermediate": "Intermediate",
      "diff.advanced": "Advanced",
    },
  };

  let LANG = localStorage.getItem("ai-today-lang") || "ar";
  const t = (key) => I18N[LANG][key] ?? I18N.ar[key] ?? key;
  const isAr = () => LANG === "ar";
  const arrow = () => (isAr() ? "←" : "→");
  /** Pick a bilingual content field: Arabic base field, or its En sibling in EN mode (fallback to Arabic). */
  const L = (obj, field) => {
    if (!obj) return "";
    if (isAr()) return obj[field] ?? "";
    return obj[field + "En"] || obj[field] || "";
  };

  const CATEGORY_KEYS = ["models", "tools", "research", "companies", "regulation", "other"];
  const catLabel = (c) => t("cat." + (CATEGORY_KEYS.includes(c) ? c : "other"));
  const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
  const diffLabel = (d) => t("diff." + (DIFFICULTIES.includes(d) ? d : "intermediate"));
  const TRACKS = ["basics", "building", "security", "tools"];
  const trackLabel = (tr) => t("track." + (TRACKS.includes(tr) ? tr : "basics"));

  function readMinutes(entry) {
    const words = ((entry.why || "") + " " + (entry.steps || []).map((s) => s.title + " " + s.detail).join(" ") + " " + (entry.code || "")).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 140) + ((entry.steps || []).length > 4 ? 1 : 0));
  }

  function quizHtml(entry) {
    if (!entry.quiz || entry.quiz.length === 0) return "";
    const questions = entry.quiz
      .map((q, qi) => `
        <div class="quiz-question" data-q="${qi}">
          <p class="quiz-q">${escapeHtml(q.q)}</p>
          <div class="quiz-options">
            ${q.options.map((opt, oi) => `
              <button class="quiz-option" type="button" data-oi="${oi}">${escapeHtml(opt)}</button>`).join("")}
          </div>
          <p class="quiz-explain" hidden>${escapeHtml(q.explain)}</p>
        </div>`)
      .join("");
    return `
      <div class="knowledge-quiz" data-entry="${escapeHtml(entry.id)}">
        <div class="quiz-head">📝 <span>${t("quiz.title")}</span></div>
        ${questions}
        <p class="quiz-score" hidden></p>
      </div>`;
  }

  /* ================= state ================= */

  const state = {
    edition: null,
    knowledge: [],
    mcp: [],
    archiveIndex: { editions: [] },
    category: "all",
    query: "",
    difficulty: "all",
    track: "all",
    mcpCategory: "all",
    mcpQuery: "",
    mcpShown: 24,
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

  /* ================= dates ================= */

  const gregLocale = () => (isAr() ? "ar-u-ca-gregory" : "en-GB");

  function formatGregorian(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat(gregLocale(), { dateStyle: "full" }).format(d);
  }

  function formatShortDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat(gregLocale(), { day: "numeric", month: "long", year: "numeric" }).format(d);
  }

  function formatStamp(iso) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat(gregLocale(), { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  }

  /* ================= theme / nav / lang ================= */

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

  function setLang(lang) {
    LANG = lang;
    localStorage.setItem("ai-today-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr() ? "rtl" : "ltr";
    updateStaticTexts();
    renderAll();
  }

  function updateStaticTexts() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-arialabel]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nArialabel));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
    });
    $("langToggle").textContent = isAr() ? "EN" : "ع";
  }

  /* ================= renderers ================= */

  function renderHero() {
    const ed = state.edition;
    if (!ed) return;
    $("todayDate").textContent = formatGregorian(ed.date);

    const kicker = document.querySelector(".hero-kicker");
    if (isAr()) {
      let hijri = "";
      try {
        hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { dateStyle: "full" }).format(new Date(ed.date + "T12:00:00"));
      } catch { /* ignore */ }
      kicker.textContent = hijri ? `${t("hero.kicker")} • ${hijri}` : t("hero.kicker");
    } else {
      kicker.textContent = t("hero.kicker");
    }

    const top = [...(ed.news || [])].sort((a, b) => (b.importance || 0) - (a.importance || 0))[0];
    if (top) {
      $("topStory").innerHTML = `
        <div class="top-story-tag">${t("top.tag")}</div>
        <h2 class="top-story-title">${escapeHtml(L(top, "title"))}</h2>
        <p class="top-story-summary">${escapeHtml(L(top, "summary"))}</p>
        <a class="top-story-link" href="${escapeHtml(top.source.url)}" target="_blank" rel="noopener">
          ${t("top.readSource")} <span aria-hidden="true">${arrow()}</span>
        </a>`;
    }

    const stats = [
      { value: ed.news.length, label: t("stats.news") },
      { value: ed.models.length, label: t("stats.models") },
      { value: (ed.security || []).length, label: t("stats.security") },
      { value: state.knowledge.length, label: t("stats.knowledge") },
    ];
    $("heroStats").innerHTML = stats
      .map((s) => `<div class="stat-card"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`)
      .join("");
  }

  function renderImportant() {
    const ed = state.edition;
    const list = $("importantList");
    if (!ed || !ed.highlights || ed.highlights.length === 0) {
      $("important").hidden = true;
      return;
    }
    $("important").hidden = false;
    const icons = { info: "ℹ️", warning: "⚠️", critical: "🚨" };
    list.innerHTML = ed.highlights
      .map((h) => `
        <div class="important-item level-${escapeHtml(h.level || "info")}">
          <span class="important-icon">${icons[h.level] || icons.info}</span>
          <p class="important-text">
            ${escapeHtml(L(h, "text"))}
            ${h.url ? `<a href="${escapeHtml(h.url)}" target="_blank" rel="noopener">${t("news.source")}</a>` : ""}
          </p>
        </div>`)
      .join("");
  }

  function renderCategoryFilters() {
    const news = state.edition.news;
    const counts = {};
    news.forEach((n) => { counts[n.category] = (counts[n.category] || 0) + 1; });
    const cats = Object.keys(counts).filter((c) => CATEGORY_KEYS.includes(c));
    const box = $("categoryFilters");
    box.innerHTML =
      `<button class="filter-chip ${state.category === "all" ? "active" : ""}" data-cat="all">${t("filters.all")} (${news.length})</button>` +
      cats.map((c) => `<button class="filter-chip ${state.category === c ? "active" : ""}" data-cat="${escapeHtml(c)}">${catLabel(c)} (${counts[c]})</button>`).join("");
  }

  function newsCard(n) {
    const stars = (n.importance || 0) >= 4 ? `<span class="news-importance" title="★">★</span>` : "";
    return `
      <article class="news-card">
        <div class="news-card-top">
          <span class="news-category">${catLabel(n.category)}</span>
          ${stars}
        </div>
        <h3 class="news-title">${escapeHtml(L(n, "title"))}</h3>
        <p class="news-summary">${escapeHtml(L(n, "summary"))}</p>
        <div class="news-meta">
          <span>${escapeHtml(n.source.name)}</span>
          <a class="news-source-link" href="${escapeHtml(n.source.url)}" target="_blank" rel="noopener">${t("news.source")}</a>
        </div>
      </article>`;
  }

  function renderNews() {
    const q = state.query.trim();
    const items = state.edition.news.filter((n) => {
      if (state.category !== "all" && n.category !== state.category) return false;
      if (q && !(`${n.title} ${n.titleEn || ""} ${n.summary} ${n.summaryEn || ""}`.includes(q))) return false;
      return true;
    });
    $("newsGrid").innerHTML = items.map(newsCard).join("");
    $("newsEmpty").hidden = items.length > 0;
  }

  function renderModels() {    $("modelsGrid").innerHTML = state.edition.models
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
          <p class="model-highlights">${escapeHtml(L(m, "highlights"))}</p>
          <div class="model-specs">${specs}</div>
          <div class="model-meta">
            <span>${formatShortDate(m.releaseDate)}</span>
            ${m.url ? `<a href="${escapeHtml(m.url)}" target="_blank" rel="noopener">${t("models.details")}</a>` : ""}
          </div>
        </article>`;
      })
      .join("");
  }

  const SECURITY_TYPES = ["breach", "prompt-injection", "jailbreak", "malware", "backdoor", "policy"];

  function renderSecurity() {
    const items = state.edition.security || [];
    $("security").hidden = items.length === 0;
    const typeIcon = { breach: "🔓", "prompt-injection": "💉", jailbreak: "⛓️", malware: "🦠", backdoor: "🚪", policy: "🏛️" };
    $("securityGrid").innerHTML = items
      .map((s) => `
        <article class="security-card severity-${escapeHtml(s.severity || "info")}">
          <div class="security-top">
            <span class="security-type">${typeIcon[s.type] || "🏛️"} ${t("sec.type." + (SECURITY_TYPES.includes(s.type) ? s.type : "policy"))}</span>
            <span class="security-sev sev-${escapeHtml(s.severity || "info")}">${t("sec.sev." + (["info", "warning", "critical"].includes(s.severity) ? s.severity : "info"))}</span>
          </div>
          <h3 class="security-title">${escapeHtml(L(s, "title"))}</h3>
          <p class="security-summary">${escapeHtml(L(s, "summary"))}</p>
          <div class="security-meta">
            <span>${escapeHtml(s.source || "")} • ${formatShortDate(s.date || state.edition.date)}</span>
            <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${t("sec.source")}</a>
          </div>
        </article>`)
      .join("");
  }

  function renderBenchmarks() {
    const b = state.edition.benchmarks;
    $("benchmarks").hidden = !b || !b.topModels || b.topModels.length === 0;
    if (!b || !b.topModels || b.topModels.length === 0) return;

    const rows = b.topModels
      .map((m, i) => `
        <tr>
          <td class="bench-rank">${i + 1}</td>
          <td class="bench-model">${escapeHtml(m.name)}</td>
          <td class="bench-org">${escapeHtml(m.org)}</td>
          <td class="bench-score">${escapeHtml(m.score)}</td>
        </tr>`)
      .join("");

    $("benchContent").innerHTML = `
      ${(b.highlights || b.highlightsEn) ? `<p class="bench-highlights">💡 ${escapeHtml(L(b, "highlights"))}</p>` : ""}
      <div class="bench-table-wrap">
        <table class="bench-table">
          <thead>
            <tr>
              <th>${t("bench.rank")}</th>
              <th>${t("bench.model")}</th>
              <th>${t("bench.org")}</th>
              <th>${t("bench.score")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="bench-src">${t("bench.source")} <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.source)}</a></p>`;

    $("benchLinks").innerHTML = `
      <span class="bench-links-label">${t("bench.otherBoards")}</span>
      <a class="resource-link" href="https://lmarena.ai/" target="_blank" rel="noopener">${t("bench.lmarena")}</a>
      <a class="resource-link" href="https://artificialanalysis.ai/" target="_blank" rel="noopener">${t("bench.aa")}</a>
      <a class="resource-link" href="https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" target="_blank" rel="noopener">${t("bench.hfllm")}</a>`;
  }

  function renderKnowledgeFilters() {
    const box = $("knowledgeFilters");
    const diffChips =
      `<button class="filter-chip ${state.difficulty === "all" ? "active" : ""}" data-level="all">${t("filters.all")} (${state.knowledge.length})</button>` +
      DIFFICULTIES
        .filter((l) => state.knowledge.some((k) => k.difficulty === l))
        .map((l) => {
          const count = state.knowledge.filter((k) => k.difficulty === l).length;
          return `<button class="filter-chip ${state.difficulty === l ? "active" : ""}" data-level="${l}">${diffLabel(l)} (${count})</button>`;
        })
        .join("");
    const trackChips = TRACKS
      .filter((tr) => state.knowledge.some((k) => (k.track || "basics") === tr))
      .map((tr) => {
        const count = state.knowledge.filter((k) => (k.track || "basics") === tr).length;
        return `<button class="filter-chip chip-track ${state.track === tr ? "active" : ""}" data-track="${tr}">${trackLabel(tr)} (${count})</button>`;
      })
      .join("");
    box.innerHTML = diffChips + trackChips;
  }

  function renderKnowledgeList() {
    $("knowledgeList").innerHTML = state.knowledge
      .filter((k) => state.difficulty === "all" || k.difficulty === state.difficulty)
      .filter((k) => state.track === "all" || (k.track || "basics") === state.track)
      .map((k) => {
        const enMode = !isAr();
        const stepList = enMode && (k.stepsEn || []).length ? k.stepsEn : (k.steps || []);
        const steps = stepList
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
               <button class="copy-btn" type="button">${t("knowledge.copy")}</button>
               <pre><code>${escapeHtml(k.code)}</code></pre>
             </div>`
          : "";
        const resources = (k.resources || [])
          .map((r) => `<a class="resource-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.name)} ${arrow()}</a>`)
          .join("");
        const tags = (k.tags || [])
          .map((tag) => `<span class="knowledge-tag">#${escapeHtml(tag)}</span>`)
          .join("");
        return `
        <details class="knowledge-card" id="kb-${escapeHtml(k.id)}">
          <summary class="knowledge-head">
            <span class="knowledge-title-wrap">
              <span class="knowledge-title">${escapeHtml(L(k, "title"))}</span>
              <span class="difficulty-chip difficulty-${escapeHtml(k.difficulty)}">${diffLabel(k.difficulty)}</span>
              <span class="track-chip track-${escapeHtml(k.track || "basics")}">${trackLabel(k.track)}</span>
              <span class="readtime-chip">⏱ ${readMinutes(k)} ${t("kb.readTime")}</span>
            </span>
            <span class="knowledge-chevron">▼</span>
          </summary>
          <div class="knowledge-body">
            <p class="knowledge-why">${escapeHtml(L(k, "why"))}</p>
            <div class="knowledge-steps">${steps}</div>
            ${code}
            <div class="knowledge-resources">${resources}</div>
            ${quizHtml(k)}
            <div class="knowledge-footer">
              <span>${t("knowledge.added")} ${formatShortDate(k.addedAt)}</span>
              ${tags}
            </div>
          </div>
        </details>`;
      })
      .join("");
  }

  function renderArchive() {
    const list = $("archiveList");
    const editions = state.archiveIndex.editions || [];
    if (editions.length === 0) {
      list.innerHTML = `<p class="empty-state">${t("archive.empty")}</p>`;
      return;
    }
    list.innerHTML = editions
      .map((ed) => `
        <button class="archive-item" data-date="${escapeHtml(ed.date)}">
          <span class="archive-date">🗓️ ${formatShortDate(ed.date)}</span>
          <span class="archive-headlines">${(ed.topHeadlines || []).map(escapeHtml).join(" • ")}</span>
          <span style="color:var(--accent);font-weight:700">${t("archive.view")}</span>
        </button>`)
      .join("");
  }

  function renderMeta() {
    const stamp = formatStamp(state.edition?.generatedAt);
    $("updatedAt").textContent = stamp;
    $("footerUpdated").textContent = `${t("footer.updated")} ${stamp}`;
  }

  function renderAll() {
    if (!state.edition) return;
    renderHero();
    renderImportant();
    renderCategoryFilters();
    renderNews();
    renderModels();
    renderBenchmarks();
    renderMcp();
    renderSecurity();
    renderKnowledgeFilters();
    renderKnowledgeList();
    renderCheatSheet();
    renderArchive();
    renderMeta();
  }

  /* ================= events ================= */

  function initEvents() {
    let debounce;
    $("newsSearch").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = e.target.value;
        renderNews();
      }, 180);
    });

    $("categoryFilters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      state.category = btn.dataset.cat;
      renderCategoryFilters();
      renderNews();
    });

    $("knowledgeFilters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      if (btn.dataset.level) {
        state.difficulty = btn.dataset.level;
      } else if (btn.dataset.track) {
        state.track = btn.dataset.track === state.track ? "all" : btn.dataset.track;
      }
      renderKnowledgeFilters();
      renderKnowledgeList();
    });

    $("knowledgeList").addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (btn) {
        const code = btn.nextElementSibling.textContent;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = t("knowledge.copied");
          setTimeout(() => (btn.textContent = t("knowledge.copy")), 1600);
        });
        return;
      }
      const opt = e.target.closest(".quiz-option");
      if (opt) handleQuizAnswer(opt);
    });

    $("archiveList").addEventListener("click", (e) => {
      const item = e.target.closest(".archive-item");
      if (item) loadArchiveDay(item.dataset.date);
    });

    $("langToggle").addEventListener("click", () => setLang(isAr() ? "en" : "ar"));

    let mcpDebounce;
    $("mcpSearch").addEventListener("input", (e) => {
      clearTimeout(mcpDebounce);
      mcpDebounce = setTimeout(() => {
        state.mcpQuery = e.target.value;
        renderMcpList(true);
      }, 200);
    });
    $("mcpFilters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn || !btn.dataset.mcat) return;
      state.mcpCategory = btn.dataset.mcat;
      renderMcpFilters();
      renderMcpList(true);
    });
    $("mcpMore").addEventListener("click", () => {
      state.mcpShown += MCP_PAGE;
      renderMcpList(false);
    });
  }

  /* ================= quiz ================= */

  function handleQuizAnswer(optBtn) {
    const quizBox = optBtn.closest(".knowledge-quiz");
    const entry = state.knowledge.find((k) => k.id === quizBox.dataset.entry);
    if (!entry || !entry.quiz) return;
    const questionBox = optBtn.closest(".quiz-question");
    const qi = parseInt(questionBox.dataset.q, 10);
    const oi = parseInt(optBtn.dataset.oi, 10);
    const q = entry.quiz[qi];
    if (!q || questionBox.classList.contains("answered")) return;

    questionBox.classList.add("answered");
    questionBox.querySelectorAll(".quiz-option").forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      else if (i === oi) b.classList.add("wrong");
    });
    const explain = questionBox.querySelector(".quiz-explain");
    explain.hidden = false;

    const total = quizBox.querySelectorAll(".quiz-question").length;
    const got = quizBox.querySelectorAll(".quiz-question.answered .quiz-option.correct:not(.wrong)").length;
    const score = quizBox.querySelector(".quiz-score");
    score.hidden = false;
    score.textContent = t("quiz.score").replace("{got}", got).replace("{total}", total);
  }

  /* ================= MCP directory ================= */

  const MCP_PAGE = 24;

  const mcpCatLabel = (c) => {
    const key = "mcp.cat." + c;
    return I18N[LANG][key] || I18N.ar[key] || c.replace(/-/g, " ");
  };

  function mcpFiltered() {
    const q = state.mcpQuery.trim().toLowerCase();
    return state.mcp.filter((s) => {
      if (state.mcpCategory !== "all" && !s.categories.includes(state.mcpCategory)) return false;
      if (q) {
        const hay = `${s.nameEn} ${s.nameAr} ${s.descEn} ${s.descAr} ${s.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderMcpFilters() {
    const counts = {};
    state.mcp.forEach((s) => (s.categories || []).forEach((c) => { counts[c] = (counts[c] || 0) + 1; }));
    const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
    $("mcpFilters").innerHTML =
      `<button class="filter-chip ${state.mcpCategory === "all" ? "active" : ""}" data-mcat="all">${t("filters.all")} (${state.mcp.length})</button>` +
      cats.map((c) => `<button class="filter-chip ${state.mcpCategory === c ? "active" : ""}" data-mcat="${escapeHtml(c)}">${mcpCatLabel(c)} (${counts[c]})</button>`).join("");
  }

  function stripMd(s) {
    return String(s)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
      .replace(/^#{1,6}\s+/gm, "") // headings
      .replace(/[*_`>]+/g, "") // emphasis/quote chars
      .replace(/\s+/g, " ")
      .trim();
  }

  function mcpCard(s) {
    const nameAr = s.nameAr || s.nameEn;
    const desc = stripMd(isAr() ? (s.descAr || s.descEn) : (s.descEn || s.descAr));
    const views = s.views >= 1000 ? Math.round(s.views / 1000) + "k" : String(s.views);
    const cat = (s.categories || [])[0] || "other";
    const logo = s.logo
      ? `<img class="mcp-logo" src="${escapeHtml(s.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="mcp-logo mcp-logo-fallback">🧩</div>`;
    return `
      <article class="mcp-card">
        <div class="mcp-head">
          ${logo}
          <div class="mcp-names">
            <span class="mcp-name" dir="${isAr() && s.nameAr ? "rtl" : "ltr"}">${escapeHtml(isAr() ? nameAr : s.nameEn)}</span>
            ${isAr() ? `<span class="mcp-name-en">${escapeHtml(s.nameEn)}</span>` : (s.nameAr ? `<span class="mcp-name-en">${escapeHtml(s.nameAr)}</span>` : "")}
          </div>
        </div>
        <p class="mcp-desc">${escapeHtml(desc).slice(0, 220)}</p>
        <div class="mcp-meta">
          <span class="news-category">${mcpCatLabel(cat)}</span>
          <span class="mcp-views">👁 ${views} ${t("mcp.views")}</span>
          <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${t("mcp.link")}</a>
        </div>
      </article>`;
  }

  function renderMcpList(reset) {
    if (reset) state.mcpShown = MCP_PAGE;
    const items = mcpFiltered();
    const shown = items.slice(0, state.mcpShown);
    $("mcpGrid").innerHTML = shown.map(mcpCard).join("");
    $("mcpEmpty").hidden = items.length > 0;
    $("mcpMore").hidden = state.mcpShown >= items.length;
  }

  function renderMcp() {
    const has = state.mcp.length > 0;
    $("mcp").hidden = !has;
    if (!has) return;
    renderMcpFilters();
    renderMcpList(true);
  }

  /* ================= cheat sheet ================= */

  function renderCheatSheet() {
    const items = state.knowledge.filter((k) => k.quickRef);
    $("cheatsheet").hidden = items.length === 0;
    if (items.length === 0) return;
    $("cheatGrid").innerHTML = items
      .map((k) => `
        <div class="cheat-card">
          <div class="cheat-title">${escapeHtml(L(k, "title"))}</div>
          <p class="cheat-ref">💡 ${escapeHtml(L(k, "quickRef"))}</p>
        </div>`)
      .join("");
  }

  /* ================= command palette ================= */

  const palette = { open: false, items: [], selected: 0 };

  function buildPaletteIndex() {
    const items = [];
    const sections = [
      { id: "news", key: "palette.sections.news" },
      { id: "models", key: "palette.sections.models" },
      { id: "benchmarks", key: "palette.sections.benchmarks" },
      { id: "knowledge", key: "palette.sections.knowledge" },
      { id: "security", key: "palette.sections.security" },
      { id: "archive", key: "palette.sections.archive" },
    ];
    sections.forEach((s) => items.push({ type: "section", label: t(s.key), searchText: t(s.key), action: () => jumpTo(s.id) }));

    (state.edition?.news || []).forEach((n) =>
      items.push({ type: "news", label: n.title, searchText: n.title + " " + n.summary, action: () => { jumpTo("news"); highlightCard(`.news-card`, n.title); } }));
    state.knowledge.forEach((k) =>
      items.push({ type: "skill", label: k.title, searchText: k.title + " " + (k.quickRef || ""), action: () => { jumpTo("knowledge"); openKnowledge(k.id); } }));
    state.mcp.slice(0, 60).forEach((s) =>
      items.push({ type: "mcp", label: `${isAr() ? (s.nameAr || s.nameEn) : s.nameEn}`, searchText: `${s.nameEn} ${s.nameAr || ""} ${(s.categories || []).join(" ")} mcp`, action: () => { jumpTo("mcp"); highlightCard(".mcp-card", s.nameEn); } }));
    (state.edition?.models || []).forEach((m) =>
      items.push({ type: "model", label: m.name, searchText: m.name + " " + m.org + " " + m.highlights, action: () => { jumpTo("models"); highlightCard(`.model-card`, m.name); } }));
    ((state.edition?.benchmarks || {}).topModels || []).forEach((m) =>
      items.push({ type: "model", label: `${m.name} (${m.score})`, searchText: m.name + " " + m.org + " benchmark", action: () => jumpTo("benchmarks") }));

    palette.items = items;
  }

  function jumpTo(id) {
    document.getElementById(id).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function highlightCard(selector, titlePart) {
    document.querySelectorAll(selector).forEach((card) => {
      if (card.textContent.includes(titlePart)) {
        card.classList.add("flash-highlight");
        setTimeout(() => card.classList.remove("flash-highlight"), 2500);
      }
    });
  }

  function openKnowledge(id) {
    const card = document.getElementById("kb-" + CSS.escape(id));
    if (card) {
      card.open = true;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function paletteRender(filter) {
    const q = (filter || "").trim().toLowerCase();
    const matches = q
      ? palette.items.filter((it) => it.searchText.toLowerCase().includes(q))
      : palette.items.slice(0, 12);
    palette.selected = 0;
    const typeIcon = { section: "📍", news: "📰", skill: "🎓", model: "🧠", mcp: "🧩" };
    $("paletteResults").innerHTML =
      matches.slice(0, 14)
        .map((it, i) => `
          <li class="palette-item ${i === 0 ? "selected" : ""}" data-i="${i}" role="option">
            <span class="palette-item-icon">${typeIcon[it.type] || "•"}</span>
            <span class="palette-item-label">${escapeHtml(it.label)}</span>
            <span class="palette-item-type">${t("palette." + it.type)}</span>
          </li>`)
        .join("") || `<li class="palette-empty">${t("palette.empty")}</li>`;
    palette.visibleItems = matches.slice(0, 14);
  }

  function paletteSelect(delta) {
    const boxes = $("paletteResults").querySelectorAll(".palette-item");
    if (!boxes.length) return;
    palette.selected = (palette.selected + delta + boxes.length) % boxes.length;
    boxes.forEach((b, i) => b.classList.toggle("selected", i === palette.selected));
    boxes[palette.selected].scrollIntoView({ block: "nearest" });
  }

  function paletteRun() {
    const item = palette.visibleItems?.[palette.selected];
    if (item) {
      closePalette();
      item.action();
    }
  }

  function openPalette() {
    if (!state.edition) return;
    buildPaletteIndex();
    palette.open = true;
    $("paletteOverlay").hidden = false;
    const input = $("paletteInput");
    input.value = "";
    paletteRender("");
    input.focus();
  }

  function closePalette() {
    palette.open = false;
    $("paletteOverlay").hidden = true;
  }

  function initPalette() {
    $("paletteBtn").addEventListener("click", openPalette);
    $("paletteOverlay").addEventListener("click", (e) => {
      if (e.target === $("paletteOverlay")) closePalette();
    });
    $("paletteInput").addEventListener("input", (e) => paletteRender(e.target.value));
    $("paletteResults").addEventListener("click", (e) => {
      const li = e.target.closest(".palette-item");
      if (!li) return;
      palette.selected = parseInt(li.dataset.i, 10);
      paletteRun();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        palette.open ? closePalette() : openPalette();
        return;
      }
      if (!palette.open) return;
      if (e.key === "Escape") closePalette();
      else if (e.key === "ArrowDown") { e.preventDefault(); paletteSelect(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); paletteSelect(-1); }
      else if (e.key === "Enter") { e.preventDefault(); paletteRun(); }
    });
  }

  /* ================= reading progress ================= */

  function initProgress() {
    const bar = $("readingProgress");
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    document.addEventListener("scroll", update, { passive: true });
    update();
  }

  async function loadArchiveDay(date) {
    const detail = $("archiveDetail");
    detail.hidden = false;
    detail.innerHTML = `<p class="empty-state">${t("archive.loading")}</p>`;
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const ed = await fetchJson(`data/archive/${date}.json`);
      detail.innerHTML = `
        <div class="archive-detail-head">
          <h3 class="archive-detail-title">${t("archive.edition")} ${formatShortDate(date)}</h3>
          <button class="archive-close" type="button" id="archiveClose">${t("archive.close")}</button>
        </div>
        <div class="archive-news-list">
          ${ed.news.map((n) => `
            <div class="archive-news-item">
              <span class="news-category">${catLabel(n.category)}</span>
              <span style="flex:1">${escapeHtml(n.title)}</span>
              <a href="${escapeHtml(n.source.url)}" target="_blank" rel="noopener" title="${escapeHtml(n.source.name)}">${arrow()}</a>
            </div>`).join("")}
        </div>`;
      $("archiveClose").addEventListener("click", () => {
        detail.hidden = true;
        detail.innerHTML = "";
      });
    } catch {
      detail.innerHTML = `<p class="empty-state">${t("archive.fail")}</p>`;
    }
  }

  /* ================= boot ================= */

  async function boot() {
    initTheme();
    initNav();
    initEvents();
    initPalette();
    initProgress();
    $("printBtn").addEventListener("click", () => window.print());
    setLang(LANG); // applies dir/lang/static texts on load

    try {
      const [edition, knowledge, archive, mcp] = await Promise.all([
        fetchJson("data/latest.json"),
        fetchJson("data/knowledge.json"),
        fetchJson("data/archive.json").catch(() => ({ editions: [] })),
        fetchJson("data/mcp.json").catch(() => ({ servers: [] })),
      ]);
      state.edition = edition;
      state.knowledge = knowledge.entries || [];
      state.archiveIndex = archive;
      state.mcp = mcp.servers || [];
      renderAll();
    } catch (err) {
      console.error(err);
      $("todayDate").textContent = new Intl.DateTimeFormat(gregLocale(), { dateStyle: "full" }).format(new Date());
      const titleEl = $("topStory").querySelector(".top-story-title");
      const summaryEl = $("topStory").querySelector(".top-story-summary");
      titleEl.textContent = t("hero.failTitle");
      summaryEl.textContent = t("hero.failHint");
    }
  }

  boot();
})();
