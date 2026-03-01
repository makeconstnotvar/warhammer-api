import { docsApi } from '../api/docsApi';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function Home() {
  const { data, loading, error } = useAsyncData(() => docsApi.getOverview(), []);
  const overview = data?.data;

  if (loading) {
    return <StateNotice>Загрузка overview...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="section-eyebrow">Warhammer 40K API</div>
          <h1>Публичная документация и учебный playground в одном клиенте</h1>
          <p className="page-lead">
            Этот клиент не притворяется отдельным продуктом. Его задача объяснить, как использовать API,
            быстро дать живые примеры и помочь собрать веб-приложение без долгого разгона.
          </p>
          <div className="hero-actions">
            <a className="action-link" href="/quick-start">Открыть Quick Start</a>
            <a className="action-link action-link-muted" href="/stats">Посмотреть Stats</a>
            <a className="action-link action-link-muted" href="/compare">Открыть Compare</a>
            <a className="action-link action-link-muted" href="/explore/graph">Открыть Graph</a>
            <a className="action-link action-link-muted" href="/explore/path">Открыть Path</a>
            <a className="action-link action-link-muted" href="/playground">Перейти в Playground</a>
          </div>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{overview.resources.length} ресурсов</div>
          <div className="metric-chip">{overview.featuredQueries.length} готовых сценария</div>
          <div className="metric-chip">8 stats endpoint-ов</div>
          <div className="metric-chip">8 compare ресурсов</div>
          <div className="metric-chip">graph explorer</div>
          <div className="metric-chip">path finder</div>
          <div className="metric-chip">{overview.api.basePath}</div>
        </div>
      </section>

      <section className="resource-grid">
        {overview.resources.map((resource) => (
          <article key={resource.id} className="resource-card">
            <div className="resource-card-top">
              <div>
                <div className="resource-kicker">{resource.id}</div>
                <h2>{resource.label}</h2>
              </div>
              <div className="metric-chip">{resource.count}</div>
            </div>
            <p>{resource.description}</p>
            <div className="tag-list">
              {resource.filters.slice(0, 4).map((filter) => (
                <span key={filter.id} className="tag">{filter.id}</span>
              ))}
            </div>
            <a className="action-link" href={`/resources/${resource.id}`}>Изучить ресурс</a>
          </article>
        ))}
      </section>

      <div className="panel-grid">
        <section className="section-card">
          <h2>С чего начать</h2>
          <div className="step-list">
            {overview.gettingStartedSteps.map((step, index) => (
              <article key={step.title} className="step-card">
                <div className="step-index">0{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <a className="query-link" href={step.endpoint}>{step.endpoint}</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card">
          <h2>Готовые запросы</h2>
          <div className="step-list">
            {overview.featuredQueries.map((item) => (
              <article key={item.path} className="step-card step-card-compact">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a className="query-link" href={item.path}>{item.path}</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export { Home };
