#!/usr/bin/env node
/**
 * validate-layer.mjs — кроссплатформенный валидатор AI-слоя cursor-starter.
 *
 * Цели:
 *  1. Поймать дрейф между документами (битые @-ссылки, отсутствующие файлы).
 *  2. Проверить лимиты "single focus" для правил и команд.
 *  3. Поймать append-only-лог в PROJECT_KNOWLEDGE.md (антипаттерн P3).
 *  4. Подтвердить базовую целостность шаблона (CHANGELOG, PRINCIPLES, обязательные правила).
 *
 * Запуск:  node scripts/validate-layer.mjs
 * Exit code: 0 — ок, 1 — есть ошибки, 2 — есть только предупреждения.
 *
 * Без сторонних зависимостей. Node.js >= 18.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, dirname, resolve, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");

// ─────────────────────────────────────────────────────────────────────────────
// Конфигурация: лимиты, обязательные файлы, антипаттерны
// ─────────────────────────────────────────────────────────────────────────────

const LIMITS = {
  "CURSOR.md": 200,
  ".cursor/rules/*.mdc": 120,
  ".cursor/commands/*.md": 120,
  "PLAN.md": 200,
};

const REQUIRED_FILES = [
  "CURSOR.md",
  "README.md",
  "PROJECT_KNOWLEDGE.md",
  "PLAN.md",
  "AGENTS.md",
  "CHANGELOG.md",
  ".cursorignore",
  ".cursor/PRINCIPLES.md",
  ".cursor/rules/token-economy.mdc",
  ".cursor/rules/model-routing.mdc",
  ".cursor/rules/core.mdc",
  ".cursor/rules/anti-patterns.mdc",
  ".cursor/rules/secrets-guard.mdc",
  ".cursor/rules/architecture.mdc",
  ".cursor/rules/stack-specific.mdc",
  ".cursor/rules/project-skills-registry.mdc",
  ".cursor/commands/feature.md",
  ".cursor/commands/fix-bug.md",
  ".cursor/commands/review.md",
  ".cursor/commands/refactor.md",
  ".cursor/commands/reflect.md",
  ".cursor/commands/bootstrap.md",
  ".cursor/commands/audit.md",
  ".cursor/commands/handoff.md",
  ".cursor/commands/docs.md",
  "ai-layer-builder/ai-builder.md",
  "ai-layer-builder/spec-CURSOR.md",
  "ai-layer-builder/spec-commands.md",
];

/** Регулярки, которые ловят append-only-лог в PROJECT_KNOWLEDGE.md.
 * Допускаются в "Журнале рефлексий" (там это уместно). */
const APPEND_ONLY_PATTERNS = [
  /\bя\s+(добав(ил|ила)|починил[аи]?|обновил[аи]?|исправил[аи]?|удалил[аи]?)\b/i,
  /\bдобавил\s+файл\b/i,
  /\bпочинил\s+баг\b/i,
];

const SECRETS_PATTERNS = [
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/, // AWS access key
  /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}\b/, // Stripe
  /\bghp_[A-Za-z0-9]{36}\b/, // GitHub PAT
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
];

// ─────────────────────────────────────────────────────────────────────────────
// Состояние и репортинг
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Array<{level:"error"|"warn", file:string, msg:string}>} */
const issues = [];

const report = (level, file, msg) => issues.push({ level, file, msg });
const error = (file, msg) => report("error", file, msg);
const warn = (file, msg) => report("warn", file, msg);

const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────────────────

const toPosix = (p) => p.split(sep).join("/");

async function walk(dir, filter = () => true, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      await walk(full, filter, out);
    } else if (e.isFile() && filter(full)) {
      out.push(full);
    }
  }
  return out;
}

async function readUtf8(file) {
  return readFile(file, "utf8");
}

function countLines(text) {
  return text.split(/\r?\n/).length;
}

/** Извлечь @-ссылки и markdown-ссылки на локальные файлы. */
function extractRefs(text) {
  /** @type {{ raw:string, target:string, kind:"at"|"md" }[]} */
  const refs = [];

  // @path/to/file (только локальные, без http, без @scope/package)
  const atRe = /(?:^|[\s(`])@([./A-Za-zА-Яа-я0-9_\-/]+\.(?:md|mdc|mjs|js|json|yml|yaml|sh|ps1))(?=[\s)`.,;:]|$)/g;
  for (const m of text.matchAll(atRe)) refs.push({ raw: m[0].trim(), target: m[1], kind: "at" });

  // [text](relative/path.ext)
  const mdRe = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
  for (const m of text.matchAll(mdRe)) {
    const t = m[1];
    if (/^(?:https?:|mailto:|#)/.test(t)) continue;
    refs.push({ raw: m[0], target: t, kind: "md" });
  }

  return refs;
}

function resolveRef(fromFile, target) {
  // @-ссылки — всегда от корня репозитория
  if (target.startsWith("./") || target.startsWith("../")) {
    return resolve(dirname(fromFile), target);
  }
  if (target.startsWith("/")) {
    return resolve(ROOT, target.slice(1));
  }
  // Относительные md-ссылки — от файла-источника
  const fromRoot = resolve(ROOT, target);
  if (existsSync(fromRoot)) return fromRoot;
  return resolve(dirname(fromFile), target);
}

// ─────────────────────────────────────────────────────────────────────────────
// Проверки
// ─────────────────────────────────────────────────────────────────────────────

async function checkRequiredFiles() {
  for (const rel of REQUIRED_FILES) {
    const full = resolve(ROOT, rel);
    if (!existsSync(full)) error(rel, "обязательный файл отсутствует");
  }
}

async function checkLimits() {
  const targets = [
    { rel: "CURSOR.md", limit: LIMITS["CURSOR.md"] },
    { rel: "PLAN.md", limit: LIMITS["PLAN.md"] },
  ];
  const rulesDir = resolve(ROOT, ".cursor/rules");
  if (existsSync(rulesDir)) {
    const files = await walk(rulesDir, (f) => f.endsWith(".mdc"));
    for (const f of files) targets.push({ rel: toPosix(relative(ROOT, f)), limit: LIMITS[".cursor/rules/*.mdc"] });
  }
  const cmdDir = resolve(ROOT, ".cursor/commands");
  if (existsSync(cmdDir)) {
    const files = await walk(cmdDir, (f) => f.endsWith(".md"));
    for (const f of files) targets.push({ rel: toPosix(relative(ROOT, f)), limit: LIMITS[".cursor/commands/*.md"] });
  }

  for (const { rel, limit } of targets) {
    const full = resolve(ROOT, rel);
    if (!existsSync(full)) continue;
    const text = await readUtf8(full);
    const lines = countLines(text);
    if (lines > limit) warn(rel, `${lines} строк — превышает мягкий лимит ${limit} (single focus)`);
  }
}

async function checkRefs() {
  const files = await walk(ROOT, (f) => {
    const rp = toPosix(relative(ROOT, f));
    if (rp.startsWith("node_modules/") || rp.startsWith(".git/")) return false;
    return f.endsWith(".md") || f.endsWith(".mdc");
  });
  for (const file of files) {
    const rel = toPosix(relative(ROOT, file));
    const text = await readUtf8(file);
    const refs = extractRefs(text);
    for (const ref of refs) {
      const target = resolveRef(file, ref.target);
      if (!existsSync(target)) {
        error(rel, `битая ${ref.kind === "at" ? "@" : "markdown"}-ссылка: ${ref.target}`);
      }
    }
  }
}

async function checkAppendOnlyLog() {
  const file = resolve(ROOT, "PROJECT_KNOWLEDGE.md");
  if (!existsSync(file)) return;
  const text = await readUtf8(file);

  // Раздел "Журнал рефлексий" — допускает короткие записи; не проверяем его.
  const journalIdx = text.indexOf("## Журнал рефлексий");
  const corpus = journalIdx >= 0 ? text.slice(0, journalIdx) : text;

  for (const pat of APPEND_ONLY_PATTERNS) {
    if (pat.test(corpus)) {
      error("PROJECT_KNOWLEDGE.md", `append-only-лог обнаружен: совпадение с /${pat.source}/`);
    }
  }
}

async function checkSecrets() {
  const targets = ["PROJECT_KNOWLEDGE.md", "PLAN.md", "CURSOR.md", "README.md", "CHANGELOG.md"];
  for (const rel of targets) {
    const file = resolve(ROOT, rel);
    if (!existsSync(file)) continue;
    const text = await readUtf8(file);
    for (const pat of SECRETS_PATTERNS) {
      if (pat.test(text)) error(rel, `похоже на секрет: /${pat.source}/`);
    }
  }
}

async function checkDatesSync() {
  const cursor = resolve(ROOT, "CURSOR.md");
  const knowledge = resolve(ROOT, "PROJECT_KNOWLEDGE.md");
  if (!existsSync(cursor) || !existsSync(knowledge)) return;
  const [a, b] = await Promise.all([readUtf8(cursor), readUtf8(knowledge)]);
  const dateRe = /\b(20\d{2}-\d{2}-\d{2})\b/;
  const da = a.match(dateRe)?.[1];
  const db = b.match(dateRe)?.[1];
  if (da && db && da !== db) {
    warn("CURSOR.md / PROJECT_KNOWLEDGE.md", `даты обновления расходятся: ${da} ↔ ${db}`);
  }
}

async function checkChangelog() {
  const file = resolve(ROOT, "CHANGELOG.md");
  if (!existsSync(file)) return; // уже отловлено в required
  const text = await readUtf8(file);
  if (!/##\s*\[Unreleased\]/i.test(text) && !/##\s*\[\d+\.\d+\.\d+\]/.test(text)) {
    error("CHANGELOG.md", "не найден заголовок [Unreleased] или семантическая версия [x.y.z]");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const checks = [
  ["required files", checkRequiredFiles],
  ["soft limits", checkLimits],
  ["@-refs + md links", checkRefs],
  ["append-only log", checkAppendOnlyLog],
  ["secrets in docs", checkSecrets],
  ["date sync", checkDatesSync],
  ["changelog format", checkChangelog],
];

console.log(colors.cyan("AI Layer Validator"));
console.log(colors.dim(`root: ${ROOT}\n`));

for (const [name, fn] of checks) {
  process.stdout.write(`• ${name}… `);
  const before = issues.length;
  try {
    await fn();
  } catch (e) {
    error("validator", `${name} упал: ${e.message}`);
  }
  const errs = issues.slice(before).filter((i) => i.level === "error").length;
  const wrns = issues.slice(before).filter((i) => i.level === "warn").length;
  if (errs === 0 && wrns === 0) console.log(colors.green("ok"));
  else if (errs > 0) console.log(colors.red(`${errs} error(s)`) + (wrns ? `, ${colors.yellow(wrns + " warn(s)")}` : ""));
  else console.log(colors.yellow(`${wrns} warn(s)`));
}

console.log();

if (issues.length === 0) {
  console.log(colors.green("✓ AI Layer is healthy."));
  process.exit(0);
}

for (const i of issues) {
  const tag = i.level === "error" ? colors.red("ERR ") : colors.yellow("WARN");
  console.log(`${tag} ${colors.dim(i.file)} → ${i.msg}`);
}

const totalErrors = issues.filter((i) => i.level === "error").length;
const totalWarns = issues.filter((i) => i.level === "warn").length;
console.log();
console.log(`Итого: ${colors.red(totalErrors + " error(s)")}, ${colors.yellow(totalWarns + " warn(s)")}`);
process.exit(totalErrors > 0 ? 1 : 2);
