import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { ApiErrorNotice } from '../components/ApiErrorNotice';
import { ApiOperationGuide } from '../components/ApiOperationGuide';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError, extractErrorDetails, useAsyncData } from '../hooks/useAsyncData';
import {
  buildOpenApiIntegerOptions,
  getOpenApiParameterHint,
  getOpenApiParameterMap,
} from '../lib/openApi';
import { buildQueryString, parseCsvParam, readQueryState, replaceQueryState, toCsvParam } from '../lib/query';
import {
  findWorkbenchScenarioById,
  parsePathWorkbenchScenarios,
} from '../lib/workbenchScenarios';

function buildPathParams({
  backlinks,
  fromIdentifier,
  fromResource,
  limitPerRelation,
  maxDepth,
  resourceFilterKeys,
  toIdentifier,
  toResource,
}) {
  return {
    backlinks,
    fromIdentifier,
    fromResource,
    limitPerRelation,
    maxDepth,
    resources: toCsvParam(resourceFilterKeys),
    toIdentifier,
    toResource,
  };
}

function createPathFallbackScenario() {
  return {
    backlinks: 'true',
    description:
      'Укажи start и target вручную, если хочешь собрать traversal вне готовых учебных сценариев.',
    fromIdentifier: '',
    fromResource: '',
    label: 'Custom path',
    limitPerRelation: '6',
    maxDepth: '4',
    resourceFilterKeys: [],
    toIdentifier: '',
    toResource: '',
  };
}

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
                  {pathEdges[index].from} -&gt; {pathEdges[index].to}
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
    const queryState = readQueryState({
      backlinks: 'true',
      fromIdentifier: '',
      fromResource: '',
      limitPerRelation: '',
      maxDepth: '',
      resources: '',
      toIdentifier: '',
      toResource: '',
    });

    return {
      ...queryState,
      hasQuery:
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search || '').toString().length >
            0) ||
        false,
    };
  }, []);
  const initialRunRef = useRef(false);
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const specState = useAsyncData(() => docsApi.getOpenApiSpec(), []);
  const workbenchState = useAsyncData(() => docsApi.getWorkbenchScenarios(), []);
  const pathScenarios = useMemo(
    () => parsePathWorkbenchScenarios(workbenchState.data),
    [workbenchState.data],
  );
  const resources = catalogState.data?.data || [];
  const [fromResource, setFromResource] = useState(initialQuery.fromResource);
  const [fromIdentifier, setFromIdentifier] = useState(initialQuery.fromIdentifier);
  const [toResource, setToResource] = useState(initialQuery.toResource);
  const [toIdentifier, setToIdentifier] = useState(initialQuery.toIdentifier);
  const [maxDepth, setMaxDepth] = useState(initialQuery.maxDepth || '4');
  const [limitPerRelation, setLimitPerRelation] = useState(initialQuery.limitPerRelation || '6');
  const [backlinks, setBacklinks] = useState(initialQuery.backlinks);
  const [resourceFilterKeys, setResourceFilterKeys] = useState(parseCsvParam(initialQuery.resources));
  const [requestPath, setRequestPath] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const pathParameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, '/api/v1/explore/path'),
    [specState.data],
  );
  const maxDepthOptions = useMemo(
    () => buildOpenApiIntegerOptions(pathParameterMap.maxDepth, [2, 3, 4, 5, 6]),
    [pathParameterMap.maxDepth],
  );
  const limitPerRelationOptions = useMemo(
    () => buildOpenApiIntegerOptions(pathParameterMap.limitPerRelation, [4, 6, 8]),
    [pathParameterMap.limitPerRelation],
  );

  const path = responseData?.data?.path;
  const meta = responseData?.meta;
  const requestPreviewPath = useMemo(
    () =>
      `/api/v1/explore/path${buildQueryString(
        buildPathParams({
          backlinks,
          fromIdentifier,
          fromResource,
          limitPerRelation,
          maxDepth,
          resourceFilterKeys,
          toIdentifier,
          toResource,
        }),
      )}`,
    [
      backlinks,
      fromIdentifier,
      fromResource,
      limitPerRelation,
      maxDepth,
      resourceFilterKeys,
      toIdentifier,
      toResource,
    ],
  );

  async function runPath(nextState = {}) {
    const params = buildPathParams({
      backlinks: nextState.backlinks ?? backlinks,
      fromIdentifier: nextState.fromIdentifier ?? fromIdentifier,
      fromResource: nextState.fromResource ?? fromResource,
      limitPerRelation: nextState.limitPerRelation ?? limitPerRelation,
      maxDepth: nextState.maxDepth ?? maxDepth,
      resourceFilterKeys: nextState.resourceFilterKeys ?? resourceFilterKeys,
      toIdentifier: nextState.toIdentifier ?? toIdentifier,
      toResource: nextState.toResource ?? toResource,
    });

    setLoading(true);
    setSubmitError('');
    setSubmitErrorDetails([]);

    try {
      const result = await docsApi.getPath(params);
      setRequestPath(`/api/v1/explore/path${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setSubmitErrorDetails(extractErrorDetails(error));
      setResponseData(null);
      setRequestPath(`/api/v1/explore/path${buildQueryString(params)}`);
    } finally {
      replaceQueryState(params);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRunRef.current) {
      return;
    }

    const hasInitialRequest = Boolean(
      initialQuery.fromResource &&
        initialQuery.fromIdentifier &&
        initialQuery.toResource &&
        initialQuery.toIdentifier,
    );

    if (!hasInitialRequest && !pathScenarios.length) {
      if (workbenchState.loading || workbenchState.error) {
        return;
      }
    }

    const defaultScenario =
      findWorkbenchScenarioById(pathScenarios, 'hero-to-relic') ||
      pathScenarios[0] ||
      createPathFallbackScenario();
    const nextState = {
      backlinks: initialQuery.backlinks || defaultScenario.backlinks,
      fromIdentifier: initialQuery.fromIdentifier || defaultScenario.fromIdentifier,
      fromResource: initialQuery.fromResource || defaultScenario.fromResource,
      limitPerRelation:
        initialQuery.limitPerRelation || defaultScenario.limitPerRelation,
      maxDepth: initialQuery.maxDepth || defaultScenario.maxDepth,
      resourceFilterKeys: initialQuery.resources
        ? parseCsvParam(initialQuery.resources)
        : defaultScenario.resourceFilterKeys || [],
      toIdentifier: initialQuery.toIdentifier || defaultScenario.toIdentifier,
      toResource: initialQuery.toResource || defaultScenario.toResource,
    };

    if (!nextState.fromResource || !nextState.fromIdentifier || !nextState.toResource || !nextState.toIdentifier) {
      return;
    }

    initialRunRef.current = true;
    setBacklinks(nextState.backlinks);
    setFromIdentifier(nextState.fromIdentifier);
    setFromResource(nextState.fromResource);
    setLimitPerRelation(nextState.limitPerRelation);
    setMaxDepth(nextState.maxDepth);
    setResourceFilterKeys(nextState.resourceFilterKeys);
    setToIdentifier(nextState.toIdentifier);
    setToResource(nextState.toResource);
    runPath(nextState);
  }, [initialQuery, pathScenarios, workbenchState.error, workbenchState.loading]);

  function applyPreset(preset) {
    setBacklinks(preset.backlinks);
    setFromIdentifier(preset.fromIdentifier);
    setFromResource(preset.fromResource);
    setLimitPerRelation(preset.limitPerRelation);
    setMaxDepth(preset.maxDepth);
    setResourceFilterKeys(preset.resourceFilterKeys || []);
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
          <div className="metric-chip">{pathScenarios.length || 6} preset scenarios</div>
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
          {pathScenarios.map((preset) => (
            <button
              key={preset.id}
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
            <input
              value={fromIdentifier}
              onInput={(event) => setFromIdentifier(event.target.value)}
              placeholder={getOpenApiParameterHint(pathParameterMap.fromIdentifier)}
            />
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
            <input
              value={toIdentifier}
              onInput={(event) => setToIdentifier(event.target.value)}
              placeholder={getOpenApiParameterHint(pathParameterMap.toIdentifier)}
            />
          </label>

          <label>
            <span>Max depth</span>
            <select value={maxDepth} onChange={(event) => setMaxDepth(event.target.value)}>
              {maxDepthOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Limit per relation</span>
            <select value={limitPerRelation} onChange={(event) => setLimitPerRelation(event.target.value)}>
              {limitPerRelationOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
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

      {specState.error && <StateNotice type="error">{specState.error}</StateNotice>}
      {workbenchState.error && <StateNotice type="error">{workbenchState.error}</StateNotice>}
      {specState.data && (
        <ApiOperationGuide
          description="Path explorer берет параметры и live snippets из OpenAPI, поэтому contract и UI не расходятся."
          parameterOrder={[
            'fromResource',
            'fromIdentifier',
            'toResource',
            'toIdentifier',
            'maxDepth',
            'limitPerRelation',
            'backlinks',
            'resources',
          ]}
          path="/api/v1/explore/path"
          requestPath={requestPreviewPath}
          spec={specState.data}
        />
      )}
      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
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
              <div className="stat-value">{path?.edges?.length || 0}</div>
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
