import { buildQueryString, parseCsvParam } from "./query";

const WORKBENCH_BASE_URL = "http://localhost";

function parseScenarioUrl(path) {
  return new URL(path || "/", WORKBENCH_BASE_URL);
}

function readOptionalParam(searchParams, key, fallback = "") {
  return searchParams.get(key) || fallback;
}

function readOptionalBooleanParam(searchParams, key, fallback = "true") {
  const value = searchParams.get(key);
  return value === null ? fallback : value;
}

function sanitizeResourceKeys(values = []) {
  return [
    ...new Set(
      (values || []).map((value) => String(value).trim()).filter(Boolean),
    ),
  ];
}

function buildCompareWorkbenchDocsPath(scenario) {
  return `/compare${buildQueryString({
    [`fields[${scenario.resource}]`]: scenario.fields,
    ids: scenario.ids,
    include: scenario.include,
    resource: scenario.resource,
  })}`;
}

function buildGraphWorkbenchDocsPath(scenario) {
  return `/explore/graph${buildQueryString({
    backlinks: scenario.backlinks,
    depth: scenario.depth,
    identifier: scenario.identifier,
    limitPerRelation: scenario.limitPerRelation,
    resources: scenario.resourceFilterKeys.join(","),
    resource: scenario.resource,
  })}`;
}

function buildPathWorkbenchDocsPath(scenario) {
  return `/explore/path${buildQueryString({
    backlinks: scenario.backlinks,
    fromIdentifier: scenario.fromIdentifier,
    fromResource: scenario.fromResource,
    limitPerRelation: scenario.limitPerRelation,
    maxDepth: scenario.maxDepth,
    resources: scenario.resourceFilterKeys.join(","),
    toIdentifier: scenario.toIdentifier,
    toResource: scenario.toResource,
  })}`;
}

function parseCompareWorkbenchScenarios(document) {
  return (document?.data?.compare || []).map((scenario) => {
    const url = parseScenarioUrl(scenario.path);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const resource = pathParts[pathParts.length - 1] || "";

    const parsedScenario = {
      ...scenario,
      fields: readOptionalParam(url.searchParams, `fields[${resource}]`),
      ids:
        readOptionalParam(url.searchParams, "ids") ||
        readOptionalParam(url.searchParams, "items") ||
        readOptionalParam(url.searchParams, "values"),
      include: readOptionalParam(url.searchParams, "include"),
      pathResources: sanitizeResourceKeys(scenario.pathResources),
      resource,
    };

    return {
      ...parsedScenario,
      docsPath: buildCompareWorkbenchDocsPath(parsedScenario),
    };
  });
}

function parseGraphWorkbenchScenarios(document) {
  return (document?.data?.graph || []).map((scenario) => {
    const url = parseScenarioUrl(scenario.path);

    const parsedScenario = {
      ...scenario,
      backlinks: readOptionalBooleanParam(url.searchParams, "backlinks"),
      depth: readOptionalParam(url.searchParams, "depth", "2"),
      identifier: readOptionalParam(url.searchParams, "identifier"),
      limitPerRelation: readOptionalParam(
        url.searchParams,
        "limitPerRelation",
        "4",
      ),
      resource: readOptionalParam(url.searchParams, "resource"),
      resourceFilterKeys: parseCsvParam(url.searchParams.get("resources")),
    };

    return {
      ...parsedScenario,
      docsPath: buildGraphWorkbenchDocsPath(parsedScenario),
    };
  });
}

function parsePathWorkbenchScenarios(document) {
  return (document?.data?.path || []).map((scenario) => {
    const url = parseScenarioUrl(scenario.path);

    const parsedScenario = {
      ...scenario,
      backlinks: readOptionalBooleanParam(url.searchParams, "backlinks"),
      fromIdentifier: readOptionalParam(url.searchParams, "fromIdentifier"),
      fromResource: readOptionalParam(url.searchParams, "fromResource"),
      limitPerRelation: readOptionalParam(
        url.searchParams,
        "limitPerRelation",
        "6",
      ),
      maxDepth: readOptionalParam(url.searchParams, "maxDepth", "4"),
      resourceFilterKeys: parseCsvParam(url.searchParams.get("resources")),
      toIdentifier: readOptionalParam(url.searchParams, "toIdentifier"),
      toResource: readOptionalParam(url.searchParams, "toResource"),
    };

    return {
      ...parsedScenario,
      docsPath: buildPathWorkbenchDocsPath(parsedScenario),
    };
  });
}

function findWorkbenchScenarioById(scenarios, id) {
  return scenarios.find((scenario) => scenario.id === id) || null;
}

function findWorkbenchScenarioByResource(scenarios, resource) {
  return scenarios.find((scenario) => scenario.resource === resource) || null;
}

export {
  findWorkbenchScenarioById,
  findWorkbenchScenarioByResource,
  parseCompareWorkbenchScenarios,
  parseGraphWorkbenchScenarios,
  parsePathWorkbenchScenarios,
};
