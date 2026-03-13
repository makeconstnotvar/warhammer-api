import { useEffect, useMemo, useState } from "preact/hooks";
import { docsApi } from "../api/docsApi";
import { ApiErrorNotice } from "../components/ApiErrorNotice";
import { ApiOperationGuide } from "../components/ApiOperationGuide";
import { JsonViewer } from "../components/JsonViewer";
import { PivotActionLinks } from "../components/PivotActionLinks";
import { StateNotice } from "../components/StateNotice";
import { WorkbenchScenarioSection } from "../components/WorkbenchScenarioSection";
import { extractError, extractErrorDetails, useAsyncData } from "../hooks/useAsyncData";
import { getOpenApiParameterHint, getOpenApiParameterMap } from "../lib/openApi";
import { buildQueryString, readQueryState, replaceQueryState } from "../lib/query";
import {
  parseWorkbenchScenarios,
  parseCompareWorkbenchScenarios,
  parseGraphWorkbenchScenarios,
  parsePathWorkbenchScenarios,
  selectWorkbenchScenarios,
} from "../lib/workbenchScenarios";
import { buildEntityWorkbenchActions } from "../lib/workbenchPivots";
import { buildResourceHeroActions } from "../lib/resourceDocs";

const emptyPreviewState = {
  page: "",
  search: "",
  fields: "",
  mode: "list",
  identifier: "",
  limit: "",
  sort: "",
  include: "",
  filterKey: "",
  filterValue: "",
};

function normalizePreviewState(doc, rawState = {}) {
  const previewParams = doc.previewParams || {};
  const filterKeys = (doc.filters || []).map((item) => item.id);
  const rawMode = rawState.mode === "detail" ? "detail" : "list";
  const nextFilterKey = filterKeys.includes(rawState.filterKey)
    ? rawState.filterKey
    : rawState.filterKey
      ? ""
      : filterKeys[0] || "";

  return {
    mode: rawMode,
    identifier: rawState.identifier || "",
    page: rawState.page || "1",
    search: rawState.search || "",
    fields: rawState.fields || "",
    limit: rawState.limit || String(previewParams.limit || 5),
    sort: rawState.sort || previewParams.sort || doc.defaultSort || "",
    include: rawState.include || previewParams.include || "",
    filterKey: nextFilterKey,
    filterValue: rawState.filterValue || "",
  };
}

function parseSampleQuery(resource, sampleQuery) {
  const [pathPart, rawQuery = ""] = String(sampleQuery || "").split("?");
  const normalizedPath = pathPart.replace(/^\/api\/v1\//, "").replace(/^\//, "");
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== resource) {
    return null;
  }

  const searchParams = new URLSearchParams(rawQuery);
  let filterKey = "";
  let filterValue = "";

  searchParams.forEach((value, key) => {
    const match = key.match(/^filter\[(.+)\]$/);

    if (!match || filterKey) {
      return;
    }

    filterKey = match[1];
    filterValue = value;
  });

  return {
    page: searchParams.get("page") || "",
    search: searchParams.get("search") || "",
    fields: searchParams.get(`fields[${resource}]`) || "",
    mode: segments[1] ? "detail" : "list",
    identifier: segments[1] || "",
    limit: searchParams.get("limit") || "",
    sort: searchParams.get("sort") || "",
    include: searchParams.get("include") || "",
    filterKey,
    filterValue,
  };
}

function buildResourcePreviewParams(resource, previewQuery) {
  const params = {};

  if (previewQuery.include) {
    params.include = previewQuery.include;
  }

  if (previewQuery.fields) {
    params[`fields[${resource}]`] = previewQuery.fields;
  }

  if (previewQuery.mode === "list") {
    if (previewQuery.page) {
      params.page = previewQuery.page;
    }

    if (previewQuery.limit) {
      params.limit = previewQuery.limit;
    }

    if (previewQuery.search) {
      params.search = previewQuery.search;
    }

    if (previewQuery.sort) {
      params.sort = previewQuery.sort;
    }

    if (previewQuery.filterKey && previewQuery.filterValue) {
      params[`filter[${previewQuery.filterKey}]`] = previewQuery.filterValue;
    }
  }

  return params;
}

function buildResourcePreviewPath(resource, previewQuery) {
  const pathname =
    previewQuery.mode === "detail"
      ? `/api/v1/${resource}/${previewQuery.identifier}`
      : `/api/v1/${resource}`;

  return `${pathname}${buildQueryString(buildResourcePreviewParams(resource, previewQuery))}`;
}

function getIdentifierPlaceholder(doc, resource) {
  const detailSample = (doc.sampleQueries || [])
    .map((sampleQuery) => parseSampleQuery(resource, sampleQuery))
    .find((sampleQuery) => sampleQuery?.mode === "detail" && sampleQuery.identifier);

  return detailSample?.identifier || "roboute-guilliman";
}

function IncludedSummary({ included }) {
  const entries = Object.entries(included || {});

  if (!entries.length) {
    return <span className="muted-line">Этот preview не вернул included-блок.</span>;
  }

  return (
    <div className="tag-list">
      {entries.map(([key, items]) => (
        <span key={key} className="metric-chip">
          {key}: {items.length}
        </span>
      ))}
    </div>
  );
}

function PreviewCards({
  compareScenarios,
  graphScenarios,
  include,
  items,
  pathScenarios,
  resource,
}) {
  return (
    <div className="preview-grid">
      {items.map((item) => {
        const actions = buildEntityWorkbenchActions({
          compareScenarios,
          graphScenarios,
          include,
          item,
          pathScenarios,
          resource,
        });

        return (
          <article key={item.id || item.slug} className="preview-card">
            <h3>{item.name || item.slug}</h3>
            {item.summary && <p>{item.summary}</p>}
            <div className="tag-list">
              {item.slug && <span className="tag">{item.slug}</span>}
              {item.status && <span className="tag">{item.status}</span>}
              {item.powerLevel !== undefined && (
                <span className="tag">power {item.powerLevel}</span>
              )}
              {item.influenceLevel !== undefined && (
                <span className="tag">influence {item.influenceLevel}</span>
              )}
              {item.yearLabel && <span className="tag">{item.yearLabel}</span>}
            </div>
            <PivotActionLinks actions={actions} />
          </article>
        );
      })}
    </div>
  );
}

function DetailPreviewCard({ compareScenarios, graphScenarios, item, pathScenarios, resource }) {
  const detailRows = Object.entries(item || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .filter(([, value]) => !Array.isArray(value) && typeof value !== "object")
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
          {item.powerLevel !== undefined && (
            <span className="metric-chip">power {item.powerLevel}</span>
          )}
          {item.influenceLevel !== undefined && (
            <span className="metric-chip">influence {item.influenceLevel}</span>
          )}
          {item.yearLabel && <span className="metric-chip">{item.yearLabel}</span>}
        </div>
      </div>

      {item.summary && <p>{item.summary}</p>}

      <PivotActionLinks
        actions={buildEntityWorkbenchActions({
          compareScenarios,
          graphScenarios,
          include: "",
          item,
          pathScenarios,
          resource,
        })}
      />

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
  const specState = useAsyncData(() => docsApi.getOpenApiSpec(), []);
  const workbenchState = useAsyncData(() => docsApi.getWorkbenchScenarios(), []);
  const [previewQuery, setPreviewQuery] = useState(emptyPreviewState);
  const [requestPath, setRequestPath] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const listParameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, "/api/v1/{resource}"),
    [specState.data]
  );
  const detailParameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, "/api/v1/{resource}/{idOrSlug}"),
    [specState.data]
  );
  const workbenchScenarios = useMemo(
    () => parseWorkbenchScenarios(workbenchState.data),
    [workbenchState.data]
  );
  const compareScenarios = useMemo(
    () => parseCompareWorkbenchScenarios(workbenchState.data),
    [workbenchState.data]
  );
  const graphScenarios = useMemo(
    () => parseGraphWorkbenchScenarios(workbenchState.data),
    [workbenchState.data]
  );
  const pathScenarios = useMemo(
    () => parsePathWorkbenchScenarios(workbenchState.data),
    [workbenchState.data]
  );

  async function runPreview(nextPreviewQuery = previewQuery) {
    const doc = docState.data?.data;

    if (!doc) {
      return;
    }

    const resolvedQuery = normalizePreviewState(doc, nextPreviewQuery);
    const params = buildResourcePreviewParams(resource, resolvedQuery);

    const pathname =
      resolvedQuery.mode === "detail"
        ? `/api/v1/${resource}/${resolvedQuery.identifier}`
        : `/api/v1/${resource}`;

    if (resolvedQuery.mode === "detail" && !resolvedQuery.identifier) {
      setRequestPath(pathname);
      setResponseData(null);
      setSubmitError("Для detail preview нужен id или slug.");
      setSubmitErrorDetails([]);
      replaceQueryState({
        page: "",
        search: "",
        [`fields[${resource}]`]: resolvedQuery.fields,
        mode: resolvedQuery.mode,
        identifier: resolvedQuery.identifier,
        include: resolvedQuery.include,
        limit: "",
        sort: "",
        filterKey: "",
        filterValue: "",
      });
      return;
    }

    setLoading(true);
    setSubmitError("");
    setSubmitErrorDetails([]);

    try {
      const result =
        resolvedQuery.mode === "detail"
          ? await docsApi.getResourceDetail(resource, resolvedQuery.identifier, params)
          : await docsApi.getResourceList(resource, params);

      setRequestPath(`${pathname}${buildQueryString(params)}`);
      setResponseData(result);
      setPreviewQuery(resolvedQuery);
    } catch (error) {
      setSubmitError(extractError(error));
      setSubmitErrorDetails(extractErrorDetails(error));
      setResponseData(null);
      setRequestPath(`${pathname}${buildQueryString(params)}`);
      setPreviewQuery(resolvedQuery);
    } finally {
      replaceQueryState({
        page: resolvedQuery.mode === "list" ? resolvedQuery.page : "",
        search: resolvedQuery.mode === "list" ? resolvedQuery.search : "",
        [`fields[${resource}]`]: resolvedQuery.fields,
        mode: resolvedQuery.mode,
        identifier: resolvedQuery.mode === "detail" ? resolvedQuery.identifier : "",
        limit: resolvedQuery.mode === "list" ? resolvedQuery.limit : "",
        sort: resolvedQuery.mode === "list" ? resolvedQuery.sort : "",
        include: resolvedQuery.include,
        filterKey: resolvedQuery.mode === "list" ? resolvedQuery.filterKey : "",
        filterValue: resolvedQuery.mode === "list" ? resolvedQuery.filterValue : "",
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    setRequestPath("");
    setResponseData(null);
    setSubmitError("");
    setSubmitErrorDetails([]);
  }, [resource]);

  useEffect(() => {
    if (!docState.data?.data) {
      return;
    }

    const searchParams =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search || "");

    const nextPreviewQuery = normalizePreviewState(docState.data.data, {
      ...readQueryState(emptyPreviewState),
      fields: searchParams.get(`fields[${resource}]`) || "",
    });

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
  const fieldPlaceholder = doc.fields.length
    ? doc.fields
        .slice(0, 3)
        .map((field) => field.name)
        .join(",")
    : "id,name,slug";
  const identifierPlaceholder = getOpenApiParameterHint(detailParameterMap.idOrSlug, {
    fallback: getIdentifierPlaceholder(doc, resource),
  });
  const requestPreviewPath = buildResourcePreviewPath(resource, previewQuery);
  const guideRequestPath =
    previewQuery.mode === "detail" && !previewQuery.identifier ? "" : requestPreviewPath;
  const guidePath =
    previewQuery.mode === "detail" ? "/api/v1/{resource}/{idOrSlug}" : "/api/v1/{resource}";
  const guideParameterOrder =
    previewQuery.mode === "detail"
      ? ["resource", "idOrSlug", "include", "fields"]
      : ["resource", "page", "limit", "search", "sort", "include", "fields", "filter"];
  const previewItems = Array.isArray(responseData?.data) ? responseData.data : [];
  const previewDetail =
    responseData?.data && !Array.isArray(responseData.data) ? responseData.data : null;
  const relatedWorkbenchScenarios = selectWorkbenchScenarios(workbenchScenarios, {
    groupLimit: 3,
    limit: 6,
    resources: [resource],
  });
  const detailSample = (doc.sampleQueries || [])
    .map((sampleQuery) => parseSampleQuery(resource, sampleQuery))
    .find((sampleQuery) => sampleQuery?.mode === "detail" && sampleQuery.identifier);
  const heroActions = buildResourceHeroActions({
    detailPreviewQuery: detailSample ? normalizePreviewState(doc, detailSample) : null,
    listPreviewQuery: normalizePreviewState(doc, { mode: "list" }),
    relatedScenario: relatedWorkbenchScenarios[0] || null,
    resource,
  });

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">{doc.id}</div>
          <h1>{doc.label}</h1>
          <p className="page-lead">{doc.description}</p>
          <div className="hero-actions">
            {heroActions.map((action) => (
              <a
                key={`${action.label}-${action.href}`}
                className={action.className}
                href={action.href}
              >
                {action.label}
              </a>
            ))}
          </div>
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
              Можно переключаться между `list` и `detail`, менять `include`, фильтры и сразу
              делиться ссылкой на конкретное состояние документации ресурса.
            </p>
          </div>
          <div className="control-chip-bar">
            <button
              type="button"
              className={`control-chip${previewQuery.mode === "list" ? " control-chip-active" : ""}`}
              onClick={() => updatePreviewQuery({ mode: "list", identifier: "" })}
            >
              list
            </button>
            <button
              type="button"
              className={`control-chip${previewQuery.mode === "detail" ? " control-chip-active" : ""}`}
              onClick={() => updatePreviewQuery({ mode: "detail" })}
            >
              detail
            </button>
          </div>
        </div>

        <form className="resource-preview-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Mode</span>
              <select
                value={previewQuery.mode}
                onChange={(event) => updatePreviewQuery({ mode: event.target.value })}
              >
                <option value="list">list</option>
                <option value="detail">detail</option>
              </select>
            </label>

            {previewQuery.mode === "detail" ? (
              <label className="label-wide">
                <span>ID or slug</span>
                <input
                  value={previewQuery.identifier}
                  onInput={(event) => updatePreviewQuery({ identifier: event.target.value })}
                  placeholder={identifierPlaceholder}
                />
              </label>
            ) : (
              <>
                <label>
                  <span>Page</span>
                  <input
                    value={previewQuery.page}
                    onInput={(event) => updatePreviewQuery({ page: event.target.value })}
                    placeholder={getOpenApiParameterHint(listParameterMap.page)}
                  />
                </label>

                <label>
                  <span>Limit</span>
                  <input
                    value={previewQuery.limit}
                    onInput={(event) => updatePreviewQuery({ limit: event.target.value })}
                    placeholder={getOpenApiParameterHint(listParameterMap.limit)}
                  />
                </label>

                <label>
                  <span>Sort</span>
                  <input
                    value={previewQuery.sort}
                    onInput={(event) => updatePreviewQuery({ sort: event.target.value })}
                    placeholder={doc.defaultSort || getOpenApiParameterHint(listParameterMap.sort)}
                  />
                </label>

                <label className="label-wide">
                  <span>Search</span>
                  <input
                    value={previewQuery.search}
                    onInput={(event) => updatePreviewQuery({ search: event.target.value })}
                    placeholder={getOpenApiParameterHint(listParameterMap.search)}
                  />
                </label>
              </>
            )}

            <label>
              <span>Include</span>
              <input
                value={previewQuery.include}
                onInput={(event) => updatePreviewQuery({ include: event.target.value })}
                placeholder={
                  doc.previewParams?.include || getOpenApiParameterHint(listParameterMap.include)
                }
              />
            </label>

            <label className="label-wide">
              <span>Fields</span>
              <input
                value={previewQuery.fields}
                onInput={(event) => updatePreviewQuery({ fields: event.target.value })}
                placeholder={fieldPlaceholder}
              />
            </label>

            {previewQuery.mode === "list" && doc.filters.length > 0 && (
              <>
                <label>
                  <span>Filter key</span>
                  <select
                    value={previewQuery.filterKey}
                    onChange={(event) => updatePreviewQuery({ filterKey: event.target.value })}
                  >
                    {(doc.filters || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="label-wide">
                  <span>Filter value</span>
                  <input
                    value={previewQuery.filterValue}
                    onInput={(event) => updatePreviewQuery({ filterValue: event.target.value })}
                    placeholder={getOpenApiParameterHint(listParameterMap.filter, {
                      fallback: "imperium-of-man",
                      nestedKey: previewQuery.filterKey,
                    })}
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
              {loading ? "Загрузка..." : "Обновить preview"}
            </button>
          </div>
        </form>
      </section>

      {specState.error && <StateNotice type="error">{specState.error}</StateNotice>}
      {specState.data && (
        <ApiOperationGuide
          description={
            previewQuery.mode === "detail"
              ? "Detail preview теперь опирается на OpenAPI-контракт и live request path."
              : "List preview теперь показывает полный contract layer: page, search, fields, filter и live snippets."
          }
          parameterOrder={guideParameterOrder}
          path={guidePath}
          requestPath={guideRequestPath}
          spec={specState.data}
        />
      )}

      <div className="panel-grid">
        <section className="section-card">
          <h2>Фильтры</h2>
          <div className="tag-list">
            {doc.filters.map((filter) => (
              <span key={filter.id} className="tag">
                {filter.id}
              </span>
            ))}
          </div>
        </section>
        <section className="section-card">
          <h2>Include</h2>
          <div className="tag-list">
            {doc.includes.length ? (
              doc.includes.map((include) => (
                <span key={include.id} className="tag">
                  {include.id}
                </span>
              ))
            ) : (
              <span className="muted-line">Для этого ресурса include не нужен.</span>
            )}
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
              <a className="query-link" href={sampleQuery}>
                {sampleQuery}
              </a>
              <div className="sample-query-actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => handleSampleApply(sampleQuery)}
                >
                  Применить в preview
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {workbenchState.error && <StateNotice type="error">{workbenchState.error}</StateNotice>}

      <WorkbenchScenarioSection
        title="Related Workbench Flows"
        description="Эти сценарии приходят из общего workbench contract и показывают, где текущий ресурс участвует в compare, graph или path flows."
        emptyState="Для этого ресурса пока нет связанных workbench flow."
        scenarios={relatedWorkbenchScenarios}
        summary={`${relatedWorkbenchScenarios.length} related flows`}
      />

      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Результат preview</h2>
                <p className="muted-line">
                  Можно использовать как образец для list page, detail screen или data-fetching
                  примера.
                </p>
              </div>
              <a className="query-link" href={requestPath}>
                {requestPath}
              </a>
            </div>

            <IncludedSummary included={responseData.included} />

            {previewItems.length > 0 && (
              <PreviewCards
                compareScenarios={compareScenarios}
                graphScenarios={graphScenarios}
                items={previewItems}
                pathScenarios={pathScenarios}
                resource={resource}
                include={previewQuery.include}
              />
            )}

            {previewDetail && (
              <DetailPreviewCard
                compareScenarios={compareScenarios}
                graphScenarios={graphScenarios}
                item={previewDetail}
                pathScenarios={pathScenarios}
                resource={resource}
              />
            )}
          </section>

          <JsonViewer label="JSON preview" data={responseData} />
        </>
      )}
    </div>
  );
}

export { ResourcePage };
