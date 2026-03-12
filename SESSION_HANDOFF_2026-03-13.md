# Session Handoff - 2026-03-13

## Current Status
- Project: `warhammer-api`
- Runtime: Node.js + Express server, Preact docs-first client, PostgreSQL backend for `api/v1`
- Main public API: `/api/v1`
- Legacy API: `/api`
- Repository path: `C:\Github\warhammer-api`

## Recent Completed Work
- Added lifecycle/deprecation support for legacy `/api`, including deprecation policy and changelog endpoints/pages.
- Added rate limiting for `/api/v1` with `RateLimit-*` headers and `429 RATE_LIMIT_EXCEEDED` envelope.
- Added systematic validation for `api/v1` query parameters and consistent `VALIDATION_ERROR.details` responses.
- Brought `compare` in line with the same validation/error contract.
- Added machine-readable OpenAPI 3.1 spec at `/api/v1/openapi.json` and docs page `/openapi`.
- Added shared structured API error rendering in docs client.
- Converted interactive docs toward spec-driven behavior:
  - `Playground`
  - `Compare`
  - `Graph`
  - `Path`
  - `Stats`
  - `Resources/:resource`
- Added shared `ApiOperationGuide` with live request snippets.
- Added server-owned workbench scenarios endpoint: `GET /api/v1/examples/workbench`.
- Moved `Compare` / `Graph` / `Path` presets to server-owned docs metadata.
- Home page now renders `Workbench Flows` cards from docs metadata instead of hardcoded UI presets.
- Removed the last local `Compare -> Path` whitelist bridge and replaced it with server-owned `pathResources` metadata.

## Important Recent Fixes
### Build Fix
- Client build was failing because `preact-iso` required `preact-render-to-string`.
- Added dependency in `package.json`:
  - `preact-render-to-string: ^6.6.6`
- Result:
  - `npm run build-dev` passes
  - `npm test` passes
  - webpack still reports `21 warnings`

### Runtime DB Config Fix
- Problem seen at runtime:
  - `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`
- Root cause:
  - `server/index.js` imported `config` before `app.js` loaded `server/.env`
  - DB env values could be read before dotenv initialization
- Fix applied in `server/config.js`:
  - `server/.env` is now loaded directly inside config
  - env values are normalized via string/int readers
- Result:
  - a cold `require('./server/config')` now sees DB password as a string
  - restart of the already running server process is required after this fix

## Files Most Relevant For Next Session
### Server
- `server/config.js`
  - dotenv loading moved into config and env normalization added
- `server/content/warhammerContent.js`
  - `interactiveScenarios` lives here
  - compare scenarios now include `pathResources`
- `server/content/contentApi.js`
  - `interactiveScenarios` included in overview
  - `getInteractiveScenarios()` endpoint handler added
- `server/v1Routes.js`
  - `/examples/workbench`
- `server/content/openApiSpec.js`
  - OpenAPI spec includes `/api/v1/examples/workbench`
  - includes `WorkbenchScenariosResponse`

### Client
- `client/lib/workbenchScenarios.js`
  - parses workbench scenarios from docs API
  - builds docs deeplinks for compare/graph/path scenarios
- `client/components/ApiOperationGuide.jsx`
  - shared contract + snippet renderer
- `client/lib/openApi.js`
  - helper layer for extracting placeholders/examples/ranges from OpenAPI
- `client/pages/ComparePage.jsx`
  - uses server-owned scenarios
  - path bridge now uses `preset.pathResources`
- `client/pages/GraphPage.jsx`
  - uses workbench scenarios and spec-driven guide/snippets
- `client/pages/PathPage.jsx`
  - uses workbench scenarios
  - path length UI fixed to use `path.edges.length`
- `client/pages/Home.jsx`
  - renders `Workbench Flows` cards from docs metadata
- `client/pages/Playground.jsx`
  - contract-driven operation guide + live snippets
- `client/pages/ResourcePage.jsx`
  - list/detail preview now aligned with spec-driven helper layer
- `client/pages/Stats.jsx`
  - shows contract/snippet guide for current stats endpoint

### Tests / Docs
- `tests/api/domainApiTests.js`
  - coverage for workbench endpoint and overview metadata
- `tests/api/compareStatsApiTests.js`
  - compare behavior and sparse fieldset coverage
- `README.md`
  - updated to describe the newer docs/workbench/OpenAPI flow

## Verification State
- Verified earlier in this session:
  - `npm test` passes
  - `npm run build-dev` passes
- After the DB config fix:
  - config can be required without preloading dotenv elsewhere
  - existing running server must be restarted to pick up the new config code

## Known Non-Blocking Issues
- webpack still emits `21 warnings`
- no linting/formatter/CI yet
- sandbox/tooling in this Codex session later switched to read-only and some shell calls started failing with a sandbox setup error; future work may need escalated shell access

## Best Next Steps
1. Enrich server-owned workbench metadata with `featured`, `difficulty`, and `tags` so home/onboarding sorting is data-driven.
2. Reuse the same server-owned deeplink cards in `Quick Start` and `Query Guide`.
3. If runtime issues continue after restart, re-check effective DB env values loaded from `server/.env` and confirm the server was actually restarted after the `server/config.js` fix.
4. Optionally reduce or resolve the remaining webpack warnings.

## Resume Notes
- If starting fresh, first restart the Node server process.
- Then smoke-test:
  - `GET /api/v1/overview`
  - `GET /api/v1/catalog/resources`
  - `npm run build-dev`
  - `npm test`
- If all pass, continue from the workbench metadata/onboarding integration tasks.
