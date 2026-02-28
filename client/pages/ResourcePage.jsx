import { useMemo } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function PreviewCards({ items }) {
  return (
    <div className="preview-grid">
      {items.map((item) => (
        <article key={item.id || item.slug} className="preview-card">
          <h3>{item.name || item.slug}</h3>
          {item.summary && <p>{item.summary}</p>}
          <div className="tag-list">
            {item.slug && <span className="tag">{item.slug}</span>}
            {item.status && <span className="tag">{item.status}</span>}
            {item.powerLevel !== undefined && <span className="tag">power {item.powerLevel}</span>}
          </div>
        </article>
      ))}
    </div>
  );
}

function ResourcePage({ resource }) {
  const docState = useAsyncData(() => docsApi.getResourceDoc(resource), [resource]);
  const previewParams = docState.data?.data?.previewParams;
  const previewDeps = useMemo(() => [resource, JSON.stringify(previewParams || {})], [resource, previewParams]);
  const previewState = useAsyncData(
    () => {
      if (!previewParams) {
        return Promise.resolve(null);
      }

      return docsApi.getResourceList(resource, previewParams);
    },
    previewDeps
  );

  if (docState.loading) {
    return <StateNotice>Загрузка документации ресурса...</StateNotice>;
  }

  if (docState.error) {
    return <StateNotice type="error">{docState.error}</StateNotice>;
  }

  const doc = docState.data.data;
  const preview = previewState.data;

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">{doc.id}</div>
          <h1>{doc.label}</h1>
          <p className="page-lead">{doc.description}</p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{doc.count} записей</div>
          <div className="metric-chip">sort: {doc.defaultSort}</div>
        </div>
      </section>

      <div className="panel-grid">
        <section className="section-card">
          <h2>Фильтры</h2>
          <div className="tag-list">
            {doc.filters.map((filter) => (
              <span key={filter.id} className="tag">{filter.id}</span>
            ))}
          </div>
        </section>
        <section className="section-card">
          <h2>Include</h2>
          <div className="tag-list">
            {doc.includes.length ? doc.includes.map((include) => (
              <span key={include.id} className="tag">{include.id}</span>
            )) : <span className="muted-line">Для этого ресурса include не нужен.</span>}
          </div>
        </section>
      </div>

      <section className="section-card">
        <h2>Поля</h2>
        <div className="mini-table">
          <div className="mini-table-head">
            <span>Поле</span>
            <span>Тип</span>
            <span>Назначение</span>
          </div>
          {doc.fields.map((field) => (
            <div key={field.name} className="mini-table-row">
              <span>{field.name}</span>
              <span>{field.type}</span>
              <span>{field.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <h2>Готовые запросы</h2>
        <div className="endpoint-list">
          {doc.sampleQueries.map((sampleQuery) => (
            <a key={sampleQuery} className="query-link" href={sampleQuery}>{sampleQuery}</a>
          ))}
        </div>
      </section>

      {previewState.loading && <StateNotice>Загрузка preview-данных...</StateNotice>}
      {previewState.error && <StateNotice type="error">{previewState.error}</StateNotice>}

      {preview && (
        <>
          <section className="section-card">
            <h2>Preview</h2>
            <PreviewCards items={preview.data} />
          </section>
          <JsonViewer label="JSON preview" data={preview} />
        </>
      )}
    </div>
  );
}

export { ResourcePage };
