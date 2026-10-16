# JobPlatform Global - Enterprise Recruitment & Gig Platform

A high-performance, enterprise-grade global job and daily gig platform built from first principles with **zero external runtime npm dependencies**, leveraging Node.js 24 native capabilities (`node:sqlite`, `node:crypto`, `node:stream`).

---

## 🌟 Key Features

1. **Universal Job & Gig Support**
   - **Full-Time Opportunities**: Long-term career roles across tech, healthcare, finance, and engineering.
   - **Daily Gigs (مياومة)**: Short shifts and daily on-demand work with hourly/daily payouts and instant scheduling.
   - **Workplace Modes**: Remote, Hybrid, and On-Site with worldwide multi-currency support (USD, SAR, AED, EUR, GBP).

2. **Automated Platform Commission (3% Escrow Model)**
   - When an employer extends an offer and the candidate accepts, the agreed platform commission (default 3.0%) is processed.
   - Built-in Stripe PaymentIntent integration and cryptographically verified Webhooks.
   - Atomic escrow transactions with verified receipt generation and idempotency defense against double-charges.

3. **Enterprise Role-Based Access Control (RBAC)**
   - **Platform Owner (Super Admin)**: Full administrative authority, financial ledger visibility, commission adjustment, and staff provisioning.
   - **Operations Staff**: Job posting moderation, candidate verification, and dispute resolution. Financial revenue is strictly withheld server-side.
   - **Employers & Companies**: Post, edit, and close listings; review candidates; change application stages (Review, Interview, Offer, Hired).
   - **Candidates / Talent**: Browse global listings, apply with resume attachments, track application lifecycle, and pay hiring commissions.

4. **Critical Security & Hardening**
   - **Strict Registration Filtering**: Public registration endpoints strictly forbid self-assigning `admin` or `staff` roles.
   - **Secure Admin Provisioning**: The initial Super Admin must be created via the secure CLI tool (`npm run create-admin`).
   - **IDOR Defense**: Server-side checks ensure companies cannot view, modify, or delete listings or applicants belonging to others.
   - **Session Revocation**: Password changes or logouts increment the user's `token_version`, immediately invalidating active JWT tokens.
   - **Brute-Force Protection**: IP/Account lockout after 5 consecutive failed login attempts (15-minute cooldown).
   - **Magic Byte File Verification**: Uploaded resumes (`.pdf`, `.docx`) and logos (`.png`, `.jpg`, `.webp`, `.svg`) are inspected by byte signatures to reject disguised executables.

5. **Responsive & Arabic/English Internationalization (RTL/LTR)**
   - Fully bi-directional interface (RTL for Arabic, LTR for English).
   - Clean, professional design system following executive navy/cobalt/slate palette.
   - Fully responsive across desktop, tablet, and mobile screens.

---

## 🏗️ Architecture & Tech Stack

```
jobplatform-global/
├── server.js               # Enterprise REST API and static HTTP server
├── auth.js                 # Cryptographic scrypt hashing, JWT HMAC-SHA256, RBAC
├── payments.js             # Real Stripe API client, webhook verification, escrow
├── uploads.js              # Magic-byte file validation, resume & logo handler
├── db.js                   # Node 24 SQLite sync database interface
├── seed.js                 # Realistic seed database generator
├── test_suite.js           # 33-step automated QA test suite (Security, RBAC, Payments)
├── .env.example            # Production environment template
├── backups/                # Automated snapshot backup store
├── migrations/
│   ├── 001_security_and_payments.js  # Non-destructive schema migration
│   └── runner.js                     # Migration runner
├── scripts/
│   ├── create_admin.js     # Secure Super Admin provisioning CLI
│   └── backup_db.js        # Instant SQLite database snapshot creator
└── public/                 # Vanilla JS SPA (No build step required)
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── app.js          # Reactive router, I18N, state management
        ├── icons.js        # Crisp inline SVG icon set
        └── components/     # Modals, Dashboards, Details, Payment Flow
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: Version `>= 22.0.0` (Node 24 recommended).
- **SQLite**: Native engine is built into Node 24 (`node:sqlite`).

### 1. Installation
Clone the repository and inspect the dependencies (zero external npm runtime dependencies required):
```bash
cd jobplatform-global
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your keys:
```env
PORT=5050
NODE_ENV=production
APP_SECRET=your-random-64-char-cryptographic-secret
JWT_SECRET=your-random-64-char-jwt-secret
DEFAULT_COMMISSION_RATE=3.0

# Stripe Live / Test Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Apply Safe Database Migrations
```bash
npm run migrate
```

### 4. Create Initial Super Admin
Provision the primary platform administrator securely via CLI:
```bash
npm run create-admin -- --email="owner@jobplatform.com" --name="Platform Owner" --password="YourSecurePassword123!"
```

### 5. Start the Server
- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Mode**:
  ```bash
  npm run dev
  ```
Access the application at: `http://localhost:5050`

---

## 🧪 Automated Testing & Verification

Run the comprehensive 33-step test suite covering:
- Administrative role escalation prevention
- Brute-force lockout and rate limiting
- Session token revocation on logout/password change
- IDOR protection across jobs and applications
- Granular RBAC data visibility (Admin vs Staff)
- Stripe webhook cryptographic signature verification
- Atomic escrow settlement and idempotency defense
- File upload magic-byte verification

```bash
npm test
```
**Expected Output:**
```
======================================================
PRODUCTION TEST SUITE RESULTS: 33 PASSED, 0 FAILED
======================================================
🎉 ALL ENTERPRISE SECURITY, PAYMENT & RBAC TESTS PASSED 100%!
```

---

## 🛡️ Administrative & Maintenance Scripts

### Create Automated Backup
Creates an encrypted/isolated timestamped snapshot in `backups/`:
```bash
npm run backup
```

### Reset / Reseed Demo Data (Development Only)
```bash
npm run seed
```

---

## 🌐 Production Deployment Architecture

For deployment on Linux / macOS servers:

### 1. Reverse Proxy (Nginx)
Configure Nginx as a reverse proxy with TLS:
```nginx
server {
    listen 443 ssl http2;
    server_name jobs.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/jobs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobs.yourdomain.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Process Management (PM2 or Systemd)
```bash
npm install -g pm2
pm2 start server.js --name "jobplatform"
pm2 save
pm2 startup
```

---

## 💳 Stripe Webhook Configuration

1. In the **Stripe Dashboard**, navigate to **Developers > Webhooks**.
2. Add a new endpoint pointing to:
   `https://jobs.yourdomain.com/api/payments/webhook`
3. Select the event:
   - `payment_intent.succeeded`
4. Copy the Signing Secret (`whsec_...`) into your `.env` file under `STRIPE_WEBHOOK_SECRET`.

---

## 💼 Cost Analysis & External Services

| Service | Purpose | Approximate Cost |
| :--- | :--- | :--- |
| **VPS / Cloud Hosting** | Node.js + SQLite runtime (Hetzner / DigitalOcean / AWS Lightsail) | \$4 - \$12 / month |
| **Domain Name** | Custom `.com` or `.io` domain | \$10 - \$15 / year |
| **SSL Certificate** | Let's Encrypt automated TLS | **Free (\$0)** |
| **Stripe Gateway** | Credit/Debit processing (per transaction) | 2.9% + \$0.30 per charge (covered by 3% commission) |
| **Database Engine** | Native Node 24 SQLite sync engine | **Free (\$0)** - No monthly database hosting fee |
| **Total Baseline Operating Cost** | **~\$5 - \$15 / month** |

---

## 📄 License & Compliance
This software is designed for enterprise recruitment and escrow operations. Built in accordance with modern OWASP Top 10 security standards and PCI-DSS compliance guidelines.
