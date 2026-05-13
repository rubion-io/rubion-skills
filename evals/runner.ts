/**
 * Rubion Skills — Eval Runner
 *
 * Her skill için 20 query (10 pos + 10 neg) Anthropic API'ye gönderir.
 * Hangi skill trigger oldu kontrol eder, accuracy raporlar.
 *
 * Kullanım:
 *   npx tsx runner.ts --skill=tdd-dotnet
 *   npx tsx runner.ts --all
 *   npx tsx runner.ts --changed-only
 *   npx tsx runner.ts --skill=tdd-dotnet --verbose
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ─── Config ──────────────────────────────────────────────────────────────────

const PASS_THRESHOLD = 0.80;           // skill bazında min accuracy
const MODEL = "claude-haiku-4-5";      // hızlı + ucuz eval için
const MAX_TOKENS = 30;                 // sadece skill adı bekliyoruz
const REPO_ROOT = path.resolve(__dirname, "..");
const EVALS_DIR = path.resolve(__dirname, "skills");
const SKILLS_DIRS = [
  path.join(REPO_ROOT, "adapted"),
  path.join(REPO_ROOT, "skills"),
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface EvalQuery {
  query: string;
  should_trigger: boolean;
}

interface EvalFile {
  skill: string;
  description: string;
  queries: EvalQuery[];
}

interface SkillInfo {
  name: string;
  description: string;
}

interface QueryResult {
  query: string;
  should_trigger: boolean;
  triggered: string;
  pass: boolean;
}

interface SkillResult {
  skill: string;
  total: number;
  passed: number;
  accuracy: number;
  pass: boolean;
  results: QueryResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseArgs(): {
  skill?: string;
  all: boolean;
  changedOnly: boolean;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const get = (flag: string) =>
    args.find((a) => a.startsWith(flag))?.split("=")[1];

  return {
    skill: get("--skill"),
    all: args.includes("--all"),
    changedOnly: args.includes("--changed-only"),
    verbose: args.includes("--verbose"),
  };
}

/** SKILL.md frontmatter'dan description parse et */
function parseSkillDescription(skillName: string): string | null {
  for (const dir of SKILLS_DIRS) {
    const candidate = path.join(dir, skillName, "SKILL.md");
    if (!fs.existsSync(candidate)) continue;

    const content = fs.readFileSync(candidate, "utf8");
    const match = content.match(/^description:\s*(.+)$/m);
    if (match) return match[1].trim();
  }
  return null;
}

/** Tüm skill'lerin isim + description listesi */
function loadAllSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];

  for (const dir of SKILLS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const skillMd = path.join(dir, entry, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;
      const description = parseSkillDescription(entry);
      if (description) skills.push({ name: entry, description });
    }
  }

  return skills;
}

/** Son commit'te değişen SKILL.md dosyalarından skill isimlerini çıkar */
function getChangedSkills(): string[] {
  try {
    const output = execSync(
      "git diff --name-only HEAD~1 HEAD -- **/SKILL.md",
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => path.basename(path.dirname(p)));
  } catch {
    return [];
  }
}

/** Eval JSON dosyasını yükle */
function loadEvalFile(skillName: string): EvalFile | null {
  const filePath = path.join(EVALS_DIR, `${skillName}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// ─── Eval Core ───────────────────────────────────────────────────────────────

function buildSystemPrompt(skills: SkillInfo[]): string {
  const list = skills
    .map((s) => `- ${s.name}: ${s.description}`)
    .join("\n");

  return `Sen bir skill seçicisisin. Kullanıcının mesajına bakarak aşağıdaki skill'lerden hangisinin tetiklenmesi gerektiğine karar veriyorsun.

Mevcut skill'ler:
${list}

KURAL: Yanıtın SADECE skill adı olsun (örn: "tdd-dotnet") ya da hiçbiri uygun değilse "none" yaz. Açıklama yapma, sadece isim.`;
}

async function evalQuery(
  client: Anthropic,
  systemPrompt: string,
  query: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "none";

  // Temizle — sadece ilk kelimeyi al (açıklama gelmişse)
  return text.split(/[\s,.\n]/)[0].toLowerCase();
}

async function evalSkill(
  client: Anthropic,
  systemPrompt: string,
  evalFile: EvalFile,
  verbose: boolean
): Promise<SkillResult> {
  const results: QueryResult[] = [];

  console.log(`\nSkill Eval — ${evalFile.skill}`);
  console.log("─".repeat(50));

  const positiveQueries = evalFile.queries.filter((q) => q.should_trigger);
  const negativeQueries = evalFile.queries.filter((q) => !q.should_trigger);

  if (verbose) console.log("Positive queries (should trigger):");
  for (const q of positiveQueries) {
    const triggered = await evalQuery(client, systemPrompt, q.query);
    const pass = triggered === evalFile.skill;
    results.push({ query: q.query, should_trigger: true, triggered, pass });

    if (verbose) {
      const icon = pass ? "✓" : "✗";
      const detail = pass ? "" : ` → triggered: ${triggered}  (FAIL)`;
      console.log(`  ${icon} "${q.query}"${detail}`);
    }

    // Rate limit için kısa bekleme
    await new Promise((r) => setTimeout(r, 200));
  }

  if (verbose) console.log("Negative queries (should NOT trigger):");
  for (const q of negativeQueries) {
    const triggered = await evalQuery(client, systemPrompt, q.query);
    const pass = triggered !== evalFile.skill;
    results.push({ query: q.query, should_trigger: false, triggered, pass });

    if (verbose) {
      const icon = pass ? "✓" : "✗";
      const detail = pass
        ? ` → triggered: ${triggered}`
        : ` → triggered: ${triggered}  (FAIL — should be != ${evalFile.skill})`;
      console.log(`  ${icon} "${q.query}"${detail}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const accuracy = passed / total;
  const pass = accuracy >= PASS_THRESHOLD;

  console.log("─".repeat(50));
  const icon = pass ? "✓" : "✗";
  console.log(
    `${evalFile.skill}: ${passed}/${total} (${Math.round(accuracy * 100)}%) — ${pass ? "PASS " + icon : "FAIL " + icon}`
  );

  return { skill: evalFile.skill, total, passed, accuracy, pass, results };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const allSkills = loadAllSkills();
  const systemPrompt = buildSystemPrompt(allSkills);

  // Hangi skill'leri eval edeceğiz?
  let skillsToEval: string[] = [];

  if (args.skill) {
    skillsToEval = [args.skill];
  } else if (args.changedOnly) {
    skillsToEval = getChangedSkills();
    if (skillsToEval.length === 0) {
      console.log("Değişen skill bulunamadı. Eval atlandı.");
      process.exit(0);
    }
    console.log(`Değişen skill'ler: ${skillsToEval.join(", ")}`);
  } else if (args.all) {
    skillsToEval = allSkills.map((s) => s.name);
  } else {
    console.error("Kullanım: npx tsx runner.ts --skill=<name> | --all | --changed-only");
    process.exit(1);
  }

  const skillResults: SkillResult[] = [];

  for (const skillName of skillsToEval) {
    const evalFile = loadEvalFile(skillName);
    if (!evalFile) {
      console.warn(`⚠ ${skillName}: evals/skills/${skillName}.json bulunamadı — atlandı`);
      continue;
    }

    const result = await evalSkill(client, systemPrompt, evalFile, args.verbose ?? false);
    skillResults.push(result);
  }

  if (skillResults.length === 0) {
    console.log("Eval yapılan skill yok.");
    process.exit(0);
  }

  // Genel özet
  console.log("\n" + "═".repeat(50));
  console.log("Genel Özet");
  console.log("═".repeat(50));

  const colW = Math.max(...skillResults.map((r) => r.skill.length)) + 2;
  for (const r of skillResults) {
    const pct = Math.round(r.accuracy * 100);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    const icon = r.pass ? "✓" : "✗";
    console.log(
      `${r.skill.padEnd(colW)} ${String(r.passed).padStart(2)}/${r.total}  ${String(pct).padStart(3)}%  ${bar}  ${icon}`
    );
  }

  const totalPassed = skillResults.reduce((s, r) => s + r.passed, 0);
  const totalQueries = skillResults.reduce((s, r) => s + r.total, 0);
  const overallPct = Math.round((totalPassed / totalQueries) * 100);
  const failedSkills = skillResults.filter((r) => !r.pass);

  console.log("─".repeat(50));
  console.log(`Toplam: ${totalPassed}/${totalQueries}  ${overallPct}%`);
  console.log(`PASS eşiği: ${PASS_THRESHOLD * 100}% (skill bazında)`);

  if (failedSkills.length > 0) {
    console.log(`\n❌ Başarısız skill'ler (${failedSkills.length}):`);
    for (const r of failedSkills) {
      console.log(`   - ${r.skill}: ${Math.round(r.accuracy * 100)}%`);
    }
    process.exit(1);
  } else {
    console.log(`\n✅ Tüm skill'ler PASS (${skillResults.length}/${skillResults.length})`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Eval runner hatası:", err);
  process.exit(1);
});
