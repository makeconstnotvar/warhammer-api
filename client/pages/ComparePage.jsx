import { useEffect, useMemo, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { extractError } from '../hooks/useAsyncData';
import { buildQueryString, readQueryState, replaceQueryState } from '../lib/query';

const comparePresets = {
  campaigns: {
    description: 'Сравни campaign-level данные по time span, planets, factions, organizations и общим участникам.',
    ids: 'plague-wars,cadian-gate-counteroffensive',
    include: 'era,planets,factions,characters,organizations',
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
  units: {
    description: 'Сравни squad-ы и specialist units по faction, weapons, keywords и power spread.',
    ids: 'terminator-squad,intercessor-squad',
    include: 'factions,weapons,keywords',
    label: 'Юниты',
  },
};

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

    if (value.name && value.yearLabel) {
      return `${value.name} (${value.yearLabel})`;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function getMetricTone(metricKey) {
  if (
    metricKey.toLowerCase().includes('power') ||
    metricKey.toLowerCase().includes('influence') ||
    metricKey === 'strongest' ||
    metricKey === 'mostInfluential'
  ) {
    return 'power';
  }

  if (metricKey.toLowerCase().includes('shared')) {
    return 'shared';
  }

  if (
    metricKey.toLowerCase().includes('type') ||
    metricKey.toLowerCase().includes('status') ||
    metricKey.toLowerCase().includes('year') ||
    metricKey === 'latest' ||
    metricKey === 'earliest'
  ) {
    return 'type';
  }

  return 'default';
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

function CompareItemCard({ item }) {
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
          {item.yearLabel && <span className="metric-chip">{item.yearLabel}</span>}
        </div>
      </div>
      {item.summary && <p>{item.summary}</p>}
      <div className="tag-list">
        {item.status && <span className="tag">{item.status}</span>}
        {item.alignment && <span className="tag">{item.alignment}</span>}
        {item.unitType && <span className="tag">{item.unitType}</span>}
        {item.organizationType && <span className="tag">{item.organizationType}</span>}
        {item.relicType && <span className="tag">{item.relicType}</span>}
        {item.campaignType && <span className="tag">{item.campaignType}</span>}
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
  const comparisonEntries = useMemo(
    () => Object.entries(responseData?.data?.comparison || {}),
    [responseData]
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
          <div className="metric-chip">6 compare ресурсов</div>
          <div className="metric-chip">live request builder</div>
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

          <section className="section-card">
            <h2>Сравниваемые записи</h2>
            <div className="compare-item-grid">
              {responseData.data.items.map((item) => (
                <CompareItemCard key={item.id || item.slug} item={item} />
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
