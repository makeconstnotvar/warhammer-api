import { docsApi } from '../api/docsApi';
import { JsonViewer } from '../components/JsonViewer';
import { StateNotice } from '../components/StateNotice';
import { useAsyncData } from '../hooks/useAsyncData';

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('ru-RU') : '0';
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

function Stats() {
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
  const topFactionUnit = stats.unitsByFaction.data.find((item) => item.count > 0);
  const topWeaponKeyword = stats.weaponsByKeyword.data.find((item) => item.count > 0);
  const busiestEra = stats.eventsByEra.data.find((item) => item.count > 0);
  const dominantRace = stats.factionsByRace.data.find((item) => item.count > 0);

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
          <div className="metric-chip">Live docs preview</div>
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
          detail={busiestEra ? `${busiestEra.count} событий` : 'Пока нет записей'}
        />
        <StatHeroCard
          label="Самая широкая раса"
          value={dominantRace ? dominantRace.name : 'Нет данных'}
          detail={dominantRace ? `${dominantRace.count} фракций` : 'Пока нет записей'}
        />
      </section>

      <div className="panel-grid stats-panel-grid">
        <RankingList
          rows={stats.unitsByFaction.data}
          metricKey="count"
          metricLabel="units"
          secondaryLabel={{ key: 'averagePowerLevel', label: 'avg power' }}
          endpoint="/api/v1/stats/units/by-faction"
          title="Юниты по фракциям"
          description="Подходит для faction dashboards, army builder overview и compare screen."
          accent="units"
        />
        <RankingList
          rows={stats.weaponsByKeyword.data}
          metricKey="count"
          metricLabel="weapons"
          secondaryLabel={{ key: 'averagePowerLevel', label: 'avg power' }}
          endpoint="/api/v1/stats/weapons/by-keyword"
          title="Оружие по keywords"
          description="Полезно для legend panel, filter analytics и exploration UI по weapon profiles."
          accent="weapons"
        />
        <RankingList
          rows={stats.factionsByRace.data}
          metricKey="count"
          metricLabel="factions"
          endpoint="/api/v1/stats/factions/by-race"
          title="Фракции по расам"
          description="Готовый источник для pie chart, stacked summary и доменных обзорных карточек."
          accent="factions"
        />
        <RankingList
          rows={stats.eventsByEra.data}
          metricKey="count"
          metricLabel="events"
          endpoint="/api/v1/stats/events/by-era"
          title="События по эрам"
          description="Подходит для timeline overview, era compare и activity heatmap."
          accent="events"
        />
      </div>

      <JsonViewer
        label="Live stats payload"
        data={{
          factionsByRace: stats.factionsByRace,
          eventsByEra: stats.eventsByEra,
          unitsByFaction: stats.unitsByFaction,
          weaponsByKeyword: stats.weaponsByKeyword,
        }}
      />
    </div>
  );
}

export { Stats };
