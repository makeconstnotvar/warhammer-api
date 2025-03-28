const { Pool } = require('pg');
const config = require("./config");

const pool = new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database:  config.database.name   ,
    port: config.database.port,
});

pool.on('connect', () => {
    console.log('Подключение к базе данных установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к базе данных:', err);
});

module.exports = pool;