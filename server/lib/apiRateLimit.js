function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function defaultKeyGenerator(req) {
  return req.ip || req.socket?.remoteAddress || "anonymous";
}

function normalizeRateLimitOptions(options = {}) {
  const windowMs = parsePositiveInt(options.windowMs, 60000);
  const maxRequests = parsePositiveInt(options.maxRequests, 120);
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  return {
    keyGenerator:
      typeof options.keyGenerator === "function" ? options.keyGenerator : defaultKeyGenerator,
    maxRequests,
    windowMs,
    windowSeconds,
  };
}

function buildRateLimitPolicy(options = {}) {
  const normalized = normalizeRateLimitOptions(options);

  return {
    headers: [
      {
        name: "RateLimit-Limit",
        example: `RateLimit-Limit: ${normalized.maxRequests}`,
        description: "Максимум запросов в текущем окне.",
      },
      {
        name: "RateLimit-Remaining",
        example: `RateLimit-Remaining: ${normalized.maxRequests - 1}`,
        description: "Сколько запросов еще можно выполнить до 429.",
      },
      {
        name: "RateLimit-Reset",
        example: `RateLimit-Reset: ${normalized.windowSeconds}`,
        description: "Через сколько секунд окно лимита полностью обновится.",
      },
      {
        name: "RateLimit-Policy",
        example: `RateLimit-Policy: ${normalized.maxRequests};w=${normalized.windowSeconds}`,
        description: 'Сводное описание policy в формате "limit;w=windowSeconds".',
      },
      {
        name: "Retry-After",
        example: `Retry-After: ${normalized.windowSeconds}`,
        description: "Отдается вместе с 429 и показывает, когда безопасно повторить запрос.",
      },
    ],
    limit: normalized.maxRequests,
    policy: `${normalized.maxRequests};w=${normalized.windowSeconds}`,
    scope: "/api/v1",
    windowMs: normalized.windowMs,
    windowSeconds: normalized.windowSeconds,
  };
}

function createApiRateLimit(options = {}) {
  const normalized = normalizeRateLimitOptions(options);
  const buckets = new Map();
  let cleanupCounter = 0;

  return function apiRateLimit(req, res, next) {
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    const now = Date.now();
    const key = normalized.keyGenerator(req);
    const existingBucket = buckets.get(key);
    let bucket = existingBucket;

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + normalized.windowMs,
      };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(normalized.maxRequests - bucket.count, 0);
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", String(normalized.maxRequests));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));
    res.setHeader("RateLimit-Policy", `${normalized.maxRequests};w=${normalized.windowSeconds}`);

    cleanupCounter += 1;
    if (cleanupCounter % 100 === 0) {
      for (const [bucketKey, bucketValue] of buckets.entries()) {
        if (bucketValue.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }
    }

    if (bucket.count > normalized.maxRequests) {
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Rate limit exceeded for /api/v1. Retry after the current window resets.",
          details: [
            {
              limit: normalized.maxRequests,
              policy: `${normalized.maxRequests};w=${normalized.windowSeconds}`,
              resetInSeconds: resetSeconds,
              scope: "/api/v1",
            },
          ],
        },
      });
      return;
    }

    next();
  };
}

module.exports = {
  buildRateLimitPolicy,
  createApiRateLimit,
  normalizeRateLimitOptions,
};
