import { docsApi } from "../api/docsApi";
import { CodeBlock } from "../components/CodeBlock";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import { useAsyncData } from "../hooks/useAsyncData";

function OpenApiPage() {
  const { data: spec, loading, error } = useAsyncData(
    () => docsApi.getOpenApiSpec(),
    [],
  );
  const pathCount = Object.keys(spec?.paths || {}).length;
  const schemaCount = Object.keys(spec?.components?.schemas || {}).length;
  const parameterCount = Object.keys(spec?.components?.parameters || {}).length;

  if (loading) {
    return <StateNotice>Загрузка OpenAPI spec...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">OpenAPI</div>
          <h1>Машиночитаемый контракт для SDK, mock server и contract diff</h1>
          <p className="page-lead">
            `/api/v1/openapi.json` фиксирует публичную поверхность API в
            формате OpenAPI 3.1. Это уже не только human docs, а база для
            codegen, регрессионных проверок и интеграционных клиентов.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{spec.openapi}</div>
          <div className="metric-chip">{pathCount} paths</div>
          <div className="metric-chip">{schemaCount} schemas</div>
          <div className="metric-chip">{parameterCount} params</div>
        </div>
      </section>

      <div className="panel-grid">
        <section className="stat-card">
          <div className="section-eyebrow">Contract Use</div>
          <div className="stat-value">SDK</div>
          <p>
            Генерируй typed client и не держи query-параметры, enums и error
            shapes в нескольких местах вручную.
          </p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Contract Use</div>
          <div className="stat-value">Mocking</div>
          <p>
            Поднимай mock server для frontend-разработки без локальной базы и
            без ручной поддержки fixture-сценариев.
          </p>
        </section>
        <section className="stat-card">
          <div className="section-eyebrow">Contract Use</div>
          <div className="stat-value">Diffing</div>
          <p>
            Сравнивай spec между релизами и отслеживай breaking changes рядом с
            changelog, а не постфактум по баг-репортам.
          </p>
        </section>
      </div>

      <section className="section-card">
        <h2>Raw endpoint</h2>
        <a className="query-link" href="/api/v1/openapi.json">
          /api/v1/openapi.json
        </a>
        <p className="muted-line">
          Спецификация отдается как обычный JSON без docs-envelope, чтобы ее
          могли напрямую читать generators и tooling.
        </p>
      </section>

      <div className="panel-grid">
        <CodeBlock label="openapi-typescript">{`npx openapi-typescript http://localhost:3000/api/v1/openapi.json -o client/generated/warhammer-api.d.ts`}</CodeBlock>
        <CodeBlock label="fetch spec">{`const spec = await fetch('/api/v1/openapi.json').then((response) => response.json());\nconst compareOperation = spec.paths['/api/v1/compare/{resource}'].get;`}</CodeBlock>
      </div>

      <section className="section-card">
        <h2>Что уже описано</h2>
        <div className="tag-list">
          <span className="tag">list/detail/random</span>
          <span className="tag">search</span>
          <span className="tag">compare</span>
          <span className="tag">explore/graph</span>
          <span className="tag">explore/path</span>
          <span className="tag">stats</span>
          <span className="tag">rate limit headers</span>
          <span className="tag">validation envelope</span>
        </div>
      </section>

      <JsonViewer label="OpenAPI JSON" data={spec} />
    </div>
  );
}

export { OpenApiPage };
