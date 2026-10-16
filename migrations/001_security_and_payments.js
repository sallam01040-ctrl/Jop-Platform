// migrations/001_security_and_payments.js
// Safe, idempotent database schema migration preserving all existing records.

function runMigration(db) {
  console.log('[Migration] Running 001_security_and_payments...');

  // Helper to check if a column exists in a table
  function hasColumn(table, column) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    return columns.some(c => c.name === column);
  }

  // 1. Upgrade users table
  if (!hasColumn('users', 'token_version')) {
    db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1;`);
    console.log('[Migration] Added users.token_version');
  }

  if (!hasColumn('users', 'is_suspended')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0;`);
    console.log('[Migration] Added users.is_suspended');
  }

  if (!hasColumn('users', 'skills')) {
    db.exec(`ALTER TABLE users ADD COLUMN skills TEXT;`);
    console.log('[Migration] Added users.skills');
  }

  if (!hasColumn('users', 'experience_years')) {
    db.exec(`ALTER TABLE users ADD COLUMN experience_years INTEGER DEFAULT 0;`);
    console.log('[Migration] Added users.experience_years');
  }

  if (!hasColumn('users', 'resume_url')) {
    db.exec(`ALTER TABLE users ADD COLUMN resume_url TEXT;`);
    console.log('[Migration] Added users.resume_url');
  }

  // 2. Upgrade payments table
  if (!hasColumn('payments', 'provider')) {
    db.exec(`ALTER TABLE payments ADD COLUMN provider TEXT DEFAULT 'stripe';`);
    console.log('[Migration] Added payments.provider');
  }

  if (!hasColumn('payments', 'provider_payment_intent_id')) {
    db.exec(`ALTER TABLE payments ADD COLUMN provider_payment_intent_id TEXT;`);
    console.log('[Migration] Added payments.provider_payment_intent_id');
  }

  if (!hasColumn('payments', 'idempotency_key')) {
    db.exec(`ALTER TABLE payments ADD COLUMN idempotency_key TEXT;`);
    console.log('[Migration] Added payments.idempotency_key');
  }

  if (!hasColumn('payments', 'payment_method_details')) {
    db.exec(`ALTER TABLE payments ADD COLUMN payment_method_details TEXT;`);
    console.log('[Migration] Added payments.payment_method_details');
  }

  if (!hasColumn('payments', 'receipt_url')) {
    db.exec(`ALTER TABLE payments ADD COLUMN receipt_url TEXT;`);
    console.log('[Migration] Added payments.receipt_url');
  }

  if (!hasColumn('payments', 'refunded_amount')) {
    db.exec(`ALTER TABLE payments ADD COLUMN refunded_amount REAL DEFAULT 0;`);
    console.log('[Migration] Added payments.refunded_amount');
  }

  // 3. Upgrade jobs table
  if (!hasColumn('jobs', 'closed_at')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN closed_at TEXT;`);
    console.log('[Migration] Added jobs.closed_at');
  }

  // 4. Create system settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Default commission rate (3.0%)
  const now = new Date().toISOString();
  db.exec(`
    INSERT OR IGNORE INTO system_settings (key, value, updated_at)
    VALUES ('default_commission_rate', '3.0', '${now}');
  `);

  // 5. Create dispute reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS disputes_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT CHECK(status IN ('open', 'resolved', 'dismissed')) DEFAULT 'open',
      created_at TEXT NOT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Create login attempts table for brute-force rate-limiting
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip TEXT NOT NULL,
      email TEXT NOT NULL,
      attempts INTEGER DEFAULT 1,
      last_attempt TEXT NOT NULL,
      locked_until TEXT,
      PRIMARY KEY (ip, email)
    );
  `);

  // Create additional indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_intent ON payments(provider_payment_intent_id);
    CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_users_token_v ON users(id, token_version);
  `);

  console.log('[Migration] 001_security_and_payments completed successfully.');
}

module.exports = { runMigration };
