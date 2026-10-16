// test_suite.js - Comprehensive Automated Security, RBAC, IDOR & Payment Test Suite
const { Readable, Writable } = require('node:stream');
const crypto = require('node:crypto');
const server = require('./server.js');
const { seedDatabase } = require('./seed.js');
const { runMigration } = require('./migrations/001_security_and_payments.js');
const { db } = require('./db.js');
const { verifyStripeWebhookSignature } = require('./payments.js');
const { validateMagicBytes, saveUploadedFile } = require('./uploads.js');

// In-memory HTTP dispatcher simulating real HTTP requests inside sandbox
function request(method, path, data = null, token = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    
    const req = new Readable({
      read() {
        if (bodyStr) {
          this.push(bodyStr);
        }
        this.push(null);
      }
    });

    req.method = method;
    req.url = path;
    req.headers = {
      'content-type': 'application/json',
      ...customHeaders
    };
    if (token) {
      req.headers['authorization'] = `Bearer ${token}`;
    }
    if (bodyStr) {
      req.headers['content-length'] = Buffer.byteLength(bodyStr);
    }

    let responseChunks = [];
    let statusCode = 200;
    let headers = {};

    const res = new Writable({
      write(chunk, encoding, callback) {
        responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      }
    });

    res.writeHead = (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(headers, hdrs);
      return res;
    };

    res.setHeader = (name, value) => {
      headers[name.toLowerCase()] = value;
    };

    res.on('finish', () => {
      const responseBody = Buffer.concat(responseChunks).toString('utf8');
      try {
        const parsed = responseBody ? JSON.parse(responseBody) : {};
        resolve({ status: statusCode, headers, data: parsed, raw: responseBody });
      } catch (e) {
        resolve({ status: statusCode, headers, raw: responseBody });
      }
    });

    server.emit('request', req, res);
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('JOBPLATFORM GLOBAL - PRODUCTION-GRADE TEST SUITE');
  console.log('======================================================');

  console.log('\n--- FRESH DATABASE SEED & MIGRATION INITIALIZATION ---');
  seedDatabase();
  runMigration(db);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: API Health Check & Metadata
    // -------------------------------------------------------------------------
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check returns 200 with engine version');

    // -------------------------------------------------------------------------
    // TEST 2: CRITICAL SECURITY - Prevent Public Admin/Staff Role Escalation
    // -------------------------------------------------------------------------
    const fakeAdminReg = await request('POST', '/api/auth/register', {
      name: 'Malicious Actor',
      email: 'hacker@attack.com',
      password: 'HackerPassword123!',
      role: 'admin'
    });
    assert(
      fakeAdminReg.status === 403 && fakeAdminReg.data.error.includes('Forbidden'),
      'Public registration strictly rejects administrative role escalation (role: "admin" -> 403 Forbidden)'
    );

    const fakeStaffReg = await request('POST', '/api/auth/register', {
      name: 'Malicious Staff',
      email: 'hacker_staff@attack.com',
      password: 'HackerPassword123!',
      role: 'staff'
    });
    assert(
      fakeStaffReg.status === 403 && fakeStaffReg.data.error.includes('Forbidden'),
      'Public registration strictly rejects staff role escalation (role: "staff" -> 403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Password Strength Enforcement
    // -------------------------------------------------------------------------
    const weakPassReg = await request('POST', '/api/auth/register', {
      name: 'Weak Pass User',
      email: 'weak@domain.com',
      password: '123',
      role: 'candidate'
    });
    assert(
      weakPassReg.status === 400 && weakPassReg.data.error.includes('at least 8 characters'),
      'Registration enforces minimum 8 characters password policy'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Legitimate Candidate & Employer Registration
    // -------------------------------------------------------------------------
    const validCandidateReg = await request('POST', '/api/auth/register', {
      name: 'Kareem Tarek',
      email: 'kareem@testtalent.com',
      password: 'SafePassword2026',
      role: 'candidate'
    });
    assert(validCandidateReg.status === 201 && validCandidateReg.data.token, 'Legitimate candidate registers with role "candidate"');

    // -------------------------------------------------------------------------
    // TEST 5: Brute-Force Rate Limiting & Account Lockout
    // -------------------------------------------------------------------------
    console.log('\nTesting brute force login rate-limiter...');
    for (let i = 0; i < 5; i++) {
      await request('POST', '/api/auth/login', {
        email: 'ahmed@candidate.com',
        password: 'wrong_password_attempt'
      });
    }
    const lockedAttempt = await request('POST', '/api/auth/login', {
      email: 'ahmed@candidate.com',
      password: 'candidate123'
    });
    assert(
      lockedAttempt.status === 429 && lockedAttempt.data.error.includes('Too many failed login attempts'),
      'Account lockout triggered after 5 failed login attempts (429 Too Many Requests)'
    );

    // Clear lockout record for continued testing
    db.prepare('DELETE FROM login_attempts WHERE email = ?').run('ahmed@candidate.com');

    // -------------------------------------------------------------------------
    // TEST 6: Valid Authentication & JWT Token Versioning
    // -------------------------------------------------------------------------
    const loginCandidate = await request('POST', '/api/auth/login', {
      email: 'ahmed@candidate.com',
      password: 'candidate123'
    });
    assert(loginCandidate.status === 200 && loginCandidate.data.token, 'Candidate login succeeds with valid JWT');
    const candidateToken = loginCandidate.data.token;

    const loginAdmin = await request('POST', '/api/auth/login', {
      email: 'admin@jobplatform.com',
      password: 'admin123'
    });
    assert(loginAdmin.status === 200 && loginAdmin.data.user.role === 'admin', 'Super Admin login succeeds');
    const adminToken = loginAdmin.data.token;

    const loginStaff = await request('POST', '/api/auth/login', {
      email: 'staff@jobplatform.com',
      password: 'staff123'
    });
    assert(loginStaff.status === 200 && loginStaff.data.user.role === 'staff', 'Operations Staff login succeeds');
    const staffToken = loginStaff.data.token;

    const loginAcme = await request('POST', '/api/auth/login', {
      email: 'acme@jobs.com',
      password: 'emp123'
    });
    const acmeToken = loginAcme.data.token;

    const loginGoogle = await request('POST', '/api/auth/login', {
      email: 'google@jobs.com',
      password: 'emp123'
    });
    const googleToken = loginGoogle.data.token;

    // -------------------------------------------------------------------------
    // TEST 7: Session Invalidation / Logout
    // -------------------------------------------------------------------------
    const tempLogin = await request('POST', '/api/auth/login', {
      email: 'david@candidate.com',
      password: 'candidate123'
    });
    const davidToken = tempLogin.data.token;

    // Verify token works
    const testMe1 = await request('GET', '/api/auth/me', null, davidToken);
    assert(testMe1.status === 200, 'Authenticated session functions prior to logout');

    // Call logout to revoke session
    const logoutRes = await request('POST', '/api/auth/logout', null, davidToken);
    assert(logoutRes.status === 200, 'Logout endpoint increments token version on server');

    // Verify old token is now rejected
    const testMe2 = await request('GET', '/api/auth/me', null, davidToken);
    assert(testMe2.status === 401, 'Revoked token is rejected on subsequent requests (401 Unauthorized)');

    // -------------------------------------------------------------------------
    // TEST 8: IDOR DEFENSE - Company Cannot Modify Another Company\'s Job
    // -------------------------------------------------------------------------
    // Acme tries to modify Google's Senior Frontend Developer job (job_01)
    const unauthorizedJobEdit = await request('PUT', '/api/jobs/job_01', {
      title: 'Hacked Title By Competitor'
    }, acmeToken);
    assert(
      unauthorizedJobEdit.status === 403 && unauthorizedJobEdit.data.error.includes('Forbidden'),
      'IDOR Defense: Employer A cannot modify Employer B\'s job (403 Forbidden)'
    );

    // Acme tries to delete Google's job
    const unauthorizedJobDelete = await request('DELETE', '/api/jobs/job_01', null, acmeToken);
    assert(
      unauthorizedJobDelete.status === 403,
      'IDOR Defense: Employer A cannot delete Employer B\'s job (403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 9: IDOR DEFENSE - Company Cannot Update Applications of Another Company
    // -------------------------------------------------------------------------
    // app_01 is for Google's job. Acme attempts to change status.
    const unauthorizedAppUpdate = await request('PATCH', '/api/applications/app_01/status', {
      status: 'rejected'
    }, acmeToken);
    assert(
      unauthorizedAppUpdate.status === 403,
      'IDOR Defense: Employer A cannot alter candidate application for Employer B (403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Granular RBAC - Staff vs Admin Access Restrictions
    // -------------------------------------------------------------------------
    const staffStats = await request('GET', '/api/admin/stats', null, staffToken);
    assert(
      staffStats.status === 200 &&
      staffStats.data.stats.totalRevenue === undefined &&
      staffStats.data.recentPayments.length === 0,
      'Granular RBAC: Staff role cannot view platform financial revenue or transaction ledger'
    );

    const adminStats = await request('GET', '/api/admin/stats', null, adminToken);
    assert(
      adminStats.status === 200 &&
      adminStats.data.stats.totalRevenue !== undefined &&
      adminStats.data.recentPayments.length > 0,
      'Platform Owner (Admin) has full access to financial commission ledger'
    );

    // Non-admin cannot create staff
    const staffCreateAttempt = await request('POST', '/api/admin/staff', {
      name: 'Unauthorized Staff',
      email: 'rogue@jobplatform.com',
      password: 'Password2026!'
    }, staffToken);
    assert(
      staffCreateAttempt.status === 403,
      'Only Platform Owner can provision staff accounts (Staff creating staff -> 403)'
    );

    // Admin creates staff
    const validStaffCreate = await request('POST', '/api/admin/staff', {
      name: 'Omar Mansour',
      email: 'omar_staff@jobplatform.com',
      password: 'SafeStaffPassword2026!',
      headline: 'Senior Verification Specialist'
    }, adminToken);
    assert(validStaffCreate.status === 201 && validStaffCreate.data.staffId, 'Platform Owner can provision staff accounts');

    // -------------------------------------------------------------------------
    // TEST 11: Real Payment Intent Creation & 3% Fee Calculation
    // -------------------------------------------------------------------------
    // Ahmed creates payment intent for app_01 ($120,000 salary -> 3% = $3,600)
    const paymentIntentRes = await request('POST', '/api/payments/create-intent', {
      application_id: 'app_01'
    }, candidateToken);
    assert(
      paymentIntentRes.status === 200 &&
      paymentIntentRes.data.amount === 3600 &&
      paymentIntentRes.data.commission_percentage === 3.0,
      'PaymentIntent created with exact 3% calculated fee ($3,600 on $120k salary)'
    );

    // -------------------------------------------------------------------------
    // TEST 12: Stripe Webhook Signature Verification
    // -------------------------------------------------------------------------
    console.log('\nTesting cryptographic Stripe webhook signature verification...');
    const testSecret = 'whsec_test_secret_key_jobplatform_2026_enterprise';
    const testPayload = JSON.stringify({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_stripe_9999',
          amount: 360000,
          currency: 'usd',
          metadata: { application_id: 'app_01', candidate_id: 'usr_cand_ahmed' }
        }
      }
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(`${timestamp}.${testPayload}`)
      .digest('hex');
    const validHeader = `t=${timestamp},v1=${signature}`;

    const sigValid = verifyStripeWebhookSignature(testPayload, validHeader, testSecret);
    assert(sigValid === true, 'Valid Stripe webhook signature correctly verified');

    const sigInvalid = verifyStripeWebhookSignature(testPayload, `t=${timestamp},v1=fake_signature`, testSecret);
    assert(sigInvalid === false, 'Tampered Stripe webhook signature correctly rejected');

    // -------------------------------------------------------------------------
    // TEST 13: Atomic Payment Settlement & State Transition to Hired & Paid
    // -------------------------------------------------------------------------
    const settlementRes = await request('POST', '/api/payments/checkout', {
      application_id: 'app_01',
      payment_method: 'credit_card',
      card_holder: 'Ahmed Al-Mansoor',
      card_last4: '4242'
    }, candidateToken);

    assert(
      settlementRes.status === 200 &&
      settlementRes.data.success === true &&
      settlementRes.data.payment.amount === 3600 &&
      settlementRes.data.payment.receipt_number.startsWith('RCPT-'),
      'Atomic settlement completes with verified receipt number and 3% commission recorded'
    );

    // Verify application state transitioned to 'hired' and 'paid'
    const updatedApp = db.prepare("SELECT status, payment_status FROM applications WHERE id = 'app_01'").get();
    assert(
      updatedApp.status === 'hired' && updatedApp.payment_status === 'paid',
      'Application status atomically transitioned to "hired" and payment_status to "paid"'
    );

    // -------------------------------------------------------------------------
    // TEST 14: Payment Idempotency (Prevent Duplicate Charging)
    // -------------------------------------------------------------------------
    const duplicatePayment = await request('POST', '/api/payments/checkout', {
      application_id: 'app_01',
      payment_method: 'credit_card'
    }, candidateToken);
    assert(
      duplicatePayment.status === 409 && duplicatePayment.data.error.includes('already paid'),
      'Idempotency Defense: Duplicate commission settlement rejected (409 Conflict)'
    );

    // -------------------------------------------------------------------------
    // TEST 15: File Upload Security & Magic Byte Validation
    // -------------------------------------------------------------------------
    console.log('\nTesting secure file upload & magic byte verification...');
    // Real PDF header: %PDF-1.4
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%Fake PDF content for test');
    const validPdfExt = validateMagicBytes(validPdfBuffer, 'resume');
    assert(validPdfExt === '.pdf', 'Magic byte detector correctly identifies authentic PDF file');

    // Disguised executable (.exe with fake .pdf name)
    const dangerousBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FakeEXEContent');
    const dangerousExt = validateMagicBytes(dangerousBuffer, 'resume');
    assert(dangerousExt === false, 'Magic byte detector strictly rejects disguised executable files');

    // Test real upload endpoint with authentic PDF
    const uploadRes = await request('POST', '/api/upload', {
      file_data: validPdfBuffer.toString('base64'),
      filename: 'resume_ahmed.pdf',
      type: 'resume'
    }, candidateToken);
    assert(
      uploadRes.status === 201 && uploadRes.data.file.url.endsWith('.pdf'),
      'Secure resume upload succeeds and stores safely with unique name'
    );

    // -------------------------------------------------------------------------
    // TEST 16: Job Creation, Daily Gig Filter & Location Search
    // -------------------------------------------------------------------------
    const dailyGigJob = await request('POST', '/api/jobs', {
      title: 'High-Altitude Wind Turbine Technician - Daily Shift',
      category: 'Trades & Industry',
      job_type: 'daily_gig',
      workplace_type: 'on_site',
      location: 'Frankfurt, Germany',
      salary_min: 280,
      salary_max: 380,
      rate_period: 'day',
      currency: 'EUR',
      experience_level: 'senior',
      description: 'Certified technicians for wind turbine blade inspection shifts.'
    }, acmeToken);
    assert(dailyGigJob.status === 201 && dailyGigJob.data.jobId, 'Employer publishes verified daily gig posting');

    const searchDaily = await request('GET', '/api/jobs?job_type=daily_gig');
    assert(
      searchDaily.status === 200 &&
      searchDaily.data.jobs.some(j => j.id === dailyGigJob.data.jobId),
      'Daily Gig filter correctly isolates daily shift opportunities'
    );

    // -------------------------------------------------------------------------
    // TEST 17: User Profile Update
    // -------------------------------------------------------------------------
    const updateProfileRes = await request('PUT', '/api/users/profile', {
      headline: 'Principal Cloud & Distributed Systems Architect',
      skills: 'React, Node.js, Go, Kubernetes, Cryptography',
      experience_years: 10
    }, candidateToken);
    assert(
      updateProfileRes.status === 200 && updateProfileRes.data.user.experience_years === 10,
      'Candidate successfully updates professional profile and skills'
    );

    // -------------------------------------------------------------------------
    // TEST 18: Static Assets & Web Application Delivery
    // -------------------------------------------------------------------------
    const indexCheck = await request('GET', '/');
    assert(indexCheck.status === 200 && indexCheck.raw.includes('JobPlatform'), 'Static master HTML served with 200 OK');

    const cssCheck = await request('GET', '/css/styles.css');
    assert(cssCheck.status === 200 && cssCheck.raw.includes('--bg-primary'), 'Static CSS design system served with 200 OK');

    console.log(`\n======================================================`);
    console.log(`PRODUCTION TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL ENTERPRISE SECURITY, PAYMENT & RBAC TESTS PASSED 100%!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTests();
