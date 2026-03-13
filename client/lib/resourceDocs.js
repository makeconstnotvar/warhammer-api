import { buildQueryString } from "./query";

function buildResourceDocsPath(resource, previewQuery) {
  if (!resource) {
    return "";
  }

  return `/resources/${resource}${buildQueryString({
    [`fields[${resource}]`]: previewQuery.fields,
    filterKey: previewQuery.mode === "list" ? previewQuery.filterKey : "",
    filterValue: previewQuery.mode === "list" ? previewQuery.filterValue : "",
    identifier: previewQuery.mode === "detail" ? previewQuery.identifier : "",
    include: previewQuery.include,
    limit: previewQuery.mode === "list" ? previewQuery.limit : "",
    mode: previewQuery.mode,
    page: previewQuery.mode === "list" ? previewQuery.page : "",
    search: previewQuery.mode === "list" ? previewQuery.search : "",
    sort: previewQuery.mode === "list" ? previewQuery.sort : "",
  })}`;
}

function buildResourceHeroActions({
  resource,
  listPreviewQuery,
  detailPreviewQuery,
  relatedScenario,
}) {
  const actions = [];
  const listHref = buildResourceDocsPath(resource, listPreviewQuery);

  if (listHref) {
    actions.push({
      className: "action-link",
      href: listHref,
      label: "Открыть list preview",
    });
  }

  const detailHref = detailPreviewQuery ? buildResourceDocsPath(resource, detailPreviewQuery) : "";

  if (detailHref) {
    actions.push({
      className: "action-link action-link-muted",
      href: detailHref,
      label: "Открыть detail sample",
    });
  }

  if (relatedScenario?.docsPath) {
    actions.push({
      className: "action-link action-link-muted",
      href: relatedScenario.docsPath,
      label: `${relatedScenario.groupLabel}: ${relatedScenario.label}`,
    });
  }

  return actions;
}

export { buildResourceDocsPath, buildResourceHeroActions };
