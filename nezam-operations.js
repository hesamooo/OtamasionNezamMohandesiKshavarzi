/* افزونه بهبودهای سه‌گانه مرکز ۶۳۶ خفر
   ۱) پشتیبان محلی نسخه‌ای + کنترل سلامت داده
   ۲) داشبورد عملیاتی مبتنی بر داده‌های واقعی سامانه
   ۳) دستیار هوشمند با ارسال اختیاری خلاصه پرونده فعال
*/
(function () {
  'use strict';
  if (window.__nezam636OperationsSuiteLoaded) return;
  window.__nezam636OperationsSuiteLoaded = true;

  var VAULT_DB_NAME = 'Nezam636SafetyVault';
  var VAULT_DB_VERSION = 1;
  var AUTO_SNAPSHOT_INTERVAL = 24 * 60 * 60 * 1000;

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
    var letters = Array.isArray(window.lettersDB) ? window.lettersDB : [];
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
    var metrics = [
      { label: 'پرونده‌های ثبت‌شده', value: cases.length },
      { label: 'پیگیری‌های باز', value: pendingTasks.length },
      { label: 'پیگیری‌های عقب‌افتاده', value: overdue.length },
      { label: 'استعلام‌های غیرقطعی', value: inquiryPending }
    ];
    var html = '<div class="row g-2 mb-3">';
    metrics.forEach(function (m) {
      html += '<div class="col-6 col-md-3"><div class="nezam-op-stat"><small>' + m.label + '</small><b>' + fa(m.value) + '</b></div></div>';
    });
    html += '</div><div class="row g-2"><div class="col-md-6"><div class="small fw-bold text-success mb-2">ترکیب پرونده‌ها در سه گروه تخصصی</div>';
    groupCounts.forEach(function (g) {
      html += '<div class="nezam-op-group"><span style="min-width:116px">' + g.label + '</span><div class="nezam-op-track"><i style="width:' + Math.round((g.count / maxCount) * 100) + '%"></i></div><b>' + fa(g.count) + '</b></div>';
    });
    html += '<div class="small text-muted mt-2">نامه‌های ثبت‌شده: ' + fa(letters.length) + ' | پرونده‌های فعال: ' + fa(cases.filter(function (c) { return c && c.caseStatus !== 'ARCHIVED'; }).length) + '</div></div>';
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

  function openVaultDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('مرورگر از IndexedDB پشتیبانی نمی‌کند.'));
      var req = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('خطا در بازکردن مخزن پشتیبان محلی.')); };
    });
  }

  function collectSafeStorage() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      var allowed = key.indexOf('nezam636_') === 0 || key.indexOf('nezam_croquis_') === 0 || key === 'nezam_gemini_model';
      if (!allowed || /api.?key|password|token|secret/i.test(key)) continue;
      data[key] = localStorage.getItem(key);
    }
    return data;
  }

  async function collectProtectedBackup() {
    if (typeof window.flushInMemoryStateToLocalStorage === 'function') window.flushInMemoryStateToLocalStorage();
    var docs = [];
    if (typeof window.exportIndexedDBDocs === 'function') {
      try { docs = await window.exportIndexedDBDocs(); } catch (e) { console.warn('Backup documents could not be read:', e); }
    }
    return {
      format: 'NEZAM636_PROTECTED_BACKUP',
      version: 1,
      createdAt: new Date().toISOString(),
      createdAtFa: typeof window.todayShamsi === 'function' ? window.todayShamsi() : '',
      storage: collectSafeStorage(),
      indexedDBDocs: Array.isArray(docs) ? docs : [],
      note: 'کلیدهای API و رمزهای عبور عمداً در فایل پشتیبان قرار نمی‌گیرند. ممکن است برخی پیوست‌های بسیار بزرگ، به‌دلیل محدودیت خروجی فعلی IndexedDB، در بسته قرار نگیرند.'
    };
  }

  async function downloadProtectedBackup(label) {
    try {
      notify('در حال تهیه پشتیبان کامل از داده‌های سامانه و پیوست‌ها...');
      var data = await collectProtectedBackup();
      data.label = label || 'پشتیبان دستی';
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Nezam636_Protected_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      notify('پشتیبان آماده شد. تعداد پیوست‌های قابل‌انتقال: ' + fa(data.indexedDBDocs.length));
    } catch (err) {
      console.error(err);
      notify('تهیه پشتیبان انجام نشد: ' + (err.message || 'خطای ناشناخته'), true);
    }
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('خواندن فایل پشتیبان ناموفق بود.')); };
      reader.readAsText(file);
    });
  }

  function normalizeBackupData(data) {
    if (!data || typeof data !== 'object') throw new Error('ساختار فایل پشتیبان معتبر نیست.');
    if (data.format === 'NEZAM636_PROTECTED_BACKUP' && data.storage && typeof data.storage === 'object') {
      return { storage: data.storage, docs: Array.isArray(data.indexedDBDocs) ? data.indexedDBDocs : [] };
    }
    var storage = {};
    if (Array.isArray(data.casesDB)) storage.nezam636_unified_cases = JSON.stringify(data.casesDB);
    if (Array.isArray(data.lettersDB)) storage.nezam636_letters = JSON.stringify(data.lettersDB);
    if (Array.isArray(data.tasksDB)) storage.nezam636_tasks = JSON.stringify(data.tasksDB);
    if (data.docChecklists && typeof data.docChecklists === 'object') storage.nezam636_doc_checklists_v2 = JSON.stringify(data.docChecklists);
    if (data.actSpecs && typeof data.actSpecs === 'object') storage.nezam636_act_specs_v3 = JSON.stringify(data.actSpecs);
    if (!Object.keys(storage).length) throw new Error('این فایل شامل داده‌های قابل‌بازیابی سامانه نیست.');
    return { storage: storage, docs: Array.isArray(data.indexedDBDocs) ? data.indexedDBDocs : [] };
  }

  async function applyBackupPayload(payload, label) {
    var safeEntries = Object.entries(payload.storage || {});
    if (!safeEntries.length) throw new Error('هیچ داده‌ای برای بازیابی در فایل وجود ندارد.');
    for (var i = 0; i < safeEntries.length; i++) {
      var key = safeEntries[i][0];
      var value = safeEntries[i][1];
      var allowed = key.indexOf('nezam636_') === 0 || key.indexOf('nezam_croquis_') === 0 || key === 'nezam_gemini_model';
      if (!allowed || /api.?key|password|token|secret/i.test(key) || typeof value !== 'string') continue;
      localStorage.setItem(key, value);
    }
    if (payload.docs.length && typeof window.importIndexedDBDocs === 'function') {
      var imported = await window.importIndexedDBDocs(payload.docs);
      if (!imported) throw new Error('داده‌های اصلی بازیابی شد، اما انتقال برخی پیوست‌ها ناموفق بود.');
    }
    if (typeof window.reloadAllStateFromLocalStorage === 'function') window.reloadAllStateFromLocalStorage();
    if (typeof window.loadActiveCaseIntoForm === 'function') window.loadActiveCaseIntoForm();
    if (typeof window.refreshAllViews === 'function') window.refreshAllViews();
    renderOperationsDashboard();
    refreshSafetyPanel();
    notify('بازیابی ' + (label || 'اطلاعات') + ' انجام شد. وضعیت پیوست‌ها را نیز بررسی کنید.');
  }

  async function restoreProtectedBackup(file) {
    if (!file) return;
    try {
      var data = JSON.parse(await readFileAsText(file));
      var payload = normalizeBackupData(data);
      if (!confirm('بازیابی اطلاعات، داده‌های فعلی پرونده‌ها و نامه‌ها را جایگزین می‌کند. ابتدا یک نسخه بازگشت محلی تهیه می‌شود. ادامه می‌دهید؟')) return;
      await createVaultSnapshot('نسخه قبل از بازیابی فایل');
      await applyBackupPayload(payload, 'فایل پشتیبان');
    } catch (err) {
      console.error(err);
      notify('بازیابی ناموفق بود: ' + (err.message || 'فایل نامعتبر است.'), true);
    } finally {
      var input = byId('nezam-protected-backup-input');
      if (input) input.value = '';
    }
  }

  async function createVaultSnapshot(label) {
    var backup = await collectProtectedBackup();
    var db = await openVaultDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(['snapshots', 'meta'], 'readwrite');
      var now = Date.now();
      tx.objectStore('snapshots').put({
        id: String(now),
        createdAt: now,
        label: label || 'نسخه پشتیبان خودکار',
        storage: backup.storage,
        indexedDBDocs: backup.indexedDBDocs
      });
      tx.objectStore('meta').put({ key: 'lastSnapshotAt', value: now });
      tx.objectStore('meta').put({ key: 'latestSnapshotInfo', value: { id: String(now), createdAt: now, label: label || 'نسخه پشتیبان خودکار' } });
      tx.oncomplete = function () {
        var readTx = db.transaction(['snapshots'], 'readonly');
        var req = readTx.objectStore('snapshots').getAll();
        req.onsuccess = function () {
          var all = req.result || [];
          all.sort(function (a, b) { return b.createdAt - a.createdAt; });
          if (all.length > 4) {
            var trimTx = db.transaction(['snapshots'], 'readwrite');
            all.slice(4).forEach(function (item) { trimTx.objectStore('snapshots').delete(item.id); });
            trimTx.oncomplete = function () { db.close(); resolve(true); };
            trimTx.onerror = function () { db.close(); resolve(true); };
          } else {
            db.close();
            resolve(true);
          }
        };
        req.onerror = function () { db.close(); resolve(true); };
      };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('ذخیره نسخه محلی ناموفق بود.')); };
    });
  }

  async function getLatestVaultSnapshot() {
    var db = await openVaultDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(['snapshots'], 'readonly');
      var req = tx.objectStore('snapshots').getAll();
      req.onsuccess = function () {
        db.close();
        var all = req.result || [];
        all.sort(function (a, b) { return b.createdAt - a.createdAt; });
        resolve(all[0] || null);
      };
      req.onerror = function () { db.close(); reject(req.error || new Error('خواندن نسخه محلی ناموفق بود.')); };
    });
  }

  async function restoreLatestVaultSnapshot() {
    try {
      var snapshot = await getLatestVaultSnapshot();
      if (!snapshot) {
        notify('هنوز نسخه پشتیبان محلی ثبت نشده است.', true);
        return;
      }
      if (!confirm('آخرین نسخه محلی (' + new Date(snapshot.createdAt).toLocaleString('fa-IR') + ') جایگزین اطلاعات فعلی می‌شود. قبل از آن نسخه فعلی نیز در مخزن محلی نگهداری خواهد شد. ادامه می‌دهید؟')) return;
      await createVaultSnapshot('نسخه قبل از بازگردانی');
      await applyBackupPayload({ storage: snapshot.storage, docs: snapshot.indexedDBDocs || [] }, 'نسخه محلی');
    } catch (err) {
      console.error(err);
      notify('بازگردانی نسخه محلی ناموفق بود: ' + (err.message || ''), true);
    }
  }

  async function maybeCreateAutomaticSnapshot() {
    try {
      var db = await openVaultDB();
      var last = await new Promise(function (resolve, reject) {
        var tx = db.transaction(['meta'], 'readonly');
        var req = tx.objectStore('meta').get('lastSnapshotAt');
        req.onsuccess = function () { resolve(req.result ? Number(req.result.value) : 0); };
        req.onerror = function () { reject(req.error); };
      });
      db.close();
      var cases = Array.isArray(window.casesDB) ? window.casesDB : [];
      if (!cases.length || Date.now() - last < AUTO_SNAPSHOT_INTERVAL) return;
      await createVaultSnapshot('پشتیبان خودکار ۲۴ ساعته');
      refreshSafetyPanel();
    } catch (err) {
      console.warn('Automatic safety snapshot skipped:', err);
    }
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

  async function getLatestVaultSnapshotInfo() {
    var db = await openVaultDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(['meta'], 'readonly');
      var req = tx.objectStore('meta').get('latestSnapshotInfo');
      req.onsuccess = function () {
        db.close();
        resolve(req.result ? req.result.value : null);
      };
      req.onerror = function () {
        db.close();
        reject(req.error || new Error('خواندن اطلاعات نسخه محلی ناموفق بود.'));
      };
    });
  }

  async function refreshSafetyPanel() {
    var panel = byId('nezam-safety-panel');
    if (!panel) return;
    var health = byId('nezam-data-health');
    var localSize = byId('nezam-local-storage-size');
    var lastCloud = byId('nezam-last-cloud-sync');
    var vaultStatus = byId('nezam-vault-status');
    var issues = diagnoseData();
    if (health) {
      health.textContent = issues.length ? 'نیازمند بررسی: ' + fa(issues.length) + ' مورد' : 'ساختار داده‌های اصلی سالم است';
      health.className = issues.length ? 'badge bg-warning text-dark' : 'badge bg-success';
      health.title = issues.join(' | ');
    }
    if (localSize) {
      try {
        var estimate = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
        localSize.textContent = estimate && estimate.usage != null
          ? 'فضای مرورگر: ' + (estimate.usage / 1048576).toFixed(1) + ' / ' + (estimate.quota / 1048576).toFixed(0) + ' MB'
          : 'فضای ذخیره‌سازی مرورگر: در دسترس نیست';
      } catch (e) { localSize.textContent = 'اطلاعات فضای مرورگر در دسترس نیست'; }
    }
    if (lastCloud) {
      var ts = Number(localStorage.getItem('__gdrive_sync_ts') || 0);
      lastCloud.textContent = ts ? 'آخرین ذخیره تأییدشده در درایو: ' + new Date(ts).toLocaleString('fa-IR') : 'هنوز ذخیره ابری تأییدشده ثبت نشده است';
    }
    if (vaultStatus) {
      try {
        var latestInfo = await getLatestVaultSnapshotInfo();
        vaultStatus.textContent = latestInfo
          ? 'آخرین پشتیبان محلی: ' + new Date(latestInfo.createdAt).toLocaleString('fa-IR') + ' (' + (latestInfo.label || 'نسخه محلی') + ')'
          : 'نسخه پشتیبان محلی هنوز ایجاد نشده است';
      } catch (e) { vaultStatus.textContent = 'مخزن پشتیبان محلی در دسترس نیست'; }
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
        '<strong class="text-success">🛡️ مرکز حفاظت، سلامت و نسخه‌های پشتیبان</strong>' +
        '<span id="nezam-data-health" class="badge bg-secondary">در حال بررسی...</span>' +
      '</div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">وضعیت مخزن محلی</span><b id="nezam-vault-status" class="small">در حال بررسی...</b></div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">همگام‌سازی گوگل‌درایو</span><b id="nezam-last-cloud-sync" class="small">در حال بررسی...</b></div>' +
      '<div class="nezam-safety-row"><span class="small text-muted">حجم مصرفی ذخیره‌سازی مرورگر</span><b id="nezam-local-storage-size" class="small">در حال بررسی...</b></div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
        '<button type="button" class="btn btn-sm btn-success" id="nezam-create-backup-btn">📦 دریافت پشتیبان کامل</button>' +
        '<button type="button" class="btn btn-sm btn-outline-success" id="nezam-restore-vault-btn">↩️ بازگردانی آخرین نسخه محلی</button>' +
        '<label class="btn btn-sm btn-outline-primary m-0" for="nezam-protected-backup-input">📂 بازیابی فایل پشتیبان</label>' +
        '<input type="file" id="nezam-protected-backup-input" accept=".json,application/json" hidden>' +
        '<button type="button" class="btn btn-sm btn-outline-secondary" id="nezam-refresh-health-btn">بررسی مجدد سلامت</button>' +
      '</div>' +
      '<div class="small text-muted mt-2">نسخه محلی روی همین مرورگر ذخیره می‌شود. فایل پشتیبان را جداگانه روی رایانه یا فضای امن نگهداری کنید. کلید Gemini در پشتیبان قرار نمی‌گیرد؛ پیوست‌های خیلی بزرگ ممکن است در خروجی نیایند.</div>';
    taskCard.insertAdjacentElement('afterend', card);
    byId('nezam-create-backup-btn').addEventListener('click', function () { downloadProtectedBackup('پشتیبان دستی'); });
    byId('nezam-restore-vault-btn').addEventListener('click', restoreLatestVaultSnapshot);
    byId('nezam-protected-backup-input').addEventListener('change', function (e) { restoreProtectedBackup(e.target.files && e.target.files[0]); });
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
    if (typeof window.saveAllDB === 'function' && !window.saveAllDB.__nezamWrapped) {
      var originalSave = window.saveAllDB;
      var wrappedSave = function () {
        var result = originalSave.apply(this, arguments);
        if (result) {
          window.clearTimeout(window.__nezam636VaultTimer);
          window.__nezam636VaultTimer = window.setTimeout(maybeCreateAutomaticSnapshot, 2500);
        }
        return result;
      };
      wrappedSave.__nezamWrapped = true;
      window.saveAllDB = wrappedSave;
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
    window.setTimeout(maybeCreateAutomaticSnapshot, 90000);
    window.setInterval(refreshSafetyPanel, 20000);
  }

  window.downloadNezam636ProtectedBackup = downloadProtectedBackup;
  window.restoreNezam636ProtectedBackup = restoreProtectedBackup;
  window.restoreNezam636VaultSnapshot = restoreLatestVaultSnapshot;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
