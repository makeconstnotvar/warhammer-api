import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { docsApi } from "../api/docsApi";
import { ApiErrorNotice } from "../components/ApiErrorNotice";
import { ApiOperationGuide } from "../components/ApiOperationGuide";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import { extractError, extractErrorDetails, useAsyncData } from "../hooks/useAsyncData";
import { formatOpenApiValue, getOpenApiParameterMap } from "../lib/openApi";
import {
  buildQueryString,
  hasSearchParams,
  parseCsvParam,
  readQueryState,
  replaceQueryState,
  toCsvParam,
} from "../lib/query";

const playgroundParameterOrder = ["page", "limit", "search", "sort", "include", "fields", "filter"];

function extractOperationalHeaders(headers = {}) {
  const headerEntries = [
    ["RateLimit-Limit", headers["ratelimit-limit"]],
    ["RateLimit-Remaining", headers["ratelimit-remaining"]],
    ["RateLimit-Reset", headers["ratelimit-reset"]],
    ["RateLimit-Policy", headers["ratelimit-policy"]],
    ["Retry-After", headers["retry-after"]],
  ];

  return headerEntries.filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function buildFilterParamKey(filterKey) {
  return `filter[${filterKey}]`;
}

function buildRequestParams(state) {
  const params = {
    include: state.include,
    limit: state.limit,
    page: state.page,
    search: state.search,
    sort: state.sort,
  };

  if (state.fields) {
    params[`fields[${state.resource}]`] = state.fields;
  }

  if (state.filterKey && state.filterValue) {
    params[buildFilterParamKey(state.filterKey)] = state.filterValue;
  }

  return params;
}

function toggleCsvValue(rawValue, nextValue) {
  const values = parseCsvParam(rawValue);

  if (values.includes(nextValue)) {
    return toCsvParam(values.filter((value) => value !== nextValue));
  }

  return toCsvParam([...values, nextValue]);
}

function getSortFieldState(rawSort, fieldName) {
  const values = parseCsvParam(rawSort);

  if (values.includes(`-${fieldName}`)) {
    return "desc";
  }

  if (values.includes(fieldName)) {
    return "asc";
  }

  return "off";
}

function toggleSortField(rawSort, fieldName) {
  const values = parseCsvParam(rawSort);
  const ascValue = fieldName;
  const descValue = `-${fieldName}`;

  if (values.includes(ascValue)) {
    return toCsvParam(values.map((value) => (value === ascValue ? descValue : value)));
  }

  if (values.includes(descValue)) {
    return toCsvParam(values.filter((value) => value !== descValue));
  }

  return toCsvParam([...values, ascValue]);
}

function sanitizeCsvAgainstAllowed(rawValue, allowedValues = [], fallbackValue = "") {
  const allowedSet = new Set((allowedValues || []).map((value) => String(value)));

  if (!allowedSet.size) {
    return fallbackValue;
  }

  const values = parseCsvParam(rawValue).filter((value) => allowedSet.has(value));
  return values.length ? toCsvParam(values) : fallbackValue;
}

function sanitizeSortValue(rawValue, allowedSortFields = [], fallbackValue = "") {
  const allowedSet = new Set((allowedSortFields || []).map((value) => String(value)));

  if (!allowedSet.size) {
    return fallbackValue;
  }

  const values = parseCsvParam(rawValue).filter((value) =>
    allowedSet.has(String(value).replace(/^-/, ""))
  );

  return values.length ? toCsvParam(values) : fallbackValue;
}

function parseSampleQueryState(samplePath) {
  const url = new URL(samplePath, "http://localhost");
  const pathParts = url.pathname.split("/").filter(Boolean);
  const resource = pathParts[2] || "characters";
  const searchParams = url.searchParams;
  const filterEntry = [...searchParams.entries()].find(([key]) => key.startsWith("filter["));

  return {
    fields: searchParams.get(`fields[${resource}]`) || "",
    filterKey: filterEntry ? filterEntry[0].slice(7, -1) : "",
    filterValue: filterEntry ? filterEntry[1] : "",
    include: searchParams.get("include") || "",
    limit: searchParams.get("limit") || "12",
    page: searchParams.get("page") || "1",
    resource,
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "",
  };
}

function Playground() {
  const initialQuery = useMemo(
    () =>
      readQueryState({
        fields: "",
        filterKey: "",
        filterValue: "",
        include: "",
        limit: "6",
        page: "1",
        resource: "characters",
        search: "",
        sort: "",
      }),
    []
  );
  const hasInitialQuery = useMemo(() => hasSearchParams(), []);
  const didRunInitialQuery = useRef(false);
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const specState = useAsyncData(() => docsApi.getOpenApiSpec(), []);
  const resources = catalogState.data?.data || [];
  const [resource, setResource] = useState(initialQuery.resource);
  const docState = useAsyncData(() => docsApi.getResourceDoc(resource), [resource]);
  const [search, setSearch] = useState(initialQuery.search);
  const [page, setPage] = useState(initialQuery.page);
  const [limit, setLimit] = useState(initialQuery.limit);
  const [sort, setSort] = useState(initialQuery.sort);
  const [include, setInclude] = useState(initialQuery.include);
  const [fields, setFields] = useState(initialQuery.fields);
  const [filterKey, setFilterKey] = useState(initialQuery.filterKey);
  const [filterValue, setFilterValue] = useState(initialQuery.filterValue);
  const [requestPath, setRequestPath] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [responseMeta, setResponseMeta] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const doc = docState.data?.data;
  const parameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, "/api/v1/{resource}"),
    [specState.data]
  );
  const operationalHeaders = extractOperationalHeaders(responseMeta?.headers);
  const availableIncludes = doc?.includes || [];
  const availableFields = doc?.fields || [];
  const availableFilters = doc?.filters || [];
  const availableSortFields = doc?.sortFields || [];
  const fieldPlaceholder = useMemo(
    () =>
      availableFields.length
        ? availableFields
            .slice(0, 3)
            .map((field) => field.name)
            .join(",")
        : "id,name,slug",
    [availableFields]
  );
  const requestPreviewPath = useMemo(() => {
    const requestState = {
      fields,
      filterKey,
      filterValue,
      include,
      limit,
      page,
      resource,
      search,
      sort,
    };

    return `/api/v1/${resource}${buildQueryString(buildRequestParams(requestState))}`;
  }, [fields, filterKey, filterValue, include, limit, page, resource, search, sort]);

  useEffect(() => {
    if (!doc) {
      return;
    }

    const nextFilterKey = availableFilters[0]?.id || "";
    const includeFallback = doc.previewParams?.include || "";

    setPage((current) => current || "1");
    setSort((current) => sanitizeSortValue(current, availableSortFields, doc.defaultSort || ""));
    setInclude((current) =>
      sanitizeCsvAgainstAllowed(
        current,
        availableIncludes.map((item) => item.id),
        includeFallback
      )
    );
    setFields((current) =>
      sanitizeCsvAgainstAllowed(
        current,
        availableFields.map((field) => field.name),
        ""
      )
    );

    if (!availableFilters.some((item) => item.id === filterKey)) {
      setFilterKey(nextFilterKey);
      setFilterValue("");
    }
  }, [availableFields, availableFilters, availableIncludes, availableSortFields, doc, filterKey]);

  async function runRequest(nextState = {}) {
    const requestState = {
      fields: nextState.fields ?? fields,
      filterKey: nextState.filterKey ?? filterKey,
      filterValue: nextState.filterValue ?? filterValue,
      include: nextState.include ?? include,
      limit: nextState.limit ?? limit,
      page: nextState.page ?? page,
      resource: nextState.resource ?? resource,
      search: nextState.search ?? search,
      sort: nextState.sort ?? sort,
    };
    const params = buildRequestParams(requestState);

    setLoading(true);
    setSubmitError("");
    setSubmitErrorDetails([]);

    try {
      const result = await docsApi.getResourceListResponse(requestState.resource, params);
      setRequestPath(`/api/v1/${requestState.resource}${buildQueryString(params)}`);
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
          : null
      );
      setRequestPath(`/api/v1/${requestState.resource}${buildQueryString(params)}`);
    } finally {
      replaceQueryState(requestState);
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

  async function applySampleQuery(samplePath) {
    const parsedState = parseSampleQueryState(samplePath);

    setResource(parsedState.resource);
    setSearch(parsedState.search);
    setPage(parsedState.page);
    setLimit(parsedState.limit);
    setSort(parsedState.sort);
    setInclude(parsedState.include);
    setFields(parsedState.fields);
    setFilterKey(parsedState.filterKey);
    setFilterValue(parsedState.filterValue);

    await runRequest(parsedState);
  }

  if (catalogState.loading) {
    return <StateNotice>Загрузка playground...</StateNotice>;
  }

  if (catalogState.error) {
    return <StateNotice type="error">{catalogState.error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Playground</div>
          <h1>Contract-driven playground поверх `/api/v1/{"{resource}"}`</h1>
          <p className="page-lead">
            Эта форма теперь опирается на `/api/v1/openapi.json` и metadata ресурса. Параметры,
            defaults и quick toggles больше не живут как набор ручных строк вне контракта.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">page + fields</div>
          <div className="metric-chip">OpenAPI hints</div>
          <div className="metric-chip">sample query apply</div>
        </div>
      </section>

      <form className="section-card playground-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Ресурс</span>
            <select value={resource} onChange={(event) => setResource(event.target.value)}>
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
              placeholder={formatOpenApiValue(parameterMap.search?.example)}
            />
          </label>

          <label>
            <span>Page</span>
            <input
              value={page}
              onInput={(event) => setPage(event.target.value)}
              placeholder={formatOpenApiValue(
                parameterMap.page?.schema?.default || parameterMap.page?.example
              )}
            />
          </label>

          <label>
            <span>Limit</span>
            <input
              value={limit}
              onInput={(event) => setLimit(event.target.value)}
              placeholder={formatOpenApiValue(
                parameterMap.limit?.schema?.default || parameterMap.limit?.example
              )}
            />
          </label>

          <label>
            <span>Sort</span>
            <input
              value={sort}
              onInput={(event) => setSort(event.target.value)}
              placeholder={doc?.defaultSort || formatOpenApiValue(parameterMap.sort?.example)}
            />
          </label>

          <label>
            <span>Include</span>
            <input
              value={include}
              onInput={(event) => setInclude(event.target.value)}
              placeholder={
                doc?.previewParams?.include || formatOpenApiValue(parameterMap.include?.example)
              }
            />
          </label>

          <label className="label-wide">
            <span>Fields</span>
            <input
              value={fields}
              onInput={(event) => setFields(event.target.value)}
              placeholder={fieldPlaceholder}
            />
          </label>

          <label>
            <span>Filter key</span>
            <select value={filterKey} onChange={(event) => setFilterKey(event.target.value)}>
              {(availableFilters || []).map((item) => (
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
              placeholder={filterKey || "ultramarines"}
            />
          </label>
        </div>

        <div className="resource-preview-foot">
          <p className="muted-line">
            `page`, `limit`, `sort`, `include`, `fields` и `filter[...]` сохраняются в URL. Для
            текущего ресурса доступны {availableSortFields.length} sort fields,{" "}
            {availableIncludes.length} includes и {availableFields.length} selectable fields.
          </p>
          <button type="submit" className="action-button" disabled={loading || docState.loading}>
            {loading ? "Загрузка..." : "Выполнить запрос"}
          </button>
        </div>
      </form>

      {docState.error && <StateNotice type="error">{docState.error}</StateNotice>}
      {specState.error && <StateNotice type="error">{specState.error}</StateNotice>}
      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {specState.data && (
        <ApiOperationGuide
          description="Подсказки и сниппеты читаются из `/api/v1/openapi.json` и синхронизируются с текущим состоянием формы."
          parameterOrder={playgroundParameterOrder}
          path="/api/v1/{resource}"
          requestPath={requestPreviewPath}
          spec={specState.data}
        />
      )}

      {doc && (
        <div className="panel-grid">
          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Quick toggles</h2>
                <p className="muted-line">
                  Клик по sort field переключает <code>asc -&gt; desc -&gt; off</code>.
                </p>
              </div>
            </div>

            <div className="playground-option-stack">
              <div>
                <div className="resource-kicker">Sort fields</div>
                <div className="control-chip-bar">
                  {availableSortFields.map((fieldName) => {
                    const sortState = getSortFieldState(sort, fieldName);
                    const label =
                      sortState === "desc"
                        ? `↓ ${fieldName}`
                        : sortState === "asc"
                          ? `↑ ${fieldName}`
                          : fieldName;

                    return (
                      <button
                        key={fieldName}
                        type="button"
                        className={`control-chip${sortState !== "off" ? " control-chip-active" : ""}`}
                        onClick={() => setSort((current) => toggleSortField(current, fieldName))}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="resource-kicker">Includes</div>
                <div className="control-chip-bar">
                  {availableIncludes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`control-chip${parseCsvParam(include).includes(item.id) ? " control-chip-active" : ""}`}
                      onClick={() => setInclude((current) => toggleCsvValue(current, item.id))}
                    >
                      {item.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Fieldsets and filters</h2>
                <p className="muted-line">
                  Собирай sparse fieldsets и быстро переключай активный filter key.
                </p>
              </div>
            </div>

            <div className="playground-option-stack">
              <div>
                <div className="resource-kicker">Fields</div>
                <div className="control-chip-bar">
                  {availableFields.map((field) => (
                    <button
                      key={field.name}
                      type="button"
                      className={`control-chip${parseCsvParam(fields).includes(field.name) ? " control-chip-active" : ""}`}
                      onClick={() => setFields((current) => toggleCsvValue(current, field.name))}
                    >
                      {field.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="resource-kicker">Filter keys</div>
                <div className="control-chip-bar">
                  {availableFilters.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`control-chip${filterKey === item.id ? " control-chip-active" : ""}`}
                      onClick={() => {
                        setFilterKey(item.id);
                        setFilterValue("");
                      }}
                    >
                      {item.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {doc && (
        <section className="section-card">
          <div className="stats-section-head">
            <div>
              <h2>Sample queries</h2>
              <p className="muted-line">
                Применяй примеры ресурса прямо в форму, а не копируй URL вручную.
              </p>
            </div>
          </div>

          <div className="panel-grid">
            {(doc.sampleQueries || []).map((samplePath) => (
              <article key={samplePath} className="sample-query-card">
                <div className="resource-kicker">{doc.label}</div>
                <a className="query-link" href={samplePath}>
                  {samplePath}
                </a>
                <div className="graph-card-actions">
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => applySampleQuery(samplePath)}
                  >
                    Применить в Playground
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {responseMeta && (
        <section className="section-card">
          <h2>Operational Headers</h2>
          <div className="stats-hero-grid">
            <article className="stat-card">
              <div className="section-eyebrow">Status</div>
              <div className="stat-value">{responseMeta.status}</div>
              <p>Последний ответ Playground. При превышении лимита здесь будет `429`.</p>
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
