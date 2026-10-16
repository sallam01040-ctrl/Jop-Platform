// home.js - Landing Page matching User Mockup (Top-Left & Security & Performance)
window.renderHomePage = async function() {
  const isArabic = window.AppState.lang === 'ar';

  // Fetch live stats & featured jobs
  let stats = { totalJobs: '1M+', totalCompanies: '500K+', totalCandidates: '10M+', dailyGigsCount: '45K+' };
  let featuredJobs = [];

  try {
    const meta = await window.API.getStats();
    if (meta) {
      stats.totalJobs = meta.totalJobs + '+ Active';
      stats.totalCompanies = meta.totalCompanies + '+ Global';
      stats.totalCandidates = meta.totalCandidates + '+ Verified';
      stats.dailyGigsCount = meta.dailyGigsCount + ' Shifts Today';
    }
    const jobsRes = await window.API.getJobs({ sort: 'salary_high' });
    if (jobsRes && jobsRes.jobs) {
      featuredJobs = jobsRes.jobs.slice(0, 4);
    }
  } catch (e) {
    console.warn('Using cached stats on home render');
  }

  return `
    <main>
      <!-- Hero Section (Matching Top-Left Image) -->
      <section class="hero-section">
        <div class="hero-bg-network">
          <svg class="hero-globe-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1" stroke-dasharray="3 3"/>
            <ellipse cx="100" cy="100" rx="85" ry="35" stroke="rgba(59, 130, 246, 0.35)" stroke-width="1"/>
            <ellipse cx="100" cy="100" rx="35" ry="85" stroke="rgba(59, 130, 246, 0.35)" stroke-width="1"/>
            <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1"/>
            <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1"/>
            <!-- Coordinate nodes -->
            <circle cx="65" cy="80" r="3" fill="#60A5FA"/>
            <circle cx="130" cy="65" r="3.5" fill="#3B82F6"/>
            <circle cx="145" cy="125" r="2.5" fill="#93C5FD"/>
            <circle cx="85" cy="140" r="3" fill="#60A5FA"/>
            <path d="M65 80 L130 65 L145 125 L85 140 Z" stroke="rgba(96, 165, 250, 0.3)" stroke-width="1"/>
          </svg>
        </div>

        <div class="container">
          <div class="hero-content">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.35rem 0.875rem; border-radius: var(--radius-full); font-size: 0.8125rem; font-weight: 600; color: #93C5FD; margin-bottom: 1.25rem;">
              ${window.Icons.shieldCheck("w-4 h-4 text-blue-400")}
              <span>${isArabic ? 'منصة التوظيف العالمية المرخصة والآمنة' : 'Global Verified & Escrow-Protected Careers'}</span>
            </div>

            <h1 class="hero-title">${window.t('heroTitle')}</h1>
            <p class="hero-subtitle">${window.t('heroSubtitle')}</p>

            <!-- Search Floating Component -->
            <form onsubmit="handleHeroSearch(event)" class="hero-search-box">
              <div class="search-input-group">
                <span style="color: var(--text-muted);">${window.Icons.search("w-5 h-5")}</span>
                <input id="heroKeywordInput" type="text" class="search-input" placeholder="${window.t('searchPlaceholder')}">
              </div>

              <div class="search-input-group">
                <span style="color: var(--text-muted);">${window.Icons.mapPin("w-5 h-5")}</span>
                <input id="heroLocationInput" type="text" class="search-input" placeholder="${window.t('locationPlaceholder')}">
              </div>

              <div class="search-input-group">
                <span style="color: var(--text-muted);">${window.Icons.clock("w-5 h-5")}</span>
                <select id="heroTypeSelect" class="search-input" style="cursor: pointer;">
                  <option value="all">${isArabic ? 'كل أنواع العمل' : 'All Job Types'}</option>
                  <option value="daily_gig">${isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig / Shift'}</option>
                  <option value="full_time">${isArabic ? 'دوام كامل' : 'Full-time'}</option>
                  <option value="part_time">${isArabic ? 'دوام جزئي' : 'Part-time'}</option>
                </select>
              </div>

              <button type="submit" class="btn btn-primary" style="min-width: 130px; font-weight: 700;">
                <span>${window.t('searchBtn')}</span>
                ${window.Icons.arrowRight("w-4 h-4")}
              </button>
            </form>

            <!-- Stats Bar -->
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">1M+</div>
                <div class="stat-label">${isArabic ? 'وظيفة حول العالم' : 'Jobs Worldwide'}</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">500K+</div>
                <div class="stat-label">${isArabic ? 'شركة موثقة' : 'Verified Companies'}</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">10M+</div>
                <div class="stat-label">${isArabic ? 'مستخدم مسجل' : 'Registered Users'}</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">150+</div>
                <div class="stat-label">${isArabic ? 'دولة مدعومة' : 'Countries'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Popular Categories (Matching Top-Left Mockup) -->
      <section class="categories-section">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">${window.t('popularCategories')}</h2>
              <p style="color: var(--text-muted); font-size: 0.9375rem; margin-top: 0.25rem;">
                ${isArabic ? 'تصفح الوظائف بحسب التخصص والمجال المهني' : 'Explore diverse sectors and professional domains worldwide'}
              </p>
            </div>
            <a href="javascript:void(0)" onclick="navigateTo('jobs')" style="color: var(--color-primary); font-weight: 700; text-decoration: none; font-size: 0.9375rem;">
              ${window.t('viewAll')}
            </a>
          </div>

          <div class="categories-grid">
            <div class="category-card" onclick="filterByCategory('Technology')">
              <div class="category-icon-wrap" style="background:#EFF6FF; color:#2563EB;">
                ${window.Icons.briefcase("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'التكنولوجيا والبرمجة' : 'Technology'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">IT, Software, Cloud</div>
              </div>
            </div>

            <div class="category-card" onclick="filterByCategory('Trades & Industry')">
              <div class="category-icon-wrap" style="background:#EEF2FF; color:#4F46E5;">
                ${window.Icons.clock("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'العمل اليومي والمهن' : 'Daily Trades'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Electrical, HVAC, Construction</div>
              </div>
            </div>

            <div class="category-card" onclick="filterByCategory('Healthcare')">
              <div class="category-icon-wrap" style="background:#ECFDF5; color:#059669;">
                ${window.Icons.shieldCheck("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'الرعاية الصحية' : 'Healthcare'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Clinical, Nursing, Pharma</div>
              </div>
            </div>

            <div class="category-card" onclick="filterByCategory('Marketing')">
              <div class="category-icon-wrap" style="background:#FFFBEB; color:#D97706;">
                ${window.Icons.share("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'التسويق والمبيعات' : 'Marketing'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Digital, Growth, Sales</div>
              </div>
            </div>

            <div class="category-card" onclick="filterByCategory('Logistics')">
              <div class="category-icon-wrap" style="background:#F0FDF4; color:#16A34A;">
                ${window.Icons.globe("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'الخدمات اللوجستية' : 'Logistics'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Fleet, Heavy Cargo, Supply</div>
              </div>
            </div>

            <div class="category-card" onclick="filterByCategory('Finance')">
              <div class="category-icon-wrap" style="background:#F8FAFC; color:#0F172A; border: 1px solid var(--border-light);">
                ${window.Icons.dollarSign("w-6 h-6")}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem;">${isArabic ? 'المالية والمحاسبة' : 'Finance'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Audit, Banking, FinTech</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Opportunities (Full Time + Daily Gigs) -->
      <section style="background-color: #FFFFFF; padding: 4rem 0; border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light);">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">${window.t('featuredJobs')}</h2>
              <p style="color: var(--text-muted); font-size: 0.9375rem; margin-top: 0.25rem;">
                ${isArabic ? 'وظائف بدوام كامل وفرص عمل يومي فوري معتمدة' : 'Verified full-time careers & immediate daily gig contracts'}
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="navigateTo('jobs', { job_type: 'daily_gig' })" class="btn btn-sm btn-secondary">
                ${window.Icons.clock("w-4 h-4 text-indigo-600")}
                <span>${isArabic ? 'عرض العمل اليومي فقط' : 'Daily Gigs Only'}</span>
              </button>
              <button onclick="navigateTo('jobs', { job_type: 'full_time' })" class="btn btn-sm btn-secondary">
                ${window.Icons.briefcase("w-4 h-4 text-blue-600")}
                <span>${isArabic ? 'عرض الدوام الكامل' : 'Full-time Only'}</span>
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            ${featuredJobs.map(job => renderJobCardCompact(job, isArabic)).join('')}
          </div>
        </div>
      </section>

      <!-- Platform Commission / Escrow Callout (Requirement 13) -->
      <section style="padding: 4rem 0; background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%); color: #FFFFFF;">
        <div class="container">
          <div style="max-width: 850px; margin: 0 auto; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.35rem 0.875rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.25rem;">
              ${window.Icons.shieldCheck("w-4 h-4 text-emerald-400")}
              <span>${isArabic ? 'حماية التعاقد ونسبة المنصة الشفافة' : 'Escrow Protected Contracts & Transparent 3% Platform Fee'}</span>
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem;">
              ${isArabic ? 'توظيف عالمي مباشر مع تسوية آمنة لنسبة المنصة' : 'Direct Global Hiring with Escrowed Commission Settlement'}
            </h2>
            <p style="font-size: 1.125rem; color: #94A3B8; line-height: 1.6; margin-bottom: 2rem;">
              ${isArabic 
                ? 'عند قبول العرض الوظيفي أو التعاقد اليومي، يتم سداد نسبة المنصة (3%) عبر بوابة دفع إلكترونية آمنة تضمن حقوق الطرفين وتوفر إيصالاً مالياً معتمداً وموثقاً.'
                : 'Upon receiving and accepting a job offer or daily gig, the 3% platform commission is securely processed via encrypted payment gateways, guaranteeing contracts and delivering instant verified receipts.'
              }
            </p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
              <button onclick="navigateTo('jobs')" class="btn btn-lg btn-primary">
                ${window.Icons.search("w-5 h-5")}
                <span>${isArabic ? 'استكشف الوظائف الآن' : 'Browse All Jobs'}</span>
              </button>
              <button onclick="openAuthModal('register')" class="btn btn-lg btn-outline-white">
                ${window.Icons.user("w-5 h-5")}
                <span>${isArabic ? 'سجل كفرد أو شركة' : 'Create Account'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Security & Performance Section (Matching Bottom-Middle Mockup) -->
      <section class="security-banner">
        <div class="container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3rem auto;">
            <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem;">
              ${isArabic ? 'الأمان والأداء العالي' : 'Security & Performance'}
            </h2>
            <p style="color: #94A3B8; font-size: 0.9375rem;">
              ${isArabic ? 'بنية تحتية بمستوى المؤسسات الكبرى لضمان موثوقية التوظيف والمدفوعات' : 'Enterprise-grade security and resilient infrastructure'}
            </p>
          </div>

          <div class="security-grid">
            <div class="security-item">
              <div class="security-icon">${window.Icons.lock("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'تشفير كامل للبيانات' : 'Encrypted Data'}</h3>
              <p class="security-desc">${isArabic ? 'بياناتك ومستنداتك وسيرتك الذاتية محمية بأعلى معايير التشفير القياسية.' : 'Your data is protected with industry-standard encryption protocols.'}</p>
            </div>

            <div class="security-item">
              <div class="security-icon">${window.Icons.creditCard("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'مدفوعات آمنة ومعتمدة' : 'Secure Payments'}</h3>
              <p class="security-desc">${isArabic ? 'معالجة مالية آمنة للنسب والرسوم عبر بوابات عالمية معتمدة ومحمية.' : 'Safe and reliable payment processing with globally trusted providers.'}</p>
            </div>

            <div class="security-item">
              <div class="security-icon">${window.Icons.shieldCheck("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Authentication'}</h3>
              <p class="security-desc">${isArabic ? 'طبقة إضافية من الأمان لحماية حسابك من أي دخول غير مصرح به.' : 'Extra layer of security for your account credentials and operations.'}</p>
            </div>

            <div class="security-item">
              <div class="security-icon">${window.Icons.shieldCheck("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'حماية متطورة ضد الاحتيال' : 'Fraud Protection'}</h3>
              <p class="security-desc">${isArabic ? 'أنظمة تدقيق ومراجعة تلقائية لمنع الوظائف المزيفة وتوثيق الشركات.' : 'Advanced verification systems to prevent fraud and fake accounts.'}</p>
            </div>

            <div class="security-item">
              <div class="security-icon">${window.Icons.download("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'نسخ احتياطي دوري' : 'Regular Backups'}</h3>
              <p class="security-desc">${isArabic ? 'حفظ تلقائي لسجلات العقود والمدفوعات وإمكانية استرجاعها فوراً.' : 'Your data is always safe, auditable, and recoverable at any time.'}</p>
            </div>

            <div class="security-item">
              <div class="security-icon">${window.Icons.globe("w-5 h-5")}</div>
              <h3 class="security-title">${isArabic ? 'أداء عالمي عالي السرعة' : 'High Performance'}</h3>
              <p class="security-desc">${isArabic ? 'استجابة فائقة السرعة ومتوافقة مع مختلف الأجهزة من أي مكان بالعالم.' : 'Fast, reliable, and scalable infrastructure worldwide.'}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
};

// Compact Job Card Helper for Home Page
function renderJobCardCompact(job, isArabic) {
  const isDaily = job.job_type === 'daily_gig';
  const rateUnit = isDaily ? (isArabic ? '/ يوم' : '/ day') : (isArabic ? '/ سنة' : '/ year');

  return `
    <div class="job-card" onclick="navigateTo('jobDetails', { id: '${job.id}' })">
      <div class="job-card-header">
        <div class="job-company-wrap">
          <img src="${job.company_logo}" alt="${job.company_name}" class="job-company-logo">
          <div>
            <h3 class="job-title">${job.title}</h3>
            <div class="job-company-name">
              <span>${job.company_name}</span>
              ${job.company_verified ? window.Icons.badgeCheck("inline-block") : ''}
              <span style="margin: 0 0.4rem;">•</span>
              <span>${job.location}</span>
            </div>
          </div>
        </div>

        <button onclick="event.stopPropagation(); toggleSaveJob('${job.id}')" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 36px; height: 36px; padding: 0;">
          ${window.Icons.bookmark("w-4 h-4", job.is_saved)}
        </button>
      </div>

      <div class="job-tags">
        <span class="badge ${isDaily ? 'badge-daily' : 'badge-fulltime'}">
          ${isDaily ? (isArabic ? '⚡ عمل يومي' : '⚡ Daily Gig') : (isArabic ? 'دوام كامل' : 'Full-time')}
        </span>
        <span class="badge badge-remote">${job.workplace_type.toUpperCase()}</span>
        <span class="badge" style="background:#F8FAFC; color:#475569; border:1px solid #E2E8F0;">${job.experience_level.toUpperCase()}</span>
        <span class="badge" style="background:#EFF6FF; color:#1D4ED8;">${job.category}</span>
      </div>

      <div class="job-card-footer">
        <div class="job-salary-amount">
          ${window.formatCurrency(job.salary_min, job.currency)} - ${window.formatCurrency(job.salary_max, job.currency)} <span style="font-size:0.8125rem; font-weight:500; color:var(--text-muted);">${rateUnit}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--color-primary);">
          <span>${isArabic ? 'عرض التفاصيل والتقديم' : 'View & Apply'}</span>
          ${window.Icons.arrowRight("w-4 h-4")}
        </div>
      </div>
    </div>
  `;
}

// Search Action Handlers
window.handleHeroSearch = function(e) {
  e.preventDefault();
  const q = document.getElementById('heroKeywordInput').value;
  const location = document.getElementById('heroLocationInput').value;
  const job_type = document.getElementById('heroTypeSelect').value;

  window.AppState.searchQuery.q = q;
  window.AppState.searchQuery.location = location;
  window.AppState.searchQuery.job_type = job_type;

  window.navigateTo('jobs', { q, location, job_type });
};

window.filterByCategory = function(category) {
  window.AppState.searchQuery.category = category;
  window.navigateTo('jobs', { category });
};
