import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { docsApi } from "../api/docsApi";
import { ApiErrorNotice } from "../components/ApiErrorNotice";
import { ApiOperationGuide } from "../components/ApiOperationGuide";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import { extractError, extractErrorDetails, useAsyncData } from "../hooks/useAsyncData";
import { getOpenApiParameterHint, getOpenApiParameterMap } from "../lib/openApi";
import { buildQueryString, readQueryState, replaceQueryState } from "../lib/query";
import {
  findWorkbenchScenarioByResource,
  parseCompareWorkbenchScenarios,
} from "../lib/workbenchScenarios";

const comparePalette = ["#d1a35a", "#78a7c5", "#7fb381", "#c37070", "#9f70c7", "#d69255"];

function buildCompareParams(resource, ids, include, fields) {
  const params = {
    ids,
    include,
  };

  if (fields) {
    params[`fields[${resource}]`] = fields;
  }

  return params;
}

function createCompareFallbackScenario(resource) {
  return {
    description:
      "Выбери compare-capable ресурс и передай как минимум два identifier-а через `ids`.",
    fields: "",
    ids: "",
    include: "",
    label: resource || "Ресурс",
    resource,
  };
}

const visualMetricDefinitions = {
  battlefields: [
    {
      id: "intensity",
      label: "Intensity",
      getter: (item) => item.intensityLevel,
    },
    {
      id: "factions",
      label: "Фракции",
      getter: (item) => countValues(item.factionIds),
    },
    {
      id: "characters",
      label: "Персонажи",
      getter: (item) => countValues(item.characterIds),
    },
    {
      id: "campaigns",
      label: "Кампании",
      getter: (item) => countValues(item.campaignIds),
    },
  ],
  campaigns: [
    {
      id: "planets",
      label: "Миры",
      getter: (item) => countValues(item.planetIds),
    },
    {
      id: "factions",
      label: "Фракции",
      getter: (item) => countValues(item.factionIds),
    },
    {
      id: "characters",
      label: "Персонажи",
      getter: (item) => countValues(item.characterIds),
    },
    {
      id: "organizations",
      label: "Организации",
      getter: (item) => countValues(item.organizationIds),
    },
    {
      id: "battlefields",
      label: "Поля битв",
      getter: (item) => countValues(item.battlefieldIds),
    },
  ],
  factions: [
    { id: "power", label: "Power", getter: (item) => item.powerLevel },
    {
      id: "leaders",
      label: "Лидеры",
      getter: (item) => countValues(item.leaderIds),
    },
    { id: "races", label: "Расы", getter: (item) => countValues(item.raceIds) },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywords),
    },
  ],
  characters: [
    { id: "power", label: "Power", getter: (item) => item.powerLevel },
    {
      id: "events",
      label: "События",
      getter: (item) => countValues(item.eventIds),
    },
    {
      id: "titles",
      label: "Titles",
      getter: (item) => countValues(item.titles),
    },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywords),
    },
  ],
  organizations: [
    {
      id: "influence",
      label: "Influence",
      getter: (item) => item.influenceLevel,
    },
    {
      id: "factions",
      label: "Фракции",
      getter: (item) => countValues(item.factionIds),
    },
    {
      id: "leaders",
      label: "Лидеры",
      getter: (item) => countValues(item.leaderIds),
    },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywords),
    },
  ],
  relics: [
    { id: "power", label: "Power", getter: (item) => item.powerLevel },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywordIds),
    },
  ],
  "star-systems": [
    {
      id: "planets",
      label: "Миры",
      getter: (item) => countValues(item.planetIds),
    },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywords),
    },
  ],
  units: [
    { id: "power", label: "Power", getter: (item) => item.powerLevel },
    {
      id: "factions",
      label: "Фракции",
      getter: (item) => countValues(item.factionIds),
    },
    {
      id: "weapons",
      label: "Оружие",
      getter: (item) => countValues(item.weaponIds),
    },
    {
      id: "keywords",
      label: "Keywords",
      getter: (item) => countValues(item.keywordIds),
    },
  ],
};

const sharedFieldDefinitions = {
  sharedCampaignIds: { label: "Общие кампании", resource: "campaigns" },
  sharedCharacterIds: { label: "Общие персонажи", resource: "characters" },
  sharedEventIds: { label: "Общие события", resource: "events" },
  sharedFactionIds: { label: "Общие фракции", resource: "factions" },
  sharedKeywords: { label: "Общие keywords", resource: null },
  sharedKeywordIds: { label: "Общие keywords", resource: "keywords" },
  sharedLeaderIds: { label: "Общие лидеры", resource: "characters" },
  sharedOrganizationIds: {
    label: "Общие организации",
    resource: "organizations",
  },
  sharedPlanetIds: { label: "Общие миры", resource: "planets" },
  sharedRaceIds: { label: "Общие расы", resource: "races" },
  sharedWeaponIds: { label: "Общее оружие", resource: "weapons" },
};

const profileFieldDefinitions = {
  alignments: "Alignment",
  battlefieldTypes: "Типы полей битв",
  campaignTypes: "Типы кампаний",
  organizationTypes: "Типы организаций",
  relicTypes: "Типы реликвий",
  segmentums: "Segmentum",
  statuses: "Статусы",
  terrains: "Terrain",
  unitTypes: "Типы юнитов",
};

function countValues(value) {
  return Array.isArray(value) ? value.length : 0;
}

function formatNumber(value) {
  return typeof value === "number" ? value.toLocaleString("ru-RU") : "0";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "нет данных";
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return "0";
    }

    return value.join(", ");
  }

  if (typeof value === "object") {
    if (value.name && value.powerLevel !== undefined) {
      return `${value.name} (${value.powerLevel})`;
    }

    if (value.name && value.influenceLevel !== undefined) {
      return `${value.name} (${value.influenceLevel})`;
    }

    if (value.name && value.intensityLevel !== undefined) {
      return `${value.name} (${value.intensityLevel})`;
    }

    if (value.name && value.planetCount !== undefined) {
      return `${value.name} (${value.planetCount} миров)`;
    }

    if (value.name && value.yearLabel) {
      return `${value.name} (${value.yearLabel})`;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function getMetricTone(metricKey) {
  const lowerKey = metricKey.toLowerCase();

  if (
    lowerKey.includes("power") ||
    lowerKey.includes("influence") ||
    lowerKey.includes("intensity") ||
    metricKey === "strongest" ||
    metricKey === "mostInfluential" ||
    metricKey === "mostIntense"
  ) {
    return "power";
  }

  if (lowerKey.includes("shared")) {
    return "shared";
  }

  if (
    lowerKey.includes("type") ||
    lowerKey.includes("status") ||
    lowerKey.includes("year") ||
    lowerKey.includes("segment") ||
    lowerKey.includes("terrain") ||
    metricKey === "latest" ||
    metricKey === "earliest"
  ) {
    return "type";
  }

  return "default";
}

function buildResourceLookup(included) {
  return Object.entries(included || {}).reduce((result, [resourceKey, items]) => {
    result[resourceKey] = new Map(
      (items || []).map((item) => [String(item.id), item.name || item.slug || `#${item.id}`])
    );
    return result;
  }, {});
}

function resolveNamedValues(values, definition, lookup) {
  if (!Array.isArray(values) || !values.length) {
    return [];
  }

  if (!definition.resource) {
    return values.map((value) => String(value));
  }

  const resourceLookup = lookup[definition.resource];

  return values.map((value) => {
    const resolved = resourceLookup?.get(String(value));
    return resolved || `#${value}`;
  });
}

function buildSharedGroups(comparison, lookup) {
  return Object.entries(sharedFieldDefinitions).reduce((result, [key, definition]) => {
    const values = comparison[key];

    if (!Array.isArray(values) || !values.length) {
      return result;
    }

    result.push({
      id: key,
      label: definition.label,
      values: resolveNamedValues(values, definition, lookup),
    });
    return result;
  }, []);
}

function buildProfileGroups(comparison) {
  return Object.entries(profileFieldDefinitions).reduce((result, [key, label]) => {
    const values = comparison[key];

    if (!Array.isArray(values) || !values.length) {
      return result;
    }

    result.push({
      id: key,
      label,
      values: values.map((value) => String(value)),
    });
    return result;
  }, []);
}

function buildVisualMetrics(resource, items) {
  const definitions = visualMetricDefinitions[resource] || [];

  return definitions.reduce((result, definition) => {
    const rows = items
      .map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        value: definition.getter(item),
      }))
      .filter((row) => row.value !== null && row.value !== undefined);

    if (!rows.length) {
      return result;
    }

    result.push({
      id: definition.id,
      label: definition.label,
      maxValue: Math.max(...rows.map((row) => row.value || 0), 1),
      rows,
    });
    return result;
  }, []);
}

function buildDetailLink(resource, item) {
  return `/resources/${resource}${buildQueryString({
    identifier: item.slug || item.id,
    include: "",
    mode: "detail",
  })}`;
}

function buildGraphLink(resource, item) {
  return `/explore/graph${buildQueryString({
    backlinks: true,
    depth: 2,
    identifier: item.slug || item.id,
    limitPerRelation: 4,
    resource,
  })}`;
}

function buildPathLink(resource, items, pathResources = []) {
  if (!Array.isArray(items) || items.length < 2) {
    return "";
  }

  const [fromItem, toItem] = items;

  return `/explore/path${buildQueryString({
    backlinks: "true",
    fromIdentifier: fromItem.slug || fromItem.id,
    fromResource: resource,
    limitPerRelation: 6,
    maxDepth: 4,
    resources: pathResources.join(","),
    toIdentifier: toItem.slug || toItem.id,
    toResource: resource,
  })}`;
}

function CompareMetricCard({ label, value }) {
  const tone = getMetricTone(label);
  const displayValue = formatValue(value);
  const compact = displayValue.length > 36;

  return (
    <article className={`compare-metric-card compare-metric-card-${tone}`}>
      <div className="resource-kicker">{label}</div>
      <div className={`compare-metric-value${compact ? " compare-metric-value-compact" : ""}`}>
        {displayValue}
      </div>
    </article>
  );
}

function CompareVisualSection({ metrics }) {
  if (!metrics.length) {
    return null;
  }

  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>Visual compare</h2>
          <p className="muted-line">
            Быстрый слой для карточек сравнения, charts и decision UI без отдельной клиентской
            агрегации.
          </p>
        </div>
      </div>

      <div className="compare-visual-grid">
        {metrics.map((metric) => (
          <article key={metric.id} className="compare-visual-card">
            <div className="compare-visual-head">
              <div className="resource-kicker">{metric.id}</div>
              <h3>{metric.label}</h3>
            </div>

            <div className="compare-visual-list">
              {metric.rows.map((row, index) => {
                const width = `${Math.max(((row.value || 0) / metric.maxValue) * 100, 8)}%`;

                return (
                  <div key={`${metric.id}-${row.slug || row.id}`} className="compare-visual-row">
                    <div className="compare-visual-meta">
                      <span>{row.name}</span>
                      <strong>{formatNumber(row.value)}</strong>
                    </div>
                    <div className="compare-visual-track">
                      <div
                        className="compare-visual-fill"
                        style={{
                          backgroundColor: comparePalette[index % comparePalette.length],
                          width,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparePillSection({ title, description, groups, emptyMessage }) {
  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>{title}</h2>
          <p className="muted-line">{description}</p>
        </div>
      </div>

      {groups.length ? (
        <div className="compare-pill-grid">
          {groups.map((group) => (
            <article key={group.id} className="compare-pill-card">
              <div className="resource-kicker">{group.values.length}</div>
              <h3>{group.label}</h3>
              <div className="compare-pill-list">
                {group.values.map((value) => (
                  <span key={value} className="tag">
                    {value}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-line">{emptyMessage}</p>
      )}
    </section>
  );
}

function CompareItemCard({ item, resource }) {
  return (
    <article className="compare-item-card">
      <div className="compare-item-head">
        <div>
          <div className="resource-kicker">{item.slug}</div>
          <h3>{item.name}</h3>
        </div>
        <div className="tag-list">
          {item.powerLevel !== undefined && (
            <span className="metric-chip">power {item.powerLevel}</span>
          )}
          {item.influenceLevel !== undefined && (
            <span className="metric-chip">influence {item.influenceLevel}</span>
          )}
          {item.intensityLevel !== undefined && (
            <span className="metric-chip">intensity {item.intensityLevel}</span>
          )}
          {Array.isArray(item.planetIds) && (
            <span className="metric-chip">planets {item.planetIds.length}</span>
          )}
          {item.yearLabel && <span className="metric-chip">{item.yearLabel}</span>}
        </div>
      </div>

      {item.summary && <p>{item.summary}</p>}

      <div className="tag-list">
        {item.status && <span className="tag">{item.status}</span>}
        {item.alignment && <span className="tag">{item.alignment}</span>}
        {item.segmentum && <span className="tag">{item.segmentum}</span>}
        {item.unitType && <span className="tag">{item.unitType}</span>}
        {item.organizationType && <span className="tag">{item.organizationType}</span>}
        {item.relicType && <span className="tag">{item.relicType}</span>}
        {item.campaignType && <span className="tag">{item.campaignType}</span>}
        {item.battlefieldType && <span className="tag">{item.battlefieldType}</span>}
        {item.terrain && <span className="tag">{item.terrain}</span>}
      </div>

      <div className="compare-item-actions">
        <a className="action-link" href={buildDetailLink(resource, item)}>
          Открыть detail preview
        </a>
        <a className="action-link action-link-muted" href={buildGraphLink(resource, item)}>
          Открыть Graph
        </a>
      </div>
    </article>
  );
}

function IncludedSummary({ included }) {
  const entries = Object.entries(included || {});

  if (!entries.length) {
    return <span className="muted-line">Этот compare не вернул included-блок.</span>;
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

function CompareBridgeSection({ items, pathLink, resource }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>Explore bridge</h2>
          <p className="muted-line">
            Из compare можно сразу перейти в traversal-сценарии и проверить, как две записи связаны
            через relation graph.
          </p>
        </div>
      </div>

      <div className="compare-bridge-grid">
        <article className="compare-bridge-card">
          <div className="resource-kicker">Path</div>
          <h3>Кратчайший путь между сравниваемыми сущностями</h3>
          <p className="muted-line">
            Deeplink уже содержит `backlinks=true`, `maxDepth=4` и server-owned whitelist ресурсов,
            если он задан для текущего compare-сценария.
          </p>
          {pathLink ? (
            <a className="action-link" href={pathLink}>
              Открыть Path между двумя записями
            </a>
          ) : (
            <span className="muted-line">Нужно минимум две записи для path bridge.</span>
          )}
        </article>

        <article className="compare-bridge-card">
          <div className="resource-kicker">Graph</div>
          <h3>Фокус на обеих записях по отдельности</h3>
          <div className="compare-bridge-links">
            {items.map((item) => (
              <a
                key={item.slug || item.id}
                className="action-link action-link-muted"
                href={buildGraphLink(resource, item)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ComparePage() {
  const initialQuery = useMemo(() => {
    const queryState = readQueryState({
      include: "",
      resource: "",
    });
    const searchParams =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search || "");

    return {
      fields: queryState.resource ? searchParams.get(`fields[${queryState.resource}]`) || "" : "",
      hasQuery: searchParams.toString().length > 0,
      ids: searchParams.get("ids") || searchParams.get("items") || searchParams.get("values") || "",
      include: queryState.include,
      resource: queryState.resource,
    };
  }, []);
  const initialRunRef = useRef(false);
  const specState = useAsyncData(() => docsApi.getOpenApiSpec(), []);
  const workbenchState = useAsyncData(() => docsApi.getWorkbenchScenarios(), []);
  const compareScenarios = useMemo(
    () => parseCompareWorkbenchScenarios(workbenchState.data),
    [workbenchState.data]
  );
  const [resource, setResource] = useState(initialQuery.resource);
  const [ids, setIds] = useState(initialQuery.ids);
  const [include, setInclude] = useState(initialQuery.include);
  const [fields, setFields] = useState(initialQuery.fields);
  const [requestPath, setRequestPath] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const docState = useAsyncData(
    () => (resource ? docsApi.getResourceDoc(resource) : Promise.resolve({ data: { fields: [] } })),
    [resource]
  );

  const preset =
    findWorkbenchScenarioByResource(compareScenarios, resource) ||
    createCompareFallbackScenario(resource);
  const compareParameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, "/api/v1/compare/{resource}"),
    [specState.data]
  );
  const fieldPlaceholder = useMemo(() => {
    const resourceFields = docState.data?.data?.fields || [];

    if (resourceFields.length) {
      return resourceFields
        .slice(0, 3)
        .map((field) => field.name)
        .join(",");
    }

    return getOpenApiParameterHint(compareParameterMap.fields, {
      fallback: "id,name,slug",
      nestedKey: resource,
    });
  }, [compareParameterMap.fields, docState.data, resource]);
  const responseItems = responseData?.data?.items || [];
  const comparison = responseData?.data?.comparison || {};
  const comparisonEntries = useMemo(() => Object.entries(comparison), [comparison]);
  const includedLookup = useMemo(() => buildResourceLookup(responseData?.included), [responseData]);
  const visualMetrics = useMemo(
    () => buildVisualMetrics(resource, responseItems),
    [resource, responseItems]
  );
  const sharedGroups = useMemo(
    () => buildSharedGroups(comparison, includedLookup),
    [comparison, includedLookup]
  );
  const profileGroups = useMemo(() => buildProfileGroups(comparison), [comparison]);
  const pathLink = useMemo(
    () => buildPathLink(resource, responseItems, preset.pathResources || []),
    [preset.pathResources, resource, responseItems]
  );
  const requestPreviewPath = useMemo(
    () =>
      `/api/v1/compare/${resource}${buildQueryString(
        buildCompareParams(resource, ids, include, fields)
      )}`,
    [fields, ids, include, resource]
  );

  async function runCompare(
    nextResource = resource,
    nextIds = ids,
    nextInclude = include,
    nextFields = fields
  ) {
    const params = buildCompareParams(nextResource, nextIds, nextInclude, nextFields);

    setLoading(true);
    setSubmitError("");
    setSubmitErrorDetails([]);

    try {
      const result = await docsApi.getCompare(nextResource, params);
      setRequestPath(`/api/v1/compare/${nextResource}${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setSubmitErrorDetails(extractErrorDetails(error));
      setResponseData(null);
      setRequestPath(`/api/v1/compare/${nextResource}${buildQueryString(params)}`);
    } finally {
      replaceQueryState({
        resource: nextResource,
        ids: nextIds,
        include: nextInclude,
        [`fields[${nextResource}]`]: nextFields,
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRunRef.current) {
      return;
    }

    const hasInitialRequest = Boolean(initialQuery.resource && initialQuery.ids);

    if (!hasInitialRequest && !compareScenarios.length) {
      if (workbenchState.loading || workbenchState.error) {
        return;
      }
    }

    const defaultScenario =
      findWorkbenchScenarioByResource(compareScenarios, "factions") || compareScenarios[0] || null;
    const nextResource = initialQuery.resource || defaultScenario?.resource || "";
    const resourceScenario =
      findWorkbenchScenarioByResource(compareScenarios, nextResource) || defaultScenario;
    const nextIds = initialQuery.ids || resourceScenario?.ids || "";
    const nextInclude = initialQuery.include || resourceScenario?.include || "";
    const nextFields = initialQuery.fields || "";

    if (!nextResource || !nextIds) {
      return;
    }

    initialRunRef.current = true;
    setResource(nextResource);
    setIds(nextIds);
    setInclude(nextInclude);
    setFields(nextFields);
    runCompare(nextResource, nextIds, nextInclude, nextFields);
  }, [compareScenarios, initialQuery, workbenchState.error, workbenchState.loading]);

  function handleResourceChange(event) {
    const nextResource = event.target.value;
    const nextPreset =
      findWorkbenchScenarioByResource(compareScenarios, nextResource) ||
      createCompareFallbackScenario(nextResource);

    setResource(nextResource);
    setIds(nextPreset.ids);
    setInclude(nextPreset.include);
    setFields("");
    runCompare(nextResource, nextPreset.ids, nextPreset.include, "");
  }

  function handleSubmit(event) {
    event.preventDefault();
    runCompare(resource, ids, include, fields);
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Compare</div>
          <h1>Готовый compare UI поверх одного endpoint-а</h1>
          <p className="page-lead">
            Эта страница показывает, что compare-сценарий не требует сложной клиентской логики.
            Достаточно выбрать ресурс, передать `ids` и `include`, а API вернет и сами items, и
            готовую сводку различий.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">{compareScenarios.length || 8} compare ресурсов</div>
          <div className="metric-chip">visual bars</div>
          <div className="metric-chip">shared overlaps</div>
          <div className="metric-chip">summary + included</div>
        </div>
      </section>

      <form className="section-card compare-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Ресурс</span>
            <select value={resource} onChange={handleResourceChange}>
              {compareScenarios.map((scenario) => (
                <option key={scenario.resource} value={scenario.resource}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>

          <label className="label-wide">
            <span>IDs</span>
            <input
              value={ids}
              onInput={(event) => setIds(event.target.value)}
              placeholder={preset.ids || getOpenApiParameterHint(compareParameterMap.ids)}
            />
          </label>

          <label className="label-wide">
            <span>Include</span>
            <input
              value={include}
              onInput={(event) => setInclude(event.target.value)}
              placeholder={preset.include || getOpenApiParameterHint(compareParameterMap.include)}
            />
          </label>

          <label className="label-wide">
            <span>Fields (advanced)</span>
            <input
              value={fields}
              onInput={(event) => setFields(event.target.value)}
              placeholder={fieldPlaceholder}
            />
          </label>
        </div>

        <div className="compare-form-foot">
          <p className="muted-line">
            {preset.description} `fields[...]` сужает payload compare endpoint-а и полезен для
            SDK/demo-клиентов.
          </p>
          <button type="submit" className="action-button" disabled={loading}>
            {loading ? "Сравнение выполняется..." : "Выполнить compare"}
          </button>
        </div>
      </form>

      {specState.error && <StateNotice type="error">{specState.error}</StateNotice>}
      {workbenchState.error && <StateNotice type="error">{workbenchState.error}</StateNotice>}
      {specState.data && (
        <ApiOperationGuide
          description="Compare UI теперь опирается на OpenAPI-контракт и показывает live snippets для текущего compare request."
          parameterOrder={["resource", "ids", "include", "fields"]}
          path="/api/v1/compare/{resource}"
          requestPath={requestPreviewPath}
          spec={specState.data}
        />
      )}
      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Сводка сравнения</h2>
                <p className="muted-line">
                  API уже посчитал пересечения и различия. Клиенту не нужно вручную нормализовать
                  доменную логику.
                </p>
              </div>
              <a className="query-link" href={requestPath}>
                {requestPath}
              </a>
            </div>

            <div className="compare-metric-grid">
              {comparisonEntries.map(([key, value]) => (
                <CompareMetricCard key={key} label={key} value={value} />
              ))}
            </div>
          </section>

          <CompareVisualSection metrics={visualMetrics} />

          <CompareBridgeSection items={responseItems} pathLink={pathLink} resource={resource} />

          <ComparePillSection
            title="Shared overlap"
            description="Готовый слой для chips, overlap widgets и explainable compare UI."
            groups={sharedGroups}
            emptyMessage="У выбранных записей нет общих сущностей в доступном included-наборе."
          />

          <ComparePillSection
            title="Profile tags"
            description="Категории и доменные профили, которые API уже выделил в comparison payload."
            groups={profileGroups}
            emptyMessage="Для этого compare-сценария нет дополнительных profile tags."
          />

          <section className="section-card">
            <h2>Сравниваемые записи</h2>
            <div className="compare-item-grid">
              {responseItems.map((item) => (
                <CompareItemCard key={item.id || item.slug} item={item} resource={resource} />
              ))}
            </div>
          </section>

          <section className="section-card">
            <h2>Included summary</h2>
            <IncludedSummary included={responseData.included} />
          </section>

          <JsonViewer label="Ответ compare endpoint-а" data={responseData} />
        </>
      )}
    </div>
  );
}

export { ComparePage };
