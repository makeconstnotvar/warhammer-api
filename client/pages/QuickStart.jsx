import { docsApi } from '../api/docsApi';
import { CodeBlock } from '../components/CodeBlock';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function QuickStart() {
  const { data, loading, error } = useAsyncData(() => docsApi.getOverview(), []);
  const overview = data?.data;
  const basePath = overview?.api?.basePath || '/api/v1';

  if (loading) {
    return <StateNotice>Загрузка quick start...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Quick Start</div>
          <h1>Старт без лишней подготовки</h1>
          <p className="page-lead">
            Клиент и API спроектированы так, чтобы первый учебный интерфейс появился быстро:
            каталог, детали, search и конкурентная загрузка.
          </p>
        </div>
      </section>

      <section className="section-card">
        <h2>Первые шаги</h2>
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

      <div className="panel-grid">
        <CodeBlock label="cURL">{`curl http://localhost:3000${basePath}/overview`}</CodeBlock>
        <CodeBlock label="fetch">{`const response = await fetch('${basePath}/characters?limit=6&sort=-powerLevel,name');\nconst payload = await response.json();`}</CodeBlock>
      </div>

      <div className="panel-grid">
        <CodeBlock label="Axios">{`const { data } = await axios.get('${basePath}/characters', {\n  params: { limit: 6, sort: '-powerLevel,name', include: 'faction,race' }\n});`}</CodeBlock>
        <CodeBlock label="Promise.all">{`const [factions, characters, events] = await Promise.all([\n  fetch('${basePath}/factions?limit=4').then((r) => r.json()),\n  fetch('${basePath}/characters?limit=4').then((r) => r.json()),\n  fetch('${basePath}/events?limit=4').then((r) => r.json()),\n]);`}</CodeBlock>
      </div>
    </div>
  );
}

export { QuickStart };
