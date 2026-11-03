/* محافظ هوشمند ویندوز: جلوگیری از خطای 800A03EA در صورت دبل‌کلیک مستقیم روی فایل JS */
if (typeof WScript !== "undefined") {
  try {
    var sh = new ActiveXObject("WScript.Shell");
    sh.Run("index.html");
  } catch (e) {}
  WScript.Quit();
}

/* =========================================================================
   موتور چاپ سربرگ رسمی مرکز ۶۳۶ خفر، ابزار تخصصی کروکی چندلایه UTM،
   تبدیل WGS84، نقشه ماهواره‌ای/آفلاین، خروجی KML گوگل‌ارث و فرم‌های نظارتی
   فایل: nezam-customizer.js (نسخه آفلاین ویندوز - بدون قابلیت چاپ ۶ نامه)
   ========================================================================= */

var NEZAM_LOGO_SVG =
  '<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="60" cy="60" r="54" fill="rgba(46,125,50,0.12)" stroke="#2e7d32" stroke-width="4" stroke-dasharray="5,3"/>' +
  '<path d="M60 18 C38 40, 38 74, 60 96 C82 74, 82 40, 60 18 Z" fill="rgba(229,209,88,0.25)" stroke="#1b5e20" stroke-width="3.5"/>' +
  '<line x1="60" y1="26" x2="60" y2="96" stroke="#1b5e20" stroke-width="3"/>' +
  '<path d="M36 94 Q60 108 84 94" fill="none" stroke="#c59b27" stroke-width="4.5"/>' +
  '</svg>';

var PRINT_HEADER_LOGO_SVG =
  '<svg viewBox="0 0 120 120" width="66" height="66" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="60" cy="60" r="54" fill="rgba(243,224,107,0.15)" stroke="#f3e06b" stroke-width="3.5" stroke-dasharray="5,3"/>' +
  '<path d="M60 20 C40 40, 40 72, 60 94 C80 72, 80 40, 60 20 Z" fill="none" stroke="#f3e06b" stroke-width="3"/>' +
  '<line x1="60" y1="28" x2="60" y2="96" stroke="#f3e06b" stroke-width="2.5"/>' +
  '<path d="M38 92 Q60 105 82 92" fill="none" stroke="#f3e06b" stroke-width="4"/>' +
  '</svg>';

var DEFAULT_BRANDING = {
  orgSubtitle: "سازمان نظام مهندسی کشاورزی و منابع طبیعی استان فارس",
  officeName: "مرکز خدمات کشاورزی غیر دولتی، شماره ۶۳۶",
  managerTitle: "مدیر مرکز خدمات کشاورزی و منابع طبیعی غیردولتی شهرستان خفر",
  managerName: "حسام‌الدین خواجه‌پور تادوانی",
  address: "شهرستان خفر - بخش مرکزی - باب انار - روبه روی پمپ - جنب انبار تعاونی",
  postalCode: "۷۴۴۱۷۳۸۱",
  phone: "۰۹۰۱۳۵۸۸۵۵۲",
  email: "khajehpourhesam@gmail.com",
  headerColor: "#7d967c",
  customLogoData: "",
  customStampData: ""
};

var DEFAULT_TEMPLATES = {
  WATER: {
    btnTitle: "💧 ۱. استعلام آب منطقه‌ای",
    rec: "مدیریت محترم آب منطقه ای شهرستان خفر",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} ، در زمینی به مساحت {مساحت} متر مربع ، از اراضی {موقعیت} با موقعیت جغرافیایی زیر را دارند . خواهشمند است در خصوص امکان تامین آب از مبادی مجاز به وسیله حمل با تانکر به میزان {آب} لیتر در شبانه روز و همچنین حریم کمی و کیفی واحد فوق ، اظهارنظر فرمایید و مراتب را کتبا به این مرکز اعلام نمایید."
  },
  ELECTRIC: {
    btnTitle: "⚡ ۲. استعلام برق منطقه‌ای",
    rec: "مدیریت محترم برق منطقه ای شهرستان خفر",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} ، در زمینی به مساحت {مساحت} متر مربع ، از اراضی {موقعیت} با موقعیت جغرافیایی زیر را دارند. خواهشمند است در خصوص حریم کمی و کیفی واحد فوق اظهارنظر فرمایید و مراتب را کتبا اعلام نمایید."
  },
  ROAD: {
    btnTitle: "🛣️ ۳. استعلام حریم راهداری",
    rec: "مدیریت محترم راهداری و حمل و نقل جاده‌ای شهرستان خفر",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} ، در زمینی به مساحت {مساحت} متر مربع ، از اراضی {موقعیت} با موقعیت جغرافیایی زیر را دارند. خواهشمند است در خصوص حریم کمی و کیفی واحد فوق اظهارنظر فرمایید و مراتب را کتبا اعلام نمایید."
  },
  GAS: {
    btnTitle: "🔥 ۴. استعلام منطقه ۵ گاز استان",
    rec: "ریاست محترم منطقه ۵ عملیات انتقال گاز استان",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} در زمینی به مساحت {مساحت} مترمربع از اراضی {موقعیت} با موقعیت جغرافیایی زیر را دارند. خواهشمند است در خصوص حرایم خطوط انتقال گاز واحد فوق اظهارنظر فرمایید و مراتب را کتبا اعلام نمایید."
  },
  ENV: {
    btnTitle: "🌿 ۵. استعلام محیط زیست",
    rec: "ریاست محترم سازمان حفاظت محیط زیست شهرستان خفر",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} ، در زمینی به مساحت {مساحت} متر مربع ، از اراضی {موقعیت} با موقعیت جغرافیایی زیر را دارند، خواهشمند است در خصوص شرایط زیست محیطی محل اجرای طرح اظهار نظر فرمایید."
  },
  NATRES: {
    btnTitle: "🌲 ۶. استعلام منابع طبیعی (ملی/مستثنیات)",
    rec: "مدیریت محترم منابع طبیعی شهرستان خفر",
    body: "احتراماً در مورد ملی یا مستثنیات بودن زمین واقع در {موقعیت} ، با مختصات جغرافیایی که در ذیل همین نامه ارایه گردیده است، اظهارنظر فرمایید."
  },
  VET: {
    btnTitle: "🩺 ۷. استعلام شبکه دامپزشکی",
    rec: "ریاست محترم شبکه دامپزشکی شهرستان خفر",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} در زمینی به مساحت {مساحت} متر مربع واقع در اراضی {موقعیت} با مختصات زیر را دارند، خواهشمند است در خصوص رعایت فواصل و ضوابط بهداشتی قرنطینه‌ای اظهارنظر فرمایید."
  },
  LAND_AFFAIRS: {
    btnTitle: "🏛️ ۸. استعلام مدیریت جهاد / امور اراضی",
    rec: "مدیریت محترم جهاد کشاورزی شهرستان خفر - امور اراضی",
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} متقاضی اجرای طرح «{طرح}» با ظرفیت {ظرفیت} در زمینی به مساحت {مساحت} متر مربع واقع در {موقعیت} با مختصات ذیل می‌باشند، خواهشمند است در خصوص ضوابط تبصره ۱ و ۴ ماده ۱ قانون حفظ کاربری اراضی زراعی و باغ‌ها بررسی و اعلام نظر فرمایید."
  }
};

var brandCfg = JSON.parse(JSON.stringify(DEFAULT_BRANDING));
window.brandCfg = brandCfg;
var tplCfg = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
var currentTemplateKey = "WATER";
var currentPaperSize = "A4"; // A4 | A5
var currentPreviewLetterId = null;
var currentPreviewDraft = null;
var currentPreviewMode = "EDITOR"; // EDITOR | LETTER_DRAFT | LETTER | CROQUIS | FORM
var letterDraftCaseId = "";
var letterDraftDirty = false;
var paperPreviewDirty = false;
var printRequestActive = false;

try {
  var sb = localStorage.getItem("nezam636_branding_cfg");
  if (sb) { var pb = JSON.parse(sb); for (var k in pb) brandCfg[k] = pb[k]; }
  var st = localStorage.getItem("nezam636_templates_cfg");
  if (st) {
    var pt = JSON.parse(st);
    for (var tk in pt) tplCfg[tk] = pt[tk];
  }
  var savedPaper = localStorage.getItem("nezam636_paper_size");
  if (savedPaper === "A4" || savedPaper === "A5") currentPaperSize = savedPaper;
} catch (e) {}

/* لایه امنیتی محتوای HTML نامه‌ها و ورودی‌های سفارشی */
function safeHtmlText(value) {
  return typeof window.escapeHtmlCore === "function"
    ? window.escapeHtmlCore(value)
    : String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
      });
}
function safeHexColor(value, fallback) {
  var color = String(value || "");
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color) ? color : (fallback || "#1b4332");
}
function sanitizeOfficeRichHtml(input) {
  var parsed = new DOMParser().parseFromString(String(input || ""), "text/html");
  var allowed = new Set(["A","B","STRONG","I","EM","U","S","P","BR","DIV","SPAN","UL","OL","LI","TABLE","THEAD","TBODY","TFOOT","TR","TD","TH","BLOCKQUOTE","H1","H2","H3","H4","H5","H6","HR","SMALL","SUB","SUP","FONT"]);
  var blocked = new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","FORM","INPUT","BUTTON","VIDEO","AUDIO","LINK","META","BASE","IMG"]);
  var safeStyleProps = [
    "font-size","font-weight","font-style","font-family","color","background-color",
    "text-align","text-decoration","text-decoration-line","line-height","direction",
    "width","max-width","min-width","height","margin","margin-top","margin-right",
    "margin-bottom","margin-left","padding","padding-top","padding-right",
    "padding-bottom","padding-left","border","border-top","border-right",
    "border-bottom","border-left","border-collapse","border-spacing","border-radius",
    "vertical-align","white-space","table-layout","letter-spacing","text-indent"
  ];
  function safeCssValue(prop, raw) {
    var v = String(raw || "").trim();
    if (!v || /[{};<>]|url\s*\(|expression\s*\(|javascript:/i.test(v)) return "";
    if (prop === "font-weight") return /^(normal|bold|[1-9]00)$/i.test(v) ? v : "";
    if (prop === "font-style") return /^(normal|italic|oblique)$/i.test(v) ? v : "";
    if (prop === "text-align") return /^(left|right|center|justify|start|end)$/i.test(v) ? v : "";
    if (prop === "direction") return /^(ltr|rtl)$/i.test(v) ? v : "";
    if (prop === "border-collapse") return /^(collapse|separate)$/i.test(v) ? v : "";
    if (prop === "table-layout") return /^(auto|fixed)$/i.test(v) ? v : "";
    if (prop === "white-space") return /^(normal|pre|pre-line|pre-wrap|nowrap)$/i.test(v) ? v : "";
    if (prop === "vertical-align") return /^(baseline|top|middle|bottom|sub|super)$/i.test(v) ? v : "";
    if (prop === "font-family") return /^[a-z0-9 ,"'_-]{1,80}$/i.test(v) ? v : "";
    if (prop === "color" || prop === "background-color") {
      return /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.%\s,]+\)|[a-z]{3,20}|transparent)$/i.test(v) ? v : "";
    }
    if (prop === "font-size") {
      var fs = v.match(/^(\d{1,2}(?:\.\d+)?)(pt|px|mm|em|rem|%)$/i);
      return fs && Number(fs[1]) > 0 && Number(fs[1]) <= 36 ? v : "";
    }
    if (prop === "line-height") return /^(normal|[0-4](?:\.\d+)?(?:%|px|pt)?)$/i.test(v) ? v : "";
    if (prop === "border" || (prop.indexOf("border-") === 0 && prop !== "border-collapse" && prop !== "border-spacing" && prop !== "border-radius")) {
      return /^(none|0|(?:0?\.\d+|\d+(?:\.\d+)?)(?:px|pt|mm)\s+(solid|dashed|dotted|double)\s+(#[0-9a-f]{3,8}|black|white|gray|grey|red|blue|green))$/i.test(v) ? v : "";
    }
    if (prop === "border-radius") return /^(?:0|(?:\d+(?:\.\d+)?)(?:px|pt|mm|%))$/i.test(v) ? v : "";
    if (prop === "border-spacing") return /^(?:0|(?:\d+(?:\.\d+)?)(?:px|pt|mm))(?:\s+(?:\d+(?:\.\d+)?)(?:px|pt|mm))?$/i.test(v) ? v : "";
    if (prop === "margin" || prop.indexOf("margin-") === 0 || prop === "padding" || prop.indexOf("padding-") === 0) {
      return /^(?:0|auto|(?:\d+(?:\.\d+)?)(?:px|pt|mm|%))(?:\s+(?:0|auto|(?:\d+(?:\.\d+)?)(?:px|pt|mm|%))){0,3}$/i.test(v) ? v : "";
    }
    if (prop === "width" || prop === "max-width" || prop === "min-width" || prop === "height") {
      return /^(?:auto|100%|(?:\d+(?:\.\d+)?)(?:px|pt|mm|cm|%))$/i.test(v) ? v : "";
    }
    if (prop === "letter-spacing" || prop === "text-indent") return /^(?:0|(?:-?\d+(?:\.\d+)?)(?:px|pt|mm|em))$/i.test(v) ? v : "";
    if (prop === "text-decoration" || prop === "text-decoration-line") {
      return /^(none|underline|line-through|overline)(\s+(underline|line-through|overline))*$/i.test(v) ? v : "";
    }
    return "";
  }
  function copyNode(node, parent) {
    if (node.nodeType === 3) {
      parent.appendChild(document.createTextNode(node.nodeValue || ""));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toUpperCase();
    if (blocked.has(tag)) return;
    if (!allowed.has(tag)) {
      Array.prototype.forEach.call(node.childNodes, function (child) { copyNode(child, parent); });
      return;
    }
    var clean = document.createElement(tag.toLowerCase());
    if (tag === "TD" || tag === "TH") {
      ["colspan","rowspan"].forEach(function (attr) {
        var n = parseInt(node.getAttribute(attr), 10);
        if (Number.isFinite(n) && n >= 1 && n <= 20) clean.setAttribute(attr, String(n));
      });
      var align = String(node.getAttribute("align") || "").toLowerCase();
      if (["left","right","center"].indexOf(align) !== -1) clean.setAttribute("align", align);
    }
    if (tag === "TABLE") {
      var tableClasses = String(node.getAttribute("class") || "").split(/\s+/).filter(function (cls) {
        return ["utm-table-print","table","table-bordered","my-2"].indexOf(cls) !== -1;
      });
      if (tableClasses.length) clean.setAttribute("class", tableClasses.join(" "));
    }
    if (tag === "FONT") {
      var fontColor = node.getAttribute("color") || "";
      var fontSize = node.getAttribute("size") || "";
      var fontFace = node.getAttribute("face") || "";
      if (/^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(fontColor)) clean.setAttribute("color", fontColor);
      if (/^[1-7]$/.test(fontSize)) clean.setAttribute("size", fontSize);
      if (/^[a-z0-9 ,"'_-]{1,80}$/i.test(fontFace)) clean.setAttribute("face", fontFace);
    }
    if (tag === "A") {
      var href = node.getAttribute("href") || "";
      if (/^(https?:|mailto:)/i.test(href)) {
        clean.setAttribute("href", href);
        clean.setAttribute("rel", "noopener noreferrer");
        clean.setAttribute("target", "_blank");
      }
    }
    if (node.style) {
      var cleanStyles = [];
      safeStyleProps.forEach(function (prop) {
        var value = safeCssValue(prop, node.style.getPropertyValue(prop));
        if (value) cleanStyles.push(prop + ":" + value);
      });
      if (cleanStyles.length) clean.setAttribute("style", cleanStyles.join(";"));
    }
    Array.prototype.forEach.call(node.childNodes, function (child) { copyNode(child, clean); });
    parent.appendChild(clean);
  }
  var root = document.createElement("div");
  Array.prototype.forEach.call(parsed.body.childNodes, function (node) { copyNode(node, root); });
  return root.innerHTML;
}

function applyDynamicPrintPageSizeCSS(size) {
  var s = size === "A5" ? "A5" : "A4";
  var width = s === "A5" ? "148mm" : "210mm";
  var height = s === "A5" ? "210mm" : "297mm";
  var styleEl = document.getElementById("dynamic-print-page-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-print-page-style";
    document.head.appendChild(styleEl);
  }

  // یک منبع واحد برای اندازه فیزیکی صفحه و ابعاد خود برگه در خروجی چاپ.
  // این قوانین بعد از CSS اصلی تزریق می‌شوند تا A4/A5 با هم تداخل نکنند.
  styleEl.textContent = [
    "@page { size: " + width + " " + height + "; margin: 0; }",
    "@media print {",
    "html, body { width: " + width + " !important; min-width: 0 !important; max-width: " + width + " !important; margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }",
    "main { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }",
    "#pane-print, .a4-stage-bg, #a4-preview-stage { display: block !important; position: static !important; width: " + width + " !important; min-width: " + width + " !important; max-width: " + width + " !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: transparent !important; box-shadow: none !important; }",
    "#a4-preview-stage .a4-page { box-sizing: border-box !important; width: " + width + " !important; min-width: " + width + " !important; max-width: " + width + " !important; height: " + height + " !important; min-height: " + height + " !important; max-height: " + height + " !important; margin: 0 !important; transform: none !important; animation: none !important; transition: none !important; overflow: hidden !important; page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: always !important; break-after: page !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }",
    "#a4-preview-stage .a4-page[data-page-kind='binder-label'] { padding: 15mm !important; }",
    "#a4-preview-stage .a4-page:last-child { page-break-after: auto !important; break-after: auto !important; }",
    "}"
  ].join("\n");

  var pages = document.querySelectorAll("#a4-preview-stage .a4-page");
  for (var i = 0; i < pages.length; i++) {
    pages[i].setAttribute("data-paper-size", s);
    pages[i].classList.toggle("paper-a5", s === "A5");
  }
}

function hasUnsavedLetterChanges() {
  return !!(letterDraftDirty || paperPreviewDirty);
}

function confirmDiscardLetterChanges(actionLabel) {
  if (!hasUnsavedLetterChanges()) return true;
  return confirm("تغییرات نامه یا پیش‌نمایش چاپ هنوز ذخیره نشده است. " +
    (actionLabel || "با ادامه، تغییرات ذخیره‌نشده کنار گذاشته می‌شوند.") +
    "\n\nآیا ادامه می‌دهید؟");
}

function clearUnsavedLetterStateAfterConfirmation() {
  editingLetterId = null;
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  letterDraftDirty = false;
  paperPreviewDirty = false;
  var alertEl = document.getElementById("letter-edit-alert");
  if (alertEl) alertEl.style.display = "none";
}

window.addEventListener("beforeunload", function (event) {
  if (!hasUnsavedLetterChanges()) return;
  event.preventDefault();
  event.returnValue = "";
});

function bindLetterPreviewDirtyTracking(stage) {
  if (!stage || stage.dataset.letterPreviewDirtyBound === "1") return;
  stage.dataset.letterPreviewDirtyBound = "1";
  stage.addEventListener("input", function (event) {
    if (currentPreviewMode !== "LETTER" && currentPreviewMode !== "LETTER_DRAFT") return;
    var target = event.target;
    if (!target || !target.closest || !target.closest('[contenteditable="true"]')) return;
    // ویرایش داخل پیش‌نمایش فقط وضعیت خود برگه را تغییر می‌دهد؛ فرم اصلی از قبل در Draft snapshot شده است.
    paperPreviewDirty = true;
  });
}

function findSecretariatLetter(letterId) {
  if (!letterId || !Array.isArray(lettersDB)) return null;
  for (var i = 0; i < lettersDB.length; i++) {
    if (lettersDB[i] && String(lettersDB[i].id) === String(letterId)) return lettersDB[i];
  }
  return null;
}

function persistLetterAndCaseData() {
  var letterKey = "nezam636_letters";
  var caseKey = "nezam636_unified_cases";
  var oldLetters = null, oldCases = null;
  try {
    oldLetters = localStorage.getItem(letterKey);
    oldCases = localStorage.getItem(caseKey);
    localStorage.setItem(letterKey, JSON.stringify(lettersDB || []));
    localStorage.setItem(caseKey, JSON.stringify(casesDB || []));
  } catch (storageError) {
    console.error("Nezam636 letter transaction failed:", storageError);
    try {
      if (oldLetters === null) localStorage.removeItem(letterKey);
      else localStorage.setItem(letterKey, oldLetters);
      if (oldCases === null) localStorage.removeItem(caseKey);
      else localStorage.setItem(caseKey, oldCases);
    } catch (rollbackError) {
      console.error("Nezam636 letter transaction rollback failed:", rollbackError);
    }
    return false;
  }
  try {
    if (typeof refreshAllViews === "function") refreshAllViews();
    else {
      if (typeof renderSecretariatTable === "function") renderSecretariatTable();
      if (typeof renderActiveCaseHistory === "function") renderActiveCaseHistory();
    }
  } catch (viewError) {
    console.warn("Letter saved; a related view could not refresh:", viewError);
  }
  return true;
}

function getNextSecretariatNumber() {
  var dateDigits = toEn(String(todayShamsi() || "")).replace(/\D/g, "");
  var prefix = dateDigits.length >= 8 ? dateDigits.slice(0, 8) : "14050101";
  var maxSequence = 0;
  (Array.isArray(lettersDB) ? lettersDB : []).forEach(function (letter) {
    var number = toEn(String((letter || {}).number || "")).replace(/\D/g, "");
    if (number.indexOf(prefix) === 0 && number.length > prefix.length) {
      var seq = parseInt(number.slice(prefix.length), 10);
      if (Number.isFinite(seq) && seq > maxSequence) maxSequence = seq;
    }
  });
  return toFa(prefix + String(maxSequence + 1).padStart(2, "0"));
}

function isSecretariatNumberAvailable(number, ignoreId) {
  var normalized = toEn(String(number || "")).replace(/[\s\-_/]/g, "");
  if (!normalized) return false;
  return !(Array.isArray(lettersDB) ? lettersDB : []).some(function (letter) {
    if (!letter || (ignoreId && String(letter.id) === String(ignoreId))) return false;
    return toEn(String(letter.number || "")).replace(/[\s\-_/]/g, "") === normalized;
  });
}

function getLetterDraftFromEditor() {
  var officeMode = window.__nezamOfficeLetterDraftMode === true;
  var c = officeMode ? null : getActiveCase();
  if (!c && !officeMode) return null;
  if (!officeMode && letterDraftCaseId && String(letterDraftCaseId) !== String(c.id) && !editingLetterId) {
    showToastMsg("پیش‌نویس متعلق به پرونده دیگری است؛ ابتدا یکی از قالب‌های نامه را برای پرونده فعال انتخاب کنید.", true);
    return null;
  }
  var recipientEl = document.getElementById("l-recipient");
  var editor = document.getElementById("l-body-rich");
  var bodyField = document.getElementById("l-body");
  var numberEl = document.getElementById("l-number");
  var dateEl = document.getElementById("l-date");
  var attachEl = document.getElementById("l-attach");
  var directionEl = document.getElementById("l-direction");
  var includeEl = document.getElementById("l-include-utm");
  if (!recipientEl || (!editor && !bodyField)) {
    showToastMsg("فرم نامه کامل بارگذاری نشده است.", true);
    return null;
  }
  var number = toFa(String(numberEl && numberEl.value || "").trim());
  if (!number) number = getNextSecretariatNumber();
  var date = toFa(String(dateEl && dateEl.value || "").trim() || todayShamsi());
  var body = sanitizeOfficeRichHtml(editor ? editor.innerHTML : String(bodyField.value || "").replace(/\n/g, "<br>"));
  var plainBody = editor ? (editor.innerText || editor.textContent || "").trim() : String(bodyField.value || "").trim();
  if (!plainBody) {
    showToastMsg("متن نامه خالی است؛ ابتدا متن نامه را تکمیل کنید.", true);
    if (editor) editor.focus();
    return null;
  }
  var rec = String(recipientEl.value || "").trim();
  if (!rec) {
    showToastMsg("عنوان گیرنده نامه را وارد کنید.", true);
    recipientEl.focus();
    return null;
  }
  var map = null;
  if (!officeMode) {
    try { if (typeof getActiveCroquisMap === "function") map = getActiveCroquisMap(); } catch (mapError) {
      console.warn("Could not resolve current UTM map:", mapError);
    }
  }
  var requestedUtm = !officeMode && !!(includeEl && includeEl.checked);
  var isNat = rec.indexOf("منابع طبیعی") !== -1;
  var freshUtmSnapshot = requestedUtm ? buildAllSelectedFeaturesUtmTableHTML(c, c.utm || "", isNat) : "";
  var existingLetter = editingLetterId ? findSecretariatLetter(editingLetterId) : null;
  var preservedUtmSnapshot = !officeMode && existingLetter && typeof existingLetter.utmAttachmentHtml === "string"
    ? existingLetter.utmAttachmentHtml : "";
  var hasFreshUtmSnapshot = !!(freshUtmSnapshot && freshUtmSnapshot.trim());
  var coordinateHtml = hasFreshUtmSnapshot ? freshUtmSnapshot : (requestedUtm ? preservedUtmSnapshot : "");
  var hasUtm = !!(coordinateHtml && coordinateHtml.trim());
  var includeUtm = requestedUtm && hasUtm;
  var snapshotMapId = hasFreshUtmSnapshot && map && map.id
    ? map.id
    : (existingLetter && existingLetter.croquisMapId ? existingLetter.croquisMapId : (map && map.id ? map.id : activeCroquisMapId));
  return {
    id: editingLetterId || null,
    caseId: officeMode ? "" : c.id,
    officeLetter: officeMode,
    number: number,
    date: date,
    type: officeMode ? "OUT" : (directionEl && directionEl.value === "IN" ? "IN" : "OUT"),
    attach: getLetterAttachmentLabel(String(attachEl && attachEl.value || "ندارد"), hasUtm),
    recipient: rec,
    appName: officeMode ? "" : (c.name || ""),
    appNid: officeMode ? "" : (c.nid || ""),
    project: officeMode ? "" : (c.project || ""),
    cap: officeMode ? "" : (c.cap || ""),
    land: officeMode ? "" : (c.land || ""),
    landParcel: officeMode ? "" : (c.landParcel || ""),
    water: officeMode ? "" : (c.water || ""),
    loc: officeMode ? "" : (c.loc || ""),
    utm: officeMode ? "" : (c.utm || ""),
    croquisMapId: officeMode ? "" : (snapshotMapId || ""),
    utmAttachmentHtml: officeMode ? "" : (includeUtm ? coordinateHtml : preservedUtmSnapshot),
    body: body,
    paperSize: currentPaperSize === "A5" ? "A5" : "A4",
    includeUtm: includeUtm
  };
}


function renderLetterPreviewObject(letter, forcedPaperSize, mode) {
  var stage = document.getElementById("a4-preview-stage");
  if (!stage || !letter) return false;
  var pSize = forcedPaperSize === "A5" ? "A5" : (forcedPaperSize === "A4" ? "A4" : (letter.paperSize || currentPaperSize || "A4"));
  var isDraft = mode === "LETTER_DRAFT";
  currentPreviewMode = isDraft ? "LETTER_DRAFT" : "LETTER";
  currentPreviewLetterId = isDraft ? null : letter.id;
  currentPreviewDraft = isDraft ? letter : null;
  paperPreviewDirty = false;
  bindLetterPreviewDirtyTracking(stage);
  if (letter.officeLetter !== true && letter.croquisMapId) activeCroquisMapId = letter.croquisMapId;
  window.setPaperSize(pSize, true);
  var isNat = (letter.recipient || "").indexOf("منابع طبیعی") !== -1;
  var includeUtm = letter.officeLetter !== true && letter.includeUtm === true;
  var linkedCase = letter.officeLetter === true ? null :
    ((Array.isArray(window.casesDB) ? window.casesDB : []).find(function (item) {
      return item && String(item.id) === String(letter.caseId);
    }) || getActiveCase());
  var coordinateHtml = letter.officeLetter === true ? "" :
    ((typeof letter.utmAttachmentHtml === "string" && letter.utmAttachmentHtml.trim())
      ? letter.utmAttachmentHtml
      : (includeUtm && linkedCase ? buildAllSelectedFeaturesUtmTableHTML(linkedCase, letter.utm || linkedCase.utm || "", isNat) : ""));
  var hasUtm = includeUtm && !!(coordinateHtml && coordinateHtml.trim());
  var attachmentLabel = getLetterAttachmentLabel(letter.attach, hasUtm);

  stage.innerHTML = buildSingleA4HTML(letter.recipient, sanitizeOfficeRichHtml(letter.body), letter.number, letter.date, attachmentLabel, letter.utm, isNat, true, pSize, false, "");
  if (hasUtm) {
    var sheets = splitUtmAttachmentTableHtml(coordinateHtml, pSize);
    var intro = "جدول مختصات UTM مربوط به زمین و عوارض پرونده «" +
      safeHtmlText(letter.appName || (linkedCase && linkedCase.name) || "") +
      "»، پیوست نامه شماره " + safeHtmlText(toFa(letter.number || "")) + " است.";
    for (var si = 0; si < sheets.length; si++) {
      var title = "پیوست مختصات - صفحه " + toFa(si + 1) + " از " + toFa(sheets.length);
      stage.innerHTML += buildSingleA4HTML("پیوست: جدول مختصات UTM", intro, letter.number, letter.date,
        "جدول مختصات UTM", letter.utm, isNat, true, pSize, true, title, sheets[si]);
    }
  }
  var letterPages = stage.querySelectorAll(".a4-page");
  for (var letterPageIndex = 0; letterPageIndex < letterPages.length; letterPageIndex++) {
    letterPages[letterPageIndex].setAttribute("data-page-kind", letterPageIndex === 0 ? "letter" : "letter-appendix");
    letterPages[letterPageIndex].setAttribute("data-paper-size", pSize);
  }
  updatePrintUtmBtnState(hasUtm);
  updatePaperActionButtons();
  setTimeout(function () { autoFitPaperContent(stage); }, 70);
  return true;
}

function updatePaperActionButtons() {
  var supported = currentPreviewMode === "LETTER" || currentPreviewMode === "LETTER_DRAFT";
  var saveBtn = document.getElementById("btn-save-print-edits");
  var utmBtn = document.getElementById("btn-toggle-print-utm");
  if (saveBtn) {
    saveBtn.disabled = !supported;
    saveBtn.title = supported ? "ثبت پیش‌نویس جدید یا ذخیره تغییرات نامه و پیوست در دفتر اندیکاتور" : "این دکمه فقط برای نامه‌ها فعال است؛ فرم و کروکی را با خروجی چاپ یا فایل ذخیره کنید.";
  }
  if (utmBtn) {
    utmBtn.disabled = !supported;
    utmBtn.title = supported ? "فعال یا غیرفعال کردن برگه پیوست مختصات UTM" : "این گزینه فقط برای پیش‌نمایش نامه فعال است.";
  }
}

window.setPaperSize = function(size, skipSave) {
  var requestedSize = size === "A5" ? "A5" : "A4";
  if (!skipSave && requestedSize !== currentPaperSize) {
    if (paperPreviewDirty) {
      showToastMsg("ابتدا تغییرات روی خود برگه را ذخیره کنید؛ سپس اندازه کاغذ را عوض کنید.", true);
      var printSelectNow = document.getElementById("print-paper-size-select");
      if (printSelectNow) printSelectNow.value = currentPaperSize;
      return false;
    }
    if (letterDraftDirty && (currentPreviewMode === "LETTER" || currentPreviewMode === "LETTER_DRAFT")) {
      showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید.", true);
      var printSelectDraft = document.getElementById("print-paper-size-select");
      if (printSelectDraft) printSelectDraft.value = currentPaperSize;
      return false;
    }
  }
  var previous = currentPaperSize;
  currentPaperSize = requestedSize;
  try { localStorage.setItem("nezam636_paper_size", currentPaperSize); } catch (e) {}
  applyDynamicPrintPageSizeCSS(currentPaperSize);

  var printSelect = document.getElementById("print-paper-size-select");
  if (printSelect && printSelect.value !== currentPaperSize) printSelect.value = currentPaperSize;

  var badge = document.getElementById("active-paper-size-badge");
  if (badge) badge.textContent = currentPaperSize === "A5"
    ? "📄 قالب فعال: کاغذ A5 (۱۴۸×۲۱۰ میلی‌متر)"
    : "📄 قالب فعال: کاغذ A4 (۲۱۰×۲۹۷ میلی‌متر)";

  var pages = document.querySelectorAll("#a4-preview-stage .a4-page");
  for (var i = 0; i < pages.length; i++) {
    var wasA5 = pages[i].classList.contains("paper-a5");
    if (previous !== currentPaperSize && wasA5 !== (currentPaperSize === "A5")) {
      var userFont = parseFloat(pages[i].getAttribute("data-user-font-pt"));
      if (Number.isFinite(userFont)) {
        userFont = currentPaperSize === "A5" ? userFont * (8.8 / 10.5) : userFont * (10.5 / 8.8);
        pages[i].setAttribute("data-user-font-pt", Math.max(6.8, Math.min(16, userFont)).toFixed(2));
      }
    }
    pages[i].setAttribute("data-paper-size", currentPaperSize);
    pages[i].classList.toggle("paper-a5", currentPaperSize === "A5");
  }

  if (!skipSave) {
    if (previous !== currentPaperSize) {
      if (currentPreviewMode === "CROQUIS") {
        printUtmSketchSheet();
      } else if (currentPreviewMode === "FORM" && window.currentActiveFormKey) {
        printOfficialForm(window.currentActiveFormKey);
      } else {
        // تغییر اندازه کاغذ فقط پیش‌نمایش را تغییر می‌دهد؛ ثبت در دبیرخانه نیازمند فرمان جداگانه است.
        if (currentPreviewMode === "LETTER" && currentPreviewLetterId) {
          var archivedLetter = findSecretariatLetter(currentPreviewLetterId);
          if (archivedLetter) {
            var paperDraft = JSON.parse(JSON.stringify(archivedLetter));
            paperDraft.paperSize = currentPaperSize;
            renderLetterPreviewObject(paperDraft, currentPaperSize, "LETTER_DRAFT");
            paperPreviewDirty = true;
          }
        } else if (currentPreviewMode === "LETTER_DRAFT" && currentPreviewDraft) {
          currentPreviewDraft.paperSize = currentPaperSize;
          paperPreviewDirty = true;
        }
        setTimeout(function () {
          var fit = autoFitPaperContent();
          if (fit.pendingCount && typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(function () { autoFitPaperContent(); });
          }
        }, 60);
      }
    } else {
      setTimeout(function () { autoFitPaperContent(); }, 60);
    }
  }
  updatePaperActionButtons();
};

function waitForPrintAssets(root, timeoutMs) {
  var doc = root && (root.nodeType === 9 ? root : root.ownerDocument);
  var urls = [];
  var seen = Object.create(null);
  function addUrl(value) {
    var url = String(value || "").trim();
    if (!url || url.charAt(0) === "#" || seen[url]) return;
    seen[url] = true;
    urls.push(url);
  }
  if (root && typeof root.querySelectorAll === "function") {
    var images = root.querySelectorAll("img[src]");
    for (var i = 0; i < images.length; i++) addUrl(images[i].getAttribute("src"));
    var svgImages = root.querySelectorAll("svg image");
    for (var j = 0; j < svgImages.length; j++) {
      var svgImage = svgImages[j];
      var href = svgImage.getAttribute("href") ||
        svgImage.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
        svgImage.getAttribute("xlink:href");
      addUrl(href);
    }
  }

  var limit = Math.max(3000, Number(timeoutMs) || 12000);
  var checks = urls.map(function(url) {
    return new Promise(function(resolve) {
      var settled = false;
      var probe = new Image();
      var timer = setTimeout(function() { finish(false, "timeout"); }, limit);
      function finish(ok, reason) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        probe.onload = null;
        probe.onerror = null;
        resolve({ url: url, ok: !!ok, reason: reason || "" });
      }
      probe.onload = function() { finish(true); };
      probe.onerror = function() { finish(false, "load-error"); };
      probe.src = url;
      if (probe.complete) finish(probe.naturalWidth > 0, probe.naturalWidth > 0 ? "" : "cached-error");
    });
  });

  var fontPromise = Promise.resolve();
  if (doc && doc.fonts && doc.fonts.ready) {
    fontPromise = Promise.race([
      Promise.resolve(doc.fonts.ready).catch(function() {}),
      new Promise(function(resolve) { setTimeout(resolve, 4000); })
    ]);
  }
  return Promise.all([Promise.all(checks), fontPromise]).then(function(result) {
    var imageResults = result[0] || [];
    return {
      total: imageResults.length,
      failed: imageResults.filter(function(item) { return !item.ok; }),
      ready: imageResults.every(function(item) { return item.ok; })
    };
  });
}

function buildIsolatedPrintDocument(stage, paperSize, title) {
  var css = buildPaperExportCss(paperSize, false) +
    "\n@media print{.no-print,[data-no-print='true']{display:none!important;}html,body{overflow:visible!important;} .a4-page{break-inside:avoid!important;page-break-inside:avoid!important;} .a4-page:last-child{break-after:auto!important;page-break-after:auto!important;}}";
  var baseHref = String(document.baseURI || location.href).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<base href="' + baseHref + '">' +
    '<title>' + safeHtmlText(title) + '</title><style>' + css + '</style></head><body>' +
    stage.innerHTML + '</body></html>';
}

window.doPrintPaperSheet = function() {
  if (printRequestActive) return false;
  if (currentPreviewMode === "EDITOR") {
    showToastMsg("ابتدا از دبیرخانه پیش‌نمایش نامه را آماده کنید.", true);
    return false;
  }
  if ((currentPreviewMode === "LETTER" || currentPreviewMode === "LETTER_DRAFT") && letterDraftDirty) {
    showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید.", true);
    return false;
  }

  var stage = document.getElementById("a4-preview-stage");
  if (!stage || !stage.querySelector(".a4-page")) {
    showToastMsg("هیچ برگه‌ای برای چاپ آماده نیست؛ ابتدا نامه، فرم یا کروکی را پیش‌نمایش بگیرید.", true);
    return false;
  }

  var paperSize = currentPaperSize === "A5" ? "A5" : "A4";
  var previewMode = currentPreviewMode;
  var pages = stage.querySelectorAll(".a4-page");
  for (var i = 0; i < pages.length; i++) {
    pages[i].setAttribute("data-paper-size", paperSize);
    pages[i].classList.toggle("paper-a5", paperSize === "A5");
  }

  switchMainPane("pane-print");
  applyDynamicPrintPageSizeCSS(paperSize);
  var fitResult = autoFitPaperContent(stage);
  if (fitResult.pendingCount) {
    showToastMsg("اندازه‌گیری صفحه کامل نشده است؛ یک لحظه صبر کنید و دوباره چاپ را بزنید.", true);
    return false;
  }
  if (fitResult.overflowCount && !window.confirm(
    "هشدار: بخشی از محتوا در یک یا چند صفحه از محدوده کاغذ بیرون زده است و ممکن است بریده شود. " +
    "ابتدا می‌توانید «تنظیم خودکار تک‌برگی» یا کوتاه‌کردن متن را انجام دهید. با وجود این هشدار چاپ ادامه یابد؟"
  )) return false;
  if (fitResult.overflowCount) showToastMsg("چاپ با تأیید شما و احتمال سرریز محتوا ادامه می‌یابد.", true);

  // پنجره در همان رویداد کلیک باز می‌شود تا مسدودکننده Popup مانع نشود.
  var printWindow = null;
  try { printWindow = window.open("", "_blank"); } catch (openError) {
    console.warn("Could not open isolated print window:", openError);
  }

  printRequestActive = true;
  if (window.__nezam636PrintFailsafe) clearTimeout(window.__nezam636PrintFailsafe);
  window.__nezam636PrintFailsafe = setTimeout(function() {
    printRequestActive = false;
    window.__nezam636PrintFailsafe = null;
  }, 60000);

  function releasePrintLock() {
    printRequestActive = false;
    if (window.__nezam636PrintFailsafe) {
      clearTimeout(window.__nezam636PrintFailsafe);
      window.__nezam636PrintFailsafe = null;
    }
  }
  function askToContinueWithMissingAssets(result) {
    var count = result && result.failed ? result.failed.length : 0;
    if (!count) return true;
    var accepted = window.confirm(
      toFa(count) + " تصویر یا کاشی نقشه بارگذاری نشده است. ممکن است لوگو یا بخشی از نقشه در خروجی دیده نشود. " +
      "چاپ را با همین وضعیت ادامه می‌دهید؟"
    );
    if (accepted) showToastMsg("چاپ با هشدار بارگذاری ناقص تصاویر ادامه می‌یابد.", true);
    return accepted;
  }
  function abortPrint(message, closeWindow) {
    if (closeWindow && printWindow && !printWindow.closed) {
      try { printWindow.close(); } catch (closeError) {}
    }
    releasePrintLock();
    if (message) showToastMsg(message, true);
  }
  function printInPopup() {
    if (!printWindow || printWindow.closed) {
      abortPrint("پنجره چاپ بسته شد؛ دوباره فرمان چاپ را اجرا کنید.", false);
      return;
    }
    printWindow.addEventListener("afterprint", function() {
      releasePrintLock();
      setTimeout(function() {
        try { if (!printWindow.closed) printWindow.close(); } catch (closeError) {}
      }, 250);
    }, { once: true });
    setTimeout(function() {
      try {
        if (!printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        } else abortPrint("پنجره چاپ بسته شد؛ دوباره فرمان چاپ را اجرا کنید.", false);
      } catch (printError) {
        console.error("Isolated print failed:", printError);
        abortPrint("باز کردن پنجره چاپ ناموفق بود: " + (printError.message || printError), true);
      }
    }, 180);
  }

  var title = "چاپ " + (previewMode === "CROQUIS" ? "کروکی UTM" : "برگه رسمی") +
    " - مرکز خدمات ۶۳۶ خفر";
  if (printWindow && !printWindow.closed) {
    // پنجره مستقل فقط یک بار بررسی تصویرها و فونت‌ها را انجام می‌دهد.
    try {
      printWindow.document.open();
      printWindow.document.write(buildIsolatedPrintDocument(stage, paperSize, title));
      printWindow.document.close();
      waitForPrintAssets(printWindow.document, 12000).then(function(result) {
        if (!askToContinueWithMissingAssets(result)) {
          abortPrint("چاپ به درخواست شما لغو شد.", true);
          return;
        }
        printInPopup();
      }).catch(function(error) {
        console.error("Print-window asset check failed:", error);
        if (!askToContinueWithMissingAssets({ failed: [{ url: "print-window" }] })) {
          abortPrint("آماده‌سازی چاپ لغو شد.", true);
          return;
        }
        printInPopup();
      });
    } catch (documentError) {
      console.error("Could not build isolated print document:", documentError);
      abortPrint("ساخت پنجره چاپ ناموفق بود: " + (documentError.message || documentError), true);
    }
    return true;
  }

  // اگر مرورگر Popup را بست، دارایی‌های برگه اصلی بررسی و از همان صفحه چاپ می‌شود.
  showToastMsg("پنجره مستقل چاپ باز نشد؛ چاپ در همین صفحه آماده می‌شود.");
  waitForPrintAssets(stage, 12000).then(function(result) {
    if (!askToContinueWithMissingAssets(result)) {
      abortPrint("چاپ به درخواست شما لغو شد.", false);
      return;
    }
    applyDynamicPrintPageSizeCSS(paperSize);
    var raf = window.requestAnimationFrame || function(callback) { return setTimeout(callback, 40); };
    raf(function() {
      raf(function() {
        try { window.print(); }
        catch (printError) {
          console.error("Fallback print failed:", printError);
          abortPrint("باز کردن پنجره چاپ ناموفق بود: " + (printError.message || printError), false);
        }
      });
    });
  }).catch(function(error) {
    console.error("Print asset preparation failed:", error);
    if (!askToContinueWithMissingAssets({ failed: [{ url: "print-assets" }] })) {
      abortPrint("آماده‌سازی چاپ لغو شد.", false);
      return;
    }
    applyDynamicPrintPageSizeCSS(paperSize);
    var nextFrame = window.requestAnimationFrame || function(callback) { return setTimeout(callback, 40); };
    nextFrame(function() { nextFrame(function() { try { window.print(); } catch (printError) { abortPrint("چاپ ناموفق بود: " + (printError.message || printError), false); } }); });
  });
  return true;
};
window.addEventListener("beforeprint", function() {
  applyDynamicPrintPageSizeCSS(currentPaperSize);
  var pages = document.querySelectorAll("#a4-preview-stage .a4-page");
  for (var i = 0; i < pages.length; i++) pages[i].classList.toggle("paper-a5", currentPaperSize === "A5");
});
window.addEventListener("afterprint", function() {
  printRequestActive = false;
  if (window.__nezam636PrintFailsafe) {
    clearTimeout(window.__nezam636PrintFailsafe);
    window.__nezam636PrintFailsafe = null;
  }
});

window.triggerSmartPrint = function(forcedSize) {
  if (forcedSize === "A4" || forcedSize === "A5") window.setPaperSize(forcedSize, true);
  return window.doPrintPaperSheet();
};

window.getInquiryDataObject = function() {
  var c = getActiveCase();
  if (!c) {
    return {
      num: toFa((document.getElementById("l-number") || {}).value || "۱۴۰۵۰۲۱۳۰۱"),
      date: toFa((document.getElementById("l-date") || {}).value || todayShamsi()),
      attach: (document.getElementById("l-attach") || {}).value || "ندارد",
      name: "---", nid: "---", project: "---", cap: "---", land: "---", landParcel: "---", water: "---", loc: "---", utm: "", extra: ""
    };
  }
  var extra = "";
  if (c.customFields && c.customFields.length) {
    for (var i = 0; i < c.customFields.length; i++) {
      if (c.customFields[i].value) extra += "\n• " + c.customFields[i].label + ": " + toFa(c.customFields[i].value);
    }
  }
  return {
    num: toFa((document.getElementById("l-number") || {}).value || "۱۴۰۵۰۲۱۳۰۱"),
    date: toFa((document.getElementById("l-date") || {}).value || todayShamsi()),
    attach: (document.getElementById("l-attach") || {}).value || "ندارد",
    name: c.name || "",
    nid: toFa(c.nid || ""),
    project: c.project || "",
    cap: toFa(c.cap || ""),
    land: toFa(c.land || ""),
    landParcel: toFa(c.landParcel || ""),
    water: toFa(c.water || ""),
    loc: c.loc || "",
    utm: c.utm || "",
    extra: extra
  };
};

window.buildInquirySpec = function(typeKey, d) {
  var item = tplCfg[typeKey] || tplCfg.WATER;
  var body = (item.body || "")
    .replace(/\{نام\}/g, d.name)
    .replace(/\{کدملی\}/g, d.nid)
    .replace(/\{طرح\}/g, d.project)
    .replace(/\{ظرفیت\}/g, d.cap)
    .replace(/\{مساحت\}/g, d.land)
    .replace(/\{پلاک ثبتی\}/g, d.landParcel || "")
    .replace(/\{پلاک\}/g, d.landParcel || "")
    .replace(/\{آب\}/g, d.water)
    .replace(/\{موقعیت\}/g, d.loc) + (d.extra || "");
  return { rec: item.rec, body: body };
};

function renderTemplateButtonsInLettersPane() {
  var holder = document.getElementById("template-buttons-container");
  if (!holder) return;
  var html = "";
  for (var k in tplCfg) {
    if (!Object.prototype.hasOwnProperty.call(tplCfg, k)) continue;
    var item = tplCfg[k] || {};
    html += '<button type="button" class="btn btn-sm ' + (k === currentTemplateKey ? 'btn-success' : 'btn-outline-success') + ' fw-bold" data-template-key="' + safeHtmlText(k) + '">' + safeHtmlText(item.btnTitle) + '</button>';
  }
  holder.innerHTML = html;
  if (!holder.dataset.secureTemplateActionsBound) {
    holder.dataset.secureTemplateActionsBound = "1";
    holder.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-template-key]");
      if (!btn || !holder.contains(btn)) return;
      var key = btn.getAttribute("data-template-key");
      if (Object.prototype.hasOwnProperty.call(tplCfg, key)) selectInquiryTemplate(key);
    });
  }
}

function selectInquiryTemplate(key) {
  if (!getActiveCase()) {
    requireActiveCase("انتخاب قالب نامه مرتبط با پرونده متقاضی", function () { selectInquiryTemplate(key); });
    return false;
  }
  if (!confirmDiscardLetterChanges("با انتخاب قالب جدید، متن یا پیش‌نمایش فعلی کنار گذاشته می‌شود.")) return false;
  clearUnsavedLetterStateAfterConfirmation();
  window.__nezamOfficeLetterDraftMode = false;
  currentTemplateKey = key;
  editingLetterId = null;
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  currentPreviewMode = "EDITOR";
  var alertBox = document.getElementById("letter-edit-alert");
  if (alertBox) alertBox.style.display = "none";
  renderTemplateButtonsInLettersPane();
  syncLetterEditorWithActiveCase(true);
  updateLetterScopeUI();
  return true;
}

/* انتخاب نوع مکاتبه: متقاضی‌محور یا مستقل از پرونده */
function updateLetterScopeUI() {
  var officeMode = window.__nezamOfficeLetterDraftMode === true;
  var caseBtn = document.getElementById("btn-letter-case-mode");
  var officeBtn = document.getElementById("btn-letter-office-mode");
  var note = document.getElementById("letter-scope-note");
  var templateTitle = document.getElementById("letter-template-title");
  var templateHolder = document.getElementById("template-buttons-container");
  var utmBox = document.getElementById("l-include-utm");
  var direction = document.getElementById("l-direction");
  if (caseBtn) caseBtn.className = "btn btn-sm " + (officeMode ? "btn-outline-success" : "btn-success");
  if (officeBtn) officeBtn.className = "btn btn-sm " + (officeMode ? "btn-primary" : "btn-outline-primary");
  if (note) note.textContent = officeMode
    ? "نامه مستقل دفتر؛ بدون اتصال به پرونده متقاضی و با شماره‌گذاری مشترک دبیرخانه."
    : "نامه پرونده‌محور؛ اطلاعات متقاضی در متن و سوابق همان پرونده قابل استفاده است.";
  if (templateTitle) templateTitle.style.display = officeMode ? "none" : "";
  if (templateHolder) templateHolder.style.display = officeMode ? "none" : "";
  if (utmBox && utmBox.closest) {
    var utmContainer = utmBox.closest(".form-check");
    if (utmContainer) utmContainer.style.display = officeMode ? "none" : "";
  }
  if (direction) {
    if (officeMode) direction.value = "OUT";
    direction.disabled = officeMode;
  }
}
window.updateLetterScopeUI = updateLetterScopeUI;

window.startIndependentOfficeLetter = function() {
  if (!confirmDiscardLetterChanges("با شروع نامه مستقل، پیش‌نویس یا ویرایش فعلی کنار گذاشته می‌شود.")) return false;
  clearUnsavedLetterStateAfterConfirmation();
  window.__nezamOfficeLetterDraftMode = true;
  letterDraftCaseId = "__OFFICE__";
  var fields = {
    "l-direction": "OUT",
    "l-number": getNextSecretariatNumber(),
    "l-date": todayShamsi(),
    "l-attach": "ندارد",
    "l-recipient": ""
  };
  Object.keys(fields).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = fields[id];
  });
  var includeEl = document.getElementById("l-include-utm");
  if (includeEl) includeEl.checked = false;
  var body = document.getElementById("l-body");
  if (body) body.value = "";
  var rich = document.getElementById("l-body-rich");
  if (rich) rich.innerHTML = "";
  currentPreviewMode = "EDITOR";
  currentPreviewDraft = null;
  currentPreviewLetterId = null;
  editingLetterId = null;
  letterDraftDirty = false;
  paperPreviewDirty = false;
  var alertEl = document.getElementById("letter-edit-alert");
  if (alertEl) alertEl.style.display = "none";
  updateLetterScopeUI();
  updatePaperActionButtons();
  var recipientInput = document.getElementById("l-recipient");
  if (recipientInput) recipientInput.focus();
  showToastMsg("فرم نامه مستقل دفتر آماده است؛ نام ارگان مقصد و متن نامه را وارد کنید.");
  return true;
};

window.startCaseLinkedLetter = function() {
  if (!confirmDiscardLetterChanges("با شروع نامه مرتبط با پرونده، پیش‌نویس یا ویرایش فعلی کنار گذاشته می‌شود.")) return false;
  function beginForActiveCase() {
    clearUnsavedLetterStateAfterConfirmation();
    window.__nezamOfficeLetterDraftMode = false;
    if (!syncLetterEditorWithActiveCase(true)) return false;
    updateLetterScopeUI();
    showToastMsg("فرم نامه مرتبط با پرونده فعال آماده است.");
    return true;
  }
  if (!getActiveCase()) {
    requireActiveCase("شروع نامه مرتبط با پرونده متقاضی", beginForActiveCase);
    return false;
  }
  return beginForActiveCase();
};


function bindLetterEditorDirtyTracking() {
  var ids = ["l-direction","l-number","l-date","l-attach","l-recipient","l-include-utm","l-body"];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.letterDirtyTrackingBound === "1") return;
    el.dataset.letterDirtyTrackingBound = "1";
    var markDirty = function () {
      letterDraftDirty = true;
      var c = getActiveCase();
      if (c && !letterDraftCaseId) letterDraftCaseId = c.id;
    };
    el.addEventListener("input", markDirty);
    el.addEventListener("change", markDirty);
  });
}
window.bindLetterEditorDirtyTracking = bindLetterEditorDirtyTracking;

function syncLetterEditorWithActiveCase(force) {
  if (editingLetterId) return true;
  var c = getActiveCase();
  if (!c) {
    letterDraftCaseId = "";
    return false;
  }
  if (!force && String(letterDraftCaseId) === String(c.id)) return true;
  if (!force && letterDraftDirty && letterDraftCaseId && String(letterDraftCaseId) !== String(c.id)) {
    showToastMsg("پیش‌نویس قبلی هنوز ذخیره نشده است؛ برای پرونده جدید یک قالب نامه انتخاب کنید.", true);
    return false;
  }

  var d = window.getInquiryDataObject();
  var spec = window.buildInquirySpec(currentTemplateKey, d);
  var numEl = document.getElementById("l-number");
  var dateEl = document.getElementById("l-date");
  var recEl = document.getElementById("l-recipient");
  var bodyEl = document.getElementById("l-body");
  var dirEl = document.getElementById("l-direction");
  var attachEl = document.getElementById("l-attach");
  var includeEl = document.getElementById("l-include-utm");

  window.__nezamOfficeLetterDraftMode = false;
  if (numEl) numEl.value = getNextSecretariatNumber();
  if (dateEl) dateEl.value = todayShamsi();
  if (recEl) recEl.value = spec.rec || "";
  if (bodyEl) {
    bodyEl.value = spec.body || "";
    syncTextareaToRichEditor();
  }
  if (dirEl && !dirEl.value) dirEl.value = "OUT";
  if (attachEl && !attachEl.value) attachEl.value = "ندارد";
  if (includeEl) includeEl.checked = true;

  letterDraftCaseId = c.id;
  letterDraftDirty = false;
  currentPreviewDraft = null;
  currentPreviewLetterId = null;
  currentPreviewMode = "EDITOR";
  updatePaperActionButtons();
  return true;
}
window.syncLetterEditorWithActiveCase = syncLetterEditorWithActiveCase;
window.rebuildLetterBody = function() { return syncLetterEditorWithActiveCase(true); };

function syncRichEditorToTextarea() {
  var editor = document.getElementById("l-body-rich");
  var ta = document.getElementById("l-body");
  if (editor && ta) {
    editor.innerHTML = sanitizeOfficeRichHtml(editor.innerHTML);
    ta.value = editor.innerText || editor.textContent;
    if (!window.__nezam636ProgrammaticLetterSync) letterDraftDirty = true;
  }
}
window.syncRichEditorToTextarea = syncRichEditorToTextarea;

function syncTextareaToRichEditor() {
  var editor = document.getElementById("l-body-rich");
  var ta = document.getElementById("l-body");
  if (editor && ta) {
    editor.innerHTML = sanitizeOfficeRichHtml(ta.value.replace(/\n/g, "<br>"));
  }
}
window.syncTextareaToRichEditor = syncTextareaToRichEditor;

function onToggleLetterIncludeUtm(checked) {
  showToastMsg(checked ? "📍 جدول مختصات به‌صورت برگه پیوست مستقل به نامه افزوده خواهد شد." : "📍 پیوست مختصات برای این نامه غیرفعال شد.");
}
window.onToggleLetterIncludeUtm = onToggleLetterIncludeUtm;

function getLetterAttachmentLabel(baseValue, hasUtmAttachment) {
  var base = String(baseValue || "").trim();
  var label = "جدول مختصات UTM";
  if (!hasUtmAttachment) {
    base = base.replace(/،?\s*جدول مختصات UTM/g, "").replace(/^[،,\s]+|[،,\s]+$/g, "").trim();
    return base || "ندارد";
  }
  if (!base || /^ندارد$/i.test(base)) return label;
  if (base.indexOf(label) !== -1) return base;
  return base + "، " + label;
}

function saveLetterToSecretariat(goToPrint, forcedPaperSize) {
  var officeMode = window.__nezamOfficeLetterDraftMode === true;
  var c = officeMode ? null : getActiveCase();
  if (!c && !officeMode) {
    requireActiveCase("ثبت و صدور نامه مرتبط با پرونده", function () { saveLetterToSecretariat(goToPrint, forcedPaperSize); });
    return false;
  }

  var existingId = editingLetterId || null;
  var existingIndex = existingId ? lettersDB.findIndex(function (x) { return x && String(x.id) === String(existingId); }) : -1;
  if (existingId && existingIndex < 0) {
    showToastMsg("نامه در بایگانی پیدا نشد؛ برای جلوگیری از ایجاد سابقه اشتباه، ذخیره متوقف شد.", true);
    return false;
  }
  if (existingId) {
    var oldRecordIsOffice = lettersDB[existingIndex].officeLetter === true;
    if (oldRecordIsOffice !== officeMode) {
      showToastMsg("نوع نامه با سابقه انتخاب‌شده یکسان نیست؛ نامه را از مسیر صحیح ویرایش کنید.", true);
      return false;
    }
    if (!officeMode && String(lettersDB[existingIndex].caseId) !== String(c.id)) {
      showToastMsg("پرونده فعال با پرونده متعلق به نامه یکسان نیست؛ ابتدا پرونده صحیح را انتخاب کنید.", true);
      return false;
    }
  }

  var draft = getLetterDraftFromEditor();
  if (!draft) return false;
  if (!isSecretariatNumberAvailable(draft.number, existingId)) {
    showToastMsg("شماره نامه تکراری است؛ شماره یکتای دیگری وارد کنید.", true);
    var numberInput = document.getElementById("l-number");
    if (numberInput) { numberInput.focus(); numberInput.select(); }
    return false;
  }

  draft.officeLetter = officeMode;
  draft.caseId = officeMode ? "" : c.id;
  draft.paperSize = forcedPaperSize === "A5" ? "A5" : (forcedPaperSize === "A4" ? "A4" : draft.paperSize);
  draft.id = existingId || ("L-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7));
  var oldLettersJson = JSON.stringify(lettersDB);
  var oldHistoryJson = c ? JSON.stringify(c.history || []) : null;
  var wasNew = !existingId;
  var oldLetter = wasNew ? null : lettersDB[existingIndex];
  var letterObj = Object.assign({}, oldLetter || {}, draft);
  var changed = wasNew || JSON.stringify(oldLetter) !== JSON.stringify(letterObj);

  if (wasNew) lettersDB.unshift(letterObj);
  else if (changed) lettersDB[existingIndex] = letterObj;

  if (changed) {
    if (c) {
      logCaseAction(c, (wasNew ? "صدور و ثبت نامه شماره " : "ویرایش نامه شماره ") +
        toFa(draft.number) + " در کاغذ " + draft.paperSize + " خطاب به " + draft.recipient);
    }
    if (!persistLetterAndCaseData()) {
      lettersDB = JSON.parse(oldLettersJson);
      if (c) c.history = JSON.parse(oldHistoryJson);
      showToastMsg("ذخیره نامه انجام نشد؛ فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کنید. اطلاعات قبلی حفظ شد.", true);
      return false;
    }
  }

  editingLetterId = null;
  currentPreviewDraft = null;
  currentPreviewMode = "LETTER";
  currentPreviewLetterId = letterObj.id;
  paperPreviewDirty = false;
  letterDraftCaseId = officeMode ? "__OFFICE__" : c.id;
  window.__nezamOfficeLetterDraftMode = officeMode;
  letterDraftDirty = false;
  var alertBox = document.getElementById("letter-edit-alert");
  if (alertBox) alertBox.style.display = "none";
  var nextNumberInput = document.getElementById("l-number");
  if (wasNew && nextNumberInput) nextNumberInput.value = getNextSecretariatNumber();

  window.setPaperSize(letterObj.paperSize, true);
  renderSinglePreviewSheet(letterObj, letterObj.paperSize);
  updateLetterScopeUI();
  showToastMsg(officeMode
    ? (wasNew ? "نامه اداری مستقل با شماره " : "تغییرات نامه اداری مستقل شماره ") + toFa(letterObj.number) + " در دفتر اندیکاتور ثبت شد."
    : (wasNew ? "نامه با شماره " + toFa(letterObj.number) + " در دبیرخانه ثبت شد." : "تغییرات نامه شماره " + toFa(letterObj.number) + " در دبیرخانه ذخیره شد."));

  if (goToPrint) {
    switchMainPane("pane-print");
    setTimeout(function () { window.doPrintPaperSheet(); }, 180);
  }
  return true;
}

window.saveCurrentLetter = saveLetterToSecretariat;

function collectUtmAppendixFromStage(stage) {
  if (!stage) return "";
  var pages = stage.querySelectorAll(".a4-page");
  var combined = null;
  var combinedBody = null;
  for (var i = 1; i < pages.length; i++) {
    var table = pages[i].querySelector(".utm-table-print");
    if (!table) continue;
    if (!combined) {
      combined = table.cloneNode(false);
      var head = table.querySelector("thead");
      if (head) combined.appendChild(head.cloneNode(true));
      combinedBody = document.createElement("tbody");
      combined.appendChild(combinedBody);
    }
    var body = table.querySelector("tbody");
    if (body) {
      Array.prototype.forEach.call(body.children, function (row) {
        combinedBody.appendChild(row.cloneNode(true));
      });
    }
  }
  if (!combined || !combinedBody || !combinedBody.children.length) return "";
  return sanitizeOfficeRichHtml(combined.outerHTML);
}

window.savePaperEditsToSecretariat = function(options) {
  var opts = options || {};
  var silent = opts.silent === true;
  var stage = document.getElementById("a4-preview-stage");
  if (!stage) {
    if (!silent) showToastMsg("برگه‌ای برای ذخیره وجود ندارد.", true);
    return false;
  }
  if (currentPreviewMode !== "LETTER" && currentPreviewMode !== "LETTER_DRAFT") {
    if (!silent) showToastMsg("این عملیات فقط برای نامه‌ها فعال است؛ فرم‌ها و کروکی‌ها را از مسیر خروجی چاپ ذخیره کنید.", true);
    return false;
  }
  if (letterDraftDirty) {
    if (!silent) showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید تا نسخه قدیمی ذخیره نشود.", true);
    return false;
  }

  var pageEls = stage.querySelectorAll(".a4-page");
  var pageEl = pageEls.length ? pageEls[0] : null;
  if (!pageEl) {
    if (!silent) showToastMsg("پیش‌نمایش نامه خالی است.", true);
    return false;
  }
  var recEl = pageEl.querySelector(".l-rec");
  var txtEl = pageEl.querySelector(".l-txt");
  var numEl = pageEl.querySelector(".paper-meta-num");
  var dateEl = pageEl.querySelector(".paper-meta-date");
  var attachEl = pageEl.querySelector(".paper-meta-attach");
  var newRec = recEl ? recEl.innerText.trim() : "";
  var newBodyText = txtEl ? (txtEl.innerText || txtEl.textContent || "").trim() : "";
  var newBodyHtml = txtEl ? sanitizeOfficeRichHtml(txtEl.innerHTML) : "";
  var newNum = numEl ? numEl.innerText.trim() : "";
  var newDate = dateEl ? dateEl.innerText.trim() : "";
  var newAttach = attachEl ? attachEl.innerText.trim() : "ندارد";

  if (!newBodyText || !newRec || !newNum || !newDate) {
    if (!silent) showToastMsg("متن، گیرنده، شماره و تاریخ نامه باید کامل باشند.", true);
    return false;
  }

  var draftMode = currentPreviewMode === "LETTER_DRAFT";
  var draft = draftMode ? currentPreviewDraft : null;
  var existingId = draftMode ? (draft && draft.id) : currentPreviewLetterId;
  var existingIndex = existingId ? lettersDB.findIndex(function (x) { return x && String(x.id) === String(existingId); }) : -1;
  if (existingId && existingIndex < 0) {
    if (!silent) showToastMsg("سابقه نامه برای ذخیره پیدا نشد؛ دوباره پیش‌نمایش بگیرید.", true);
    return false;
  }
  if (!draftMode && !existingId) {
    if (!silent) showToastMsg("این برگه به نامه ثبت‌شده متصل نیست؛ ابتدا پیش‌نویس را از دبیرخانه ثبت کنید.", true);
    return false;
  }

  var base = draftMode ? draft : lettersDB[existingIndex];
  if (!base) {
    if (!silent) showToastMsg("اطلاعات پیش‌نویس نامه در دسترس نیست.", true);
    return false;
  }
  var officeLetter = base.officeLetter === true;
  var caseObj = officeLetter ? null : ((Array.isArray(window.casesDB) ? window.casesDB : []).find(function (item) {
    return item && String(item.id) === String(base.caseId);
  }) || getActiveCase());
  if (!officeLetter && (!caseObj || String(caseObj.id) !== String(base.caseId))) {
    if (!silent) showToastMsg("پرونده مرتبط با نامه در دسترس نیست؛ ذخیره متوقف شد.", true);
    return false;
  }
  if (!isSecretariatNumberAvailable(newNum, existingId)) {
    if (!silent) showToastMsg("شماره نامه در بایگانی تکراری شده است؛ ابتدا شماره یکتا انتخاب کنید.", true);
    return false;
  }

  var appendixHtml = collectUtmAppendixFromStage(stage);
  var includeUtm = !!(appendixHtml && appendixHtml.trim());
  var attachmentLabel = getLetterAttachmentLabel(newAttach, includeUtm);
  var updated = Object.assign({}, base, {
    number: newNum,
    date: newDate,
    recipient: newRec,
    body: newBodyHtml,
    attach: attachmentLabel,
    paperSize: currentPaperSize,
    includeUtm: includeUtm,
    // وقتی پیوست از برگه حذف شده، HTML قدیمی نباید به‌عنوان پیوست مخفی در رکورد بماند.
    utmAttachmentHtml: includeUtm ? appendixHtml : "",
    croquisMapId: officeLetter ? "" : (base.croquisMapId || activeCroquisMapId || "")
  });
  var wasNew = draftMode && !existingId;
  if (wasNew) updated.id = "L-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

  var oldLettersJson = JSON.stringify(lettersDB);
  var oldHistoryJson = caseObj ? JSON.stringify(caseObj.history || []) : null;
  var oldLetterJson = existingIndex >= 0 ? JSON.stringify(lettersDB[existingIndex]) : null;
  if (wasNew) lettersDB.unshift(updated);
  else lettersDB[existingIndex] = updated;

  var changed = wasNew || oldLetterJson !== JSON.stringify(updated);
  if (changed && opts.log !== false && caseObj) {
    logCaseAction(caseObj, (wasNew ? "صدور و ثبت نامه شماره " : "ذخیره اصلاحات نامه شماره ") +
      toFa(newNum) + " روی کاغذ " + currentPaperSize);
  }

  // در نبود تغییر واقعی، از نوشتن تکراری در LocalStorage و بازآرایی غیرضروری آرشیو پرهیز می‌شود.
  if (changed && !persistLetterAndCaseData()) {
    lettersDB = JSON.parse(oldLettersJson);
    if (caseObj) caseObj.history = JSON.parse(oldHistoryJson);
    if (!silent) showToastMsg("ذخیره تغییرات نامه ناموفق بود؛ نسخه قبلی حفظ شد.", true);
    return false;
  }

  currentPreviewMode = "LETTER";
  currentPreviewLetterId = updated.id;
  currentPreviewDraft = null;
  paperPreviewDirty = false;
  editingLetterId = null;
  letterDraftCaseId = officeLetter ? "__OFFICE__" : caseObj.id;
  window.__nezamOfficeLetterDraftMode = officeLetter;
  letterDraftDirty = false;

  var fields = {
    "l-number": newNum,
    "l-date": newDate,
    "l-attach": attachmentLabel,
    "l-recipient": newRec,
    "l-body": newBodyText
  };
  Object.keys(fields).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = fields[id];
  });
  var rich = document.getElementById("l-body-rich");
  if (rich) rich.innerHTML = newBodyHtml;
  var includeEl = document.getElementById("l-include-utm");
  if (includeEl) includeEl.checked = includeUtm;

  updatePrintUtmBtnState(includeUtm);
  updatePaperActionButtons();
  updateLetterScopeUI();
  if (!silent) showToastMsg(officeLetter
    ? (wasNew ? "نامه مستقل دفتر در دفتر اندیکاتور ثبت شد." : (changed ? "تغییرات نامه مستقل دفتر ذخیره شد." : "نامه مستقل بدون تغییر جدید باقی ماند."))
    : (wasNew ? "پیش‌نویس در دبیرخانه ثبت و ذخیره شد."
      : (changed ? "تغییرات نامه و پیوست آن در دبیرخانه ذخیره شد." : "نامه بدون تغییر جدید در دبیرخانه ثبت است.")));
  return true;
};

function buildPaperExportCss(paperSize, wordMode) {
  var size = paperSize === "A5" ? "A5" : "A4";
  var w = size === "A5" ? "148mm" : "210mm";
  var h = size === "A5" ? "210mm" : "297mm";
  var previewBody = wordMode
    ? "body{margin:0;padding:0;background:#fff;direction:rtl;}"
    : "body{margin:0;padding:12mm;background:#334155;display:flex;flex-direction:column;align-items:center;gap:10mm;direction:rtl;}";
  return [
    "*{box-sizing:border-box;font-family:'B Nazanin',Vazirmatn,Tahoma,sans-serif;}",
    "html,body{margin:0;min-height:100%;}",
    previewBody,
    ".a4-page{width:210mm;height:297mm;max-height:297mm;background:#fff;color:#000;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;margin:0 auto 8mm;box-shadow:0 8px 25px rgba(0,0,0,.22);page-break-after:always;break-after:page;}",
    ".a4-page.paper-a5{width:148mm;height:210mm;max-height:210mm;}",
    ".lh-top{color:#fff;padding:5mm 8mm;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f3e06b;flex-shrink:0;}",
    ".lh-r{width:42%;text-align:right;}.lh-sub{font-size:8.5pt;font-weight:700;}.lh-main{font-size:10.5pt;font-weight:900;color:#f3e06b;}",
    ".lh-c{width:20%;text-align:center;font-size:12pt;font-weight:900;}.lh-l{width:34%;font-size:9pt;background:rgba(0,0,0,.18);padding:2.5mm 3.5mm;border-radius:6px;}",
    ".m-row{display:flex;justify-content:space-between;margin-bottom:1mm;gap:2mm;}",
    ".lh-body{padding:7mm 10mm;flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;min-height:0;}",
    ".lh-content-wrap{flex:1;min-height:0;overflow:hidden;}.l-rec{font-size:11pt;font-weight:900;margin-bottom:2mm;}.l-txt{font-size:10.2pt;line-height:1.95;text-align:justify;white-space:pre-line;overflow-wrap:anywhere;}",
    ".paper-a5 .lh-top{padding:3.5mm 6mm;}.paper-a5 .lh-sub{font-size:7.5pt;}.paper-a5 .lh-main{font-size:9.2pt;}.paper-a5 .lh-c{font-size:10.5pt;}.paper-a5 .lh-l{font-size:8pt;padding:1.8mm 2.8mm;}",
    ".paper-a5 .lh-body{padding:4.5mm 7mm;}.paper-a5 .l-rec{font-size:9.8pt;}.paper-a5 .l-txt{font-size:8.8pt;line-height:1.65;}",
    ".utm-table-print{width:96%;margin:2.5mm auto;border-collapse:collapse;table-layout:fixed;font-size:8.2pt;direction:rtl;}",
    ".utm-table-print th,.utm-table-print td{border:1px solid #000;padding:1mm 1.8mm;text-align:center;overflow-wrap:anywhere;}",
    ".utm-table-print th{background:#e2e8f0;font-weight:900;}.paper-a5 .utm-table-print{width:100%;font-size:6.8pt;margin:1.5mm auto;}.paper-a5 .utm-table-print th,.paper-a5 .utm-table-print td{padding:.6mm .9mm;}",
    "table.table{width:100%;border-collapse:collapse;margin:2mm 0;font-size:9.5pt;}table.table th,table.table td{border:1px solid #333;padding:1.5mm 2mm;text-align:center;}table.table thead th{background:#f1f5f9;font-weight:800;}.paper-a5 table.table{font-size:7.5pt;} .paper-a5 table.table th,.paper-a5 table.table td{padding:.8mm 1mm;}",
    ".badge{display:inline-block;padding:.5mm 1.5mm;border-radius:3mm;font-weight:700;}.bg-warning{background:#f4d36b;color:#222;}.text-dark{color:#222;}.mt-1{margin-top:1mm;}",
    ".sign-area{display:flex;justify-content:flex-end;margin-top:3mm;padding-left:6mm;flex-shrink:0;}.sign-box{text-align:center;font-weight:800;font-size:9.8pt;line-height:1.7;min-width:55mm;}",
    ".lh-foot{color:#fff;padding:3.5mm 8mm;border-top:2.5px solid #f3e06b;font-size:8pt;flex-shrink:0;}.f-warn{text-align:center;font-weight:800;color:#f3e06b;margin-bottom:1mm;}.f-info{display:flex;justify-content:space-between;align-items:center;gap:4mm;}",
    ".qr-verify-box{background:#fff;padding:2px;text-align:center;margin-top:2px;}",
    ".printed-croquis-satellite-box{position:relative;width:100%!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important;}",
    ".printed-croquis-satellite-box>svg{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;}",
    "#printed-croquis-map-holder{display:block!important;width:100%!important;max-width:100%!important;margin-left:auto!important;margin-right:auto!important;}",

    "@page{size:" + w + " " + h + ";margin:0;}",
    "@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}html,body{width:" + w + "!important;margin:0!important;padding:0!important;background:#fff!important;display:block!important;}.a4-page,.a4-page.paper-a5{width:" + w + "!important;min-width:" + w + "!important;max-width:" + w + "!important;height:" + h + "!important;min-height:" + h + "!important;max-height:" + h + "!important;margin:0!important;box-shadow:none!important;page-break-inside:avoid!important;break-inside:avoid!important;page-break-after:always!important;break-after:page!important;}.a4-page:last-child,.a4-page.paper-a5:last-child{page-break-after:auto!important;break-after:auto!important;}}"
  ].join("\n");
}

function safePaperFileBase(value) {
  var name = String(value || "Markaz636").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");
  return name.replace(/^_+|_+$/g, "").slice(0, 72) || "Markaz636";
}

/* خروجی HTML مستقل از همان قالب و ابعاد پیش‌نمایش */
window.downloadPaperSheetFile = function(forcedSize) {
  if (forcedSize === "A4" || forcedSize === "A5") window.setPaperSize(forcedSize, true);
  var stage = document.getElementById("a4-preview-stage");
  if (!stage || !stage.querySelector(".a4-page") || currentPreviewMode === "EDITOR") {
    showToastMsg("ابتدا پیش‌نمایش نامه، فرم یا کروکی را آماده کنید.", true);
    return false;
  }
  if ((currentPreviewMode === "LETTER" || currentPreviewMode === "LETTER_DRAFT") && letterDraftDirty) {
    showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید.", true);
    return false;
  }
  var fitResult = autoFitPaperContent(stage);
  if (fitResult.pendingCount) {
    showToastMsg("خروجی HTML ساخته نشد؛ صفحه هنوز کامل قابل اندازه‌گیری نیست.", true);
    return false;
  }
  if (fitResult.overflowCount && !window.confirm("هشدار: بخشی از محتوا ممکن است در فایل خروجی از محدوده برگه بیرون بزند یا بریده شود. با وجود این خطر فایل را ایجاد کنم؟")) return false;
  // دانلود HTML به‌تنهایی هیچ رکوردی در دفتر اندیکاتور ایجاد یا ویرایش نمی‌کند.
  var pSize = currentPaperSize || "A4";
  var c = window.__nezamOfficeLetterDraftMode === true ? null : getActiveCase();
  var title = "برگه رسمی " + pSize + " - مرکز خدمات ۶۳۶ خفر";
  var docHtml = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + safeHtmlText(title) + '</title><style>' + buildPaperExportCss(pSize, false) +
    '</style></head><body>' + stage.innerHTML + '</body></html>';
  var objectUrl = URL.createObjectURL(new Blob([docHtml], { type: "text/html;charset=utf-8" }));
  var a = document.createElement("a");
  a.href = objectUrl;
  a.download = "Sheet_" + pSize + "_" + safePaperFileBase(c && c.name || (window.__nezamOfficeLetterDraftMode === true ? "Daftar" : "")) + ".html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1500);
  showToastMsg(fitResult.overflowCount ? "فایل HTML ساخته شد؛ محتوای سرریزدار ممکن است در چاپ بریده شود." : "فایل HTML مستقل با قالب و اندازه " + pSize + " آماده شد.", !!fitResult.overflowCount);
  return true;
};

function activatePaneForArchivedLetter(paneId) {
  var pane = document.getElementById(paneId);
  if (!pane) return false;
  var panes = document.querySelectorAll(".sec-pane");
  for (var i = 0; i < panes.length; i++) panes[i].classList.remove("active");
  pane.classList.add("active");
  var navLinks = document.querySelectorAll(".app-navbar .nav-link");
  for (var j = 0; j < navLinks.length; j++) navLinks[j].classList.remove("active");
  var nav = document.getElementById(paneId === "pane-letters" ? "nav-btn-letters" : "nav-btn-print");
  if (nav) nav.classList.add("active");
  return true;
}

function cancelLetterEditing() {
  if (!confirmDiscardLetterChanges("با لغو ویرایش، تغییرات ذخیره‌نشده این نامه کنار گذاشته می‌شود.")) return false;
  editingLetterId = null;
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  var alertEl = document.getElementById("letter-edit-alert");
  if (alertEl) alertEl.style.display = "none";
  letterDraftDirty = false;
  paperPreviewDirty = false;
  window.__nezamOfficeLetterDraftMode = false;
  if (getActiveCase()) syncLetterEditorWithActiveCase(true);
  else {
    letterDraftCaseId = "";
    currentPreviewMode = "EDITOR";
    var emptyFields = {
      "l-direction": "OUT",
      "l-number": getNextSecretariatNumber(),
      "l-date": todayShamsi(),
      "l-attach": "ندارد",
      "l-recipient": "",
      "l-body": ""
    };
    Object.keys(emptyFields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = emptyFields[id];
    });
    var rich = document.getElementById("l-body-rich");
    if (rich) rich.innerHTML = "";
    var includeEl = document.getElementById("l-include-utm");
    if (includeEl) includeEl.checked = false;
  }
  updateLetterScopeUI();
  showToastMsg("ویرایش نامه لغو شد؛ هیچ تغییری در سوابق ذخیره نشد.");
}

window.cancelLetterEditing = cancelLetterEditing;

function editLetterFromSecretariat(letterId) {
  var letter = findSecretariatLetter(letterId);
  if (!letter) {
    showToastMsg("نامه انتخاب‌شده در دفتر اندیکاتور پیدا نشد.", true);
    return false;
  }
  var isOfficeLetter = letter.officeLetter === true;
  var linkedCase = isOfficeLetter ? null : (Array.isArray(window.casesDB) ? window.casesDB : []).find(function (item) {
    return item && String(item.id) === String(letter.caseId);
  });
  if (!isOfficeLetter && !linkedCase) {
    showToastMsg("پرونده مرتبط با این نامه پیدا نشد؛ ویرایش برای جلوگیری از اتصال اشتباه متوقف شد.", true);
    return false;
  }
  if (!confirmDiscardLetterChanges("با باز کردن نامهٔ بایگانی، ویرایش فعلی کنار گذاشته می‌شود.")) return false;

  if (linkedCase) {
    activeCaseId = linkedCase.id;
    activeCroquisMapId = letter.croquisMapId || "";
    activeCroquisLayerId = "";
    try { localStorage.setItem("nezam636_active_case_id", String(linkedCase.id)); } catch (e) {}
    try {
      if (typeof populateGlobalCaseSelector === "function") populateGlobalCaseSelector();
      if (typeof loadActiveCaseIntoForm === "function") loadActiveCaseIntoForm();
      if (typeof window.initCroquisWorkspaceForActiveCase === "function") window.initCroquisWorkspaceForActiveCase();
    } catch (caseError) {
      console.warn("Could not load the case for letter editing:", caseError);
    }
  }

  window.__nezamOfficeLetterDraftMode = isOfficeLetter;
  editingLetterId = letter.id;
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  currentPreviewMode = "EDITOR";
  letterDraftCaseId = isOfficeLetter ? "__OFFICE__" : linkedCase.id;
  letterDraftDirty = false;
  paperPreviewDirty = false;
  var fields = {
    "l-direction": isOfficeLetter ? "OUT" : (letter.type || "OUT"),
    "l-number": letter.number || "",
    "l-date": letter.date || "",
    "l-attach": letter.attach || "ندارد",
    "l-recipient": letter.recipient || "",
    "l-body": letter.body || ""
  };
  Object.keys(fields).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = fields[id];
  });
  var includeEl = document.getElementById("l-include-utm");
  if (includeEl) includeEl.checked = !isOfficeLetter && letter.includeUtm === true;
  if (typeof window.syncTextareaToRichEditor === "function") window.syncTextareaToRichEditor();
  if (letter.paperSize) window.setPaperSize(letter.paperSize, true);

  var alertEl = document.getElementById("letter-edit-alert");
  if (alertEl) {
    alertEl.style.display = "flex";
    alertEl.className = "alert alert-warning py-2 px-3 small fw-bold mb-3 d-flex justify-content-between align-items-center";
    alertEl.innerHTML = '<span>✏️ در حال ویرایش ' + (isOfficeLetter ? "نامه مستقل دفتر" : "نامه متقاضی " + safeHtmlText(letter.appName || linkedCase.name)) +
      ' شماره «' + safeHtmlText(toFa(letter.number)) + '» (کاغذ ' + (letter.paperSize === "A5" ? "A5" : "A4") + ')</span>' +
      '<button type="button" class="btn btn-sm btn-outline-dark py-0" onclick="cancelLetterEditing()">لغو ویرایش</button>';
  }
  updateLetterScopeUI();
  updatePaperActionButtons();
  if (typeof window.switchMainPane === "function") window.switchMainPane("pane-letters");
  showToastMsg("نامه شماره " + toFa(letter.number || "") + " برای ویرایش بارگذاری شد.");
  return true;
}

window.editLetterFromSecretariat = editLetterFromSecretariat;

function previewCurrentLetterDraft(forcedPaperSize) {
  var officeMode = window.__nezamOfficeLetterDraftMode === true;
  if (!getActiveCase() && !officeMode) {
    requireActiveCase("پیش‌نمایش نامه مرتبط با پرونده متقاضی", function () { previewCurrentLetterDraft(forcedPaperSize); });
    return false;
  }
  var draft = getLetterDraftFromEditor();
  if (!draft) return false;
  draft.officeLetter = officeMode;
  if (officeMode) draft.caseId = "";
  draft.id = editingLetterId || null;
  currentPreviewDraft = draft;
  currentPreviewLetterId = null;
  var pSize = forcedPaperSize || draft.paperSize || currentPaperSize;
  if (!renderLetterPreviewObject(draft, pSize, "LETTER_DRAFT")) return false;
  letterDraftDirty = false;
  paperPreviewDirty = false;
  updateLetterScopeUI();
  if (typeof window.switchMainPane === "function") window.switchMainPane("pane-print");
  showToastMsg(officeMode
    ? "پیش‌نمایش نامه اداری مستقل آماده است؛ این نامه هنوز در دفتر اندیکاتور ثبت نشده است."
    : "پیش‌نمایش آماده است؛ چاپ و دانلود به‌تنهایی نامه را در دبیرخانه ثبت نمی‌کند.");
  return true;
}

window.previewCurrentLetterDraft = previewCurrentLetterDraft;

/* چاپ مستقیم پیش‌نویس؛ عمداً بدون ثبت در دفتر اندیکاتور */
window.printCurrentLetterDraft = function(forcedPaperSize) {
  if (!previewCurrentLetterDraft(forcedPaperSize)) return false;
  setTimeout(function() {
    if (typeof window.doPrintPaperSheet === "function") window.doPrintPaperSheet();
  }, 180);
  return true;
};

function renderSinglePreviewSheet(letterObj, forcedPaperSize) {
  if (letterObj) return renderLetterPreviewObject(letterObj, forcedPaperSize, "LETTER");
  if (currentPreviewMode === "LETTER_DRAFT" && currentPreviewDraft) {
    return renderLetterPreviewObject(currentPreviewDraft, forcedPaperSize, "LETTER_DRAFT");
  }
  if (currentPreviewMode === "LETTER" && currentPreviewLetterId) {
    var currentLetter = findSecretariatLetter(currentPreviewLetterId);
    if (currentLetter) return renderLetterPreviewObject(currentLetter, forcedPaperSize, "LETTER");
  }
  return previewCurrentLetterDraft(forcedPaperSize);
}
window.renderSinglePreviewSheet = renderSinglePreviewSheet;

function previewSavedLetter(letterId, forcedPaperSize) {
  var letter = findSecretariatLetter(letterId);
  if (!letter) {
    showToastMsg("نامه انتخاب‌شده در دفتر اندیکاتور پیدا نشد.", true);
    return false;
  }
  var isOfficeLetter = letter.officeLetter === true;
  var linkedCase = isOfficeLetter ? null : (Array.isArray(window.casesDB) ? window.casesDB : []).find(function (item) {
    return item && String(item.id) === String(letter.caseId);
  });
  if (!isOfficeLetter && !linkedCase) {
    showToastMsg("پرونده مرتبط با این نامه پیدا نشد؛ پیش‌نمایش برای جلوگیری از نمایش مختصات پرونده اشتباه متوقف شد.", true);
    return false;
  }
  if (!confirmDiscardLetterChanges("با باز کردن نامهٔ بایگانی، ویرایش فعلی کنار گذاشته می‌شود.")) return false;
  if (linkedCase) {
    activeCaseId = linkedCase.id;
    activeCroquisMapId = letter.croquisMapId || "";
    activeCroquisLayerId = "";
    try { localStorage.setItem("nezam636_active_case_id", String(linkedCase.id)); } catch (e) {}
    try {
      if (typeof populateGlobalCaseSelector === "function") populateGlobalCaseSelector();
      if (typeof loadActiveCaseIntoForm === "function") loadActiveCaseIntoForm();
      if (typeof window.initCroquisWorkspaceForActiveCase === "function") window.initCroquisWorkspaceForActiveCase();
    } catch (caseError) {
      console.warn("Could not refresh the case before letter preview:", caseError);
    }
  }
  window.__nezamOfficeLetterDraftMode = isOfficeLetter;
  editingLetterId = null;
  currentPreviewDraft = null;
  letterDraftDirty = false;
  letterDraftCaseId = isOfficeLetter ? "__OFFICE__" : linkedCase.id;
  var targetSize = forcedPaperSize === "A5" ? "A5" : (forcedPaperSize === "A4" ? "A4" : (letter.paperSize || currentPaperSize || "A4"));
  if (!renderLetterPreviewObject(letter, targetSize, "LETTER")) return false;
  updateLetterScopeUI();
  if (typeof window.switchMainPane === "function") window.switchMainPane("pane-print");
  showToastMsg((isOfficeLetter ? "پیش‌نمایش نامه مستقل دفتر" : "پیش‌نمایش نامه پرونده") +
    " شماره " + toFa(letter.number || "") + " روی کاغذ " + targetSize + " آماده شد.");
  return true;
}

window.previewSavedLetter = previewSavedLetter;
window.printArchivedLetter = function(letterId, paperSize) {
  return previewSavedLetter(letterId, paperSize);
};

function quickIssueSingleInquiry(tplKey) {
  requireActiveCase("صدور استعلام تکی برای متقاضی", function() {
    if (!selectInquiryTemplate(tplKey)) return;
    saveLetterToSecretariat(true);
  });
}

/* ساخت جدول جامع مختصات UTM شامل هم زمین اصلی (MAIN_PARCEL) و هم مابقی عوارض انتخاب‌شده به همراه ارتفاع و زون */
function buildAllSelectedFeaturesUtmTableHTML(c, utmRaw, isNatRes) {
  var layersToRender = [];
  var mapDefaultZone = (c && c.utmZone) ? c.utmZone : "39R";
  if (c && Array.isArray(c.croquisMaps) && c.croquisMaps.length > 0) {
    var m = null;
    for (var mi = 0; mi < c.croquisMaps.length; mi++) {
      if (c.croquisMaps[mi].id === activeCroquisMapId) { m = c.croquisMaps[mi]; break; }
    }
    if (!m) m = c.croquisMaps[0];
    if (m && m.utmZone) mapDefaultZone = m.utmZone;
    if (m && Array.isArray(m.layers)) {
      for (var li = 0; li < m.layers.length; li++) {
        var lyr = m.layers[li];
        if (lyr && lyr.visible && Array.isArray(lyr.points) && lyr.points.length > 0) layersToRender.push(lyr);
      }
    }
  }

  if (layersToRender.length > 0) {
    var tableRows = "";
    var globalRowIdx = 1;
    for (var k = 0; k < layersToRender.length; k++) {
      var l = layersToRender[k];
      var safeLayerName = safeHtmlText(l.name);
      var safeLayerColor = safeHexColor(l.color, "#15803d");
      var g = computeUtmGeometry(l.points, l.geomType);
      var metricSummary = l.geomType === "POLYGON"
        ? ("مساحت: " + toFa(Math.round(g.area)) + " مترمربع (" + toFa(g.ha.toFixed(2)) + " هکتار)")
        : (l.geomType === "LINE" ? ("طول مسیر: " + toFa(Math.round(g.perim)) + " متر") : "عارضه نقطه‌ای");

      tableRows += '<tr style="background:#eef6f0;font-weight:800;">' +
        '<td colspan="6" style="text-align:right;padding:1.2mm 3mm;">' +
          '<span style="display:inline-block;width:9px;height:9px;background:' + safeLayerColor + ';margin-left:5px;border-radius:2px;"></span>' +
          safeLayerName + ' — <span style="color:#15803d;">' + safeHtmlText(metricSummary) + '</span>' +
        '</td>' +
      '</tr>';

      for (var p = 0; p < l.points.length; p++) {
        var pt = l.points[p] || {};
        var ptElev = (pt.elev !== undefined && pt.elev !== "") ? pt.elev : 1285;
        var ptZone = pt.zone || mapDefaultZone || "39R";
        var ptLabel = safeHtmlText(pt.label || ("P" + (p + 1)));
        tableRows += '<tr>' +
          '<td>' + safeHtmlText(toFa(globalRowIdx++)) + '</td>' +
          '<td>' + safeLayerName + ' (' + ptLabel + ')</td>' +
          '<td>' + safeHtmlText(toFa(pt.x)) + '</td>' +
          '<td>' + safeHtmlText(toFa(pt.y)) + '</td>' +
          '<td>' + safeHtmlText(toFa(ptElev)) + '</td>' +
          '<td>' + safeHtmlText(toFa(ptZone)) + '</td>' +
        '</tr>';
      }
    }

    return '<table class="utm-table-print" style="width:96%;">' +
      '<thead><tr>' +
        '<th style="width:10mm">' + (isNatRes ? 'ر' : 'ردیف') + '</th>' +
        '<th>نام عارضه / لایه (زمین اصلی و عوارض انتخابی)</th>' +
        '<th>' + (isNatRes ? 'x' : 'X (شرقی)') + '</th>' +
        '<th>' + (isNatRes ? 'y' : 'Y (شمالی)') + '</th>' +
        '<th>ارتفاع (m)</th>' +
        '<th>Zone</th>' +
      '</tr></thead>' +
      '<tbody contenteditable="true">' + tableRows + '</tbody>' +
    '</table>';
  }

  // در حالت متن خام، فقط مقادیر عددی معتبر به جدول راه پیدا می‌کنند.
  var lines = String(utmRaw || "").trim().split("\n");
  var rowsHtml = "";
  for (var i = 0; i < lines.length; i++) {
    var p = lines[i].trim().split(/[,،\s\t]+/);
    var x = Number(toEn(p[0]));
    var y = Number(toEn(p[1]));
    if (p[0] && p[1] && Number.isFinite(x) && Number.isFinite(y)) {
      var elevVal = Number(toEn(p[2] || "1285"));
      if (!Number.isFinite(elevVal)) elevVal = 1285;
      var zoneVal = /^\d{1,2}[C-HJ-NP-X]$/i.test(p[3] || "") ? p[3] : mapDefaultZone;
      rowsHtml += "<tr><td>" + safeHtmlText(toFa(i + 1)) + "</td><td>محدوده اصلی زمین (P" + safeHtmlText(toFa(i + 1)) + ")</td><td>" + safeHtmlText(toFa(x)) + "</td><td>" + safeHtmlText(toFa(y)) + "</td><td>" + safeHtmlText(toFa(elevVal)) + "</td><td>" + safeHtmlText(toFa(zoneVal)) + "</td></tr>";
    }
  }
  if (!rowsHtml) return "";
  return '<table class="utm-table-print" style="width:94%;">' +
    '<thead><tr><th style="width:12mm">' + (isNatRes ? 'ر' : 'ردیف') + '</th><th>عارضه / نقطه</th><th>' + (isNatRes ? 'x' : 'X (شرقی)') + '</th><th>' + (isNatRes ? 'y' : 'Y (شمالی)') + '</th><th>ارتفاع (m)</th><th>Zone</th></tr></thead>' +
    '<tbody contenteditable="true">' + rowsHtml + '</tbody></table>';
}

/* ساخت برگه A4 و A5 سربرگ رسمی مرکز ۶۳۶ با کنترل سرریز متن و تفکیک شیت‌ها */
function buildSingleA4HTML(rec, bodyTxt, numStr, dateStr, attachStr, utmRaw, isNatRes, isRawHtml, paperSize, includeUtm, sheetTag, utmHtmlOverride) {
  var pSize = (paperSize || currentPaperSize) === "A5" ? "A5" : "A4";
  var c = getActiveCase();
  var showUtm = includeUtm !== false;
  var utmTableHtml = "";
  if (showUtm) {
    if (typeof utmHtmlOverride === "string") utmTableHtml = utmHtmlOverride;
    else if (utmRaw || c) utmTableHtml = buildAllSelectedFeaturesUtmTableHTML(c, utmRaw, isNatRes);
  }
  var safeHeaderColor = safeHexColor(brandCfg.headerColor, "#1b4332");
  var logoData = String(brandCfg.customLogoData || "");
  var stampData = String(brandCfg.customStampData || "");
  var safeImagePattern = /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;
  var headerLogo = safeImagePattern.test(logoData)
    ? '<img src="' + logoData + '" style="width:60px;height:60px;object-fit:contain;">'
    : PRINT_HEADER_LOGO_SVG;
  var customStampHtml = safeImagePattern.test(stampData)
    ? '<div style="margin-top:2mm;"><img src="' + stampData + '" style="max-width:125px;max-height:90px;object-fit:contain;"></div>'
    : '<div style="height:' + (pSize === "A5" ? "14mm" : "20mm") + ';"></div>';
  var renderedBody = isRawHtml ? bodyTxt : safeHtmlText(toFa(bodyTxt)).replace(/\n/g, "<br>");
  var safeRec = safeHtmlText(rec);
  var safeSheetTag = safeHtmlText(sheetTag);
  var safeNum = safeHtmlText(toFa(numStr));
  var safeDate = safeHtmlText(toFa(dateStr));
  var safeAttach = safeHtmlText(attachStr);
  var safeOrg = safeHtmlText(brandCfg.orgSubtitle);
  var safeOffice = safeHtmlText(brandCfg.officeName);
  var safeManagerTitle = safeHtmlText(brandCfg.managerTitle);
  var safeManagerName = safeHtmlText(brandCfg.managerName);
  var safeAddress = safeHtmlText(brandCfg.address);
  var safePostal = safeHtmlText(toFa(brandCfg.postalCode));
  var safePhone = safeHtmlText(toFa(brandCfg.phone));
  var safeEmail = safeHtmlText(brandCfg.email);

  return '<div class="a4-page' + (pSize === "A5" ? ' paper-a5' : '') + '" data-paper-size="' + pSize + '">' +
    '<div class="lh-top" style="background:' + safeHeaderColor + ';">' +
      '<div class="lh-r">' +
        '<div style="margin-bottom:1.5mm;">' + headerLogo + '</div>' +
        '<div class="lh-sub">' + safeOrg + '</div>' +
        '<div class="lh-main">' + safeOffice + '</div>' +
      '</div>' +
      '<div class="lh-c">' +
        '<div>بسمه تعالی</div>' +
        (sheetTag ? '<div class="badge bg-warning text-dark mt-1" style="font-size:8.5pt;">' + safeSheetTag + '</div>' : '') +
      '</div>' +
      '<div class="lh-l">' +
        '<div class="m-row"><span>شماره:</span><span class="paper-meta-num" contenteditable="true">' + safeNum + '</span></div>' +
        '<div class="m-row"><span>تاریخ:</span><span class="paper-meta-date" contenteditable="true">' + safeDate + '</span></div>' +
        '<div class="m-row"><span>پیوست:</span><span class="paper-meta-attach" contenteditable="true">' + safeAttach + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="lh-body">' +
      '<div class="lh-content-wrap">' +
        (rec ? '<div class="l-rec" contenteditable="true">' + safeRec + '</div><div class="l-greeting" style="font-weight:800;margin-bottom:2mm;font-size:10.5pt;">با سلام</div>' : '') +
        '<div class="l-txt" style="' + (isRawHtml ? 'white-space:normal;' : '') + '" contenteditable="true">' + renderedBody + '</div>' +
        utmTableHtml +
      '</div>' +
      '<div class="sign-area">' +
        '<div class="sign-box">' +
          '<div>با تشکر</div>' +
          '<div>' + safeManagerTitle + '</div>' +
          '<div>' + safeManagerName + '</div>' +
          customStampHtml +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="lh-foot" style="background:' + safeHeaderColor + ';">' +
      '<div class="f-warn">این سربرگ صرفاً با اصل مهر و امضاء معتبر خواهد بود' + (sheetTag ? (' (' + safeSheetTag + ')') : '') + '</div>' +
      '<div class="f-info">' +
        '<div>آدرس: ' + safeAddress + '<br>کدپستی: ' + safePostal + '</div>' +
        '<div style="text-align:left;direction:ltr;">تلفن: ' + safePhone + '<br>' + safeEmail + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function autoFitPaperContent(container) {
  var stage = container || document.getElementById("a4-preview-stage");
  if (!stage) return { overflowCount: 0, pendingCount: 0, pages: 0 };
  var pages = stage.querySelectorAll(".a4-page");
  var overflowCount = 0;
  var pendingCount = 0;

  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];
    var body = page.querySelector(".lh-body");
    var wrap = page.querySelector(".lh-content-wrap");
    var txt = page.querySelector(".l-txt");
    if (!body || !txt) {
      // فرم‌های مستقل مانند لیبل زونکن بدنه سربرگ ندارند؛ سرریز خود صفحه را کنترل کن.
      var genericRect = page.getBoundingClientRect();
      if (!genericRect.width || !genericRect.height || !page.clientHeight) {
        page.setAttribute("data-fit-pending", "true");
        pendingCount++;
        continue;
      }
      page.removeAttribute("data-fit-pending");
      var genericOverflow = page.scrollHeight > page.clientHeight + 2 ||
        page.scrollWidth > page.clientWidth + 2;
      page.setAttribute("data-content-overflow", genericOverflow ? "true" : "false");
      if (genericOverflow) overflowCount++;
      continue;
    }

    // اندازه‌گیری صفحه پنهان معتبر نیست؛ تا زمان نمایش برگه صبر می‌کنیم.
    var rect = page.getBoundingClientRect();
    if (!rect.width || !rect.height || !body.clientHeight || (wrap && !wrap.clientHeight)) {
      page.setAttribute("data-fit-pending", "true");
      pendingCount++;
      continue;
    }
    page.removeAttribute("data-fit-pending");

    var isA5 = page.classList.contains("paper-a5");
    var currentSize = parseFloat(page.getAttribute("data-user-font-pt"));
    if (!Number.isFinite(currentSize)) currentSize = isA5 ? 8.8 : 10.5;
    var minTextSize = isA5 ? 6.8 : 7.2;
    var lineH = isA5 ? 1.65 : 1.95;
    var tables = page.querySelectorAll(".utm-table-print");
    var tblFont = isA5 ? 7.2 : 8.2;
    var minTableSize = isA5 ? 5.2 : 5.8;

    txt.style.fontSize = currentSize + "pt";
    txt.style.lineHeight = String(lineH);
    for (var t0 = 0; t0 < tables.length; t0++) tables[t0].style.fontSize = tblFont + "pt";

    function hasOverflow() {
      return body.scrollHeight > body.clientHeight + 2 ||
        (!!wrap && wrap.scrollHeight > wrap.clientHeight + 2);
    }

    var count = 0;
    while (hasOverflow() && count < 36) {
      var oldTextSize = currentSize;
      var oldTableSize = tblFont;
      currentSize = Math.max(minTextSize, currentSize - 0.2);
      lineH = Math.max(1.18, lineH - 0.025);
      tblFont = Math.max(minTableSize, tblFont - 0.15);
      txt.style.fontSize = currentSize + "pt";
      txt.style.lineHeight = String(lineH);
      for (var t = 0; t < tables.length; t++) tables[t].style.fontSize = tblFont + "pt";
      count++;
      if (currentSize === oldTextSize && tblFont === oldTableSize) break;
    }

    var overflow = hasOverflow();
    page.setAttribute("data-content-overflow", overflow ? "true" : "false");
    page.setAttribute("data-fit-font-pt", currentSize.toFixed(2));
    page.setAttribute("data-fit-table-pt", tblFont.toFixed(2));
    if (overflow) overflowCount++;
  }

  return { overflowCount: overflowCount, pendingCount: pendingCount, pages: pages.length };
}

window.autoFitPaperContent = autoFitPaperContent;

window.autoFitCurrentPaper = function() {
  var result = autoFitPaperContent();
  if (result.pendingCount) {
    showToastMsg("صفحه هنوز در حال آماده‌سازی است؛ پیش‌نمایش را باز نگه دارید و دوباره تنظیم خودکار را بزنید.", true);
    return false;
  }
  showToastMsg(result.overflowCount
    ? "برخی صفحات هنوز جا نمی‌شوند؛ اندازه کاغذ را بزرگ‌تر یا متن را کوتاه‌تر کنید."
    : "✨ اندازه قلم و فاصله‌ها برای جا شدن محتوا تنظیم شد.", !!result.overflowCount);
  return result.overflowCount === 0;
};

window.adjustPaperFontSize = function(delta) {
  var stage = document.getElementById("a4-preview-stage");
  if (!stage) return false;
  var txts = stage.querySelectorAll(".l-txt");
  if (!txts.length) {
    showToastMsg("در این نوع برگه، تنظیم اندازه متن در دسترس نیست.", true);
    return false;
  }
  txts.forEach(function(el) {
    var page = el.closest(".a4-page");
    if (!page) return;
    var currentPx = parseFloat(window.getComputedStyle(el).fontSize) || 14;
    var currentPt = currentPx * 0.75;
    var nextPt = Math.max(page.classList.contains("paper-a5") ? 6.8 : 7.2,
      Math.min(16, currentPt + (delta > 0 ? 0.75 : -0.75)));
    page.setAttribute("data-user-font-pt", nextPt.toFixed(2));
  });
  var result = autoFitPaperContent(stage);
  if (result.pendingCount) {
    showToastMsg("صفحه هنوز آماده اندازه‌گیری نیست؛ دوباره تلاش کنید.", true);
    return false;
  }
  showToastMsg(result.overflowCount
    ? "اندازه قلم تغییر کرد، اما بخشی از محتوا هنوز جا نمی‌شود."
    : (delta > 0 ? "اندازه قلم بزرگ‌تر شد (A+)." : "اندازه قلم کوچک‌تر شد (A-)."),
    !!result.overflowCount);
  return !result.overflowCount;
};



function splitUtmAttachmentTableHtml(tableHtml, paperSize) {
  if (!tableHtml) return [];
  try {
    var parsed = new DOMParser().parseFromString(String(tableHtml), "text/html");
    var source = parsed.querySelector("table.utm-table-print");
    if (!source) return [String(tableHtml)];
    var tbody = source.querySelector("tbody");
    if (!tbody) return [source.outerHTML];
    var rows = Array.prototype.slice.call(tbody.children);
    var maxPoints = paperSize === "A5" ? 10 : 18;
    var chunks = [], current = [], pointCount = 0, activeGroupHeader = null;
    function flushChunk() {
      if (!current.length) return;
      chunks.push(current);
      current = [];
      pointCount = 0;
    }
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var isGroupHeader = row.cells && row.cells.length === 1 && Number(row.cells[0].colSpan || 1) > 1;
      if (isGroupHeader) {
        activeGroupHeader = row.cloneNode(true);
        if (pointCount >= maxPoints) flushChunk();
        current.push(row.cloneNode(true));
        continue;
      }
      if (pointCount >= maxPoints) {
        flushChunk();
        if (activeGroupHeader) current.push(activeGroupHeader.cloneNode(true));
      }
      current.push(row.cloneNode(true));
      pointCount++;
    }
    flushChunk();
    if (chunks.length <= 1) return [source.outerHTML];
    return chunks.map(function (chunkRows) {
      var table = source.cloneNode(false);
      var head = source.querySelector("thead");
      if (head) table.appendChild(head.cloneNode(true));
      var newBody = document.createElement("tbody");
      chunkRows.forEach(function (r) { newBody.appendChild(r); });
      table.appendChild(newBody);
      return table.outerHTML;
    });
  } catch (e) {
    console.warn("Could not split UTM coordinate appendix:", e);
    return [String(tableHtml)];
  }
}

window.toggleUtmInPreviewSheet = function() {
  if (letterDraftDirty) {
    showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید.", true);
    return false;
  }
  var isDraft = currentPreviewMode === "LETTER_DRAFT" && !!currentPreviewDraft;
  var sourceLetter = isDraft
    ? currentPreviewDraft
    : (currentPreviewMode === "LETTER" ? findSecretariatLetter(currentPreviewLetterId) : null);
  if (!sourceLetter) {
    showToastMsg("ابتدا یک نامه را پیش‌نمایش بگیرید.", true);
    return false;
  }

  // روی نسخه موقت کار می‌کنیم؛ رکورد بایگانی فقط با دکمه ثبت نهایی تغییر می‌کند.
  var letter = JSON.parse(JSON.stringify(sourceLetter));
  if (letter.officeLetter === true) {
    showToastMsg("پیوست UTM فقط برای نامه‌های مرتبط با پرونده متقاضی فعال است.", true);
    return false;
  }
  var original = JSON.parse(JSON.stringify(letter));
  var stage = document.getElementById("a4-preview-stage");
  var firstPage = stage && stage.querySelector(".a4-page");
  if (firstPage) {
    var recEl = firstPage.querySelector(".l-rec");
    var txtEl = firstPage.querySelector(".l-txt");
    var numEl = firstPage.querySelector(".paper-meta-num");
    var dateEl = firstPage.querySelector(".paper-meta-date");
    var attachEl = firstPage.querySelector(".paper-meta-attach");
    if (recEl) letter.recipient = recEl.innerText.trim();
    if (txtEl) letter.body = sanitizeOfficeRichHtml(txtEl.innerHTML);
    if (numEl) letter.number = numEl.innerText.trim();
    if (dateEl) letter.date = dateEl.innerText.trim();
    var appendixBeforeToggle = collectUtmAppendixFromStage(stage);
    if (appendixBeforeToggle) {
      letter.utmAttachmentHtml = appendixBeforeToggle;
      letter.includeUtm = true;
    }
    letter.attach = getLetterAttachmentLabel(attachEl ? attachEl.innerText.trim() : letter.attach,
      !!(appendixBeforeToggle || letter.includeUtm === true));
  }
  if (!(letter.recipient || "").trim() || !String(letter.body || "").replace(/<[^>]*>/g, "").trim() ||
      !letter.number || !letter.date || !isSecretariatNumberAvailable(letter.number, letter.id || null)) {
    Object.keys(letter).forEach(function (key) { delete letter[key]; });
    Object.assign(letter, original);
    showToastMsg("پیش از تغییر پیوست، گیرنده، متن، تاریخ و شماره یکتای نامه را بررسی کنید.", true);
    return false;
  }

  letter.includeUtm = letter.includeUtm !== true;
  if (letter.includeUtm && !(letter.utmAttachmentHtml || "").trim()) {
    var caseObj = (Array.isArray(window.casesDB) ? window.casesDB : []).find(function (item) {
      return item && String(item.id) === String(letter.caseId);
    });
    if (!caseObj) {
      Object.keys(letter).forEach(function (key) { delete letter[key]; });
      Object.assign(letter, original);
      showToastMsg("پرونده مرتبط برای بازیابی مختصات پیدا نشد.", true);
      return false;
    }
    if (letter.croquisMapId) activeCroquisMapId = letter.croquisMapId;
    letter.utmAttachmentHtml = buildAllSelectedFeaturesUtmTableHTML(
      caseObj, letter.utm || caseObj.utm || "", (letter.recipient || "").indexOf("منابع طبیعی") !== -1
    );
  }

  var hasCoordinates = letter.includeUtm === true && !!(letter.utmAttachmentHtml && letter.utmAttachmentHtml.trim());
  if (letter.includeUtm && !hasCoordinates) {
    Object.keys(letter).forEach(function (key) { delete letter[key]; });
    Object.assign(letter, original);
    showToastMsg("برای این پرونده مختصات قابل پیوست پیدا نشد.", true);
    return false;
  }
  letter.attach = getLetterAttachmentLabel(letter.attach, hasCoordinates);

  renderLetterPreviewObject(letter, currentPaperSize, "LETTER_DRAFT");
  letterDraftDirty = false;
  paperPreviewDirty = true;
  showToastMsg((hasCoordinates ? "پیوست مختصات آماده شد." : "پیوست مختصات از پیش‌نمایش حذف شد.") +
    " برای ثبت این تغییر در دفتر اندیکاتور، دکمه ذخیره در دبیرخانه را بزنید.");
  return true;
};



function updatePrintUtmBtnState(isOn) {
  var btn = document.getElementById("btn-toggle-print-utm");
  if (!btn) return;
  btn.className = isOn ? "btn btn-sm btn-success fw-bold" : "btn btn-sm btn-outline-secondary fw-bold";
  btn.textContent = isOn ? "📎 پیوست مختصات: دارد" : "📎 پیوست مختصات: ندارد";
}

/* ابزارهای ویرایشگر متنی همانند مایکروسافت ورد (Rich Text Editor) */
window.execLetterFormat = function(cmd, val) {
  var editor = document.getElementById("l-body-rich");
  if (!editor) return;
  editor.focus();
  document.execCommand(cmd, false, val || null);
  syncRichEditorToTextarea();
};

window.applyLetterFontSize = function(size) {
  var editor = document.getElementById("l-body-rich");
  if (!editor) return;
  editor.focus();
  var sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    var span = document.createElement("span");
    span.style.fontSize = size;
    var range = sel.getRangeAt(0);
    span.appendChild(range.extractContents());
    range.insertNode(span);
  } else {
    document.execCommand("fontSize", false, size === "16pt" ? "5" : (size === "13pt" ? "4" : "3"));
  }
  syncRichEditorToTextarea();
};

window.insertTagIntoLetterBody = function(tag) {
  var editor = document.getElementById("l-body-rich");
  if (!editor) return;
  editor.focus();
  document.execCommand("insertText", false, tag);
  syncRichEditorToTextarea();
};

window.insertPhraseIntoLetterBody = function(phrase) {
  var editor = document.getElementById("l-body-rich");
  if (!editor) return;
  editor.focus();
  document.execCommand("insertText", false, phrase);
  syncRichEditorToTextarea();
};

window.insertLetterTable = function() {
  var editor = document.getElementById("l-body-rich");
  if (!editor) return;
  var tblHtml = '<table class="table table-bordered my-2" style="width:100%;font-size:9.5pt;border:1px solid #333;">' +
    '<thead><tr style="background:#f1f5f9;"><th>ردیف</th><th>شرح مشخصات</th><th>مقدار یا وضعیت</th></tr></thead>' +
    '<tbody><tr><td>۱</td><td>موضوع طرح</td><td>مطابق پرونده</td></tr><tr><td>۲</td><td>مساحت زمین</td><td>مترمربع</td></tr></tbody>' +
  '</table><p></p>';
  editor.focus();
  document.execCommand("insertHTML", false, tblHtml);
  syncRichEditorToTextarea();
};

function issueDeficiencyLetterForActiveCase() {
  var c = getActiveCase();
  if (!c) {
    requireActiveCase("صدور ابلاغیه نواقص مدارک", function () { issueDeficiencyLetterForActiveCase(); });
    return;
  }
  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

  getUploadedDocsForCase(c.id, function(upMap) {
    var missing = [];
    for (var i = 0; i < reqDocs.length; i++) {
      if (!upMap[reqDocs[i].code]) missing.push(toFa(missing.length + 1) + "- " + reqDocs[i].title);
    }
    if (!missing.length) { alert("پرونده کامل است و نقصی ندارد."); return; }
    if (!confirmDiscardLetterChanges("با صدور اخطاریه، پیش‌نویس یا ویرایش فعلی کنار گذاشته می‌شود.")) return;
    clearUnsavedLetterStateAfterConfirmation();

    var recipient = "متقاضی محترم، " + c.name + " (کد ملی/شناسه: " + toFa(c.nid) + ")";
    var body = "احتراماً پیرو تشکیل پرونده جنابعالی/سرکار عالی در مرکز خدمات کشاورزی و منابع طبیعی غیردولتی شماره ۶۳۶ شهرستان خفر جهت «" + c.project + "» واقع در اراضی " + c.loc + "، پس از بررسی مدارک مشخص گردید پرونده شما دارای نواقص زیر می‌باشد:\n\n" +
      missing.join("\n") + "\n\nلذا مستند به ضوابط اجرایی صدور مجوزها، خواهشمند است حداکثر ظرف مهلت قانونی ۱۰ روز نسبت به تحویل مدارک ناقص فوق به این مرکز اقدام فرمایید.";

    editingLetterId = null;
    currentPreviewLetterId = null;
    currentPreviewDraft = null;
    letterDraftCaseId = c.id;
    letterDraftDirty = false;
    var recipientEl = document.getElementById("l-recipient");
    var rich = document.getElementById("l-body-rich");
    var bodyField = document.getElementById("l-body");
    if (recipientEl) recipientEl.value = recipient;
    if (rich) rich.innerHTML = sanitizeOfficeRichHtml(body.replace(/\n/g, "<br>"));
    if (bodyField) bodyField.value = body;
    var numberEl = document.getElementById("l-number");
    var dateEl = document.getElementById("l-date");
    var attachEl = document.getElementById("l-attach");
    var directionEl = document.getElementById("l-direction");
    var includeEl = document.getElementById("l-include-utm");
    if (numberEl) numberEl.value = getNextSecretariatNumber();
    if (dateEl) dateEl.value = todayShamsi();
    if (attachEl) attachEl.value = "ندارد";
    if (directionEl) directionEl.value = "OUT";
    if (includeEl) includeEl.checked = false;
    saveLetterToSecretariat(true, currentPaperSize);
  });
}

function printOfficialForm(formType) {
  var c = getActiveCase();
  if (!c) {
    requireActiveCase("چاپ فرم رسمی برای پرونده", function () { printOfficialForm(formType); });
    return;
  }
  if (!confirmDiscardLetterChanges("با آماده‌سازی فرم رسمی، پیش‌نمایش یا ویرایش نامه جایگزین می‌شود.")) return false;
  clearUnsavedLetterStateAfterConfirmation();
  currentPreviewMode = "FORM";
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  updatePaperActionButtons();
  window.currentActiveFormKey = formType;
  applyDynamicPrintPageSizeCSS(currentPaperSize);
  var d = window.getInquiryDataObject();
  var innerHtml = "";

  if (formType === "FOLDER_COVER") {
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    innerHtml =
      '<div style="border:2px solid #000;padding:5mm;border-radius:6px;">' +
        '<div style="text-align:center;font-size:13pt;font-weight:900;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:4mm;">' +
          'فرم مخصوص تأیید تکمیل پرونده و شناسنامه متقاضی (' + safeHtmlText(grpMeta.title) + ')' +
        '</div>' +
        '<table class="utm-table-print" style="width:100%;font-size:10.5pt;">' +
          '<tr><td style="background:#eef3ee;"><b>نام متقاضی:</b></td><td>' + safeHtmlText(d.name) + '</td><td style="background:#eef3ee;"><b>کد ملی / شناسه:</b></td><td>' + safeHtmlText(d.nid) + '</td></tr>' +
          '<tr><td style="background:#eef3ee;"><b>عنوان طرح:</b></td><td>' + safeHtmlText(d.project) + '</td><td style="background:#eef3ee;"><b>ظرفیت / مساحت:</b></td><td>' + safeHtmlText(d.cap) + ' / ' + safeHtmlText(d.land) + ' م.م</td></tr>' +
          '<tr><td style="background:#eef3ee;"><b>موقعیت اراضی:</b></td><td colspan="3">' + safeHtmlText(d.loc) + '</td></tr>' +
          '<tr><td style="background:#eef3ee;"><b>کلاسه بایگانی:</b></td><td>' + safeHtmlText(toFa(c.code)) + '</td><td style="background:#eef3ee;"><b>تاریخ تکمیل پرونده:</b></td><td>' + safeHtmlText(d.date) + '</td></tr>' +
        '</table>' +
        '<div style="font-size:10pt;line-height:2.1;margin-top:4mm;">' +
          '☑ ۱. فرم تقاضای ثبت‌شده در درگاه ملی مجوزها و سامانه سماک / سانکا<br>' +
          '☑ ۲. تصویر شناسنامه، کارت ملی و مدارک هویتی (ممهور به مهر تصویر برابر اصل)<br>' +
          '☑ ۳. اسناد مالکیت زمین و نقشه کروکی چندلایه مختصات UTM<br>' +
          '☑ ۴. مکاتبات و پاسخ استعلام‌های قانونی مرتبط با فعالیت<br>' +
          '☑ ۵. فیش واریز تعرفه مصوب خدمات کارشناسی' +
        '</div>' +
      '</div>';
  } else if (formType === "PHARMACY_INSPECTION") {
    innerHtml =
      '<div style="text-align:center;font-size:12.5pt;font-weight:900;margin-bottom:3mm;">فرم نظارت و بازرسی داروخانه‌های گیاهپزشکی و مراکز عرضه نهاده شهرستان خفر</div>' +
      '<div style="border:1.5px solid #000;padding:3mm;font-size:10pt;margin-bottom:3mm;"><b>متقاضی:</b> ' + safeHtmlText(d.name) + ' | <b>کد ملی:</b> ' + safeHtmlText(d.nid) + ' | <b>موقعیت:</b> ' + safeHtmlText(d.loc) + ' | <b>تاریخ:</b> ' + safeHtmlText(d.date) + '</div>' +
      '<table class="utm-table-print" style="width:100%;font-size:9.2pt;">' +
        '<thead><tr style="background:#eef3ee;"><th>عنوان مورد بازدید</th><th>دارد</th><th>ندارد</th><th>عنوان مورد بازدید</th><th>دارد</th><th>ندارد</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>پروانه تأسیس داروخانه گیاهپزشکی</td><td></td><td></td><td>اعتبار پروانه تأسیس داروخانه</td><td></td><td></td></tr>' +
          '<tr><td>پروانه مسئول فنی گیاهپزشکی</td><td></td><td></td><td>اعتبار پروانه مسئول فنی</td><td></td><td></td></tr>' +
          '<tr><td>پروانه مرکز خدماتی داروخانه</td><td></td><td></td><td>اعتبار پروانه مرکز خدماتی</td><td></td><td></td></tr>' +
          '<tr><td>نصب تابلو استاندارد داروخانه</td><td></td><td></td><td>نصب لیبل قیمت‌گذاری</td><td></td><td></td></tr>' +
          '<tr><td>نصب قیمت روی قوطی سموم</td><td></td><td></td><td>سموم منقضی‌شده (تاریخ گذشته)</td><td></td><td></td></tr>' +
          '<tr><td>سموم تقلبی (غیرمجاز / قاچاق)</td><td></td><td></td><td>حضور مسئول فنی در داروخانه</td><td></td><td></td></tr>' +
          '<tr><td>نصب پروانه تأسیس در دید عموم</td><td></td><td></td><td>نصب پروانه مسئول فنی در دید عموم</td><td></td><td></td></tr>' +
          '<tr><td>ثبت خرید و فروش در سامانه مانیتورینگ</td><td></td><td></td><td>فروش بر اساس نسخه الکترونیکی</td><td></td><td></td></tr>' +
          '<tr><td>فاکتور رسمی خرید و فروش سموم</td><td></td><td></td><td>شماره ثبت و اعتبار ماده کودی</td><td></td><td></td></tr>' +
        '</tbody>' +
      '</table>';
  } else if (formType === "GREENHOUSE_CHECKLIST") {
    innerHtml =
      '<div style="text-align:center;font-size:12.5pt;font-weight:900;margin-bottom:3mm;">فرم بازدید کارشناسی و پایش فنی واحدهای گلخانه‌ای و قارچ خوراکی</div>' +
      '<div style="border:1.5px solid #000;padding:4mm;font-size:10pt;line-height:2.1;">' +
        '<b>بهره‌بردار:</b> ' + safeHtmlText(d.name) + ' | <b>کد ملی:</b> ' + safeHtmlText(d.nid) + ' | <b>مساحت:</b> ' + safeHtmlText(d.land) + ' م.م | <b>موقعیت:</b> ' + safeHtmlText(d.loc) + '<hr>' +
        '• <b>سیستم تأمین رطوبت:</b> ⬜ ایرواشر &nbsp; ⬜ مه‌پاش<br>' +
        '• <b>سیستم گرمایش:</b> ⬜ بویلر &nbsp; ⬜ جت‌هیتر / کوره هوای گرم &nbsp; ⬜ فن‌کویل<br>' +
        '• <b>سیستم سرمایش و تهویه:</b> ⬜ پد و فن استاندارد &nbsp; ⬜ فن سیرکولاسیون &nbsp; ⬜ پنجره رول‌آپ<br>' +
        '• <b>سیستم کنترل بهداشت:</b> ⬜ حوضچه ضدعفونی و پیش‌راهرو &nbsp; ⬜ توری ضدحشره<br>' +
        '• <b>مشخصات سازه:</b> ⬜ لوله گالوانیزه استاندارد (فاقد لوله سیاه و جوشکاری) &nbsp; ⬜ فونداسیون بتنی عیار ۲۵۰' +
      '</div>';
  } else if (formType === "PLEDGE_CONTRACT") {
    innerHtml =
      '<div style="text-align:center;font-size:13pt;font-weight:900;margin-bottom:3mm;">تعهدنامه رسمی بهره‌بردار و الزامات مسئول فنی</div>' +
      '<div style="border:1.5px solid #000;padding:5mm;font-size:10.5pt;line-height:2.2;text-align:justify;">' +
        'اینجانب <b>' + safeHtmlText(d.name) + '</b> به کد ملی/شناسه <b>' + safeHtmlText(d.nid) + '</b> متقاضی طرح «<b>' + safeHtmlText(d.project) + '</b>» با ظرفیت <b>' + safeHtmlText(d.cap) + '</b> در زمینی به مساحت <b>' + safeHtmlText(d.land) + '</b> مترمربع واقع در <b>' + safeHtmlText(d.loc) + '</b> متعهد می‌گردم کلیه ضوابط فنی، بهداشتی و زیست‌محیطی وزارت جهاد کشاورزی و سازمان نظام مهندسی کشاورزی و منابع طبیعی را رعایت نموده، از خدمات مسئول فنی واجد صلاحیت در سامانه سانکا استفاده نمایم و از هرگونه تغییر کاربری غیرمجاز خودداری کنم.<br><br>امضا و اثر انگشت متقاضی:' +
      '</div>';
  } else if (formType === "BINDER_LABEL") {
    var stage = document.getElementById("a4-preview-stage");
    stage.innerHTML =
      '<div class="a4-page' + (currentPaperSize === "A5" ? " paper-a5" : "") + '" data-page-kind="binder-label" data-paper-size="' + currentPaperSize + '" style="padding:15mm;">' +
        '<div style="border:3px double #1b5e20;border-radius:12px;padding:8mm;margin-bottom:12mm;">' +
          '<div style="display:flex;justify-content:space-between;border-bottom:2px solid #2e7d32;padding-bottom:4mm;margin-bottom:4mm;">' +
            '<div><b>سازمان نظام مهندسی کشاورزی و منابع طبیعی استان فارس</b><br>' + brandCfg.officeName + '</div>' +
            '<div style="border:2px solid #000;padding:2mm 5mm;font-size:14pt;font-weight:900;">کلاسه: ' + safeHtmlText(toFa(c.code)) + '</div>' +
          '</div>' +
          '<div style="font-size:12pt;line-height:2.2;">' +
            '👤 <b>متقاضی:</b> ' + safeHtmlText(d.name) + ' &nbsp;|&nbsp; <b>کد ملی/شناسه:</b> ' + safeHtmlText(d.nid) + '<br>' +
            '📋 <b>موضوع طرح:</b> ' + safeHtmlText(d.project) + ' (' + safeHtmlText(d.cap) + ' - ' + safeHtmlText(d.land) + ' مترمربع)<br>' +
            '📍 <b>موقعیت:</b> ' + safeHtmlText(d.loc) +
          '</div>' +
        '</div>' +
        '<div style="border:2.5px solid #000;border-radius:8px;padding:5mm;width:55mm;margin:0 auto;text-align:center;line-height:2;">' +
          '<div style="background:#1b5e20;color:#fff;font-weight:bold;">مرکز خدمات ۶۳۶ خفر</div>' +
          '<div style="font-size:14pt;font-weight:900;margin:2mm 0;">' + safeHtmlText(toFa(c.code)) + '</div>' +
          '<div style="font-size:12pt;font-weight:900;">' + safeHtmlText(d.name) + '</div>' +
          '<div>کدملی: ' + safeHtmlText(d.nid) + '</div>' +
          '<div style="font-size:9.5pt;">' + safeHtmlText(d.project) + '</div>' +
          '<div style="font-size:8.5pt;">' + safeHtmlText(d.loc) + '</div>' +
        '</div>' +
      '</div>';
    switchMainPane("pane-print");
    return;
  }

  var stageEl = document.getElementById("a4-preview-stage");
  if (!stageEl) {
    showToastMsg("محل پیش‌نمایش چاپ در صفحه پیدا نشد؛ صفحه را تازه‌سازی کنید.", true);
    return false;
  }
  stageEl.innerHTML = buildSingleA4HTML("", innerHtml, d.num, d.date, "دارد", "", false, true, currentPaperSize, false);
  var formPage = stageEl.querySelector(".a4-page");
  if (formPage) {
    formPage.setAttribute("data-page-kind", "official-form-" + String(formType || "unknown").toLowerCase());
    formPage.setAttribute("data-paper-size", currentPaperSize);
  }
  applyDynamicPrintPageSizeCSS(currentPaperSize);
  switchMainPane("pane-print");
  return true;
}

/* =========================================================================
   بخش پنجم، ششم، هفتم و هشتم: موتور مهندسی کروکی چندلایه زمین (UTM + WGS84 + KML)
   ========================================================================= */
var LAYER_CATEGORY_META = {
  MAIN_PARCEL:  { title: "۱. محدوده اصلی زمین (عرصه کل)", defaultColor: "#15803d", defaultType: "POLYGON" },
  PROJECT_AREA: { title: "۲. محل اجرای طرح", defaultColor: "#1d4ed8", defaultType: "POLYGON" },
  GREENHOUSE:   { title: "۳. محدوده گلخانه / سالن تولیدی", defaultColor: "#059669", defaultType: "POLYGON" },
  FACILITY:     { title: "۴. ساختمان‌ها و تأسیسات", defaultColor: "#b45309", defaultType: "POLYGON" },
  ROAD:         { title: "۵. راه‌های دسترسی", defaultColor: "#475569", defaultType: "LINE" },
  WATER_SOURCE: { title: "۶. چاه آب و منابع آبی", defaultColor: "#0284c7", defaultType: "POINT" },
  FENCE:        { title: "۷. محل دیوارها یا حصارها", defaultColor: "#78350f", defaultType: "LINE" },
  SUBDIVISION:  { title: "۸. قطعات تفکیک‌شده زمین", defaultColor: "#7e22ce", defaultType: "POLYGON" },
  BUFFER:       { title: "۹. حریم‌ها و محدوده‌های قانونی", defaultColor: "#dc2626", defaultType: "LINE" },
  CUSTOM:       { title: "۱۰. سایر عوارض تعریف‌شده کاربر", defaultColor: "#0f766e", defaultType: "POLYGON" }
};

var activeCroquisMapId = "";
var activeCroquisLayerId = "";
var croquisViewMode = "CAD"; // CAD | MAP
var coordInputMode = "UTM"; // "UTM" | "GEO"
var leafletMapObj = null;
var leafletLayerGroupObj = null;
var leafletTileBase = null;

function parseSingleCoordinateLine(line, defaultZone, idx) {
  var clean = toEn((line || "").trim());
  if (!clean) return null;
  var p = clean.split(/[,،\s\t;]+/);
  var v1 = parseFloat(p[0]);
  var v2 = parseFloat(p[1]);
  if (isNaN(v1) || isNaN(v2)) return null;

  var elev = 1285;
  var zoneStr = defaultZone || "39R";
  var labelStr = "P" + (idx + 1);

  for (var k = 2; k < p.length; k++) {
    var tok = p[k].trim();
    if (!tok) continue;
    if (/^(3[789]|4[01])[A-Za-z]?$/i.test(tok)) {
      zoneStr = tok.toUpperCase();
      if (/^\d+$/.test(zoneStr)) zoneStr += "R";
    } else if (!isNaN(parseFloat(tok)) && isFinite(tok)) {
      elev = parseFloat(tok);
    } else {
      labelStr = tok;
    }
  }

  return createEnrichedPointFromInput(v1, v2, elev, zoneStr, labelStr);
}

function createEnrichedPointFromInput(v1, v2, elevVal, zoneStr, labelStr, forceMode) {
  var zClean = (zoneStr || "39R").toString().toUpperCase().trim();
  if (/^\d{2}$/.test(zClean)) zClean += "R";
  if (!/^\d{2}[A-Z]$/.test(zClean)) zClean = "39R";
  var zoneNum = parseInt(zClean, 10) || 39;
  var elev = (elevVal !== undefined && elevVal !== "" && !isNaN(parseFloat(toEn(String(elevVal)))))
    ? parseFloat(toEn(String(elevVal)))
    : 1285;

  var isGeoValues = (Math.abs(v1) <= 90 && Math.abs(v2) <= 180 && Math.abs(v1) < 100 && Math.abs(v2) < 100);
  if (forceMode === "GEO" || isGeoValues) {
    var lat = v2, lng = v1;
    // تشخیص خودکار جایگاه عرض (۲۴ تا ۴۲ درجه شمالی) و طول جغرافیایی (۴۴ تا ۶۴ درجه شرقی)
    if (v1 >= 24 && v1 <= 42 && v2 >= 44 && v2 <= 64) {
      lat = v1;
      lng = v2;
    } else if (v1 >= 44 && v1 <= 64 && v2 >= 24 && v2 <= 42) {
      lng = v1;
      lat = v2;
    }
    var utm = latLngToUtmWGS84(lat, lng, zoneNum);
    return {
      x: utm.x,
      y: utm.y,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      elev: elev,
      zone: zClean,
      label: labelStr || "P1"
    };
  } else {
    var x = Math.round(v1 * 100) / 100;
    var y = Math.round(v2 * 100) / 100;
    var geo = utmToLatLngWGS84(x, y, zoneNum, true);
    return {
      x: x,
      y: y,
      lat: Number(geo.lat.toFixed(6)),
      lng: Number(geo.lng.toFixed(6)),
      elev: elev,
      zone: zClean,
      label: labelStr || "P1"
    };
  }
}

function ensurePointEnriched(pt, defaultZone, idx) {
  if (!pt) return null;
  var defZ = defaultZone;
  var ptIdx = idx;
  if (typeof defaultZone === "number" && defaultZone < 35 && (typeof idx === "string" || (typeof idx === "number" && idx >= 35))) {
    defZ = idx;
    ptIdx = defaultZone;
  }
  var rawZone = (pt.zone || defZ || "39R").toString().toUpperCase().trim();
  var parsedZ = parseInt(rawZone, 10);
  if (isNaN(parsedZ) || parsedZ < 35 || parsedZ > 45) {
    var fallbackZ = parseInt(defZ, 10);
    parsedZ = (!isNaN(fallbackZ) && fallbackZ >= 35 && fallbackZ <= 45) ? fallbackZ : 39;
    rawZone = parsedZ + "R";
  } else if (/^\d{2}$/.test(rawZone)) {
    rawZone = parsedZ + "R";
  }
  var zoneNum = parsedZ;
  var elev = (pt.elev !== undefined && pt.elev !== "" && !isNaN(parseFloat(pt.elev))) ? parseFloat(pt.elev) : 1285;
  var x = parseFloat(pt.x);
  var y = parseFloat(pt.y);
  if (isNaN(x) || isNaN(y)) return pt;
  var geo = utmToLatLngWGS84(x, y, zoneNum, true);
  pt.lat = Number(geo.lat.toFixed(6));
  pt.lng = Number(geo.lng.toFixed(6));
  pt.elev = elev;
  pt.zone = rawZone;
  if (!pt.label) pt.label = "P" + ((typeof ptIdx === "number" ? ptIdx : 0) + 1);
  return pt;
}

function formatPointToLine(pt, mode) {
  ensurePointEnriched(pt, "39R", 0);
  if (mode === "GEO") {
    return pt.lng.toFixed(6) + "," + pt.lat.toFixed(6) + "," + pt.elev + "," + pt.zone;
  }
  return pt.x + "," + pt.y + "," + pt.elev + "," + pt.zone;
}

function parseActiveUtm() {
  var raw = (document.getElementById("c-utm") || {}).value || "";
  var c = getActiveCase();
  var defZone = (c && c.utmZone) ? c.utmZone : "39R";
  var lines = raw.trim().split("\n");
  var pts = [];
  for (var i = 0; i < lines.length; i++) {
    var pt = parseSingleCoordinateLine(lines[i], defZone, pts.length);
    if (pt) pts.push(pt);
  }
  return pts;
}

function computeUtmGeometry(pts, geomType) {
  var gType = geomType || "POLYGON";
  if (!pts || !pts.length) return { area: 0, ha: 0, perim: 0, sides: [] };
  if (gType === "POINT" || pts.length === 1) return { area: 0, ha: 0, perim: 0, sides: [] };

  if (gType === "LINE" || pts.length === 2) {
    var len = 0, lineSides = [];
    for (var l = 0; l < pts.length - 1; l++) {
      var dl = Math.sqrt(Math.pow(pts[l + 1].x - pts[l].x, 2) + Math.pow(pts[l + 1].y - pts[l].y, 2));
      len += dl;
      lineSides.push({ from: l + 1, to: l + 2, len: dl });
    }
    return { area: 0, ha: 0, perim: len, sides: lineSides };
  }

  var a2 = 0, perim = 0, sides = [];
  for (var i = 0; i < pts.length; i++) {
    var j = (i + 1) % pts.length;
    a2 += (pts[i].x * pts[j].y) - (pts[j].x * pts[i].y);
    var d = Math.sqrt(Math.pow(pts[j].x - pts[i].x, 2) + Math.pow(pts[j].y - pts[i].y, 2));
    perim += d;
    sides.push({ from: i + 1, to: j + 1, len: d });
  }
  var area = Math.abs(a2) / 2.0;
  return { area: area, ha: area / 10000.0, perim: perim, sides: sides };
}

/* فرمول دقیق ژئودتیک WGS84 برای تبدیل UTM به عرض و طول جغرافیایی (Lat/Lng) و بالعکس */
function utmToLatLngWGS84(easting, northing, zoneNum, isNorthHemisphere) {
  var zone = parseInt(zoneNum, 10) || 39;
  var a = 6378137.0;
  var eccSquared = 0.00669438;
  var k0 = 0.9996;
  var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
  var x = easting - 500000.0;
  var y = isNorthHemisphere !== false ? northing : (northing - 10000000.0);
  var LongOrigin = (zone - 1) * 6 - 180 + 3;
  var eccPrimeSquared = eccSquared / (1 - eccSquared);
  var M = y / k0;
  var mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * Math.pow(eccSquared, 3) / 256));
  var phi1Rad = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) +
    (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
    (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);
  var N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  var T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  var C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  var R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  var D = x / (N1 * k0);
  var lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * Math.pow(D, 4) / 24);
  var lon = (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(phi1Rad);
  return { lat: lat * 180 / Math.PI, lng: LongOrigin + (lon * 180 / Math.PI) };
}

function latLngToUtmWGS84(lat, lon, forcedZone) {
  var zone = forcedZone || (Math.floor((lon + 180) / 6) + 1);
  var a = 6378137.0;
  var eccSquared = 0.00669438;
  var k0 = 0.9996;
  var LongOrigin = (zone - 1) * 6 - 180 + 3;
  var eccPrimeSquared = eccSquared / (1 - eccSquared);
  var latRad = lat * Math.PI / 180.0;
  var lonRad = lon * Math.PI / 180.0;
  var LongOriginRad = LongOrigin * Math.PI / 180.0;
  var N = a / Math.sqrt(1 - eccSquared * Math.sin(latRad) * Math.sin(latRad));
  var T = Math.tan(latRad) * Math.tan(latRad);
  var C = eccPrimeSquared * Math.cos(latRad) * Math.cos(latRad);
  var A = Math.cos(latRad) * (lonRad - LongOriginRad);
  var M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * Math.pow(eccSquared, 3) / 256) * latRad -
    (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(2 * latRad) +
    (15 * eccSquared * eccSquared / 256 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(4 * latRad));
  var x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * Math.pow(A, 5) / 120) + 500000.0;
  var y = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24));
  return { x: Math.round(x), y: Math.round(y), zone: zone };
}

/* اعتبارسنجی پیشرفته مختصات UTM و تشخیص نقاط خارج از محدوده زمین اصلی */
function validateUtmLayerPoints(points, geomType, zoneStr) {
  var errors = [];
  var warnings = [];
  var gType = geomType || "POLYGON";
  if (gType === "POLYGON" && points.length < 3) {
    errors.push("برای تشکیل چندضلعی (Polygon) حداقل ۳ نقطه مختصات الزامی است (تعداد فعلی: " + toFa(points.length) + ").");
  } else if (gType === "LINE" && points.length < 2) {
    errors.push("برای ترسیم خط/مسیر حداقل ۲ نقطه الزامی است.");
  } else if (points.length === 0) {
    errors.push("هنوز هیچ نقطه مختصاتی برای این لایه ثبت نشده است.");
  }

  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    if (isNaN(pt.x) || isNaN(pt.y)) {
      errors.push("نقطه ردیف " + toFa(i + 1) + ": مقادیر X یا Y عدد معتبر نیستند.");
      continue;
    }
    if (pt.x < 100000 || pt.x > 900000) {
      errors.push("نقطه " + (pt.label || toFa(i + 1)) + ": مؤلفه شرقی (X=" + toFa(pt.x) + ") خارج از بازه مجاز UTM (۱۰۰,۰۰۰ تا ۹۰۰,۰۰۰ متر) است.");
    }
    if (pt.y < 2400000 || pt.y > 4600000) {
      errors.push("نقطه " + (pt.label || toFa(i + 1)) + ": مؤلفه شمالی (Y=" + toFa(pt.y) + ") خارج از محدوده جغرافیایی ایران (۲,۴۰۰,۰۰۰ تا ۴,۶۰۰,۰۰۰ متر) است.");
    }
    if (i > 0) {
      var d = Math.sqrt(Math.pow(pt.x - points[i - 1].x, 2) + Math.pow(pt.y - points[i - 1].y, 2));
      if (d < 0.05) warnings.push("نقاط ردیف " + toFa(i) + " و " + toFa(i + 1) + " تکراری و منطبق بر هم هستند.");
      if (d > 15000) warnings.push("فاصله بین نقطه " + toFa(i) + " و " + toFa(i + 1) + " بیش از ۱۵ کیلومتر است (احتمال ترکیب مختصات از زون‌های متفاوت یا خطای تایپی).");
    }
  }
  return { valid: errors.length === 0, errors: errors, warnings: warnings };
}

function isPointInPolygon2D(pt, poly) {
  if (!poly || poly.length < 3) return true;
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var xi = poly[i].x, yi = poly[i].y;
    var xj = poly[j].x, yj = poly[j].y;
    var intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / ((yj - yi) || 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/* مدیریت نقشه‌ها و لایه‌های کروکی پرونده فعال */
function getActiveCroquisMap() {
  var c = getActiveCase();
  if (!c) return null;
  if (!Array.isArray(c.croquisMaps)) c.croquisMaps = [];
  if (c.croquisMaps.length === 0) {
    var initPts = parseActiveUtm();
    c.croquisMaps.push({
      id: "MAP-" + c.id + "-" + new Date().getTime(),
      title: "کروکی مهندسی زمین (" + (c.project || "طرح متقاضی") + ")",
      date: todayShamsi(),
      utmZone: c.utmZone || "39R",
      hemisphere: "N",
      notes: "کروکی اختصاصی پرونده " + c.name,
      layers: [
        {
          id: "LYR-MAIN-" + new Date().getTime(),
          name: "۱. محدوده اصلی زمین (عرصه کل)",
          category: "MAIN_PARCEL",
          geomType: "POLYGON",
          color: "#15803d",
          fillColor: "#22c55e",
          fillOpacity: 0.18,
          strokeWidth: 3,
          visible: true,
          order: 1,
          desc: "مرز اصلی زمین متقاضی",
          points: initPts
        }
      ]
    });
  }
  for (var i = 0; i < c.croquisMaps.length; i++) {
    if (c.croquisMaps[i].id === activeCroquisMapId) return c.croquisMaps[i];
  }
  activeCroquisMapId = c.croquisMaps[0].id;
  return c.croquisMaps[0];
}

function getActiveCroquisLayer() {
  var m = getActiveCroquisMap();
  if (!m || !Array.isArray(m.layers) || !m.layers.length) return null;
  for (var i = 0; i < m.layers.length; i++) {
    if (m.layers[i].id === activeCroquisLayerId) return m.layers[i];
  }
  activeCroquisLayerId = m.layers[0].id;
  return m.layers[0];
}

window.initCroquisWorkspaceForActiveCase = function() {
  var c = getActiveCase();
  if (!c) return;
  var m = getActiveCroquisMap();
  if (!m) return;
  var mapSel = document.getElementById("crq-map-select");
  if (mapSel) {
    var mHtml = "";
    var maps = Array.isArray(c.croquisMaps) ? c.croquisMaps : [];
    for (var i = 0; i < maps.length; i++) {
      var mp = maps[i] || {};
      mHtml += '<option value="' + safeHtmlText(mp.id) + '" ' + (mp.id === m.id ? "selected" : "") + '>' +
        safeHtmlText(mp.title) + ' (' + safeHtmlText(toFa(mp.date)) + ')</option>';
    }
    mapSel.innerHTML = mHtml;
  }
  var zoneSel = document.getElementById("crq-zone-select");
  if (zoneSel) zoneSel.value = /^(38R|39R|40R|41R)$/.test(m.utmZone || "") ? m.utmZone : "39R";
  var notesEl = document.getElementById("crq-map-notes");
  if (notesEl) notesEl.value = m.notes || "";
  renderCroquisLayersList();
  loadActiveLayerIntoEditor();
  renderCroquisVisualCanvas();
};

function selectCroquisMapById(mapId) {
  activeCroquisMapId = mapId;
  activeCroquisLayerId = "";
  window.initCroquisWorkspaceForActiveCase();
}

function createNewCroquisMapForCase() {
  var c = requireActiveCase("ایجاد نقشه کروکی جدید برای پرونده");
  if (!c) return;
  var title = prompt("عنوان نقشه کروکی جدید را وارد نمایید:", "نقشه جانمایی طرح و تأسیسات - " + c.name);
  if (!title || !title.trim()) return;
  var newMap = {
    id: "MAP-" + new Date().getTime(),
    title: title.trim(),
    date: todayShamsi(),
    utmZone: "39R",
    hemisphere: "N",
    notes: "تهیه‌شده در مرکز خدمات ۶۳۶ خفر",
    layers: [
      {
        id: "LYR-" + new Date().getTime() + "-1",
        name: "۱. محدوده اصلی زمین",
        category: "MAIN_PARCEL",
        geomType: "POLYGON",
        color: "#15803d",
        fillColor: "#22c55e",
        fillOpacity: 0.18,
        strokeWidth: 3,
        visible: true,
        order: 1,
        desc: "مرز اصلی زمین",
        points: parseActiveUtm()
      }
    ]
  };
  c.croquisMaps.unshift(newMap);
  activeCroquisMapId = newMap.id;
  activeCroquisLayerId = newMap.layers[0].id;
  logCaseAction(c, "ایجاد نقشه کروکی جدید: " + newMap.title);
  saveAllDB();
  window.initCroquisWorkspaceForActiveCase();
  showToastMsg("نقشه کروکی جدید در پرونده «" + c.name + "» ایجاد شد.");
}

function loadSample10HectareGreenhouseMap() {
  var c = requireActiveCase("بارگذاری الگوی زمین ۱۰ هکتاری و طرح ۱ هکتاری");
  if (!c) return;
  var sampleMap = JSON.parse(JSON.stringify(DEFAULT_UNIFIED_CASES[0].croquisMaps[0]));
  sampleMap.id = "MAP-10HA-" + new Date().getTime();
  sampleMap.title = "کروکی چندلایه زمین ۱۰ هکتاری + طرح گلخانه ۱ هکتاری (" + c.name + ")";
  sampleMap.date = todayShamsi();
  c.croquisMaps.unshift(sampleMap);
  activeCroquisMapId = sampleMap.id;
  activeCroquisLayerId = sampleMap.layers[0].id;
  logCaseAction(c, "ایجاد کروکی نمونه چندلایه (۱۰ هکتار عرصه کل + ۱ هکتار محل اجرای طرح)");
  saveAllDB();
  window.initCroquisWorkspaceForActiveCase();
  showToastMsg("کروکی نمونه ۵ لایه (۱۰ هکتار زمین + ۱ هکتار گلخانه + تأسیسات + راه + چاه) بارگذاری شد.");
}

function editCurrentCroquisMapMeta() {
  var m = getActiveCroquisMap();
  if (!m) return;
  var newTitle = prompt("عنوان جدید نقشه کروکی:", m.title);
  if (newTitle && newTitle.trim()) m.title = newTitle.trim();
  var notesEl = document.getElementById("crq-map-notes");
  if (notesEl) m.notes = notesEl.value.trim();
  var zoneEl = document.getElementById("crq-zone-select");
  if (zoneEl) m.utmZone = zoneEl.value;
  saveAllDB();
  window.initCroquisWorkspaceForActiveCase();
  showToastMsg("مشخصات نقشه کروکی به‌روزرسانی شد.");
}

function deleteCurrentCroquisMap() {
  var c = getActiveCase();
  var m = getActiveCroquisMap();
  if (!c || !m) return;
  if (c.croquisMaps.length <= 1) {
    alert("حداقل یک نقشه کروکی باید در پرونده باقی بماند.");
    return;
  }
  if (!confirm("آیا از حذف نقشه «" + m.title + "» اطمینان دارید؟")) return;
  c.croquisMaps = c.croquisMaps.filter(function(x) { return x.id !== m.id; });
  activeCroquisMapId = c.croquisMaps[0].id;
  activeCroquisLayerId = "";
  saveAllDB();
  window.initCroquisWorkspaceForActiveCase();
}

function renderCroquisLayersList() {
  var m = getActiveCroquisMap();
  var holder = document.getElementById("crq-layers-list-holder");
  if (!m || !holder) return;
  var mainArea = 0, projArea = 0;
  var mainPoly = null;
  var outsideWarnings = [];

  for (var i = 0; i < m.layers.length; i++) {
    var lyr = m.layers[i];
    if (!lyr || !Array.isArray(lyr.points)) continue;
    var g = computeUtmGeometry(lyr.points, lyr.geomType);
    lyr._calcArea = g.area;
    lyr._calcPerim = g.perim;
    if (lyr.category === "MAIN_PARCEL" && g.area > 0) {
      mainArea += g.area;
      mainPoly = lyr.points;
    } else if (lyr.geomType === "POLYGON" && g.area > 0) projArea += g.area;
  }

  if (mainPoly && mainPoly.length >= 3) {
    for (var j = 0; j < m.layers.length; j++) {
      var sub = m.layers[j];
      if (!sub || sub.category === "MAIN_PARCEL" || !sub.visible || !Array.isArray(sub.points) || !sub.points.length) continue;
      var outCnt = 0;
      for (var p = 0; p < sub.points.length; p++) {
        if (!isPointInPolygon2D(sub.points[p], mainPoly)) outCnt++;
      }
      if (outCnt > 0) outsideWarnings.push("⚠️ هشدار هندسی: تعداد " + toFa(outCnt) + " نقطه از لایه «" + String(sub.name || "") + "» خارج از مرز محدوده اصلی زمین قرار گرفته است!");
    }
    if (projArea > mainArea && mainArea > 0) outsideWarnings.push("⚠️ خطای مساحت: مجموع مساحت طرح‌ها و ابنیه داخلی (" + toFa(Math.round(projArea)) + " م.م) از مساحت کل زمین اصلی (" + toFa(Math.round(mainArea)) + " م.م) بیشتر است!");
  }

  var warnBox = document.getElementById("crq-containment-warning-box");
  if (warnBox) {
    if (outsideWarnings.length) {
      warnBox.style.display = "block";
      warnBox.className = "alert alert-danger py-2 px-3 small fw-bold mb-2";
      warnBox.innerHTML = outsideWarnings.map(safeHtmlText).join("<br>");
    } else if (mainArea > 0 && projArea > 0) {
      warnBox.style.display = "block";
      warnBox.className = "alert alert-success py-2 px-3 small fw-bold mb-2";
      warnBox.textContent = "✅ کنترل فضایی: محدوده طرح داخلی (" + toFa(Math.round(projArea)) + " مترمربع / " + toFa((projArea / 10000).toFixed(2)) + " هکتار) کاملاً در داخل محدوده زمین اصلی (" + toFa(Math.round(mainArea)) + " مترمربع / " + toFa((mainArea / 10000).toFixed(2)) + " هکتار) قرار دارد.";
    } else {
      warnBox.style.display = "none";
      warnBox.textContent = "";
    }
  }

  var kpiMain = document.getElementById("crq-kpi-main-area");
  var kpiProj = document.getElementById("crq-kpi-proj-area");
  if (kpiMain) kpiMain.textContent = toFa(Math.round(mainArea)) + " م.م (" + toFa((mainArea / 10000).toFixed(2)) + " هکتار)";
  if (kpiProj) kpiProj.textContent = toFa(Math.round(projArea)) + " م.م (" + toFa((projArea / 10000).toFixed(2)) + " هکتار)";

  var html = "";
  for (var k = 0; k < m.layers.length; k++) {
    var layer = m.layers[k] || {};
    var selected = layer.id === activeCroquisLayerId;
    var typeBadge = layer.geomType === "POLYGON" ? "چندضلعی" : (layer.geomType === "LINE" ? "خط/مسیر" : "نقطه");
    var metricTxt = layer.geomType === "POLYGON"
      ? ("مساحت: " + toFa(Math.round(layer._calcArea || 0)) + " م.م (" + toFa(((layer._calcArea || 0) / 10000).toFixed(2)) + " هـ)")
      : (layer.geomType === "LINE" ? ("طول: " + toFa(Math.round(layer._calcPerim || 0)) + " متر") : (toFa((layer.points || []).length) + " نقطه"));
    var safeId = safeHtmlText(layer.id);
    var safeColor = safeHexColor(layer.color, "#15803d");
    html += '<div class="p-2 mb-2 rounded border ' + (selected ? 'border-success border-2 bg-success-subtle' : 'bg-white') + '" data-layer-select="' + safeId + '" style="cursor:pointer;">' +
      '<div class="d-flex justify-content-between align-items-center">' +
        '<div class="d-flex align-items-center gap-2">' +
          '<span style="width:16px;height:16px;border-radius:4px;background:' + safeColor + ';display:inline-block;border:1px solid #000;"></span>' +
          '<b class="small">' + safeHtmlText(layer.name) + '</b>' +
        '</div>' +
        '<div class="d-flex gap-1">' +
          '<button type="button" class="btn btn-sm btn-light border py-0 px-1" title="نمایش / مخفی کردن لایه" data-layer-action="toggle" data-layer-id="' + safeId + '">' + (layer.visible ? '👁️' : '🚫') + '</button>' +
          '<button type="button" class="btn btn-sm btn-light border py-0 px-1" title="بالا" data-layer-action="up" data-layer-index="' + k + '">▲</button>' +
          '<button type="button" class="btn btn-sm btn-light border py-0 px-1" title="پایین" data-layer-action="down" data-layer-index="' + k + '">▼</button>' +
          '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" title="حذف لایه" data-layer-action="delete" data-layer-id="' + safeId + '">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="d-flex justify-content-between align-items-center mt-1 small text-muted">' +
        '<span><span class="badge bg-secondary">' + typeBadge + '</span> | ' + safeHtmlText(toFa((layer.points || []).length)) + ' رأس</span>' +
        '<span class="fw-bold text-dark">' + safeHtmlText(metricTxt) + '</span>' +
      '</div>' +
    '</div>';
  }
  holder.innerHTML = html;

  if (!holder.dataset.secureLayerActionsBound) {
    holder.dataset.secureLayerActionsBound = "1";
    holder.addEventListener("click", function (event) {
      var actionBtn = event.target.closest("button[data-layer-action]");
      if (actionBtn && holder.contains(actionBtn)) {
        event.stopPropagation();
        var action = actionBtn.getAttribute("data-layer-action");
        var id = actionBtn.getAttribute("data-layer-id");
        var idx = parseInt(actionBtn.getAttribute("data-layer-index"), 10);
        var activeMap = getActiveCroquisMap();
        if (!activeMap || !Array.isArray(activeMap.layers)) return;
        if (action === "toggle" || action === "delete") {
          if (!activeMap.layers.some(function (item) { return item && String(item.id) === id; })) return;
          if (action === "toggle") toggleCroquisLayerVisible(id);
          else deleteCroquisLayer(id);
        } else if ((action === "up" || action === "down") && Number.isInteger(idx) && idx >= 0 && idx < activeMap.layers.length) {
          moveCroquisLayerOrder(idx, action === "up" ? -1 : 1);
        }
        return;
      }
      var card = event.target.closest("[data-layer-select]");
      if (!card || !holder.contains(card)) return;
      var selectedId = card.getAttribute("data-layer-select");
      var activeMap = getActiveCroquisMap();
      if (activeMap && activeMap.layers.some(function (item) { return item && String(item.id) === selectedId; })) selectCroquisLayer(selectedId);
    });
  }
}

function selectCroquisLayer(layerId) {
  activeCroquisLayerId = layerId;
  renderCroquisLayersList();
  loadActiveLayerIntoEditor();
}

function toggleCroquisLayerVisible(layerId) {
  var m = getActiveCroquisMap();
  if (!m) return;
  for (var i = 0; i < m.layers.length; i++) {
    if (m.layers[i].id === layerId) {
      m.layers[i].visible = !m.layers[i].visible;
      break;
    }
  }
  saveAllDB();
  renderCroquisLayersList();
  renderCroquisVisualCanvas();
}

function moveCroquisLayerOrder(idx, dir) {
  var m = getActiveCroquisMap();
  if (!m) return;
  var targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= m.layers.length) return;
  var tmp = m.layers[idx];
  m.layers[idx] = m.layers[targetIdx];
  m.layers[targetIdx] = tmp;
  saveAllDB();
  renderCroquisLayersList();
  renderCroquisVisualCanvas();
}

function addNewLayerToCroquisMap() {
  var m = getActiveCroquisMap();
  if (!m) return;
  var catKey = (document.getElementById("new-lyr-cat") || {}).value || "PROJECT_AREA";
  var meta = LAYER_CATEGORY_META[catKey] || LAYER_CATEGORY_META.CUSTOM;
  var customName = (document.getElementById("new-lyr-name") || {}).value.trim() || meta.title;
  var gType = (document.getElementById("new-lyr-type") || {}).value || meta.defaultType;
  var col = (document.getElementById("new-lyr-color") || {}).value || meta.defaultColor;

  var newLyr = {
    id: "LYR-" + new Date().getTime(),
    name: customName,
    category: catKey,
    geomType: gType,
    color: col,
    fillColor: col,
    fillOpacity: gType === "POLYGON" ? 0.28 : 0,
    strokeWidth: 2.5,
    visible: true,
    order: m.layers.length + 1,
    desc: "",
    points: []
  };
  m.layers.push(newLyr);
  activeCroquisLayerId = newLyr.id;
  if (document.getElementById("new-lyr-name")) document.getElementById("new-lyr-name").value = "";
  saveAllDB();
  renderCroquisLayersList();
  loadActiveLayerIntoEditor();
  renderCroquisVisualCanvas();
  showToastMsg("لایه جدید «" + newLyr.name + "» به نقشه اضافه شد.");
}

function deleteCroquisLayer(layerId) {
  var m = getActiveCroquisMap();
  if (!m) return;
  if (m.layers.length <= 1) {
    alert("حداقل یک لایه باید در نقشه وجود داشته باشد.");
    return;
  }
  if (!confirm("آیا از حذف این لایه از نقشه کروکی اطمینان دارید؟")) return;
  m.layers = m.layers.filter(function(x) { return x.id !== layerId; });
  activeCroquisLayerId = m.layers[0].id;
  saveAllDB();
  renderCroquisLayersList();
  loadActiveLayerIntoEditor();
  renderCroquisVisualCanvas();
}

/* تغییر حالت ورود و نمایش مختصات در سراسر سامانه: UTM (X,Y,ارتفاع,Zone) یا جغرافیایی (طول و عرض جغرافیایی Lat/Lng,ارتفاع,Zone) */
window.setCoordInputMode = function(mode) {
  coordInputMode = (mode === "GEO") ? "GEO" : "UTM";
  var isGeo = coordInputMode === "GEO";

  // ۱. بروزرسانی دکمه‌های تغییر حالت در فرم پرونده و کروکی
  var btnCaseUtm = document.getElementById("btn-case-coord-utm");
  var btnCaseGeo = document.getElementById("btn-case-coord-geo");
  if (btnCaseUtm) btnCaseUtm.className = "btn btn-sm fw-bold py-0 px-2 " + (!isGeo ? "btn-success" : "btn-outline-success");
  if (btnCaseGeo) btnCaseGeo.className = "btn btn-sm fw-bold py-0 px-2 " + (isGeo ? "btn-success" : "btn-outline-success");

  var btnCrqUtm = document.getElementById("btn-crq-coord-utm");
  var btnCrqGeo = document.getElementById("btn-crq-coord-geo");
  if (btnCrqUtm) btnCrqUtm.className = "btn btn-sm fw-bold py-0 px-2 " + (!isGeo ? "btn-success" : "btn-outline-success");
  if (btnCrqGeo) btnCrqGeo.className = "btn btn-sm fw-bold py-0 px-2 " + (isGeo ? "btn-success" : "btn-outline-success");

  // ۲. بروزرسانی عناوین و راهنمای کادرهای ورودی در فرم پرونده (#pane-cases)
  var lblCaseX = document.getElementById("lbl-case-pt-x");
  var lblCaseY = document.getElementById("lbl-case-pt-y");
  var inpCaseX = document.getElementById("case-pt-x");
  var inpCaseY = document.getElementById("case-pt-y");
  var thCaseX = document.getElementById("th-case-pt-x");
  var thCaseY = document.getElementById("th-case-pt-y");
  var lblBulkCase = document.getElementById("lbl-c-utm-bulk");

  if (lblCaseX) lblCaseX.textContent = isGeo ? "طول جغرافیایی (Lng - E):" : "X (شرقی - متر):";
  if (lblCaseY) lblCaseY.textContent = isGeo ? "عرض جغرافیایی (Lat - N):" : "Y (شمالی - متر):";
  if (inpCaseX) inpCaseX.placeholder = isGeo ? "53.2045" : "702150";
  if (inpCaseY) inpCaseY.placeholder = isGeo ? "28.9712" : "3208450";
  if (thCaseX) thCaseX.textContent = isGeo ? "طول جغرافیایی (Lng)" : "X (شرقی)";
  if (thCaseY) thCaseY.textContent = isGeo ? "عرض جغرافیایی (Lat)" : "Y (شمالی)";
  if (lblBulkCase) {
    lblBulkCase.textContent = isGeo
      ? "متن دسته‌ای نقاط (هر سطر: Lng,Lat,ارتفاع,Zone):"
      : "متن دسته‌ای نقاط (هر سطر: X,Y,ارتفاع,Zone):";
  }

  // ۳. بروزرسانی عناوین و راهنمای کادرهای ورودی در بخش کروکی (#pane-croquis)
  var lblCrqX = document.getElementById("lbl-new-pt-x");
  var lblCrqY = document.getElementById("lbl-new-pt-y");
  var inpCrqX = document.getElementById("new-pt-x");
  var inpCrqY = document.getElementById("new-pt-y");
  var thCrqX = document.getElementById("th-crq-pt-x");
  var thCrqY = document.getElementById("th-crq-pt-y");
  var lblBulkCrq = document.getElementById("lbl-edit-lyr-bulk-utm");

  if (lblCrqX) lblCrqX.textContent = isGeo ? "طول جغرافیایی (Lng - E):" : "X (شرقی - متر):";
  if (lblCrqY) lblCrqY.textContent = isGeo ? "عرض جغرافیایی (Lat - N):" : "Y (شمالی - متر):";
  if (inpCrqX) inpCrqX.placeholder = isGeo ? "53.2045" : "702150";
  if (inpCrqY) inpCrqY.placeholder = isGeo ? "28.9712" : "3208450";
  if (thCrqX) thCrqX.textContent = isGeo ? "طول جغرافیایی (Lng - درجه)" : "X (شرقی - متر)";
  if (thCrqY) thCrqY.textContent = isGeo ? "عرض جغرافیایی (Lat - درجه)" : "Y (شمالی - متر)";
  if (lblBulkCrq) {
    lblBulkCrq.textContent = isGeo
      ? "ورود دسته‌ای نقاط لایه (هر خط: Lng,Lat,ارتفاع,Zone):"
      : "ورود دسته‌ای نقاط لایه (هر خط: X,Y,ارتفاع,Zone):";
  }

  renderCaseSegmentedPointsTable();
  loadActiveLayerIntoEditor();
  if (typeof showToastMsg === "function") {
    showToastMsg(isGeo
      ? "🌐 حالت ورود و نمایش بر اساس «طول و عرض جغرافیایی (Lat / Lng) + ارتفاع + Zone» فعال شد."
      : "📐 حالت ورود و نمایش بر اساس «مختصات متریک UTM (X, Y) + ارتفاع + Zone» فعال شد.");
  }
};

/* مدیریت جدول بخش‌بندی‌شده نقاط در فرم پرونده متقاضی (#pane-cases) */
window.renderCaseSegmentedPointsTable = function() {
  var tbody = document.getElementById("case-segmented-points-tbody");
  if (!tbody) return;
  var pts = parseActiveUtm();
  var isGeo = coordInputMode === "GEO";
  var c = getActiveCase();
  var defZone = (c && c.utmZone) ? c.utmZone : "39R";
  var html = "";

  for (var i = 0; i < pts.length; i++) {
    var pt = ensurePointEnriched(pts[i], defZone, i);
    var valX = Number(isGeo ? pt.lng : pt.x);
    var valY = Number(isGeo ? pt.lat : pt.y);
    var elev = Number(pt.elev !== undefined ? pt.elev : 1285);
    var safeX = Number.isFinite(valX) ? String(valX) : "";
    var safeY = Number.isFinite(valY) ? String(valY) : "";
    var safeElev = Number.isFinite(elev) ? String(elev) : "1285";
    var fieldX = isGeo ? "lng" : "x";
    var fieldY = isGeo ? "lat" : "y";
    var zVal = /^(38R|39R|40R|41R)$/.test(pt.zone || "") ? pt.zone : (defZone || "39R");
    var safeIndex = String(i);

    html += '<tr>' +
      '<td class="fw-bold">' + safeHtmlText(toFa(i + 1)) + '</td>' +
      '<td><input type="text" class="form-control form-control-sm text-center fw-bold py-0" style="min-width:48px;" value="' + safeHtmlText(pt.label || ("P" + (i + 1))) + '" onchange="updateCaseFormPoint(' + safeIndex + ',\'label\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:95px;" value="' + safeX + '" onchange="updateCaseFormPoint(' + safeIndex + ',\'' + fieldX + '\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:95px;" value="' + safeY + '" onchange="updateCaseFormPoint(' + safeIndex + ',\'' + fieldY + '\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:68px;" value="' + safeElev + '" onchange="updateCaseFormPoint(' + safeIndex + ',\'elev\',this.value)"></td>' +
      '<td><select class="form-select form-select-sm text-center py-0 px-1 fw-bold" style="min-width:72px;" onchange="updateCaseFormPoint(' + safeIndex + ',\'zone\',this.value)">' +
        '<option value="38R" ' + (zVal === "38R" ? "selected" : "") + '>38R</option>' +
        '<option value="39R" ' + (zVal === "39R" ? "selected" : "") + '>39R</option>' +
        '<option value="40R" ' + (zVal === "40R" ? "selected" : "") + '>40R</option>' +
        '<option value="41R" ' + (zVal === "41R" ? "selected" : "") + '>41R</option>' +
      '</select></td>' +
      '<td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" onclick="removeCaseFormPoint(' + safeIndex + ')">🗑️</button></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="7" class="text-center text-muted py-2">نقطه‌ای ثبت نشده است. از ردیف بالا نقطه جدید اضافه کنید.</td></tr>';

  var badge = document.getElementById("utm-geometry-badge");
  if (badge && pts.length >= 3) {
    var g = computeUtmGeometry(pts, "POLYGON");
    badge.textContent = "مساحت هندسی: " + toFa(Math.round(g.area)) + " م.م (" + toFa(g.ha.toFixed(2)) + " هکتار) | محیط: " + toFa(g.perim.toFixed(1)) + " متر";
  }
};

function writePointsToCaseFormAndSyncCroquis(pts) {
  var c = getActiveCase();
  var ta = document.getElementById("c-utm");
  var lines = [];
  for (var i = 0; i < pts.length; i++) {
    ensurePointEnriched(pts[i], (c && c.utmZone) || "39R", i);
    lines.push(pts[i].x + "," + pts[i].y + "," + pts[i].elev + "," + pts[i].zone);
  }
  var joined = lines.join("\n");
  if (ta) ta.value = joined;
  if (c) {
    c.utm = joined;
    if (pts[0] && pts[0].zone) c.utmZone = pts[0].zone;
    var m = getActiveCroquisMap();
    if (m && Array.isArray(m.layers)) {
      for (var k = 0; k < m.layers.length; k++) {
        if (m.layers[k].category === "MAIN_PARCEL") {
          m.layers[k].points = JSON.parse(JSON.stringify(pts));
          break;
        }
      }
    }
    saveAllDB();
  }
  renderCaseSegmentedPointsTable();
}

window.addPointToCaseFormTable = function() {
  var xEl = document.getElementById("case-pt-x");
  var yEl = document.getElementById("case-pt-y");
  var elevEl = document.getElementById("case-pt-elev");
  var zoneEl = document.getElementById("case-pt-zone");
  var lblEl = document.getElementById("case-pt-label");
  if (!xEl || !yEl) return;

  var v1 = parseFloat(toEn(xEl.value));
  var v2 = parseFloat(toEn(yEl.value));
  if (isNaN(v1) || isNaN(v2)) {
    alert(coordInputMode === "GEO"
      ? "لطفاً طول جغرافیایی (Lng) و عرض جغرافیایی (Lat) را به صورت عدد معتبر وارد نمایید."
      : "لطفاً مختصات شرقی (X) و شمالی (Y) را به صورت عدد معتبر وارد نمایید.");
    return;
  }
  var pts = parseActiveUtm();
  var lbl = (lblEl && lblEl.value.trim()) ? lblEl.value.trim() : ("P" + (pts.length + 1));
  var elev = elevEl ? elevEl.value : 1285;
  var zone = zoneEl ? zoneEl.value : "39R";

  var newPt = createEnrichedPointFromInput(v1, v2, elev, zone, lbl, coordInputMode);
  pts.push(newPt);
  xEl.value = "";
  yEl.value = "";
  if (lblEl) lblEl.value = "";
  writePointsToCaseFormAndSyncCroquis(pts);
  showToastMsg("نقطه «" + newPt.label + "» (X=" + toFa(newPt.x) + ", Y=" + toFa(newPt.y) + ", ارتفاع=" + toFa(newPt.elev) + ", Zone=" + newPt.zone + ") اضافه شد.");
};

window.updateCaseFormPoint = function(idx, field, val) {
  var pts = parseActiveUtm();
  if (!pts[idx]) return;
  var pt = ensurePointEnriched(pts[idx], "39R", idx);
  if (field === "label") {
    pt.label = val.trim();
  } else if (field === "elev") {
    pt.elev = parseFloat(toEn(val)) || 0;
  } else if (field === "zone") {
    pt.zone = val.trim().toUpperCase();
    ensurePointEnriched(pt, pt.zone, idx);
  } else if (field === "lng" || field === "lat") {
    var num = parseFloat(toEn(val));
    if (!isNaN(num)) {
      if (field === "lng") pt.lng = num;
      if (field === "lat") pt.lat = num;
      var u = latLngToUtmWGS84(pt.lat, pt.lng, parseInt(pt.zone, 10) || 39);
      pt.x = u.x;
      pt.y = u.y;
    }
  } else {
    pt[field] = parseFloat(toEn(val)) || 0;
    ensurePointEnriched(pt, pt.zone, idx);
  }
  writePointsToCaseFormAndSyncCroquis(pts);
};

window.removeCaseFormPoint = function(idx) {
  var pts = parseActiveUtm();
  if (!pts[idx]) return;
  pts.splice(idx, 1);
  writePointsToCaseFormAndSyncCroquis(pts);
};

window.syncCaseTextareaToPointsTable = function() {
  renderCaseSegmentedPointsTable();
};

function loadActiveLayerIntoEditor() {
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  if (!l) return;
  if (document.getElementById("edit-lyr-name")) document.getElementById("edit-lyr-name").value = l.name || "";
  if (document.getElementById("edit-lyr-cat")) document.getElementById("edit-lyr-cat").value = l.category || "CUSTOM";
  if (document.getElementById("edit-lyr-type")) document.getElementById("edit-lyr-type").value = l.geomType || "POLYGON";
  if (document.getElementById("edit-lyr-color")) document.getElementById("edit-lyr-color").value = l.color || "#15803d";
  if (document.getElementById("edit-lyr-width")) document.getElementById("edit-lyr-width").value = l.strokeWidth || 2.5;
  if (document.getElementById("edit-lyr-desc")) document.getElementById("edit-lyr-desc").value = l.desc || "";

  var defZone = (m && m.utmZone) ? m.utmZone : "39R";
  if (document.getElementById("new-pt-zone")) {
    document.getElementById("new-pt-zone").value = defZone;
  }

  var rawLines = [];
  for (var i = 0; i < l.points.length; i++) {
    ensurePointEnriched(l.points[i], defZone, i);
    rawLines.push(formatPointToLine(l.points[i], coordInputMode));
  }
  if (document.getElementById("edit-lyr-bulk-utm")) {
    document.getElementById("edit-lyr-bulk-utm").value = rawLines.join("\n");
  }

  renderActiveLayerPointsTable();
  renderCaseSegmentedPointsTable();
}

function saveActiveLayerStyleAndMeta() {
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  if (!l) return;
  if (document.getElementById("edit-lyr-name")) l.name = document.getElementById("edit-lyr-name").value.trim() || l.name;
  if (document.getElementById("edit-lyr-cat")) l.category = document.getElementById("edit-lyr-cat").value;
  if (document.getElementById("edit-lyr-type")) l.geomType = document.getElementById("edit-lyr-type").value;
  if (document.getElementById("edit-lyr-color")) {
    l.color = document.getElementById("edit-lyr-color").value;
    l.fillColor = l.color;
  }
  if (document.getElementById("edit-lyr-width")) l.strokeWidth = parseFloat(document.getElementById("edit-lyr-width").value) || 2.5;
  if (document.getElementById("edit-lyr-desc")) l.desc = document.getElementById("edit-lyr-desc").value.trim();

  var defZone = (m && m.utmZone) ? m.utmZone : "39R";
  for (var i = 0; i < l.points.length; i++) {
    ensurePointEnriched(l.points[i], defZone, i);
  }

  // اگر لایه اصلی زمین است، مختصات متنی پرونده را نیز همگام کن
  var c = getActiveCase();
  if (c && l.category === "MAIN_PARCEL" && l.points.length >= 1) {
    var g = computeUtmGeometry(l.points, "POLYGON");
    c.utm = l.points.map(function(pt) {
      return pt.x + "," + pt.y + "," + (pt.elev !== undefined ? pt.elev : 1285) + "," + (pt.zone || defZone);
    }).join("\n");
    if (document.getElementById("c-utm")) document.getElementById("c-utm").value = c.utm;
    if (l.points.length >= 3) {
      c.land = toFa(Math.round(g.area));
      if (document.getElementById("c-land")) document.getElementById("c-land").value = c.land;
    }
  }

  var rawLines = [];
  for (var j = 0; j < l.points.length; j++) {
    rawLines.push(formatPointToLine(l.points[j], coordInputMode));
  }
  if (document.getElementById("edit-lyr-bulk-utm")) {
    document.getElementById("edit-lyr-bulk-utm").value = rawLines.join("\n");
  }

  saveAllDB();
  renderCroquisLayersList();
  renderActiveLayerPointsTable();
  renderCaseSegmentedPointsTable();
  renderCroquisVisualCanvas();
}

function renderActiveLayerPointsTable() {
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  var tbody = document.getElementById("crq-points-tbody");
  var valBox = document.getElementById("crq-utm-validation-box");
  if (!l || !tbody) return;

  var defZone = (m && m.utmZone) ? m.utmZone : "39R";
  var isGeo = coordInputMode === "GEO";
  var g = computeUtmGeometry(l.points, l.geomType);
  var valRes = validateUtmLayerPoints(l.points, l.geomType, defZone);

  if (valBox) {
    if (!valRes.valid) {
      valBox.className = "alert alert-danger py-2 px-3 small fw-bold mb-2";
      valBox.innerHTML = "❌ خطای اعتبارسنجی مختصات:<br>" + valRes.errors.map(safeHtmlText).join("<br>");
    } else if (valRes.warnings.length) {
      valBox.className = "alert alert-warning py-2 px-3 small fw-bold mb-2";
      valBox.innerHTML = "⚠️ هشدار مختصات:<br>" + valRes.warnings.map(safeHtmlText).join("<br>");
    } else {
      valBox.className = "alert alert-success py-1 px-3 small fw-bold mb-2";
      valBox.innerHTML = "✅ مختصات لایه «" + safeHtmlText(l.name) + "» در زون " + safeHtmlText(defZone) + " معتبر است (" + (isGeo ? "نمایش: طول و عرض جغرافیایی" : "نمایش: متریک UTM") + "). | مساحت: " + toFa(Math.round(g.area)) + " م.م (" + toFa(g.ha.toFixed(3)) + " هکتار) | محیط/طول: " + toFa(g.perim.toFixed(1)) + " متر";
    }
  }

  var html = "";
  for (var i = 0; i < l.points.length; i++) {
    var pt = ensurePointEnriched(l.points[i], defZone, i);
    var sideLen = (g.sides && g.sides[i]) ? toFa(g.sides[i].len.toFixed(1)) + " م" : "---";
    var valX = isGeo ? pt.lng : pt.x;
    var valY = isGeo ? pt.lat : pt.y;
    var fieldX = isGeo ? "lng" : "x";
    var fieldY = isGeo ? "lat" : "y";
    var zVal = /^(38R|39R|40R|41R)$/.test(pt.zone || "") ? pt.zone : defZone;

    html += '<tr>' +
      '<td class="fw-bold">' + toFa(i + 1) + '</td>' +
      '<td><input type="text" class="form-control form-control-sm text-center fw-bold py-0" style="min-width:52px;" value="' + safeHtmlText(pt.label || ("P" + (i + 1))) + '" onchange="updateLayerVertex(' + i + ',\'label\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:98px;" value="' + safeHtmlText(valX) + '" onchange="updateLayerVertex(' + i + ',\'' + fieldX + '\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:98px;" value="' + safeHtmlText(valY) + '" onchange="updateLayerVertex(' + i + ',\'' + fieldY + '\',this.value)"></td>' +
      '<td><input type="number" step="any" class="form-control form-control-sm text-center font-monospace py-0" style="min-width:68px;" value="' + safeHtmlText(pt.elev !== undefined ? pt.elev : 1285) + '" onchange="updateLayerVertex(' + i + ',\'elev\',this.value)"></td>' +
      '<td>' +
        '<select class="form-select form-select-sm text-center py-0 px-1 fw-bold" style="min-width:72px;" onchange="updateLayerVertex(' + i + ',\'zone\',this.value)">' +
          '<option value="38R" ' + (zVal === "38R" ? "selected" : "") + '>38R</option>' +
          '<option value="39R" ' + (zVal === "39R" ? "selected" : "") + '>39R</option>' +
          '<option value="40R" ' + (zVal === "40R" ? "selected" : "") + '>40R</option>' +
          '<option value="41R" ' + (zVal === "41R" ? "selected" : "") + '>41R</option>' +
        '</select>' +
      '</td>' +
      '<td class="small fw-bold text-success">' + sideLen + '</td>' +
      '<td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" onclick="removeLayerVertex(' + i + ')">🗑️</button></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="8" class="text-center text-muted py-2">نقطه‌ای در این لایه ثبت نشده است.</td></tr>';
}

function addSingleUtmPointToLayer() {
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  if (!l) return;
  var xEl = document.getElementById("new-pt-x");
  var yEl = document.getElementById("new-pt-y");
  var elevEl = document.getElementById("new-pt-elev");
  var zoneEl = document.getElementById("new-pt-zone");
  var lblEl = document.getElementById("new-pt-label");

  var v1 = parseFloat(toEn(xEl.value));
  var v2 = parseFloat(toEn(yEl.value));
  if (isNaN(v1) || isNaN(v2)) {
    alert(coordInputMode === "GEO"
      ? "لطفاً طول جغرافیایی (Lng) و عرض جغرافیایی (Lat) نقطه را به صورت عدد معتبر وارد نمایید."
      : "لطفاً مختصات شرقی (X) و شمالی (Y) نقطه را به صورت عدد معتبر وارد نمایید.");
    return;
  }
  var lbl = (lblEl && lblEl.value.trim()) || ("P" + (l.points.length + 1));
  var elev = elevEl ? elevEl.value : 1285;
  var zone = (zoneEl && zoneEl.value) ? zoneEl.value : ((m && m.utmZone) || "39R");

  var newPt = createEnrichedPointFromInput(v1, v2, elev, zone, lbl, coordInputMode);
  l.points.push(newPt);
  xEl.value = "";
  yEl.value = "";
  if (lblEl) lblEl.value = "";
  saveActiveLayerStyleAndMeta();
  showToastMsg("نقطه «" + newPt.label + "» با موفقیت ثبت شد (UTM: " + toFa(newPt.x) + " , " + toFa(newPt.y) + " | ارتفاع: " + toFa(newPt.elev) + "m | زون: " + newPt.zone + ").");
}

function updateLayerVertex(idx, field, val) {
  var l = getActiveCroquisLayer();
  if (!l || !l.points[idx]) return;
  var pt = ensurePointEnriched(l.points[idx], "39R", idx);

  if (field === "label") {
    pt.label = val.trim();
  } else if (field === "elev") {
    pt.elev = parseFloat(toEn(val)) || 0;
  } else if (field === "zone") {
    pt.zone = val.trim().toUpperCase();
    ensurePointEnriched(pt, pt.zone, idx);
  } else if (field === "lng" || field === "lat") {
    var num = parseFloat(toEn(val));
    if (!isNaN(num)) {
      if (field === "lng") pt.lng = num;
      if (field === "lat") pt.lat = num;
      var u = latLngToUtmWGS84(pt.lat, pt.lng, parseInt(pt.zone, 10) || 39);
      pt.x = u.x;
      pt.y = u.y;
    }
  } else {
    pt[field] = parseFloat(toEn(val)) || 0;
    ensurePointEnriched(pt, pt.zone, idx);
  }
  saveActiveLayerStyleAndMeta();
}

function removeLayerVertex(idx) {
  var l = getActiveCroquisLayer();
  if (!l) return;
  l.points.splice(idx, 1);
  saveActiveLayerStyleAndMeta();
}

function applyBulkUtmToActiveLayer() {
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  if (!l) return;
  var defZone = (m && m.utmZone) ? m.utmZone : "39R";
  var raw = (document.getElementById("edit-lyr-bulk-utm") || {}).value || "";
  var lines = raw.trim().split("\n");
  var pts = [];
  for (var i = 0; i < lines.length; i++) {
    var pt = parseSingleCoordinateLine(lines[i], defZone, pts.length);
    if (pt) pts.push(pt);
  }
  l.points = pts;
  saveActiveLayerStyleAndMeta();
  showToastMsg(toFa(pts.length) + " نقطه (همراه با ارتفاع و زون) در لایه «" + l.name + "» ثبت و ترسیم شد.");
}

/* رندر هم‌زمان بوم مهندسی آفلاین (SVG) و نقشه جغرافیایی آنلاین (Leaflet) */
function switchCroquisViewMode(mode) {
  croquisViewMode = mode;
  var cadBox = document.getElementById("crq-cad-canvas-box");
  var mapBox = document.getElementById("crq-leaflet-map-box");
  var btnCad = document.getElementById("btn-view-cad");
  var btnMap = document.getElementById("btn-view-map");

  if (mode === "MAP") {
    if (cadBox) cadBox.style.display = "none";
    if (mapBox) mapBox.style.display = "block";
    if (btnCad) btnCad.className = "btn btn-sm btn-outline-success fw-bold";
    if (btnMap) btnMap.className = "btn btn-sm btn-success fw-bold";
    renderCroquisLeafletMap();
  } else {
    if (cadBox) cadBox.style.display = "block";
    if (mapBox) mapBox.style.display = "none";
    if (btnCad) btnCad.className = "btn btn-sm btn-success fw-bold";
    if (btnMap) btnMap.className = "btn btn-sm btn-outline-success fw-bold";
    renderCroquisVisualCanvas();
  }
}

function buildMultiLayerSvgMarkup(m, svgW, svgH, forPrint) {
  var allPts = [];
  for (var i = 0; i < m.layers.length; i++) {
    if (!m.layers[i].visible) continue;
    for (var j = 0; j < m.layers[i].points.length; j++) {
      allPts.push(m.layers[i].points[j]);
    }
  }
  if (!allPts.length) {
    return '<div class="text-center py-5 text-muted fw-bold">نقطه‌ای برای نمایش در لایه‌های فعال وجود ندارد.</div>';
  }

  var minX = allPts[0].x, maxX = allPts[0].x, minY = allPts[0].y, maxY = allPts[0].y;
  for (var k = 1; k < allPts.length; k++) {
    if (allPts[k].x < minX) minX = allPts[k].x;
    if (allPts[k].x > maxX) maxX = allPts[k].x;
    if (allPts[k].y < minY) minY = allPts[k].y;
    if (allPts[k].y > maxY) maxY = allPts[k].y;
  }

  var spanX = Math.max(maxX - minX, 20);
  var spanY = Math.max(maxY - minY, 20);
  var pad = 42;
  var scale = Math.min((svgW - 2 * pad) / spanX, (svgH - 2 * pad) / spanY);

  function toScreen(pt) {
    return {
      x: Math.round(pad + (pt.x - minX) * scale),
      y: Math.round(svgH - pad - (pt.y - minY) * scale)
    };
  }

  var bgFill = forPrint ? "#f8fafc" : "#0f172a";
  var gridColor = forPrint ? "#cbd5e1" : "#1e293b";
  var textColor = forPrint ? "#0f172a" : "#f8fafc";
  var gridId = forPrint ? "cadGridPrint" : "cadGridScreen";

  var shapesHtml = "";
  for (var lIdx = 0; lIdx < m.layers.length; lIdx++) {
    var lyr = m.layers[lIdx];
    if (!lyr.visible || !lyr.points.length) continue;
    var layerColor = safeHexColor(lyr.color, "#15803d");
    var layerOpacity = Number(lyr.fillOpacity);
    if (!Number.isFinite(layerOpacity)) layerOpacity = 0.25;
    layerOpacity = Math.min(1, Math.max(0, layerOpacity));
    var layerStrokeWidth = Number(lyr.strokeWidth);
    if (!Number.isFinite(layerStrokeWidth)) layerStrokeWidth = 2.5;
    layerStrokeWidth = Math.min(10, Math.max(0.5, layerStrokeWidth));
    var gLyr = computeUtmGeometry(lyr.points, lyr.geomType);

    if (lyr.geomType === "POLYGON" && lyr.points.length >= 3) {
      var polyPts = [];
      var sumCx = 0, sumCy = 0;
      for (var p1 = 0; p1 < lyr.points.length; p1++) {
        var s1 = toScreen(lyr.points[p1]);
        polyPts.push(s1.x + "," + s1.y);
        sumCx += s1.x;
        sumCy += s1.y;
      }
      var cx = Math.round(sumCx / lyr.points.length);
      var cy = Math.round(sumCy / lyr.points.length);
      shapesHtml += '<polygon points="' + polyPts.join(" ") + '" fill="' + layerColor + '" fill-opacity="' + layerOpacity + '" stroke="' + layerColor + '" stroke-width="' + layerStrokeWidth + '"/>';
      shapesHtml += '<text x="' + cx + '" y="' + cy + '" fill="' + (forPrint ? layerColor : "#fde047") + '" font-size="10.5" font-weight="bold" text-anchor="middle">' + safeHtmlText(lyr.name) + ' (' + toFa(Math.round(gLyr.area)) + ' م.م)</text>';

      // نمایش طول اضلاع و نام رئوس
      for (var p2 = 0; p2 < lyr.points.length; p2++) {
        var nxt = (p2 + 1) % lyr.points.length;
        var a = toScreen(lyr.points[p2]);
        var b = toScreen(lyr.points[nxt]);
        var dist = Math.sqrt(Math.pow(lyr.points[nxt].x - lyr.points[p2].x, 2) + Math.pow(lyr.points[nxt].y - lyr.points[p2].y, 2));
        var mx = Math.round((a.x + b.x) / 2);
        var my = Math.round((a.y + b.y) / 2);
        shapesHtml += '<circle cx="' + a.x + '" cy="' + a.y + '" r="4.5" fill="#fff" stroke="' + layerColor + '" stroke-width="2.5"/>';
        shapesHtml += '<text x="' + (a.x + 6) + '" y="' + (a.y - 6) + '" fill="' + textColor + '" font-size="10.5" font-weight="bold">' + safeHtmlText(lyr.points[p2].label || ("P" + (p2 + 1))) + '</text>';
        shapesHtml += '<text x="' + mx + '" y="' + (my - 4) + '" fill="' + (forPrint ? "#1e40af" : "#93c5fd") + '" font-size="9.5" font-weight="bold" text-anchor="middle">' + toFa(Math.round(dist)) + ' م</text>';
      }
    } else if (lyr.geomType === "LINE" && lyr.points.length >= 2) {
      var linePts = [];
      for (var p3 = 0; p3 < lyr.points.length; p3++) {
        var s3 = toScreen(lyr.points[p3]);
        linePts.push(s3.x + "," + s3.y);
        shapesHtml += '<circle cx="' + s3.x + '" cy="' + s3.y + '" r="3.5" fill="' + layerColor + '"/>';
      }
      shapesHtml += '<polyline points="' + linePts.join(" ") + '" fill="none" stroke="' + layerColor + '" stroke-width="' + layerStrokeWidth + '" stroke-dasharray="6,3"/>';
    } else {
      for (var p4 = 0; p4 < lyr.points.length; p4++) {
        var s4 = toScreen(lyr.points[p4]);
        shapesHtml += '<circle cx="' + s4.x + '" cy="' + s4.y + '" r="6" fill="' + layerColor + '" stroke="#fff" stroke-width="2"/>';
        shapesHtml += '<text x="' + (s4.x + 8) + '" y="' + (s4.y + 4) + '" fill="' + textColor + '" font-size="10.5" font-weight="bold">' + safeHtmlText(lyr.points[p4].label || lyr.name) + '</text>';
      }
    }
  }

  // فلش شمال و مقیاس خطی
  var scaleMeters = Math.max(10, Math.round((80 / scale) / 10) * 10);
  var scalePx = Math.round(scaleMeters * scale);
  var hudHtml =
    '<g transform="translate(32, 38)">' +
      '<circle cx="0" cy="0" r="18" fill="' + bgFill + '" stroke="#f59e0b" stroke-width="2"/>' +
      '<polygon points="0,-14 -5,6 0,2 5,6" fill="#ef4444"/>' +
      '<text x="0" y="-20" fill="' + textColor + '" font-size="10.5" font-weight="bold" text-anchor="middle">N شمال</text>' +
    '</g>' +
    '<g transform="translate(25, ' + (svgH - 18) + ')">' +
      '<line x1="0" y1="0" x2="' + scalePx + '" y2="0" stroke="' + textColor + '" stroke-width="3"/>' +
      '<line x1="0" y1="-5" x2="0" y2="5" stroke="' + textColor + '" stroke-width="2"/>' +
      '<line x1="' + scalePx + '" y1="-5" x2="' + scalePx + '" y2="5" stroke="' + textColor + '" stroke-width="2"/>' +
      '<text x="' + Math.round(scalePx / 2) + '" y="-6" fill="' + textColor + '" font-size="9.5" font-weight="bold" text-anchor="middle">مقیاس: ' + toFa(scaleMeters) + ' متر</text>' +
    '</g>';

  var svgHeightAttr = forPrint ? (svgH + "px") : "100%";
  var svgStyle = forPrint
    ? ("display:block;width:100%;height:" + svgH + "px;background:" + bgFill + ";border-radius:6px;border:1.5px solid #0f172a;")
    : ("background:" + bgFill + ";border-radius:10px;border:1px solid #cbd5e1;");

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgW + ' ' + svgH + '" width="100%" height="' + svgHeightAttr + '" style="' + svgStyle + '">' +
    '<defs><pattern id="' + gridId + '" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="' + gridColor + '" stroke-width="1"/></pattern></defs>' +
    '<rect width="100%" height="100%" fill="url(#' + gridId + ')"/>' +
    shapesHtml + hudHtml +
  '</svg>';
}

function renderCroquisVisualCanvas() {
  var m = getActiveCroquisMap();
  var cadHolder = document.getElementById("crq-cad-svg-container");
  var legendHolder = document.getElementById("crq-legend-box");
  if (!m || !cadHolder) return;
  cadHolder.innerHTML = buildMultiLayerSvgMarkup(m, 760, 440, false);
  if (legendHolder) {
    var legHtml = "";
    for (var i = 0; i < m.layers.length; i++) {
      var l = m.layers[i];
      if (!l || !l.visible) continue;
      var g = computeUtmGeometry(l.points, l.geomType);
      legHtml += '<span class="badge bg-white text-dark border me-2 mb-1 p-2">' +
        '<span style="display:inline-block;width:12px;height:12px;background:' + safeHexColor(l.color, "#15803d") + ';border-radius:3px;margin-left:5px;vertical-align:middle;"></span>' +
        '<b>' + safeHtmlText(l.name) + '</b>' +
        (l.geomType === "POLYGON" ? (' — مساحت: ' + safeHtmlText(toFa(Math.round(g.area))) + ' م.م (' + safeHtmlText(toFa(g.ha.toFixed(2))) + ' هکتار)') : '') +
      '</span>';
    }
    legendHolder.innerHTML = legHtml;
  }
  if (croquisViewMode === "MAP") renderCroquisLeafletMap();
}

var leafletLoadingInProgress = false;
function ensureLeafletLoaded(callback) {
  if (typeof L !== "undefined") {
    callback(true);
    return;
  }
  if (leafletLoadingInProgress) return;
  leafletLoadingInProgress = true;

  if (!document.getElementById("leaflet-dyn-css")) {
    var link = document.createElement("link");
    link.id = "leaflet-dyn-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  var sc = document.createElement("script");
  sc.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  sc.async = true;
  sc.onload = function() {
    leafletLoadingInProgress = false;
    callback(typeof L !== "undefined");
  };
  sc.onerror = function() {
    leafletLoadingInProgress = false;
    callback(false);
  };
  document.body.appendChild(sc);
}

function renderCroquisLeafletMap() {
  var m = getActiveCroquisMap();
  var mapDiv = document.getElementById("crq-leaflet-map-div");
  if (!m || !mapDiv) return;

  if (typeof L === "undefined") {
    mapDiv.innerHTML = '<div class="alert alert-info m-3 fw-bold">⏳ در حال اتصال به سرور نقشه ماهواره‌ای گوگل‌ارث (Google Earth)... در صورت آفلاین بودن سیستم، از نمای «📐 بوم مهندسی آفلاین (CAD/SVG)» یا دکمه «🌍 خروجی KML گوگل‌ارث» استفاده نمایید.</div>';
    ensureLeafletLoaded(function(ok) {
      if (ok) {
        mapDiv.innerHTML = "";
        renderCroquisLeafletMap();
      } else {
        mapDiv.innerHTML = '<div class="alert alert-warning m-3 fw-bold">⚠️ سیستم در حالت آفلاین قرار دارد و ارتباط با سرور آنلاین کاشی‌های ماهواره‌ای برقرار نشد.<br>محاسبات مساحت، جدول مختصات UTM و چاپ کروکی در نمای CAD/SVG آفلاین در دسترس است.</div>';
      }
    });
    return;
  }

  if (!leafletMapObj) {
    leafletMapObj = L.map(mapDiv, { maxZoom: 22, preferCanvas: true }).setView([28.97, 53.20], 17);
    setLeafletTileMode("GOOGLE_HYBRID");
    leafletLayerGroupObj = L.layerGroup().addTo(leafletMapObj);
  }
  window.setTimeout(function() {
    if (leafletMapObj) leafletMapObj.invalidateSize();
  }, 150);

  if (!leafletLayerGroupObj) leafletLayerGroupObj = L.layerGroup().addTo(leafletMapObj);
  leafletLayerGroupObj.clearLayers();
  var boundsArr = [];
  var zoneNum = parseInt(m.utmZone, 10) || 39;

  for (var i = 0; i < (Array.isArray(m.layers) ? m.layers.length : 0); i++) {
    var lyr = m.layers[i] || {};
    if (!lyr.visible || !Array.isArray(lyr.points) || !lyr.points.length) continue;
    var layerColor = safeHexColor(lyr.color, "#15803d");
    var weight = Number(lyr.strokeWidth);
    if (!Number.isFinite(weight)) weight = 3;
    weight = Math.min(10, Math.max(0.5, weight));
    var latlngs = [];

    for (var j = 0; j < lyr.points.length; j++) {
      var point = lyr.points[j] || {};
      var g = utmToLatLngWGS84(point.x, point.y, zoneNum, m.hemisphere !== "S");
      if (!g || !Number.isFinite(g.lat) || !Number.isFinite(g.lng)) continue;
      latlngs.push([g.lat, g.lng]);
      boundsArr.push([g.lat, g.lng]);
    }
    if (!latlngs.length) continue;

    var gCalc = computeUtmGeometry(lyr.points, lyr.geomType);
    var safeName = safeHtmlText(lyr.name || "لایه بدون نام");
    var areaText = safeHtmlText(toFa(Math.round(gCalc.area))) + " مترمربع (" + safeHtmlText(toFa(gCalc.ha.toFixed(2))) + " هکتار)";
    var popTxt = "<b>" + safeName + "</b><br>مساحت: " + areaText;

    if (lyr.geomType === "POLYGON" && latlngs.length >= 3) {
      L.polygon(latlngs, { color: layerColor, fillColor: layerColor, fillOpacity: 0.35, weight: weight })
        .bindPopup(popTxt)
        .addTo(leafletLayerGroupObj);
    } else if (lyr.geomType === "LINE" && latlngs.length >= 2) {
      L.polyline(latlngs, { color: layerColor, weight: weight })
        .bindPopup("<b>" + safeName + "</b>")
        .addTo(leafletLayerGroupObj);
    } else {
      for (var p = 0; p < latlngs.length; p++) {
        var pointLabel = lyr.points[p] && lyr.points[p].label ? lyr.points[p].label : (lyr.name || "نقطه");
        L.circleMarker(latlngs[p], { radius: 7, color: "#fff", fillColor: layerColor, fillOpacity: 1, weight: 2 })
          .bindPopup("<b>" + safeHtmlText(pointLabel) + "</b>")
          .addTo(leafletLayerGroupObj);
      }
    }
  }

  if (boundsArr.length > 0) leafletMapObj.fitBounds(boundsArr, { padding: [28, 28], maxZoom: 19 });
}

function setLeafletTileMode(mode) {
  if (!leafletMapObj || typeof L === "undefined") return;
  if (leafletTileBase) leafletMapObj.removeLayer(leafletTileBase);
  if (mode === "GOOGLE_SAT" || mode === "SAT") {
    leafletTileBase = L.tileLayer("https://mt1.google.com/vt/lyrs=s&hl=fa&x={x}&y={y}&z={z}", {
      maxZoom: 22,
      maxNativeZoom: 20,
      attribution: "Google Earth Satellite"
    }).addTo(leafletMapObj);
  } else if (mode === "GOOGLE_TERRAIN" || mode === "OSM") {
    leafletTileBase = L.tileLayer("https://mt1.google.com/vt/lyrs=p&hl=fa&x={x}&y={y}&z={z}", {
      maxZoom: 22,
      maxNativeZoom: 20,
      attribution: "Google Earth Terrain"
    }).addTo(leafletMapObj);
  } else {
    // حالت پیش‌فرض: گوگل‌ارث هیبرید (تصویر ماهواره‌ای به‌روز گوگل‌ارث + نام روستاها، جاده‌ها و عوارض با زوم ۲۲)
    leafletTileBase = L.tileLayer("https://mt1.google.com/vt/lyrs=y&hl=fa&x={x}&y={y}&z={z}", {
      maxZoom: 22,
      maxNativeZoom: 20,
      attribution: "Google Earth Hybrid"
    }).addTo(leafletMapObj);
  }
}

var croquisPrintMapMode = "GOOGLE_SAT"; // GOOGLE_SAT | GOOGLE_HYBRID | CAD
var croquisPrintZoomLevel = "AUTO"; // "AUTO" | 14..21
var croquisPrintPanOffset = { dx: 0, dy: 0 }; // جابجایی دستی کادر نقشه (پیکسل)
var croquisPrintLabelOpts = {
  showPoints: true,                 // نمایش کد رئوس (P1, P2...) در بیرون پولیگون
  showSides: true,                  // نمایش متراژ اضلاع در بیرون ضلع
  showCenterTitle: false,           // عدم نمایش کادر تیره وسط پولیگون به صورت پیش‌فرض تا داخل زمین کاملاً مشخص باشد
  coordDisplayMode: "OUTER_CODE",   // "OUTER_CODE" | "OUTER_CALLOUT_XY" | "NONE"
  labelRadialOffset: 22,            // فاصله شعاعی برچسب‌ها به سمت بیرون پولیگون (پیکسل)
  cropPaddingFactor: 0.56,          // نسبت اشغال زمین در کادر برش (۰.۳۰ = حاشیه باز، ۰.۸۰ = کادر بسته روی زمین)
  boxHeightA4: 345,                 // ارتفاع کادر برش نقشه در برگه A4
  boxHeightA5: 185,                 // ارتفاع کادر برش نقشه در برگه A5
  polyFillOpacity: 0.06,            // شفافیت داخل پولیگون
  interactiveCropBoxMode: false     // حالت رسم کادر برش (Crop Box) با ماوس روی نقشه
};

try {
  var savedPrintMode = localStorage.getItem("nezam_croquis_print_map_mode");
  if (savedPrintMode === "GOOGLE_SAT" || savedPrintMode === "GOOGLE_HYBRID" || savedPrintMode === "CAD") {
    croquisPrintMapMode = savedPrintMode;
  }
  var savedPrintZoom = localStorage.getItem("nezam_croquis_print_zoom");
  if (savedPrintZoom) {
    croquisPrintZoomLevel = savedPrintZoom;
  }
} catch (e) {}

window.setCroquisPrintMapMode = function(mode) {
  var allowedModes = ["GOOGLE_SAT", "GOOGLE_HYBRID", "CAD"];
  if (allowedModes.indexOf(String(mode)) === -1) mode = "GOOGLE_SAT";
  croquisPrintMapMode = mode;
  try { localStorage.setItem("nezam_croquis_print_map_mode", mode); } catch (e) {}

  var sel = document.getElementById("crq-print-mode-select");
  if (sel && sel.value !== mode) sel.value = mode;
  if (currentPreviewMode === "CROQUIS") printUtmSketchSheet();

  var modeTitle = mode === "GOOGLE_SAT" ? "نقشه ماهواره‌ای گوگل‌ارث" : (mode === "GOOGLE_HYBRID" ? "نقشه ترکیبی هیبرید گوگل‌ارث" : "بوم مهندسی برداری CAD");
  if (typeof showToastMsg === "function") showToastMsg("حالت نقشه در چاپ تنظیم شد: " + modeTitle);
};

window.setCroquisPrintZoom = function(zoomVal) {
  var requestedZoom = String(zoomVal || "AUTO");
  var allowedZooms = ["AUTO", "14", "15", "16", "17", "18", "19", "20", "21"];
  croquisPrintZoomLevel = allowedZooms.indexOf(requestedZoom) !== -1 ? requestedZoom : "AUTO";
  try { localStorage.setItem("nezam_croquis_print_zoom", croquisPrintZoomLevel); } catch (e) {}

  var sel1 = document.getElementById("crq-print-zoom-select");
  if (sel1 && sel1.value !== croquisPrintZoomLevel) sel1.value = croquisPrintZoomLevel;
  var sel2 = document.getElementById("crq-sheet-zoom-select");
  if (sel2 && sel2.value !== croquisPrintZoomLevel) sel2.value = croquisPrintZoomLevel;

  if (leafletMapObj && croquisPrintZoomLevel !== "AUTO") {
    var zNum = parseInt(croquisPrintZoomLevel, 10);
    if (!isNaN(zNum)) leafletMapObj.setZoom(zNum);
  }

  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
  if (typeof showToastMsg === "function") {
    showToastMsg("زوم چاپ نقشه گوگل‌ارث تنظیم شد: " + (croquisPrintZoomLevel === "AUTO" ? "خودکار هوشمند" : "زوم " + toFa(croquisPrintZoomLevel)));
  }
};

window.stepCroquisPrintZoom = function(delta) {
  var curZ = croquisPrintZoomLevel === "AUTO" ? (window._lastComputedPrintZoom || 18) : parseInt(croquisPrintZoomLevel, 10);
  if (isNaN(curZ)) curZ = 18;
  var nextZ = Math.min(21, Math.max(14, curZ + delta));
  window.setCroquisPrintZoom(String(nextZ));
};

window.panCroquisPrintMap = function(dx, dy) {
  if (dx === 0 && dy === 0) {
    croquisPrintPanOffset = { dx: 0, dy: 0 };
  } else {
    croquisPrintPanOffset.dx += dx;
    croquisPrintPanOffset.dy += dy;
  }
  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
};

window.toggleCroquisPrintOpt = function(optKey) {
  if (!croquisPrintLabelOpts.hasOwnProperty(optKey)) return;
  croquisPrintLabelOpts[optKey] = !croquisPrintLabelOpts[optKey];
  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
};

window.setCroquisCropOption = function(key, val) {
  if (key === "labelRadialOffset") {
    croquisPrintLabelOpts.labelRadialOffset = Math.max(8, Math.min(65, parseInt(val, 10) || 22));
  } else if (key === "cropPaddingFactor") {
    croquisPrintLabelOpts.cropPaddingFactor = Math.max(0.25, Math.min(0.88, parseFloat(val) || 0.56));
    croquisPrintZoomLevel = "AUTO";
  } else if (key === "boxHeight") {
    var hVal = parseInt(val, 10) || 345;
    if (currentPaperSize === "A5") {
      croquisPrintLabelOpts.boxHeightA5 = Math.max(160, Math.min(275, hVal));
    } else {
      croquisPrintLabelOpts.boxHeightA4 = Math.max(240, Math.min(440, hVal));
    }
  } else if (key === "coordDisplayMode") {
    var safeCoordModes = ["OUTER_CODE", "OUTER_CALLOUT_XY", "OUTER_WITH_SUBLAYERS", "NONE"];
    var requestedCoordMode = String(val || "OUTER_CODE");
    croquisPrintLabelOpts.coordDisplayMode = safeCoordModes.indexOf(requestedCoordMode) !== -1 ? requestedCoordMode : "OUTER_CODE";
    croquisPrintLabelOpts.showPoints = (croquisPrintLabelOpts.coordDisplayMode !== "NONE");
  } else if (key === "polyFillOpacity") {
    var opacityValue = Number(val);
    if (!Number.isFinite(opacityValue)) opacityValue = 0.05;
    croquisPrintLabelOpts.polyFillOpacity = Math.min(1, Math.max(0, opacityValue));
  } else if (key === "interactiveCropBoxMode") {
    croquisPrintLabelOpts.interactiveCropBoxMode = !!val;
  }
  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
};

window.resetCroquisCropAndLabels = function() {
  croquisPrintPanOffset = { dx: 0, dy: 0 };
  croquisPrintZoomLevel = "AUTO";
  window.croquisPrintFocusLayerId = "AUTO_ALL";
  croquisPrintLabelOpts.labelRadialOffset = 22;
  croquisPrintLabelOpts.cropPaddingFactor = 0.56;
  croquisPrintLabelOpts.coordDisplayMode = "OUTER_CODE";
  croquisPrintLabelOpts.showPoints = true;
  croquisPrintLabelOpts.showSides = true;
  croquisPrintLabelOpts.showCenterTitle = false;
  croquisPrintLabelOpts.interactiveCropBoxMode = false;
  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
  if (typeof showToastMsg === "function") {
    showToastMsg("✅ کادر برش نقشه گوگل‌ارث و چیدمان بیرونی مشخصات بازنشانی شد.");
  }
};

/* اتصال رویدادهای تعاملی ماوس (کادر برش، جابجایی Drag و زوم با چرخ ماوس) روی نقشه چاپی گوگل‌ارث */
function attachPrintedMapCropInteractions() {
  var holder = document.getElementById("printed-croquis-map-holder");
  if (!holder) return;
  var satBox = holder.querySelector(".printed-croquis-satellite-box");
  if (!satBox) return;

  satBox.style.cursor = croquisPrintLabelOpts.interactiveCropBoxMode ? "crosshair" : "grab";
  satBox.title = croquisPrintLabelOpts.interactiveCropBoxMode
    ? "با کشیدن ماوس، مستطیل محدوده برش دلخواه را روی نقشه رسم کنید"
    : "برای تنظیم کادر برش، نقشه را با ماوس بکشید (Drag) یا با چرخ ماوس زوم کنید (Shift+Drag = رسم کادر برش)";

  var isDown = false;
  var isCropRectMode = false;
  var startX = 0, startY = 0;
  var curX = 0, curY = 0;
  var selectionDiv = null;

  satBox.onmousedown = function(ev) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    isDown = true;
    isCropRectMode = croquisPrintLabelOpts.interactiveCropBoxMode || ev.shiftKey;
    var rect = satBox.getBoundingClientRect();
    startX = ev.clientX - rect.left;
    startY = ev.clientY - rect.top;
    curX = startX;
    curY = startY;

    if (isCropRectMode) {
      selectionDiv = document.createElement("div");
      selectionDiv.className = "no-print";
      selectionDiv.style.cssText = "position:absolute;border:2.5px dashed #facc15;background:rgba(250,204,21,0.18);pointer-events:none;z-index:50;border-radius:4px;";
      satBox.appendChild(selectionDiv);
    } else {
      satBox.style.cursor = "grabbing";
    }
  };

  window.onmousemove = function(ev) {
    if (!isDown) return;
    var rect = satBox.getBoundingClientRect();
    curX = ev.clientX - rect.left;
    curY = ev.clientY - rect.top;

    if (isCropRectMode && selectionDiv) {
      var left = Math.min(startX, curX);
      var top = Math.min(startY, curY);
      var w = Math.abs(curX - startX);
      var h = Math.abs(curY - startY);
      selectionDiv.style.left = left + "px";
      selectionDiv.style.top = top + "px";
      selectionDiv.style.width = w + "px";
      selectionDiv.style.height = h + "px";
    }
  };

  window.onmouseup = function() {
    if (!isDown) return;
    isDown = false;
    var rect = satBox.getBoundingClientRect();
    var svgW = window._lastPrintSvgW || 680;
    var svgH = window._lastPrintSvgH || 345;
    var scaleX = svgW / (rect.width || svgW);
    var scaleY = svgH / (rect.height || svgH);

    if (isCropRectMode) {
      if (selectionDiv && selectionDiv.parentNode) {
        selectionDiv.parentNode.removeChild(selectionDiv);
      }
      selectionDiv = null;
      var boxW = Math.abs(curX - startX) * scaleX;
      var boxH = Math.abs(curY - startY) * scaleY;
      if (boxW > 24 && boxH > 24) {
        // مرکز کادر کشیده‌شده نسبت به مرکز فعلی نقشه
        var midX = ((startX + curX) / 2) * scaleX;
        var midY = ((startY + curY) / 2) * scaleY;
        var offsetX = midX - (svgW / 2);
        var offsetY = midY - (svgH / 2);

        var curZ = croquisPrintZoomLevel === "AUTO" ? (window._lastComputedPrintZoom || 18) : parseInt(croquisPrintZoomLevel, 10);
        var ratio = Math.min(svgW / boxW, svgH / boxH);
        var zoomAdd = Math.max(0, Math.min(3, Math.round(Math.log2(ratio))));
        var newZ = Math.min(21, curZ + zoomAdd);
        var zScale = Math.pow(2, newZ - curZ);

        croquisPrintPanOffset.dx = Math.round((croquisPrintPanOffset.dx + offsetX) * zScale);
        croquisPrintPanOffset.dy = Math.round((croquisPrintPanOffset.dy + offsetY) * zScale);
        croquisPrintLabelOpts.interactiveCropBoxMode = false;
        window.setCroquisPrintZoom(String(newZ));
        if (typeof showToastMsg === "function") {
          showToastMsg("✂️ کادر برش انتخابی روی نقشه گوگل‌ارث اعمال شد (زوم " + toFa(newZ) + ").");
        }
      }
    } else {
      satBox.style.cursor = "grab";
      var dx = Math.round((curX - startX) * scaleX);
      var dy = Math.round((curY - startY) * scaleY);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        // کشیدن تصویر به راست یعنی حرکت پنجره دید به چپ
        window.panCroquisPrintMap(-dx, -dy);
      }
    }
  };

  satBox.onwheel = function(ev) {
    ev.preventDefault();
    var delta = ev.deltaY < 0 ? 1 : -1;
    window.stepCroquisPrintZoom(delta);
  };
}

/* تولید نقشه چاپی شیت رسمی با نمایش واقعی ماهواره گوگل‌ارث، قابلیت تنظیم کادر برش (Crop)، و چیدمان مشخصات در بیرون پولیگون (بدون پوشاندن زمین) */
function buildPrintedCroquisMap(m, svgW, svgH, mode) {
  var selectedMode = mode || croquisPrintMapMode || "GOOGLE_SAT";
  window._lastPrintSvgW = svgW;
  window._lastPrintSvgH = svgH;

  // در صورت انتخاب CAD، خروجی وکتور استاندارد مهندسی داده می‌شود
  if (selectedMode === "CAD") {
    return buildMultiLayerSvgMarkup(m, svgW, svgH, true);
  }

  // جمع‌آوری تمامی نقاط لایه‌های مرئی
  var allPts = [];
  for (var i = 0; i < m.layers.length; i++) {
    if (!m.layers[i].visible) continue;
    for (var j = 0; j < m.layers[i].points.length; j++) {
      allPts.push(m.layers[i].points[j]);
    }
  }

  if (!allPts.length) {
    return buildMultiLayerSvgMarkup(m, svgW, svgH, true);
  }

  var defaultZone = parseInt(m.utmZone, 10) || 39;
  var isNorth = m.hemisphere !== "S";

  // اگر کاربر لایه خاصی را برای تمرکز زوم انتخاب کرده باشد، مرکز نقشه روی همان لایه قرار می‌گیرد
  var focusPts = [];
  if (window.croquisPrintFocusLayerId && window.croquisPrintFocusLayerId !== "AUTO_ALL") {
    for (var fi = 0; fi < m.layers.length; fi++) {
      if (m.layers[fi].id === window.croquisPrintFocusLayerId && m.layers[fi].points.length) {
        focusPts = m.layers[fi].points;
        break;
      }
    }
  }
  var ptsForBounds = focusPts.length ? focusPts : allPts;

  // تبدیل نقاط هدف به مختصات جغرافیایی WGS84 (با پشتیبانی از زون اختصاصی هر نقطه)
  var minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (var p = 0; p < ptsForBounds.length; p++) {
    var g = ensurePointEnriched(ptsForBounds[p], defaultZone, p);
    if (g.lat < minLat) minLat = g.lat;
    if (g.lat > maxLat) maxLat = g.lat;
    if (g.lng < minLng) minLng = g.lng;
    if (g.lng > maxLng) maxLng = g.lng;
  }

  var centerLat = (minLat + maxLat) / 2;
  var centerLng = (minLng + maxLng) / 2;
  var spanLat = Math.max(maxLat - minLat, 0.00018);
  var spanLng = Math.max(maxLng - minLng, 0.00018);

  // محاسبه هوشمند سطح زوم بهینه بر اساس ضریب حاشیه برش (cropPaddingFactor) و تصحیح مرکاتور عرض جغرافیایی
  var padFactor = Number(croquisPrintLabelOpts.cropPaddingFactor);
  if (!Number.isFinite(padFactor)) padFactor = 0.56;
  padFactor = Math.min(0.82, Math.max(0.30, padFactor));
  var targetSpanPxW = svgW * padFactor;
  var targetSpanPxH = svgH * padFactor;
  var cosLat = Math.cos(centerLat * Math.PI / 180) || 0.87;
  var zLng = Math.log2((targetSpanPxW * 360) / (256 * spanLng));
  var zLat = Math.log2((targetSpanPxH * 360 * cosLat) / (256 * spanLat));
  var autoZoom = Math.round(Math.min(zLng, zLat));
  if (isNaN(autoZoom)) autoZoom = 18;
  if (autoZoom < 14) autoZoom = 14;
  if (autoZoom > 20) autoZoom = 20;

  var optZoom = autoZoom;
  if (croquisPrintZoomLevel && croquisPrintZoomLevel !== "AUTO") {
    var userZ = parseInt(croquisPrintZoomLevel, 10);
    if (!isNaN(userZ) && userZ >= 14 && userZ <= 21) {
      optZoom = userZ;
    }
  }
  window._lastComputedPrintZoom = optZoom;

  // کاشی‌های اصلی سرور گوگل تا زوم ۱۹ موجودند؛ برای زوم ۲۰ و ۲۱ کاشی زوم ۱۹ با مقیاس ۲ یا ۴ برابر رندر می‌شود
  var tileZoom = Math.min(optZoom, 19);
  var overScale = Math.pow(2, optZoom - tileZoom);
  var tileSizePx = Math.round(256 * overScale);

  function projectToWorld(lat, lng, z) {
    var x = ((lng + 180) / 360) * 256 * Math.pow(2, z);
    var sinL = Math.sin(lat * Math.PI / 180);
    sinL = Math.min(Math.max(sinL, -0.9999), 0.9999);
    var y = (0.5 - Math.log((1 + sinL) / (1 - sinL)) / (4 * Math.PI)) * 256 * Math.pow(2, z);
    return { x: x, y: y };
  }

  var centerWorld = projectToWorld(centerLat, centerLng, optZoom);
  var boxLeft = (centerWorld.x + (croquisPrintPanOffset.dx || 0)) - (svgW / 2);
  var boxTop = (centerWorld.y + (croquisPrintPanOffset.dy || 0)) - (svgH / 2);

  var minTileX = Math.floor(boxLeft / tileSizePx) - 1;
  var maxTileX = Math.floor((boxLeft + svgW) / tileSizePx) + 1;
  var minTileY = Math.floor(boxTop / tileSizePx) - 1;
  var maxTileY = Math.floor((boxTop + svgH) / tileSizePx) + 1;

  var lyrsParam = (selectedMode === "GOOGLE_HYBRID") ? "y" : "s";
  var svgTilesMarkup = "";
  for (var tx = minTileX; tx <= maxTileX; tx++) {
    for (var ty = minTileY; ty <= maxTileY; ty++) {
      var tLeft = Math.round(tx * tileSizePx - boxLeft);
      var tTop = Math.round(ty * tileSizePx - boxTop);
      var tileUrl = "https://mt1.google.com/vt/lyrs=" + lyrsParam + "&hl=fa&x=" + tx + "&y=" + ty + "&z=" + tileZoom;
      svgTilesMarkup += '<image href="' + tileUrl + '" xlink:href="' + tileUrl + '" x="' + tLeft + '" y="' + tTop + '" width="' + (tileSizePx + 0.6) + '" height="' + (tileSizePx + 0.6) + '" preserveAspectRatio="none" />';
    }
  }

  function toMapScreen(pt) {
    var geo = ensurePointEnriched(pt, defaultZone, 0);
    var w = projectToWorld(geo.lat, geo.lng, optZoom);
    return {
      x: Math.round(w.x - boxLeft),
      y: Math.round(w.y - boxTop)
    };
  }

  var haloStyle = "paint-order:stroke fill; stroke:#0f172a; stroke-width:3.5px; stroke-linecap:round; stroke-linejoin:round;";
  var radialDist = Number(croquisPrintLabelOpts.labelRadialOffset);
  if (!Number.isFinite(radialDist)) radialDist = 22;
  radialDist = Math.min(55, Math.max(10, radialDist));
  var allowedCoordModes = ["OUTER_CODE","OUTER_CALLOUT_XY","OUTER_WITH_SUBLAYERS","NONE"];
  var coordMode = allowedCoordModes.indexOf(croquisPrintLabelOpts.coordDisplayMode) !== -1 ? croquisPrintLabelOpts.coordDisplayMode : "OUTER_CODE";
  var fillOp = Number(croquisPrintLabelOpts.polyFillOpacity);
  if (!Number.isFinite(fillOp)) fillOp = 0.05;
  fillOp = Math.min(1, Math.max(0, fillOp));

  // تشخیص لایه اصلی زمین (MAIN_PARCEL یا لایه متمرکز انتخابی کاربر) تا مشخصات فقط در بیرون مرز زمین درج شود و داخل پولیگون کاملاً باز و خوانا بماند
  var primaryLayerId = null;
  if (window.croquisPrintFocusLayerId && window.croquisPrintFocusLayerId !== "AUTO_ALL") {
    primaryLayerId = window.croquisPrintFocusLayerId;
  } else {
    for (var mIdx = 0; mIdx < m.layers.length; mIdx++) {
      if (m.layers[mIdx].visible && m.layers[mIdx].category === "MAIN_PARCEL" && m.layers[mIdx].points.length) {
        primaryLayerId = m.layers[mIdx].id;
        break;
      }
    }
    if (!primaryLayerId) {
      for (var mIdx2 = 0; mIdx2 < m.layers.length; mIdx2++) {
        if (m.layers[mIdx2].visible && m.layers[mIdx2].points.length) {
          primaryLayerId = m.layers[mIdx2].id;
          break;
        }
      }
    }
  }

  // محاسبه کادر احاطه‌کننده (Bounding Box) پولیگون اصلی زمین روی صفحه جهت هدایت خطوط راهنمای عوارض به بیرون زمین
  var outerMinX = svgW, outerMaxX = 0, outerMinY = svgH, outerMaxY = 0;
  for (var bIdx = 0; bIdx < m.layers.length; bIdx++) {
    var bLyr = m.layers[bIdx];
    if (!bLyr.visible || !bLyr.points.length) continue;
    if (primaryLayerId && bLyr.id !== primaryLayerId) continue;
    for (var bp = 0; bp < bLyr.points.length; bp++) {
      var bs = toMapScreen(bLyr.points[bp]);
      if (bs.x < outerMinX) outerMinX = bs.x;
      if (bs.x > outerMaxX) outerMaxX = bs.x;
      if (bs.y < outerMinY) outerMinY = bs.y;
      if (bs.y > outerMaxY) outerMaxY = bs.y;
    }
  }
  if (outerMinX > outerMaxX) {
    outerMinX = svgW * 0.25; outerMaxX = svgW * 0.75;
    outerMinY = svgH * 0.25; outerMaxY = svgH * 0.75;
  }

  // ترسیم عوارض برداری بر روی تصویر ماهواره (کاملاً شفاف در داخل پولیگون و انتقال مشخصات به بیرون رئوس و اضلاع)
  var vectorShapes = "";
  var subCalloutIdx = 0;
  for (var lIdx = 0; lIdx < m.layers.length; lIdx++) {
    var lyr = m.layers[lIdx] || {};
    if (!lyr.visible || !Array.isArray(lyr.points) || !lyr.points.length) continue;
    var layerColor = safeHexColor(lyr.color, "#15803d");
    var safeLayerName = safeHtmlText(lyr.name || "لایه بدون نام");
    var layerStrokeWidth = Number(lyr.strokeWidth);
    if (!Number.isFinite(layerStrokeWidth)) layerStrokeWidth = 2.5;
    layerStrokeWidth = Math.min(10, Math.max(0.5, layerStrokeWidth));
    var gLyr = computeUtmGeometry(lyr.points, lyr.geomType);
    var isPrimaryParcel = (!primaryLayerId || lyr.id === primaryLayerId);

    if (lyr.geomType === "POLYGON" && lyr.points.length >= 3) {
      var polyPts = [];
      var screenPts = [];
      var sumCx = 0, sumCy = 0;
      for (var p1 = 0; p1 < lyr.points.length; p1++) {
        var s1 = toMapScreen(lyr.points[p1]);
        screenPts.push(s1);
        polyPts.push(s1.x + "," + s1.y);
        sumCx += s1.x;
        sumCy += s1.y;
      }
      var cx = sumCx / lyr.points.length;
      var cy = sumCy / lyr.points.length;

      // چندضلعی با داخل شفاف تا بافت زمین روی گوگل‌ارث ۱۰۰٪ دیده شود
      vectorShapes += '<polygon points="' + polyPts.join(" ") + '" fill="' + layerColor + '" fill-opacity="' + fillOp + '" stroke="#ffffff" stroke-width="' + (isPrimaryParcel ? '4.5' : '3.2') + '" stroke-linejoin="round"/>';
      vectorShapes += '<polygon points="' + polyPts.join(" ") + '" fill="none" stroke="' + layerColor + '" stroke-width="' + (isPrimaryParcel ? '2.6' : '2.0') + '" stroke-linejoin="round"/>';

      // نمایش طول اضلاع و کد رئوس فقط در بیرون مرز زمین اصلی (یا لایه متمرکز) تا هیچ متنی داخل پولیگون زمین را نپوشاند
      for (var p2 = 0; p2 < lyr.points.length; p2++) {
        var nxt = (p2 + 1) % lyr.points.length;
        var a = screenPts[p2];
        var b = screenPts[nxt];
        var dist = Math.sqrt(Math.pow(lyr.points[nxt].x - lyr.points[p2].x, 2) + Math.pow(lyr.points[nxt].y - lyr.points[p2].y, 2));
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;

        // دایره ظریف رأس
        vectorShapes += '<circle cx="' + a.x + '" cy="' + a.y + '" r="' + (isPrimaryParcel ? '4' : '3') + '" fill="#ffffff" stroke="' + layerColor + '" stroke-width="2"/>';

        if (!isPrimaryParcel) continue;

        // محاسبه بردار بیرونی رأس نسبت به مرکز پولیگون
        var vx = a.x - cx;
        var vy = a.y - cy;
        var vLen = Math.sqrt(vx * vx + vy * vy) || 1;
        var ux = vx / vLen;
        var uy = vy / vLen;
        var lbl = safeHtmlText(lyr.points[p2].label || ("P" + (p2 + 1)));

        if (croquisPrintLabelOpts.showPoints && coordMode !== "NONE") {
          if (coordMode === "OUTER_CALLOUT_XY") {
            // حالت راهنمای خطی (Leader Line Callout) در بیرون زمین برای نمایش کد + مختصات بدون پوشاندن پولیگون
            var calloutDist = radialDist + 14;
            var endX = Math.round(a.x + ux * calloutDist);
            var endY = Math.round(a.y + uy * calloutDist);
            var shelfDir = ux >= 0 ? 1 : -1;
            var shelfEndX = endX + shelfDir * 12;
            var txtAnchor = ux >= 0 ? "start" : "end";
            var txtX = shelfEndX + shelfDir * 3;
            var coordStr = lbl + " (" + Math.round(lyr.points[p2].x) + "," + Math.round(lyr.points[p2].y) + ")";
            vectorShapes += '<polyline points="' + a.x + ',' + a.y + ' ' + endX + ',' + endY + ' ' + shelfEndX + ',' + endY + '" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="2,2"/>';
            vectorShapes += '<text x="' + txtX + '" y="' + (endY + 3) + '" fill="#ffffff" font-size="8.6" font-weight="900" text-anchor="' + txtAnchor + '" style="' + haloStyle + '">' + coordStr + '</text>';
          } else {
            // حالت کد نقطه (P1, P2, ...) در بیرون رأس با فاصله قابل تنظیم
            var lblX = Math.round(a.x + ux * radialDist);
            var lblY = Math.round(a.y + uy * radialDist) + 3;
            vectorShapes += '<text x="' + lblX + '" y="' + lblY + '" fill="#ffffff" font-size="10" font-weight="900" text-anchor="middle" style="' + haloStyle + '">' + lbl + '</text>';
          }
        }

        // متراژ ضلع در بیرون ضلع (در امتداد بردار عمود بر ضلع به سمت بیرون پولیگون تا هرگز داخل زمین نیفتد)
        var screenEdgeLen = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
        if (croquisPrintLabelOpts.showSides && screenEdgeLen >= 18) {
          var edx = b.x - a.x;
          var edy = b.y - a.y;
          var nx = -edy / (screenEdgeLen || 1);
          var ny = edx / (screenEdgeLen || 1);
          // جهت‌دهی بردار عمود به سمت بیرون مرکز ثقل پولیگون
          if (nx * (mx - cx) + ny * (my - cy) < 0) {
            nx = -nx;
            ny = -ny;
          }
          var sideDist = Math.max(13, Math.round(radialDist * 0.76));
          var sideX = Math.round(mx + nx * sideDist);
          var sideY = Math.round(my + ny * sideDist) + 3;
          var distTxt = dist < 10 ? toFa(dist.toFixed(1)) : toFa(Math.round(dist));
          vectorShapes += '<text x="' + sideX + '" y="' + sideY + '" fill="#fde047" font-size="9.5" font-weight="bold" text-anchor="middle" style="' + haloStyle + '">' + distTxt + ' م</text>';
        }
      }

      // در صورتی که کاربر حالت «خط راهنمای عوارض داخلی به بیرون زمین» را انتخاب کرده باشد، نام عارضه داخلی در بیرون مرز زمین درج می‌شود
      if (!isPrimaryParcel && coordMode === "OUTER_WITH_SUBLAYERS") {
        var callY = (subCalloutIdx % 2 === 0) ? Math.max(18, outerMinY - radialDist - 12) : Math.min(svgH - 16, outerMaxY + radialDist + 16);
        var callX = Math.max(90, Math.min(svgW - 90, Math.round(cx + (subCalloutIdx - 1) * 45)));
        subCalloutIdx++;
        vectorShapes += '<line x1="' + Math.round(cx) + '" y1="' + Math.round(cy) + '" x2="' + callX + '" y2="' + (callY + (callY < cy ? 4 : -8)) + '" stroke="' + layerColor + '" stroke-width="1.5" stroke-dasharray="3,2"/>';
        vectorShapes += '<text x="' + callX + '" y="' + callY + '" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle" style="' + haloStyle + '">' + safeLayerName + '</text>';
      }

      // عنوان لایه اصلی: در صورت فعال شدن، در بالای کادر بیرونی پولیگون قرار می‌گیرد تا مرکز زمین را نپوشاند
      if (isPrimaryParcel && croquisPrintLabelOpts.showCenterTitle) {
        var minScreenY = screenPts[0].y;
        for (var sy = 1; sy < screenPts.length; sy++) {
          if (screenPts[sy].y < minScreenY) minScreenY = screenPts[sy].y;
        }
        var titleY = Math.max(20, minScreenY - radialDist - 12);
        vectorShapes += '<text x="' + Math.round(cx) + '" y="' + Math.round(titleY) + '" fill="#fde047" font-size="10.5" font-weight="900" text-anchor="middle" style="' + haloStyle + '">' +
          safeLayerName + ' (' + toFa(Math.round(gLyr.area)) + ' م.م)' +
        '</text>';
      }
    } else if (lyr.geomType === "LINE" && lyr.points.length >= 2) {
      var linePts = [];
      for (var p3 = 0; p3 < lyr.points.length; p3++) {
        var s3 = toMapScreen(lyr.points[p3]);
        linePts.push(s3.x + "," + s3.y);
        vectorShapes += '<circle cx="' + s3.x + '" cy="' + s3.y + '" r="3.5" fill="#ffffff" stroke="' + layerColor + '" stroke-width="2"/>';
        if (isPrimaryParcel && croquisPrintLabelOpts.showPoints && coordMode !== "NONE") {
          var lLbl = safeHtmlText(lyr.points[p3].label || ("L" + (p3 + 1)));
          vectorShapes += '<text x="' + s3.x + '" y="' + (s3.y - radialDist * 0.6) + '" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle" style="' + haloStyle + '">' + lLbl + '</text>';
        }
      }
      vectorShapes += '<polyline points="' + linePts.join(" ") + '" fill="none" stroke="#ffffff" stroke-width="4.2"/>';
      vectorShapes += '<polyline points="' + linePts.join(" ") + '" fill="none" stroke="' + layerColor + '" stroke-width="2.4" stroke-dasharray="6,3"/>';
    } else {
      for (var p4 = 0; p4 < lyr.points.length; p4++) {
        var s4 = toMapScreen(lyr.points[p4]);
        vectorShapes += '<circle cx="' + s4.x + '" cy="' + s4.y + '" r="5.5" fill="#ffffff" stroke="' + layerColor + '" stroke-width="3"/>';
        if (isPrimaryParcel || coordMode === "OUTER_WITH_SUBLAYERS") {
          // هدایت برچسب نقطه به بیرون مرز بالایی پولیگون اصلی تا داخل زمین را نپوشاند
          var ptOutY = isPrimaryParcel ? (s4.y - radialDist) : Math.max(18, outerMinY - radialDist - 10);
          var ptOutX = s4.x;
          if (!isPrimaryParcel) {
            vectorShapes += '<line x1="' + s4.x + '" y1="' + s4.y + '" x2="' + ptOutX + '" y2="' + (ptOutY + 4) + '" stroke="' + layerColor + '" stroke-width="1.4" stroke-dasharray="3,2"/>';
          }
          vectorShapes += '<text x="' + ptOutX + '" y="' + ptOutY + '" fill="#fde047" font-size="9" font-weight="bold" text-anchor="middle" style="' + haloStyle + '">' + safeHtmlText(lyr.points[p4].label || lyr.name || "نقطه") + '</text>';
        }
      }
    }
  }

  // محاسبه مقیاس گرافیکی واقعی بر اساس متر بر پیکسل در این عرض جغرافیایی و زوم
  var metersPerPixel = (156543.03392 * Math.cos(centerLat * Math.PI / 180)) / Math.pow(2, optZoom);
  var rawScaleMeters = 75 * metersPerPixel;
  var scaleTargetMeters = rawScaleMeters < 15 ? Math.max(5, Math.round(rawScaleMeters / 5) * 5) : Math.max(10, Math.round(rawScaleMeters / 10) * 10);
  var scalePx = Math.round(scaleTargetMeters / metersPerPixel);

  var hudCompassAndScale =
    '<g transform="translate(42, 44)">' +
      '<circle cx="0" cy="0" r="20" fill="#0f172a" fill-opacity="0.85" stroke="#f59e0b" stroke-width="2"/>' +
      '<polygon points="0,-16 -6,6 0,2 6,6" fill="#ef4444"/>' +
      '<polygon points="0,2 -6,6 0,16 6,6" fill="#ffffff"/>' +
      '<text x="0" y="-23" fill="#ffffff" font-size="10.5" font-weight="bold" text-anchor="middle" style="' + haloStyle + '">N شمال</text>' +
    '</g>' +
    '<g transform="translate(28, ' + (svgH - 22) + ')">' +
      '<rect x="-6" y="-18" width="' + (scalePx + 12) + '" height="26" rx="4" fill="#0f172a" fill-opacity="0.88" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="0" y1="0" x2="' + scalePx + '" y2="0" stroke="#facc15" stroke-width="3.5"/>' +
      '<line x1="0" y1="-6" x2="0" y2="6" stroke="#facc15" stroke-width="2.5"/>' +
      '<line x1="' + scalePx + '" y1="-6" x2="' + scalePx + '" y2="6" stroke="#facc15" stroke-width="2.5"/>' +
      '<text x="' + Math.round(scalePx / 2) + '" y="-7" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle">مقیاس: ' + toFa(scaleTargetMeters) + ' متر</text>' +
    '</g>' +
    '<g transform="translate(' + (svgW - 18) + ', ' + (svgH - 12) + ')">' +
      '<text x="0" y="0" fill="#ffffff" font-size="8.8" font-weight="bold" text-anchor="end" style="' + haloStyle + '">' +
        (selectedMode === "GOOGLE_HYBRID" ? "🗺️ نقشه ترکیبی هیبرید گوگل‌ارث" : "🛰️ نقشه ماهواره‌ای گوگل‌ارث (Google Earth)") + ' | زوم ' + toFa(optZoom) + ' | WGS84 / Zone ' + toFa(defaultZone) +
      '</text>' +
    '</g>';

  var cropOverlayBadge =
    '<div class="no-print" style="position:absolute;top:8px;right:8px;background:rgba(15,23,42,0.82);color:#facc15;font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid #facc15;pointer-events:none;direction:rtl;">' +
      (croquisPrintLabelOpts.interactiveCropBoxMode
        ? "✂️ حالت برش فعال: مستطیل محدوده دلخواه را با ماوس روی نقشه بکشید"
        : "✋ جابجایی کادر برش با کشیدن ماوس (Drag) | چرخ ماوس = زوم") +
    '</div>';

  var clipId = "croquis-print-clip-" + Math.floor(Math.random() * 100000);
  return '<div class="printed-croquis-satellite-box" dir="ltr" style="position:relative; width:100%; border:2px solid #14532d; border-radius:6px; background:#0f172a; margin:0 auto; overflow:hidden; direction:ltr; user-select:none; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important;">' +
    cropOverlayBadge +
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + svgW + ' ' + svgH + '" width="100%" style="width:100%; height:auto; max-height:' + svgH + 'px; display:block; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important;">' +
      '<defs><clipPath id="' + clipId + '"><rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" /></clipPath></defs>' +
      '<g clip-path="url(#' + clipId + ')">' +
        '<rect x="0" y="0" width="' + svgW + '" height="' + svgH + '" fill="#0f172a" />' +
        svgTilesMarkup +
        vectorShapes +
        hudCompassAndScale +
      '</g>' +
    '</svg>' +
  '</div>';
}

window.setCroquisPrintFocusLayer = function(layerId) {
  window.croquisPrintFocusLayerId = layerId || "AUTO_ALL";
  croquisPrintPanOffset = { dx: 0, dy: 0 };
  if (currentPreviewMode === "CROQUIS") {
    printUtmSketchSheet();
  }
};

/* چاپ رسمی کروکی چندلایه زمین به تفکیک ۲ برگه مجزا (برگه اول: نقشه ماهواره‌ای با ابزار تعاملی برش کادر و برگه دوم: جداول مساحت و مختصات کامل X, Y, ارتفاع, Zone) */
function printUtmSketchSheet() {
  var c = getActiveCase();
  if (!c) {
    requireActiveCase("چاپ برگه کروکی مهندسی زمین", function () { printUtmSketchSheet(); });
    return;
  }
  if (currentPreviewMode !== "CROQUIS") {
    if (!confirmDiscardLetterChanges("با آماده‌سازی کروکی، پیش‌نمایش یا ویرایش نامه جایگزین می‌شود.")) return false;
    clearUnsavedLetterStateAfterConfirmation();
  }
  var m = getActiveCroquisMap();
  if (!m) return;
  currentPreviewMode = "CROQUIS";
  currentPreviewLetterId = null;
  currentPreviewDraft = null;
  updatePaperActionButtons();
  applyDynamicPrintPageSizeCSS(currentPaperSize);
  var d = window.getInquiryDataObject();

  var isA5 = currentPaperSize === "A5";
  var svgW = 680;
  var defaultSheetHeight = isA5 ? 185 : 345;
  var requestedSheetHeight = Number(isA5 ? croquisPrintLabelOpts.boxHeightA5 : croquisPrintLabelOpts.boxHeightA4);
  var svgH = Number.isFinite(requestedSheetHeight)
    ? Math.round(Math.min(isA5 ? 265 : 420, Math.max(isA5 ? 170 : 250, requestedSheetHeight)))
    : defaultSheetHeight;
  var allowedZooms = ["AUTO","14","15","16","17","18","19","20","21"];
  if (allowedZooms.indexOf(String(croquisPrintZoomLevel)) === -1) croquisPrintZoomLevel = "AUTO";
  var allowedMapModes = ["GOOGLE_SAT","GOOGLE_HYBRID","CAD"];
  if (allowedMapModes.indexOf(String(croquisPrintMapMode)) === -1) croquisPrintMapMode = "GOOGLE_SAT";
  var printedMapMarkup = buildPrintedCroquisMap(m, svgW, svgH, croquisPrintMapMode);
  var activeZoomDisplay = croquisPrintZoomLevel === "AUTO"
    ? ("خودکار (" + toFa(window._lastComputedPrintZoom || 18) + ")")
    : ("زوم " + toFa(croquisPrintZoomLevel));

  var legendPills = "";
  var focusLayerOpts = '<option value="AUTO_ALL"' + ((!window.croquisPrintFocusLayerId || window.croquisPrintFocusLayerId === "AUTO_ALL") ? " selected" : "") + '>🎯 همه لایه‌های مرئی</option>';
  for (var mi = 0; mi < m.layers.length; mi++) {
    var ly = m.layers[mi] || {};
    if (!ly.visible) continue;
    var gL = computeUtmGeometry(ly.points || [], ly.geomType);
    var safeLyName = safeHtmlText(ly.name || "لایه بدون نام");
    var safeLyId = safeHtmlText(ly.id || "");
    var safeLyColor = safeHexColor(ly.color, "#15803d");
    legendPills += '<span style="display:inline-block;padding:' + (isA5 ? '1px 5px' : '2px 7px') + ';border-radius:4px;border:1px solid #ccc;background:#f8fafc;font-size:' + (isA5 ? '6.9pt' : '8.4pt') + ';margin:' + (isA5 ? '1px 2px' : '2px 4px') + ';">' +
      '<span style="display:inline-block;width:8px;height:8px;background:' + safeLyColor + ';border-radius:2px;margin-left:3px;"></span>' +
      '<b>' + safeLyName + '</b>: ' + (ly.geomType === "POLYGON" ? (safeHtmlText(toFa(Math.round(gL.area))) + ' م.م (' + safeHtmlText(toFa(gL.ha.toFixed(2))) + ' هـ)') : (safeHtmlText(toFa(Math.round(gL.perim))) + ' م')) +
    '</span>';
    focusLayerOpts += '<option value="' + safeLyId + '"' + (window.croquisPrintFocusLayerId === ly.id ? " selected" : "") + '>🎯 تمرکز کادر روی: ' + safeLyName + '</option>';
  }

  var zoomOptsHtml =
    '<option value="AUTO"' + (croquisPrintZoomLevel === "AUTO" ? " selected" : "") + '>🔍 زوم خودکار (' + toFa(window._lastComputedPrintZoom || 18) + ')</option>' +
    '<option value="21"' + (croquisPrintZoomLevel === "21" ? " selected" : "") + '>زوم ۲۱ (بسیار نزدیک - قطعات کوچک)</option>' +
    '<option value="20"' + (croquisPrintZoomLevel === "20" ? " selected" : "") + '>زوم ۲۰ (خیلی نزدیک - جزئیات کامل)</option>' +
    '<option value="19"' + (croquisPrintZoomLevel === "19" ? " selected" : "") + '>زوم ۱۹ (نزدیک - استاندارد زمین)</option>' +
    '<option value="18"' + (croquisPrintZoomLevel === "18" ? " selected" : "") + '>زوم ۱۸ (متوسط - زمین و اطراف)</option>' +
    '<option value="17"' + (croquisPrintZoomLevel === "17" ? " selected" : "") + '>زوم ۱۷ (دید کلی باغات و جاده)</option>' +
    '<option value="16"' + (croquisPrintZoomLevel === "16" ? " selected" : "") + '>زوم ۱۶ (دید منطقه‌ای)</option>' +
    '<option value="15"' + (croquisPrintZoomLevel === "15" ? " selected" : "") + '>زوم ۱۵ (دید روستا و دشت)</option>' +
    '<option value="14"' + (croquisPrintZoomLevel === "14" ? " selected" : "") + '>زوم ۱۴ (دید پهنه وسیع)</option>';

  var curRadialRaw = Number(croquisPrintLabelOpts.labelRadialOffset);
  var curRadial = Number.isFinite(curRadialRaw) ? Math.round(Math.min(55, Math.max(10, curRadialRaw))) : 22;
  var curPadRaw = Number(croquisPrintLabelOpts.cropPaddingFactor);
  var curPad = Number.isFinite(curPadRaw) ? Math.min(0.82, Math.max(0.30, curPadRaw)) : 0.56;
  var allowedCoordModes = ["OUTER_CODE","OUTER_CALLOUT_XY","OUTER_WITH_SUBLAYERS","NONE"];
  var cMode = allowedCoordModes.indexOf(croquisPrintLabelOpts.coordDisplayMode) !== -1 ? croquisPrintLabelOpts.coordDisplayMode : "OUTER_CODE";

  // پنل تعاملی تنظیم کادر برش نقشه گوگل‌ارث (Interactive Crop Area) و فاصله برچسب‌ها از پولیگون (بدون چاپ در کاغذ)
  var mapModeControls =
    '<div class="no-print mb-2 p-2 rounded bg-white shadow-sm border border-2 border-success" style="font-size:8.4pt; max-width:210mm; margin:0 auto 10px auto;">' +
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-1 border-bottom">' +
        '<div class="d-flex align-items-center gap-1 flex-wrap">' +
          '<b class="text-success ms-1">🛰️ نوع نقشه:</b>' +
          '<button type="button" class="btn btn-sm ' + (croquisPrintMapMode === "GOOGLE_SAT" ? "btn-success fw-bold" : "btn-outline-success") + ' py-0 px-2" onclick="setCroquisPrintMapMode(\'GOOGLE_SAT\')">🛰️ ماهواره گوگل‌ارث</button>' +
          '<button type="button" class="btn btn-sm ' + (croquisPrintMapMode === "GOOGLE_HYBRID" ? "btn-success fw-bold" : "btn-outline-success") + ' py-0 px-2" onclick="setCroquisPrintMapMode(\'GOOGLE_HYBRID\')">🗺️ هیبرید گوگل‌ارث</button>' +
          '<button type="button" class="btn btn-sm ' + (croquisPrintMapMode === "CAD" ? "btn-success fw-bold" : "btn-outline-success") + ' py-0 px-2" onclick="setCroquisPrintMapMode(\'CAD\')">📐 بوم مهندسی CAD</button>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-1 flex-wrap">' +
          '<b class="text-primary ms-1">🔍 زوم و کادر برش:</b>' +
          '<button type="button" id="btn-interactive-crop-box" class="btn btn-sm ' + (croquisPrintLabelOpts.interactiveCropBoxMode ? "btn-warning text-dark fw-bold border-dark" : "btn-outline-primary fw-bold") + ' py-0 px-2" onclick="setCroquisCropOption(\'interactiveCropBoxMode\', !croquisPrintLabelOpts.interactiveCropBoxMode)" title="با انتخاب این گزینه، مستطیل محدوده برش دلخواه را با ماوس روی نقشه بکشید">' +
            '✂️ رسم کادر برش با ماوس ' + (croquisPrintLabelOpts.interactiveCropBoxMode ? "(فعال)" : "") +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-primary py-0 px-2 fw-bold" onclick="stepCroquisPrintZoom(1)" title="زوم بیشتر (بزرگنمایی پولیگون)">➕</button>' +
          '<select id="crq-sheet-zoom-select" class="form-select form-select-sm d-inline-block w-auto py-0 fw-bold border-primary" style="font-size:8.2pt; width:auto !important; display:inline-block !important;" onchange="setCroquisPrintZoom(this.value)">' + zoomOptsHtml + '</select>' +
          '<button type="button" class="btn btn-sm btn-outline-primary py-0 px-2 fw-bold" onclick="stepCroquisPrintZoom(-1)" title="زوم کمتر (دید وسیع‌تر)">➖</button>' +
          '<select class="form-select form-select-sm d-inline-block w-auto py-0 border-secondary" style="font-size:8pt; width:auto !important; display:inline-block !important;" onchange="setCroquisPrintFocusLayer(this.value)">' + focusLayerOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="row g-2 align-items-center mb-1 pb-1 border-bottom">' +
        '<div class="col-md-4 d-flex align-items-center gap-1">' +
          '<label class="fw-bold text-dark text-nowrap" for="crq-label-offset-slider">↔️ فاصله مشخصات از پولیگون (' + toFa(curRadial) + 'px):</label>' +
          '<input type="range" id="crq-label-offset-slider" class="form-range" min="10" max="55" step="2" value="' + curRadial + '" onchange="setCroquisCropOption(\'labelRadialOffset\', this.value)" title="تنظیم فاصله کد رئوس و متراژ اضلاع به سمت بیرون تا روی پولیگون زمین نیفتد">' +
        '</div>' +
        '<div class="col-md-4 d-flex align-items-center gap-1">' +
          '<label class="fw-bold text-dark text-nowrap" for="crq-crop-padding-slider">🖼️ حاشیه برش اطراف زمین:</label>' +
          '<input type="range" id="crq-crop-padding-slider" class="form-range" min="0.30" max="0.82" step="0.04" value="' + curPad + '" onchange="setCroquisCropOption(\'cropPaddingFactor\', this.value)" title="تنظیم میزان فضای باز اطراف پولیگون در کادر برش">' +
        '</div>' +
        '<div class="col-md-4 d-flex align-items-center gap-1">' +
          '<label class="fw-bold text-dark text-nowrap" for="crq-crop-height-slider">📐 ارتفاع کادر نقشه (' + toFa(svgH) + 'px):</label>' +
          '<input type="range" id="crq-crop-height-slider" class="form-range" min="' + (isA5 ? 170 : 250) + '" max="' + (isA5 ? 265 : 420) + '" step="10" value="' + svgH + '" onchange="setCroquisCropOption(\'boxHeight\', this.value)" title="تنظیم ارتفاع کادر برش نقشه در شیت چاپی">' +
        '</div>' +
      '</div>' +
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
        '<div class="d-flex align-items-center gap-1 flex-wrap">' +
          '<b class="text-secondary ms-1">🏷️ چیدمان مشخصات بیرون زمین:</b>' +
          '<select id="crq-coord-display-mode" class="form-select form-select-sm d-inline-block w-auto py-0 fw-bold border-dark" style="font-size:8pt; width:auto !important; display:inline-block !important;" onchange="setCroquisCropOption(\'coordDisplayMode\', this.value)">' +
            '<option value="OUTER_CODE"' + (cMode === "OUTER_CODE" ? " selected" : "") + '>📍 کد رئوس در بیرون گوشه‌ها (P1..Pn - بدون پوشاندن داخل زمین)</option>' +
            '<option value="OUTER_CALLOUT_XY"' + (cMode === "OUTER_CALLOUT_XY" ? " selected" : "") + '>📐 خط راهنما + مختصات (X,Y) در حاشیه بیرون زمین</option>' +
            '<option value="OUTER_WITH_SUBLAYERS"' + (cMode === "OUTER_WITH_SUBLAYERS" ? " selected" : "") + '>🏷️ کد رئوس + خط راهنمای عوارض به بیرون مرز زمین</option>' +
            '<option value="NONE"' + (cMode === "NONE" ? " selected" : "") + '>🚫 بدون کد رئوس روی نقشه (فقط در جدول)</option>' +
          '</select>' +
          '<button type="button" class="btn btn-sm ' + (croquisPrintLabelOpts.showSides ? "btn-dark" : "btn-outline-secondary") + ' py-0 px-2" onclick="toggleCroquisPrintOpt(\'showSides\')">📏 متراژ اضلاع (' + (croquisPrintLabelOpts.showSides ? "بیرون ضلع" : "مخفی") + ')</button>' +
          '<button type="button" class="btn btn-sm ' + (croquisPrintLabelOpts.showCenterTitle ? "btn-warning text-dark fw-bold" : "btn-outline-secondary") + ' py-0 px-2" onclick="toggleCroquisPrintOpt(\'showCenterTitle\')">🏷️ عنوان بالای پولیگون (' + (croquisPrintLabelOpts.showCenterTitle ? "فعال" : "مخفی") + ')</button>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-1">' +
          '<span class="text-muted small">جابجایی کادر برش:</span>' +
          '<button type="button" class="btn btn-sm btn-outline-dark py-0 px-1" onclick="panCroquisPrintMap(0, -50)" title="حرکت کادر به بالا">⬆️</button>' +
          '<button type="button" class="btn btn-sm btn-outline-dark py-0 px-1" onclick="panCroquisPrintMap(0, 50)" title="حرکت کادر به پایین">⬇️</button>' +
          '<button type="button" class="btn btn-sm btn-outline-dark py-0 px-1" onclick="panCroquisPrintMap(-50, 0)" title="حرکت کادر به چپ">⬅️</button>' +
          '<button type="button" class="btn btn-sm btn-outline-dark py-0 px-1" onclick="panCroquisPrintMap(50, 0)" title="حرکت کادر به راست">➡️</button>' +
          '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" onclick="resetCroquisCropAndLabels()" title="بازنشانی کادر برش و فاصله برچسب‌ها">🔄 بازنشانی کادر</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // برگه اول: نقشه و کروکی ماهواره‌ای زمین و عوارض
  var isA5Sheet = currentPaperSize === "A5";
  var sheet1Content =
    '<div style="text-align:center;font-weight:900;font-size:' + (isA5Sheet ? '9.6pt' : '11.5pt') + ';margin-bottom:' + (isA5Sheet ? '1.2mm' : '2mm') + ';color:#14532d;">' +
      safeHtmlText(m.title) + ' (سیستم مختصات UTM - Zone ' + safeHtmlText(toFa(m.utmZone)) + ' | ' + safeHtmlText(activeZoomDisplay) + ')' +
    '</div>' +
    '<div style="border:1.5px solid #000;padding:' + (isA5Sheet ? '1.4mm 2.5mm' : '2mm 4mm') + ';border-radius:5px;font-size:' + (isA5Sheet ? '7.6pt' : '9pt') + ';margin-bottom:' + (isA5Sheet ? '1.5mm' : '2.2mm') + ';display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;background:#f8fafc;">' +
      '<span><b>متقاضی:</b> ' + safeHtmlText(c.name) + '</span>' +
      '<span><b>کد ملی/شناسه:</b> ' + safeHtmlText(toFa(c.nid)) + '</span>' +
      '<span><b>کلاسه پرونده:</b> ' + safeHtmlText(toFa(c.code)) + '</span>' +
      '<span><b>موقعیت اراضی:</b> ' + safeHtmlText(c.loc) + '</span>' +
      '<span><b>تاریخ کروکی:</b> ' + safeHtmlText(toFa(m.date || todayShamsi())) + '</span>' +
    '</div>' +
    '<div id="printed-croquis-map-holder" style="width:100%;text-align:center;margin-bottom:' + (isA5Sheet ? '1.2mm' : '2mm') + ';">' + printedMapMarkup + '</div>' +
    '<div style="font-size:' + (isA5Sheet ? '7.4pt' : '8.5pt') + ';margin-bottom:1mm;"><b>راهنمای لایه‌ها و عوارض جانمایی‌شده:</b><br>' + legendPills + '</div>' +
    (m.notes ? '<div style="font-size:' + (isA5Sheet ? '7.2pt' : '8.4pt') + ';background:#f1f5f9;padding:1.5mm 2mm;border-radius:4px;border:1px solid #e2e8f0;"><b>توضیحات کارشناس:</b> ' + safeHtmlText(m.notes) + '</div>' : '');

  // برگه دوم: جداول تفکیک مساحت و مختصات کامل (X, Y, ارتفاع, Zone, Lat/Lng) زمین اصلی و کلیه عوارض
  var layersRows = "";
  var coordRows = "";
  var rowCounter = 1;
  var defaultZoneNum = parseInt(m.utmZone, 10) || 39;

  for (var i = 0; i < m.layers.length; i++) {
    var l = m.layers[i];
    if (!l.visible) continue;
    var g = computeUtmGeometry(l.points, l.geomType);
    var catRole = l.category === "MAIN_PARCEL" ? "محدوده اصلی زمین (عرصه کل)" : "عارضه انتخاب‌شده";
    layersRows += '<tr>' +
      '<td><span style="display:inline-block;width:9px;height:9px;background:' + safeHexColor(l.color, "#15803d") + ';margin-left:3px;border-radius:2px;"></span><b>' + safeHtmlText(l.name) + '</b></td>' +
      '<td>' + catRole + ' (' + (l.geomType === "POLYGON" ? "چندضلعی" : (l.geomType === "LINE" ? "خطی" : "نقطه‌ای")) + ')</td>' +
      '<td>' + toFa(l.points.length) + '</td>' +
      '<td><b>' + (l.geomType === "POLYGON" ? (toFa(Math.round(g.area)) + " م.م (" + toFa(g.ha.toFixed(2)) + " هکتار)") : "---") + '</b></td>' +
      '<td>' + toFa(g.perim.toFixed(1)) + ' متر</td>' +
    '</tr>';

    for (var p = 0; p < l.points.length; p++) {
      var ptObj = ensurePointEnriched(l.points[p], defaultZoneNum, p);
      var sideL = (g.sides && g.sides[p]) ? (toFa(g.sides[p].len.toFixed(1)) + " م") : "---";
      var elevTxt = (ptObj.elev !== undefined && ptObj.elev !== "" && Number(ptObj.elev) !== 0) ? (toFa(ptObj.elev) + " م") : "۰";
      coordRows += '<tr>' +
        '<td>' + toFa(rowCounter++) + '</td>' +
        '<td><b>' + safeHtmlText(l.name) + '</b></td>' +
        '<td>' + safeHtmlText(ptObj.label || ("P" + (p + 1))) + '</td>' +
        '<td dir="ltr">' + safeHtmlText(toFa(ptObj.x)) + '</td>' +
        '<td dir="ltr">' + safeHtmlText(toFa(ptObj.y)) + '</td>' +
        '<td dir="ltr">' + safeHtmlText(elevTxt) + '</td>' +
        '<td>' + safeHtmlText(toFa(ptObj.zone || defaultZoneNum)) + '</td>' +
        '<td dir="ltr" style="font-size:' + (isA5Sheet ? '6.2pt' : '7.4pt') + ';">' + safeHtmlText(Number(ptObj.lat).toFixed(5)) + ', ' + safeHtmlText(Number(ptObj.lng).toFixed(5)) + '</td>' +
        '<td>' + sideL + '</td>' +
      '</tr>';
    }
  }

  var sheet2Content =
    '<div style="text-align:center;font-weight:900;font-size:' + (isA5Sheet ? '9.5pt' : '11.5pt') + ';margin-bottom:' + (isA5Sheet ? '1.2mm' : '2mm') + ';color:#14532d;">' +
      'جداول تفکیک مساحت و مختصات UTM / جغرافیایی عرصه و عوارض (' + safeHtmlText(m.title) + ')' +
    '</div>' +
    '<div style="border:1.5px solid #000;padding:' + (isA5Sheet ? '1.4mm 2.5mm' : '2mm 4mm') + ';border-radius:5px;font-size:' + (isA5Sheet ? '7.5pt' : '8.8pt') + ';margin-bottom:' + (isA5Sheet ? '1.5mm' : '2.2mm') + ';display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;background:#f8fafc;">' +
      '<span><b>متقاضی:</b> ' + safeHtmlText(c.name) + '</span>' +
      '<span><b>کد ملی:</b> ' + safeHtmlText(toFa(c.nid)) + '</span>' +
      '<span><b>کلاسه پرونده:</b> ' + safeHtmlText(toFa(c.code)) + '</span>' +
      '<span><b>موقعیت:</b> ' + safeHtmlText(c.loc) + '</span>' +
      '<span><b>پیوست:</b> شیت نقشه (برگه ۱)</span>' +
    '</div>' +
    '<div style="font-size:' + (isA5Sheet ? '7.6pt' : '8.8pt') + ';font-weight:bold;margin-bottom:1mm;color:#1e3a8a;">الف) جدول لایه‌ها و تفکیک مساحت زمین اصلی و مابقی عوارض انتخاب‌شده:</div>' +
    '<table class="utm-table-print" style="width:100%;font-size:' + (isA5Sheet ? '6.8pt' : '8.2pt') + ';margin-bottom:' + (isA5Sheet ? '1.5mm' : '2.5mm') + ';">' +
      '<thead><tr style="background:#eef3ee;"><th>نام لایه / عارضه</th><th>نقش و نوع هندسی</th><th>تعداد رئوس</th><th>مساحت محاسبه‌شده</th><th>محیط / طول</th></tr></thead>' +
      '<tbody>' + layersRows + '</tbody>' +
    '</table>' +
    '<div style="font-size:' + (isA5Sheet ? '7.6pt' : '8.8pt') + ';font-weight:bold;margin-bottom:1mm;color:#1e3a8a;">ب) جدول جامع مختصات بخش‌بندی‌شده (X، Y، ارتفاع، Zone و طول و عرض جغرافیایی):</div>' +
    '<table class="utm-table-print" style="width:100%;font-size:' + (isA5Sheet ? '6.6pt' : '7.8pt') + ';margin-bottom:' + (isA5Sheet ? '1.5mm' : '2mm') + ';">' +
      '<thead><tr style="background:#eef3ee;"><th>ردیف</th><th>نام زمین / عارضه</th><th>کد نقطه</th><th>X (شرقی)</th><th>Y (شمالی)</th><th>ارتفاع (متر)</th><th>Zone</th><th>طول و عرض (Lat, Lng)</th><th>طول ضلع</th></tr></thead>' +
      '<tbody>' + coordRows + '</tbody>' +
    '</table>' +
    '<div style="font-size:' + (isA5Sheet ? '7.2pt' : '8.3pt') + ';background:#fffbeb;border:1px solid #fde68a;padding:' + (isA5Sheet ? '1.4mm 2mm' : '2mm 2.5mm') + ';border-radius:4px;line-height:1.65;">' +
      '<b>گواهی فنی کارشناس:</b> صحت انطباق مختصات فوق با اراضی متقاضی و دستورالعمل‌های فنی نظام مهندسی کشاورزی و منابع طبیعی استان فارس مورد تأیید است.' +
    '</div>';

  var page1Html = buildSingleA4HTML("", sheet1Content, d.num + "/۱", d.date, "کروکی (شیت ۱)", "", false, true, currentPaperSize, false, "شیت ۱ از ۲ (نقشه)");
  var page2Html = buildSingleA4HTML("", sheet2Content, d.num + "/۲", d.date, "جداول UTM (شیت ۲)", "", false, true, currentPaperSize, false, "شیت ۲ از ۲ (جداول)");

  document.getElementById("a4-preview-stage").innerHTML = mapModeControls + page1Html + page2Html;
  updatePaperActionButtons();
  attachPrintedMapCropInteractions();
  setTimeout(autoFitPaperContent, 50);
  logCaseAction(c, "تهیه نسخه چاپی کروکی دو شیت (شیت ۱: نقشه + شیت ۲: جداول) در کاغذ " + currentPaperSize);
  saveAllDB();
  switchMainPane("pane-print");
}

function calcUtmAreaAndApply() {
  var pts = parseActiveUtm();
  if (pts.length < 3) { alert("حداقل ۳ نقطه وارد کنید."); return; }
  var g = computeUtmGeometry(pts, "POLYGON");
  var badge = document.getElementById("utm-geometry-badge");
  if (badge) badge.textContent = "مساحت هندسی: " + toFa(Math.round(g.area)) + " م.م (" + toFa(g.ha.toFixed(2)) + " هکتار) | محیط: " + toFa(g.perim.toFixed(1)) + " متر";
  if (confirm("مساحت هندسی محاسبه‌شده از روی مختصات برابر با «" + toFa(Math.round(g.area)) + " مترمربع» (" + toFa(g.ha.toFixed(2)) + " هکتار) است.\nدر کادر مساحت زمین قرار بگیرد؟")) {
    document.getElementById("c-land").value = toFa(Math.round(g.area));
  }
}

/* خروجی استاندارد KML چندلایه با تبدیل دقیق WGS84 و ارتفاع برای Google Earth */
function downloadCaseKML() {
  var c = requireActiveCase("خروجی KML برای Google Earth");
  if (!c) return;
  var m = getActiveCroquisMap();
  if (!m) return;
  var defaultZone = parseInt(m.utmZone, 10) || 39;

  var placemarks = "";
  for (var i = 0; i < m.layers.length; i++) {
    var lyr = m.layers[i];
    if (!lyr.visible || !lyr.points.length) continue;

    var coordsStr = "";
    for (var j = 0; j < lyr.points.length; j++) {
      var pt = ensurePointEnriched(lyr.points[j], defaultZone, j);
      var elevVal = parseFloat(pt.elev) || 0;
      coordsStr += pt.lng.toFixed(7) + "," + pt.lat.toFixed(7) + "," + elevVal + " ";
    }
    if (lyr.geomType === "POLYGON" && lyr.points.length >= 3) {
      var firstPt = ensurePointEnriched(lyr.points[0], defaultZone, 0);
      var firstElev = parseFloat(firstPt.elev) || 0;
      coordsStr += firstPt.lng.toFixed(7) + "," + firstPt.lat.toFixed(7) + "," + firstElev;
      var g = computeUtmGeometry(lyr.points, "POLYGON");
      placemarks +=
        '<Placemark>' +
          '<name>' + lyr.name + ' (' + c.name + ')</name>' +
          '<description>متقاضی: ' + c.name + ' | کلاسه: ' + c.code + ' | مساحت: ' + Math.round(g.area) + ' مترمربع</description>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + coordsStr.trim() + '</coordinates></LinearRing></outerBoundaryIs></Polygon>' +
        '</Placemark>';
    } else if (lyr.geomType === "LINE" && lyr.points.length >= 2) {
      placemarks +=
        '<Placemark><name>' + lyr.name + '</name><LineString><coordinates>' + coordsStr.trim() + '</coordinates></LineString></Placemark>';
    } else {
      for (var p = 0; p < lyr.points.length; p++) {
        var pg = ensurePointEnriched(lyr.points[p], defaultZone, p);
        var pElev = parseFloat(pg.elev) || 0;
        placemarks += '<Placemark><name>' + (pg.label || lyr.name) + '</name><Point><coordinates>' + pg.lng.toFixed(7) + ',' + pg.lat.toFixed(7) + ',' + pElev + '</coordinates></Point></Placemark>';
      }
    }
  }

  var kml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' + m.title + ' - ' + c.name + '</name>' + placemarks + '</Document></kml>';
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([kml], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" }));
  a.download = "GoogleEarth_" + c.name.replace(/\s+/g, "_") + ".kml";
  a.click();
  showToastMsg("فایل استاندارد KML برای مشاهده در Google Earth دانلود شد.");
}

/* وارد کردن فایل KML به لایه فعال کروکی (به همراه ارتفاع و زون) */
function importKmlFileToActiveLayer(event) {
  var f = event.target.files[0];
  if (!f) return;
  var l = getActiveCroquisLayer();
  var m = getActiveCroquisMap();
  if (!l || !m) return;
  var zoneNum = parseInt(m.utmZone, 10) || 39;

  var r = new FileReader();
  r.onload = function(ev) {
    var txt = ev.target.result || "";
    var matches = txt.match(/<coordinates>([\s\S]*?)<\/coordinates>/gi);
    if (!matches || !matches.length) {
      alert("مختصاتی در فایل KML انتخاب‌شده یافت نشد.");
      return;
    }
    var rawCoords = matches[0].replace(/<\/?coordinates>/gi, "").trim().split(/\s+/);
    var newPts = [];
    for (var i = 0; i < rawCoords.length; i++) {
      var parts = rawCoords[i].split(",");
      var lng = parseFloat(parts[0]), lat = parseFloat(parts[1]), elev = parseFloat(parts[2]) || 0;
      if (!isNaN(lat) && !isNaN(lng)) {
        var utm = latLngToUtmWGS84(lat, lng, zoneNum);
        newPts.push({
          x: utm.x,
          y: utm.y,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          elev: elev,
          zone: utm.zone || zoneNum,
          label: "K" + (newPts.length + 1)
        });
      }
    }
    if (newPts.length > 2 && newPts[0].x === newPts[newPts.length - 1].x && newPts[0].y === newPts[newPts.length - 1].y) {
      newPts.pop();
    }
    l.points = newPts;
    saveActiveLayerStyleAndMeta();
    loadActiveLayerIntoEditor();
    showToastMsg(toFa(newPts.length) + " نقطه از فایل KML به مختصات UTM تبدیل و در لایه بارگذاری شد.");
  };
  r.readAsText(f);
}

function downloadCaseAutoCAD() {
  var c = requireActiveCase("خروجی LISP اتوکد");
  if (!c) return;
  var m = getActiveCroquisMap();
  if (!m) return;
  var lsp = ";; AutoCAD LISP Generated by Center 636 Khafr\n(defun c:Draw636 ()\n";
  for (var i = 0; i < m.layers.length; i++) {
    var l = m.layers[i];
    if (!l.visible || l.points.length < 2) continue;
    lsp += "  (command \"_.PLINE\" ";
    for (var j = 0; j < l.points.length; j++) {
      var zElev = parseFloat(l.points[j].elev) || 0.0;
      lsp += "(list " + l.points[j].x + " " + l.points[j].y + " " + zElev.toFixed(2) + ") ";
    }
    lsp += (l.geomType === "POLYGON" ? "\"_C\")\n" : "\"\")\n");
  }
  lsp += "  (command \"_.ZOOM\" \"_E\") (princ))\n";
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lsp], { type: "text/plain;charset=utf-8" }));
  a.download = "Croquis636_" + c.name.replace(/\s+/g, "_") + ".lsp";
  a.click();
}

function downloadCroquisCoordinatesCSV() {
  var c = requireActiveCase("خروجی جدول مختصات و مساحت زمین");
  if (!c) return;
  var m = getActiveCroquisMap();
  if (!m) return;
  var defaultZone = parseInt(m.utmZone, 10) || 39;
  var rows = ["نام متقاضی,کلاسه پرونده,نام لایه,نوع عارضه,نقطه,X (شرقی),Y (شمالی),ارتفاع از سطح دریا (متر),Zone,عرض جغرافیایی (Lat),طول جغرافیایی (Lng),مساحت لایه (مترمربع),محیط/طول (متر)"];
  for (var i = 0; i < m.layers.length; i++) {
    var l = m.layers[i];
    var g = computeUtmGeometry(l.points, l.geomType);
    for (var j = 0; j < l.points.length; j++) {
      var pt = ensurePointEnriched(l.points[j], defaultZone, j);
      rows.push([
        c.name,
        c.code,
        l.name,
        l.geomType,
        pt.label || ("P" + (j + 1)),
        pt.x,
        pt.y,
        pt.elev || 0,
        pt.zone || defaultZone,
        pt.lat.toFixed(6),
        pt.lng.toFixed(6),
        Math.round(g.area),
        g.perim.toFixed(1)
      ].join(","));
    }
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  a.download = "UTM_Table_" + c.name.replace(/\s+/g, "_") + ".csv";
  a.click();
}

function calcUtmBufferDistance() {
  var v1x = parseFloat(toEn(document.getElementById("buf-x1").value)) || 0;
  var v1y = parseFloat(toEn(document.getElementById("buf-y1").value)) || 0;
  var v1z = document.getElementById("buf-z1") ? (parseFloat(toEn(document.getElementById("buf-z1").value)) || 0) : 0;
  var v2x = parseFloat(toEn(document.getElementById("buf-x2").value)) || 0;
  var v2y = parseFloat(toEn(document.getElementById("buf-y2").value)) || 0;
  var v2z = document.getElementById("buf-z2") ? (parseFloat(toEn(document.getElementById("buf-z2").value)) || 0) : 0;

  var p1 = createEnrichedPointFromInput(v1x, v1y, v1z, 39, "A", "AUTO");
  var p2 = createEnrichedPointFromInput(v2x, v2y, v2z, 39, "B", "AUTO");
  if (!p1 || !p2) {
    document.getElementById("buf-dist-out").innerHTML = "<span class='text-danger'>مقادیر مختصات معتبر نیست.</span>";
    return;
  }
  var dist2d = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  var dz = p2.elev - p1.elev;
  var dist3d = Math.sqrt(dist2d * dist2d + dz * dz);
  var slopePct = dist2d > 0.1 ? ((Math.abs(dz) / dist2d) * 100).toFixed(1) : "0.0";

  document.getElementById("buf-dist-out").innerHTML =
    "فاصله افقی: <span class='text-primary'>" + toFa(Math.round(dist2d)) + " متر</span> | " +
    "فاصله شیب‌دار (3D): <span class='text-success'>" + toFa(Math.round(dist3d)) + " متر</span> | " +
    "اختلاف ارتفاع: <span class='text-dark'>" + toFa(dz.toFixed(1)) + " متر (شیب " + toFa(slopePct) + "٪)</span>";
}

function buildOfflineQrSvg(seedText) {
  var hash = 2166136261;
  for (var i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  var n = 21;
  var cells = "";
  function isFinder(r, c) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= n - 7) return true;
    if (r >= n - 7 && c < 7) return true;
    return false;
  }
  function drawFinder(r0, c0) {
    return '<rect x="' + c0 + '" y="' + r0 + '" width="7" height="7" fill="#000"/>' +
           '<rect x="' + (c0 + 1) + '" y="' + (r0 + 1) + '" width="5" height="5" fill="#fff"/>' +
           '<rect x="' + (c0 + 2) + '" y="' + (r0 + 2) + '" width="3" height="3" fill="#000"/>';
  }
  cells += drawFinder(0, 0) + drawFinder(0, n - 7) + drawFinder(n - 7, 0);
  var state = Math.abs(hash) || 123456789;
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < n; c++) {
      if (isFinder(r, c)) continue;
      state = (state * 1664525 + 1013904223) >>> 0;
      if ((state & 3) === 0 || ((r + c + (hash & 7)) % 5 === 0)) {
        cells += '<rect x="' + c + '" y="' + r + '" width="1" height="1" fill="#000"/>';
      }
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" style="width:15mm;height:15mm;display:block;margin:0 auto;background:#fff;padding:1px;border:1px solid #000;">' + cells + '</svg>';
}

function toggleQrVerificationOnSheets() {
  var pages = document.querySelectorAll("#a4-preview-stage .a4-page");
  var ex = document.querySelectorAll(".qr-verify-box");
  if (ex.length) { for (var i = 0; i < ex.length; i++) ex[i].remove(); return; }
  var d = window.getInquiryDataObject();
  var q = "مرکز ۶۳۶ خفر | ش:" + d.num + " | " + d.name + " | " + d.nid;
  var svgQr = buildOfflineQrSvg(q);
  for (var j = 0; j < pages.length; j++) {
    var lCol = pages[j].querySelector(".lh-l");
    if (lCol) {
      var div = document.createElement("div");
      div.className = "qr-verify-box";
      div.style.cssText = "background:#fff;padding:2px;text-align:center;margin-top:2px;";
      div.innerHTML = svgQr;
      lCol.appendChild(div);
    }
  }
}

function exportStageToWordDoc() {
  var stage = document.getElementById("a4-preview-stage");
  if (!stage || !stage.querySelector(".a4-page") || currentPreviewMode === "EDITOR") {
    showToastMsg("ابتدا یک نامه، فرم یا کروکی را پیش‌نمایش بگیرید.", true);
    return false;
  }
  if ((currentPreviewMode === "LETTER" || currentPreviewMode === "LETTER_DRAFT") && letterDraftDirty) {
    showToastMsg("فرم نامه بعد از آخرین پیش‌نمایش تغییر کرده است؛ ابتدا دوباره پیش‌نمایش بگیرید.", true);
    return false;
  }
  var fitResult = autoFitPaperContent(stage);
  if (fitResult.pendingCount || fitResult.overflowCount) {
    showToastMsg("خروجی Word ساخته نشد؛ صفحه هنوز کامل قابل اندازه‌گیری نیست یا محتوا از محدوده بیرون می‌زند.", true);
    return false;
  }
  // خروجی Word فقط فایل می‌سازد؛ ثبت رسمی نامه باید جداگانه تأیید شود.
  var pSize = currentPaperSize || "A4";
  var c = window.__nezamOfficeLetterDraftMode === true ? null : getActiveCase();
  var firstPage = stage.querySelector(".a4-page");
  var numberEl = firstPage && firstPage.querySelector(".paper-meta-num");
  var number = numberEl ? numberEl.innerText.trim() : "Letter";
  var html = '<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8">' +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
    '<title>نامه ' + safeHtmlText(toFa(number)) + '</title><style>' + buildPaperExportCss(pSize, true) +
    '</style></head><body>' + stage.innerHTML + '</body></html>';
  var objectUrl = URL.createObjectURL(new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" }));
  var a = document.createElement("a");
  a.href = objectUrl;
  a.download = "Nameh_" + pSize + "_" + safePaperFileBase(c && c.name || (window.__nezamOfficeLetterDraftMode === true ? "Daftar" : "")) + "_" + safePaperFileBase(number) + ".doc";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1500);
  showToastMsg("فایل Word با قالب سربرگ و ابعاد " + pSize + " آماده شد.");
  return true;
}

function initBrandingAndTemplatesUI() {
  var validBrandImage = /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;
  var logoHtml = validBrandImage.test(String(brandCfg.customLogoData || ""))
    ? '<img src="' + brandCfg.customLogoData + '" style="width:100%;height:100%;object-fit:contain;border-radius:50%;">'
    : NEZAM_LOGO_SVG;
  if (document.getElementById("nav-logo-box")) document.getElementById("nav-logo-box").innerHTML = logoHtml;
  if (document.getElementById("hero-logo-box")) document.getElementById("hero-logo-box").innerHTML = logoHtml;
  if (document.getElementById("ui-hero-org")) document.getElementById("ui-hero-org").textContent = brandCfg.orgSubtitle;
  if (document.getElementById("ui-hero-office")) document.getElementById("ui-hero-office").textContent = brandCfg.officeName + " | " + brandCfg.managerTitle + ": " + brandCfg.managerName;

  if (document.getElementById("cfg-org")) document.getElementById("cfg-org").value = brandCfg.orgSubtitle;
  if (document.getElementById("cfg-office")) document.getElementById("cfg-office").value = brandCfg.officeName;
  if (document.getElementById("cfg-mgr-role")) document.getElementById("cfg-mgr-role").value = brandCfg.managerTitle;
  if (document.getElementById("cfg-mgr-name")) document.getElementById("cfg-mgr-name").value = brandCfg.managerName;
  if (document.getElementById("cfg-addr")) document.getElementById("cfg-addr").value = brandCfg.address;
  if (document.getElementById("cfg-postal")) document.getElementById("cfg-postal").value = brandCfg.postalCode;
  if (document.getElementById("cfg-phone")) document.getElementById("cfg-phone").value = brandCfg.phone;
  if (document.getElementById("cfg-color")) document.getElementById("cfg-color").value = safeHexColor(brandCfg.headerColor, "#1b4332");

  var sel = document.getElementById("cfg-tpl-key");
  if (sel) {
    var opts = "";
    for (var k in tplCfg) {
      if (!Object.prototype.hasOwnProperty.call(tplCfg, k)) continue;
      var item = tplCfg[k] || {};
      opts += '<option value="' + safeHtmlText(k) + '">' + safeHtmlText(item.btnTitle) + '</option>';
    }
    sel.innerHTML = opts;
    loadTemplateForEdit();
  }
  setPaperSize(currentPaperSize, true);
  renderTemplateButtonsInLettersPane();
  bindLetterEditorDirtyTracking();
  updateLetterScopeUI();
  if (currentPreviewMode === "EDITOR") syncLetterEditorWithActiveCase();
  updatePaperActionButtons();
  if (typeof window.initCroquisWorkspaceForActiveCase === "function") {
    window.initCroquisWorkspaceForActiveCase();
  }
}

function saveOfficeBrandingFromUI() {
  brandCfg.orgSubtitle = document.getElementById("cfg-org").value.trim();
  brandCfg.officeName = document.getElementById("cfg-office").value.trim();
  brandCfg.managerTitle = document.getElementById("cfg-mgr-role").value.trim();
  brandCfg.managerName = document.getElementById("cfg-mgr-name").value.trim();
  brandCfg.address = document.getElementById("cfg-addr").value.trim();
  brandCfg.postalCode = document.getElementById("cfg-postal").value.trim();
  brandCfg.phone = document.getElementById("cfg-phone").value.trim();
  brandCfg.headerColor = document.getElementById("cfg-color").value;
  localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
  initBrandingAndTemplatesUI();
  showToastMsg("مشخصات دفتر و سربرگ ذخیره شد.");
}

function resetOfficeBranding() {
  if (!confirm("تنظیمات سربرگ به حالت پیش‌فرض مرکز ۶۳۶ برگردد؟")) return;
  brandCfg = JSON.parse(JSON.stringify(DEFAULT_BRANDING));
  localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
  initBrandingAndTemplatesUI();
}

function uploadBrandImage(e, field) {
  var f = e.target.files[0];
  if (!f) return;
  if (["customLogoData", "customStampData"].indexOf(field) === -1) {
    alert("نوع محل ذخیره تصویر معتبر نیست.");
    e.target.value = "";
    return;
  }
  if (!/^image\/(png|jpeg|webp|gif)$/i.test(f.type || "") || f.size > 1500000) {
    alert("فقط تصویر PNG، JPG، WEBP یا GIF تا حجم ۱٫۵ مگابایت مجاز است.");
    e.target.value = "";
    return;
  }
  var r = new FileReader();
  r.onload = function(ev) {
    brandCfg[field] = ev.target.result;
    localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
    initBrandingAndTemplatesUI();
    showToastMsg("تصویر بارگذاری و اعمال شد.");
  };
  r.readAsDataURL(f);
}

function clearBrandImage(field) {
  if (["customLogoData", "customStampData"].indexOf(field) === -1) {
    showToastMsg("محل حذف تصویر معتبر نیست.", true);
    return;
  }
  brandCfg[field] = "";
  localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
  initBrandingAndTemplatesUI();
  showToastMsg("تصویر حذف شد (سربرگ بدون مهر پیش‌فرض).");
}

function loadTemplateForEdit() {
  var k = document.getElementById("cfg-tpl-key").value;
  var item = tplCfg[k];
  if (!item) return;
  document.getElementById("cfg-tpl-title").value = item.btnTitle;
  document.getElementById("cfg-tpl-rec").value = item.rec;
  document.getElementById("cfg-tpl-body").value = item.body;
}

function saveEditedTemplate() {
  var k = document.getElementById("cfg-tpl-key").value;
  if (!tplCfg[k]) return;
  tplCfg[k].btnTitle = document.getElementById("cfg-tpl-title").value.trim();
  tplCfg[k].rec = document.getElementById("cfg-tpl-rec").value.trim();
  tplCfg[k].body = document.getElementById("cfg-tpl-body").value.trim();
  localStorage.setItem("nezam636_templates_cfg", JSON.stringify(tplCfg));
  initBrandingAndTemplatesUI();
  showToastMsg("قالب نامه ذخیره شد.");
}

function addNewInquiryTemplatePrompt() {
  var t = prompt("عنوان دکمه قالب جدید (مثلاً: 🏛️ استعلام جهاد کشاورزی):");
  if (!t) return;
  var r = prompt("عنوان اداره گیرنده:") || "مدیریت محترم جهاد کشاورزی شهرستان خفر";
  var nk = "TPL_" + new Date().getTime();
  tplCfg[nk] = {
    btnTitle: t.trim(),
    rec: r.trim(),
    body: "احتراماً نظر به اینکه {نام} به کد ملی {کدملی} قصد {طرح} با ظرفیت {ظرفیت} در زمینی به مساحت {مساحت} متر مربع واقع در اراضی {موقعیت} با مختصات زیر را دارند، خواهشمند است بررسی و اعلام نظر فرمایید."
  };
  localStorage.setItem("nezam636_templates_cfg", JSON.stringify(tplCfg));
  initBrandingAndTemplatesUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBrandingAndTemplatesUI);
} else {
  initBrandingAndTemplatesUI();
}


/* =========================================================================
   ابزار ترسیم آنلاین روی نقشه (Leaflet): Point / Line / Polygon + تبدیل خودکار UTM
   ========================================================================= */
var leafletVertexLayerGroupObj = null;
var leafletDraftLayerGroupObj = null;
var croquisOnlineDrawMode = "";
var croquisOnlineDraftPoints = [];
var croquisMapVertexEditEnabled = false;

function croquisMapGetLayerById(layerId) {
  var m = getActiveCroquisMap();
  if (!m || !Array.isArray(m.layers)) return null;
  for (var i = 0; i < m.layers.length; i++) {
    if (m.layers[i].id === layerId) return m.layers[i];
  }
  return null;
}

function croquisMapSetToolStatus(message, isError) {
  var el = document.getElementById("crq-map-draw-status");
  if (!el) return;
  el.textContent = message || "";
  el.className = "small fw-bold mt-2 " + (isError ? "text-danger" : "text-primary");
}

function croquisMapSetCoordinateReadout(point) {
  var el = document.getElementById("crq-map-coordinate-readout");
  if (!el || !point) return;
  el.textContent = "Lat: " + Number(point.lat).toFixed(7) +
    " | Lng: " + Number(point.lng).toFixed(7) +
    " | UTM X: " + Number(point.x).toFixed(2) +
    " | UTM Y: " + Number(point.y).toFixed(2) +
    " | Z: " + Number(point.elev || 0).toFixed(2) +
    " | Zone: " + point.zone;
}

function croquisMapRefreshToolButtons() {
  var modes = ["POINT", "LINE", "POLYGON"];
  var ids = ["crq-draw-point-btn", "crq-draw-line-btn", "crq-draw-polygon-btn"];
  for (var i = 0; i < ids.length; i++) {
    var btn = document.getElementById(ids[i]);
    if (!btn) continue;
    var active = croquisOnlineDrawMode === modes[i];
    btn.className = "btn btn-sm px-1 py-1 " + (active ? "btn-success" : (modes[i] === "LINE" ? "btn-outline-primary" : "btn-outline-success"));
    btn.style.width = "36px";
    btn.style.height = "34px";
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  var finishBtn = document.getElementById("crq-draw-finish-btn");
  var required = croquisOnlineDrawMode === "POLYGON" ? 3 : 2;
  var canFinish = (croquisOnlineDrawMode === "LINE" || croquisOnlineDrawMode === "POLYGON") && croquisOnlineDraftPoints.length >= required;
  if (finishBtn) {
    finishBtn.disabled = !canFinish;
    finishBtn.title = croquisOnlineDrawMode === "POLYGON" ? "ثبت و ذخیره محدوده چندضلعی" : "ثبت و ذخیره مسیر";
    finishBtn.textContent = "💾";
  }
  var editBtn = document.getElementById("crq-map-edit-vertices-btn");
  if (editBtn) {
    editBtn.textContent = croquisMapVertexEditEnabled ? "✥ ویرایش رأس‌ها: روشن" : "✥ ویرایش رأس‌ها: خاموش";
    editBtn.className = "btn btn-sm " + (croquisMapVertexEditEnabled ? "btn-dark" : "btn-outline-dark");
  }
}

function croquisMapGetZoneString(mapObj) {
  var selected = document.getElementById("crq-zone-select");
  return (mapObj && mapObj.utmZone) || (selected && selected.value) || "39R";
}

function croquisMapBuildPoint(latlng, index) {
  var m = getActiveCroquisMap();
  var elevEl = document.getElementById("crq-map-draw-elev");
  var elev = elevEl && elevEl.value !== "" ? parseFloat(toEn(elevEl.value)) : 0;
  if (!isFinite(elev)) elev = 0;
  var zone = croquisMapGetZoneString(m);
  return createEnrichedPointFromInput(
    Number(latlng.lng),
    Number(latlng.lat),
    elev,
    zone,
    "P" + (index + 1),
    "GEO"
  );
}

function croquisMapCreatePopup(layer, point, pointIndex) {
  var wrap = document.createElement("div");
  wrap.style.minWidth = "190px";
  var title = document.createElement("strong");
  title.textContent = (point.label || ("P" + (pointIndex + 1))) + " — " + (layer.name || "لایه");
  wrap.appendChild(title);

  var details = document.createElement("div");
  details.className = "small mt-1";
  details.textContent =
    "X: " + Number(point.x).toFixed(2) + " | Y: " + Number(point.y).toFixed(2) +
    " | Z: " + Number(point.elev || 0) + " | " + point.zone;
  wrap.appendChild(details);

  var actions = document.createElement("div");
  actions.className = "d-flex gap-1 mt-2";
  var editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-sm btn-outline-primary";
  editBtn.textContent = "ویرایش نام/ارتفاع";
  editBtn.addEventListener("click", function () {
    window.editCroquisMapPoint(layer.id, pointIndex);
  });
  var deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-sm btn-outline-danger";
  deleteBtn.textContent = "حذف نقطه";
  deleteBtn.addEventListener("click", function () {
    window.deleteCroquisMapPoint(layer.id, pointIndex);
  });
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  wrap.appendChild(actions);
  return wrap;
}

function croquisMapCommitOnlineLayer(layer) {
  var m = getActiveCroquisMap();
  if (!m || !layer) return false;
  var c = getActiveCase();
  if (!c || !c.id) {
    croquisMapSetToolStatus("پرونده فعالی انتخاب نشده است؛ محدوده ذخیره نشد.", true);
    return false;
  }
  var defZone = croquisMapGetZoneString(m);

  for (var i = 0; i < layer.points.length; i++) {
    ensurePointEnriched(layer.points[i], defZone, i);
    layer.points[i].label = layer.points[i].label || ("P" + (i + 1));
  }

  if (layer.category === "MAIN_PARCEL") {
    c.utm = layer.points.map(function (pt) {
      return pt.x + "," + pt.y + "," + (pt.elev !== undefined ? pt.elev : 0) + "," + (pt.zone || defZone);
    }).join("\n");
    c.utmZone = layer.points.length ? (layer.points[0].zone || defZone) : defZone;
    var cUtm = document.getElementById("c-utm");
    if (cUtm) cUtm.value = c.utm;
    var landEl = document.getElementById("c-land");
    if (layer.geomType === "POLYGON" && layer.points.length >= 3) {
      var areaData = computeUtmGeometry(layer.points, "POLYGON");
      c.land = toFa(Math.round(areaData.area));
      if (landEl) landEl.value = c.land;
    } else {
      c.land = "";
      if (landEl) landEl.value = "";
    }
  }

  if (typeof logCaseAction === "function") {
    logCaseAction(c, "ثبت تغییرات نقشه «" + (m.title || "") + "»؛ لایه «" + (layer.name || "") + "» با " + layer.points.length + " رأس");
  }

  var keepCenter = leafletMapObj ? leafletMapObj.getCenter() : null;
  var keepZoom = leafletMapObj ? leafletMapObj.getZoom() : null;
  saveAllDB();

  // موفقیت فقط وقتی اعلام می‌شود که داده واقعاً از LocalStorage قابل بازیابی باشد.
  var persisted = false;
  try {
    var savedCases = JSON.parse(localStorage.getItem("nezam636_unified_cases") || "[]");
    for (var ci = 0; ci < savedCases.length; ci++) {
      if (savedCases[ci].id !== c.id || !Array.isArray(savedCases[ci].croquisMaps)) continue;
      for (var mi = 0; mi < savedCases[ci].croquisMaps.length; mi++) {
        var savedMap = savedCases[ci].croquisMaps[mi];
        if (savedMap.id !== m.id || !Array.isArray(savedMap.layers)) continue;
        for (var li = 0; li < savedMap.layers.length; li++) {
          var savedLayer = savedMap.layers[li];
          if (savedLayer.id !== layer.id || savedLayer.geomType !== layer.geomType ||
              !Array.isArray(savedLayer.points) || savedLayer.points.length !== layer.points.length) continue;
          var exact = true;
          for (var pi = 0; pi < layer.points.length; pi++) {
            if (Math.abs(Number(savedLayer.points[pi].x) - Number(layer.points[pi].x)) > 0.01 ||
                Math.abs(Number(savedLayer.points[pi].y) - Number(layer.points[pi].y)) > 0.01) {
              exact = false;
              break;
            }
          }
          if (exact) persisted = true;
        }
      }
    }
  } catch (verifyError) {
    console.error("Croquis save verification failed:", verifyError);
  }

  if (!persisted) {
    croquisMapSetToolStatus("ذخیره در حافظه مرورگر تأیید نشد. فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کنید و دوباره ثبت بزنید.", true);
    return false;
  }

  renderCroquisLayersList();
  loadActiveLayerIntoEditor();
  renderCroquisVisualCanvas();
  if (leafletMapObj && keepCenter && keepZoom !== null) {
    leafletMapObj.setView(keepCenter, keepZoom, { animate: false });
  }
  return true;
}

function croquisMapRedrawDraft() {
  if (!leafletDraftLayerGroupObj || typeof L === "undefined") return;
  leafletDraftLayerGroupObj.clearLayers();
  if (!croquisOnlineDraftPoints.length) return;

  var ll = croquisOnlineDraftPoints.map(function (pt) { return [pt.lat, pt.lng]; });
  var draftColor = "#f59e0b";
  if (croquisOnlineDrawMode === "POLYGON" && ll.length >= 3) {
    L.polygon(ll, { color: draftColor, weight: 3, dashArray: "7 5", fillColor: draftColor, fillOpacity: 0.14 }).addTo(leafletDraftLayerGroupObj);
  } else if (ll.length >= 2) {
    L.polyline(ll, { color: draftColor, weight: 3, dashArray: "7 5" }).addTo(leafletDraftLayerGroupObj);
  }
  for (var i = 0; i < ll.length; i++) {
    L.circleMarker(ll[i], { radius: 6, color: "#7c2d12", fillColor: draftColor, fillOpacity: 1, weight: 2 })
      .bindTooltip("P" + (i + 1))
      .addTo(leafletDraftLayerGroupObj);
  }
}

function croquisMapHandleClick(event) {
  if (!croquisOnlineDrawMode) return;
  var m = getActiveCroquisMap();
  var layer = getActiveCroquisLayer();
  if (!m || !layer || !event || !event.latlng) return;

  if (croquisOnlineDrawMode === "POINT") {
    if (layer.geomType !== "POINT") layer.geomType = "POINT";
    var point = croquisMapBuildPoint(event.latlng, layer.points.length);
    layer.points.push(point);
    croquisMapSetCoordinateReadout(point);
    if (croquisMapCommitOnlineLayer(layer)) {
      croquisMapSetToolStatus("✅ نقطه " + point.label + " با مختصات UTM در پرونده ذخیره شد. برای ثبت نقطه بعدی روی نقشه کلیک کنید.");
    } else {
      layer.points.pop();
    }
    return;
  }

  var draftPoint = croquisMapBuildPoint(event.latlng, croquisOnlineDraftPoints.length);
  croquisOnlineDraftPoints.push(draftPoint);
  croquisMapSetCoordinateReadout(draftPoint);
  croquisMapRedrawDraft();

  var geom = computeUtmGeometry(croquisOnlineDraftPoints, croquisOnlineDrawMode);
  var summary = croquisOnlineDrawMode === "POLYGON"
    ? (" | مساحت تقریبی فعلی: " + toFa(Math.round(geom.area)) + " مترمربع")
    : (" | طول مسیر فعلی: " + toFa(geom.perim.toFixed(1)) + " متر");
  croquisMapSetToolStatus(
    "نقاط ترسیم موقت: " + croquisOnlineDraftPoints.length + "؛ نقطه بعدی را انتخاب کنید." + summary
  );
  croquisMapRefreshToolButtons();
}

function croquisMapAttachEventsAndVertexHandles(options) {
  if (!leafletMapObj || typeof L === "undefined") return;

  if (!leafletVertexLayerGroupObj) leafletVertexLayerGroupObj = L.layerGroup().addTo(leafletMapObj);
  if (!leafletDraftLayerGroupObj) leafletDraftLayerGroupObj = L.layerGroup().addTo(leafletMapObj);

  if (!leafletMapObj.__croquisOnlineDrawingBound) {
    leafletMapObj.on("click", croquisMapHandleClick);
    leafletMapObj.__croquisOnlineDrawingBound = true;
  }

  leafletVertexLayerGroupObj.clearLayers();
  var m = getActiveCroquisMap();
  if (!m) return;

  for (var i = 0; i < m.layers.length; i++) {
    var layer = m.layers[i];
    if (!layer.visible || !Array.isArray(layer.points)) continue;

    for (var j = 0; j < layer.points.length; j++) {
      var pt = ensurePointEnriched(layer.points[j], m.utmZone || "39R", j);
      var ll = [pt.lat, pt.lng];
      var marker = L.marker(ll, { draggable: croquisMapVertexEditEnabled });
      marker.addTo(leafletVertexLayerGroupObj);
      marker.bindPopup(croquisMapCreatePopup(layer, pt, j));

      if (croquisMapVertexEditEnabled) {
        (function (targetLayerId, targetIndex) {
          marker.on("dragend", function (dragEvent) {
            var next = dragEvent.target.getLatLng();
            window.moveCroquisMapPoint(targetLayerId, targetIndex, next.lat, next.lng);
          });
        })(layer.id, j);
      }
    }
  }

  if (options && options.preserveView && options.center && options.zoom !== undefined) {
    leafletMapObj.setView(options.center, options.zoom, { animate: false });
  }
}

var croquisBaseRenderLeafletMap = renderCroquisLeafletMap;
renderCroquisLeafletMap = function (options) {
  var center = leafletMapObj ? leafletMapObj.getCenter() : null;
  var zoom = leafletMapObj ? leafletMapObj.getZoom() : null;
  croquisBaseRenderLeafletMap();
  if (!leafletMapObj || typeof L === "undefined") return;

  if (options && options.preserveView && center && zoom !== null) {
    croquisMapAttachEventsAndVertexHandles({ preserveView: true, center: center, zoom: zoom });
  } else {
    croquisMapAttachEventsAndVertexHandles();
  }
  croquisMapRedrawDraft();
};

window.setMapDrawingMode = function (mode) {
  if (["POINT", "LINE", "POLYGON"].indexOf(mode) === -1) return;
  var layer = getActiveCroquisLayer();
  if (!layer) {
    alert("ابتدا یک نقشه و لایه فعال انتخاب کنید.");
    return;
  }

  if (mode === "POINT" && layer.points.length && layer.geomType !== "POINT") {
    if (!confirm("لایه فعال از نوع دیگری است. نقاط قبلی پاک و لایه به حالت نقطه‌ای تبدیل شود؟")) return;
    layer.points = [];
    layer.geomType = "POINT";
    croquisMapCommitOnlineLayer(layer);
  } else if ((mode === "LINE" || mode === "POLYGON") && layer.points.length) {
    if (!confirm("این ابزار هندسه موجود لایه را با ترسیم جدید جایگزین می‌کند. ادامه می‌دهید؟")) return;
  }

  // نوع لایه فقط پس از زدن «اتمام ترسیم» تغییر می‌کند؛ لغو، داده قبلی را دست‌نخورده نگه می‌دارد.

  if (croquisViewMode !== "MAP") switchCroquisViewMode("MAP");
  croquisOnlineDrawMode = mode;
  croquisOnlineDraftPoints = [];
  if (leafletDraftLayerGroupObj) leafletDraftLayerGroupObj.clearLayers();
  if (leafletMapObj && leafletMapObj.doubleClickZoom) leafletMapObj.doubleClickZoom.disable();
  croquisMapRefreshToolButtons();

  var instructions = mode === "POINT"
    ? "ابزار ثبت نقطه فعال است؛ روی نقشه کلیک کنید. هر کلیک یک نقطه UTM در لایه فعال ذخیره می‌کند."
    : (mode === "LINE"
      ? "ابزار رسم مسیر فعال است؛ رأس‌ها را به ترتیب کلیک کنید و در پایان «اتمام ترسیم» را بزنید."
      : "ابزار رسم محدوده فعال است؛ حداقل سه رأس را به ترتیب کلیک کنید و در پایان «اتمام ترسیم» را بزنید.");
  croquisMapSetToolStatus(instructions);
};

window.finishMapDrawing = function () {
  if (croquisOnlineDrawMode !== "LINE" && croquisOnlineDrawMode !== "POLYGON") {
    croquisMapSetToolStatus("برای ثبت نقطه، هر کلیک به‌صورت مستقل ذخیره می‌شود.");
    return;
  }
  var finishedMode = croquisOnlineDrawMode;
  var required = finishedMode === "POLYGON" ? 3 : 2;
  if (croquisOnlineDraftPoints.length < required) {
    croquisMapSetToolStatus("برای ثبت این عارضه حداقل " + required + " رأس لازم است.", true);
    return;
  }

  var distinct = {};
  for (var di = 0; di < croquisOnlineDraftPoints.length; di++) {
    var dp = croquisOnlineDraftPoints[di];
    distinct[Number(dp.x).toFixed(2) + "_" + Number(dp.y).toFixed(2)] = true;
  }
  if (Object.keys(distinct).length < required) {
    croquisMapSetToolStatus("تعداد رأس‌های یکتا کافی نیست؛ نقاط تکراری را جابه‌جا یا حذف کنید.", true);
    return;
  }

  var layer = getActiveCroquisLayer();
  if (!layer) {
    croquisMapSetToolStatus("لایه فعالی برای ذخیره محدوده پیدا نشد.", true);
    return;
  }

  var newPoints = croquisOnlineDraftPoints.map(function (pt, idx) {
    var copy = Object.assign({}, pt);
    copy.label = "P" + (idx + 1);
    return copy;
  });
  var geom = computeUtmGeometry(newPoints, finishedMode);
  if (finishedMode === "POLYGON" && (!isFinite(geom.area) || geom.area <= 0)) {
    croquisMapSetToolStatus("چندضلعی معتبر نیست یا مساحت آن صفر است؛ ترتیب نقاط را بررسی کنید.", true);
    return;
  }

  var oldPoints = layer.points;
  var oldGeomType = layer.geomType;
  var caseObj = getActiveCase();
  var oldCaseUtm = caseObj ? caseObj.utm : "";
  var oldCaseLand = caseObj ? caseObj.land : "";

  layer.geomType = finishedMode;
  layer.points = newPoints;

  if (!croquisMapCommitOnlineLayer(layer)) {
    layer.points = oldPoints;
    layer.geomType = oldGeomType;
    if (caseObj) {
      caseObj.utm = oldCaseUtm;
      caseObj.land = oldCaseLand;
      var oldUtmEl = document.getElementById("c-utm");
      var oldLandEl = document.getElementById("c-land");
      if (oldUtmEl) oldUtmEl.value = oldCaseUtm || "";
      if (oldLandEl) oldLandEl.value = oldCaseLand || "";
    }
    croquisMapRedrawDraft();
    croquisMapRefreshToolButtons();
    return;
  }

  var count = newPoints.length;
  croquisOnlineDraftPoints = [];
  croquisOnlineDrawMode = "";
  if (leafletDraftLayerGroupObj) leafletDraftLayerGroupObj.clearLayers();
  if (leafletMapObj && leafletMapObj.doubleClickZoom) leafletMapObj.doubleClickZoom.enable();
  if (leafletMapObj) {
    var center = leafletMapObj.getCenter();
    var zoom = leafletMapObj.getZoom();
    renderCroquisLeafletMap({ preserveView: true, center: center, zoom: zoom });
  }
  croquisMapRefreshToolButtons();
  croquisMapSetToolStatus(
    "✅ " + (finishedMode === "POLYGON" ? "محدوده" : "مسیر") +
    " با " + count + " رأس در لایه «" + layer.name + "» ذخیره شد." +
    (finishedMode === "POLYGON"
      ? " مساحت: " + toFa(Math.round(geom.area)) + " مترمربع (" + toFa(geom.ha.toFixed(3)) + " هکتار)، محیط: " + toFa(geom.perim.toFixed(1)) + " متر."
      : " طول مسیر: " + toFa(geom.perim.toFixed(1)) + " متر.")
  );
};

window.undoMapDrawingPoint = function () {
  if (croquisOnlineDraftPoints.length) {
    croquisOnlineDraftPoints.pop();
    croquisMapRedrawDraft();
    croquisMapRefreshToolButtons();
    croquisMapSetToolStatus("آخرین رأس از ترسیم موقت حذف شد. تعداد رأس‌ها: " + croquisOnlineDraftPoints.length);
    return;
  }
  if (croquisOnlineDrawMode === "POINT") {
    var layer = getActiveCroquisLayer();
    if (layer && layer.points.length) {
      layer.points.pop();
      croquisMapCommitOnlineLayer(layer);
      croquisMapSetToolStatus("آخرین نقطه از لایه فعال حذف شد.");
    }
  }
};

window.cancelMapDrawing = function () {
  croquisOnlineDrawMode = "";
  croquisOnlineDraftPoints = [];
  if (leafletDraftLayerGroupObj) leafletDraftLayerGroupObj.clearLayers();
  if (leafletMapObj && leafletMapObj.doubleClickZoom) leafletMapObj.doubleClickZoom.enable();
  croquisMapRefreshToolButtons();
  croquisMapSetToolStatus("ابزار ترسیم متوقف شد؛ نقاط ذخیره‌شده حفظ شدند.");
};

window.setCroquisMapVertexEdit = function () {
  croquisMapVertexEditEnabled = !croquisMapVertexEditEnabled;
  croquisMapRefreshToolButtons();
  if (leafletMapObj) {
    var center = leafletMapObj.getCenter();
    var zoom = leafletMapObj.getZoom();
    renderCroquisLeafletMap({ preserveView: true, center: center, zoom: zoom });
  }
  croquisMapSetToolStatus(croquisMapVertexEditEnabled
    ? "حالت ویرایش روشن است؛ نشانگر هر رأس را با ماوس جابه‌جا کنید."
    : "حالت ویرایش نقاط خاموش شد.");
};

window.moveCroquisMapPoint = function (layerId, pointIndex, lat, lng) {
  var layer = croquisMapGetLayerById(layerId);
  if (!layer || !layer.points[pointIndex]) return;
  var old = layer.points[pointIndex];
  layer.points[pointIndex] = createEnrichedPointFromInput(
    Number(lng), Number(lat), old.elev || 0, old.zone || croquisMapGetZoneString(getActiveCroquisMap()),
    old.label || ("P" + (pointIndex + 1)), "GEO"
  );
  croquisMapSetCoordinateReadout(layer.points[pointIndex]);
  croquisMapCommitOnlineLayer(layer);
  croquisMapSetToolStatus("✅ جابه‌جایی رأس ذخیره شد و مختصات UTM آن دوباره محاسبه شد.");
};

window.editCroquisMapPoint = function (layerId, pointIndex) {
  var layer = croquisMapGetLayerById(layerId);
  if (!layer || !layer.points[pointIndex]) return;
  var pt = layer.points[pointIndex];
  var label = prompt("نام یا کد نقطه:", pt.label || ("P" + (pointIndex + 1)));
  if (label === null) return;
  var elevation = prompt("ارتفاع نقطه (متر):", String(pt.elev || 0));
  if (elevation === null) return;
  var elev = parseFloat(toEn(elevation));
  if (!isFinite(elev)) {
    alert("ارتفاع واردشده معتبر نیست.");
    return;
  }
  pt.label = label.trim() || ("P" + (pointIndex + 1));
  pt.elev = elev;
  croquisMapCommitOnlineLayer(layer);
  croquisMapSetToolStatus("مشخصات نقطه و ارتفاع آن ذخیره شد.");
};

window.deleteCroquisMapPoint = function (layerId, pointIndex) {
  var layer = croquisMapGetLayerById(layerId);
  if (!layer || !layer.points[pointIndex]) return;
  layer.points.splice(pointIndex, 1);
  croquisMapCommitOnlineLayer(layer);
  croquisMapSetToolStatus("نقطه حذف شد؛ جدول UTM و نقشه به‌روزرسانی شدند.");
};

window.clearActiveMapLayerPoints = function () {
  var layer = getActiveCroquisLayer();
  if (!layer || !layer.points.length) return;
  if (!confirm("تمام نقاط لایه فعال «" + layer.name + "» حذف شوند؟")) return;
  layer.points = [];
  croquisOnlineDraftPoints = [];
  if (leafletDraftLayerGroupObj) leafletDraftLayerGroupObj.clearLayers();
  croquisMapCommitOnlineLayer(layer);
  croquisMapSetToolStatus("تمام نقاط لایه فعال پاک شدند.");
};

window.locateOnCroquisMap = function () {
  if (!leafletMapObj) {
    switchCroquisViewMode("MAP");
  }
  if (!navigator.geolocation) {
    croquisMapSetToolStatus("مرورگر شما از موقعیت‌یابی GPS پشتیبانی نمی‌کند.", true);
    return;
  }
  navigator.geolocation.getCurrentPosition(function (position) {
    if (!leafletMapObj) return;
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    leafletMapObj.setView([lat, lng], 19);
    var zone = croquisMapGetZoneString(getActiveCroquisMap());
    var pt = createEnrichedPointFromInput(lng, lat, 0, zone, "GPS", "GEO");
    croquisMapSetCoordinateReadout(pt);
    croquisMapSetToolStatus("موقعیت GPS دستگاه روی نقشه نمایش داده شد. برای ثبت آن، ابزار «ثبت نقطه» را فعال کرده و روی محل کلیک کنید.");
  }, function (err) {
    croquisMapSetToolStatus("دریافت موقعیت GPS انجام نشد: " + (err.message || "دسترسی رد شد."), true);
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
};

window.copyActiveLayerUTM = function () {
  var layer = getActiveCroquisLayer();
  if (!layer || !layer.points.length) {
    alert("لایه فعال نقطه‌ای برای کپی ندارد.");
    return;
  }
  var m = getActiveCroquisMap();
  var zone = croquisMapGetZoneString(m);
  var text = layer.points.map(function (pt, idx) {
    ensurePointEnriched(pt, zone, idx);
    return pt.x + "," + pt.y + "," + (pt.elev || 0) + "," + (pt.zone || zone);
  }).join("\n");

  function done() { croquisMapSetToolStatus("مختصات UTM لایه فعال در حافظه موقت کپی شد."); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      done();
    });
  } else {
    var fallback = document.createElement("textarea");
    fallback.value = text;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    done();
  }
};

window.exportCroquisGeoJSON = function () {
  var m = getActiveCroquisMap();
  if (!m) return;
  var features = [];
  for (var i = 0; i < m.layers.length; i++) {
    var layer = m.layers[i];
    if (!layer.points || !layer.points.length) continue;
    var pts = layer.points.map(function (pt, idx) {
      ensurePointEnriched(pt, m.utmZone || "39R", idx);
      return [pt.lng, pt.lat, Number(pt.elev || 0)];
    });
    var geometry = null;
    if (layer.geomType === "POLYGON" && pts.length >= 3) {
      var ring = pts.slice();
      ring.push(pts[0].slice());
      geometry = { type: "Polygon", coordinates: [ring] };
    } else if (layer.geomType === "LINE" && pts.length >= 2) {
      geometry = { type: "LineString", coordinates: pts };
    } else if (pts.length === 1) {
      geometry = { type: "Point", coordinates: pts[0] };
    } else {
      geometry = { type: "MultiPoint", coordinates: pts };
    }
    features.push({
      type: "Feature",
      properties: { name: layer.name, category: layer.category, geomType: layer.geomType, utmZone: m.utmZone || "39R" },
      geometry: geometry
    });
  }
  var geojson = { type: "FeatureCollection", name: m.title || "Croquis", features: features };
  var blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json;charset=utf-8" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = (m.title || "Croquis").replace(/[^\w\u0600-\u06FF-]+/g, "_") + ".geojson";
  link.click();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1200);
  croquisMapSetToolStatus("خروجی GeoJSON نقشه آماده شد.");
};


window.toggleCroquisMapMoreTools = function (forceOpen) {
  var panel = document.getElementById("crq-map-more-tools");
  if (!panel) return;
  var open = forceOpen === true ? true : (forceOpen === false ? false : panel.style.display === "none");
  panel.style.display = open ? "block" : "none";
};