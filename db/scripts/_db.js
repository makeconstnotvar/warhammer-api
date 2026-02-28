const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

function createClient() {
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warhammer',
  });
}

function getMigrationFiles() {
  const migrationsDir = path.resolve(__dirname, '../migrations');

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      fullPath: path.join(migrationsDir, file),
    }));
}

function readFile(fullPath) {
  return fs.readFileSync(fullPath, 'utf8');
}

module.exports = {
  createClient,
  getMigrationFiles,
  readFile,
};
