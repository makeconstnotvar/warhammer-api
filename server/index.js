const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

if (require.main === module) {
  app.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
  });
}

module.exports = {
  app,
};
