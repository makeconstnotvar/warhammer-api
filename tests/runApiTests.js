const path = require('path');
const { once } = require('node:events');

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const pool = require('../server/db');
const { createApp } = require('../server/app');
const { runExploreApiTests } = require('./api/exploreApiTests');

async function main() {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const failures = [];

  try {
    failures.push(...await runExploreApiTests(baseUrl));
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

  console.log('API tests passed');
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
