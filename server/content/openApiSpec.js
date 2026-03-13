const {
  apiInfo,
  concurrencyExample,
  dataset,
  featuredQueries,
  interactiveScenarios,
  gettingStartedSteps,
  queryGuide,
  resourceDefinitions,
  resourceOrder,
} = require("./warhammerContent");
const { changelog, deprecationPolicy } = require("./apiLifecycle");

const compareResources = [
  "battlefields",
  "campaigns",
  "characters",
  "factions",
  "organizations",
  "relics",
  "star-systems",
  "units",
];

const statsRoutes = [
  {
    groupKey: "by-race",
    resource: "factions",
    summary: "Aggregate faction counts by race.",
  },
  {
    groupKey: "by-era",
    resource: "events",
    summary: "Aggregate event counts by era.",
  },
  {
    groupKey: "by-faction",
    resource: "units",
    summary: "Aggregate unit counts and power spread by faction.",
  },
  {
    groupKey: "by-keyword",
    resource: "weapons",
    summary: "Aggregate weapon counts by keyword.",
  },
  {
    groupKey: "by-faction",
    resource: "relics",
    summary: "Aggregate relic counts by faction.",
  },
  {
    groupKey: "by-organization",
    resource: "campaigns",
    summary: "Aggregate campaigns by participating organization.",
  },
  {
    groupKey: "by-faction",
    resource: "battlefields",
    summary: "Aggregate battlefields by faction presence.",
  },
  {
    groupKey: "by-segmentum",
    resource: "star-systems",
    summary: "Aggregate star systems by segmentum.",
  },
];

const parameterExamples = {
  Backlinks: true,
  CompareIds: "imperium-of-man,black-legion",
  Depth: 2,
  Fields: {
    characters: "id,name,slug",
  },
  Filter: {
    faction: "ultramarines",
  },
  FromIdentifier: "roboute-guilliman",
  FromResource: "characters",
  GraphIdentifier: "imperium-of-man",
  GraphResource: "factions",
  Include: "faction,race,events",
  Limit: 12,
  LimitPerRelation: 4,
  MaxDepth: 4,
  Page: 1,
  ResourceWhitelist: "campaigns,characters",
  SearchQuery: "guilliman",
  SearchQueryOptional: "guilliman",
  Sort: "-powerLevel,name",
  ToIdentifier: "emperors-sword",
  ToResource: "relics",
};

function buildSchemaName(resourceKey, suffix = "Resource") {
  return `${resourceKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}${suffix}`;
}

function buildPrimitiveSchemaFromType(type) {
  if (type === "number") {
    return { type: "integer" };
  }

  if (type === "number[]") {
    return {
      type: "array",
      items: { type: "integer" },
    };
  }

  if (type === "string[]") {
    return {
      type: "array",
      items: { type: "string" },
    };
  }

  return { type: "string" };
}

function inferSchemaFromExample(value) {
  if (value === null || value === undefined) {
    return {
      type: ["string", "null"],
    };
  }

  if (Array.isArray(value)) {
    const firstDefined = value.find((entry) => entry !== null && entry !== undefined);

    return {
      type: "array",
      items: firstDefined ? inferSchemaFromExample(firstDefined) : { type: "string" },
      example: value,
    };
  }

  if (typeof value === "number") {
    return {
      type: Number.isInteger(value) ? "integer" : "number",
      example: value,
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "boolean",
      example: value,
    };
  }

  if (typeof value === "object") {
    return {
      type: "object",
      properties: Object.entries(value).reduce((result, [key, entry]) => {
        result[key] = inferSchemaFromExample(entry);
        return result;
      }, {}),
      additionalProperties: false,
      example: value,
    };
  }

  return {
    type: "string",
    example: String(value),
  };
}

function buildResourceSchema(resourceKey) {
  const config = resourceDefinitions[resourceKey];
  const fieldDescriptions = new Map((config.fields || []).map((field) => [field.name, field]));
  const example = dataset[resourceKey]?.[0] || {};
  const inferred = inferSchemaFromExample(example);
  const properties = {
    ...(inferred.properties || {}),
  };

  fieldDescriptions.forEach((field, fieldName) => {
    if (!properties[fieldName]) {
      properties[fieldName] = buildPrimitiveSchemaFromType(field.type);
    }

    properties[fieldName].description = field.description;
  });

  return {
    title: config.label,
    description: config.description,
    type: "object",
    properties,
    additionalProperties: false,
    example,
  };
}

function buildResourceStatsExample(resourceKey) {
  const config = resourceDefinitions[resourceKey];

  return {
    count: Array.isArray(dataset[resourceKey]) ? dataset[resourceKey].length : 0,
    description: config.description,
    filters: Object.entries(config.filters).map(([id, value]) => ({
      id,
      label: value.label,
      type: value.type,
    })),
    id: resourceKey,
    include: Object.entries(config.includes).map(([id, value]) => ({
      id,
      label: value.label,
      resource: value.resource,
    })),
    label: config.label,
    path: `${apiInfo.basePath}/${resourceKey}`,
    previewParams: config.previewParams,
    sampleQueries: config.sampleQueries,
  };
}

function buildOverviewExample(rateLimit) {
  return {
    data: {
      api: {
        ...apiInfo,
        rateLimit,
      },
      featuredQueries,
      gettingStartedSteps,
      interactiveScenarios,
      resources: resourceOrder.map(buildResourceStatsExample),
    },
    meta: {
      generatedAt: "2026-03-07T00:00:00.000Z",
    },
  };
}

function buildResourceDocumentationExample(resourceKey) {
  const config = resourceDefinitions[resourceKey];

  return {
    data: {
      count: Array.isArray(dataset[resourceKey]) ? dataset[resourceKey].length : 0,
      defaultSort: config.defaultSort,
      description: config.description,
      fields: config.fields,
      filters: Object.entries(config.filters).map(([id, value]) => ({
        id,
        label: value.label,
        type: value.type,
      })),
      id: resourceKey,
      includes: Object.entries(config.includes).map(([id, value]) => ({
        id,
        label: value.label,
        resource: value.resource,
      })),
      label: config.label,
      path: `${apiInfo.basePath}/${resourceKey}`,
      previewParams: config.previewParams,
      sampleQueries: config.sampleQueries,
    },
    meta: {
      basePath: apiInfo.basePath,
    },
  };
}

function buildQueryGuideExample(rateLimit) {
  return {
    data: {
      ...queryGuide,
      rateLimit,
    },
    meta: {
      basePath: apiInfo.basePath,
    },
  };
}

function buildChangelogExample() {
  return {
    data: changelog,
    meta: {
      basePath: apiInfo.basePath,
      currentVersion: apiInfo.version,
    },
  };
}

function buildDeprecationPolicyExample() {
  return {
    data: deprecationPolicy,
    meta: {
      basePath: apiInfo.basePath,
      currentVersion: apiInfo.version,
    },
  };
}

function buildConcurrencyExample() {
  return {
    data: concurrencyExample,
    meta: {
      basePath: apiInfo.basePath,
    },
  };
}

function buildWorkbenchScenariosExample() {
  return {
    data: interactiveScenarios,
    meta: {
      basePath: apiInfo.basePath,
      groups: Object.fromEntries(
        Object.entries(interactiveScenarios).map(([groupKey, scenarios]) => [
          groupKey,
          scenarios.length,
        ])
      ),
      total: Object.values(interactiveScenarios).reduce(
        (sum, scenarios) => sum + scenarios.length,
        0
      ),
    },
  };
}

function buildSearchExample() {
  return {
    data: [
      {
        id: 3,
        name: "Cadia",
        rank: 1,
        resource: "planets",
        slug: "cadia",
        summary: "Ключевой fortress world.",
      },
    ],
    meta: {
      limit: 12,
      page: 1,
      resource: "search",
      resources: ["planets", "events", "factions"],
      search: "cadia",
      total: 3,
    },
    links: {
      self: "/api/v1/search?search=cadia&resources=planets,events,factions",
    },
  };
}

function buildCompareExample() {
  return {
    data: {
      comparison: {
        powerSpread: 5,
        sharedRaceIds: [1],
        strongest: {
          id: 1,
          name: "Imperium of Man",
          powerLevel: 99,
        },
        weakest: {
          id: 3,
          name: "Black Legion",
          powerLevel: 94,
        },
      },
      items: [dataset.factions[0], dataset.factions[2]],
      resource: "factions",
    },
    included: {
      races: [dataset.races[0]],
      characters: [dataset.characters[0]],
      planets: [dataset.planets[0]],
    },
    meta: {
      count: 2,
      identifiers: ["imperium-of-man", "black-legion"],
      include: ["races", "leaders", "homeworld"],
      resource: "factions",
    },
  };
}

function buildGraphExample() {
  return {
    data: {
      root: {
        id: dataset.factions[0].id,
        name: dataset.factions[0].name,
        resource: "factions",
        slug: dataset.factions[0].slug,
      },
      nodes: [
        {
          id: dataset.factions[0].id,
          name: dataset.factions[0].name,
          resource: "factions",
          slug: dataset.factions[0].slug,
        },
        {
          id: dataset.characters[1].id,
          name: dataset.characters[1].name,
          resource: "characters",
          slug: dataset.characters[1].slug,
        },
      ],
      edges: [
        {
          direction: "outgoing",
          from: `factions:${dataset.factions[0].id}`,
          id: `factions:${dataset.factions[0].id}:leaders:characters:${dataset.characters[1].id}:outgoing`,
          label: "leaders",
          relation: "leaders",
          sourceResource: "factions",
          targetResource: "characters",
          to: `characters:${dataset.characters[1].id}`,
        },
      ],
    },
    included: {},
    meta: {
      backlinks: true,
      depth: 2,
      edgeCount: 1,
      identifier: dataset.factions[0].slug,
      limitPerRelation: 4,
      nodeCount: 2,
      requestedResourceTypes: [],
      resource: "factions",
      resourceTypes: ["factions", "characters"],
      truncatedRelations: [],
    },
  };
}

function buildPathExample() {
  return {
    data: {
      found: true,
      path: {
        edges: [
          {
            direction: "incoming",
            from: `relics:${dataset.relics[0].id}`,
            id: `relics:${dataset.relics[0].id}:bearer:characters:${dataset.characters[1].id}:incoming`,
            label: "bearer",
            pathIndex: 0,
            relation: "bearer",
            sourceResource: "relics",
            targetResource: "characters",
            to: `characters:${dataset.characters[1].id}`,
            traversal: "reverse",
          },
        ],
        length: 1,
        nodes: [
          {
            id: dataset.characters[1].id,
            name: dataset.characters[1].name,
            resource: "characters",
            slug: dataset.characters[1].slug,
          },
          {
            id: dataset.relics[0].id,
            name: dataset.relics[0].name,
            resource: "relics",
            slug: dataset.relics[0].slug,
          },
        ],
      },
    },
    included: {},
    meta: {
      backlinks: true,
      fromIdentifier: dataset.characters[1].slug,
      fromResource: "characters",
      limitPerRelation: 6,
      maxDepth: 4,
      requestedResourceTypes: [],
      resourceTypes: ["characters", "relics"],
      toIdentifier: dataset.relics[0].slug,
      toResource: "relics",
      truncatedRelations: [],
      visitedNodeCount: 2,
    },
  };
}

function buildStatsExample() {
  return {
    data: [
      {
        averagePowerLevel: 88,
        count: 3,
        maxPowerLevel: 92,
        name: "Ultramarines",
        slug: "ultramarines",
      },
    ],
    meta: {
      groupBy: "faction",
      resource: "units",
      total: 10,
    },
  };
}

function buildRateLimitHeaders(rateLimit) {
  const headerByName = rateLimit.headers.reduce((result, header) => {
    result[header.name] = header;
    return result;
  }, {});

  return {
    "RateLimit-Limit": {
      description: headerByName["RateLimit-Limit"].description,
      schema: { type: "string" },
      example: String(rateLimit.limit),
    },
    "RateLimit-Remaining": {
      description: headerByName["RateLimit-Remaining"].description,
      schema: { type: "string" },
      example: String(Math.max(rateLimit.limit - 1, 0)),
    },
    "RateLimit-Reset": {
      description: headerByName["RateLimit-Reset"].description,
      schema: { type: "string" },
      example: String(rateLimit.windowSeconds),
    },
    "RateLimit-Policy": {
      description: headerByName["RateLimit-Policy"].description,
      schema: { type: "string" },
      example: rateLimit.policy,
    },
  };
}

function createJsonResponse(description, schema, example, headers = {}) {
  return {
    description,
    headers,
    content: {
      "application/json": {
        schema,
        example,
      },
    },
  };
}

function createRateLimitResponse(rateLimit) {
  return {
    description: "Too many requests for the current rate limit window.",
    headers: {
      ...buildRateLimitHeaders(rateLimit),
      "Retry-After": {
        description: "Seconds to wait before retrying.",
        schema: { type: "string" },
        example: String(rateLimit.windowSeconds),
      },
    },
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/RateLimitErrorResponse",
        },
        example: queryGuide.responseShapes.rateLimitError,
      },
    },
  };
}

function createValidationErrorResponse() {
  return {
    description: "Request validation failed.",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ValidationErrorResponse",
        },
        example: queryGuide.responseShapes.error,
      },
    },
  };
}

function createNotFoundResponse(message = "Requested entity was not found.") {
  return {
    description: message,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
        example: {
          error: {
            code: "ENTITY_NOT_FOUND",
            message,
          },
        },
      },
    },
  };
}

function createResourceEnumParameter(name, description, enumValues) {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema: {
      type: "string",
      enum: enumValues,
    },
  };
}

function buildOperationParameters(parameterNames) {
  return parameterNames.map((name) => ({
    $ref: `#/components/parameters/${name}`,
  }));
}

function buildResourceResponseRefs(suffix) {
  return resourceOrder.map((resourceKey) => ({
    $ref: `#/components/schemas/${buildSchemaName(resourceKey, suffix)}`,
  }));
}

function buildResourceSchemas() {
  return resourceOrder.reduce((result, resourceKey) => {
    const resourceSchemaName = buildSchemaName(resourceKey, "Resource");
    const listSchemaName = buildSchemaName(resourceKey, "ListResponse");
    const detailSchemaName = buildSchemaName(resourceKey, "DetailResponse");

    result[resourceSchemaName] = buildResourceSchema(resourceKey);
    result[listSchemaName] = {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            $ref: `#/components/schemas/${resourceSchemaName}`,
          },
        },
        included: {
          $ref: "#/components/schemas/IncludedResources",
        },
        links: {
          $ref: "#/components/schemas/PaginationLinks",
        },
        meta: {
          $ref: "#/components/schemas/ListMeta",
        },
      },
      additionalProperties: false,
    };
    result[detailSchemaName] = {
      type: "object",
      properties: {
        data: {
          $ref: `#/components/schemas/${resourceSchemaName}`,
        },
        included: {
          $ref: "#/components/schemas/IncludedResources",
        },
        meta: {
          $ref: "#/components/schemas/DetailMeta",
        },
      },
      additionalProperties: false,
    };

    return result;
  }, {});
}

function buildIncludedResourcesSchema() {
  return {
    type: "object",
    properties: resourceOrder.reduce((result, resourceKey) => {
      result[resourceKey] = {
        type: "array",
        items: {
          $ref: `#/components/schemas/${buildSchemaName(resourceKey, "Resource")}`,
        },
      };
      return result;
    }, {}),
    additionalProperties: false,
  };
}

function buildGraphNodeSchema() {
  return {
    type: "object",
    properties: {
      distance: { type: "integer" },
      id: { type: "integer" },
      influenceLevel: {
        oneOf: [{ type: "integer" }, { type: "null" }],
      },
      key: { type: "string" },
      name: { type: "string" },
      powerLevel: {
        oneOf: [{ type: "integer" }, { type: "null" }],
      },
      resource: {
        type: "string",
        enum: resourceOrder,
      },
      slug: {
        oneOf: [{ type: "string" }, { type: "null" }],
      },
      status: {
        oneOf: [{ type: "string" }, { type: "null" }],
      },
      summary: {
        oneOf: [{ type: "string" }, { type: "null" }],
      },
      type: {
        oneOf: [{ type: "string" }, { type: "null" }],
      },
      yearLabel: {
        oneOf: [{ type: "string" }, { type: "null" }],
      },
    },
    required: ["distance", "id", "key", "name", "resource"],
    additionalProperties: false,
  };
}

function buildGraphEdgeSchema() {
  return {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["incoming", "outgoing"],
      },
      from: { type: "string" },
      id: { type: "string" },
      label: { type: "string" },
      relation: { type: "string" },
      sourceResource: {
        type: "string",
        enum: resourceOrder,
      },
      targetResource: {
        type: "string",
        enum: resourceOrder,
      },
      to: { type: "string" },
    },
    required: [
      "direction",
      "from",
      "id",
      "label",
      "relation",
      "sourceResource",
      "targetResource",
      "to",
    ],
    additionalProperties: false,
  };
}

function buildTruncatedRelationSchema() {
  return {
    type: "object",
    properties: {
      from: { type: "string" },
      hiddenCount: { type: "integer" },
      label: { type: "string" },
      relation: { type: "string" },
      sourceResource: {
        type: "string",
        enum: resourceOrder,
      },
      targetResource: {
        type: "string",
        enum: resourceOrder,
      },
    },
    required: ["from", "hiddenCount", "label", "relation"],
    additionalProperties: false,
  };
}

function buildGraphResponseSchema() {
  return {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          edges: {
            type: "array",
            items: { $ref: "#/components/schemas/GraphEdge" },
          },
          nodes: {
            type: "array",
            items: { $ref: "#/components/schemas/GraphNode" },
          },
          root: {
            $ref: "#/components/schemas/GraphNode",
          },
        },
        required: ["edges", "nodes", "root"],
        additionalProperties: false,
      },
      included: {
        $ref: "#/components/schemas/IncludedResources",
      },
      meta: {
        type: "object",
        properties: {
          backlinks: { type: "boolean" },
          depth: { type: "integer" },
          edgeCount: { type: "integer" },
          identifier: { type: "string" },
          limitPerRelation: { type: "integer" },
          nodeCount: { type: "integer" },
          requestedResourceTypes: {
            type: "array",
            items: {
              type: "string",
              enum: resourceOrder,
            },
          },
          resource: {
            type: "string",
            enum: resourceOrder,
          },
          resourceTypes: {
            type: "array",
            items: {
              type: "string",
              enum: resourceOrder,
            },
          },
          truncatedRelations: {
            type: "array",
            items: {
              $ref: "#/components/schemas/GraphTruncatedRelation",
            },
          },
        },
        required: [
          "backlinks",
          "depth",
          "edgeCount",
          "identifier",
          "limitPerRelation",
          "nodeCount",
          "requestedResourceTypes",
          "resource",
          "resourceTypes",
          "truncatedRelations",
        ],
        additionalProperties: false,
      },
    },
    required: ["data", "included", "meta"],
    additionalProperties: false,
  };
}

function buildPathResponseSchema() {
  return {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          found: { type: "boolean" },
          from: {
            $ref: "#/components/schemas/GraphNode",
          },
          path: {
            type: "object",
            properties: {
              edges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    direction: {
                      type: "string",
                      enum: ["incoming", "outgoing"],
                    },
                    from: { type: "string" },
                    id: { type: "string" },
                    label: { type: "string" },
                    pathIndex: { type: "integer" },
                    relation: { type: "string" },
                    sourceResource: {
                      type: "string",
                      enum: resourceOrder,
                    },
                    targetResource: {
                      type: "string",
                      enum: resourceOrder,
                    },
                    to: { type: "string" },
                    traversal: {
                      type: "string",
                      enum: ["forward", "reverse"],
                    },
                  },
                  required: [
                    "direction",
                    "from",
                    "id",
                    "label",
                    "pathIndex",
                    "relation",
                    "sourceResource",
                    "targetResource",
                    "to",
                    "traversal",
                  ],
                  additionalProperties: false,
                },
              },
              length: { type: "integer" },
              nodes: {
                type: "array",
                items: { $ref: "#/components/schemas/GraphNode" },
              },
            },
            required: ["edges", "length", "nodes"],
            additionalProperties: false,
          },
          to: {
            $ref: "#/components/schemas/GraphNode",
          },
        },
        required: ["found", "from", "path", "to"],
        additionalProperties: false,
      },
      included: {
        $ref: "#/components/schemas/IncludedResources",
      },
      meta: {
        type: "object",
        properties: {
          backlinks: { type: "boolean" },
          fromIdentifier: { type: "string" },
          fromResource: {
            type: "string",
            enum: resourceOrder,
          },
          limitPerRelation: { type: "integer" },
          maxDepth: { type: "integer" },
          requestedResourceTypes: {
            type: "array",
            items: {
              type: "string",
              enum: resourceOrder,
            },
          },
          resourceTypes: {
            type: "array",
            items: {
              type: "string",
              enum: resourceOrder,
            },
          },
          toIdentifier: { type: "string" },
          toResource: {
            type: "string",
            enum: resourceOrder,
          },
          truncatedRelations: {
            type: "array",
            items: {
              $ref: "#/components/schemas/GraphTruncatedRelation",
            },
          },
          visitedNodeCount: { type: "integer" },
        },
        required: [
          "backlinks",
          "fromIdentifier",
          "fromResource",
          "limitPerRelation",
          "maxDepth",
          "requestedResourceTypes",
          "resourceTypes",
          "toIdentifier",
          "toResource",
          "truncatedRelations",
          "visitedNodeCount",
        ],
        additionalProperties: false,
      },
    },
    required: ["data", "included", "meta"],
    additionalProperties: false,
  };
}

function buildStatsSchemas() {
  return {
    FactionCountStatsRow: {
      type: "object",
      properties: {
        count: { type: "integer" },
        id: { type: "integer" },
        name: { type: "string" },
        slug: { type: "string" },
      },
      required: ["count", "id", "name", "slug"],
      additionalProperties: false,
    },
    PowerLevelStatsRow: {
      type: "object",
      properties: {
        averagePowerLevel: { type: "integer" },
        count: { type: "integer" },
        id: { type: "integer" },
        maxPowerLevel: { type: "integer" },
        name: { type: "string" },
        slug: { type: "string" },
      },
      required: ["averagePowerLevel", "count", "id", "maxPowerLevel", "name", "slug"],
      additionalProperties: false,
    },
    CampaignOrganizationStatsRow: {
      type: "object",
      properties: {
        activeCount: { type: "integer" },
        count: { type: "integer" },
        id: { type: "integer" },
        latestYearLabel: { type: "string" },
        latestYearOrder: { type: "integer" },
        name: { type: "string" },
        organizationType: { type: "string" },
        slug: { type: "string" },
      },
      required: [
        "activeCount",
        "count",
        "id",
        "latestYearLabel",
        "latestYearOrder",
        "name",
        "organizationType",
        "slug",
      ],
      additionalProperties: false,
    },
    BattlefieldIntensityStatsRow: {
      type: "object",
      properties: {
        averageIntensityLevel: { type: "integer" },
        count: { type: "integer" },
        id: { type: "integer" },
        maxIntensityLevel: { type: "integer" },
        name: { type: "string" },
        slug: { type: "string" },
      },
      required: ["averageIntensityLevel", "count", "id", "maxIntensityLevel", "name", "slug"],
      additionalProperties: false,
    },
    SegmentumStatsRow: {
      type: "object",
      properties: {
        activeCount: { type: "integer" },
        count: { type: "integer" },
        id: { type: "integer" },
        name: { type: "string" },
        planetCount: { type: "integer" },
        slug: { type: "string" },
      },
      required: ["activeCount", "count", "id", "name", "planetCount", "slug"],
      additionalProperties: false,
    },
    WeaponKeywordStatsRow: {
      type: "object",
      properties: {
        averagePowerLevel: { type: "integer" },
        category: { type: "string" },
        count: { type: "integer" },
        id: { type: "integer" },
        maxPowerLevel: { type: "integer" },
        name: { type: "string" },
        slug: { type: "string" },
      },
      required: ["averagePowerLevel", "category", "count", "id", "maxPowerLevel", "name", "slug"],
      additionalProperties: false,
    },
    EventEraStatsRow: {
      type: "object",
      properties: {
        count: { type: "integer" },
        id: { type: "integer" },
        name: { type: "string" },
        slug: { type: "string" },
        yearLabel: { type: "string" },
        yearOrder: { type: "integer" },
      },
      required: ["count", "id", "name", "slug", "yearLabel", "yearOrder"],
      additionalProperties: false,
    },
    StatsMeta: {
      type: "object",
      properties: {
        groupBy: { type: "string" },
        resource: {
          type: "string",
          enum: [...new Set(statsRoutes.map((item) => item.resource))],
        },
        total: { type: "integer" },
      },
      required: ["groupBy", "resource", "total"],
      additionalProperties: false,
    },
    StatsResponse: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            oneOf: [
              { $ref: "#/components/schemas/FactionCountStatsRow" },
              { $ref: "#/components/schemas/PowerLevelStatsRow" },
              { $ref: "#/components/schemas/CampaignOrganizationStatsRow" },
              { $ref: "#/components/schemas/BattlefieldIntensityStatsRow" },
              { $ref: "#/components/schemas/SegmentumStatsRow" },
              { $ref: "#/components/schemas/WeaponKeywordStatsRow" },
              { $ref: "#/components/schemas/EventEraStatsRow" },
            ],
          },
        },
        meta: {
          $ref: "#/components/schemas/StatsMeta",
        },
      },
      required: ["data", "meta"],
      additionalProperties: false,
    },
  };
}

function buildPaths(rateLimit) {
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  const overviewExample = buildOverviewExample(rateLimit);
  const queryGuideExample = buildQueryGuideExample(rateLimit);

  return {
    "/api/v1/openapi.json": {
      get: {
        tags: ["Contract"],
        summary: "Machine-readable OpenAPI contract",
        operationId: "getOpenApiSpec",
        responses: {
          200: createJsonResponse(
            "OpenAPI 3.1 contract for the public API.",
            {
              $ref: "#/components/schemas/OpenApiDocument",
            },
            {
              openapi: "3.1.0",
              info: {
                title: apiInfo.title,
                version: apiInfo.version,
              },
            },
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/overview": {
      get: {
        tags: ["Docs"],
        summary: "High-level entry point for the public API",
        operationId: "getOverview",
        responses: {
          200: createJsonResponse(
            "Overview document with resources, guides and featured queries.",
            {
              $ref: "#/components/schemas/OverviewResponse",
            },
            overviewExample,
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/catalog/resources": {
      get: {
        tags: ["Docs"],
        summary: "Catalog of public resources",
        operationId: "getResourceCatalog",
        responses: {
          200: createJsonResponse(
            "Resource catalog with preview params and sample queries.",
            {
              $ref: "#/components/schemas/ResourceCatalogResponse",
            },
            {
              data: resourceOrder.map(buildResourceStatsExample),
              meta: {
                total: resourceOrder.length,
              },
            },
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/catalog/resources/{resource}": {
      get: {
        tags: ["Docs"],
        summary: "Documentation for a single resource",
        operationId: "getResourceDocumentation",
        parameters: [
          createResourceEnumParameter("resource", "Public resource identifier.", resourceOrder),
        ],
        responses: {
          200: createJsonResponse(
            "Resource-specific documentation payload.",
            {
              $ref: "#/components/schemas/ResourceDocumentationResponse",
            },
            buildResourceDocumentationExample("factions"),
            rateLimitHeaders
          ),
          404: createNotFoundResponse('Unknown resource "unknown-resource".'),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/query-guide": {
      get: {
        tags: ["Docs"],
        summary: "Query conventions and response shapes",
        operationId: "getQueryGuide",
        responses: {
          200: createJsonResponse(
            "Documentation for supported query conventions.",
            {
              $ref: "#/components/schemas/QueryGuideResponse",
            },
            queryGuideExample,
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/changelog": {
      get: {
        tags: ["Lifecycle"],
        summary: "Public changelog",
        operationId: "getChangelog",
        responses: {
          200: createJsonResponse(
            "Versioned history of public contract changes.",
            {
              $ref: "#/components/schemas/ChangelogResponse",
            },
            buildChangelogExample(),
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/deprecation-policy": {
      get: {
        tags: ["Lifecycle"],
        summary: "Deprecation and sunset policy",
        operationId: "getDeprecationPolicy",
        responses: {
          200: createJsonResponse(
            "Deprecation guarantees and runtime header policy.",
            {
              $ref: "#/components/schemas/DeprecationPolicyResponse",
            },
            buildDeprecationPolicyExample(),
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/examples/concurrency": {
      get: {
        tags: ["Docs"],
        summary: "Concurrency example",
        operationId: "getConcurrencyExample",
        responses: {
          200: createJsonResponse(
            "Example Promise.all workflow for dashboard loading.",
            {
              $ref: "#/components/schemas/ConcurrencyExampleResponse",
            },
            buildConcurrencyExample(),
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/examples/workbench": {
      get: {
        tags: ["Docs"],
        summary: "Workbench scenarios for interactive docs",
        operationId: "getWorkbenchScenarios",
        responses: {
          200: createJsonResponse(
            "Structured compare, graph and path scenarios owned by the docs layer.",
            {
              $ref: "#/components/schemas/WorkbenchScenariosResponse",
            },
            buildWorkbenchScenariosExample(),
            rateLimitHeaders
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/search": {
      get: {
        tags: ["Search"],
        summary: "Global search across resources",
        operationId: "searchResources",
        parameters: buildOperationParameters(["SearchQuery", "Limit", "ResourceWhitelist"]),
        responses: {
          200: createJsonResponse(
            "Ranked cross-resource search results.",
            {
              $ref: "#/components/schemas/SearchResponse",
            },
            buildSearchExample(),
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/random/{resource}": {
      get: {
        tags: ["Resources"],
        summary: "Random resource detail",
        operationId: "getRandomResource",
        parameters: [
          createResourceEnumParameter("resource", "Resource to sample from.", resourceOrder),
          ...buildOperationParameters(["Include", "Fields"]),
        ],
        responses: {
          200: createJsonResponse(
            "Random resource entry with optional includes.",
            {
              oneOf: buildResourceResponseRefs("DetailResponse"),
            },
            {
              data: dataset.characters[0],
              included: {
                factions: [dataset.factions[1]],
              },
              meta: {
                include: ["faction"],
                resource: "characters",
                strategy: "random",
              },
            },
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          404: createNotFoundResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/compare/{resource}": {
      get: {
        tags: ["Compare"],
        summary: "Compare two or more entities of the same resource",
        operationId: "compareResources",
        parameters: [
          createResourceEnumParameter(
            "resource",
            "Resource that supports compare payloads.",
            compareResources
          ),
          ...buildOperationParameters(["CompareIds", "Include", "Fields"]),
        ],
        responses: {
          200: createJsonResponse(
            "Comparison payload with ready-to-render summary and items.",
            {
              $ref: "#/components/schemas/CompareResponse",
            },
            buildCompareExample(),
            rateLimitHeaders
          ),
          400: createJsonResponse(
            "Validation or compare-specific input error.",
            {
              oneOf: [
                { $ref: "#/components/schemas/ValidationErrorResponse" },
                { $ref: "#/components/schemas/ErrorResponse" },
              ],
            },
            queryGuide.responseShapes.error
          ),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/stats/{resource}/{groupKey}": {
      get: {
        tags: ["Stats"],
        summary: "Pre-aggregated stats endpoint",
        description: statsRoutes
          .map((item) => `${item.resource}/${item.groupKey}: ${item.summary}`)
          .join("\n"),
        operationId: "getStats",
        parameters: [
          createResourceEnumParameter(
            "resource",
            "Resource with supported aggregate projections.",
            [...new Set(statsRoutes.map((item) => item.resource))]
          ),
          createResourceEnumParameter("groupKey", "Grouping key for the selected stats resource.", [
            ...new Set(statsRoutes.map((item) => item.groupKey)),
          ]),
        ],
        responses: {
          200: createJsonResponse(
            "Pre-aggregated rows ready for charts and dashboards.",
            {
              $ref: "#/components/schemas/StatsResponse",
            },
            buildStatsExample(),
            rateLimitHeaders
          ),
          404: createNotFoundResponse('Stats endpoint "relics/by-era" was not found.'),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/explore/graph": {
      get: {
        tags: ["Explore"],
        summary: "Relation graph traversal",
        operationId: "getExploreGraph",
        parameters: buildOperationParameters([
          "GraphResource",
          "GraphIdentifier",
          "Depth",
          "LimitPerRelation",
          "Backlinks",
          "ResourceWhitelist",
        ]),
        responses: {
          200: createJsonResponse(
            "Graph payload with nodes, edges and truncation metadata.",
            {
              $ref: "#/components/schemas/GraphResponse",
            },
            buildGraphExample(),
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/explore/path": {
      get: {
        tags: ["Explore"],
        summary: "Shortest path traversal between two entities",
        operationId: "getExplorePath",
        parameters: buildOperationParameters([
          "FromResource",
          "FromIdentifier",
          "ToResource",
          "ToIdentifier",
          "MaxDepth",
          "LimitPerRelation",
          "Backlinks",
          "ResourceWhitelist",
        ]),
        responses: {
          200: createJsonResponse(
            "Shortest path payload with nodes and edges.",
            {
              $ref: "#/components/schemas/PathResponse",
            },
            buildPathExample(),
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/{resource}": {
      get: {
        tags: ["Resources"],
        summary: "List resource entries",
        operationId: "listResource",
        parameters: [
          createResourceEnumParameter("resource", "Public resource identifier.", resourceOrder),
          ...buildOperationParameters([
            "Page",
            "Limit",
            "SearchQueryOptional",
            "Sort",
            "Include",
            "Filter",
            "Fields",
          ]),
        ],
        responses: {
          200: createJsonResponse(
            "Paginated resource list with optional filters and includes.",
            {
              oneOf: buildResourceResponseRefs("ListResponse"),
            },
            {
              data: dataset.factions.slice(0, 2),
              included: {
                races: [dataset.races[0]],
              },
              links: queryGuide.responseShapes.list.links,
              meta: {
                appliedFilters: {},
                include: ["races"],
                limit: 12,
                page: 1,
                resource: "factions",
                search: "",
                sort: ["name"],
                total: dataset.factions.length,
                totalPages: 1,
              },
            },
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          404: createNotFoundResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
    "/api/v1/{resource}/{idOrSlug}": {
      get: {
        tags: ["Resources"],
        summary: "Get one resource entry by id or slug",
        operationId: "getResourceDetail",
        parameters: [
          createResourceEnumParameter("resource", "Public resource identifier.", resourceOrder),
          {
            name: "idOrSlug",
            in: "path",
            required: true,
            description: "Numeric id or public slug.",
            schema: {
              type: "string",
            },
          },
          ...buildOperationParameters(["Include", "Fields"]),
        ],
        responses: {
          200: createJsonResponse(
            "Single resource entry with optional includes.",
            {
              oneOf: buildResourceResponseRefs("DetailResponse"),
            },
            {
              data: dataset.characters[1],
              included: {
                factions: [dataset.factions[1]],
                planets: [dataset.planets[3]],
              },
              meta: {
                include: ["faction", "homeworld"],
                resource: "characters",
              },
            },
            rateLimitHeaders
          ),
          400: createValidationErrorResponse(),
          404: createNotFoundResponse(),
          429: createRateLimitResponse(rateLimit),
        },
      },
    },
  };
}

function buildOpenApiSpec(rateLimit) {
  const resourceSchemas = buildResourceSchemas();
  const overviewExample = buildOverviewExample(rateLimit);
  const queryGuideExample = buildQueryGuideExample(rateLimit);
  const openApiDocumentShape = {
    openapi: "3.1.0",
    info: {
      title: apiInfo.title,
      version: apiInfo.version,
    },
    paths: {},
  };

  return {
    openapi: "3.1.0",
    info: {
      title: apiInfo.title,
      version: apiInfo.version,
      description: `${apiInfo.description} Machine-readable contract for SDK generation, mock servers and contract diffing.`,
    },
    jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
    servers: [
      {
        url: "/",
        description: "Same-origin server",
      },
    ],
    tags: [
      {
        name: "Docs",
        description: "Human-oriented documentation payloads exposed as JSON.",
      },
      {
        name: "Lifecycle",
        description: "Versioning, changelog and deprecation policy metadata.",
      },
      {
        name: "Resources",
        description: "List, detail and random access for public resources.",
      },
      {
        name: "Search",
        description: "Ranked cross-resource discovery endpoint.",
      },
      {
        name: "Compare",
        description: "Compare payloads for compatible resources.",
      },
      {
        name: "Explore",
        description: "Graph traversal and shortest path endpoints.",
      },
      {
        name: "Stats",
        description: "Pre-aggregated rows for charts and dashboards.",
      },
      {
        name: "Contract",
        description: "Machine-readable API contract endpoints.",
      },
    ],
    externalDocs: {
      description: "Changelog and deprecation policy",
      url: "/changelog",
    },
    paths: buildPaths(rateLimit),
    components: {
      parameters: {
        Page: {
          name: "page",
          in: "query",
          required: false,
          description: "Page number for paginated list endpoints.",
          example: parameterExamples.Page,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
        },
        Limit: {
          name: "limit",
          in: "query",
          required: false,
          description: "Page size or search result limit. Maximum 50.",
          example: parameterExamples.Limit,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 12,
          },
        },
        SearchQuery: {
          name: "search",
          in: "query",
          required: true,
          description: "Search term used by the global search endpoint.",
          example: parameterExamples.SearchQuery,
          schema: {
            type: "string",
          },
        },
        SearchQueryOptional: {
          name: "search",
          in: "query",
          required: false,
          description: "Optional full-text search term for list endpoints.",
          example: parameterExamples.SearchQueryOptional,
          schema: {
            type: "string",
          },
        },
        Sort: {
          name: "sort",
          in: "query",
          required: false,
          description: "Comma-separated sort keys. Prefix with '-' for descending order.",
          example: parameterExamples.Sort,
          schema: {
            type: "string",
          },
        },
        Include: {
          name: "include",
          in: "query",
          required: false,
          description: "Comma-separated relation includes. Returned under the `included` block.",
          example: parameterExamples.Include,
          schema: {
            type: "string",
          },
        },
        Fields: {
          name: "fields",
          in: "query",
          required: false,
          description:
            "Sparse fieldset map encoded as a deep object, for example `fields[characters]=id,name,slug`.",
          style: "deepObject",
          explode: true,
          example: parameterExamples.Fields,
          schema: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
        },
        Filter: {
          name: "filter",
          in: "query",
          required: false,
          description:
            "Structured filters encoded as a deep object, for example `filter[faction]=ultramarines`.",
          style: "deepObject",
          explode: true,
          example: parameterExamples.Filter,
          schema: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
        },
        ResourceWhitelist: {
          name: "resources",
          in: "query",
          required: false,
          description:
            "Comma-separated whitelist of resource types used by search and traversal endpoints.",
          example: parameterExamples.ResourceWhitelist,
          schema: {
            type: "string",
          },
        },
        CompareIds: {
          name: "ids",
          in: "query",
          required: true,
          description:
            "Comma-separated identifiers to compare. Legacy aliases `items` and `values` are also accepted by the server.",
          example: parameterExamples.CompareIds,
          schema: {
            type: "string",
          },
        },
        GraphResource: {
          name: "resource",
          in: "query",
          required: true,
          description: "Root resource type for the graph traversal.",
          example: parameterExamples.GraphResource,
          schema: {
            type: "string",
            enum: resourceOrder,
          },
        },
        GraphIdentifier: {
          name: "identifier",
          in: "query",
          required: true,
          description: "Root entity slug or id for graph traversal.",
          example: parameterExamples.GraphIdentifier,
          schema: {
            type: "string",
          },
        },
        Depth: {
          name: "depth",
          in: "query",
          required: false,
          description: "Maximum depth for `explore/graph`.",
          example: parameterExamples.Depth,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 3,
            default: 2,
          },
        },
        MaxDepth: {
          name: "maxDepth",
          in: "query",
          required: false,
          description: "Maximum traversal depth for `explore/path`.",
          example: parameterExamples.MaxDepth,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 6,
            default: 4,
          },
        },
        LimitPerRelation: {
          name: "limitPerRelation",
          in: "query",
          required: false,
          description: "Maximum number of neighbors to expand per relation edge.",
          example: parameterExamples.LimitPerRelation,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 8,
            default: 4,
          },
        },
        Backlinks: {
          name: "backlinks",
          in: "query",
          required: false,
          description: "When true, reverse relations are also used during traversal.",
          example: parameterExamples.Backlinks,
          schema: {
            type: "boolean",
            default: false,
          },
        },
        FromResource: {
          name: "fromResource",
          in: "query",
          required: true,
          description: "Starting resource type for `explore/path`.",
          example: parameterExamples.FromResource,
          schema: {
            type: "string",
            enum: resourceOrder,
          },
        },
        FromIdentifier: {
          name: "fromIdentifier",
          in: "query",
          required: true,
          description: "Starting entity slug or id for `explore/path`.",
          example: parameterExamples.FromIdentifier,
          schema: {
            type: "string",
          },
        },
        ToResource: {
          name: "toResource",
          in: "query",
          required: true,
          description: "Target resource type for `explore/path`.",
          example: parameterExamples.ToResource,
          schema: {
            type: "string",
            enum: resourceOrder,
          },
        },
        ToIdentifier: {
          name: "toIdentifier",
          in: "query",
          required: true,
          description: "Target entity slug or id for `explore/path`.",
          example: parameterExamples.ToIdentifier,
          schema: {
            type: "string",
          },
        },
      },
      schemas: {
        OpenApiDocument: inferSchemaFromExample(openApiDocumentShape),
        PaginationLinks: {
          type: "object",
          properties: {
            self: { type: "string" },
            next: { type: "string" },
            prev: { type: "string" },
          },
          additionalProperties: false,
        },
        IncludedResources: buildIncludedResourcesSchema(),
        ListMeta: {
          type: "object",
          properties: {
            appliedFilters: {
              type: "object",
              additionalProperties: true,
            },
            include: {
              type: "array",
              items: { type: "string" },
            },
            limit: { type: "integer" },
            page: { type: "integer" },
            resource: { type: "string" },
            search: { type: "string" },
            sort: {
              type: "array",
              items: { type: "string" },
            },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
          additionalProperties: false,
        },
        DetailMeta: {
          type: "object",
          properties: {
            include: {
              type: "array",
              items: { type: "string" },
            },
            resource: { type: "string" },
            strategy: { type: "string" },
          },
          additionalProperties: false,
        },
        ValidationErrorDetail: {
          type: "object",
          properties: {
            code: { type: "string" },
            field: { type: "string" },
            message: { type: "string" },
            value: {
              oneOf: [
                { type: "string" },
                { type: "integer" },
                { type: "boolean" },
                { type: "array", items: { type: "string" } },
              ],
            },
          },
          additionalProperties: true,
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
              required: ["code", "message"],
              additionalProperties: false,
            },
          },
          required: ["error"],
          additionalProperties: false,
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  enum: ["VALIDATION_ERROR"],
                },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ValidationErrorDetail",
                  },
                },
              },
              required: ["code", "message", "details"],
              additionalProperties: false,
            },
          },
          required: ["error"],
          additionalProperties: false,
        },
        RateLimitErrorResponse: inferSchemaFromExample(queryGuide.responseShapes.rateLimitError),
        OverviewResponse: inferSchemaFromExample(overviewExample),
        ResourceCatalogResponse: inferSchemaFromExample({
          data: resourceOrder.map(buildResourceStatsExample),
          meta: {
            total: resourceOrder.length,
          },
        }),
        ResourceDocumentationResponse: inferSchemaFromExample(
          buildResourceDocumentationExample("factions")
        ),
        QueryGuideResponse: inferSchemaFromExample(queryGuideExample),
        ChangelogResponse: inferSchemaFromExample(buildChangelogExample()),
        DeprecationPolicyResponse: inferSchemaFromExample(buildDeprecationPolicyExample()),
        ConcurrencyExampleResponse: inferSchemaFromExample(buildConcurrencyExample()),
        WorkbenchScenariosResponse: inferSchemaFromExample(buildWorkbenchScenariosExample()),
        SearchResponse: inferSchemaFromExample(buildSearchExample()),
        GraphNode: buildGraphNodeSchema(),
        GraphEdge: buildGraphEdgeSchema(),
        GraphTruncatedRelation: buildTruncatedRelationSchema(),
        CompareResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                comparison: {
                  type: "object",
                  additionalProperties: true,
                },
                items: {
                  type: "array",
                  items: {
                    oneOf: compareResources.map((resourceKey) => ({
                      $ref: `#/components/schemas/${buildSchemaName(resourceKey, "Resource")}`,
                    })),
                  },
                },
                resource: {
                  type: "string",
                  enum: compareResources,
                },
              },
              additionalProperties: false,
            },
            included: {
              $ref: "#/components/schemas/IncludedResources",
            },
            meta: {
              type: "object",
              properties: {
                count: { type: "integer" },
                identifiers: {
                  type: "array",
                  items: { type: "string" },
                },
                include: {
                  type: "array",
                  items: { type: "string" },
                },
                resource: {
                  type: "string",
                  enum: compareResources,
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        GraphResponse: buildGraphResponseSchema(),
        PathResponse: buildPathResponseSchema(),
        ...buildStatsSchemas(),
        ...resourceSchemas,
      },
    },
  };
}

module.exports = {
  buildOpenApiSpec,
};
