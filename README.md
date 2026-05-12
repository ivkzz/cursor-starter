# cursor-starter

Репозиторий-**шаблон**: готовый **AI-слой** для Cursor (оркестратор, правила, slash-команды, сценарий переноса в свой проект). Прикладного кода нет — только конфигурация и документы.

## Как пользоваться

1. Склонируйте репозиторий или создайте новый проект из шаблона и откройте папку в **Cursor**.
2. В чате начните с **`@CURSOR.md`** — там порядок работы и таблица «задача → действие».
3. Чтобы **подстроить слой под свой стек и репо**, откройте **`@ai-layer-builder/ai-builder.md`** и выполните шаги **0 → 8** по порядку (merge с уже существующим `.cursor/`, без полной перезаписи без запроса).
4. Ведите **`PROJECT_KNOWLEDGE.md`**: после изменений обновляйте разделы (архитектура, стек, долги), а не журнал «что сделал».
5. План текущей задачи — **`PLAN.md`** или `.cursor/plans/*.md`; после задачи план можно очистить или перенести в планы.

## Состав репозитория

| Путь | Назначение |
|------|------------|
| [`CURSOR.md`](CURSOR.md) | Главная карта: маршрутизация, ссылки на rules и commands |
| [`PROJECT_KNOWLEDGE.md`](PROJECT_KNOWLEDGE.md) | Живая документация состояния (обновлять вместе с кодом) |
| [`PLAN.md`](PLAN.md) | План активной задачи |
| [`AGENTS.md`](AGENTS.md) | Указатель на `CURSOR.md` для инструментов, которые ждут этот файл |
| [`ai-layer-builder/ai-builder.md`](ai-layer-builder/ai-builder.md) | Bootstrap и обновление AI-слоя |
| [`ai-layer-builder/spec-CURSOR.md`](ai-layer-builder/spec-CURSOR.md) | Спека структуры `CURSOR.md` |
| [`ai-layer-builder/spec-commands.md`](ai-layer-builder/spec-commands.md) | Формат проектных slash-команд |
| [`.cursor/rules/`](.cursor/rules/) | Политики Cursor (`*.mdc`) |
| [`.cursor/commands/`](.cursor/commands/) | Тексты для `/feature`, `/fix-bug`, `/review`, `/refactor` |
| [`.cursorignore`](.cursorignore) | Что не индексировать (контекст и кредиты) |

## Slash-команды этого шаблона

В палитре команд Cursor (проектные, не `/create-*`):

| Команда | Файл |
|---------|------|
| `/feature` | `.cursor/commands/feature.md` |
| `/fix-bug` | `.cursor/commands/fix-bug.md` |
| `/review` | `.cursor/commands/review.md` |
| `/refactor` | `.cursor/commands/refactor.md` |

## Новый репозиторий

Скопируйте содержимое **cursor-starter** в корень нового репо (или используйте как template), затем шаги из раздела «Как пользоваться». После появления кода обновите **`stack-specific.mdc`** и **`PROJECT_KNOWLEDGE.md`** (через агента по `ai-builder` или вручную).

## Уже есть проект с кодом

Смержите `.cursor/`, `CURSOR.md`, `PROJECT_KNOWLEDGE.md`, `ai-layer-builder/` с существующим деревом; затем **`@ai-layer-builder/ai-builder.md`** (режим brownfield в шаге 1) — чтобы правила и команды совпали с реальным стеком.

## Когда снова открывать `ai-builder.md`

Смена стека, крупный рефакторинг, новые команды/skills, расхождение документации и `.cursor/`. После прогона обновите дату в шапке **`CURSOR.md`**.

## Встроенные команды Cursor

`/create-rule`, `/create-hook`, `/create-skill` — создают артефакты в `.cursor/`; этим дополняют шаблон. Проектные сценарии — только файлы в **`.cursor/commands/*.md`** по [`spec-commands.md`](ai-layer-builder/spec-commands.md).

## `.cursorignore`

По умолчанию в игноре тяжёлые каталоги и **lock-файлы**. Если агенту нужен разбор зависимостей по lock-файлу — уберите соответствующие строки из [`.cursorignore`](.cursorignore).
