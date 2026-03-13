# Руководство для агентов Warhammer API

## Назначение проекта

Этот репозиторий содержит учебный docs-first API по вселенной Warhammer 40,000.

Цель продукта:

- дать новичкам и энтузиастам интересный API для web-разработки
- сохранить один понятный публичный контракт
- показывать сложные query-возможности, связи и граф домена без перегруза базовым CRUD-шумом

Контентное правило:

- использовать короткие оригинальные summaries и структурированные факты
- не копировать длинные тексты из wiki, codex, novels и официальных источников
- отдавать приоритет связям, метаданным и нормализованным фактам

## Текущее состояние

- публичный API только один: `/api/v1`
- старый `/api/*` больше не обслуживается и отвечает `410 LEGACY_API_REMOVED`
- старые docs aliases только редиректят:
  - `/legacy-api` -> `/openapi`
  - `/legacy/reference` -> `/openapi/reference`
- сервер читает учебный домен из PostgreSQL
- клиент на Preact выполняет роль публичной документации и интерактивного workbench
- OpenAPI, reference UI и generated SDK описывают только `/api/v1`

## Что уже есть

- Node.js + Express 5
- PostgreSQL + `pg`
- docs-first клиент на Preact + `preact-iso`
- OpenAPI 3.1 endpoint: `/api/v1/openapi.json`
- local reference viewer: `/openapi/reference`
- generated SDK assets:
  - `/sdk/warhammerApiV1Client.mjs`
  - `/sdk/warhammerApiV1Client.d.ts`
  - package export `warhammer-api/sdk`
- rate limiting для `api/v1`
- системная validation/error envelope для `api/v1`
- changelog и deprecation policy endpoints/pages
- CI, ESLint, Prettier, `npm run verify`

## Основные возможности API

Базовые read endpoint-ы:

- `GET /api/v1/{resource}`
- `GET /api/v1/{resource}/{idOrSlug}`
- `GET /api/v1/random/{resource}`

Общие query-возможности:

- `page`
- `limit`
- `sort`
- `search`
- `filter[...]`
- `include`
- `fields[...]`

Специальные endpoint-ы:

- `GET /api/v1/search`
- `GET /api/v1/compare/{resource}`
- `GET /api/v1/explore/graph`
- `GET /api/v1/explore/path`
- `GET /api/v1/stats/{resource}/{groupKey}`
- `GET /api/v1/examples/concurrency`
- `GET /api/v1/examples/workbench`

## Домен

Стабилизированный публичный набор ресурсов сейчас включает:

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

Отдельно поддерживаются:

- `search` с ранжированием по релевантности
- `compare` для `factions`, `characters`, `units`, `organizations`, `relics`, `campaigns`, `star-systems`, `battlefields`
- `explore/graph` с `resource`, `identifier`, `depth`, `limitPerRelation`, `backlinks`, `resources`
- `explore/path` с `fromResource`, `fromIdentifier`, `toResource`, `toIdentifier`, `maxDepth`, `limitPerRelation`, `backlinks`, `resources`
- `stats` для:
  - `factions/by-race`
  - `events/by-era`
  - `units/by-faction`
  - `weapons/by-keyword`
  - `relics/by-faction`
  - `campaigns/by-organization`
  - `battlefields/by-faction`
  - `star-systems/by-segmentum`

## Клиентская docs-first оболочка

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

Текущее UI-поведение:

- `Stats`, `Compare`, `Graph`, `Path`, `Playground` и `Resources/:resource` поддерживают deep-linking
- `Stats` показывает реальные SVG charts
- `Compare` показывает visual bars, overlaps и быстрые переходы
- `Graph` показывает SVG relation map, selection и compare bridge
- `Path` показывает кратчайшую цепочку по relation graph
- `Playground` и другие interactive pages используют OpenAPI/examples для contract hints и snippets
- onboarding и workbench flows питаются server-owned metadata из `/api/v1/examples/workbench`

## Архитектура

### Server

Ключевые файлы:

- `server/index.js`
  - поднимает HTTP server
- `server/app.js`
  - собирает Express app
  - монтирует только `/api/v1`
  - отдает `410 LEGACY_API_REMOVED` на `/api/*`
  - раздает `client/dist`, `/openapi/reference` и `/sdk/*`
- `server/v1Routes.js`
  - основной публичный route tree
- `server/content/contentApi.js`
  - docs/data handlers для `api/v1`
- `server/content/contentDb.js`
  - SQL-чтение доменного графа из PostgreSQL
- `server/content/openApiSpec.js`
  - OpenAPI contract
- `server/content/warhammerContent.js`
  - docs metadata, examples и seed-oriented content

### Client

Ключевые файлы:

- `client/router.js`
- `client/api/docsApi.js`
- `client/pages/*`
- `client/components/ApiOperationGuide.jsx`
- `client/components/WorkbenchScenarioSection.jsx`
- `client/components/PivotActionLinks.jsx`
- `client/lib/openApi.js`
- `client/lib/workbenchScenarios.js`
- `client/lib/workbenchPivots.js`

### Data

- `db/migrations/`
- `db/seeds/`
- `db/scripts/`

## Scripts

- `npm run server`
- `npm run server-watch`
- `npm run client-watch`
- `npm run build-dev`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:setup`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`
- `npm run sdk:generate`
- `npm run sdk:check`
- `npm test`
- `npm run verify`

## Проверенное состояние

Актуально на текущем этапе:

- `npm run verify` проходит
- `npm audit` возвращает `0 vulnerabilities`
- `npm run build-dev` собирает клиент без warnings
- `/api/v1/openapi.json` отдается и покрыт тестами
- `/openapi/reference` работает и покрыт тестами
- generated SDK раздается сервером и покрыт тестами
- `/api/factions` и `/api/openapi.json` возвращают `410 LEGACY_API_REMOVED`

## Продуктовые правила

- считать `/api/v1` единственным публичным контрактом
- не возвращать проект к модели двух публичных API
- не вводить write-heavy public surface без отдельного продуктового решения
- любую публичную возможность сразу отражать в docs, OpenAPI и, где нужно, в generated SDK
- удерживать баланс: простой первый запрос для новичка и богатый relation/query слой для более сложных UI

## Что важно не сломать

- единый error envelope для `api/v1`
- общий validation flow
- rate limit headers и `429 RATE_LIMIT_EXCEEDED`
- OpenAPI / SDK синхронизацию
- workbench metadata как source of truth для docs scenarios
- docs-first роль клиента вместо произвольного CRUD demo UI

## Ближайшее направление разработки

- развивать только `/api/v1`
- расширять домен, filters, examples и traversal use-cases
- улучшать docs/workbench/SDK вокруг того же контракта
- не тратить время на resurrect legacy surface
