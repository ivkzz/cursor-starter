# Архив плана: «Полировка AI-слоя до релиз-готовности» (2026-05-13)

**Статус**: завершено. Соответствующие изменения зафиксированы в [`CHANGELOG.md`](../../../CHANGELOG.md) (раздел `[Unreleased]`).

---

**Цель**: устранить внутренние противоречия шаблона, ввести самовалидацию, сделать `/reflect` опирающимся на данные, а не на воображение, и добавить минимально необходимые команды/правила. Принцип — минимализм: каждая новая сущность должна окупаться.

**Контекст**:
- `CURSOR.md`, `PROJECT_KNOWLEDGE.md`, `README.md`
- `ai-layer-builder/ai-builder.md`, `ai-layer-builder/spec-CURSOR.md`, `ai-layer-builder/spec-commands.md`
- `.cursor/commands/reflect.md`, `.cursor/rules/`, `.cursor/plans/example-plan.md`

## Выполненные шаги

### Этап A — Устранение противоречий

- **A1** Очистить `PLAN.md` от завершённого примера, оставить только шаблон.
- **A2** Сделать `.cursor/plans/example-plan.md` stack-agnostic (без FastAPI/pgvector).
- **A3** Переписать раздел «AI Layer Health» в `PROJECT_KNOWLEDGE.md` — убрать плейсхолдеры, написать честно про источник метрик.
- **A4** Восстановить `CHANGELOG.md` и ввести версионирование AI-слоя. Добавить ссылки в `CURSOR.md` и `README.md`.
- **A5** Создать `.cursor/PRINCIPLES.md` — единственное место принципов. Сократить дубли.
- **A6** Перенести антипаттерны в `.cursor/rules/anti-patterns.mdc` (`alwaysApply: true`, `globs: "**/*.md", "**/*.mdc"`).

### Этап B — Инфраструктура

- **B2** `scripts/validate-layer.mjs` — Node-валидатор (битые ссылки, лимиты, append-only-лог, секреты, синхронность дат).
- **B3** `.github/workflows/validate.yml` — GH Action на валидатор.
- **B4** Новые команды: `/bootstrap`, `/audit`, `/handoff`, `/docs`.
- **B5** Переработка `project-skills-registry.mdc` (без сканирования диска), правки `ai-builder.md` шагов 2.5 и 4.

### Этап C — Реалистичный `/reflect`

- **C1** Переписать `.cursor/commands/reflect.md` — `git log`, `git diff --stat`, файлы, валидатор. Убрать «прочитать историю чатов».
- **C2** Лёгкий журнал рефлексий внутри `PROJECT_KNOWLEDGE.md → AI Layer Health → Журнал рефлексий`.

### Этап D — Креативно, но минимально

- **D1** `.cursor/rules/secrets-guard.mdc` + рекомендованный список для `.cursorignore` (расширение — ручной шаг).
- **D5** Раздел «60-second Quick Start» в `README.md`.

### Финализация

- **F1** Валидатор зелёный (7/7).
- **F2** `PROJECT_KNOWLEDGE.md` отражает новую структуру.
- **F3** `PLAN.md` очищен, дата в `CURSOR.md` обновлена.

## Готово

- Все противоречия из критического разбора устранены, зафиксированы в `CHANGELOG.md`.
- Валидатор зелёный.
- `PROJECT_KNOWLEDGE.md` отражает новую структуру (структурно, не логом).
- `PLAN.md` очищен.
- В `CURSOR.md` обновлены дата и версия слоя.
