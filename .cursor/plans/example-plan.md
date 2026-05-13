# Пример плана — Feature: Добавить RAG pipeline с pgvector

**Цель**: Реализовать RAG (Retrieval-Augmented Generation) pipeline для чата с базой знаний. Пользователь загружает документы → система индексирует → отвечает с цитированием источников.

---

## Контекст

**@ файлы и артефакты:**
- `@PROJECT_KNOWLEDGE.md` — текущая архитектура
- `@.cursor/rules/stack-specific.mdc` — стек: FastAPI, PostgreSQL, pgvector, React
- `docs/architecture.md` — диаграмма текущей системы (если есть)
- `backend/app/api/` — существующие эндпоинты

**Затронутые модули:**
- `backend/app/services/rag/` — новый модуль
- `backend/app/api/v1/chat.py` — эндпоинт `/chat`
- `frontend/components/Chat/` — UI для чата с источниками
- `alembic/versions/` — миграция для pgvector

---

## Шаги

### 1. Исследование и план (уже делаем)
- [x] Определить требования (TЗ от заказчика)
- [x] Выбрать стек: pgvector vs Pinecone (решили pgvector)
- [x] Составить этот план

### 2. База данных
- [ ] Создать миграцию: таблица `documents` + `chunks` + pgvector extension
- [ ] Добавить индекс HNSW для векторов
- [ ] Протестировать вставку и поиск по косинусному расстоянию

### 3. Backend — RAG сервис
- [ ] `backend/app/services/rag/embedder.py` — класс для генерации embeddings (OpenAI text-embedding-3-small)
- [ ] `backend/app/services/rag/retriever.py` — поиск релевантных чанков
- [ ] `backend/app/services/rag/generator.py` — генерация ответа с контекстом
- [ ] `backend/app/services/rag/pipeline.py` — оркестрация: embed → retrieve → generate

### 4. API
- [ ] `POST /api/v1/documents` — загрузка документа (multipart/form-data)
- [ ] `POST /api/v1/chat` — чат с RAG (streaming SSE)
- [ ] `GET /api/v1/documents/:id/sources` — источники для ответа

### 5. Frontend
- [ ] Компонент `ChatMessage` с отображением источников (аккордеон)
- [ ] Streaming UI (SSE) — показывать ответ по мере генерации
- [ ] Индикатор «источники найдены» / «источники не найдены»

### 6. Тесты
- [ ] Unit: `test_retriever.py` — поиск по тестовым чанкам
- [ ] Integration: `test_rag_pipeline.py` — полный цикл embed → retrieve → generate (моки)
- [ ] E2E: загрузка PDF → вопрос → проверка источников в UI

### 7. Документация
- [ ] Обновить `PROJECT_KNOWLEDGE.md`:
  - Раздел «Архитектура» → добавить RAG pipeline
  - Раздел «Точки входа» → `/api/v1/chat`, `/api/v1/documents`
- [ ] Обновить `docs/architecture.md` (если есть)
- [ ] Добавить пример запроса/ответа в `README.md`

---

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Галлюцинации** — модель игнорирует контекст | Средняя | Высокое | System prompt с инструкцией «отвечай только на основе источников». Fallback: «не знаю». |
| **Стоимость embeddings** — много документов | Средняя | Среднее | Кэширование embeddings. Лимит размера документа (10MB). |
| **Латенси** — pgvector поиск медленный | Низкая | Среднее | HNSW индекс + limit 5 чанков. |
| **Контекст переполняется** — много релевантных чанков | Средняя | Высокое | Top-K = 5. Summarization чанков при > 3k токенов. |
| **MVP scope creep** — «давайте ещё и web search» | Высокая | Высокое | Жёсткий scope в плане. Всё остальное — в отдельной фиче. |

---

## Готово, когда

- [ ] Все тесты зелёные (unit + integration + e2E)
- [ ] `PROJECT_KNOWLEDGE.md` обновлён структурно (не логом)
- [ ] План в `PLAN.md` закрыт / перенесён в `.cursor/plans/`
- [ ] PR готов, review пройден
- [ ] Документация (README, API docs) обновлена
- [ ] Hooks (`plan-guard`, `knowledge-sync`) сработали без ошибок

---

## Примечания

- **Streaming**: используем SSE, не WebSocket (проще, уже есть в проекте).
- **Embeddings модель**: `text-embedding-3-small` (1536 dim). Если нужно больше качества — `text-embedding-3-large`.
- **Chunking**: 500 токенов + overlap 50. RecursiveCharacterTextSplitter.
- **LangChain**: не используем. Слишком тяжёлый. Пишем свои классы.

---

**Статус**: План составлен. Готов к реализации.

**Следующий шаг**: Шаг 2 — миграция БД.