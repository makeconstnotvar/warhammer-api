const fs = require("node:fs/promises");
const path = require("node:path");
const prettier = require("prettier");
const { getOpenApiSpec } = require("../server/content/contentApi");

const OUTPUT_PATH = path.resolve(__dirname, "../sdk/warhammerApiV1Client.mjs");
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const CHECK_MODE = process.argv.includes("--check");

function resolveRef(spec, ref) {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref format: ${ref}`);
  }

  return ref
    .slice(2)
    .split("/")
    .reduce((current, part) => {
      if (!current || !Object.prototype.hasOwnProperty.call(current, part)) {
        throw new Error(`Cannot resolve $ref: ${ref}`);
      }

      return current[part];
    }, spec);
}

function resolveParameter(spec, parameter) {
  if (!parameter.$ref) {
    return parameter;
  }

  return resolveRef(spec, parameter.$ref);
}

function normalizeParameter(parameter) {
  return {
    description: parameter.description || "",
    example: parameter.example,
    explode: parameter.explode ?? false,
    in: parameter.in,
    name: parameter.name,
    required: parameter.required === true,
    schema: parameter.schema || {},
    style: parameter.style || "form",
  };
}

function buildOperations(spec) {
  return Object.entries(spec.paths)
    .flatMap(([pathKey, pathItem]) =>
      Object.entries(pathItem)
        .filter(([method]) => HTTP_METHODS.has(method))
        .map(([method, operation]) => {
          const parameters = (operation.parameters || [])
            .map((parameter) => resolveParameter(spec, parameter))
            .map(normalizeParameter);

          return {
            method: method.toUpperCase(),
            operationId: operation.operationId,
            path: pathKey,
            pathParameters: parameters.filter((parameter) => parameter.in !== "query"),
            queryParameters: parameters.filter((parameter) => parameter.in === "query"),
            summary: operation.summary || "",
            tags: operation.tags || [],
          };
        })
    )
    .sort((left, right) => left.operationId.localeCompare(right.operationId));
}

function buildOperationsMap(operations) {
  return operations.reduce((result, operation) => {
    result[operation.operationId] = {
      method: operation.method,
      path: operation.path,
      pathParameters: operation.pathParameters,
      queryParameters: operation.queryParameters,
      summary: operation.summary,
      tags: operation.tags,
    };

    return result;
  }, {});
}

function renderMethod(operation) {
  const pathParamNames = operation.pathParameters.map((parameter) => parameter.name);
  const destructureParts = [...pathParamNames, "query = {}", "init = {}"];
  const pathParamsObject = pathParamNames.length ? `{ ${pathParamNames.join(", ")} }` : "{}";

  return `${operation.operationId}(options = {}) {
    const { ${destructureParts.join(", ")} } = options;

    return requestOperation({
      baseUrl,
      fetchImpl,
      operationId: "${operation.operationId}",
      pathParams: ${pathParamsObject},
      query,
      init,
    });
  },`;
}

function buildSdkSource(spec, operations) {
  const operationsLiteral = JSON.stringify(buildOperationsMap(operations), null, 2);
  const methodsLiteral = operations.map(renderMethod).join("\n    ");

  return `/**
 * Generated from /api/v1/openapi.json via scripts/generateSdk.js.
 * Do not edit manually.
 */

const operations = ${operationsLiteral};

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

  return String(baseUrl).replace(/\\/$/, "");
}

function applyPathParams(pathTemplate, pathParams = {}) {
  return pathTemplate.replace(/\\{([^}]+)\\}/g, (_, key) => {
    const value = pathParams[key];

    if (value === undefined || value === null || value === "") {
      throw new TypeError(\`Missing path parameter: \${key}\`);
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
      appendQueryEntry(searchParams, \`\${key}[\${nestedKey}]\`, nestedValue);
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

  return \`\${normalizedBaseUrl}\${resolvedPath}\${queryString ? \`?\${queryString}\` : ""}\`;
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

  if (/application\\/json/i.test(contentType)) {
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
    throw new Error(\`Unknown operationId: \${operationId}\`);
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
    throw new WarhammerApiError(data?.error?.message || \`Request failed with status \${response.status}\`, {
      data,
      headers,
      operation,
      status: response.status,
      url,
    });
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
    ${methodsLiteral}
  };
}

export { WarhammerApiError, buildUrl, createWarhammerApiClient, operations };
`;
}

async function writeFileIfNeeded(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  if (CHECK_MODE) {
    try {
      const current = await fs.readFile(filePath, "utf8");

      if (current !== contents) {
        console.error(`Generated SDK is out of date: ${path.relative(process.cwd(), filePath)}`);
        process.exitCode = 1;
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`Generated SDK is missing: ${path.relative(process.cwd(), filePath)}`);
        process.exitCode = 1;
        return;
      }

      throw error;
    }

    return;
  }

  await fs.writeFile(filePath, contents, "utf8");
  console.log(`Generated ${path.relative(process.cwd(), filePath)}`);
}

async function main() {
  const spec = getOpenApiSpec();
  const operations = buildOperations(spec);
  const source = buildSdkSource(spec, operations);
  const formatted = await prettier.format(source, {
    parser: "babel",
    printWidth: 100,
    singleQuote: false,
    trailingComma: "es5",
  });

  await writeFileIfNeeded(OUTPUT_PATH, formatted);

  if (CHECK_MODE && process.exitCode) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
