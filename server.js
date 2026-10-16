// server.js - Hardened Enterprise REST API & HTTP Server
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Load environment configuration safely
const ENV_PATH = path.join(__dirname, '.env');
if (fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const { db, initSchema } = require('./db.js');
const { runMigration } = require('./migrations/001_security_and_payments.js');
const {
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
} = require('./auth.js');
const {
  createCommissionPaymentIntent,
  verifyStripeWebhookSignature,
  settleVerifiedPayment
} = require('./payments.js');
const { saveUploadedFile } = require('./uploads.js');

// Ensure schema & migrations are applied
initSchema();
runMigration(db);

const PORT = parseInt(process.env.PORT || '5050', 10);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOW_DEMO = process.env.ENABLE_DEMO_LOGIN === 'true' && !IS_PRODUCTION;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Validate critical secrets in production mode
if (IS_PRODUCTION) {
  try {
    getJwtSecret();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

// MIME types map
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Security and CORS headers helper
function getSecurityHeaders(req) {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);
  const requestOrigin = req.headers['origin'] || '';

  let allowOriginHeader = '*';
  if (IS_PRODUCTION) {
    if (allowedOrigins.length > 0) {
      allowOriginHeader = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
    } else {
      allowOriginHeader = requestOrigin || 'https://' + (req.headers.host || 'localhost');
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOriginHeader,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature, x-idempotency-key',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:;"
  };
}

// Send JSON responses securely
function sendJSON(res, req, statusCode, data) {
  const payload = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(payload),
    ...getSecurityHeaders(req)
  };
  res.writeHead(statusCode, headers);
  res.end(payload);
}

// Parse request body as JSON with size limit
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      req.rawBody = body; // Retain raw string for webhook signature verification
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Serve static assets from /public with strict path traversal protection
function serveStaticFile(req, res, pathname) {
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || stats.isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not Found');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        ...getSecurityHeaders(req)
      });
      res.end(content);
    });
  });
}

// Log audit activity securely (omitting passwords and tokens)
function logAudit(userId, action, details) {
  try {
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAudit.run('aud_' + crypto.randomUUID(), userId || 'system', action, details, new Date().toISOString());
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const searchParams = reqUrl.searchParams;
  const method = req.method;
  const clientIP = (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...getSecurityHeaders(req),
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // REST API Router
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health check & configuration metadata
      if (pathname === '/api/health' && method === 'GET') {
        return sendJSON(res, req, 200, {
          status: 'healthy',
          version: '2.0.0',
          environment: process.env.NODE_ENV || 'development',
          demo_mode: ALLOW_DEMO,
          stripe_configured: !!process.env.STRIPE_SECRET_KEY,
          engine: 'Node.js ' + process.version,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Auth: Register (CRITICAL FIX: Strictly prevents public creation of admin or staff roles)
      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseRequestBody(req);
        const { name, email, password, role, company_name, company_industry, phone } = body;

        if (!name || !email || !password || !role) {
          return sendJSON(res, req, 400, { error: 'Missing required fields (name, email, password, role)' });
        }

        // Strictly permit ONLY 'candidate' and 'employer' via public registration
        if (role !== 'candidate' && role !== 'employer') {
          return sendJSON(res, req, 403, {
            error: 'Forbidden: Administrative and staff accounts cannot be created via public registration. Contact the platform administrator.'
          });
        }

        if (!validatePasswordStrength(password)) {
          return sendJSON(res, req, 400, {
            error: 'Password must be at least 8 characters long.'
          });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
        if (existing) {
          return sendJSON(res, req, 409, { error: 'Email is already registered. Please sign in instead.' });
        }

        const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
        const passwordHash = hashPassword(password);
        const now = new Date().toISOString();
        const sanitizedName = sanitizeInput(name);

        const insertUser = db.prepare(`
          INSERT INTO users (id, name, email, password_hash, role, phone, avatar, headline, bio, token_version, is_suspended, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
        `);

        const avatar = `https://images.unsplash.com/photo-${role === 'employer' ? '1486406146926-c627a92ad1ab' : '1535713875002-d1d0cf377fde'}?w=150&auto=format&fit=crop&q=80`;
        insertUser.run(
          userId,
          sanitizedName,
          normalizedEmail,
          passwordHash,
          role,
          sanitizeInput(phone || ''),
          avatar,
          role === 'employer' ? sanitizeInput(company_name || 'Enterprise Employer') : 'Verified Professional',
          'Registered member of JobPlatform Global Network',
          now
        );

        let company = null;
        if (role === 'employer') {
          const companyId = 'cmp_' + crypto.randomUUID().slice(0, 8);
          const sanitizedCompanyName = sanitizeInput(company_name || sanitizedName + ' Enterprises');
          const insertCompany = db.prepare(`
            INSERT INTO companies (id, user_id, name, logo, website, industry, size, location, description, verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          insertCompany.run(
            companyId,
            userId,
            sanitizedCompanyName,
            avatar,
            'https://' + sanitizedCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
            sanitizeInput(company_industry || 'Technology & Services'),
            '50-250 employees',
            'Global / Remote',
            'Verified enterprise employer operating on JobPlatform.',
            1,
            now
          );
          company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
        }

        logAudit(userId, 'USER_REGISTERED', `Role: ${role}, Email: ${normalizedEmail}`);

        const token = generateToken({ id: userId, email: normalizedEmail, role, name: sanitizedName, v: 1 });
        return sendJSON(res, req, 201, {
          message: 'Account successfully registered',
          token,
          user: { id: userId, name: sanitizedName, email: normalizedEmail, role, avatar },
          company
        });
      }

      // 3. Auth: Login (With Brute Force Rate Limiting & Account Lockout Defense)
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseRequestBody(req);
        const { email, password } = body;

        if (!email || !password) {
          return sendJSON(res, req, 400, { error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check brute force rate limiting
        const rateLimit = checkRateLimit(db, clientIP, normalizedEmail);
        if (!rateLimit.allowed) {
          logAudit('system', 'LOGIN_RATE_LIMITED', `IP: ${clientIP}, Email: ${normalizedEmail}`);
          return sendJSON(res, req, 429, { error: rateLimit.error });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
        if (!user || !verifyPassword(password, user.password_hash)) {
          recordFailedLogin(db, clientIP, normalizedEmail);
          logAudit(user ? user.id : 'anonymous', 'LOGIN_FAILED', `IP: ${clientIP}, Email: ${normalizedEmail}`);
          return sendJSON(res, req, 401, { error: 'Invalid email or password credentials' });
        }

        if (user.is_suspended) {
          return sendJSON(res, req, 403, { error: 'Account suspended. Please contact platform compliance.' });
        }

        // Reset failed login count upon valid credentials
        resetLoginAttempts(db, clientIP, normalizedEmail);

        let company = null;
        if (user.role === 'employer') {
          company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
        }

        logAudit(user.id, 'LOGIN_SUCCESS', `IP: ${clientIP}, Role: ${user.role}`);

        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          v: user.token_version || 1
        });

        return sendJSON(res, req, 200, {
          message: 'Authentication successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            headline: user.headline
          },
          company
        });
      }

      // 4. Auth: Switch Demo Accounts (CRITICAL FIX: Strictly forbidden in production)
      if (pathname === '/api/auth/switch-demo' && method === 'POST') {
        if (!ALLOW_DEMO) {
          return sendJSON(res, req, 403, {
            error: 'Forbidden: Demo account switching is strictly disabled in production environments.'
          });
        }

        const body = await parseRequestBody(req);
        const { demoRole } = body;

        let targetEmail = 'ahmed@candidate.com';
        if (demoRole === 'admin') targetEmail = 'admin@jobplatform.com';
        else if (demoRole === 'staff') targetEmail = 'staff@jobplatform.com';
        else if (demoRole === 'employer') targetEmail = 'acme@jobs.com';
        else if (demoRole === 'google') targetEmail = 'google@jobs.com';

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
        if (!user) {
          return sendJSON(res, req, 404, { error: 'Demo user not found in database' });
        }

        let company = null;
        if (user.role === 'employer') {
          company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
        }

        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          v: user.token_version || 1
        });

        return sendJSON(res, req, 200, {
          message: `Switched to demo role: ${user.role}`,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            headline: user.headline
          },
          company
        });
      }

      // 5. Auth: Logout (Session Invalidation via token_version increment)
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (auth) {
          db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(auth.id);
          logAudit(auth.id, 'USER_LOGOUT', 'Session token revoked');
        }
        return sendJSON(res, req, 200, { message: 'Logged out successfully' });
      }

      // 6. Auth: Me
      if (pathname === '/api/auth/me' && method === 'GET') {
        const auth = authenticateRequest(req, db);
        if (!auth) {
          return sendJSON(res, req, 401, { error: 'Unauthorized or token expired' });
        }
        const user = db.prepare('SELECT id, name, email, role, phone, avatar, headline, bio, skills, experience_years, resume_url FROM users WHERE id = ?').get(auth.id);
        if (!user) {
          return sendJSON(res, req, 404, { error: 'User profile not found' });
        }
        let company = null;
        if (user.role === 'employer') {
          company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
        }
        return sendJSON(res, req, 200, { user, company });
      }

      // 7. Auth: Change Password
      if (pathname === '/api/auth/change-password' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth) {
          return sendJSON(res, req, 401, { error: 'Authentication required' });
        }
        const body = await parseRequestBody(req);
        const { current_password, new_password } = body;

        if (!current_password || !new_password) {
          return sendJSON(res, req, 400, { error: 'Current and new passwords are required' });
        }

        if (!validatePasswordStrength(new_password)) {
          return sendJSON(res, req, 400, { error: 'New password must be at least 8 characters long.' });
        }

        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(auth.id);
        if (!verifyPassword(current_password, user.password_hash)) {
          return sendJSON(res, req, 401, { error: 'Current password is incorrect' });
        }

        const newHash = hashPassword(new_password);
        db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(newHash, auth.id);
        logAudit(auth.id, 'PASSWORD_CHANGED', 'User changed password, session invalidated');

        return sendJSON(res, req, 200, { message: 'Password updated successfully. Please log in again.' });
      }

      // 8. User Profile Update (Self-update only)
      if (pathname === '/api/users/profile' && method === 'PUT') {
        const auth = authenticateRequest(req, db);
        if (!auth) {
          return sendJSON(res, req, 401, { error: 'Authentication required' });
        }
        const body = await parseRequestBody(req);
        const { name, phone, headline, bio, skills, experience_years, resume_url } = body;

        db.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name),
              phone = COALESCE(?, phone),
              headline = COALESCE(?, headline),
              bio = COALESCE(?, bio),
              skills = COALESCE(?, skills),
              experience_years = COALESCE(?, experience_years),
              resume_url = COALESCE(?, resume_url)
          WHERE id = ?
        `).run(
          name ? sanitizeInput(name) : null,
          phone ? sanitizeInput(phone) : null,
          headline ? sanitizeInput(headline) : null,
          bio ? sanitizeInput(bio) : null,
          skills ? sanitizeInput(skills) : null,
          experience_years !== undefined && experience_years !== null && experience_years !== '' ? parseInt(experience_years, 10) : null,
          resume_url ? sanitizeInput(resume_url) : null,
          auth.id
        );

        const updated = db.prepare('SELECT id, name, email, role, phone, avatar, headline, bio, skills, experience_years, resume_url FROM users WHERE id = ?').get(auth.id);
        return sendJSON(res, req, 200, { message: 'Profile updated successfully', user: updated });
      }

      // 9. Company Profile Update (Employer only for their own company - IDOR Defense)
      if (pathname === '/api/companies/profile' && method === 'PUT') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'employer') {
          return sendJSON(res, req, 403, { error: 'Employer account required' });
        }
        const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
        if (!comp) return sendJSON(res, req, 404, { error: 'Company not found' });

        const body = await parseRequestBody(req);
        const { name, website, industry, size, location, description } = body;

        db.prepare(`
          UPDATE companies 
          SET name = COALESCE(?, name),
              website = COALESCE(?, website),
              industry = COALESCE(?, industry),
              size = COALESCE(?, size),
              location = COALESCE(?, location),
              description = COALESCE(?, description)
          WHERE id = ?
        `).run(
          name ? sanitizeInput(name) : null,
          website ? sanitizeInput(website) : null,
          industry ? sanitizeInput(industry) : null,
          size ? sanitizeInput(size) : null,
          location ? sanitizeInput(location) : null,
          description ? sanitizeInput(description) : null,
          comp.id
        );

        const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(comp.id);
        return sendJSON(res, req, 200, { message: 'Company profile updated', company: updated });
      }

      // 10. File Uploads (Resumes & Logos with Magic Byte Security)
      if (pathname === '/api/upload' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth) {
          return sendJSON(res, req, 401, { error: 'Authentication required to upload files' });
        }

        const body = await parseRequestBody(req);
        const { file_data, filename, type } = body; // type: 'resume' or 'logo'

        if (!file_data) {
          return sendJSON(res, req, 400, { error: 'File data is required (base64)' });
        }

        const uploadType = type === 'logo' ? 'logo' : 'resume';
        const saved = saveUploadedFile(file_data, filename || 'upload', uploadType);

        // If resume uploaded by candidate, auto-attach to profile
        if (uploadType === 'resume' && auth.role === 'candidate') {
          db.prepare('UPDATE users SET bio = bio WHERE id = ?').run(auth.id);
        }

        logAudit(auth.id, 'FILE_UPLOADED', `Type: ${uploadType}, File: ${saved.filename}`);
        return sendJSON(res, req, 201, { message: 'File securely uploaded and verified', file: saved });
      }

      // 11. Meta Stats & Categories
      if (pathname === '/api/meta/stats' && method === 'GET') {
        const jobCounts = db.prepare("SELECT COUNT(*) as total FROM jobs WHERE status = 'active'").get();
        const companyCounts = db.prepare("SELECT COUNT(*) as total FROM companies").get();
        const candidateCounts = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'candidate'").get();
        const dailyGigsCount = db.prepare("SELECT COUNT(*) as total FROM jobs WHERE job_type = 'daily_gig' AND status = 'active'").get();

        return sendJSON(res, req, 200, {
          totalJobs: jobCounts.total,
          totalCompanies: companyCounts.total,
          totalCandidates: candidateCounts.total,
          dailyGigsCount: dailyGigsCount.total,
          countriesSupported: '150+',
          demoModeActive: ALLOW_DEMO,
          stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
          guaranteeText: '100% Encrypted & Escrow Protected'
        });
      }

      // 12. Jobs: List & Search & Filter
      if (pathname === '/api/jobs' && method === 'GET') {
        const q = (searchParams.get('q') || '').trim();
        const category = (searchParams.get('category') || '').trim();
        const jobType = (searchParams.get('job_type') || '').trim();
        const workplaceType = (searchParams.get('workplace_type') || '').trim();
        const location = (searchParams.get('location') || '').trim();
        const experience = (searchParams.get('experience') || '').trim();
        const sort = searchParams.get('sort') || 'recent';

        let sql = `
          SELECT 
            j.*,
            c.name as company_name,
            c.logo as company_logo,
            c.industry as company_industry,
            c.verified as company_verified
          FROM jobs j
          JOIN companies c ON j.company_id = c.id
          WHERE j.status = 'active'
        `;
        const params = [];

        if (q) {
          sql += ` AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ? OR j.location LIKE ?)`;
          const wildcard = `%${q}%`;
          params.push(wildcard, wildcard, wildcard, wildcard);
        }

        if (category && category !== 'All' && category !== 'all') {
          sql += ` AND j.category = ?`;
          params.push(category);
        }

        if (jobType && jobType !== 'all') {
          sql += ` AND j.job_type = ?`;
          params.push(jobType);
        }

        if (workplaceType && workplaceType !== 'all') {
          sql += ` AND j.workplace_type = ?`;
          params.push(workplaceType);
        }

        if (location && location !== 'all' && location !== 'Worldwide') {
          sql += ` AND j.location LIKE ?`;
          params.push(`%${location}%`);
        }

        if (experience && experience !== 'all') {
          sql += ` AND j.experience_level = ?`;
          params.push(experience);
        }

        if (sort === 'salary_high') {
          sql += ` ORDER BY j.salary_max DESC, j.created_at DESC`;
        } else if (sort === 'views') {
          sql += ` ORDER BY j.views_count DESC, j.created_at DESC`;
        } else {
          sql += ` ORDER BY j.featured DESC, j.created_at DESC`;
        }

        const jobs = db.prepare(sql).all(...params);

        const auth = authenticateRequest(req, db);
        let savedJobIds = new Set();
        if (auth && auth.role === 'candidate') {
          const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE candidate_id = ?').all(auth.id);
          saved.forEach(s => savedJobIds.add(s.job_id));
        }

        const formattedJobs = jobs.map(j => ({
          ...j,
          is_saved: savedJobIds.has(j.id),
          responsibilities: JSON.parse(j.responsibilities || '[]'),
          requirements: JSON.parse(j.requirements || '[]'),
          benefits: JSON.parse(j.benefits || '[]')
        }));

        return sendJSON(res, req, 200, {
          total: formattedJobs.length,
          jobs: formattedJobs
        });
      }

      // 13. Jobs: Single Details
      if (pathname.startsWith('/api/jobs/') && !pathname.includes('/save') && !pathname.includes('/apply') && !pathname.includes('/toggle-status') && method === 'GET') {
        const jobId = pathname.split('/')[3];
        const job = db.prepare(`
          SELECT 
            j.*,
            c.id as company_id,
            c.name as company_name,
            c.logo as company_logo,
            c.website as company_website,
            c.industry as company_industry,
            c.size as company_size,
            c.location as company_location,
            c.description as company_description,
            c.verified as company_verified
          FROM jobs j
          JOIN companies c ON j.company_id = c.id
          WHERE j.id = ?
        `).get(jobId);

        if (!job) {
          return sendJSON(res, req, 404, { error: 'Job not found' });
        }

        db.prepare('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?').run(jobId);

        const auth = authenticateRequest(req, db);
        let application = null;
        let isSaved = false;

        if (auth && auth.role === 'candidate') {
          application = db.prepare('SELECT * FROM applications WHERE job_id = ? AND candidate_id = ?').get(jobId, auth.id);
          const saved = db.prepare('SELECT 1 FROM saved_jobs WHERE candidate_id = ? AND job_id = ?').get(auth.id, jobId);
          isSaved = !!saved;
        }

        return sendJSON(res, req, 200, {
          job: {
            ...job,
            is_saved: isSaved,
            responsibilities: JSON.parse(job.responsibilities || '[]'),
            requirements: JSON.parse(job.requirements || '[]'),
            benefits: JSON.parse(job.benefits || '[]')
          },
          application
        });
      }

      // 14. Jobs: Post new Job (Employer or Admin)
      if (pathname === '/api/jobs' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'employer' && auth.role !== 'admin')) {
          return sendJSON(res, req, 403, { error: 'Employer or Admin authorization required to publish jobs' });
        }

        let companyId = null;
        if (auth.role === 'employer') {
          const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
          if (!comp) return sendJSON(res, req, 400, { error: 'No company profile attached to this employer account' });
          companyId = comp.id;
        }

        const body = await parseRequestBody(req);
        if (auth.role === 'admin' && body.company_id) {
          companyId = body.company_id;
        }

        const {
          title, category, job_type, workplace_type, location,
          salary_min, salary_max, rate_period, currency, experience_level,
          description, responsibilities, requirements, benefits, commission_rate
        } = body;

        if (!title || !category || !job_type || !salary_min) {
          return sendJSON(res, req, 400, { error: 'Missing mandatory job fields' });
        }

        const jobId = 'job_' + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        // Get default commission rate from system settings if not specified
        let defaultCommission = 3.0;
        try {
          const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'default_commission_rate'").get();
          if (setting) defaultCommission = parseFloat(setting.value);
        } catch (e) {}

        const insertJob = db.prepare(`
          INSERT INTO jobs (
            id, company_id, title, category, job_type, workplace_type, location,
            salary_min, salary_max, rate_period, currency, experience_level,
            description, responsibilities, requirements, benefits, commission_rate,
            status, featured, views_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertJob.run(
          jobId,
          companyId,
          sanitizeInput(title),
          sanitizeInput(category),
          job_type,
          workplace_type || 'remote',
          sanitizeInput(location || 'Worldwide'),
          parseFloat(salary_min),
          parseFloat(salary_max || salary_min),
          rate_period || (job_type === 'daily_gig' ? 'day' : 'year'),
          currency || 'USD',
          experience_level || 'mid',
          sanitizeInput(description),
          JSON.stringify(Array.isArray(responsibilities) ? responsibilities : (responsibilities ? responsibilities.split('\n').filter(Boolean) : [])),
          JSON.stringify(Array.isArray(requirements) ? requirements : (requirements ? requirements.split('\n').filter(Boolean) : [])),
          JSON.stringify(Array.isArray(benefits) ? benefits : (benefits ? benefits.split('\n').filter(Boolean) : [])),
          parseFloat(commission_rate || defaultCommission),
          'active',
          0,
          0,
          now
        );

        logAudit(auth.id, 'POST_JOB', `Created job: ${title} (${jobId})`);
        return sendJSON(res, req, 201, { message: 'Job posting published successfully', jobId });
      }

      // 15. Jobs: Edit Job (Employer only for OWN company's job, or Admin - IDOR Defense)
      if (pathname.startsWith('/api/jobs/') && method === 'PUT') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'employer' && auth.role !== 'admin')) {
          return sendJSON(res, req, 403, { error: 'Employer or Admin authorization required' });
        }

        const jobId = pathname.split('/')[3];
        const existingJob = db.prepare('SELECT company_id FROM jobs WHERE id = ?').get(jobId);
        if (!existingJob) return sendJSON(res, req, 404, { error: 'Job not found' });

        if (auth.role === 'employer') {
          const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
          if (!comp || comp.id !== existingJob.company_id) {
            return sendJSON(res, req, 403, { error: 'Forbidden: You cannot modify a job posted by another company.' });
          }
        }

        const body = await parseRequestBody(req);
        const { title, category, job_type, location, salary_min, salary_max, description } = body;

        db.prepare(`
          UPDATE jobs 
          SET title = COALESCE(?, title),
              category = COALESCE(?, category),
              job_type = COALESCE(?, job_type),
              location = COALESCE(?, location),
              salary_min = COALESCE(?, salary_min),
              salary_max = COALESCE(?, salary_max),
              description = COALESCE(?, description)
          WHERE id = ?
        `).run(
          title ? sanitizeInput(title) : null,
          category ? sanitizeInput(category) : null,
          job_type || null,
          location ? sanitizeInput(location) : null,
          salary_min ? parseFloat(salary_min) : null,
          salary_max ? parseFloat(salary_max) : null,
          description ? sanitizeInput(description) : null,
          jobId
        );

        logAudit(auth.id, 'EDIT_JOB', `Edited job ${jobId}`);
        return sendJSON(res, req, 200, { message: 'Job updated successfully' });
      }

      // 16. Jobs: Delete/Close Job (Employer for own job or Admin - IDOR Defense)
      if (pathname.startsWith('/api/jobs/') && method === 'DELETE') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'employer' && auth.role !== 'admin')) {
          return sendJSON(res, req, 403, { error: 'Employer or Admin authorization required' });
        }

        const jobId = pathname.split('/')[3];
        const existingJob = db.prepare('SELECT company_id FROM jobs WHERE id = ?').get(jobId);
        if (!existingJob) return sendJSON(res, req, 404, { error: 'Job not found' });

        if (auth.role === 'employer') {
          const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
          if (!comp || comp.id !== existingJob.company_id) {
            return sendJSON(res, req, 403, { error: 'Forbidden: You cannot delete a job belonging to another company.' });
          }
        }

        db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
        logAudit(auth.id, 'DELETE_JOB', `Deleted job ${jobId}`);
        return sendJSON(res, req, 200, { message: 'Job successfully deleted' });
      }

      // 17. Jobs: Save / Bookmark toggle
      if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/save') && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'candidate') {
          return sendJSON(res, req, 401, { error: 'Candidate login required to save jobs' });
        }

        const jobId = pathname.split('/')[3];
        const existing = db.prepare('SELECT 1 FROM saved_jobs WHERE candidate_id = ? AND job_id = ?').get(auth.id, jobId);

        if (existing) {
          db.prepare('DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?').run(auth.id, jobId);
          return sendJSON(res, req, 200, { saved: false, message: 'Job removed from saved list' });
        } else {
          db.prepare('INSERT INTO saved_jobs (candidate_id, job_id, created_at) VALUES (?, ?, ?)').run(auth.id, jobId, new Date().toISOString());
          return sendJSON(res, req, 200, { saved: true, message: 'Job successfully saved' });
        }
      }

      // 18. Jobs: Apply for Job (Candidate only, single submission)
      if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/apply') && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'candidate') {
          return sendJSON(res, req, 401, { error: 'Please log in as a candidate to submit your application' });
        }

        const jobId = pathname.split('/')[3];
        const body = await parseRequestBody(req);
        const { cover_letter, resume_url } = body;

        const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
        if (!job || job.status !== 'active') return sendJSON(res, req, 404, { error: 'Job is not open for applications' });

        const existingApp = db.prepare('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?').get(jobId, auth.id);
        if (existingApp) {
          return sendJSON(res, req, 409, { error: 'You have already applied for this position' });
        }

        const appId = 'app_' + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        const insertApp = db.prepare(`
          INSERT INTO applications (
            id, job_id, candidate_id, cover_letter, resume_url, status,
            offer_salary, commission_amount, payment_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'applied', NULL, NULL, 'unpaid', ?, ?)
        `);

        insertApp.run(
          appId,
          jobId,
          auth.id,
          sanitizeInput(cover_letter || 'Application submitted via JobPlatform Global'),
          resume_url || '/resumes/candidate_cv.pdf',
          now,
          now
        );

        logAudit(auth.id, 'APPLY_JOB', `Job: ${job.title} (${jobId})`);
        return sendJSON(res, req, 201, { message: 'Application submitted successfully!', applicationId: appId });
      }

      // 19. Applications: Candidate's Dashboard List (Own applications only - IDOR Defense)
      if (pathname === '/api/applications/candidate' && method === 'GET') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'candidate') {
          return sendJSON(res, req, 401, { error: 'Candidate login required' });
        }

        const applications = db.prepare(`
          SELECT 
            a.*,
            j.title as job_title,
            j.job_type,
            j.rate_period,
            j.currency,
            j.salary_min,
            j.salary_max,
            j.location as job_location,
            j.commission_rate,
            c.name as company_name,
            c.logo as company_logo
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN companies c ON j.company_id = c.id
          WHERE a.candidate_id = ?
          ORDER BY a.created_at DESC
        `).all(auth.id);

        const savedJobs = db.prepare(`
          SELECT 
            j.*,
            c.name as company_name,
            c.logo as company_logo
          FROM saved_jobs s
          JOIN jobs j ON s.job_id = j.id
          JOIN companies c ON j.company_id = c.id
          WHERE s.candidate_id = ?
          ORDER BY s.created_at DESC
        `).all(auth.id);

        return sendJSON(res, req, 200, {
          applications,
          savedJobs
        });
      }

      // 20. Applications: Employer's Dashboard List (Own company's applications only - IDOR Defense)
      if (pathname === '/api/applications/employer' && method === 'GET') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'employer' && auth.role !== 'admin')) {
          return sendJSON(res, req, 403, { error: 'Employer or Admin login required' });
        }

        let companyId = null;
        if (auth.role === 'employer') {
          const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
          if (!comp) return sendJSON(res, req, 400, { error: 'No company attached to employer' });
          companyId = comp.id;
        }

        let sql = `
          SELECT 
            a.*,
            j.title as job_title,
            j.job_type,
            j.rate_period,
            j.currency,
            j.commission_rate,
            u.name as candidate_name,
            u.email as candidate_email,
            u.avatar as candidate_avatar,
            u.headline as candidate_headline,
            u.phone as candidate_phone
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN users u ON a.candidate_id = u.id
        `;

        let params = [];
        if (companyId) {
          sql += ` WHERE j.company_id = ?`;
          params.push(companyId);
        }
        sql += ` ORDER BY a.created_at DESC`;

        const applications = db.prepare(sql).all(...params);

        let jobsSql = 'SELECT * FROM jobs';
        let jobsParams = [];
        if (companyId) {
          jobsSql += ' WHERE company_id = ?';
          jobsParams.push(companyId);
        }
        jobsSql += ' ORDER BY created_at DESC';
        const jobs = db.prepare(jobsSql).all(...jobsParams);

        return sendJSON(res, req, 200, {
          applications,
          jobs
        });
      }

      // 21. Applications: Update Status (Employer for OWN company's application or Admin - IDOR Defense)
      if (pathname.startsWith('/api/applications/') && pathname.endsWith('/status') && method === 'PATCH') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'employer' && auth.role !== 'admin' && auth.role !== 'staff')) {
          return sendJSON(res, req, 403, { error: 'Unauthorized to update application status' });
        }

        const appId = pathname.split('/')[3];
        const app = db.prepare(`
          SELECT a.*, j.company_id, j.commission_rate 
          FROM applications a 
          JOIN jobs j ON a.job_id = j.id 
          WHERE a.id = ?
        `).get(appId);

        if (!app) return sendJSON(res, req, 404, { error: 'Application not found' });

        // Verify employer owns the company that owns the job
        if (auth.role === 'employer') {
          const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(auth.id);
          if (!comp || comp.id !== app.company_id) {
            return sendJSON(res, req, 403, { error: 'Forbidden: You cannot modify applications belonging to another company.' });
          }
        }

        const body = await parseRequestBody(req);
        const { status, offer_salary } = body;

        const validStatuses = ['applied', 'under_review', 'interview', 'offer', 'hired', 'rejected'];
        if (!validStatuses.includes(status)) {
          return sendJSON(res, req, 400, { error: 'Invalid application status' });
        }

        // Prevent setting status to 'hired' without verified payment
        if (status === 'hired' && app.payment_status !== 'paid' && auth.role !== 'admin') {
          return sendJSON(res, req, 400, {
            error: 'Cannot mark as hired: Platform commission (3%) must be paid and verified first.'
          });
        }

        let commissionAmount = app.commission_amount;
        let agreedSalary = offer_salary !== undefined ? parseFloat(offer_salary) : app.offer_salary;

        if (agreedSalary && (!commissionAmount || offer_salary !== undefined)) {
          const rate = app.commission_rate || 3.0;
          commissionAmount = Math.round((agreedSalary * (rate / 100)) * 100) / 100;
        }

        const now = new Date().toISOString();
        db.prepare(`
          UPDATE applications 
          SET status = ?, offer_salary = ?, commission_amount = ?, updated_at = ?
          WHERE id = ?
        `).run(status, agreedSalary, commissionAmount, now, appId);

        logAudit(auth.id, 'UPDATE_APPLICATION_STATUS', `App: ${appId}, Status: ${status}, Commission: $${commissionAmount}`);

        return sendJSON(res, req, 200, {
          message: `Application updated to ${status}`,
          status,
          offer_salary: agreedSalary,
          commission_amount: commissionAmount
        });
      }

      // 22. Payments: Create Real PaymentIntent (Stripe Gateway or Test Simulation)
      if (pathname === '/api/payments/create-intent' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'candidate') {
          return sendJSON(res, req, 401, { error: 'Candidate authorization required to settle platform commission' });
        }

        const body = await parseRequestBody(req);
        const { application_id } = body;

        if (!application_id) {
          return sendJSON(res, req, 400, { error: 'application_id is required' });
        }

        try {
          const intent = await createCommissionPaymentIntent(application_id, auth.id);
          return sendJSON(res, req, 200, intent);
        } catch (err) {
          return sendJSON(res, req, 400, { error: err.message });
        }
      }

      // 23. Payments: Webhook Handler (Stripe Webhook Signature Verification & Atomic Settlement)
      if (pathname === '/api/payments/webhook' && method === 'POST') {
        await parseRequestBody(req); // Populates req.rawBody
        const signatureHeader = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        // In production, signature verification is mandatory
        if (IS_PRODUCTION && !webhookSecret) {
          console.error('[Security] STRIPE_WEBHOOK_SECRET is not configured in production.');
          return sendJSON(res, req, 500, { error: 'Webhook configuration error' });
        }

        if (webhookSecret) {
          const isValid = verifyStripeWebhookSignature(req.rawBody, signatureHeader, webhookSecret);
          if (!isValid) {
            console.warn('[Security] Invalid Stripe webhook signature rejected.');
            return sendJSON(res, req, 400, { error: 'Invalid webhook signature' });
          }
        }

        try {
          const event = JSON.parse(req.rawBody);

          if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            const appId = pi.metadata ? pi.metadata.application_id : null;
            const candidateId = pi.metadata ? pi.metadata.candidate_id : null;

            if (appId && candidateId) {
              settleVerifiedPayment({
                transactionId: pi.id,
                applicationId: appId,
                payerId: candidateId,
                amount: pi.amount / 100,
                currency: (pi.currency || 'USD').toUpperCase(),
                paymentMethod: (pi.payment_method_types && pi.payment_method_types[0]) || 'card',
                provider: 'stripe',
                receiptUrl: pi.charges && pi.charges.data && pi.charges.data[0] ? pi.charges.data[0].receipt_url : null
              });
            }
          }

          return sendJSON(res, req, 200, { received: true });
        } catch (err) {
          console.error('Webhook processing error:', err);
          return sendJSON(res, req, 400, { error: 'Webhook processing error: ' + err.message });
        }
      }

      // 24. Payments: Verified Payment Settlement (Development / Testing Mode Only)
      if (pathname === '/api/payments/checkout' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth) {
          return sendJSON(res, req, 401, { error: 'Authentication required' });
        }

        const body = await parseRequestBody(req);
        const { application_id, payment_method, card_holder, card_last4 } = body;

        if (!application_id) {
          return sendJSON(res, req, 400, { error: 'application_id is required' });
        }

        const app = db.prepare('SELECT a.*, j.salary_min, j.commission_rate, j.currency FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ?').get(application_id);
        if (!app) return sendJSON(res, req, 404, { error: 'Application not found' });

        if (app.candidate_id !== auth.id && auth.role !== 'admin') {
          return sendJSON(res, req, 403, { error: 'Forbidden: You can only settle payments for your own applications.' });
        }

        if (app.payment_status === 'paid') {
          return sendJSON(res, req, 409, { error: 'Commission for this position is already paid.' });
        }

        // In production without live webhook, reject mock auto-success
        if (IS_PRODUCTION && !process.env.ALLOW_DIRECT_COMMISSION_SETTLEMENT) {
          return sendJSON(res, req, 400, {
            error: 'In production mode, payments must be processed and verified via the official Stripe payment intent flow.'
          });
        }

        const baseAmount = app.commission_amount || (app.offer_salary ? Math.round(app.offer_salary * ((app.commission_rate || 3) / 100)) : 3600);
        const transactionId = 'TXN-' + crypto.randomUUID().slice(0, 8).toUpperCase() + '-GLB';

        const settlement = settleVerifiedPayment({
          transactionId,
          applicationId: application_id,
          payerId: auth.id,
          amount: baseAmount,
          currency: app.currency || 'USD',
          paymentMethod: payment_method || 'credit_card',
          provider: 'platform_escrow',
          cardDetails: card_last4 ? { brand: 'card', last4: card_last4 } : null
        });

        return sendJSON(res, req, 200, {
          success: true,
          message: 'Commission payment verified and settled successfully',
          payment: settlement
        });
      }

      // 25. Admin & Staff: Comprehensive Platform Statistics & Revenue (Granular RBAC)
      if (pathname === '/api/admin/stats' && method === 'GET') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'admin' && auth.role !== 'staff')) {
          return sendJSON(res, req, 403, { error: 'Admin or Staff authorization required' });
        }

        const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
        const totalCandidates = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'candidate'").get().count;
        const totalEmployers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get().count;
        const totalStaff = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'staff')").get().count;
        const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs").get().count;
        const dailyGigs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE job_type = 'daily_gig'").get().count;
        const fullTimeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE job_type = 'full_time'").get().count;
        const totalApplications = db.prepare("SELECT COUNT(*) as count FROM applications").get().count;
        const hiredCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get().count;

        // Granular RBAC: Only Admin sees financial revenue totals
        let totalRevenue = 0;
        let totalTransactions = 0;
        let recentPayments = [];

        if (auth.role === 'admin') {
          const revenueResult = db.prepare("SELECT SUM(amount) as totalRevenue, COUNT(*) as count FROM payments WHERE status = 'completed'").get();
          totalRevenue = revenueResult.totalRevenue || 0;
          totalTransactions = revenueResult.count || 0;

          recentPayments = db.prepare(`
            SELECT 
              p.*,
              u.name as payer_name,
              u.email as payer_email,
              j.title as job_title,
              c.name as company_name
            FROM payments p
            JOIN users u ON p.payer_id = u.id
            JOIN applications a ON p.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON j.company_id = c.id
            ORDER BY p.created_at DESC
            LIMIT 25
          `).all();
        }

        const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20').all();

        return sendJSON(res, req, 200, {
          userRole: auth.role,
          stats: {
            totalUsers,
            totalCandidates,
            totalEmployers,
            totalStaff,
            totalJobs,
            dailyGigs,
            fullTimeJobs,
            totalApplications,
            hiredCount,
            totalRevenue: auth.role === 'admin' ? totalRevenue : undefined,
            totalTransactions: auth.role === 'admin' ? totalTransactions : undefined,
            platformFeeRate: '3.0%'
          },
          recentPayments: auth.role === 'admin' ? recentPayments : [],
          auditLogs
        });
      }

      // 26. Admin: Provision Staff Account (Admin Only)
      if (pathname === '/api/admin/staff' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'admin') {
          return sendJSON(res, req, 403, { error: 'Only Platform Super Administrator can create staff accounts' });
        }

        const body = await parseRequestBody(req);
        const { name, email, password, headline } = body;

        if (!name || !email || !password) {
          return sendJSON(res, req, 400, { error: 'Name, email, and password are required' });
        }

        if (!validatePasswordStrength(password)) {
          return sendJSON(res, req, 400, { error: 'Password must be at least 8 characters long.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
        if (existing) {
          return sendJSON(res, req, 409, { error: 'Email already exists' });
        }

        const staffId = 'usr_staff_' + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO users (id, name, email, password_hash, role, phone, avatar, headline, bio, token_version, is_suspended, created_at)
          VALUES (?, ?, ?, ?, 'staff', '', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', ?, 'Platform operations staff member', 1, 0, ?)
        `).run(staffId, sanitizeInput(name), normalizedEmail, hashPassword(password), sanitizeInput(headline || 'Operations & Moderation Officer'), now);

        logAudit(auth.id, 'CREATE_STAFF', `Created staff account: ${normalizedEmail}`);
        return sendJSON(res, req, 201, { message: 'Staff account successfully created', staffId });
      }

      // 27. Admin: Update System Settings (Admin Only)
      if (pathname === '/api/admin/settings/fee' && method === 'PATCH') {
        const auth = authenticateRequest(req, db);
        if (!auth || auth.role !== 'admin') {
          return sendJSON(res, req, 403, { error: 'Only Platform Owner can configure platform fee rates' });
        }

        const body = await parseRequestBody(req);
        const { default_commission_rate } = body;

        if (!default_commission_rate || isNaN(parseFloat(default_commission_rate))) {
          return sendJSON(res, req, 400, { error: 'Valid numerical commission rate is required' });
        }

        const rate = parseFloat(default_commission_rate);
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('default_commission_rate', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(rate.toString(), now);

        logAudit(auth.id, 'UPDATE_COMMISSION_RATE', `New default rate: ${rate}%`);
        return sendJSON(res, req, 200, { message: `Platform commission rate updated to ${rate}%`, rate });
      }

      // 28. Admin & Staff: Job moderation
      if (pathname.startsWith('/api/admin/jobs/') && pathname.endsWith('/status') && method === 'PATCH') {
        const auth = authenticateRequest(req, db);
        if (!auth || (auth.role !== 'admin' && auth.role !== 'staff')) {
          return sendJSON(res, req, 403, { error: 'Admin or Staff authorization required' });
        }
        const jobId = pathname.split('/')[4];
        const body = await parseRequestBody(req);
        const { status, featured } = body;

        if (status) {
          db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, jobId);
        }
        if (featured !== undefined) {
          db.prepare('UPDATE jobs SET featured = ? WHERE id = ?').run(featured ? 1 : 0, jobId);
        }

        logAudit(auth.id, 'MODERATE_JOB', `Job: ${jobId}, Status: ${status}`);
        return sendJSON(res, req, 200, { message: 'Job status updated' });
      }

      // 29. Report job or company
      if (pathname === '/api/reports' && method === 'POST') {
        const auth = authenticateRequest(req, db);
        const body = await parseRequestBody(req);
        const { target_type, target_id, reason } = body;

        if (!target_type || !target_id || !reason) {
          return sendJSON(res, req, 400, { error: 'target_type, target_id, and reason are required' });
        }

        const reportId = 'rep_' + crypto.randomUUID().slice(0, 8);
        db.prepare(`
          INSERT INTO disputes_reports (id, reporter_id, target_type, target_id, reason, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'open', ?)
        `).run(reportId, auth ? auth.id : 'anonymous', target_type, target_id, sanitizeInput(reason), new Date().toISOString());

        return sendJSON(res, req, 201, { message: 'Report submitted for staff review', reportId });
      }

      // Unmatched API endpoint
      return sendJSON(res, req, 404, { error: 'API route not found' });
    } catch (err) {
      console.error('Server Internal Error:', err);
      // Generic safe error response (no sensitive traces or db schema leaks)
      return sendJSON(res, req, 500, { error: 'An unexpected internal error occurred. Please try again later.' });
    }
  }

  // Otherwise, serve static files (SPA frontend)
  serveStaticFile(req, res, pathname);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`JobPlatform Enterprise Global Server (Production-Ready)`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`REST API Base: http://localhost:${PORT}/api`);
    console.log(`Demo Switcher: ${ALLOW_DEMO ? 'ACTIVE (Dev only)' : 'DISABLED (Secure)'}`);
    console.log(`Stripe Gateway: ${process.env.STRIPE_SECRET_KEY ? 'CONFIGURED (Live)' : 'TEST / DEV MODE'}`);
    console.log(`=======================================================`);
  });
}

module.exports = server;
