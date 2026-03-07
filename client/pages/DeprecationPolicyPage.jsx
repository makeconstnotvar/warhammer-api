import { docsApi } from '../api/docsApi';
import { CodeBlock } from '../components/CodeBlock';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function DeprecationPolicyPage() {
  const { data, loading, error } = useAsyncData(() => docsApi.getDeprecationPolicy(), []);
  const policy = data?.data;
  const headerSnippet = policy
    ? [
        'HTTP/1.1 200 OK',
        ...policy.headers.map((header) => header.example),
      ].join('\n')
    : '';

  if (loading) {
    return <StateNotice>Загрузка deprecation policy...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Deprecation Policy</div>
          <h1>Legacy-маршруты должны предупреждать, а не удивлять</h1>
          <p className="page-lead">{policy.summary}</p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{policy.legacyEndpoints.length} legacy route-а</div>
          <div className="metric-chip">migration window: 90+ дней</div>
          <div className="metric-chip">runtime headers включены</div>
        </div>
      </section>

      <div className="panel-grid">
        {policy.guarantees.map((item) => (
          <section key={item} className="stat-card">
            <div className="section-eyebrow">Guarantee</div>
            <div className="stat-value">Stable rule</div>
            <p>{item}</p>
          </section>
        ))}
      </div>

      <section className="section-card">
        <h2>Lifecycle</h2>
        <div className="step-list">
          {policy.lifecycle.map((phase, index) => (
            <article key={phase.phase} className="step-card">
              <div className="step-index">0{index + 1}</div>
              <div>
                <h3>{phase.phase}</h3>
                <p>{phase.description}</p>
                <div className="tag-list">
                  <span className="tag">{phase.window}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <h2>Runtime headers</h2>
        <div className="mini-table">
          <div className="mini-table-head">
            <span>Header</span>
            <span>Пример</span>
            <span>Назначение</span>
          </div>
          {policy.headers.map((header) => (
            <div key={header.name} className="mini-table-row">
              <span>{header.name}</span>
              <span>{header.example}</span>
              <span>{header.description}</span>
            </div>
          ))}
        </div>
      </section>

      <CodeBlock label="Пример ответа legacy endpoint-а">{headerSnippet}</CodeBlock>

      <section className="section-card">
        <h2>Пути миграции</h2>
        <div className="policy-grid">
          {policy.legacyEndpoints.map((endpoint) => (
            <article key={`${endpoint.method}-${endpoint.path}`} className="policy-card">
              <div className="policy-card-head">
                <div>
                  <div className="section-eyebrow">{endpoint.status}</div>
                  <h3>{endpoint.method} {endpoint.path}</h3>
                </div>
                <div className="tag-list">
                  <span className="tag">deprecated: {endpoint.deprecatedOn}</span>
                  <span className="tag">sunset: {endpoint.sunsetOn}</span>
                </div>
              </div>
              <p>{endpoint.summary}</p>
              <a className="query-link" href={endpoint.replacement}>{endpoint.replacement}</a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export { DeprecationPolicyPage };
