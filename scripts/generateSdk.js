const fs = require("node:fs/promises");
const path = require("node:path");
const prettier = require("prettier");
const { getOpenApiSpec } = require("../server/content/contentApi");

const OUTPUT_MODULE_PATH = path.resolve(__dirname, "../sdk/warhammerApiV1Client.mjs");
const OUTPUT_TYPES_PATH = path.resolve(__dirname, "../sdk/warhammerApiV1Client.d.ts");
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

function getRefName(ref) {
  return ref.split("/").at(-1);
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

function getSuccessResponseSchema(operation) {
  return operation.responses?.["200"]?.content?.["application/json"]?.schema || null;
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
            responseSchema: getSuccessResponseSchema(operation),
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
    throw new WarhammerApiError(
      data?.error?.message || \`Request failed with status \${response.status}\`,
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
    ${methodsLiteral}
  };
}

export { WarhammerApiError, buildUrl, createWarhammerApiClient, operations };
`;
}

function toPascalCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function quoteProperty(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function literalType(value) {
  if (value === null) {
    return "null";
  }

  return JSON.stringify(value);
}

function uniqueTypes(types) {
  return [...new Set(types.filter(Boolean))];
}

function schemaToTs(schema) {
  if (!schema) {
    return "unknown";
  }

  if (schema.$ref) {
    return getRefName(schema.$ref);
  }

  if (schema.oneOf) {
    return uniqueTypes(schema.oneOf.map((entry) => schemaToTs(entry))).join(" | ");
  }

  if (schema.anyOf) {
    return uniqueTypes(schema.anyOf.map((entry) => schemaToTs(entry))).join(" | ");
  }

  if (schema.allOf) {
    return uniqueTypes(schema.allOf.map((entry) => schemaToTs(entry))).join(" & ");
  }

  if (schema.enum) {
    return uniqueTypes(schema.enum.map((value) => literalType(value))).join(" | ");
  }

  if (Array.isArray(schema.type)) {
    return uniqueTypes(schema.type.map((type) => schemaToTs({ ...schema, type }))).join(" | ");
  }

  if (schema.type === "array" || schema.items) {
    return `Array<${schemaToTs(schema.items || {})}>`;
  }

  if (schema.type === "object" || schema.properties || schema.additionalProperties !== undefined) {
    return objectSchemaToTs(schema);
  }

  switch (schema.type) {
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "null":
      return "null";
    case "string":
      return "string";
    default:
      return "unknown";
  }
}

function objectSchemaToTs(schema) {
  const properties = Object.entries(schema.properties || {});
  const required = new Set(schema.required || []);

  if (!properties.length) {
    if (schema.additionalProperties === false) {
      return "Record<string, never>";
    }

    if (schema.additionalProperties && schema.additionalProperties !== true) {
      return `Record<string, ${schemaToTs(schema.additionalProperties)}>`;
    }

    return "Record<string, unknown>";
  }

  const lines = properties.map(([name, propertySchema]) => {
    const optional = required.has(name) ? "" : "?";
    return `${quoteProperty(name)}${optional}: ${schemaToTs(propertySchema)};`;
  });

  if (schema.additionalProperties && schema.additionalProperties !== false) {
    lines.push(
      `[key: string]: ${
        schema.additionalProperties === true ? "unknown" : schemaToTs(schema.additionalProperties)
      };`
    );
  }

  return `{
${lines.map((line) => `  ${line}`).join("\n")}
}`;
}

function isCsvParameter(parameter) {
  return parameter.in === "query" && /Comma-separated/i.test(parameter.description || "");
}

function parameterToTs(parameter) {
  if (parameter.style === "deepObject") {
    return "WarhammerDeepQueryObject";
  }

  const schema = parameter.schema || {};
  const baseType = schemaToTs(schema);

  if (isCsvParameter(parameter) && schema.type === "string" && !schema.enum) {
    return "string | readonly string[]";
  }

  return baseType;
}

function hasRequiredOperationInputs(operation) {
  return (
    operation.pathParameters.some((parameter) => parameter.required) ||
    operation.queryParameters.some((parameter) => parameter.required)
  );
}

function buildQueryInterface(operation) {
  const interfaceName = `${toPascalCase(operation.operationId)}Query`;

  if (!operation.queryParameters.length) {
    return {
      interfaceName,
      source: `export interface ${interfaceName} {}\n`,
    };
  }

  const lines = operation.queryParameters.map((parameter) => {
    const optional = parameter.required ? "" : "?";
    return `  ${quoteProperty(parameter.name)}${optional}: ${parameterToTs(parameter)};`;
  });

  return {
    interfaceName,
    source: `export interface ${interfaceName} {\n${lines.join("\n")}\n}\n`,
  };
}

function buildOptionsInterface(operation, queryInterfaceName) {
  const interfaceName = `${toPascalCase(operation.operationId)}Options`;
  const lines = operation.pathParameters.map(
    (parameter) => `  ${quoteProperty(parameter.name)}: ${parameterToTs(parameter)};`
  );

  lines.push(
    `  query${operation.queryParameters.some((parameter) => parameter.required) ? "" : "?"}: ${queryInterfaceName};`
  );
  lines.push("  init?: WarhammerRequestInit;");

  return {
    interfaceName,
    source: `export interface ${interfaceName} {\n${lines.join("\n")}\n}\n`,
  };
}

function buildResponseType(operation) {
  const typeName = `${toPascalCase(operation.operationId)}ResponseBody`;
  const bodyType = operation.responseSchema ? schemaToTs(operation.responseSchema) : "unknown";

  return {
    typeName,
    source: `export type ${typeName} = ${bodyType};\n`,
  };
}

function buildSdkTypesSource(spec, operations) {
  const schemaTypes = Object.entries(spec.components.schemas)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, schema]) => `export type ${name} = ${schemaToTs(schema)};\n`)
    .join("\n");

  const queryInterfaces = [];
  const optionsInterfaces = [];
  const responseTypes = [];
  const operationMapLines = [];
  const responseMapLines = [];
  const operationsMapLines = [];
  const clientMethodLines = [];

  operations.forEach((operation) => {
    const queryInterface = buildQueryInterface(operation);
    const optionsInterface = buildOptionsInterface(operation, queryInterface.interfaceName);
    const responseType = buildResponseType(operation);
    const optionsParameter = hasRequiredOperationInputs(operation)
      ? `options: ${optionsInterface.interfaceName}`
      : `options?: ${optionsInterface.interfaceName}`;

    queryInterfaces.push(queryInterface.source);
    optionsInterfaces.push(optionsInterface.source);
    responseTypes.push(responseType.source);
    operationMapLines.push(`  ${operation.operationId}: ${optionsInterface.interfaceName};`);
    responseMapLines.push(`  ${operation.operationId}: ${responseType.typeName};`);
    operationsMapLines.push(`  ${operation.operationId}: WarhammerOperationDefinition;`);
    clientMethodLines.push(
      `  ${operation.operationId}(${optionsParameter}): Promise<WarhammerApiResponse<${responseType.typeName}>>;`
    );
  });

  const operationIds = operations
    .map((operation) => JSON.stringify(operation.operationId))
    .join(" | ");

  return `/**
 * Generated from /api/v1/openapi.json via scripts/generateSdk.js.
 * Do not edit manually.
 */

export type WarhammerOperationId = ${operationIds};
export type WarhammerHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type WarhammerScalar = string | number | boolean;
export type WarhammerQueryObjectValue =
  | WarhammerScalar
  | readonly WarhammerScalar[]
  | null
  | undefined;
export type WarhammerDeepQueryObject = Record<string, WarhammerQueryObjectValue>;

export interface WarhammerHeadersLike {
  entries(): IterableIterator<[string, string]>;
  get(name: string): string | null;
}

export interface WarhammerResponseLike {
  headers: WarhammerHeadersLike;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export interface WarhammerRequestInit {
  body?: unknown;
  headers?: Record<string, string> | Array<[string, string]>;
  method?: string;
  [key: string]: unknown;
}

export type WarhammerFetchLike = (
  input: string,
  init?: WarhammerRequestInit
) => Promise<WarhammerResponseLike>;

export interface WarhammerOperationParameterDefinition {
  description: string;
  example?: unknown;
  explode: boolean;
  in: "path" | "query";
  name: string;
  required: boolean;
  schema: unknown;
  style: string;
}

export interface WarhammerOperationDefinition {
  method: WarhammerHttpMethod;
  path: string;
  pathParameters: readonly WarhammerOperationParameterDefinition[];
  queryParameters: readonly WarhammerOperationParameterDefinition[];
  summary: string;
  tags: readonly string[];
}

export interface WarhammerApiResponse<TData = unknown> {
  data: TData;
  headers: Record<string, string>;
  operation: WarhammerOperationDefinition;
  status: number;
  url: string;
}

export declare class WarhammerApiError<TData = unknown> extends Error {
  constructor(
    message: string,
    details?: Partial<WarhammerApiResponse<TData>> & {
      data?: TData;
    }
  );

  data: TData;
  headers: Record<string, string>;
  operation: WarhammerOperationDefinition | null;
  status: number;
  url: string;
}

${schemaTypes}

${responseTypes.join("\n")}

${queryInterfaces.join("\n")}

${optionsInterfaces.join("\n")}

export interface WarhammerOperationOptionsMap {
${operationMapLines.join("\n")}
}

export interface WarhammerOperationResponseMap {
${responseMapLines.join("\n")}
}

export interface WarhammerOperationsMap {
${operationsMapLines.join("\n")}
}

export interface WarhammerApiClient {
  operations: WarhammerOperationsMap;
  request<TOperationId extends WarhammerOperationId>(
    operationId: TOperationId,
    options?: WarhammerOperationOptionsMap[TOperationId]
  ): Promise<WarhammerApiResponse<WarhammerOperationResponseMap[TOperationId]>>;
${clientMethodLines.join("\n")}
}

export declare const operations: WarhammerOperationsMap;

export declare function buildUrl(
  baseUrl: string,
  pathTemplate: string,
  pathParams?: Record<string, unknown>,
  query?: Record<string, unknown>
): string;

export declare function createWarhammerApiClient(options?: {
  baseUrl?: string;
  fetchImpl?: WarhammerFetchLike;
}): WarhammerApiClient;
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

async function buildOutput(filePath, parser, contents) {
  const formatted = await prettier.format(contents, {
    parser,
    printWidth: 100,
    singleQuote: false,
    trailingComma: "es5",
  });

  await writeFileIfNeeded(filePath, formatted);
}

async function main() {
  const spec = getOpenApiSpec();
  const operations = buildOperations(spec);

  await buildOutput(OUTPUT_MODULE_PATH, "babel", buildSdkSource(spec, operations));
  await buildOutput(OUTPUT_TYPES_PATH, "typescript", buildSdkTypesSource(spec, operations));

  if (CHECK_MODE && process.exitCode) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
