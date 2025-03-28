const express = require('express');
const cors = require('cors');
const config = require('./config');
const { apiRoutes} = require('./routes');
const helmet = require('helmet');
const morgan = require('morgan');

// Создание приложения Express
const app = express();

// Логгирование (аналог logger в Fastify)
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	next();
});

// Настройка CORS
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Поддержка JSON
app.use(express.json());
app.use('/api', apiRoutes)
// Настройка маршрутов

// Запуск сервера
const start = async () => {
	try {
		const PORT = config.server.port;
		app.listen(PORT, '0.0.0.0', () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

module.exports = app;