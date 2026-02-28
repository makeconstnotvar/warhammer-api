const {
  apiInfo,
  concurrencyExample,
  featuredQueries,
  gettingStartedSteps,
  queryGuide,
  resourceDefinitions,
  resourceOrder,
} = require('./warhammerContent');
const {
  getResourceCount,
  getResourceRow,
  listResourceRows,
  loadResourcesByIds,
  searchResourceRows,
} = require('./contentDb');
const { createApiError } = require('../lib/apiErrors');

const MAX_PAGE_SIZE = 50;

function splitCsv(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickFields(record, requestedFields) {
  if (!requestedFields || requestedFields.length === 0) {
    return record;
  }

  return requestedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      result[field] = record[field];
    }
    return result;
  }, {});
}

function getResourceConfig(resourceKey) {
  const config = resourceDefinitions[resourceKey];

  if (!config) {
    throw createApiError(404, 'RESOURCE_NOT_FOUND', `Unknown resource "${resourceKey}"`);
  }

  return config;
}

function extractBracketValues(query, prefix) {
  return Object.entries(query || {}).reduce((result, [key, value]) => {
    const match = key.match(new RegExp(`^${prefix}\\[(.+)\\]$`));

    if (match) {
      result[match[1]] = value;
    }

    return result;
  }, {});
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseListQuery(resourceKey, query) {
  const resourceConfig = getResourceConfig(resourceKey);
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 12), MAX_PAGE_SIZE);
  const search = String(query.search || query.q || '').trim();
  const sort = splitCsv(query.sort || resourceConfig.defaultSort);
  const include = splitCsv(query.include);
  const filters = extractBracketValues(query, 'filter');
  const fieldMap = Object.entries(extractBracketValues(query, 'fields')).reduce((result, [key, value]) => {
    result[key] = splitCsv(value);
    return result;
  }, {});

  include.forEach((includeKey) => {
    if (!resourceConfig.includes[includeKey]) {
      throw createApiError(400, 'INVALID_INCLUDE', `Unknown include "${includeKey}" for resource "${resourceKey}"`);
    }
  });

  Object.keys(filters).forEach((filterKey) => {
    if (!resourceConfig.filters[filterKey]) {
      throw createApiError(400, 'INVALID_FILTER', `Unknown filter "${filterKey}" for resource "${resourceKey}"`);
    }
  });

  sort.forEach((sortKey) => {
    const normalizedSortKey = sortKey.startsWith('-') ? sortKey.slice(1) : sortKey;

    if (!resourceConfig.sortFields.includes(normalizedSortKey)) {
      throw createApiError(400, 'INVALID_SORT', `Unknown sort field "${normalizedSortKey}" for resource "${resourceKey}"`);
    }
  });

  return { fieldMap, filters, include, limit, page, search, sort };
}

function serializeResource(resourceKey, item, fieldMap) {
  return pickFields(item, fieldMap[resourceKey]);
}

async function buildIncluded(resourceKey, items, includeKeys, fieldMap) {
  const resourceConfig = getResourceConfig(resourceKey);
  const included = {};
  const seenByResource = {};

  for (const includeKey of includeKeys) {
    const includeConfig = resourceConfig.includes[includeKey];
    const targetResource = includeConfig.resource;
    const targetIds = new Set();

    items.forEach((item) => {
      const rawValue = item[includeConfig.localField];

      if (includeConfig.many) {
        (rawValue || []).forEach((id) => targetIds.add(id));
        return;
      }

      if (rawValue !== null && rawValue !== undefined) {
        targetIds.add(rawValue);
      }
    });

    if (!targetIds.size) {
      continue;
    }

    const loadedItems = await loadResourcesByIds(targetResource, [...targetIds]);
    seenByResource[targetResource] = seenByResource[targetResource] || new Set();
    included[targetResource] = included[targetResource] || [];

    loadedItems.forEach((loadedItem) => {
      if (seenByResource[targetResource].has(loadedItem.id)) {
        return;
      }

      seenByResource[targetResource].add(loadedItem.id);
      included[targetResource].push(serializeResource(targetResource, loadedItem, fieldMap));
    });
  }

  return included;
}

function buildLinks(pathname, originalQuery, page, limit, totalPages) {
  const queryString = new URLSearchParams();

  Object.entries(originalQuery || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryString.append(key, entry));
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      queryString.set(key, String(value));
    }
  });

  queryString.set('page', String(page));
  queryString.set('limit', String(limit));

  const self = `${pathname}?${queryString.toString()}`;
  let next = null;
  let prev = null;

  if (page < totalPages) {
    queryString.set('page', String(page + 1));
    next = `${pathname}?${queryString.toString()}`;
  }

  if (page > 1) {
    queryString.set('page', String(page - 1));
    prev = `${pathname}?${queryString.toString()}`;
  }

  return { next, prev, self };
}

async function listResource(resourceKey, query, pathname) {
  const parsed = parseListQuery(resourceKey, query);
  const result = await listResourceRows(resourceKey, parsed);
  const totalPages = Math.max(1, Math.ceil(result.total / parsed.limit));

  return {
    data: result.rows.map((item) => serializeResource(resourceKey, item, parsed.fieldMap)),
    included: await buildIncluded(resourceKey, result.rows, parsed.include, parsed.fieldMap),
    links: buildLinks(pathname, query, parsed.page, parsed.limit, totalPages),
    meta: {
      appliedFilters: parsed.filters,
      include: parsed.include,
      limit: parsed.limit,
      page: parsed.page,
      resource: resourceKey,
      search: parsed.search,
      sort: parsed.sort,
      total: result.total,
      totalPages,
    },
  };
}

async function getResourceDetail(resourceKey, idOrSlug, query) {
  const parsed = parseListQuery(resourceKey, query);
  const item = await getResourceRow(resourceKey, idOrSlug);

  if (!item) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${resourceKey}" entry "${idOrSlug}" was not found`);
  }

  return {
    data: serializeResource(resourceKey, item, parsed.fieldMap),
    included: await buildIncluded(resourceKey, [item], parsed.include, parsed.fieldMap),
    meta: {
      include: parsed.include,
      resource: resourceKey,
    },
  };
}

async function buildResourceStats(resourceKey) {
  const resourceConfig = getResourceConfig(resourceKey);
  const count = await getResourceCount(resourceKey);

  return {
    count,
    description: resourceConfig.description,
    filters: Object.entries(resourceConfig.filters).map(([key, value]) => ({
      id: key,
      label: value.label,
      type: value.type,
    })),
    id: resourceKey,
    include: Object.entries(resourceConfig.includes).map(([key, value]) => ({
      id: key,
      label: value.label,
      resource: value.resource,
    })),
    label: resourceConfig.label,
    path: `${apiInfo.basePath}/${resourceKey}`,
    previewParams: resourceConfig.previewParams,
    sampleQueries: resourceConfig.sampleQueries,
  };
}

async function getOverview() {
  return {
    data: {
      api: apiInfo,
      featuredQueries,
      gettingStartedSteps,
      resources: await Promise.all(resourceOrder.map((resourceKey) => buildResourceStats(resourceKey))),
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  };
}

async function getResourceCatalog() {
  return {
    data: await Promise.all(resourceOrder.map((resourceKey) => buildResourceStats(resourceKey))),
    meta: {
      total: resourceOrder.length,
    },
  };
}

async function getResourceDocumentation(resourceKey) {
  const resourceConfig = getResourceConfig(resourceKey);

  return {
    data: {
      count: await getResourceCount(resourceKey),
      defaultSort: resourceConfig.defaultSort,
      description: resourceConfig.description,
      fields: resourceConfig.fields,
      filters: Object.entries(resourceConfig.filters).map(([key, value]) => ({
        id: key,
        label: value.label,
        type: value.type,
      })),
      id: resourceKey,
      includes: Object.entries(resourceConfig.includes).map(([key, value]) => ({
        id: key,
        label: value.label,
        resource: value.resource,
      })),
      label: resourceConfig.label,
      previewParams: resourceConfig.previewParams,
      sampleQueries: resourceConfig.sampleQueries,
      sortFields: resourceConfig.sortFields,
    },
    meta: {
      resource: resourceKey,
    },
  };
}

function getQueryGuide() {
  return {
    data: queryGuide,
    meta: {
      basePath: apiInfo.basePath,
    },
  };
}

function getConcurrencyExample() {
  return {
    data: concurrencyExample,
    meta: {
      basePath: apiInfo.basePath,
    },
  };
}

async function searchAll(query, pathname) {
  const search = String(query.search || query.q || '').trim();

  if (!search) {
    throw createApiError(400, 'VALIDATION_ERROR', 'Parameter "search" is required');
  }

  const requestedResources = splitCsv(query.resources);
  const resources = requestedResources.length ? requestedResources : resourceOrder;
  const limit = Math.min(parsePositiveInt(query.limit, 12), MAX_PAGE_SIZE);

  resources.forEach((resourceKey) => getResourceConfig(resourceKey));

  const resultsByResource = await Promise.all(resources.map((resourceKey) => searchResourceRows(resourceKey, search, limit)));
  const allResults = resultsByResource
    .flatMap((entry, index) => entry.rows.map((item) => ({
      id: item.id,
      name: item.name,
      resource: resources[index],
      slug: item.slug,
      summary: item.summary,
    })));
  const results = allResults.slice(0, limit);
  const total = resultsByResource.reduce((sum, entry) => sum + entry.total, 0);

  return {
    data: results,
    included: {},
    links: buildLinks(pathname, query, 1, limit, 1),
    meta: {
      limit,
      page: 1,
      resource: 'search',
      resources,
      search,
      total,
      totalPages: 1,
    },
  };
}

module.exports = {
  getConcurrencyExample,
  getOverview,
  getQueryGuide,
  getResourceCatalog,
  getResourceDetail,
  getResourceDocumentation,
  listResource,
  searchAll,
};
