import { useEffect, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError, useAsyncData } from '../hooks/useAsyncData';
import { buildQueryString, readQueryState, replaceQueryState } from '../lib/query';

const emptyPreviewState = {
  mode: 'list',
  identifier: '',
  limit: '',
  sort: '',
  include: '',
  filterKey: '',
  filterValue: '',
};

function normalizePreviewState(doc, rawState = {}) {
  const previewParams = doc.previewParams || {};
  const filterKeys = (doc.filters || []).map((item) => item.id);
  const rawMode = rawState.mode === 'detail' ? 'detail' : 'list';
  const nextFilterKey = filterKeys.includes(rawState.filterKey)
    ? rawState.filterKey
    : (rawState.filterKey ? '' : (filterKeys[0] || ''));

  return {
    mode: rawMode,
    identifier: rawState.identifier || '',
    limit: rawState.limit || String(previewParams.limit || 5),
    sort: rawState.sort || previewParams.sort || doc.defaultSort || '',
    include: rawState.include || previewParams.include || '',
    filterKey: nextFilterKey,
    filterValue: rawState.filterValue || '',
  };
}

function parseSampleQuery(resource, sampleQuery) {
  const [pathPart, rawQuery = ''] = String(sampleQuery || '').split('?');
  const normalizedPath = pathPart.replace(/^\/api\/v1\//, '').replace(/^\//, '');
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments[0] !== resource) {
    return null;
  }

  const searchParams = new URLSearchParams(rawQuery);
  let filterKey = '';
  let filterValue = '';

  searchParams.forEach((value, key) => {
    const match = key.match(/^filter\[(.+)\]$/);

    if (!match || filterKey) {
      return;
    }

    filterKey = match[1];
    filterValue = value;
  });

  return {
    mode: segments[1] ? 'detail' : 'list',
    identifier: segments[1] || '',
    limit: searchParams.get('limit') || '',
    sort: searchParams.get('sort') || '',
    include: searchParams.get('include') || '',
    filterKey,
    filterValue,
  };
}

function IncludedSummary({ included }) {
  const entries = Object.entries(included || {});

  if (!entries.length) {
    return <span className="muted-line">Этот preview не вернул included-блок.</span>;
  }

  return (
    <div className="tag-list">
      {entries.map(([key, items]) => (
        <span key={key} className="metric-chip">{key}: {items.length}</span>
      ))}
    </div>
  );
}

function PreviewCards({ include, items, resource }) {
  return (
    <div className="preview-grid">
      {items.map((item) => {
        const identifier = item.slug || item.id;
        const detailLink = `/resources/${resource}${buildQueryString({
          mode: 'detail',
          identifier,
          include,
        })}`;

        return (
          <article key={item.id || item.slug} className="preview-card">
            <h3>{item.name || item.slug}</h3>
            {item.summary && <p>{item.summary}</p>}
            <div className="tag-list">
              {item.slug && <span className="tag">{item.slug}</span>}
              {item.status && <span className="tag">{item.status}</span>}
              {item.powerLevel !== undefined && <span className="tag">power {item.powerLevel}</span>}
              {item.influenceLevel !== undefined && <span className="tag">influence {item.influenceLevel}</span>}
              {item.yearLabel && <span className="tag">{item.yearLabel}</span>}
            </div>
            <a className="query-link" href={detailLink}>Открыть detail preview</a>
          </article>
        );
      })}
    </div>
  );
}

function DetailPreviewCard({ item }) {
  const detailRows = Object.entries(item || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .filter(([, value]) => !Array.isArray(value) && typeof value !== 'object')
    .slice(0, 12);

  return (
    <article className="preview-detail-card">
      <div className="compare-item-head">
        <div>
          <div className="resource-kicker">{item.slug || item.id}</div>
          <h2>{item.name || item.slug}</h2>
        </div>
        <div className="tag-list">
          {item.status && <span className="metric-chip">{item.status}</span>}
          {item.powerLevel !== undefined && <span className="metric-chip">power {item.powerLevel}</span>}
          {item.influenceLevel !== undefined && <span className="metric-chip">influence {item.influenceLevel}</span>}
          {item.yearLabel && <span className="metric-chip">{item.yearLabel}</span>}
        </div>
      </div>

      {item.summary && <p>{item.summary}</p>}

      <div className="preview-detail-grid">
        {detailRows.map(([key, value]) => (
          <div key={key} className="preview-detail-row">
            <span className="resource-kicker">{key}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function ResourcePage({ resource }) {
  const docState = useAsyncData(() => docsApi.getResourceDoc(resource), [resource]);
  const [previewQuery, setPreviewQuery] = useState(emptyPreviewState);
  const [requestPath, setRequestPath] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  async function runPreview(nextPreviewQuery = previewQuery) {
    const doc = docState.data?.data;

    if (!doc) {
      return;
    }

    const resolvedQuery = normalizePreviewState(doc, nextPreviewQuery);
    const params = {};

    if (resolvedQuery.include) {
      params.include = resolvedQuery.include;
    }

    if (resolvedQuery.mode === 'list') {
      if (resolvedQuery.limit) {
        params.limit = resolvedQuery.limit;
      }

      if (resolvedQuery.sort) {
        params.sort = resolvedQuery.sort;
      }

      if (resolvedQuery.filterKey && resolvedQuery.filterValue) {
        params[`filter[${resolvedQuery.filterKey}]`] = resolvedQuery.filterValue;
      }
    }

    const pathname = resolvedQuery.mode === 'detail'
      ? `/api/v1/${resource}/${resolvedQuery.identifier}`
      : `/api/v1/${resource}`;

    if (resolvedQuery.mode === 'detail' && !resolvedQuery.identifier) {
      setRequestPath(pathname);
      setResponseData(null);
      setSubmitError('Для detail preview нужен id или slug.');
      replaceQueryState({
        mode: resolvedQuery.mode,
        identifier: resolvedQuery.identifier,
        include: resolvedQuery.include,
      });
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const result = resolvedQuery.mode === 'detail'
        ? await docsApi.getResourceDetail(resource, resolvedQuery.identifier, params)
        : await docsApi.getResourceList(resource, params);

      setRequestPath(`${pathname}${buildQueryString(params)}`);
      setResponseData(result);
      setPreviewQuery(resolvedQuery);
    } catch (error) {
      setSubmitError(extractError(error));
      setResponseData(null);
      setRequestPath(`${pathname}${buildQueryString(params)}`);
      setPreviewQuery(resolvedQuery);
    } finally {
      replaceQueryState({
        mode: resolvedQuery.mode,
        identifier: resolvedQuery.mode === 'detail' ? resolvedQuery.identifier : '',
        limit: resolvedQuery.mode === 'list' ? resolvedQuery.limit : '',
        sort: resolvedQuery.mode === 'list' ? resolvedQuery.sort : '',
        include: resolvedQuery.include,
        filterKey: resolvedQuery.mode === 'list' ? resolvedQuery.filterKey : '',
        filterValue: resolvedQuery.mode === 'list' ? resolvedQuery.filterValue : '',
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    setRequestPath('');
    setResponseData(null);
    setSubmitError('');
  }, [resource]);

  useEffect(() => {
    if (!docState.data?.data) {
      return;
    }

    const nextPreviewQuery = normalizePreviewState(
      docState.data.data,
      readQueryState(emptyPreviewState)
    );

    setPreviewQuery(nextPreviewQuery);
    runPreview(nextPreviewQuery);
  }, [resource, docState.data]);

  function updatePreviewQuery(patch) {
    setPreviewQuery((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    runPreview(previewQuery);
  }

  function handleSampleApply(sampleQuery) {
    const doc = docState.data?.data;

    if (!doc) {
      return;
    }

    const parsedSample = parseSampleQuery(resource, sampleQuery);

    if (!parsedSample) {
      return;
    }

    const nextPreviewQuery = normalizePreviewState(doc, parsedSample);
    setPreviewQuery(nextPreviewQuery);
    runPreview(nextPreviewQuery);
  }

  if (docState.loading) {
    return <StateNotice>Загрузка документации ресурса...</StateNotice>;
  }

  if (docState.error) {
    return <StateNotice type="error">{docState.error}</StateNotice>;
  }

  const doc = docState.data.data;
  const previewItems = Array.isArray(responseData?.data) ? responseData.data : [];
  const previewDetail = responseData?.data && !Array.isArray(responseData.data) ? responseData.data : null;

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
          <div className="metric-chip">deep-link ready</div>
        </div>
      </section>

      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>Live preview</h2>
            <p className="muted-line">
              Можно переключаться между `list` и `detail`, менять `include`, фильтры и сразу делиться ссылкой
              на конкретное состояние документации ресурса.
            </p>
          </div>
          <div className="control-chip-bar">
            <button
              type="button"
              className={`control-chip${previewQuery.mode === 'list' ? ' control-chip-active' : ''}`}
              onClick={() => updatePreviewQuery({ mode: 'list', identifier: '' })}
            >
              list
            </button>
            <button
              type="button"
              className={`control-chip${previewQuery.mode === 'detail' ? ' control-chip-active' : ''}`}
              onClick={() => updatePreviewQuery({ mode: 'detail' })}
            >
              detail
            </button>
          </div>
        </div>

        <form className="resource-preview-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Mode</span>
              <select value={previewQuery.mode} onChange={(event) => updatePreviewQuery({ mode: event.target.value })}>
                <option value="list">list</option>
                <option value="detail">detail</option>
              </select>
            </label>

            {previewQuery.mode === 'detail' ? (
              <label className="label-wide">
                <span>ID or slug</span>
                <input
                  value={previewQuery.identifier}
                  onInput={(event) => updatePreviewQuery({ identifier: event.target.value })}
                  placeholder="roboute-guilliman"
                />
              </label>
            ) : (
              <>
                <label>
                  <span>Limit</span>
                  <input
                    value={previewQuery.limit}
                    onInput={(event) => updatePreviewQuery({ limit: event.target.value })}
                    placeholder="5"
                  />
                </label>

                <label>
                  <span>Sort</span>
                  <input
                    value={previewQuery.sort}
                    onInput={(event) => updatePreviewQuery({ sort: event.target.value })}
                    placeholder={doc.defaultSort}
                  />
                </label>
              </>
            )}

            <label>
              <span>Include</span>
              <input
                value={previewQuery.include}
                onInput={(event) => updatePreviewQuery({ include: event.target.value })}
                placeholder={doc.previewParams?.include || 'faction,era'}
              />
            </label>

            {previewQuery.mode === 'list' && (
              <>
                <label>
                  <span>Filter key</span>
                  <select
                    value={previewQuery.filterKey}
                    onChange={(event) => updatePreviewQuery({ filterKey: event.target.value })}
                  >
                    {(doc.filters || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.id}</option>
                    ))}
                  </select>
                </label>

                <label className="label-wide">
                  <span>Filter value</span>
                  <input
                    value={previewQuery.filterValue}
                    onInput={(event) => updatePreviewQuery({ filterValue: event.target.value })}
                    placeholder="imperium-of-man"
                  />
                </label>
              </>
            )}
          </div>

          <div className="resource-preview-foot">
            <p className="muted-line">
              Это тот же публичный API. Отдельный sandbox-слой на клиенте не нужен.
            </p>
            <button type="submit" className="action-button" disabled={loading}>
              {loading ? 'Загрузка...' : 'Обновить preview'}
            </button>
          </div>
        </form>
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
        <div className="resource-sample-grid">
          {doc.sampleQueries.map((sampleQuery) => (
            <article key={sampleQuery} className="sample-query-card">
              <a className="query-link" href={sampleQuery}>{sampleQuery}</a>
              <div className="sample-query-actions">
                <button type="button" className="action-button" onClick={() => handleSampleApply(sampleQuery)}>
                  Применить в preview
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {submitError && <StateNotice type="error">{submitError}</StateNotice>}
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Результат preview</h2>
                <p className="muted-line">
                  Можно использовать как образец для list page, detail screen или data-fetching примера.
                </p>
              </div>
              <a className="query-link" href={requestPath}>{requestPath}</a>
            </div>

            <IncludedSummary included={responseData.included} />

            {previewItems.length > 0 && (
              <PreviewCards items={previewItems} resource={resource} include={previewQuery.include} />
            )}

            {previewDetail && <DetailPreviewCard item={previewDetail} />}
          </section>

          <JsonViewer label="JSON preview" data={responseData} />
        </>
      )}
    </div>
  );
}

export { ResourcePage };
