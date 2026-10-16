// paymentFlow.js - Secure Platform Commission Payment Flow matching Middle-Right Mockup
window.renderPaymentPage = async function() {
  const isArabic = window.AppState.lang === 'ar';
  const appId = window.AppState.routeParams.applicationId;

  let appData = null;

  // Fetch candidate applications to locate this application
  try {
    const res = await window.API.getCandidateApplications();
    if (res && res.applications) {
      appData = res.applications.find(a => a.id === appId) || res.applications[0];
    }
  } catch (err) {
    console.warn('Error loading applications for payment', err);
  }

  if (!appData) {
    return `
      <div class="container" style="padding: 4rem 1rem; text-align: center;">
        <h2>${isArabic ? 'لم يتم العثور على طلب توظيف معلق للسداد' : 'No pending application found for payment'}</h2>
        <button onclick="navigateTo('dashboard')" class="btn btn-primary" style="margin-top: 1rem;">
          ${window.t('dashboard')}
        </button>
      </div>
    `;
  }

  // Calculate fee: 3% of offer salary or base salary
  const isDaily = appData.job_type === 'daily_gig';
  const salary = appData.offer_salary || appData.salary_min || 120000;
  const commissionRate = appData.commission_rate || 3.0;
  const platformFee = Math.round((salary * (commissionRate / 100)) * 100) / 100;
  const currency = appData.currency || 'USD';

  return `
    <div class="container payment-flow-container">
      <!-- Back Navigation -->
      <a href="javascript:void(0)" onclick="navigateTo('dashboard')" class="back-link">
        ${isArabic ? window.Icons.arrowRight("w-4 h-4") : window.Icons.arrowLeft("w-4 h-4")}
        <span>${isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}</span>
      </a>

      <!-- Page Header & Security Pill (Matching Middle-Right Mockup) -->
      <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem;">
        <div>
          <div style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
            ${isArabic ? 'نظام تسوية النسبة والعمولة' : 'Payment Flow'}
          </div>
          <h1 style="font-size: 1.875rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 0.35rem;">
            ${window.t('securePayment')}
          </h1>
          <p style="color: var(--text-muted); font-size: 0.9375rem; max-width: 580px;">
            ${window.t('applicationFeeDesc')}
          </p>
        </div>

        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.625rem; color: #065F46; font-size: 0.875rem; font-weight: 600;">
          ${window.Icons.shieldCheck("w-5 h-5 text-emerald-600")}
          <span>${isArabic ? 'الدفع آمن ومشفر بأعلى معايير الحماية' : 'Your payment is secure and encrypted'}</span>
        </div>
      </div>

      <!-- 3-Step Wizard Navigation Bar -->
      <div class="payment-steps">
        <div class="payment-step-item">
          <div class="payment-step-circle">1</div>
          <span>${isArabic ? 'تفاصيل النسبة' : 'Select Plan'}</span>
        </div>
        <div style="width: 40px; height: 1px; background: var(--border-medium);"></div>
        <div class="payment-step-item active">
          <div class="payment-step-circle">2</div>
          <span>${isArabic ? 'طريقة الدفع' : 'Payment'}</span>
        </div>
        <div style="width: 40px; height: 1px; background: var(--border-medium);"></div>
        <div class="payment-step-item">
          <div class="payment-step-circle">3</div>
          <span>${isArabic ? 'التأكيد والإيصال' : 'Confirmation'}</span>
        </div>
      </div>

      <!-- Main Payment Grid: Payment Method + Summary Sidebar -->
      <div id="paymentContentArea" class="payment-grid">
        <!-- Left: Method selection & inputs -->
        <div class="card">
          <div style="margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">
              ${window.t('platformFee')}
            </h2>
            <p style="font-size: 0.875rem; color: var(--text-muted);">
              ${isArabic 
                ? `ادفع ${commissionRate}% من قيمة الراتب السنوي الأول (أو العقد اليومي المتفق عليه) لتوثيق وتفعيل العقد.`
                : `Pay ${commissionRate}% of the first-year salary (or agreed daily gig contract) to finalize your verified hire.`
              }
            </p>
            <div style="background: #F8FAFC; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 0.625rem 0.875rem; margin-top: 0.75rem; font-size: 0.8125rem; color: var(--text-secondary);">
              <strong>${isArabic ? 'مثال توضيحي:' : 'Example:'}</strong>
              ${isArabic 
                ? `إذا كان الراتب ${window.formatCurrency(salary, currency)} ← تكون النسبة (${commissionRate}%) = ${window.formatCurrency(platformFee, currency)}`
                : `If the salary is ${window.formatCurrency(salary, currency)} → Platform Fee (${commissionRate}%) = ${window.formatCurrency(platformFee, currency)}`
              }
            </div>
          </div>

          <!-- Payment Method Cards -->
          <div style="font-size: 0.875rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">
            ${isArabic ? 'اختر وسيلة الدفع المعتمدة:' : 'Payment Method'}
          </div>

          <div class="payment-method-selector">
            <div id="methodCard" class="payment-method-card selected" onclick="selectPaymentMethod('credit_card')">
              ${window.Icons.creditCard("w-5 h-5 text-blue-600")}
              <span>Credit / Debit Card</span>
            </div>
            <div id="methodPaypal" class="payment-method-card" onclick="selectPaymentMethod('paypal')">
              <span style="font-weight: 800; color: #0079C1; font-size: 1.1rem;">P</span>
              <span>PayPal</span>
            </div>
            <div id="methodApple" class="payment-method-card" onclick="selectPaymentMethod('apple_pay')">
              <span style="font-weight: 700; font-size: 1rem;"></span>
              <span>Apple Pay</span>
            </div>
            <div id="methodGoogle" class="payment-method-card" onclick="selectPaymentMethod('google_pay')">
              <span style="font-weight: 800; color: #EA4335; font-size: 1rem;">G</span>
              <span>Google Pay</span>
            </div>
          </div>

          <!-- Interactive Card Inputs -->
          <form onsubmit="handlePayCommission(event, '${appData.id}', ${platformFee})">
            <div class="form-group">
              <label class="form-label">${isArabic ? 'اسم حامل البطاقة' : 'Cardholder Name'}</label>
              <input id="cardHolder" type="text" class="form-control" value="${window.AppState.user ? window.AppState.user.name : 'Ahmed Al-Mansoor'}" required>
            </div>

            <div class="form-group">
              <label class="form-label">${isArabic ? 'رقم البطاقة الائتمانية' : 'Card Number'}</label>
              <div style="position: relative;">
                <input id="cardNumber" type="text" class="form-control" placeholder="4242 •••• •••• 4242" value="4242 8890 1234 4242" required maxlength="19">
                <span style="position: absolute; ${isArabic ? 'left: 12px;' : 'right: 12px;'} top: 12px; color: var(--text-muted);">
                  ${window.Icons.creditCard("w-5 h-5")}
                </span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">${isArabic ? 'تاريخ الانتهاء' : 'Expiration Date'}</label>
                <input id="cardExpiry" type="text" class="form-control" placeholder="MM/YY" value="12/28" required maxlength="5">
              </div>

              <div class="form-group">
                <label class="form-label">CVC / CVV</label>
                <input id="cardCvc" type="password" class="form-control" placeholder="•••" value="888" required maxlength="4">
              </div>
            </div>

            <button id="payNowBtn" type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 1rem;">
              ${window.Icons.lock("w-4 h-4")}
              <span>${isArabic ? `سداد ${window.formatCurrency(platformFee, currency)} الآن` : `Pay Now ${window.formatCurrency(platformFee, currency)}`}</span>
            </button>

            <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              ${window.Icons.shieldCheck("w-4 h-4 text-emerald-600")}
              <span>${isArabic ? 'دفع إلكتروني آمن ومحمي بنظام الضمان المالي المعتمد' : 'Secure payment powered by trusted global financial providers'}</span>
            </div>
          </form>
        </div>

        <!-- Right: Payment Summary Sidebar (Matching Middle-Right Mockup) -->
        <div>
          <div class="card" style="background: #F8FAFC; border: 1px solid var(--border-medium);">
            <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem;">
              ${isArabic ? 'ملخص الفاتورة والنسبة' : 'Payment Summary'}
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9375rem;">
              <div>
                <div style="color: var(--text-muted); font-size: 0.8125rem;">${isArabic ? 'المسمى الوظيفي' : 'Job Title'}</div>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.15rem;">${appData.job_title}</div>
                <div style="font-size: 0.8125rem; color: var(--color-primary);">${appData.company_name}</div>
              </div>

              <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid var(--border-light);">
                <span style="color: var(--text-muted);">${isDaily ? (isArabic ? 'قيمة العقد اليومي' : 'Daily Gig Value') : (isArabic ? 'الراتب السنوي الأول' : 'First Year Salary')}</span>
                <span style="font-weight: 600;">${window.formatCurrency(salary, currency)}</span>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">${isArabic ? `نسبة المنصة (${commissionRate}%)` : `Platform Fee (${commissionRate}%)`}</span>
                <span style="font-weight: 600; color: var(--color-primary);">${window.formatCurrency(platformFee, currency)}</span>
              </div>

              <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 2px solid var(--border-medium); font-size: 1.125rem;">
                <span style="font-weight: 800; color: var(--text-primary);">${isArabic ? 'المجموع المستحق' : 'Total'}</span>
                <span style="font-weight: 800; color: #059669;">${window.formatCurrency(platformFee, currency)}</span>
              </div>
            </div>

            <div style="margin-top: 1.5rem; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
              <strong>${isArabic ? 'سياسة الاسترداد:' : 'Escrow Terms:'}</strong>
              ${isArabic 
                ? 'يتم إيداع المبلغ في حساب وسيط (Escrow) ولا يتم تحويله إلا بعد استلامك خطاب المباشرة الرسمي وبدء العمل.'
                : 'Funds remain secured in platform escrow until full contract commencement and verification.'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Select Payment Method
window.selectPaymentMethod = function(method) {
  document.querySelectorAll('.payment-method-card').forEach(el => el.classList.remove('selected'));
  if (method === 'credit_card') document.getElementById('methodCard').classList.add('selected');
  if (method === 'paypal') document.getElementById('methodPaypal').classList.add('selected');
  if (method === 'apple_pay') document.getElementById('methodApple').classList.add('selected');
  if (method === 'google_pay') document.getElementById('methodGoogle').classList.add('selected');
};

// Handle Pay Commission Execution
window.handlePayCommission = async function(e, applicationId, amount) {
  e.preventDefault();
  const btn = document.getElementById('payNowBtn');
  btn.disabled = true;
  btn.innerHTML = `<span>Processing...</span>`;

  try {
    const cardHolder = document.getElementById('cardHolder').value;
    const res = await window.API.processCommissionPayment({
      application_id: applicationId,
      payment_method: 'credit_card',
      card_holder: cardHolder,
      card_last4: '4242'
    });

    window.showToast(window.AppState.lang === 'ar' ? 'تم دفع نسبة المنصة وتوثيق التوظيف بنجاح!' : 'Platform commission paid & hire finalized!', 'success');

    // Render Confirmation Step 3 with full official receipt
    renderPaymentConfirmation(res.payment);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `<span>Try Again</span>`;
    window.showToast(err.message, 'error');
  }
};

// Render Confirmation Receipt (Step 3)
function renderPaymentConfirmation(payment) {
  const isArabic = window.AppState.lang === 'ar';
  const container = document.getElementById('paymentContentArea');

  container.innerHTML = `
    <div style="grid-column: 1 / -1; max-width: 640px; margin: 0 auto; width: 100%;">
      <div class="card" style="text-align: center; padding: 3rem 2rem;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
          ${window.Icons.checkCircle("w-10 h-10")}
        </div>

        <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
          ${isArabic ? 'تمت عملية الدفع بنجاح!' : 'Payment Completed Successfully!'}
        </h2>
        <p style="color: var(--text-muted); font-size: 0.9375rem; margin-bottom: 2rem;">
          ${isArabic ? 'تم سداد نسبة المنصة وتفعيل عقد التوظيف الخاص بك رسمياً.' : 'Your 3% platform commission has been settled and your employment verified.'}
        </p>

        <!-- Official Receipt Box -->
        <div style="background: #F8FAFC; border: 1px dashed var(--border-medium); border-radius: var(--radius-md); padding: 1.5rem; text-align: start; margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem; margin-bottom: 1rem;">
            <span style="font-weight: 700; font-size: 1.0625rem;">${isArabic ? 'إيصال سداد رسمي معتمد' : 'Verified Payment Receipt'}</span>
            <span style="color: #059669; font-weight: 700;">PAID</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.875rem;">
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'رقم الإيصال' : 'Receipt Number'}</div>
              <div style="font-weight: 700;">${payment.receipt_number}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'رقم المعاملة' : 'Transaction ID'}</div>
              <div style="font-weight: 700; font-family: monospace;">${payment.transaction_id}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'المسمى الوظيفي' : 'Job Title'}</div>
              <div style="font-weight: 600;">${payment.job_title}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'الشركة' : 'Employer'}</div>
              <div style="font-weight: 600;">${payment.company_name}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'المبلغ المسدد' : 'Amount Settled'}</div>
              <div style="font-weight: 800; color: #059669; font-size: 1.1rem;">${window.formatCurrency(payment.amount, payment.currency)}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">${isArabic ? 'تاريخ السداد' : 'Date & Time'}</div>
              <div style="font-weight: 600;">${new Date(payment.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button onclick="window.print()" class="btn btn-secondary">
            ${window.Icons.download("w-4 h-4")}
            <span>${isArabic ? 'طباعة / حفظ الإيصال' : 'Print / Save Receipt'}</span>
          </button>
          <button onclick="navigateTo('dashboard')" class="btn btn-primary">
            ${window.Icons.layoutDashboard("w-4 h-4")}
            <span>${isArabic ? 'الذهاب إلى لوحة التحكم' : 'Return to Dashboard'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
