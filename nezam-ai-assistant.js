// Windows Script Host Guard: Prevents error if user double-clicks the .js file directly in Windows Explorer
if (typeof WScript !== 'undefined') {
  try {
    var sh = new ActiveXObject('WScript.Shell');
    sh.Run('index.html');
  } catch (e) {}
  WScript.Quit();
}

/* ==========================================================================
   NEZAM AI ASSISTANT MODULE v26.0 (AQ. & AIza KEYS + MULTI-MODEL GEMINI)
   سامانه هوشمند و دستیار فنی مرکز خدمات کشاورزی ۶۳۶ خفر:
   ۱. پشتیبانی کامل از کلیدهای نسل جدید (AQ.) و کلیدهای کلاسیک (AIza) در Google AI Studio
   ۲. امکان انتخاب تمامی نسخه‌های Gemini (2.5 Flash, 2.5 Pro, 2.0 Flash, 1.5 Pro/Flash)
   ۳. سازگاری ۱۰۰٪ با GitHub Pages، حالت آفلاین (file://) و سرور محلی
   ۴. خوانش تصویر اسناد، قولنامه‌ها و نقشه‌های UTM (OCR آنلاین و تحلیل حقوقی)
   ۵. استخراج خودکار فیلدهای پرونده و مختصات از متن خام (آفلاین و آنلاین)
   ========================================================================== */

// فهرست کامل مدل‌های قابل انتخاب Gemini
var GEMINI_AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (پیشنهادی - سریع و دقیق)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (تحلیل پیشرفته اسناد و قوانین)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (فوق سریع و کم‌مصرف)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (پایدار و چندرسانه‌ای)' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (سبک)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (نسل ۱.۵ حرفه‌ای)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (نسل ۱.۵ سریع)' },
  { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B (فوق سبک)' }
];

var aiOnlineStatus = {
  isOnline: false,
  model: getStoredGeminiModel(),
  searchGrounding: true,
  checked: false,
  userKeyActive: false,
};

var aiPendingImageBase64 = null;
var aiPendingImageMime = 'image/jpeg';
var aiChatHistoryBuffer = [];

// تشخیص اجرا روی GitHub Pages یا فایل محلی (بدون سرور بک‌اند Node.js)
function isStaticHostEnvironment() {
  var host = (window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
  var proto = (window.location && window.location.protocol) ? window.location.protocol : '';
  return proto === 'file:' || host.indexOf('github.io') !== -1 || host.indexOf('pages.dev') !== -1 || host.indexOf('netlify.app') !== -1;
}

// مدیریت مدل انتخابی کاربر در حافظه محلی
function getStoredGeminiModel() {
  try {
    var saved = (localStorage.getItem('nezam_gemini_model') || '').trim();
    if (!saved || saved === 'gemini-3.8-flash') {
      return 'gemini-2.5-flash';
    }
    return saved;
  } catch (e) {
    return 'gemini-2.5-flash';
  }
}

function setStoredGeminiModel(modelId) {
  try {
    if (modelId && modelId.trim()) {
      var cleanModel = modelId.trim().replace(/^models\//, '');
      localStorage.setItem('nezam_gemini_model', cleanModel);
      aiOnlineStatus.model = cleanModel;
    }
  } catch (e) {}
}

function getModelDisplayLabel(modelId) {
  var cleanId = (modelId || '').replace(/^models\//, '');
  for (var i = 0; i < GEMINI_AVAILABLE_MODELS.length; i++) {
    if (GEMINI_AVAILABLE_MODELS[i].id === cleanId) {
      return GEMINI_AVAILABLE_MODELS[i].label;
    }
  }
  return cleanId;
}

// تغییر مدل توسط کاربر از طریق منوی کشویی
window.changeGeminiModel = function (modelId) {
  var sel = document.getElementById('gemini-model-select');
  var chosen = modelId || (sel ? sel.value : 'gemini-2.5-flash');
  setStoredGeminiModel(chosen);
  updateAiBadgeStatus(aiOnlineStatus.isOnline);
  if (typeof showToastMsg === 'function') {
    showToastMsg('🤖 مدل هوش مصنوعی روی ' + chosen + ' تنظیم شد.');
  }
};

// ایجاد یا همگام‌سازی خودکار منوی انتخاب مدل در رابط کاربری
function ensureGeminiModelSelectorUI() {
  var existingSelect = document.getElementById('gemini-model-select');
  var currentModel = getStoredGeminiModel();

  if (existingSelect) {
    if (existingSelect.options.length === 0) {
      populateModelSelectOptions(existingSelect, GEMINI_AVAILABLE_MODELS, currentModel);
    } else {
      existingSelect.value = currentModel;
      if (!existingSelect.value && existingSelect.options.length > 0) {
        existingSelect.selectedIndex = 0;
      }
    }
    if (!existingSelect.onchange) {
      existingSelect.onchange = function () {
        window.changeGeminiModel(this.value);
      };
    }
    return;
  }

  var keyInput = document.getElementById('gemini-custom-api-key');
  var statusDesc = document.getElementById('ai-online-status-desc');
  var targetContainer = keyInput ? (keyInput.closest('.input-group') || keyInput.parentElement) : statusDesc;

  if (targetContainer && targetContainer.parentElement) {
    var wrapper = document.createElement('div');
    wrapper.id = 'gemini-model-selector-wrapper';
    wrapper.className = 'mt-2 mb-2 d-flex align-items-center gap-2 flex-wrap';

    var label = document.createElement('label');
    label.setAttribute('for', 'gemini-model-select');
    label.className = 'small fw-bold text-secondary mb-0';
    label.innerHTML = '🧠 انتخاب نسخه موتور Gemini:';

    var select = document.createElement('select');
    select.id = 'gemini-model-select';
    select.className = 'form-select form-select-sm w-auto flex-grow-1';
    select.style.maxWidth = '360px';

    populateModelSelectOptions(select, GEMINI_AVAILABLE_MODELS, currentModel);

    select.onchange = function () {
      window.changeGeminiModel(this.value);
    };

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    targetContainer.parentElement.insertBefore(wrapper, targetContainer.nextSibling);
  }
}

function populateModelSelectOptions(selectEl, modelsList, selectedId) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  var foundSelected = false;
  for (var i = 0; i < modelsList.length; i++) {
    var opt = document.createElement('option');
    opt.value = modelsList[i].id;
    opt.textContent = modelsList[i].label;
    if (modelsList[i].id === selectedId) {
      opt.selected = true;
      foundSelected = true;
    }
    selectEl.appendChild(opt);
  }
  if (!foundSelected && selectEl.options.length > 0) {
    selectEl.options[0].selected = true;
    setStoredGeminiModel(selectEl.options[0].value);
  }
}

// ترجمه دقیق خطاهای سرور گوگل به راهنمای فارسی به همراه پیام فنی
function translateGeminiErrorToPersian(errMsg, status) {
  var msg = String(errMsg || '');

  if (status === 403 || /User location is not supported|location is not supported|PERMISSION_DENIED/i.test(msg)) {
    return (
      'محدودیت جغرافیایی گوگل (آی‌پی ایران): سرور گوگل دسترسی مستقیم با آی‌پی ایران را مسدود کرده است. لطفاً سرویس <b>DNS شکن (Shecan)</b> یا ابزار تغییر آی‌پی خود را روشن کرده و مجدداً تست نمایید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (status === 400 && /API_KEY_INVALID|key not valid/i.test(msg)) {
    return (
      'سرور گوگل کلید وارد شده را نپذیرفت. لطفاً بررسی کنید کلید بدون فاصله اضافی کپی شده باشد یا پروژه مرتبط با آن در Google AI Studio فعال باشد.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) {
    return (
      'سهمیه لحظه‌ای (Quota / Rate Limit) این مدل پر شده است. لطفاً از منوی کشویی نسخه دیگری (مثلاً <code>Gemini 2.0 Flash</code> یا <code>Gemini 1.5 Flash</code>) را انتخاب نمایید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    return (
      'عدم برقراری ارتباط شبکه با سرور گوگل (<code>generativelanguage.googleapis.com</code>). لطفاً اتصال اینترنت و روشن بودن DNS شکن یا فیلترشکن خود را بررسی فرمایید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Network Error: ' + escapeHtml(msg) + '</div>'
    );
  }

  return 'خطای دریافتی از سرور گوگل: <div class="mt-1 small" dir="ltr"><code>' + escapeHtml(msg) + '</code></div>';
}

// ارسال یک درخواست به Google Gemini API با پشتیبانی همزمان از کلیدهای AQ. (هدر x-goog-api-key) و کلیدهای کلاسیک
async function callGeminiModelEndpoint(apiKey, modelName, payload) {
  var cleanKey = (apiKey || '').trim();
  var baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(modelName) +
    ':generateContent';

  // روش ۱: ارسال با هدر رسمی x-goog-api-key و پارامتر key (سازگار با کلیدهای AQ. و AIza)
  try {
    var resp1 = await fetch(baseUrl + '?key=' + encodeURIComponent(cleanKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      body: JSON.stringify(payload),
    });

    if (resp1.ok) {
      return { ok: true, data: await resp1.json(), status: 200 };
    }

    var errData1 = await resp1.json().catch(function () { return {}; });
    var rawMsg1 = (errData1 && errData1.error && errData1.error.message) ? errData1.error.message : ('HTTP ' + resp1.status);

    // اگر کلید از نوع AQ. باشد و با ?key= تداخل داشته باشد، فقط با هدر x-goog-api-key یا Authorization تست کن
    if (cleanKey.indexOf('AQ.') === 0 && (resp1.status === 400 || resp1.status === 401 || resp1.status === 403)) {
      var respHeaderOnly = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(payload),
      });

      if (respHeaderOnly.ok) {
        return { ok: true, data: await respHeaderOnly.json(), status: 200 };
      }
    }

    return { ok: false, status: resp1.status, errorMessage: rawMsg1 };
  } catch (netErr) {
    // در صورتی که مرورگر به دلیل CORS به هدر x-goog-api-key حساسیت نشان داد، ارسال ساده بدون هدر اضافی
    var respFallback = await fetch(baseUrl + '?key=' + encodeURIComponent(cleanKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (respFallback.ok) {
      return { ok: true, data: await respFallback.json(), status: 200 };
    }
    var errData2 = await respFallback.json().catch(function () { return {}; });
    var rawMsg2 = (errData2 && errData2.error && errData2.error.message) ? errData2.error.message : ('HTTP ' + respFallback.status);
    return { ok: false, status: respFallback.status, errorMessage: rawMsg2 };
  }
}

// دریافت اختیاری لیست مدل‌ها در پس‌زمینه (بدون ایجاد وقفه در عملکرد کلیدهای AQ.)
async function syncAvailableModelsNonBlocking(apiKey) {
  try {
    var cleanKey = (apiKey || '').trim();
    var listUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(cleanKey);
    var resp = await fetch(listUrl, {
      method: 'GET',
      headers: { 'x-goog-api-key': cleanKey },
    });
    if (!resp.ok) return;

    var data = await resp.json();
    if (data && Array.isArray(data.models)) {
      var dynamicModels = [];
      for (var i = 0; i < data.models.length; i++) {
        var m = data.models[i];
        var methods = m.supportedGenerationMethods || [];
        var shortId = (m.name || '').replace(/^models\//, '');
        if (
          shortId.indexOf('gemini-') === 0 &&
          methods.indexOf('generateContent') !== -1 &&
          shortId.indexOf('embedding') === -1 &&
          shortId.indexOf('aqa') === -1
        ) {
          dynamicModels.push({
            id: shortId,
            label: getModelDisplayLabel(shortId) !== shortId
              ? getModelDisplayLabel(shortId)
              : (m.displayName ? m.displayName + ' (' + shortId + ')' : shortId)
          });
        }
      }

      if (dynamicModels.length > 0) {
        dynamicModels.sort(function (a, b) {
          var priority = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
          var idxA = priority.indexOf(a.id);
          var idxB = priority.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.id.localeCompare(b.id);
        });

        GEMINI_AVAILABLE_MODELS = dynamicModels;
        var selEl = document.getElementById('gemini-model-select');
        if (selEl) {
          populateModelSelectOptions(selEl, GEMINI_AVAILABLE_MODELS, getStoredGeminiModel());
        }
      }
    }
  } catch (e) {
    // نادیده گرفتن خطا در استعلام لیست؛ مدل‌های پیش‌فرض فعال می‌مانند
  }
}

// ارسال درخواست مستقیم به Google Gemini API با قابلیت سوییچ خودکار روی مدل‌های جایگزین
async function fetchDirectGeminiWithFallback(apiKey, payload, preferredModel) {
  var primaryModel = (preferredModel || getStoredGeminiModel() || 'gemini-2.5-flash').replace(/^models\//, '');
  var fallbackQueue = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  for (var d = 0; d < GEMINI_AVAILABLE_MODELS.length; d++) {
    if (fallbackQueue.indexOf(GEMINI_AVAILABLE_MODELS[d].id) === -1) {
      fallbackQueue.push(GEMINI_AVAILABLE_MODELS[d].id);
    }
  }

  var uniqueModels = [];
  for (var i = 0; i < fallbackQueue.length; i++) {
    if (fallbackQueue[i] && uniqueModels.indexOf(fallbackQueue[i]) === -1) {
      uniqueModels.push(fallbackQueue[i]);
    }
  }

  var lastError = null;

  for (var m = 0; m < uniqueModels.length; m++) {
    var modelName = uniqueModels[m];
    try {
      var res = await callGeminiModelEndpoint(apiKey, modelName, payload);
      if (res.ok) {
        return {
          ok: true,
          data: res.data,
          usedModel: modelName,
        };
      } else {
        var friendlyMsg = translateGeminiErrorToPersian(res.errorMessage, res.status);
        lastError = new Error(friendlyMsg);

        // اگر خطا مربوط به آی‌پی ایران یا نامعتبر بودن کلید است، نیازی به تست سایر مدل‌ها نیست
        if (
          (res.status === 400 && /API_KEY_INVALID|key not valid/i.test(res.errorMessage)) ||
          (res.status === 403 && /location is not supported/i.test(res.errorMessage))
        ) {
          break;
        }
      }
    } catch (netErr) {
      lastError = new Error(translateGeminiErrorToPersian(netErr.message, 0));
      break;
    }
  }

  throw lastError || new Error('ارتباط با سرورهای Gemini برقرار نشد.');
}

// مدیریت کلید اختصاصی کاربر در حافظه محلی
function getStoredGeminiApiKey() {
  try {
    return (localStorage.getItem('nezam_gemini_api_key') || '').trim();
  } catch (e) {
    return '';
  }
}

function setStoredGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('nezam_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('nezam_gemini_api_key');
    }
  } catch (e) {}
}

window.toggleGeminiKeyVisibility = function () {
  var inp = document.getElementById('gemini-custom-api-key');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

window.saveCustomGeminiKey = async function () {
  var inp = document.getElementById('gemini-custom-api-key');
  if (!inp) return;
  var key = inp.value.trim();
  if (!key) {
    alert('لطفاً ابتدا کلید اختصاصی Gemini API خود را در کادر وارد نمایید.');
    return;
  }
  setStoredGeminiApiKey(key);
  if (typeof showToastMsg === 'function') {
    showToastMsg('⏳ در حال بررسی کلید و اتصال به Google Gemini...');
  }
  await testCustomGeminiKey();
};

window.clearCustomGeminiKey = function () {
  if (!confirm('آیا از حذف کلید ذخیره‌شده Gemini API اطمینان دارید؟')) return;
  setStoredGeminiApiKey('');
  var inp = document.getElementById('gemini-custom-api-key');
  if (inp) inp.value = '';
  var fb = document.getElementById('gemini-key-feedback');
  if (fb) fb.style.display = 'none';
  checkAiServerStatus();
  if (typeof showToastMsg === 'function') {
    showToastMsg('کلید Gemini پاک شد.');
  }
};

window.testCustomGeminiKey = async function () {
  ensureGeminiModelSelectorUI();
  var key = getStoredGeminiApiKey();
  var inp = document.getElementById('gemini-custom-api-key');
  if (inp && inp.value.trim()) {
    key = inp.value.trim();
  }
  var selectedModel = getStoredGeminiModel();
  var selEl = document.getElementById('gemini-model-select');
  if (selEl && selEl.value) {
    selectedModel = selEl.value;
    setStoredGeminiModel(selectedModel);
  }

  var fb = document.getElementById('gemini-key-feedback');
  var pill = document.getElementById('gemini-key-status-pill');

  if (!key) {
    if (fb) {
      fb.className = 'small mt-2 alert alert-warning py-1 px-2';
      fb.style.display = 'block';
      fb.innerHTML = '⚠️ هنوز کلیدی وارد نشده است. لطفاً کلید دریافتی از Google AI Studio را درج نمایید.';
    }
    return false;
  }

  if (fb) {
    fb.className = 'small mt-2 alert alert-info py-1 px-2';
    fb.style.display = 'block';
    fb.innerHTML = '⏳ در حال تست اتصال مستقیم به Google Gemini API (مدل <code>' + escapeHtml(selectedModel) + '</code>)...';
  }

  var directErrorMsg = '';

  // ۱. تست مستقیم تولید محتوا با کلید کاربر (سازگار با کلیدهای AQ. و AIza)
  try {
    var testResult = await fetchDirectGeminiWithFallback(
      key,
      {
        contents: [{ parts: [{ text: 'سلام' }] }],
        generationConfig: { maxOutputTokens: 5 },
      },
      selectedModel
    );

    if (testResult && testResult.ok) {
      setStoredGeminiApiKey(key);
      var activeModel = testResult.usedModel || selectedModel;
      setStoredGeminiModel(activeModel);
      if (selEl) selEl.value = activeModel;

      // همگام‌سازی لیست مدل‌ها در پس‌زمینه بدون ایجاد خطا
      syncAvailableModelsNonBlocking(key);

      if (fb) {
        fb.className = 'small mt-2 alert alert-success py-1 px-2 fw-bold';
        fb.style.display = 'block';
        fb.innerHTML =
          '✅ اتصال به Google Gemini API با موفقیت برقرار شد! (مدل فعال: <code>' +
          escapeHtml(activeModel) +
          '</code>).';
      }
      if (pill) {
        pill.className = 'badge bg-success p-2';
        pill.innerHTML = '🟢 متصل (' + escapeHtml(activeModel) + ')';
      }
      aiOnlineStatus.isOnline = true;
      aiOnlineStatus.userKeyActive = true;
      aiOnlineStatus.model = activeModel;
      updateAiBadgeStatus(true);
      return true;
    }
  } catch (directErr) {
    directErrorMsg = directErr.message || String(directErr);
    console.warn('Direct Google API test error:', directErr);
  }

  // ۲. اگر سایت روی سرور محلی (غیر از GitHub Pages) اجرا شده باشد، پروکسی داخلی را هم بررسی کن
  if (!isStaticHostEnvironment()) {
    try {
      var proxyResp = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': key,
          'x-gemini-model': selectedModel,
        },
        body: JSON.stringify({ apiKey: key, model: selectedModel }),
      });

      if (proxyResp.ok) {
        setStoredGeminiApiKey(key);
        if (fb) {
          fb.className = 'small mt-2 alert alert-success py-1 px-2 fw-bold';
          fb.style.display = 'block';
          fb.innerHTML = '✅ اتصال از طریق سرور سامانه با مدل <code>' + escapeHtml(selectedModel) + '</code> با موفقیت تأیید شد.';
        }
        if (pill) {
          pill.className = 'badge bg-success p-2';
          pill.innerHTML = '🟢 کلید اختصاصی متصل است';
        }
        aiOnlineStatus.isOnline = true;
        aiOnlineStatus.userKeyActive = true;
        aiOnlineStatus.model = selectedModel;
        updateAiBadgeStatus(true);
        return true;
      }
    } catch (proxyErr) {}
  }

  // نمایش دقیق علت خطا به کاربر
  if (fb) {
    fb.className = 'small mt-2 alert alert-danger py-2 px-3';
    fb.style.display = 'block';
    fb.innerHTML = '❌ <b>عدم برقراری ارتباط با Gemini API:</b><br>' + (directErrorMsg || 'ارتباط با سرور گوگل برقرار نشد.');
  }
  if (pill) {
    pill.className = 'badge bg-danger p-2';
    pill.innerHTML = '🔴 خطا در اتصال کلید';
  }
  aiOnlineStatus.isOnline = false;
  updateAiBadgeStatus(false);
  return false;
};

window.addEventListener('DOMContentLoaded', function () {
  ensureGeminiModelSelectorUI();
  checkAiServerStatus();
});

// بررسی مداوم برای اطمینان از وجود منوی انتخاب مدل در تب‌های پویا
setInterval(function () {
  if (!document.getElementById('gemini-model-select')) {
    ensureGeminiModelSelectorUI();
  }
}, 2000);

// بررسی خودکار در دسترس بودن سرور آنلاین و کلید جمینای
async function checkAiServerStatus() {
  ensureGeminiModelSelectorUI();
  var userKey = getStoredGeminiApiKey();
  var currentModel = getStoredGeminiModel();
  aiOnlineStatus.model = currentModel;

  var inp = document.getElementById('gemini-custom-api-key');
  if (inp && userKey && !inp.value) {
    inp.value = userKey;
  }

  var pill = document.getElementById('gemini-key-status-pill');

  // اگر کلید کاربر (چه AQ. و چه AIza) در حافظه موجود باشد
  if (userKey) {
    aiOnlineStatus.isOnline = true;
    aiOnlineStatus.userKeyActive = true;
    if (pill) {
      pill.className = 'badge bg-success p-2';
      pill.innerHTML = '🟢 کلید اختصاصی فعال است (' + escapeHtml(currentModel) + ')';
    }
    updateAiBadgeStatus(true);
    syncAvailableModelsNonBlocking(userKey);
    return;
  }

  if (isStaticHostEnvironment()) {
    aiOnlineStatus.isOnline = false;
    if (pill) {
      pill.className = 'badge bg-warning text-dark p-2';
      pill.innerHTML = '🟡 کلید تنظیم نشده';
    }
    updateAiBadgeStatus(false);
    return;
  }

  try {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 3000);

    var headers = { 'x-gemini-model': currentModel };
    if (userKey) headers['x-gemini-api-key'] = userKey;

    var res = await fetch('/api/ai/status', {
      signal: controller.signal,
      headers: headers,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      var data = await res.json();
      aiOnlineStatus.isOnline = Boolean(data.online && (data.hasApiKey || data.hasServerKey));
      aiOnlineStatus.model = getStoredGeminiModel() || data.model || 'gemini-2.5-flash';
      aiOnlineStatus.searchGrounding = Boolean(data.searchGrounding);
      aiOnlineStatus.checked = true;

      var selEl = document.getElementById('gemini-model-select');
      if (selEl) selEl.value = aiOnlineStatus.model;

      if (pill) {
        if (userKey) {
          pill.className = 'badge bg-success p-2';
          pill.innerHTML = '🟢 کلید اختصاصی متصل است (' + escapeHtml(aiOnlineStatus.model) + ')';
        } else if (data.hasServerKey) {
          pill.className = 'badge bg-primary p-2';
          pill.innerHTML = '🌐 متصل از طریق سرور مرکز (' + escapeHtml(aiOnlineStatus.model) + ')';
        } else {
          pill.className = 'badge bg-warning text-dark p-2';
          pill.innerHTML = '🟡 کلید تنظیم نشده (آماده درج)';
        }
      }
      updateAiBadgeStatus(aiOnlineStatus.isOnline);
    } else {
      aiOnlineStatus.isOnline = false;
      updateAiBadgeStatus(false);
    }
  } catch (e) {
    aiOnlineStatus.isOnline = false;
    updateAiBadgeStatus(false);
  }
}

function updateAiBadgeStatus(online) {
  var badge = document.getElementById('ai-connection-badge');
  var statusDesc = document.getElementById('ai-online-status-desc');
  var modeTag = document.getElementById('ai-chat-mode-tag');

  var hasCustomKey = Boolean(getStoredGeminiApiKey());
  var activeModel = aiOnlineStatus.model || getStoredGeminiModel();

  if (badge) {
    if (online) {
      badge.className = 'badge bg-success px-3 py-2 shadow-sm';
      badge.innerHTML = hasCustomKey
        ? '🟢 هوش مصنوعی آنلاین متصل (' + escapeHtml(activeModel) + ')'
        : '🌐 هوش مصنوعی آنلاین متصل (سرور مرکز ۶۳۶ - ' + escapeHtml(activeModel) + ')';
    } else {
      badge.className = 'badge bg-warning text-dark px-3 py-2 shadow-sm';
      badge.innerHTML = '🟡 موتور هوشمند آفلاین فعال (آماده بدون نیاز به اینترنت)';
    }
  }

  if (statusDesc) {
    if (online) {
      statusDesc.className = 'alert alert-success small mb-3 border-success';
      statusDesc.innerHTML =
        '✨ <b>هوش مصنوعی پیشرفته آنلاین متصل است:</b> مدل <code>' +
        escapeHtml(getModelDisplayLabel(activeModel)) +
        '</code> ' +
        (hasCustomKey ? 'با <b>کلید اختصاصی شما</b> ' : 'از طریق سرور مرکز ۶۳۶ ') +
        'فعال است. کلیه اسناد و سوالات آنلاین تحلیل می‌شوند.';
    } else {
      statusDesc.className = 'alert alert-info small mb-3';
      statusDesc.innerHTML =
        '💡 <b>موتور هوشمند محلی (آفلاین):</b> در صورت قطعی اینترنت یا عدم تنظیم کلید، استخراج مشخصات متقاضی، کدملی، متراژ، زون و مختصات UTM به صورت ۱۰۰٪ آفلاین انجام می‌گیرد. برای فعال‌سازی کامل آنلاین، کلید Gemini API خود را در کادر بالا وارد فرمایید.';
    }
  }

  if (modeTag) {
    modeTag.className = online ? 'badge bg-success' : 'badge bg-secondary';
    modeTag.innerText = online
      ? (hasCustomKey ? 'آنلاین (' + activeModel + ')' : 'آنلاین (سرور مرکز)')
      : 'پاسخگوی آفلاین';
  }
}

// پایگاه دانش قوانین محلی مرکز ۶۳۶ (پشتیبان آفلاین)
var AI_KNOWLEDGE_BASE = [
  {
    keywords: ['گلخانه', 'صیفی', 'سبزی', 'سازه', 'اسپانیایی'],
    answer:
      'احداث گلخانه سبزی و صیفی در شهرستان خفر:\n• حداقل زمین مورد نیاز: ۳۰۰۰ متر مربع (سازه مفید حداقل ۱۰۰۰ متر مربع)\n• استعلام‌های الزامی: امور آب (تأمین ۵۰۰۰ لیتر آب در شبانه‌روز در هکتار)، شرکت گاز یا نفت، جهاد کشاورزی و محیط زیست.',
  },
  {
    keywords: ['قارچ', 'کمپوست'],
    answer:
      'پرورش قارچ خوراکی دکمه‌ای:\n• حداقل ظرفیت مجاز صدور پروانه: ۵۰ تن در سال\n• نیاز آبی: ۵۰۰ لیتر در شبانه‌روز\n• مدارک مورد نیاز: سند مالکیت یا اجاره‌نامه رسمی، کروکی UTM عرصه، آزمایش آب و تأییدیه نظام مهندسی.',
  },
  {
    keywords: ['گوسفند', 'بره', 'پرواری', 'داشتی'],
    answer:
      'دامپروری گوسفند و بره در خفر:\n• حداقل ظرفیت پرواربندی: ۱۰۰ رأس | حداقل مساحت زمین: ۱۲۰۰ متر مربع\n• گوسفند داشتی: حداقل ۵۰ رأس | زمین مورد نیاز: ۱۰۰۰ متر مربع\n• فواصل قانونی: رعایت حداقل حریم ۵۰۰ متری از مرز روستا و مراکز مسکونی طبق دستورالعمل نظام دامپروری.',
  },
  {
    keywords: ['گاو', 'شیری', 'گوساله'],
    answer:
      'گاوداری شیری و پرواری:\n• حداقل ظرفیت گوساله پرواری: ۵۰ رأس\n• حداقل ظرفیت گاو شیری: ۲۰ رأس مولد\n• الزامات: رعایت حریم راه، تأمین آب شرب استاندارد، حریم زیست‌محیطی و اخذ استعلام دامپزشکی.',
  },
  {
    keywords: ['مرغ', 'مرغداری', 'طیور', 'گوشتی', 'تخمگذار'],
    answer:
      'مرغداری گوشتی و تخم‌گذار:\n• حداقل ظرفیت گوشتی: ۲۰,۰۰۰ قطعه در دوره\n• حداقل مساحت عرصه: ۵۰۰۰ متر مربع\n• فواصل بهداشتی: حداقل ۱۰۰۰ متر از مرغداری‌های هم‌نوع و ۲۰۰۰ متر از کانون‌های جمعیتی و مزارع مرغ مادر.',
  },
  {
    keywords: ['داروخانه', 'گیاهپزشکی', 'سموم', 'کلینیک'],
    answer:
      'تأسیس داروخانه و کلینیک گیاهپزشکی در خفر:\n• شرایط متقاضی: کارشناس یا کارشناس ارشد گیاهپزشکی عضو سازمان نظام مهندسی با رتبه معتبر\n• چک‌لیست: فرم ۱۸ بندی بازرسی، سند یا اجاره‌نامه با کاربری تجاری/خدماتی، تهویه استاندارد، کپسول آتش‌نشانی و انبار ایمن سموم.',
  },
  {
    keywords: ['کروکی', 'utm', 'جی پی اس', 'ابعاد', 'زون'],
    answer:
      'ضوابط کروکی UTM مرکز ۶۳۶ خفر:\n• زون غالب شهرستان خفر: Zone 39R در نیمکره شمالی (بیضوی WGS84)\n• حداقل نقاط برای چندضلعی زمین: ۳ نقطه با خطای زیر ۵ سانتی‌متر\n• شیت چاپی کروکی به صورت خودکار در ۲ برگ تفکیک می‌شود (برگه اول نقشه بزرگ و برگه دوم جداول مساحت و مختصات).',
  },
];

// موتور آفلاین استخراج اطلاعات با عبارات باقاعده
function localOfflineExtractFields(rawText) {
  var clean = typeof toEn === 'function' ? toEn(rawText) : rawText;
  var result = {
    name: '',
    nid: '',
    mobile: '',
    loc: 'فارس/ خفر/ مرکزی',
    land: '1000',
    count: 1000,
    mainGroup: 'GREENHOUSE_MUSHROOM',
    actType: 'greenhouse_veg',
    utm: '',
  };

  var nidMatch = clean.match(/(?:کد\s*ملی|ملی|شناسه)[:\s]*(\d{10,11})/) || clean.match(/\b(\d{10})\b/);
  if (nidMatch) result.nid = nidMatch[1];

  var phoneMatch = clean.match(/(09\d{9})/);
  if (phoneMatch) result.mobile = phoneMatch[1];

  var nameMatch = rawText.match(/(?:متقاضی|نام\s*و\s*نام\s*خانوادگی|نام|آقای|خانم|شرکت)[:\s]*([^\n،,\d]{3,35})/);
  if (nameMatch) result.name = nameMatch[1].trim();

  var landMatch = clean.match(/(?:مساحت|عرصه|متراژ|زمین)[:\s]*([0-9.,]+)/);
  if (landMatch) result.land = landMatch[1].replace(/,/g, '');

  if (/دام|گوسفند|بز|گاو|طیور|مرغ|شیلات|ماهی/.test(rawText)) {
    result.mainGroup = 'LIVESTOCK_POULTRY_FISHERIES';
    if (/گوسفند|بز/.test(rawText)) result.actType = 'sheep_high';
    else if (/گاو|گوساله/.test(rawText)) result.actType = 'cattle_dairy';
    else if (/مرغ|طیور/.test(rawText)) result.actType = 'broiler';
    else if (/ماهی|شیلات/.test(rawText)) result.actType = 'fish_cold';
  } else if (/کلینیک|داروخانه|گیاهپزشکی|سموم/.test(rawText)) {
    result.mainGroup = 'CLINIC_PHARMACY';
    result.actType = /داروخانه/.test(rawText) ? 'pharmacy_center' : 'clinic_center';
  } else {
    result.mainGroup = 'GREENHOUSE_MUSHROOM';
    if (/قارچ/.test(rawText)) result.actType = 'mushroom_button';
    else if (/گل|زینتی/.test(rawText)) result.actType = 'greenhouse_flower';
    else result.actType = 'greenhouse_veg';
  }

  // استخراج ردیف‌های مختصات UTM
  var utmLines = [];
  var coordRegex = /(?:[Xхx]\s*[:=]?\s*)?([1-9]\d{5})(?:[\s,،\t]+)(?:[Yуy]\s*[:=]?\s*)?([2-4]\d{6})/gi;
  var match;
  while ((match = coordRegex.exec(clean)) !== null) {
    utmLines.push(match[1] + ',' + match[2]);
  }
  if (utmLines.length > 0) {
    result.utm = utmLines.join('\n');
  }

  return result;
}

// خوانش فایل تصویری آپلود شده
function aiHandleImageSelect(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  aiPendingImageMime = file.type || 'image/jpeg';
  var reader = new FileReader();
  reader.onload = function (e) {
    aiPendingImageBase64 = e.target.result;
    var previewBox = document.getElementById('ai-ocr-preview-box');
    var previewImg = document.getElementById('ai-ocr-preview-img');
    if (previewBox && previewImg) {
      previewImg.src = aiPendingImageBase64;
      previewBox.style.display = 'block';
    }
    if (typeof showToastMsg === 'function') {
      showToastMsg('📸 تصویر بارگذاری شد. آماده تحلیل با هوش مصنوعی.');
    }
  };
  reader.readAsDataURL(file);
}

// خوانش و تحلیل هوشمند سند با Gemini (مستقیم + سرور + پشتیبان آفلاین)
async function aiReadDocumentImagePro() {
  if (!aiPendingImageBase64) {
    alert('ابتدا یک تصویر از سند، قولنامه یا نقشه UTM انتخاب نمایید.');
    return;
  }

  var rawTextEl = document.getElementById('ai-raw-text-input');
  var userKey = getStoredGeminiApiKey();
  var selectedModel = getStoredGeminiModel();
  var btn = typeof event !== 'undefined' && event ? event.target : null;
  var originalBtnText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ در حال خوانش با ' + selectedModel + '...';

  if (typeof showToastMsg === 'function') {
    showToastMsg('⏳ در حال خوانش تصویر سند و استخراج مختصات UTM با مدل ' + selectedModel + '...');
  }

  // ۱. فراخوانی مستقیم Google Gemini API در صورت وجود کلید کاربر (AQ. یا AIza)
  if (userKey) {
    try {
      var cleanBase64 =
        aiPendingImageBase64.indexOf(',') !== -1
          ? aiPendingImageBase64.split(',')[1]
          : aiPendingImageBase64;
      var prompt =
        'شما کارشناس نظام مهندسی کشاورزی خفر هستید. مشخصات این تصویر سند را به صورت JSON معتبر با کلیدهای زیر استخراج کن: applicantName, nationalId, phoneNumber, planTitle, mainGroup (یکی از GREENHOUSE_MUSHROOM یا LIVESTOCK_POULTRY_FISHERIES یا CLINIC_PHARMACY), actType, landArea, capacity, location, utmCoordinates (ردیف‌های X,Y), fullSummary';

      var directOcrResult = await fetchDirectGeminiWithFallback(
        userKey,
        {
          contents: [
            {
              parts: [
                { inlineData: { mimeType: aiPendingImageMime, data: cleanBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        },
        selectedModel
      );

      if (directOcrResult && directOcrResult.ok) {
        var dResult = directOcrResult.data;
        var rawJson = dResult.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        rawJson = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        var parsed = JSON.parse(rawJson);
        aiOnlineStatus.model = directOcrResult.usedModel || selectedModel;
        applyOcrDataToCase(parsed, rawTextEl);
        updateAiBadgeStatus(true);
        if (typeof showToastMsg === 'function') {
          showToastMsg('✅ مشخصات سند با مدل ' + aiOnlineStatus.model + ' استخراج شد.');
        }
        if (btn) btn.innerHTML = originalBtnText;
        return;
      }
    } catch (dirOcrErr) {
      console.warn('Direct Google OCR failed:', dirOcrErr);
    }
  }

  // ۲. ارسال به سرور محلی (در صورتی که روی GitHub Pages نباشد)
  if (!isStaticHostEnvironment()) {
    try {
      var headers = {
        'Content-Type': 'application/json',
        'x-gemini-model': selectedModel,
      };
      if (userKey) headers['x-gemini-api-key'] = userKey;

      var res = await fetch('/api/ai/ocr-extract', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          imageBase64: aiPendingImageBase64,
          mimeType: aiPendingImageMime,
          rawText: rawTextEl ? rawTextEl.value : '',
          apiKey: userKey,
          model: selectedModel,
        }),
      });

      if (res.ok) {
        var result = await res.json();
        if (result && result.success && result.data) {
          applyOcrDataToCase(result.data, rawTextEl);
          updateAiBadgeStatus(true);
          if (typeof showToastMsg === 'function') {
            showToastMsg('✅ مشخصات سند و نقاط UTM با موفقیت استخراج و بارگذاری شد.');
          }
          if (btn) btn.innerHTML = originalBtnText;
          return;
        }
      }
    } catch (srvErr) {
      console.warn('Server OCR endpoint failed:', srvErr);
    }
  }

  // ۳. پشتیبان آفلاین
  if (typeof showToastMsg === 'function') {
    showToastMsg('⚠️ ارتباط آنلاین برقرار نشد؛ استخراج آفلاین از متن انجام گردید.');
  }
  aiExtractFromRawText();
  if (btn) btn.innerHTML = originalBtnText;
}

// تابع کمکی درج مشخصات استخراج‌شده در پرونده
function applyOcrDataToCase(d, rawTextEl) {
  if (rawTextEl) {
    var summaryText =
      '=== استخراج هوشمند با Gemini (' + (aiOnlineStatus.model || getStoredGeminiModel()) + ') ===\n' +
      '👤 متقاضی: ' + (d.applicantName || '-') + '\n' +
      '🆔 کدملی: ' + (d.nationalId || '-') + '\n' +
      '📱 تلفن: ' + (d.phoneNumber || '-') + '\n' +
      '📋 موضوع طرح: ' + (d.planTitle || '-') + '\n' +
      '📐 مساحت: ' + (d.landArea || '-') + ' مترمربع\n' +
      '📍 موقعیت: ' + (d.location || '-') + '\n' +
      '🗺️ نقاط مختصات UTM:\n' + (d.utmCoordinates || '') + '\n' +
      (d.fullSummary ? '\n📝 نکات سند:\n' + d.fullSummary : '');
    rawTextEl.value = summaryText;
  }

  if (document.getElementById('c-name') && d.applicantName) {
    document.getElementById('c-name').value = d.applicantName;
  }
  if (document.getElementById('c-nid') && d.nationalId) {
    document.getElementById('c-nid').value = typeof toFa === 'function' ? toFa(d.nationalId) : d.nationalId;
  }
  if (document.getElementById('c-mobile') && d.phoneNumber) {
    document.getElementById('c-mobile').value = typeof toFa === 'function' ? toFa(d.phoneNumber) : d.phoneNumber;
  }
  if (document.getElementById('c-loc') && d.location) {
    document.getElementById('c-loc').value = d.location;
  }
  if (document.getElementById('c-land') && d.landArea) {
    document.getElementById('c-land').value = typeof toFa === 'function' ? toFa(d.landArea) : d.landArea;
  }
  if (document.getElementById('c-utm') && d.utmCoordinates) {
    document.getElementById('c-utm').value = typeof toFa === 'function' ? toFa(d.utmCoordinates) : d.utmCoordinates;
  }

  if (d.mainGroup && document.getElementById('c-main-group')) {
    document.getElementById('c-main-group').value = d.mainGroup;
    if (typeof onMainGroupChangedInForm === 'function') onMainGroupChangedInForm();
    if (document.getElementById('c-act-type') && d.actType) {
      document.getElementById('c-act-type').value = d.actType;
    }
    if (typeof recalcCaseSpecsFromHeadcount === 'function') recalcCaseSpecsFromHeadcount();
  }
}

// استخراج فیلدها و ثبت در فرم متقاضی
function aiExtractFromRawText() {
  var rawText = (document.getElementById('ai-raw-text-input') || {}).value || '';
  if (!rawText.trim()) {
    alert('لطفاً ابتدا متنی را در کادر بنویسید یا تصویری را انتخاب کنید.');
    return;
  }
  var data = localOfflineExtractFields(rawText);

  if (document.getElementById('c-name') && data.name) document.getElementById('c-name').value = data.name;
  if (document.getElementById('c-nid') && data.nid) document.getElementById('c-nid').value = typeof toFa === 'function' ? toFa(data.nid) : data.nid;
  if (document.getElementById('c-mobile') && data.mobile) document.getElementById('c-mobile').value = typeof toFa === 'function' ? toFa(data.mobile) : data.mobile;
  if (document.getElementById('c-loc') && data.loc) document.getElementById('c-loc').value = data.loc;
  if (document.getElementById('c-land') && data.land) document.getElementById('c-land').value = typeof toFa === 'function' ? toFa(data.land) : data.land;
  if (document.getElementById('c-utm') && data.utm) document.getElementById('c-utm').value = typeof toFa === 'function' ? toFa(data.utm) : data.utm;

  if (document.getElementById('c-main-group')) {
    document.getElementById('c-main-group').value = data.mainGroup;
    if (typeof onMainGroupChangedInForm === 'function') onMainGroupChangedInForm();
    if (document.getElementById('c-act-type') && data.actType) {
      document.getElementById('c-act-type').value = data.actType;
    }
    if (typeof recalcCaseSpecsFromHeadcount === 'function') recalcCaseSpecsFromHeadcount();
  }

  if (typeof switchMainPane === 'function') switchMainPane('pane-cases');
  if (typeof switchCaseSubTab === 'function') switchCaseSubTab('sub-info');
  if (typeof showToastMsg === 'function') showToastMsg('✅ اطلاعات استخراج و در فرم پرونده متقاضی بارگذاری شد.');
}

function aiRunFullAutopilotPipeline() {
  aiExtractFromRawText();
  setTimeout(function () {
    if (typeof saveActiveCaseChanges === 'function') {
      saveActiveCaseChanges(true);
    }
  }, 200);
}

// چت‌بات آنلاین با پشتیبانی از کلیدهای AQ. و AIza و تمامی مدل‌های Gemini
async function aiSendChatMessage() {
  var input = document.getElementById('ai-chat-input');
  var history = document.getElementById('ai-chat-history');
  if (!input || !history) return;
  var q = input.value.trim();
  if (!q) return;

  var userDiv = document.createElement('div');
  userDiv.className = 'p-2 mb-2 rounded bg-primary text-white text-end shadow-sm';
  userDiv.innerHTML = '<b>شما:</b> ' + escapeHtml(q);
  history.appendChild(userDiv);
  input.value = '';
  history.scrollTop = history.scrollHeight;

  var userKey = getStoredGeminiApiKey();
  var selectedModel = getStoredGeminiModel();

  var botLoadingDiv = document.createElement('div');
  botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-secondary small';
  botLoadingDiv.innerHTML = '🤖 <i>در حال ارتباط و دریافت پاسخ از مدل <code>' + escapeHtml(selectedModel) + '</code>...</i>';
  history.appendChild(botLoadingDiv);
  history.scrollTop = history.scrollHeight;

  // ۱. فراخوانی مستقیم Google Gemini API (سازگار با کلیدهای AQ. و AIza)
  if (userKey) {
    try {
      var directContents = [];
      if (Array.isArray(aiChatHistoryBuffer)) {
        for (var hi = 0; hi < aiChatHistoryBuffer.length; hi++) {
          var hItem = aiChatHistoryBuffer[hi];
          directContents.push({
            role: hItem.role === 'user' ? 'user' : 'model',
            parts: [{ text: hItem.text || '' }],
          });
        }
      }
      directContents.push({
        role: 'user',
        parts: [{ text: q }],
      });

      var directChatResult = await fetchDirectGeminiWithFallback(
        userKey,
        {
          contents: directContents,
          systemInstruction: {
            parts: [
              {
                text: 'شما مشاور و کارشناس رسمی نظام مهندسی کشاورزی ۶۳۶ شهرستان خفر استان فارس هستید. پاسخ‌های دقیق، مستند به آخرین ضوابط جهاد کشاورزی و نظام مهندسی، محترمانه و به زبان فارسی ارائه دهید.',
              },
            ],
          },
        },
        selectedModel
      );

      if (directChatResult && directChatResult.ok) {
        var directData = directChatResult.data;
        var activeChatModel = directChatResult.usedModel || selectedModel;
        var candidate = directData.candidates && directData.candidates[0];
        var candidateText =
          candidate &&
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts[0] &&
          candidate.content.parts[0].text;

        if (candidateText) {
          aiOnlineStatus.model = activeChatModel;
          aiChatHistoryBuffer.push({ role: 'user', text: q });
          aiChatHistoryBuffer.push({ role: 'model', text: candidateText });
          var directFmtText = formatMarkdownToHtml(candidateText);

          botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
          botLoadingDiv.innerHTML =
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<b class="text-success">🤖 کارشناس هوشمند مرکز ۶۳۶ (' + escapeHtml(activeChatModel) + '):</b>' +
            '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:10px;">🟢 کلید اختصاصی</span>' +
            '</div>' +
            directFmtText;

          history.scrollTop = history.scrollHeight;
          updateAiBadgeStatus(true);
          return;
        }
      }
    } catch (dirErr) {
      console.warn('Direct Google Gemini API chat failed:', dirErr);
    }
  }

  // ۲. فراخوانی از طریق سرور محلی (در صورتی که روی GitHub Pages نباشد)
  if (!isStaticHostEnvironment()) {
    try {
      var headers = {
        'Content-Type': 'application/json',
        'x-gemini-model': selectedModel,
      };
      if (userKey) headers['x-gemini-api-key'] = userKey;

      var res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: q,
          history: aiChatHistoryBuffer,
          apiKey: userKey,
          model: selectedModel,
        }),
      });

      if (res.ok) {
        var data = await res.json();
        if (data && data.text) {
          aiChatHistoryBuffer.push({ role: 'user', text: q });
          aiChatHistoryBuffer.push({ role: 'model', text: data.text });

          var formattedText = formatMarkdownToHtml(data.text);
          var modelUsed = data.model || selectedModel;

          var sourcesHtml = '';
          if (data.groundingChunks && data.groundingChunks.length > 0) {
            var links = [];
            for (var i = 0; i < data.groundingChunks.length; i++) {
              var chunk = data.groundingChunks[i];
              if (chunk && chunk.web && chunk.web.uri) {
                var title = chunk.web.title || chunk.web.uri;
                links.push(
                  '<a href="' +
                    escapeHtml(chunk.web.uri) +
                    '" target="_blank" rel="noopener noreferrer" class="badge bg-light text-primary text-truncate border me-1 my-1 d-inline-block" style="max-width:240px;" title="' +
                    escapeHtml(title) +
                    '">🔗 ' +
                    escapeHtml(title) +
                    '</a>'
                );
              }
            }
            if (links.length > 0) {
              sourcesHtml =
                '<div class="mt-2 pt-2 border-top small text-muted">' +
                '<div class="fw-bold mb-1">🔍 منابع مستند و جستجوی برخط ضوابط:</div>' +
                links.join(' ') +
                '</div>';
            }
          }

          botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
          botLoadingDiv.innerHTML =
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<b class="text-success">🤖 کارشناس هوشمند مرکز ۶۳۶ (' + escapeHtml(modelUsed) + '):</b>' +
            '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:10px;">🌐 متصل به وب</span>' +
            '</div>' +
            formattedText +
            sourcesHtml;

          history.scrollTop = history.scrollHeight;
          updateAiBadgeStatus(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Server chat endpoint failed:', err);
    }
  }

  // ۳. پاسخ از پایگاه دانش محلی آفلاین در صورت عدم اتصال آنلاین
  var respText = '';
  var qLower = q.toLowerCase();
  for (var kIdx = 0; kIdx < AI_KNOWLEDGE_BASE.length; kIdx++) {
    var item = AI_KNOWLEDGE_BASE[kIdx];
    for (var k = 0; k < item.keywords.length; k++) {
      if (qLower.indexOf(item.keywords[k]) !== -1) {
        respText = item.answer;
        break;
      }
    }
    if (respText) break;
  }

  if (!respText) {
    respText =
      'در مرکز خدمات کشاورزی ۶۳۶ خفر، پرونده‌ها در ۳ گروه اصلی (۱. گلخانه و قارچ، ۲. دام و طیور و شیلات، ۳. کلینیک و داروخانه گیاهپزشکی) رسیدگی می‌شوند. برای پاسخ دقیق، کلیدواژه طرح خود (مثل گوسفند، گلخانه، قارچ یا داروخانه) را قید بفرمایید یا اتصال اینترنت و کلید Gemini را بررسی کنید.';
  }

  botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
  botLoadingDiv.innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-1">' +
    '<b class="text-secondary">🤖 مشاور فنی مرکز ۶۳۶ (موتور آفلاین):</b>' +
    '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle" style="font-size:10px;">🟡 حالت آفلاین</span>' +
    '</div>' +
    respText.replace(/\n/g, '');

  history.scrollTop = history.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdownToHtml(md) {
  if (!md) return '';
  var html = escapeHtml(md);
  html = html.replace(/^### (.*$)/gim, '<h6 class="fw-bold text-success mt-2 mb-1">$1</h6>');
  html = html.replace(/^## (.*$)/gim, '<h5 class="fw-bold text-primary mt-2 mb-1">$1</h6>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
  html = html.replace(/^\s*[-*•]\s+(.*$)/gim, '<li class="me-3">$1</li>');
  html = html.replace(/\n/g, '');
  return html;
}
