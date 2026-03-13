# Release Checklist

## Before Release

1. Verify local environment matches supported stack: Node.js 22.x and PostgreSQL 16.x.
2. Run `npm ci`.
3. Run `npm run db:setup` against a clean local database.
4. Run `npm run verify`.
5. If OpenAPI changed, run `npm run sdk:generate` and confirm `npm run sdk:check` stays green.

## API Contract

1. Smoke-test `GET /api/v1/overview`, `GET /api/v1/openapi.json`, `GET /openapi/reference`, and `GET /sdk/warhammerApiV1Client.mjs`.
2. Confirm `/api/v1` still returns `RateLimit-*` headers and `429` errors with `Retry-After`.
3. Confirm legacy `/api/*` still returns `Deprecation`, `Sunset`, and `Link` headers.
4. Re-check at least one deep relation request for each flow:
   - `compare`
   - `explore/graph`
   - `explore/path`
   - `stats`
5. Confirm `GET /api/v1/examples/workbench` and `GET /api/v1/catalog/resources` stay aligned with docs UI.

## Docs Client

1. Run `npm run build-dev`.
2. Open `/`, `/quick-start`, `/query-guide`, `/resources/factions`, `/stats`, `/compare`, `/explore/graph`, `/explore/path`, `/playground`, `/openapi`, `/openapi/reference`.
3. Verify hero actions, pivot links, and workbench cards still deep-link into prefilled flows.
4. Verify `Playground`, `Compare`, `Graph`, and `Path` still render structured `error.details`.
5. Verify the generated SDK snippet shown on `/openapi` still matches the actual exported API.

## Database and Content

1. Confirm new migrations are committed before release.
2. Confirm `db/seeds/seedLearningData.js` and `server/content/warhammerContent.js` remain consistent.
3. Re-check that content uses short original summaries instead of copied long-form lore text.

## Final Gate

1. Update `README.md` if routes, scripts, or developer workflow changed.
2. Update `SESSION_HANDOFF_2026-03-13.md` or replace it with a newer handoff if the release meaningfully shifts project state.
3. Review `git diff --stat` for accidental generated files or local-only secrets.
