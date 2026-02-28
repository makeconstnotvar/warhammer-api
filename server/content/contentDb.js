const db = require('../db');
const { createApiError } = require('../lib/apiErrors');

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function splitCsv(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumberArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => toNumber(value))
    .filter((value) => value !== null);
}

function createQueryContext() {
  const params = [];

  return {
    params,
    where: [],
    add(value) {
      params.push(value);
      return `$${params.length}`;
    },
  };
}

function buildIdentityMatch(idExpression, slugExpression, nameExpression, placeholder) {
  return `(${idExpression}::text = ANY(${placeholder}::text[]) OR ${slugExpression} = ANY(${placeholder}::text[]) OR LOWER(${nameExpression}) = ANY(${placeholder}::text[]))`;
}

function addAttributeFilter(context, expression, rawValue) {
  const values = splitCsv(rawValue).map(normalizeValue);

  if (!values.length) {
    return;
  }

  const placeholder = context.add(values);
  context.where.push(`LOWER(${expression}) = ANY(${placeholder}::text[])`);
}

function addKeywordsFilter(context, expression, rawValue) {
  const values = splitCsv(rawValue).map(normalizeValue);

  if (!values.length) {
    return;
  }

  const placeholder = context.add(values);
  context.where.push(`COALESCE(${expression}, ARRAY[]::text[]) && ${placeholder}::text[]`);
}

function addRelationFilter(context, rawValue, sqlFactory) {
  const values = splitCsv(rawValue).map(normalizeValue);

  if (!values.length) {
    return;
  }

  const placeholder = context.add(values);
  context.where.push(sqlFactory(placeholder));
}

const resourceDbConfigs = {
  eras: {
    alias: 'e',
    fromClause: 'FROM eras e',
    selectClause: `
      e.id,
      e.slug,
      e.name,
      e.summary,
      e.description,
      e.status,
      e.year_label,
      e.year_order,
      COALESCE(e.keywords, ARRAY[]::text[]) AS keywords
    `,
    sortMap: {
      name: 'e.name',
      status: 'e.status',
      yearOrder: 'e.year_order',
    },
    searchExpression: `CONCAT_WS(' ', e.name, e.summary, e.description, array_to_string(COALESCE(e.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'e.status', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'e.keywords', rawValue),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        yearLabel: row.year_label,
        yearOrder: toNumber(row.year_order),
        keywords: row.keywords || [],
      };
    },
  },
  races: {
    alias: 'r',
    fromClause: 'FROM races r',
    selectClause: `
      r.id,
      r.slug,
      r.name,
      r.summary,
      r.description,
      r.status,
      r.alignment,
      COALESCE(r.keywords, ARRAY[]::text[]) AS keywords
    `,
    sortMap: {
      name: 'r.name',
      status: 'r.status',
      alignment: 'r.alignment',
    },
    searchExpression: `CONCAT_WS(' ', r.name, r.summary, r.description, r.alignment, array_to_string(COALESCE(r.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'r.status', rawValue),
      alignment: (context, rawValue) => addAttributeFilter(context, 'r.alignment', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'r.keywords', rawValue),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        alignment: row.alignment,
        keywords: row.keywords || [],
      };
    },
  },
  planets: {
    alias: 'p',
    fromClause: 'FROM planets p',
    selectClause: `
      p.id,
      p.slug,
      p.name,
      p.summary,
      p.description,
      p.status,
      p.type,
      p.sector,
      p.era_id,
      COALESCE(p.keywords, ARRAY[]::text[]) AS keywords
    `,
    sortMap: {
      name: 'p.name',
      status: 'p.status',
      type: 'p.type',
      sector: 'p.sector',
    },
    searchExpression: `CONCAT_WS(' ', p.name, p.summary, p.description, p.type, p.sector, array_to_string(COALESCE(p.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'p.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'p.type', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'p.keywords', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = p.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        type: row.type,
        sector: row.sector,
        eraId: toNumber(row.era_id),
        keywords: row.keywords || [],
      };
    },
  },
  factions: {
    alias: 'f',
    fromClause: 'FROM factions f',
    selectClause: `
      f.id,
      f.slug,
      f.name,
      f.summary,
      f.description,
      f.status,
      f.alignment,
      f.power_level,
      f.parent_faction_id,
      f.homeworld_id,
      f.era_id,
      f.race_id,
      COALESCE(f.keywords, ARRAY[]::text[]) AS keywords,
      COALESCE(ARRAY(
        SELECT fr.race_id
        FROM faction_races fr
        WHERE fr.faction_id = f.id
        ORDER BY fr.is_primary DESC, fr.race_id ASC
      ), ARRAY[]::bigint[]) AS race_ids,
      COALESCE(ARRAY(
        SELECT fl.character_id
        FROM faction_leaders fl
        WHERE fl.faction_id = f.id
        ORDER BY fl.character_id ASC
      ), ARRAY[]::bigint[]) AS leader_ids
    `,
    sortMap: {
      name: 'f.name',
      status: 'f.status',
      alignment: 'f.alignment',
      powerLevel: 'f.power_level',
    },
    searchExpression: `CONCAT_WS(' ', f.name, f.summary, f.description, f.alignment, array_to_string(COALESCE(f.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'f.status', rawValue),
      alignment: (context, rawValue) => addAttributeFilter(context, 'f.alignment', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'f.keywords', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = f.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      race: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `(
          EXISTS (
            SELECT 1
            FROM faction_races fr
            JOIN races race_filter ON race_filter.id = fr.race_id
            WHERE fr.faction_id = f.id
              AND ${buildIdentityMatch('race_filter.id', 'race_filter.slug', 'race_filter.name', placeholder)}
          )
          OR EXISTS (
            SELECT 1
            FROM races race_filter
            WHERE race_filter.id = f.race_id
              AND ${buildIdentityMatch('race_filter.id', 'race_filter.slug', 'race_filter.name', placeholder)}
          )
        )`
      ),
    },
    serialize(row) {
      const raceIds = toNumberArray(row.race_ids);
      const fallbackRaceId = toNumber(row.race_id);

      if (!raceIds.length && fallbackRaceId !== null) {
        raceIds.push(fallbackRaceId);
      }

      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        alignment: row.alignment,
        parentFactionId: toNumber(row.parent_faction_id),
        raceIds,
        leaderIds: toNumberArray(row.leader_ids),
        homeworldId: toNumber(row.homeworld_id),
        eraId: toNumber(row.era_id),
        keywords: row.keywords || [],
        powerLevel: toNumber(row.power_level),
      };
    },
  },
  events: {
    alias: 'ev',
    fromClause: 'FROM events ev',
    selectClause: `
      ev.id,
      ev.slug,
      ev.name,
      ev.summary,
      ev.description,
      ev.status,
      ev.era_id,
      ev.year_label,
      ev.year_order,
      COALESCE(ev.keywords, ARRAY[]::text[]) AS keywords,
      COALESCE(ARRAY(
        SELECT ep.planet_id
        FROM event_planets ep
        WHERE ep.event_id = ev.id
        ORDER BY ep.planet_id ASC
      ), ARRAY[]::bigint[]) AS planet_ids,
      COALESCE(ARRAY(
        SELECT ef.faction_id
        FROM event_factions ef
        WHERE ef.event_id = ev.id
        ORDER BY ef.faction_id ASC
      ), ARRAY[]::bigint[]) AS faction_ids,
      COALESCE(ARRAY(
        SELECT ec.character_id
        FROM event_characters ec
        WHERE ec.event_id = ev.id
        ORDER BY ec.character_id ASC
      ), ARRAY[]::bigint[]) AS character_ids
    `,
    sortMap: {
      name: 'ev.name',
      status: 'ev.status',
      yearOrder: 'ev.year_order',
    },
    searchExpression: `CONCAT_WS(' ', ev.name, ev.summary, ev.description, ev.year_label, array_to_string(COALESCE(ev.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'ev.status', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'ev.keywords', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = ev.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      factions: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM event_factions ef
          JOIN factions faction_filter ON faction_filter.id = ef.faction_id
          WHERE ef.event_id = ev.id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      planets: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM event_planets ep
          JOIN planets planet_filter ON planet_filter.id = ep.planet_id
          WHERE ep.event_id = ev.id
            AND ${buildIdentityMatch('planet_filter.id', 'planet_filter.slug', 'planet_filter.name', placeholder)}
        )`
      ),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        eraId: toNumber(row.era_id),
        yearLabel: row.year_label,
        yearOrder: toNumber(row.year_order),
        planetIds: toNumberArray(row.planet_ids),
        factionIds: toNumberArray(row.faction_ids),
        characterIds: toNumberArray(row.character_ids),
        keywords: row.keywords || [],
      };
    },
  },
  characters: {
    alias: 'c',
    fromClause: 'FROM characters c',
    selectClause: `
      c.id,
      c.slug,
      c.name,
      c.summary,
      c.description,
      c.status,
      c.alignment,
      c.power_level,
      c.faction_id,
      c.race_id,
      c.homeworld_id,
      c.era_id,
      COALESCE(c.keywords, ARRAY[]::text[]) AS keywords,
      COALESCE(ARRAY(
        SELECT ct.title
        FROM character_titles ct
        WHERE ct.character_id = c.id
        ORDER BY ct.sort_order ASC, ct.id ASC
      ), ARRAY[]::text[]) AS titles,
      COALESCE(ARRAY(
        SELECT ec.event_id
        FROM event_characters ec
        WHERE ec.character_id = c.id
        ORDER BY ec.event_id ASC
      ), ARRAY[]::bigint[]) AS event_ids
    `,
    sortMap: {
      name: 'c.name',
      status: 'c.status',
      alignment: 'c.alignment',
      powerLevel: 'c.power_level',
    },
    searchExpression: `CONCAT_WS(
      ' ',
      c.name,
      c.summary,
      c.description,
      c.alignment,
      array_to_string(COALESCE(c.keywords, ARRAY[]::text[]), ' '),
      COALESCE((SELECT string_agg(ct.title, ' ') FROM character_titles ct WHERE ct.character_id = c.id), '')
    )`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'c.status', rawValue),
      alignment: (context, rawValue) => addAttributeFilter(context, 'c.alignment', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'c.keywords', rawValue),
      faction: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM factions faction_filter
          WHERE faction_filter.id = c.faction_id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      race: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM races race_filter
          WHERE race_filter.id = c.race_id
            AND ${buildIdentityMatch('race_filter.id', 'race_filter.slug', 'race_filter.name', placeholder)}
        )`
      ),
      homeworld: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM planets planet_filter
          WHERE planet_filter.id = c.homeworld_id
            AND ${buildIdentityMatch('planet_filter.id', 'planet_filter.slug', 'planet_filter.name', placeholder)}
        )`
      ),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = c.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        factionId: toNumber(row.faction_id),
        raceId: toNumber(row.race_id),
        homeworldId: toNumber(row.homeworld_id),
        eraId: toNumber(row.era_id),
        titles: row.titles || [],
        eventIds: toNumberArray(row.event_ids),
        keywords: row.keywords || [],
        alignment: row.alignment,
        powerLevel: toNumber(row.power_level),
      };
    },
  },
};

function getResourceDbConfig(resourceKey) {
  const config = resourceDbConfigs[resourceKey];

  if (!config) {
    throw createApiError(404, 'RESOURCE_NOT_FOUND', `Unknown resource "${resourceKey}"`);
  }

  return config;
}

function buildWhereClause(context) {
  if (!context.where.length) {
    return '';
  }

  return `WHERE ${context.where.join(' AND ')}`;
}

function buildOrderClause(config, sortFields) {
  const orderParts = sortFields.map((sortField) => {
    const direction = sortField.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortField.startsWith('-') ? sortField.slice(1) : sortField;
    return `${config.sortMap[field]} ${direction}`;
  });

  return `ORDER BY ${orderParts.join(', ')}`;
}

function addSearchCondition(config, context, search) {
  if (!search) {
    return;
  }

  const placeholder = context.add(`%${String(search).trim()}%`);
  context.where.push(`${config.searchExpression} ILIKE ${placeholder}`);
}

function addFilters(config, context, filters = {}) {
  Object.entries(filters).forEach(([filterKey, rawValue]) => {
    const builder = config.filterBuilders[filterKey];

    if (builder) {
      builder(context, rawValue);
    }
  });
}

async function listResourceRows(resourceKey, options) {
  const config = getResourceDbConfig(resourceKey);
  const context = createQueryContext();

  addFilters(config, context, options.filters);
  addSearchCondition(config, context, options.search);

  const whereClause = buildWhereClause(context);
  const orderClause = buildOrderClause(config, options.sort);
  const limitPlaceholder = context.add(options.limit);
  const offsetPlaceholder = context.add((options.page - 1) * options.limit);

  const dataQuery = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    ${whereClause}
    ${orderClause}
    LIMIT ${limitPlaceholder}
    OFFSET ${offsetPlaceholder}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    ${config.fromClause}
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, context.params),
    db.query(countQuery, context.params.slice(0, -2)),
  ]);

  return {
    rows: dataResult.rows.map((row) => config.serialize(row)),
    total: countResult.rows[0].total,
  };
}

async function getResourceRow(resourceKey, idOrSlug) {
  const config = getResourceDbConfig(resourceKey);
  const query = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    WHERE ${config.alias}.id::text = $1 OR ${config.alias}.slug = $1
    LIMIT 1
  `;

  const result = await db.query(query, [String(idOrSlug)]);
  return result.rows[0] ? config.serialize(result.rows[0]) : null;
}

async function loadResourcesByIds(resourceKey, ids) {
  if (!ids.length) {
    return [];
  }

  const config = getResourceDbConfig(resourceKey);
  const query = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    WHERE ${config.alias}.id = ANY($1::bigint[])
  `;

  const result = await db.query(query, [ids]);
  return result.rows.map((row) => config.serialize(row));
}

async function getResourceCount(resourceKey) {
  const config = getResourceDbConfig(resourceKey);
  const result = await db.query(`SELECT COUNT(*)::int AS total ${config.fromClause}`);
  return result.rows[0].total;
}

async function searchResourceRows(resourceKey, search, limit) {
  const config = getResourceDbConfig(resourceKey);
  const dataQuery = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    WHERE ${config.searchExpression} ILIKE $1
    ${buildOrderClause(config, Object.keys(config.sortMap).includes('name') ? ['name'] : [Object.keys(config.sortMap)[0]])}
    LIMIT $2
  `;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    ${config.fromClause}
    WHERE ${config.searchExpression} ILIKE $1
  `;

  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, [`%${String(search).trim()}%`, limit]),
    db.query(countQuery, [`%${String(search).trim()}%`]),
  ]);

  return {
    rows: dataResult.rows.map((row) => config.serialize(row)),
    total: countResult.rows[0].total,
  };
}

async function loadResourcesByIdentifiers(resourceKey, identifiers) {
  const normalizedValues = splitCsv(identifiers)
    .map((value) => normalizeValue(value))
    .filter(Boolean);

  if (!normalizedValues.length) {
    return [];
  }

  const config = getResourceDbConfig(resourceKey);
  const query = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    WHERE ${buildIdentityMatch(`${config.alias}.id`, `${config.alias}.slug`, `${config.alias}.name`, '$1')}
  `;

  const result = await db.query(query, [normalizedValues]);
  return result.rows.map((row) => config.serialize(row));
}

async function getRandomResourceRow(resourceKey) {
  const config = getResourceDbConfig(resourceKey);
  const query = `
    SELECT ${config.selectClause}
    ${config.fromClause}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  const result = await db.query(query);
  return result.rows[0] ? config.serialize(result.rows[0]) : null;
}

async function getFactionStatsByRace() {
  const query = `
    SELECT
      r.id,
      r.slug,
      r.name,
      COUNT(DISTINCT fr.faction_id)::int AS count
    FROM races r
    LEFT JOIN faction_races fr ON fr.race_id = r.id
    GROUP BY r.id, r.slug, r.name
    ORDER BY count DESC, r.name ASC
  `;

  const result = await db.query(query);
  return result.rows.map((row) => ({
    id: toNumber(row.id),
    slug: row.slug,
    name: row.name,
    count: toNumber(row.count),
  }));
}

async function getEventStatsByEra() {
  const query = `
    SELECT
      e.id,
      e.slug,
      e.name,
      COUNT(ev.id)::int AS count
    FROM eras e
    LEFT JOIN events ev ON ev.era_id = e.id
    GROUP BY e.id, e.slug, e.name
    ORDER BY count DESC, e.name ASC
  `;

  const result = await db.query(query);
  return result.rows.map((row) => ({
    id: toNumber(row.id),
    slug: row.slug,
    name: row.name,
    count: toNumber(row.count),
  }));
}

module.exports = {
  getEventStatsByEra,
  getFactionStatsByRace,
  getRandomResourceRow,
  getResourceCount,
  getResourceRow,
  loadResourcesByIdentifiers,
  listResourceRows,
  loadResourcesByIds,
  searchResourceRows,
};
