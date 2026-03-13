import { buildQueryString, parseCsvParam } from "./query";

const WORKBENCH_BASE_URL = "http://localhost";
const WORKBENCH_GROUP_LABELS = {
  compare: "Compare",
  graph: "Graph",
  path: "Path",
};
const WORKBENCH_GROUP_ORDER = {
  compare: 0,
  graph: 1,
  path: 2,
};
const WORKBENCH_DIFFICULTY_ORDER = {
  starter: 0,
  intermediate: 1,
  advanced: 2,
};
const DEFAULT_WORKBENCH_DIFFICULTY = "intermediate";

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
  return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))];
}

function sanitizeScenarioTags(values = []) {
  return sanitizeResourceKeys(values);
}

function normalizeWorkbenchDifficulty(value) {
  const normalizedValue = String(value || "").trim();

  return WORKBENCH_DIFFICULTY_ORDER[normalizedValue] === undefined
    ? DEFAULT_WORKBENCH_DIFFICULTY
    : normalizedValue;
}

function normalizeWorkbenchValues(values) {
  if (Array.isArray(values)) {
    return values.filter(Boolean);
  }

  return values ? [values] : [];
}

function enrichWorkbenchScenario(scenario, groupKey, scope, relatedResources = []) {
  return {
    ...scenario,
    difficulty: normalizeWorkbenchDifficulty(scenario.difficulty),
    featured: scenario.featured === true,
    groupKey,
    groupLabel: WORKBENCH_GROUP_LABELS[groupKey] || groupKey,
    relatedResources: sanitizeResourceKeys(relatedResources),
    scope,
    tags: sanitizeScenarioTags(scenario.tags),
  };
}

function formatWorkbenchDifficulty(difficulty) {
  switch (normalizeWorkbenchDifficulty(difficulty)) {
    case "starter":
      return "Starter";
    case "advanced":
      return "Advanced";
    default:
      return "Intermediate";
  }
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
    const scopedScenario = enrichWorkbenchScenario(parsedScenario, "compare", resource, [
      resource,
      ...parsedScenario.pathResources,
    ]);

    return {
      ...scopedScenario,
      docsPath: buildCompareWorkbenchDocsPath(scopedScenario),
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
      limitPerRelation: readOptionalParam(url.searchParams, "limitPerRelation", "4"),
      resource: readOptionalParam(url.searchParams, "resource"),
      resourceFilterKeys: parseCsvParam(url.searchParams.get("resources")),
    };
    const scopedScenario = enrichWorkbenchScenario(
      parsedScenario,
      "graph",
      parsedScenario.resource,
      [parsedScenario.resource, ...parsedScenario.resourceFilterKeys]
    );

    return {
      ...scopedScenario,
      docsPath: buildGraphWorkbenchDocsPath(scopedScenario),
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
      limitPerRelation: readOptionalParam(url.searchParams, "limitPerRelation", "6"),
      maxDepth: readOptionalParam(url.searchParams, "maxDepth", "4"),
      resourceFilterKeys: parseCsvParam(url.searchParams.get("resources")),
      toIdentifier: readOptionalParam(url.searchParams, "toIdentifier"),
      toResource: readOptionalParam(url.searchParams, "toResource"),
    };
    const scopedScenario = enrichWorkbenchScenario(
      parsedScenario,
      "path",
      `${parsedScenario.fromResource} -> ${parsedScenario.toResource}`,
      [parsedScenario.fromResource, parsedScenario.toResource, ...parsedScenario.resourceFilterKeys]
    );

    return {
      ...scopedScenario,
      docsPath: buildPathWorkbenchDocsPath(scopedScenario),
    };
  });
}

function sortWorkbenchScenarios(scenarios = []) {
  return [...scenarios].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    const difficultyDelta =
      (WORKBENCH_DIFFICULTY_ORDER[left.difficulty] ?? 99) -
      (WORKBENCH_DIFFICULTY_ORDER[right.difficulty] ?? 99);

    if (difficultyDelta !== 0) {
      return difficultyDelta;
    }

    const groupDelta =
      (WORKBENCH_GROUP_ORDER[left.groupKey] ?? 99) - (WORKBENCH_GROUP_ORDER[right.groupKey] ?? 99);

    if (groupDelta !== 0) {
      return groupDelta;
    }

    return left.label.localeCompare(right.label);
  });
}

function parseWorkbenchScenarios(document) {
  return sortWorkbenchScenarios([
    ...parseCompareWorkbenchScenarios(document),
    ...parseGraphWorkbenchScenarios(document),
    ...parsePathWorkbenchScenarios(document),
  ]);
}

function selectWorkbenchScenarios(scenarios, options = {}) {
  const {
    difficulty,
    featuredOnly = false,
    groupLimit = Number.POSITIVE_INFINITY,
    groups,
    limit = Number.POSITIVE_INFINITY,
    resources,
    tags,
  } = options;
  const allowedDifficulties = new Set(
    normalizeWorkbenchValues(difficulty).map((value) => normalizeWorkbenchDifficulty(value))
  );
  const allowedGroups = new Set(normalizeWorkbenchValues(groups));
  const allowedResources = new Set(sanitizeResourceKeys(normalizeWorkbenchValues(resources)));
  const allowedTags = new Set(sanitizeScenarioTags(normalizeWorkbenchValues(tags)));
  const selectedByGroup = {};

  return sortWorkbenchScenarios(scenarios).filter((scenario) => {
    if (featuredOnly && !scenario.featured) {
      return false;
    }

    if (allowedDifficulties.size && !allowedDifficulties.has(scenario.difficulty)) {
      return false;
    }

    if (allowedGroups.size && !allowedGroups.has(scenario.groupKey)) {
      return false;
    }

    if (
      allowedResources.size &&
      !scenario.relatedResources.some((resource) => allowedResources.has(resource))
    ) {
      return false;
    }

    if (allowedTags.size && !scenario.tags.some((tag) => allowedTags.has(tag))) {
      return false;
    }

    if ((selectedByGroup[scenario.groupKey] || 0) >= groupLimit) {
      return false;
    }

    if (Object.values(selectedByGroup).reduce((sum, count) => sum + count, 0) >= limit) {
      return false;
    }

    selectedByGroup[scenario.groupKey] = (selectedByGroup[scenario.groupKey] || 0) + 1;

    return true;
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
  formatWorkbenchDifficulty,
  parseCompareWorkbenchScenarios,
  parseGraphWorkbenchScenarios,
  parseWorkbenchScenarios,
  parsePathWorkbenchScenarios,
  selectWorkbenchScenarios,
};
