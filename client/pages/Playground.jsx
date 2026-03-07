import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { docsApi } from "../api/docsApi";
import { ApiErrorNotice } from "../components/ApiErrorNotice";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import {
  extractError,
  extractErrorDetails,
  useAsyncData,
} from "../hooks/useAsyncData";
import {
  buildQueryString,
  hasSearchParams,
  readQueryState,
  replaceQueryState,
} from "../lib/query";

function extractOperationalHeaders(headers = {}) {
  const headerEntries = [
    ["RateLimit-Limit", headers["ratelimit-limit"]],
    ["RateLimit-Remaining", headers["ratelimit-remaining"]],
    ["RateLimit-Reset", headers["ratelimit-reset"]],
    ["RateLimit-Policy", headers["ratelimit-policy"]],
    ["Retry-After", headers["retry-after"]],
  ];

  return headerEntries.filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
}

function Playground() {
  const initialQuery = useMemo(
    () =>
      readQueryState({
        resource: "characters",
        search: "",
        limit: "6",
        sort: "",
        include: "",
        filterKey: "",
        filterValue: "",
      }),
    [],
  );
  const hasInitialQuery = useMemo(() => hasSearchParams(), []);
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const resources = catalogState.data?.data || [];
  const [resource, setResource] = useState(initialQuery.resource);
  const docState = useAsyncData(
    () => docsApi.getResourceDoc(resource),
    [resource],
  );
  const [search, setSearch] = useState(initialQuery.search);
  const [limit, setLimit] = useState(initialQuery.limit);
  const [sort, setSort] = useState(initialQuery.sort);
  const [include, setInclude] = useState(initialQuery.include);
  const [filterKey, setFilterKey] = useState(initialQuery.filterKey);
  const [filterValue, setFilterValue] = useState(initialQuery.filterValue);
  const [requestPath, setRequestPath] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [responseMeta, setResponseMeta] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const didHydrateDefaults = useRef(false);
  const didRunInitialQuery = useRef(false);

  useEffect(() => {
    if (!docState.data?.data) {
      return;
    }

    const doc = docState.data.data;
    const nextFilterKey = doc.filters[0]?.id || "";
    const availableFilterKeys = doc.filters.map((item) => item.id);

    if (!didHydrateDefaults.current) {
      setSort((current) => current || doc.defaultSort || "");
      setInclude((current) => current || doc.previewParams?.include || "");
      setFilterKey((current) =>
        availableFilterKeys.includes(current) ? current : nextFilterKey,
      );
      didHydrateDefaults.current = true;
      return;
    }

    setSort(doc.defaultSort || "");
    setInclude(doc.previewParams?.include || "");
    setFilterKey(nextFilterKey);
    setFilterValue("");
  }, [docState.data]);

  async function runRequest(nextState = {}) {
    const nextResource = nextState.resource ?? resource;
    const nextSearch = nextState.search ?? search;
    const nextLimit = nextState.limit ?? limit;
    const nextSort = nextState.sort ?? sort;
    const nextInclude = nextState.include ?? include;
    const nextFilterKey = nextState.filterKey ?? filterKey;
    const nextFilterValue = nextState.filterValue ?? filterValue;

    const params = {
      limit: nextLimit,
      search: nextSearch,
      sort: nextSort,
      include: nextInclude,
    };

    if (nextFilterKey && nextFilterValue) {
      params[`filter[${nextFilterKey}]`] = nextFilterValue;
    }

    setLoading(true);
    setSubmitError("");
    setSubmitErrorDetails([]);

    try {
      const result = await docsApi.getResourceListResponse(
        nextResource,
        params,
      );
      setRequestPath(`/api/v1/${nextResource}${buildQueryString(params)}`);
      setResponseData(result.data);
      setResponseMeta({
        headers: result.headers,
        status: result.status,
      });
    } catch (error) {
      setSubmitError(extractError(error));
      setSubmitErrorDetails(extractErrorDetails(error));
      setResponseData(error?.response?.data || null);
      setResponseMeta(
        error?.response
          ? {
              headers: error.response.headers,
              status: error.response.status,
            }
          : null,
      );
      setRequestPath(`/api/v1/${nextResource}${buildQueryString(params)}`);
    } finally {
      replaceQueryState({
        resource: nextResource,
        search: nextSearch,
        limit: nextLimit,
        sort: nextSort,
        include: nextInclude,
        filterKey: nextFilterKey,
        filterValue: nextFilterValue,
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasInitialQuery || didRunInitialQuery.current) {
      return;
    }

    didRunInitialQuery.current = true;
    runRequest(initialQuery);
  }, [hasInitialQuery, initialQuery]);

  async function handleSubmit(event) {
    event.preventDefault();
    await runRequest();
  }

  if (catalogState.loading) {
    return <StateNotice>Загрузка playground...</StateNotice>;
  }

  if (catalogState.error) {
    return <StateNotice type="error">{catalogState.error}</StateNotice>;
  }

  const doc = docState.data?.data;
  const operationalHeaders = extractOperationalHeaders(responseMeta?.headers);

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Playground</div>
          <h1>Собери запрос вручную</h1>
          <p className="page-lead">
            Playground помогает быстро проверить `search`, `sort`, `include` и
            один выбранный фильтр, не уходя в Postman или отдельный sandbox.
          </p>
        </div>
      </section>

      <form className="section-card playground-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Ресурс</span>
            <select
              value={resource}
              onChange={(event) => setResource(event.target.value)}
            >
              {resources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Search</span>
            <input
              value={search}
              onInput={(event) => setSearch(event.target.value)}
              placeholder="guilliman"
            />
          </label>

          <label>
            <span>Limit</span>
            <input
              value={limit}
              onInput={(event) => setLimit(event.target.value)}
            />
          </label>

          <label>
            <span>Sort</span>
            <input
              value={sort}
              onInput={(event) => setSort(event.target.value)}
              placeholder="-powerLevel,name"
            />
          </label>

          <label>
            <span>Include</span>
            <input
              value={include}
              onInput={(event) => setInclude(event.target.value)}
              placeholder="faction,race"
            />
          </label>

          <label>
            <span>Filter key</span>
            <select
              value={filterKey}
              onChange={(event) => setFilterKey(event.target.value)}
            >
              {(doc?.filters || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
            </select>
          </label>

          <label className="label-wide">
            <span>Filter value</span>
            <input
              value={filterValue}
              onInput={(event) => setFilterValue(event.target.value)}
              placeholder="ultramarines"
            />
          </label>
        </div>

        <button
          type="submit"
          className="action-button"
          disabled={loading || docState.loading}
        >
          {loading ? "Загрузка..." : "Выполнить запрос"}
        </button>
      </form>

      {docState.error && (
        <StateNotice type="error">{docState.error}</StateNotice>
      )}
      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
      {requestPath && <StateNotice>{requestPath}</StateNotice>}
      {responseMeta && (
        <section className="section-card">
          <h2>Operational Headers</h2>
          <div className="stats-hero-grid">
            <article className="stat-card">
              <div className="section-eyebrow">Status</div>
              <div className="stat-value">{responseMeta.status}</div>
              <p>
                Последний ответ Playground. При превышении лимита здесь будет
                `429`.
              </p>
            </article>
            {operationalHeaders.map(([name, value]) => (
              <article key={name} className="stat-card">
                <div className="section-eyebrow">{name}</div>
                <div className="stat-value">{value}</div>
                <p>Header из реального ответа текущего endpoint-а.</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {responseData && <JsonViewer label="Ответ API" data={responseData} />}
    </div>
  );
}

export { Playground };
