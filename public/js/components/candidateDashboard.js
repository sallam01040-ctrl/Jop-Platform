// candidateDashboard.js - Candidate Portal matching Middle-Left Mockup
window.renderCandidateDashboard = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const user = window.AppState.user;

  let applications = [];
  let savedJobs = [];

  try {
    const res = await window.API.getCandidateApplications();
    applications = res.applications || [];
    savedJobs = res.savedJobs || [];
  } catch (err) {
    console.error('Candidate dash error', err);
  }

  const interviewsCount = applications.filter(a => a.status === 'interview').length;
  const offersCount = applications.filter(a => a.status === 'offer' || a.status === 'hired').length;
  const skillsArray = user.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return `
    <div class="container" style="padding-top: 2.5rem; padding-bottom: 5rem;">
      <!-- Welcome Header (Matching Middle-Left Mockup) -->
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 0.25rem;">
              ${window.t('welcomeBack')}, ${user.name.split(' ')[0]}!
            </h1>
            <p style="color: var(--text-muted); font-size: 0.9375rem;">
              ${isArabic ? 'إليك آخر المستجدات حول طلبات التقديم والوظائف الخاصة بك.' : "Here's what's happening with your applications."}
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button onclick="openCandidateProfileModal()" class="btn btn-secondary">
            ${window.Icons.user("w-4 h-4")}
            <span>${isArabic ? 'تعديل الملف والسيرة الذاتية' : 'Edit Profile & CV'}</span>
          </button>
          <button onclick="navigateTo('jobs')" class="btn btn-primary">
            ${window.Icons.search("w-4 h-4")}
            <span>${isArabic ? 'استكشف وظائف جديدة' : 'Explore Jobs'}</span>
          </button>
        </div>
      </div>

      <!-- Candidate Professional Profile Overview Card -->
      <div class="card" style="margin-bottom: 2rem; background: linear-gradient(to right, #FFFFFF, #F8FAFC); border: 1px solid var(--border-medium);">
        <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1.5rem;">
          <div style="flex: 1; min-width: 280px;">
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              ${isArabic ? 'الملف المهني المعتمد' : 'Verified Talent Profile'}
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
              ${user.headline || (isArabic ? 'مرشح معتمد في المنصة' : 'Verified Professional Candidate')}
            </h2>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; max-width: 700px;">
              ${user.bio || (isArabic ? 'قم بتحديث النبذة التعريفية وسنوات الخبرة لزيادة فرص استلام العروض الوظيفية.' : 'Update your bio and experience to receive tailored international job offers.')}
            </p>

            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.8125rem; color: var(--text-muted);">
              <div>
                <strong style="color: var(--text-primary);">${isArabic ? 'البريد الإلكتروني:' : 'Email:'}</strong>
                <span style="font-family: monospace; margin-inline-start: 0.25rem;">${user.email}</span>
              </div>
              ${user.phone ? `
                <div>
                  <strong style="color: var(--text-primary);">${isArabic ? 'الهاتف:' : 'Phone:'}</strong>
                  <span style="margin-inline-start: 0.25rem;">${user.phone}</span>
                </div>
              ` : ''}
              <div>
                <strong style="color: var(--text-primary);">${isArabic ? 'سنوات الخبرة:' : 'Experience:'}</strong>
                <span style="margin-inline-start: 0.25rem;">${user.experience_years || 0} ${isArabic ? 'سنوات' : 'years'}</span>
              </div>
            </div>
          </div>

          <!-- Attached Resume Card & Skills -->
          <div style="min-width: 260px; max-width: 340px; width: 100%;">
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
              ${isArabic ? 'السيرة الذاتية (CV)' : 'Verified Resume (CV)'}
            </div>
            ${user.resume_url ? `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
                  ${window.Icons.download("w-5 h-5 text-blue-600 flex-shrink-0")}
                  <span style="font-size: 0.8125rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    ${user.resume_url.split('/').pop()}
                  </span>
                </div>
                <a href="${user.resume_url}" target="_blank" class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; flex-shrink: 0;">
                  ${isArabic ? 'معاينة' : 'View'}
                </a>
              </div>
            ` : `
              <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.8125rem; color: #B45309;">
                  ${isArabic ? 'لم ترفع سيرتك الذاتية بعد' : 'No CV uploaded yet'}
                </span>
                <button onclick="openCandidateProfileModal()" class="btn btn-sm btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                  ${isArabic ? 'رفع CV' : 'Upload'}
                </button>
              </div>
            `}

            <!-- Skills List -->
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">
              ${isArabic ? 'المهارات المعتمدة' : 'Verified Skills'}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
              ${skillsArray.length > 0 ? skillsArray.map(skill => `
                <span class="badge" style="background: #EFF6FF; color: #1D4ED8; font-size: 0.75rem; padding: 0.2rem 0.5rem;">
                  ${skill}
                </span>
              `).join('') : `
                <span style="font-size: 0.75rem; color: var(--text-muted);">${isArabic ? 'أضف مهاراتك من نافذة التعديل' : 'No skills listed yet'}</span>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- Stat Cards Grid (Matching Middle-Left Mockup) -->
      <div class="dashboard-stats-grid">
        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${isArabic ? 'إجمالي الطلبات' : 'Applications'}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary);">
              ${applications.length}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.briefcase("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${isArabic ? 'المقابلات' : 'Interviews'}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #1D4ED8;">
              ${interviewsCount}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.user("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${isArabic ? 'العروض الوظيفية' : 'Offers'}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #059669;">
              ${offersCount}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.checkCircle("w-5 h-5")}
          </div>
        </div>

        <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">
              ${isArabic ? 'الوظائف المحفوظة' : 'Saved Jobs'}
            </div>
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary);">
              ${savedJobs.length}
            </div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #F8FAFC; color: #475569; display: flex; align-items: center; justify-content: center;">
            ${window.Icons.bookmark("w-5 h-5")}
          </div>
        </div>
      </div>

      <!-- Recent Applications Section (Matching Middle-Left Mockup) -->
      <div class="card" style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700;">
            ${window.t('recentApplications')}
          </h2>
          <span style="font-size: 0.875rem; color: var(--text-muted);">
            ${isArabic ? `${applications.length} طلبات مسجلة` : `${applications.length} total tracked`}
          </span>
        </div>

        ${applications.length === 0 ? `
          <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <p>${isArabic ? 'لم تقم بالتقديم على أي وظيفة حتى الآن.' : 'You have not submitted any applications yet.'}</p>
            <button onclick="navigateTo('jobs')" class="btn btn-primary" style="margin-top: 1rem;">
              ${isArabic ? 'تصفح الوظائف الآن' : 'Browse Available Jobs'}
            </button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${applications.map(app => renderCandidateAppItem(app, isArabic)).join('')}
          </div>
        `}
      </div>

      <!-- Saved Jobs Section -->
      ${savedJobs.length > 0 ? `
        <div class="card">
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
            ${isArabic ? 'الوظائف المحفوظة للمراجعة' : 'Bookmarked Jobs for Later'}
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
            ${savedJobs.map(job => `
              <div class="card" style="padding: 1rem; border: 1px solid var(--border-light); cursor: pointer;" onclick="navigateTo('jobDetails', { id: '${job.id}' })">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <img src="${job.company_logo}" alt="${job.company_name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;">
                  <div>
                    <div style="font-weight: 700; font-size: 0.9375rem;">${job.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${job.company_name}</div>
                  </div>
                </div>
                <div style="font-size: 0.8125rem; font-weight: 600; color: #059669;">
                  ${window.formatCurrency(job.salary_min, job.currency)} - ${window.formatCurrency(job.salary_max, job.currency)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

// Render Candidate Application Item
function renderCandidateAppItem(app, isArabic) {
  let badgeClass = 'badge-status-applied';
  let statusText = isArabic ? 'تم التقديم' : 'Applied';
  let actionButton = '';

  if (app.status === 'under_review') {
    badgeClass = 'badge-status-review';
    statusText = isArabic ? 'قيد المراجعة' : 'Under Review';
  } else if (app.status === 'interview') {
    badgeClass = 'badge-status-interview';
    statusText = isArabic ? 'تم تحديد مقابلة' : 'Interview';
  } else if (app.status === 'offer') {
    badgeClass = 'badge-status-offer';
    statusText = isArabic ? 'عرض وظيفي متاح' : 'Offer Extended';
    // Direct trigger to Pay 3% Commission!
    actionButton = `
      <button onclick="navigateTo('payment', { applicationId: '${app.id}' })" class="btn btn-sm btn-primary" style="background:#059669; border-color:#059669;">
        ${window.Icons.creditCard("w-3.5 h-3.5")}
        <span>${isArabic ? 'سداد نسبة 3% وقبول العرض' : 'Pay 3% Fee & Finalize'}</span>
      </button>
    `;
  } else if (app.status === 'hired') {
    badgeClass = 'badge-status-hired';
    statusText = isArabic ? 'تم التعيين والدفع' : 'Hired & Fee Paid';
    actionButton = `
      <button onclick="navigateTo('payment', { applicationId: '${app.id}' })" class="btn btn-sm btn-secondary">
        ${window.Icons.download("w-3.5 h-3.5")}
        <span>${isArabic ? 'عرض الإيصال' : 'View Receipt'}</span>
      </button>
    `;
  } else if (app.status === 'rejected') {
    badgeClass = 'badge-status-rejected';
    statusText = isArabic ? 'مرفوض' : 'Rejected';
  }

  const isDaily = app.job_type === 'daily_gig';
  const rateUnit = isDaily ? (isArabic ? '/ يوم' : '/ day') : (isArabic ? '/ سنة' : '/ year');

  return `
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #FFFFFF;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${app.company_logo}" alt="${app.company_name}" style="width: 44px; height: 44px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-light);">
        <div>
          <div style="font-weight: 700; font-size: 1.0625rem; color: var(--text-primary); cursor: pointer;" onclick="navigateTo('jobDetails', { id: '${app.job_id}' })">
            ${app.job_title}
          </div>
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.2rem;">
            <span>${app.company_name}</span>
            <span style="margin: 0 0.35rem;">•</span>
            <span>${app.job_location}</span>
            <span style="margin: 0 0.35rem;">•</span>
            <span>${new Date(app.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span class="badge ${badgeClass}" style="font-size: 0.8125rem; padding: 0.35rem 0.75rem;">
          ${statusText}
        </span>
        ${actionButton}
      </div>
    </div>
  `;
}

// Open Candidate Profile & Resume Modal
window.openCandidateProfileModal = function() {
  const isArabic = window.AppState.lang === 'ar';
  const user = window.AppState.user;

  let modal = document.getElementById('candidateProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'candidateProfileModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${isArabic ? 'تعديل الملف المهني والسيرة الذاتية' : 'Edit Professional Profile & CV'}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'بياناتك تظهر لأصحاب العمل والشركات العالمية عند التقديم' : 'Your verified profile is presented to global hiring employers'}
          </p>
        </div>
        <button onclick="closeCandidateProfileModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handleSaveCandidateProfile(event)" class="modal-body">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الاسم الكامل' : 'Full Name'}</label>
            <input id="profName" type="text" class="form-control" value="${user.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input id="profPhone" type="text" class="form-control" value="${user.phone || ''}" placeholder="+1 555-0199">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'المسمى المهني الرئيسي' : 'Professional Headline'}</label>
          <input id="profHeadline" type="text" class="form-control" value="${user.headline || ''}" placeholder="e.g. Senior Full-Stack Engineer / Specialist Electrician" required>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'سنوات الخبرة' : 'Years Experience'}</label>
            <input id="profExperience" type="number" class="form-control" value="${user.experience_years || 0}" min="0" max="50">
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'المهارات (مفصولة بفاصلة)' : 'Skills (Comma separated)'}</label>
            <input id="profSkills" type="text" class="form-control" value="${user.skills || ''}" placeholder="React, Node.js, Cloud, SQL">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'نبذة مهنية موجزة (Bio)' : 'Professional Bio'}</label>
          <textarea id="profBio" rows="3" class="form-control" placeholder="${isArabic ? 'اكتب نبذة عن مؤهلاتك وإنجازاتك المهنية...' : 'Summary of your background and achievements...'}">${user.bio || ''}</textarea>
        </div>

        <!-- Secure Resume Upload with Magic Byte Check -->
        <div class="form-group">
          <label class="form-label">${isArabic ? 'رفع السيرة الذاتية (PDF / DOCX - بحد أقصى 5MB)' : 'Upload Resume / CV (PDF / DOCX - Max 5MB)'}</label>
          <div style="border: 2px dashed var(--border-medium); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; background: #F8FAFC;">
            <input id="resumeFileInput" type="file" accept=".pdf,.docx" style="display: none;" onchange="handleResumeFileSelected(this)">
            <button type="button" onclick="document.getElementById('resumeFileInput').click()" class="btn btn-sm btn-secondary">
              ${window.Icons.download("w-4 h-4")}
              <span>${isArabic ? 'اختيار ملف السيرة الذاتية' : 'Choose File'}</span>
            </button>
            <div id="resumeFileName" style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.5rem;">
              ${user.resume_url ? `${isArabic ? 'الملف الحالي:' : 'Current file:'} ${user.resume_url.split('/').pop()}` : (isArabic ? 'لم يتم اختيار ملف بعد (يقبل PDF أو DOCX فقط)' : 'No new file chosen (verified PDF/DOCX only)')}
            </div>
            <input id="uploadedResumeUrl" type="hidden" value="${user.resume_url || ''}">
          </div>
        </div>

        <button id="saveProfileBtn" type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.checkCircle("w-4 h-4")}
          <span>${isArabic ? 'حفظ التعديلات' : 'Save Changes'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeCandidateProfileModal = function() {
  const modal = document.getElementById('candidateProfileModal');
  if (modal) modal.classList.remove('active');
};

// Handle file selection and read as Base64 for upload
window.handleResumeFileSelected = async function(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const nameLabel = document.getElementById('resumeFileName');
  nameLabel.innerHTML = `<span>⏳ ${file.name} (${Math.round(file.size / 1024)} KB)...</span>`;

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const base64Data = e.target.result;
      try {
        const uploadRes = await window.API.uploadFile(base64Data, file.name, 'resume');
        document.getElementById('uploadedResumeUrl').value = uploadRes.url;
        nameLabel.innerHTML = `<span style="color:#059669; font-weight:600;">✅ ${uploadRes.filename} (${window.AppState.lang === 'ar' ? 'تم الرفع والتحقق بنجاح' : 'Verified & Uploaded'})</span>`;
        window.showToast(window.AppState.lang === 'ar' ? 'تم رفع وفحص السيرة الذاتية بنجاح' : 'Resume uploaded and verified', 'success');
      } catch (uploadErr) {
        nameLabel.innerHTML = `<span style="color:#DC2626;">❌ ${uploadErr.message}</span>`;
        window.showToast(uploadErr.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    nameLabel.innerHTML = `<span style="color:#DC2626;">❌ ${err.message}</span>`;
  }
};

// Handle Save Profile
window.handleSaveCandidateProfile = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;

  const name = document.getElementById('profName').value;
  const phone = document.getElementById('profPhone').value;
  const headline = document.getElementById('profHeadline').value;
  const experience_years = document.getElementById('profExperience').value;
  const skills = document.getElementById('profSkills').value;
  const bio = document.getElementById('profBio').value;
  const resume_url = document.getElementById('uploadedResumeUrl').value;

  try {
    const res = await window.API.updateProfile({
      name,
      phone,
      headline,
      experience_years: parseInt(experience_years, 10) || 0,
      skills,
      bio,
      resume_url: resume_url || null
    });

    if (res.user) {
      window.AppState.user = { ...window.AppState.user, ...res.user };
    }

    closeCandidateProfileModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    btn.disabled = false;
    window.showToast(err.message, 'error');
  }
};
