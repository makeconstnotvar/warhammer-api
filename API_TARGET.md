# API Target

## Product Decision

- В продукте должен быть ровно один публичный API.
- Канонический публичный контракт живет под `/api/v1`.
- Legacy `/api` не является целевым состоянием продукта и должен быть удален после консолидации.
- Docs-клиент, OpenAPI, generated SDK и examples должны описывать только один основной контракт.

## Product Goal

Мы делаем богатый API для экспериментальной web-разработки и обучения, чтобы:

- новичок мог за 15-30 минут собрать первый полезный интерфейс
- энтузиаст мог строить compare UI, dashboards, graph explorers и multi-resource приложения
- один и тот же контракт поддерживал и простые списки, и глубокие связи между сущностями

## Core Promise

API должен одновременно давать:

- простой первый запрос
- интересный контент
- предсказуемые правила query-параметров
- сильную документацию
- машиночитаемый контракт

## Canonical Surface

Единый публичный API состоит из четырех слоев.

### 1. Resource Layer

Базовые read endpoint-ы:

- `GET /api/v1/{resource}`
- `GET /api/v1/{resource}/{idOrSlug}`
- `GET /api/v1/random/{resource}`

Этот слой нужен для:

- списков
- detail pages
- catalog view
- routing
- autocomplete и quick picks

### 2. Query Power Layer

Единые query-возможности:

- `page`
- `limit`
- `sort`
- `search`
- `filter[...]`
- `include`
- `fields[...]`

Это делает любой ресурс пригодным для:

- server-side pagination
- filtered browse pages
- compact list payloads
- richer detail payloads

### 3. Exploration Layer

Специальные read endpoint-ы для richer UI:

- `GET /api/v1/search`
- `GET /api/v1/compare/{resource}`
- `GET /api/v1/explore/graph`
- `GET /api/v1/explore/path`
- `GET /api/v1/stats/{resource}/{groupKey}`

Именно этот слой делает API полезным не только для CRUD-демо, а для:

- compare pages
- charts
- dashboards
- relation explorers
- explainable navigation

### 4. Contract / Docs Layer

Документационные и машиночитаемые endpoint-ы:

- `GET /api/v1/overview`
- `GET /api/v1/catalog/resources`
- `GET /api/v1/query-guide`
- `GET /api/v1/changelog`
- `GET /api/v1/deprecation-policy`
- `GET /api/v1/examples/concurrency`
- `GET /api/v1/examples/workbench`
- `GET /api/v1/openapi.json`

Этот слой нужен, чтобы API был:

- обучающим
- самодокументируемым
- пригодным для SDK/codegen
- пригодным для contract testing

## Domain Shape

Основной API должен строиться вокруг богатого read-only набора сущностей и связей.

Обязательные публичные ресурсы текущего большого этапа:

- `races`
- `factions`
- `characters`
- `planets`
- `eras`
- `events`
- `keywords`
- `weapons`
- `units`
- `organizations`
- `relics`
- `campaigns`
- `star-systems`
- `battlefields`
- `fleets`
- `warp-routes`

Каждый публичный ресурс должен быть:

- доступен через list/detail
- включен в catalog/docs слой
- описан в OpenAPI
- поддержан в generated SDK
- пригоден для `include` и `fields` там, где это уместно

## Response Conventions

### List

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  },
  "links": {
    "self": "/api/v1/characters?page=1&limit=20",
    "next": "/api/v1/characters?page=2&limit=20"
  },
  "included": {}
}
```

### Detail

```json
{
  "data": {},
  "included": {},
  "meta": {}
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": []
  }
}
```

## Capability Meanings

- `search`: глобальный поиск по нескольким ресурсам
- `include`: загрузка связанных сущностей в одном ответе
- `fields`: выбор только нужных полей
- `graph`: граф связей вокруг одной сущности
- `path`: цепочка связей между двумя сущностями
- `stats`: агрегаты для charts и dashboard UI
- `compare`: сравнение двух сущностей одного типа

Это обязательные возможности основного API, а не отдельные экспериментальные хвосты.

## Product Rules

### Rule 1. One Public Contract

- В docs не должно быть второй публичной поверхности.
- В меню, onboarding и examples должен фигурировать один API.
- Любые transitional route-ы считаются временной внутренней стадией, а не частью финального продукта.

### Rule 2. Read-First Product

- Основной API сейчас ориентирован на чтение.
- Публичные write endpoint-ы не являются частью обязательного target state.
- Если позже понадобится write story, она должна быть спроектирована отдельно и явно, а не как случайный остаток старого CRUD.

### Rule 3. Docs-First Delivery

- Любая публичная возможность должна иметь docs page или docs section.
- Любой публичный endpoint должен иметь OpenAPI-описание.
- Любое изменение контракта должно попадать в changelog и SDK.

### Rule 4. Predictable Queries

- одинаковые правила `page`, `limit`, `sort`, `filter`, `include`, `fields`
- одинаковые shapes `meta`, `included`, `error`
- одинаковое поведение validation и rate limiting

## Docs Client Target

Клиент должен быть не “примером CRUD UI”, а официальной docs-first оболочкой API.

Канонические страницы:

- `Home`
- `Quick Start`
- `Resources`
- `Query Guide`
- `OpenAPI`
- `Changelog`
- `Deprecation Policy`
- `Stats`
- `Compare`
- `Graph`
- `Path`
- `Playground`
- `Concurrency`

Не целевое состояние:

- отдельная публичная `Legacy API` страница
- второй reference viewer для старого контракта
- два параллельных набора docs для разных API

## SDK Target

Generated SDK должен:

- собираться из одного OpenAPI source
- иметь committed runtime module и `.d.ts`
- описывать только основной публичный контракт
- проходить `sdk:check` как часть `verify`

## Delivery Target

Минимальный baseline:

- `npm run verify` проходит стабильно
- `npm audit` без критических сюрпризов
- CI повторяет локальный quality gate
- клиентская сборка без warnings

## Non-Goals

Мы не пытаемся сделать:

- второй параллельный публичный API
- permanent legacy support как часть продукта
- write-heavy public platform до явного продуктового решения
- сложную auth-систему до появления реального write/use-case слоя

## Implementation Direction From Current Repo State

Следующие шаги должны идти в таком порядке:

1. Перестать позиционировать legacy `/api` как часть продуктовой истории.
2. Свести docs/navigation/onboarding к одному официальному API.
3. Удалить legacy pages, reference shell, routes и tests после завершения консолидации.
4. Дальше развивать только единый контракт `/api/v1`.

## Definition Of Done

Можно считать target state достигнутым, когда:

- в репозитории нет второго публичного API surface
- docs-клиент говорит только про один API
- OpenAPI и SDK описывают только этот API
- onboarding не требует объяснять разницу между “новым” и “старым” API
- любой новичок видит один понятный путь: `Quick Start -> Resources -> Playground -> Graph/Compare/Stats`
