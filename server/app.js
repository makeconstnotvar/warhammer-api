require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const config = require("./config");
const { sendError } = require("./lib/apiResponse");
const { createApiRateLimit } = require("./lib/apiRateLimit");
const { apiRoutes } = require("./routes");
const { apiV1Routes } = require("./v1Routes");
const {
  legacyDeprecationHeaders,
} = require("./middleware/legacyDeprecationHeaders");

function createApp(options = {}) {
  const app = express();
  const apiV1RateLimit = createApiRateLimit({
    ...config.apiV1RateLimit,
    ...(options.apiV1RateLimit || {}),
  });

  app.use(cors());
  app.use(helmet());
  app.use(morgan("dev"));

  app.use(express.json());
  app.use("/api/v1", apiV1RateLimit, apiV1Routes);
  app.use("/api", legacyDeprecationHeaders, apiRoutes);

  const distPath = path.join(__dirname, "../client/dist");
  app.use(express.static(distPath));

  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    return sendError(res, err);
  });

  return app;
}

module.exports = {
  createApp,
};
