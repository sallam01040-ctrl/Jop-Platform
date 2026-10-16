// payments.js - Real Payment Gateway (Stripe) Integration & Escrow Commission Engine
const https = require('node:https');
const crypto = require('node:crypto');
const { db } = require('./db.js');

/**
 * Make an authenticated HTTPS call to Stripe API
 */
function callStripeAPI(endpoint, method = 'POST', postData = null) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment.');
  }

  return new Promise((resolve, reject) => {
    const url = new URL('https://api.stripe.com/v1' + endpoint);
    const bodyString = postData ? new URLSearchParams(postData).toString() : '';

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16'
      }
    };

    if (bodyString) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error ? parsed.error.message : `Stripe API error (${res.statusCode})`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Stripe response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
}

/**
 * Verify Stripe Webhook Signature according to Stripe Specification
 * Header format: t=timestamp,v1=signature
 */
function verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(',');
  let timestamp = null;
  let signature = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key.trim() === 't') timestamp = value.trim();
    if (key.trim() === 'v1') signature = value.trim();
  }

  if (!timestamp || !signature) return false;

  // Protect against replay attacks (5 minutes tolerance)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    console.warn('[Security] Webhook timestamp outside 5-minute tolerance window.');
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Create a Stripe PaymentIntent for the 3% platform commission
 */
async function createCommissionPaymentIntent(applicationId, candidateId) {
  const app = db.prepare(`
    SELECT 
      a.*, 
      j.title as job_title, 
      j.commission_rate, 
      j.currency,
      j.job_type,
      j.salary_min,
      j.salary_max,
      c.name as company_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.id = ?
  `).get(applicationId);

  if (!app) {
    throw new Error('Application record not found');
  }

  if (app.candidate_id !== candidateId) {
    throw new Error('Unauthorized: You can only settle commissions for your own job applications.');
  }

  if (app.status !== 'offer' && app.status !== 'hired') {
    throw new Error(`Cannot pay commission: application is in status '${app.status}'. An official offer must be extended first.`);
  }

  if (app.payment_status === 'paid') {
    throw new Error('Platform commission for this position has already been paid and settled.');
  }

  // Calculate 3% commission
  let amount = app.commission_amount;
  if (!amount || amount <= 0) {
    const baseSalary = app.offer_salary || app.salary_min || 50000;
    const rate = app.commission_rate || 3.0;
    amount = Math.round((baseSalary * (rate / 100)) * 100) / 100;
  }

  const currency = (app.currency || 'USD').toLowerCase();
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  // If Stripe Secret is configured, create live PaymentIntent via Stripe API
  if (stripeSecret) {
    try {
      const smallestUnitAmount = Math.round(amount * 100);
      const idempotencyKey = `idemp_${app.id}_${candidateId}_${smallestUnitAmount}`;

      const stripeIntent = await callStripeAPI('/payment_intents', 'POST', {
        amount: smallestUnitAmount,
        currency,
        'metadata[application_id]': app.id,
        'metadata[candidate_id]': candidateId,
        'metadata[job_id]': app.job_id,
        'metadata[fee_type]': 'platform_commission_3_percent',
        'description': `3% Platform Commission for: ${app.job_title} at ${app.company_name}`,
        'payment_method_types[]': 'card'
      });

      return {
        payment_intent_id: stripeIntent.id,
        client_secret: stripeIntent.client_secret,
        amount,
        currency: currency.toUpperCase(),
        commission_percentage: app.commission_rate || 3.0,
        provider: 'stripe',
        live_mode: true
      };
    } catch (stripeErr) {
      console.error('Stripe PaymentIntent error:', stripeErr);
      throw new Error(`Payment Gateway Error: ${stripeErr.message}`);
    }
  }

  // If Stripe Secret is NOT configured:
  if (isProduction) {
    throw new Error('Payment gateway configuration missing. STRIPE_SECRET_KEY must be set in production to process transactions.');
  }

  // In Development / Test Mode: return instructions and simulation handle
  return {
    payment_intent_id: 'pi_test_' + crypto.randomUUID().slice(0, 12),
    client_secret: 'pi_test_secret_' + crypto.randomUUID(),
    amount,
    currency: currency.toUpperCase(),
    commission_percentage: app.commission_rate || 3.0,
    provider: 'stripe_test_mode',
    live_mode: false,
    configuration_notice: 'Running in development mode without live STRIPE_SECRET_KEY. See .env.example to enable live Stripe processing.'
  };
}

/**
 * Execute verified payment settlement in an atomic SQLite transaction
 */
function settleVerifiedPayment({
  transactionId,
  applicationId,
  payerId,
  amount,
  currency,
  paymentMethod = 'credit_card',
  provider = 'stripe',
  receiptUrl = null,
  cardDetails = null
}) {
  const now = new Date().toISOString();

  // Check if already settled
  const existingPayment = db.prepare('SELECT id, status FROM payments WHERE transaction_id = ?').get(transactionId);
  if (existingPayment) {
    console.log(`[Payment] Transaction ${transactionId} already recorded (Idempotent).`);
    return existingPayment;
  }

  const app = db.prepare(`
    SELECT a.*, j.title as job_title, c.name as company_name, j.commission_rate 
    FROM applications a 
    JOIN jobs j ON a.job_id = j.id 
    JOIN companies c ON j.company_id = c.id 
    WHERE a.id = ?
  `).get(applicationId);

  if (!app) {
    throw new Error(`Application ${applicationId} not found during payment settlement`);
  }

  const paymentId = 'pay_' + crypto.randomUUID().slice(0, 8);
  const receiptNumber = 'RCPT-2026-' + Math.floor(100000 + Math.random() * 900000);

  // ATOMIC DATABASE TRANSACTION
  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Insert Payment Record (NEVER storing raw cards or CVV!)
    db.prepare(`
      INSERT INTO payments (
        id, transaction_id, application_id, payer_id, amount, currency,
        commission_percentage, payment_method, status, receipt_number,
        provider, provider_payment_intent_id, payment_method_details, receipt_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      transactionId,
      applicationId,
      payerId,
      parseFloat(amount),
      currency.toUpperCase(),
      app.commission_rate || 3.0,
      paymentMethod,
      receiptNumber,
      provider,
      transactionId,
      cardDetails ? JSON.stringify(cardDetails) : null,
      receiptUrl,
      now
    );

    // 2. Transition Application Status to HIRED & PAID
    db.prepare(`
      UPDATE applications 
      SET status = 'hired', payment_status = 'paid', commission_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(parseFloat(amount), now, applicationId);

    // 3. Log Audit
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'PAYMENT_SETTLED_VERIFIED', ?, ?)
    `).run(
      'aud_' + crypto.randomUUID(),
      payerId,
      `Settled 3% commission of ${amount} ${currency} for App: ${applicationId}. Txn: ${transactionId}`,
      now
    );

    db.exec('COMMIT;');

    console.log(`[Payment] Successfully settled transaction ${transactionId} for application ${applicationId}`);

    return {
      id: paymentId,
      transaction_id: transactionId,
      receipt_number: receiptNumber,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      status: 'completed',
      created_at: now,
      job_title: app.job_title,
      company_name: app.company_name
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[Payment] Settlement transaction rolled back:', err);
    throw err;
  }
}

module.exports = {
  createCommissionPaymentIntent,
  verifyStripeWebhookSignature,
  settleVerifiedPayment
};
