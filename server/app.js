require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUiDist = require("swagger-ui-dist");
const config = require("./config");
const { sendError } = require("./lib/apiResponse");
const { createApiError } = require("./lib/apiErrors");
const { createApiRateLimit } = require("./lib/apiRateLimit");
const { apiV1Routes } = require("./v1Routes");

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
  app.use("/api", (req, res, next) => {
    next(
      createApiError(
        410,
        "LEGACY_API_REMOVED",
        'The legacy "/api" surface has been removed. Use "/api/v1".'
      )
    );
  });

  const distPath = path.join(__dirname, "../client/dist");
  const generatedSdkPath = path.join(__dirname, "../sdk");
  const openApiReferencePath = path.join(__dirname, "static/openapi-reference");
  app.use(
    "/sdk",
    express.static(generatedSdkPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith(".d.ts")) {
          res.type("application/typescript; charset=utf-8");
        }
      },
    })
  );
  app.use("/swagger-ui-assets", express.static(swaggerUiDist.getAbsoluteFSPath()));
  app.use("/openapi-reference-assets", express.static(openApiReferencePath));
  app.get("/openapi/reference", (req, res) => {
    res.sendFile(path.join(openApiReferencePath, "index.html"));
  });
  app.get("/legacy/reference", (req, res) => {
    res.redirect(302, "/openapi/reference");
  });
  app.get("/legacy-api", (req, res) => {
    res.redirect(302, "/openapi");
  });
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
