'use strict';

require('./env/load-env');
const path = require('path');

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  }
};
