import { useEffect, useMemo, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError, useAsyncData } from '../hooks/useAsyncData';
import { buildQueryString, parseCsvParam, readQueryState, replaceQueryState, toCsvParam } from '../lib/query';

const pathPresets = {
  campaignToHero: {
    backlinks: 'true',
    description: 'Кампания к герою через прямое участие в operation graph.',
    fromIdentifier: 'plague-wars',
    fromResource: 'campaigns',
    label: 'Campaign -> Hero',
    limitPerRelation: '6',
    maxDepth: '3',
    toIdentifier: 'roboute-guilliman',
    toResource: 'characters',
  },
  campaignToBattlefield: {
    backlinks: 'true',
    description: 'Прямой путь от кампании к tactical battlefield через новую доменную связь.',
    fromIdentifier: 'plague-wars',
    fromResource: 'campaigns',
    label: 'Campaign -> Battlefield',
    limitPerRelation: '6',
    maxDepth: '2',
    toIdentifier: 'hesperon-void-line',
    toResource: 'battlefields',
  },
  heroToRelic: {
    backlinks: 'true',
    description: 'Короткая цепочка от персонажа к его реликвии через backlink relations.',
    fromIdentifier: 'roboute-guilliman',
    fromResource: 'characters',
    label: 'Hero -> Relic',
    limitPerRelation: '6',
    maxDepth: '3',
    toIdentifier: 'emperors-sword',
    toResource: 'relics',
  },
  relicToCampaign: {
    backlinks: 'true',
    description: 'Реликвия к кампании через bearer и campaign participants.',
    fromIdentifier: 'emperors-sword',
    fromResource: 'relics',
    label: 'Relic -> Campaign',
    limitPerRelation: '6',
    maxDepth: '4',
    toIdentifier: 'plague-wars',
    toResource: 'campaigns',
  },
};

function buildGraphLink(node, resourceFilterKeys = []) {
  return `/explore/graph${buildQueryString({
    backlinks: 'true',
    depth: 2,
    identifier: node.slug || node.id,
    limitPerRelation: 4,
    resources: toCsvParam(resourceFilterKeys),
    resource: node.resource,
  })}`;
}

function toggleResourceFilterKey(currentKeys, resourceKey) {
  if (currentKeys.includes(resourceKey)) {
    return currentKeys.filter((item) => item !== resourceKey);
  }

  return [...currentKeys, resourceKey];
}

function PathNodeCard({ active, node, resourceFilterKeys }) {
  return (
    <article className={`path-node-card${active ? ' path-node-card-active' : ''}`}>
      <div className="resource-kicker">{node.resource}</div>
      <h3>{node.name}</h3>
      {node.summary && <p>{node.summary}</p>}
      <div className="tag-list">
        <span className="metric-chip">step {node.distance}</span>
        {node.status && <span className="tag">{node.status}</span>}
        {node.type && <span className="tag">{node.type}</span>}
        {node.slug && <span className="tag">{node.slug}</span>}
      </div>
      <div className="graph-card-actions">
        <a className="query-link" href={buildGraphLink(node, resourceFilterKeys)}>Открыть в Graph</a>
        <a
          className="query-link"
          href={`/resources/${node.resource}${buildQueryString({
            identifier: node.slug || node.id,
            include: '',
            mode: 'detail',
          })}`}
        >
          Открыть detail preview
        </a>
      </div>
    </article>
  );
}

function PathSequence({ pathEdges, pathNodes, resourceFilterKeys }) {
  if (!pathNodes.length) {
    return <StateNotice>Путь не найден в пределах текущего `maxDepth`.</StateNotice>;
  }

  return (
    <section className="section-card">
      <h2>Path sequence</h2>
      <div className="path-sequence">
        {pathNodes.map((node, index) => (
          <div key={node.key} className="path-sequence-block">
            <PathNodeCard active={index === 0 || index === pathNodes.length - 1} node={node} resourceFilterKeys={resourceFilterKeys} />
            {pathEdges[index] && (
              <div className="path-edge-card">
                <div className="resource-kicker">{pathEdges[index].label || pathEdges[index].relation}</div>
                <strong>{pathEdges[index].traversal === 'reverse' ? 'Обратный проход' : 'Прямой проход'}</strong>
                <p className="muted-line">
                  {pathEdges[index].from} -> {pathEdges[index].to}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PathPage() {
  const initialQuery = useMemo(() => {
    const preset = pathPresets.heroToRelic;
    const queryState = readQueryState({
      backlinks: preset.backlinks,
      fromIdentifier: preset.fromIdentifier,
      fromResource: preset.fromResource,
      limitPerRelation: preset.limitPerRelation,
      maxDepth: preset.maxDepth,
      resources: '',
      toIdentifier: preset.toIdentifier,
      toResource: preset.toResource,
    });

    return queryState;
  }, []);
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const resources = catalogState.data?.data || [];
  const [fromResource, setFromResource] = useState(initialQuery.fromResource);
  const [fromIdentifier, setFromIdentifier] = useState(initialQuery.fromIdentifier);
  const [toResource, setToResource] = useState(initialQuery.toResource);
  const [toIdentifier, setToIdentifier] = useState(initialQuery.toIdentifier);
  const [maxDepth, setMaxDepth] = useState(initialQuery.maxDepth);
  const [limitPerRelation, setLimitPerRelation] = useState(initialQuery.limitPerRelation);
  const [backlinks, setBacklinks] = useState(initialQuery.backlinks);
  const [resourceFilterKeys, setResourceFilterKeys] = useState(parseCsvParam(initialQuery.resources));
  const [requestPath, setRequestPath] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const path = responseData?.data?.path;
  const meta = responseData?.meta;

  async function runPath(nextState = {}) {
    const params = {
      backlinks: nextState.backlinks ?? backlinks,
      fromIdentifier: nextState.fromIdentifier ?? fromIdentifier,
      fromResource: nextState.fromResource ?? fromResource,
      limitPerRelation: nextState.limitPerRelation ?? limitPerRelation,
      maxDepth: nextState.maxDepth ?? maxDepth,
      resources: toCsvParam(nextState.resourceFilterKeys ?? resourceFilterKeys),
      toIdentifier: nextState.toIdentifier ?? toIdentifier,
      toResource: nextState.toResource ?? toResource,
    };

    setLoading(true);
    setSubmitError('');

    try {
      const result = await docsApi.getPath(params);
      setRequestPath(`/api/v1/explore/path${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setResponseData(null);
      setRequestPath(`/api/v1/explore/path${buildQueryString(params)}`);
    } finally {
      replaceQueryState(params);
      setLoading(false);
    }
  }

  useEffect(() => {
    runPath(initialQuery);
  }, []);

  function applyPreset(preset) {
    setBacklinks(preset.backlinks);
    setFromIdentifier(preset.fromIdentifier);
    setFromResource(preset.fromResource);
    setLimitPerRelation(preset.limitPerRelation);
    setMaxDepth(preset.maxDepth);
    setToIdentifier(preset.toIdentifier);
    setToResource(preset.toResource);
    runPath(preset);
  }

  function handleSubmit(event) {
    event.preventDefault();
    runPath();
  }

  function togglePathResourceFilter(resourceKey) {
    setResourceFilterKeys((current) => toggleResourceFilterKey(current, resourceKey));
  }

  if (catalogState.loading) {
    return <StateNotice>Загрузка path explorer...</StateNotice>;
  }

  if (catalogState.error) {
    return <StateNotice type="error">{catalogState.error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Path</div>
          <h1>Кратчайшая цепочка между двумя сущностями</h1>
          <p className="page-lead">
            `explore/path` находит маршрут через текущий relation graph. Это удобно для lore explorer,
            connected UI и учебных задач про traversal без ручной сборки множества запросов.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">shortest path</div>
          <div className="metric-chip">deep-link ready</div>
          <div className="metric-chip">graph-compatible</div>
        </div>
      </section>

      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>Preset scenarios</h2>
            <p className="muted-line">Готовые пары для проверки cross-resource traversal.</p>
          </div>
        </div>
        <div className="control-chip-bar">
          {Object.values(pathPresets).map((preset) => (
            <button
              key={`${preset.fromResource}-${preset.toResource}-${preset.label}`}
              type="button"
              className="control-chip"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <form className="section-card path-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>From resource</span>
            <select value={fromResource} onChange={(event) => setFromResource(event.target.value)}>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>From identifier</span>
            <input value={fromIdentifier} onInput={(event) => setFromIdentifier(event.target.value)} placeholder="roboute-guilliman" />
          </label>

          <label>
            <span>To resource</span>
            <select value={toResource} onChange={(event) => setToResource(event.target.value)}>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>To identifier</span>
            <input value={toIdentifier} onInput={(event) => setToIdentifier(event.target.value)} placeholder="emperors-sword" />
          </label>

          <label>
            <span>Max depth</span>
            <select value={maxDepth} onChange={(event) => setMaxDepth(event.target.value)}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>

          <label>
            <span>Limit per relation</span>
            <select value={limitPerRelation} onChange={(event) => setLimitPerRelation(event.target.value)}>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </label>

          <label>
            <span>Backlinks</span>
            <select value={backlinks} onChange={(event) => setBacklinks(event.target.value)}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>

        <div className="explore-filter-block">
          <div className="stats-section-head">
            <div>
              <h2>Resource filter</h2>
              <p className="muted-line">
                Ограничивает traversal промежуточными типами ресурсов. `from` и `to` всегда остаются доступными.
              </p>
            </div>
            <div className="tag-list">
              <span className="metric-chip">{resourceFilterKeys.length || resources.length} resource types</span>
              <span className="metric-chip">{resourceFilterKeys.length ? 'filtered' : 'all visible'}</span>
            </div>
          </div>
          <div className="control-chip-bar">
            <button
              type="button"
              className={`control-chip${!resourceFilterKeys.length ? ' control-chip-active' : ''}`}
              onClick={() => setResourceFilterKeys([])}
            >
              Все ресурсы
            </button>
            {resources.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`control-chip${resourceFilterKeys.includes(item.id) ? ' control-chip-active' : ''}`}
                onClick={() => togglePathResourceFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="resource-preview-foot">
          <p className="muted-line">
            Для сложных связей почти всегда нужен `backlinks=true`. Deeplink сохраняет фильтр в `resources=...`.
          </p>
          <button type="submit" className="action-button" disabled={loading}>
            {loading ? 'Ищем путь...' : 'Найти путь'}
          </button>
        </div>
      </form>

      {submitError && <StateNotice type="error">{submitError}</StateNotice>}
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="stats-hero-grid">
            <article className="stat-card">
              <div className="resource-kicker">Found</div>
              <div className="stat-value">{responseData.data.found ? 'yes' : 'no'}</div>
              <p className="muted-line">Удалось ли найти маршрут.</p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Path length</div>
              <div className="stat-value">{path.length}</div>
              <p className="muted-line">Количество relation steps.</p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Visited</div>
              <div className="stat-value">{meta.visitedNodeCount}</div>
              <p className="muted-line">Сколько узлов просмотрел BFS.</p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Truncated</div>
              <div className="stat-value">{meta.truncatedRelations.length}</div>
              <p className="muted-line">Обрезанные ветки из-за `limitPerRelation`.</p>
            </article>
          </section>

          <PathSequence pathEdges={path.edges} pathNodes={path.nodes} resourceFilterKeys={resourceFilterKeys} />

          <section className="section-card">
            <h2>Route summary</h2>
            <div className="path-summary-grid">
              <article className="path-summary-card">
                <div className="resource-kicker">From</div>
                <h3>{responseData.data.from.name}</h3>
                <a className="query-link" href={buildGraphLink(responseData.data.from, resourceFilterKeys)}>Открыть start node в Graph</a>
              </article>
              <article className="path-summary-card">
                <div className="resource-kicker">To</div>
                <h3>{responseData.data.to.name}</h3>
                <a className="query-link" href={buildGraphLink(responseData.data.to, resourceFilterKeys)}>Открыть target node в Graph</a>
              </article>
            </div>
          </section>

          <section className="section-card">
            <h2>Truncated relations</h2>
            {meta.truncatedRelations.length ? (
              <div className="graph-truncation-list">
                {meta.truncatedRelations.map((item) => (
                  <article key={`${item.from}-${item.relation}-${item.hiddenCount}`} className="sample-query-card">
                    <div className="resource-kicker">{item.relation}</div>
                    <strong>{item.hiddenCount} скрытых связей</strong>
                    <p className="muted-line">from: {item.from}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-line">Обрезанных веток нет.</p>
            )}
          </section>

          <JsonViewer label="Ответ path endpoint-а" data={responseData} />
        </>
      )}
    </div>
  );
}

export { PathPage };
