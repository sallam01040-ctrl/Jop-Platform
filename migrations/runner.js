// migrations/runner.js
const { db, initSchema } = require('../db.js');
const m001 = require('./001_security_and_payments.js');

function runAllMigrations() {
  initSchema();
  m001.runMigration(db);
  console.log('All migrations applied successfully.');
}

if (require.main === module) {
  runAllMigrations();
}

module.exports = { runAllMigrations };
