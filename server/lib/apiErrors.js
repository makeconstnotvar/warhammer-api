class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function createApiError(status, code, message, details = []) {
  return new ApiError(status, code, message, details);
}

function isApiError(error) {
  return error instanceof ApiError;
}

module.exports = {
  ApiError,
  createApiError,
  isApiError,
};
