require('dotenv').config();
const createApp = require('./app');
const env = require('./config/env');

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Sweety API listening on port ${env.port} (${env.nodeEnv})`);
});
