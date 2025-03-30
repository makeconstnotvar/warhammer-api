
const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'warhammer',
    },
    server: {
        port: parseInt(process.env.PORT || 3000)
    }
};

module.exports = config;