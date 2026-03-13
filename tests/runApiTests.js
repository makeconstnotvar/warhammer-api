const path = require("path");
const { once } = require("node:events");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const pool = require("../server/db");
const { createApp } = require("../server/app");
const { runCompareStatsApiTests } = require("./api/compareStatsApiTests");
const { runDomainApiTests } = require("./api/domainApiTests");
const { runExploreApiTests } = require("./api/exploreApiTests");
const { runRateLimitApiTests } = require("./api/rateLimitApiTests");
const { runGeneratedSdkTests } = require("./client/generatedSdkTests");
const { runWorkbenchPivotTests } = require("./client/workbenchPivotsTests");

async function main() {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const failures = [];

  try {
    failures.push(...(await runExploreApiTests(baseUrl)));
    failures.push(...(await runCompareStatsApiTests(baseUrl)));
    failures.push(...(await runDomainApiTests(baseUrl)));
    failures.push(...(await runRateLimitApiTests()));
    failures.push(...(await runGeneratedSdkTests(baseUrl)));
    failures.push(...(await runWorkbenchPivotTests()));
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

    await pool.end();
  }

  if (failures.length) {
    console.error(`API tests failed: ${failures.length}`);
    process.exitCode = 1;
    return;
  }

  console.log("Tests passed");
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
