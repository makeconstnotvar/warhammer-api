import { docsApi } from "../api/docsApi";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import { useAsyncData } from "../hooks/useAsyncData";

function QueryGuide() {
  const { data, loading, error } = useAsyncData(
    () => docsApi.getQueryGuide(),
    [],
  );
  const guide = data?.data;
  const rateLimit = guide?.rateLimit;

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
            Все основные ресурсы используют одни и те же паттерны: `page`,
            `limit`, `sort`, `search`, `filter[...]`, `include` и `fields[...]`.
            Ошибки валидации приходят как `VALIDATION_ERROR` с детальными
            `details` по каждому проблемному параметру.
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
        <h2>Operational Limits</h2>
        <div className="stats-hero-grid">
          <article className="stat-card">
            <div className="section-eyebrow">Scope</div>
            <div className="stat-value">{rateLimit.scope}</div>
            <p>
              Rate limit применяется ко всем endpoint-ам внутри публичного
              `api/v1`.
            </p>
          </article>
          <article className="stat-card">
            <div className="section-eyebrow">Limit</div>
            <div className="stat-value">{rateLimit.limit}</div>
            <p>Максимум запросов за одно окно, после чего API вернет 429.</p>
          </article>
          <article className="stat-card">
            <div className="section-eyebrow">Window</div>
            <div className="stat-value">{rateLimit.windowSeconds}s</div>
            <p>
              Длина окна ограничения в секундах. Значение совпадает с reset
              policy в headers.
            </p>
          </article>
          <article className="stat-card">
            <div className="section-eyebrow">Policy</div>
            <div className="stat-value">{rateLimit.policy}</div>
            <p>Компактная сводка лимита в формате `limit;w=windowSeconds`.</p>
          </article>
        </div>
      </section>

      <section className="section-card">
        <h2>Operational Headers</h2>
        <div className="mini-table">
          <div className="mini-table-head">
            <span>Header</span>
            <span>Пример</span>
            <span>Описание</span>
          </div>
          {rateLimit.headers.map((header) => (
            <div key={header.name} className="mini-table-row">
              <span>{header.name}</span>
              <span>{header.example}</span>
              <span>{header.description}</span>
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
                <a className="query-link" href={scenario.path}>
                  {scenario.path}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="panel-grid">
        <JsonViewer label="Ответ списка" data={guide.responseShapes.list} />
        <JsonViewer label="Ответ ошибки" data={guide.responseShapes.error} />
      </div>

      <JsonViewer
        label="Ответ при rate limit"
        data={guide.responseShapes.rateLimitError}
      />
    </div>
  );
}

export { QueryGuide };
