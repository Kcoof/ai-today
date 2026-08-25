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
import readline from "node:readline/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KB_PATH = path.join(ROOT, "data", "knowledge.json");
const TEST_ONLY = process.argv.includes("--test");

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DIFF_LABELS = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const m = process.argv[i].match(/^--([a-z]+)$/);
  if (m && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
    args[m[1]] = process.argv[++i];
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback = "") => {
  const v = (await rl.question(q)).trim();
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
      steps,
      code: args.code || "",
      resources,
      tags: (args.tags || "").split(",").map((x) => x.trim()).filter(Boolean),
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
  return { title, why, difficulty, steps, code, resources, tags };
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
  console.log(`المستوى:        ${entry.difficulty} (${DIFF_LABELS[entry.difficulty]})`);
  entry.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.title}${s.detail ? " — " + s.detail : ""}`));
  if (entry.code) console.log(`الكود:\n${entry.code.split("\n").map((l) => "    " + l).join("\n")}`);
  if (entry.resources.length) entry.resources.forEach((r) => console.log(`🔗 ${r.name} => ${r.url}`));
  if (entry.tags.length) console.log(`الوسوم:         ${entry.tags.map((x) => "#" + x).join(" ")}`);
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
    rl.close();
    process.exit(1);
  }

  preview(entry, id);

  if (TEST_ONLY) {
    console.log("✅ التحقق ناجح (وضع الاختبار: لم يُكتب شيء)");
    rl.close();
    return;
  }

  const confirm = await ask("\nهل تريد الحفظ؟ (نعم/لا) [لا]: ");
  rl.close();
  if (!["نعم", "yes", "y"].includes(confirm.toLowerCase())) {
    console.log("لم تُحفظ أي تغييرات.");
    return;
  }

  kb.entries.unshift({
    id,
    title: entry.title,
    why: entry.why,
    difficulty: entry.difficulty,
    steps: entry.steps,
    code: entry.code,
    resources: entry.resources,
    tags: entry.tags,
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
