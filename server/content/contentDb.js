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

function escapeLikePattern(value) {
  return String(value || '').replace(/[\\%_]/g, '\\$&');
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
  organizations: {
    alias: 'o',
    fromClause: 'FROM organizations o',
    selectClause: `
      o.id,
      o.slug,
      o.name,
      o.summary,
      o.description,
      o.status,
      o.organization_type,
      o.influence_level,
      o.homeworld_id,
      o.era_id,
      COALESCE(o.keywords, ARRAY[]::text[]) AS keywords,
      COALESCE(ARRAY(
        SELECT ofn.faction_id
        FROM organization_factions ofn
        WHERE ofn.organization_id = o.id
        ORDER BY ofn.is_primary DESC, ofn.faction_id ASC
      ), ARRAY[]::bigint[]) AS faction_ids,
      COALESCE(ARRAY(
        SELECT ol.character_id
        FROM organization_leaders ol
        WHERE ol.organization_id = o.id
        ORDER BY ol.character_id ASC
      ), ARRAY[]::bigint[]) AS leader_ids
    `,
    sortMap: {
      name: 'o.name',
      status: 'o.status',
      organizationType: 'o.organization_type',
      influenceLevel: 'o.influence_level',
    },
    searchExpression: `CONCAT_WS(' ', o.name, o.summary, o.description, o.organization_type, array_to_string(COALESCE(o.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'o.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'o.organization_type', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'o.keywords', rawValue),
      faction: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM organization_factions ofn
          JOIN factions faction_filter ON faction_filter.id = ofn.faction_id
          WHERE ofn.organization_id = o.id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      leader: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM organization_leaders ol
          JOIN characters leader_filter ON leader_filter.id = ol.character_id
          WHERE ol.organization_id = o.id
            AND ${buildIdentityMatch('leader_filter.id', 'leader_filter.slug', 'leader_filter.name', placeholder)}
        )`
      ),
      homeworld: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM planets planet_filter
          WHERE planet_filter.id = o.homeworld_id
            AND ${buildIdentityMatch('planet_filter.id', 'planet_filter.slug', 'planet_filter.name', placeholder)}
        )`
      ),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = o.era_id
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
        organizationType: row.organization_type,
        influenceLevel: toNumber(row.influence_level),
        homeworldId: toNumber(row.homeworld_id),
        eraId: toNumber(row.era_id),
        factionIds: toNumberArray(row.faction_ids),
        leaderIds: toNumberArray(row.leader_ids),
        keywords: row.keywords || [],
      };
    },
  },
  keywords: {
    alias: 'k',
    fromClause: 'FROM keywords k',
    selectClause: `
      k.id,
      k.slug,
      k.name,
      k.description,
      k.category
    `,
    sortMap: {
      name: 'k.name',
      category: 'k.category',
    },
    searchExpression: `CONCAT_WS(' ', k.name, k.description, k.category)`,
    filterBuilders: {
      category: (context, rawValue) => addAttributeFilter(context, 'k.category', rawValue),
    },
    serialize(row) {
      return {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        description: row.description,
        category: row.category,
      };
    },
  },
  weapons: {
    alias: 'w',
    fromClause: 'FROM weapons w',
    selectClause: `
      w.id,
      w.slug,
      w.name,
      w.summary,
      w.description,
      w.status,
      w.weapon_type,
      w.power_level,
      w.faction_id,
      w.era_id,
      COALESCE(ARRAY(
        SELECT wk.keyword_id
        FROM weapon_keywords wk
        WHERE wk.weapon_id = w.id
        ORDER BY wk.keyword_id ASC
      ), ARRAY[]::bigint[]) AS keyword_ids
    `,
    sortMap: {
      name: 'w.name',
      status: 'w.status',
      weaponType: 'w.weapon_type',
      powerLevel: 'w.power_level',
    },
    searchExpression: `CONCAT_WS(' ', w.name, w.summary, w.description, w.weapon_type)`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'w.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'w.weapon_type', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = w.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      faction: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM factions faction_filter
          WHERE faction_filter.id = w.faction_id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      keywords: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM weapon_keywords wk
          JOIN keywords keyword_filter ON keyword_filter.id = wk.keyword_id
          WHERE wk.weapon_id = w.id
            AND ${buildIdentityMatch('keyword_filter.id', 'keyword_filter.slug', 'keyword_filter.name', placeholder)}
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
        weaponType: row.weapon_type,
        powerLevel: toNumber(row.power_level),
        factionId: toNumber(row.faction_id),
        eraId: toNumber(row.era_id),
        keywordIds: toNumberArray(row.keyword_ids),
      };
    },
  },
  relics: {
    alias: 'rl',
    fromClause: 'FROM relics rl',
    selectClause: `
      rl.id,
      rl.slug,
      rl.name,
      rl.summary,
      rl.description,
      rl.status,
      rl.relic_type,
      rl.power_level,
      rl.faction_id,
      rl.bearer_character_id,
      rl.origin_planet_id,
      rl.era_id,
      COALESCE(ARRAY(
        SELECT rk.keyword_id
        FROM relic_keywords rk
        WHERE rk.relic_id = rl.id
        ORDER BY rk.keyword_id ASC
      ), ARRAY[]::bigint[]) AS keyword_ids
    `,
    sortMap: {
      name: 'rl.name',
      status: 'rl.status',
      relicType: 'rl.relic_type',
      powerLevel: 'rl.power_level',
    },
    searchExpression: `CONCAT_WS(' ', rl.name, rl.summary, rl.description, rl.relic_type)`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'rl.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'rl.relic_type', rawValue),
      faction: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM factions faction_filter
          WHERE faction_filter.id = rl.faction_id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      bearer: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM characters bearer_filter
          WHERE bearer_filter.id = rl.bearer_character_id
            AND ${buildIdentityMatch('bearer_filter.id', 'bearer_filter.slug', 'bearer_filter.name', placeholder)}
        )`
      ),
      originPlanet: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM planets planet_filter
          WHERE planet_filter.id = rl.origin_planet_id
            AND ${buildIdentityMatch('planet_filter.id', 'planet_filter.slug', 'planet_filter.name', placeholder)}
        )`
      ),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = rl.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      keywords: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM relic_keywords rk
          JOIN keywords keyword_filter ON keyword_filter.id = rk.keyword_id
          WHERE rk.relic_id = rl.id
            AND ${buildIdentityMatch('keyword_filter.id', 'keyword_filter.slug', 'keyword_filter.name', placeholder)}
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
        relicType: row.relic_type,
        powerLevel: toNumber(row.power_level),
        factionId: toNumber(row.faction_id),
        bearerCharacterId: toNumber(row.bearer_character_id),
        originPlanetId: toNumber(row.origin_planet_id),
        eraId: toNumber(row.era_id),
        keywordIds: toNumberArray(row.keyword_ids),
      };
    },
  },
  units: {
    alias: 'u',
    fromClause: 'FROM units u',
    selectClause: `
      u.id,
      u.slug,
      u.name,
      u.summary,
      u.description,
      u.status,
      u.unit_type,
      u.power_level,
      u.era_id,
      COALESCE(ARRAY(
        SELECT uf.faction_id
        FROM unit_factions uf
        WHERE uf.unit_id = u.id
        ORDER BY uf.is_primary DESC, uf.faction_id ASC
      ), ARRAY[]::bigint[]) AS faction_ids,
      COALESCE(ARRAY(
        SELECT uk.keyword_id
        FROM unit_keywords uk
        WHERE uk.unit_id = u.id
        ORDER BY uk.keyword_id ASC
      ), ARRAY[]::bigint[]) AS keyword_ids,
      COALESCE(ARRAY(
        SELECT uw.weapon_id
        FROM unit_weapons uw
        WHERE uw.unit_id = u.id
        ORDER BY uw.weapon_id ASC
      ), ARRAY[]::bigint[]) AS weapon_ids
    `,
    sortMap: {
      name: 'u.name',
      status: 'u.status',
      unitType: 'u.unit_type',
      powerLevel: 'u.power_level',
    },
    searchExpression: `CONCAT_WS(' ', u.name, u.summary, u.description, u.unit_type)`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'u.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'u.unit_type', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = u.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      faction: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM unit_factions uf
          JOIN factions faction_filter ON faction_filter.id = uf.faction_id
          WHERE uf.unit_id = u.id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      keywords: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM unit_keywords uk
          JOIN keywords keyword_filter ON keyword_filter.id = uk.keyword_id
          WHERE uk.unit_id = u.id
            AND ${buildIdentityMatch('keyword_filter.id', 'keyword_filter.slug', 'keyword_filter.name', placeholder)}
        )`
      ),
      weapons: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM unit_weapons uw
          JOIN weapons weapon_filter ON weapon_filter.id = uw.weapon_id
          WHERE uw.unit_id = u.id
            AND ${buildIdentityMatch('weapon_filter.id', 'weapon_filter.slug', 'weapon_filter.name', placeholder)}
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
        unitType: row.unit_type,
        powerLevel: toNumber(row.power_level),
        eraId: toNumber(row.era_id),
        factionIds: toNumberArray(row.faction_ids),
        keywordIds: toNumberArray(row.keyword_ids),
        weaponIds: toNumberArray(row.weapon_ids),
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
  campaigns: {
    alias: 'cp',
    fromClause: 'FROM campaigns cp',
    selectClause: `
      cp.id,
      cp.slug,
      cp.name,
      cp.summary,
      cp.description,
      cp.status,
      cp.campaign_type,
      cp.era_id,
      cp.year_label,
      cp.year_order,
      COALESCE(cp.keywords, ARRAY[]::text[]) AS keywords,
      COALESCE(ARRAY(
        SELECT cpl.planet_id
        FROM campaign_planets cpl
        WHERE cpl.campaign_id = cp.id
        ORDER BY cpl.is_primary DESC, cpl.planet_id ASC
      ), ARRAY[]::bigint[]) AS planet_ids,
      COALESCE(ARRAY(
        SELECT cpf.faction_id
        FROM campaign_factions cpf
        WHERE cpf.campaign_id = cp.id
        ORDER BY cpf.faction_id ASC
      ), ARRAY[]::bigint[]) AS faction_ids,
      COALESCE(ARRAY(
        SELECT cch.character_id
        FROM campaign_characters cch
        WHERE cch.campaign_id = cp.id
        ORDER BY cch.character_id ASC
      ), ARRAY[]::bigint[]) AS character_ids,
      COALESCE(ARRAY(
        SELECT cor.organization_id
        FROM campaign_organizations cor
        WHERE cor.campaign_id = cp.id
        ORDER BY cor.organization_id ASC
      ), ARRAY[]::bigint[]) AS organization_ids
    `,
    sortMap: {
      name: 'cp.name',
      status: 'cp.status',
      campaignType: 'cp.campaign_type',
      yearOrder: 'cp.year_order',
    },
    searchExpression: `CONCAT_WS(' ', cp.name, cp.summary, cp.description, cp.campaign_type, cp.year_label, array_to_string(COALESCE(cp.keywords, ARRAY[]::text[]), ' '))`,
    filterBuilders: {
      status: (context, rawValue) => addAttributeFilter(context, 'cp.status', rawValue),
      type: (context, rawValue) => addAttributeFilter(context, 'cp.campaign_type', rawValue),
      keywords: (context, rawValue) => addKeywordsFilter(context, 'cp.keywords', rawValue),
      era: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM eras era_filter
          WHERE era_filter.id = cp.era_id
            AND ${buildIdentityMatch('era_filter.id', 'era_filter.slug', 'era_filter.name', placeholder)}
        )`
      ),
      planets: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM campaign_planets cpl
          JOIN planets planet_filter ON planet_filter.id = cpl.planet_id
          WHERE cpl.campaign_id = cp.id
            AND ${buildIdentityMatch('planet_filter.id', 'planet_filter.slug', 'planet_filter.name', placeholder)}
        )`
      ),
      factions: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM campaign_factions cpf
          JOIN factions faction_filter ON faction_filter.id = cpf.faction_id
          WHERE cpf.campaign_id = cp.id
            AND ${buildIdentityMatch('faction_filter.id', 'faction_filter.slug', 'faction_filter.name', placeholder)}
        )`
      ),
      characters: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM campaign_characters cch
          JOIN characters character_filter ON character_filter.id = cch.character_id
          WHERE cch.campaign_id = cp.id
            AND ${buildIdentityMatch('character_filter.id', 'character_filter.slug', 'character_filter.name', placeholder)}
        )`
      ),
      organizations: (context, rawValue) => addRelationFilter(
        context,
        rawValue,
        (placeholder) => `EXISTS (
          SELECT 1
          FROM campaign_organizations cor
          JOIN organizations organization_filter ON organization_filter.id = cor.organization_id
          WHERE cor.campaign_id = cp.id
            AND ${buildIdentityMatch('organization_filter.id', 'organization_filter.slug', 'organization_filter.name', placeholder)}
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
        campaignType: row.campaign_type,
        eraId: toNumber(row.era_id),
        yearLabel: row.year_label,
        yearOrder: toNumber(row.year_order),
        planetIds: toNumberArray(row.planet_ids),
        factionIds: toNumberArray(row.faction_ids),
        characterIds: toNumberArray(row.character_ids),
        organizationIds: toNumberArray(row.organization_ids),
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

function getDefaultSearchSort(config) {
  return Object.prototype.hasOwnProperty.call(config.sortMap, 'name')
    ? ['name']
    : [Object.keys(config.sortMap)[0]];
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
  const normalizedSearch = normalizeValue(search);
  const escapedSearch = escapeLikePattern(normalizedSearch);
  const exactPlaceholder = '$1';
  const prefixPlaceholder = '$2';
  const containsPlaceholder = '$3';
  const rawContainsPlaceholder = '$4';
  const limitPlaceholder = '$5';
  const searchRankExpression = `
    CASE
      WHEN LOWER(${config.alias}.slug) = ${exactPlaceholder} THEN 140
      WHEN LOWER(${config.alias}.name) = ${exactPlaceholder} THEN 135
      WHEN REPLACE(LOWER(${config.alias}.slug), '-', ' ') = ${exactPlaceholder} THEN 132
      WHEN LOWER(${config.alias}.slug) LIKE ${prefixPlaceholder} ESCAPE '\\' THEN 120
      WHEN LOWER(${config.alias}.name) LIKE ${prefixPlaceholder} ESCAPE '\\' THEN 116
      WHEN LOWER(${config.alias}.name) LIKE ${containsPlaceholder} ESCAPE '\\' THEN 102
      WHEN LOWER(COALESCE(${config.alias}.summary, '')) LIKE ${containsPlaceholder} ESCAPE '\\' THEN 78
      WHEN LOWER(COALESCE(${config.alias}.description, '')) LIKE ${containsPlaceholder} ESCAPE '\\' THEN 62
      WHEN LOWER(${config.searchExpression}) LIKE ${containsPlaceholder} ESCAPE '\\' THEN 48
      WHEN ${config.searchExpression} ILIKE ${rawContainsPlaceholder} ESCAPE '\\' THEN 36
      ELSE 0
    END
  `;
  const fallbackOrderClause = buildOrderClause(config, getDefaultSearchSort(config)).replace(/^ORDER BY\s+/i, '');
  const dataQuery = `
    SELECT
      ${config.selectClause},
      ${searchRankExpression} AS search_rank
    ${config.fromClause}
    WHERE ${config.searchExpression} ILIKE ${rawContainsPlaceholder} ESCAPE '\\'
    ORDER BY search_rank DESC, ${fallbackOrderClause}
    LIMIT ${limitPlaceholder}
  `;
  const countQuery = `
    SELECT COUNT(*)::int AS total
    ${config.fromClause}
    WHERE ${config.searchExpression} ILIKE $1 ESCAPE '\\'
  `;
  const params = [
    normalizedSearch,
    `${escapedSearch}%`,
    `%${escapedSearch}%`,
    `%${escapeLikePattern(String(search).trim())}%`,
    limit,
  ];

  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, params),
    db.query(countQuery, [params[3]]),
  ]);

  return {
    rows: dataResult.rows.map((row) => ({
      ...config.serialize(row),
      _searchRank: toNumber(row.search_rank),
    })),
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
      e.year_label,
      e.year_order,
      COUNT(ev.id)::int AS count
    FROM eras e
    LEFT JOIN events ev ON ev.era_id = e.id
    GROUP BY e.id, e.slug, e.name, e.year_label, e.year_order
    ORDER BY e.year_order ASC, e.name ASC
  `;

  const result = await db.query(query);
  return result.rows.map((row) => ({
    id: toNumber(row.id),
    slug: row.slug,
    name: row.name,
    count: toNumber(row.count),
    yearLabel: row.year_label,
    yearOrder: toNumber(row.year_order),
  }));
}

async function getUnitStatsByFaction() {
  const query = `
    SELECT
      f.id,
      f.slug,
      f.name,
      COUNT(DISTINCT uf.unit_id)::int AS count,
      COALESCE(ROUND(AVG(u.power_level))::int, 0) AS average_power_level,
      COALESCE(MAX(u.power_level), 0)::int AS max_power_level
    FROM factions f
    LEFT JOIN unit_factions uf ON uf.faction_id = f.id
    LEFT JOIN units u ON u.id = uf.unit_id
    GROUP BY f.id, f.slug, f.name
    ORDER BY count DESC, average_power_level DESC, f.name ASC
  `;

  const result = await db.query(query);
  return result.rows.map((row) => ({
    averagePowerLevel: toNumber(row.average_power_level),
    count: toNumber(row.count),
    id: toNumber(row.id),
    maxPowerLevel: toNumber(row.max_power_level),
    name: row.name,
    slug: row.slug,
  }));
}

async function getWeaponStatsByKeyword() {
  const query = `
    SELECT
      k.id,
      k.slug,
      k.name,
      k.category,
      COUNT(DISTINCT wk.weapon_id)::int AS count,
      COALESCE(ROUND(AVG(w.power_level))::int, 0) AS average_power_level,
      COALESCE(MAX(w.power_level), 0)::int AS max_power_level
    FROM keywords k
    LEFT JOIN weapon_keywords wk ON wk.keyword_id = k.id
    LEFT JOIN weapons w ON w.id = wk.weapon_id
    GROUP BY k.id, k.slug, k.name, k.category
    ORDER BY count DESC, average_power_level DESC, k.name ASC
  `;

  const result = await db.query(query);
  return result.rows.map((row) => ({
    averagePowerLevel: toNumber(row.average_power_level),
    category: row.category,
    count: toNumber(row.count),
    id: toNumber(row.id),
    maxPowerLevel: toNumber(row.max_power_level),
    name: row.name,
    slug: row.slug,
  }));
}

module.exports = {
  getEventStatsByEra,
  getFactionStatsByRace,
  getRandomResourceRow,
  getResourceCount,
  getResourceRow,
  getUnitStatsByFaction,
  getWeaponStatsByKeyword,
  loadResourcesByIdentifiers,
  listResourceRows,
  loadResourcesByIds,
  searchResourceRows,
};
