/* افزونه عملیات مرکز ۶۳۶ خفر
   ۱) پایش سلامت ساختار اطلاعات و وضعیت Google Drive
   ۲) داشبورد عملیاتی مبتنی بر داده‌های سامانه
   ۳) دستیار هوشمند با ارسال اختیاری خلاصه پرونده فعال
*/
(function () {
  'use strict';
  if (window.__nezam636OperationsSuiteLoaded) return;
  window.__nezam636OperationsSuiteLoaded = true;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  function fa(value) {
    return typeof window.toFa === 'function' ? window.toFa(value) : String(value);
  }
  function notify(message, isError) {
    if (typeof window.showToastMsg === 'function') window.showToastMsg(message, Boolean(isError));
    else if (isError) alert(message);
    else console.info(message);
  }
  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function dateKey(value) {
    var digits = typeof window.toEn === 'function' ? window.toEn(String(value || '')) : String(value || '');
    var m = digits.match(/(\d{3,4})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})/);
    if (!m) return 0;
    return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
  }
  function currentJalaliKey() {
    return dateKey(typeof window.todayShamsi === 'function' ? window.todayShamsi() : '');
  }

  function addStyles() {
    if (byId('nezam-operations-suite-styles')) return;
    var style = document.createElement('style');
    style.id = 'nezam-operations-suite-styles';
    style.textContent =
      '#nezam-ops-suite .nezam-op-stat{border:1px solid #e3ece5;border-radius:13px;background:linear-gradient(145deg,#fff,#f3f8f4);padding:13px;min-height:90px;box-shadow:0 4px 14px rgba(30,70,45,.05)}' +
      '#nezam-ops-suite .nezam-op-stat b{display:block;color:#244d35;font-size:1.45rem;line-height:1.5}' +
      '#nezam-ops-suite .nezam-op-stat small{color:#637568;font-weight:700}' +
      '#nezam-ops-suite .nezam-op-group{display:flex;align-items:center;gap:9px;margin:9px 0;font-size:12px}' +
      '#nezam-ops-suite .nezam-op-track{height:8px;flex:1;background:#e8efe9;border-radius:20px;overflow:hidden}' +
      '#nezam-ops-suite .nezam-op-track i{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#7eae89,#2e805b);transition:width .45s ease}' +
      '#nezam-ops-suite .nezam-ai-action{display:flex;align-items:center;gap:9px;width:100%;text-align:right;border:1px solid #dfe9e1;border-radius:11px;background:#fff;padding:10px 12px;color:#254b35;font-weight:700;cursor:pointer;transition:all .2s ease;margin-top:7px}' +
      '#nezam-ops-suite .nezam-ai-action:hover{background:#eef7f0;border-color:#9fc5a9;transform:translateY(-2px)}' +
      '#nezam-safety-panel{border:1px solid #dce8df!important;background:linear-gradient(145deg,#fff,#f5faf6)!important}' +
      '#nezam-safety-panel .nezam-safety-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #e8efe9}' +
      '#nezam-safety-panel .nezam-safety-row:last-child{border-bottom:0}' +
      '#ai-case-context-box{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid #dfebdf;border-radius:10px;background:#f5faf5;margin:0 0 10px;font-size:12px;line-height:1.8}' +
      '#ai-case-context-box input{margin-top:5px;accent-color:#26724d;flex:0 0 auto}' +
      '#ai-case-context-box .ai-context-warning{display:block;color:#98631a;font-size:11px}' +
      '@media(max-width:560px){#nezam-ops-suite .nezam-op-stat{min-height:76px;padding:10px}#nezam-ops-suite .nezam-op-stat b{font-size:1.2rem}}';
    document.head.appendChild(style);
  }

  function groupInfo(group) {
    if (group === 'GREENHOUSE_MUSHROOM') return { label: 'گلخانه و قارچ', color: '#4d9b69' };
    if (group === 'CLINIC_PHARMACY') return { label: 'کلینیک و داروخانه', color: '#c98a52' };
    return { label: 'دام، طیور و شیلات', color: '#5b87ad' };
  }

  function renderOperationsDashboard() {
    var host = byId('nezam-ops-suite');
    if (!host) return;
    var cases = Array.isArray(window.casesDB) ? window.casesDB : [];
    var tasks = Array.isArray(window.tasksDB) ? window.tasksDB : [];
    var pendingTasks = tasks.filter(function (t) { return t && t.status !== 'انجام شده'; });
    var today = currentJalaliKey();
    var overdue = pendingTasks.filter(function (t) {
      var due = dateKey(t.due);
      return due && today && due < today;
    });
    var inquiryPending = 0;
    cases.forEach(function (c) {
      var inq = c && c.inquiries && typeof c.inquiries === 'object' ? c.inquiries : {};
      Object.keys(inq).forEach(function (key) {
        if (inq[key] !== 'OK') inquiryPending++;
      });
    });
    var groups = [
      { key: 'GREENHOUSE_MUSHROOM', label: 'گلخانه و قارچ' },
      { key: 'LIVESTOCK_POULTRY_FISHERIES', label: 'دام، طیور و شیلات' },
      { key: 'CLINIC_PHARMACY', label: 'کلینیک و داروخانه' }
    ];
    var groupCounts = groups.map(function (g) {
      return { label: g.label, count: cases.filter(function (c) { return c && c.mainGroup === g.key; }).length };
    });
    var maxCount = Math.max(1, cases.length);
    // فقط شاخص‌های تکمیلی نمایش داده می‌شوند؛ تعداد پرونده و پیگیری باز در پیشخوان اصلی وجود دارد.
    var metrics = [
      { label: 'پیگیری‌های عقب‌افتاده', value: overdue.length },
      { label: 'استعلام‌های غیرقطعی', value: inquiryPending }
    ];
    var html = '<div class="row g-2 mb-3">';
    metrics.forEach(function (m) {
      html += '<div class="col-6 col-md-6"><div class="nezam-op-stat"><small>' + m.label + '</small><b>' + fa(m.value) + '</b></div></div>';
    });
    html += '</div><div class="row g-2"><div class="col-md-6"><div class="small fw-bold text-success mb-2">ترکیب پرونده‌ها در سه گروه تخصصی</div>';
    groupCounts.forEach(function (g) {
      html += '<div class="nezam-op-group"><span style="min-width:116px">' + g.label + '</span><div class="nezam-op-track"><i style="width:' + Math.round((g.count / maxCount) * 100) + '%"></i></div><b>' + fa(g.count) + '</b></div>';
    });
    html += '</div>';
    html += '<div class="col-md-6"><div class="small fw-bold text-success mb-2">کارمند هوشمند؛ ابزارهای آماده اقدام</div>';
    html += '<button class="nezam-ai-action" type="button" data-nezam-ai-action="review">🔎 <span>ارزیابی نقص‌ها و وضعیت پرونده فعال</span></button>';
    html += '<button class="nezam-ai-action" type="button" data-nezam-ai-action="letter">✉️ <span>تهیه پیش‌نویس نامه رسمی برای پرونده فعال</span></button>';
    html += '<button class="nezam-ai-action" type="button" data-nezam-ai-action="tasks">📋 <span>اولویت‌بندی پیگیری‌های باز مرکز</span></button>';
    html += '<button class="nezam-ai-action" type="button" data-nezam-ai-action="regulations">⚖️ <span>بررسی ضوابط مرتبط با طرح پرونده</span></button>';
    html += '<div class="small text-muted mt-2">این ابزارها فقط پیشنهاد و پیش‌نویس می‌سازند؛ هیچ نامه یا تغییری را بدون اقدام شما ثبت نمی‌کنند.</div></div></div>';
    host.innerHTML = html;
  }

  function insertOperationsDashboard() {
    var pane = byId('pane-dashboard');
    var anchor = pane && pane.querySelector('.workflow-law-strip');
    if (!pane || !anchor || byId('nezam-ops-suite')) return;
    var card = document.createElement('section');
    card.id = 'nezam-ops-suite';
    card.className = 'card-clean mb-3';
    card.innerHTML = '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-2 border-bottom"><strong class="text-success">📊 داشبورد مدیریتی و پایش عملیات</strong><span class="badge bg-light text-dark border">محاسبه از داده‌های ثبت‌شده</span></div><div id="nezam-ops-live"></div>';
    anchor.insertAdjacentElement('afterend', card);
    var holder = byId('nezam-ops-live');
    if (holder) {
      holder.id = 'nezam-ops-suite';
      card.id = 'nezam-ops-suite-card';
    }
    renderOperationsDashboard();
  }

  function diagnoseData() {
    var issues = [];
    var checks = [
      { key: 'nezam636_unified_cases', label: 'پرونده‌ها', type: 'array' },
      { key: 'nezam636_letters', label: 'نامه‌ها', type: 'array' },
      { key: 'nezam636_tasks', label: 'پیگیری‌ها', type: 'array' },
      { key: 'nezam636_doc_checklists_v2', label: 'چک‌لیست مدارک', type: 'object' }
    ];
    checks.forEach(function (item) {
      var raw = localStorage.getItem(item.key);
      if (raw == null) return;
      try {
        var parsed = JSON.parse(raw);
        if (item.type === 'array' && !Array.isArray(parsed)) issues.push(item.label + ': ساختار آرایه‌ای ندارد');
        if (item.type === 'object' && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) issues.push(item.label + ': ساختار شیء معتبر ندارد');
      } catch (e) { issues.push(item.label + ': داده قابل‌خواندن نیست'); }
    });
    var cases = Array.isArray(window.casesDB) ? window.casesDB : [];
    var ids = new Set();
    cases.forEach(function (c) {
      if (!c || !c.id) issues.push('یک پرونده شناسه ندارد');
      else if (ids.has(c.id)) issues.push('شناسه پرونده تکراری: ' + c.id);
      else ids.add(c.id);
    });
    return issues;
  }

  async function refreshSafetyPanel() {
    var panel = byId('nezam-safety-panel');
    if (!panel) return;
    var health = byId('nezam-data-health');
    var lastCloud = byId('nezam-last-cloud-sync');
    var driveStatus = byId('nezam-drive-status');
    var issues = diagnoseData();
    if (health) {
      health.textContent = issues.length ? 'نیازمند بررسی: ' + fa(issues.length) + ' مورد' : 'ساختار اطلاعات معتبر است';
      health.className = issues.length ? 'badge bg-warning text-dark' : 'badge bg-success';
      health.title = issues.join(' | ');
    }
    if (lastCloud) {
      var ts = Number(localStorage.getItem('__gdrive_sync_ts') || 0);
      lastCloud.textContent = ts
        ? 'آخرین ذخیره تأییدشده در Google Drive: ' + new Date(ts).toLocaleString('fa-IR')
        : 'هنوز ذخیره‌ای در Google Drive تأیید نشده است';
    }
    if (driveStatus) {
      var cloudButton = byId('gdrive-status-btn');
      driveStatus.textContent = cloudButton
        ? String(cloudButton.textContent || '').trim()
        : 'وضعیت اتصال در نوار بالای سامانه نمایش داده می‌شود';
    }
  }

  function insertSafetyPanel() {
    if (byId('nezam-safety-panel')) return;
    var tasksHolder = byId('tasks-list-holder');
    var taskCard = tasksHolder && tasksHolder.closest('.card-clean');
    if (!taskCard) return;
    var card = document.createElement('div');
    card.id = 'nezam-safety-panel';
    card.className = 'card-clean mb-3';
    card.innerHTML =
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-2 border-bottom">' +
        '<strong class="text-success">☁️ پایش اطلاعات و اتصال Google Drive</strong>' +
        '<span id="nezam-data-health" class="badge bg-secondary">در حال بررسی...</span>' +
      '</div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">مرجع اصلی اطلاعات و پیوست‌ها</span><b class="small">Google Drive</b></div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">وضعیت اتصال</span><b id="nezam-drive-status" class="small">در حال بررسی...</b></div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">آخرین ذخیره تأییدشده</span><b id="nezam-last-cloud-sync" class="small">در حال بررسی...</b></div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
        '<button type="button" class="btn btn-sm btn-primary" id="nezam-refresh-drive-btn">🔄 بازخوانی از Google Drive</button>' +
        '<button type="button" class="btn btn-sm btn-outline-secondary" id="nezam-refresh-health-btn">بررسی سلامت اطلاعات</button>' +
      '</div>' +
      '<div class="small text-muted mt-2">نسخه مرجع پرونده‌ها و نامه‌ها و همچنین فایل‌های پیوست در Google Drive نگهداری می‌شوند.</div>';
    taskCard.insertAdjacentElement('afterend', card);
    byId('nezam-refresh-drive-btn').addEventListener('click', function () {
      if (typeof window.loadFromDriveOnStartup === 'function') window.loadFromDriveOnStartup(true);
      else notify('ماژول همگام‌سازی Google Drive آماده نیست.', true);
    });
    byId('nezam-refresh-health-btn').addEventListener('click', refreshSafetyPanel);
    refreshSafetyPanel();
  }

  function insertAiContextControl() {
    var history = byId('ai-chat-history');
    if (!history || byId('ai-case-context-box')) return;
    var box = document.createElement('label');
    box.id = 'ai-case-context-box';
    box.innerHTML =
      '<input type="checkbox" id="ai-case-context-toggle">' +
      '<span><b>استفاده از خلاصه پرونده فعال در پاسخ هوش مصنوعی</b><span class="ai-context-warning">در صورت فعال‌سازی، نام متقاضی، عنوان طرح، مساحت/ظرفیت و وضعیت استعلام‌ها به Gemini ارسال می‌شود؛ کدملی و تلفن ارسال نمی‌شود. پیش‌فرض خاموش است.</span></span>';
    history.parentNode.insertBefore(box, history);
  }

  function buildAiCaseContext() {
    var active = typeof window.getActiveCase === 'function' ? window.getActiveCase() : null;
    if (!active) return 'پرونده فعالی انتخاب نشده است.';
    var inq = active.inquiries || {};
    var statusMap = { OK: 'موافقت', WAIT: 'در انتظار', NO: 'مخالفت', REVIEW: 'نیازمند بررسی' };
    var inquiryLines = Object.keys(inq).map(function (key) {
      return key + ': ' + (statusMap[inq[key]] || String(inq[key] || 'ثبت نشده'));
    });
    var group = groupInfo(active.mainGroup).label;
    var relatedTasks = (Array.isArray(window.tasksDB) ? window.tasksDB : []).filter(function (t) {
      return t && (t.caseId === active.id || (active.name && String(t.title || '').indexOf(active.name) !== -1)) && t.status !== 'انجام شده';
    }).slice(0, 8).map(function (t) {
      return '- ' + t.title + (t.due ? '، سررسید: ' + t.due : '') + '، وضعیت: ' + (t.status || 'نامشخص');
    });
    return [
      'شماره پرونده: ' + (active.code || 'ثبت نشده'),
      'نام متقاضی: ' + (active.name || 'ثبت نشده'),
      'گروه تخصصی: ' + group,
      'موضوع طرح: ' + (active.project || 'ثبت نشده'),
      'ظرفیت: ' + (active.cap || 'ثبت نشده'),
      'مساحت زمین: ' + (active.land || 'ثبت نشده'),
      'پلاک ثبتی زمین: ' + (active.landParcel || 'ثبت نشده'),
      'موقعیت: ' + (active.loc || 'ثبت نشده'),
      'وضعیت پرونده: ' + (active.caseStatus || 'نامشخص'),
      'استعلام‌ها: ' + (inquiryLines.length ? inquiryLines.join('؛ ') : 'هنوز اطلاعاتی ثبت نشده'),
      'نقشه‌های کروکی: ' + ((active.croquisMaps || []).length),
      'پیگیری‌های باز مرتبط: ' + (relatedTasks.length ? relatedTasks.join('\n') : 'موردی ثبت نشده'),
      'تذکر: این خلاصه فقط داده‌های ثبت‌شده سامانه است و جایگزین مدرک یا ضابطه قانونی نیست.'
    ].join('\n');
  }
  window.buildNezam636AIContext = buildAiCaseContext;

  function runAiEmployeeAction(action) {
    var prompts = {
      review: 'پرونده فعال را از نظر کامل بودن اطلاعات، وضعیت هفت استعلام، نقشه و پیگیری‌های باز بررسی کن. فقط موارد ناقص و گام بعدی پیشنهادی را فهرست کن؛ هیچ داده‌ای را تغییر نده.',
      letter: 'بر اساس اطلاعات پرونده فعال، پیش‌نویس یک نامه اداری رسمی و قابل ویرایش برای ادامه فرایند تهیه کن. گیرنده و موضوع نامعلوم را داخل کروشه مشخص کن و هیچ شماره یا تاریخ ساختگی نساز.',
      tasks: 'پیگیری‌های باز مرکز را با توجه به سررسید و وضعیت مرتب کن. موارد عقب‌افتاده را جدا کن و برای هر مورد اقدام بعدی کوتاه پیشنهاد بده.',
      regulations: 'ضوابط و مقررات جاری مرتبط با موضوع پرونده فعال را بررسی کن. فقط به مقررات معتبر و به‌روز استناد کن، نام و تاریخ منبع را بیاور و موارد نامطمئن را صریح مشخص کن.'
    };
    var prompt = prompts[action];
    if (!prompt) return;
    if (typeof window.switchMainPane === 'function') window.switchMainPane('pane-ai');
    var toggle = byId('ai-case-context-toggle');
    var contextNeeded = action === 'review' || action === 'letter' || action === 'regulations';
    if (toggle && contextNeeded && !toggle.checked) {
      var approvedShare = confirm('برای این اقدام، خلاصه پرونده فعال (بدون کدملی و تلفن) به سرویس Gemini ارسال شود؟');
      if (approvedShare) toggle.checked = true;
    }
    var input = byId('ai-chat-input');
    if (input) {
      input.value = prompt;
      if (typeof window.aiSendChatMessage === 'function') window.aiSendChatMessage();
      else notify('بخش دستیار هوشمند هنوز آماده نشده است.', true);
    }
  }

  function bindDashboardActions() {
    var host = byId('nezam-ops-suite');
    if (!host || host.dataset.bound === '1') return;
    host.dataset.bound = '1';
    host.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-nezam-ai-action]');
      if (btn) runAiEmployeeAction(btn.getAttribute('data-nezam-ai-action'));
    });
  }

  function installRefreshHooks() {
    if (typeof window.refreshAllViews === 'function' && !window.refreshAllViews.__nezamWrapped) {
      var originalRefresh = window.refreshAllViews;
      var wrappedRefresh = function () {
        var result = originalRefresh.apply(this, arguments);
        renderOperationsDashboard();
        refreshSafetyPanel();
        return result;
      };
      wrappedRefresh.__nezamWrapped = true;
      window.refreshAllViews = wrappedRefresh;
    }
  }

  function init() {
    addStyles();
    insertOperationsDashboard();
    insertSafetyPanel();
    insertAiContextControl();
    bindDashboardActions();
    installRefreshHooks();
    renderOperationsDashboard();
    refreshSafetyPanel();
    window.setInterval(refreshSafetyPanel, 20000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
