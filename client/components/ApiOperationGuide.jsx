import { CodeBlock } from "./CodeBlock";
import { StateNotice } from "./StateNotice";
import {
  formatOpenApiValue,
  getOpenApiConstraintChips,
  getOpenApiOperation,
  getOpenApiParameters,
} from "../lib/openApi";

function buildAbsoluteUrl(requestPath) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:3000";

  return `${origin}${requestPath}`;
}

function buildRequestSnippets(requestPath) {
  if (!requestPath) {
    return null;
  }

  const absoluteUrl = buildAbsoluteUrl(requestPath);

  return {
    axios: `const response = await axios.get("${requestPath}");\nconst payload = response.data;`,
    curl: `curl -i "${absoluteUrl}"`,
    fetch: `const response = await fetch("${requestPath}");\nconst payload = await response.json();\n\nif (!response.ok) {\n  console.error(payload.error);\n}`,
  };
}

function orderParameters(parameters, parameterOrder = []) {
  if (!parameterOrder.length) {
    return parameters;
  }

  const orderedNames = new Set(parameterOrder);
  const parameterMap = new Map(
    parameters.map((parameter) => [parameter.name, parameter]),
  );

  return [
    ...parameterOrder.map((name) => parameterMap.get(name)).filter(Boolean),
    ...parameters.filter((parameter) => !orderedNames.has(parameter.name)),
  ];
}

function OperationParameterCard({ parameter }) {
  const chips = getOpenApiConstraintChips(parameter);

  return (
    <article className="sample-query-card operation-guide-card">
      <div className="stats-section-head">
        <div>
          <div className="resource-kicker">{parameter.in}</div>
          <h3>{parameter.name}</h3>
        </div>
        <div className="tag-list">
          {chips.map((chip) => (
            <span key={`${parameter.name}-${chip}`} className="tag">
              {chip}
            </span>
          ))}
        </div>
      </div>
      <p>{parameter.description}</p>
      {parameter.example !== undefined ? (
        <div className="tag-list">
          <span className="metric-chip">
            example {formatOpenApiValue(parameter.example)}
          </span>
        </div>
      ) : null}
    </article>
  );
}

function ApiOperationGuide({
  spec,
  path,
  method = "get",
  title = "Operation contract",
  description = "",
  parameterOrder = [],
  requestPath = "",
}) {
  const operation = getOpenApiOperation(spec, path, method);

  if (!operation) {
    return null;
  }

  const parameters = orderParameters(
    getOpenApiParameters(spec, path, method),
    parameterOrder,
  );
  const snippets = buildRequestSnippets(requestPath);

  return (
    <>
      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>{title}</h2>
            <p className="muted-line">
              {description ||
                operation.summary ||
                "Machine-readable contract for the current operation."}
            </p>
          </div>
          <a className="query-link" href="/api/v1/openapi.json">
            /api/v1/openapi.json
          </a>
        </div>

        <div className="tag-list">
          <span className="metric-chip">{String(method).toUpperCase()}</span>
          <span className="tag">{path}</span>
          {operation.operationId ? (
            <span className="tag">{operation.operationId}</span>
          ) : null}
          {operation.summary && operation.summary !== description ? (
            <span className="tag">{operation.summary}</span>
          ) : null}
        </div>

        <div className="panel-grid">
          {parameters.map((parameter) => (
            <OperationParameterCard
              key={`${path}-${method}-${parameter.name}`}
              parameter={parameter}
            />
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="stats-section-head">
          <div>
            <h2>Live request snippets</h2>
            <p className="muted-line">
              Сниппеты строятся из текущего request path, а не из вручную
              поддерживаемых строк.
            </p>
          </div>
          {requestPath ? (
            <a className="query-link" href={requestPath}>
              {requestPath}
            </a>
          ) : null}
        </div>

        {snippets ? (
          <div className="panel-grid operation-guide-code-grid">
            <CodeBlock label="curl">{snippets.curl}</CodeBlock>
            <CodeBlock label="fetch">{snippets.fetch}</CodeBlock>
            <CodeBlock label="axios">{snippets.axios}</CodeBlock>
          </div>
        ) : (
          <StateNotice>Собери request, чтобы получить готовые сниппеты.</StateNotice>
        )}
      </section>
    </>
  );
}

export { ApiOperationGuide };
