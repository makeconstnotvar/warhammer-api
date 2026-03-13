import { buildQueryString, parseCsvParam, toCsvParam } from "./query";
import { findWorkbenchScenarioByResource } from "./workbenchScenarios";

function getPivotIdentifier(item) {
  return item?.slug || item?.id || "";
}

function buildDetailPivotLink(resource, item, include = "") {
  const identifier = getPivotIdentifier(item);

  if (!resource || !identifier) {
    return "";
  }

  return `/resources/${resource}${buildQueryString({
    identifier,
    include,
    mode: "detail",
  })}`;
}

function buildResourceListPivotLink(resource, filterKey, filterValue) {
  if (!resource || !filterKey || !filterValue) {
    return "";
  }

  return `/resources/${resource}${buildQueryString({
    filterKey,
    filterValue,
    mode: "list",
  })}`;
}

function buildGraphPivotLink(resource, item, graphScenarios = []) {
  const identifier = getPivotIdentifier(item);
  const scenario = findWorkbenchScenarioByResource(graphScenarios, resource);

  if (!resource || !identifier || !scenario) {
    return "";
  }

  return `/explore/graph${buildQueryString({
    backlinks: scenario.backlinks,
    depth: scenario.depth,
    identifier,
    limitPerRelation: scenario.limitPerRelation,
    resources: toCsvParam(scenario.resourceFilterKeys),
    resource,
  })}`;
}

function buildComparePivotLink(resource, item, compareScenarios = []) {
  const identifier = getPivotIdentifier(item);
  const scenario = findWorkbenchScenarioByResource(compareScenarios, resource);
  const partnerIdentifier = parseCsvParam(scenario?.ids).find((value) => value !== identifier);

  if (!resource || !identifier || !scenario || !partnerIdentifier) {
    return "";
  }

  const params = {
    ids: `${identifier},${partnerIdentifier}`,
    include: scenario.include,
    resource,
  };

  if (scenario.fields) {
    params[`fields[${resource}]`] = scenario.fields;
  }

  return `/compare${buildQueryString(params)}`;
}

function findPathScenarioByResource(pathScenarios = [], resource) {
  return (
    pathScenarios.find(
      (scenario) =>
        scenario.featured &&
        (scenario.fromResource === resource || scenario.toResource === resource)
    ) ||
    pathScenarios.find(
      (scenario) => scenario.fromResource === resource || scenario.toResource === resource
    ) ||
    null
  );
}

function buildPathPivotLink(resource, item, pathScenarios = []) {
  const identifier = getPivotIdentifier(item);
  const scenario = findPathScenarioByResource(pathScenarios, resource);

  if (!resource || !identifier || !scenario) {
    return "";
  }

  return `/explore/path${buildQueryString({
    backlinks: scenario.backlinks,
    fromIdentifier: scenario.fromResource === resource ? identifier : scenario.fromIdentifier,
    fromResource: scenario.fromResource,
    limitPerRelation: scenario.limitPerRelation,
    maxDepth: scenario.maxDepth,
    resources: toCsvParam(scenario.resourceFilterKeys),
    toIdentifier: scenario.toResource === resource ? identifier : scenario.toIdentifier,
    toResource: scenario.toResource,
  })}`;
}

function buildEntityWorkbenchActions({
  compareScenarios = [],
  graphScenarios = [],
  include = "",
  item,
  pathScenarios = [],
  resource,
}) {
  return [
    {
      href: buildDetailPivotLink(resource, item, include),
      label: "Detail",
    },
    {
      href: buildGraphPivotLink(resource, item, graphScenarios),
      label: "Graph",
    },
    {
      href: buildComparePivotLink(resource, item, compareScenarios),
      label: "Compare",
    },
    {
      href: buildPathPivotLink(resource, item, pathScenarios),
      label: "Path",
    },
  ].filter((action) => action.href);
}

function buildStatsRowWorkbenchActions({
  compareScenarios = [],
  graphScenarios = [],
  pathScenarios = [],
  row,
  section,
}) {
  const actions = [];
  const groupedResource = section.groupResource;

  if (section.listResource && section.filterKey) {
    actions.push({
      href: buildResourceListPivotLink(
        section.listResource,
        section.filterKey,
        section.filterValueResolver ? section.filterValueResolver(row) : row.slug || row.name
      ),
      label: `Browse ${section.metricLabel}`,
    });
  }

  if (!groupedResource) {
    return actions;
  }

  return [
    ...actions,
    ...buildEntityWorkbenchActions({
      compareScenarios,
      graphScenarios,
      item: row,
      pathScenarios,
      resource: groupedResource,
    }),
  ];
}

export {
  buildComparePivotLink,
  buildDetailPivotLink,
  buildEntityWorkbenchActions,
  buildGraphPivotLink,
  buildPathPivotLink,
  buildResourceListPivotLink,
  buildStatsRowWorkbenchActions,
  getPivotIdentifier,
};
