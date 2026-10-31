// Windows Script Host Guard: Prevents error if user double-clicks the .js file directly in Windows Explorer
if (typeof WScript !== 'undefined') {
  try {
    var sh = new ActiveXObject('WScript.Shell');
    sh.Run('index.html');
  } catch (e) {}
  WScript.Quit();
}

/* ==========================================================================
   NEZAM AI ASSISTANT MODULE v24.0 (MULTI-MODEL GEMINI ONLINE + 100% OFFLINE)
   سامانه هوشمند و دستیار فنی مرکز خدمات کشاورزی ۶۳۶ خفر:
   ۱. هوش مصنوعی آنلاین با قابلیت انتخاب تمامی نسخه‌های Gemini و جستجوی برخط (Grounding)
   ۲. خوانش تصویر اسناد، قولنامه‌ها و نقشه‌های UTM (OCR آنلاین و تحلیل حقوقی)
   ۳. استخراج خودکار فیلدهای پرونده و مختصات از متن خام (آفلاین و آنلاین)
   ۴. خلبان خودکار تشکیل پرونده و انتقال مستقیم به نامه استعلام و کروکی
   ۵. سوئیچ هوشمند و خودکار بین مدل‌های جمینای، سرور آنلاین و موتور آفلاین محلی
   ========================================================================== */

// فهرست کامل مدل‌های قابل انتخاب Gemini
var GEMINI_AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (پیشنهادی - سریع و دقیق)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (تحلیل پیشرفته اسناد و قوانین)' },
  { id: 'gemini-2.5-flash-lite-preview-06-17', label: 'Gemini 2.5 Flash Lite (فوق سریع و کم‌مصرف)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (پایدار و چندرسانه‌ای)' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (سبک)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (نسل ۱.۵ حرفه‌ای)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (نسل ۱.۵ سریع)' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (نسخه سفارشی سامانه)' }
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

// مدیریت مدل انتخابی کاربر در حافظه محلی
function getStoredGeminiModel() {
  try {
    var saved = (localStorage.getItem('nezam_gemini_model') || '').trim();
    return saved || 'gemini-2.5-flash';
  } catch (e) {
    return 'gemini-2.5-flash';
  }
}

function setStoredGeminiModel(modelId) {
  try {
    if (modelId && modelId.trim()) {
      var cleanModel = modelId.trim();
      localStorage.setItem('nezam_gemini_model', cleanModel);
      aiOnlineStatus.model = cleanModel;
    }
  } catch (e) {}
}

function getModelDisplayLabel(modelId) {
  for (var i = 0; i < GEMINI_AVAILABLE_MODELS.length; i++) {
    if (GEMINI_AVAILABLE_MODELS[i].id === modelId) {
      return GEMINI_AVAILABLE_MODELS[i].label;
    }
  }
  return modelId;
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

// ایجاد یا همگام‌سازی خودکار منوی انتخاب مدل در رابط کاربری (بدون نیاز به دستکاری HTML)
function ensureGeminiModelSelectorUI() {
  var existingSelect = document.getElementById('gemini-model-select');
  var currentModel = getStoredGeminiModel();

  if (existingSelect) {
    if (existingSelect.options.length === 0) {
      for (var i = 0; i < GEMINI_AVAILABLE_MODELS.length; i++) {
        var opt = document.createElement('option');
        opt.value = GEMINI_AVAILABLE_MODELS[i].id;
        opt.textContent = GEMINI_AVAILABLE_MODELS[i].label;
        existingSelect.appendChild(opt);
      }
    }
    existingSelect.value = currentModel;
    if (!existingSelect.onchange) {
      existingSelect.onchange = function () {
        window.changeGeminiModel(this.value);
      };
    }
    return;
  }

  // اگر در HTML وجود نداشت، در کنار کادر کلید API یا توضیحات وضعیت تزریق می‌شود
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
    select.style.maxWidth = '340px';

    for (var j = 0; j < GEMINI_AVAILABLE_MODELS.length; j++) {
      var option = document.createElement('option');
      option.value = GEMINI_AVAILABLE_MODELS[j].id;
      option.textContent = GEMINI_AVAILABLE_MODELS[j].label;
      if (GEMINI_AVAILABLE_MODELS[j].id === currentModel) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.onchange = function () {
      window.changeGeminiModel(this.value);
    };

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    targetContainer.parentElement.insertBefore(wrapper, targetContainer.nextSibling);
  }
}

// ارسال درخواست مستقیم به Google Gemini API با قابلیت سوییچ خودکار روی مدل‌های جایگزین در صورت خطا
async function fetchDirectGeminiWithFallback(apiKey, payload, preferredModel) {
  var primaryModel = preferredModel || getStoredGeminiModel() || 'gemini-2.5-flash';
  var fallbackQueue = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  // حذف مدل‌های تکراری در صف امتحان
  var uniqueModels = [];
  for (var i = 0; i < fallbackQueue.length; i++) {
    if (uniqueModels.indexOf(fallbackQueue[i]) === -1) {
      uniqueModels.push(fallbackQueue[i]);
    }
  }

  var lastError = null;

  for (var m = 0; m < uniqueModels.length; m++) {
    var modelName = uniqueModels[m];
    var directUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(modelName) +
      ':generateContent?key=' +
      encodeURIComponent(apiKey);

    try {
      var resp = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        var data = await resp.json();
        return {
          ok: true,
          data: data,
          usedModel: modelName,
        };
      } else {
        var errData = await resp.json().catch(function () {
          return {};
        });
        var errMsg =
          errData && errData.error && errData.error.message
            ? errData.error.message
            : 'کد خطا ' + resp.status;
        lastError = new Error(errMsg);

        // اگر کلید API نامعتبر است (400/403 مربوط به API_KEY_INVALID)، نیازی به تست سایر مدل‌ها نیست
        if (resp.status === 400 && /API_KEY_INVALID|key not valid/i.test(errMsg)) {
          break;
        }
      }
    } catch (netErr) {
      lastError = netErr;
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
    showToastMsg('⏳ در حال بررسی و اتصال به Google Gemini API...');
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

  // ۱. تست مستقیم اتصال به Google Gemini API (با پشتیبانی از Fallback خودکار مدل‌ها)
  try {
    var testResult = await fetchDirectGeminiWithFallback(
      key,
      {
        contents: [{ parts: [{ text: 'پینگ سلامت' }] }],
        generationConfig: { maxOutputTokens: 10 },
      },
      selectedModel
    );

    if (testResult && testResult.ok) {
      setStoredGeminiApiKey(key);
      var activeModel = testResult.usedModel || selectedModel;
      setStoredGeminiModel(activeModel);
      if (selEl) selEl.value = activeModel;

      var switchedNotice =
        activeModel !== selectedModel
          ? ' <span class="text-muted">(مدل انتخابی در دسترس نبود؛ به صورت هوشمند روی <code>' +
            escapeHtml(activeModel) +
            '</code> تنظیم شد)</span>'
          : '';

      if (fb) {
        fb.className = 'small mt-2 alert alert-success py-1 px-2 fw-bold';
        fb.style.display = 'block';
        fb.innerHTML =
          '✅ اتصال به Gemini API با مدل <code>' +
          escapeHtml(activeModel) +
          '</code> برقرار شد! هوش مصنوعی آنلاین و خوانش اسناد فعال گردید.' +
          switchedNotice;
      }
      if (pill) {
        pill.className = 'badge bg-success p-2';
        pill.innerHTML = '🟢 کلید اختصاصی متصل است (' + escapeHtml(activeModel) + ')';
      }
      aiOnlineStatus.isOnline = true;
      aiOnlineStatus.userKeyActive = true;
      aiOnlineStatus.model = activeModel;
      updateAiBadgeStatus(true);
      return true;
    }
  } catch (directErr) {
    console.warn('Direct Google API test failed, testing proxy server...', directErr);
  }

  // ۲. تست از طریق سرور محلی (پروکسی Express)
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
    } else {
      var pData = await proxyResp.json().catch(function () { return {}; });
      throw new Error(pData.error || 'خطا در ارتباط با سرور');
    }
  } catch (e) {
    if (fb) {
      fb.className = 'small mt-2 alert alert-danger py-1 px-2 fw-bold';
      fb.style.display = 'block';
      fb.innerHTML = '❌ خطا در اتصال به Gemini API: ' + (e.message || 'ارتباط با سرور برقرار نشد.') + '<br>لطفاً اتصال اینترنت، نسخه مدل یا صحت کلید را بررسی فرمایید.';
    }
    if (pill) {
      pill.className = 'badge bg-danger p-2';
      pill.innerHTML = '🔴 خطا در اتصال کلید';
    }
    return false;
  }
};

window.addEventListener('DOMContentLoaded', function () {
  ensureGeminiModelSelectorUI();
  checkAiServerStatus();
});

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

  // اگر کلید اختصاصی در حافظه موجود باشد
  if (userKey) {
    aiOnlineStatus.isOnline = true;
    aiOnlineStatus.userKeyActive = true;
    if (pill) {
      pill.className = 'badge bg-success p-2';
      pill.innerHTML = '🟢 کلید اختصاصی فعال است (' + escapeHtml(currentModel) + ')';
    }
    updateAiBadgeStatus(true);
    return;
  }

  // اگر کاربر برنامه را با file:// اجرا کرده باشد و کلیدی تنظیم نکرده باشد
  if (window.location.protocol === 'file:') {
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
      aiOnlineStatus.model = localStorage.getItem('nezam_gemini_model') || data.model || 'gemini-2.5-flash';
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
      if (pill) {
        pill.className = 'badge bg-warning text-dark p-2';
        pill.innerHTML = '🟡 کلید تنظیم نشده';
      }
      updateAiBadgeStatus(false);
    }
  } catch (e) {
    aiOnlineStatus.isOnline = false;
    if (pill) {
      pill.className = 'badge bg-warning text-dark p-2';
      pill.innerHTML = '🟡 کلید تنظیم نشده';
    }
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
        escapeHtml( getModelDisplayLabel(activeModel) ) +
        '</code> ' +
        (hasCustomKey ? 'با <b>کلید اختصاصی شما</b> ' : 'از طریق سرور مرکز ۶۳۶ ') +
        'به همراه جستجوی زنده ضوابط وزارت جهاد کشاورزی و نظام مهندسی فعال است. کلیه اسناد و سوالات آنلاین تحلیل می‌شوند.';
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

// خوانش و تحلیل هوشمند سند با Gemini (آنلاین با کلید و مدل انتخابی + پشتیبان آفلاین)
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

  // ۱. ارسال به سرور با کلید و مدل انتخابی کاربر
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
    console.warn('Server OCR endpoint failed, trying direct Google API...', srvErr);
  }

  // ۲. فراخوانی مستقیم Google Gemini API با پشتیبانی از همه مدل‌ها و Fallback خودکار
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
        // پاک‌سازی احتمالی بلاک‌های markdown
        rawJson = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        var parsed = JSON.parse(rawJson);
        aiOnlineStatus.model = directOcrResult.usedModel || selectedModel;
        applyOcrDataToCase(parsed, rawTextEl);
        updateAiBadgeStatus(true);
        if (typeof showToastMsg === 'function') {
          showToastMsg('✅ مشخصات با اتصال مستقیم به ' + aiOnlineStatus.model + ' استخراج شد.');
        }
        if (btn) btn.innerHTML = originalBtnText;
        return;
      }
    } catch (dirOcrErr) {
      console.warn('Direct Google OCR failed:', dirOcrErr);
    }
  }

  // ۳. در صورت عدم موفقیت آنلاین، موتور پشتیبان آفلاین فعال می‌شود
  if (typeof showToastMsg === 'function') {
    showToastMsg('⚠️ سرور آنلاین در دسترس نبود؛ موتور آفلاین فعال گردید.');
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

  // انتقال اطلاعات استخراج‌شده به فرم پرونده متقاضی
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

// چت‌بات آنلاین با پشتیبانی از انتخاب مدل، Google Search Grounding و پشتیبان آفلاین
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

  // پیام در حال پردازش ربات
  var botLoadingDiv = document.createElement('div');
  botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-secondary small';
  botLoadingDiv.innerHTML = '🤖 <i>در حال ارتباط و جستجوی پاسخ با مدل هوشمند <code>' + escapeHtml(selectedModel) + '</code>...</i>';
  history.appendChild(botLoadingDiv);
  history.scrollTop = history.scrollHeight;

  // ۱. فراخوانی از طریق سرور محلی با کلید و مدل انتخابی کاربر
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

        // درج منابع جستجوی گوگل (Search Grounding Sources)
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
    console.warn('Server chat endpoint failed, attempting direct Gemini API call...', err);
  }

  // ۲. فراخوانی مستقیم Google Gemini API در صورت قطعی سرور یا حالت مستقل file://
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
      console.warn('Direct Google Gemini API call failed:', dirErr);
    }
  }

  // ۳. اگر آنلاین نبود، پاسخ از پایگاه دانش محلی آفلاین تولید می‌شود
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
      'در مرکز خدمات کشاورزی ۶۳۶ خفر، پرونده‌ها در ۳ گروه اصلی (۱. گلخانه و قارچ، ۲. دام و طیور و شیلات، ۳. کلینیک و داروخانه گیاهپزشکی) رسیدگی می‌شوند. برای پاسخ دقیق، کلیدواژه طرح خود (مثل گوسفند، گلخانه، قارچ یا داروخانه) را قید بفرمایید یا اتصال سرور آنلاین را برقرار کنید.';
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
  // تیترها
  html = html.replace(/^### (.*$)/gim, '<h6 class="fw-bold text-success mt-2 mb-1">$1</h6>');
  html = html.replace(/^## (.*$)/gim, '<h5 class="fw-bold text-primary mt-2 mb-1">$1</h5>');
  // پررنگ
  html = html.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
  // لیست‌ها
  html = html.replace(/^\s*[-*•]\s+(.*$)/gim, '<li class="me-3">$1</li>');
  // خطوط جدید
  html = html.replace(/\n/g, '');
  return html;
}
