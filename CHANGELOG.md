# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование: [SemVer](https://semver.org/lang/ru/).

Версионируется **AI-слой** (правила, команды, оркестратор, bootstrap), не пользовательский код. Версия дублируется в `CURSOR.md` (поле `AI Layer Version`).

---

## [Unreleased]

### Изменено
- Полный критический пересмотр шаблона: устранены внутренние противоречия, дубли принципов и заявленные, но нереализованные возможности.
- `.cursor/plans/example-plan.md` сделан stack-agnostic (раньше закреплял воображаемый FastAPI/RAG/pgvector-стек, что противоречило инварианту «нет готовых примеров»).
- Раздел «AI Layer Health» в `PROJECT_KNOWLEDGE.md` переписан так, чтобы опираться на реальные источники (git, валидатор, журнал рефлексий), а не на плейсхолдеры.
- `project-skills-registry.mdc` упрощён: убран амбициозный «глобальный реестр сканированием диска», оставлены только проектные skills и правило «не выдумывать инструменты».
- `ai-builder.md` шаг 2.5 переработан под прагматичную модель: глобальные скилы регистрируются по запросу пользователя, не сканируются автоматически.
- `ai-builder.md` шаг 4 (Hooks): убран конкретный bash-пример, оставлен алгоритм решений и явная пометка «формат под Cursor IDE, кроссплатформенно».
- `/reflect` опирается на git и валидатор, а не на «историю чатов» (которая агенту через файлы недоступна).
- Принципы AI-слоя вынесены в единственный `.cursor/PRINCIPLES.md`; в остальных файлах оставлены только ссылки.

### Добавлено
- `.cursor/PRINCIPLES.md` — единый source of truth для принципов AI-слоя.
- `.cursor/rules/anti-patterns.mdc` — собранные в одном месте антипаттерны (раньше были размазаны по 4 файлам).
- `.cursor/rules/secrets-guard.mdc` — запрет на запись секретов в живую документацию и план; рекомендованный список для `.cursorignore` (расширение `.cursorignore` — ручной шаг, Cursor запрещает агенту менять этот файл).
- `.cursor/commands/bootstrap.md` — обёртка над `ai-builder.md`.
- `.cursor/commands/audit.md` — структурный аудит AI-слоя.
- `.cursor/commands/handoff.md` — передача контекста в новый чат.
- `.cursor/commands/docs.md` — синхронизация `PROJECT_KNOWLEDGE.md` с фактом.
- `scripts/validate-layer.mjs` — кроссплатформенный (Node) валидатор шаблона: проверяет битые `@`-ссылки, упомянутые файлы, лимиты, синхронность дат.
- `.github/workflows/validate.yml` — CI для валидатора.
- `CHANGELOG.md` (этот файл).
- В `README.md` добавлен раздел «60-second Quick Start».

### Удалено
- Завершённый план из `PLAN.md` (теперь там только активный план + шаблон).
- Плейсхолдеры в разделе «AI Layer Health» (`(дата)`, `(число)`, `(оценка)`).

---

## [1.0.0] — 2026-05-13

Первая релиз-версия AI-слоя.

### Архитектура
- `CURSOR.md` — корневой оркестратор: маршрутизация задач, ссылки на rules/commands.
- `.cursor/rules/*.mdc` — политики: `token-economy`, `model-routing`, `core`, `architecture`, `stack-specific`, `project-skills-registry`.
- `.cursor/commands/*.md` — slash-команды: `/feature`, `/fix-bug`, `/review`, `/refactor`, `/reflect`.
- `ai-layer-builder/` — bootstrap-сценарий и спецификации (`ai-builder.md`, `spec-CURSOR.md`, `spec-commands.md`).
- `PROJECT_KNOWLEDGE.md` — живая документация (структурно, не append-only).
- `PLAN.md` — обязательный план перед нетривиальной задачей.
- `AGENTS.md` — указатель на `CURSOR.md` для инструментов, ожидающих этот файл.
- `.cursorignore` — экономия контекста.

### Принципы (вынесены в `.cursor/PRINCIPLES.md` в Unreleased)
- Plan-driven development: план обязателен перед кодом.
- Структурная живая документация (запрет append-only лога).
- Маршрутизация моделей: пул, ярусы S/A/B/C, явная эскалация.
- Token economy: точечный `@`, `.cursorignore`, новый чат на новую задачу.
- Bootstrap «с нуля под проект» без готовых примеров.

[Unreleased]: ../../compare/v1.0.0...HEAD
[1.0.0]: ../../releases/tag/v1.0.0
