import { useEffect, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError, useAsyncData } from '../hooks/useAsyncData';
import { buildQueryString } from '../lib/query';

function Playground() {
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const resources = catalogState.data?.data || [];
  const [resource, setResource] = useState('characters');
  const docState = useAsyncData(() => docsApi.getResourceDoc(resource), [resource]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState('6');
  const [sort, setSort] = useState('');
  const [include, setInclude] = useState('');
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [requestPath, setRequestPath] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!docState.data?.data) {
      return;
    }

    const doc = docState.data.data;
    setSort(doc.defaultSort || '');
    setInclude(doc.previewParams?.include || '');
    setFilterKey(doc.filters[0]?.id || '');
    setFilterValue('');
  }, [docState.data]);

  async function handleSubmit(event) {
    event.preventDefault();

    const params = {
      limit,
      search,
      sort,
      include,
    };

    if (filterKey && filterValue) {
      params[`filter[${filterKey}]`] = filterValue;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const result = await docsApi.getResourceList(resource, params);
      setRequestPath(`/api/v1/${resource}${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  }

  if (catalogState.loading) {
    return <StateNotice>Загрузка playground...</StateNotice>;
  }

  if (catalogState.error) {
    return <StateNotice type="error">{catalogState.error}</StateNotice>;
  }

  const doc = docState.data?.data;

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Playground</div>
          <h1>Собери запрос вручную</h1>
          <p className="page-lead">
            Playground помогает быстро проверить `search`, `sort`, `include` и один выбранный фильтр,
            не уходя в Postman или отдельный sandbox.
          </p>
        </div>
      </section>

      <form className="section-card playground-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Ресурс</span>
            <select value={resource} onChange={(event) => setResource(event.target.value)}>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Search</span>
            <input value={search} onInput={(event) => setSearch(event.target.value)} placeholder="guilliman" />
          </label>

          <label>
            <span>Limit</span>
            <input value={limit} onInput={(event) => setLimit(event.target.value)} />
          </label>

          <label>
            <span>Sort</span>
            <input value={sort} onInput={(event) => setSort(event.target.value)} placeholder="-powerLevel,name" />
          </label>

          <label>
            <span>Include</span>
            <input value={include} onInput={(event) => setInclude(event.target.value)} placeholder="faction,race" />
          </label>

          <label>
            <span>Filter key</span>
            <select value={filterKey} onChange={(event) => setFilterKey(event.target.value)}>
              {(doc?.filters || []).map((item) => (
                <option key={item.id} value={item.id}>{item.id}</option>
              ))}
            </select>
          </label>

          <label className="label-wide">
            <span>Filter value</span>
            <input value={filterValue} onInput={(event) => setFilterValue(event.target.value)} placeholder="ultramarines" />
          </label>
        </div>

        <button type="submit" className="action-button" disabled={loading || docState.loading}>
          {loading ? 'Загрузка...' : 'Выполнить запрос'}
        </button>
      </form>

      {docState.error && <StateNotice type="error">{docState.error}</StateNotice>}
      {submitError && <StateNotice type="error">{submitError}</StateNotice>}
      {requestPath && <StateNotice>{requestPath}</StateNotice>}
      {responseData && <JsonViewer label="Ответ API" data={responseData} />}
    </div>
  );
}

export { Playground };
