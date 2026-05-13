# Changelog — AI Layer (cursor-starter)

Все изменения в AI-слое документируются здесь. Формат: Keep a Changelog.

---

## [Unreleased]

### Added
- `hooks.json` + 4 активных хука: plan-guard, knowledge-sync, rule-validator, plan-reminder
- `.cursor/hooks/` — директория со скриптами хуков
- `PLAN.md` — усилен реальным примером и шаблоном для копирования
- `project-skills-registry.mdc` — явно фиксирует отсутствие глобальных скилов
- `RESUME.md` — позиционирование AI-native engineer

### Changed
- `README.md` — переработан: добавлена целевая аудитория, примеры «до/после», позиционирование
- `ai-builder.md` — Шаг 4 описывает hooks как активную часть слоя
- `PROJECT_KNOWLEDGE.md` — обновлены разделы «Архитектура», «Правила и инварианты», «Известные проблемы»

### Removed
- Упоминания hooks как «опциональных» — теперь hooks активны по умолчанию

---

## [0.1.0] — 2026-05-12

### Added
- `CURSOR.md` — оркестратор AI-слоя
- `.cursor/rules/` — token-economy, model-routing, core, architecture, stack-specific, project-skills-registry
- `.cursor/commands/` — feature, fix-bug, review, refactor
- `ai-layer-builder/ai-builder.md` — сценарий bootstrap (Шаг 0 → 8)
- `ai-layer-builder/spec-CURSOR.md`, `spec-commands.md` — спецификации
- `PROJECT_KNOWLEDGE.md` — живая документация (state, не лог)
- `PLAN.md` — шаблон плана
- `AGENTS.md` — указатель на `CURSOR.md`
- `README.md` — базовая инструкция
- `.cursorignore` — тяжёлые и секретные пути

### Initial
- Первый релиз шаблона AI-слоя для Cursor.