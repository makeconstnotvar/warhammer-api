import { docsApi } from "../api/docsApi";
import { CodeBlock } from "../components/CodeBlock";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import { useAsyncData } from "../hooks/useAsyncData";

const legacyResources = [
  {
    key: "factions",
    label: "Factions",
    listPath: "/api/factions",
    detailPath: "/api/factions/{id}",
    replacement: "/api/v1/factions",
  },
  {
    key: "characters",
    label: "Characters",
    listPath: "/api/characters",
    detailPath: "/api/characters/{id}",
    replacement: "/api/v1/characters",
  },
  {
    key: "races",
    label: "Races",
    listPath: "/api/races",
    detailPath: "/api/races/{id}",
    replacement: "/api/v1/races",
  },
];

function countOperations(paths) {
  return Object.values(paths || {}).reduce(
    (total, pathItem) =>
      total +
      Object.keys(pathItem || {}).filter((method) =>
        ["get", "post", "put", "delete"].includes(method)
      ).length,
    0
  );
}

function LegacyApiPage() {
  const { data, loading, error } = useAsyncData(
    () =>
      Promise.all([docsApi.getLegacyOpenApiSpec(), docsApi.getDeprecationPolicy()]).then(
        ([spec, policy]) => ({
          spec,
          policy,
        })
      ),
    []
  );
  const spec = data?.spec;
  const policy = data?.policy?.data;
  const pathCount = Object.keys(spec?.paths || {}).length;
  const operationCount = countOperations(spec?.paths);
  const deprecatedCount = Object.values(spec?.paths || {}).reduce(
    (total, pathItem) =>
      total +
      Object.values(pathItem || {}).filter((operation) => operation?.deprecated === true).length,
    0
  );
  const headerSnippet = policy
    ? ["HTTP/1.1 200 OK", ...policy.headers.map((header) => header.example)].join("\n")
    : "";

  if (loading) {
    return <StateNotice>Загрузка legacy contract...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Legacy API</div>
          <h1>Deprecated CRUD surface описан как отдельный контракт, а не как побочный эффект</h1>
          <p className="page-lead">
            `/api/openapi.json` фиксирует старый CRUD-слой для `races`, `factions` и `characters`.
            Он нужен для миграции, сверки deprecation headers и старых CRUD-учебных сценариев, но
            основная публичная поверхность уже живет под `/api/v1`.
          </p>
          <div className="hero-actions">
            <a className="action-link" href="/legacy/reference">
              Открыть Legacy Reference
            </a>
            <a className="action-link action-link-muted" href="/api/openapi.json">
              Raw legacy spec
            </a>
            <a className="action-link action-link-muted" href="/deprecation-policy">
              Deprecation policy
            </a>
            <a className="action-link action-link-muted" href="/openapi">
              Primary `/api/v1` contract
            </a>
          </div>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{pathCount} paths</div>
          <div className="metric-chip">{operationCount} operations</div>
          <div className="metric-chip">{deprecatedCount} deprecated ops</div>
          <div className="metric-chip">sunset: 2026-09-30</div>
        </div>
      </section>

      <div className="panel-grid">
        <section className="stat-card">
          <div className="section-eyebrow">Scope</div>
          <div className="stat-value">3 resources</div>
          <p>Legacy surface ограничен `races`, `factions` и `characters` с классическим CRUD.</p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Migration</div>
          <div className="stat-value">read-first</div>
          <p>
            Для чтения есть прямые `/api/v1` replacement paths. Новые include, search и docs живут
            только там.
          </p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Writes</div>
          <div className="stat-value">legacy-only</div>
          <p>
            `POST`, `PUT` и `DELETE` остаются только в старом CRUD-слое и документируются как legacy
            behavior без обещаний parity с `/api/v1`.
          </p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Headers</div>
          <div className="stat-value">runtime</div>
          <p>
            Все ответы под `/api` продолжают отдавать `Deprecation`, `Sunset` и `Link`, чтобы
            клиенты не теряли контекст миграции.
          </p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Errors</div>
          <div className="stat-value">400 / 404</div>
          <p>
            Legacy handlers теперь валидируют `id`, pagination и basic write payload заранее и
            возвращают явные `400` с `details`, а missing records стабильно отвечают `404`.
          </p>
        </section>
      </div>

      <section className="section-card">
        <h2>Supported surface</h2>
        <div className="policy-grid">
          {legacyResources.map((resource) => {
            const listOperation = spec.paths?.[resource.listPath]?.get;
            const filters = (listOperation?.parameters || [])
              .filter(
                (parameter) =>
                  parameter.in === "query" && !["page", "limit"].includes(parameter.name)
              )
              .map((parameter) => parameter.name);

            return (
              <article key={resource.key} className="policy-card">
                <div className="policy-card-head">
                  <div>
                    <div className="section-eyebrow">legacy resource</div>
                    <h3>{resource.label}</h3>
                  </div>
                  <div className="tag-list">
                    <span className="tag">GET list</span>
                    <span className="tag">GET detail</span>
                    <span className="tag">POST / PUT / DELETE</span>
                  </div>
                </div>
                <a className="query-link" href={resource.listPath}>
                  {resource.listPath}
                </a>
                <a className="query-link" href={resource.replacement}>
                  {resource.replacement}
                </a>
                <p>
                  {listOperation?.description ||
                    "Deprecated CRUD read endpoint documented as a migration aid."}
                </p>
                <div className="tag-list">
                  <span className="tag">detail: {resource.detailPath}</span>
                  {filters.length ? (
                    <span className="tag">filters: {filters.join(", ")}</span>
                  ) : (
                    <span className="tag">filters: none beyond pagination</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-card">
        <h2>Read migration targets</h2>
        <div className="policy-grid">
          {policy.legacyEndpoints.map((endpoint) => (
            <article key={`${endpoint.method}-${endpoint.path}`} className="policy-card">
              <div className="policy-card-head">
                <div>
                  <div className="section-eyebrow">replacement</div>
                  <h3>
                    {endpoint.method} {endpoint.path}
                  </h3>
                </div>
                <div className="tag-list">
                  <span className="tag">deprecated: {endpoint.deprecatedOn}</span>
                  <span className="tag">sunset: {endpoint.sunsetOn}</span>
                </div>
              </div>
              <p>{endpoint.summary}</p>
              <a className="query-link" href={endpoint.replacement}>
                {endpoint.replacement}
              </a>
            </article>
          ))}
        </div>
      </section>

      <div className="panel-grid">
        <CodeBlock label="legacy read">{`curl -i "http://localhost:3000/api/characters?page=1&limit=10&name=guilliman"`}</CodeBlock>
        <CodeBlock label="preferred v1 read">{`curl -i "http://localhost:3000/api/v1/characters?search=guilliman&include=faction,race&limit=10"`}</CodeBlock>
        <CodeBlock label="legacy response headers">{headerSnippet}</CodeBlock>
        <CodeBlock label="legacy validation error">{`HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid request parameters",
  "details": [
    {
      "field": "id",
      "code": "INVALID_POSITIVE_INTEGER",
      "message": "Parameter \\"id\\" must be a positive integer",
      "value": "not-a-number"
    }
  ]
}`}</CodeBlock>
      </div>

      <section className="section-card">
        <h2>Raw endpoint</h2>
        <a className="query-link" href="/api/openapi.json">
          /api/openapi.json
        </a>
        <p className="muted-line">
          Спецификация отдается без docs-envelope и описывает текущий legacy runtime как отдельную
          deprecated surface рядом с основным `/api/v1` контрактом.
        </p>
      </section>

      <JsonViewer label="Legacy OpenAPI JSON" data={spec} />
    </div>
  );
}

export { LegacyApiPage };
