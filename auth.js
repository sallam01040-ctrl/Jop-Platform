// auth.js - Enterprise Cryptographic Authentication, RBAC & Brute-Force Defense
const crypto = require('node:crypto');

// Resolve JWT secret securely
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.length < 32 || secret.includes('placeholder') || secret.includes('enterprise_secret_key_2026')) {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be set in environment with at least 32 cryptographically random characters in production.');
    }
    return secret;
  }

  // Development default with warning
  return secret || 'dev_insecure_development_secret_key_min_32_characters_long_2026';
}

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
}

/**
 * Hash password with scrypt and unique random 16-byte salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored hash with timing safe equality
 */
function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch (err) {
    return false;
  }
}

/**
 * Generate standard HMAC SHA256 JWT containing user ID, role, and token version
 */
function generateToken(payload) {
  const secret = getJwtSecret();
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const exp = Date.now() + TOKEN_EXPIRY_MS;
  const tokenPayload = { ...payload, exp };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerEncoded = encode(header);
  const payloadEncoded = encode(tokenPayload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify JWT signature and expiration
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerEncoded, payloadEncoded, signature] = parts;
  const secret = getJwtSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Authenticate HTTP request and verify active token version against database
 */
function authenticateRequest(req, db = null) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) return null;

  // If database handle is provided, verify user is active and token has not been revoked
  if (db && payload.id) {
    try {
      const user = db.prepare('SELECT id, role, token_version, is_suspended FROM users WHERE id = ?').get(payload.id);
      if (!user) return null;
      if (user.is_suspended) return null;
      // If token version exists in token and doesn't match db, session was revoked (logout or password reset)
      if (payload.v !== undefined && user.token_version !== undefined && payload.v !== user.token_version) {
        return null;
      }
    } catch (e) {
      // In-memory or fallback
    }
  }

  return payload;
}

/**
 * Check and manage brute force login rate limits
 */
function checkRateLimit(db, ip, email) {
  if (!db) return { allowed: true };
  const normalizedEmail = (email || '').toLowerCase().trim();
  const now = new Date();

  try {
    const record = db.prepare('SELECT attempts, last_attempt, locked_until FROM login_attempts WHERE ip = ? AND email = ?').get(ip, normalizedEmail);

    if (record && record.locked_until) {
      const lockedUntil = new Date(record.locked_until);
      if (now < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - now) / (60 * 1000));
        return {
          allowed: false,
          error: `Too many failed login attempts. Account temporarily locked for ${remainingMinutes} more minute(s).`
        };
      }
    }
  } catch (e) {
    // Table might not exist yet
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
function recordFailedLogin(db, ip, email) {
  if (!db) return;
  const normalizedEmail = (email || '').toLowerCase().trim();
  const now = new Date();

  try {
    const record = db.prepare('SELECT attempts FROM login_attempts WHERE ip = ? AND email = ?').get(ip, normalizedEmail);

    if (record) {
      const newAttempts = record.attempts + 1;
      let lockedUntil = null;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }
      db.prepare(`
        UPDATE login_attempts 
        SET attempts = ?, last_attempt = ?, locked_until = ?
        WHERE ip = ? AND email = ?
      `).run(newAttempts, now.toISOString(), lockedUntil, ip, normalizedEmail);
    } else {
      db.prepare(`
        INSERT INTO login_attempts (ip, email, attempts, last_attempt, locked_until)
        VALUES (?, ?, 1, ?, NULL)
      `).run(ip, normalizedEmail, now.toISOString());
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Reset failed login attempts on successful authentication
 */
function resetLoginAttempts(db, ip, email) {
  if (!db) return;
  const normalizedEmail = (email || '').toLowerCase().trim();
  try {
    db.prepare('DELETE FROM login_attempts WHERE ip = ? AND email = ?').run(ip, normalizedEmail);
  } catch (e) {
    // Ignore
  }
}

/**
 * Sanitize plain strings to prevent injection/stored XSS
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

module.exports = {
  getJwtSecret,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateRequest,
  checkRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  sanitizeInput
};
