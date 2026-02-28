const { createClient, getMigrationFiles, readFile } = require('./_db');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      file_name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT file_name FROM schema_migrations ORDER BY file_name');
  return new Set(result.rows.map((row) => row.file_name));
}

async function run() {
  const client = createClient();

  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const migrations = getMigrationFiles();

    for (const migration of migrations) {
      if (applied.has(migration.file)) {
        console.log(`skip ${migration.file}`);
        continue;
      }

      console.log(`apply ${migration.file}`);
      const sql = readFile(migration.fullPath);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (file_name) VALUES ($1)', [migration.file]);
    }

    console.log('migrations complete');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
