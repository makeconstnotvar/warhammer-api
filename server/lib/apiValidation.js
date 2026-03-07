const { createValidationError } = require('./apiErrors');

function isValueMissing(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function createValidationDetail(field, code, message, value, extra = {}) {
  const detail = {
    code,
    field,
    message,
    ...extra,
  };

  if (value !== undefined) {
    detail.value = value;
  }

  return detail;
}

function throwIfValidationErrors(details, message = 'Invalid query parameters') {
  if (details.length) {
    throw createValidationError(message, details);
  }
}

function parseRequiredString(value, field, details) {
  if (isValueMissing(value)) {
    details.push(createValidationDetail(field, 'REQUIRED', `Parameter "${field}" is required`));
    return '';
  }

  return String(value).trim();
}

function parseOptionalPositiveInt(value, options) {
  const {
    defaultValue,
    details,
    field,
    maxValue,
  } = options;

  if (value === undefined || value === null) {
    return defaultValue;
  }

  const stringValue = String(value).trim();

  if (!/^\d+$/.test(stringValue)) {
    details.push(
      createValidationDetail(
        field,
        'INVALID_POSITIVE_INTEGER',
        `Parameter "${field}" must be a positive integer`,
        value,
      ),
    );
    return defaultValue;
  }

  const parsed = parseInt(stringValue, 10);

  if (parsed <= 0) {
    details.push(
      createValidationDetail(
        field,
        'INVALID_POSITIVE_INTEGER',
        `Parameter "${field}" must be a positive integer`,
        value,
      ),
    );
    return defaultValue;
  }

  if (maxValue) {
    return Math.min(parsed, maxValue);
  }

  return parsed;
}

function parseOptionalBoolean(value, field, defaultValue, details) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  details.push(
    createValidationDetail(
      field,
      'INVALID_BOOLEAN',
      `Parameter "${field}" must be "true" or "false"`,
      value,
    ),
  );

  return defaultValue;
}

module.exports = {
  createValidationDetail,
  isValueMissing,
  parseOptionalBoolean,
  parseOptionalPositiveInt,
  parseRequiredString,
  throwIfValidationErrors,
};
