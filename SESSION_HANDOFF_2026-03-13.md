# Session Handoff - 2026-03-13

## Current Status

- Project: `warhammer-api`
- Main public API: `/api/v1`
- Product target: one public API, docs-first client, generated SDK, PostgreSQL-backed content graph
- Repository path: `C:\Github\warhammer-api`

## One-API State

- `/api/v1` is the only public API contract.
- Old `/api/*` routes are not served and return `410 LEGACY_API_REMOVED` with a pointer to `/api/v1`.
- Old docs aliases remain only as redirects:
  - `/legacy-api` -> `/openapi`
  - `/legacy/reference` -> `/openapi/reference`
- Legacy CRUD handlers, services, repositories, models, spec files and legacy docs page were removed from the active repo tree.

## Latest Completed Cycle

- Physically removed the old legacy surface from the repo:
  - deleted legacy CRUD handlers/services/repositories/models
  - deleted `server/routes.js`
  - deleted `server/content/legacyOpenApiSpec.js`
  - deleted `server/lib/legacyApi.js`
  - deleted `server/middleware/legacyDeprecationHeaders.js`
  - deleted `client/pages/LegacyApiPage.jsx`
  - deleted `server/static/openapi-reference/legacy-index.html`
  - deleted `tests/api/legacyApiTests.js`
- Updated `README.md` to describe the actual one-API runtime state instead of transitional cleanup language.
- Updated `API_TARGET.md` so the one-API consolidation is recorded as current state, not future intent.
- Extended `tests/api/domainApiTests.js` so removed `/api` routes are covered both for resource paths and the removed legacy spec path `/api/openapi.json`.

## Product Surface That Exists Now

- Resource reads: `GET /api/v1/{resource}`, `GET /api/v1/{resource}/{idOrSlug}`, `GET /api/v1/random/{resource}`
- Query power: `page`, `limit`, `sort`, `search`, `filter[...]`, `include`, `fields[...]`
- Exploration: `search`, `compare`, `explore/graph`, `explore/path`, `stats`
- Docs/contract: `overview`, `catalog/resources`, `query-guide`, `changelog`, `deprecation-policy`, `examples/concurrency`, `examples/workbench`, `openapi.json`
- Docs client pages: `Home`, `Quick Start`, `Resources`, `Query Guide`, `OpenAPI`, `Changelog`, `Deprecation Policy`, `Stats`, `Compare`, `Graph`, `Path`, `Playground`, `Concurrency`
- Generated SDK assets:
  - `/sdk/warhammerApiV1Client.mjs`
  - `/sdk/warhammerApiV1Client.d.ts`
  - package export `warhammer-api/sdk`

## Key Files After Consolidation

### Server

- `server/app.js`
  - mounts only `/api/v1`
  - returns `410 LEGACY_API_REMOVED` for `/api/*`
  - serves `/openapi/reference` and generated SDK assets
- `server/v1Routes.js`
  - canonical public route tree
- `server/content/contentApi.js`
  - docs/data handlers for `api/v1`
- `server/content/openApiSpec.js`
  - machine-readable contract for `/api/v1`
- `server/content/apiLifecycle.js`
  - changelog and deprecation policy for the single public API
- `scripts/generateSdk.js`
  - generates SDK runtime module and `.d.ts`

### Client

- `client/pages/OpenApiPage.jsx`
  - links to the one active spec, reference viewer and generated SDK
- `client/components/Menu.jsx`
  - no legacy docs navigation
- `client/router.js`
  - no legacy docs route
- `client/lib/workbenchScenarios.js`
  - shared server-owned scenario parsing and selection
- `client/lib/workbenchPivots.js`
  - shared deep-link builders for stats/resource pivots

### Tests / Docs

- `tests/api/domainApiTests.js`
  - covers lifecycle docs, OpenAPI, workbench metadata, `/api` removal behavior and current docs aliases
- `tests/client/generatedSdkTests.js`
  - covers generated SDK delivery and runtime behavior
- `README.md`
  - current local setup and active surface
- `API_TARGET.md`
  - canonical product target and final shape of the API

## Verification

- `npm run verify` passes after the one-API cleanup.
- Confirmed in that run:
  - `lint`
  - `format:check`
  - `sdk:check`
  - `build-dev`
  - `test`
- Additional confirmations from the same run:
  - webpack compiled successfully
  - `/api/factions` returns `410 LEGACY_API_REMOVED`
  - `/api/openapi.json` returns `410 LEGACY_API_REMOVED`
  - `/legacy/reference` and `/legacy-api` redirect to current docs

## Next Sensible Tracks

1. Continue growing only `/api/v1`: richer resources, filters, examples and traversal use-cases.
2. Improve generated SDK packaging if separate distribution becomes necessary.
3. Tighten product docs around canonical learning flows: `Quick Start -> Resources -> Playground -> Compare/Graph/Stats`.

## Resume Notes

- First smoke tests after opening the repo:
  - `npm run build-dev`
  - `npm test`
  - `GET /api/v1/overview`
  - `GET /api/v1/openapi.json`
  - `GET /api/factions` should return `410`
- If all pass, continue feature work only under `/api/v1`.
