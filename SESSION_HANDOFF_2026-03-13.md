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
- Extended workbench scenarios with server-owned metadata: `featured`, `difficulty`, `tags`.
- Added shared client parsing/selection helpers for workbench scenarios and a reusable `WorkbenchScenarioSection`.
- `Home`, `Quick Start`, and `Query Guide` now all render workbench deeplink cards from the same server-owned metadata contract.
- `Stats` and `Resources/:resource` now also render related workbench flows selected by normalized `relatedResources` metadata from the shared client helper layer.
- `Stats` and `Resources/:resource` now also expose prefilled pivot links into detail, filtered list, graph, compare and path flows through shared workbench pivot helpers.
- `Stats` hero cards and `Resources/:resource` hero panel now also expose prefilled docs actions, so summary blocks are no longer dead ends.
- `Stats` chart cards and ranking section headers now also expose the same pivot-action layer.
- Client Sass warnings were removed by fixing local slash-division / import usage and silencing third-party Bootstrap deprecation noise in `sass-loader`.
- Added lightweight client-helper tests for generated workbench pivot hrefs without introducing a separate frontend test runner.
- Added local Swagger UI reference page at `/openapi/reference` served from Express with local `swagger-ui-dist` assets.
- Refined OpenAPI schemas for `IncludedResources`, `GraphResponse`, `PathResponse` and `StatsResponse` so the contract is less generic and more codegen-friendly.
- Added generated ESM SDK workflow:
  - `scripts/generateSdk.js`
  - committed artifact `sdk/warhammerApiV1Client.mjs`
  - `npm run sdk:generate`
  - `npm run sdk:check`
  - static runtime delivery at `/sdk/warhammerApiV1Client.mjs`
  - integration tests that call live API through the generated client
- Added delivery tooling baseline:
  - `eslint.config.js`
  - `.prettierrc.json` + `.prettierignore`
  - `.editorconfig`
  - `npm run lint`, `npm run format:check`, `npm run verify`
  - GitHub Actions CI workflow with PostgreSQL service
  - `RELEASE_CHECKLIST.md`
- Ran Prettier across the repo to establish a passing formatting baseline for CI.

## Important Recent Fixes

### Build Fix

- Client build was failing because `preact-iso` required `preact-render-to-string`.
- Added dependency in `package.json`:
  - `preact-render-to-string: ^6.6.6`
- Result:
  - `npm run build-dev` passes
  - `npm test` passes
  - webpack now compiles cleanly without warnings

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
  - now has explicit schemas for graph/path/stats/included payloads
- `server/app.js`
  - now serves `/openapi/reference`
  - exposes local Swagger UI static assets
  - now also serves `/sdk/*`
- `scripts/generateSdk.js`
  - builds the generated ESM client from the current OpenAPI spec
- `sdk/warhammerApiV1Client.mjs`
  - generated runtime client with `createWarhammerApiClient`, `operations`, `WarhammerApiError`

### Client

- `client/lib/workbenchScenarios.js`
  - parses workbench scenarios from docs API
  - builds docs deeplinks for compare/graph/path scenarios
  - now also flattens, sorts and selects scenarios by `featured`, `difficulty`, `tags`, `groupLimit`
  - each parsed scenario now carries normalized `relatedResources`
- `client/lib/workbenchPivots.js`
  - shared helpers for prefilled docs pivot links from live entities and stats rows
- `client/lib/resourceDocs.js`
  - shared deep-link builders for resource docs states and hero actions
- `client/components/PivotActionLinks.jsx`
  - reusable renderer for action links under stats/resource cards
- `client/components/WorkbenchScenarioSection.jsx`
  - shared renderer for workbench deeplink cards across onboarding/docs pages
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
  - renders `Workbench Flows` cards from docs metadata using shared selection/rendering
- `client/pages/QuickStart.jsx`
  - now shows starter workbench flows selected from server metadata
- `client/pages/QueryGuide.jsx`
  - now loads workbench scenarios alongside query guide content and shows metadata-selected live query patterns
- `client/pages/Stats.jsx`
  - now shows related workbench flows for the current stats focus/resource set
  - now renders prefilled pivot links per stats row
  - hero summary cards now also render prefilled pivot links
  - chart cards and section headers now also render prefilled pivot links
- `client/pages/ResourcePage.jsx`
  - now shows related workbench flows for the current resource page
  - now renders prefilled pivot links from preview/detail cards
  - hero panel now links directly into list/detail/workbench flows
- `client/pages/OpenApiPage.jsx`
  - links to the local interactive reference viewer
  - now also links to the generated SDK module and shows direct usage snippet
- `client/components/Menu.jsx`
  - now links to `/openapi/reference`
- `eslint.config.js`
  - ESLint flat config for client/server/tests with Babel parser and JSX handling
- `.github/workflows/ci.yml`
  - GitHub Actions pipeline for Postgres-backed `db:setup` + `verify`
- `RELEASE_CHECKLIST.md`
  - manual pre-release smoke-test sequence
- `server/static/openapi-reference/*`
  - local Swagger UI shell, init script and theme overrides
- `tests/client/loadClientModule.js`
  - Babel-based loader for testing client ES modules under Node
- `tests/client/workbenchPivotsTests.js`
  - verifies generated hrefs for entity/stats/resource hero actions and scenario selection
- `tests/client/generatedSdkTests.js`
  - verifies static SDK delivery, generated operations metadata, query serialization and error handling
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
- Verified after the latest onboarding/workbench metadata cycle:
  - `npm test` passes
  - `npm run build-dev` passes
- Verified after the latest stats/resources workbench cycle:
  - `npm test` passes
  - `npm run build-dev` passes
- Verified after the latest pivot-actions + Sass cleanup cycle:
  - `npm test` passes
  - `npm run build-dev` passes
  - webpack compiles without warnings
- Verified after the latest hero-actions + client-helper tests cycle:
  - `npm test` passes
  - `npm run build-dev` passes
  - client helper href generation is covered by tests
- Verified after the latest reference-viewer + OpenAPI refinement cycle:
  - `npm install swagger-ui-dist@5.17.14` completed
  - `npm run build-dev` passes
  - `npm test` passes
  - `/openapi/reference` is covered by integration tests
  - OpenAPI response schemas are more explicit for traversal and stats payloads
- Verified after the delivery/tooling cycle:
  - `npm run lint` passes
  - `npm run format:check` passes
  - `npm run verify` passes
  - GitHub Actions workflow is present and mirrors the same local verification path
- Verified after the generated SDK cycle:
  - `npm run sdk:generate` passes
  - `npm run sdk:check` passes
  - `npm run verify` passes
  - `/sdk/warhammerApiV1Client.mjs` is served by Express and covered by tests
  - generated client works with both host-only `baseUrl` and `.../api/v1` baseUrl
- After the DB config fix:
  - config can be required without preloading dotenv elsewhere
  - existing running server must be restarted to pick up the new config code

## Known Non-Blocking Issues

- npm audit still reports 17 vulnerabilities after dependency updates
- repo now has a formatting baseline, so future diffs should avoid ad hoc style churn and stick to `npm run format`

## Best Next Steps

1. If runtime issues continue after restart, re-check effective DB env values loaded from `server/.env` and confirm the server was actually restarted after the `server/config.js` fix.
2. The previous docs-first wave is effectively complete; the next product expansion can move to legacy `/api` parity docs, route-specific rate limits, or SDK type declarations/examples beyond the current ESM client.
3. If delivery hardening continues, the next logical layer is vulnerability cleanup, optional lint rule tightening, and branch protection wired to the new CI workflow.

## Resume Notes

- If starting fresh, first restart the Node server process.
- Then smoke-test:
  - `GET /api/v1/overview`
  - `GET /api/v1/catalog/resources`
  - `npm run build-dev`
  - `npm test`
- If all pass, continue from a new planning phase rather than the previous docs-first stabilization thread.
