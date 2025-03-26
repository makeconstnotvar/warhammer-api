const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const config = require('./config/config');
const { setupRouter } = require('./routes');

// Импорт хендлеров
const raceHandler = require('./handlers/raceHandler');
const factionHandler = require('./handlers/factionHandler');
const characterHandler = require('./handlers/characterHandler');

// Настройка CORS
fastify.register(cors);

// Настройка маршрутов
setupRouter(fastify, raceHandler, factionHandler, characterHandler);

// Запуск сервера
const start = async () => {
	try {
		const PORT = config.server.port;
		await fastify.listen({ port: PORT, host: '0.0.0.0' });
		console.log(`Server is running on port ${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

module.exports = fastify;