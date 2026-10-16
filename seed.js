// seed.js - Seed comprehensive realistic global job platform data
const crypto = require('node:crypto');
const { db, initSchema } = require('./db.js');
const { hashPassword } = require('./auth.js');

function seedDatabase() {
  initSchema();

  // Clean existing data
  db.exec(`
    DELETE FROM payments;
    DELETE FROM saved_jobs;
    DELETE FROM applications;
    DELETE FROM jobs;
    DELETE FROM companies;
    DELETE FROM users;
    DELETE FROM audit_logs;
  `);

  console.log('Seeding users...');
  const now = new Date().toISOString();

  // 1. Users
  const users = [
    {
      id: 'usr_admin_01',
      name: 'Super Administrator',
      email: 'admin@jobplatform.com',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      phone: '+1 555-0100',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      headline: 'Platform Owner & Global Operations Lead',
      bio: 'Overseeing global platform compliance, revenue models, and trust & safety.',
      created_at: now
    },
    {
      id: 'usr_staff_01',
      name: 'Layla Al-Harbi',
      email: 'staff@jobplatform.com',
      password_hash: hashPassword('staff123'),
      role: 'staff',
      phone: '+966 50 111 2233',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      headline: 'Senior Verification Officer & Moderator',
      bio: 'Reviewing job postings, verifying enterprise employers, and mediating dispute resolutions.',
      created_at: now
    },
    // Employers
    {
      id: 'usr_emp_google',
      name: 'Google Talent Team',
      email: 'google@jobs.com',
      password_hash: hashPassword('emp123'),
      role: 'employer',
      phone: '+1 650-253-0000',
      avatar: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
      headline: 'Head of Global Engineering Recruitment',
      bio: 'Building the next generation of cloud and web experiences.',
      created_at: now
    },
    {
      id: 'usr_emp_microsoft',
      name: 'Microsoft Careers',
      email: 'microsoft@jobs.com',
      password_hash: hashPassword('emp123'),
      role: 'employer',
      phone: '+1 425-882-8080',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      headline: 'Enterprise Talent Director',
      bio: 'Empowering every person and organization on the planet to achieve more.',
      created_at: now
    },
    {
      id: 'usr_emp_acme',
      name: 'Acme Industrial & Trades',
      email: 'acme@jobs.com',
      password_hash: hashPassword('emp123'),
      role: 'employer',
      phone: '+971 4 333 4455',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      headline: 'Operations & Contracting Director',
      bio: 'Global infrastructure, industrial construction, and on-demand daily trade workforce.',
      created_at: now
    },
    {
      id: 'usr_emp_apex_health',
      name: 'Apex Global Healthcare',
      email: 'apexhealth@jobs.com',
      password_hash: hashPassword('emp123'),
      role: 'employer',
      phone: '+44 20 7946 0991',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      headline: 'Medical Staffing Director',
      bio: 'Providing elite medical personnel and daily clinical coverage worldwide.',
      created_at: now
    },
    // Candidates
    {
      id: 'usr_cand_ahmed',
      name: 'Ahmed Al-Mansoor',
      email: 'ahmed@candidate.com',
      password_hash: hashPassword('candidate123'),
      role: 'candidate',
      phone: '+966 54 888 9900',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      headline: 'Senior Full Stack & Frontend Architect',
      bio: '8+ years crafting resilient, accessible, and fast web applications. Experienced in React, TypeScript, Node.js, and cloud systems.',
      created_at: now
    },
    {
      id: 'usr_cand_sarah',
      name: 'Sarah Johnson',
      email: 'sarah@candidate.com',
      password_hash: hashPassword('candidate123'),
      role: 'candidate',
      phone: '+1 212-555-0199',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      headline: 'Lead Product & UX Designer',
      bio: 'Design systems specialist, creating intuitive and accessible interfaces for millions of users worldwide.',
      created_at: now
    },
    {
      id: 'usr_cand_david',
      name: 'David Kim',
      email: 'david@candidate.com',
      password_hash: hashPassword('candidate123'),
      role: 'candidate',
      phone: '+1 312-555-4321',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      headline: 'Master Certified Electrician & Daily Trade Specialist',
      bio: 'Licensed high-voltage and industrial automation technician available for daily shifts, emergency contracts, and large facilities.',
      created_at: now
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, avatar, headline, bio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.phone, u.avatar, u.headline, u.bio, u.created_at));

  console.log('Seeding companies...');
  // 2. Companies
  const companies = [
    {
      id: 'cmp_google',
      user_id: 'usr_emp_google',
      name: 'Google LLC',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      website: 'https://careers.google.com',
      industry: 'Technology',
      size: '100,000+ employees',
      location: 'Mountain View, California, USA',
      description: 'Google’s mission is to organize the world’s information and make it universally accessible and useful.',
      verified: 1,
      created_at: now
    },
    {
      id: 'cmp_microsoft',
      user_id: 'usr_emp_microsoft',
      name: 'Microsoft Corporation',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
      website: 'https://careers.microsoft.com',
      industry: 'Technology',
      size: '150,000+ employees',
      location: 'Redmond, Washington, USA',
      description: 'We strive to create local opportunity, growth, and impact in every country around the world.',
      verified: 1,
      created_at: now
    },
    {
      id: 'cmp_acme',
      user_id: 'usr_emp_acme',
      name: 'Acme Industrial & Global Trades',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80',
      website: 'https://acme-global.com',
      industry: 'Construction & Trades',
      size: '10,000+ workers',
      location: 'Dubai, United Arab Emirates',
      description: 'Leading provider of heavy engineering, specialized trade staffing, and daily skilled contractor deployment across the MENA and EU regions.',
      verified: 1,
      created_at: now
    },
    {
      id: 'cmp_apex',
      user_id: 'usr_emp_apex_health',
      name: 'Apex Global Healthcare Network',
      logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=80',
      website: 'https://apexhealthcare.org',
      industry: 'Healthcare',
      size: '25,000+ clinical staff',
      location: 'London, United Kingdom',
      description: 'International hospital management group operating world-class healthcare centers and emergency daily locum medical staffing.',
      verified: 1,
      created_at: now
    }
  ];

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, user_id, name, logo, website, industry, size, location, description, verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  companies.forEach(c => insertCompany.run(c.id, c.user_id, c.name, c.logo, c.website, c.industry, c.size, c.location, c.description, c.verified, c.created_at));

  console.log('Seeding jobs...');
  // 3. Jobs (Including Full-time & Daily Gigs across all sectors)
  const jobs = [
    {
      id: 'job_01',
      company_id: 'cmp_google',
      title: 'Senior Frontend Developer',
      category: 'Technology',
      job_type: 'full_time',
      workplace_type: 'remote',
      location: 'Worldwide Remote',
      salary_min: 120000,
      salary_max: 160000,
      rate_period: 'year',
      currency: 'USD',
      experience_level: 'senior',
      description: 'We are looking for a Senior Frontend Developer to join our team and help build the next generation of web applications. You will work with modern technologies and collaborate with cross-functional teams to create amazing user experiences.',
      responsibilities: JSON.stringify([
        'Build responsive, fast, and accessible web applications',
        'Work closely with design, product, and backend engineering teams',
        'Write clean, maintainable, and well-tested code',
        'Participate in code reviews, technical architecture sessions, and mentor junior engineers'
      ]),
      requirements: JSON.stringify([
        '5+ years of production frontend development experience',
        'Deep mastery of modern JavaScript, TypeScript, React, and CSS architecture',
        'Proven track record with performance optimization and web accessibility (WCAG 2.1 AA)',
        'Strong asynchronous API integration and state management skills'
      ]),
      benefits: JSON.stringify([
        'Competitive equity & annual performance bonuses',
        '100% remote workspace allowance and home office stipend',
        'Comprehensive family healthcare, dental, and vision insurance',
        'Annual educational and conference learning budget'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 1,
      views_count: 1420,
      created_at: now
    },
    {
      id: 'job_02',
      company_id: 'cmp_microsoft',
      title: 'Backend Engineer (Cloud & Microservices)',
      category: 'Technology',
      job_type: 'full_time',
      workplace_type: 'hybrid',
      location: 'Redmond, WA, USA (Hybrid)',
      salary_min: 130000,
      salary_max: 170000,
      rate_period: 'year',
      currency: 'USD',
      experience_level: 'senior',
      description: 'Join Azure core services to architect hyper-scale distributed backends handling billions of daily transactions with zero downtime tolerance.',
      responsibilities: JSON.stringify([
        'Design resilient microservices using Go, Node.js, and C#',
        'Optimize high-throughput relational and NoSQL databases',
        'Implement automated CI/CD and infrastructure-as-code deployments'
      ]),
      requirements: JSON.stringify([
        '4+ years backend systems architecture experience',
        'Proficiency with Kubernetes, Docker, and distributed message queues',
        'Strong understanding of cryptographic protocols and network security'
      ]),
      benefits: JSON.stringify([
        'Relocation support package',
        '401(k) matching up to 50%',
        'On-site wellness and fitness facilities'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 1,
      views_count: 980,
      created_at: now
    },
    {
      id: 'job_03',
      company_id: 'cmp_acme',
      title: 'Certified Master Electrician - High Voltage Substation',
      category: 'Trades & Industry',
      job_type: 'daily_gig',
      workplace_type: 'on_site',
      location: 'Dubai Industrial City, UAE',
      salary_min: 250,
      salary_max: 350,
      rate_period: 'day',
      currency: 'USD',
      experience_level: 'senior',
      description: 'Immediate daily gig contract for certified high-voltage industrial electricians. Perform planned diagnostic overhaul and transformer calibration across a 10-day sprint with instant daily disbursement.',
      responsibilities: JSON.stringify([
        'Conduct diagnostic sweeps on 33kV switchgear and industrial transformers',
        'Perform cable terminations, insulation resistance tests, and circuit breaker tests',
        'Log daily safety and compliance permits with project managers'
      ]),
      requirements: JSON.stringify([
        'Valid industrial electrician certification / diploma',
        'Minimum 3 years high-voltage substation experience',
        'Strict adherence to OSHA / NFPA 70E electrical safety standards'
      ]),
      benefits: JSON.stringify([
        'Daily end-of-shift payment guaranteed through platform escrow',
        'Site transport and catered meals provided',
        'Complete high-grade PPE and calibrated diagnostic tooling supplied on-site'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 1,
      views_count: 840,
      created_at: now
    },
    {
      id: 'job_04',
      company_id: 'cmp_apex',
      title: 'Critical Care ICU Registered Nurse',
      category: 'Healthcare',
      job_type: 'full_time',
      workplace_type: 'on_site',
      location: 'London, United Kingdom',
      salary_min: 52000,
      salary_max: 68000,
      rate_period: 'year',
      currency: 'GBP',
      experience_level: 'mid',
      description: 'Deliver specialized bedside patient care within a high-acuity intensive care unit. Collaborate with multi-disciplinary physicians and respiratory therapists.',
      responsibilities: JSON.stringify([
        'Monitor hemodynamic parameters and manage advanced mechanical ventilation',
        'Administer titrated vasoactive infusions and emergency medication protocols',
        'Provide compassionate family communication and discharge counseling'
      ]),
      requirements: JSON.stringify([
        'NMC registration with current PIN or international equivalent',
        'At least 2 years post-registration intensive care experience',
        'BLS & ACLS current certifications'
      ]),
      benefits: JSON.stringify([
        'NHS pension enrollment eligibility',
        'Visa sponsorship assistance for qualified international applicants',
        '27 days annual paid leave + bank holidays'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 0,
      views_count: 610,
      created_at: now
    },
    {
      id: 'job_05',
      company_id: 'cmp_acme',
      title: 'Commercial HVAC Technician (Daily On-Demand Shift)',
      category: 'Trades & Industry',
      job_type: 'daily_gig',
      workplace_type: 'on_site',
      location: 'Riyadh, Saudi Arabia',
      salary_min: 190,
      salary_max: 260,
      rate_period: 'day',
      currency: 'USD',
      experience_level: 'mid',
      description: 'Urgent daily shift work for commercial chiller servicing and air handling unit diagnostics for a major commercial tower.',
      responsibilities: JSON.stringify([
        'Service centrifugal water chillers and replace variable frequency drives',
        'Refrigerant leak detection and system evacuation'
      ]),
      requirements: JSON.stringify([
        'EPA Section 608 Universal or local engineering equivalent',
        '2+ years commercial HVAC troubleshooting experience'
      ]),
      benefits: JSON.stringify([
        'Same-day electronic payment',
        'Overtime bonus beyond 8 hours (+50% hourly rate)'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 0,
      views_count: 420,
      created_at: now
    },
    {
      id: 'job_06',
      company_id: 'cmp_google',
      title: 'Global Product Marketing Specialist',
      category: 'Marketing',
      job_type: 'full_time',
      workplace_type: 'remote',
      location: 'Worldwide Remote',
      salary_min: 75000,
      salary_max: 110000,
      rate_period: 'year',
      currency: 'USD',
      experience_level: 'mid',
      description: 'Lead omnichannel go-to-market strategies, campaign execution, and competitive market positioning across global developer ecosystems.',
      responsibilities: JSON.stringify([
        'Develop product messaging, value propositions, and sales enablement collateral',
        'Orchestrate multi-region launch campaigns across social, email, and digital media',
        'Analyze conversion funnels and customer acquisition costs'
      ]),
      requirements: JSON.stringify([
        '3+ years B2B tech marketing experience',
        'Demonstrated expertise with analytics (Google Analytics 4, Mixpanel, SQL)',
        'Flawless written and oral communication skills in English'
      ]),
      benefits: JSON.stringify([
        'Flexible hours across any global timezone',
        'Health and mental wellness support programs',
        'Generous paid parental leave'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 1,
      views_count: 730,
      created_at: now
    },
    {
      id: 'job_07',
      company_id: 'cmp_microsoft',
      title: 'Senior Data Analyst & BI Architect',
      category: 'Technology',
      job_type: 'full_time',
      workplace_type: 'remote',
      location: 'New York, USA / Remote',
      salary_min: 95000,
      salary_max: 135000,
      rate_period: 'year',
      currency: 'USD',
      experience_level: 'senior',
      description: 'Transform complex user activity data into actionable operational insights for global executive stakeholders.',
      responsibilities: JSON.stringify([
        'Build semantic layers and enterprise PowerBI / Tableau dashboards',
        'Author robust SQL transformation pipelines in Snowflake / BigQuery',
        'Collaborate with product squads to define success metrics'
      ]),
      requirements: JSON.stringify([
        '4+ years in data analytics or business intelligence',
        'Advanced SQL and Python data manipulation (Pandas, Polars)',
        'Clear ability to translate numbers into compelling business narratives'
      ]),
      benefits: JSON.stringify([
        'Stock purchase program with 15% discount',
        'Home internet and cellular phone reimbursement'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 0,
      views_count: 530,
      created_at: now
    },
    {
      id: 'job_08',
      company_id: 'cmp_acme',
      title: 'Fleet Logistics Driver & Heavy Cargo Escort',
      category: 'Logistics',
      job_type: 'daily_gig',
      workplace_type: 'on_site',
      location: 'Frankfurt, Germany',
      salary_min: 170,
      salary_max: 230,
      rate_period: 'day',
      currency: 'EUR',
      experience_level: 'mid',
      description: 'Daily gig assignment for certified commercial heavy vehicle drivers handling intermodal container transfer between terminals.',
      responsibilities: JSON.stringify([
        'Operate heavy combination vehicles in compliance with EU driving hours regulations',
        'Inspect freight tie-downs, axle load balance, and electronic bills of lading'
      ]),
      requirements: JSON.stringify([
        'Valid EU Class CE driver license with Driver CPC Card',
        'Clean driving record with no major infractions in last 3 years'
      ]),
      benefits: JSON.stringify([
        'Daily compensation with instant digital transfer upon route sign-off',
        'Modern Mercedes Actros fleet with lane assist and ergonomic seating'
      ]),
      commission_rate: 3.0,
      status: 'active',
      featured: 0,
      views_count: 360,
      created_at: now
    }
  ];

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, company_id, title, category, job_type, workplace_type, location,
      salary_min, salary_max, rate_period, currency, experience_level,
      description, responsibilities, requirements, benefits, commission_rate,
      status, featured, views_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  jobs.forEach(j => insertJob.run(
    j.id, j.company_id, j.title, j.category, j.job_type, j.workplace_type, j.location,
    j.salary_min, j.salary_max, j.rate_period, j.currency, j.experience_level,
    j.description, j.responsibilities, j.requirements, j.benefits, j.commission_rate,
    j.status, j.featured, j.views_count, j.created_at
  ));

  console.log('Seeding applications...');
  // 4. Applications (With various stages: Offer, Interview, Under Review, Hired/Paid)
  const applications = [
    {
      id: 'app_01',
      job_id: 'job_01', // Senior Frontend at Google
      candidate_id: 'usr_cand_ahmed',
      cover_letter: 'I have 8 years of specialized React/TypeScript experience and have led high-traffic production migrations. I would love to bring my expertise to Google.',
      resume_url: '/resumes/ahmed_almansoor_cv.pdf',
      status: 'offer',
      offer_salary: 120000,
      commission_amount: 3600, // 3% of 120,000
      payment_status: 'unpaid', // READY TO TEST COMMISSION PAYMENT FLOW!
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-15T14:30:00Z'
    },
    {
      id: 'app_02',
      job_id: 'job_02', // Backend at Microsoft
      candidate_id: 'usr_cand_ahmed',
      cover_letter: 'Strong background in cloud microservices and scalable Go backends.',
      resume_url: '/resumes/ahmed_almansoor_cv.pdf',
      status: 'interview',
      offer_salary: null,
      commission_amount: null,
      payment_status: 'unpaid',
      created_at: '2026-10-11T09:15:00Z',
      updated_at: '2026-10-14T11:00:00Z'
    },
    {
      id: 'app_03',
      job_id: 'job_07', // Data Analyst at Microsoft
      candidate_id: 'usr_cand_ahmed',
      cover_letter: 'Applying my analytical thinking and Python automation skills.',
      resume_url: '/resumes/ahmed_almansoor_cv.pdf',
      status: 'under_review',
      offer_salary: null,
      commission_amount: null,
      payment_status: 'unpaid',
      created_at: '2026-10-13T16:20:00Z',
      updated_at: '2026-10-13T16:20:00Z'
    },
    {
      id: 'app_04',
      job_id: 'job_03', // Master Electrician at Acme
      candidate_id: 'usr_cand_david',
      cover_letter: 'Certified high voltage electrician available immediately for the 10-day substation overhaul.',
      resume_url: '/resumes/david_kim_license.pdf',
      status: 'offer',
      offer_salary: 2500, // 10 days x $250
      commission_amount: 75, // 3% of $2,500
      payment_status: 'unpaid',
      created_at: '2026-10-12T08:00:00Z',
      updated_at: '2026-10-14T09:00:00Z'
    },
    {
      id: 'app_05',
      job_id: 'job_06', // Marketing at Google
      candidate_id: 'usr_cand_sarah',
      cover_letter: 'Extensive product storytelling and international campaign management.',
      resume_url: '/resumes/sarah_johnson_cv.pdf',
      status: 'hired',
      offer_salary: 85000,
      commission_amount: 2550, // 3% of 85,000
      payment_status: 'paid', // Completed payment
      created_at: '2026-09-20T11:00:00Z',
      updated_at: '2026-10-01T15:00:00Z'
    }
  ];

  const insertApp = db.prepare(`
    INSERT INTO applications (
      id, job_id, candidate_id, cover_letter, resume_url, status,
      offer_salary, commission_amount, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  applications.forEach(a => insertApp.run(
    a.id, a.job_id, a.candidate_id, a.cover_letter, a.resume_url, a.status,
    a.offer_salary, a.commission_amount, a.payment_status, a.created_at, a.updated_at
  ));

  console.log('Seeding completed payments & transactions...');
  // 5. Existing Completed Payment for Sarah
  const insertPayment = db.prepare(`
    INSERT INTO payments (
      id, transaction_id, application_id, payer_id, amount, currency,
      commission_percentage, payment_method, status, receipt_number, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run(
    'pay_init_01',
    'TXN-984214-GLOBAL',
    'app_05',
    'usr_cand_sarah',
    2550.00,
    'USD',
    3.0,
    'credit_card',
    'completed',
    'RCPT-2026-00912',
    '2026-10-01T15:05:00Z'
  );

  // 6. Saved jobs for Ahmed
  const insertSaved = db.prepare(`INSERT INTO saved_jobs (candidate_id, job_id, created_at) VALUES (?, ?, ?)`);
  insertSaved.run('usr_cand_ahmed', 'job_01', now);
  insertSaved.run('usr_cand_ahmed', 'job_06', now);

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
