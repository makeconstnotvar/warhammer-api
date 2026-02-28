# Warhammer 40K API

Учебный проект с двумя слоями:

- `api/v1` - богатый read API на PostgreSQL и публичная документация через клиент
- `/api` - старый CRUD-слой для `races`, `factions`, `characters`

## Что уже есть

- клиент-документация на Preact
- `api/v1` с `overview`, `catalog/resources`, `query-guide`, `search`, `examples/concurrency`
- каноническая схема PostgreSQL для `eras`, `races`, `planets`, `factions`, `characters`, `events`
- seed-набор данных по известным сущностям Warhammer 40k
- `api/v1` читает данные из PostgreSQL, а `server/content/warhammerContent.js` используется как источник сидов и docs-метаданных

## Быстрый старт

Нужен PostgreSQL и заполненный `server/.env`.

```bash
npm install
npm run db:setup
npm run build-dev
npm run server
```

В отдельном окне:

```bash
npm run client-watch
```

## Scripts

- `npm run db:migrate` - применить migrations
- `npm run db:seed` - перезаписать учебные данные
- `npm run db:setup` - миграции + сиды
- `npm run build-dev` - собрать клиент
- `npm run server` - запустить Express
- `npm run client-watch` - запустить клиент в watch-режиме

## Ключевые маршруты

- `GET /api/v1/overview`
- `GET /api/v1/catalog/resources`
- `GET /api/v1/query-guide`
- `GET /api/v1/search?search=cadia`
- `GET /api/v1/characters?include=faction,race,homeworld,events`
- `GET /api/v1/units?include=factions,weapons,keywords`
- `GET /api/v1/weapons?include=faction,era,keywords`
- `GET /api/v1/keywords?filter[category]=weapon-profile`
- `GET /api/v1/examples/concurrency`
- `GET /api/v1/random/character?include=faction,race,homeworld`
- `GET /api/v1/random/unit?include=factions,weapons,keywords`
- `GET /api/v1/compare/factions?ids=imperium-of-man,black-legion&include=races,leaders,homeworld`
- `GET /api/v1/compare/units?ids=terminator-squad,intercessor-squad&include=factions,weapons,keywords`
- `GET /api/v1/stats/factions/by-race`
- `GET /api/v1/stats/events/by-era`

Поиск `GET /api/v1/search` сейчас ранжирует результаты по релевантности: точный `slug` и `name` выше частичных совпадений по `summary` и `description`.

## Структура

- `server/content/` - учебный набор данных и логика `api/v1`
- `db/migrations/` - каноническая схема
- `db/seeds/` - заполнение базы учебными данными
- `client/` - публичная документация API
- `agents.md` - контекст для ИИ-агентов
