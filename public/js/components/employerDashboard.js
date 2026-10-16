// employerDashboard.js - Employer / Company Portal matching Middle-Center Mockup
window.renderEmployerDashboard = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const user = window.AppState.user;
  const company = window.AppState.company;

  let applications = [];
  let jobs = [];

  try {
    const res = await window.API.getEmployerApplications();
    applications = res.applications || [];
    jobs = res.jobs || [];
    window.AppState._employerJobsCache = jobs;
  } catch (err) {
    console.error('Employer dash error', err);
  }

  const shortlistedCount = applications.filter(a => a.status === 'interview' || a.status === 'under_review').length;
  const hiredCount = applications.filter(a => a.status === 'hired').length;
  const activeTab = window.AppState.employerActiveTab || 'candidates';

  return `
    <div class="container" style="padding-top: 2.5rem; padding-bottom: 5rem;">
      <!-- Welcome Header (Matching Middle-Center Mockup) -->
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="${company ? company.logo : user.avatar}" alt="${company ? company.name : user.name}" style="width: 56px; height: 56px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-light); background:#fff;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: #0284C7; text-transform: uppercase; margin-bottom: 0.2rem;">
              <span>${company ? company.industry : 'Verified Employer'}</span>
              <span>•</span>
              <span>${company ? company.location : 'Global'}</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 0.25rem;">
              ${window.t('welcomeBack')}, ${company ? company.name : user.name}!
            </h1>
            <p style="color: var(--text-muted); font-size: 0.9375rem;">
              ${isArabic ? 'إليك ملخص أداء التوظيف والطلبات الواردة لشركتك.' : "Here's what's happening across your active job postings."}
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button onclick="openCompanyProfileModal()" class="btn btn-secondary">
            ${window.Icons.briefcase("w-4 h-4")}
            <span>${isArabic ? 'تعديل بيانات الشركة' : 'Edit Company Profile'}</span>
          </button>
          <button onclick="openPostJobModal()" class="btn btn-primary">
            ${window.Icons.plus("w-4 h-4")}
            <span>${window.t('postJob')}</span>
          </button>
        </div>
      </div>

      <!-- Stat Cards Grid (Matching Middle-Center Mockup) -->
      <div class="dashboard-stats-grid">
        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${window.t('totalJobs')}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #0284C7;">
              ${jobs.length}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.briefcase("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${window.t('totalApplications')}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #2563EB;">
              ${applications.length}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.users("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${window.t('shortlisted')}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #D97706;">
              ${shortlistedCount}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #FFFBEB; color: #D97706; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.bookmark("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${window.t('hired')}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #059669;">
              ${hiredCount}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.checkCircle("w-5 h-5")}
          </div>
        </div>
      </div>

      <!-- Navigation Tabs: Candidates vs My Job Postings -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-medium); padding-bottom: 0.5rem;">
        <button onclick="setEmployerTab('candidates')" class="btn ${activeTab === 'candidates' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.875rem;">
          ${window.Icons.users("w-4 h-4")}
          <span>${isArabic ? `طلبات المرشحين (${applications.length})` : `Candidate Inflow (${applications.length})`}</span>
        </button>
        <button onclick="setEmployerTab('jobs')" class="btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.875rem;">
          ${window.Icons.briefcase("w-4 h-4")}
          <span>${isArabic ? `إدارة وظائف الشركة (${jobs.length})` : `My Job Postings (${jobs.length})`}</span>
        </button>
      </div>

      ${activeTab === 'candidates' ? `
        <!-- Main Layout: Applications Overview Chart + Recent Applications List -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 2.5rem;">
          <!-- Applications Overview SVG Trend Line (Matching Middle-Center Mockup) -->
          <div class="card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.125rem; font-weight: 700;">
                  ${isArabic ? 'نظرة عامة على طلبات التقديم (Applications Overview)' : 'Applications Overview'}
                </h2>
                <p style="font-size: 0.8125rem; color: var(--text-muted);">
                  ${isArabic ? 'معدل نمو واستقبال المتقدمين اليومي والشهري' : 'Applicant inflow trajectory and conversion velocity'}
                </p>
              </div>

              <!-- Timeframe toggles -->
              <div style="display: flex; gap: 0.25rem; background: #F1F5F9; padding: 0.25rem; border-radius: var(--radius-sm);">
                <button class="btn btn-sm" style="background:#fff; box-shadow:var(--shadow-xs); font-size:0.75rem; padding: 0.25rem 0.5rem;">7 days</button>
                <button class="btn btn-sm" style="background:transparent; font-size:0.75rem; padding: 0.25rem 0.5rem; color:var(--text-muted);">30 days</button>
                <button class="btn btn-sm" style="background:transparent; font-size:0.75rem; padding: 0.25rem 0.5rem; color:var(--text-muted);">3 months</button>
                <button class="btn btn-sm" style="background:transparent; font-size:0.75rem; padding: 0.25rem 0.5rem; color:var(--text-muted);">1 year</button>
              </div>
            </div>

            <!-- Clean Smooth SVG Trend Line Chart -->
            <div style="width: 100%; height: 200px; position: relative;">
              <svg viewBox="0 0 700 180" style="width: 100%; height: 100%; overflow: visible;">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <!-- Grid lines -->
                <line x1="0" y1="30" x2="700" y2="30" stroke="#F1F5F9" stroke-width="1"/>
                <line x1="0" y1="80" x2="700" y2="80" stroke="#F1F5F9" stroke-width="1"/>
                <line x1="0" y1="130" x2="700" y2="130" stroke="#F1F5F9" stroke-width="1"/>
                <!-- Shaded Area -->
                <path d="M 0 150 Q 120 140, 200 110 T 380 90 T 520 40 T 700 20 L 700 180 L 0 180 Z" fill="url(#chartGradient)"/>
                <!-- Curve Stroke -->
                <path d="M 0 150 Q 120 140, 200 110 T 380 90 T 520 40 T 700 20" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
                <!-- Nodes -->
                <circle cx="200" cy="110" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="380" cy="90" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="520" cy="40" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="700" cy="20" r="5" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2"/>
              </svg>
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                <span>Apr 1</span>
                <span>Apr 8</span>
                <span>Apr 15</span>
                <span>Apr 22</span>
                <span>Apr 29</span>
              </div>
            </div>
          </div>

          <!-- Recent Candidates List -->
          <div class="card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
              <h2 style="font-size: 1.125rem; font-weight: 700;">
                ${isArabic ? 'طلبات المتقدمين وإجراءات التوظيف' : 'Candidate Applications & Actions'}
              </h2>
              <span style="font-size: 0.8125rem; color: var(--text-muted);">${applications.length} candidates</span>
            </div>

            ${applications.length === 0 ? `
              <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                ${isArabic ? 'لا توجد طلبات تقديم حالية.' : 'No candidate applications received yet.'}
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${applications.map(app => renderEmployerAppItem(app, isArabic)).join('')}
              </div>
            `}
          </div>
        </div>
      ` : `
        <!-- My Job Postings Management Tab -->
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
            <div>
              <h2 style="font-size: 1.125rem; font-weight: 700;">
                ${isArabic ? 'إدارة الوظائف المنشورة للشركة' : 'Manage Posted Opportunities'}
              </h2>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                ${isArabic ? 'يمكنك تعديل تفاصيل الوظيفة أو حذفها أو متابعة تفاصيلها العامة' : 'Edit job postings, update compensation packages, or close listings'}
              </p>
            </div>
            <button onclick="openPostJobModal()" class="btn btn-sm btn-primary">
              ${window.Icons.plus("w-4 h-4")}
              <span>${window.t('postJob')}</span>
            </button>
          </div>

          ${jobs.length === 0 ? `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
              <p>${isArabic ? 'لم تنشر أي وظيفة بعد.' : 'No active jobs posted under this company account yet.'}</p>
              <button onclick="openPostJobModal()" class="btn btn-primary" style="margin-top: 1rem;">
                ${window.t('postJob')}
              </button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${jobs.map(job => renderEmployerJobItem(job, isArabic)).join('')}
            </div>
          `}
        </div>
      `}
    </div>
  `;
};

// Switch tab in Employer Dashboard
window.setEmployerTab = function(tabName) {
  window.AppState.employerActiveTab = tabName;
  window.renderApp();
};

// Render Employer Application Item with Live Status Actions
function renderEmployerAppItem(app, isArabic) {
  return `
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #FFFFFF;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${app.candidate_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="${app.candidate_name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 700; font-size: 1.0625rem; color: var(--text-primary);">
            ${app.candidate_name}
          </div>
          <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.15rem;">
            <span>${app.job_title}</span>
            <span style="margin: 0 0.35rem;">•</span>
            <span style="font-family: monospace;">${app.candidate_email}</span>
            ${app.candidate_phone ? `<span style="margin: 0 0.35rem;">•</span><span>${app.candidate_phone}</span>` : ''}
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <span class="badge ${app.status === 'hired' ? 'badge-status-hired' : (app.status === 'offer' ? 'badge-status-offer' : 'badge-status-review')}">
          ${app.status.toUpperCase()}
        </span>

        <!-- Status Change Dropdown -->
        <select onchange="updateCandidateStatus('${app.id}', this.value)" style="border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 0.35rem 0.5rem; font-size: 0.8125rem; background: #FFFFFF; font-family: inherit; cursor: pointer;">
          <option value="">${isArabic ? 'تحديث الحالة...' : 'Change Status...'}</option>
          <option value="under_review">${isArabic ? 'قيد المراجعة' : 'Under Review'}</option>
          <option value="interview">${isArabic ? 'تحديد مقابلة' : 'Schedule Interview'}</option>
          <option value="offer">${isArabic ? 'إرسال عرض عمل (Offer)' : 'Extend Offer (3% Fee)'}</option>
          <option value="hired">${isArabic ? 'تم التعيين' : 'Mark Hired'}</option>
          <option value="rejected">${isArabic ? 'استبعاد' : 'Reject'}</option>
        </select>
      </div>
    </div>
  `;
}

// Render Employer Job Item with Edit and Delete
function renderEmployerJobItem(job, isArabic) {
  const isDaily = job.job_type === 'daily_gig';
  const rateUnit = isDaily ? (isArabic ? '/ يوم' : '/ day') : (isArabic ? '/ سنة' : '/ year');

  return `
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #FFFFFF;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
          <span style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); cursor: pointer;" onclick="navigateTo('jobDetails', { id: '${job.id}' })">
            ${job.title}
          </span>
          <span class="badge ${isDaily ? 'badge-daily' : 'badge-fulltime'}" style="font-size: 0.75rem;">
            ${isDaily ? (isArabic ? '⚡ عمل يومي' : '⚡ Daily Gig') : (isArabic ? 'دوام كامل' : 'Full-time')}
          </span>
        </div>
        <div style="font-size: 0.8125rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 0.75rem;">
          <span>📍 ${job.location}</span>
          <span>💼 ${job.category}</span>
          <span style="font-weight: 700; color: #059669;">
            ${window.formatCurrency(job.salary_min, job.currency)} - ${window.formatCurrency(job.salary_max, job.currency)} ${rateUnit}
          </span>
          <span>📅 ${new Date(job.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button onclick="navigateTo('jobDetails', { id: '${job.id}' })" class="btn btn-sm btn-secondary">
          ${window.Icons.search("w-3.5 h-3.5")}
          <span>${isArabic ? 'معاينة' : 'View'}</span>
        </button>
        <button onclick="openEditJobModal('${job.id}')" class="btn btn-sm btn-secondary">
          ${window.Icons.user("w-3.5 h-3.5")}
          <span>${isArabic ? 'تعديل' : 'Edit'}</span>
        </button>
        <button onclick="handleDeleteJob('${job.id}')" class="btn btn-sm" style="background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5;">
          ${window.Icons.close("w-3.5 h-3.5")}
          <span>${isArabic ? 'حذف' : 'Delete'}</span>
        </button>
      </div>
    </div>
  `;
}

// Action Handler for Candidate Status Change
window.updateCandidateStatus = async function(appId, newStatus) {
  if (!newStatus) return;

  try {
    let offer_salary = undefined;
    if (newStatus === 'offer') {
      const promptText = window.AppState.lang === 'ar' 
        ? 'أدخل الراتب السنوي المتفق عليه (أو قيمة العقد اليومي بالدولار) لحساب نسبة المنصة (3%):'
        : 'Enter agreed salary or contract value for 3% platform commission calculation ($):';
      const inputVal = prompt(promptText, '120000');
      if (inputVal) offer_salary = parseFloat(inputVal);
    }

    const res = await window.API.updateApplicationStatus(appId, { status: newStatus, offer_salary });
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// Modal: Edit Job
window.openEditJobModal = function(jobId) {
  const jobs = window.AppState._employerJobsCache || [];
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const isArabic = window.AppState.lang === 'ar';
  let modal = document.getElementById('editJobModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editJobModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${isArabic ? 'تعديل بيانات الوظيفة' : 'Edit Job Opportunity'}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'تحديث معلومات الفرصة الوظيفية والأجور' : 'Update job requirements, compensation, and category'}
          </p>
        </div>
        <button onclick="closeEditJobModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handleUpdateJobSubmit(event, '${job.id}')" class="modal-body">
        <div class="form-group">
          <label class="form-label">${isArabic ? 'المسمى الوظيفي' : 'Job Title'}</label>
          <input id="editJobTitle" type="text" class="form-control" value="${job.title}" required>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${window.t('jobType')}</label>
            <select id="editJobType" class="form-control">
              <option value="full_time" ${job.job_type === 'full_time' ? 'selected' : ''}>${isArabic ? 'دوام كامل' : 'Full-time'}</option>
              <option value="daily_gig" ${job.job_type === 'daily_gig' ? 'selected' : ''}>${isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig / Shift'}</option>
              <option value="part_time" ${job.job_type === 'part_time' ? 'selected' : ''}>${isArabic ? 'دوام جزئي' : 'Part-time'}</option>
              <option value="contract" ${job.job_type === 'contract' ? 'selected' : ''}>${isArabic ? 'عقد مشروع' : 'Contract'}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'المجال الوظيفي' : 'Category'}</label>
            <input id="editJobCategory" type="text" class="form-control" value="${job.category}" required>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الموقع الجغرافي' : 'Location'}</label>
            <input id="editJobLocation" type="text" class="form-control" value="${job.location}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الحد الأدنى للأجر ($)' : 'Min Salary ($)'}</label>
            <input id="editJobSalaryMin" type="number" class="form-control" value="${job.salary_min}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'الحد الأقصى للأجر ($)' : 'Max Salary ($)'}</label>
          <input id="editJobSalaryMax" type="number" class="form-control" value="${job.salary_max}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'وصف الوظيفة' : 'Job Description'}</label>
          <textarea id="editJobDesc" rows="4" class="form-control" required>${job.description}</textarea>
        </div>

        <button id="saveJobBtn" type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.checkCircle("w-4 h-4")}
          <span>${isArabic ? 'حفظ التعديلات' : 'Save Changes'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeEditJobModal = function() {
  const modal = document.getElementById('editJobModal');
  if (modal) modal.classList.remove('active');
};

// Handle Update Job Form Submit
window.handleUpdateJobSubmit = async function(e, jobId) {
  e.preventDefault();
  const btn = document.getElementById('saveJobBtn');
  btn.disabled = true;

  const title = document.getElementById('editJobTitle').value;
  const job_type = document.getElementById('editJobType').value;
  const category = document.getElementById('editJobCategory').value;
  const location = document.getElementById('editJobLocation').value;
  const salary_min = document.getElementById('editJobSalaryMin').value;
  const salary_max = document.getElementById('editJobSalaryMax').value;
  const description = document.getElementById('editJobDesc').value;

  try {
    const res = await window.API.updateJob(jobId, {
      title,
      job_type,
      category,
      location,
      salary_min,
      salary_max,
      description
    });
    closeEditJobModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    btn.disabled = false;
    window.showToast(err.message, 'error');
  }
};

// Handle Delete Job
window.handleDeleteJob = async function(jobId) {
  const isArabic = window.AppState.lang === 'ar';
  const confirmMsg = isArabic ? 'هل أنت متأكد من حذف هذه الوظيفة نهائياً؟' : 'Are you sure you want to permanently delete this job posting?';
  if (!confirm(confirmMsg)) return;

  try {
    const res = await window.API.deleteJob(jobId);
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// Modal: Edit Company Profile
window.openCompanyProfileModal = function() {
  const isArabic = window.AppState.lang === 'ar';
  const company = window.AppState.company || {};

  let modal = document.getElementById('companyProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'companyProfileModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${isArabic ? 'تعديل بيانات وملف الشركة' : 'Edit Company Profile'}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'تظهر هذه المعلومات في صفحات الوظائف لجذب أفضل الكفاءات' : 'Company overview presented to candidate talent'}
          </p>
        </div>
        <button onclick="closeCompanyProfileModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handleCompanyProfileSubmit(event)" class="modal-body">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'اسم الشركة' : 'Company Name'}</label>
            <input id="compName" type="text" class="form-control" value="${company.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الموقع الإلكتروني' : 'Website'}</label>
            <input id="compWebsite" type="url" class="form-control" value="${company.website || ''}" placeholder="https://company.com">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'مجال الصناعة' : 'Industry'}</label>
            <input id="compIndustry" type="text" class="form-control" value="${company.industry || ''}" placeholder="Cloud Computing, Healthcare, Logistics" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'المقر الرئيسي / الدولة' : 'Headquarters / Location'}</label>
            <input id="compLocation" type="text" class="form-control" value="${company.location || ''}" placeholder="Riyadh, Saudi Arabia / San Francisco, CA" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'حجم فريق العمل' : 'Company Size'}</label>
          <input id="compSize" type="text" class="form-control" value="${company.size || '50-200'}" placeholder="10-50, 50-200, 1000+ employees">
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'نبذة عن الشركة ومزايا العمل' : 'Company Overview & Culture'}</label>
          <textarea id="compDesc" rows="4" class="form-control" placeholder="${isArabic ? 'اكتب نبذة عن رؤية الشركة...' : 'Describe what makes your team exceptional...'}">${company.description || ''}</textarea>
        </div>

        <button id="saveCompBtn" type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.checkCircle("w-4 h-4")}
          <span>${isArabic ? 'حفظ بيانات الشركة' : 'Save Company Details'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeCompanyProfileModal = function() {
  const modal = document.getElementById('companyProfileModal');
  if (modal) modal.classList.remove('active');
};

// Handle Company Profile Submit
window.handleCompanyProfileSubmit = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('saveCompBtn');
  btn.disabled = true;

  const name = document.getElementById('compName').value;
  const website = document.getElementById('compWebsite').value;
  const industry = document.getElementById('compIndustry').value;
  const location = document.getElementById('compLocation').value;
  const size = document.getElementById('compSize').value;
  const description = document.getElementById('compDesc').value;

  try {
    const res = await window.API.updateCompanyProfile({
      name,
      website,
      industry,
      location,
      size,
      description
    });
    if (res.company) {
      window.AppState.company = res.company;
    }
    closeCompanyProfileModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    btn.disabled = false;
    window.showToast(err.message, 'error');
  }
};
