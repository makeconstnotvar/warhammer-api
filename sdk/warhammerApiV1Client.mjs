/**
 * Generated from /api/v1/openapi.json via scripts/generateSdk.js.
 * Do not edit manually.
 */

const operations = {
  compareResources: {
    method: "GET",
    path: "/api/v1/compare/{resource}",
    pathParameters: [
      {
        description: "Resource that supports compare payloads.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "battlefields",
            "campaigns",
            "characters",
            "factions",
            "organizations",
            "relics",
            "star-systems",
            "units",
          ],
        },
        style: "form",
      },
    ],
    queryParameters: [
      {
        description:
          "Comma-separated identifiers to compare. Legacy aliases `items` and `values` are also accepted by the server.",
        example: "imperium-of-man,black-legion",
        explode: false,
        in: "query",
        name: "ids",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Comma-separated relation includes. Returned under the `included` block.",
        example: "faction,race,events",
        explode: false,
        in: "query",
        name: "include",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description:
          "Sparse fieldset map encoded as a deep object, for example `fields[characters]=id,name,slug`.",
        example: {
          characters: "id,name,slug",
        },
        explode: true,
        in: "query",
        name: "fields",
        required: false,
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
        style: "deepObject",
      },
    ],
    summary: "Compare two or more entities of the same resource",
    tags: ["Compare"],
  },
  getChangelog: {
    method: "GET",
    path: "/api/v1/changelog",
    pathParameters: [],
    queryParameters: [],
    summary: "Public changelog",
    tags: ["Lifecycle"],
  },
  getConcurrencyExample: {
    method: "GET",
    path: "/api/v1/examples/concurrency",
    pathParameters: [],
    queryParameters: [],
    summary: "Concurrency example",
    tags: ["Docs"],
  },
  getDeprecationPolicy: {
    method: "GET",
    path: "/api/v1/deprecation-policy",
    pathParameters: [],
    queryParameters: [],
    summary: "Deprecation and sunset policy",
    tags: ["Lifecycle"],
  },
  getExploreGraph: {
    method: "GET",
    path: "/api/v1/explore/graph",
    pathParameters: [],
    queryParameters: [
      {
        description: "Root resource type for the graph traversal.",
        example: "factions",
        explode: false,
        in: "query",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
      {
        description: "Root entity slug or id for graph traversal.",
        example: "imperium-of-man",
        explode: false,
        in: "query",
        name: "identifier",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Maximum depth for `explore/graph`.",
        example: 2,
        explode: false,
        in: "query",
        name: "depth",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 3,
          default: 2,
        },
        style: "form",
      },
      {
        description: "Maximum number of neighbors to expand per relation edge.",
        example: 4,
        explode: false,
        in: "query",
        name: "limitPerRelation",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 8,
          default: 4,
        },
        style: "form",
      },
      {
        description: "When true, reverse relations are also used during traversal.",
        example: true,
        explode: false,
        in: "query",
        name: "backlinks",
        required: false,
        schema: {
          type: "boolean",
          default: false,
        },
        style: "form",
      },
      {
        description:
          "Comma-separated whitelist of resource types used by search and traversal endpoints.",
        example: "campaigns,characters",
        explode: false,
        in: "query",
        name: "resources",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
    ],
    summary: "Relation graph traversal",
    tags: ["Explore"],
  },
  getExplorePath: {
    method: "GET",
    path: "/api/v1/explore/path",
    pathParameters: [],
    queryParameters: [
      {
        description: "Starting resource type for `explore/path`.",
        example: "characters",
        explode: false,
        in: "query",
        name: "fromResource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
      {
        description: "Starting entity slug or id for `explore/path`.",
        example: "roboute-guilliman",
        explode: false,
        in: "query",
        name: "fromIdentifier",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Target resource type for `explore/path`.",
        example: "relics",
        explode: false,
        in: "query",
        name: "toResource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
      {
        description: "Target entity slug or id for `explore/path`.",
        example: "emperors-sword",
        explode: false,
        in: "query",
        name: "toIdentifier",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Maximum traversal depth for `explore/path`.",
        example: 4,
        explode: false,
        in: "query",
        name: "maxDepth",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 6,
          default: 4,
        },
        style: "form",
      },
      {
        description: "Maximum number of neighbors to expand per relation edge.",
        example: 4,
        explode: false,
        in: "query",
        name: "limitPerRelation",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 8,
          default: 4,
        },
        style: "form",
      },
      {
        description: "When true, reverse relations are also used during traversal.",
        example: true,
        explode: false,
        in: "query",
        name: "backlinks",
        required: false,
        schema: {
          type: "boolean",
          default: false,
        },
        style: "form",
      },
      {
        description:
          "Comma-separated whitelist of resource types used by search and traversal endpoints.",
        example: "campaigns,characters",
        explode: false,
        in: "query",
        name: "resources",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
    ],
    summary: "Shortest path traversal between two entities",
    tags: ["Explore"],
  },
  getOpenApiSpec: {
    method: "GET",
    path: "/api/v1/openapi.json",
    pathParameters: [],
    queryParameters: [],
    summary: "Machine-readable OpenAPI contract",
    tags: ["Contract"],
  },
  getOverview: {
    method: "GET",
    path: "/api/v1/overview",
    pathParameters: [],
    queryParameters: [],
    summary: "High-level entry point for the public API",
    tags: ["Docs"],
  },
  getQueryGuide: {
    method: "GET",
    path: "/api/v1/query-guide",
    pathParameters: [],
    queryParameters: [],
    summary: "Query conventions and response shapes",
    tags: ["Docs"],
  },
  getRandomResource: {
    method: "GET",
    path: "/api/v1/random/{resource}",
    pathParameters: [
      {
        description: "Resource to sample from.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
    ],
    queryParameters: [
      {
        description: "Comma-separated relation includes. Returned under the `included` block.",
        example: "faction,race,events",
        explode: false,
        in: "query",
        name: "include",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description:
          "Sparse fieldset map encoded as a deep object, for example `fields[characters]=id,name,slug`.",
        example: {
          characters: "id,name,slug",
        },
        explode: true,
        in: "query",
        name: "fields",
        required: false,
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
        style: "deepObject",
      },
    ],
    summary: "Random resource detail",
    tags: ["Resources"],
  },
  getResourceCatalog: {
    method: "GET",
    path: "/api/v1/catalog/resources",
    pathParameters: [],
    queryParameters: [],
    summary: "Catalog of public resources",
    tags: ["Docs"],
  },
  getResourceDetail: {
    method: "GET",
    path: "/api/v1/{resource}/{idOrSlug}",
    pathParameters: [
      {
        description: "Public resource identifier.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
      {
        description: "Numeric id or public slug.",
        explode: false,
        in: "path",
        name: "idOrSlug",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
    ],
    queryParameters: [
      {
        description: "Comma-separated relation includes. Returned under the `included` block.",
        example: "faction,race,events",
        explode: false,
        in: "query",
        name: "include",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description:
          "Sparse fieldset map encoded as a deep object, for example `fields[characters]=id,name,slug`.",
        example: {
          characters: "id,name,slug",
        },
        explode: true,
        in: "query",
        name: "fields",
        required: false,
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
        style: "deepObject",
      },
    ],
    summary: "Get one resource entry by id or slug",
    tags: ["Resources"],
  },
  getResourceDocumentation: {
    method: "GET",
    path: "/api/v1/catalog/resources/{resource}",
    pathParameters: [
      {
        description: "Public resource identifier.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
    ],
    queryParameters: [],
    summary: "Documentation for a single resource",
    tags: ["Docs"],
  },
  getStats: {
    method: "GET",
    path: "/api/v1/stats/{resource}/{groupKey}",
    pathParameters: [
      {
        description: "Resource with supported aggregate projections.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "factions",
            "events",
            "units",
            "weapons",
            "relics",
            "campaigns",
            "battlefields",
            "star-systems",
          ],
        },
        style: "form",
      },
      {
        description: "Grouping key for the selected stats resource.",
        explode: false,
        in: "path",
        name: "groupKey",
        required: true,
        schema: {
          type: "string",
          enum: [
            "by-race",
            "by-era",
            "by-faction",
            "by-keyword",
            "by-organization",
            "by-segmentum",
          ],
        },
        style: "form",
      },
    ],
    queryParameters: [],
    summary: "Pre-aggregated stats endpoint",
    tags: ["Stats"],
  },
  getWorkbenchScenarios: {
    method: "GET",
    path: "/api/v1/examples/workbench",
    pathParameters: [],
    queryParameters: [],
    summary: "Workbench scenarios for interactive docs",
    tags: ["Docs"],
  },
  listResource: {
    method: "GET",
    path: "/api/v1/{resource}",
    pathParameters: [
      {
        description: "Public resource identifier.",
        explode: false,
        in: "path",
        name: "resource",
        required: true,
        schema: {
          type: "string",
          enum: [
            "eras",
            "races",
            "star-systems",
            "warp-routes",
            "planets",
            "factions",
            "fleets",
            "organizations",
            "keywords",
            "weapons",
            "relics",
            "units",
            "events",
            "campaigns",
            "battlefields",
            "characters",
          ],
        },
        style: "form",
      },
    ],
    queryParameters: [
      {
        description: "Page number for paginated list endpoints.",
        example: 1,
        explode: false,
        in: "query",
        name: "page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        style: "form",
      },
      {
        description: "Page size or search result limit. Maximum 50.",
        example: 12,
        explode: false,
        in: "query",
        name: "limit",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 12,
        },
        style: "form",
      },
      {
        description: "Optional full-text search term for list endpoints.",
        example: "guilliman",
        explode: false,
        in: "query",
        name: "search",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Comma-separated sort keys. Prefix with '-' for descending order.",
        example: "-powerLevel,name",
        explode: false,
        in: "query",
        name: "sort",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Comma-separated relation includes. Returned under the `included` block.",
        example: "faction,race,events",
        explode: false,
        in: "query",
        name: "include",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description:
          "Structured filters encoded as a deep object, for example `filter[faction]=ultramarines`.",
        example: {
          faction: "ultramarines",
        },
        explode: true,
        in: "query",
        name: "filter",
        required: false,
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
        style: "deepObject",
      },
      {
        description:
          "Sparse fieldset map encoded as a deep object, for example `fields[characters]=id,name,slug`.",
        example: {
          characters: "id,name,slug",
        },
        explode: true,
        in: "query",
        name: "fields",
        required: false,
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
        style: "deepObject",
      },
    ],
    summary: "List resource entries",
    tags: ["Resources"],
  },
  searchResources: {
    method: "GET",
    path: "/api/v1/search",
    pathParameters: [],
    queryParameters: [
      {
        description: "Search term used by the global search endpoint.",
        example: "guilliman",
        explode: false,
        in: "query",
        name: "search",
        required: true,
        schema: {
          type: "string",
        },
        style: "form",
      },
      {
        description: "Page size or search result limit. Maximum 50.",
        example: 12,
        explode: false,
        in: "query",
        name: "limit",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 12,
        },
        style: "form",
      },
      {
        description:
          "Comma-separated whitelist of resource types used by search and traversal endpoints.",
        example: "campaigns,characters",
        explode: false,
        in: "query",
        name: "resources",
        required: false,
        schema: {
          type: "string",
        },
        style: "form",
      },
    ],
    summary: "Global search across resources",
    tags: ["Search"],
  },
};

class WarhammerApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "WarhammerApiError";
    this.data = details.data;
    this.headers = details.headers || {};
    this.operation = details.operation || null;
    this.status = details.status || 0;
    this.url = details.url || "";
  }
}

function normalizeBaseUrl(baseUrl = "") {
  if (baseUrl === null || baseUrl === undefined) {
    return "";
  }

  return String(baseUrl).replace(/\/$/, "");
}

function applyPathParams(pathTemplate, pathParams = {}) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = pathParams[key];

    if (value === undefined || value === null || value === "") {
      throw new TypeError(`Missing path parameter: ${key}`);
    }

    return encodeURIComponent(String(value));
  });
}

function appendQueryEntry(searchParams, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return;
    }

    searchParams.set(key, value.join(","));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendQueryEntry(searchParams, `${key}[${nestedKey}]`, nestedValue);
    });
    return;
  }

  searchParams.set(key, String(value));
}

function buildQueryString(query = {}) {
  const searchParams = new globalThis.URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    appendQueryEntry(searchParams, key, value);
  });

  return searchParams.toString();
}

function buildUrl(baseUrl, pathTemplate, pathParams = {}, query = {}) {
  const pathname = applyPathParams(pathTemplate, pathParams);
  const queryString = buildQueryString(query);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const resolvedPath =
    normalizedBaseUrl.endsWith("/api/v1") && pathname.startsWith("/api/v1")
      ? pathname.slice("/api/v1".length)
      : pathname;

  return `${normalizedBaseUrl}${resolvedPath}${queryString ? `?${queryString}` : ""}`;
}

function normalizeHeaders(headersInit = {}) {
  const headers = new globalThis.Headers(headersInit);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  return headers;
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (/application\/json/i.test(contentType)) {
    return response.json();
  }

  return response.text();
}

async function requestOperation({
  baseUrl = "",
  fetchImpl = globalThis.fetch,
  operationId,
  pathParams = {},
  query = {},
  init = {},
}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required to use the generated SDK.");
  }

  const operation = operations[operationId];

  if (!operation) {
    throw new Error(`Unknown operationId: ${operationId}`);
  }

  const url = buildUrl(baseUrl, operation.path, pathParams, query);
  const response = await fetchImpl(url, {
    ...init,
    headers: normalizeHeaders(init.headers),
    method: operation.method,
  });
  const data = await readResponseBody(response);
  const headers = Object.fromEntries(response.headers.entries());

  if (!response.ok) {
    throw new WarhammerApiError(
      data?.error?.message || `Request failed with status ${response.status}`,
      {
        data,
        headers,
        operation,
        status: response.status,
        url,
      }
    );
  }

  return {
    data,
    headers,
    operation,
    status: response.status,
    url,
  };
}

function createWarhammerApiClient({ baseUrl = "", fetchImpl = globalThis.fetch } = {}) {
  return {
    operations,
    request(operationId, options = {}) {
      const { query = {}, init = {}, ...pathParams } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId,
        pathParams,
        query,
        init,
      });
    },
    compareResources(options = {}) {
      const { resource, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "compareResources",
        pathParams: { resource },
        query,
        init,
      });
    },
    getChangelog(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getChangelog",
        pathParams: {},
        query,
        init,
      });
    },
    getConcurrencyExample(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getConcurrencyExample",
        pathParams: {},
        query,
        init,
      });
    },
    getDeprecationPolicy(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getDeprecationPolicy",
        pathParams: {},
        query,
        init,
      });
    },
    getExploreGraph(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getExploreGraph",
        pathParams: {},
        query,
        init,
      });
    },
    getExplorePath(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getExplorePath",
        pathParams: {},
        query,
        init,
      });
    },
    getOpenApiSpec(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getOpenApiSpec",
        pathParams: {},
        query,
        init,
      });
    },
    getOverview(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getOverview",
        pathParams: {},
        query,
        init,
      });
    },
    getQueryGuide(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getQueryGuide",
        pathParams: {},
        query,
        init,
      });
    },
    getRandomResource(options = {}) {
      const { resource, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getRandomResource",
        pathParams: { resource },
        query,
        init,
      });
    },
    getResourceCatalog(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getResourceCatalog",
        pathParams: {},
        query,
        init,
      });
    },
    getResourceDetail(options = {}) {
      const { resource, idOrSlug, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getResourceDetail",
        pathParams: { resource, idOrSlug },
        query,
        init,
      });
    },
    getResourceDocumentation(options = {}) {
      const { resource, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getResourceDocumentation",
        pathParams: { resource },
        query,
        init,
      });
    },
    getStats(options = {}) {
      const { resource, groupKey, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getStats",
        pathParams: { resource, groupKey },
        query,
        init,
      });
    },
    getWorkbenchScenarios(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "getWorkbenchScenarios",
        pathParams: {},
        query,
        init,
      });
    },
    listResource(options = {}) {
      const { resource, query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "listResource",
        pathParams: { resource },
        query,
        init,
      });
    },
    searchResources(options = {}) {
      const { query = {}, init = {} } = options;

      return requestOperation({
        baseUrl,
        fetchImpl,
        operationId: "searchResources",
        pathParams: {},
        query,
        init,
      });
    },
  };
}

export { WarhammerApiError, buildUrl, createWarhammerApiClient, operations };
