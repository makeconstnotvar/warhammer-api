require('dotenv').config({ path: __dirname + '/.env' });
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { sendError } = require('./lib/apiResponse');
const app = express();
const { apiRoutes } = require('./routes');
const { apiV1Routes } = require('./v1Routes');

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use('/api/v1', apiV1Routes);
app.use('/api', apiRoutes);

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  return sendError(res, err);
});

app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`);
});
