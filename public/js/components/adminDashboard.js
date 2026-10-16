// adminDashboard.js - Platform Owner & Staff Portal (Requirement 4 & 13)
window.renderAdminDashboard = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const user = window.AppState.user;

  let statsData = null;
  let recentPayments = [];
  let auditLogs = [];

  try {
    const res = await window.API.getAdminStats();
    statsData = res.stats;
    recentPayments = res.recentPayments || [];
    auditLogs = res.auditLogs || [];
  } catch (err) {
    console.error('Admin stats error', err);
    return `
      <div class="container" style="padding: 4rem 1rem; text-align: center;">
        <h2>${isArabic ? 'غير مصرح بالدخول' : 'Unauthorized'}</h2>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">${isArabic ? 'هذه الصفحة مخصصة لمالك المنصة وفريق العمل فقط.' : 'This portal is restricted to Platform Owner & Staff.'}</p>
        <button onclick="navigateTo('home')" class="btn btn-primary" style="margin-top: 1rem;">
          ${isArabic ? 'العودة للرئيسية' : 'Return Home'}
        </button>
      </div>
    `;
  }

  const isSuperAdmin = user.role === 'admin';
  const activeTab = window.AppState.adminActiveTab || 'revenue';

  return `
    <div class="container" style="padding-top: 2.5rem; padding-bottom: 5rem;">
      <!-- Admin Header -->
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${isSuperAdmin ? '#ECFDF5' : '#EFF6FF'}; border: 1px solid ${isSuperAdmin ? '#A7F3D0' : '#BFDBFE'}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: ${isSuperAdmin ? '#065F46' : '#1D4ED8'}; margin-bottom: 0.5rem;">
            ${window.Icons.shieldCheck("w-3.5 h-3.5")}
            <span>${isSuperAdmin ? (isArabic ? 'بوابة مالك المنصة (Super Admin)' : 'Platform Owner Console') : (isArabic ? 'بوابة فريق العمل والعمليات (Operations Staff)' : 'Operations Staff Console')}</span>
          </div>
          <h1 style="font-size: 1.875rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary);">
            ${isArabic ? 'لوحة تحكم المنصة وإيرادات النسبة المالية' : 'Platform Revenue & Operations Audit'}
          </h1>
          <p style="color: var(--text-muted); font-size: 0.9375rem;">
            ${isArabic ? 'متابعة العمليات المالية للنسبة، إدارة فريق العمل، وتدقيق سجلات الأمان.' : 'Live tracking of platform commission revenue, staff provisioning, and security audit logs.'}
          </p>
        </div>

        <!-- Admin Management Action Buttons -->
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          ${isSuperAdmin ? `
            <button onclick="openCreateStaffModal()" class="btn btn-secondary">
              ${window.Icons.plus("w-4 h-4")}
              <span>${isArabic ? 'إضافة موظف عمليات (Staff)' : 'Add Staff Member'}</span>
            </button>
            <button onclick="openAdjustFeeModal()" class="btn btn-secondary">
              ${window.Icons.creditCard("w-4 h-4")}
              <span>${isArabic ? 'تعديل نسبة المنصة' : 'Adjust Fee Rate'}</span>
            </button>
          ` : ''}
          <button onclick="window.print()" class="btn btn-primary">
            ${window.Icons.download("w-4 h-4")}
            <span>${isArabic ? 'تصدير التقرير المالي' : 'Export Audit Report'}</span>
          </button>
        </div>
      </div>

      <!-- Financial & Platform KPIs Grid -->
      <div class="dashboard-stats-grid" style="margin-bottom: 2.5rem;">
        ${isSuperAdmin ? `
          <div class="card" style="border-left: 4px solid #059669; background: #FFFFFF;">
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
              ${isArabic ? 'إجمالي إيرادات النسبة المحصلة' : 'Total Commission Revenue'}
            </div>
            <div style="font-size: 2rem; font-weight: 800; color: #059669;">
              ${window.formatCurrency(statsData.totalRevenue || 0, 'USD')}
            </div>
            <div style="font-size: 0.75rem; color: #059669; margin-top: 0.35rem; font-weight: 600;">
              ${statsData.totalTransactions || 0} ${isArabic ? 'عمليات تسوية ناجحة' : 'settled payouts'}
            </div>
          </div>
        ` : `
          <div class="card" style="border-left: 4px solid #64748B; background: #FFFFFF;">
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
              ${isArabic ? 'البيانات المالية (محمية)' : 'Financial Ledger (Restricted)'}
            </div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #64748B;">
              ${isArabic ? 'مخصصة للمدير الرئيسي' : 'Super Admin Only'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              ${isArabic ? 'تخضع لنظام الصلاحيات المقيدة (RBAC)' : 'Granular RBAC Enforced'}
            </div>
          </div>
        `}

        <div class="card" style="border-left: 4px solid #2563EB; background: #FFFFFF;">
          <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
            ${isArabic ? 'إجمالي الوظائف النشطة' : 'Active Job Postings'}
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0F172A;">
            ${statsData.totalJobs}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            <span>${statsData.dailyGigs} ${isArabic ? 'عمل يومي' : 'Daily Gigs'}</span> • <span>${statsData.fullTimeJobs} ${isArabic ? 'دوام كامل' : 'Full-Time'}</span>
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #4F46E5; background: #FFFFFF;">
          <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
            ${isArabic ? 'المرشحون والشركات' : 'Talent & Employers'}
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #0F172A;">
            ${statsData.totalCandidates + statsData.totalEmployers}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            <span>${statsData.totalCandidates} ${isArabic ? 'مرشح' : 'Candidates'}</span> • <span>${statsData.totalEmployers} ${isArabic ? 'شركة' : 'Companies'}</span>
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #D97706; background: #FFFFFF;">
          <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
            ${isArabic ? 'عقود التوظيف المكتملة' : 'Hired Contracts'}
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #D97706;">
            ${statsData.hiredCount}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            ${isArabic ? 'من إجمالي' : 'Out of'} ${statsData.totalApplications} ${isArabic ? 'طلب تقديم' : 'applications'}
          </div>
        </div>
      </div>

      <!-- Admin Tabs Navigation -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-medium); padding-bottom: 0.5rem;">
        ${isSuperAdmin ? `
          <button onclick="setAdminTab('revenue')" class="btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.875rem;">
            ${window.Icons.creditCard("w-4 h-4")}
            <span>${isArabic ? 'سجل تحصيل النسبة والعمولات' : 'Commission Transactions'}</span>
          </button>
        ` : ''}
        <button onclick="setAdminTab('audit')" class="btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.875rem;">
          ${window.Icons.shieldCheck("w-4 h-4")}
          <span>${isArabic ? 'سجلات الأمان والتدقيق (Audit Logs)' : 'Security Audit Logs'}</span>
        </button>
      </div>

      ${isSuperAdmin && activeTab === 'revenue' ? `
        <!-- Commission Transactions Ledger (Requirement 13) -->
        <div class="card" style="margin-bottom: 2.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
            <div>
              <h2 style="font-size: 1.125rem; font-weight: 700;">
                ${isArabic ? 'سجل تحصيل نسبة المنصة (Platform Commission Ledger)' : 'Platform Commission Transaction Ledger'}
              </h2>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                ${isArabic ? 'المعاملات المالية للنسب المحصلة من الوظائف والعقود المكتملة' : 'Direct commission payouts collected upon hire completion'}
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span class="badge" style="background:#ECFDF5; color:#065F46; font-weight:700;">
                ${isArabic ? `النسبة الحالية: ${statsData.platformFeeRate || '3.0%'}` : `Active Fee: ${statsData.platformFeeRate || '3.0%'}`}
              </span>
              <button onclick="openAdjustFeeModal()" class="btn btn-sm btn-secondary" style="font-size: 0.75rem;">
                ${isArabic ? 'تعديل' : 'Edit Rate'}
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: start;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-light); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'رقم المعاملة' : 'Txn ID'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'المسدد' : 'Payer'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'الوظيفة' : 'Job Title'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'الشركة' : 'Company'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'النسبة المحصلة' : 'Commission (3%)'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'الحالة' : 'Status'}</th>
                  <th style="padding: 0.75rem 0.5rem;">${isArabic ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                ${recentPayments.length === 0 ? `
                  <tr>
                    <td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                      ${isArabic ? 'لا توجد معاملات دفع مسجلة حتى الآن' : 'No transactions recorded yet'}
                    </td>
                  </tr>
                ` : recentPayments.map(p => `
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 0.75rem 0.5rem; font-family: monospace; font-weight: 600; color: var(--color-primary);">${p.transaction_id}</td>
                    <td style="padding: 0.75rem 0.5rem; font-weight: 600;">${p.payer_name}</td>
                    <td style="padding: 0.75rem 0.5rem;">${p.job_title}</td>
                    <td style="padding: 0.75rem 0.5rem; color: var(--text-muted);">${p.company_name}</td>
                    <td style="padding: 0.75rem 0.5rem; font-weight: 800; color: #059669;">${window.formatCurrency(p.amount, p.currency)}</td>
                    <td style="padding: 0.75rem 0.5rem;">
                      <span class="badge badge-status-hired">COMPLETED</span>
                    </td>
                    <td style="padding: 0.75rem 0.5rem; font-size: 0.75rem; color: var(--text-muted);">${new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Security Audit Logs (Requirement 6 & 8) -->
      ${activeTab === 'audit' || (!isSuperAdmin) ? `
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
            <div>
              <h2 style="font-size: 1.125rem; font-weight: 700;">
                ${isArabic ? 'سجلات الأمان والتدقيق الإداري (Audit Security Logs)' : 'Security Audit & Compliance Logs'}
              </h2>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                ${isArabic ? 'سجل فوري بجميع العمليات الإدارية وتغييرات الصلاحيات والتسجيل والدفع' : 'Real-time record of all administrative actions, permission changes, and security events'}
              </p>
            </div>
            <span class="badge" style="background:#EFF6FF; color:#1D4ED8;">
              ${auditLogs.length} ${isArabic ? 'سجل حديث' : 'recent events'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8125rem;">
            ${auditLogs.map(log => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #F8FAFC; border-radius: 6px; border: 1px solid var(--border-light);">
                <div>
                  <span style="font-weight: 700; color: var(--text-primary); margin-inline-end: 0.75rem; font-family: monospace;">[${log.action}]</span>
                  <span style="color: var(--text-secondary);">${log.details}</span>
                </div>
                <span style="color: var(--text-muted); font-size: 0.75rem; font-family: monospace;">${new Date(log.created_at).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

// Switch Tab in Admin Dashboard
window.setAdminTab = function(tabName) {
  window.AppState.adminActiveTab = tabName;
  window.renderApp();
};

// Modal: Create Staff Member (Super Admin Only)
window.openCreateStaffModal = function() {
  const isArabic = window.AppState.lang === 'ar';
  let modal = document.getElementById('createStaffModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'createStaffModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 520px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${isArabic ? 'إنشاء حساب موظف عمليات جديد' : 'Provision Operations Staff'}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'حساب الموظف يمتلك صلاحيات إدارة الوظائف والتحقق دون الوصول للبيانات المالية' : 'Staff members can moderate postings and verify accounts with restricted financial access'}
          </p>
        </div>
        <button onclick="closeCreateStaffModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handleCreateStaffSubmit(event)" class="modal-body">
        <div class="form-group">
          <label class="form-label">${isArabic ? 'اسم الموظف' : 'Staff Full Name'}</label>
          <input id="staffName" type="text" class="form-control" placeholder="Sarah Jenkins" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isArabic ? 'البريد الإلكتروني المهني' : 'Work Email'}</label>
          <input id="staffEmail" type="email" class="form-control" placeholder="staff.sarah@jobplatform.com" required>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">${isArabic ? 'كلمة المرور المؤقتة (8+ أحرف)' : 'Password (8+ chars)'}</label>
            <input id="staffPassword" type="password" class="form-control" placeholder="••••••••" required minlength="8">
          </div>
          <div class="form-group">
            <label class="form-label">${isArabic ? 'رقم الهاتف' : 'Phone'}</label>
            <input id="staffPhone" type="text" class="form-control" placeholder="+1 555-0155">
          </div>
        </div>

        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8125rem; color: #1D4ED8; margin-bottom: 1.25rem;">
          <strong>${isArabic ? 'نظام الصلاحيات المقيدة (RBAC):' : 'Granular RBAC Policy:'}</strong>
          <div>${isArabic ? 'لن يتمكن هذا الحساب من الاطلاع على الأرباح والعمولات المالية أو إنشاء حسابات موظفين أخرى.' : 'Staff accounts are strictly prohibited from accessing revenue balances or creating staff members.'}</div>
        </div>

        <button id="createStaffBtn" type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.shieldCheck("w-4 h-4")}
          <span>${isArabic ? 'اعتماد وإنشاء الحساب' : 'Provision Staff Account'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeCreateStaffModal = function() {
  const modal = document.getElementById('createStaffModal');
  if (modal) modal.classList.remove('active');
};

// Handle Create Staff Submit
window.handleCreateStaffSubmit = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('createStaffBtn');
  btn.disabled = true;

  const name = document.getElementById('staffName').value;
  const email = document.getElementById('staffEmail').value;
  const password = document.getElementById('staffPassword').value;
  const phone = document.getElementById('staffPhone').value;

  try {
    const res = await window.API.createStaff({ name, email, password, phone, role: 'staff' });
    closeCreateStaffModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    btn.disabled = false;
    window.showToast(err.message, 'error');
  }
};

// Modal: Adjust Commission Fee Rate (Super Admin Only)
window.openAdjustFeeModal = function() {
  const isArabic = window.AppState.lang === 'ar';
  let modal = document.getElementById('adjustFeeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adjustFeeModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 480px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${isArabic ? 'تعديل نسبة المنصة والعمولة' : 'Configure Platform Fee Rate'}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${isArabic ? 'تحدد هذه النسبة العمولة المقتطعة تلقائياً عند التوظيف' : 'Default commission percentage charged upon successful hire'}
          </p>
        </div>
        <button onclick="closeAdjustFeeModal()" class="btn btn-sm btn-secondary" style="border-radius: 50%; width: 32px; height: 32px; padding: 0;">
          ${window.Icons.close("w-4 h-4")}
        </button>
      </div>

      <form onsubmit="handleAdjustFeeSubmit(event)" class="modal-body">
        <div class="form-group">
          <label class="form-label">${isArabic ? 'النسبة المئوية (%)' : 'Commission Rate (%)'}</label>
          <input id="feeRateInput" type="number" step="0.1" min="0.5" max="30" class="form-control" value="3.0" required>
        </div>

        <div style="background: #F8FAFC; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          ${isArabic ? 'تطبق هذه النسبة على جميع الوظائف والعقود الجديدة المنشورة على المنصة.' : 'This rate will apply to all newly posted contracts and employment offers.'}
        </div>

        <button id="saveFeeBtn" type="submit" class="btn btn-primary" style="width: 100%;">
          ${window.Icons.checkCircle("w-4 h-4")}
          <span>${isArabic ? 'حفظ وتحديث النسبة' : 'Update Platform Rate'}</span>
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
};

window.closeAdjustFeeModal = function() {
  const modal = document.getElementById('adjustFeeModal');
  if (modal) modal.classList.remove('active');
};

// Handle Adjust Fee Submit
window.handleAdjustFeeSubmit = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('saveFeeBtn');
  btn.disabled = true;

  const rate = parseFloat(document.getElementById('feeRateInput').value);

  try {
    const res = await window.API.updateFeeRate(rate);
    closeAdjustFeeModal();
    window.showToast(res.message, 'success');
    window.renderApp();
  } catch (err) {
    btn.disabled = false;
    window.showToast(err.message, 'error');
  }
};
