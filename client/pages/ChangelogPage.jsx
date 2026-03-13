import { docsApi } from "../api/docsApi";
import { StateNotice } from "../components/StateNotice";
import { useAsyncData } from "../hooks/useAsyncData";

function ChangelogPage() {
  const { data, loading, error } = useAsyncData(() => docsApi.getChangelog(), []);
  const changelog = data?.data;

  if (loading) {
    return <StateNotice>Загрузка changelog...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Changelog</div>
          <h1>Изменения публичного контракта без догадок</h1>
          <p className="page-lead">
            Эта лента фиксирует изменения, которые важны для пользователей API: новые
            docs-возможности, deprecation-решения и стабильные точки миграции.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">v{changelog.latestVersion}</div>
          <div className="metric-chip">{changelog.entries.length} запись</div>
          <div className="metric-chip">старт: 2026-03-07</div>
        </div>
      </section>

      <section className="section-card">
        <h2>Как читать changelog</h2>
        <p className="muted-line">{changelog.note}</p>
      </section>

      <section className="section-card">
        <h2>Записи</h2>
        <div className="timeline-list">
          {changelog.entries.map((entry) => (
            <article key={entry.version} className="timeline-card">
              <div className="timeline-head">
                <div>
                  <div className="section-eyebrow">{entry.status}</div>
                  <h3>Версия {entry.version}</h3>
                </div>
                <div className="metric-chip">{entry.releasedOn}</div>
              </div>
              <p>{entry.summary}</p>
              <div className="timeline-change-list">
                {entry.changes.map((change) => (
                  <article
                    key={`${entry.version}-${change.area}-${change.type}`}
                    className="timeline-change-card"
                  >
                    <div className="tag-list">
                      <span className="tag">{change.type}</span>
                      <span className="tag">{change.area}</span>
                    </div>
                    <p>{change.text}</p>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export { ChangelogPage };
