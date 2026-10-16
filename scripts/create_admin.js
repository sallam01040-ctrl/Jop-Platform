// scripts/create_admin.js
// Secure CLI utility to initialize or update the platform super administrator account.
const crypto = require('node:crypto');
const { db, initSchema } = require('../db.js');
const { hashPassword } = require('../auth.js');
const readline = require('node:readline');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  initSchema();

  console.log('====================================================');
  console.log('JobPlatform Global - Secure Admin Provisioning');
  console.log('====================================================');

  const email = process.env.ADMIN_EMAIL || (await prompt('Enter Super Admin Email: '));
  if (!email || !email.includes('@')) {
    console.error('Error: A valid email address is required.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await prompt('Enter Strong Admin Password (min 8 chars): ');
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || (await prompt('Enter Admin Full Name [Super Administrator]: ')) || 'Super Administrator';

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(normalizedEmail);
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  if (existing) {
    console.log(`User ${normalizedEmail} already exists. Elevating/Updating credentials...`);
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'admin', name = ?, token_version = token_version + 1
      WHERE id = ?
    `).run(passwordHash, name, existing.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'ADMIN_CREDENTIALS_UPDATED', ?, ?)
    `).run('aud_' + crypto.randomUUID(), existing.id, `Admin credentials updated via CLI for ${normalizedEmail}`, now);

    console.log(`✅ Success: Super Admin ${normalizedEmail} updated successfully.`);
  } else {
    const adminId = 'usr_admin_' + crypto.randomUUID().slice(0, 8);
    const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, avatar, headline, bio, token_version, is_suspended, created_at)
      VALUES (?, ?, ?, ?, 'admin', '', ?, 'Platform Super Administrator', 'Enterprise operations and compliance overseer', 1, 0, ?)
    `).run(adminId, name, normalizedEmail, passwordHash, avatar, now);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'ADMIN_PROVISIONED', ?, ?)
    `).run('aud_' + crypto.randomUUID(), adminId, `Super admin account provisioned via CLI: ${normalizedEmail}`, now);

    console.log(`✅ Success: New Super Admin ${normalizedEmail} provisioned successfully (ID: ${adminId}).`);
  }

  console.log('Admin account is ready for production login.');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Failed to provision admin:', err);
  process.exit(1);
});
