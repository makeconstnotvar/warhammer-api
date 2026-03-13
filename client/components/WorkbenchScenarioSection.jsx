import { formatWorkbenchDifficulty } from "../lib/workbenchScenarios";

function WorkbenchScenarioSection({
  description = "",
  emptyState = "",
  scenarios = [],
  summary = "",
  title,
}) {
  if (!scenarios.length) {
    if (!emptyState) {
      return null;
    }

    return (
      <section className="section-card">
        <h2>{title}</h2>
        <p className="muted-line">{emptyState}</p>
      </section>
    );
  }

  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted-line">{description}</p> : null}
        </div>
        {summary ? (
          <div className="tag-list">
            <span className="metric-chip">{summary}</span>
          </div>
        ) : null}
      </div>

      <div className="preview-grid">
        {scenarios.map((scenario) => (
          <article
            key={`${scenario.groupKey || scenario.groupLabel}-${scenario.id}`}
            className="sample-query-card"
          >
            <div className="workbench-card-head">
              <div className="resource-kicker">{scenario.groupLabel}</div>
              {scenario.featured ? <span className="metric-chip">featured</span> : null}
            </div>
            <h3>{scenario.label}</h3>
            <p>{scenario.description}</p>
            <div className="tag-list">
              <span className="tag">{scenario.scope}</span>
              <span
                className={`tag workbench-difficulty-tag workbench-difficulty-tag-${scenario.difficulty}`}
              >
                {formatWorkbenchDifficulty(scenario.difficulty)}
              </span>
              {scenario.pathResources?.length ? (
                <span className="tag">path whitelist {scenario.pathResources.length}</span>
              ) : null}
              {scenario.tags?.slice(0, 4).map((tag) => (
                <span key={`${scenario.id}-${tag}`} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="sample-query-actions">
              <a className="action-link" href={scenario.docsPath}>
                Открыть docs flow
              </a>
              <a className="query-link" href={scenario.path}>
                {scenario.path}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export { WorkbenchScenarioSection };
