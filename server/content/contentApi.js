const {
  apiInfo,
  concurrencyExample,
  dataset,
  featuredQueries,
  gettingStartedSteps,
  queryGuide,
  resourceDefinitions,
  resourceOrder,
} = require('./warhammerContent');
const { createApiError } = require('../lib/apiErrors');

const MAX_PAGE_SIZE = 50;

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

function buildIndexes() {
  return resourceOrder.reduce((result, resourceKey) => {
    const collection = dataset[resourceKey] || [];
    result[resourceKey] = {
      byId: new Map(collection.map((item) => [String(item.id), item])),
      bySlug: new Map(collection.map((item) => [String(item.slug), item])),
    };
    return result;
  }, {});
}

const indexes = buildIndexes();

function getResourceConfig(resourceKey) {
  const config = resourceDefinitions[resourceKey];

  if (!config) {
    throw createApiError(404, 'RESOURCE_NOT_FOUND', `Unknown resource "${resourceKey}"`);
  }

  return config;
}

function getCollection(resourceKey) {
  getResourceConfig(resourceKey);
  return dataset[resourceKey] || [];
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

function getComparableValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  return [normalizeValue(value)];
}

function matchesRelationFilter(item, filterConfig, rawValue) {
  const relationIds = filterConfig.many
    ? item[filterConfig.localField] || []
    : [item[filterConfig.localField]].filter(Boolean);
  const values = splitCsv(rawValue).map(normalizeValue);

  if (values.length === 0) {
    return true;
  }

  const relatedItems = relationIds
    .map((relationId) => indexes[filterConfig.resource].byId.get(String(relationId)))
    .filter(Boolean);

  return relatedItems.some((relatedItem) => {
    const candidates = [relatedItem.id, relatedItem.slug, relatedItem.name];
    return candidates.some((candidate) => values.includes(normalizeValue(candidate)));
  });
}

function matchesFilter(item, filterKey, rawValue, resourceConfig) {
  const filterConfig = resourceConfig.filters[filterKey];

  if (!rawValue) {
    return true;
  }

  if (filterConfig.type === 'relation') {
    return matchesRelationFilter(item, filterConfig, rawValue);
  }

  const values = splitCsv(rawValue).map(normalizeValue);

  if (values.length === 0) {
    return true;
  }

  const comparableValues = getComparableValues(item[filterConfig.field]);
  return values.some((value) => comparableValues.includes(value));
}

function applyFilters(collection, filters, resourceConfig) {
  return collection.filter((item) =>
    Object.entries(filters).every(([filterKey, rawValue]) => matchesFilter(item, filterKey, rawValue, resourceConfig))
  );
}

function buildSearchText(item, resourceConfig) {
  return resourceConfig.searchFields
    .map((field) => item[field])
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function applySearch(collection, search, resourceConfig) {
  if (!search) {
    return collection;
  }

  const normalizedSearch = normalizeValue(search);
  return collection.filter((item) => buildSearchText(item, resourceConfig).includes(normalizedSearch));
}

function comparePrimitiveValues(left, right) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left || '').localeCompare(String(right || ''));
}

function applySort(collection, sortFields) {
  if (!sortFields.length) {
    return collection;
  }

  return [...collection].sort((leftItem, rightItem) => {
    for (const sortField of sortFields) {
      const direction = sortField.startsWith('-') ? -1 : 1;
      const field = sortField.startsWith('-') ? sortField.slice(1) : sortField;
      const diff = comparePrimitiveValues(leftItem[field], rightItem[field]);

      if (diff !== 0) {
        return diff * direction;
      }
    }

    return 0;
  });
}

function getIncludedRecordIds(item, includeConfig) {
  if (includeConfig.many) {
    return item[includeConfig.localField] || [];
  }

  return [item[includeConfig.localField]].filter(Boolean);
}

function serializeResource(resourceKey, item, fieldMap) {
  return pickFields(item, fieldMap[resourceKey]);
}

function buildIncluded(resourceKey, items, includeKeys, fieldMap) {
  const resourceConfig = getResourceConfig(resourceKey);
  const included = {};
  const seen = new Set();

  includeKeys.forEach((includeKey) => {
    const includeConfig = resourceConfig.includes[includeKey];
    const targetResource = includeConfig.resource;

    items.forEach((item) => {
      const relatedItems = getIncludedRecordIds(item, includeConfig)
        .map((relationId) => indexes[targetResource].byId.get(String(relationId)))
        .filter(Boolean);

      relatedItems.forEach((relatedItem) => {
        const seenKey = `${targetResource}:${relatedItem.id}`;

        if (seen.has(seenKey)) {
          return;
        }

        seen.add(seenKey);
        included[targetResource] = included[targetResource] || [];
        included[targetResource].push(serializeResource(targetResource, relatedItem, fieldMap));
      });
    });
  });

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

function listResource(resourceKey, query, pathname) {
  const resourceConfig = getResourceConfig(resourceKey);
  const parsed = parseListQuery(resourceKey, query);

  let collection = getCollection(resourceKey);
  collection = applyFilters(collection, parsed.filters, resourceConfig);
  collection = applySearch(collection, parsed.search, resourceConfig);
  collection = applySort(collection, parsed.sort);

  const total = collection.length;
  const totalPages = Math.max(1, Math.ceil(total / parsed.limit));
  const offset = (parsed.page - 1) * parsed.limit;
  const pagedItems = collection.slice(offset, offset + parsed.limit);

  return {
    data: pagedItems.map((item) => serializeResource(resourceKey, item, parsed.fieldMap)),
    included: buildIncluded(resourceKey, pagedItems, parsed.include, parsed.fieldMap),
    links: buildLinks(pathname, query, parsed.page, parsed.limit, totalPages),
    meta: {
      appliedFilters: parsed.filters,
      include: parsed.include,
      limit: parsed.limit,
      page: parsed.page,
      resource: resourceKey,
      search: parsed.search,
      sort: parsed.sort,
      total,
      totalPages,
    },
  };
}

function findResourceItem(resourceKey, idOrSlug) {
  return indexes[resourceKey].byId.get(String(idOrSlug)) || indexes[resourceKey].bySlug.get(String(idOrSlug));
}

function getResourceDetail(resourceKey, idOrSlug, query) {
  const parsed = parseListQuery(resourceKey, query);
  const item = findResourceItem(resourceKey, idOrSlug);

  if (!item) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${resourceKey}" entry "${idOrSlug}" was not found`);
  }

  return {
    data: serializeResource(resourceKey, item, parsed.fieldMap),
    included: buildIncluded(resourceKey, [item], parsed.include, parsed.fieldMap),
    meta: {
      include: parsed.include,
      resource: resourceKey,
    },
  };
}

function buildResourceStats(resourceKey) {
  const resourceConfig = getResourceConfig(resourceKey);

  return {
    count: getCollection(resourceKey).length,
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

function getOverview() {
  return {
    data: {
      api: apiInfo,
      featuredQueries,
      gettingStartedSteps,
      resources: resourceOrder.map((resourceKey) => buildResourceStats(resourceKey)),
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  };
}

function getResourceCatalog() {
  return {
    data: resourceOrder.map((resourceKey) => buildResourceStats(resourceKey)),
    meta: {
      total: resourceOrder.length,
    },
  };
}

function getResourceDocumentation(resourceKey) {
  const resourceConfig = getResourceConfig(resourceKey);

  return {
    data: {
      count: getCollection(resourceKey).length,
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

function searchAll(query, pathname) {
  const search = String(query.search || query.q || '').trim();

  if (!search) {
    throw createApiError(400, 'VALIDATION_ERROR', 'Parameter "search" is required');
  }

  const requestedResources = splitCsv(query.resources);
  const resources = requestedResources.length ? requestedResources : resourceOrder;
  const limit = Math.min(parsePositiveInt(query.limit, 12), MAX_PAGE_SIZE);

  resources.forEach((resourceKey) => getResourceConfig(resourceKey));

  const normalizedSearch = normalizeValue(search);
  const results = resources.flatMap((resourceKey) => {
    const resourceConfig = getResourceConfig(resourceKey);

    return getCollection(resourceKey)
      .filter((item) => buildSearchText(item, resourceConfig).includes(normalizedSearch))
      .map((item) => ({
        id: item.id,
        name: item.name,
        resource: resourceKey,
        slug: item.slug,
        summary: item.summary,
      }));
  });

  return {
    data: results.slice(0, limit),
    included: {},
    links: buildLinks(pathname, query, 1, limit, 1),
    meta: {
      limit,
      page: 1,
      resource: 'search',
      resources,
      search,
      total: results.length,
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
