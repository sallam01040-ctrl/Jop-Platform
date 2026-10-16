// db.js - Enterprise SQLite Database Layer using Node 24 Built-in SQLite
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'jobplatform.sqlite');
const db = new DatabaseSync(DB_PATH);

// Initialize schema with foreign keys and indexes
function initSchema() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'staff', 'employer', 'candidate')) NOT NULL,
      phone TEXT,
      avatar TEXT,
      headline TEXT,
      bio TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      website TEXT,
      industry TEXT NOT NULL,
      size TEXT,
      location TEXT NOT NULL,
      description TEXT,
      verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      job_type TEXT CHECK(job_type IN ('full_time', 'daily_gig', 'part_time', 'contract')) NOT NULL,
      workplace_type TEXT CHECK(workplace_type IN ('remote', 'on_site', 'hybrid')) NOT NULL,
      location TEXT NOT NULL,
      salary_min REAL NOT NULL,
      salary_max REAL NOT NULL,
      rate_period TEXT CHECK(rate_period IN ('year', 'month', 'day', 'hour')) NOT NULL,
      currency TEXT DEFAULT 'USD',
      experience_level TEXT CHECK(experience_level IN ('entry', 'mid', 'senior', 'executive')) NOT NULL,
      description TEXT NOT NULL,
      responsibilities TEXT,
      requirements TEXT,
      benefits TEXT,
      commission_rate REAL DEFAULT 3.0,
      status TEXT CHECK(status IN ('active', 'pending_approval', 'closed')) DEFAULT 'active',
      featured INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      cover_letter TEXT,
      resume_url TEXT,
      status TEXT CHECK(status IN ('applied', 'under_review', 'interview', 'offer', 'hired', 'rejected')) DEFAULT 'applied',
      offer_salary REAL,
      commission_amount REAL,
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'paid', 'exempt')) DEFAULT 'unpaid',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      application_id TEXT NOT NULL,
      payer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      commission_percentage REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT CHECK(status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
      receipt_number TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
      candidate_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (candidate_id, job_id),
      FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);
    CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_payments_app ON payments(application_id);
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
