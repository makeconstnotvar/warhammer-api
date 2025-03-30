require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const app = express();
const { apiRoutes} = require('./routes');

// Настройка CORS
app.use(cors());
app.use(helmet());
//app.use(morgan('combined'));

// Поддержка JSON
app.use(express.json());
app.use('/api', apiRoutes)
// Настройка маршрутов
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback для SPA
app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});
// Запуск сервера
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
});