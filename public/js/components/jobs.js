// jobs.js - Jobs Listing & Realtime Filter Page matching Top-Center Mockup
window.renderJobsPage = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const query = window.AppState.searchQuery;

  // Sync route params into query
  if (window.AppState.routeParams) {
    Object.assign(query, window.AppState.routeParams);
  }

  let jobs = [];
  let totalFound = 0;

  try {
    const res = await window.API.getJobs(query);
    jobs = res.jobs || [];
    totalFound = res.total || 0;
  } catch (err) {
    console.error('Failed to load jobs', err);
    window.showToast('Error loading jobs', 'error');
  }

  return `
    <div class="container" style="padding-top: 1.5rem; padding-bottom: 4rem;">
      <!-- Page Hero Header (Matching Top-Center of User Image) -->
      <div style="background: linear-gradient(135deg, #0B132B 0%, #1C2541 100%); border-radius: var(--radius-lg); padding: 2rem 1.5rem; color: #FFFFFF; margin-bottom: 1.5rem; position: relative; overflow: hidden;">
        <div style="position: relative; z-index: 10; max-width: 700px;">
          <h1 style="font-size: clamp(1.35rem, 4vw, 2rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.35rem;">
            ${isArabic ? 'اعثر على الوظيفة والعمل المناسب لك' : 'Find the right job for you'}
          </h1>
          <p style="color: #94A3B8; font-size: clamp(0.85rem, 2vw, 0.95rem); margin-bottom: 1.25rem;">
            ${isArabic ? 'ابحث بين آلاف الوظائف الشاغرة وعقود العمل اليومي المعتمدة حول العالم' : 'Search from thousands of verified full-time roles and daily gigs around the world'}
          </p>

          <!-- Top Search Bar -->
          <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 0.5rem; box-shadow: var(--shadow-lg);" class="hero-search-box-inner">
            <div class="jobs-search-inputs-wrap">
              <div class="search-input-group" style="flex: 2; min-width: 180px;">
                <span style="color: var(--text-muted);">${window.Icons.search("w-4 h-4")}</span>
                <input id="jobsKeywordInput" type="text" class="search-input" value="${query.q || ''}" placeholder="${window.t('searchPlaceholder')}" onkeyup="if(event.key==='Enter') executeJobsFilter()">
              </div>

              <div class="search-input-group" style="flex: 1.5; min-width: 140px;">
                <span style="color: var(--text-muted);">${window.Icons.mapPin("w-4 h-4")}</span>
                <input id="jobsLocationInput" type="text" class="search-input" value="${query.location !== 'all' ? (query.location || '') : ''}" placeholder="${window.t('locationPlaceholder')}" onkeyup="if(event.key==='Enter') executeJobsFilter()">
              </div>

              <div class="search-input-group" style="flex: 1; min-width: 130px;">
                <span style="color: var(--text-muted);">${window.Icons.clock("w-4 h-4")}</span>
                <select id="jobsTypeSelect" class="search-input" onchange="executeJobsFilter()">
                  <option value="all" ${query.job_type === 'all' ? 'selected' : ''}>${isArabic ? 'كل الأنواع' : 'All Types'}</option>
                  <option value="daily_gig" ${query.job_type === 'daily_gig' ? 'selected' : ''}>${isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig'}</option>
                  <option value="full_time" ${query.job_type === 'full_time' ? 'selected' : ''}>${isArabic ? 'دوام كامل' : 'Full-time'}</option>
                  <option value="part_time" ${query.job_type === 'part_time' ? 'selected' : ''}>${isArabic ? 'دوام جزئي' : 'Part-time'}</option>
                </select>
              </div>

              <button onclick="executeJobsFilter()" class="btn btn-primary" style="min-width: 80px;">
                ${window.t('searchBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Filter Toggle Bar (< 1024px) -->
      <div class="mobile-filter-bar">
        <button onclick="toggleMobileFilters()" class="btn btn-sm btn-secondary" style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span style="display: flex; align-items: center; gap: 0.5rem;">
            ${window.Icons.filter("w-4 h-4 text-blue-600")}
            <span>${isArabic ? 'تصفية وبحث متقدم' : 'Filters & Categories'}</span>
          </span>
          <span style="font-size: 0.75rem; background: #EFF6FF; color: #1D4ED8; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">
            ${totalFound} ${isArabic ? 'فرصة' : 'Jobs'}
          </span>
        </button>
      </div>

      <!-- Main Layout: Sidebar Filters + Job List -->
      <div class="jobs-page-layout">
        <!-- Sidebar Filters -->
        <aside id="jobFilterSidebar" class="filter-sidebar">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <div style="font-size: 1.0625rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              ${window.Icons.filter("w-4 h-4 text-blue-600")}
              <span>${window.t('filters')}</span>
            </div>
            <button onclick="resetFilters()" style="background: none; border: none; font-size: 0.8125rem; color: var(--color-primary); cursor: pointer; font-weight: 600;">
              ${isArabic ? 'مسح الكل' : 'Clear all'}
            </button>
          </div>

          <!-- Job Type Filter (Requirement 2: Daily Gig vs Full Time) -->
          <div class="filter-group">
            <div class="filter-title">${window.t('jobType')}</div>
            <label class="filter-option">
              <input type="radio" name="sidebar_job_type" value="all" ${query.job_type === 'all' ? 'checked' : ''} onchange="setFilter('job_type', 'all')">
              <span>${isArabic ? 'الكل' : 'All Types'}</span>
            </label>
            <label class="filter-option" style="color: #4F46E5; font-weight: 600;">
              <input type="radio" name="sidebar_job_type" value="daily_gig" ${query.job_type === 'daily_gig' ? 'checked' : ''} onchange="setFilter('job_type', 'daily_gig')">
              <span>${isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig / Shift'}</span>
            </label>
            <label class="filter-option">
              <input type="radio" name="sidebar_job_type" value="full_time" ${query.job_type === 'full_time' ? 'checked' : ''} onchange="setFilter('job_type', 'full_time')">
              <span>${isArabic ? 'دوام كامل' : 'Full-time'}</span>
            </label>
            <label class="filter-option">
              <input type="radio" name="sidebar_job_type" value="part_time" ${query.job_type === 'part_time' ? 'checked' : ''} onchange="setFilter('job_type', 'part_time')">
              <span>${isArabic ? 'دوام جزئي' : 'Part-time'}</span>
            </label>
          </div>

          <!-- Categories Filter (Requirement 1: All Jobs) -->
          <div class="filter-group">
            <div class="filter-title">${isArabic ? 'المجال الوظيفي' : 'Category'}</div>
            ${['all', 'Technology', 'Trades & Industry', 'Healthcare', 'Marketing', 'Logistics', 'Finance'].map(cat => `
              <label class="filter-option">
                <input type="radio" name="sidebar_category" value="${cat}" ${query.category === cat ? 'checked' : ''} onchange="setFilter('category', '${cat}')">
                <span>${cat === 'all' ? (isArabic ? 'جميع المجالات' : 'All Categories') : cat}</span>
              </label>
            `).join('')}
          </div>

          <!-- Workplace Type -->
          <div class="filter-group">
            <div class="filter-title">${isArabic ? 'مكان العمل' : 'Workplace Type'}</div>
            <label class="filter-option">
              <input type="radio" name="sidebar_workplace" value="all" ${query.workplace_type === 'all' ? 'checked' : ''} onchange="setFilter('workplace_type', 'all')">
              <span>${isArabic ? 'عالمي / الكل' : 'Worldwide / Any'}</span>
            </label>
            <label class="filter-option">
              <input type="radio" name="sidebar_workplace" value="remote" ${query.workplace_type === 'remote' ? 'checked' : ''} onchange="setFilter('workplace_type', 'remote')">
              <span>${isArabic ? 'عن بُعد بالكامل' : 'Remote'}</span>
            </label>
            <label class="filter-option">
              <input type="radio" name="sidebar_workplace" value="on_site" ${query.workplace_type === 'on_site' ? 'checked' : ''} onchange="setFilter('workplace_type', 'on_site')">
              <span>${isArabic ? 'حضوري (ميداني/مكتبي)' : 'On-site'}</span>
            </label>
            <label class="filter-option">
              <input type="radio" name="sidebar_workplace" value="hybrid" ${query.workplace_type === 'hybrid' ? 'checked' : ''} onchange="setFilter('workplace_type', 'hybrid')">
              <span>${isArabic ? 'هجين (مكتبي وعن بُعد)' : 'Hybrid'}</span>
            </label>
          </div>

          <!-- Experience Level -->
          <div class="filter-group">
            <div class="filter-title">${window.t('experienceLevel')}</div>
            ${['all', 'entry', 'mid', 'senior', 'executive'].map(exp => `
              <label class="filter-option">
                <input type="radio" name="sidebar_exp" value="${exp}" ${query.experience === exp ? 'checked' : ''} onchange="setFilter('experience', '${exp}')">
                <span>${exp === 'all' ? (isArabic ? 'كل المستويات' : 'All Levels') : exp.toUpperCase()}</span>
              </label>
            `).join('')}
          </div>
        </aside>

        <!-- Jobs Listing Section -->
        <div>
          <!-- Header stats & sorting -->
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1.25rem;">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">
              ${isArabic ? `تم العثور على ${totalFound} فرصة عمل` : `Found ${totalFound} opportunities`}
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8125rem; color: var(--text-muted);">${isArabic ? 'الترتيب:' : 'Sort:'}</span>
              <select id="sortSelect" onchange="setFilter('sort', this.value)" style="border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 0.25rem 0.5rem; font-size: 0.8125rem; background: #FFFFFF; font-family: inherit;">
                <option value="recent" ${query.sort === 'recent' ? 'selected' : ''}>${isArabic ? 'الأحدث' : 'Most Recent'}</option>
                <option value="salary_high" ${query.sort === 'salary_high' ? 'selected' : ''}>${isArabic ? 'الأعلى راتباً / أجراً' : 'Highest Salary / Rate'}</option>
                <option value="views" ${query.sort === 'views' ? 'selected' : ''}>${isArabic ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
              </select>
            </div>
          </div>

          <!-- Jobs Cards List -->
          ${jobs.length === 0 ? `
            <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
              <div style="width: 54px; height: 54px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; color: var(--text-muted);">
                ${window.Icons.search("w-6 h-6")}
              </div>
              <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.35rem;">${isArabic ? 'لم يتم العثور على وظائف مطابقة' : 'No jobs found matching your criteria'}</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">${isArabic ? 'جرب تغيير معايير البحث أو تصفية نوع العمل أو مسح التصفيات' : 'Try broadening your search keywords or resetting filters.'}</p>
              <button onclick="resetFilters()" class="btn btn-sm btn-primary">
                ${isArabic ? 'إعادة ضبط كافة التصفيات' : 'Reset All Filters'}
              </button>
            </div>
          ` : `
            <div>
              ${jobs.map(job => renderJobCardDetailed(job, isArabic)).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

// Toggle mobile filter sidebar
window.toggleMobileFilters = function() {
  const sidebar = document.getElementById('jobFilterSidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
};

// Detailed Job Card Component
function renderJobCardDetailed(job, isArabic) {
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
              <span style="margin: 0 0.35rem;">•</span>
              <span>${job.location}</span>
            </div>
          </div>
        </div>

        <button onclick="event.stopPropagation(); toggleSaveJob('${job.id}')" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0; flex-shrink: 0;">
          ${window.Icons.bookmark("w-4 h-4", job.is_saved)}
        </button>
      </div>

      <p style="color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${job.description}
      </p>

      <div class="job-tags">
        <span class="badge ${isDaily ? 'badge-daily' : 'badge-fulltime'}">
          ${isDaily ? (isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig') : (isArabic ? 'دوام كامل' : 'Full-time')}
        </span>
        <span class="badge badge-remote">${job.workplace_type.toUpperCase()}</span>
        <span class="badge" style="background:#F1F5F9; color:#334155;">${job.experience_level.toUpperCase()}</span>
        <span class="badge" style="background:#EFF6FF; color:#1D4ED8;">${job.category}</span>
        <span class="badge" style="background:#F0FDF4; color:#15803D;">${isArabic ? 'عمولة منصة 3% فقط' : '3% Platform Fee'}</span>
      </div>

      <div class="job-card-footer">
        <div class="job-salary-amount">
          ${window.formatCurrency(job.salary_min, job.currency)} - ${window.formatCurrency(job.salary_max, job.currency)} <span style="font-size:0.75rem; font-weight:500; color:var(--text-muted);">${rateUnit}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8125rem; font-weight: 600; color: var(--color-primary);">
          <span>${isArabic ? 'التفاصيل والتقديم' : 'Details & Apply'}</span>
          ${window.Icons.arrowRight("w-3.5 h-3.5")}
        </div>
      </div>
    </div>
  `;
}

// Filter Action Handlers
window.executeJobsFilter = function() {
  const q = document.getElementById('jobsKeywordInput') ? document.getElementById('jobsKeywordInput').value : '';
  const location = document.getElementById('jobsLocationInput') ? document.getElementById('jobsLocationInput').value : '';
  const job_type = document.getElementById('jobsTypeSelect') ? document.getElementById('jobsTypeSelect').value : 'all';

  window.AppState.searchQuery.q = q;
  window.AppState.searchQuery.location = location || 'all';
  window.AppState.searchQuery.job_type = job_type;

  window.renderApp();
};

window.setFilter = function(key, value) {
  window.AppState.searchQuery[key] = value;
  window.renderApp();
};

window.resetFilters = function() {
  window.AppState.searchQuery = {
    q: '',
    category: 'all',
    job_type: 'all',
    workplace_type: 'all',
    location: 'all',
    experience: 'all',
    sort: 'recent'
  };
  window.renderApp();
};

window.toggleSaveJob = async function(jobId) {
  if (!window.AppState.user) {
    window.showToast(window.AppState.lang === 'ar' ? 'يرجى تسجيل الدخول لحفظ الوظائف' : 'Please log in to save jobs', 'error');
    window.openAuthModal('login');
    return;
  }

  try {
    const res = await window.API.saveJob(jobId);
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};
