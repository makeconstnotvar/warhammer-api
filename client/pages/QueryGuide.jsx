import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function QueryGuide() {
  const { data, loading, error } = useAsyncData(() => docsApi.getQueryGuide(), []);
  const guide = data?.data;

  if (loading) {
    return <StateNotice>Загрузка руководства по запросам...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Query Guide</div>
          <h1>Единые правила запросов</h1>
          <p className="page-lead">
            Все основные ресурсы используют одни и те же паттерны: `page`, `limit`, `sort`,
            `search`, `filter[...]`, `include` и `fields[...]`.
          </p>
        </div>
      </section>

      <section className="section-card">
        <h2>Параметры</h2>
        <div className="mini-table">
          <div className="mini-table-head">
            <span>Параметр</span>
            <span>Пример</span>
            <span>Описание</span>
          </div>
          {guide.params.map((parameter) => (
            <div key={parameter.name} className="mini-table-row">
              <span>{parameter.name}</span>
              <span>{parameter.example}</span>
              <span>{parameter.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <h2>Сценарии</h2>
        <div className="step-list">
          {guide.scenarios.map((scenario) => (
            <article key={scenario.title} className="step-card">
              <div>
                <h3>{scenario.title}</h3>
                <p>{scenario.description}</p>
                <a className="query-link" href={scenario.path}>{scenario.path}</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="panel-grid">
        <JsonViewer label="Ответ списка" data={guide.responseShapes.list} />
        <JsonViewer label="Ответ ошибки" data={guide.responseShapes.error} />
      </div>
    </div>
  );
}

export { QueryGuide };
