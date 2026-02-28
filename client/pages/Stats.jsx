import { useMemo, useState } from 'preact/hooks';
import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';
import { readQueryState, replaceQueryState } from '../lib/query';

const chartPalette = ['#d1a35a', '#78a7c5', '#9f70c7', '#c37070', '#7fb381', '#d69255'];
const accentColorMap = {
  events: '#c37070',
  factions: '#9f70c7',
  units: '#d1a35a',
  weapons: '#78a7c5',
};

const statsFocusOptions = [
  { id: 'all', label: 'Все секции' },
  { id: 'units-by-faction', label: 'Юниты' },
  { id: 'weapons-by-keyword', label: 'Оружие' },
  { id: 'factions-by-race', label: 'Фракции' },
  { id: 'events-by-era', label: 'События' },
];

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('ru-RU') : '0';
}

function sumRows(rows, key = 'count') {
  return rows.reduce((sum, row) => sum + (row[key] || 0), 0);
}

function getPositiveRows(rows, key = 'count') {
  return rows.filter((row) => (row[key] || 0) > 0);
}

function getTopRow(rows, key = 'count') {
  return rows.reduce((best, row) => {
    if (!best || (row[key] || 0) > (best[key] || 0)) {
      return row;
    }

    return best;
  }, null);
}

function aggregateBy(rows, key) {
  const grouped = rows.reduce((result, row) => {
    const groupKey = row[key] || 'unknown';
    result[groupKey] = result[groupKey] || {
      count: 0,
      id: groupKey,
      label: groupKey,
    };
    result[groupKey].count += row.count || 0;
    return result;
  }, {});

  return Object.values(grouped).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function shortenLabel(value, maxLength = 18) {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function StatHeroCard({ label, value, detail }) {
  return (
    <article className="stat-card">
      <div className="resource-kicker">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted-line">{detail}</div>
    </article>
  );
}

function RankingList({ rows, metricKey, metricLabel, secondaryLabel, endpoint, title, description, accent = 'count' }) {
  const maxMetric = Math.max(...rows.map((row) => row[metricKey] || 0), 1);

  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>{title}</h2>
          <p className="muted-line">{description}</p>
        </div>
        <a className="query-link" href={endpoint}>{endpoint}</a>
      </div>

      <div className="stats-list">
        {rows.map((row) => {
          const metricValue = row[metricKey] || 0;
          const width = `${Math.max((metricValue / maxMetric) * 100, 8)}%`;

          return (
            <article key={row.slug} className="stats-row">
              <div className="stats-row-copy">
                <div className="stats-row-titleline">
                  <h3>{row.name}</h3>
                  {row.category && <span className="tag">{row.category}</span>}
                  {row.yearLabel && <span className="tag">{row.yearLabel}</span>}
                </div>
                <div className="stats-track">
                  <div className={`stats-fill stats-fill-${accent}`} style={{ width }} />
                </div>
              </div>

              <div className="stats-row-metrics">
                <span className="metric-chip">{metricLabel}: {formatNumber(metricValue)}</span>
                {secondaryLabel && row[secondaryLabel.key] !== undefined && (
                  <span className="tag">{secondaryLabel.label}: {formatNumber(row[secondaryLabel.key])}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChartCard({ children, endpoint, title, description }) {
  return (
    <section className="section-card chart-card">
      <div className="stats-section-head">
        <div>
          <h2>{title}</h2>
          <p className="muted-line">{description}</p>
        </div>
        <a className="query-link" href={endpoint}>{endpoint}</a>
      </div>
      {children}
    </section>
  );
}

function ColumnChart({ rows, title, description, endpoint, accent }) {
  const positiveRows = getPositiveRows(rows).slice(0, 6);
  const width = 520;
  const height = 260;
  const paddingX = 26;
  const paddingTop = 20;
  const paddingBottom = 68;
  const chartHeight = height - paddingTop - paddingBottom;
  const columnWidth = positiveRows.length ? (width - paddingX * 2) / positiveRows.length : width;
  const maxValue = Math.max(...positiveRows.map((row) => row.count), 1);
  const color = accentColorMap[accent] || chartPalette[0];

  return (
    <ChartCard title={title} description={description} endpoint={endpoint}>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = paddingTop + chartHeight - chartHeight * step;
          return (
            <line
              key={step}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              className="chart-gridline"
            />
          );
        })}

        {positiveRows.map((row, index) => {
          const value = row.count || 0;
          const barHeight = (value / maxValue) * chartHeight;
          const x = paddingX + index * columnWidth + columnWidth * 0.18;
          const y = paddingTop + chartHeight - barHeight;
          const barWidth = columnWidth * 0.64;
          const labelX = x + barWidth / 2;

          return (
            <g key={row.slug}>
              <text className="chart-value-label" x={labelX} y={Math.max(y - 8, 14)} textAnchor="middle">
                {value}
              </text>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="14"
                fill={color}
                fillOpacity="0.88"
              />
              <text className="chart-axis-label" x={labelX} y={height - 28} textAnchor="middle">
                {shortenLabel(row.name, 14)}
              </text>
              <text className="chart-axis-subtle" x={labelX} y={height - 12} textAnchor="middle">
                avg {formatNumber(row.averagePowerLevel)}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}

function DonutChart({ rows, title, description, endpoint }) {
  const positiveRows = getPositiveRows(rows);
  const topRows = positiveRows.slice(0, 5);
  const remainder = positiveRows.slice(5);
  const total = sumRows(positiveRows);
  const displayRows = remainder.length
    ? [...topRows, { count: sumRows(remainder), name: 'Other', slug: 'other' }]
    : topRows;
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <ChartCard title={title} description={description} endpoint={endpoint}>
      <div className="chart-split">
        <svg className="chart-svg chart-svg-donut" viewBox="0 0 220 220" role="img" aria-label={title}>
          <circle cx="110" cy="110" r={radius} className="chart-ring-base" />
          {displayRows.map((row, index) => {
            const segmentLength = total ? (row.count / total) * circumference : 0;
            const dashArray = `${segmentLength} ${circumference - segmentLength}`;
            const dashOffset = -offset;
            offset += segmentLength;

            return (
              <circle
                key={row.slug || row.name}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={chartPalette[index % chartPalette.length]}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                strokeWidth="24"
                transform="rotate(-90 110 110)"
              />
            );
          })}
          <text x="110" y="102" textAnchor="middle" className="chart-donut-total">
            {formatNumber(total)}
          </text>
          <text x="110" y="124" textAnchor="middle" className="chart-donut-label">
            total
          </text>
        </svg>

        <div className="chart-legend">
          {displayRows.map((row, index) => (
            <div key={row.slug || row.name} className="chart-legend-item">
              <span className="chart-swatch" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
              <span>{row.name}</span>
              <span className="chart-legend-value">{formatNumber(row.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function TimelineChart({ rows, title, description, endpoint }) {
  const orderedRows = [...rows].sort((left, right) => (left.yearOrder || 0) - (right.yearOrder || 0));
  const width = 520;
  const height = 260;
  const paddingLeft = 28;
  const paddingRight = 24;
  const paddingTop = 26;
  const paddingBottom = 60;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...orderedRows.map((row) => row.count || 0), 1);
  const points = orderedRows.map((row, index) => {
    const x = paddingLeft + (orderedRows.length === 1 ? chartWidth / 2 : (chartWidth / (orderedRows.length - 1)) * index);
    const y = paddingTop + chartHeight - ((row.count || 0) / maxValue) * chartHeight;
    return { ...row, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1]?.x || paddingLeft} ${paddingTop + chartHeight} L ${points[0]?.x || paddingLeft} ${paddingTop + chartHeight} Z`;

  return (
    <ChartCard title={title} description={description} endpoint={endpoint}>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = paddingTop + chartHeight - chartHeight * step;
          return (
            <line
              key={step}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="chart-gridline"
            />
          );
        })}

        {points.length > 1 && <path d={areaPath} className="chart-area chart-area-events" />}
        {points.length > 1 && <path d={path} className="chart-line chart-line-events" />}

        {points.map((point) => (
          <g key={point.slug}>
            <circle cx={point.x} cy={point.y} r="6" className="chart-point chart-point-events" />
            <text className="chart-value-label" x={point.x} y={Math.max(point.y - 10, 16)} textAnchor="middle">
              {point.count}
            </text>
            <text className="chart-axis-label" x={point.x} y={height - 28} textAnchor="middle">
              {point.yearLabel || point.name}
            </text>
            <text className="chart-axis-subtle" x={point.x} y={height - 12} textAnchor="middle">
              {shortenLabel(point.name, 16)}
            </text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}

function StackedCategoryChart({ rows, title, description, endpoint }) {
  const categoryRows = aggregateBy(getPositiveRows(rows), 'category');
  const total = sumRows(categoryRows);

  return (
    <ChartCard title={title} description={description} endpoint={endpoint}>
      <div className="chart-stack">
        {categoryRows.map((row, index) => (
          <div
            key={row.id}
            className="chart-stack-segment"
            style={{
              backgroundColor: chartPalette[index % chartPalette.length],
              width: `${total ? (row.count / total) * 100 : 0}%`,
            }}
            title={`${row.label}: ${row.count}`}
          />
        ))}
      </div>

      <div className="chart-legend">
        {categoryRows.map((row, index) => (
          <div key={row.id} className="chart-legend-item">
            <span className="chart-swatch" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
            <span>{row.label}</span>
            <span className="chart-legend-value">{formatNumber(row.count)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function Stats() {
  const initialQuery = useMemo(() => readQueryState({ focus: 'all' }), []);
  const [focus, setFocus] = useState(
    statsFocusOptions.some((option) => option.id === initialQuery.focus) ? initialQuery.focus : 'all'
  );
  const { data, loading, error } = useAsyncData(
    () => Promise.all([
      docsApi.getStats('factions', 'by-race'),
      docsApi.getStats('events', 'by-era'),
      docsApi.getStats('units', 'by-faction'),
      docsApi.getStats('weapons', 'by-keyword'),
    ]).then(([factionsByRace, eventsByEra, unitsByFaction, weaponsByKeyword]) => ({
      eventsByEra,
      factionsByRace,
      unitsByFaction,
      weaponsByKeyword,
    })),
    []
  );

  if (loading) {
    return <StateNotice>Загрузка аналитических сводок...</StateNotice>;
  }

  if (error) {
    return <StateNotice type="error">{error}</StateNotice>;
  }

  const stats = data;
  const topFactionUnit = getTopRow(stats.unitsByFaction.data, 'count');
  const topWeaponKeyword = getTopRow(stats.weaponsByKeyword.data, 'count');
  const busiestEra = getTopRow(stats.eventsByEra.data, 'count');
  const dominantRace = getTopRow(stats.factionsByRace.data, 'count');
  const payloadByFocus = {
    'events-by-era': stats.eventsByEra,
    'factions-by-race': stats.factionsByRace,
    'units-by-faction': stats.unitsByFaction,
    'weapons-by-keyword': stats.weaponsByKeyword,
  };
  const sections = [
    {
      id: 'units-by-faction',
      rows: stats.unitsByFaction.data,
      metricKey: 'count',
      metricLabel: 'units',
      secondaryLabel: { key: 'averagePowerLevel', label: 'avg power' },
      endpoint: '/api/v1/stats/units/by-faction',
      title: 'Юниты по фракциям',
      description: 'Подходит для faction dashboards, army builder overview и compare screen.',
      accent: 'units',
    },
    {
      id: 'weapons-by-keyword',
      rows: stats.weaponsByKeyword.data,
      metricKey: 'count',
      metricLabel: 'weapons',
      secondaryLabel: { key: 'averagePowerLevel', label: 'avg power' },
      endpoint: '/api/v1/stats/weapons/by-keyword',
      title: 'Оружие по keywords',
      description: 'Полезно для legend panel, filter analytics и exploration UI по weapon profiles.',
      accent: 'weapons',
    },
    {
      id: 'factions-by-race',
      rows: stats.factionsByRace.data,
      metricKey: 'count',
      metricLabel: 'factions',
      endpoint: '/api/v1/stats/factions/by-race',
      title: 'Фракции по расам',
      description: 'Готовый источник для pie chart, stacked summary и доменных обзорных карточек.',
      accent: 'factions',
    },
    {
      id: 'events-by-era',
      rows: stats.eventsByEra.data,
      metricKey: 'count',
      metricLabel: 'events',
      endpoint: '/api/v1/stats/events/by-era',
      title: 'События по эрам',
      description: 'Подходит для timeline overview, era compare и activity heatmap.',
      accent: 'events',
    },
  ];
  const visibleSections = focus === 'all'
    ? sections
    : sections.filter((section) => section.id === focus);
  const visiblePayload = focus === 'all'
    ? {
      factionsByRace: stats.factionsByRace,
      eventsByEra: stats.eventsByEra,
      unitsByFaction: stats.unitsByFaction,
      weaponsByKeyword: stats.weaponsByKeyword,
    }
    : { [focus]: payloadByFocus[focus] };
  const chartSections = [
    {
      id: 'units-by-faction',
      node: (
        <ColumnChart
          rows={stats.unitsByFaction.data}
          title="Unit density по фракциям"
          description="Колонки быстро показывают, где модель данных уже достаточно плотная для army builder и squad browser."
          endpoint="/api/v1/stats/units/by-faction"
          accent="units"
        />
      ),
    },
    {
      id: 'weapons-by-keyword',
      node: (
        <StackedCategoryChart
          rows={stats.weaponsByKeyword.data}
          title="Weapon taxonomy по категориям"
          description="Распределение keyword categories помогает понять, как строить filters и legend-блоки."
          endpoint="/api/v1/stats/weapons/by-keyword"
        />
      ),
    },
    {
      id: 'factions-by-race',
      node: (
        <DonutChart
          rows={stats.factionsByRace.data}
          title="Race share среди фракций"
          description="Donut быстро показывает перекос учебного набора и доминирующие расы в публичном API."
          endpoint="/api/v1/stats/factions/by-race"
        />
      ),
    },
    {
      id: 'events-by-era',
      node: (
        <TimelineChart
          rows={stats.eventsByEra.data}
          title="Timeline активности по эрам"
          description="Линия по `yearOrder` показывает, как timeline-экран может читать плотность событий по эпохам."
          endpoint="/api/v1/stats/events/by-era"
        />
      ),
    },
  ];
  const visibleCharts = focus === 'all'
    ? chartSections
    : chartSections.filter((section) => section.id === focus);

  function handleFocusChange(nextFocus) {
    setFocus(nextFocus);
    replaceQueryState({
      focus: nextFocus === 'all' ? '' : nextFocus,
    });
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Stats</div>
          <h1>Живые analytics-сценарии поверх API</h1>
          <p className="page-lead">
            Эта страница показывает, что API уже умеет отдавать агрегаты для dashboard, compare UI,
            charts и exploration-экранов без клиентской пост-обработки.
          </p>
          <div className="hero-actions">
            <a className="action-link" href="/playground">Проверить в Playground</a>
            <a className="action-link action-link-muted" href="/query-guide">Открыть Query Guide</a>
          </div>
        </div>
        <div className="hero-side">
          <div className="metric-chip">4 stats endpoint-а</div>
          <div className="metric-chip">PostgreSQL aggregation</div>
          <div className="metric-chip">SVG charts</div>
        </div>
      </section>

      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>Фокус страницы</h2>
            <p className="muted-line">
              Сохраняется в query params. Можно открыть нужную analytics-секцию сразу по ссылке.
            </p>
          </div>
        </div>
        <div className="control-chip-bar">
          {statsFocusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`control-chip${focus === option.id ? ' control-chip-active' : ''}`}
              onClick={() => handleFocusChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="stats-hero-grid">
        <StatHeroCard
          label="Топ по юнитам"
          value={topFactionUnit ? topFactionUnit.name : 'Нет данных'}
          detail={topFactionUnit ? `${topFactionUnit.count} юнитов, avg power ${topFactionUnit.averagePowerLevel}` : 'Пока нет записей'}
        />
        <StatHeroCard
          label="Топ keyword оружия"
          value={topWeaponKeyword ? topWeaponKeyword.name : 'Нет данных'}
          detail={topWeaponKeyword ? `${topWeaponKeyword.count} weapon matches, avg power ${topWeaponKeyword.averagePowerLevel}` : 'Пока нет записей'}
        />
        <StatHeroCard
          label="Самая насыщенная эра"
          value={busiestEra ? busiestEra.name : 'Нет данных'}
          detail={busiestEra ? `${busiestEra.count} событий, ${busiestEra.yearLabel}` : 'Пока нет записей'}
        />
        <StatHeroCard
          label="Самая широкая раса"
          value={dominantRace ? dominantRace.name : 'Нет данных'}
          detail={dominantRace ? `${dominantRace.count} фракций` : 'Пока нет записей'}
        />
      </section>

      <div className="chart-grid">
        {visibleCharts.map((section) => (
          <div key={section.id}>{section.node}</div>
        ))}
      </div>

      <div className="panel-grid stats-panel-grid">
        {visibleSections.map((section) => (
          <RankingList
            key={section.id}
            rows={section.rows}
            metricKey={section.metricKey}
            metricLabel={section.metricLabel}
            secondaryLabel={section.secondaryLabel}
            endpoint={section.endpoint}
            title={section.title}
            description={section.description}
            accent={section.accent}
          />
        ))}
      </div>

      <JsonViewer label="Live stats payload" data={visiblePayload} />
    </div>
  );
}

export { Stats };
