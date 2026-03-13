const { getLegacyApiDeprecationHeaders } = require("../content/apiLifecycle");

function legacyDeprecationHeaders(req, res, next) {
  const headers = getLegacyApiDeprecationHeaders();

  Object.entries(headers).forEach(([name, value]) => {
    res.setHeader(name, value);
  });

  next();
}

module.exports = {
  legacyDeprecationHeaders,
};
