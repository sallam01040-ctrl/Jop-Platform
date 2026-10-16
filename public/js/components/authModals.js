// authModals.js - Authentication Modal (Production Ready - No Demo Shortcuts)
window.openAuthModal = function(initialTab = 'login') {
  const isArabic = window.AppState.lang === 'ar';
  let modal = document.getElementById('authModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div style="display: flex; gap: 0.75rem;">
          <button id="authTabLogin" onclick="switchAuthTab('login')" class="tab-btn ${initialTab === 'login' ? 'active' : ''}">
            ${window.t('signIn')}
          </button>
          <button id="authTabRegister" onclick="switchAuthTab('register')" class="tab-btn ${initialTab === 'register' ? 'active' : ''}">
            ${window.t('signUp')}
          </button>
        </div>
        <button onclick="closeAuthModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 30px; height: 30px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <div class="modal-body">
        <!-- Login Form -->
        <form id="loginForm" class="${initialTab === 'login' ? '' : 'hidden'}" onsubmit="handleAuthLogin(event)">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input id="loginEmail" type="email" class="form-control" placeholder="name@domain.com" required value="">
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'كلمة المرور' : 'Password'}</label>
            <input id="loginPassword" type="password" class="form-control" placeholder="••••••••" required value="" minlength="8">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 38px; margin-top: 0.5rem; font-weight: 700;">
            ${window.t('signIn')}
          </button>
        </form>

        <!-- Register Form with Role Picker (Candidate or Employer only) -->
        <form id="registerForm" class="${initialTab === 'register' ? '' : 'hidden'}" onsubmit="handleAuthRegister(event)">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'نوع الحساب والتسجيل' : 'I want to register as:'}</label>
            <select id="regRole" class="form-control" onchange="toggleCompanyFields(this.value)">
              <option value="candidate">${isArabic ? '👤 فرد / باحث عن عمل وعقود يومية (Candidate)' : '👤 Individual / Job Seeker & Daily Worker'}</option>
              <option value="employer">${isArabic ? '🏢 شركة / صاحب عمل وموظف (Company / Employer)' : '🏢 Company / Employer & Recruiter'}</option>
            </select>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              ${isArabic ? 'ملاحظة: حسابات موظفي المنصة تُنشأ حصراً من قِبل المدير العام.' : 'Note: Staff accounts are provisioned exclusively by the platform administrator.'}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'الاسم الكامل / اسم المسؤول' : 'Full Name'}</label>
            <input id="regName" type="text" class="form-control" placeholder="John Doe" required>
          </div>

          <div id="companyExtraFields" class="hidden">
            <div class="form-group">
              <label class="form-label">${isArabic ? 'اسم الشركة أو المؤسسة' : 'Company Name'}</label>
              <input id="regCompanyName" type="text" class="form-control" placeholder="Acme International LLC">
            </div>
            <div class="form-group">
              <label class="form-label">${isArabic ? 'مجال عمل الشركة' : 'Industry'}</label>
              <input id="regCompanyIndustry" type="text" class="form-control" placeholder="Technology / Construction / Healthcare">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input id="regEmail" type="email" class="form-control" placeholder="name@domain.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">${isArabic ? 'كلمة المرور (8 أحرف فأكثر)' : 'Password (8+ chars)'}</label>
            <input id="regPassword" type="password" class="form-control" placeholder="••••••••" required minlength="8">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 38px; margin-top: 0.5rem; font-weight: 700;">
            ${window.t('signUp')}
          </button>
        </form>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

window.closeAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
};

window.switchAuthTab = function(tab) {
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabRegister');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
};

window.toggleCompanyFields = function(role) {
  const companyFields = document.getElementById('companyExtraFields');
  if (role === 'employer') {
    companyFields.classList.remove('hidden');
  } else {
    companyFields.classList.add('hidden');
  }
};

window.handleAuthLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await window.API.login(email, password);
    window.AppState.token = res.token;
    window.AppState.user = res.user;
    window.AppState.company = res.company;
    localStorage.setItem('jobplatform_token', res.token);

    closeAuthModal();
    window.showToast(`${window.t('welcomeBack')}, ${res.user.name}!`, 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

window.handleAuthRegister = async function(e) {
  e.preventDefault();
  const role = document.getElementById('regRole').value;
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  const payload = { role, name, email, password };

  if (role === 'employer') {
    payload.company_name = document.getElementById('regCompanyName').value || (name + ' Enterprises');
    payload.industry = document.getElementById('regCompanyIndustry').value || 'Technology';
  }

  try {
    const res = await window.API.register(payload);
    window.AppState.token = res.token;
    window.AppState.user = res.user;
    window.AppState.company = res.company;
    localStorage.setItem('jobplatform_token', res.token);

    closeAuthModal();
    window.showToast(window.AppState.lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account registered successfully!', 'success');
    window.renderApp();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};
