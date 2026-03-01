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
  getCampaignStatsByOrganization,
  getEventStatsByEra,
  getFactionStatsByRace,
  getRandomResourceRow,
  getRelicStatsByFaction,
  getResourceCount,
  getResourceRow,
  getUnitStatsByFaction,
  getWeaponStatsByKeyword,
  loadResourcesByIdentifiers,
  listResourceRows,
  loadResourcesByIds,
  searchResourceRows,
} = require('./contentDb');
const { createApiError } = require('../lib/apiErrors');

const MAX_PAGE_SIZE = 50;
const MAX_GRAPH_DEPTH = 3;
const MAX_GRAPH_RELATION_LIMIT = 8;
const MAX_PATH_DEPTH = 6;
const resourceAliases = {
  campaign: 'campaigns',
  campaigns: 'campaigns',
  character: 'characters',
  characters: 'characters',
  era: 'eras',
  eras: 'eras',
  event: 'events',
  events: 'events',
  faction: 'factions',
  factions: 'factions',
  keyword: 'keywords',
  keywords: 'keywords',
  organization: 'organizations',
  organizations: 'organizations',
  planet: 'planets',
  planets: 'planets',
  race: 'races',
  races: 'races',
  relic: 'relics',
  relics: 'relics',
  unit: 'units',
  units: 'units',
  weapon: 'weapons',
  weapons: 'weapons',
};

function splitCsv(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseResourceWhitelist(value, requiredResourceKeys = []) {
  const requestedResourceTypes = uniqueValues(splitCsv(value).map((resourceKey) => normalizeResourceKey(resourceKey)));

  if (!requestedResourceTypes.length) {
    return {
      allowedResourceKeys: [],
      requestedResourceTypes,
    };
  }

  return {
    allowedResourceKeys: uniqueValues([...requestedResourceTypes, ...requiredResourceKeys]),
    requestedResourceTypes,
  };
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
  const normalizedResourceKey = resourceAliases[resourceKey] || resourceKey;
  const config = resourceDefinitions[normalizedResourceKey];

  if (!config) {
    throw createApiError(404, 'RESOURCE_NOT_FOUND', `Unknown resource "${resourceKey}"`);
  }

  return config;
}

function normalizeResourceKey(resourceKey) {
  const normalized = resourceAliases[resourceKey] || resourceKey;
  getResourceConfig(normalized);
  return normalized;
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
  const normalizedResourceKey = normalizeResourceKey(resourceKey);
  const resourceConfig = getResourceConfig(normalizedResourceKey);
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
      throw createApiError(400, 'INVALID_INCLUDE', `Unknown include "${includeKey}" for resource "${normalizedResourceKey}"`);
    }
  });

  Object.keys(filters).forEach((filterKey) => {
    if (!resourceConfig.filters[filterKey]) {
      throw createApiError(400, 'INVALID_FILTER', `Unknown filter "${filterKey}" for resource "${normalizedResourceKey}"`);
    }
  });

  sort.forEach((sortKey) => {
    const normalizedSortKey = sortKey.startsWith('-') ? sortKey.slice(1) : sortKey;

    if (!resourceConfig.sortFields.includes(normalizedSortKey)) {
      throw createApiError(400, 'INVALID_SORT', `Unknown sort field "${normalizedSortKey}" for resource "${normalizedResourceKey}"`);
    }
  });

  return { fieldMap, filters, include, limit, page, resourceKey: normalizedResourceKey, search, sort };
}

function serializeResource(resourceKey, item, fieldMap) {
  return pickFields(item, fieldMap[resourceKey]);
}

function toRelationIds(rawValue, many) {
  if (many) {
    return uniqueValues(Array.isArray(rawValue) ? rawValue : []);
  }

  if (rawValue === null || rawValue === undefined) {
    return [];
  }

  return [rawValue];
}

function buildGraphNodeKey(resourceKey, id) {
  return `${resourceKey}:${id}`;
}

function parseGraphNodeKey(nodeKey) {
  const [resourceKey, rawId] = String(nodeKey || '').split(':');
  return {
    id: parsePositiveInt(rawId, rawId),
    resourceKey,
  };
}

function resolveGraphNodeType(item) {
  return (
    item.unitType ||
    item.weaponType ||
    item.relicType ||
    item.organizationType ||
    item.campaignType ||
    item.type ||
    item.category ||
    item.alignment ||
    null
  );
}

function createGraphNode(resourceKey, item, distance) {
  return {
    distance,
    id: item.id,
    influenceLevel: item.influenceLevel ?? null,
    key: buildGraphNodeKey(resourceKey, item.id),
    name: item.name || item.slug || `${resourceKey}-${item.id}`,
    powerLevel: item.powerLevel ?? null,
    resource: resourceKey,
    slug: item.slug || null,
    status: item.status || null,
    summary: item.summary || item.description || null,
    type: resolveGraphNodeType(item),
    yearLabel: item.yearLabel || null,
  };
}

function createGraphEdge(fromNodeKey, toNodeKey, relationKey, relationLabel, sourceResource, targetResource, direction) {
  return {
    direction,
    from: fromNodeKey,
    id: `${fromNodeKey}:${relationKey}:${toNodeKey}:${direction}`,
    label: relationLabel,
    relation: relationKey,
    sourceResource,
    targetResource,
    to: toNodeKey,
  };
}

function cacheGraphItem(resourceKey, item, itemCache) {
  if (!item || !itemCache) {
    return item;
  }

  itemCache.set(buildGraphNodeKey(resourceKey, item.id), item);
  return item;
}

function uniqueValues(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))];
}

function isResourceAllowed(allowedResourceKeys, resourceKey) {
  return !allowedResourceKeys.length || allowedResourceKeys.includes(resourceKey);
}

function intersectArrays(arrays) {
  if (!arrays.length) {
    return [];
  }

  return uniqueValues(arrays[0]).filter((candidate) =>
    arrays.every((array) => (array || []).includes(candidate))
  );
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
  const result = await listResourceRows(parsed.resourceKey, parsed);
  const totalPages = Math.max(1, Math.ceil(result.total / parsed.limit));

  return {
    data: result.rows.map((item) => serializeResource(parsed.resourceKey, item, parsed.fieldMap)),
    included: await buildIncluded(parsed.resourceKey, result.rows, parsed.include, parsed.fieldMap),
    links: buildLinks(pathname, query, parsed.page, parsed.limit, totalPages),
    meta: {
      appliedFilters: parsed.filters,
      include: parsed.include,
      limit: parsed.limit,
      page: parsed.page,
      resource: parsed.resourceKey,
      search: parsed.search,
      sort: parsed.sort,
      total: result.total,
      totalPages,
    },
  };
}

async function getResourceDetail(resourceKey, idOrSlug, query) {
  const parsed = parseListQuery(resourceKey, query);
  const item = await getResourceRow(parsed.resourceKey, idOrSlug);

  if (!item) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${parsed.resourceKey}" entry "${idOrSlug}" was not found`);
  }

  return {
    data: serializeResource(parsed.resourceKey, item, parsed.fieldMap),
    included: await buildIncluded(parsed.resourceKey, [item], parsed.include, parsed.fieldMap),
    meta: {
      include: parsed.include,
      resource: parsed.resourceKey,
    },
  };
}

function parseGraphQuery(query) {
  const resourceKey = normalizeResourceKey(query.resource);
  const identifier = String(query.identifier || query.id || query.slug || '').trim();
  const depth = Math.min(parsePositiveInt(query.depth, 2), MAX_GRAPH_DEPTH);
  const limitPerRelation = Math.min(
    parsePositiveInt(query.limitPerRelation || query.relationLimit || query.limit, 4),
    MAX_GRAPH_RELATION_LIMIT
  );
  const backlinks = String(query.backlinks ?? 'true').toLowerCase() !== 'false';
  const resourceWhitelist = parseResourceWhitelist(query.resources, [resourceKey]);

  if (!identifier) {
    throw createApiError(400, 'VALIDATION_ERROR', 'Parameter "identifier" is required');
  }

  return {
    allowedResourceKeys: resourceWhitelist.allowedResourceKeys,
    backlinks,
    depth,
    identifier,
    limitPerRelation,
    requestedResourceTypes: resourceWhitelist.requestedResourceTypes,
    resourceKey,
  };
}

function sortItemsByIdOrder(items, orderedIds) {
  const orderMap = new Map(orderedIds.map((id, index) => [String(id), index]));

  return [...items].sort((left, right) => {
    const leftOrder = orderMap.get(String(left.id)) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(String(right.id)) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

async function buildGraphBacklinks(rootResourceKey, rootItem, limitPerRelation, itemCache, allowedResourceKeys = []) {
  const backlinkRecords = [];
  const rootIdentifier = rootItem.slug || String(rootItem.id);

  for (const [sourceResourceKey, sourceConfig] of Object.entries(resourceDefinitions)) {
    if (!isResourceAllowed(allowedResourceKeys, sourceResourceKey)) {
      continue;
    }

    for (const [filterKey, filterConfig] of Object.entries(sourceConfig.filters || {})) {
      if (filterConfig.type !== 'relation' || filterConfig.resource !== rootResourceKey) {
        continue;
      }

      const result = await listResourceRows(sourceResourceKey, {
        fieldMap: {},
        filters: { [filterKey]: rootIdentifier },
        include: [],
        limit: limitPerRelation,
        page: 1,
        resourceKey: sourceResourceKey,
        search: '',
        sort: splitCsv(sourceConfig.defaultSort),
      });

      const items = result.rows.filter((item) => !(sourceResourceKey === rootResourceKey && item.id === rootItem.id));

      items.forEach((item) => cacheGraphItem(sourceResourceKey, item, itemCache));

      backlinkRecords.push({
        filterKey,
        items,
        sourceResourceKey,
        total: result.total,
      });
    }
  }

  return backlinkRecords;
}

async function loadGraphItemsByIds(resourceKey, ids, itemCache) {
  const targetIds = uniqueValues(ids);

  if (!targetIds.length) {
    return [];
  }

  const cachedItems = [];
  const missingIds = [];

  targetIds.forEach((id) => {
    const nodeKey = buildGraphNodeKey(resourceKey, id);

    if (itemCache?.has(nodeKey)) {
      cachedItems.push(itemCache.get(nodeKey));
      return;
    }

    missingIds.push(id);
  });

  if (missingIds.length) {
    const loadedItems = await loadResourcesByIds(resourceKey, missingIds);
    loadedItems.forEach((item) => cacheGraphItem(resourceKey, item, itemCache));
    cachedItems.push(...loadedItems);
  }

  return sortItemsByIdOrder(cachedItems, targetIds);
}

async function buildForwardNeighborRecords(resourceKey, item, limitPerRelation, itemCache, allowedResourceKeys = []) {
  const resourceConfig = getResourceConfig(resourceKey);
  const currentNodeKey = buildGraphNodeKey(resourceKey, item.id);
  const neighborRecords = [];
  const truncatedRelations = [];

  for (const [relationKey, relationConfig] of Object.entries(resourceConfig.includes || {})) {
    if (!isResourceAllowed(allowedResourceKeys, relationConfig.resource)) {
      continue;
    }

    const rawRelationIds = toRelationIds(item[relationConfig.localField], relationConfig.many);

    if (!rawRelationIds.length) {
      continue;
    }

    const limitedRelationIds = rawRelationIds.slice(0, limitPerRelation);

    if (rawRelationIds.length > limitPerRelation) {
      truncatedRelations.push({
        from: currentNodeKey,
        hiddenCount: rawRelationIds.length - limitPerRelation,
        label: relationConfig.label,
        relation: relationKey,
        targetResource: relationConfig.resource,
      });
    }

    const relatedItems = await loadGraphItemsByIds(relationConfig.resource, limitedRelationIds, itemCache);

    relatedItems.forEach((relatedItem) => {
      neighborRecords.push({
        edge: createGraphEdge(
          currentNodeKey,
          buildGraphNodeKey(relationConfig.resource, relatedItem.id),
          relationKey,
          relationConfig.label,
          resourceKey,
          relationConfig.resource,
          'outgoing'
        ),
        item: relatedItem,
        resourceKey: relationConfig.resource,
      });
    });
  }

  return { neighborRecords, truncatedRelations };
}

async function buildBacklinkNeighborRecords(resourceKey, item, limitPerRelation, itemCache, allowedResourceKeys = []) {
  const backlinkRecords = await buildGraphBacklinks(resourceKey, item, limitPerRelation, itemCache, allowedResourceKeys);
  const currentNodeKey = buildGraphNodeKey(resourceKey, item.id);
  const neighborRecords = [];
  const truncatedRelations = [];

  backlinkRecords.forEach((record) => {
    if (record.total > limitPerRelation) {
      truncatedRelations.push({
        from: currentNodeKey,
        hiddenCount: record.total - limitPerRelation,
        label: record.filterKey,
        relation: record.filterKey,
        sourceResource: record.sourceResourceKey,
      });
    }

    record.items.forEach((relatedItem) => {
      neighborRecords.push({
        edge: createGraphEdge(
          buildGraphNodeKey(record.sourceResourceKey, relatedItem.id),
          currentNodeKey,
          record.filterKey,
          getResourceConfig(record.sourceResourceKey).filters[record.filterKey]?.label || record.filterKey,
          record.sourceResourceKey,
          resourceKey,
          'incoming'
        ),
        item: relatedItem,
        resourceKey: record.sourceResourceKey,
      });
    });
  });

  return { neighborRecords, truncatedRelations };
}

async function buildPathNeighborRecords(resourceKey, item, options, itemCache) {
  const forward = await buildForwardNeighborRecords(
    resourceKey,
    item,
    options.limitPerRelation,
    itemCache,
    options.allowedResourceKeys
  );

  if (!options.backlinks) {
    return forward;
  }

  const backlinks = await buildBacklinkNeighborRecords(
    resourceKey,
    item,
    options.limitPerRelation,
    itemCache,
    options.allowedResourceKeys
  );

  return {
    neighborRecords: [...forward.neighborRecords, ...backlinks.neighborRecords],
    truncatedRelations: [...forward.truncatedRelations, ...backlinks.truncatedRelations],
  };
}

function parseExplorePathQuery(query) {
  const fromResourceKey = normalizeResourceKey(query.fromResource || query.sourceResource || query.from);
  const toResourceKey = normalizeResourceKey(query.toResource || query.targetResource || query.to);
  const fromIdentifier = String(query.fromIdentifier || query.sourceIdentifier || query.fromId || '').trim();
  const toIdentifier = String(query.toIdentifier || query.targetIdentifier || query.toId || '').trim();
  const maxDepth = Math.min(parsePositiveInt(query.maxDepth || query.depth, 4), MAX_PATH_DEPTH);
  const limitPerRelation = Math.min(
    parsePositiveInt(query.limitPerRelation || query.relationLimit || query.limit, 6),
    MAX_GRAPH_RELATION_LIMIT
  );
  const backlinks = String(query.backlinks ?? 'true').toLowerCase() !== 'false';
  const resourceWhitelist = parseResourceWhitelist(query.resources, [fromResourceKey, toResourceKey]);

  if (!fromIdentifier || !toIdentifier) {
    throw createApiError(400, 'VALIDATION_ERROR', 'Parameters "fromIdentifier" and "toIdentifier" are required');
  }

  return {
    allowedResourceKeys: resourceWhitelist.allowedResourceKeys,
    backlinks,
    fromIdentifier,
    fromResourceKey,
    limitPerRelation,
    maxDepth,
    requestedResourceTypes: resourceWhitelist.requestedResourceTypes,
    toIdentifier,
    toResourceKey,
  };
}

function buildPathNodesFromKeys(nodeKeys, itemCache) {
  return nodeKeys.map((nodeKey, index) => {
    const { resourceKey } = parseGraphNodeKey(nodeKey);
    const item = itemCache.get(nodeKey);
    return createGraphNode(resourceKey, item, index);
  });
}

function reconstructGraphPath(fromNodeKey, toNodeKey, parentByNodeKey, itemCache) {
  const nodeKeys = [toNodeKey];
  const pathEdges = [];
  let cursor = toNodeKey;

  while (cursor !== fromNodeKey) {
    const parentInfo = parentByNodeKey.get(cursor);

    if (!parentInfo) {
      return {
        edges: [],
        length: 0,
        nodes: [],
      };
    }

    pathEdges.push({
      ...parentInfo.edge,
      traversal: parentInfo.previousNodeKey === parentInfo.edge.from ? 'forward' : 'reverse',
    });
    cursor = parentInfo.previousNodeKey;
    nodeKeys.push(cursor);
  }

  nodeKeys.reverse();
  pathEdges.reverse();

  return {
    edges: pathEdges.map((edge, index) => ({
      ...edge,
      pathIndex: index,
    })),
    length: pathEdges.length,
    nodes: buildPathNodesFromKeys(nodeKeys, itemCache),
  };
}

async function getExploreGraph(query) {
  const parsed = parseGraphQuery(query);
  const itemCache = new Map();
  const rootItem = await getResourceRow(parsed.resourceKey, parsed.identifier);

  if (!rootItem) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${parsed.resourceKey}" entry "${parsed.identifier}" was not found`);
  }

  const nodeMap = new Map();
  const edgeMap = new Map();
  const queue = [{ distance: 0, item: rootItem, resourceKey: parsed.resourceKey }];
  const queuedNodeKeys = new Set();
  const truncatedRelations = [];
  cacheGraphItem(parsed.resourceKey, rootItem, itemCache);

  const rootNode = createGraphNode(parsed.resourceKey, rootItem, 0);
  nodeMap.set(rootNode.key, rootNode);
  queuedNodeKeys.add(rootNode.key);

  while (queue.length) {
    const current = queue.shift();

    if (current.distance >= parsed.depth) {
      continue;
    }

    const neighborResult = await buildForwardNeighborRecords(
      current.resourceKey,
      current.item,
      parsed.limitPerRelation,
      itemCache,
      parsed.allowedResourceKeys
    );

    truncatedRelations.push(...neighborResult.truncatedRelations);

    neighborResult.neighborRecords.forEach((neighborRecord) => {
      const relatedNodeKey = buildGraphNodeKey(neighborRecord.resourceKey, neighborRecord.item.id);
      const existingNode = nodeMap.get(relatedNodeKey);

      if (!existingNode) {
        nodeMap.set(relatedNodeKey, createGraphNode(neighborRecord.resourceKey, neighborRecord.item, current.distance + 1));
      }

      edgeMap.set(neighborRecord.edge.id, neighborRecord.edge);

      if (!queuedNodeKeys.has(relatedNodeKey) && current.distance + 1 < parsed.depth) {
        queue.push({
          distance: current.distance + 1,
          item: neighborRecord.item,
          resourceKey: neighborRecord.resourceKey,
        });
        queuedNodeKeys.add(relatedNodeKey);
      }
    });
  }

  if (parsed.backlinks && parsed.depth >= 1) {
    const backlinkResult = await buildBacklinkNeighborRecords(
      parsed.resourceKey,
      rootItem,
      parsed.limitPerRelation,
      itemCache,
      parsed.allowedResourceKeys
    );

    truncatedRelations.push(...backlinkResult.truncatedRelations);

    backlinkResult.neighborRecords.forEach((neighborRecord) => {
      const sourceNodeKey = buildGraphNodeKey(neighborRecord.resourceKey, neighborRecord.item.id);

      if (!nodeMap.has(sourceNodeKey)) {
        nodeMap.set(sourceNodeKey, createGraphNode(neighborRecord.resourceKey, neighborRecord.item, 1));
      }

      edgeMap.set(neighborRecord.edge.id, neighborRecord.edge);
    });
  }

  const nodes = [...nodeMap.values()].sort((left, right) => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }

    if (left.resource !== right.resource) {
      return left.resource.localeCompare(right.resource);
    }

    return left.name.localeCompare(right.name);
  });
  const edges = [...edgeMap.values()];

  return {
    data: {
      edges,
      nodes,
      root: rootNode,
    },
    included: {},
    meta: {
      backlinks: parsed.backlinks,
      depth: parsed.depth,
      edgeCount: edges.length,
      identifier: parsed.identifier,
      limitPerRelation: parsed.limitPerRelation,
      nodeCount: nodes.length,
      requestedResourceTypes: parsed.requestedResourceTypes,
      resource: parsed.resourceKey,
      resourceTypes: uniqueValues(nodes.map((node) => node.resource)),
      truncatedRelations,
    },
  };
}

async function getExplorePath(query) {
  const parsed = parseExplorePathQuery(query);
  const itemCache = new Map();
  const fromItem = await getResourceRow(parsed.fromResourceKey, parsed.fromIdentifier);
  const toItem = await getResourceRow(parsed.toResourceKey, parsed.toIdentifier);

  if (!fromItem) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${parsed.fromResourceKey}" entry "${parsed.fromIdentifier}" was not found`);
  }

  if (!toItem) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `Resource "${parsed.toResourceKey}" entry "${parsed.toIdentifier}" was not found`);
  }

  cacheGraphItem(parsed.fromResourceKey, fromItem, itemCache);
  cacheGraphItem(parsed.toResourceKey, toItem, itemCache);

  const fromNodeKey = buildGraphNodeKey(parsed.fromResourceKey, fromItem.id);
  const toNodeKey = buildGraphNodeKey(parsed.toResourceKey, toItem.id);

  if (fromNodeKey === toNodeKey) {
    return {
      data: {
        found: true,
        from: createGraphNode(parsed.fromResourceKey, fromItem, 0),
        path: {
          edges: [],
          length: 0,
          nodes: [createGraphNode(parsed.fromResourceKey, fromItem, 0)],
        },
        to: createGraphNode(parsed.toResourceKey, toItem, 0),
      },
      included: {},
      meta: {
        backlinks: parsed.backlinks,
        fromIdentifier: parsed.fromIdentifier,
        fromResource: parsed.fromResourceKey,
        limitPerRelation: parsed.limitPerRelation,
        maxDepth: parsed.maxDepth,
        requestedResourceTypes: parsed.requestedResourceTypes,
        resourceTypes: [parsed.fromResourceKey],
        toIdentifier: parsed.toIdentifier,
        toResource: parsed.toResourceKey,
        truncatedRelations: [],
        visitedNodeCount: 1,
      },
    };
  }

  const queue = [{ distance: 0, item: fromItem, resourceKey: parsed.fromResourceKey }];
  const visitedNodeKeys = new Set([fromNodeKey]);
  const parentByNodeKey = new Map();
  const truncatedRelations = [];
  let foundNodeKey = '';

  while (queue.length && !foundNodeKey) {
    const current = queue.shift();

    if (current.distance >= parsed.maxDepth) {
      continue;
    }

    const neighborResult = await buildPathNeighborRecords(
      current.resourceKey,
      current.item,
      {
        backlinks: parsed.backlinks,
        allowedResourceKeys: parsed.allowedResourceKeys,
        limitPerRelation: parsed.limitPerRelation,
      },
      itemCache
    );

    truncatedRelations.push(...neighborResult.truncatedRelations);

    for (const neighborRecord of neighborResult.neighborRecords) {
      const nextNodeKey = buildGraphNodeKey(neighborRecord.resourceKey, neighborRecord.item.id);

      if (visitedNodeKeys.has(nextNodeKey)) {
        continue;
      }

      visitedNodeKeys.add(nextNodeKey);
      parentByNodeKey.set(nextNodeKey, {
        edge: neighborRecord.edge,
        previousNodeKey: buildGraphNodeKey(current.resourceKey, current.item.id),
      });

      if (nextNodeKey === toNodeKey) {
        foundNodeKey = nextNodeKey;
        break;
      }

      queue.push({
        distance: current.distance + 1,
        item: neighborRecord.item,
        resourceKey: neighborRecord.resourceKey,
      });
    }
  }

  const path = foundNodeKey
    ? reconstructGraphPath(fromNodeKey, foundNodeKey, parentByNodeKey, itemCache)
    : { edges: [], length: 0, nodes: [] };

  return {
    data: {
      found: Boolean(foundNodeKey),
      from: createGraphNode(parsed.fromResourceKey, fromItem, 0),
      path,
      to: createGraphNode(parsed.toResourceKey, toItem, path.nodes.length ? path.nodes.length - 1 : 0),
    },
    included: {},
    meta: {
      backlinks: parsed.backlinks,
      fromIdentifier: parsed.fromIdentifier,
      fromResource: parsed.fromResourceKey,
      limitPerRelation: parsed.limitPerRelation,
      maxDepth: parsed.maxDepth,
      requestedResourceTypes: parsed.requestedResourceTypes,
      resourceTypes: uniqueValues(path.nodes.map((node) => node.resource)),
      toIdentifier: parsed.toIdentifier,
      toResource: parsed.toResourceKey,
      truncatedRelations,
      visitedNodeCount: visitedNodeKeys.size,
    },
  };
}

function buildFactionComparison(items) {
  const powerItems = items
    .map((item) => ({ id: item.id, name: item.name, powerLevel: item.powerLevel ?? 0 }))
    .sort((left, right) => right.powerLevel - left.powerLevel);
  const strongest = powerItems[0] || null;
  const weakest = powerItems[powerItems.length - 1] || null;

  return {
    alignments: uniqueValues(items.map((item) => item.alignment)),
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    homeworldIds: uniqueValues(items.map((item) => item.homeworldId)),
    powerSpread: strongest && weakest ? strongest.powerLevel - weakest.powerLevel : 0,
    sharedLeaderIds: intersectArrays(items.map((item) => item.leaderIds || [])),
    sharedRaceIds: intersectArrays(items.map((item) => item.raceIds || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    strongest,
    weakest,
  };
}

function buildCharacterComparison(items) {
  const powerItems = items
    .map((item) => ({ id: item.id, name: item.name, powerLevel: item.powerLevel ?? 0 }))
    .sort((left, right) => right.powerLevel - left.powerLevel);
  const strongest = powerItems[0] || null;
  const weakest = powerItems[powerItems.length - 1] || null;

  return {
    alignments: uniqueValues(items.map((item) => item.alignment)),
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    factionIds: uniqueValues(items.map((item) => item.factionId)),
    homeworldIds: uniqueValues(items.map((item) => item.homeworldId)),
    powerSpread: strongest && weakest ? strongest.powerLevel - weakest.powerLevel : 0,
    raceIds: uniqueValues(items.map((item) => item.raceId)),
    sharedEventIds: intersectArrays(items.map((item) => item.eventIds || [])),
    sharedKeywords: intersectArrays(items.map((item) => item.keywords || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    strongest,
    weakest,
  };
}

function buildUnitComparison(items) {
  const powerItems = items
    .map((item) => ({ id: item.id, name: item.name, powerLevel: item.powerLevel ?? 0 }))
    .sort((left, right) => right.powerLevel - left.powerLevel);
  const strongest = powerItems[0] || null;
  const weakest = powerItems[powerItems.length - 1] || null;

  return {
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    factionIds: uniqueValues(items.flatMap((item) => item.factionIds || [])),
    powerSpread: strongest && weakest ? strongest.powerLevel - weakest.powerLevel : 0,
    sharedFactionIds: intersectArrays(items.map((item) => item.factionIds || [])),
    sharedKeywordIds: intersectArrays(items.map((item) => item.keywordIds || [])),
    sharedWeaponIds: intersectArrays(items.map((item) => item.weaponIds || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    strongest,
    unitTypes: uniqueValues(items.map((item) => item.unitType)),
    weakest,
  };
}

function buildOrganizationComparison(items) {
  const rankedItems = items
    .map((item) => ({ id: item.id, name: item.name, influenceLevel: item.influenceLevel ?? 0 }))
    .sort((left, right) => right.influenceLevel - left.influenceLevel);
  const mostInfluential = rankedItems[0] || null;
  const leastInfluential = rankedItems[rankedItems.length - 1] || null;

  return {
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    homeworldIds: uniqueValues(items.map((item) => item.homeworldId)),
    influenceSpread: mostInfluential && leastInfluential
      ? mostInfluential.influenceLevel - leastInfluential.influenceLevel
      : 0,
    mostInfluential,
    organizationTypes: uniqueValues(items.map((item) => item.organizationType)),
    sharedFactionIds: intersectArrays(items.map((item) => item.factionIds || [])),
    sharedKeywords: intersectArrays(items.map((item) => item.keywords || [])),
    sharedLeaderIds: intersectArrays(items.map((item) => item.leaderIds || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    leastInfluential,
  };
}

function buildRelicComparison(items) {
  const rankedItems = items
    .map((item) => ({ id: item.id, name: item.name, powerLevel: item.powerLevel ?? 0 }))
    .sort((left, right) => right.powerLevel - left.powerLevel);
  const strongest = rankedItems[0] || null;
  const weakest = rankedItems[rankedItems.length - 1] || null;

  return {
    bearerCharacterIds: uniqueValues(items.map((item) => item.bearerCharacterId)),
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    factionIds: uniqueValues(items.map((item) => item.factionId)),
    originPlanetIds: uniqueValues(items.map((item) => item.originPlanetId)),
    powerSpread: strongest && weakest ? strongest.powerLevel - weakest.powerLevel : 0,
    relicTypes: uniqueValues(items.map((item) => item.relicType)),
    sharedKeywordIds: intersectArrays(items.map((item) => item.keywordIds || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    strongest,
    weakest,
  };
}

function buildCampaignComparison(items) {
  const orderedItems = items
    .map((item) => ({
      id: item.id,
      name: item.name,
      yearLabel: item.yearLabel,
      yearOrder: item.yearOrder ?? 0,
    }))
    .sort((left, right) => left.yearOrder - right.yearOrder);
  const earliest = orderedItems[0] || null;
  const latest = orderedItems[orderedItems.length - 1] || null;

  return {
    campaignTypes: uniqueValues(items.map((item) => item.campaignType)),
    eraIds: uniqueValues(items.map((item) => item.eraId)),
    earliest,
    latest,
    sharedCharacterIds: intersectArrays(items.map((item) => item.characterIds || [])),
    sharedFactionIds: intersectArrays(items.map((item) => item.factionIds || [])),
    sharedKeywords: intersectArrays(items.map((item) => item.keywords || [])),
    sharedOrganizationIds: intersectArrays(items.map((item) => item.organizationIds || [])),
    sharedPlanetIds: intersectArrays(items.map((item) => item.planetIds || [])),
    statuses: uniqueValues(items.map((item) => item.status)),
    timeSpan: earliest && latest ? (latest.yearOrder ?? 0) - (earliest.yearOrder ?? 0) : 0,
  };
}

async function compareResources(resourceKey, query) {
  const parsed = parseListQuery(resourceKey, query);
  const identifiers = query.ids || query.items || query.values;
  const items = await loadResourcesByIdentifiers(parsed.resourceKey, identifiers);

  if (items.length < 2) {
    throw createApiError(400, 'COMPARE_REQUIRES_TWO_ITEMS', 'Compare endpoint requires at least two valid identifiers');
  }

  const comparisonBuilders = {
    campaigns: buildCampaignComparison,
    factions: buildFactionComparison,
    characters: buildCharacterComparison,
    organizations: buildOrganizationComparison,
    relics: buildRelicComparison,
    units: buildUnitComparison,
  };

  const comparisonBuilder = comparisonBuilders[parsed.resourceKey];

  if (!comparisonBuilder) {
    throw createApiError(400, 'COMPARE_NOT_SUPPORTED', `Compare is not supported for resource "${parsed.resourceKey}"`);
  }

  return {
    data: {
      comparison: comparisonBuilder(items),
      items: items.map((item) => serializeResource(parsed.resourceKey, item, parsed.fieldMap)),
      resource: parsed.resourceKey,
    },
    included: await buildIncluded(parsed.resourceKey, items, parsed.include, parsed.fieldMap),
    meta: {
      count: items.length,
      identifiers: splitCsv(identifiers),
      include: parsed.include,
      resource: parsed.resourceKey,
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
  const normalizedResourceKey = normalizeResourceKey(resourceKey);
  const resourceConfig = getResourceConfig(normalizedResourceKey);

  return {
    data: {
      count: await getResourceCount(normalizedResourceKey),
      defaultSort: resourceConfig.defaultSort,
      description: resourceConfig.description,
      fields: resourceConfig.fields,
      filters: Object.entries(resourceConfig.filters).map(([key, value]) => ({
        id: key,
        label: value.label,
        type: value.type,
      })),
      id: normalizedResourceKey,
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
      resource: normalizedResourceKey,
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

async function getRandomResource(resourceKey, query) {
  const parsed = parseListQuery(resourceKey, query);
  const item = await getRandomResourceRow(parsed.resourceKey);

  if (!item) {
    throw createApiError(404, 'ENTITY_NOT_FOUND', `No records found for resource "${parsed.resourceKey}"`);
  }

  return {
    data: serializeResource(parsed.resourceKey, item, parsed.fieldMap),
    included: await buildIncluded(parsed.resourceKey, [item], parsed.include, parsed.fieldMap),
    meta: {
      include: parsed.include,
      resource: parsed.resourceKey,
      strategy: 'random',
    },
  };
}

async function getStats(resourceKey, groupKey) {
  const normalizedResourceKey = normalizeResourceKey(resourceKey);
  if (normalizedResourceKey === 'factions' && groupKey === 'by-race') {
    const rows = await getFactionStatsByRace();
    return {
      data: rows,
      meta: {
        groupBy: 'race',
        resource: 'factions',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  if (normalizedResourceKey === 'events' && groupKey === 'by-era') {
    const rows = await getEventStatsByEra();
    return {
      data: rows,
      meta: {
        groupBy: 'era',
        resource: 'events',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  if (normalizedResourceKey === 'units' && groupKey === 'by-faction') {
    const rows = await getUnitStatsByFaction();
    return {
      data: rows,
      meta: {
        groupBy: 'faction',
        resource: 'units',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  if (normalizedResourceKey === 'weapons' && groupKey === 'by-keyword') {
    const rows = await getWeaponStatsByKeyword();
    return {
      data: rows,
      meta: {
        groupBy: 'keyword',
        resource: 'weapons',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  if (normalizedResourceKey === 'relics' && groupKey === 'by-faction') {
    const rows = await getRelicStatsByFaction();
    return {
      data: rows,
      meta: {
        groupBy: 'faction',
        resource: 'relics',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  if (normalizedResourceKey === 'campaigns' && groupKey === 'by-organization') {
    const rows = await getCampaignStatsByOrganization();
    return {
      data: rows,
      meta: {
        groupBy: 'organization',
        resource: 'campaigns',
        total: rows.reduce((sum, row) => sum + row.count, 0),
      },
    };
  }

  throw createApiError(404, 'STATS_NOT_FOUND', `Stats endpoint "${resourceKey}/${groupKey}" was not found`);
}

async function searchAll(query, pathname) {
  const search = String(query.search || query.q || '').trim();

  if (!search) {
    throw createApiError(400, 'VALIDATION_ERROR', 'Parameter "search" is required');
  }

  const requestedResources = splitCsv(query.resources);
  const resources = (requestedResources.length ? requestedResources : resourceOrder).map((resourceKey) => normalizeResourceKey(resourceKey));
  const limit = Math.min(parsePositiveInt(query.limit, 12), MAX_PAGE_SIZE);

  resources.forEach((resourceKey) => getResourceConfig(resourceKey));

  const resultsByResource = await Promise.all(resources.map((resourceKey) => searchResourceRows(resourceKey, search, limit)));
  const allResults = resultsByResource
    .flatMap((entry, index) => entry.rows.map((item) => ({
      id: item.id,
      name: item.name,
      rank: item._searchRank || 0,
      resource: resources[index],
      slug: item.slug,
      summary: item.summary,
    })))
    .sort((left, right) => {
      if (right.rank !== left.rank) {
        return right.rank - left.rank;
      }

      if (left.resource !== right.resource) {
        return left.resource.localeCompare(right.resource);
      }

      return left.name.localeCompare(right.name);
    });
  const results = allResults.slice(0, limit).map(({ rank, ...item }) => item);
  const total = resultsByResource.reduce((sum, entry) => sum + entry.total, 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

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
      totalPages,
    },
  };
}

module.exports = {
  compareResources,
  getExploreGraph,
  getExplorePath,
  getConcurrencyExample,
  getOverview,
  getQueryGuide,
  getRandomResource,
  getResourceCatalog,
  getResourceDetail,
  getResourceDocumentation,
  getStats,
  listResource,
  searchAll,
};
