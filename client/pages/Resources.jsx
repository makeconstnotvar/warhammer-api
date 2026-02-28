import { docsApi } from '../api/docsApi';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function Resources() {
  const { data, loading, error } = useAsyncData(() => docsApi.getCatalog(), []);
  const resources = data?.data || [];

  if (loading) {
    return <StateNotice>Загрузка каталога ресурсов...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Resources</div>
          <h1>Каталог сущностей</h1>
          <p className="page-lead">
            Ресурсы построены так, чтобы их можно было использовать и по отдельности,
            и в комбинации для dashboard, compare page и детальных экранов.
          </p>
        </div>
      </section>

      <section className="resource-grid">
        {resources.map((resource) => (
          <article key={resource.id} className="resource-card">
            <div className="resource-card-top">
              <div>
                <div className="resource-kicker">{resource.id}</div>
                <h2>{resource.label}</h2>
              </div>
              <div className="metric-chip">{resource.count} записей</div>
            </div>
            <p>{resource.description}</p>
            <div className="tag-list">
              {resource.filters.map((filter) => (
                <span key={filter.id} className="tag">{filter.id}</span>
              ))}
            </div>
            <a className="action-link" href={`/resources/${resource.id}`}>Открыть документацию</a>
          </article>
        ))}
      </section>
    </div>
  );
}

export { Resources };
