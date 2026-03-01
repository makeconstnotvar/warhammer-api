import { useEffect, useMemo, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError } from '../hooks/useAsyncData';
import { buildQueryString, readQueryState, replaceQueryState } from '../lib/query';

const comparePalette = ['#d1a35a', '#78a7c5', '#7fb381', '#c37070', '#9f70c7', '#d69255'];

const comparePresets = {
  battlefields: {
    description: 'Сравни боевые зоны по intensity, terrain, campaign ties и общим участникам.',
    ids: 'hesperon-void-line,kasr-partox-ruins',
    include: 'planet,starSystem,era,factions,characters,campaigns',
    label: 'Поля битв',
  },
  campaigns: {
    description: 'Сравни campaign-level данные по time span, planets, factions, organizations и общим участникам.',
    ids: 'plague-wars,cadian-gate-counteroffensive',
    include: 'era,planets,factions,characters,organizations,battlefields',
    label: 'Кампании',
  },
  factions: {
    description: 'Сравни большие доменные блоки по alignment, races, leaders, homeworld и power spread.',
    ids: 'imperium-of-man,black-legion',
    include: 'races,leaders,homeworld',
    label: 'Фракции',
  },
  characters: {
    description: 'Сравни персонажей по alignment, faction, events, keywords и power level.',
    ids: 'roboute-guilliman,abaddon-the-despoiler',
    include: 'faction,race,homeworld,events',
    label: 'Персонажи',
  },
  organizations: {
    description: 'Сравни институции по influence level, faction ties, leaders и homeworld.',
    ids: 'inquisition,adeptus-mechanicus',
    include: 'factions,leaders,homeworld,era',
    label: 'Организации',
  },
  relics: {
    description: 'Сравни реликвии по bearer, faction, origin и power spread.',
    ids: 'emperors-sword,talon-of-horus',
    include: 'faction,bearer,originPlanet,era,keywords',
    label: 'Реликвии',
  },
  'star-systems': {
    description: 'Сравни системы по segmentum, числу миров и общему системному контексту.',
    ids: 'sol-system,macragge-system',
    include: 'planets,era',
    label: 'Системы',
  },
  units: {
    description: 'Сравни squad-ы и specialist units по faction, weapons, keywords и power spread.',
    ids: 'terminator-squad,intercessor-squad',
    include: 'factions,weapons,keywords',
    label: 'Юниты',
  },
};

const visualMetricDefinitions = {
  battlefields: [
    { id: 'intensity', label: 'Intensity', getter: (item) => item.intensityLevel },
    { id: 'factions', label: 'Фракции', getter: (item) => countValues(item.factionIds) },
    { id: 'characters', label: 'Персонажи', getter: (item) => countValues(item.characterIds) },
    { id: 'campaigns', label: 'Кампании', getter: (item) => countValues(item.campaignIds) },
  ],
  campaigns: [
    { id: 'planets', label: 'Миры', getter: (item) => countValues(item.planetIds) },
    { id: 'factions', label: 'Фракции', getter: (item) => countValues(item.factionIds) },
    { id: 'characters', label: 'Персонажи', getter: (item) => countValues(item.characterIds) },
    { id: 'organizations', label: 'Организации', getter: (item) => countValues(item.organizationIds) },
    { id: 'battlefields', label: 'Поля битв', getter: (item) => countValues(item.battlefieldIds) },
  ],
  factions: [
    { id: 'power', label: 'Power', getter: (item) => item.powerLevel },
    { id: 'leaders', label: 'Лидеры', getter: (item) => countValues(item.leaderIds) },
    { id: 'races', label: 'Расы', getter: (item) => countValues(item.raceIds) },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywords) },
  ],
  characters: [
    { id: 'power', label: 'Power', getter: (item) => item.powerLevel },
    { id: 'events', label: 'События', getter: (item) => countValues(item.eventIds) },
    { id: 'titles', label: 'Titles', getter: (item) => countValues(item.titles) },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywords) },
  ],
  organizations: [
    { id: 'influence', label: 'Influence', getter: (item) => item.influenceLevel },
    { id: 'factions', label: 'Фракции', getter: (item) => countValues(item.factionIds) },
    { id: 'leaders', label: 'Лидеры', getter: (item) => countValues(item.leaderIds) },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywords) },
  ],
  relics: [
    { id: 'power', label: 'Power', getter: (item) => item.powerLevel },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywordIds) },
  ],
  'star-systems': [
    { id: 'planets', label: 'Миры', getter: (item) => countValues(item.planetIds) },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywords) },
  ],
  units: [
    { id: 'power', label: 'Power', getter: (item) => item.powerLevel },
    { id: 'factions', label: 'Фракции', getter: (item) => countValues(item.factionIds) },
    { id: 'weapons', label: 'Оружие', getter: (item) => countValues(item.weaponIds) },
    { id: 'keywords', label: 'Keywords', getter: (item) => countValues(item.keywordIds) },
  ],
};

const pathResourcePresets = {
  battlefields: ['campaigns', 'characters', 'factions', 'planets', 'star-systems'],
  campaigns: ['battlefields', 'characters', 'factions', 'organizations', 'planets'],
  characters: ['campaigns', 'events', 'factions', 'organizations', 'planets', 'relics'],
  factions: ['campaigns', 'characters', 'events', 'organizations', 'planets', 'units'],
  organizations: ['campaigns', 'characters', 'factions', 'planets', 'relics'],
  relics: ['campaigns', 'characters', 'factions', 'planets'],
  'star-systems': ['battlefields', 'campaigns', 'planets'],
  units: ['factions', 'keywords', 'weapons'],
};

const sharedFieldDefinitions = {
  sharedCampaignIds: { label: 'Общие кампании', resource: 'campaigns' },
  sharedCharacterIds: { label: 'Общие персонажи', resource: 'characters' },
  sharedEventIds: { label: 'Общие события', resource: 'events' },
  sharedFactionIds: { label: 'Общие фракции', resource: 'factions' },
  sharedKeywords: { label: 'Общие keywords', resource: null },
  sharedKeywordIds: { label: 'Общие keywords', resource: 'keywords' },
  sharedLeaderIds: { label: 'Общие лидеры', resource: 'characters' },
  sharedOrganizationIds: { label: 'Общие организации', resource: 'organizations' },
  sharedPlanetIds: { label: 'Общие миры', resource: 'planets' },
  sharedRaceIds: { label: 'Общие расы', resource: 'races' },
  sharedWeaponIds: { label: 'Общее оружие', resource: 'weapons' },
};

const profileFieldDefinitions = {
  alignments: 'Alignment',
  battlefieldTypes: 'Типы полей битв',
  campaignTypes: 'Типы кампаний',
  organizationTypes: 'Типы организаций',
  relicTypes: 'Типы реликвий',
  segmentums: 'Segmentum',
  statuses: 'Статусы',
  terrains: 'Terrain',
  unitTypes: 'Типы юнитов',
};

function countValues(value) {
  return Array.isArray(value) ? value.length : 0;
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('ru-RU') : '0';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'нет данных';
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return '0';
    }

    return value.join(', ');
  }

  if (typeof value === 'object') {
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
    lowerKey.includes('power') ||
    lowerKey.includes('influence') ||
    lowerKey.includes('intensity') ||
    metricKey === 'strongest' ||
    metricKey === 'mostInfluential' ||
    metricKey === 'mostIntense'
  ) {
    return 'power';
  }

  if (lowerKey.includes('shared')) {
    return 'shared';
  }

  if (
    lowerKey.includes('type') ||
    lowerKey.includes('status') ||
    lowerKey.includes('year') ||
    lowerKey.includes('segment') ||
    lowerKey.includes('terrain') ||
    metricKey === 'latest' ||
    metricKey === 'earliest'
  ) {
    return 'type';
  }

  return 'default';
}

function buildResourceLookup(included) {
  return Object.entries(included || {}).reduce((result, [resourceKey, items]) => {
    result[resourceKey] = new Map(
      (items || []).map((item) => [
        String(item.id),
        item.name || item.slug || `#${item.id}`,
      ])
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
    include: '',
    mode: 'detail',
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

function buildPathLink(resource, items) {
  if (!Array.isArray(items) || items.length < 2) {
    return '';
  }

  const [fromItem, toItem] = items;

  return `/explore/path${buildQueryString({
    backlinks: 'true',
    fromIdentifier: fromItem.slug || fromItem.id,
    fromResource: resource,
    limitPerRelation: 6,
    maxDepth: 4,
    resources: (pathResourcePresets[resource] || []).join(','),
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
      <div className={`compare-metric-value${compact ? ' compare-metric-value-compact' : ''}`}>{displayValue}</div>
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
            Быстрый слой для карточек сравнения, charts и decision UI без отдельной клиентской агрегации.
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
                  <span key={value} className="tag">{value}</span>
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
          {item.powerLevel !== undefined && <span className="metric-chip">power {item.powerLevel}</span>}
          {item.influenceLevel !== undefined && <span className="metric-chip">influence {item.influenceLevel}</span>}
          {item.intensityLevel !== undefined && <span className="metric-chip">intensity {item.intensityLevel}</span>}
          {Array.isArray(item.planetIds) && <span className="metric-chip">planets {item.planetIds.length}</span>}
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
        <a className="action-link" href={buildDetailLink(resource, item)}>Открыть detail preview</a>
        <a className="action-link action-link-muted" href={buildGraphLink(resource, item)}>Открыть Graph</a>
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
        <span key={key} className="metric-chip">{key}: {items.length}</span>
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
            Из compare можно сразу перейти в traversal-сценарии и проверить, как две записи связаны через relation graph.
          </p>
        </div>
      </div>

      <div className="compare-bridge-grid">
        <article className="compare-bridge-card">
          <div className="resource-kicker">Path</div>
          <h3>Кратчайший путь между сравниваемыми сущностями</h3>
          <p className="muted-line">
            Deeplink уже содержит `backlinks=true`, `maxDepth=4` и whitelist ресурсов под текущий compare.
          </p>
          {pathLink ? (
            <a className="action-link" href={pathLink}>Открыть Path между двумя записями</a>
          ) : (
            <span className="muted-line">Нужно минимум две записи для path bridge.</span>
          )}
        </article>

        <article className="compare-bridge-card">
          <div className="resource-kicker">Graph</div>
          <h3>Фокус на обеих записях по отдельности</h3>
          <div className="compare-bridge-links">
            {items.map((item) => (
              <a key={item.slug || item.id} className="action-link action-link-muted" href={buildGraphLink(resource, item)}>
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
      resource: 'factions',
      ids: comparePresets.factions.ids,
      include: comparePresets.factions.include,
    });
    const safeResource = comparePresets[queryState.resource] ? queryState.resource : 'factions';
    const safePreset = comparePresets[safeResource];

    return {
      ids: queryState.ids || safePreset.ids,
      include: queryState.include || safePreset.include,
      resource: safeResource,
    };
  }, []);
  const [resource, setResource] = useState(initialQuery.resource);
  const [ids, setIds] = useState(initialQuery.ids);
  const [include, setInclude] = useState(initialQuery.include);
  const [requestPath, setRequestPath] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const preset = comparePresets[resource];
  const responseItems = responseData?.data?.items || [];
  const comparison = responseData?.data?.comparison || {};
  const comparisonEntries = useMemo(
    () => Object.entries(comparison),
    [comparison]
  );
  const includedLookup = useMemo(
    () => buildResourceLookup(responseData?.included),
    [responseData]
  );
  const visualMetrics = useMemo(
    () => buildVisualMetrics(resource, responseItems),
    [resource, responseItems]
  );
  const sharedGroups = useMemo(
    () => buildSharedGroups(comparison, includedLookup),
    [comparison, includedLookup]
  );
  const profileGroups = useMemo(
    () => buildProfileGroups(comparison),
    [comparison]
  );
  const pathLink = useMemo(
    () => buildPathLink(resource, responseItems),
    [resource, responseItems]
  );

  async function runCompare(nextResource = resource, nextIds = ids, nextInclude = include) {
    const params = {
      ids: nextIds,
      include: nextInclude,
    };

    setLoading(true);
    setSubmitError('');

    try {
      const result = await docsApi.getCompare(nextResource, params);
      setRequestPath(`/api/v1/compare/${nextResource}${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setResponseData(null);
      setRequestPath(`/api/v1/compare/${nextResource}${buildQueryString(params)}`);
    } finally {
      replaceQueryState({
        resource: nextResource,
        ids: nextIds,
        include: nextInclude,
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    runCompare(initialQuery.resource, initialQuery.ids, initialQuery.include);
  }, []);

  function handleResourceChange(event) {
    const nextResource = event.target.value;
    const nextPreset = comparePresets[nextResource];

    setResource(nextResource);
    setIds(nextPreset.ids);
    setInclude(nextPreset.include);
    runCompare(nextResource, nextPreset.ids, nextPreset.include);
  }

  function handleSubmit(event) {
    event.preventDefault();
    runCompare(resource, ids, include);
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Compare</div>
          <h1>Готовый compare UI поверх одного endpoint-а</h1>
          <p className="page-lead">
            Эта страница показывает, что compare-сценарий не требует сложной клиентской логики.
            Достаточно выбрать ресурс, передать `ids` и `include`, а API вернет и сами items,
            и готовую сводку различий.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">8 compare ресурсов</div>
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
              {Object.entries(comparePresets).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </label>

          <label className="label-wide">
            <span>IDs</span>
            <input value={ids} onInput={(event) => setIds(event.target.value)} placeholder={preset.ids} />
          </label>

          <label className="label-wide">
            <span>Include</span>
            <input value={include} onInput={(event) => setInclude(event.target.value)} placeholder={preset.include} />
          </label>
        </div>

        <div className="compare-form-foot">
          <p className="muted-line">{preset.description}</p>
          <button type="submit" className="action-button" disabled={loading}>
            {loading ? 'Сравнение выполняется...' : 'Выполнить compare'}
          </button>
        </div>
      </form>

      {submitError && <StateNotice type="error">{submitError}</StateNotice>}
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="section-card">
            <div className="stats-section-head">
              <div>
                <h2>Сводка сравнения</h2>
                <p className="muted-line">
                  API уже посчитал пересечения и различия. Клиенту не нужно вручную нормализовать доменную логику.
                </p>
              </div>
              <a className="query-link" href={requestPath}>{requestPath}</a>
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
