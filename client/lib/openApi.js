function resolveOpenApiRef(spec, ref) {
  if (!spec || !ref || !ref.startsWith("#/")) {
    return null;
  }

  return ref
    .slice(2)
    .split("/")
    .reduce((result, key) => result?.[key], spec);
}

function resolveOpenApiParameter(spec, parameter) {
  if (!parameter) {
    return null;
  }

  if (parameter.$ref) {
    return resolveOpenApiRef(spec, parameter.$ref);
  }

  return parameter;
}

function getOpenApiOperation(spec, path, method = "get") {
  return spec?.paths?.[path]?.[method] || null;
}

function getOpenApiParameters(spec, path, method = "get") {
  return (getOpenApiOperation(spec, path, method)?.parameters || [])
    .map((parameter) => resolveOpenApiParameter(spec, parameter))
    .filter(Boolean);
}

function getOpenApiParameterMap(spec, path, method = "get") {
  return getOpenApiParameters(spec, path, method).reduce(
    (result, parameter) => {
      result[parameter.name] = parameter;
      return result;
    },
    {},
  );
}

function formatOpenApiValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getOpenApiParameterExample(
  parameter,
  { fallback = "", nestedKey } = {},
) {
  const example = parameter?.example;

  if (
    nestedKey &&
    example &&
    typeof example === "object" &&
    !Array.isArray(example)
  ) {
    return example[nestedKey] ?? fallback;
  }

  return example ?? fallback;
}

function getOpenApiParameterDefault(parameter, fallback = "") {
  return parameter?.schema?.default ?? fallback;
}

function getOpenApiParameterHint(parameter, { fallback = "", nestedKey } = {}) {
  const example = getOpenApiParameterExample(parameter, {
    fallback: undefined,
    nestedKey,
  });

  if (example !== undefined && example !== null && example !== "") {
    return formatOpenApiValue(example);
  }

  const defaultValue = getOpenApiParameterDefault(parameter, fallback);
  return formatOpenApiValue(defaultValue);
}

function buildOpenApiIntegerOptions(parameter, fallback = []) {
  const minimum = parameter?.schema?.minimum;
  const maximum = parameter?.schema?.maximum;

  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    maximum < minimum ||
    maximum - minimum > 20
  ) {
    return fallback.map((value) => String(value));
  }

  return Array.from({ length: maximum - minimum + 1 }, (_, index) =>
    String(minimum + index),
  );
}

function getOpenApiConstraintChips(parameter) {
  const schema = parameter?.schema || {};
  const chips = [];

  chips.push(parameter?.required ? "required" : "optional");

  if (schema.default !== undefined) {
    chips.push(`default ${formatOpenApiValue(schema.default)}`);
  }

  if (schema.minimum !== undefined) {
    chips.push(`min ${formatOpenApiValue(schema.minimum)}`);
  }

  if (schema.maximum !== undefined) {
    chips.push(`max ${formatOpenApiValue(schema.maximum)}`);
  }

  if (Array.isArray(schema.enum) && schema.enum.length) {
    chips.push(`${schema.enum.length} values`);
  }

  if (parameter?.style) {
    chips.push(parameter.style);
  }

  return chips;
}

export {
  buildOpenApiIntegerOptions,
  formatOpenApiValue,
  getOpenApiConstraintChips,
  getOpenApiParameterDefault,
  getOpenApiParameterExample,
  getOpenApiParameterHint,
  getOpenApiOperation,
  getOpenApiParameterMap,
  getOpenApiParameters,
  resolveOpenApiParameter,
  resolveOpenApiRef,
};
