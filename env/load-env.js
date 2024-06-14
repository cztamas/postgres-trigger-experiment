const dotenv = require('dotenv');
const path = require('path');

const env = process.env.NODE_ENV || 'dev';
if (['dev', 'test'].includes(env)) {
  dotenv.config({ path: path.join(__dirname, `${env}.env`) });
}
