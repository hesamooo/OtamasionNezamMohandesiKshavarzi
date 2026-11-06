/* Nezam636 applicant document vault: Google Drive is the source of truth for new uploads. */
(function () {
  'use strict';
  var DRIVE_API_URL = 'https://script.google.com/macros/s/AKfycbyd7lrIZfKVUm09OzBQewj8_XRWJfMpd8vCm6DV-tAUXEkA33LgqL10UKe8Yz17TwM2/exec';
  var SESSION_STORAGE = '__nezam636_docs_session_v2';
  var LEGACY_KEY_STORAGE = '__nezam636_docs_access_key';
  var MAX_FILE_BYTES = 10 * 1024 * 1024;
  var lastFailedFiles = [];
  var ALLOWED = new Set(['pdf','jpg','jpeg','png','webp','gif','tif','tiff','bmp','doc','docx','xls','xlsx','ppt','pptx','txt','csv','rtf','odt','ods','odp']);

  function getAccessKey() {
    try {
      localStorage.removeItem(LEGACY_KEY_STORAGE);
      return sessionStorage.getItem(SESSION_STORAGE) || '';
    } catch (e) { return ''; }
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_STORAGE); } catch (e) {}
    try { localStorage.removeItem(LEGACY_KEY_STORAGE); } catch (e) {}
    readyPromise = null;
  }

  async function postPublic(payload, timeoutMs) {
    return withTimeout((async function() {
      var response = await fetch(DRIVE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload || {}),
        redirect: 'follow',
        cache: 'no-store'
      });
      var raw = await response.text();
      var data;
      try { data = JSON.parse(raw); }
      catch (e) { throw new Error('پاسخ Apps Script قابل‌خواندن نیست؛ Web App را بررسی کنید.'); }
      if (!response.ok) throw new Error('خطای ارتباط با Google Drive (' + response.status + ').');
      if (!data || data.status !== 'success') throw new Error(data && data.message ? data.message : 'درخواست ورود تأیید نشد.');
      return data;
    })(), timeoutMs || 15000, 'پاسخ Apps Script برای ورود دریافت نشد.');
  }

  function normalizeOtpDigits(value) {
    return String(value || '')
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); })
      .replace(/\D/g, '');
  }

  async function loginByEmailOtp() {
    return new Promise(function (resolve, reject) {
      var overlay = document.createElement('div');
      overlay.id = 'nezam636-otp-login-overlay';
      overlay.dir = 'rtl';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Tahoma,Arial,sans-serif;';
      overlay.innerHTML =
        '<div role="dialog" aria-modal="true" aria-labelledby="nezam636-otp-title" style="width:100%;max-width:440px;background:#fff;border-radius:16px;padding:22px;box-shadow:0 22px 70px rgba(0,0,0,.35);color:#1f2937;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">' +
            '<h3 id="nezam636-otp-title" style="margin:0;font-size:18px;">ورود امن به اتوماسیون</h3>' +
            '<span aria-hidden="true" style="font-size:24px;color:#52796f;">🔐</span>' +
          '</div>' +
          '<p style="font-size:13px;line-height:1.9;color:#64748b;margin:0 0 16px;">برای اتصال به بایگانی Google Drive، کد یک‌بارمصرف به ایمیل مجاز شما ارسال می‌شود. این پنجره را باز نگه دارید.</p>' +
          '<section id="nezam636-otp-email-step">' +
            '<label for="nezam636-otp-email" style="display:block;font-size:13px;font-weight:bold;margin-bottom:6px;">ایمیل مجاز</label>' +
            '<input id="nezam636-otp-email" type="email" autocomplete="email" value="khajehpourhesam@gmail.com" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:11px;direction:ltr;text-align:left;font-size:15px;">' +
            '<button id="nezam636-otp-send" type="button" style="width:100%;margin-top:12px;border:0;border-radius:9px;background:#1b6b4b;color:#fff;padding:12px;font-size:14px;font-weight:bold;cursor:pointer;">ارسال کد ورود</button>' +
          '</section>' +
          '<section id="nezam636-otp-code-step" hidden>' +
            '<p style="font-size:13px;margin:0 0 10px;">کد به نشانی <b id="nezam636-otp-sent-email" dir="ltr"></b> ارسال شده است.</p>' +
            '<a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;border:1px solid #cbd5e1;border-radius:9px;padding:10px;color:#166534;text-decoration:none;font-weight:bold;">بازکردن Gmail در زبانه جدید ↗</a>' +
            '<label for="nezam636-otp-code" style="display:block;font-size:13px;font-weight:bold;margin:14px 0 6px;">کد ۶ رقمی ایمیل</label>' +
            '<input id="nezam636-otp-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="مثلاً 123456" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:12px;direction:ltr;text-align:center;letter-spacing:7px;font-size:22px;">' +
            '<button id="nezam636-otp-verify" type="button" style="width:100%;margin-top:12px;border:0;border-radius:9px;background:#1b6b4b;color:#fff;padding:12px;font-size:14px;font-weight:bold;cursor:pointer;">تأیید کد و ورود</button>' +
            '<div style="display:flex;gap:8px;margin-top:10px;">' +
              '<button id="nezam636-otp-resend" type="button" disabled style="flex:1;border:1px solid #cbd5e1;border-radius:8px;background:#f1f5f9;color:#64748b;padding:9px;cursor:not-allowed;">ارسال مجدد (۶۰)</button>' +
              '<button id="nezam636-otp-change" type="button" style="flex:1;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;padding:9px;cursor:pointer;">تغییر ایمیل</button>' +
            '</div>' +
          '</section>' +
          '<div id="nezam636-otp-status" role="status" aria-live="polite" style="font-size:12px;line-height:1.8;margin-top:12px;color:#475569;min-height:22px;"></div>' +
          '<button id="nezam636-otp-cancel" type="button" style="display:block;margin:8px auto 0;border:0;background:transparent;color:#64748b;padding:7px;cursor:pointer;">انصراف</button>' +
        '</div>';

      document.body.appendChild(overlay);
      var emailStep = overlay.querySelector('#nezam636-otp-email-step');
      var codeStep = overlay.querySelector('#nezam636-otp-code-step');
      var emailInput = overlay.querySelector('#nezam636-otp-email');
      var codeInput = overlay.querySelector('#nezam636-otp-code');
      var sendButton = overlay.querySelector('#nezam636-otp-send');
      var verifyButton = overlay.querySelector('#nezam636-otp-verify');
      var resendButton = overlay.querySelector('#nezam636-otp-resend');
      var statusBox = overlay.querySelector('#nezam636-otp-status');
      var sentEmailBox = overlay.querySelector('#nezam636-otp-sent-email');
      var cooldownTimer = null;
      var settled = false;
      var currentEmail = '';

      function setStatus(message, isError) {
        statusBox.textContent = String(message || '');
        statusBox.style.color = isError ? '#b91c1c' : '#475569';
      }

      function cleanup() {
        if (cooldownTimer) clearInterval(cooldownTimer);
        document.removeEventListener('keydown', onKeyDown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }

      function fail(error) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error || 'ورود لغو شد.')));
      }

      function startCooldown(seconds) {
        var remaining = seconds;
        resendButton.disabled = true;
        resendButton.style.background = '#f1f5f9';
        resendButton.style.color = '#64748b';
        resendButton.style.cursor = 'not-allowed';
        resendButton.textContent = 'ارسال مجدد (' + remaining + ')';
        if (cooldownTimer) clearInterval(cooldownTimer);
        cooldownTimer = setInterval(function () {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            resendButton.disabled = false;
            resendButton.style.background = '#fff';
            resendButton.style.color = '#166534';
            resendButton.style.cursor = 'pointer';
            resendButton.textContent = 'ارسال مجدد کد';
          } else {
            resendButton.textContent = 'ارسال مجدد (' + remaining + ')';
          }
        }, 1000);
      }

      async function sendCode(isResend) {
        var enteredEmail = String(emailInput.value || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredEmail)) {
          setStatus('نشانی ایمیل معتبر وارد کنید.', true);
          emailInput.focus();
          return;
        }
        if (isResend) resendButton.disabled = true;
        else sendButton.disabled = true;
        setStatus('در حال ارسال کد به ایمیل...', false);
        try {
          var sent = await postPublic({ action: 'requestLoginCode', email: enteredEmail }, 20000);
          currentEmail = enteredEmail;
          sentEmailBox.textContent = currentEmail;
          emailStep.hidden = true;
          codeStep.hidden = false;
          codeInput.value = '';
          setStatus(sent.message || 'کد ورود ارسال شد. Gmail را در زبانه جدید باز کنید و کد را اینجا وارد کنید.', false);
          startCooldown(60);
          codeInput.focus();
        } catch (error) {
          setStatus(error && error.message ? error.message : String(error), true);
          if (isResend) resendButton.disabled = false;
          else sendButton.disabled = false;
        }
      }

      async function verifyCode() {
        var code = normalizeOtpDigits(codeInput.value);
        if (!/^\d{6}$/.test(code)) {
          setStatus('کد باید دقیقاً ۶ رقم باشد.', true);
          codeInput.focus();
          return;
        }
        verifyButton.disabled = true;
        verifyButton.style.opacity = '.65';
        setStatus('در حال بررسی کد ورود...', false);
        try {
          var verified = await postPublic({ action: 'verifyLoginCode', email: currentEmail, code: code }, 20000);
          if (Number(verified.apiVersion) !== 2 || !verified.sessionToken) {
            throw new Error('پاسخ احراز هویت معتبر نیست؛ Code.gs نسخه ۲ را منتشر کنید.');
          }
          try { sessionStorage.setItem(SESSION_STORAGE, verified.sessionToken); }
          catch (storageError) { throw new Error('مرورگر اجازه ذخیره نشست موقت را نمی‌دهد.'); }
          settled = true;
          cleanup();
          resolve(verified.sessionToken);
        } catch (error) {
          setStatus(error && error.message ? error.message : String(error), true);
          verifyButton.disabled = false;
          verifyButton.style.opacity = '1';
          codeInput.focus();
        }
      }

      function changeEmail() {
        if (cooldownTimer) clearInterval(cooldownTimer);
        cooldownTimer = null;
        emailInput.disabled = false;
        emailInput.value = currentEmail || emailInput.value;
        codeStep.hidden = true;
        emailStep.hidden = false;
        sendButton.disabled = false;
        setStatus('ایمیل را بررسی کنید و در صورت نیاز تغییر دهید.', false);
        emailInput.focus();
      }

      function onKeyDown(event) {
        if (event.key === 'Escape') fail(new Error('ورود توسط کاربر لغو شد.'));
      }

      sendButton.addEventListener('click', function () { sendCode(false); });
      resendButton.addEventListener('click', function () { sendCode(true); });
      verifyButton.addEventListener('click', verifyCode);
      overlay.querySelector('#nezam636-otp-change').addEventListener('click', changeEmail);
      overlay.querySelector('#nezam636-otp-cancel').addEventListener('click', function () { fail(new Error('ورود لغو شد.')); });
      codeInput.addEventListener('input', function () {
        codeInput.value = normalizeOtpDigits(codeInput.value).slice(0, 6);
        if (codeInput.value.length === 6) verifyButton.focus();
      });
      codeInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') verifyCode();
      });
      emailInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') sendCode(false);
      });
      document.addEventListener('keydown', onKeyDown);
      emailInput.focus();
    });
  }

  function withTimeout(promise, timeoutMs, message) {
    var timer;
    return Promise.race([
      promise,
      new Promise(function(resolve, reject) {
        timer = setTimeout(function() { reject(new Error(message)); }, timeoutMs);
      })
    ]).finally(function() { if (timer) clearTimeout(timer); });
  }

  async function fetchJsonWithTimeout(payload, timeoutMs, timeoutMessage) {
    return withTimeout((async function() {
      var response = await fetch(DRIVE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({}, payload, { sessionToken: getAccessKey() })),
        redirect: 'follow',
        cache: 'no-store'
      });
      var raw = await response.text();
      var data;
      try { data = JSON.parse(raw); }
      catch (e) { throw new Error('پاسخ Google Apps Script قابل‌خواندن نیست؛ نسخه منتشرشده Code.gs را بررسی کنید.'); }
      if (!response.ok) throw new Error('خطای ارتباط با Google Drive (' + response.status + ').');
      return data;
    })(), timeoutMs, timeoutMessage);
  }

  var readyPromise = null;
  async function ensureReady(forceLogin) {
    if (readyPromise && !forceLogin) return readyPromise;
    readyPromise = (async function() {
      var token = forceLogin ? '' : getAccessKey();
      if (token) {
        try {
          var check = await fetchJsonWithTimeout(
            { action: 'sync', healthCheck: true, fullDatabase: { storage: {} } },
            15000,
            'پاسخ Google Apps Script برای بررسی نشست دریافت نشد.'
          );
          if (Number(check.apiVersion) !== 2) throw new Error('نسخه Google Apps Script قدیمی است؛ Code.gs نسخه ۲ را منتشر کنید.');
          if (check.status === 'success') return true;
          throw new Error(check.message || 'نشست ورود تأیید نشد.');
        } catch (error) {
          if (!/نشست|نامعتبر|منقضی|AUTH_REQUIRED/i.test(String(error && error.message || error))) throw error;
          clearSession();
        }
      }
      token = await loginByEmailOtp();
      var result = await fetchJsonWithTimeout(
        { action: 'sync', healthCheck: true, fullDatabase: { storage: {} } },
        15000,
        'پاسخ Google Apps Script برای بررسی نشست دریافت نشد.'
      );
      if (Number(result.apiVersion) !== 2 || result.status !== 'success') {
        clearSession();
        throw new Error(result.message || 'احراز هویت Google Drive ناموفق بود.');
      }
      return true;
    })();
    try { return await readyPromise; }
    catch (error) { readyPromise = null; throw error; }
  }

  function getActionTimeout_(action) {
    // خواندن دیتابیس دیگر پشت قفل نوشتن منتظر نمی‌ماند؛ برای تأخیرهای مقطعی Drive نیز مهلت مناسب‌تری دارد.
    var timeouts = {
      readDatabase: 35000,
      listCaseDocuments: 35000,
      getCaseDocumentContent: 60000,
      uploadCaseDocument: 90000,
      replaceCaseDocument: 90000,
      deleteCaseDocument: 35000
    };
    return timeouts[String(action || '')] || 30000;
  }

  async function request(payload, allowKeyRetry) {
    await ensureReady();
    getAccessKey();
    var action = String(payload && payload.action || '');
    var timeoutMs = getActionTimeout_(action);
    var timeoutMessage = action === 'readDatabase'
      ? 'بازخوانی پایگاه داده از Google Drive در ۳۵ ثانیه پاسخ نداد. وضعیت اجرای Web App را بررسی کنید.'
      : 'عملیات «' + (action || 'نامشخص') + '» در مهلت ' + Math.round(timeoutMs / 1000) +
        ' ثانیه پاسخ نداد. ممکن است پردازش در Google Apps Script هنوز ادامه داشته باشد؛ پیش از تکرار عملیات، فهرست را بازخوانی کنید.';
    var data = await fetchJsonWithTimeout(payload, timeoutMs, timeoutMessage);
    var documentActions = ['readDatabase','listCaseDocuments','getCaseDocumentContent','uploadCaseDocument','replaceCaseDocument','deleteCaseDocument'];
    if (documentActions.indexOf(String(payload.action || '')) !== -1 && Number(data && data.apiVersion) !== 2) {
      throw new Error('Google Apps Script هنوز نسخه ۲ بایگانی مدارک را اجرا نمی‌کند؛ Code.gs را جایگزین و Web App را به‌روزرسانی کنید.');
    }
    if (!data || data.status !== 'success') {
      var message = data && data.message ? String(data.message) : 'عملیات در Google Drive تأیید نشد.';
      if (allowKeyRetry !== false && /نشست|نامعتبر|منقضی|AUTH_REQUIRED/i.test(message)) {
        clearSession();
        await ensureReady(true);
        return request(payload, false);
      }
      throw new Error(message);
    }
    return data;
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('خواندن فایل «' + file.name + '» ناموفق بود.')); };
      reader.onload = function () {
        var value = String(reader.result || '');
        var comma = value.indexOf(',');
        if (comma < 0) return reject(new Error('ساختار فایل «' + file.name + '» معتبر نیست.'));
        resolve(value.slice(comma + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  function extensionOf(name) {
    var match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  function validateFile(file) {
    if (!file || !file.name) throw new Error('یک فایل معتبر انتخاب کنید.');
    if (!ALLOWED.has(extensionOf(file.name))) throw new Error('فرمت فایل «' + file.name + '» پشتیبانی نمی‌شود.');
    if (!(file.size > 0) || file.size > MAX_FILE_BYTES) throw new Error('حجم فایل «' + file.name + '» باید بیشتر از صفر و حداکثر ۱۰ مگابایت باشد.');
  }

  function setProgress(done, total, currentName, statusText) {
    var wrap = document.getElementById('case-doc-upload-progress-wrap');
    var bar = document.getElementById('case-doc-upload-progress-bar');
    var label = document.getElementById('case-doc-upload-progress-label');
    var percent = total ? Math.round((done / total) * 100) : 0;
    if (wrap) wrap.hidden = false;
    if (bar) {
      bar.style.width = percent + '%';
      bar.setAttribute('aria-valuenow', String(percent));
      bar.textContent = percent + '%';
    }
    if (label) label.textContent = statusText || ((done + ' از ' + total + ' فایل') + (currentName ? ' — ' + currentName : ''));
  }

  async function uploadRawFile(fileInfo, context) {
    var payload = {
      action: context.replaceFileId ? 'replaceCaseDocument' : 'uploadCaseDocument',
      caseId: String(context.caseId),
      fullName: String(context.fullName || ''),
      nationalCode: String(context.nationalCode || ''),
      docCode: String(context.docCode || 'OTHER'),
      docTitle: String(context.docTitle || 'سایر مدارک'),
      fileName: String(fileInfo.fileName || fileInfo.file.name),
      fileType: String(fileInfo.fileType || fileInfo.file.type || 'application/octet-stream'),
      fileData: fileInfo.fileData,
      oldFileId: String(context.replaceFileId || '')
    };
    return request(payload, true);
  }

  async function uploadFiles(filesLike, context) {
    var files = Array.prototype.slice.call(filesLike || []);
    if (!files.length) throw new Error('فایلی برای بارگذاری انتخاب نشده است.');
    if (!context || !context.caseId) throw new Error('پرونده فعال مشخص نیست.');
    if (context.replaceFileId && files.length !== 1) throw new Error('برای جایگزینی، فقط یک فایل انتخاب کنید.');
    files.forEach(validateFile);
    var successes = [];
    var failures = [];
    lastFailedFiles = [];
    var replaceId = context.replaceFileId || '';
    setProgress(0, files.length, '', 'آماده‌سازی بارگذاری...');
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      setProgress(i, files.length, file.name, 'در حال بارگذاری ' + file.name);
      try {
        var base64 = await fileToBase64(file);
        var result = await uploadRawFile({file:file,fileName:file.name,fileType:file.type,fileData:base64}, Object.assign({},context,{replaceFileId:replaceId}));
        if (result.document) successes.push(result.document);
        else throw new Error('سرور فایل ذخیره‌شده را برنگرداند.');
      } catch (error) {
        var failure = {fileName:file.name,message:error && error.message ? error.message : String(error)};
        failures.push(failure);
        lastFailedFiles.push({file:file,context:Object.assign({},context,{replaceFileId:context.replaceFileId || ''})});
      }
      if (replaceId) replaceId = '';
      setProgress(i+1,files.length,file.name,(i+1)+' از '+files.length+' فایل پردازش شد');
    }
    setProgress(files.length,files.length,'',failures.length ? ('اتمام با '+failures.length+' خطا') : ('همه '+successes.length+' فایل با موفقیت در Drive ثبت شدند'));
    var errorBox = document.getElementById('case-doc-upload-errors');
    if (errorBox) {
      errorBox.textContent = failures.map(function(item) { return item.fileName + ': ' + item.message; }).join('\n');
      errorBox.style.display = failures.length ? 'block' : 'none';
    }
    var retryButton = document.getElementById('case-doc-retry-failed');
    if (retryButton) {
      retryButton.hidden = !lastFailedFiles.length;
      retryButton.textContent = lastFailedFiles.length ? '↻ تلاش مجدد (' + lastFailedFiles.length + ')' : '↻ تلاش مجدد';
    }
    if (typeof window.renderActiveCaseDocsChecklist === 'function') window.renderActiveCaseDocsChecklist();
    if (successes.length && typeof window.logCaseAction === 'function') {
      var active = window.getActiveCase ? window.getActiveCase() : null;
      if (active) window.logCaseAction(active,'بارگذاری '+successes.length+' فایل مدرک در Google Drive');
    }
    return {successes:successes,failures:failures};
  }

  async function readDatabase() {
    var response = await request({ action: 'readDatabase' }, true);
    return response.data || [];
  }

  async function list(context) {
    if (!context || !context.caseId) throw new Error('شناسه پرونده برای دریافت فهرست مدارک موجود نیست.');
    return request({action:'listCaseDocuments',caseId:String(context.caseId),fullName:String(context.fullName||''),nationalCode:String(context.nationalCode||'')},true);
  }

  async function getFileContent(fileId, context) {
    if (!fileId) throw new Error('شناسه فایل برای دریافت محتوای پیوست مشخص نیست.');
    if (!context || !context.caseId) throw new Error('پرونده برای دریافت محتوای پیوست مشخص نیست.');
    var response = await request({
      action:'getCaseDocumentContent',
      caseId:String(context.caseId),
      fullName:String(context.fullName||''),
      nationalCode:String(context.nationalCode||''),
      fileId:String(fileId)
    }, true);
    if (!response.document || !response.document.data) throw new Error('محتوای واقعی فایل از Google Drive دریافت نشد.');
    return response.document;
  }

  async function remove(fileId, context) {
    if (!fileId) throw new Error('شناسه فایل برای حذف مشخص نیست.');
    var result = await request({action:'deleteCaseDocument',caseId:String(context.caseId),fullName:String(context.fullName||''),nationalCode:String(context.nationalCode||''),fileId:String(fileId)},true);
    if (typeof window.renderActiveCaseDocsChecklist === 'function') window.renderActiveCaseDocsChecklist();
    if (typeof window.showToastMsg === 'function') window.showToastMsg('فایل از بایگانی Google Drive حذف شد.');
    return result;
  }

  function migrateLegacyDocs(context) {
    return new Promise(function (resolve,reject) {
      if (typeof window.getUploadedDocsForCase !== 'function') return reject(new Error('خواندن فایل‌های قدیمی مرورگر در دسترس نیست.'));
      window.getUploadedDocsForCase(context.caseId,async function(map) {
        var entries=Object.keys(map||{}).map(function(key){return map[key];}).filter(function(item){return item&&item.dataUrl;});
        if(!entries.length)return resolve({successes:[],failures:[]});
        var successes=[],failures=[];
        setProgress(0,entries.length,'','بررسی مدارک قدیمی این مرورگر...');
        for(var i=0;i<entries.length;i++){
          var item=entries[i];
          try{
            var dataUrl=String(item.dataUrl||'');
            var comma=dataUrl.indexOf(',');
            if(comma<0)throw new Error('محتوای فایل قدیمی معتبر نیست.');
            var base64=dataUrl.slice(comma+1);
            var size=Math.floor(base64.length*0.75);
            if(!size||size>MAX_FILE_BYTES)throw new Error('حجم فایل قدیمی بیش از ۱۰ مگابایت است؛ آن را جداگانه از فایل اصلی بارگذاری کنید.');
            var mime=dataUrl.slice(5,dataUrl.indexOf(';'))||'application/octet-stream';
            var result=await uploadRawFile({file:{name:item.fileName,type:mime},fileName:item.fileName,fileType:mime,fileData:base64},Object.assign({},context,{docCode:item.docCode,docTitle:item.docTitle}));
            successes.push(result.document);
          }catch(error){failures.push({fileName:item.fileName||'فایل قدیمی',message:error.message||String(error)});}
          setProgress(i+1,entries.length,item.fileName,(i+1)+' از '+entries.length+' فایل قدیمی منتقل شد');
        }
        if(typeof window.renderActiveCaseDocsChecklist==='function')window.renderActiveCaseDocsChecklist();
        resolve({successes:successes,failures:failures});
      });
    });
  }

  async function retryFailed() {
    if (!lastFailedFiles.length) throw new Error('فایل ناموفقی برای تلاش مجدد باقی نمانده است.');
    var pending = lastFailedFiles.slice();
    lastFailedFiles = [];
    return uploadFiles(pending.map(function(item) { return item.file; }), pending[0].context);
  }

  function getCaseContext() {
    var c=typeof window.getActiveCase==='function'?window.getActiveCase():null;
    if(!c)throw new Error('ابتدا یک متقاضی را انتخاب کنید.');
    return {caseId:String(c.id||''),fullName:String(c.name||''),nationalCode:String(c.nid||c.code||'')};
  }

  window.NezamDriveDocuments={
    list:list,readDatabase:readDatabase,uploadFiles:uploadFiles,retryFailed:retryFailed,remove:remove,migrateLegacyDocs:migrateLegacyDocs,
    getCaseContext:getCaseContext,getFileContent:getFileContent,getAccessKey:function(){return getAccessKey(false);},ensureReady:ensureReady,
    clearAccessKey:clearSession,
    maxFileBytes:MAX_FILE_BYTES
  };
})();