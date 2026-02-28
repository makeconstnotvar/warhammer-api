const { isApiError } = require('./apiErrors');

function sendError(res, error) {
  if (isApiError(error)) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      details: [],
    },
  });
}

module.exports = {
  sendError,
};
