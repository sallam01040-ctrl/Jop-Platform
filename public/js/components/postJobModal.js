// postJobModal.js - Post Job & Daily Gig Creation Modal
window.openPostJobModal = function() {
  if (!window.AppState.user || (window.AppState.user.role !== 'employer' && window.AppState.user.role !== 'admin')) {
    window.showToast(window.AppState.lang === 'ar' ? 'يرجى تسجيل الدخول كشركة أو صاحب عمل لنشر وظيفة' : 'Please log in as an employer to post a job', 'error');
    window.openAuthModal('login');
    return;
  }

  const isArabic = window.AppState.lang === 'ar';
  let modal = document.getElementById('postJobModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'postJobModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${window.t('postJob')}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'انشر وظيفة دوام كامل أو فرصة عمل يومي عالمية' : 'Publish a full-time role or daily gig to global talent'}
          </p>
        </div>
        <button onclick="closePostJobModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handlePostJobSubmit(event)" class="modal-body">
        <div class="form-group">
          <label class="form-label">${isArabic ? 'المسمى الوظيفي' : 'Job Title'}</label>
          <input id="postJobTitle" type="text" class="form-control" placeholder="e.g. Lead Electrical Specialist / Senior Cloud Architect" required>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${window.t('jobType')}</label>
            <select id="postJobType" class="form-control" onchange="adjustRatePeriod(this.value)">
              <option value="full_time">${isArabic ? 'دوام كامل' : 'Full-time'}</option>
              <option value="daily_gig">${isArabic ? '⚡ عمل يومي (مياومة)' : '⚡ Daily Gig / Shift'}</option>
              <option value="part_time">${isArabic ? 'دوام جزئي' : 'Part-time'}</option>
              <option value="contract">${isArabic ? 'عقد مشروع' : 'Contract'}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'المجال الوظيفي' : 'Category'}</label>
            <select id="postJobCategory" class="form-control">
              <option value="Technology">Technology</option>
              <option value="Trades & Industry">Trades & Industry (Daily)</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Marketing">Marketing</option>
              <option value="Logistics">Logistics & Fleet</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الموقع الجغرافي' : 'Location'}</label>
            <input id="postJobLocation" type="text" class="form-control" placeholder="Worldwide / Dubai, UAE / London, UK" required value="Worldwide Remote">
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'بيئة العمل' : 'Workplace Type'}</label>
            <select id="postJobWorkplace" class="form-control">
              <option value="remote">${isArabic ? 'عن بُعد (Remote)' : 'Remote'}</option>
              <option value="on_site">${isArabic ? 'حضوري (On-site)' : 'On-site'}</option>
              <option value="hybrid">${isArabic ? 'هجين (Hybrid)' : 'Hybrid'}</option>
            </select>
          </div>
        </div>

        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'الحد الأدنى للأجر' : 'Min Salary / Rate'}</label>
            <input id="postJobMinSalary" type="number" class="form-control" placeholder="100000" required value="110000">
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'الحد الأقصى للأجر' : 'Max Salary / Rate'}</label>
            <input id="postJobMaxSalary" type="number" class="form-control" placeholder="140000" required value="150000">
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'الفترة' : 'Rate Period'}</label>
            <select id="postJobRatePeriod" class="form-control">
              <option value="year">${isArabic ? 'سنوي (/ Year)' : '/ Year'}</option>
              <option value="day">${isArabic ? 'يومي (/ Day)' : '/ Day'}</option>
              <option value="month">${isArabic ? 'شهري (/ Month)' : '/ Month'}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'وصف الوظيفة والمتطلبات' : 'Job Description'}</label>
          <textarea id="postJobDesc" rows="3" class="form-control" placeholder="Describe the responsibilities and key goals..." required>Join our elite team to build scalable systems. We provide comprehensive escrow-backed agreements and global flexibility.</textarea>
        </div>

        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8125rem; color: #1D4ED8; margin-bottom: 1.25rem;">
          <strong>${isArabic ? 'نسبة المنصة المعتمدة: 3.0%' : 'Standard Platform Escrow: 3.0%'}</strong>
          <div>${isArabic ? 'تقتطع النسبة تلقائياً عند اعتماد العرض وقبول المرشح للعمل.' : 'Commission is automatically calculated and escrowed upon candidate hire.'}</div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.plus("w-4 h-4")}
          <span>${isArabic ? 'نشر الوظيفة على المنصة العالمية' : 'Publish Job Opportunity'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closePostJobModal = function() {
  const modal = document.getElementById('postJobModal');
  if (modal) modal.classList.remove('active');
};

window.adjustRatePeriod = function(jobType) {
  const period = document.getElementById('postJobRatePeriod');
  const minSal = document.getElementById('postJobMinSalary');
  const maxSal = document.getElementById('postJobMaxSalary');

  if (jobType === 'daily_gig') {
    period.value = 'day';
    minSal.value = '250';
    maxSal.value = '350';
  } else {
    period.value = 'year';
    minSal.value = '110000';
    maxSal.value = '150000';
  }
};

window.handlePostJobSubmit = async function(e) {
  e.preventDefault();
  const title = document.getElementById('postJobTitle').value;
  const job_type = document.getElementById('postJobType').value;
  const category = document.getElementById('postJobCategory').value;
  const location = document.getElementById('postJobLocation').value;
  const workplace_type = document.getElementById('postJobWorkplace').value;
  const salary_min = document.getElementById('postJobMinSalary').value;
  const salary_max = document.getElementById('postJobMaxSalary').value;
  const rate_period = document.getElementById('postJobRatePeriod').value;
  const description = document.getElementById('postJobDesc').value;

  try {
    const res = await window.API.createJob({
      title, job_type, category, location, workplace_type,
      salary_min, salary_max, rate_period, description,
      experience_level: 'mid',
      responsibilities: [
        'Deliver high performance across assigned milestones',
        'Collaborate transparently with global stakeholders',
        'Maintain highest quality standards and compliance'
      ],
      requirements: [
        'Demonstrated verifiable experience in the field',
        'Strong accountability and communication skills'
      ],
      benefits: [
        'Guaranteed prompt electronic compensation',
        'Platform escrow protection'
      ],
      commission_rate: 3.0
    });

    window.closePostJobModal();
    window.showToast(res.message, 'success');
    window.navigateTo('jobs');
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};
