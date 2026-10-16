// navbar.js - Global Top Header & Mobile Navigation (Production Ready)
window.renderNavbar = function() {
  const user = window.AppState.user;
  const currentRoute = window.AppState.currentRoute;
  const isArabic = window.AppState.lang === 'ar';

  return `
    <header class="app-header">
      <div class="container">
        <div class="header-inner">
          <!-- Brand Logo -->
          <a href="javascript:void(0)" onclick="navigateTo('home')" class="brand-logo">
            <div class="brand-badge-logo">
              ${window.Icons.globe("w-5 h-5")}
            </div>
            <span>${window.t('brand')}</span>
          </a>

          <!-- Main Desktop Nav -->
          <nav class="nav-links">
            <a href="javascript:void(0)" onclick="navigateTo('jobs')" class="nav-link ${currentRoute === 'jobs' ? 'active' : ''}">
              ${window.Icons.briefcase("w-4 h-4")}
              <span>${window.t('allJobs')}</span>
            </a>
            <a href="javascript:void(0)" onclick="navigateTo('jobs', { job_type: 'daily_gig' })" class="nav-link ${window.AppState.searchQuery.job_type === 'daily_gig' ? 'active' : ''}">
              ${window.Icons.clock("w-4 h-4 text-indigo-400")}
              <span>${window.t('dailyGigs')}</span>
              <span class="badge badge-daily" style="font-size:0.65rem; padding: 2px 6px;">Hot</span>
            </a>
            ${user ? `
              <a href="javascript:void(0)" onclick="navigateTo('dashboard')" class="nav-link ${currentRoute === 'dashboard' ? 'active' : ''}">
                ${window.Icons.layoutDashboard("w-4 h-4")}
                <span>${window.t('dashboard')}</span>
              </a>
            ` : ''}
            ${user && (user.role === 'admin' || user.role === 'staff') ? `
              <a href="javascript:void(0)" onclick="navigateTo('admin')" class="nav-link ${currentRoute === 'admin' ? 'active' : ''}">
                ${window.Icons.shieldCheck("w-4 h-4 text-emerald-400")}
                <span>${window.t('adminPanel')}</span>
              </a>
            ` : ''}
          </nav>

          <!-- Header Actions -->
          <div class="header-actions">
            <!-- Language Switcher (EN / AR) -->
            <button onclick="toggleLanguage()" class="btn btn-sm btn-outline-white" title="${isArabic ? 'Switch to English' : 'التحويل للعربية'}">
              ${window.Icons.globe("w-3.5 h-3.5")}
              <span>${isArabic ? 'English' : 'عربي'}</span>
            </button>

            <!-- User Auth Controls -->
            ${user ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${user.role === 'employer' || user.role === 'admin' ? `
                  <button onclick="openPostJobModal()" class="btn btn-sm btn-primary">
                    ${window.Icons.plus("w-3.5 h-3.5")}
                    <span>${window.t('postJob')}</span>
                  </button>
                ` : ''}

                <div class="user-avatar-wrap" onclick="navigateTo('dashboard')" title="${user.name}" style="cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                  <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #2563EB;">
                </div>

                <button onclick="logout()" class="btn btn-sm btn-outline-white" title="${isArabic ? 'تسجيل الخروج' : 'Log Out'}">
                  ${window.Icons.logOut("w-3.5 h-3.5")}
                </button>
              </div>
            ` : `
              <button onclick="openAuthModal('login')" class="btn btn-sm btn-outline-white">
                ${window.t('signIn')}
              </button>
              <button onclick="openAuthModal('register')" class="btn btn-sm btn-primary">
                ${window.t('signUp')}
              </button>
            `}
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Bottom Navigation Bar (Matching Smartphone Mockup) -->
    <div class="mobile-nav-bar">
      <button onclick="navigateTo('home')" class="mobile-nav-btn ${currentRoute === 'home' ? 'active' : ''}">
        ${window.Icons.globe("w-5 h-5")}
        <span>${isArabic ? 'الرئيسية' : 'Home'}</span>
      </button>
      <button onclick="navigateTo('jobs')" class="mobile-nav-btn ${currentRoute === 'jobs' ? 'active' : ''}">
        ${window.Icons.search("w-5 h-5")}
        <span>${window.t('allJobs')}</span>
      </button>
      <button onclick="navigateTo('jobs', { job_type: 'daily_gig' })" class="mobile-nav-btn ${window.AppState.searchQuery.job_type === 'daily_gig' ? 'active' : ''}">
        ${window.Icons.clock("w-5 h-5")}
        <span>${isArabic ? 'يومي' : 'Daily'}</span>
      </button>
      ${user ? `
        <button onclick="navigateTo('dashboard')" class="mobile-nav-btn ${currentRoute === 'dashboard' ? 'active' : ''}">
          ${window.Icons.layoutDashboard("w-5 h-5")}
          <span>${window.t('dashboard')}</span>
        </button>
      ` : `
        <button onclick="openAuthModal('login')" class="mobile-nav-btn">
          ${window.Icons.user("w-5 h-5")}
          <span>${window.t('signIn')}</span>
        </button>
      `}
    </div>
  `;
};

// Global Logout Handler
window.logout = async function() {
  try {
    await window.API.logout();
  } catch (e) {}
  window.AppState.token = null;
  window.AppState.user = null;
  window.AppState.company = null;
  localStorage.removeItem('jobplatform_token');
  window.showToast(window.AppState.lang === 'ar' ? 'تم تسجيل الخروج وإبطال الجلسة' : 'Logged out and session revoked');
  window.navigateTo('home');
};
