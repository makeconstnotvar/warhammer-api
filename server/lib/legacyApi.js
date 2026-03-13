const { createApiError, isApiError } = require("./apiErrors");
const { createValidationDetail, isValueMissing } = require("./apiValidation");

function createLegacyNotFoundError(entityLabel) {
  return createApiError(404, "LEGACY_NOT_FOUND", `${entityLabel} not found`);
}

function createLegacyValidationError(details, message = "Invalid request parameters") {
  return createApiError(400, "LEGACY_VALIDATION_ERROR", message, details);
}

function throwIfLegacyValidationErrors(details, message) {
  if (details.length) {
    throw createLegacyValidationError(details, message);
  }
}

function parsePositiveInteger(value, field, details, options = {}) {
  const { allowZero = false, required = false } = options;

  if (value === undefined || value === null || value === "") {
    if (required) {
      details.push(
        createValidationDetail(field, "REQUIRED", `Parameter "${field}" is required`, value)
      );
    }

    return undefined;
  }

  const normalized = String(value).trim();

  if (!/^\d+$/.test(normalized)) {
    details.push(
      createValidationDetail(
        field,
        allowZero ? "INVALID_NON_NEGATIVE_INTEGER" : "INVALID_POSITIVE_INTEGER",
        `Parameter "${field}" must be a ${allowZero ? "non-negative" : "positive"} integer`,
        value
      )
    );
    return undefined;
  }

  const parsed = parseInt(normalized, 10);

  if ((!allowZero && parsed <= 0) || (allowZero && parsed < 0)) {
    details.push(
      createValidationDetail(
        field,
        allowZero ? "INVALID_NON_NEGATIVE_INTEGER" : "INVALID_POSITIVE_INTEGER",
        `Parameter "${field}" must be a ${allowZero ? "non-negative" : "positive"} integer`,
        value
      )
    );
    return undefined;
  }

  return parsed;
}

function normalizeOptionalString(value, field, details, options = {}) {
  const { nullable = true } = options;

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    if (nullable) {
      return null;
    }

    details.push(
      createValidationDetail(field, "INVALID_STRING", `Field "${field}" must be a string`)
    );
    return undefined;
  }

  if (typeof value !== "string") {
    details.push(
      createValidationDetail(field, "INVALID_STRING", `Field "${field}" must be a string`, value)
    );
    return undefined;
  }

  return value.trim();
}

function parseRequiredBodyString(value, field, details) {
  if (isValueMissing(value)) {
    details.push(createValidationDetail(field, "REQUIRED", `Field "${field}" is required`));
    return "";
  }

  if (typeof value !== "string") {
    details.push(
      createValidationDetail(field, "INVALID_STRING", `Field "${field}" must be a string`, value)
    );
    return "";
  }

  return value.trim();
}

function parseLegacyListQuery(query, filterConfig = []) {
  const details = [];
  const page = parsePositiveInteger(query.page, "page", details) ?? 1;
  const limit = parsePositiveInteger(query.limit, "limit", details) ?? 20;
  const filters = {};

  filterConfig.forEach((filter) => {
    const rawValue = query[filter.source];

    if (rawValue === undefined) {
      return;
    }

    if (filter.type === "positiveInt") {
      const parsed = parsePositiveInteger(rawValue, filter.source, details);

      if (parsed !== undefined) {
        filters[filter.target] = parsed;
      }

      return;
    }

    const normalized = String(rawValue).trim();

    if (normalized) {
      filters[filter.target] = normalized;
    }
  });

  throwIfLegacyValidationErrors(details);

  return {
    filters,
    limit,
    page,
  };
}

function parseLegacyId(id, field = "id") {
  const details = [];
  const parsedId = parsePositiveInteger(id, field, details, { required: true });
  throwIfLegacyValidationErrors(details);
  return parsedId;
}

function parseLegacyWriteBody(body, options = {}) {
  const { numericFields = [] } = options;
  const details = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createLegacyValidationError([
      createValidationDetail("body", "INVALID_OBJECT", "Request body must be a JSON object", body),
    ]);
  }

  const payload = {};
  payload.name = parseRequiredBodyString(body.name, "name", details);

  ["slug", "summary", "description", "status", "alignment", "imageUrl"].forEach((field) => {
    const normalized = normalizeOptionalString(body[field], field, details);

    if (normalized !== undefined) {
      payload[field] = normalized;
    }
  });

  numericFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return;
    }

    if (body[field] === null || body[field] === "") {
      payload[field] = null;
      return;
    }

    const parsed = parsePositiveInteger(body[field], field, details, {
      allowZero: field === "powerLevel",
    });

    if (parsed !== undefined) {
      payload[field] = parsed;
    }
  });

  throwIfLegacyValidationErrors(details, "Invalid request payload");

  return payload;
}

function mapLegacyDatabaseError(error) {
  if (!error?.code) {
    return null;
  }

  if (error.code === "22P02") {
    return createLegacyValidationError(
      [createValidationDetail("database", "INVALID_VALUE", "Invalid value for database field")],
      "Invalid request parameters"
    );
  }

  if (error.code === "23502") {
    return createLegacyValidationError(
      [
        createValidationDetail(
          error.column || "database",
          "REQUIRED",
          `Field "${error.column || "database"}" is required`
        ),
      ],
      "Invalid request payload"
    );
  }

  if (error.code === "23503") {
    return createLegacyValidationError(
      [
        createValidationDetail(
          error.constraint || "database",
          "FOREIGN_KEY_VIOLATION",
          error.detail || "Related record does not exist"
        ),
      ],
      "Invalid request payload"
    );
  }

  if (error.code === "23505") {
    return createApiError(409, "LEGACY_CONFLICT", "Record already exists", [
      createValidationDetail(
        error.constraint || "database",
        "UNIQUE_VIOLATION",
        error.detail || "Unique constraint violation"
      ),
    ]);
  }

  return null;
}

function normalizeLegacyError(error) {
  if (isApiError(error)) {
    return error;
  }

  const mappedDatabaseError = mapLegacyDatabaseError(error);

  if (mappedDatabaseError) {
    return mappedDatabaseError;
  }

  if (error?.message && /not found$/i.test(error.message)) {
    return createApiError(404, "LEGACY_NOT_FOUND", error.message);
  }

  return createApiError(500, "LEGACY_INTERNAL_ERROR", "Internal Server Error");
}

function sendLegacyError(res, error) {
  const normalized = normalizeLegacyError(error);
  const payload = {
    error: normalized.message,
  };

  if (Array.isArray(normalized.details) && normalized.details.length) {
    payload.details = normalized.details;
  }

  return res.status(normalized.status).json(payload);
}

module.exports = {
  createLegacyNotFoundError,
  parseLegacyId,
  parseLegacyListQuery,
  parseLegacyWriteBody,
  sendLegacyError,
};
