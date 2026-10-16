// app.js - State management, reactive router, and internationalization
window.AppState = {
  user: null,
  company: null,
  token: localStorage.getItem('jobplatform_token') || null,
  currentRoute: 'home',
  routeParams: {},
  lang: localStorage.getItem('jobplatform_lang') || 'en', // 'en' or 'ar'
  currency: localStorage.getItem('jobplatform_currency') || 'USD',
  savedJobs: new Set(),
  activeTab: 'overview',
  searchQuery: {
    q: '',
    category: 'all',
    job_type: 'all',
    workplace_type: 'all',
    location: 'all',
    experience: 'all',
    sort: 'recent'
  }
};

// Translations Dictionary (EN / AR)
window.I18N = {
  en: {
    brand: 'JobPlatform',
    tagline: 'Global Opportunities Await',
    heroTitle: 'Find Your Next Opportunity',
    heroSubtitle: 'Global jobs. Real people. Better futures. Explore thousands of job opportunities worldwide. Work remotely or on-site, full-time or daily.',
    searchPlaceholder: 'Job title, skills, or company',
    locationPlaceholder: 'All Locations / Worldwide',
    searchBtn: 'Search',
    allJobs: 'Jobs',
    companies: 'Companies',
    dailyGigs: 'Daily Gigs',
    postJob: 'Post a Job',
    signIn: 'Log In',
    signUp: 'Sign Up',
    dashboard: 'Dashboard',
    adminPanel: 'Admin & Revenue',
    popularCategories: 'Popular Job Categories',
    viewAll: 'View all →',
    featuredJobs: 'Featured Opportunities',
    securePayment: 'Secure Payment',
    platformFee: 'Platform Commission (3%)',
    applicationFeeDesc: 'Pay your platform fee and get your hiring completed. Your payment is safe, encrypted, and backed by escrow.',
    filters: 'Filters',
    jobType: 'Job Type',
    fullTime: 'Full-time',
    dailyGig: 'Daily Gig / Shift',
    partTime: 'Part-time',
    contract: 'Contract',
    remote: 'Remote',
    experienceLevel: 'Experience Level',
    entryLevel: 'Entry Level',
    midLevel: 'Mid Level',
    seniorLevel: 'Senior Level',
    executive: 'Executive',
    salaryRange: 'Salary / Rate',
    applyNow: 'Apply Now',
    saveJob: 'Save',
    saved: 'Saved',
    backToJobs: '← Back to Jobs',
    overview: 'Overview',
    responsibilities: 'Key Responsibilities',
    requirements: 'Requirements',
    benefits: 'Benefits',
    companyProfile: 'Company',
    welcomeBack: 'Welcome back',
    recentApplications: 'Recent Applications',
    payCommissionBtn: 'Pay 3% Commission',
    statusUnderReview: 'Under Review',
    statusInterview: 'Interview',
    statusOffer: 'Offer Received',
    statusHired: 'Hired & Verified',
    statusRejected: 'Rejected',
    totalJobs: 'Total Jobs',
    totalApplications: 'Total Applications',
    shortlisted: 'Shortlisted',
    hired: 'Hired',
    revenue: 'Platform Revenue',
    transactions: 'Transactions'
  },
  ar: {
    brand: 'JobPlatform',
    tagline: 'فرص عالمية تنتظرك',
    heroTitle: 'ابحث عن فرصتك الوظيفية القادمة',
    heroSubtitle: 'وظائف عالمية. كفاءات حقيقية. مستقبل أفضل. استكشف آلاف الوظائف من الشركات حول العالم. عن بُعد أو حضورياً، عمل يومي أو دوام كامل.',
    searchPlaceholder: 'المسمى الوظيفي، المهارة، أو الشركة',
    locationPlaceholder: 'جميع المواقع / عالمياً',
    searchBtn: 'بحث',
    allJobs: 'الوظائف',
    companies: 'الشركات',
    dailyGigs: 'العمل اليومي',
    postJob: 'أضف وظيفة',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    dashboard: 'لوحة التحكم',
    adminPanel: 'إدارة المنصة والإيرادات',
    popularCategories: 'المجالات الوظيفية الشائعة',
    viewAll: 'عرض الكل ←',
    featuredJobs: 'أحدث الفرص المميزة',
    securePayment: 'دفع آمن للعمولة',
    platformFee: 'نسبة المنصة (3%)',
    applicationFeeDesc: 'ادفع نسبة المنصة لإتمام عقد التوظيف. دفع آمن ومشفر 100% بنظام حماية العقود.',
    filters: 'التصفيات والفلترة',
    jobType: 'نوع الوظيفة',
    fullTime: 'دوام كامل',
    dailyGig: 'عمل يومي / مياومة',
    partTime: 'دوام جزئي',
    contract: 'عقد مؤقت',
    remote: 'عن بُعد',
    experienceLevel: 'مستوى الخبرة',
    entryLevel: 'مبتدئ',
    midLevel: 'متوسط',
    seniorLevel: 'خبير / متقدم',
    executive: 'إداري وتنفيذي',
    salaryRange: 'الراتب / الأجر اليومي',
    applyNow: 'التقدم للوظيفة',
    saveJob: 'حفظ',
    saved: 'محفوظة',
    backToJobs: '→ العودة إلى الوظائف',
    overview: 'نظرة عامة',
    responsibilities: 'المسؤوليات الرئيسية',
    requirements: 'المتطلبات',
    benefits: 'المزايا والبدلات',
    companyProfile: 'عن الشركة',
    welcomeBack: 'مرحباً بعودتك',
    recentApplications: 'طلبات التوظيف الأخيرة',
    payCommissionBtn: 'دفع نسبة المنصة 3%',
    statusUnderReview: 'قيد المراجعة',
    statusInterview: 'مقابلة شخصية',
    statusOffer: 'تم قبول العرض',
    statusHired: 'تم التعيين والدفع',
    statusRejected: 'غير متوافق',
    totalJobs: 'إجمالي الوظائف',
    totalApplications: 'طلبات التقديم',
    shortlisted: 'القائمة القصيرة',
    hired: 'تم التوظيف',
    revenue: 'إيرادات ونسب المنصة',
    transactions: 'سجل العمليات'
  }
};

window.t = function(key) {
  const lang = window.AppState.lang;
  return (window.I18N[lang] && window.I18N[lang][key]) || (window.I18N['en'] && window.I18N['en'][key]) || key;
};

// API Client Wrapper
window.API = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (window.AppState.token) {
      headers['Authorization'] = `Bearer ${window.AppState.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Server request failed');
      }

      return data;
    } catch (err) {
      console.error('API Error on ' + endpoint, err);
      throw err;
    }
  },

  getStats() {
    return this.request('/api/meta/stats');
  },

  getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/jobs?${query}`);
  },

  getJob(id) {
    return this.request(`/api/jobs/${id}`);
  },

  saveJob(id) {
    return this.request(`/api/jobs/${id}/save`, { method: 'POST' });
  },

  applyJob(id, payload) {
    return this.request(`/api/jobs/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getCandidateApplications() {
    return this.request('/api/applications/candidate');
  },

  getEmployerApplications() {
    return this.request('/api/applications/employer');
  },

  updateApplicationStatus(id, payload) {
    return this.request(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  processCommissionPayment(payload) {
    return this.request('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  createPaymentIntent(application_id) {
    return this.request('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ application_id })
    });
  },

  uploadFile(file_data, filename, type = 'resume') {
    return this.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ file_data, filename, type })
    });
  },

  updateProfile(payload) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  updateCompanyProfile(payload) {
    return this.request('/api/companies/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  changePassword(current_password, new_password) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  },

  createStaff(payload) {
    return this.request('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateFeeRate(default_commission_rate) {
    return this.request('/api/admin/settings/fee', {
      method: 'PATCH',
      body: JSON.stringify({ default_commission_rate })
    });
  },

  deleteJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  },

  submitReport(payload) {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  logout() {
    return this.request('/api/auth/logout', {
      method: 'POST'
    }).catch(() => ({}));
  },

  getAdminStats() {
    return this.request('/api/admin/stats');
  },

  createJob(payload) {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateJob(id, payload) {
    return this.request(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register(payload) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMe() {
    return this.request('/api/auth/me');
  }
};

// Toast Notifications
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? window.Icons.checkCircle('w-5 h-5 text-emerald-400') :
               type === 'error' ? window.Icons.alertCircle('w-5 h-5 text-red-400') :
               window.Icons.shieldCheck('w-5 h-5 text-blue-400');

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
};

// Router
window.navigateTo = function(route, params = {}) {
  window.AppState.currentRoute = route;
  window.AppState.routeParams = params;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.renderApp();
};

// Currency Formatter
window.formatCurrency = function(amount, currency = 'USD') {
  const cur = currency || window.AppState.currency || 'USD';
  const num = Math.round(amount).toLocaleString();
  if (cur === 'SAR') return `${num} ر.س`;
  if (cur === 'AED') return `${num} د.إ`;
  if (cur === 'EUR') return `€${num}`;
  if (cur === 'GBP') return `£${num}`;
  if (cur === 'EGP') return `${num} ج.م`;
  return `$${num}`;
};

// Toggle Language
window.toggleLanguage = function() {
  const newLang = window.AppState.lang === 'en' ? 'ar' : 'en';
  window.AppState.lang = newLang;
  localStorage.setItem('jobplatform_lang', newLang);
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = newLang;
  window.renderApp();
  window.showToast(newLang === 'ar' ? 'تم تحويل اللغة إلى العربية' : 'Language switched to English', 'success');
};

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  document.documentElement.dir = window.AppState.lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = window.AppState.lang;

  // Retrieve platform configuration flags
  try {
    const meta = await window.API.getStats();
    window.AppState.demoEnabled = meta ? !!meta.demoModeActive : false;
    window.AppState.stripeConfigured = meta ? !!meta.stripeConfigured : false;
  } catch (e) {
    window.AppState.demoEnabled = false;
  }

  // Restore authenticated user session
  if (window.AppState.token) {
    try {
      const me = await window.API.getMe();
      window.AppState.user = me.user;
      window.AppState.company = me.company;
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      localStorage.removeItem('jobplatform_token');
      window.AppState.token = null;
      window.AppState.user = null;
    }
  }

  window.renderApp();
});
