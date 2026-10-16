// jobDetails.js - Job Details Page matching Top-Right Mockup
window.renderJobDetailsPage = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const jobId = window.AppState.routeParams.id || 'job_01';
  let jobData = null;

  try {
    const res = await window.API.getJob(jobId);
    jobData = res.job;
    window.AppState.activeApplication = res.application;
  } catch (err) {
    console.error('Job fetch error', err);
    return `
      <div class="container" style="padding: 4rem 1rem; text-align: center;">
        <h2>${isArabic ? 'الوظيفة غير موجودة' : 'Job not found'}</h2>
        <button onclick="navigateTo('jobs')" class="btn btn-primary" style="margin-top: 1rem;">
          ${window.t('backToJobs')}
        </button>
      </div>
    `;
  }

  const isDaily = jobData.job_type === 'daily_gig';
  const rateUnit = isDaily ? (isArabic ? '/ يوم' : '/ day') : (isArabic ? '/ سنة' : '/ year');
  const activeTab = window.AppState.activeTab || 'overview';
  const app = window.AppState.activeApplication;

  return `
    <div class="container job-details-page">
      <!-- Back to Jobs navigation (Requirement 14) -->
      <a href="javascript:void(0)" onclick="navigateTo('jobs')" class="back-link">
        ${isArabic ? window.Icons.arrowRight("w-4 h-4") : window.Icons.arrowLeft("w-4 h-4")}
        <span>${window.t('backToJobs')}</span>
      </a>

      <!-- Job Header Card -->
      <div class="card" style="margin-bottom: 2rem;">
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1.25rem;">
              <img src="${jobData.company_logo}" alt="${jobData.company_name}" style="width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-light); background: #FFFFFF;">
              <div>
                <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 0.35rem;">
                  ${jobData.title}
                </h1>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9375rem;">
                  <span style="font-weight: 600; color: var(--text-primary);">${jobData.company_name}</span>
                  ${jobData.company_verified ? window.Icons.badgeCheck("inline-block") : ''}
                  <span>•</span>
                  <span>${jobData.location}</span>
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <button onclick="toggleSaveJob('${jobData.id}')" class="btn btn-secondary">
                ${window.Icons.bookmark("w-4 h-4", jobData.is_saved)}
                <span>${jobData.is_saved ? window.t('saved') : window.t('saveJob')}</span>
              </button>

              ${app && app.status === 'offer' && app.payment_status === 'unpaid' ? `
                <button onclick="navigateTo('payment', { applicationId: '${app.id}' })" class="btn btn-primary" style="background:#059669; border-color:#059669;">
                  ${window.Icons.creditCard("w-4 h-4")}
                  <span>${isArabic ? 'سداد نسبة المنصة (3%) وقبول التوظيف' : 'Pay 3% Platform Fee & Accept Offer'}</span>
                </button>
              ` : app ? `
                <button class="btn btn-secondary" disabled style="opacity: 0.8; cursor: default;">
                  ${window.Icons.checkCircle("w-4 h-4 text-emerald-600")}
                  <span>${isArabic ? 'تم التقديم:' : 'Applied:'} ${app.status.toUpperCase()}</span>
                </button>
              ` : `
                <button onclick="openApplyModal('${jobData.id}', '${jobData.title}')" class="btn btn-primary btn-lg">
                  ${window.Icons.briefcase("w-5 h-5")}
                  <span>${window.t('applyNow')}</span>
                </button>
              `}
            </div>
          </div>

          <div class="job-tags" style="border-top: 1px solid #F1F5F9; padding-top: 1.25rem;">
            <span class="badge ${isDaily ? 'badge-daily' : 'badge-fulltime'}">
              ${isDaily ? (isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig / Shift') : (isArabic ? 'دوام كامل' : 'Full-time')}
            </span>
            <span class="badge badge-remote">${jobData.workplace_type.toUpperCase()}</span>
            <span class="badge" style="background:#F1F5F9; color:#334155;">${jobData.experience_level.toUpperCase()} LEVEL</span>
            <span class="badge" style="background:#EFF6FF; color:#1D4ED8;">${jobData.category}</span>
            <span class="badge" style="background:#ECFDF5; color:#065F46; font-weight:700;">
              ${window.formatCurrency(jobData.salary_min, jobData.currency)} - ${window.formatCurrency(jobData.salary_max, jobData.currency)} ${rateUnit}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Two-Column Grid: Tabs Content + Sidebar Info -->
      <div class="job-detail-grid">
        <!-- Main Column with Tabs -->
        <div>
          <!-- Tab Navigation (Matching Top-Right Mockup) -->
          <div class="tab-nav">
            <button onclick="setDetailTab('overview')" class="tab-btn ${activeTab === 'overview' ? 'active' : ''}">
              ${window.t('overview')}
            </button>
            <button onclick="setDetailTab('responsibilities')" class="tab-btn ${activeTab === 'responsibilities' ? 'active' : ''}">
              ${window.t('responsibilities')}
            </button>
            <button onclick="setDetailTab('requirements')" class="tab-btn ${activeTab === 'requirements' ? 'active' : ''}">
              ${window.t('requirements')}
            </button>
            <button onclick="setDetailTab('benefits')" class="tab-btn ${activeTab === 'benefits' ? 'active' : ''}">
              ${window.t('benefits')}
            </button>
            <button onclick="setDetailTab('company')" class="tab-btn ${activeTab === 'company' ? 'active' : ''}">
              ${window.t('companyProfile')}
            </button>
          </div>

          <!-- Tab 1: Overview -->
          <div class="card" style="margin-bottom: 1.5rem;">
            ${activeTab === 'overview' ? `
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">${isArabic ? 'عن الوظيفة' : 'About the job'}</h2>
              <p style="color: var(--text-secondary); line-height: 1.7; font-size: 1rem; margin-bottom: 1.5rem;">
                ${jobData.description}
              </p>
              
              <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem;">${isArabic ? 'أبرز مهام الدور' : 'Role Highlights'}</h3>
              <ul style="padding-inline-start: 1.25rem; color: var(--text-secondary); line-height: 1.8;">
                ${(jobData.responsibilities || []).slice(0, 3).map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : ''}

            ${activeTab === 'responsibilities' ? `
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">${window.t('responsibilities')}</h2>
              <ul style="padding-inline-start: 1.25rem; color: var(--text-secondary); line-height: 1.8;">
                ${(jobData.responsibilities || []).map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : ''}

            ${activeTab === 'requirements' ? `
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">${window.t('requirements')}</h2>
              <ul style="padding-inline-start: 1.25rem; color: var(--text-secondary); line-height: 1.8;">
                ${(jobData.requirements || []).map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : ''}

            ${activeTab === 'benefits' ? `
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">${window.t('benefits')} & Platform Protection</h2>
              <ul style="padding-inline-start: 1.25rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 1.5rem;">
                ${(jobData.benefits || []).map(b => `<li>${b}</li>`).join('')}
              </ul>
              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 1rem; display: flex; gap: 0.75rem;">
                ${window.Icons.shieldCheck("w-5 h-5 text-emerald-600 flex-shrink-0")}
                <div style="font-size: 0.875rem; color: #166534;">
                  <strong>${isArabic ? 'ضمان نسبة المنصة (3%):' : '3% Platform Fee Guarantee:'}</strong>
                  ${isArabic 
                    ? 'يتم دفع العمولة فقط عند إتمام التعاقد وقبول العرض الرسمي، وهي تحمي حقوق العامل والشركة في تسليم المستحقات.'
                    : 'The fee is only payable upon official hiring/offer acceptance, safeguarding worker rights and contract fulfillment through platform escrow.'
                  }
                </div>
              </div>
            ` : ''}

            ${activeTab === 'company' ? `
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">${jobData.company_name}</h2>
              <p style="color: var(--text-secondary); line-height: 1.7; font-size: 0.9375rem; margin-bottom: 1.5rem;">
                ${jobData.company_description || 'Global enterprise employer registered on JobPlatform.'}
              </p>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.875rem;">
                <div>
                  <div style="color: var(--text-muted);">${isArabic ? 'الموقع الرئيسي' : 'Headquarters'}</div>
                  <div style="font-weight: 600;">${jobData.company_location}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted);">${isArabic ? 'حجم المنشأة' : 'Company Size'}</div>
                  <div style="font-weight: 600;">${jobData.company_size || 'Enterprise'}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Sidebar Details Card (Matching Top-Right Mockup) -->
        <div>
          <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
              ${isArabic ? 'تفاصيل الوظيفة' : 'Job Details'}
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem;">
                <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                  ${window.Icons.calendar("w-4 h-4")}
                  <span>${isArabic ? 'تاريخ النشر' : 'Posted'}</span>
                </span>
                <span style="font-weight: 600;">3 days ago</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem;">
                <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                  ${window.Icons.briefcase("w-4 h-4")}
                  <span>${isArabic ? 'نوع العمل' : 'Job Type'}</span>
                </span>
                <span style="font-weight: 600;">${isDaily ? (isArabic ? 'عمل يومي' : 'Daily Gig') : (isArabic ? 'دوام كامل' : 'Full-time')}</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem;">
                <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                  ${window.Icons.user("w-4 h-4")}
                  <span>${isArabic ? 'مستوى الخبرة' : 'Experience'}</span>
                </span>
                <span style="font-weight: 600;">${jobData.experience_level.toUpperCase()}</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem;">
                <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                  ${window.Icons.mapPin("w-4 h-4")}
                  <span>${isArabic ? 'الموقع' : 'Location'}</span>
                </span>
                <span style="font-weight: 600;">${jobData.location}</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem;">
                <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                  ${window.Icons.dollarSign("w-4 h-4")}
                  <span>${isArabic ? 'الراتب / الأجر' : 'Salary / Rate'}</span>
                </span>
                <span style="font-weight: 700; color: #059669;">
                  ${window.formatCurrency(jobData.salary_min, jobData.currency)} - ${window.formatCurrency(jobData.salary_max, jobData.currency)} ${rateUnit}
                </span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem; background: #F8FAFC; padding: 0.625rem; border-radius: 6px;">
                <span style="color: var(--text-muted); font-size: 0.8125rem;">
                  ${isArabic ? 'عمولة المنصة عند التعيين' : 'Platform Escrow Fee'}
                </span>
                <span style="font-weight: 700; color: var(--color-primary); font-size: 0.875rem;">
                  3.0%
                </span>
              </div>
            </div>

            <!-- Share Buttons -->
            <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-light); padding-top: 1.25rem;">
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.75rem;">
                ${isArabic ? 'مشاركة هذه الوظيفة' : 'Share this job'}
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="copyJobLink()" class="btn btn-sm btn-secondary" style="flex: 1;">
                  ${window.Icons.share("w-4 h-4")}
                  <span>${isArabic ? 'نسخ الرابط' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Tabs switch
window.setDetailTab = function(tab) {
  window.AppState.activeTab = tab;
  window.renderApp();
};

// Copy link
window.copyJobLink = function() {
  navigator.clipboard.writeText(window.location.href);
  window.showToast(window.AppState.lang === 'ar' ? 'تم نسخ رابط الوظيفة بنجاح' : 'Job link copied to clipboard', 'success');
};

// Open Application Modal
window.openApplyModal = function(jobId, jobTitle) {
  if (!window.AppState.user) {
    window.showToast(window.AppState.lang === 'ar' ? 'يرجى تسجيل الدخول أولاً للتقديم' : 'Please log in to apply', 'error');
    window.openAuthModal('login');
    return;
  }

  const isArabic = window.AppState.lang === 'ar';
  const modal = document.getElementById('applyModal');
  const user = window.AppState.user;

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${window.t('applyNow')}</h3>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">${jobTitle}</p>
        </div>
        <button onclick="closeApplyModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="submitJobApplication(event, '${jobId}')" class="modal-body">
        <div class="form-group">
          <label class="form-label">${isArabic ? 'الاسم الكامل' : 'Full Name'}</label>
          <input type="text" class="form-control" value="${user.name}" readonly style="background: #F8FAFC;">
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
          <input type="email" class="form-control" value="${user.email}" readonly style="background: #F8FAFC;">
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'رسالة التقديم (Cover Letter)' : 'Cover Letter'}</label>
          <textarea id="applyCoverLetter" rows="4" class="form-control" placeholder="${isArabic ? 'اكتب نبذة عن خبرتك ولماذا أنت الأنسب لهذا المنصب...' : 'Explain your background and why you are the best candidate...'}" required>I am excited to apply for this role. With my specialized experience and track record, I am confident in delivering high-impact results for your team.</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'السيرة الذاتية (CV / Resume)' : 'Resume / Portfolio CV'}</label>
          <div style="border: 2px dashed var(--border-medium); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; background: #F8FAFC;">
            ${window.Icons.download("w-6 h-6 text-blue-600 mx-auto mb-2")}
            <div style="font-size: 0.875rem; font-weight: 600;">${user.name.replace(/\s+/g, '_')}_Resume_2026.pdf</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${isArabic ? 'تم إرفاق السيرة الذاتية المعتمدة تلقائياً' : 'Verified Profile Resume Attached (1.2 MB)'}</div>
          </div>
        </div>

        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8125rem; color: #1D4ED8; margin-bottom: 1.5rem; display: flex; gap: 0.5rem;">
          ${window.Icons.shieldCheck("w-5 h-5 flex-shrink-0")}
          <span>${isArabic ? 'ملاحظة: عند قبول العرض الوظيفي يتم سداد نسبة المنصة (3%) لتفعيل العقد رسمياً.' : 'Platform terms: The 3% escrow fee is only paid after official offer acceptance.'}</span>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.checkCircle("w-4 h-4")}
          <span>${isArabic ? 'تأكيد وإرسال طلب التقديم' : 'Submit Application'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeApplyModal = function() {
  const modal = document.getElementById('applyModal');
  if (modal) modal.classList.remove('active');
};

window.submitJobApplication = async function(e, jobId) {
  e.preventDefault();
  const cover_letter = document.getElementById('applyCoverLetter').value;

  try {
    const res = await window.API.applyJob(jobId, { cover_letter });
    window.closeApplyModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};
