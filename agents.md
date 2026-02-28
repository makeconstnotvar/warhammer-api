# Руководство для агентов Warhammer API

## Назначение проекта

Этот репозиторий содержит учебный REST API и легковесный клиент для работы с данными по вселенной Warhammer 40,000.

Основные цели продукта:
- сделать широкий, но понятный API для обучения веб-разработке
- сохранить за клиентом роль публичной документации и примеров
- позволить быстро собирать простые эксперименты, при этом поддерживая сложные запросы и связи между сущностями

Вторичная цель:
- использовать узнаваемые фракции, персонажей, миры, конфликты и артефакты Warhammer 40k, чтобы набор данных был интересным и запоминающимся

Важное правило по контенту:
- использовать оригинальные короткие описания и структурированные факты
- не копировать длинные тексты из wiki, codex, novels и официальных источников
- отдавать приоритет фактическим сводкам, нормализованным метаданным и графу связей

## Текущее состояние репозитория

В репозитории уже есть рабочая основа:
- сервер на Node.js + Express
- доступ к PostgreSQL через `pg`
- простая слоистая структура серверной части: `handler -> service -> repository -> model`
- клиент на Preact, который теперь играет роль публичной документации
- новый `api/v1` с богатым read API поверх учебного набора данных
- канонические migrations и seed scripts для PostgreSQL
- документационные страницы, playground и demo конкурентных запросов
- раздача собранного клиента через Express

Актуально сейчас:
- `api/v1` является основным публичным учебным API
- старый `/api` сохранен как legacy CRUD-слой для `races`, `factions`, `characters`
- клиент больше не является списочным demo UI, а работает как docs-first приложение
- база данных может быть поднята из кода через `db:migrate` и `db:seed`
- `api/v1` теперь читает из PostgreSQL, а не из in-memory набора
- домен расширен ресурсами `keywords`, `weapons`, `units`
- `search` ранжирует результаты по релевантности
- `compare` поддерживает `factions`, `characters`, `units`

## Структура верхнего уровня

- `server/`
  - Express-приложение
  - регистрация routes
  - подключение к PostgreSQL
  - handlers, services, repositories, models
  - `v1Routes.js` и `content/` для публичного учебного API
  - `contentDb.js` строит SQL-чтение для `api/v1`
- `client/`
  - приложение на Preact
  - публичная документация API
  - страницы `Quick Start`, `Resources`, `Query Guide`, `Playground`, `Concurrency`
  - webpack build
- `db/`
  - `migrations/` с канонической схемой
  - `seeds/` с учебным набором данных
  - `scripts/` для запуска migrations
- `agents.md`
  - этот файл
- `README.md`
  - быстрый локальный запуск и обзор scripts
- `package.json`
  - scripts и зависимости

## Стек

Backend:
- Node.js
- Express 5
- PostgreSQL
- `pg`
- `helmet`
- `cors`
- `dotenv`

Frontend:
- Preact
- `preact-iso`
- MobX
- Axios
- Bootstrap 5 с кастомным SCSS import
- Webpack

## Существующие scripts

Из `package.json`:

- `npm run server`
  - запускает `server/index.js`
- `npm run server-watch`
  - запускает сервер через `nodemon`
- `npm run client-watch`
  - запускает webpack в режиме watch
- `npm run build-dev`
  - собирает клиент в `client/dist`
- `npm run db:migrate`
  - применяет migrations
- `npm run db:seed`
  - перезаписывает учебные данные в PostgreSQL
- `npm run db:setup`
  - выполняет migrations и затем seed

Что было проверено во время анализа:
- `npm run build-dev` выполняется успешно
- серверные модули загружаются без синтаксических ошибок
- `npm run db:migrate` выполняется успешно
- `npm run db:seed` выполняется успешно
- `GET /api/v1/overview` отвечает через HTTP
- legacy `GET /api/factions` продолжает работать после миграций
- `GET /api/v1/factions?include=leaders,races,homeworld` отвечает из PostgreSQL
- `GET /api/v1/characters?filter[faction]=ultramarines&include=faction,race,homeworld,events` отвечает из PostgreSQL
- `GET /api/v1/random/character` отвечает из PostgreSQL
- `GET /api/v1/compare/factions?ids=imperium-of-man,black-legion` отвечает из PostgreSQL
- `GET /api/v1/stats/factions/by-race` и `GET /api/v1/stats/events/by-era` отвечают из PostgreSQL
- `GET /api/v1/keywords`, `GET /api/v1/weapons`, `GET /api/v1/units` отвечают из PostgreSQL
- `GET /api/v1/random/unit` отвечает из PostgreSQL
- `GET /api/v1/compare/units?ids=terminator-squad,intercessor-squad` отвечает из PostgreSQL
- `GET /api/v1/search?search=cadia` сортирует результаты по релевантности

Чего сейчас нет:
- tests
- linting
- formatting scripts
- OpenAPI или Swagger
- Docker-конфигурации

## Архитектура сервера

### Точка входа

`server/index.js`

Зона ответственности:
- загружает env из `server/.env`
- настраивает `cors()`
- настраивает `helmet()`
- включает разбор JSON-тела запроса
- монтирует API routes под `/api`
- раздает static-файлы из `client/dist`
- использует SPA fallback на `client/dist/index.html`
- использует общий 500 обработчик ошибок

Примечания:
- `morgan` импортирован, но сейчас отключен
- нет отдельного 404 обработчика для API
- нет middleware для валидации входных данных
- нет rate limit
- нет auth

### Маршрутизация

`server/routes.js`

Текущие ресурсы:
- `/api/factions`
- `/api/characters`
- `/api/races`

Для каждого ресурса сейчас есть:
- `GET /`
- `POST /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

### Слои

Текущий backend flow:
- обработчик разбирает query/body/params
- service почти напрямую делегирует в repository
- repository содержит SQL
- model преобразует DB snake_case в API camelCase

Эта структура уже достаточно понятная для роста, но слой service пока слишком тонкий и почти не содержит бизнес-правил.

## Текущее поведение API

### Списковые endpoint-ы

Все три endpoint-а списков поддерживают пагинацию:
- `page`
- `limit`

Поддерживаемые фильтры:

`GET /api/characters`
- `name`
- `faction_id`
- `race_id`

`GET /api/factions`
- `name`

`GET /api/races`
- `name`

Текущая форма ответа списков:

```json
{
  "data": [],
  "total": 0
}
```

### Форма ответа сущностей

Текущие model преобразуют поля примерно к такому виду:

`character`
```json
{
  "id": 1,
  "name": "Roboute Guilliman",
  "description": "string or null",
  "factionId": 1,
  "raceId": 1,
  "imageUrl": "string or null",
  "createdAt": "timestamp or null",
  "updatedAt": "timestamp or null"
}
```

`faction`
```json
{
  "id": 1,
  "name": "Ultramarines",
  "description": "string or null",
  "imageUrl": "string or null",
  "createdAt": "timestamp or null",
  "updatedAt": "timestamp or null"
}
```

`race`
```json
{
  "id": 1,
  "name": "Human",
  "description": "string or null",
  "imageUrl": "string or null",
  "createdAt": "timestamp or null",
  "updatedAt": "timestamp or null"
}
```

### Поведение SQL-слоя

Repository реализуют:
- пагинированный `findAll`
- `findById`
- `create`
- `update`
- `delete`

В списковых запросах уже есть одна полезная вещь:
- запросы на данные и count выполняются параллельно через `Promise.all`

Сейчас это единственное место, где проект демонстрирует конкурентную работу на сервере.

## Архитектура клиента

### Роль клиента

Сейчас клиент является небольшим интерфейсом в браузере.

Целевая роль на будущее:
- публичная документация
- интерактивный обозреватель API
- практический пример приложения для frontend-разработчиков

Он не должен сначала превращаться в тяжелый прикладной клиент. Его задача - объяснять и демонстрировать API.

### Текущие страницы

Маршруты в `client/router.js`:
- `/`
- `/races`
- `/factions`
- `/characters`
- fallback-страница 404

Что страницы делают сейчас:
- главную страницу с коротким вступлением
- страницы списков с серверной пагинацией
- базовые состояния загрузки и ошибок

Чего страницы пока не делают:
- не показывают документацию по endpoint-ам
- не показывают примеры запросов
- не показывают примеры ответов
- не показывают UI для filters и sort
- не показывают страницы деталей сущностей
- не показывают граф связей
- не показывают сравнения рядом друг с другом
- не показывают live code snippets

### Управление состоянием

Store создаются в `client/stores.js`.

Текущие store:
- `$factionsStore`
- `$racesStore`
- `$raceStore`
- `$charactersStore`

Decorator-ы в `client/stores/utils/createDecorator.js` дают переиспользуемую fetch-логику для:
- array store
- object store

### API wrapper-ы клиента

Текущие wrapper-ы:
- `client/api/charactersApi.js`
- `client/api/factionsApi.js`
- `client/api/racesApi.js`

Базовый URL:
- `//localhost:3000/api`

Важное ограничение:
- адрес API жестко захардкожен
- нет конфигурации API URL, зависящей от окружения для клиента

## Восстановленное состояние базы данных

В репозитории нет migration или схема-файла.

Однако в JetBrains `.idea/dataSources/...xml` есть снимок схемы. По нему можно предположить, что база когда-то выглядела так:

`races`
- `id`
- `name`
- `description`

`factions`
- `id`
- `name`
- `description`
- `race_id`

`characters`
- `id`
- `name`
- `description`
- `rank`
- `faction_id`

Тот же снимок показывает:
- unique key на `races.name` и `factions.name`
- foreign key `factions.race_id -> races.id`
- foreign key `characters.faction_id -> factions.id`

## Критичное расхождение: код против снимок схемы

Текущий код и снимок схемы из IDE не совпадают.

Код ожидает поля, которых не видно в снимок:
- `characters.race_id`
- `characters.image_url`
- `factions.image_url`
- `races.image_url`
- `created_at`
- `updated_at`

Снимок показывает поля, которые не используются кодом:
- `characters.rank`
- `factions.race_id`

Практический вывод:
- реальная текущая схема базы неясна
- чистую установку нельзя безопасно восстановить только по репозиторию
- первой крупной технической задачей должно стать формальное описание схема через migrations и seeds

## Текущие проблемы качества

Это самые важные проблемы для любого агента, который будет менять проект.

### Данные и схема

- в репозитории нет канонической схема
- нет истории migrations
- нет seed data
- нет словаря данных
- нет задокументированных ограничений

### Контракт API

- нет versioning
- нет OpenAPI spec
- нет единой error envelope
- нет слоя валидации
- нет поддержки sort
- нет выборки полей
- нет relation include
- нет compound filters
- нет search endpoint

### Поведение backend

- слой service в основном просто пробрасывает вызовы
- 404 обрабатывается непоследовательно, потому что services бросают общую ошибку
- character handler может превращать отсутствие сущности в общий 500
- handlers для factions и races пытаются вернуть 404, но текущее поведение services делает эту ветку ненадежной
- request logging фактически выключен, потому что `morgan` отключен
- нет доменной бизнес-логики

### Поведение клиента

- клиент пока только показывает списки, а не документацию
- нет endpoint playground
- нет примеров на cURL / fetch / axios
- нет filter UI, кроме пагинации
- нет страницы деталей сущностей
- нет environment-based API config

### Delivery и DX

- нет tests
- нет linting
- нет CI
- нет локальной bootstrap-документации
- `git status` не удалось проверить во время анализа, потому что для текущего системного пользователя репозиторий помечен как dubious ownership

## Направление продукта

Этот проект должен стать одним из лучших учебных API для frontend и fullstack-практики.

Здесь нужно удержать баланс между двумя конкурирующими требованиями:

1. Новичок должен иметь возможность быстро собрать небольшое приложение.
2. API должен быть достаточно богатым для сложных запросов, caching, routing, dashboard и UI с множеством связей.

Правильный ответ не в том, чтобы просто сделать все огромным и сложным.

Правильный ответ такой:
- богатый домен
- единые правила
- предсказуемые формы ответов
- послойная сложность
- сильный клиент с документацией

## Принципы будущего API

### Принцип 1: простой первый запрос

Новый пользователь должен за 15-30 минут собрать что-то полезное:
- главную страницу
- список factions
- каталог characters
- страница деталей
- search
- пагинацию

### Принцип 2: глубокая реляционная модель данных

Тот же API должен потом поддерживать:
- multi-resource dashboard
- сложные filters
- explorer связанных сущностей
- compare page
- timeстрока view
- карту миров
- эксперименты с коллекциями и bookmark

### Принцип 3: единые соглашения

Каждый ресурс должен использовать общие паттерны:
- пагинация
- sort
- filtering
- `include`
- выборка полей
- блок `meta`
- error envelope

### Принцип 4: сильная документация

Клиент должен объяснять:
- какие сущности существуют
- как устроены связи
- какие filters доступны
- как комбинировать endpoint-ы
- как использовать конкурентные запросы
- как использовать caching и пагинацию

### Принцип 5: учебный реализм

API должен ощущаться как настоящий публичный сервис:
- стабильные контракты
- rate limit
- deprecation policy
- examples
- changelog
- versioning

## Рекомендуемая целевая доменная модель

Трех существующих сущностей недостаточно.

API нужно строить вокруг графа узнаваемых фактов из Warhammer 40k.

### Базовые сущности

Ключевые сущности первого большого этапа:
- `races`
- `factions`
- `characters`
- `planets`
- `sectors`
- `systems`
- `events`
- `eras`
- `units`
- `roles`
- `weapons`
- `keywords`

### Join-сущности и связи

Чтобы поддерживать действительно глубокие запросы, нужны нормализованные join table:
- `character_factions`
- `character_titles`
- `character_relationships`
- `faction_races`
- `faction_leaders`
- `event_participants`
- `event_locations`
- `planet_factions`
- `character_events`
- `unit_factions`
- `unit_keywords`
- `character_keywords`
- `weapon_keywords`

### Дополнительные продвинутые сущности

После стабилизации основы:
- `legions`
- `chapters`
- `craftworlds`
- `dynasties`
- `clans`
- `hive_fleets`
- `relics`
- `ships`
- `organizations`
- `campaigns`
- `battlefronts`
- `media_references`

### Почему эта модель работает

Она поддерживает простые приложения:
- список factions
- просмотр characters
- фильтрацию по race
- timeстрока событий

И одновременно поддерживает продвинутые приложения:
- сравнение factions по race, home sector и известным лидерам
- построение timeстрока персонажей по событиям
- получение character вместе с faction, world, allies, enemies и keywords
- запрос всех events, в которых участвовала faction в заданную era

## Рекомендуемые правила проектирования данных

### Общие поля для большинства основных сущностей

Нужно использовать единый набор полей, например:
- `id`
- `slug`
- `name`
- `summary`
- `description`
- `status`
- `image_url`
- `icon_url`
- `origin`
- `created_at`
- `updated_at`

Для lore-ориентированных сущностей, когда уместно, добавлять:
- `era_id`
- `homeworld_id`
- `faction_id`
- `race_id`
- `alignment`
- `is_playable`
- `power_level`
- `first_appearance_note`

### Жесткие правила именования

- использовать либо singular table names, либо plural table names последовательно во всей DB
- сохранять единообразие между API resource names и соглашениями DB
- если в PostgreSQL используется snake_case, а в API camelCase, это должно быть явно задокументировано
- добавить `slug` каждой публичной сущности

### Работа с неоднозначным canon

Нужно добавить метаполя там, где в лоре есть неоднозначность:
- `canon_level`
- `source_note`
- `is_approximate`

Так API не будет притворяться, что весь лор идеально чистый, но при этом сохранит структурированность данных.

### Подход к контенту с учетом copyright

Нельзя строить набор данных на копировании длинных описаний.

Нужно строить его вокруг:
- имен
- связей
- принадлежностей
- маркеров timeстрока
- коротких оригинальных описаний
- тегов и структурированных фактов

## Рекомендуемый стиль API

Нужно оставить REST и добавить к нему единые расширенные query-возможности. Не надо раньше времени переходить на GraphQL.

Причины:
- REST проще для новичков
- его проще публично документировать
- на нем проще показывать caching, пагинацию и конкурентные запросы
- его уже достаточно для сложных `include`, filtering, sort и aggregate endpoint-ов

### Рекомендуемая форма ответа

Ответ списка:

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

Ответ detail endpoint-а:

```json
{
  "data": {},
  "included": {},
  "meta": {}
}
```

Ответ с ошибкой:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": []
  }
}
```

### Рекомендуемые query-соглашения

Они должны быть мощными, но читаемыми:

- `page=1`
- `limit=20`
- `sort=name,-updatedAt`
- `search=guilliman`
- `filter[faction]=ultramarines`
- `filter[race]=human`
- `filter[era]=indomitus-crusade`
- `filter[keywords]=primarch,imperium`
- `include=faction,race,homeworld,events`
- `полеs[characters]=id,name,slug,summary`
- `полеs[factions]=id,name,slug`

### Специальные учебные endpoint-ы

Стоит добавить несколько специально спроектированных endpoint-ов для более интересных demo-сценариев:

- `/api/v1/search`
- `/api/v1/random/character`
- `/api/v1/random/faction`
- `/api/v1/compare/factions?ids=1,2`
- `/api/v1/compare/characters?ids=1,2`
- `/api/v1/timeстрока/events`
- `/api/v1/explore/graph?character=roboute-guilliman`
- `/api/v1/stats/factions/by-race`
- `/api/v1/stats/events/by-era`

Такие endpoint-ы делают API заметно интереснее, не усложняя базовый CRUD.

## Какие учебные сценарии должен поддерживать API

API нужно проектировать так, чтобы frontend-разработчик мог быстро реализовать такие упражнения.

### Базовый уровень

- пагинированный список factions
- поиск characters по имени
- страница деталей race
- маршрутизация на стороне клиента со страницей деталей
- состояния загрузки и ошибок

### Средний уровень

- фильтрация characters по faction и race
- получение списка и total для пагинации
- конкурентные запросы через `Promise.all`
- debounced search
- страница деталей с связанными сущностями
- сравнение двух factions

### Продвинутый уровень

- dashboard, который загружает factions, events и featured characters параллельно
- обозреватель графа связанных сущностей
- infinite scroll вместе с filters
- UI, полностью управляемый query string
- optimistic admin-прототип против sandbox write endpoint-ов
- SSR или предварительно сгенерированные страницы документации

## Подробный roadmap: как сделать самый крутой учебный API

Этот roadmap упорядочен так, чтобы максимизировать ценность и минимизировать лишнюю работу.

### Фаза 0: зафиксировать основу

Цель:
- сделать текущий проект воспроизводимым

Задачи:
- выбрать каноническую схема DB и закоммитить migrations
- добавить seed scripts
- добавить README по локальному запуску
- добавить version prefix `/api/v1`
- стандартизировать работу с env для сервера и клиента
- задокументировать локальные команды
- добавить базовые tests для repositories и routes

Критерии успеха:
- fresh clone можно запустить без скрытого состояния в IDE
- схема восстанавливается только из кода
- sample data существует

### Фаза 1: починить текущий прототип

Цель:
- сделать текущие сущности надежными до расширения домена

Задачи:
- привести в согласованное состояние схема для `races`, `factions`, `characters`
- решить, принадлежит ли `factions` одной race, многим races, или нужно поддерживать оба сценария через join model
- решить, должен ли `characters` хранить прямой `race_id`, или race будет выводиться из faction с возможностью явного override
- добавить валидацию на create/update
- возвращать корректный 404 для отсутствующих сущностей
- добавить единый error envelope
- добавить sort
- добавить `slug`

Рекомендуемое решение по данным:
- оставить `characters.race_id`, потому что так проще для beginner-фильтрации
- сделать поддержку связи `factions` со многими races через join table, если нужна лорная гибкость
- если нужна более простая первая версия, можно ввести `factions.primary_race_id`, а позже добавить `faction_races`

Критерии успеха:
- три существующих ресурса стабильны и хорошо задокументированы
- клиентские страницы списков могут корректно показывать filters и страницы деталей

### Фаза 2: расширить учебный домен

Цель:
- создать более богатый граф сущностей с высокой учебной ценностью

Задачи:
- добавить `planets`
- добавить `systems`
- добавить `sectors`
- добавить `events`
- добавить `eras`
- добавить `units`
- добавить `weapons`
- добавить `keywords`
- добавить relation table

Рекомендации по набору данных:
- начинать с известных, широких и переиспользуемых сущностей
- отдавать приоритет знаковым примерам из Imperium, Chaos, Aeldari, Orks, Necrons, Tyranids, T'au

Рекомендуемый объем первого большого seed-набора:
- 10-15 races/species groups
- 20-30 factions/subfactions
- 80-150 characters
- 40-80 planets и systems
- 50-100 events
- 60-120 units
- 40-80 weapons и relic-подобных сущностей

Критерии успеха:
- на одних только данных можно построить как минимум 10 разных типов frontend-упражнений

### Фаза 3: сделать querying действительно сильным

Цель:
- сделать API полезным для продвинутой frontend-практики

Задачи:
- добавить `include`
- добавить выборку полей
- добавить compound filters
- добавить full-text search или trigram search в PostgreSQL
- добавить sort по нескольким полям
- добавить aggregate/stat endpoint-ы
- добавить endpoint-ы связанных ресурсов

Примеры:
- `GET /api/v1/characters?filter[faction]=black-legion&include=faction,events`
- `GET /api/v1/events?filter[era]=horus-heresy&sort=year_start,name`
- `GET /api/v1/planets?filter[controller]=imperium&include=sector,notableCharacters`

Критерии успеха:
- API достаточно интересен для dashboard, explorer, compare tool и UI с активным search

### Фаза 4: превратить клиент в публичную документацию

Цель:
- сделать клиент лучшей точкой входа в API

Задачи:
- главная страница, объясняющая API и его назначение
- каталог сущностей
- страницы документации для каждого ресурса и endpoint-а
- интерактивный конструктор запросов
- интерактивный просмотрщик ответов
- примеры на cURL
- примеры на `fetch`
- примеры на Axios
- примеры на React/Preact
- объяснение пагинации, filtering, sort и include
- страницы с демонстрацией конкурентных запросов
- страницы с демонстрацией caching и revalidation

Рекомендуемые разделы docs client:
- Главная
- Быстрый старт
- Ресурсы
- Руководство по запросам
- Примеры
- Playground
- Changelog
- FAQ

Критерии успеха:
- frontend-разработчик понимает, как пользоваться API, только по клиенту

### Фаза 5: сделать проект похожим на настоящий публичный API

Цель:
- перейти от student project к полированной публичной учебной платформе

Задачи:
- rate limiting
- API keys для опциональной аналитики, но не как обязательное условие для базового публичного read access
- ETag и cache headers
- changelog и deprecation policy
- health endpoint
- metrics endpoint
- request ID
- logs
- CI pipeстрока
- deployment docs

Критерии успеха:
- проект выглядит и ведет себя как серьезный публичный API

## Рекомендуемый опыт использования docs client

Клиент должен объяснять API через рабочие примеры, а не только через статический текст.

### Минимальный docs UX

- каждая страница ресурса показывает поля и filters
- каждая страница endpoint-а показывает example URL
- пример ответа виден прямо на странице
- есть кнопки `copy cURL`, `copy fetch`, `copy axios`

### Наиболее полезные интерактивные возможности

- интерактивный конструктор запросов для filters, sort, include и полеs
- preset-сценарии вроде `Load dashboard data`
- пример рядом друг с другом: последовательные запросы против конкурентных
- графическое представление связей для character или faction
- страница changelog API

### Примеры документации, которые особенно стоит поддерживать

Конкурентные запросы:

```js
const [factions, characters, events] = await Promise.all([
  fetch('/api/v1/factions?limit=5').then(r => r.json()),
  fetch('/api/v1/characters?limit=5').then(r => r.json()),
  fetch('/api/v1/events?limit=5').then(r => r.json())
]);
```

Включение связанных сущностей:

```js
const response = await fetch(
  '/api/v1/characters?filter[faction]=ultramarines&include=faction,homeworld,events'
).then(r => r.json());
```

Эти примеры напрямую поддерживают цель проекта: разработка приложения поверх API не должна занимать много времени.

## Рекомендуемая стратегия реализации с точки зрения сопровождения

### Backend

Рекомендуемые структурные additions:
- `server/validators/`
- `server/errors/`
- `server/middleware/`
- `server/serializers/`
- `db/migrations/`
- `db/seeds/`
- `docs/`

Рекомендуемые технические улучшения:
- перейти на TypeScript после стабилизации схема, или
- остаться на JavaScript, но добавить строгую валидацию и генерацию OpenAPI

Рекомендуемый подход к persistence:
- оставить PostgreSQL
- сохранять высокую видимость SQL
- использовать migrations с самого начала

Raw SQL здесь допустим, если:
- запросы остаются явными
- filters централизованы
- контракты задокументированы

### Frontend

Клиент должен оставаться легким и documentation-centric:
- route на каждый раздел docs
- общие components для примеров
- переиспользуемый просмотрщик ответов
- переиспользуемый генератор code snippets
- небольшие элементы управления для playground, которые собирают query string

## Ближайшие приоритеты

Если продолжать развитие из текущего состояния репозитория, самые ценные следующие шаги такие:

1. Создать канонические migrations DB для трех существующих ресурсов.
2. Добавить seed data для знаковых races, factions и characters.
3. Нормализовать error handling и валидацию.
4. Добавить detail endpoint-ы в клиент и задокументировать текущие filters.
5. Добавить `slug`, `sort`, `search` и `include`.
6. Добавить `planets` и `events` как следующие крупные ресурсы.
7. Превратить клиент в полноценный сайт документации с examples и playground.

## Рекомендуемый первый канонический набор данных

Первая волна seed data должна оставаться узнаваемой и широкой.

Стоит использовать известные сущности, например:
- Imperium of Man
- Space Marines
- Ultramarines
- Blood Angels
- Astra Militarum
- Adepta Sororitas
- Chaos Space Marines
- Black Legion
- Death Guard
- Aeldari
- Craftworld Aeldari
- Drukhari
- Orks
- Necrons
- Tyranids
- T'au Empire

Для characters стоит брать максимально узнаваемых:
- The Emperor of Mankind
- Roboute Guilliman
- Lion El'Jonson
- Horus Lupercal
- Abaddon the Despoiler
- Ghazghkull Thraka
- Eldrad Ulthran
- Imotekh the Stormlord
- Commander Shadowsun
- Saint Celestine
- Commissar Yarrick

Для events приоритет у сущностей, полезных для временной шкалы:
- Horus Heresy
- Fall of Cadia
- Indomitus Crusade
- Third War for Armageddon
- Battle of Macragge

Для planets и systems приоритет у сущностей, которые легко переиспользовать в приложениях:
- Terra
- Mars
- Cadia
- Armageddon
- Macragge
- Fenris
- Baal
- worlds of Ultramar

## Что должны делать агенты при работе с проектом

- сохранять учебный фокус проекта
- делать API сначала простым для освоения, а уже потом хитрым
- предпочитать единые межресурсные соглашения вместо разового поведения отдельных endpoint-ов
- не прятать правила схема в IDE-файлах или локальном состоянии базы
- при добавлении lore-контента отдавать приоритет структурированным фактам и коротким оригинальным описаниям
- при добавлении новых ресурсов обновлять и server docs, и client docs
- при добавлении filters сразу документировать их в публичном клиенте

## Определение успеха

Проект можно считать успешным, когда:
- новичок может быстро собрать небольшое приложение по Warhammer
- разработчик среднего уровня может тренировать реальные паттерны интеграции с API
- продвинутый разработчик может собирать dashboard и explorer связей
- docs client объясняет использование API без внешних пояснений
- набор данных богатый, узнаваемый и юридически безопаснее, потому что строится на структурированных фактах, а не на копировании длинных текстов




