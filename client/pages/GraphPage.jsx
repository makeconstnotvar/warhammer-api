import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { docsApi } from "../api/docsApi";
import { ApiErrorNotice } from "../components/ApiErrorNotice";
import { ApiOperationGuide } from "../components/ApiOperationGuide";
import { JsonViewer } from "../components/JsonViewer";
import { StateNotice } from "../components/StateNotice";
import {
  extractError,
  extractErrorDetails,
  useAsyncData,
} from "../hooks/useAsyncData";
import {
  buildOpenApiIntegerOptions,
  getOpenApiParameterHint,
  getOpenApiParameterMap,
} from "../lib/openApi";
import {
  buildQueryString,
  parseCsvParam,
  readQueryState,
  replaceQueryState,
  toCsvParam,
} from "../lib/query";
import {
  findWorkbenchScenarioByResource,
  parseCompareWorkbenchScenarios,
  parseGraphWorkbenchScenarios,
} from "../lib/workbenchScenarios";

const graphResourceColors = {
  battlefields: "#cf7f55",
  campaigns: "#6fbf86",
  characters: "#d1a35a",
  eras: "#8f7ed2",
  events: "#d46f6f",
  factions: "#c95a5a",
  fleets: "#87a8d8",
  keywords: "#6d88d9",
  organizations: "#6caed6",
  planets: "#87b38a",
  races: "#af8cdd",
  relics: "#d69255",
  "star-systems": "#5aa7a0",
  units: "#b2b45e",
  "warp-routes": "#4e8fbe",
  weapons: "#78a7c5",
};

function buildGraphParams({
  backlinks,
  depth,
  identifier,
  limitPerRelation,
  resource,
  resourceFilterKeys,
}) {
  return {
    backlinks,
    depth,
    identifier,
    limitPerRelation,
    resources: toCsvParam(resourceFilterKeys),
    resource,
  };
}

function createGraphFallbackScenario(resource, label = resource) {
  return {
    backlinks: "true",
    depth: "2",
    description:
      "Укажи slug или id вручную и собери graph для любого поддерживаемого ресурса.",
    identifier: "",
    label: label || resource || "Ресурс",
    limitPerRelation: "4",
    resource,
    resourceFilterKeys: [],
  };
}

function normalizeSelectedKeys(rawValue) {
  return String(rawValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function truncateLabel(value, maxLength = 18) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function formatMetric(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function areKeyArraysEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function getNodeIdentifier(node) {
  return node.slug || node.id;
}

function buildExploreLink(node, options = {}) {
  return `/explore/graph${buildQueryString({
    backlinks: options.backlinks,
    depth: options.depth,
    identifier: getNodeIdentifier(node),
    limitPerRelation: options.limitPerRelation,
    resources: toCsvParam(options.resourceFilterKeys),
    resource: node.resource,
  })}`;
}

function buildDetailLink(node) {
  return `/resources/${node.resource}${buildQueryString({
    identifier: getNodeIdentifier(node),
    include: "",
    mode: "detail",
  })}`;
}

function buildCompareLink(nodes, compareScenarios) {
  if (nodes.length !== 2) {
    return "";
  }

  const [left, right] = nodes;
  const compareScenario = findWorkbenchScenarioByResource(
    compareScenarios,
    left.resource,
  );

  if (left.resource !== right.resource || !compareScenario?.include) {
    return "";
  }

  return `/compare${buildQueryString({
    ids: `${getNodeIdentifier(left)},${getNodeIdentifier(right)}`,
    include: compareScenario.include,
    resource: left.resource,
  })}`;
}

function toggleResourceFilterKey(currentKeys, resourceKey) {
  if (currentKeys.includes(resourceKey)) {
    return currentKeys.filter((item) => item !== resourceKey);
  }

  return [...currentKeys, resourceKey];
}

function buildGraphLayout(nodes = []) {
  const width = 980;
  const height = 640;
  const centerX = width / 2;
  const centerY = height / 2;
  const groupedByDistance = nodes.reduce((result, node) => {
    const distanceKey = String(node.distance || 0);
    result[distanceKey] = result[distanceKey] || [];
    result[distanceKey].push(node);
    return result;
  }, {});

  const positions = {};
  positions[nodes.find((node) => node.distance === 0)?.key || "root"] = {
    x: centerX,
    y: centerY,
  };

  Object.entries(groupedByDistance).forEach(([distanceKey, layerNodes]) => {
    const distance = Number(distanceKey);

    if (distance === 0) {
      layerNodes.forEach((node) => {
        positions[node.key] = { x: centerX, y: centerY };
      });
      return;
    }

    const radius = 110 + (distance - 1) * 120;
    const step = (Math.PI * 2) / Math.max(layerNodes.length, 1);
    const offset = distance % 2 === 0 ? Math.PI / 6 : -Math.PI / 8;

    layerNodes.forEach((node, index) => {
      const angle = offset + index * step;
      positions[node.key] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.72,
      };
    });
  });

  return { height, positions, width };
}

function GraphStage({
  edges,
  focusedNodeKey,
  nodes,
  onNodeSelect,
  root,
  selectedNodeKeys,
}) {
  const layout = useMemo(() => buildGraphLayout(nodes), [nodes]);
  const rings = useMemo(
    () => [
      ...new Set(
        nodes.map((node) => node.distance).filter((distance) => distance > 0),
      ),
    ],
    [nodes],
  );
  const selectedNodeSet = useMemo(
    () => new Set(selectedNodeKeys),
    [selectedNodeKeys],
  );

  return (
    <section className="section-card graph-stage-card">
      <div className="stats-section-head">
        <div>
          <h2>Graph view</h2>
          <p className="muted-line">
            Клик по узлу переводит фокус, подсвечивает связи и добавляет запись
            в рабочую область.
          </p>
        </div>
        <div className="tag-list">
          {root && <span className="metric-chip">root: {root.name}</span>}
          <span className="metric-chip">{nodes.length} nodes</span>
          <span className="metric-chip">{edges.length} edges</span>
        </div>
      </div>

      <svg
        className="graph-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Graph explorer"
      >
        {rings.map((distance) => (
          <ellipse
            key={distance}
            className="graph-ring"
            cx={layout.width / 2}
            cy={layout.height / 2}
            rx={110 + (distance - 1) * 120}
            ry={(110 + (distance - 1) * 120) * 0.72}
          />
        ))}

        {edges.map((edge) => {
          const from = layout.positions[edge.from];
          const to = layout.positions[edge.to];
          const isFocused =
            edge.from === focusedNodeKey || edge.to === focusedNodeKey;

          if (!from || !to) {
            return null;
          }

          return (
            <g key={edge.id}>
              <line
                className={`graph-edge${isFocused ? " graph-edge-active" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            </g>
          );
        })}

        {nodes.map((node) => {
          const position = layout.positions[node.key];
          const color = graphResourceColors[node.resource] || "#d1a35a";
          const isFocused = node.key === focusedNodeKey;
          const isSelected = selectedNodeSet.has(node.key);

          if (!position) {
            return null;
          }

          return (
            <g
              key={node.key}
              className="graph-node-group"
              transform={`translate(${position.x}, ${position.y})`}
              onClick={() => onNodeSelect(node.key)}
            >
              <circle
                className={`graph-node-halo${isFocused ? " graph-node-halo-focused" : ""}${isSelected ? " graph-node-halo-selected" : ""}`}
                r={node.distance === 0 ? 44 : 32}
              />
              <circle
                className={`graph-node graph-node-${node.distance === 0 ? "root" : "leaf"}${isFocused ? " graph-node-focused" : ""}${isSelected ? " graph-node-selected" : ""}`}
                r={node.distance === 0 ? 36 : 24}
                style={{ fill: color }}
              />
              <text
                className="graph-node-label"
                x="0"
                y={node.distance === 0 ? 56 : 44}
                textAnchor="middle"
              >
                {truncateLabel(node.name, 20)}
              </text>
              <text
                className="graph-node-resource"
                x="0"
                y={node.distance === 0 ? 72 : 58}
                textAnchor="middle"
              >
                {node.resource}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function GraphNodeCard({
  active,
  backlinks,
  depth,
  limitPerRelation,
  node,
  onFocus,
  onToggleSelect,
  resourceFilterKeys,
  selected,
}) {
  const metric = formatMetric(
    node.powerLevel ?? node.influenceLevel ?? node.yearLabel,
  );
  const detailLink = buildDetailLink(node);
  const exploreLink = buildExploreLink(node, {
    backlinks,
    depth,
    limitPerRelation,
    resourceFilterKeys,
  });

  return (
    <article
      className={`graph-node-card${active ? " graph-node-card-active" : ""}`}
    >
      <div className="resource-card-top">
        <div>
          <div className="resource-kicker">{node.resource}</div>
          <h3>{node.name}</h3>
        </div>
        <div className="tag-list">
          <span className="metric-chip">depth {node.distance}</span>
          {metric && <span className="metric-chip">{metric}</span>}
        </div>
      </div>
      {node.summary && <p>{node.summary}</p>}
      <div className="tag-list">
        {node.slug && <span className="tag">{node.slug}</span>}
        {node.status && <span className="tag">{node.status}</span>}
        {node.type && <span className="tag">{node.type}</span>}
      </div>
      <div className="graph-card-actions">
        <button
          type="button"
          className="action-button"
          onClick={() => onFocus(node.key)}
        >
          Фокус
        </button>
        <button
          type="button"
          className="action-button action-link-muted"
          onClick={() => onToggleSelect(node.key)}
        >
          {selected ? "Убрать из selection" : "Добавить в selection"}
        </button>
        <a className="query-link" href={detailLink}>
          Открыть detail preview
        </a>
        <a className="query-link" href={exploreLink}>
          Сделать root
        </a>
      </div>
    </article>
  );
}

function NodeGroups({
  activeNodeKey,
  backlinks,
  depth,
  limitPerRelation,
  nodes,
  onFocus,
  onToggleSelect,
  resourceFilterKeys,
  selectedNodeKeys,
}) {
  const selectedNodeSet = useMemo(
    () => new Set(selectedNodeKeys),
    [selectedNodeKeys],
  );
  const grouped = useMemo(() => {
    return nodes.reduce((result, node) => {
      result[node.resource] = result[node.resource] || [];
      result[node.resource].push(node);
      return result;
    }, {});
  }, [nodes]);

  return (
    <section className="section-card">
      <h2>Nodes by resource</h2>
      <div className="graph-group-grid">
        {Object.entries(grouped).map(([resource, resourceNodes]) => (
          <div key={resource} className="graph-group-card">
            <div className="stats-section-head">
              <div>
                <div className="resource-kicker">{resource}</div>
                <h3>{resourceNodes.length} узлов</h3>
              </div>
              <span className="metric-chip">{resource}</span>
            </div>
            <div className="graph-node-list">
              {resourceNodes.map((node) => (
                <GraphNodeCard
                  key={node.key}
                  active={node.key === activeNodeKey}
                  backlinks={backlinks}
                  depth={depth}
                  limitPerRelation={limitPerRelation}
                  node={node}
                  onFocus={onFocus}
                  onToggleSelect={onToggleSelect}
                  resourceFilterKeys={resourceFilterKeys}
                  selected={selectedNodeSet.has(node.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EdgeLedger({ edges, nodeByKey }) {
  return (
    <section className="section-card">
      <h2>Edge ledger</h2>
      <div className="mini-table">
        <div className="mini-table-head">
          <span>From</span>
          <span>Relation</span>
          <span>To</span>
        </div>
        {edges.map((edge) => (
          <div key={edge.id} className="mini-table-row">
            <span>{nodeByKey[edge.from]?.name || edge.from}</span>
            <span>{edge.label || edge.relation}</span>
            <span>{nodeByKey[edge.to]?.name || edge.to}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TruncationSummary({ items }) {
  if (!items.length) {
    return <span className="muted-line">Обрезанных relation-веток нет.</span>;
  }

  return (
    <div className="graph-truncation-list">
      {items.map((item) => (
        <article
          key={`${item.from}-${item.relation}-${item.sourceResource || item.targetResource || "target"}`}
          className="sample-query-card"
        >
          <div className="resource-kicker">{item.relation}</div>
          <strong>{item.hiddenCount} скрытых связей</strong>
          <p className="muted-line">
            from: {item.from}
            {item.targetResource ? `, target: ${item.targetResource}` : ""}
            {item.sourceResource ? `, source: ${item.sourceResource}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function Workbench({
  backlinks,
  compareLink,
  depth,
  focusedEdges,
  focusNode,
  limitPerRelation,
  onClearSelection,
  onRemoveSelection,
  resourceFilterKeys,
  selectedNodes,
}) {
  return (
    <section className="section-card">
      <div className="stats-section-head">
        <div>
          <h2>Workbench</h2>
          <p className="muted-line">
            Здесь живут текущий фокус, selection и быстрый мост в `Compare`.
          </p>
        </div>
        <div className="graph-selection-bar">
          {selectedNodes.map((node) => (
            <button
              key={node.key}
              type="button"
              className="control-chip control-chip-active"
              onClick={() => onRemoveSelection(node.key)}
            >
              {node.name}
            </button>
          ))}
          {!!selectedNodes.length && (
            <button
              type="button"
              className="control-chip"
              onClick={onClearSelection}
            >
              Очистить selection
            </button>
          )}
        </div>
      </div>

      {focusNode ? (
        <div className="graph-workbench-grid">
          <article className="graph-focus-card">
            <div className="resource-kicker">Focused node</div>
            <h3>{focusNode.name}</h3>
            {focusNode.summary && <p>{focusNode.summary}</p>}
            <div className="tag-list">
              <span className="metric-chip">{focusNode.resource}</span>
              <span className="metric-chip">depth {focusNode.distance}</span>
              {focusNode.status && (
                <span className="tag">{focusNode.status}</span>
              )}
              {focusNode.type && <span className="tag">{focusNode.type}</span>}
            </div>
            <div className="graph-card-actions">
              <a className="query-link" href={buildDetailLink(focusNode)}>
                Открыть detail preview
              </a>
              <a
                className="query-link"
                href={buildExploreLink(focusNode, {
                  backlinks,
                  depth,
                  limitPerRelation,
                  resourceFilterKeys,
                })}
              >
                Перестроить graph от этого узла
              </a>
            </div>
          </article>

          <article className="graph-focus-card">
            <div className="resource-kicker">Focused edges</div>
            {focusedEdges.length ? (
              <div className="graph-focused-edge-list">
                {focusedEdges.map((edge) => (
                  <div key={edge.id} className="graph-focused-edge-item">
                    <strong>{edge.label || edge.relation}</strong>
                    <span className="muted-line">{edge.direction}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-line">
                У текущего узла нет видимых ребер на этом depth.
              </p>
            )}
          </article>
        </div>
      ) : (
        <p className="muted-line">
          Сначала построй graph и выбери хотя бы один узел.
        </p>
      )}

      <div className="graph-selection-status">
        {compareLink ? (
          <a className="action-link" href={compareLink}>
            Открыть Compare для selection
          </a>
        ) : (
          <p className="muted-line">
            Для compare нужны две выбранные записи одного compare-capable
            ресурса.
          </p>
        )}
      </div>
    </section>
  );
}

function GraphPage() {
  const initialQuery = useMemo(() => {
    const queryState = readQueryState({
      backlinks: "true",
      depth: "",
      focus: "",
      identifier: "",
      limitPerRelation: "",
      resource: "",
      resources: "",
      selected: "",
    });

    return {
      backlinks: queryState.backlinks,
      depth: queryState.depth,
      focus: queryState.focus,
      hasQuery:
        (typeof window !== "undefined" &&
          new URLSearchParams(window.location.search || "").toString().length >
            0) ||
        false,
      identifier: queryState.identifier,
      limitPerRelation: queryState.limitPerRelation,
      resource: queryState.resource,
      resourceFilterKeys: parseCsvParam(queryState.resources),
      selected: normalizeSelectedKeys(queryState.selected),
    };
  }, []);
  const initialRunRef = useRef(false);
  const catalogState = useAsyncData(() => docsApi.getCatalog(), []);
  const specState = useAsyncData(() => docsApi.getOpenApiSpec(), []);
  const workbenchState = useAsyncData(
    () => docsApi.getWorkbenchScenarios(),
    [],
  );
  const graphScenarios = useMemo(
    () => parseGraphWorkbenchScenarios(workbenchState.data),
    [workbenchState.data],
  );
  const compareScenarios = useMemo(
    () => parseCompareWorkbenchScenarios(workbenchState.data),
    [workbenchState.data],
  );
  const resources = catalogState.data?.data || [];
  const [resource, setResource] = useState(initialQuery.resource);
  const [identifier, setIdentifier] = useState(initialQuery.identifier);
  const [depth, setDepth] = useState(initialQuery.depth || "2");
  const [limitPerRelation, setLimitPerRelation] = useState(
    initialQuery.limitPerRelation || "4",
  );
  const [backlinks, setBacklinks] = useState(initialQuery.backlinks);
  const [resourceFilterKeys, setResourceFilterKeys] = useState(
    initialQuery.resourceFilterKeys,
  );
  const [selectedNodeKeys, setSelectedNodeKeys] = useState(
    initialQuery.selected,
  );
  const [focusedNodeKey, setFocusedNodeKey] = useState(initialQuery.focus);
  const [requestPath, setRequestPath] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitErrorDetails, setSubmitErrorDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const activePreset =
    findWorkbenchScenarioByResource(graphScenarios, resource) ||
    createGraphFallbackScenario(resource);
  const graphParameterMap = useMemo(
    () => getOpenApiParameterMap(specState.data, "/api/v1/explore/graph"),
    [specState.data],
  );
  const depthOptions = useMemo(
    () => buildOpenApiIntegerOptions(graphParameterMap.depth, [1, 2, 3]),
    [graphParameterMap.depth],
  );
  const limitPerRelationOptions = useMemo(
    () =>
      buildOpenApiIntegerOptions(
        graphParameterMap.limitPerRelation,
        [2, 4, 6, 8],
      ),
    [graphParameterMap.limitPerRelation],
  );
  const nodes = responseData?.data?.nodes || [];
  const edges = responseData?.data?.edges || [];
  const meta = responseData?.meta;
  const rootNode = responseData?.data?.root || null;
  const nodeByKey = useMemo(
    () =>
      nodes.reduce((result, node) => {
        result[node.key] = node;
        return result;
      }, {}),
    [nodes],
  );
  const selectedNodes = useMemo(
    () => selectedNodeKeys.map((nodeKey) => nodeByKey[nodeKey]).filter(Boolean),
    [nodeByKey, selectedNodeKeys],
  );
  const focusNode =
    nodeByKey[focusedNodeKey] ||
    selectedNodes[selectedNodes.length - 1] ||
    rootNode;
  const focusedEdges = useMemo(
    () =>
      edges.filter(
        (edge) => edge.from === focusNode?.key || edge.to === focusNode?.key,
      ),
    [edges, focusNode],
  );
  const compareLink = useMemo(
    () => buildCompareLink(selectedNodes, compareScenarios),
    [compareScenarios, selectedNodes],
  );
  const requestPreviewPath = useMemo(
    () =>
      `/api/v1/explore/graph${buildQueryString(
        buildGraphParams({
          backlinks,
          depth,
          identifier,
          limitPerRelation,
          resource,
          resourceFilterKeys,
        }),
      )}`,
    [
      backlinks,
      depth,
      identifier,
      limitPerRelation,
      resource,
      resourceFilterKeys,
    ],
  );

  async function runGraph(nextState = {}) {
    const nextResource = nextState.resource ?? resource;
    const nextIdentifier = nextState.identifier ?? identifier;
    const nextDepth = nextState.depth ?? depth;
    const nextLimitPerRelation = nextState.limitPerRelation ?? limitPerRelation;
    const nextBacklinks = nextState.backlinks ?? backlinks;
    const nextResourceFilterKeys =
      nextState.resourceFilterKeys ?? resourceFilterKeys;
    const params = buildGraphParams({
      backlinks: nextBacklinks,
      depth: nextDepth,
      identifier: nextIdentifier,
      limitPerRelation: nextLimitPerRelation,
      resource: nextResource,
      resourceFilterKeys: nextResourceFilterKeys,
    });

    if (nextState.resetSelection) {
      setSelectedNodeKeys([]);
      setFocusedNodeKey("");
    }

    setLoading(true);
    setSubmitError("");
    setSubmitErrorDetails([]);

    try {
      const result = await docsApi.getGraph(params);
      setRequestPath(`/api/v1/explore/graph${buildQueryString(params)}`);
      setResponseData(result);
    } catch (error) {
      setSubmitError(extractError(error));
      setSubmitErrorDetails(extractErrorDetails(error));
      setResponseData(null);
      setRequestPath(`/api/v1/explore/graph${buildQueryString(params)}`);
    } finally {
      replaceQueryState({
        ...params,
        focus: focusedNodeKey,
        selected: selectedNodeKeys.join(","),
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRunRef.current) {
      return;
    }

    const hasInitialRequest = Boolean(
      initialQuery.resource && initialQuery.identifier,
    );

    if (!hasInitialRequest && !graphScenarios.length) {
      if (workbenchState.loading || workbenchState.error) {
        return;
      }
    }

    const defaultScenario =
      findWorkbenchScenarioByResource(graphScenarios, "characters") ||
      graphScenarios[0] ||
      null;
    const nextResource =
      initialQuery.resource || defaultScenario?.resource || "";
    const resourceScenario =
      findWorkbenchScenarioByResource(graphScenarios, nextResource) ||
      createGraphFallbackScenario(nextResource);
    const nextIdentifier =
      initialQuery.identifier || resourceScenario.identifier;
    const nextDepth = initialQuery.depth || resourceScenario.depth;
    const nextLimitPerRelation =
      initialQuery.limitPerRelation || resourceScenario.limitPerRelation;
    const nextBacklinks = initialQuery.backlinks || resourceScenario.backlinks;
    const nextResourceFilterKeys = initialQuery.resourceFilterKeys.length
      ? initialQuery.resourceFilterKeys
      : resourceScenario.resourceFilterKeys || [];

    if (!nextResource || !nextIdentifier) {
      return;
    }

    initialRunRef.current = true;
    setResource(nextResource);
    setIdentifier(nextIdentifier);
    setDepth(nextDepth);
    setLimitPerRelation(nextLimitPerRelation);
    setBacklinks(nextBacklinks);
    setResourceFilterKeys(nextResourceFilterKeys);
    runGraph({
      backlinks: nextBacklinks,
      depth: nextDepth,
      identifier: nextIdentifier,
      limitPerRelation: nextLimitPerRelation,
      resource: nextResource,
      resourceFilterKeys: nextResourceFilterKeys,
      selected: initialQuery.selected,
    });
  }, [
    graphScenarios,
    initialQuery,
    workbenchState.error,
    workbenchState.loading,
  ]);

  useEffect(() => {
    if (!nodes.length) {
      return;
    }

    const availableNodeKeys = new Set(nodes.map((node) => node.key));
    const filteredSelected = selectedNodeKeys.filter((nodeKey) =>
      availableNodeKeys.has(nodeKey),
    );
    const nextSelected = filteredSelected.length
      ? filteredSelected
      : rootNode
        ? [rootNode.key]
        : [];
    const nextFocus = availableNodeKeys.has(focusedNodeKey)
      ? focusedNodeKey
      : nextSelected[nextSelected.length - 1] || rootNode?.key || "";

    if (!areKeyArraysEqual(nextSelected, selectedNodeKeys)) {
      setSelectedNodeKeys(nextSelected);
    }

    if (nextFocus !== focusedNodeKey) {
      setFocusedNodeKey(nextFocus);
    }
  }, [focusedNodeKey, nodes, rootNode, selectedNodeKeys]);

  useEffect(() => {
    if (!requestPath) {
      return;
    }

    replaceQueryState({
      backlinks,
      depth,
      focus: focusedNodeKey,
      identifier,
      limitPerRelation,
      resources: toCsvParam(resourceFilterKeys),
      resource,
      selected: selectedNodeKeys.join(","),
    });
  }, [
    backlinks,
    depth,
    focusedNodeKey,
    identifier,
    limitPerRelation,
    requestPath,
    resource,
    resourceFilterKeys,
    selectedNodeKeys,
  ]);

  function applyPreset(preset) {
    setResource(preset.resource);
    setIdentifier(preset.identifier);
    setDepth(preset.depth);
    setLimitPerRelation(preset.limitPerRelation);
    setBacklinks(preset.backlinks);
    setResourceFilterKeys(preset.resourceFilterKeys || []);
    runGraph({
      backlinks: preset.backlinks,
      depth: preset.depth,
      identifier: preset.identifier,
      limitPerRelation: preset.limitPerRelation,
      resetSelection: true,
      resource: preset.resource,
      resourceFilterKeys: preset.resourceFilterKeys || [],
    });
  }

  function handleResourceChange(event) {
    const nextResource = event.target.value;
    const resourceLabel =
      resources.find((item) => item.id === nextResource)?.label || nextResource;
    const preset =
      findWorkbenchScenarioByResource(graphScenarios, nextResource) ||
      createGraphFallbackScenario(nextResource, resourceLabel);
    setResource(nextResource);
    setIdentifier(preset.identifier);
    setDepth(preset.depth);
    setLimitPerRelation(preset.limitPerRelation);
    setBacklinks(preset.backlinks);
    setResourceFilterKeys(preset.resourceFilterKeys || []);
  }

  function handleSubmit(event) {
    event.preventDefault();
    runGraph({ resetSelection: true });
  }

  function toggleGraphResourceFilter(resourceKey) {
    setResourceFilterKeys((current) =>
      toggleResourceFilterKey(current, resourceKey),
    );
  }

  function focusNodeByKey(nodeKey) {
    setFocusedNodeKey(nodeKey);
    setSelectedNodeKeys((current) => {
      if (current.includes(nodeKey)) {
        return current;
      }

      if (current.length >= 2) {
        return [current[current.length - 1], nodeKey];
      }

      return [...current, nodeKey];
    });
  }

  function toggleNodeSelection(nodeKey) {
    setSelectedNodeKeys((current) => {
      if (current.includes(nodeKey)) {
        const nextSelection = current.filter((item) => item !== nodeKey);

        if (focusedNodeKey === nodeKey) {
          setFocusedNodeKey(
            nextSelection[nextSelection.length - 1] || rootNode?.key || "",
          );
        }

        return nextSelection;
      }

      if (current.length >= 2) {
        return [current[current.length - 1], nodeKey];
      }

      return [...current, nodeKey];
    });
    setFocusedNodeKey(nodeKey);
  }

  function clearSelection() {
    const fallbackKey = rootNode?.key || "";
    setSelectedNodeKeys(fallbackKey ? [fallbackKey] : []);
    setFocusedNodeKey(fallbackKey);
  }

  function removeSelection(nodeKey) {
    setSelectedNodeKeys((current) => {
      const nextSelection = current.filter((item) => item !== nodeKey);

      if (focusedNodeKey === nodeKey) {
        setFocusedNodeKey(
          nextSelection[nextSelection.length - 1] || rootNode?.key || "",
        );
      }

      return nextSelection;
    });
  }

  if (catalogState.loading) {
    return <StateNotice>Загрузка graph explorer...</StateNotice>;
  }

  if (catalogState.error) {
    return <StateNotice type="error">{catalogState.error}</StateNotice>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel-compact">
        <div>
          <div className="section-eyebrow">Graph</div>
          <h1>Explorer связей поверх одного endpoint-а</h1>
          <p className="page-lead">
            `explore/graph` возвращает уже готовые `nodes` и `edges`. Теперь
            этот экран еще и умеет выделять узлы, фокусировать связи и
            перекидывать selection в `Compare`.
          </p>
        </div>
        <div className="hero-side">
          <div className="metric-chip">nodes + edges</div>
          <div className="metric-chip">root backlinks</div>
          <div className="metric-chip">compare bridge</div>
          <div className="metric-chip">
            {graphScenarios.length || 9} preset scenarios
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>Preset scenarios</h2>
            <p className="muted-line">
              Быстрые точки входа для detail graph, campaign explorer и
              institutional map.
            </p>
          </div>
        </div>
        <div className="control-chip-bar">
          {graphScenarios.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`control-chip${preset.resource === resource ? " control-chip-active" : ""}`}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="muted-line">{activePreset.description}</p>
      </section>

      <form className="section-card graph-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Ресурс</span>
            <select value={resource} onChange={handleResourceChange}>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Identifier</span>
            <input
              value={identifier}
              onInput={(event) => setIdentifier(event.target.value)}
              placeholder={
                activePreset.identifier ||
                getOpenApiParameterHint(graphParameterMap.identifier)
              }
            />
          </label>

          <label>
            <span>Depth</span>
            <select
              value={depth}
              onChange={(event) => setDepth(event.target.value)}
            >
              {depthOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Limit per relation</span>
            <select
              value={limitPerRelation}
              onChange={(event) => setLimitPerRelation(event.target.value)}
            >
              {limitPerRelationOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Backlinks</span>
            <select
              value={backlinks}
              onChange={(event) => setBacklinks(event.target.value)}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>

        <div className="explore-filter-block">
          <div className="stats-section-head">
            <div>
              <h2>Resource filter</h2>
              <p className="muted-line">
                Ограничивает соседние типы ресурсов. Root-узел всегда
                сохраняется, даже если его нет в whitelist.
              </p>
            </div>
            <div className="tag-list">
              <span className="metric-chip">
                {resourceFilterKeys.length || resources.length} resource types
              </span>
              <span className="metric-chip">
                {resourceFilterKeys.length ? "filtered" : "all visible"}
              </span>
            </div>
          </div>
          <div className="control-chip-bar">
            <button
              type="button"
              className={`control-chip${!resourceFilterKeys.length ? " control-chip-active" : ""}`}
              onClick={() => setResourceFilterKeys([])}
            >
              Все ресурсы
            </button>
            {resources.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`control-chip${resourceFilterKeys.includes(item.id) ? " control-chip-active" : ""}`}
                onClick={() => toggleGraphResourceFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="resource-preview-foot">
          <p className="muted-line">
            Подходит для graph explorer, connected detail screen и
            relation-aware dashboard. Для sharable ссылок фильтр уходит в
            `resources=...`.
          </p>
          <button type="submit" className="action-button" disabled={loading}>
            {loading ? "Сборка graph..." : "Построить graph"}
          </button>
        </div>
      </form>

      {specState.error && (
        <StateNotice type="error">{specState.error}</StateNotice>
      )}
      {workbenchState.error && (
        <StateNotice type="error">{workbenchState.error}</StateNotice>
      )}
      {specState.data && (
        <ApiOperationGuide
          description="Graph explorer читает traversal contract из OpenAPI и показывает live snippets для текущей конфигурации traversal."
          parameterOrder={[
            "resource",
            "identifier",
            "depth",
            "limitPerRelation",
            "backlinks",
            "resources",
          ]}
          path="/api/v1/explore/graph"
          requestPath={requestPreviewPath}
          spec={specState.data}
        />
      )}
      <ApiErrorNotice details={submitErrorDetails} message={submitError} />
      {requestPath && <StateNotice>{requestPath}</StateNotice>}

      {responseData && (
        <>
          <section className="stats-hero-grid">
            <article className="stat-card">
              <div className="resource-kicker">Nodes</div>
              <div className="stat-value">{meta.nodeCount}</div>
              <p className="muted-line">
                Количество узлов в возвращенной сети.
              </p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Edges</div>
              <div className="stat-value">{meta.edgeCount}</div>
              <p className="muted-line">
                Количество прямых связей между узлами.
              </p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Resource Types</div>
              <div className="stat-value">{meta.resourceTypes.length}</div>
              <p className="muted-line">{meta.resourceTypes.join(", ")}</p>
            </article>
            <article className="stat-card">
              <div className="resource-kicker">Selection</div>
              <div className="stat-value">{selectedNodes.length}</div>
              <p className="muted-line">
                До двух узлов для compare bridge и ручного фокуса.
              </p>
            </article>
          </section>

          <Workbench
            backlinks={backlinks}
            compareLink={compareLink}
            depth={depth}
            focusedEdges={focusedEdges}
            focusNode={focusNode}
            limitPerRelation={limitPerRelation}
            onClearSelection={clearSelection}
            onRemoveSelection={removeSelection}
            resourceFilterKeys={resourceFilterKeys}
            selectedNodes={selectedNodes}
          />

          <GraphStage
            edges={edges}
            focusedNodeKey={focusNode?.key || ""}
            nodes={nodes}
            onNodeSelect={focusNodeByKey}
            root={rootNode}
            selectedNodeKeys={selectedNodeKeys}
          />

          <section className="section-card">
            <h2>Truncated relations</h2>
            <TruncationSummary items={meta.truncatedRelations} />
          </section>

          <NodeGroups
            activeNodeKey={focusNode?.key || ""}
            backlinks={backlinks}
            depth={depth}
            limitPerRelation={limitPerRelation}
            nodes={nodes}
            onFocus={focusNodeByKey}
            onToggleSelect={toggleNodeSelection}
            resourceFilterKeys={resourceFilterKeys}
            selectedNodeKeys={selectedNodeKeys}
          />
          <EdgeLedger edges={edges} nodeByKey={nodeByKey} />
          <JsonViewer label="Ответ graph endpoint-а" data={responseData} />
        </>
      )}
    </div>
  );
}

export { GraphPage };
