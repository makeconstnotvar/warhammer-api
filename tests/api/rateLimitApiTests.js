const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createApp } = require("../../server/app");
const { runTestCases } = require("./testUtils");

async function withRateLimitServer(rateLimitOptions, callback) {
  const server = createApp({
    apiV1RateLimit: rateLimitOptions,
  }).listen(0, "127.0.0.1");

  await once(server, "listening");

  try {
    const address = server.address();
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

async function runRateLimitApiTests() {
  const cases = [
    {
      name: "api/v1 rate limiting publishes headers blocks bursts and resets after window",
      run: async () => {
        await withRateLimitServer({ maxRequests: 2, windowMs: 300 }, async (baseUrl) => {
          const firstResponse = await fetch(`${baseUrl}/api/v1/overview`);
          await firstResponse.json();

          assert.equal(firstResponse.status, 200);
          assert.equal(firstResponse.headers.get("ratelimit-limit"), "2");
          assert.equal(firstResponse.headers.get("ratelimit-remaining"), "1");
          assert.equal(firstResponse.headers.get("ratelimit-policy"), "2;w=1");

          const secondResponse = await fetch(`${baseUrl}/api/v1/overview`);
          assert.equal(secondResponse.status, 200);
          assert.equal(secondResponse.headers.get("ratelimit-remaining"), "0");

          const thirdResponse = await fetch(`${baseUrl}/api/v1/overview`);
          const thirdJson = await thirdResponse.json();

          assert.equal(thirdResponse.status, 429);
          assert.equal(thirdJson.error.code, "RATE_LIMIT_EXCEEDED");
          assert.equal(thirdResponse.headers.get("ratelimit-limit"), "2");
          assert.equal(thirdResponse.headers.get("ratelimit-remaining"), "0");
          assert.equal(thirdResponse.headers.get("ratelimit-policy"), "2;w=1");
          assert.equal(thirdResponse.headers.get("retry-after"), "1");

          await new Promise((resolve) => setTimeout(resolve, 350));

          const fourthResponse = await fetch(`${baseUrl}/api/v1/overview`);
          assert.equal(fourthResponse.status, 200);
          assert.equal(fourthResponse.headers.get("ratelimit-remaining"), "1");
        });
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runRateLimitApiTests,
};
