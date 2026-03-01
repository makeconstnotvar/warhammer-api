# Warhammer 40K API

Учебный проект с двумя слоями:

- `api/v1` - богатый read API на PostgreSQL и публичная документация через клиент
- `/api` - старый CRUD-слой для `races`, `factions`, `characters`

## Что уже есть

- клиент-документация на Preact
- `api/v1` с `overview`, `catalog/resources`, `query-guide`, `search`, `explore/graph`, `explore/path`, `examples/concurrency`
- docs-клиент со страницами `Quick Start`, `Resources`, `Query Guide`, `Stats`, `Compare`, `Graph`, `Path`, `Playground`, `Concurrency`
- каноническая схема PostgreSQL для `eras`, `races`, `planets`, `factions`, `characters`, `events`
- домен расширен ресурсами `organizations`, `relics`, `campaigns`, `star-systems`, `battlefields`, `fleets`, `warp-routes`
- seed-набор данных по известным сущностям Warhammer 40k
- `api/v1` читает данные из PostgreSQL, а `server/content/warhammerContent.js` используется как источник сидов и docs-метаданных
- `Stats`, `Compare`, `Graph`, `Path`, `Playground` и `Resources/:resource` поддерживают deep-linking через query params
- `Stats` теперь показывает SVG charts поверх живых stats endpoint-ов
- `Compare` теперь показывает visual bars, shared overlaps и быстрые переходы в `detail` и `graph`
- `Compare` теперь умеет открывать `Path` между двумя сравниваемыми записями с уже подготовленным whitelist ресурсов
- `Graph` теперь поддерживает selection узлов, фокус на связях и быстрый переход в `Compare`
- `Graph` и `Path` поддерживают `resources=...`, чтобы ограничивать шумные типы узлов
- `Path` показывает кратчайшую цепочку между двумя сущностями и объясняет traversal через relation graph

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
- `npm test` - прогнать integration tests для `explore`, `compare`, `stats` и новых доменных ресурсов
- `npm run server` - запустить Express
- `npm run client-watch` - запустить клиент в watch-режиме

## Ключевые маршруты

- `GET /api/v1/overview`
- `GET /api/v1/catalog/resources`
- `GET /api/v1/query-guide`
- `GET /api/v1/search?search=cadia`
- `GET /api/v1/characters?include=faction,race,homeworld,events`
- `GET /api/v1/units?include=factions,weapons,keywords`
- `GET /api/v1/organizations?include=factions,leaders,homeworld`
- `GET /api/v1/star-systems?include=planets,era`
- `GET /api/v1/warp-routes?include=fromStarSystem,toStarSystem,factions,campaigns`
- `GET /api/v1/weapons?include=faction,era,keywords`
- `GET /api/v1/relics?include=faction,bearer,originPlanet,keywords`
- `GET /api/v1/keywords?filter[category]=weapon-profile`
- `GET /api/v1/fleets?include=factions,commanders,campaigns,currentStarSystem,homePort`
- `GET /api/v1/campaigns?include=era,planets,factions,characters,organizations`
- `GET /api/v1/battlefields?include=planet,starSystem,era,factions,characters,campaigns`
- `GET /api/v1/examples/concurrency`
- `GET /api/v1/random/character?include=faction,race,homeworld`
- `GET /api/v1/random/unit?include=factions,weapons,keywords`
- `GET /api/v1/compare/factions?ids=imperium-of-man,black-legion&include=races,leaders,homeworld`
- `GET /api/v1/compare/organizations?ids=inquisition,adeptus-mechanicus&include=factions,leaders,homeworld,era`
- `GET /api/v1/compare/relics?ids=emperors-sword,talon-of-horus&include=faction,bearer,originPlanet,era,keywords`
- `GET /api/v1/compare/units?ids=terminator-squad,intercessor-squad&include=factions,weapons,keywords`
- `GET /api/v1/compare/campaigns?ids=plague-wars,cadian-gate-counteroffensive&include=era,planets,factions,characters,organizations,battlefields`
- `GET /api/v1/compare/star-systems?ids=sol-system,macragge-system&include=planets,era`
- `GET /api/v1/compare/battlefields?ids=hesperon-void-line,kasr-partox-ruins&include=planet,starSystem,era,factions,characters,campaigns`
- `GET /api/v1/explore/graph?resource=factions&identifier=imperium-of-man&depth=2&limitPerRelation=4`
- `GET /api/v1/explore/graph?resource=factions&identifier=imperium-of-man&depth=2&limitPerRelation=4&resources=campaigns,characters`
- `GET /api/v1/explore/path?fromResource=characters&fromIdentifier=roboute-guilliman&toResource=relics&toIdentifier=emperors-sword&maxDepth=3&limitPerRelation=6&backlinks=true`
- `GET /api/v1/explore/path?fromResource=relics&fromIdentifier=emperors-sword&toResource=campaigns&toIdentifier=plague-wars&maxDepth=4&limitPerRelation=6&backlinks=true&resources=factions`
- `GET /api/v1/stats/factions/by-race`
- `GET /api/v1/stats/units/by-faction`
- `GET /api/v1/stats/weapons/by-keyword`
- `GET /api/v1/stats/relics/by-faction`
- `GET /api/v1/stats/campaigns/by-organization`
- `GET /api/v1/stats/battlefields/by-faction`
- `GET /api/v1/stats/star-systems/by-segmentum`
- `GET /api/v1/stats/events/by-era`

Поиск `GET /api/v1/search` сейчас ранжирует результаты по релевантности: точный `slug` и `name` выше частичных совпадений по `summary` и `description`.
`GET /api/v1/stats/events/by-era` теперь также возвращает `yearLabel` и `yearOrder`, чтобы клиент мог строить timeline charts по эрам.
`npm test` поднимает приложение на временном порту и прогоняет HTTP integration tests для `explore/graph`, `explore/path`, `compare`, `stats`, `star-systems`, `battlefields`, `fleets`, `warp-routes` и `campaigns -> battlefields` на реальной PostgreSQL.

## Shareable docs links

- `/stats?focus=weapons-by-keyword`
- `/compare?resource=units&ids=terminator-squad,intercessor-squad&include=factions,weapons,keywords`
- `/compare?resource=star-systems&ids=sol-system,macragge-system&include=planets,era`
- `/compare?resource=battlefields&ids=hesperon-void-line,kasr-partox-ruins&include=planet,starSystem,era,factions,characters,campaigns`
- `/explore/graph?resource=characters&identifier=roboute-guilliman&depth=2&limitPerRelation=4&backlinks=true`
- `/explore/graph?resource=star-systems&identifier=sol-system&depth=2&limitPerRelation=4&backlinks=true`
- `/explore/graph?resource=fleets&identifier=indomitus-battlegroup&depth=2&limitPerRelation=4&backlinks=true`
- `/explore/graph?resource=factions&identifier=imperium-of-man&depth=2&limitPerRelation=4&resources=campaigns,characters&selected=factions:1,characters:2&focus=characters:2`
- `/explore/path?fromResource=campaigns&fromIdentifier=plague-wars&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=2&limitPerRelation=6&backlinks=true`
- `/explore/path?fromResource=fleets&fromIdentifier=indomitus-battlegroup&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=3&limitPerRelation=6&backlinks=true&resources=campaigns,battlefields`
- `/explore/path?fromResource=relics&fromIdentifier=emperors-sword&toResource=campaigns&toIdentifier=plague-wars&maxDepth=4&limitPerRelation=6&backlinks=true&resources=factions`
- `/playground?resource=characters&search=guilliman&limit=6&sort=-powerLevel,name&include=faction,race&filterKey=faction&filterValue=ultramarines`
- `/resources/relics?mode=list&limit=5&sort=-powerLevel,name&include=faction,bearer,originPlanet,keywords`
- `/resources/characters?mode=detail&identifier=roboute-guilliman&include=faction,race,homeworld,events`

## Структура

- `server/app.js` - фабрика Express-приложения для runtime и integration tests
- `server/content/` - учебный набор данных и логика `api/v1`
- `db/migrations/` - каноническая схема
- `db/seeds/` - заполнение базы учебными данными
- `tests/` - integration tests для публичного `api/v1`
- `client/` - публичная документация API
- `agents.md` - контекст для ИИ-агентов
