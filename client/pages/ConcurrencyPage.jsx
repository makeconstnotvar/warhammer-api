import { useEffect, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { CodeBlock } from '../components/CodeBlock';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError, useAsyncData } from '../hooks/useAsyncData';

function ConcurrencyPage() {
  const exampleState = useAsyncData(() => docsApi.getConcurrencyExample(), []);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runExample() {
    setLoading(true);
    setError('');

    const startedAt = performance.now();

    try {
      const [factions, characters, events] = await Promise.all([
        docsApi.getResourceList('factions', { limit: 4, sort: 'name' }),
        docsApi.getResourceList('characters', { limit: 4, sort: '-powerLevel,name' }),
        docsApi.getResourceList('events', { limit: 4, sort: '-yearOrder,name' }),
      ]);

      setResult({
        elapsedMs: Math.round(performance.now() - startedAt),
        endpoints: { factions, characters, events },
      });
    } catch (requestError) {
      setError(extractError(requestError));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runExample();
  }, []);

  if (exampleState.loading) {
    return <StateNotice>Загрузка сценария конкурентных запросов...</StateNotice>;
  }

  if (exampleState.error) {
    return <StateNotice type="error">{exampleState.error}</StateNotice>;
  }

  const example = exampleState.data.data;

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Concurrency</div>
          <h1>Параллельные запросы как учебный паттерн</h1>
          <p className="page-lead">{example.description}</p>
        </div>
        <button className="action-button" onClick={runExample} disabled={loading}>
          {loading ? 'Выполняется...' : 'Повторить пример'}
        </button>
      </section>

      <section className="section-card">
        <h2>Endpoint-ы</h2>
        <div className="endpoint-list">
          {example.endpoints.map((endpoint) => (
            <a key={endpoint} className="query-link" href={endpoint}>{endpoint}</a>
          ))}
        </div>
      </section>

      <CodeBlock label="Promise.all">{example.code}</CodeBlock>

      {error && <StateNotice type="error">{error}</StateNotice>}
      {result && <StateNotice>Запросы завершились за {result.elapsedMs} мс.</StateNotice>}
      {result && <JsonViewer label="Результат конкурентной загрузки" data={result} />}
    </div>
  );
}

export { ConcurrencyPage };
