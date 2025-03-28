const {Pool} = require('pg');
const config = require('./config');

class Database {
    constructor() {
        this.pool = new Pool({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name
        });
    }

    async query(text, params) {
        const start = Date.now();
        const result = await this.pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query: ${text}, Duration: ${duration}ms, Rows: ${result.rowCount}`);
        return result;
    }

    async getClient() {
        const client = await this.pool.connect();
        return client;
    }
}

module.exports = new Database();