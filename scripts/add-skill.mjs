#!/usr/bin/env node
/**
 * AI اليوم — add a skill entry to the "مهارات ومعرفة" knowledge base.
 *
 * Flow: collect input → validate → preview → confirm → write to data/knowledge.json
 *
 * Interactive:
 *   node scripts/add-skill.mjs
 *
 * Non-interactive:
 *   node scripts/add-skill.mjs --title "..." --why "..." --difficulty beginner \
 *       --steps "عنوان 1|تفصيل 1;;عنوان 2|تفصيل 2" --tags "a,b" \
 *       --resources "اسم=>https://..., اسم2=>https://..." [--code "print(1)"]
 *
 * Validate only (no write):
 *   node scripts/add-skill.mjs --test --title ... (same flags)
 */

import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import readline from "node:readline/promises";
import { isatty } from "node:tty";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KB_PATH = path.join(ROOT, "data", "knowledge.json");
const TEST_ONLY = process.argv.includes("--test");

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DIFF_LABELS = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };
const KNOWLEDGE_TRACKS = ["basics", "building", "security", "tools"];
const TRACK_LABELS = { basics: "أساسيات", building: "بناء أنظمة", security: "أمن", tools: "أدوات" };

/** Parse --quiz "سؤال؟|خيار1|خيار2|خيار3|1|تفسير;;سؤال2|…|2|تفسير2" */
function parseQuizArg(raw) {
  if (!raw) return [];
  return raw.split(";;").filter(Boolean).map((block) => {
    const [q, ...rest] = block.split("|");
    const explain = rest.length > 1 ? rest.pop() : "";
    const answer = rest.length > 1 ? parseInt(rest.pop(), 10) - 1 : 0;
    return { q: (q || "").trim(), options: rest.map((x) => x.trim()).filter(Boolean), answer, explain: (explain || "").trim() };
  }).filter((q) => q.q && q.options.length >= 2);
}

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const m = process.argv[i].match(/^--([a-z]+)$/);
  if (m && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
    args[m[1]] = process.argv[++i];
  }
}

// Interactive TTY → readline. Piped/file stdin → pre-read answer queue
// (readline/promises is unreliable with non-TTY stdin on some Node builds).
let rl = null;
let stdinAnswers = null;
if (isatty(0)) {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
} else {
  try {
    stdinAnswers = readFileSync(0, "utf8").split(/\r?\n/);
  } catch {
    stdinAnswers = [];
  }
}

const ask = async (q, fallback = "") => {
  let v;
  if (stdinAnswers) {
    process.stdout.write(q);
    v = String(stdinAnswers.shift() ?? "").trim();
  } else {
    v = (await rl.question(q)).trim();
  }
  return v || fallback;
};

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

async function collect() {
  if (args.title) {
    const steps = (args.steps || "")
      .split(";;").filter(Boolean)
      .map((p) => {
        const [title, ...rest] = p.split("|");
        return { title: (title || "").trim(), detail: rest.join("|").trim() };
      });
    const resources = (args.resources || "")
      .split(",").map((x) => x.trim()).filter(Boolean)
      .map((pair) => {
        const [name, url] = pair.split("=>").map((x) => x.trim());
        return { name: name || "رابط", url: url || "" };
      });
    return {
      title: args.title,
      why: args.why || "",
      difficulty: args.difficulty || "intermediate",
      track: KNOWLEDGE_TRACKS.includes(args.track) ? args.track : "basics",
      steps,
      code: args.code || "",
      resources,
      tags: (args.tags || "").split(",").map((x) => x.trim()).filter(Boolean),
      quickRef: args.quickref || "",
      quiz: parseQuizArg(args.quiz),
    };
  }

  console.log("\n➕ إضافة مهارة جديدة إلى قسم «مهارات ومعرفة»\n   (اضغط Enter لتخطي الحقول الاختيارية)\n");
  const title = await ask("عنوان المهارة (بالعربية) *: ");
  const why = await ask("لماذا تهمني؟ (جملة أو جملتان بالعربية) *: ");
  let difficulty = await ask(`مستوى الصعوبة (beginner/intermediate/advanced) [intermediate]: `, "intermediate");
  if (!DIFFICULTIES.includes(difficulty)) {
    console.log(`⚠️ قيمة غير صالحة، سيُستخدم intermediate`);
    difficulty = "intermediate";
  }
  const steps = [];
  console.log("الخطوات (اكتب 'تم' للإنهاء):");
  for (let i = 1; i <= 8; i++) {
    const stepTitle = await ask(`  خطوة ${i} — العنوان (أمر بصيغة الأمر) *: `);
    if (stepTitle === "تم" || !stepTitle) break;
    const detail = await ask(`  خطوة ${i} — التفصيل: `);
    steps.push({ title: stepTitle, detail });
  }
  const code = await ask("كود قصير (اختياري، اضغط Enter للتخطي): ");
  const resources = [];
  console.log("مصادر للتعلّم (اسم => رابط، افصل بفاصلة):");
  const resLine = await ask("  ");
  resLine.split(",").map((x) => x.trim()).filter(Boolean).forEach((pair) => {
    const [name, url] = pair.split("=>").map((x) => x.trim());
    resources.push({ name: name || "رابط", url: url || "" });
  });
  const tags = (await ask("وسوم مفصولة بفاصلة (اختياري): ")).split(",").map((x) => x.trim()).filter(Boolean);
  const quickRef = await ask("جملة مراجعة سريعة — أهم نقطة يجب تذكرها (اختياري): ");
  let track = await ask("مسار التعلّم (basics/building/security/tools) [basics]: ", "basics");
  if (!KNOWLEDGE_TRACKS.includes(track)) {
    console.log(`⚠️ قيمة غير صالحة، سيُستخدم basics`);
    track = "basics";
  }
  const quiz = [];
  console.log("اختبار قصير (اختياري — اكتب 'تم' للإنهاء):");
  while (quiz.length < 4) {
    const q = await ask(`  سؤال ${quiz.length + 1}: `);
    if (q === "تم" || !q) break;
    const options = [];
    for (let oi = 1; oi <= 4; oi++) {
      const opt = await ask(`    الخيار ${oi} (Enter للإيقاف): `);
      if (!opt) break;
      options.push(opt);
    }
    if (options.length < 2) { console.log("    ⚠️ يلزم خياران على الأقل — تم تجاهل السؤال"); continue; }
    const answer = parseInt(await ask(`    رقم الخيار الصحيح (1-${options.length}): `, "1"), 10) - 1;
    const explain = await ask("    تفسير الإجابة: ");
    quiz.push({ q, options, answer: Math.max(0, Math.min(options.length - 1, answer)), explain });
  }
  return { title, why, difficulty, track, steps, code, resources, tags, quickRef, quiz };
}

function validate(entry, existingIds) {
  const errors = [];
  if (!entry.title || entry.title.length < 5) errors.push("العنوان مطلوب (5 أحرف على الأقل)");
  if (!entry.why || entry.why.length < 10) errors.push("سبب الأهمية مطلوب (10 أحرف على الأقل)");
  if (!DIFFICULTIES.includes(entry.difficulty)) errors.push(`مستوى الصعوبة يجب أن يكون واحداً من: ${DIFFICULTIES.join(", ")}`);
  if (!entry.steps || entry.steps.length < 3) errors.push("يلزم 3 خطوات على الأقل");
  else entry.steps.forEach((s, i) => {
    if (!s.title) errors.push(`الخطوة ${i + 1}: العنوان مطلوب`);
  });
  (entry.resources || []).forEach((r, i) => {
    if (!/^https?:\/\/.+/.test(r.url)) errors.push(`المصدر ${i + 1}: الرابط غير صالح (${r.url || "فارغ"})`);
  });
  if (entry.track && !KNOWLEDGE_TRACKS.includes(entry.track)) errors.push(`المسار يجب أن يكون واحداً من: ${KNOWLEDGE_TRACKS.join(", ")}`);
  (entry.quiz || []).forEach((q, i) => {
    if (q.options.length < 2) errors.push(`السؤال ${i + 1}: يلزم خياران على الأقل`);
    else if (q.answer < 0 || q.answer >= q.options.length) errors.push(`السؤال ${i + 1}: رقم الإجابة الصحيحة خارج النطاق`);
  });
  const id = `k-${new Date().toISOString().slice(0, 10)}-${slug(entry.title) || "skill"}`;
  if (existingIds.includes(id)) errors.push(`معرّف مكرر: ${id} (مهارة بنفس العنوان أُضيفت اليوم)`);
  return { errors, id };
}

function preview(entry, id) {
  console.log("\n📋 معاينة المدخل:");
  console.log("─".repeat(60));
  console.log(`المعرّف:        ${id}`);
  console.log(`العنوان:        ${entry.title}`);
  console.log(`السبب:          ${entry.why}`);
  console.log(`المستوى:        ${entry.difficulty} (${DIFF_LABELS[entry.difficulty]})${entry.track ? ` | المسار: ${entry.track} (${TRACK_LABELS[entry.track]})` : ""}`);
  if (entry.quickRef) console.log(`مراجعة سريعة:  ${entry.quickRef}`);
  entry.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.title}${s.detail ? " — " + s.detail : ""}`));
  if (entry.code) console.log(`الكود:\n${entry.code.split("\n").map((l) => "    " + l).join("\n")}`);
  if (entry.resources.length) entry.resources.forEach((r) => console.log(`🔗 ${r.name} => ${r.url}`));
  if (entry.tags.length) console.log(`الوسوم:         ${entry.tags.map((x) => "#" + x).join(" ")}`);
  (entry.quiz || []).forEach((q, i) => console.log(`❓ س${i + 1}: ${q.q} (الصحيح: ${q.options[q.answer]})`));
  console.log("─".repeat(60));
}

async function main() {
  const kb = JSON.parse(await readFile(KB_PATH, "utf8"));
  const existingIds = kb.entries.map((e) => e.id);

  const entry = await collect();

  const { errors, id } = validate(entry, existingIds);
  if (errors.length) {
    console.log("\n❌ فشل التحقق:");
    errors.forEach((e) => console.log("   - " + e));
    console.log(TEST_ONLY ? "\n(وضع الاختبار: لم يُكتب شيء)" : "\nلم تُحفظ أي تغييرات. صحّح الأخطاء وحاول مجدداً.");
    if (rl) rl.close();
    process.exit(1);
  }

  preview(entry, id);

  if (TEST_ONLY) {
    console.log("✅ التحقق ناجح (وضع الاختبار: لم يُكتب شيء)");
    if (rl) rl.close();
    return;
  }

  const confirm = await ask("\nهل تريد الحفظ؟ (نعم/لا) [لا]: ");
  if (rl) rl.close();
  if (!["نعم", "yes", "y"].includes(confirm.toLowerCase())) {
    console.log("لم تُحفظ أي تغييرات.");
    return;
  }

  kb.entries.unshift({
    id,
    title: entry.title,
    why: entry.why,
    difficulty: entry.difficulty,
    track: entry.track || "basics",
    steps: entry.steps,
    code: entry.code,
    resources: entry.resources,
    tags: entry.tags,
    quickRef: entry.quickRef || "",
    quiz: entry.quiz || [],
    addedAt: new Date().toISOString().slice(0, 10),
  });
  kb.entries = kb.entries.slice(0, 150);

  await writeFile(KB_PATH, JSON.stringify(kb, null, 2) + "\n", "utf8");
  console.log(`\n✅ أُضيفت المهارة إلى data/knowledge.json (${id})`);
  console.log("لا تنسَ: git add data/knowledge.json && git commit && git push — وسينشر Cloudflare تلقائياً.");
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
