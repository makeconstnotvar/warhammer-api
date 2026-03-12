const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

function readEnvString(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" ? value : fallback;
}

function readEnvInt(name, fallback) {
  const parsed = Number.parseInt(readEnvString(name, ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const config = {
  database: {
    host: readEnvString("DB_HOST", "localhost"),
    port: readEnvInt("DB_PORT", 5432),
    user: readEnvString("DB_USER", "postgres"),
    password: readEnvString("DB_PASSWORD", ""),
    name: readEnvString("DB_NAME", "warhammer"),
  },
  server: {
    port: readEnvInt("PORT", 3000),
  },
  apiV1RateLimit: {
    maxRequests: readEnvInt("API_V1_RATE_LIMIT_MAX_REQUESTS", 120),
    windowMs: readEnvInt("API_V1_RATE_LIMIT_WINDOW_MS", 60000),
  },
};

module.exports = config;
