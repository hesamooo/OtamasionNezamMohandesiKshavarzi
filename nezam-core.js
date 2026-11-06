/* محافظ هوشمند ویندوز: جلوگیری از خطای 800A03EA در صورت دبل‌کلیک مستقیم روی فایل JS */
if (typeof WScript !== "undefined") {
  try {
    var sh = new ActiveXObject("WScript.Shell");
    sh.Run("index.html");
  } catch (e) {}
  WScript.Quit();
}

/* =========================================================================
   هسته مرکزی یکپارچه اتوماسیون مرکز خدمات کشاورزی و منابع طبیعی ۶۳۶ شهرستان خفر
   نسخه آفلاین ویندوز — پشتیبانی از ۳ گروه تخصصی متقاضیان، بانک قوانین NotebookLM،
   قانون اجباری انتخاب متقاضی و یکپارچگی کامل با کروکی چندلایه UTM
   ========================================================================= */

function toFa(s) {
  if (s === null || s === undefined) return "";
  var d = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(s).replace(/[0-9]/g, function(w) { return d[+w]; });
}

function escapeHtmlCore(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function toEn(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/[۰-۹]/g, function(d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
    .replace(/[٠-٩]/g, function(d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
}

function moneyFa(n) {
  var num = parseInt(toEn(n), 10) || 0;
  return toFa(num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "،"));
}

function todayShamsi() {
  try {
    var p = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var y = "", m = "", d = "";
    for (var i = 0; i < p.length; i++) {
      if (p[i].type === "year") y = p[i].value;
      if (p[i].type === "month") m = p[i].value;
      if (p[i].type === "day") d = p[i].value;
    }
    return toFa(y + "/" + m + "/" + d);
  } catch (e) { return "۱۴۰۵/۰۲/۱۳"; }
}

function nowTimeFa() {
  try {
    return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  } catch (e) { return "۱۲:۰۰"; }
}

function showToastMsg(txt, isError) {
  var t = document.createElement("div");
  t.className = "toast-msg";
  if (isError) {
    t.style.background = "#991b1b";
    t.style.borderRightColor = "#fca5a5";
  }
  t.textContent = txt;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 3600);
}

/* =========================================================================
   بخش اول: ساختار تخصصی ۳ گروه اصلی متقاضیان و ضرایب فنی
   ========================================================================= */
var APPLICANT_MAIN_GROUPS = {
  GREENHOUSE_MUSHROOM: {
    code: "GREENHOUSE_MUSHROOM",
    title: "گروه اول: گلخانه و قارچ",
    shortTitle: "🌱 گلخانه و قارچ",
    badgeClass: "bg-success",
    desc: "انواع درخواست‌های احداث و بهره‌برداری گلخانه، پرورش قارچ خوراکی و کمپوست"
  },
  LIVESTOCK_POULTRY_FISHERIES: {
    code: "LIVESTOCK_POULTRY_FISHERIES",
    title: "گروه دوم: دام، طیور و شیلات",
    shortTitle: "🐄 دام، طیور و شیلات",
    badgeClass: "bg-primary",
    desc: "دامداری و دامپروری، پرورش طیور صنعتی و بومی، پرورش آبزیان و فعالیت‌های شیلاتی"
  },
  CLINIC_PHARMACY: {
    code: "CLINIC_PHARMACY",
    title: "گروه سوم: کلینیک گیاهپزشکی و داروخانه گیاهپزشکی",
    shortTitle: "💊 کلینیک و داروخانه گیاهپزشکی",
    badgeClass: "bg-warning text-dark",
    desc: "تأسیس و تمدید کلینیک گیاهپزشکی، داروخانه گیاهپزشکی و مراکز عرضه نهاده‌ها"
  }
};

var DEFAULT_ACT_SPECS = {
  // گروه اول: گلخانه و قارچ
  greenhouse_veg: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث واحد گلخانه سبزی و صیفی (کشت خاکی/هیدروپونیک)",
    unit: "مترمربع", water: 8, land: 1.25, minL: 1000, roof: 1.0, open: 0.25, docGroup: "GREENHOUSE"
  },
  greenhouse_flower: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث واحد گلخانه گل و گیاهان زینتی و آپارتمانی",
    unit: "مترمربع", water: 7, land: 1.2, minL: 1000, roof: 1.0, open: 0.2, docGroup: "GREENHOUSE"
  },
  greenhouse_medicinal: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث گلخانه گیاهان دارویی و تولید نشاء و نهال",
    unit: "مترمربع", water: 6, land: 1.2, minL: 500, roof: 0.9, open: 0.3, docGroup: "GREENHOUSE"
  },
  mushroom_button: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "تأسیس واحد پرورش قارچ خوراکی دکمه‌ای صنعتی",
    unit: "تن در سال", water: 95, land: 65, minL: 1500, roof: 25, open: 40, docGroup: "MUSHROOM"
  },
  mushroom_oyster: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "تأسیس واحد پرورش قارچ صدفی و شاه‌صدفی",
    unit: "تن در سال", water: 70, land: 45, minL: 800, roof: 20, open: 25, docGroup: "MUSHROOM"
  },

  // گروه دوم: دام، طیور و شیلات
  sheep_high: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    unit: "راس", water: 10, land: 6, minL: 1200, roof: 2.3, open: 2.65, docGroup: "LIVESTOCK"
  },
  lamb: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (پرواربندی بره)",
    unit: "راس", water: 10, land: 6.5, minL: 1300, roof: 1.4, open: 1.6, docGroup: "LIVESTOCK"
  },
  goat: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (پرورش بز مولد شیری)",
    unit: "راس", water: 9.5, land: 8.6, minL: 800, roof: 1.55, open: 2.3, docGroup: "LIVESTOCK"
  },
  cow: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرورش گاو شیری صنعتی",
    unit: "راس", water: 140, land: 100, minL: 5000, roof: 19, open: 24, docGroup: "LIVESTOCK"
  },
  calf: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرواربندی گوساله",
    unit: "راس", water: 70, land: 24, minL: 1200, roof: 4.5, open: 6.3, docGroup: "LIVESTOCK"
  },
  camel: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرورش شتر داشتی و پرواری",
    unit: "راس", water: 40, land: 31.6, minL: 1000, roof: 9.9, open: 17.8, docGroup: "LIVESTOCK"
  },
  poultry_broiler: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس واحد پرورش مرغ گوشتی اتوماتیک",
    unit: "قطعه", water: 0.35, land: 0.25, minL: 5000, roof: 0.08, open: 0.17, docGroup: "POULTRY"
  },
  poultry_turkey: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس واحد پرورش بوقلمون، شترمرغ و طیور خاص",
    unit: "قطعه", water: 1.2, land: 1.5, minL: 3000, roof: 0.4, open: 1.1, docGroup: "POULTRY"
  },
  fish_trout: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس مزرعه پرورش ماهیان سردابی (قزل‌آلا)",
    unit: "تن در سال", water: 2400, land: 110, minL: 2000, roof: 15, open: 95, docGroup: "FISHERIES"
  },
  fish_warm: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس مزرعه پرورش ماهیان گرمابی و استخر دو منظوره",
    unit: "تن در سال", water: 1800, land: 250, minL: 2500, roof: 12, open: 238, docGroup: "FISHERIES"
  },

  // گروه سوم: کلینیک گیاهپزشکی و داروخانه گیاهپزشکی
  pharmacy: {
    mainGroup: "CLINIC_PHARMACY",
    title: "تأسیس / تمدید داروخانه گیاهپزشکی و عرضه سموم و نهاده",
    unit: "واحد", water: 200, land: 45, minL: 40, roof: 45, open: 0, docGroup: "PHARMACY"
  },
  clinic_plant: {
    mainGroup: "CLINIC_PHARMACY",
    title: "تأسیس / تمدید کلینیک گیاهپزشکی تشخیص آفات و آزمایشگاه",
    unit: "واحد", water: 400, land: 110, minL: 80, roof: 110, open: 0, docGroup: "CLINIC"
  },
  pest_control_co: {
    mainGroup: "CLINIC_PHARMACY",
    title: "مجوز شرکت خدمات فنی دفع آفات نباتی و ضدعفونی",
    unit: "واحد", water: 250, land: 60, minL: 50, roof: 60, open: 0, docGroup: "CLINIC"
  }
};

var ACT_SPECS = JSON.parse(JSON.stringify(DEFAULT_ACT_SPECS));

/* =========================================================================
   بخش دوم: چک‌لیست‌های تخصصی مدارک برای ۳ گروه متقاضیان
   ========================================================================= */
var DEFAULT_DOC_CHECKLISTS = {
  GREENHOUSE: [
    { code: "ID_CARD", title: "تصویر کارت ملی، شناسنامه و کارت پایان خدمت/معافیت متقاضی (یا آگهی تأسیس و روزنامه رسمی برای اشخاص حقوقی)", mandatory: true, legalRef: "بند الف ماده ۴ دستورالعمل صدور مجوزهای گلخانه" },
    { code: "LAND_DEED", title: "سند مالکیت رسمی، بنچاق معتبر، نسق زراعی یا اجاره‌نامه رسمی محضری (حداقل ۵ ساله)", mandatory: true, legalRef: "ماده ۵ ضوابط مالکیت اراضی در سامانه سماک" },
    { code: "UTM_MAP", title: "نقشه کروکی چندلایه زمین و جدول مختصات UTM (زون 39R) ممهور به مهر کارشناس نظام مهندسی", mandatory: true, legalRef: "تبصره ۱ ماده ۶ نظام فنی و اجرایی گلخانه‌ها" },
    { code: "WATER_PERMIT", title: "پروانه بهره‌برداری چاه مجاز، گواهی حقابه از امور آب منطقه‌ای یا قرارداد تأمین آب معتبر", mandatory: true, legalRef: "ماده ۷ قانون توزیع عادلانه آب و ضوابط گلخانه" },
    { code: "WATER_SOIL", title: "نتیجه آزمایش فیزیکی و شیمیایی آب و خاک (EC و pH مجاز) از آزمایشگاه معتمد", mandatory: true, legalRef: "پیوست فنی نشریه نظام مهندسی کشاورزی" },
    { code: "FEASIBILITY", title: "طرح توجیه فنی و اقتصادی و پلان سازه گالوانیزه استاندارد (فاقد لوله سیاه و جوشکاری)", mandatory: true, legalRef: "ماده ۹ استاندارد ملی سازه‌های گلخانه‌ای" },
    { code: "TECH_DIR", title: "معرفی‌نامه و قرارداد مسئول فنی واجد صلاحیت دارای پروانه اشتغال در سامانه سانکا", mandatory: true, legalRef: "ماده ۳۳ قانون افزایش بهره‌وری بخش کشاورزی" }
  ],
  MUSHROOM: [
    { code: "ID_CARD", title: "مدارک هویتی کامل متقاضی حقیقی یا مدارک ثبتی شرکت حقوقی", mandatory: true, legalRef: "بند ۱ دستورالعمل واحدهای قارچ خوراکی" },
    { code: "LAND_UTM", title: "سند مالکیت یا اجاره‌نامه رسمی عرصه به همراه کروکی دقیق UTM و جانمایی سالن‌ها", mandatory: true, legalRef: "بند ۲ ضوابط صدور موافقت اصولی قارچ" },
    { code: "INQ_ENV_WATER", title: "موافقت استعلام آب منطقه‌ای، برق، گاز و حفاظت محیط زیست (مدیریت پساب و کمپوست)", mandatory: true, legalRef: "ماده ۱۱ ضوابط استقرار واحدهای تولیدی کشاورزی" },
    { code: "SKILL_CERT", title: "گواهی مهارت فنی پرورش قارچ خوراکی یا معرفی مسئول فنی دارای پروانه اشتغال", mandatory: true, legalRef: "بند ۵ آیین‌نامه اجرایی نظام مهندسی کشاورزی" }
  ],
  LIVESTOCK: [
    { code: "ID_CARD", title: "تصویر کارت ملی و تمام صفحات شناسنامه متقاضی (یا مدارک ثبتی شرکت حقوقی)", mandatory: true, legalRef: "ماده ۳ آیین‌نامه اجرایی قانون نظام جامع دامپروری" },
    { code: "MILITARY", title: "کارت پایان خدمت یا معافیت دائم (ویژه آقایان در اشخاص حقیقی)", mandatory: true, legalRef: "ماده ۱۰ قانون خدمت وظیفه عمومی" },
    { code: "LAND_DEED", title: "سند مالکیت زمین / اجاره‌نامه رسمی محضری یا گواهی واگذاری مدیریت امور اراضی", mandatory: true, legalRef: "فصل دوم دستورالعمل صدور پروانه دامپروری" },
    { code: "UTM_MAP", title: "نقشه کروکی چندلایه (عرصه کل + محل جایگاه مسقف و بهاربند) با جدول UTM", mandatory: true, legalRef: "بند ۴ ضوابط فنی نقشه‌برداری مراکز خدمات" },
    { code: "INQ_WATER", title: "پاسخ موافقت استعلام مدیریت منابع آب شهرستان خفر (تأمین آب شرب دام)", mandatory: true, legalRef: "ماده ۶ دستورالعمل استعلام‌های موافقت اصولی" },
    { code: "INQ_ELEC", title: "پاسخ موافقت استعلام مدیریت توزیع برق شهرستان خفر (رعایت حریم شبکه برق)", mandatory: true, legalRef: "آیین‌نامه حرایم خطوط نیروی برق" },
    { code: "INQ_NATRES", title: "پاسخ استعلام اداره منابع طبیعی و آبخیزداری (تعیین وضعیت ملی یا مستثنیات بودن زمین)", mandatory: true, legalRef: "ماده ۵۶ قانون حفاظت و بهره‌برداری از جنگل‌ها و مراتع" },
    { code: "INQ_ENV_ROAD", title: "پاسخ استعلام حفاظت محیط زیست، حریم راهداری و منطقه ۵ انتقال گاز", mandatory: true, legalRef: "ضوابط زیست‌محیطی و ایمنی حرایم جاده و خطوط گاز" },
    { code: "VET_PERMIT", title: "پروانه بهداشتی موافقت اصولی / تأسیس از شبکه دامپزشکی و رعایت فواصل بهداشتی", mandatory: true, legalRef: "مواد ۵ و ۷ قانون سازمان دامپزشکی کشور" }
  ],
  POULTRY: [
    { code: "ID_CARD", title: "مدارک هویتی متقاضی یا اساسنامه و روزنامه رسمی شرکت تعاونی/خصوصی", mandatory: true, legalRef: "ماده ۳ قانون نظام جامع دامپروری" },
    { code: "LAND_UTM", title: "سند زمین و نقشه کروکی UTM با نمایش سالن‌ها، دان‌خوری، قرنطینه و فواصل بهداشتی", mandatory: true, legalRef: "جدول فواصل بهداشتی مرغداری‌ها مصوب دامپزشکی" },
    { code: "VET_BIO", title: "تأییدیه بهداشتی و قرنطینه‌ای شبکه دامپزشکی و موافقت کمیسیون صدور پروانه استان", mandatory: true, legalRef: "آیین‌نامه نظارت بهداشتی دامپزشکی" },
    { code: "INQ_ALL", title: "پاسخ موافقت استعلام‌های آب، برق، گاز، راهداری، محیط زیست و منابع طبیعی", mandatory: true, legalRef: "ماده ۸ دستورالعمل صدور پروانه تأسیس طیور" }
  ],
  FISHERIES: [
    { code: "ID_CARD", title: "مدارک هویتی متقاضی یا ثبت شرکت شیلاتی", mandatory: true, legalRef: "ماده ۲ دستورالعمل صدور مجوزهای آبزی‌پروری" },
    { code: "WATER_ALLOC", title: "مجوز تخصیص آب یا پروانه بهره‌برداری چاه/چشمه با دبی کافی از امور آب منطقه‌ای", mandatory: true, legalRef: "بند ب ماده ۴ قانون حفاظت و بهره‌برداری از منابع آبزی" },
    { code: "UTM_PONDS", title: "نقشه کروکی UTM جانمایی استخرهای پرورش، حوضچه رسوب‌گیر و کانال ورودی/خروجی", mandatory: true, legalRef: "ضوابط فنی مهندسی مزارع پرورش ماهی" },
    { code: "ENV_VET", title: "موافقت‌نامه محیط زیست (کنترل کیفیت پساب خروجی) و تأییدیه بهداشتی دامپزشکی", mandatory: true, legalRef: "ضوابط زیست‌محیطی مزارع آبزی‌پروری" }
  ],
  PHARMACY: [
    { code: "ID_EDU", title: "تصویر کارت ملی، شناسنامه، مدرک تحصیلی کارشناسی/ارشد گیاهپزشکی و عضویت معتبر سانکا", mandatory: true, legalRef: "ماده ۳ آیین‌نامه اجرایی تأسیس داروخانه‌های گیاهپزشکی" },
    { code: "SHOP_RENT", title: "سند مالکیت تجاری یا اجاره‌نامه رسمی محل داروخانه و انبار مجزا (حداقل ۳ ساله)", mandatory: true, legalRef: "ماده ۵ ضوابط مکان و انبار داروخانه گیاهپزشکی" },
    { code: "NOTARY_PLEDGE", title: "تعهدنامه محضری مؤسس و مسئول فنی مبنی بر عدم فروش سموم قاچاق، تاریخ‌گذشته و بدون نسخه", mandatory: true, legalRef: "ماده ۹ دستورالعمل نظارت بر توزیع سموم نباتی" },
    { code: "TECH_CONTRACT", title: "پروانه اشتغال و قرارداد حضور تمام‌وقت مسئول فنی داروخانه گیاهپزشکی در سامانه سانکا", mandatory: true, legalRef: "تبصره ۲ ماده ۷ دستورالعمل سازمان حفظ نباتات" },
    { code: "VISIT_UTM", title: "فرم گزارش بازدید کارشناسی ۱۸ بندی مرکز ۶۳۶ و کروکی موقعیت UTM داروخانه", mandatory: true, legalRef: "فرم استاندارد کمیته فنی گیاهپزشکی استان فارس" }
  ],
  CLINIC: [
    { code: "ID_EDU", title: "مدارک هویتی، دانشنامه تحصیلی رشته‌های گیاهپزشکی و گواهی سابقه کار کارشناسی", mandatory: true, legalRef: "ماده ۴ دستورالعمل تأسیس کلینیک‌های گیاهپزشکی" },
    { code: "EQUIP_LIST", title: "سند/اجاره‌نامه محل کلینیک + فهرست تجهیزات آزمایشگاهی (استریومیکروسکوپ، انکوباتور، اتوکلاو)", mandatory: true, legalRef: "پیوست ۲ جدول تجهیزات الزامی کلینیک گیاهپزشکی" },
    { code: "SANKA_LICENSE", title: "گواهی ثبت درخواست در درگاه ملی مجوزها، سامانه سانکا و تأییدیه حفظ نباتات", mandatory: true, legalRef: "آیین‌نامه رتبه‌بندی و صدور پروانه کلینیک‌های گیاهپزشکی" },
    { code: "UTM_CLINIC", title: "کروکی UTM محل استقرار کلینیک و رعایت ضوابط دسترسی بهره‌برداران", mandatory: true, legalRef: "ضوابط مکانی مراکز خدمات و کلینیک‌ها" }
  ]
};

var DOC_CHECKLISTS = JSON.parse(JSON.stringify(DEFAULT_DOC_CHECKLISTS));

/* =========================================================================
   ۳. بانک اطلاعات پیش‌فرض متقاضیان در هر ۳ گروه تخصصی + کروکی چندلایه
   ========================================================================= */
var DEFAULT_UNIFIED_CASES = [
  // نمونه شاخص گروه اول: گلخانه و قارچ (زمین ۱۰ هکتاری با طرح گلخانه ۱ هکتاری در داخل آن)
  {
    id: "CASE-201",
    code: "گ-۲۰۱/۶۳۶",
    entityType: "LEGAL", // INDIVIDUAL | LEGAL | ORG
    mainGroup: "GREENHOUSE_MUSHROOM",
    actType: "greenhouse_veg",
    name: "شرکت کشت و صنعت نگین سبز خفر (مسئولیت محدود)",
    nid: "۱۰۳۸۰۴۵۱۲۳۴",
    regNo: "۴۸۷۲",
    repName: "مهندس محمدرضا شجاعی",
    mobile: "۰۹۱۷۱۱۸۹۸۷۶",
    count: 10000,
    project: "احداث واحد گلخانه سبزی و صیفی (کشت خاکی/هیدروپونیک)",
    cap: "۱۰,۰۰۰ مترمربع (۱ هکتار)",
    land: "۱۰۰۰۰۰",
    water: "۸۰۰۰۰",
    subarea: "سازه گلخانه: ۱۰,۰۰۰ م.م | تأسیسات و استخر: ۹۰۰ م.م",
    loc: "فارس/ خفر/ مرکزی / گلبرنجی",
    utmZone: "39R",
    utm: "702150,3208450\n702550,3208450\n702550,3208200\n702150,3208200",
    issueDate: "۱۴۰۵/۰۱/۲۰",
    expDate: "۱۴۰۶/۰۱/۲۰",
    caseStatus: "ACTIVE", // ACTIVE | IN_PROGRESS | APPROVED | ARCHIVED
    customFields: [
      { label: "پلاک ثبتی", value: "۱۸۴ فرعی از ۱۲ اصلی" },
      { label: "منبع آب", value: "چاه پروانه‌دار شماره ۱ (۱۵ لیتر/ثانیه)" }
    ],
    inquiries: { water: "OK", elec: "OK", road: "OK", gas: "WAIT", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۵/۰۱/۲۰ - ۰۹:۱۵", action: "ثبت پرونده شخصیت حقوقی در گروه اول (گلخانه و قارچ)", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۱/۲۲ - ۱۱:۳۰", action: "ترسیم کروکی چندلایه زمین ۱۰ هکتاری و جانمایی طرح گلخانه ۱ هکتاری", by: "واحد نقشه‌برداری ۶۳۶" }
    ],
    croquisMaps: [
      {
        id: "MAP-201-1",
        title: "کروکی جانمایی طرح گلخانه ۱ هکتاری در داخل زمین اصلی ۱۰ هکتاری",
        date: "۱۴۰۵/۰۱/۲۲",
        utmZone: "39R",
        hemisphere: "N",
        notes: "زمین اصلی به مساحت ۱۰ هکتار (۴۰۰×۲۵۰ متر) بوده و محل اجرای طرح گلخانه به مساحت ۱ هکتار (۱۰۰×۱۰۰ متر) به همراه تأسیسات، چاه آب و جاده دسترسی در داخل محدوده اصلی جانمایی شده است.",
        layers: [
          {
            id: "LYR-MAIN",
            name: "۱. محدوده اصلی زمین (پلاک ۱۰ هکتاری)",
            category: "MAIN_PARCEL",
            geomType: "POLYGON",
            color: "#15803d",
            fillColor: "#22c55e",
            fillOpacity: 0.14,
            strokeWidth: 3,
            visible: true,
            order: 1,
            desc: "مرز کل زمین کشاورزی طبق سند مالکیت (۴۰۰ در ۲۵۰ متر = ۱۰۰,۰۰۰ مترمربع / ۱۰ هکتار)",
            points: [
              { x: 702150, y: 3208450, label: "A1" },
              { x: 702550, y: 3208450, label: "A2" },
              { x: 702550, y: 3208200, label: "A3" },
              { x: 702150, y: 3208200, label: "A4" }
            ]
          },
          {
            id: "LYR-PROJ",
            name: "۲. محل اجرای طرح گلخانه (۱ هکتار)",
            category: "PROJECT_AREA",
            geomType: "POLYGON",
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.30,
            strokeWidth: 2.5,
            visible: true,
            order: 2,
            desc: "محدوده احداث سازه گلخانه در داخل زمین اصلی (۱۰۰ در ۱۰۰ متر = ۱۰,۰۰۰ مترمربع / ۱ هکتار)",
            points: [
              { x: 702280, y: 3208380, label: "G1" },
              { x: 702380, y: 3208380, label: "G2" },
              { x: 702380, y: 3208280, label: "G3" },
              { x: 702280, y: 3208280, label: "G4" }
            ]
          },
          {
            id: "LYR-FAC",
            name: "۳. ساختمان تأسیسات، اتاق کنترل و استخر ذخیره",
            category: "FACILITY",
            geomType: "POLYGON",
            color: "#b45309",
            fillColor: "#f59e0b",
            fillOpacity: 0.38,
            strokeWidth: 2,
            visible: true,
            order: 3,
            desc: "اتاق بویلر، پمپاژ، انبار نهاده و استخر ژئوممبران (۳۰ در ۳۰ متر = ۹۰۰ مترمربع)",
            points: [
              { x: 702230, y: 3208410, label: "F1" },
              { x: 702260, y: 3208410, label: "F2" },
              { x: 702260, y: 3208380, label: "F3" },
              { x: 702230, y: 3208380, label: "F4" }
            ]
          },
          {
            id: "LYR-ROAD",
            name: "۴. راه دسترسی اختصاصی",
            category: "ROAD",
            geomType: "LINE",
            color: "#475569",
            fillColor: "#64748b",
            fillOpacity: 0,
            strokeWidth: 4,
            visible: true,
            order: 4,
            desc: "مسیر دسترسی ماشین‌آلات از ورودی شمالی زمین تا گلخانه",
            points: [
              { x: 702150, y: 3208430, label: "ورودی جاده" },
              { x: 702230, y: 3208430, label: "تقاطع تأسیسات" },
              { x: 702280, y: 3208330, label: "ورودی گلخانه" }
            ]
          },
          {
            id: "LYR-WELL",
            name: "۵. چاه آب پروانه‌دار",
            category: "WATER_SOURCE",
            geomType: "POINT",
            color: "#0284c7",
            fillColor: "#38bdf8",
            fillOpacity: 1,
            strokeWidth: 5,
            visible: true,
            order: 5,
            desc: "محل حلقه چاه مجاز کشاورزی",
            points: [
              { x: 702210, y: 3208425, label: "چاه آب شماره ۱" }
            ]
          }
        ]
      }
    ]
  },

  // گروه دوم: دام، طیور و شیلات (آقای علی فروزند)
  {
    id: "CASE-101",
    code: "الف-۱۰۱/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    actType: "sheep_high",
    name: "آقای علی فروزند",
    nid: "۲۲۹۷۴۳۶۷۶۹",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۲",
    count: 200,
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    cap: "۲۰۰ راس",
    land: "۲۱۴۵",
    water: "۲۰۰۰",
    subarea: "مسقف: ۴۶۰ م.م | بهاربند: ۵۳۰ م.م",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utmZone: "39R",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    issueDate: "۱۴۰۵/۰۲/۱۳",
    expDate: "۱۴۰۵/۰۸/۱۳",
    caseStatus: "IN_PROGRESS",
    customFields: [],
    inquiries: { water: "WAIT", elec: "OK", road: "WAIT", gas: "WAIT", env: "OK", natres: "OK", vet: "WAIT" },
    history: [
      { date: "۱۴۰۵/۰۲/۱۳ - ۰۸:۳۰", action: "تشکیل پرونده در گروه دوم (دام، طیور و شیلات)", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۲/۱۳ - ۰۹:۱۰", action: "برداشت مختصات UTM و ثبت کروکی عرصه ۲۱۴۵ مترمربعی", by: "مهندس خواجه‌پور" }
    ],
    croquisMaps: [
      {
        id: "MAP-101-1",
        title: "کروکی عرصه و جایگاه دامداری ۲۰۰ رأسی گوسفند پرتولید",
        date: "۱۴۰۵/۰۲/۱۳",
        utmZone: "39R",
        hemisphere: "N",
        notes: "کروکی مهندسی زمین واقع در بخش سپیدار - اسماعیل‌آباد",
        layers: [
          {
            id: "LYR-101-MAIN",
            name: "۱. محدوده اصلی زمین دامداری",
            category: "MAIN_PARCEL",
            geomType: "POLYGON",
            color: "#1b5e20",
            fillColor: "#2e7d32",
            fillOpacity: 0.18,
            strokeWidth: 3,
            visible: true,
            order: 1,
            desc: "عرصه کل دامداری طبق کروکی کارشناسی",
            points: [
              { x: 689269, y: 3213468, label: "P1" },
              { x: 689310, y: 3213455, label: "P2" },
              { x: 689295, y: 3213408, label: "P3" },
              { x: 689252, y: 3213423, label: "P4" }
            ]
          },
          {
            id: "LYR-101-PROJ",
            name: "۲. محل اجرای آغل مسقف و بهاربند",
            category: "PROJECT_AREA",
            geomType: "POLYGON",
            color: "#b45309",
            fillColor: "#f59e0b",
            fillOpacity: 0.32,
            strokeWidth: 2,
            visible: true,
            order: 2,
            desc: "محل احداث جایگاه مسقف (۴۶۰ م.م) و بهاربند",
            points: [
              { x: 689273, y: 3213458, label: "B1" },
              { x: 689298, y: 3213450, label: "B2" },
              { x: 689290, y: 3213424, label: "B3" },
              { x: 689265, y: 3213432, label: "B4" }
            ]
          }
        ]
      }
    ]
  },

  // گروه دوم: دام، طیور و شیلات (خانم فاطمه سیفی)
  {
    id: "CASE-102",
    code: "الف-۱۰۲/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    actType: "sheep_high",
    name: "خانم فاطمه سیفی",
    nid: "۶۵۵۰۰۳۹۵۷۶",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۰",
    count: 200,
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    cap: "۲۰۰ راس",
    land: "۱۲۰۰",
    water: "۲۰۰۰",
    subarea: "مسقف: ۴۶۰ م.م | بهاربند: ۵۳۰ م.م",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utmZone: "39R",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    issueDate: "۱۴۰۵/۰۲/۱۳",
    expDate: "۱۴۰۵/۰۸/۱۳",
    caseStatus: "IN_PROGRESS",
    customFields: [],
    inquiries: { water: "WAIT", elec: "OK", road: "OK", gas: "NONE", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۵/۰۲/۱۳ - ۱۰:۰۰", action: "ثبت اولیه پرونده در گروه دام، طیور و شیلات", by: "مهندس خواجه‌پور" }
    ],
    croquisMaps: []
  },

  // گروه سوم: کلینیک گیاهپزشکی و داروخانه گیاهپزشکی (آقای علیرضا زارعی مورچکی)
  {
    id: "CASE-103",
    code: "د-۱۰۳/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "CLINIC_PHARMACY",
    actType: "pharmacy",
    name: "آقای علیرضا زارعی مورچکی",
    nid: "۶۵۵۹۸۷۳۵۰۱",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۱",
    count: 1,
    project: "تأسیس / تمدید داروخانه گیاهپزشکی آدینه سبز",
    cap: "۱ واحد",
    land: "۴۵",
    water: "۲۰۰",
    subarea: "تجاری مسقف و انبار استاندارد: ۴۵ م.م",
    loc: "فارس/ خفر/ راهکان / باغ کبیر",
    utmZone: "39R",
    utm: "712433,3191795\n712445,3191795\n712445,3191785\n712433,3191785",
    issueDate: "۱۴۰۳/۱۲/۲۴",
    expDate: "۱۴۰۵/۰۳/۰۵",
    caseStatus: "APPROVED",
    customFields: [
      { label: "نام داروخانه", value: "داروخانه گیاهپزشکی آدینه سبز" }
    ],
    inquiries: { water: "OK", elec: "OK", road: "OK", gas: "OK", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۳/۱۲/۲۴ - ۰۹:۰۰", action: "تشکیل پرونده داروخانه گیاهپزشکی در گروه سوم", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۲/۱۰ - ۱۲:۰۰", action: "بازرسی ادواری ۱۸ بندی داروخانه گیاهپزشکی", by: "کارشناس ناظر ۶۳۶" }
    ],
    croquisMaps: []
  }
];

var DEFAULT_LETTERS = [
  {
    id: "L-101", caseId: "CASE-102", number: "۱۴۰۵۰۲۱۳۰۱", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم آب منطقه ای شهرستان خفر",
    appName: "خانم فاطمه سیفی", appNid: "۶۵۵۰۰۳۹۵۷۶",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۱۲۰۰", water: "۲۰۰۰",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    body: "احتراماً نظر به اینکه خانم فاطمه سیفی به کد ملی ۶۵۵۰۰۳۹۵۷۶ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۱۲۰۰ متر مربع ، از اراضی فارس/ خفر/ مرکزی / خفر با موقعیت جغرافیایی زیر را دارند . خواهشمند است در خصوص امکان تامین آب از مبادی مجاز به وسیله حمل با تانکر به میزان ۲۰۰۰ لیتر در شبانه روز و همچنین حریم کمی و کیفی واحد فوق ، اظهارنظر فرمایید و مراتب را کتبا به این مرکز اعلام نمایید."
  },
  {
    id: "L-102", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۲", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم برق منطقه ای شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً نظر به اینکه آقای علی فروزند به کد ملی ۲۲۹۷۴۳۶۷۶۹ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۲۱۴۵ متر مربع ، از اراضی فارس/ خفر/ سپیدار / اسماعیل آباد با موقعیت جغرافیایی زیر را دارند. خواهشمند است در خصوص حریم کمی و کیفی واحد فوق اظهارنظر فرمایید و مراتب را کتبا اعلام نمایید."
  },
  {
    id: "L-103", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۳", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "ریاست محترم سازمان حفاظت محیط زیست شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً نظر به اینکه آقای علی فروزند به کد ملی ۲۲۹۷۴۳۶۷۶۹ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۲۱۴۵ متر مربع ، از اراضی فارس/ خفر/ سپیدار / اسماعیل آباد با موقعیت جغرافیایی زیر را دارند، خواهشمند است در خصوص شرایط زیست محیطی محل اجرای طرح اظهار نظر فرمایید."
  },
  {
    id: "L-104", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۴", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم منابع طبیعی شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "شهرستان خفر / مرکزی / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً در مورد ملی یا مستثنیات بودن زمین واقع در شهرستان خفر / مرکزی / اسماعیل آباد ، با مختصات جغرافیایی که در ذیل همین نامه ارایه گردیده است، اظهارنظر فرمایید."
  }
];

var DEFAULT_TASKS = [
  { id: "T-1", caseId: "CASE-101", title: "پیگیری پاسخ استعلام برق، محیط زیست و منابع طبیعی آقای علی فروزند", cat: "پیگیری استعلام ادارات", due: "۱۴۰۵/۰۲/۲۰", status: "در حال پیگیری" },
  { id: "T-2", caseId: "CASE-102", title: "پیگیری پاسخ استعلام آب منطقه‌ای خانم فاطمه سیفی", cat: "پیگیری استعلام ادارات", due: "۱۴۰۵/۰۲/۱۸", status: "در حال پیگیری" }
];

var casesDB = JSON.parse(JSON.stringify(DEFAULT_UNIFIED_CASES));
var lettersDB = JSON.parse(JSON.stringify(DEFAULT_LETTERS));
var tasksDB = JSON.parse(JSON.stringify(DEFAULT_TASKS));
var activeCaseId = "CASE-201";
var editingLetterId = null;
var rootDriveHandle = null;
var pendingGuardedCallback = null;

// فهرست حذف دائمی؛ جلوی بازگشت داده از نسخه‌های قدیمی مرورگر و Google Drive را می‌گیرد.
var NEZAM_DELETION_MANIFEST_KEY = "nezam636_deletion_manifest_v1";
function readNezamDeletionManifest() {
  try {
    var raw = localStorage.getItem(NEZAM_DELETION_MANIFEST_KEY);
    var data = raw ? JSON.parse(raw) : {};
    return {
      version: 1,
      updatedAt: Number(data.updatedAt || 0),
      cases: Array.isArray(data.cases) ? data.cases : [],
      letters: Array.isArray(data.letters) ? data.letters : []
    };
  } catch (e) {
    return { version: 1, updatedAt: 0, cases: [], letters: [] };
  }
}
function mergeNezamDeletionManifests(a, b) {
  var left = a && typeof a === "object" ? a : {};
  var right = b && typeof b === "object" ? b : {};
  var merged = { version: 1, updatedAt: Math.max(Number(left.updatedAt || 0), Number(right.updatedAt || 0)), cases: [], letters: [] };
  ["cases", "letters"].forEach(function (type) {
    var byId = {};
    [left[type], right[type]].forEach(function (list) {
      (Array.isArray(list) ? list : []).forEach(function (item) {
        if (!item || !item.id) return;
        var id = String(item.id);
        if (!byId[id] || Number(item.deletedAt || 0) > Number(byId[id].deletedAt || 0)) {
          byId[id] = Object.assign({}, item, { id: id });
        }
      });
    });
    merged[type] = Object.keys(byId).map(function (id) { return byId[id]; });
  });
  return merged;
}
function persistNezamDeletionManifest(manifest) {
  try {
    var normalized = mergeNezamDeletionManifests(manifest, null);
    normalized.updatedAt = Math.max(Date.now(), Number(normalized.updatedAt || 0));
    localStorage.setItem(NEZAM_DELETION_MANIFEST_KEY, JSON.stringify(normalized));
    return true;
  } catch (e) {
    console.error("Nezam636 deletion manifest could not be saved:", e);
    return false;
  }
}
function recordNezamDeletions(caseRecords, letterRecords) {
  var manifest = readNezamDeletionManifest();
  var now = Date.now();
  (Array.isArray(caseRecords) ? caseRecords : []).forEach(function (item) {
    if (!item || !item.id) return;
    manifest.cases.push({ id: String(item.id), nid: String(item.nid || ""), name: String(item.name || ""), deletedAt: now });
  });
  (Array.isArray(letterRecords) ? letterRecords : []).forEach(function (item) {
    if (!item || !item.id) return;
    manifest.letters.push({ id: String(item.id), number: String(item.number || ""), recipient: String(item.recipient || ""), deletedAt: now });
  });
  return persistNezamDeletionManifest(manifest);
}
function isNezamCaseDeleted(item, manifest) {
  if (!item) return false;
  var id = String(item.id || "");
  return (manifest.cases || []).some(function (deleted) {
    if (!deleted) return false;
    if (id && String(deleted.id) === id) return true;
    // شناسه‌های ساخته‌شده از نسخه‌های بسیار قدیمی Drive بر اساس کدملی بازسازی می‌شوند.
    return id.indexOf("CASE-DRV-") === 0 && deleted.nid && String(deleted.nid) === String(item.nid || "");
  });
}
function isNezamLetterDeleted(item, manifest) {
  if (!item) return false;
  var id = String(item.id || "");
  return (manifest.letters || []).some(function (deleted) {
    if (!deleted) return false;
    if (id && String(deleted.id) === id) return true;
    return !!(deleted.number && String(deleted.number) === String(item.number || "") &&
      (!deleted.recipient || String(deleted.recipient) === String(item.recipient || "")));
  });
}
function filterNezamRecordsByDeletionManifest(caseRecords, letterRecords, manifest) {
  var m = mergeNezamDeletionManifests(manifest || readNezamDeletionManifest(), null);
  return {
    cases: (Array.isArray(caseRecords) ? caseRecords : []).filter(function (item) { return !isNezamCaseDeleted(item, m); }),
    letters: (Array.isArray(letterRecords) ? letterRecords : []).filter(function (item) { return !isNezamLetterDeleted(item, m); })
  };
}
function applyNezamDeletionManifestToState() {
  var filtered = filterNezamRecordsByDeletionManifest(casesDB, lettersDB, readNezamDeletionManifest());
  casesDB = filtered.cases;
  lettersDB = filtered.letters;
}
window.readNezamDeletionManifest = readNezamDeletionManifest;
window.mergeNezamDeletionManifests = mergeNezamDeletionManifests;
window.persistNezamDeletionManifest = persistNezamDeletionManifest;
window.filterNezamRecordsByDeletionManifest = filterNezamRecordsByDeletionManifest;
window.applyNezamDeletionManifestToState = applyNezamDeletionManifestToState;

/* بارگذاری و مهاجرت یک‌باره داده‌های قدیمی؛ پس از ایجاد کلید اصلی، کلید v6 دیگر منبع جایگزین نیست. */
function readCanonicalOrMigrateLegacy(primaryKey, legacyKey) {
  var raw = localStorage.getItem(primaryKey);
  if (raw !== null) {
    try { localStorage.removeItem(legacyKey); } catch (e) {}
    return raw;
  }
  var legacyRaw = localStorage.getItem(legacyKey);
  if (legacyRaw === null) return null;
  // کلید قدیمی فقط پس از اطمینان از ثبت نسخه اصلی حذف می‌شود.
  try {
    localStorage.setItem(primaryKey, legacyRaw);
    if (localStorage.getItem(primaryKey) === legacyRaw) {
      localStorage.removeItem(legacyKey);
      return legacyRaw;
    }
  } catch (migrationError) {
    console.error("Legacy storage migration failed:", primaryKey, migrationError);
  }
  return null;
}

/* بارگذاری و مهاجرت هوشمند داده‌های قبلی از LocalStorage */
try {
  if (localStorage.getItem("nezam636_act_specs_v3")) {
    var savedSpecs = JSON.parse(localStorage.getItem("nezam636_act_specs_v3"));
    for (var sk in savedSpecs) ACT_SPECS[sk] = savedSpecs[sk];
  }
  var initialCasesRaw = readCanonicalOrMigrateLegacy("nezam636_unified_cases", "nezam636_cases_v6");
  if (initialCasesRaw !== null) {
    var loadedCases = JSON.parse(initialCasesRaw);
    if (Array.isArray(loadedCases)) casesDB = loadedCases;
  }
  var initialLettersRaw = readCanonicalOrMigrateLegacy("nezam636_letters", "nezam636_letters_v6");
  if (initialLettersRaw !== null) {
    var loadedLetters = JSON.parse(initialLettersRaw);
    if (Array.isArray(loadedLetters)) lettersDB = loadedLetters;
  }
  if (localStorage.getItem("nezam636_tasks")) tasksDB = JSON.parse(localStorage.getItem("nezam636_tasks"));
  if (localStorage.getItem("nezam636_doc_checklists_v2")) {
    var loadedDocs = JSON.parse(localStorage.getItem("nezam636_doc_checklists_v2"));
    for (var dk in loadedDocs) DOC_CHECKLISTS[dk] = loadedDocs[dk];
  }
  if (localStorage.getItem("nezam636_active_case_id") !== null) {
    activeCaseId = localStorage.getItem("nezam636_active_case_id");
  }
} catch (e) {}
// کلید حتی در نصب تازه ایجاد می‌شود تا صحت ذخیره ابری همیشه قابل راستی‌آزمایی باشد.
if (localStorage.getItem(NEZAM_DELETION_MANIFEST_KEY) === null) {
  persistNezamDeletionManifest({ version: 1, cases: [], letters: [], updatedAt: Date.now() });
}
applyNezamDeletionManifestToState();

/* ارتقای ساختاری پرونده‌های قدیمی بدون حذف هیچ اطلاعاتی */
function normalizeAllCasesSchema() {
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
    if (!c.mainGroup) c.mainGroup = sp.mainGroup || "LIVESTOCK_POULTRY_FISHERIES";
    if (!c.entityType) c.entityType = "INDIVIDUAL";
    if (!c.caseStatus) c.caseStatus = "ACTIVE";
    if (!c.utmZone) c.utmZone = "39R";
    if (!Array.isArray(c.customFields)) c.customFields = [];
    // مهاجرت امن پلاک ثبتی از فیلدهای سفارشی قدیمی به فیلد مستقل پرونده
    if (c.landParcel == null || c.landParcel === "") {
      var legacyParcel = "";
      for (var pf = 0; pf < c.customFields.length; pf++) {
        var customLabel = String((c.customFields[pf] || {}).label || "");
        if (customLabel.indexOf("پلاک") !== -1) {
          legacyParcel = String(c.customFields[pf].value || "");
          if (legacyParcel) break;
        }
      }
      c.landParcel = legacyParcel;
    }
    if (!Array.isArray(c.history)) {
      c.history = [{ date: (c.issueDate || todayShamsi()) + " - ۰۸:۰۰", action: "ثبت اولیه پرونده در سامانه", by: "مدیر مرکز ۶۳۶" }];
    }
    if (!Array.isArray(c.croquisMaps)) c.croquisMaps = [];
    if (c.croquisMaps.length === 0 && c.utm && c.utm.trim().length > 5) {
      var pts = [];
      var lines = c.utm.trim().split("\n");
      for (var l = 0; l < lines.length; l++) {
        var p = toEn(lines[l].trim()).split(/[,،\s\t]+/);
        var x = parseFloat(p[0]), y = parseFloat(p[1]);
        if (!isNaN(x) && !isNaN(y)) pts.push({ x: x, y: y, label: "P" + (pts.length + 1) });
      }
      if (pts.length >= 3) {
        c.croquisMaps.push({
          id: "MAP-" + c.id + "-1",
          title: "کروکی اصلی زمین (" + (c.project || "طرح کشاورزی") + ")",
          date: c.issueDate || todayShamsi(),
          utmZone: c.utmZone || "39R",
          hemisphere: "N",
          notes: "کروکی استخراج‌شده از مختصات پرونده متقاضی",
          layers: [
            {
              id: "LYR-" + c.id + "-MAIN",
              name: "۱. محدوده اصلی زمین",
              category: "MAIN_PARCEL",
              geomType: "POLYGON",
              color: "#1b5e20",
              fillColor: "#2e7d32",
              fillOpacity: 0.20,
              strokeWidth: 3,
              visible: true,
              order: 1,
              desc: "محدوده اصلی عرصه",
              points: pts
            }
          ]
        });
      }
    }
  }
  // پرونده نمونه پس از حذف یا بازیابی پشتیبان، خودکار بازگردانده نمی‌شود.
}
normalizeAllCasesSchema();

function saveAllDB() {
  // هیچ نسخه قدیمی/بازیابی‌شده‌ای نباید رکوردی را که در فهرست حذف دائمی است دوباره ذخیره کند.
  applyNezamDeletionManifestToState();
  var storageEntries = [
    ["nezam636_unified_cases", casesDB],
    ["nezam636_letters", lettersDB],
    [NEZAM_DELETION_MANIFEST_KEY, readNezamDeletionManifest()],
    ["nezam636_tasks", tasksDB],
    ["nezam636_doc_checklists_v2", DOC_CHECKLISTS],
    ["nezam636_act_specs_v3", ACT_SPECS],
    ["nezam636_active_case_id", activeCaseId || ""]
  ];
  var failedKeys = [];

  // هر بخش جداگانه ذخیره می‌شود تا خطای یک کلید، ذخیره سایر اطلاعات را متوقف نکند.
  for (var i = 0; i < storageEntries.length; i++) {
    try {
      localStorage.setItem(storageEntries[i][0], JSON.stringify(storageEntries[i][1]));
    } catch (storageError) {
      failedKeys.push(storageEntries[i][0]);
      console.error("Nezam636 storage write failed:", storageEntries[i][0], storageError);
    }
  }

  if (!failedKeys.length) {
    try {
      localStorage.removeItem("nezam636_cases_v6");
      localStorage.removeItem("nezam636_letters_v6");
    } catch (legacyCleanupError) {}
  }
  if (failedKeys.length) {
    var now = Date.now();
    var lastWarning = Number(window.__nezam636LastStorageWarningAt || 0);
    if (typeof showToastMsg === "function" && now - lastWarning > 10000) {
      window.__nezam636LastStorageWarningAt = now;
      showToastMsg(
        "⚠️ ذخیره بخشی از اطلاعات در حافظه مرورگر انجام نشد. فضای ذخیره‌سازی را آزاد کنید و فوراً از بخش پشتیبان‌گیری، فایل JSON تهیه کنید.",
        true
      );
    }
  } else {
    window.__nezam636LastStorageWarningAt = 0;
  }

  refreshAllViews();
  return failedKeys.length === 0;
}

/* =========================================================================
   بخش سوم: قانون اجباری انتخاب متقاضی در سطح منطق اصلی برنامه
   هیچ فرایند اداری بدون ثبت و فراخوانی متقاضی در سامانه آغاز یا اجرا نمی‌شود
   ========================================================================= */
function getActiveCase() {
  if (!activeCaseId) return null;
  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === activeCaseId) return casesDB[i];
  }
  return null;
}

function logCaseAction(caseObj, actionText) {
  var c = caseObj || getActiveCase();
  if (!c) return;
  if (!Array.isArray(c.history)) c.history = [];
  c.history.unshift({
    date: todayShamsi() + " - " + nowTimeFa(),
    action: actionText,
    by: (window.brandCfg && window.brandCfg.managerName) ? window.brandCfg.managerName : "مدیر مرکز ۶۳۶"
  });
}

function requireActiveCase(actionTitle, onSuccessCallback) {
  var c = getActiveCase();
  if (c && c.id) {
    if (typeof onSuccessCallback === "function") onSuccessCallback(c);
    return c;
  }
  pendingGuardedCallback = typeof onSuccessCallback === "function" ? onSuccessCallback : null;
  openMandatoryApplicantModal(actionTitle || "انجام فرایند اداری");
  return null;
}
window.requireActiveCase = requireActiveCase;

function openMandatoryApplicantModal(reasonText) {
  var modal = document.getElementById("mandatory-applicant-modal");
  var reasonEl = document.getElementById("guard-modal-reason");
  if (reasonEl) {
    reasonEl.textContent = "عملیات درخواستی: «" + (reasonText || "شروع فرایند اداری") +
      "» — برای کارهای مرتبط با پرونده، انتخاب متقاضی الزامی است. مکاتبات مستقل دفتر را می‌توان از مسیر «نامه اداری مستقل دفتر» در دبیرخانه انجام داد.";
  }
  if (modal) {
    modal.style.display = "flex";
    renderGuardModalApplicantList();
    var inp = document.getElementById("guard-modal-search");
    if (inp) { inp.value = ""; inp.focus(); }
  }
}

function closeMandatoryApplicantModal() {
  var modal = document.getElementById("mandatory-applicant-modal");
  if (modal) modal.style.display = "none";
}

function renderGuardModalApplicantList() {
  var tbody = document.getElementById("guard-modal-tbody");
  if (!tbody) return;
  var q = toEn((document.getElementById("guard-modal-search") || {}).value || "").trim().toLowerCase();
  var grpFilter = (document.getElementById("guard-modal-group") || {}).value || "ALL";
  var html = "";

  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    if (grpFilter !== "ALL" && c.mainGroup !== grpFilter) continue;
    var hay = toEn([c.code, c.name, c.nid, c.mobile, c.project, c.loc, c.landParcel || "", c.repName || ""].join(" ")).toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    html += '<tr>' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td><b>' + escapeHtmlCore(c.name) + '</b><br><small class="text-muted">کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + ' | همراه: ' + escapeHtmlCore(toFa(c.mobile || "---")) + '</small></td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + escapeHtmlCore(grpMeta.shortTitle) + '</span><br><small>' + escapeHtmlCore(c.project) + '</small></td>' +
      '<td><button type="button" class="btn btn-sm btn-success fw-bold" data-guard-case-id="' + escapeHtmlCore(c.id) + '">✅ انتخاب و ادامه</button></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="4" class="text-center py-3 text-muted">متقاضی با این مشخصات یافت نشد. لطفاً روی دکمه «ثبت متقاضی جدید» کلیک کنید.</td></tr>';
  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-guard-case-id]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-guard-case-id");
      var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
      if (exists) confirmSelectApplicantFromGuard(id);
    });
  }
}
function confirmSelectApplicantFromGuard(caseId) {
  selectActiveCase(caseId);
  closeMandatoryApplicantModal();
  if (typeof pendingGuardedCallback === "function") {
    var cb = pendingGuardedCallback;
    pendingGuardedCallback = null;
    cb(getActiveCase());
  }
}

function clearActiveApplicantSelection() {
  activeCaseId = "";
  saveAllDB();
  updateActiveApplicantBarUI();
  showToastMsg("⚠️ انتخاب متقاضی پاک شد. تا انتخاب مجدد متقاضی، عملیات اداری متوقف است.", true);
}

function updateActiveApplicantBarUI() {
  var c = getActiveCase();
  var statusBadge = document.getElementById("active-case-status-badge");
  var infoSummary = document.getElementById("active-case-info-summary");
  var lockBanner = document.getElementById("no-active-case-warning-banner");

  if (!c) {
    if (statusBadge) {
      statusBadge.className = "badge bg-danger fs-6";
      statusBadge.textContent = "⛔ بدون متقاضی فعال (عملیات قفل)";
    }
    if (infoSummary) {
      infoSummary.textContent = "هیچ متقاضی انتخاب نشده است! پیش از هرگونه عملیات، متقاضی را انتخاب یا ثبت نمایید.";
    }
    if (lockBanner) lockBanner.style.display = "block";
  } else {
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var entityLbl = c.entityType === "LEGAL" ? "شخص حقوقی" : (c.entityType === "ORG" ? "سازمان/نهاد" : "شخص حقیقی");
    if (statusBadge) {
      statusBadge.className = "badge bg-success fs-6";
      statusBadge.textContent = "👤 پرونده فعال: " + String(c.name || "");
    }
    if (infoSummary) {
      infoSummary.innerHTML =
        '<span class="badge ' + grpMeta.badgeClass + ' me-1">' + escapeHtmlCore(grpMeta.shortTitle) + '</span>' +
        '<span class="badge bg-secondary me-1">' + entityLbl + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کلاسه: ' + escapeHtmlCore(toFa(c.code)) + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + '</span>' +
        '<span class="badge bg-success-subtle text-success border border-success me-1">' + escapeHtmlCore(c.project) + ' (' + escapeHtmlCore(toFa(c.cap)) + ')</span>' +
        '<span class="badge bg-light text-secondary border">📍 ' + escapeHtmlCore(c.loc) + '</span>' +
        (c.landParcel ? '<span class="badge bg-light text-primary border">پلاک: ' + escapeHtmlCore(toFa(c.landParcel)) + '</span>' : '');
    }
    if (lockBanner) lockBanner.style.display = "none";
  }
}
function switchMainPane(paneId) {
  if (paneId === "pane-compose") paneId = "pane-cases";
  if (paneId === "pane-preview") paneId = "pane-print";
  if (paneId === "pane-ai-center") paneId = "pane-ai";

  // ورود به دبیرخانه آزاد است؛ فقط عملیات پرونده‌محور همچنان به انتخاب متقاضی نیاز دارند.
  var guardedPanes = {
    "pane-croquis": "ورود به ابزار تخصصی کروکی زمین و نقشه UTM",
    "pane-print": "مشاهده و چاپ سربرگ و فرم‌های رسمی متقاضی"
  };
  var independentOfficeLetterFlow = window.__nezamOfficeLetterDraftMode === true;

  if (guardedPanes[paneId] && !getActiveCase() && !(paneId === "pane-print" && independentOfficeLetterFlow)) {
    requireActiveCase(guardedPanes[paneId], function() {
      switchMainPane(paneId);
    });
    return;
  }

  var panes = document.querySelectorAll(".sec-pane");
  for (var i = 0; i < panes.length; i++) panes[i].classList.remove("active");
  var target = document.getElementById(paneId);
  if (target) target.classList.add("active");

  var mapBtn = {
    "pane-dashboard": "nav-btn-dashboard",
    "pane-cases": "nav-btn-cases",
    "pane-croquis": "nav-btn-croquis",
    "pane-letters": "nav-btn-letters",
    "pane-print": "nav-btn-print",
    "pane-office": "nav-btn-office",
    "pane-ai": "nav-btn-ai",
    "pane-guide": "nav-btn-guide"
  };
  var navLinks = document.querySelectorAll(".app-navbar .nav-link");
  for (var j = 0; j < navLinks.length; j++) navLinks[j].classList.remove("active");
  var btn = document.getElementById(mapBtn[paneId]);
  if (btn) btn.classList.add("active");

  if (paneId === "pane-croquis" && typeof window.initCroquisWorkspaceForActiveCase === "function") {
    window.initCroquisWorkspaceForActiveCase();
  }
}
window.openSection = switchMainPane;

function switchCaseSubTab(subId) {
  var guardedSubs = {
    "sub-info": "ویرایش مشخصات پرونده متقاضی",
    "sub-docs": "بایگانی مدارک و چک‌لیست پرونده متقاضی",
    "sub-history": "مشاهده و ثبت سوابق اقدامات پرونده"
  };
  if (guardedSubs[subId] && !getActiveCase()) {
    requireActiveCase(guardedSubs[subId], function() {
      switchCaseSubTab(subId);
    });
    return;
  }

  var subs = document.querySelectorAll(".case-subpane");
  for (var i = 0; i < subs.length; i++) subs[i].classList.remove("active");
  var target = document.getElementById(subId);
  if (target) target.classList.add("active");

  var btns = document.querySelectorAll(".case-subtab-btn");
  for (var j = 0; j < btns.length; j++) btns[j].classList.remove("active");
  var b = document.getElementById("btn-" + subId);
  if (b) b.classList.add("active");

  if (subId === "sub-list") renderApplicantsDirectoryTable();
  if (subId === "sub-matrix") renderUnifiedCasesMatrix();
  if (subId === "sub-docs") renderActiveCaseDocsChecklist();
  if (subId === "sub-history") renderActiveCaseHistory();
}

/* =========================================================================
   ۵. مدیریت متقاضیان، جستجوی پیشرفته، فیلتر ۳ گروه و جلوگیری از تکرار
   ========================================================================= */
function populateGlobalCaseSelector() {
  var sel = document.getElementById("global-case-selector");
  if (!sel) return;
  var html = '<option value="">-- انتخاب متقاضی / سازمان فعال --</option>';
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    html += '<option value="' + escapeHtmlCore(c.id) + '" ' + (c.id === activeCaseId ? "selected" : "") + '>' +
      '[' + escapeHtmlCore(grpMeta.shortTitle) + '] ' + escapeHtmlCore(toFa(c.code)) + ' — ' + escapeHtmlCore(c.name) +
      ' (کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + ' | ' + escapeHtmlCore(c.cap) + ')' +
    '</option>';
  }
  sel.innerHTML = html;
  updateActiveApplicantBarUI();
}
function selectActiveCase(caseId) {
  if (!caseId) {
    clearActiveApplicantSelection();
    return;
  }
  activeCaseId = caseId;
  try { localStorage.setItem("nezam636_active_case_id", activeCaseId); } catch (e) {}

  // پاک‌سازی وضعیت ویرایش قبلی تا اطلاعات پرونده قبلی ناخواسته در عملیات جدید استفاده نشوند
  editingLetterId = null;
  var editAlert = document.getElementById("letter-edit-alert");
  if (editAlert) editAlert.style.display = "none";

  populateGlobalCaseSelector();
  loadActiveCaseIntoForm();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();
  renderActiveCaseDocsChecklist();
  renderActiveCaseHistory();
  if (typeof window.initCroquisWorkspaceForActiveCase === "function") window.initCroquisWorkspaceForActiveCase();
  if (typeof renderSinglePreviewSheet === "function") renderSinglePreviewSheet();
}

function populateActivityDropdownByGroup(selectedGroup, selectedActKey) {
  var actSel = document.getElementById("c-act-type");
  if (!actSel) return;
  var html = "";
  for (var k in ACT_SPECS) {
    if (!Object.prototype.hasOwnProperty.call(ACT_SPECS, k)) continue;
    var sp = ACT_SPECS[k] || {};
    if (!selectedGroup || sp.mainGroup === selectedGroup) {
      html += '<option value="' + escapeHtmlCore(k) + '" ' + (k === selectedActKey ? "selected" : "") + '>' +
        escapeHtmlCore(sp.title) + ' (واحد: ' + escapeHtmlCore(sp.unit) + ')</option>';
    }
  }
  actSel.innerHTML = html;
}
function onMainGroupChangedInForm() {
  var grp = document.getElementById("c-main-group").value;
  populateActivityDropdownByGroup(grp, "");
  recalcCaseSpecsFromHeadcount();
}

function onEntityTypeChangedInForm() {
  var ent = (document.getElementById("c-entity-type") || {}).value || "INDIVIDUAL";
  var legalBox = document.getElementById("c-legal-extra-fields");
  var lblName = document.getElementById("lbl-c-name");
  var lblNid = document.getElementById("lbl-c-nid");
  if (ent === "INDIVIDUAL") {
    if (legalBox) legalBox.style.display = "none";
    if (lblName) lblName.textContent = "نام و نام خانوادگی متقاضی حقیقی *";
    if (lblNid) lblNid.textContent = "کد ملی متقاضی (۱۰ رقمی) *";
  } else {
    if (legalBox) legalBox.style.display = "flex";
    if (lblName) lblName.textContent = ent === "LEGAL" ? "نام کامل شرکت / مؤسسه حقوقی *" : "نام سازمان / نهاد دولتی یا عمومی *";
    if (lblNid) lblNid.textContent = "شناسه ملی حقوقی / سازمانی (۱۱ رقمی) *";
  }
}

function addNewActivitySubgroupPrompt() {
  var grp = (document.getElementById("c-main-group") || {}).value || "GREENHOUSE_MUSHROOM";
  var grpMeta = APPLICANT_MAIN_GROUPS[grp] || APPLICANT_MAIN_GROUPS.GREENHOUSE_MUSHROOM;
  var title = prompt("عنوان زیرگروه یا فعالیت جدید در «" + grpMeta.title + "» را وارد نمایید:");
  if (!title || !title.trim()) return;
  var unit = prompt("واحد سنجش ظرفیت (مثلاً: مترمربع، راس، قطعه، تن در سال، واحد):", "مترمربع") || "واحد";
  var water = parseFloat(toEn(prompt("ضریب مصرف آب روزانه به ازای هر " + unit + " (لیتر):", "10"))) || 10;
  var land = parseFloat(toEn(prompt("ضریب مساحت زمین به ازای هر " + unit + " (مترمربع):", "2"))) || 2;
  var newKey = "custom_act_" + new Date().getTime();
  var docGrp = grp === "GREENHOUSE_MUSHROOM" ? "GREENHOUSE" : (grp === "CLINIC_PHARMACY" ? "CLINIC" : "LIVESTOCK");

  ACT_SPECS[newKey] = {
    mainGroup: grp,
    title: title.trim(),
    unit: unit.trim(),
    water: water,
    land: land,
    minL: 100,
    roof: land * 0.5,
    open: land * 0.5,
    docGroup: docGrp
  };
  saveAllDB();
  populateActivityDropdownByGroup(grp, newKey);
  recalcCaseSpecsFromHeadcount();
  showToastMsg("زیرگروه جدید «" + title.trim() + "» به سامانه اضافه شد.");
}

function loadActiveCaseIntoForm() {
  var c = getActiveCase();
  if (!c) return;
  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var mainGrp = c.mainGroup || sp.mainGroup || "LIVESTOCK_POULTRY_FISHERIES";

  var grpEl = document.getElementById("c-main-group");
  if (grpEl) grpEl.value = mainGrp;
  populateActivityDropdownByGroup(mainGrp, c.actType);

  var entEl = document.getElementById("c-entity-type");
  if (entEl) entEl.value = c.entityType || "INDIVIDUAL";
  onEntityTypeChangedInForm();

  var stEl = document.getElementById("c-case-status");
  if (stEl) stEl.value = c.caseStatus || "ACTIVE";

  document.getElementById("c-count").value = toEn(c.count || 200);
  document.getElementById("c-code").value = c.code || "الف-۱۰۱/۶۳۶";
  document.getElementById("c-name").value = c.name || "";
  document.getElementById("c-nid").value = toFa(c.nid || "");
  document.getElementById("c-mobile").value = toFa(c.mobile || "");
  if (document.getElementById("c-reg-no")) document.getElementById("c-reg-no").value = toFa(c.regNo || "");
  if (document.getElementById("c-rep-name")) document.getElementById("c-rep-name").value = c.repName || "";
  document.getElementById("c-issue-date").value = toFa(c.issueDate || todayShamsi());
  document.getElementById("c-exp-date").value = toFa(c.expDate || "۱۴۰۵/۰۸/۱۳");
  document.getElementById("c-project").value = c.project || "";
  document.getElementById("c-cap").value = toFa(c.cap || "");
  document.getElementById("c-land").value = toFa(c.land || "");
  var parcelInput = document.getElementById("c-land-parcel");
  if (parcelInput) parcelInput.value = toFa(c.landParcel || "");
  document.getElementById("c-water").value = toFa(c.water || "");
  document.getElementById("c-loc").value = c.loc || "";
  document.getElementById("c-subarea").value = c.subarea || "";
  document.getElementById("c-utm").value = toEn(c.utm || "");

  if (typeof window.renderCaseSegmentedPointsTable === "function") {
    window.renderCaseSegmentedPointsTable();
  }

  renderCustomFieldsSummary();
}

function recalcCaseSpecsFromHeadcount() {
  var key = document.getElementById("c-act-type").value;
  var count = parseFloat(toEn(document.getElementById("c-count").value)) || 0;
  var sp = ACT_SPECS[key] || ACT_SPECS.sheep_high;

  var water = Math.round(count * sp.water);
  var land = Math.max(sp.minL, Math.round(count * sp.land));
  var roof = Math.round(count * sp.roof);
  var open = Math.round(count * sp.open);

  document.getElementById("c-project").value = sp.title;
  document.getElementById("c-cap").value = toFa(count) + " " + sp.unit;
  document.getElementById("c-water").value = toFa(water);
  document.getElementById("c-land").value = toFa(land);
  document.getElementById("c-subarea").value = "مسقف: " + toFa(roof) + " م.م | بهاربند/محوطه: " + toFa(open) + " م.م";
}
window.autoFillFromHeadcount = recalcCaseSpecsFromHeadcount;

function startNewCaseWizard(presetGroup) {
  var grp = presetGroup || "GREENHOUSE_MUSHROOM";
  var defaultAct = grp === "GREENHOUSE_MUSHROOM" ? "greenhouse_veg" : (grp === "CLINIC_PHARMACY" ? "pharmacy" : "sheep_high");
  var sp = ACT_SPECS[defaultAct] || ACT_SPECS.greenhouse_veg;
  var prefix = grp === "GREENHOUSE_MUSHROOM" ? "گ-" : (grp === "CLINIC_PHARMACY" ? "د-" : "دام-");
  var newId = "CASE-" + new Date().getTime();
  var nextNum = casesDB.length + 101;

  var newCase = {
    id: newId,
    code: prefix + toFa(nextNum) + "/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: grp,
    actType: defaultAct,
    name: "متقاضی جدید",
    nid: "",
    regNo: "",
    repName: "",
    mobile: "",
    count: grp === "GREENHOUSE_MUSHROOM" ? 1000 : (grp === "CLINIC_PHARMACY" ? 1 : 200),
    project: sp.title,
    cap: grp === "GREENHOUSE_MUSHROOM" ? "۱۰۰۰ مترمربع" : (grp === "CLINIC_PHARMACY" ? "۱ واحد" : "۲۰۰ راس"),
    land: grp === "GREENHOUSE_MUSHROOM" ? "۱۲۵۰" : (grp === "CLINIC_PHARMACY" ? "۴۵" : "۱۲۰۰"),
    landParcel: "",
    water: grp === "GREENHOUSE_MUSHROOM" ? "۸۰۰۰" : (grp === "CLINIC_PHARMACY" ? "۲۰۰" : "۲۰۰۰"),
    subarea: "مسقف: ۱۰۰۰ م.م | محوطه: ۲۵۰ م.م",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utmZone: "39R",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    issueDate: todayShamsi(),
    expDate: "۱۴۰۶/۰۲/۱۳",
    caseStatus: "ACTIVE",
    customFields: [],
    inquiries: { water: "NONE", elec: "NONE", road: "NONE", gas: "NONE", env: "NONE", natres: "NONE", vet: "NONE" },
    history: [
      { date: todayShamsi() + " - " + nowTimeFa(), action: "ایجاد پرونده جدید در سامانه", by: "مدیر مرکز ۶۳۶" }
    ],
    croquisMaps: []
  };

  casesDB.unshift(newCase);
  activeCaseId = newId;
  saveAllDB();
  loadActiveCaseIntoForm();
  closeMandatoryApplicantModal();
  switchMainPane("pane-cases");
  switchCaseSubTab("sub-info");
  var nameInput = document.getElementById("c-name");
  if (nameInput) { nameInput.focus(); nameInput.select(); }
  showToastMsg("پرونده جدید تشکیل شد؛ مشخصات متقاضی و کد ملی را وارد و ذخیره نمایید.");
}

function saveActiveCaseChanges(goToLetters) {
  var c = getActiveCase();
  if (!c) {
    requireActiveCase("ذخیره تغییرات پرونده");
    return;
  }

  var enteredName = document.getElementById("c-name").value.trim();
  var enteredNid = toEn(document.getElementById("c-nid").value.trim());
  var enteredCode = document.getElementById("c-code").value.trim();

  if (!enteredName || enteredName === "متقاضی جدید") {
    alert("لطفاً نام و نام خانوادگی متقاضی (یا نام شرکت/سازمان) را به طور دقیق وارد نمایید.");
    document.getElementById("c-name").focus();
    return;
  }
  if (!enteredNid || enteredNid.length < 8) {
    alert("لطفاً کد ملی ۱۰ رقمی یا شناسه ملی ۱۱ رقمی معتبر وارد نمایید.");
    document.getElementById("c-nid").focus();
    return;
  }

  // جلوگیری از ثبت پرونده تکراری بر اساس کد ملی یا کلاسه پرونده
  for (var i = 0; i < casesDB.length; i++) {
    var other = casesDB[i];
    if (other.id === c.id) continue;
    if (enteredNid && toEn(other.nid) === enteredNid && other.actType === document.getElementById("c-act-type").value) {
      var confirmDup = confirm("⚠️ هشدار جلوگیری از پرونده تکراری:\nمتقاضی «" + other.name + "» با همین کد ملی/شناسه (" + toFa(enteredNid) + ") و همین نوع فعالیت در پرونده کلاسه «" + toFa(other.code) + "» قبلاً ثبت شده است.\nآیا مطمئن هستید که می‌خواهید پرونده دومی برای ایشان ثبت شود؟");
      if (!confirmDup) return;
      break;
    }
  }

  c.entityType = (document.getElementById("c-entity-type") || {}).value || "INDIVIDUAL";
  c.mainGroup = (document.getElementById("c-main-group") || {}).value || "GREENHOUSE_MUSHROOM";
  c.actType = document.getElementById("c-act-type").value;
  c.caseStatus = (document.getElementById("c-case-status") || {}).value || "ACTIVE";
  c.count = parseFloat(toEn(document.getElementById("c-count").value)) || 0;
  c.code = enteredCode;
  c.name = enteredName;
  c.nid = toFa(enteredNid);
  c.mobile = toFa(document.getElementById("c-mobile").value.trim());
  if (document.getElementById("c-reg-no")) c.regNo = toFa(document.getElementById("c-reg-no").value.trim());
  if (document.getElementById("c-rep-name")) c.repName = document.getElementById("c-rep-name").value.trim();
  c.issueDate = toFa(document.getElementById("c-issue-date").value.trim());
  c.expDate = toFa(document.getElementById("c-exp-date").value.trim());
  c.project = document.getElementById("c-project").value.trim();
  c.cap = toFa(document.getElementById("c-cap").value.trim());
  c.land = toFa(document.getElementById("c-land").value.trim());
  c.landParcel = toFa((document.getElementById("c-land-parcel") || {}).value || "");
  c.water = toFa(document.getElementById("c-water").value.trim());
  c.loc = document.getElementById("c-loc").value.trim();
  c.subarea = document.getElementById("c-subarea").value.trim();
  c.utm = toEn(document.getElementById("c-utm").value.trim());

  logCaseAction(c, "ویرایش و ذخیره اطلاعات پرونده (" + c.project + " - " + c.cap + ")");
  saveAllDB();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();

  if (goToLetters) {
    switchMainPane("pane-letters");
    showToastMsg("مشخصات پرونده ذخیره شد؛ اکنون قالب نامه استعلام را انتخاب کنید.");
  } else {
    showToastMsg("تغییرات پرونده «" + c.name + "» با موفقیت ذخیره شد.");
  }
}

function deleteActiveCase() {
  if (window.__nezamDriveReady === false) {
    showToastMsg("در حال تکمیل بازیابی اطلاعات؛ پس از آماده‌شدن سامانه حذف را انجام دهید.", true);
    return;
  }
  var c = getActiveCase();
  if (!c) return;
  if (casesDB.length <= 1) {
    alert("حداقل یک پرونده باید در سامانه باقی بماند.");
    return;
  }
  var relatedLetters = 0;
  for (var l = 0; l < lettersDB.length; l++) if (lettersDB[l].caseId === c.id) relatedLetters++;
  var mapCount = (c.croquisMaps || []).length;

  var msg = "⚠️ کنترل دسترسی و تأیید نهایی حذف پرونده:\n" +
    "متقاضی: " + c.name + " (کدملی: " + toFa(c.nid) + ")\n" +
    "کلاسه: " + toFa(c.code) + "\n" +
    "سوابق مرتبط: " + toFa(relatedLetters) + " نامه دبیرخانه و " + toFa(mapCount) + " نقشه کروکی.\n\n" +
    "آیا از حذف قطعی این پرونده اطمینان کامل دارید؟";
  if (!confirm(msg)) return;

  var deleteHistoryToo = confirm("آیا نامه‌های ثبت‌شده این متقاضی در دفتر اندیکاتور نیز حذف شوند؟ (برای حفظ سوابق دبیرخانه روی Cancel کلیک کنید)");
  var lettersToDelete = deleteHistoryToo
    ? lettersDB.filter(function(item) { return item.caseId === c.id; })
    : [];
  // پیش از حذف، ثبت دائمی انجام می‌شود تا نسخه‌های قدیمی Drive یا مرورگر نتوانند پرونده را زنده کنند.
  if (!recordNezamDeletions([c], lettersToDelete)) {
    alert("ثبت سابقه حذف در حافظه مرورگر ناموفق بود؛ برای جلوگیری از بازگشت پرونده، حذف انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.");
    return;
  }
  if (deleteHistoryToo) {
    lettersDB = lettersDB.filter(function(item) { return item.caseId !== c.id; });
  }

  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === c.id) {
      casesDB.splice(i, 1);
      break;
    }
  }
  activeCaseId = casesDB[0].id;
  var caseDeleteSaved = saveAllDB();
  loadActiveCaseIntoForm();
  if (typeof window.syncDeletionToDrive === "function") window.syncDeletionToDrive();
  showToastMsg(caseDeleteSaved
    ? "پرونده حذف و در فهرست حذف دائمی ثبت شد."
    : "حذف در فهرست حذف دائمی ثبت شد، اما ذخیره یکی از بخش‌های مرورگر خطا داد؛ وضعیت ذخیره‌سازی را بررسی کنید.", !caseDeleteSaved);
}

/* جدول فهرست جامع و جستجوی پیشرفته متقاضیان در ۳ گروه تخصصی */
function renderApplicantsDirectoryTable() {
  var tbody = document.getElementById("applicants-directory-tbody");
  if (!tbody) return;

  var q = toEn((document.getElementById("adv-search-q") || {}).value || "").trim().toLowerCase();
  var fGroup = (document.getElementById("adv-filter-group") || {}).value || "ALL";
  var fEntity = (document.getElementById("adv-filter-entity") || {}).value || "ALL";
  var fStatus = (document.getElementById("adv-filter-status") || {}).value || "ALL";
  var fDate = toEn((document.getElementById("adv-filter-date") || {}).value || "").trim();

  var countG1 = 0, countG2 = 0, countG3 = 0;
  for (var k = 0; k < casesDB.length; k++) {
    if (casesDB[k].mainGroup === "GREENHOUSE_MUSHROOM") countG1++;
    else if (casesDB[k].mainGroup === "CLINIC_PHARMACY") countG3++;
    else countG2++;
  }
  var b1 = document.getElementById("badge-count-g1"); if (b1) b1.textContent = toFa(countG1);
  var b2 = document.getElementById("badge-count-g2"); if (b2) b2.textContent = toFa(countG2);
  var b3 = document.getElementById("badge-count-g3"); if (b3) b3.textContent = toFa(countG3);

  var statusMap = {
    ACTIVE: { txt: "فعال", cls: "bg-success" },
    IN_PROGRESS: { txt: "در جریان استعلام", cls: "bg-warning text-dark" },
    APPROVED: { txt: "دارای مجوز/مصوب", cls: "bg-primary" },
    ARCHIVED: { txt: "راکد / بایگانی", cls: "bg-secondary" }
  };

  var html = "";
  var matched = 0;
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    if (fGroup !== "ALL" && c.mainGroup !== fGroup) continue;
    if (fEntity !== "ALL" && (c.entityType || "INDIVIDUAL") !== fEntity) continue;
    if (fStatus !== "ALL" && (c.caseStatus || "ACTIVE") !== fStatus) continue;
    if (fDate && toEn(c.issueDate || "").indexOf(fDate) === -1) continue;

    var searchHay = toEn([c.code, c.name, c.nid, c.mobile, c.project, c.loc, c.landParcel || "", c.repName || "", c.regNo || ""].join(" ")).toLowerCase();
    if (q && searchHay.indexOf(q) === -1) continue;

    matched++;
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var stMeta = statusMap[c.caseStatus || "ACTIVE"] || statusMap.ACTIVE;
    var entTitle = c.entityType === "LEGAL" ? "🏢 حقوقی" : (c.entityType === "ORG" ? "🏛️ سازمانی" : "👤 حقیقی");
    var mapsCount = (c.croquisMaps || []).length;
    var safeId = escapeHtmlCore(c.id);

    html += '<tr class="' + (c.id === activeCaseId ? 'table-success border-success' : '') + '">' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td class="text-start">' +
        '<b>' + escapeHtmlCore(c.name) + '</b> ' +
        '<span class="badge bg-light text-dark border">' + entTitle + '</span><br>' +
        '<small class="text-muted">کدملی/شناسه: <b>' + escapeHtmlCore(toFa(c.nid)) + '</b> | تماس: ' + escapeHtmlCore(toFa(c.mobile || "---")) + '</small>' +
        (c.repName ? '<br><small class="text-primary">نماینده/مدیرعامل: ' + escapeHtmlCore(c.repName) + '</small>' : '') +
      '</td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + escapeHtmlCore(grpMeta.shortTitle) + '</span></td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.project) + '</b><br><small class="text-muted">ظرفیت: ' + escapeHtmlCore(toFa(c.cap)) + ' | زمین: ' + escapeHtmlCore(toFa(c.land)) + ' م.م</small></td>' +
      '<td class="text-start"><small class="fw-bold text-success">' + escapeHtmlCore(c.loc) + '</small><br><small class="text-primary">پلاک ثبتی: ' + escapeHtmlCore(toFa(c.landParcel || "---")) + '</small><br><small class="text-muted">تاریخ ثبت: ' + escapeHtmlCore(toFa(c.issueDate)) + '</small></td>' +
      '<td><span class="badge ' + stMeta.cls + '">' + stMeta.txt + '</span><br><small class="text-muted">' + escapeHtmlCore(toFa(mapsCount)) + ' نقشه کروکی</small></td>' +
      '<td>' +
        '<div class="d-flex gap-1 justify-content-center flex-wrap">' +
          '<button type="button" class="btn btn-sm ' + (c.id === activeCaseId ? 'btn-success' : 'btn-outline-success') + ' fw-bold py-0 px-2" data-case-action="select" data-case-id="' + safeId + '">' + (c.id === activeCaseId ? '✔ فعال (ویرایش)' : 'انتخاب پرونده') + '</button>' +
          '<button type="button" class="btn btn-sm btn-outline-primary fw-bold py-0 px-2" data-case-action="croquis" data-case-id="' + safeId + '">🗺️ کروکی</button>' +
          '<button type="button" class="btn btn-sm btn-outline-dark fw-bold py-0 px-2" data-case-action="letters" data-case-id="' + safeId + '">📨 نامه</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  tbody.innerHTML = html || '<tr><td colspan="7" class="text-center py-4 text-muted">هیچ متقاضی با فیلترهای انتخاب‌شده یافت نشد.</td></tr>';
  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-case-action]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-case-id");
      var action = btn.getAttribute("data-case-action");
      var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
      if (!exists) return;
      selectActiveCase(id);
      if (action === "croquis") switchMainPane("pane-croquis");
      else if (action === "letters") switchMainPane("pane-letters");
      else if (action === "select") switchCaseSubTab("sub-info");
    });
  }
  var matchCountEl = document.getElementById("adv-search-count-badge");
  if (matchCountEl) matchCountEl.textContent = toFa(matched) + " پرونده";
}
function filterDirectoryByMainGroupCard(grpCode) {
  var sel = document.getElementById("adv-filter-group");
  if (sel) sel.value = grpCode;
  switchMainPane("pane-cases");
  switchCaseSubTab("sub-list");
  renderApplicantsDirectoryTable();
}

function renderActiveCaseHistory() {
  var c = getActiveCase();
  var tbody = document.getElementById("case-history-tbody");
  if (!tbody || !c) return;
  var list = Array.isArray(c.history) ? c.history : [];
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var item = list[i] || {};
    html += '<tr>' +
      '<td class="text-center fw-bold">' + escapeHtmlCore(toFa(i + 1)) + '</td>' +
      '<td class="fw-bold text-primary">' + escapeHtmlCore(toFa(item.date)) + '</td>' +
      '<td>' + escapeHtmlCore(item.action) + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + escapeHtmlCore(item.by || "مرکز ۶۳۶") + '</span></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="4" class="text-center text-muted py-3">سابقه‌ای ثبت نشده است.</td></tr>';
}
function addManualHistoryNoteToCase() {
  var c = getActiveCase();
  if (!c) return;
  var inp = document.getElementById("new-history-note-input");
  var txt = (inp ? inp.value : "").trim();
  if (!txt) { alert("شرح اقدام انجام‌شده را وارد نمایید."); return; }
  logCaseAction(c, txt);
  if (inp) inp.value = "";
  saveAllDB();
  renderActiveCaseHistory();
  showToastMsg("اقدام جدید در سوابق پرونده ثبت شد.");
}

function addCustomFieldToActiveCase() {
  var c = getActiveCase();
  if (!c) return;
  var lbl = prompt("عنوان فیلد سفارشی جدید برای این پرونده را وارد کنید (مثلاً: شماره پلاک ثبتی، فاصله تا روستا):");
  if (!lbl || !lbl.trim()) return;
  var val = prompt("مقدار «" + lbl.trim() + "» را وارد نمایید:") || "";
  if (!c.customFields) c.customFields = [];
  c.customFields.push({ label: lbl.trim(), value: val.trim() });
  saveAllDB();
  renderCustomFieldsSummary();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();
}

function renderCustomFieldsSummary() {
  var c = getActiveCase();
  var el = document.getElementById("c-custom-fields-summary");
  if (!el || !c) return;
  var list = Array.isArray(c.customFields) ? c.customFields : [];
  if (!list.length) { el.textContent = ""; return; }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var field = list[i] || {};
    html += '<span class="badge bg-secondary me-1">' + escapeHtmlCore(field.label) + ': ' + escapeHtmlCore(toFa(field.value)) +
      ' <span style="cursor:pointer;color:#fca5a5;" onclick="getActiveCase().customFields.splice(' + i + ',1);saveAllDB();renderCustomFieldsSummary();">✕</span></span>';
  }
  el.innerHTML = html;
}
function copyCaseFieldLatin(inputId, title) {
  var el = document.getElementById(inputId);
  if (!el) return;
  var val = toEn(el.value.trim());
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val);
  showToastMsg(title + " کپی شد: " + val.split("\n")[0]);
}

/* =========================================================================
   ۶. ماتریس یکپارچه پیگیری پاسخ ۷ استعلام هر پرونده (بدون دکمه چاپ ۶ نامه)
   ========================================================================= */
var INQ_STATUS_ORDER = ["NONE", "WAIT", "OK", "REJ"];
var INQ_STATUS_STYLE = {
  NONE: { txt: "⚪ ارسال نشده", cls: "btn-light border text-secondary" },
  WAIT: { txt: "🟡 منتظر پاسخ", cls: "btn-warning text-dark" },
  OK:   { txt: "🟢 موافقت شد", cls: "btn-success text-white" },
  REJ:  { txt: "🔴 مخالفت/نقص", cls: "btn-danger text-white" }
};

function toggleCaseInquiryStatus(caseId, agencyKey) {
  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === caseId) {
      if (!casesDB[i].inquiries) casesDB[i].inquiries = {};
      var cur = casesDB[i].inquiries[agencyKey] || "NONE";
      var next = INQ_STATUS_ORDER[(INQ_STATUS_ORDER.indexOf(cur) + 1) % INQ_STATUS_ORDER.length];
      casesDB[i].inquiries[agencyKey] = next;
      logCaseAction(casesDB[i], "تغییر وضعیت استعلام (" + agencyKey + ") به " + INQ_STATUS_STYLE[next].txt);
      break;
    }
  }
  saveAllDB();
}

function renderUnifiedCasesMatrix() {
  var tbody = document.getElementById("unified-matrix-tbody");
  if (!tbody) return;
  var q = toFa((document.getElementById("matrix-filter-input") || {}).value || "").trim().toLowerCase();
  var agencies = ["water", "elec", "road", "gas", "env", "natres", "vet"];
  var html = "";

  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var hay = [c.code, c.name, c.nid, c.project, c.loc].join(" ").toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var inq = c.inquiries || {};
    var okCount = 0;
    var cells = "";
    var safeId = escapeHtmlCore(c.id);
    for (var a = 0; a < agencies.length; a++) {
      var agencyKey = agencies[a];
      var st = inq[agencyKey] || "NONE";
      if (st === "OK") okCount++;
      var meta = INQ_STATUS_STYLE[st] || INQ_STATUS_STYLE.NONE;
      cells += '<td><button type="button" class="btn btn-sm ' + meta.cls + ' fw-bold py-1 px-2" style="font-size:0.73rem;white-space:nowrap;" data-case-action="inquiry" data-case-id="' + safeId + '" data-inquiry-key="' + agencyKey + '">' + escapeHtmlCore(meta.txt) + '</button></td>';
    }

    var pct = Math.round((okCount / agencies.length) * 100);
    html += '<tr class="' + (c.id === activeCaseId ? 'table-active' : '') + '">' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.name) + '</b><br><small class="text-muted">کدملی: ' + escapeHtmlCore(toFa(c.nid)) + '</small><br><small class="text-success fw-bold">' + escapeHtmlCore(c.loc) + '</small></td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.project) + '</b><br><small class="text-muted">ظرفیت: ' + escapeHtmlCore(toFa(c.cap)) + ' | ' + escapeHtmlCore(toFa(c.land)) + ' م.م</small></td>' +
      cells +
      '<td><span class="badge ' + (pct === 100 ? 'bg-success' : 'bg-primary') + '">' + escapeHtmlCore(toFa(pct)) + '٪ (' + escapeHtmlCore(toFa(okCount)) + '/۷)</span></td>' +
      '<td><small class="fw-bold text-danger">' + escapeHtmlCore(toFa(c.expDate || "۱۴۰۵/۰۸/۱۳")) + '</small></td>' +
      '<td><div class="d-flex gap-1 justify-content-center">' +
        '<button type="button" class="btn btn-sm btn-outline-success fw-bold" data-case-action="letters" data-case-id="' + safeId + '" data-tip="صدور نامه استعلام برای این پرونده">📨 صدور نامه</button>' +
        '<button type="button" class="btn btn-sm btn-outline-dark fw-bold" data-case-action="binder" data-case-id="' + safeId + '" data-tip="چاپ لیبل عطف زونکن">🏷️ لیبل</button>' +
      '</div></td></tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="13" class="py-3 text-muted">موردی یافت نشد.</td></tr>';

  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-case-action]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-case-id");
      var action = btn.getAttribute("data-case-action");
      var item = casesDB.find(function (record) { return record && String(record.id) === id; });
      if (!item) return;
      if (action === "inquiry") {
        var key = btn.getAttribute("data-inquiry-key");
        if (agencies.indexOf(key) === -1) return;
        toggleCaseInquiryStatus(id, key);
      } else {
        selectActiveCase(id);
        if (action === "letters") switchMainPane("pane-letters");
        else if (action === "binder") printOfficialForm("BINDER_LABEL");
      }
    });
  }
}
function openFilesDB(cb) {
  var settled = false;
  var timer = setTimeout(function() { finish(null); }, 4500);
  function finish(db) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try { cb(db || null); }
    catch (callbackError) { console.error("IndexedDB callback failed:", callbackError); }
  }

  if (idbInstance) {
    try {
      // دسترسی به transaction هم وضعیت بسته‌شدن DB را آشکار می‌کند.
      idbInstance.transaction(["docs"], "readonly");
      return finish(idbInstance);
    } catch (closedError) {
      try { idbInstance.close(); } catch (e) {}
      idbInstance = null;
    }
  }
  if (!window.indexedDB) return finish(null);

  var req;
  try {
    req = window.indexedDB.open("Nezam636_UnifiedFiles_DB", 1);
  } catch (openError) {
    console.warn("Could not open local document database:", openError);
    return finish(null);
  }
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs", { keyPath: "key" });
  };
  req.onsuccess = function(e) {
    var db = e.target.result;
    idbInstance = db;
    db.onversionchange = function() {
      try { db.close(); } catch (closeError) {}
      if (idbInstance === db) idbInstance = null;
    };
    finish(db);
  };
  req.onerror = function() {
    console.warn("IndexedDB open failed:", req.error || "unknown error");
    finish(null);
  };
  req.onblocked = function() {
    console.warn("IndexedDB open is blocked by another tab or connection.");
    finish(null);
  };
}

function getUploadedDocsForCase(caseId, cb) {
  var completed = false;
  var fallbackTimer = setTimeout(function() {
    if (completed) return;
    completed = true;
    console.warn("Local document lookup timed out; continuing with Google Drive inventory.");
    cb({});
  }, 5000);

  function finish(map) {
    if (completed) return;
    completed = true;
    clearTimeout(fallbackTimer);
    cb(map || {});
  }

  openFilesDB(function(db) {
    if (!db) return finish({});
    var tx;
    try {
      tx = db.transaction(["docs"], "readonly");
      var req = tx.objectStore("docs").getAll();
      req.onsuccess = function(e) {
        var list = e.target.result || [];
        var map = {};
        for (var i = 0; i < list.length; i++) {
          if (String(list[i].caseId) === String(caseId)) map[list[i].docCode] = list[i];
        }
        finish(map);
      };
      req.onerror = function() { finish({}); };
      tx.onerror = function() { finish({}); };
      tx.onabort = function() { finish({}); };
    } catch (readError) {
      console.warn("Local document lookup failed:", readError);
      finish({});
    }
  });
}

function uploadCaseDocFile(event, docCode, docTitle, replaceFileId) {
  var input = event && event.target;
  var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
  if (!files.length) return false;
  var active = requireActiveCase("بارگذاری فایل مدرک در پرونده");
  if (!active) { if (input) input.value = ""; return false; }

  if (window.NezamDriveDocuments && typeof window.NezamDriveDocuments.uploadFiles === "function") {
    var context = {
      caseId: String(active.id),
      fullName: String(active.name || ""),
      nationalCode: String(active.nid || active.code || ""),
      docCode: String(docCode || "OTHER"),
      docTitle: String(docTitle || "سایر مدارک"),
      replaceFileId: String(replaceFileId || "")
    };
    if (context.replaceFileId && files.length !== 1) {
      alert("برای جایگزینی فقط یک فایل انتخاب کنید.");
      if (input) input.value = "";
      return false;
    }
    window.NezamDriveDocuments.uploadFiles(files, context).then(function(result) {
      var successCount = result.successes ? result.successes.length : 0;
      var failureCount = result.failures ? result.failures.length : 0;
      if (typeof showToastMsg === "function") {
        showToastMsg(failureCount
          ? successCount + " فایل در Drive ذخیره شد؛ " + failureCount + " فایل ناموفق بود. جزئیات را در گزارش بارگذاری ببینید."
          : successCount + " فایل با موفقیت در Google Drive ذخیره شد.", !!failureCount);
      }
      if (failureCount) console.warn("Drive document upload failures:", result.failures);
      if (typeof renderActiveCaseDocsChecklist === "function") renderActiveCaseDocsChecklist();
    }).catch(function(error) {
      console.error("Drive document upload failed:", error);
      if (typeof showToastMsg === "function") showToastMsg(error.message || "بارگذاری در Google Drive ناموفق بود.", true);
      else alert(error.message || "بارگذاری در Google Drive ناموفق بود.");
    }).finally(function() {
      if (input) input.value = "";
    });
    return true;
  }

  // برای جلوگیری از ثبت اشتباه مدرک به‌عنوان «تحویل‌شده»، در نبود ماژول Drive فایل جدید فقط محلی ذخیره نمی‌شود.
  if (typeof showToastMsg === "function") showToastMsg("اتصال بایگانی Google Drive آماده نیست؛ فایل بارگذاری نشد. صفحه را تازه‌سازی کنید و وضعیت اتصال را بررسی کنید.", true);
  if (input) input.value = "";
  return false;
}

function uploadCaseDocFileLegacy(event, docCode, docTitle) {
  var input = event && event.target;
  var file = input && input.files ? input.files[0] : null;
  if (!file) return;
  var active = requireActiveCase("بارگذاری فایل مدرک در پرونده");
  if (!active) { input.value = ""; return; }

  var extensionMatch = String(file.name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  var extension = extensionMatch ? extensionMatch[1] : "";
  var allowedTypes = {
    pdf: ["application/pdf"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"]
  };
  var accepted = allowedTypes[extension];
  var mime = String(file.type || "").toLowerCase();
  if (!accepted || (mime && accepted.indexOf(mime) === -1)) {
    alert("فقط فایل‌های PDF، JPG، PNG و WEBP قابل بارگذاری هستند.");
    input.value = "";
    return;
  }
  if (file.size <= 0 || file.size > 12 * 1024 * 1024) {
    alert("حجم هر مدرک باید بیشتر از صفر و حداکثر ۱۲ مگابایت باشد.");
    input.value = "";
    return;
  }

  // بررسی امضای ابتدایی فایل؛ پسوند به‌تنهایی قابل جعل است.
  var signatureReader = new FileReader();
  signatureReader.onerror = function () {
    alert("بررسی نوع واقعی فایل ناموفق بود.");
    input.value = "";
  };
  signatureReader.onload = function(signatureEvent) {
    var bytes = new Uint8Array(signatureEvent.target.result || new ArrayBuffer(0));
    var validSignature = false;
    if (extension === "pdf") {
      validSignature = bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
    } else if (extension === "jpg" || extension === "jpeg") {
      validSignature = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    } else if (extension === "png") {
      validSignature = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
    } else if (extension === "webp") {
      validSignature = bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    }
    if (!validSignature) {
      alert("محتوای واقعی فایل با پسوند انتخاب‌شده مطابقت ندارد.");
      input.value = "";
      return;
    }

    var reader = new FileReader();
    reader.onerror = function () {
      alert("خواندن فایل ناموفق بود. فایل را دوباره انتخاب کنید.");
      input.value = "";
    };
    reader.onload = function(e) {
      if (!e.target || typeof e.target.result !== "string" || e.target.result.indexOf("data:") !== 0) {
        alert("محتوای فایل معتبر نیست.");
        input.value = "";
        return;
      }
      openFilesDB(function(db) {
        if (!db) {
          alert("مخزن فایل‌های مرورگر در دسترس نیست.");
          input.value = "";
          return;
        }
        try {
          var tx = db.transaction(["docs"], "readwrite");
          tx.objectStore("docs").put({
            key: active.id + "__" + docCode,
            caseId: active.id,
            docCode: docCode,
            docTitle: docTitle,
            fileName: String(file.name || "document." + extension).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 140),
            uploadDate: todayShamsi(),
            dataUrl: e.target.result,
            rawBlob: file
          });
          tx.oncomplete = function() {
            logCaseAction(active, "بارگذاری مدرک «" + docTitle + "» (" + file.name + ")");
            saveAllDB();
            renderActiveCaseDocsChecklist();
            showToastMsg("فایل «" + docTitle + "» در پرونده «" + active.name + "» ذخیره شد.");
            input.value = "";
          };
          tx.onerror = function() {
            alert("ذخیره فایل در مرورگر ناموفق بود. فضای ذخیره‌سازی را بررسی کنید.");
            input.value = "";
          };
        } catch (storageError) {
          console.error("Document storage failed:", storageError);
          alert("ذخیره فایل انجام نشد؛ احتمالاً فضای کافی در مرورگر وجود ندارد.");
          input.value = "";
        }
      });
    };
    reader.readAsDataURL(file);
  };
  signatureReader.readAsArrayBuffer(file.slice(0, 12));
}

function downloadCaseDocFile(docCode) {
  var c = getActiveCase();
  if (!c) return;
  getUploadedDocsForCase(c.id, function(map) {
    var rec = map[docCode];
    if (!rec || !rec.dataUrl) return;
    var a = document.createElement("a");
    a.href = rec.dataUrl;
    a.download = rec.fileName;
    a.click();
  });
}

function removeCaseDocFile(docCode) {
  var c = getActiveCase();
  if (!c) return;
  if (!confirm("فایل بارگذاری‌شده حذف شود؟")) return;
  openFilesDB(function(db) {
    if (!db) return;
    var tx = db.transaction(["docs"], "readwrite");
    tx.objectStore("docs").delete(c.id + "__" + docCode);
    tx.oncomplete = function() { renderActiveCaseDocsChecklist(); };
  });
}

function addCustomDocToChecklist() {
  var c = requireActiveCase("افزودن مدرک به چک‌لیست");
  if (!c) return;
  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var grp = sp.docGroup || "LIVESTOCK";
  var title = prompt("عنوان مدرک جدید مورد نیاز را وارد نمایید:");
  if (!title || !title.trim()) return;
  var ref = prompt("مرجع یا ماده قانونی مربوط به این مدرک (اختیاری):", "ضوابط اختصاصی مرکز ۶۳۶") || "";
  if (!DOC_CHECKLISTS[grp]) DOC_CHECKLISTS[grp] = [];
  DOC_CHECKLISTS[grp].push({ code: "CDOC_" + new Date().getTime(), title: title.trim(), mandatory: true, legalRef: ref.trim() });
  saveAllDB();
  renderActiveCaseDocsChecklist();
}

function renderActiveCaseDocsChecklist() {
  var c = getActiveCase();
  var tbody = document.getElementById("case-docs-tbody");
  var banner = document.getElementById("case-missing-docs-banner");
  var folderLbl = document.getElementById("drive-folder-label");
  var toolbar = document.getElementById("case-docs-drive-toolbar");
  var libraryBox = document.getElementById("case-docs-file-library");
  var libraryBody = document.getElementById("case-docs-library-tbody");
  var librarySummary = document.getElementById("case-docs-library-summary");
  if (!tbody || !banner) return;

  if (!c) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3 fw-bold">ابتدا یک متقاضی را انتخاب نمایید.</td></tr>';
    banner.textContent = "";
    if (toolbar) toolbar.style.display = "none";
    if (librarySummary) librarySummary.textContent = "ابتدا یک متقاضی را انتخاب کنید.";
    if (libraryBody) libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">پرونده‌ای انتخاب نشده است.</td></tr>';
    return;
  }

  if (toolbar) toolbar.style.display = "";
  var safeFolder = (c.name + " - " + toEn(c.nid || "000")).replace(/[\\/:*?"<>|]/g, "_");
  if (folderLbl) folderLbl.textContent = "📁 بایگانی ابری متقاضی: " + safeFolder;

  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

  function bindToolbar() {
    if (!toolbar || toolbar.dataset.bound === "1") return;
    toolbar.dataset.bound = "1";
    var select = document.getElementById("case-doc-bulk-code");
    var fileInput = document.getElementById("case-doc-bulk-files");
    var uploadBtn = document.getElementById("case-doc-bulk-upload");
    var migrateBtn = document.getElementById("case-doc-migrate-legacy");
    var retryBtn = document.getElementById("case-doc-retry-failed");
    if (retryBtn) retryBtn.addEventListener("click", async function() {
      if (!window.NezamDriveDocuments || !window.NezamDriveDocuments.retryFailed) return;
      retryBtn.disabled = true;
      try {
        var result = await window.NezamDriveDocuments.retryFailed();
        var failed = result.failures ? result.failures.length : 0;
        showToastMsg((result.successes ? result.successes.length : 0) + " فایل در تلاش مجدد ذخیره شد." +
          (failed ? " " + failed + " فایل همچنان ناموفق است." : ""), !!failed);
        renderActiveCaseDocsChecklist();
      } catch (error) {
        showToastMsg(error.message || "تلاش مجدد ناموفق بود.", true);
      } finally {
        retryBtn.disabled = false;
      }
    });
    var searchInput = document.getElementById("case-doc-search");
    if (searchInput) searchInput.addEventListener("input", function() {
      var query = String(searchInput.value || "").trim().toLocaleLowerCase();
      var tableRows = tbody.querySelectorAll("tr");
      for (var ri = 0; ri < tableRows.length; ri++) {
        var haystack = String(tableRows[ri].textContent || "").toLocaleLowerCase();
        tableRows[ri].style.display = !query || haystack.indexOf(query) !== -1 ? "" : "none";
      }
    });
    if (uploadBtn) uploadBtn.addEventListener("click", function() {
      var option = select && select.options[select.selectedIndex];
      if (!option || !option.value) {
        showToastMsg("ابتدا عنوان مدرک را انتخاب کنید.", true);
        return;
      }
      if (!fileInput || !fileInput.files || !fileInput.files.length) {
        showToastMsg("ابتدا یک یا چند فایل انتخاب کنید.", true);
        return;
      }
      uploadCaseDocFile({ target: fileInput }, option.value, option.textContent || "سایر مدارک");
    });
    if (fileInput) fileInput.addEventListener("change", function() {
      var label = document.getElementById("case-doc-bulk-file-label");
      if (label) label.textContent = fileInput.files.length
        ? toFa(fileInput.files.length) + " فایل انتخاب شده"
        : "هنوز فایلی انتخاب نشده است";
    });
    if (migrateBtn) migrateBtn.addEventListener("click", async function() {
      if (!window.NezamDriveDocuments || !window.NezamDriveDocuments.migrateLegacyDocs) {
        showToastMsg("ابزار انتقال فایل‌های قدیمی بارگذاری نشده است.", true);
        return;
      }
      var button = migrateBtn;
      button.disabled = true;
      try {
        var ctx = window.NezamDriveDocuments.getCaseContext();
        var result = await window.NezamDriveDocuments.migrateLegacyDocs(ctx);
        var failed = result.failures ? result.failures.length : 0;
        showToastMsg((result.successes ? result.successes.length : 0) + " فایل قدیمی منتقل شد." +
          (failed ? " " + failed + " فایل منتقل نشد؛ جزئیات در گزارش فنی موجود است." : ""), !!failed);
        if (failed) console.warn("Legacy document migration failures:", result.failures);
        renderActiveCaseDocsChecklist();
      } catch (error) {
        showToastMsg(error.message || "انتقال مدارک قدیمی ناموفق بود.", true);
      } finally {
        button.disabled = false;
      }
    });
  }

  bindToolbar();
  if (librarySummary) librarySummary.textContent = "در حال دریافت فهرست فایل‌های متقاضی از Google Drive...";
  if (libraryBody) libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">⏳ در حال بارگذاری فهرست اسناد...</td></tr>';
  var legacyBoxHandler = document.getElementById("case-docs-legacy-files");
  if (legacyBoxHandler && legacyBoxHandler.dataset.bound !== "1") {
    legacyBoxHandler.dataset.bound = "1";
    legacyBoxHandler.addEventListener("click", function(event) {
      var btn = event.target && event.target.closest ? event.target.closest("button[data-legacy-delete]") : null;
      if (!btn) return;
      var fileId = btn.getAttribute("data-legacy-delete");
      var current = getActiveCase();
      if (!fileId || !current || !window.NezamDriveDocuments) return;
      if (!confirm("این فایل قدیمی از پوشه Google Drive متقاضی حذف شود؟")) return;
      btn.disabled = true;
      window.NezamDriveDocuments.remove(fileId, {
        caseId: String(current.id), fullName: String(current.name || ""),
        nationalCode: String(current.nid || current.code || "")
      }).catch(function(error) {
        showToastMsg(error.message || "حذف فایل قدیمی ناموفق بود.", true);
      }).finally(function() { renderActiveCaseDocsChecklist(); });
    });
  }
  if (libraryBox && libraryBox.dataset.actionsBound !== "1") {
    libraryBox.dataset.actionsBound = "1";
    libraryBox.addEventListener("click", function(event) {
      var refresh = event.target && event.target.closest ? event.target.closest("#case-docs-refresh-library") : null;
      if (refresh) {
        refresh.disabled = true;
        renderActiveCaseDocsChecklist();
        setTimeout(function() { refresh.disabled = false; }, 1200);
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest("button[data-library-action]") : null;
      if (!button || !libraryBox.contains(button)) return;
      var action = button.getAttribute("data-library-action");
      var fileId = button.getAttribute("data-file-id");
      var current = getActiveCase();
      if (!current || !fileId || !window.NezamDriveDocuments) return;
      if (action === "delete") {
        if (!confirm("فایل انتخاب‌شده از Google Drive حذف شود؟")) return;
        button.disabled = true;
        window.NezamDriveDocuments.remove(fileId, {
          caseId: String(current.id), fullName: String(current.name || ""),
          nationalCode: String(current.nid || current.code || "")
        }).catch(function(error) {
          showToastMsg(error.message || "حذف فایل ناموفق بود.", true);
        }).finally(function() {
          renderActiveCaseDocsChecklist();
        });
      }
    });
    libraryBox.addEventListener("change", function(event) {
      var input = event.target && event.target.closest
        ? event.target.closest('input[data-library-action="replace"]') : null;
      if (!input || !libraryBox.contains(input)) return;
      var current = getActiveCase();
      var code = input.getAttribute("data-doc-code");
      var title = input.getAttribute("data-doc-title");
      var fileId = input.getAttribute("data-file-id");
      if (!current || !code || !title || !fileId || !input.files || !input.files.length) return;
      if (input.files.length !== 1) {
        showToastMsg("برای جایگزینی هر فایل، فقط یک فایل جدید انتخاب کنید.", true);
        input.value = "";
        return;
      }
      uploadCaseDocFile({ target: input }, code, title, fileId);
    });
  }

  var bulkSelect = document.getElementById("case-doc-bulk-code");
  if (bulkSelect) {
    var selectedBulk = bulkSelect.value;
    bulkSelect.innerHTML = reqDocs.map(function(doc) {
      return '<option value="' + escapeHtmlCore(doc.code) + '">' + escapeHtmlCore(doc.title) + '</option>';
    }).join("");
    if (selectedBulk && reqDocs.some(function(doc) { return String(doc.code) === selectedBulk; })) bulkSelect.value = selectedBulk;
  }

  if (!tbody.dataset.secureDocActionsBound) {
    tbody.dataset.secureDocActionsBound = "1";
    tbody.addEventListener("change", function(event) {
      var input = event.target && event.target.closest
        ? event.target.closest('input[data-doc-action="upload"],input[data-doc-action="replace"]') : null;
      if (!input || !tbody.contains(input)) return;
      var code = input.getAttribute("data-doc-code");
      var title = input.getAttribute("data-doc-title");
      var action = input.getAttribute("data-doc-action");
      var oldFileId = action === "replace" ? input.getAttribute("data-file-id") : "";
      var current = getActiveCase();
      if (!current || !code || !title) return;
      var currentSpec = ACT_SPECS[current.actType] || ACT_SPECS.sheep_high;
      var allowedDocs = DOC_CHECKLISTS[currentSpec.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;
      if (!allowedDocs.some(function(doc) { return doc && String(doc.code) === code; })) return;
      uploadCaseDocFile(event, code, title, oldFileId);
    });

    tbody.addEventListener("click", function(event) {
      var btn = event.target && event.target.closest
        ? event.target.closest("button[data-doc-action]") : null;
      if (!btn || !tbody.contains(btn)) return;
      var code = btn.getAttribute("data-doc-code");
      var action = btn.getAttribute("data-doc-action");
      var fileId = btn.getAttribute("data-file-id");
      var current = getActiveCase();
      if (!current || !code) return;
      var currentSpec = ACT_SPECS[current.actType] || ACT_SPECS.sheep_high;
      var allowedDocs = DOC_CHECKLISTS[currentSpec.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;
      if (!allowedDocs.some(function(doc) { return doc && String(doc.code) === code; })) return;

      if (action === "remove-file") {
        if (!fileId || !window.NezamDriveDocuments) return;
        if (!confirm("این فایل به‌صورت دائمی از بایگانی Google Drive حذف شود؟ فایل به سطل زباله Drive منتقل خواهد شد.")) return;
        var context = { caseId: String(current.id), fullName: String(current.name || ""), nationalCode: String(current.nid || current.code || "") };
        btn.disabled = true;
        window.NezamDriveDocuments.remove(fileId, context).catch(function(error) {
          showToastMsg(error.message || "حذف فایل از Drive ناموفق بود.", true);
        }).finally(function() {
          btn.disabled = false;
          renderActiveCaseDocsChecklist();
        });
      } else if (action === "download-local") {
        downloadCaseDocFile(code);
      }
    });
  }

  function renderDriveLibrary(cloudFiles, cloudError, folderUrl) {
    if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;
    if (libraryBody) {
      if (cloudError) {
        libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">دریافت فهرست فایل‌ها ناموفق بود: ' +
          escapeHtmlCore(cloudError) + '<br><small>اتصال و دسترسی Google Drive را بررسی کنید.</small></td></tr>';
      } else if (!cloudFiles || !cloudFiles.length) {
        libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">هنوز فایلی در پوشه Google Drive این متقاضی پیدا نشد.</td></tr>';
      } else {
        var ordered = cloudFiles.slice().sort(function(a,b) {
          return Number(b.updatedAt || b.uploadedAt || 0) - Number(a.updatedAt || a.uploadedAt || 0);
        });
        libraryBody.innerHTML = ordered.map(function(file) {
          var fileId = String(file.fileId || file.id || "");
          var safeId = escapeHtmlCore(fileId);
          var rawName = String(file.fileName || file.name || "بدون نام");
          var fileName = escapeHtmlCore(rawName);
          var docTitle = escapeHtmlCore(file.docTitle || "فایل قدیمی / پیوست");
          var docCode = escapeHtmlCore(file.docCode || "LEGACY");
          var ext = rawName.match(/\.([^.]+)$/);
          var typeLabel = escapeHtmlCore((ext ? ext[1].toUpperCase() + " · " : "") + String(file.mimeType || "نوع نامشخص"));
          var size = Math.max(0, Number(file.size || 0));
          var sizeLabel = size >= 1073741824 ? (size/1073741824).toFixed(2)+" GB" :
            (size >= 1048576 ? (size/1048576).toFixed(2)+" MB" : (size ? Math.max(1,Math.round(size/1024))+" KB" : "—"));
          var stamp = Number(file.uploadedAt || file.updatedAt || 0);
          var dateLabel = stamp ? new Date(stamp).toLocaleString("fa-IR") : "—";
          var version = Math.max(1,Number(file.version || 1));
          var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
          var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
          var links = (viewUrl ? '<a class="btn btn-sm btn-outline-primary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(viewUrl) + '">👁️ مشاهده</a>' : '') +
            (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(downloadUrl) + '">⬇️ دانلود</a>' : '');
          var replace = (!file.legacy && docCode !== "LEGACY")
            ? '<label class="btn btn-sm btn-outline-warning py-0 px-2 m-0">جایگزینی<input type="file" hidden data-library-action="replace" data-file-id="' + safeId + '" data-doc-code="' + docCode + '" data-doc-title="' + docTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"></label>' : '';
          return '<tr class="case-drive-file-row">' +
            '<td><div class="fw-bold">' + fileName + '</div><small class="text-muted">' + docTitle + '</small></td>' +
            '<td><span class="badge bg-light text-dark border">' + typeLabel + '</span></td>' +
            '<td class="text-nowrap">' + escapeHtmlCore(sizeLabel) + '</td>' +
            '<td class="text-nowrap small">' + escapeHtmlCore(dateLabel) + '</td>' +
            '<td class="text-center">' + escapeHtmlCore(toFa(version)) + '</td>' +
            '<td><div class="d-flex flex-wrap gap-1">' + links + replace +
              '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-library-action="delete" data-file-id="' + safeId + '">🗑️ حذف</button>' +
            '</div></td></tr>';
        }).join("");
        var search = document.getElementById("case-doc-search");
        if (search && search.value) {
          var q = String(search.value).trim().toLocaleLowerCase();
          Array.prototype.forEach.call(libraryBody.querySelectorAll(".case-drive-file-row"),function(row) {
            row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(q) !== -1 ? "" : "none";
          });
        }
      }
    }
    if (librarySummary) {
      var total = (cloudFiles || []).reduce(function(sum,file) { return sum + Math.max(0,Number(file.size || 0)); },0);
      var sizeText = total >= 1073741824 ? (total/1073741824).toFixed(2)+" GB" :
        (total >= 1048576 ? (total/1048576).toFixed(2)+" MB" : (total ? Math.max(1,Math.round(total/1024))+" KB" : "۰ بایت"));
      librarySummary.textContent = cloudError
        ? "خطا در دریافت فهرست فایل‌ها"
        : toFa((cloudFiles || []).length)+" فایل · مجموع حجم "+sizeText+" · تازه‌سازی "+new Date().toLocaleTimeString("fa-IR");
    }
    if (folderLbl && folderUrl && /^https:\/\/drive\.google\.com\//.test(folderUrl)) {
      folderLbl.innerHTML = '<a href="' + escapeHtmlCore(folderUrl) + '" target="_blank" rel="noopener noreferrer">📁 بازکردن پوشه اختصاصی در Google Drive</a>';
    }
  }

  var driveListContext = {
    caseId: String(c.id),
    fullName: String(c.name || ""),
    nationalCode: String(c.nid || c.code || "")
  };
  var driveListPromise = window.NezamDriveDocuments && typeof window.NezamDriveDocuments.list === "function"
    ? window.NezamDriveDocuments.list(driveListContext)
    : Promise.reject(new Error("ماژول اتصال بایگانی ابری بارگذاری نشده است."));

  // دریافت و نمایش کتابخانه ابری مستقل از IndexedDB؛ خرابی حافظه محلی نباید دیدن فایل‌های Drive را متوقف کند.
  driveListPromise.then(function(result) {
    renderDriveLibrary(result.documents || [], "", result.folderUrl || "");
  }).catch(function(error) {
    renderDriveLibrary([], error && error.message ? error.message : String(error), "");
  });

  getUploadedDocsForCase(c.id, function(localMap) {
    if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;

    function renderRows(cloudFiles, cloudError, folderUrl) {
      if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;
      var missing = [];
      var rows = "";
      var doneCount = 0;
      var legacyFiles = (cloudFiles || []).filter(function(file) { return file && (file.legacy || file.docCode === "LEGACY"); });
      var managedFiles = (cloudFiles || []).filter(function(file) { return file && !file.legacy && file.docCode !== "LEGACY"; });

      for (var i = 0; i < reqDocs.length; i++) {
        var d = reqDocs[i] || {};
        var safeCode = escapeHtmlCore(d.code);
        var safeTitle = escapeHtmlCore(d.title);
        var filesForDoc = managedFiles.filter(function(file) { return String(file.docCode) === String(d.code); });
        var localFile = localMap[d.code];
        if (filesForDoc.length) doneCount++;
        else missing.push(d.title);

        var statusHtml = filesForDoc.length
          ? '<span class="badge bg-success">✅ در Google Drive (' + escapeHtmlCore(toFa(filesForDoc.length)) + ' فایل)</span>'
          : (localFile
            ? '<span class="badge bg-warning text-dark">⚠️ فقط در این مرورگر؛ هنوز به Drive منتقل نشده</span><br><small>' + escapeHtmlCore(localFile.fileName || "") + '</small>'
            : '<span class="badge bg-danger">❌ مدرک در بایگانی ابری موجود نیست</span>');

        var fileActions = filesForDoc.map(function(file) {
          var safeId = escapeHtmlCore(file.fileId || file.id || "");
          var safeName = escapeHtmlCore(file.fileName || file.name || "فایل");
          var size = Number(file.size || 0);
          var sizeLabel = size ? (size >= 1048576 ? (size / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB") : "";
          var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
          var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
          return '<div class="d-flex flex-wrap align-items-center gap-1 border rounded p-1 mb-1 bg-white">' +
            (viewUrl ? '<a class="small fw-bold text-decoration-none" href="' + escapeHtmlCore(viewUrl) + '" target="_blank" rel="noopener noreferrer">👁️ ' + safeName + '</a>' : '<span class="small fw-bold">' + safeName + '</span>') +
            '<small class="text-muted">' + escapeHtmlCore(sizeLabel) + (Number(file.version || 1) > 1 ? ' · نسخه ' + escapeHtmlCore(toFa(file.version)) : '') + '</small>' +
            (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-1" href="' + escapeHtmlCore(downloadUrl) + '" target="_blank" rel="noopener noreferrer">دریافت</a>' : '') +
            (!file.legacy ? '<label class="btn btn-sm btn-outline-primary py-0 px-1 m-0" title="ابتدا نسخه جدید ذخیره می‌شود و سپس نسخه قبلی به سطل زباله می‌رود">جایگزینی<input type="file" data-doc-action="replace" data-doc-code="' + safeCode + '" data-doc-title="' + safeTitle + '" data-file-id="' + safeId + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp" hidden></label>' : '') +
            '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-doc-action="remove-file" data-doc-code="' + safeCode + '" data-file-id="' + safeId + '">حذف</button>' +
            '</div>';
        }).join("");

        rows += '<tr class="' + (filesForDoc.length ? 'table-success' : '') + '">' +
          '<td class="text-center fw-bold">' + escapeHtmlCore(toFa(i + 1)) + '</td>' +
          '<td><b>' + safeTitle + '</b>' + (d.legalRef ? '<br><small class="text-primary">⚖️ مستند قانونی: ' + escapeHtmlCore(d.legalRef) + '</small>' : '') + '</td>' +
          '<td>' + statusHtml + (filesForDoc.length && localFile ? '<br><small class="text-warning">یک نسخه قدیمی محلی نیز وجود دارد.</small>' : '') + '</td>' +
          '<td><div class="d-flex flex-column gap-1">' +
          '<label class="btn btn-sm btn-primary fw-bold m-0" style="cursor:pointer;">📤 افزودن فایل<input type="file" multiple data-doc-action="upload" data-doc-code="' + safeCode + '" data-doc-title="' + safeTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp" hidden></label>' +
          fileActions +
          '</div></td></tr>';
      }

      tbody.innerHTML = rows || '<tr><td colspan="4" class="text-center py-3 text-muted">چک‌لیست مدرک برای این فعالیت تعریف نشده است.</td></tr>';

      // فهرست مستقل همه فایل‌های Drive؛ مستقل از چک‌لیست و عنوان مدرک.
      if (libraryBody) {
        var allFiles = (cloudFiles || []).slice().sort(function(a, b) {
          return Number(b.updatedAt || b.uploadedAt || 0) - Number(a.updatedAt || a.uploadedAt || 0);
        });
        if (cloudError) {
          libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">دریافت فهرست فایل‌ها ناموفق بود: ' + escapeHtmlCore(cloudError) + '<br><small>اتصال و دسترسی Google Drive را بررسی و دکمه تازه‌سازی را اجرا کنید.</small></td></tr>';
        } else if (!allFiles.length) {
          libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">هنوز فایلی در پوشه Google Drive این متقاضی پیدا نشد.</td></tr>';
        } else {
          libraryBody.innerHTML = allFiles.map(function(file, index) {
            var fileId = String(file.fileId || file.id || "");
            var safeId = escapeHtmlCore(fileId);
            var fileName = escapeHtmlCore(file.fileName || file.name || "بدون نام");
            var docTitle = escapeHtmlCore(file.docTitle || "فایل قدیمی / پیوست");
            var docCode = escapeHtmlCore(file.docCode || "LEGACY");
            var mimeType = String(file.mimeType || "نامشخص");
            var extMatch = String(file.fileName || file.name || "").match(/\.([^.]+)$/);
            var typeLabel = escapeHtmlCore(extMatch ? extMatch[1].toUpperCase() + " · " + mimeType : mimeType);
            var size = Math.max(0, Number(file.size || 0));
            var sizeLabel = size >= 1073741824 ? (size / 1073741824).toFixed(2) + " GB" :
              (size >= 1048576 ? (size / 1048576).toFixed(2) + " MB" :
              (size ? Math.max(1, Math.round(size / 1024)) + " KB" : "—"));
            var dateValue = Number(file.uploadedAt || file.updatedAt || 0);
            var dateLabel = dateValue ? new Date(dateValue).toLocaleString("fa-IR") : "—";
            var version = Math.max(1, Number(file.version || 1));
            var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
            var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
            var links = (viewUrl ? '<a class="btn btn-sm btn-outline-primary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(viewUrl) + '">👁️ مشاهده</a>' : '') +
              (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(downloadUrl) + '">⬇️ دانلود</a>' : '');
            var replace = (!file.legacy && docCode !== "LEGACY")
              ? '<label class="btn btn-sm btn-outline-warning py-0 px-2 m-0">جایگزینی<input type="file" hidden data-library-action="replace" data-file-id="' + safeId + '" data-doc-code="' + docCode + '" data-doc-title="' + docTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"></label>'
              : '';
            return '<tr class="case-drive-file-row">' +
              '<td><div class="fw-bold">' + fileName + '</div><small class="text-muted">' + docTitle + '</small></td>' +
              '<td><span class="badge bg-light text-dark border">' + typeLabel + '</span></td>' +
              '<td class="text-nowrap">' + escapeHtmlCore(sizeLabel) + '</td>' +
              '<td class="text-nowrap small">' + escapeHtmlCore(dateLabel) + '</td>' +
              '<td class="text-center">' + escapeHtmlCore(toFa(version)) + '</td>' +
              '<td><div class="d-flex flex-wrap gap-1">' + links + replace +
                '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-library-action="delete" data-file-id="' + safeId + '">🗑️ حذف</button>' +
              '</div></td></tr>';
          }).join("");
        }
      }

      if (librarySummary) {
        var libraryBytes = (cloudFiles || []).reduce(function(sum, file) { return sum + Math.max(0, Number(file.size || 0)); }, 0);
        var librarySize = libraryBytes >= 1073741824 ? (libraryBytes / 1073741824).toFixed(2) + " GB" :
          (libraryBytes >= 1048576 ? (libraryBytes / 1048576).toFixed(2) + " MB" :
          (libraryBytes ? Math.max(1, Math.round(libraryBytes / 1024)) + " KB" : "۰ بایت"));
        librarySummary.textContent = toFa((cloudFiles || []).length) + " فایل در پوشه این متقاضی · مجموع حجم: " + librarySize +
          (cloudError ? " · خطا در دریافت اطلاعات" : " · آخرین بازخوانی: " + new Date().toLocaleTimeString("fa-IR"));
      }

      var searchInput = document.getElementById("case-doc-search");
      if (searchInput && searchInput.value) {
        var searchQuery = String(searchInput.value).trim().toLocaleLowerCase();
        Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function(row) {
          row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(searchQuery) !== -1 ? "" : "none";
        });
        if (libraryBody) Array.prototype.forEach.call(libraryBody.querySelectorAll(".case-drive-file-row"), function(row) {
          row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(searchQuery) !== -1 ? "" : "none";
        });
      }
      var usage = document.getElementById("case-docs-cloud-usage");
      if (usage) {
        var totalBytes = (cloudFiles || []).reduce(function(sum, file) { return sum + Math.max(0, Number(file.size || 0)); }, 0);
        var totalLabel = totalBytes >= 1073741824 ? (totalBytes / 1073741824).toFixed(2) + " GB" :
          (totalBytes >= 1048576 ? (totalBytes / 1048576).toFixed(2) + " MB" :
          (totalBytes ? Math.max(1, Math.round(totalBytes / 1024)) + " KB" : "۰ بایت"));
        usage.textContent = "تعداد فایل‌های Drive: " + toFa((cloudFiles || []).length) + " | حجم ثبت‌شده: " + totalLabel;
      }

      var legacyBox = document.getElementById("case-docs-legacy-files");
      if (legacyBox) {
        legacyBox.innerHTML = legacyFiles.length
          ? '<div class="small fw-bold mb-1">فایل‌های قدیمی موجود در پوشه Drive (بدون دسته‌بندی):</div>' +
            legacyFiles.map(function(file) {
              var url = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
              return '<div class="d-flex flex-wrap align-items-center gap-2 small mb-1">' +
                (url ? '<a href="' + escapeHtmlCore(url) + '" target="_blank" rel="noopener noreferrer">' : '') +
                '📎 ' + escapeHtmlCore(file.fileName || file.name || "فایل قدیمی") +
                (url ? '</a>' : '') +
                '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-legacy-delete="' + escapeHtmlCore(file.fileId || file.id || "") + '">حذف</button>' +
                '<span class="text-muted">برای تکمیل چک‌لیست، فایل را از مسیر افزودن فایل به مدرک مربوط متصل کنید.</span></div>';
            }).join("")
          : "";
      }

      if (folderLbl && folderUrl && /^https:\/\/drive\.google\.com\//.test(folderUrl)) {
        folderLbl.innerHTML = '<a href="' + escapeHtmlCore(folderUrl) + '" target="_blank" rel="noopener noreferrer">📁 بازکردن پوشه اختصاصی در Google Drive</a>';
      }

      if (missing.length === 0) {
        banner.className = "alert alert-success fw-bold mb-3";
        banner.textContent = "🎉 پرونده «" + String(c.name || "") + "» کامل است و تمامی " + toFa(reqDocs.length) + " عنوان مدرک در Google Drive موجود است.";
      } else {
        var badges = "";
        for (var m = 0; m < missing.length; m++) {
          badges += '<span class="badge bg-danger me-1 mb-1 p-2">❗ ' + escapeHtmlCore(toFa(m + 1)) + '. ' + escapeHtmlCore(missing[m]) + '</span>';
        }
        banner.className = "p-3 rounded-3 border border-2 border-danger bg-danger-subtle mb-3";
        banner.innerHTML =
          '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">' +
            '<b class="text-danger">⚠️ نقص مدارک پرونده «' + escapeHtmlCore(c.name) + '»: (' + escapeHtmlCore(toFa(doneCount)) + ' از ' + escapeHtmlCore(toFa(reqDocs.length)) + ' عنوان مدرک در Drive — ' + escapeHtmlCore(toFa(missing.length)) + ' عنوان ناقص)</b>' +
            '<button type="button" class="btn btn-sm btn-danger fw-bold" onclick="issueDeficiencyLetterForActiveCase()">🖨️ چاپ نامه ابلاغ نواقص روی سربرگ ۶۳۶</button>' +
          '</div><div>' + badges + '</div>';
      }

      if (cloudError) {
        banner.className = "alert alert-warning mb-3";
        banner.innerHTML = '<b>ارتباط با بایگانی ابری برقرار نشد:</b> ' + escapeHtmlCore(cloudError) +
          '<br><small>تا زمان دریافت فهرست Drive، وضعیت تحویل مدارک تأییدشده محسوب نمی‌شود.</small>';
      }
    }

    driveListPromise.then(function(result) {
      renderRows(result.documents || [], "", result.folderUrl || "");
    }).catch(function(error) {
      renderRows([], error && error.message ? error.message : String(error), "");
    });
  });
}
async function syncActiveCaseFolderToDrive() {
  var c = requireActiveCase("ساخت پوشه اختصاصی متقاضی در درایو");
  if (!c) return;
  if (!window.showDirectoryPicker) {
    downloadWindowsBatFolderCreator();
    return;
  }
  try {
    if (!rootDriveHandle) {
      rootDriveHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    }
    var folderName = (c.name + " - " + toEn(c.nid || "000")).replace(/[\\/:*?"<>|]/g, "_").trim();
    var caseDir = await rootDriveHandle.getDirectoryHandle(folderName, { create: true });

    var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
    var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

    getUploadedDocsForCase(c.id, async function(upMap) {
      var savedCount = 0;
      var repLines = ["گزارش وضعیت مدارک پرونده: " + c.name + " (کدملی: " + toFa(c.nid) + ")", "طرح: " + c.project + " | موقعیت: " + c.loc, "----------------------------------------"];
      for (var i = 0; i < reqDocs.length; i++) {
        var d = reqDocs[i];
        var up = upMap[d.code];
        if (up && up.rawBlob) {
          var fHandle = await caseDir.getFileHandle(String(i + 1).padStart(2, "0") + "_" + up.fileName, { create: true });
          var w = await fHandle.createWritable();
          await w.write(up.rawBlob);
          await w.close();
          savedCount++;
          repLines.push("[تکمیل] " + d.title);
        } else {
          repLines.push("[ناقص] " + d.title);
        }
      }
      var txtHandle = await caseDir.getFileHandle("00_وضعیت_مدارک_و_نواقص.txt", { create: true });
      var tw = await txtHandle.createWritable();
      await tw.write(repLines.join("\r\n"));
      await tw.close();
      alert("✅ پوشه «" + folderName + "» در درایو کامپیوتر شما ساخته شد و " + toFa(savedCount) + " فایل مدرک + گزارش نواقص داخل آن ذخیره گردید.");
    });
  } catch (e) {}
}

function downloadWindowsBatFolderCreator() {
  var bat = "@echo off\r\nchcp 65001 > nul\r\nmkdir \"بایگانی_متقاضیان_مرکز_636\"\r\ncd \"بایگانی_متقاضیان_مرکز_636\"\r\n";
  for (var i = 0; i < casesDB.length; i++) {
    var fn = (casesDB[i].name + " - " + toEn(casesDB[i].nid || "000")).replace(/[\\/:*?"<>|]/g, "_");
    bat += "mkdir \"" + fn + "\"\r\n";
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bat], { type: "application/x-bat;charset=utf-8" }));
  a.download = "Make_Folders_636.bat";
  a.click();
  showToastMsg("فایل ساخت پوشه همه متقاضیان دانلود شد.");
}

/* =========================================================================
   ۹. دبیرخانه، امور مالی، کارها، پشتیبان‌گیری و خروجی تک‌فایلی ویندوز
   ========================================================================= */
function normalizeSecretariatSearchText(value) {
  var text = String(value == null ? "" : value);
  try {
    if (typeof DOMParser !== "undefined" && /<\/?[a-z][\s\S]*?>/i.test(text)) {
      text = new DOMParser().parseFromString(text, "text/html").body.textContent || "";
    } else {
      text = text.replace(/<[^>]*>/g, " ");
    }
  } catch (parseError) {
    text = text.replace(/<[^>]*>/g, " ");
  }
  return toEn(text).replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u200c\u200f\u0640]/g, "")
    .replace(/[\s\u00a0]+/g, " ").trim().toLowerCase();
}

function renderSecretariatTable() {
  var tbody = document.getElementById("secretariat-tbody");
  if (!tbody) return;
  var q = normalizeSecretariatSearchText((document.getElementById("sec-search-q") || {}).value || "");
  var dir = (document.getElementById("sec-filter-dir") || {}).value || "ALL";
  var html = "";

  for (var i = 0; i < lettersDB.length; i++) {
    var l = lettersDB[i] || {};
    if (dir !== "ALL" && l.type !== dir) continue;
    var hay = normalizeSecretariatSearchText([
      l.number, l.date, l.type === "OUT" ? "صادره" : "وارده",
      l.recipient, l.appName, l.appNid, l.project, l.cap, l.land,
      l.landParcel, l.loc, l.body, l.officeLetter === true ? "نامه مستقل دفتر" : "نامه پرونده"
    ].join(" "));
    if (q && hay.indexOf(q) === -1) continue;

    var pSize = l.paperSize === "A5" ? "A5" : "A4";
    var letterType = l.type === "OUT" ? "صادره" : "وارده";
    var safeLetterId = escapeHtmlCore(l.id);
    html += "<tr>" +
      "<td><b>" + escapeHtmlCore(toFa(l.number)) + "</b><br><small class='text-muted'>" + escapeHtmlCore(toFa(l.date)) + "</small></td>" +
      "<td><span class='badge " + (l.type === "OUT" ? "bg-success" : "bg-primary") + "'>" + letterType + "</span><br><span class='badge bg-dark mt-1'>کاغذ " + pSize + "</span></td>" +
      "<td><b>" + escapeHtmlCore(l.recipient) + "</b><br>" +
        (l.officeLetter === true
          ? "<small class='text-primary fw-bold'>نامه اداری مستقل دفتر</small>"
          : "<small class='text-success fw-bold'>متقاضی: " + escapeHtmlCore(l.appName || "---") + " (" + escapeHtmlCore(toFa(l.cap || "")) + ")</small>") +
      "</td>" +
      "<td><div class='d-flex gap-1 justify-content-center flex-wrap'>" +
        "<button type='button' class='btn btn-sm btn-warning py-0 px-2 fw-bold' data-letter-action='edit' data-letter-id='" + safeLetterId + "' data-tip='ویرایش متن، شماره یا مشخصات این نامه'>✏️</button>" +
        "<button type='button' class='btn btn-sm btn-success py-0 px-2 fw-bold' data-letter-action='preview' data-letter-id='" + safeLetterId + "' data-tip='پیش‌نمایش و چاپ؛ اندازه کاغذ در صفحه چاپ انتخاب می‌شود'>🖨️ پیش‌نمایش / چاپ</button>" +
        "<button type='button' class='btn btn-sm btn-outline-danger py-0 px-2' data-letter-action='delete' data-letter-id='" + safeLetterId + "'>🗑️</button>" +
      "</div></td></tr>";
  }
  tbody.innerHTML = html || "<tr><td colspan='4' class='text-center py-3 text-muted'>نامه‌ای یافت نشد.</td></tr>";

  // اتصال رویدادها در هر بار رندر؛ کلیک‌های بایگانی پس از جستجو و فیلتر نیز فعال می‌مانند.
  tbody.onclick = function (event) {
    var target = event.target;
    var btn = target && target.closest ? target.closest("button[data-letter-action]") : null;
    if (!btn || !tbody.contains(btn)) return;
    var id = btn.getAttribute("data-letter-id");
    var action = btn.getAttribute("data-letter-action");
    var idx = lettersDB.findIndex(function (letter) { return letter && String(letter.id) === String(id); });
    if (idx < 0) {
      showToastMsg("نامه انتخاب‌شده در دفتر اندیکاتور پیدا نشد؛ جدول را تازه‌سازی کنید.", true);
      return;
    }
    try {
      if (action === "edit") {
        if (typeof window.editLetterFromSecretariat === "function") window.editLetterFromSecretariat(id);
        else if (typeof editLetterFromSecretariat === "function") editLetterFromSecretariat(id);
        else showToastMsg("ماژول ویرایش نامه بارگذاری نشده است.", true);
      } else if (action === "preview") {
        if (typeof window.previewSavedLetter === "function") {
          // نامه با اندازه ذخیره‌شده باز می‌شود؛ A4/A5 فقط در یک محل انتخاب می‌شود.
          window.previewSavedLetter(id);
        } else if (typeof window.printArchivedLetter === "function") {
          window.printArchivedLetter(id);
        } else showToastMsg("موتور چاپ نامه بارگذاری نشده است.", true);
      } else if (action === "delete") {
        if (window.__nezamDriveReady === false) {
          showToastMsg("در حال تکمیل بازیابی اطلاعات؛ پس از آماده‌شدن سامانه حذف را انجام دهید.", true);
          return;
        }
        if (!confirm("آیا از حذف این نامه از دفتر اندیکاتور اطمینان دارید؟")) return;
        var deletedLetterRecord = lettersDB[idx];
        if (!recordNezamDeletions([], [deletedLetterRecord])) {
          showToastMsg("ثبت سابقه حذف در حافظه مرورگر ناموفق بود؛ نامه حذف نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.", true);
          return;
        }
        lettersDB.splice(idx, 1);
        var letterDeleteSaved = saveAllDB();
        if (typeof window.syncDeletionToDrive === "function") window.syncDeletionToDrive();
        showToastMsg(letterDeleteSaved
          ? "نامه حذف و در فهرست حذف دائمی ثبت شد."
          : "حذف در فهرست حذف دائمی ثبت شد، اما ذخیره یکی از بخش‌های مرورگر خطا داد؛ وضعیت ذخیره‌سازی را بررسی کنید.", !letterDeleteSaved);
      }
    } catch (error) {
      window.__nezam636LastSecretariatError = error;
      console.error("Secretariat action failed:", error && error.stack ? error.stack : error);
      var reason = error && error.message ? error.message : String(error || "خطای نامشخص");
      var actionLabel = action === "edit" ? "ویرایش" : (action === "preview" ? "پیش‌نمایش و چاپ" : "حذف");
      showToastMsg("عملیات «" + actionLabel + "» ناموفق بود: " + reason, true);
    }
  };
}
function filterLettersTable(dirVal) {
  var sel = document.getElementById("sec-filter-dir");
  if (sel) sel.value = dirVal;
  renderSecretariatTable();
}

function addOfficeTask() {
  var c = getActiveCase();
  var title = document.getElementById("tsk-title").value.trim();
  if (!title) return;
  tasksDB.unshift({
    id: "T-" + new Date().getTime(),
    caseId: c ? c.id : "",
    title: title + (c ? " (" + c.name + ")" : ""),
    cat: document.getElementById("tsk-cat").value,
    due: document.getElementById("tsk-due").value,
    status: "در حال پیگیری"
  });
  document.getElementById("tsk-title").value = "";
  saveAllDB();
}

function refreshAllViews() {
  populateGlobalCaseSelector();
  renderApplicantsDirectoryTable();

  var outC = 0, inC = 0;
  for (var i = 0; i < lettersDB.length; i++) {
    if (lettersDB[i].type === "IN") inC++; else outC++;
  }

  var openTasksCount = tasksDB.filter(function (task) { return task && task.status !== "انجام شده"; }).length;
  if (document.getElementById("kpi-total-cases")) document.getElementById("kpi-total-cases").textContent = toFa(casesDB.length);
  if (document.getElementById("kpi-out-letters")) document.getElementById("kpi-out-letters").textContent = toFa(outC);
  if (document.getElementById("kpi-in-letters")) document.getElementById("kpi-in-letters").textContent = toFa(inC);
  if (document.getElementById("kpi-open-tasks")) document.getElementById("kpi-open-tasks").textContent = toFa(openTasksCount);

  var dashTbody = document.getElementById("dash-cases-summary-tbody");
  if (dashTbody) {
    var dHtml = "";
    for (var cIdx = 0; cIdx < casesDB.length; cIdx++) {
      var c = casesDB[cIdx];
      var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
      var inq = c.inquiries || {};
      var ok = 0;
      for (var k in inq) if (inq[k] === "OK") ok++;
      var safeCaseId = escapeHtmlCore(c.id);
      dHtml += "<tr class='" + (c.id === activeCaseId ? "table-success" : "") + "'>" +
        "<td class='fw-bold'>" + escapeHtmlCore(toFa(c.code)) + "</td>" +
        "<td><b>" + escapeHtmlCore(c.name) + "</b><br><small class='text-muted'>" + escapeHtmlCore(toFa(c.nid)) + "</small></td>" +
        "<td><span class='badge " + grpMeta.badgeClass + " mb-1'>" + escapeHtmlCore(grpMeta.shortTitle) + "</span><br><small>" + escapeHtmlCore(c.project) + " (" + escapeHtmlCore(toFa(c.cap)) + ")</small></td>" +
        "<td class='text-success fw-bold'>" + escapeHtmlCore(c.loc) + "</td>" +
        "<td><span class='badge bg-success'>" + escapeHtmlCore(toFa(ok)) + " از ۷ موافقت</span></td>" +
        "<td><div class='d-flex gap-1'>" +
          "<button type='button' class='btn btn-sm btn-primary py-0 fw-bold' data-case-action='select' data-case-id='" + safeCaseId + "'>پرونده</button>" +
          "<button type='button' class='btn btn-sm btn-outline-success py-0 fw-bold' data-case-action='croquis' data-case-id='" + safeCaseId + "'>🗺️ کروکی</button>" +
        "</div></td>" +
      "</tr>";
    }
    dashTbody.innerHTML = dHtml || "<tr><td colspan='6' class='text-center text-muted py-3'>پرونده‌ای ثبت نشده است.</td></tr>";
    if (!dashTbody.dataset.secureActionsBound) {
      dashTbody.dataset.secureActionsBound = "1";
      dashTbody.addEventListener("click", function (event) {
        var btn = event.target.closest("button[data-case-action]");
        if (!btn || !dashTbody.contains(btn)) return;
        var id = btn.getAttribute("data-case-id");
        var action = btn.getAttribute("data-case-action");
        var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
        if (!exists) return;
        selectActiveCase(id);
        if (action === "croquis") switchMainPane("pane-croquis");
        else switchMainPane("pane-cases");
      });
    }
  }

  var tHolder = document.getElementById("tasks-list-holder");
  if (tHolder) {
    var tHtml = "";
    for (var t = 0; t < tasksDB.length; t++) {
      var tk = tasksDB[t] || {};
      var done = tk.status === "انجام شده";
      tHtml += '<div class="col-md-6"><div class="p-2 border rounded d-flex justify-content-between align-items-center ' + (done ? 'bg-success-subtle' : 'bg-white') + '">' +
        '<div class="small"><span class="badge bg-secondary me-1">' + escapeHtmlCore(tk.cat) + '</span> <b>' + escapeHtmlCore(tk.title) + '</b> <small class="text-muted">(' + escapeHtmlCore(toFa(tk.due)) + ')</small></div>' +
        '<div class="d-flex gap-1"><button type="button" class="btn btn-sm btn-outline-success py-0" onclick="tasksDB[' + t + '].status=\'انجام شده\';saveAllDB();" aria-label="علامت‌گذاری انجام شد">✔</button><button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="tasksDB.splice(' + t + ',1);saveAllDB();" aria-label="حذف پیگیری">✕</button></div>' +
      '</div></div>';
    }
    tHolder.innerHTML = tHtml;
  }

  renderSecretariatTable();
  renderUnifiedCasesMatrix();
}
function exportFullSystemBackup() {
  var data = {
    version: "636-PRO-V3",
    exportDate: todayShamsi(),
    casesDB: casesDB,
    lettersDB: lettersDB,
    tasksDB: tasksDB,
    actSpecs: ACT_SPECS,
    docChecklists: DOC_CHECKLISTS
  };
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "Backup_Nezam636_Full_" + toEn(todayShamsi()).replace(/\//g, "-") + ".json";
  a.click();
  showToastMsg("نسخه پشتیبان کامل (شامل متقاضیان، نقشه‌های کروکی و نامه‌ها) دانلود شد.");
}

function importFullSystemBackup(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (d.casesDB) casesDB = d.casesDB;
      if (d.lettersDB) lettersDB = d.lettersDB;
      if (d.tasksDB) tasksDB = d.tasksDB;
      if (d.actSpecs) ACT_SPECS = d.actSpecs;
      if (d.docChecklists) DOC_CHECKLISTS = d.docChecklists;
      normalizeAllCasesSchema();
      activeCaseId = casesDB.length ? casesDB[0].id : "";
      saveAllDB();
      loadActiveCaseIntoForm();
      showToastMsg("پشتیبان کامل سامانه با موفقیت بازیابی شد.");
    } catch (err) { alert("فایل پشتیبان نامعتبر است."); }
  };
  r.readAsText(f);
}

/* دانلود نسخه تک‌فایلی مستقل ویندوز (HTML خودکفا که روی هر مرورگری با دابل‌کلیک باز می‌شود و شامل کل اطلاعات فعلی است) */
window.downloadStandaloneWindowsHTML = async function() {
  try {
    showToastMsg("⏳ در حال ساخت نسخه مستقل ویندوز و آماده‌سازی فایل‌های برنامه...");
    var docClone = document.documentElement.cloneNode(true);
    var bodyEl = docClone.querySelector("body");
    if (!bodyEl) throw new Error("ساختار صفحه برای تهیه نسخه مستقل کامل نیست.");

    // قراردادن تصویر لحظه‌ای اطلاعات پیش از اجرای هر ماژول اصلی
    var oldSnap = docClone.querySelector("#embedded-db-snapshot");
    if (oldSnap) oldSnap.remove();

    var snapshotPayload = {
      casesDB: casesDB,
      lettersDB: lettersDB,
      tasksDB: tasksDB,
      actSpecs: ACT_SPECS,
      docChecklists: DOC_CHECKLISTS,
      brandCfg: typeof brandCfg !== "undefined" ? brandCfg : null,
      tplCfg: typeof tplCfg !== "undefined" ? tplCfg : null,
      paperSize: typeof currentPaperSize !== "undefined" ? currentPaperSize : "A4",
      activeCaseId: typeof activeCaseId !== "undefined" ? activeCaseId : "",
      deletionManifest: readNezamDeletionManifest()
    };
    var safeSnapshotJson = JSON.stringify(snapshotPayload)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    var snapScript = document.createElement("script");
    snapScript.id = "embedded-db-snapshot";
    snapScript.textContent =
      "(function(){try{var snap=" + safeSnapshotJson + ";" +
      "if(!localStorage.getItem('nezam636_unified_cases')&&snap.casesDB)localStorage.setItem('nezam636_unified_cases',JSON.stringify(snap.casesDB));" +
      "if(!localStorage.getItem('nezam636_deletion_manifest_v1')&&snap.deletionManifest)localStorage.setItem('nezam636_deletion_manifest_v1',JSON.stringify(snap.deletionManifest));" +
      "if(!localStorage.getItem('nezam636_letters')&&snap.lettersDB)localStorage.setItem('nezam636_letters',JSON.stringify(snap.lettersDB));" +
      "if(!localStorage.getItem('nezam636_tasks')&&snap.tasksDB)localStorage.setItem('nezam636_tasks',JSON.stringify(snap.tasksDB));" +
      "if(!localStorage.getItem('nezam636_act_specs_v3')&&snap.actSpecs)localStorage.setItem('nezam636_act_specs_v3',JSON.stringify(snap.actSpecs));" +
      "if(!localStorage.getItem('nezam636_doc_checklists_v2')&&snap.docChecklists)localStorage.setItem('nezam636_doc_checklists_v2',JSON.stringify(snap.docChecklists));" +
      "if(!localStorage.getItem('nezam636_branding_cfg')&&snap.brandCfg)localStorage.setItem('nezam636_branding_cfg',JSON.stringify(snap.brandCfg));" +
      "if(!localStorage.getItem('nezam636_templates_cfg')&&snap.tplCfg)localStorage.setItem('nezam636_templates_cfg',JSON.stringify(snap.tplCfg));" +
      "if(!localStorage.getItem('nezam636_paper_size')&&snap.paperSize)localStorage.setItem('nezam636_paper_size',snap.paperSize);" +
      "if(!localStorage.getItem('nezam636_active_case_id')&&snap.activeCaseId)localStorage.setItem('nezam636_active_case_id',snap.activeCaseId);" +
      "}catch(e){console.error('Nezam636 snapshot restore failed',e);}})();";
    bodyEl.insertBefore(snapScript, bodyEl.firstChild);

    // ماژول‌ها در همان جای اصلی خود به اسکریپت داخلی تبدیل می‌شوند تا ترتیب وابستگی‌ها حفظ شود.
    var externalScripts = Array.prototype.slice.call(docClone.querySelectorAll("script[src]"));
    var bundledNames = ["nezam-core.js", "nezam-customizer.js", "nezam-ai-assistant.js"];
    var bundledCount = 0;

    for (var i = 0; i < externalScripts.length; i++) {
      var oldScript = externalScripts[i];
      var src = oldScript.getAttribute("src") || "";
      if (!bundledNames.some(function(name) { return src.indexOf(name) !== -1; })) continue;

      var response = await fetch(src, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("دریافت فایل " + src + " ناموفق بود (HTTP " + response.status + ").");
      }
      var scriptText = await response.text();
      if (!scriptText.trim()) throw new Error("فایل برنامه خالی است: " + src);

      var inlineScript = document.createElement("script");
      inlineScript.textContent = scriptText.replace(/<\/script/gi, "<\\/script");
      oldScript.parentNode.replaceChild(inlineScript, oldScript);
      bundledCount++;
    }

    if (bundledCount !== bundledNames.length) {
      throw new Error("همه ماژول‌های اصلی برای ساخت نسخه مستقل پیدا نشدند.");
    }

    var fullHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var objectUrl = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = objectUrl;
    link.download = "Nezam636_Windows_Offline.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(objectUrl); }, 3000);

    showToastMsg("✅ نسخه مستقل ویندوز با ترتیب صحیح ماژول‌ها ساخته و دانلود شد.");
  } catch (error) {
    console.error("Standalone HTML build failed:", error);
    alert("ساخت نسخه مستقل انجام نشد.\n" +
      (error && error.message ? error.message : "اتصال اینترنت یا دسترسی به فایل‌های اصلی را بررسی کنید.") +
      "\n\nبرای حفظ اطلاعات، ابتدا از بخش پشتیبان‌گیری فایل JSON تهیه کنید.");
  }
};
function initAppCore() {
  var tipBox = document.getElementById("smart-mouse-tooltip");
  if (tipBox) {
    document.addEventListener("mouseover", function(e) {
      var t = e.target.closest("[data-tip]");
      if (t) { tipBox.innerHTML = "<b>💡 راهنما:</b>" + t.getAttribute("data-tip"); tipBox.style.display = "block"; }
    });
    document.addEventListener("mousemove", function(e) {
      if (tipBox.style.display === "block") {
        tipBox.style.left = Math.max(10, Math.min(e.clientX + 15, window.innerWidth - 310)) + "px";
        tipBox.style.top = Math.max(10, Math.min(e.clientY + 18, window.innerHeight - 80)) + "px";
      }
    });
    document.addEventListener("mouseout", function(e) {
      if (e.target.closest("[data-tip]")) tipBox.style.display = "none";
    });
  }

  setInterval(function() {
    try {
      var now = new Date();
      var clk = document.getElementById("live-clock");
      var dt = document.getElementById("live-date");
      if (clk) clk.textContent = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
      if (dt) dt.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    } catch (e) {}
  }, 1000);

  refreshAllViews();
  loadActiveCaseIntoForm();
  renderActiveCaseDocsChecklist();
  renderActiveCaseHistory();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppCore);
} else {
  initAppCore();
}


/* =========================================================================
   ۱۰. توابع پشتیبان همگام‌سازی کامل حافظه (Memory + LocalStorage + IndexedDB)
   مخصوص ذخیره و بازخوانی ۱۰۰٪ اطلاعات در گوگل درایو بین مرورگرها و دستگاه‌ها
   ========================================================================= */
window.flushInMemoryStateToLocalStorage = function() {
  try {
    applyNezamDeletionManifestToState();
    window.__gdriveInternalFlush = true;
    localStorage.setItem("nezam636_unified_cases", JSON.stringify(casesDB));
    localStorage.setItem("nezam636_letters", JSON.stringify(lettersDB));
    localStorage.setItem(NEZAM_DELETION_MANIFEST_KEY, JSON.stringify(readNezamDeletionManifest()));
    localStorage.setItem("nezam636_tasks", JSON.stringify(tasksDB));
    localStorage.setItem("nezam636_doc_checklists_v2", JSON.stringify(DOC_CHECKLISTS));
    localStorage.setItem("nezam636_act_specs_v3", JSON.stringify(ACT_SPECS));
    localStorage.setItem("nezam636_active_case_id", activeCaseId || "");
    if (typeof brandCfg !== "undefined" && brandCfg) {
      localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
    }
    if (typeof tplCfg !== "undefined" && tplCfg) {
      localStorage.setItem("nezam636_templates_cfg", JSON.stringify(tplCfg));
    }
    if (typeof currentPaperSize !== "undefined" && currentPaperSize) {
      localStorage.setItem("nezam636_paper_size", currentPaperSize);
    }
    return true;
  } catch (e) {
    console.error("Flush to localStorage failed; cloud snapshot must be stopped:", e);
    return false;
  } finally {
    window.__gdriveInternalFlush = false;
  }
};

window.reloadAllStateFromLocalStorage = function() {
  try {
    window.__gdriveInternalFlush = true;
    if (localStorage.getItem("nezam636_act_specs_v3")) {
      var savedSpecs = JSON.parse(localStorage.getItem("nezam636_act_specs_v3"));
      for (var sk in savedSpecs) ACT_SPECS[sk] = savedSpecs[sk];
    }
    var rawCases = localStorage.getItem("nezam636_unified_cases");
    if (rawCases !== null) {
      var loadedCases = JSON.parse(rawCases);
      if (Array.isArray(loadedCases)) casesDB = loadedCases;
    }
    var rawLetters = localStorage.getItem("nezam636_letters");
    if (rawLetters !== null) {
      var loadedLetters = JSON.parse(rawLetters);
      if (Array.isArray(loadedLetters)) lettersDB = loadedLetters;
    }
    try {
      localStorage.removeItem("nezam636_cases_v6");
      localStorage.removeItem("nezam636_letters_v6");
    } catch (legacyCleanupError) {}
    applyNezamDeletionManifestToState();
    var rawTasks = localStorage.getItem("nezam636_tasks") || localStorage.getItem("nezam636_tasks_v6");
    if (rawTasks) {
      var loadedTasks = JSON.parse(rawTasks);
      if (Array.isArray(loadedTasks)) tasksDB = loadedTasks;
    }
    if (localStorage.getItem("nezam636_doc_checklists_v2")) {
      var loadedDocs = JSON.parse(localStorage.getItem("nezam636_doc_checklists_v2"));
      for (var dk in loadedDocs) DOC_CHECKLISTS[dk] = loadedDocs[dk];
    }
    if (localStorage.getItem("nezam636_active_case_id") !== null) {
      activeCaseId = localStorage.getItem("nezam636_active_case_id");
    }

    normalizeAllCasesSchema();
    var foundActive = false;
    for (var i = 0; i < casesDB.length; i++) {
      if (casesDB[i].id === activeCaseId) { foundActive = true; break; }
    }
    if (!foundActive && casesDB.length > 0) {
      activeCaseId = casesDB[0].id;
    }

    // بازخوانی تنظیمات سربرگ و قالب‌های نامه
    if (typeof brandCfg !== "undefined" && localStorage.getItem("nezam636_branding_cfg")) {
      var pb = JSON.parse(localStorage.getItem("nezam636_branding_cfg"));
      for (var bk in pb) brandCfg[bk] = pb[bk];
    }
    if (typeof tplCfg !== "undefined" && localStorage.getItem("nezam636_templates_cfg")) {
      var pt = JSON.parse(localStorage.getItem("nezam636_templates_cfg"));
      for (var tk in pt) tplCfg[tk] = pt[tk];
    }
    if (typeof initBrandingAndTemplatesUI === "function") {
      initBrandingAndTemplatesUI();
    }

    refreshAllViews();
    loadActiveCaseIntoForm();
    renderActiveCaseDocsChecklist();
    renderActiveCaseHistory();
    if (typeof window.initCroquisWorkspaceForActiveCase === "function") {
      window.initCroquisWorkspaceForActiveCase();
    }
    if (typeof window.syncLetterEditorWithActiveCase === "function") {
      window.syncLetterEditorWithActiveCase();
    }
    if (typeof window.renderSinglePreviewSheet === "function") {
      window.renderSinglePreviewSheet();
    }
  } catch (e) {
    console.error("Error reloading state from localStorage:", e);
  } finally {
    window.__gdriveInternalFlush = false;
  }
};

window.exportIndexedDBDocs = function() {
  return new Promise(function(resolve, reject) {
    openFilesDB(function(db) {
      if (!db) return reject(new Error("پایگاه فایل‌های محلی IndexedDB قابل بازشدن نیست؛ ذخیره ابری برای جلوگیری از حذف پیوست‌ها متوقف شد."));
      var tx;
      try {
        tx = db.transaction(["docs"], "readonly");
        var req = tx.objectStore("docs").getAll();
        req.onsuccess = async function(e) {
          try {
            var list = Array.isArray(e.target.result) ? e.target.result : [];
            var cleanList = [];
            var omittedLargeCount = 0;
            for (var i = 0; i < list.length; i++) {
              var item = list[i] || {};
              var dUrl = item.dataUrl || "";
              if (dUrl.length < 2200000) {
                cleanList.push({
                  key: item.key, caseId: item.caseId, docCode: item.docCode,
                  docTitle: item.docTitle, fileName: item.fileName,
                  uploadDate: item.uploadDate, dataUrl: dUrl
                });
              } else {
                omittedLargeCount++;
              }
            }

            // مخزن دانش مستقل است؛ فقط متن و شاخص جستجو همگام می‌شود، نه فایل باینری اصلی.
            var knowledgeDocs = await exportNezaamKnowledgeIndex();
            window.__nezam636IndexedDBExportStatus = {
              totalCount: list.length,
              includedCount: cleanList.length,
              omittedLargeCount: omittedLargeCount,
              knowledgeTotalCount: knowledgeDocs.length,
              knowledgeExportedAt: Date.now(),
              exportedAt: Date.now()
            };
            resolve(cleanList.concat(knowledgeDocs));
          } catch (knowledgeError) {
            reject(knowledgeError);
          }
        };
        req.onerror = function() {
          reject(req.error || new Error("خواندن اسناد IndexedDB ناموفق بود."));
        };
        tx.onerror = function() {
          reject(tx.error || new Error("تراکنش خواندن اسناد IndexedDB ناموفق بود."));
        };
        tx.onabort = function() {
          reject(tx.error || new Error("تراکنش خواندن اسناد IndexedDB لغو شد."));
        };
      } catch (err) {
        reject(err);
      }
    });
  });
};

function exportNezaamKnowledgeIndex() {
  return new Promise(function(resolve, reject) {
    if (!window.indexedDB) return reject(new Error("مرورگر از IndexedDB پشتیبانی نمی‌کند؛ مخزن دانش در پشتیبان قرار نگرفت."));
    var request;
    try { request = indexedDB.open("Nezam636AgentKnowledge"); }
    catch (err) { return reject(err); }
    request.onupgradeneeded = function() {
      var db = request.result;
      if (!db.objectStoreNames.contains("documents")) db.createObjectStore("documents", { keyPath: "id" });
    };
    request.onerror = function() {
      reject(request.error || new Error("بازکردن مخزن دانش برای پشتیبان‌گیری ناموفق بود."));
    };
    request.onsuccess = function() {
      var db = request.result;
      if (!db.objectStoreNames.contains("documents")) {
        db.close();
        return resolve([]);
      }
      var tx;
      try {
        tx = db.transaction(["documents"], "readonly");
        var getAll = tx.objectStore("documents").getAll();
        getAll.onsuccess = function() {
          var docs = Array.isArray(getAll.result) ? getAll.result : [];
          var output = [];
          var totalChars = 0;
          var MAX_DOC_CHARS = 650000;
          var MAX_TOTAL_CHARS = 8000000;
          for (var i = 0; i < docs.length; i++) {
            var d = docs[i] || {};
            if (d.status !== "indexed" || !String(d.text || "").trim()) continue;
            var body = String(d.text || "");
            if (body.length > MAX_DOC_CHARS || totalChars + body.length > MAX_TOTAL_CHARS) {
              db.close();
              return reject(new Error("حجم متن شاخص‌شده مخزن دانش از سقف امن پشتیبان (۸ میلیون نویسه) بیشتر است. ابتدا اسناد را دسته‌بندی یا پشتیبان را به چند بخش تقسیم کنید؛ نسخه ابری ناقص ارسال نشد."));
            }
            totalChars += body.length;
            output.push({
              _type: "NEZAM636_KNOWLEDGE_DOC_V1",
              id: String(d.id || ""),
              name: String(d.name || "سند بدون عنوان").slice(0, 180),
              ext: String(d.ext || ""),
              mime: String(d.mime || ""),
              size: Number(d.size || 0),
              category: String(d.category || "عمومی").slice(0, 80),
              issuer: String(d.issuer || "").slice(0, 120),
              effectiveDate: String(d.effectiveDate || "").slice(0, 32),
              description: String(d.description || "").slice(0, 300),
              createdAt: Number(d.createdAt || 0),
              status: "indexed",
              text: body,
              chunks: Array.isArray(d.chunks) ? d.chunks.map(function(x){return String(x || "");}) : [],
              keywords: Array.isArray(d.keywords) ? d.keywords.map(function(x){return String(x || "");}).slice(0, 100) : [],
              charCount: Number(d.charCount || body.length),
              indexedAt: Number(d.indexedAt || 0),
              extractionModel: String(d.extractionModel || ""),
              extractionNote: String(d.extractionNote || ""),
              driveStatus: String(d.driveStatus || ""),
              driveSavedAt: Number(d.driveSavedAt || 0),
              driveFileName: String(d.driveFileName || ""),
              driveUrl: String(d.driveUrl || ""),
              driveTextStatus: String(d.driveTextStatus || ""),
              driveTextSavedAt: Number(d.driveTextSavedAt || 0),
              driveTextUrl: String(d.driveTextUrl || ""),
              cloudIndexStatus: String(d.cloudIndexStatus || ""),
              driveError: String(d.driveError || ""),
              cloudIndexError: String(d.cloudIndexError || "")
            });
          }
          db.close();
          resolve(output);
        };
        getAll.onerror = function() {
          db.close();
          reject(getAll.error || new Error("خواندن شاخص مخزن دانش ناموفق بود."));
        };
        tx.onerror = function() {
          db.close();
          reject(tx.error || new Error("تراکنش خواندن مخزن دانش ناموفق بود."));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

window.importIndexedDBDocs = function(docsList) {
  return new Promise(function(resolve) {
    if (!Array.isArray(docsList)) return resolve(false);
    var applicantDocs = docsList.filter(function(d) { return d && d._type !== "NEZAM636_KNOWLEDGE_DOC_V1"; });
    var knowledgeDocs = docsList.filter(function(d) { return d && d._type === "NEZAM636_KNOWLEDGE_DOC_V1" && d.id && d.text; });

    function importKnowledge(next) {
      if (!knowledgeDocs.length) return next(true);
      if (!window.indexedDB) return next(false);
      var request;
      try { request = indexedDB.open("Nezam636AgentKnowledge"); }
      catch (err) { return next(false); }
      request.onupgradeneeded = function() {
        var db = request.result;
        if (!db.objectStoreNames.contains("documents")) db.createObjectStore("documents", { keyPath: "id" });
      };
      request.onerror = function() { next(false); };
      request.onsuccess = function() {
        var db = request.result;
        if (!db.objectStoreNames.contains("documents")) { db.close(); return next(false); }
        try {
          var tx = db.transaction(["documents"], "readwrite");
          var store = tx.objectStore("documents");
          knowledgeDocs.forEach(function(d) {
            store.put({
              id: String(d.id),
              name: String(d.name || "سند بدون عنوان"),
              ext: String(d.ext || ""),
              mime: String(d.mime || ""),
              size: Number(d.size || 0),
              blob: null,
              category: String(d.category || "عمومی"),
              issuer: String(d.issuer || ""),
              effectiveDate: String(d.effectiveDate || ""),
              description: String(d.description || ""),
              createdAt: Number(d.createdAt || 0),
              status: "indexed",
              text: String(d.text || ""),
              chunks: Array.isArray(d.chunks) ? d.chunks : [],
              keywords: Array.isArray(d.keywords) ? d.keywords : [],
              charCount: Number(d.charCount || String(d.text || "").length),
              indexedAt: Number(d.indexedAt || 0),
              extractionModel: String(d.extractionModel || ""),
              extractionNote: String(d.extractionNote || ""),
              driveStatus: String(d.driveStatus || ""),
              driveSavedAt: Number(d.driveSavedAt || 0),
              driveFileName: String(d.driveFileName || ""),
              driveUrl: String(d.driveUrl || ""),
              driveTextStatus: String(d.driveTextStatus || ""),
              driveTextSavedAt: Number(d.driveTextSavedAt || 0),
              driveTextUrl: String(d.driveTextUrl || ""),
              cloudIndexStatus: String(d.cloudIndexStatus || ""),
              driveError: String(d.driveError || ""),
              cloudIndexError: String(d.cloudIndexError || "")
            });
          });
          tx.oncomplete = function() { db.close(); next(true); };
          tx.onerror = function() { db.close(); next(false); };
          tx.onabort = function() { db.close(); next(false); };
        } catch (err) { db.close(); next(false); }
      };
    }

    function importApplicantDocs() {
      if (!applicantDocs.length) return importKnowledge(resolve);
      openFilesDB(function(db) {
        if (!db) return resolve(false);
        try {
          var tx = db.transaction(["docs"], "readwrite");
          var store = tx.objectStore("docs");
          for (var i = 0; i < applicantDocs.length; i++) {
            var d = applicantDocs[i];
            if (d && d.key) store.put({
              key: d.key, caseId: d.caseId, docCode: d.docCode,
              docTitle: d.docTitle, fileName: d.fileName,
              uploadDate: d.uploadDate, dataUrl: d.dataUrl
            });
          }
          tx.oncomplete = function() {
            renderActiveCaseDocsChecklist();
            importKnowledge(resolve);
          };
          tx.onerror = function() { resolve(false); };
          tx.onabort = function() { resolve(false); };
        } catch (err) { resolve(false); }
      });
    }
    importApplicantDocs();
  });
};


var DEFAULT_ACT_SPECS = {
  // گروه اول: گلخانه و قارچ
  greenhouse_veg: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث واحد گلخانه سبزی و صیفی (کشت خاکی/هیدروپونیک)",
    unit: "مترمربع", water: 8, land: 1.25, minL: 1000, roof: 1.0, open: 0.25, docGroup: "GREENHOUSE"
  },
  greenhouse_flower: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث واحد گلخانه گل و گیاهان زینتی و آپارتمانی",
    unit: "مترمربع", water: 7, land: 1.2, minL: 1000, roof: 1.0, open: 0.2, docGroup: "GREENHOUSE"
  },
  greenhouse_medicinal: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "احداث گلخانه گیاهان دارویی و تولید نشاء و نهال",
    unit: "مترمربع", water: 6, land: 1.2, minL: 500, roof: 0.9, open: 0.3, docGroup: "GREENHOUSE"
  },
  mushroom_button: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "تأسیس واحد پرورش قارچ خوراکی دکمه‌ای صنعتی",
    unit: "تن در سال", water: 95, land: 65, minL: 1500, roof: 25, open: 40, docGroup: "MUSHROOM"
  },
  mushroom_oyster: {
    mainGroup: "GREENHOUSE_MUSHROOM",
    title: "تأسیس واحد پرورش قارچ صدفی و شاه‌صدفی",
    unit: "تن در سال", water: 70, land: 45, minL: 800, roof: 20, open: 25, docGroup: "MUSHROOM"
  },

  // گروه دوم: دام، طیور و شیلات
  sheep_high: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    unit: "راس", water: 10, land: 6, minL: 1200, roof: 2.3, open: 2.65, docGroup: "LIVESTOCK"
  },
  lamb: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (پرواربندی بره)",
    unit: "راس", water: 10, land: 6.5, minL: 1300, roof: 1.4, open: 1.6, docGroup: "LIVESTOCK"
  },
  goat: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد دامداری (پرورش بز مولد شیری)",
    unit: "راس", water: 9.5, land: 8.6, minL: 800, roof: 1.55, open: 2.3, docGroup: "LIVESTOCK"
  },
  cow: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرورش گاو شیری صنعتی",
    unit: "راس", water: 140, land: 100, minL: 5000, roof: 19, open: 24, docGroup: "LIVESTOCK"
  },
  calf: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرواربندی گوساله",
    unit: "راس", water: 70, land: 24, minL: 1200, roof: 4.5, open: 6.3, docGroup: "LIVESTOCK"
  },
  camel: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس یک واحد پرورش شتر داشتی و پرواری",
    unit: "راس", water: 40, land: 31.6, minL: 1000, roof: 9.9, open: 17.8, docGroup: "LIVESTOCK"
  },
  poultry_broiler: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس واحد پرورش مرغ گوشتی اتوماتیک",
    unit: "قطعه", water: 0.35, land: 0.25, minL: 5000, roof: 0.08, open: 0.17, docGroup: "POULTRY"
  },
  poultry_turkey: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس واحد پرورش بوقلمون، شترمرغ و طیور خاص",
    unit: "قطعه", water: 1.2, land: 1.5, minL: 3000, roof: 0.4, open: 1.1, docGroup: "POULTRY"
  },
  fish_trout: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس مزرعه پرورش ماهیان سردابی (قزل‌آلا)",
    unit: "تن در سال", water: 2400, land: 110, minL: 2000, roof: 15, open: 95, docGroup: "FISHERIES"
  },
  fish_warm: {
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    title: "تأسیس مزرعه پرورش ماهیان گرمابی و استخر دو منظوره",
    unit: "تن در سال", water: 1800, land: 250, minL: 2500, roof: 12, open: 238, docGroup: "FISHERIES"
  },

  // گروه سوم: کلینیک گیاهپزشکی و داروخانه گیاهپزشکی
  pharmacy: {
    mainGroup: "CLINIC_PHARMACY",
    title: "تأسیس / تمدید داروخانه گیاهپزشکی و عرضه سموم و نهاده",
    unit: "واحد", water: 200, land: 45, minL: 40, roof: 45, open: 0, docGroup: "PHARMACY"
  },
  clinic_plant: {
    mainGroup: "CLINIC_PHARMACY",
    title: "تأسیس / تمدید کلینیک گیاهپزشکی تشخیص آفات و آزمایشگاه",
    unit: "واحد", water: 400, land: 110, minL: 80, roof: 110, open: 0, docGroup: "CLINIC"
  },
  pest_control_co: {
    mainGroup: "CLINIC_PHARMACY",
    title: "مجوز شرکت خدمات فنی دفع آفات نباتی و ضدعفونی",
    unit: "واحد", water: 250, land: 60, minL: 50, roof: 60, open: 0, docGroup: "CLINIC"
  }
};

var ACT_SPECS = JSON.parse(JSON.stringify(DEFAULT_ACT_SPECS));

/* =========================================================================
   بخش دوم: چک‌لیست‌های تخصصی مدارک برای ۳ گروه متقاضیان
   ========================================================================= */
var DEFAULT_DOC_CHECKLISTS = {
  GREENHOUSE: [
    { code: "ID_CARD", title: "تصویر کارت ملی، شناسنامه و کارت پایان خدمت/معافیت متقاضی (یا آگهی تأسیس و روزنامه رسمی برای اشخاص حقوقی)", mandatory: true, legalRef: "بند الف ماده ۴ دستورالعمل صدور مجوزهای گلخانه" },
    { code: "LAND_DEED", title: "سند مالکیت رسمی، بنچاق معتبر، نسق زراعی یا اجاره‌نامه رسمی محضری (حداقل ۵ ساله)", mandatory: true, legalRef: "ماده ۵ ضوابط مالکیت اراضی در سامانه سماک" },
    { code: "UTM_MAP", title: "نقشه کروکی چندلایه زمین و جدول مختصات UTM (زون 39R) ممهور به مهر کارشناس نظام مهندسی", mandatory: true, legalRef: "تبصره ۱ ماده ۶ نظام فنی و اجرایی گلخانه‌ها" },
    { code: "WATER_PERMIT", title: "پروانه بهره‌برداری چاه مجاز، گواهی حقابه از امور آب منطقه‌ای یا قرارداد تأمین آب معتبر", mandatory: true, legalRef: "ماده ۷ قانون توزیع عادلانه آب و ضوابط گلخانه" },
    { code: "WATER_SOIL", title: "نتیجه آزمایش فیزیکی و شیمیایی آب و خاک (EC و pH مجاز) از آزمایشگاه معتمد", mandatory: true, legalRef: "پیوست فنی نشریه نظام مهندسی کشاورزی" },
    { code: "FEASIBILITY", title: "طرح توجیه فنی و اقتصادی و پلان سازه گالوانیزه استاندارد (فاقد لوله سیاه و جوشکاری)", mandatory: true, legalRef: "ماده ۹ استاندارد ملی سازه‌های گلخانه‌ای" },
    { code: "TECH_DIR", title: "معرفی‌نامه و قرارداد مسئول فنی واجد صلاحیت دارای پروانه اشتغال در سامانه سانکا", mandatory: true, legalRef: "ماده ۳۳ قانون افزایش بهره‌وری بخش کشاورزی" }
  ],
  MUSHROOM: [
    { code: "ID_CARD", title: "مدارک هویتی کامل متقاضی حقیقی یا مدارک ثبتی شرکت حقوقی", mandatory: true, legalRef: "بند ۱ دستورالعمل واحدهای قارچ خوراکی" },
    { code: "LAND_UTM", title: "سند مالکیت یا اجاره‌نامه رسمی عرصه به همراه کروکی دقیق UTM و جانمایی سالن‌ها", mandatory: true, legalRef: "بند ۲ ضوابط صدور موافقت اصولی قارچ" },
    { code: "INQ_ENV_WATER", title: "موافقت استعلام آب منطقه‌ای، برق، گاز و حفاظت محیط زیست (مدیریت پساب و کمپوست)", mandatory: true, legalRef: "ماده ۱۱ ضوابط استقرار واحدهای تولیدی کشاورزی" },
    { code: "SKILL_CERT", title: "گواهی مهارت فنی پرورش قارچ خوراکی یا معرفی مسئول فنی دارای پروانه اشتغال", mandatory: true, legalRef: "بند ۵ آیین‌نامه اجرایی نظام مهندسی کشاورزی" }
  ],
  LIVESTOCK: [
    { code: "ID_CARD", title: "تصویر کارت ملی و تمام صفحات شناسنامه متقاضی (یا مدارک ثبتی شرکت حقوقی)", mandatory: true, legalRef: "ماده ۳ آیین‌نامه اجرایی قانون نظام جامع دامپروری" },
    { code: "MILITARY", title: "کارت پایان خدمت یا معافیت دائم (ویژه آقایان در اشخاص حقیقی)", mandatory: true, legalRef: "ماده ۱۰ قانون خدمت وظیفه عمومی" },
    { code: "LAND_DEED", title: "سند مالکیت زمین / اجاره‌نامه رسمی محضری یا گواهی واگذاری مدیریت امور اراضی", mandatory: true, legalRef: "فصل دوم دستورالعمل صدور پروانه دامپروری" },
    { code: "UTM_MAP", title: "نقشه کروکی چندلایه (عرصه کل + محل جایگاه مسقف و بهاربند) با جدول UTM", mandatory: true, legalRef: "بند ۴ ضوابط فنی نقشه‌برداری مراکز خدمات" },
    { code: "INQ_WATER", title: "پاسخ موافقت استعلام مدیریت منابع آب شهرستان خفر (تأمین آب شرب دام)", mandatory: true, legalRef: "ماده ۶ دستورالعمل استعلام‌های موافقت اصولی" },
    { code: "INQ_ELEC", title: "پاسخ موافقت استعلام مدیریت توزیع برق شهرستان خفر (رعایت حریم شبکه برق)", mandatory: true, legalRef: "آیین‌نامه حرایم خطوط نیروی برق" },
    { code: "INQ_NATRES", title: "پاسخ استعلام اداره منابع طبیعی و آبخیزداری (تعیین وضعیت ملی یا مستثنیات بودن زمین)", mandatory: true, legalRef: "ماده ۵۶ قانون حفاظت و بهره‌برداری از جنگل‌ها و مراتع" },
    { code: "INQ_ENV_ROAD", title: "پاسخ استعلام حفاظت محیط زیست، حریم راهداری و منطقه ۵ انتقال گاز", mandatory: true, legalRef: "ضوابط زیست‌محیطی و ایمنی حرایم جاده و خطوط گاز" },
    { code: "VET_PERMIT", title: "پروانه بهداشتی موافقت اصولی / تأسیس از شبکه دامپزشکی و رعایت فواصل بهداشتی", mandatory: true, legalRef: "مواد ۵ و ۷ قانون سازمان دامپزشکی کشور" }
  ],
  POULTRY: [
    { code: "ID_CARD", title: "مدارک هویتی متقاضی یا اساسنامه و روزنامه رسمی شرکت تعاونی/خصوصی", mandatory: true, legalRef: "ماده ۳ قانون نظام جامع دامپروری" },
    { code: "LAND_UTM", title: "سند زمین و نقشه کروکی UTM با نمایش سالن‌ها، دان‌خوری، قرنطینه و فواصل بهداشتی", mandatory: true, legalRef: "جدول فواصل بهداشتی مرغداری‌ها مصوب دامپزشکی" },
    { code: "VET_BIO", title: "تأییدیه بهداشتی و قرنطینه‌ای شبکه دامپزشکی و موافقت کمیسیون صدور پروانه استان", mandatory: true, legalRef: "آیین‌نامه نظارت بهداشتی دامپزشکی" },
    { code: "INQ_ALL", title: "پاسخ موافقت استعلام‌های آب، برق، گاز، راهداری، محیط زیست و منابع طبیعی", mandatory: true, legalRef: "ماده ۸ دستورالعمل صدور پروانه تأسیس طیور" }
  ],
  FISHERIES: [
    { code: "ID_CARD", title: "مدارک هویتی متقاضی یا ثبت شرکت شیلاتی", mandatory: true, legalRef: "ماده ۲ دستورالعمل صدور مجوزهای آبزی‌پروری" },
    { code: "WATER_ALLOC", title: "مجوز تخصیص آب یا پروانه بهره‌برداری چاه/چشمه با دبی کافی از امور آب منطقه‌ای", mandatory: true, legalRef: "بند ب ماده ۴ قانون حفاظت و بهره‌برداری از منابع آبزی" },
    { code: "UTM_PONDS", title: "نقشه کروکی UTM جانمایی استخرهای پرورش، حوضچه رسوب‌گیر و کانال ورودی/خروجی", mandatory: true, legalRef: "ضوابط فنی مهندسی مزارع پرورش ماهی" },
    { code: "ENV_VET", title: "موافقت‌نامه محیط زیست (کنترل کیفیت پساب خروجی) و تأییدیه بهداشتی دامپزشکی", mandatory: true, legalRef: "ضوابط زیست‌محیطی مزارع آبزی‌پروری" }
  ],
  PHARMACY: [
    { code: "ID_EDU", title: "تصویر کارت ملی، شناسنامه، مدرک تحصیلی کارشناسی/ارشد گیاهپزشکی و عضویت معتبر سانکا", mandatory: true, legalRef: "ماده ۳ آیین‌نامه اجرایی تأسیس داروخانه‌های گیاهپزشکی" },
    { code: "SHOP_RENT", title: "سند مالکیت تجاری یا اجاره‌نامه رسمی محل داروخانه و انبار مجزا (حداقل ۳ ساله)", mandatory: true, legalRef: "ماده ۵ ضوابط مکان و انبار داروخانه گیاهپزشکی" },
    { code: "NOTARY_PLEDGE", title: "تعهدنامه محضری مؤسس و مسئول فنی مبنی بر عدم فروش سموم قاچاق، تاریخ‌گذشته و بدون نسخه", mandatory: true, legalRef: "ماده ۹ دستورالعمل نظارت بر توزیع سموم نباتی" },
    { code: "TECH_CONTRACT", title: "پروانه اشتغال و قرارداد حضور تمام‌وقت مسئول فنی داروخانه گیاهپزشکی در سامانه سانکا", mandatory: true, legalRef: "تبصره ۲ ماده ۷ دستورالعمل سازمان حفظ نباتات" },
    { code: "VISIT_UTM", title: "فرم گزارش بازدید کارشناسی ۱۸ بندی مرکز ۶۳۶ و کروکی موقعیت UTM داروخانه", mandatory: true, legalRef: "فرم استاندارد کمیته فنی گیاهپزشکی استان فارس" }
  ],
  CLINIC: [
    { code: "ID_EDU", title: "مدارک هویتی، دانشنامه تحصیلی رشته‌های گیاهپزشکی و گواهی سابقه کار کارشناسی", mandatory: true, legalRef: "ماده ۴ دستورالعمل تأسیس کلینیک‌های گیاهپزشکی" },
    { code: "EQUIP_LIST", title: "سند/اجاره‌نامه محل کلینیک + فهرست تجهیزات آزمایشگاهی (استریومیکروسکوپ، انکوباتور، اتوکلاو)", mandatory: true, legalRef: "پیوست ۲ جدول تجهیزات الزامی کلینیک گیاهپزشکی" },
    { code: "SANKA_LICENSE", title: "گواهی ثبت درخواست در درگاه ملی مجوزها، سامانه سانکا و تأییدیه حفظ نباتات", mandatory: true, legalRef: "آیین‌نامه رتبه‌بندی و صدور پروانه کلینیک‌های گیاهپزشکی" },
    { code: "UTM_CLINIC", title: "کروکی UTM محل استقرار کلینیک و رعایت ضوابط دسترسی بهره‌برداران", mandatory: true, legalRef: "ضوابط مکانی مراکز خدمات و کلینیک‌ها" }
  ]
};

var DOC_CHECKLISTS = JSON.parse(JSON.stringify(DEFAULT_DOC_CHECKLISTS));

/* =========================================================================
   ۳. بانک اطلاعات پیش‌فرض متقاضیان در هر ۳ گروه تخصصی + کروکی چندلایه
   ========================================================================= */
var DEFAULT_UNIFIED_CASES = [
  // نمونه شاخص گروه اول: گلخانه و قارچ (زمین ۱۰ هکتاری با طرح گلخانه ۱ هکتاری در داخل آن)
  {
    id: "CASE-201",
    code: "گ-۲۰۱/۶۳۶",
    entityType: "LEGAL", // INDIVIDUAL | LEGAL | ORG
    mainGroup: "GREENHOUSE_MUSHROOM",
    actType: "greenhouse_veg",
    name: "شرکت کشت و صنعت نگین سبز خفر (مسئولیت محدود)",
    nid: "۱۰۳۸۰۴۵۱۲۳۴",
    regNo: "۴۸۷۲",
    repName: "مهندس محمدرضا شجاعی",
    mobile: "۰۹۱۷۱۱۸۹۸۷۶",
    count: 10000,
    project: "احداث واحد گلخانه سبزی و صیفی (کشت خاکی/هیدروپونیک)",
    cap: "۱۰,۰۰۰ مترمربع (۱ هکتار)",
    land: "۱۰۰۰۰۰",
    water: "۸۰۰۰۰",
    subarea: "سازه گلخانه: ۱۰,۰۰۰ م.م | تأسیسات و استخر: ۹۰۰ م.م",
    loc: "فارس/ خفر/ مرکزی / گلبرنجی",
    utmZone: "39R",
    utm: "702150,3208450\n702550,3208450\n702550,3208200\n702150,3208200",
    issueDate: "۱۴۰۵/۰۱/۲۰",
    expDate: "۱۴۰۶/۰۱/۲۰",
    caseStatus: "ACTIVE", // ACTIVE | IN_PROGRESS | APPROVED | ARCHIVED
    customFields: [
      { label: "پلاک ثبتی", value: "۱۸۴ فرعی از ۱۲ اصلی" },
      { label: "منبع آب", value: "چاه پروانه‌دار شماره ۱ (۱۵ لیتر/ثانیه)" }
    ],
    inquiries: { water: "OK", elec: "OK", road: "OK", gas: "WAIT", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۵/۰۱/۲۰ - ۰۹:۱۵", action: "ثبت پرونده شخصیت حقوقی در گروه اول (گلخانه و قارچ)", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۱/۲۲ - ۱۱:۳۰", action: "ترسیم کروکی چندلایه زمین ۱۰ هکتاری و جانمایی طرح گلخانه ۱ هکتاری", by: "واحد نقشه‌برداری ۶۳۶" }
    ],
    croquisMaps: [
      {
        id: "MAP-201-1",
        title: "کروکی جانمایی طرح گلخانه ۱ هکتاری در داخل زمین اصلی ۱۰ هکتاری",
        date: "۱۴۰۵/۰۱/۲۲",
        utmZone: "39R",
        hemisphere: "N",
        notes: "زمین اصلی به مساحت ۱۰ هکتار (۴۰۰×۲۵۰ متر) بوده و محل اجرای طرح گلخانه به مساحت ۱ هکتار (۱۰۰×۱۰۰ متر) به همراه تأسیسات، چاه آب و جاده دسترسی در داخل محدوده اصلی جانمایی شده است.",
        layers: [
          {
            id: "LYR-MAIN",
            name: "۱. محدوده اصلی زمین (پلاک ۱۰ هکتاری)",
            category: "MAIN_PARCEL",
            geomType: "POLYGON",
            color: "#15803d",
            fillColor: "#22c55e",
            fillOpacity: 0.14,
            strokeWidth: 3,
            visible: true,
            order: 1,
            desc: "مرز کل زمین کشاورزی طبق سند مالکیت (۴۰۰ در ۲۵۰ متر = ۱۰۰,۰۰۰ مترمربع / ۱۰ هکتار)",
            points: [
              { x: 702150, y: 3208450, label: "A1" },
              { x: 702550, y: 3208450, label: "A2" },
              { x: 702550, y: 3208200, label: "A3" },
              { x: 702150, y: 3208200, label: "A4" }
            ]
          },
          {
            id: "LYR-PROJ",
            name: "۲. محل اجرای طرح گلخانه (۱ هکتار)",
            category: "PROJECT_AREA",
            geomType: "POLYGON",
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.30,
            strokeWidth: 2.5,
            visible: true,
            order: 2,
            desc: "محدوده احداث سازه گلخانه در داخل زمین اصلی (۱۰۰ در ۱۰۰ متر = ۱۰,۰۰۰ مترمربع / ۱ هکتار)",
            points: [
              { x: 702280, y: 3208380, label: "G1" },
              { x: 702380, y: 3208380, label: "G2" },
              { x: 702380, y: 3208280, label: "G3" },
              { x: 702280, y: 3208280, label: "G4" }
            ]
          },
          {
            id: "LYR-FAC",
            name: "۳. ساختمان تأسیسات، اتاق کنترل و استخر ذخیره",
            category: "FACILITY",
            geomType: "POLYGON",
            color: "#b45309",
            fillColor: "#f59e0b",
            fillOpacity: 0.38,
            strokeWidth: 2,
            visible: true,
            order: 3,
            desc: "اتاق بویلر، پمپاژ، انبار نهاده و استخر ژئوممبران (۳۰ در ۳۰ متر = ۹۰۰ مترمربع)",
            points: [
              { x: 702230, y: 3208410, label: "F1" },
              { x: 702260, y: 3208410, label: "F2" },
              { x: 702260, y: 3208380, label: "F3" },
              { x: 702230, y: 3208380, label: "F4" }
            ]
          },
          {
            id: "LYR-ROAD",
            name: "۴. راه دسترسی اختصاصی",
            category: "ROAD",
            geomType: "LINE",
            color: "#475569",
            fillColor: "#64748b",
            fillOpacity: 0,
            strokeWidth: 4,
            visible: true,
            order: 4,
            desc: "مسیر دسترسی ماشین‌آلات از ورودی شمالی زمین تا گلخانه",
            points: [
              { x: 702150, y: 3208430, label: "ورودی جاده" },
              { x: 702230, y: 3208430, label: "تقاطع تأسیسات" },
              { x: 702280, y: 3208330, label: "ورودی گلخانه" }
            ]
          },
          {
            id: "LYR-WELL",
            name: "۵. چاه آب پروانه‌دار",
            category: "WATER_SOURCE",
            geomType: "POINT",
            color: "#0284c7",
            fillColor: "#38bdf8",
            fillOpacity: 1,
            strokeWidth: 5,
            visible: true,
            order: 5,
            desc: "محل حلقه چاه مجاز کشاورزی",
            points: [
              { x: 702210, y: 3208425, label: "چاه آب شماره ۱" }
            ]
          }
        ]
      }
    ]
  },

  // گروه دوم: دام، طیور و شیلات (آقای علی فروزند)
  {
    id: "CASE-101",
    code: "الف-۱۰۱/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    actType: "sheep_high",
    name: "آقای علی فروزند",
    nid: "۲۲۹۷۴۳۶۷۶۹",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۲",
    count: 200,
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    cap: "۲۰۰ راس",
    land: "۲۱۴۵",
    water: "۲۰۰۰",
    subarea: "مسقف: ۴۶۰ م.م | بهاربند: ۵۳۰ م.م",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utmZone: "39R",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    issueDate: "۱۴۰۵/۰۲/۱۳",
    expDate: "۱۴۰۵/۰۸/۱۳",
    caseStatus: "IN_PROGRESS",
    customFields: [],
    inquiries: { water: "WAIT", elec: "OK", road: "WAIT", gas: "WAIT", env: "OK", natres: "OK", vet: "WAIT" },
    history: [
      { date: "۱۴۰۵/۰۲/۱۳ - ۰۸:۳۰", action: "تشکیل پرونده در گروه دوم (دام، طیور و شیلات)", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۲/۱۳ - ۰۹:۱۰", action: "برداشت مختصات UTM و ثبت کروکی عرصه ۲۱۴۵ مترمربعی", by: "مهندس خواجه‌پور" }
    ],
    croquisMaps: [
      {
        id: "MAP-101-1",
        title: "کروکی عرصه و جایگاه دامداری ۲۰۰ رأسی گوسفند پرتولید",
        date: "۱۴۰۵/۰۲/۱۳",
        utmZone: "39R",
        hemisphere: "N",
        notes: "کروکی مهندسی زمین واقع در بخش سپیدار - اسماعیل‌آباد",
        layers: [
          {
            id: "LYR-101-MAIN",
            name: "۱. محدوده اصلی زمین دامداری",
            category: "MAIN_PARCEL",
            geomType: "POLYGON",
            color: "#1b5e20",
            fillColor: "#2e7d32",
            fillOpacity: 0.18,
            strokeWidth: 3,
            visible: true,
            order: 1,
            desc: "عرصه کل دامداری طبق کروکی کارشناسی",
            points: [
              { x: 689269, y: 3213468, label: "P1" },
              { x: 689310, y: 3213455, label: "P2" },
              { x: 689295, y: 3213408, label: "P3" },
              { x: 689252, y: 3213423, label: "P4" }
            ]
          },
          {
            id: "LYR-101-PROJ",
            name: "۲. محل اجرای آغل مسقف و بهاربند",
            category: "PROJECT_AREA",
            geomType: "POLYGON",
            color: "#b45309",
            fillColor: "#f59e0b",
            fillOpacity: 0.32,
            strokeWidth: 2,
            visible: true,
            order: 2,
            desc: "محل احداث جایگاه مسقف (۴۶۰ م.م) و بهاربند",
            points: [
              { x: 689273, y: 3213458, label: "B1" },
              { x: 689298, y: 3213450, label: "B2" },
              { x: 689290, y: 3213424, label: "B3" },
              { x: 689265, y: 3213432, label: "B4" }
            ]
          }
        ]
      }
    ]
  },

  // گروه دوم: دام، طیور و شیلات (خانم فاطمه سیفی)
  {
    id: "CASE-102",
    code: "الف-۱۰۲/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "LIVESTOCK_POULTRY_FISHERIES",
    actType: "sheep_high",
    name: "خانم فاطمه سیفی",
    nid: "۶۵۵۰۰۳۹۵۷۶",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۰",
    count: 200,
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)",
    cap: "۲۰۰ راس",
    land: "۱۲۰۰",
    water: "۲۰۰۰",
    subarea: "مسقف: ۴۶۰ م.م | بهاربند: ۵۳۰ م.م",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utmZone: "39R",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    issueDate: "۱۴۰۵/۰۲/۱۳",
    expDate: "۱۴۰۵/۰۸/۱۳",
    caseStatus: "IN_PROGRESS",
    customFields: [],
    inquiries: { water: "WAIT", elec: "OK", road: "OK", gas: "NONE", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۵/۰۲/۱۳ - ۱۰:۰۰", action: "ثبت اولیه پرونده در گروه دام، طیور و شیلات", by: "مهندس خواجه‌پور" }
    ],
    croquisMaps: []
  },

  // گروه سوم: کلینیک گیاهپزشکی و داروخانه گیاهپزشکی (آقای علیرضا زارعی مورچکی)
  {
    id: "CASE-103",
    code: "د-۱۰۳/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: "CLINIC_PHARMACY",
    actType: "pharmacy",
    name: "آقای علیرضا زارعی مورچکی",
    nid: "۶۵۵۹۸۷۳۵۰۱",
    regNo: "",
    repName: "",
    mobile: "۰۹۱۷۰۰۰۰۰۰۱",
    count: 1,
    project: "تأسیس / تمدید داروخانه گیاهپزشکی آدینه سبز",
    cap: "۱ واحد",
    land: "۴۵",
    water: "۲۰۰",
    subarea: "تجاری مسقف و انبار استاندارد: ۴۵ م.م",
    loc: "فارس/ خفر/ راهکان / باغ کبیر",
    utmZone: "39R",
    utm: "712433,3191795\n712445,3191795\n712445,3191785\n712433,3191785",
    issueDate: "۱۴۰۳/۱۲/۲۴",
    expDate: "۱۴۰۵/۰۳/۰۵",
    caseStatus: "APPROVED",
    customFields: [
      { label: "نام داروخانه", value: "داروخانه گیاهپزشکی آدینه سبز" }
    ],
    inquiries: { water: "OK", elec: "OK", road: "OK", gas: "OK", env: "OK", natres: "OK", vet: "OK" },
    history: [
      { date: "۱۴۰۳/۱۲/۲۴ - ۰۹:۰۰", action: "تشکیل پرونده داروخانه گیاهپزشکی در گروه سوم", by: "مهندس خواجه‌پور" },
      { date: "۱۴۰۵/۰۲/۱۰ - ۱۲:۰۰", action: "بازرسی ادواری ۱۸ بندی داروخانه گیاهپزشکی", by: "کارشناس ناظر ۶۳۶" }
    ],
    croquisMaps: []
  }
];

var DEFAULT_LETTERS = [
  {
    id: "L-101", caseId: "CASE-102", number: "۱۴۰۵۰۲۱۳۰۱", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم آب منطقه ای شهرستان خفر",
    appName: "خانم فاطمه سیفی", appNid: "۶۵۵۰۰۳۹۵۷۶",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۱۲۰۰", water: "۲۰۰۰",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    body: "احتراماً نظر به اینکه خانم فاطمه سیفی به کد ملی ۶۵۵۰۰۳۹۵۷۶ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۱۲۰۰ متر مربع ، از اراضی فارس/ خفر/ مرکزی / خفر با موقعیت جغرافیایی زیر را دارند . خواهشمند است در خصوص امکان تامین آب از مبادی مجاز به وسیله حمل با تانکر به میزان ۲۰۰۰ لیتر در شبانه روز و همچنین حریم کمی و کیفی واحد فوق ، اظهارنظر فرمایید و مراتب را کتبا به این مرکز اعلام نمایید."
  },
  {
    id: "L-102", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۲", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم برق منطقه ای شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً نظر به اینکه آقای علی فروزند به کد ملی ۲۲۹۷۴۳۶۷۶۹ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۲۱۴۵ متر مربع ، از اراضی فارس/ خفر/ سپیدار / اسماعیل آباد با موقعیت جغرافیایی زیر را دارند. خواهشمند است در خصوص حریم کمی و کیفی واحد فوق اظهارنظر فرمایید و مراتب را کتبا اعلام نمایید."
  },
  {
    id: "L-103", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۳", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "ریاست محترم سازمان حفاظت محیط زیست شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "فارس/ خفر/ سپیدار / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً نظر به اینکه آقای علی فروزند به کد ملی ۲۲۹۷۴۳۶۷۶۹ قصد تأسیس یک واحد دامداری (گوسفند پرتولید) با ظرفیت ۲۰۰ راس ، در زمینی به مساحت ۲۱۴۵ متر مربع ، از اراضی فارس/ خفر/ سپیدار / اسماعیل آباد با موقعیت جغرافیایی زیر را دارند، خواهشمند است در خصوص شرایط زیست محیطی محل اجرای طرح اظهار نظر فرمایید."
  },
  {
    id: "L-104", caseId: "CASE-101", number: "۱۴۰۵۰۲۱۳۰۴", date: "۱۴۰۵/۰۲/۱۳", type: "OUT", attach: "ندارد",
    recipient: "مدیریت محترم منابع طبیعی شهرستان خفر",
    appName: "آقای علی فروزند", appNid: "۲۲۹۷۴۳۶۷۶۹",
    project: "تأسیس یک واحد دامداری (گوسفند پرتولید)", cap: "۲۰۰ راس", land: "۲۱۴۵", water: "۲۰۰۰",
    loc: "شهرستان خفر / مرکزی / اسماعیل آباد",
    utm: "689269,3213468\n689310,3213455\n689295,3213408\n689252,3213423",
    body: "احتراماً در مورد ملی یا مستثنیات بودن زمین واقع در شهرستان خفر / مرکزی / اسماعیل آباد ، با مختصات جغرافیایی که در ذیل همین نامه ارایه گردیده است، اظهارنظر فرمایید."
  }
];

var DEFAULT_TASKS = [
  { id: "T-1", caseId: "CASE-101", title: "پیگیری پاسخ استعلام برق، محیط زیست و منابع طبیعی آقای علی فروزند", cat: "پیگیری استعلام ادارات", due: "۱۴۰۵/۰۲/۲۰", status: "در حال پیگیری" },
  { id: "T-2", caseId: "CASE-102", title: "پیگیری پاسخ استعلام آب منطقه‌ای خانم فاطمه سیفی", cat: "پیگیری استعلام ادارات", due: "۱۴۰۵/۰۲/۱۸", status: "در حال پیگیری" }
];

var casesDB = JSON.parse(JSON.stringify(DEFAULT_UNIFIED_CASES));
var lettersDB = JSON.parse(JSON.stringify(DEFAULT_LETTERS));
var tasksDB = JSON.parse(JSON.stringify(DEFAULT_TASKS));
var activeCaseId = "CASE-201";
var editingLetterId = null;
var rootDriveHandle = null;
var pendingGuardedCallback = null;

// فهرست حذف دائمی؛ جلوی بازگشت داده از نسخه‌های قدیمی مرورگر و Google Drive را می‌گیرد.
var NEZAM_DELETION_MANIFEST_KEY = "nezam636_deletion_manifest_v1";
function readNezamDeletionManifest() {
  try {
    var raw = localStorage.getItem(NEZAM_DELETION_MANIFEST_KEY);
    var data = raw ? JSON.parse(raw) : {};
    return {
      version: 1,
      updatedAt: Number(data.updatedAt || 0),
      cases: Array.isArray(data.cases) ? data.cases : [],
      letters: Array.isArray(data.letters) ? data.letters : []
    };
  } catch (e) {
    return { version: 1, updatedAt: 0, cases: [], letters: [] };
  }
}
function mergeNezamDeletionManifests(a, b) {
  var left = a && typeof a === "object" ? a : {};
  var right = b && typeof b === "object" ? b : {};
  var merged = { version: 1, updatedAt: Math.max(Number(left.updatedAt || 0), Number(right.updatedAt || 0)), cases: [], letters: [] };
  ["cases", "letters"].forEach(function (type) {
    var byId = {};
    [left[type], right[type]].forEach(function (list) {
      (Array.isArray(list) ? list : []).forEach(function (item) {
        if (!item || !item.id) return;
        var id = String(item.id);
        if (!byId[id] || Number(item.deletedAt || 0) > Number(byId[id].deletedAt || 0)) {
          byId[id] = Object.assign({}, item, { id: id });
        }
      });
    });
    merged[type] = Object.keys(byId).map(function (id) { return byId[id]; });
  });
  return merged;
}
function persistNezamDeletionManifest(manifest) {
  try {
    var normalized = mergeNezamDeletionManifests(manifest, null);
    normalized.updatedAt = Math.max(Date.now(), Number(normalized.updatedAt || 0));
    localStorage.setItem(NEZAM_DELETION_MANIFEST_KEY, JSON.stringify(normalized));
    return true;
  } catch (e) {
    console.error("Nezam636 deletion manifest could not be saved:", e);
    return false;
  }
}
function recordNezamDeletions(caseRecords, letterRecords) {
  var manifest = readNezamDeletionManifest();
  var now = Date.now();
  (Array.isArray(caseRecords) ? caseRecords : []).forEach(function (item) {
    if (!item || !item.id) return;
    manifest.cases.push({ id: String(item.id), nid: String(item.nid || ""), name: String(item.name || ""), deletedAt: now });
  });
  (Array.isArray(letterRecords) ? letterRecords : []).forEach(function (item) {
    if (!item || !item.id) return;
    manifest.letters.push({ id: String(item.id), number: String(item.number || ""), recipient: String(item.recipient || ""), deletedAt: now });
  });
  return persistNezamDeletionManifest(manifest);
}
function isNezamCaseDeleted(item, manifest) {
  if (!item) return false;
  var id = String(item.id || "");
  return (manifest.cases || []).some(function (deleted) {
    if (!deleted) return false;
    if (id && String(deleted.id) === id) return true;
    // شناسه‌های ساخته‌شده از نسخه‌های بسیار قدیمی Drive بر اساس کدملی بازسازی می‌شوند.
    return id.indexOf("CASE-DRV-") === 0 && deleted.nid && String(deleted.nid) === String(item.nid || "");
  });
}
function isNezamLetterDeleted(item, manifest) {
  if (!item) return false;
  var id = String(item.id || "");
  return (manifest.letters || []).some(function (deleted) {
    if (!deleted) return false;
    if (id && String(deleted.id) === id) return true;
    return !!(deleted.number && String(deleted.number) === String(item.number || "") &&
      (!deleted.recipient || String(deleted.recipient) === String(item.recipient || "")));
  });
}
function filterNezamRecordsByDeletionManifest(caseRecords, letterRecords, manifest) {
  var m = mergeNezamDeletionManifests(manifest || readNezamDeletionManifest(), null);
  return {
    cases: (Array.isArray(caseRecords) ? caseRecords : []).filter(function (item) { return !isNezamCaseDeleted(item, m); }),
    letters: (Array.isArray(letterRecords) ? letterRecords : []).filter(function (item) { return !isNezamLetterDeleted(item, m); })
  };
}
function applyNezamDeletionManifestToState() {
  var filtered = filterNezamRecordsByDeletionManifest(casesDB, lettersDB, readNezamDeletionManifest());
  casesDB = filtered.cases;
  lettersDB = filtered.letters;
}
window.readNezamDeletionManifest = readNezamDeletionManifest;
window.mergeNezamDeletionManifests = mergeNezamDeletionManifests;
window.persistNezamDeletionManifest = persistNezamDeletionManifest;
window.filterNezamRecordsByDeletionManifest = filterNezamRecordsByDeletionManifest;
window.applyNezamDeletionManifestToState = applyNezamDeletionManifestToState;

/* بارگذاری و مهاجرت یک‌باره داده‌های قدیمی؛ پس از ایجاد کلید اصلی، کلید v6 دیگر منبع جایگزین نیست. */
function readCanonicalOrMigrateLegacy(primaryKey, legacyKey) {
  var raw = localStorage.getItem(primaryKey);
  if (raw !== null) {
    try { localStorage.removeItem(legacyKey); } catch (e) {}
    return raw;
  }
  var legacyRaw = localStorage.getItem(legacyKey);
  if (legacyRaw === null) return null;
  // کلید قدیمی فقط پس از اطمینان از ثبت نسخه اصلی حذف می‌شود.
  try {
    localStorage.setItem(primaryKey, legacyRaw);
    if (localStorage.getItem(primaryKey) === legacyRaw) {
      localStorage.removeItem(legacyKey);
      return legacyRaw;
    }
  } catch (migrationError) {
    console.error("Legacy storage migration failed:", primaryKey, migrationError);
  }
  return null;
}

/* بارگذاری و مهاجرت هوشمند داده‌های قبلی از LocalStorage */
try {
  if (localStorage.getItem("nezam636_act_specs_v3")) {
    var savedSpecs = JSON.parse(localStorage.getItem("nezam636_act_specs_v3"));
    for (var sk in savedSpecs) ACT_SPECS[sk] = savedSpecs[sk];
  }
  var initialCasesRaw = readCanonicalOrMigrateLegacy("nezam636_unified_cases", "nezam636_cases_v6");
  if (initialCasesRaw !== null) {
    var loadedCases = JSON.parse(initialCasesRaw);
    if (Array.isArray(loadedCases)) casesDB = loadedCases;
  }
  var initialLettersRaw = readCanonicalOrMigrateLegacy("nezam636_letters", "nezam636_letters_v6");
  if (initialLettersRaw !== null) {
    var loadedLetters = JSON.parse(initialLettersRaw);
    if (Array.isArray(loadedLetters)) lettersDB = loadedLetters;
  }
  if (localStorage.getItem("nezam636_tasks")) tasksDB = JSON.parse(localStorage.getItem("nezam636_tasks"));
  if (localStorage.getItem("nezam636_doc_checklists_v2")) {
    var loadedDocs = JSON.parse(localStorage.getItem("nezam636_doc_checklists_v2"));
    for (var dk in loadedDocs) DOC_CHECKLISTS[dk] = loadedDocs[dk];
  }
  if (localStorage.getItem("nezam636_active_case_id") !== null) {
    activeCaseId = localStorage.getItem("nezam636_active_case_id");
  }
} catch (e) {}
// کلید حتی در نصب تازه ایجاد می‌شود تا صحت ذخیره ابری همیشه قابل راستی‌آزمایی باشد.
if (localStorage.getItem(NEZAM_DELETION_MANIFEST_KEY) === null) {
  persistNezamDeletionManifest({ version: 1, cases: [], letters: [], updatedAt: Date.now() });
}
applyNezamDeletionManifestToState();

/* ارتقای ساختاری پرونده‌های قدیمی بدون حذف هیچ اطلاعاتی */
function normalizeAllCasesSchema() {
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
    if (!c.mainGroup) c.mainGroup = sp.mainGroup || "LIVESTOCK_POULTRY_FISHERIES";
    if (!c.entityType) c.entityType = "INDIVIDUAL";
    if (!c.caseStatus) c.caseStatus = "ACTIVE";
    if (!c.utmZone) c.utmZone = "39R";
    if (!Array.isArray(c.customFields)) c.customFields = [];
    // مهاجرت امن پلاک ثبتی از فیلدهای سفارشی قدیمی به فیلد مستقل پرونده
    if (c.landParcel == null || c.landParcel === "") {
      var legacyParcel = "";
      for (var pf = 0; pf < c.customFields.length; pf++) {
        var customLabel = String((c.customFields[pf] || {}).label || "");
        if (customLabel.indexOf("پلاک") !== -1) {
          legacyParcel = String(c.customFields[pf].value || "");
          if (legacyParcel) break;
        }
      }
      c.landParcel = legacyParcel;
    }
    if (!Array.isArray(c.history)) {
      c.history = [{ date: (c.issueDate || todayShamsi()) + " - ۰۸:۰۰", action: "ثبت اولیه پرونده در سامانه", by: "مدیر مرکز ۶۳۶" }];
    }
    if (!Array.isArray(c.croquisMaps)) c.croquisMaps = [];
    if (c.croquisMaps.length === 0 && c.utm && c.utm.trim().length > 5) {
      var pts = [];
      var lines = c.utm.trim().split("\n");
      for (var l = 0; l < lines.length; l++) {
        var p = toEn(lines[l].trim()).split(/[,،\s\t]+/);
        var x = parseFloat(p[0]), y = parseFloat(p[1]);
        if (!isNaN(x) && !isNaN(y)) pts.push({ x: x, y: y, label: "P" + (pts.length + 1) });
      }
      if (pts.length >= 3) {
        c.croquisMaps.push({
          id: "MAP-" + c.id + "-1",
          title: "کروکی اصلی زمین (" + (c.project || "طرح کشاورزی") + ")",
          date: c.issueDate || todayShamsi(),
          utmZone: c.utmZone || "39R",
          hemisphere: "N",
          notes: "کروکی استخراج‌شده از مختصات پرونده متقاضی",
          layers: [
            {
              id: "LYR-" + c.id + "-MAIN",
              name: "۱. محدوده اصلی زمین",
              category: "MAIN_PARCEL",
              geomType: "POLYGON",
              color: "#1b5e20",
              fillColor: "#2e7d32",
              fillOpacity: 0.20,
              strokeWidth: 3,
              visible: true,
              order: 1,
              desc: "محدوده اصلی عرصه",
              points: pts
            }
          ]
        });
      }
    }
  }
  // پرونده نمونه پس از حذف یا بازیابی پشتیبان، خودکار بازگردانده نمی‌شود.
}
normalizeAllCasesSchema();

function saveAllDB() {
  // هیچ نسخه قدیمی/بازیابی‌شده‌ای نباید رکوردی را که در فهرست حذف دائمی است دوباره ذخیره کند.
  applyNezamDeletionManifestToState();
  var storageEntries = [
    ["nezam636_unified_cases", casesDB],
    ["nezam636_letters", lettersDB],
    [NEZAM_DELETION_MANIFEST_KEY, readNezamDeletionManifest()],
    ["nezam636_tasks", tasksDB],
    ["nezam636_doc_checklists_v2", DOC_CHECKLISTS],
    ["nezam636_act_specs_v3", ACT_SPECS],
    ["nezam636_active_case_id", activeCaseId || ""]
  ];
  var failedKeys = [];

  // هر بخش جداگانه ذخیره می‌شود تا خطای یک کلید، ذخیره سایر اطلاعات را متوقف نکند.
  for (var i = 0; i < storageEntries.length; i++) {
    try {
      localStorage.setItem(storageEntries[i][0], JSON.stringify(storageEntries[i][1]));
    } catch (storageError) {
      failedKeys.push(storageEntries[i][0]);
      console.error("Nezam636 storage write failed:", storageEntries[i][0], storageError);
    }
  }

  if (!failedKeys.length) {
    try {
      localStorage.removeItem("nezam636_cases_v6");
      localStorage.removeItem("nezam636_letters_v6");
    } catch (legacyCleanupError) {}
  }
  if (failedKeys.length) {
    var now = Date.now();
    var lastWarning = Number(window.__nezam636LastStorageWarningAt || 0);
    if (typeof showToastMsg === "function" && now - lastWarning > 10000) {
      window.__nezam636LastStorageWarningAt = now;
      showToastMsg(
        "⚠️ ذخیره بخشی از اطلاعات در حافظه مرورگر انجام نشد. فضای ذخیره‌سازی را آزاد کنید و فوراً از بخش پشتیبان‌گیری، فایل JSON تهیه کنید.",
        true
      );
    }
  } else {
    window.__nezam636LastStorageWarningAt = 0;
  }

  refreshAllViews();
  return failedKeys.length === 0;
}

/* =========================================================================
   بخش سوم: قانون اجباری انتخاب متقاضی در سطح منطق اصلی برنامه
   هیچ فرایند اداری بدون ثبت و فراخوانی متقاضی در سامانه آغاز یا اجرا نمی‌شود
   ========================================================================= */
function getActiveCase() {
  if (!activeCaseId) return null;
  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === activeCaseId) return casesDB[i];
  }
  return null;
}

function logCaseAction(caseObj, actionText) {
  var c = caseObj || getActiveCase();
  if (!c) return;
  if (!Array.isArray(c.history)) c.history = [];
  c.history.unshift({
    date: todayShamsi() + " - " + nowTimeFa(),
    action: actionText,
    by: (window.brandCfg && window.brandCfg.managerName) ? window.brandCfg.managerName : "مدیر مرکز ۶۳۶"
  });
}

function requireActiveCase(actionTitle, onSuccessCallback) {
  var c = getActiveCase();
  if (c && c.id) {
    if (typeof onSuccessCallback === "function") onSuccessCallback(c);
    return c;
  }
  pendingGuardedCallback = typeof onSuccessCallback === "function" ? onSuccessCallback : null;
  openMandatoryApplicantModal(actionTitle || "انجام فرایند اداری");
  return null;
}
window.requireActiveCase = requireActiveCase;

function openMandatoryApplicantModal(reasonText) {
  var modal = document.getElementById("mandatory-applicant-modal");
  var reasonEl = document.getElementById("guard-modal-reason");
  if (reasonEl) {
    reasonEl.textContent = "عملیات درخواستی: «" + (reasonText || "شروع فرایند اداری") +
      "» — برای کارهای مرتبط با پرونده، انتخاب متقاضی الزامی است. مکاتبات مستقل دفتر را می‌توان از مسیر «نامه اداری مستقل دفتر» در دبیرخانه انجام داد.";
  }
  if (modal) {
    modal.style.display = "flex";
    renderGuardModalApplicantList();
    var inp = document.getElementById("guard-modal-search");
    if (inp) { inp.value = ""; inp.focus(); }
  }
}

function closeMandatoryApplicantModal() {
  var modal = document.getElementById("mandatory-applicant-modal");
  if (modal) modal.style.display = "none";
}

function renderGuardModalApplicantList() {
  var tbody = document.getElementById("guard-modal-tbody");
  if (!tbody) return;
  var q = toEn((document.getElementById("guard-modal-search") || {}).value || "").trim().toLowerCase();
  var grpFilter = (document.getElementById("guard-modal-group") || {}).value || "ALL";
  var html = "";

  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    if (grpFilter !== "ALL" && c.mainGroup !== grpFilter) continue;
    var hay = toEn([c.code, c.name, c.nid, c.mobile, c.project, c.loc, c.landParcel || "", c.repName || ""].join(" ")).toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    html += '<tr>' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td><b>' + escapeHtmlCore(c.name) + '</b><br><small class="text-muted">کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + ' | همراه: ' + escapeHtmlCore(toFa(c.mobile || "---")) + '</small></td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + escapeHtmlCore(grpMeta.shortTitle) + '</span><br><small>' + escapeHtmlCore(c.project) + '</small></td>' +
      '<td><button type="button" class="btn btn-sm btn-success fw-bold" data-guard-case-id="' + escapeHtmlCore(c.id) + '">✅ انتخاب و ادامه</button></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="4" class="text-center py-3 text-muted">متقاضی با این مشخصات یافت نشد. لطفاً روی دکمه «ثبت متقاضی جدید» کلیک کنید.</td></tr>';
  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-guard-case-id]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-guard-case-id");
      var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
      if (exists) confirmSelectApplicantFromGuard(id);
    });
  }
}
function confirmSelectApplicantFromGuard(caseId) {
  selectActiveCase(caseId);
  closeMandatoryApplicantModal();
  if (typeof pendingGuardedCallback === "function") {
    var cb = pendingGuardedCallback;
    pendingGuardedCallback = null;
    cb(getActiveCase());
  }
}

function clearActiveApplicantSelection() {
  activeCaseId = "";
  saveAllDB();
  updateActiveApplicantBarUI();
  showToastMsg("⚠️ انتخاب متقاضی پاک شد. تا انتخاب مجدد متقاضی، عملیات اداری متوقف است.", true);
}

function updateActiveApplicantBarUI() {
  var c = getActiveCase();
  var statusBadge = document.getElementById("active-case-status-badge");
  var infoSummary = document.getElementById("active-case-info-summary");
  var lockBanner = document.getElementById("no-active-case-warning-banner");

  if (!c) {
    if (statusBadge) {
      statusBadge.className = "badge bg-danger fs-6";
      statusBadge.textContent = "⛔ بدون متقاضی فعال (عملیات قفل)";
    }
    if (infoSummary) {
      infoSummary.textContent = "هیچ متقاضی انتخاب نشده است! پیش از هرگونه عملیات، متقاضی را انتخاب یا ثبت نمایید.";
    }
    if (lockBanner) lockBanner.style.display = "block";
  } else {
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var entityLbl = c.entityType === "LEGAL" ? "شخص حقوقی" : (c.entityType === "ORG" ? "سازمان/نهاد" : "شخص حقیقی");
    if (statusBadge) {
      statusBadge.className = "badge bg-success fs-6";
      statusBadge.textContent = "👤 پرونده فعال: " + String(c.name || "");
    }
    if (infoSummary) {
      infoSummary.innerHTML =
        '<span class="badge ' + grpMeta.badgeClass + ' me-1">' + escapeHtmlCore(grpMeta.shortTitle) + '</span>' +
        '<span class="badge bg-secondary me-1">' + entityLbl + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کلاسه: ' + escapeHtmlCore(toFa(c.code)) + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + '</span>' +
        '<span class="badge bg-success-subtle text-success border border-success me-1">' + escapeHtmlCore(c.project) + ' (' + escapeHtmlCore(toFa(c.cap)) + ')</span>' +
        '<span class="badge bg-light text-secondary border">📍 ' + escapeHtmlCore(c.loc) + '</span>' +
        (c.landParcel ? '<span class="badge bg-light text-primary border">پلاک: ' + escapeHtmlCore(toFa(c.landParcel)) + '</span>' : '');
    }
    if (lockBanner) lockBanner.style.display = "none";
  }
}
function switchMainPane(paneId) {
  if (paneId === "pane-compose") paneId = "pane-cases";
  if (paneId === "pane-preview") paneId = "pane-print";
  if (paneId === "pane-ai-center") paneId = "pane-ai";

  // ورود به دبیرخانه آزاد است؛ فقط عملیات پرونده‌محور همچنان به انتخاب متقاضی نیاز دارند.
  var guardedPanes = {
    "pane-croquis": "ورود به ابزار تخصصی کروکی زمین و نقشه UTM",
    "pane-print": "مشاهده و چاپ سربرگ و فرم‌های رسمی متقاضی"
  };
  var independentOfficeLetterFlow = window.__nezamOfficeLetterDraftMode === true;

  if (guardedPanes[paneId] && !getActiveCase() && !(paneId === "pane-print" && independentOfficeLetterFlow)) {
    requireActiveCase(guardedPanes[paneId], function() {
      switchMainPane(paneId);
    });
    return;
  }

  var panes = document.querySelectorAll(".sec-pane");
  for (var i = 0; i < panes.length; i++) panes[i].classList.remove("active");
  var target = document.getElementById(paneId);
  if (target) target.classList.add("active");

  var mapBtn = {
    "pane-dashboard": "nav-btn-dashboard",
    "pane-cases": "nav-btn-cases",
    "pane-croquis": "nav-btn-croquis",
    "pane-letters": "nav-btn-letters",
    "pane-print": "nav-btn-print",
    "pane-office": "nav-btn-office",
    "pane-ai": "nav-btn-ai",
    "pane-guide": "nav-btn-guide"
  };
  var navLinks = document.querySelectorAll(".app-navbar .nav-link");
  for (var j = 0; j < navLinks.length; j++) navLinks[j].classList.remove("active");
  var btn = document.getElementById(mapBtn[paneId]);
  if (btn) btn.classList.add("active");

  if (paneId === "pane-croquis" && typeof window.initCroquisWorkspaceForActiveCase === "function") {
    window.initCroquisWorkspaceForActiveCase();
  }
}
window.openSection = switchMainPane;

function switchCaseSubTab(subId) {
  var guardedSubs = {
    "sub-info": "ویرایش مشخصات پرونده متقاضی",
    "sub-docs": "بایگانی مدارک و چک‌لیست پرونده متقاضی",
    "sub-history": "مشاهده و ثبت سوابق اقدامات پرونده"
  };
  if (guardedSubs[subId] && !getActiveCase()) {
    requireActiveCase(guardedSubs[subId], function() {
      switchCaseSubTab(subId);
    });
    return;
  }

  var subs = document.querySelectorAll(".case-subpane");
  for (var i = 0; i < subs.length; i++) subs[i].classList.remove("active");
  var target = document.getElementById(subId);
  if (target) target.classList.add("active");

  var btns = document.querySelectorAll(".case-subtab-btn");
  for (var j = 0; j < btns.length; j++) btns[j].classList.remove("active");
  var b = document.getElementById("btn-" + subId);
  if (b) b.classList.add("active");

  if (subId === "sub-list") renderApplicantsDirectoryTable();
  if (subId === "sub-matrix") renderUnifiedCasesMatrix();
  if (subId === "sub-docs") renderActiveCaseDocsChecklist();
  if (subId === "sub-history") renderActiveCaseHistory();
}

/* =========================================================================
   ۵. مدیریت متقاضیان، جستجوی پیشرفته، فیلتر ۳ گروه و جلوگیری از تکرار
   ========================================================================= */
function populateGlobalCaseSelector() {
  var sel = document.getElementById("global-case-selector");
  if (!sel) return;
  var html = '<option value="">-- انتخاب متقاضی / سازمان فعال --</option>';
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    html += '<option value="' + escapeHtmlCore(c.id) + '" ' + (c.id === activeCaseId ? "selected" : "") + '>' +
      '[' + escapeHtmlCore(grpMeta.shortTitle) + '] ' + escapeHtmlCore(toFa(c.code)) + ' — ' + escapeHtmlCore(c.name) +
      ' (کدملی/شناسه: ' + escapeHtmlCore(toFa(c.nid)) + ' | ' + escapeHtmlCore(c.cap) + ')' +
    '</option>';
  }
  sel.innerHTML = html;
  updateActiveApplicantBarUI();
}
function selectActiveCase(caseId) {
  if (!caseId) {
    clearActiveApplicantSelection();
    return;
  }
  activeCaseId = caseId;
  try { localStorage.setItem("nezam636_active_case_id", activeCaseId); } catch (e) {}

  // پاک‌سازی وضعیت ویرایش قبلی تا اطلاعات پرونده قبلی ناخواسته در عملیات جدید استفاده نشوند
  editingLetterId = null;
  var editAlert = document.getElementById("letter-edit-alert");
  if (editAlert) editAlert.style.display = "none";

  populateGlobalCaseSelector();
  loadActiveCaseIntoForm();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();
  renderActiveCaseDocsChecklist();
  renderActiveCaseHistory();
  if (typeof window.initCroquisWorkspaceForActiveCase === "function") window.initCroquisWorkspaceForActiveCase();
  if (typeof renderSinglePreviewSheet === "function") renderSinglePreviewSheet();
}

function populateActivityDropdownByGroup(selectedGroup, selectedActKey) {
  var actSel = document.getElementById("c-act-type");
  if (!actSel) return;
  var html = "";
  for (var k in ACT_SPECS) {
    if (!Object.prototype.hasOwnProperty.call(ACT_SPECS, k)) continue;
    var sp = ACT_SPECS[k] || {};
    if (!selectedGroup || sp.mainGroup === selectedGroup) {
      html += '<option value="' + escapeHtmlCore(k) + '" ' + (k === selectedActKey ? "selected" : "") + '>' +
        escapeHtmlCore(sp.title) + ' (واحد: ' + escapeHtmlCore(sp.unit) + ')</option>';
    }
  }
  actSel.innerHTML = html;
}
function onMainGroupChangedInForm() {
  var grp = document.getElementById("c-main-group").value;
  populateActivityDropdownByGroup(grp, "");
  recalcCaseSpecsFromHeadcount();
}

function onEntityTypeChangedInForm() {
  var ent = (document.getElementById("c-entity-type") || {}).value || "INDIVIDUAL";
  var legalBox = document.getElementById("c-legal-extra-fields");
  var lblName = document.getElementById("lbl-c-name");
  var lblNid = document.getElementById("lbl-c-nid");
  if (ent === "INDIVIDUAL") {
    if (legalBox) legalBox.style.display = "none";
    if (lblName) lblName.textContent = "نام و نام خانوادگی متقاضی حقیقی *";
    if (lblNid) lblNid.textContent = "کد ملی متقاضی (۱۰ رقمی) *";
  } else {
    if (legalBox) legalBox.style.display = "flex";
    if (lblName) lblName.textContent = ent === "LEGAL" ? "نام کامل شرکت / مؤسسه حقوقی *" : "نام سازمان / نهاد دولتی یا عمومی *";
    if (lblNid) lblNid.textContent = "شناسه ملی حقوقی / سازمانی (۱۱ رقمی) *";
  }
}

function addNewActivitySubgroupPrompt() {
  var grp = (document.getElementById("c-main-group") || {}).value || "GREENHOUSE_MUSHROOM";
  var grpMeta = APPLICANT_MAIN_GROUPS[grp] || APPLICANT_MAIN_GROUPS.GREENHOUSE_MUSHROOM;
  var title = prompt("عنوان زیرگروه یا فعالیت جدید در «" + grpMeta.title + "» را وارد نمایید:");
  if (!title || !title.trim()) return;
  var unit = prompt("واحد سنجش ظرفیت (مثلاً: مترمربع، راس، قطعه، تن در سال، واحد):", "مترمربع") || "واحد";
  var water = parseFloat(toEn(prompt("ضریب مصرف آب روزانه به ازای هر " + unit + " (لیتر):", "10"))) || 10;
  var land = parseFloat(toEn(prompt("ضریب مساحت زمین به ازای هر " + unit + " (مترمربع):", "2"))) || 2;
  var newKey = "custom_act_" + new Date().getTime();
  var docGrp = grp === "GREENHOUSE_MUSHROOM" ? "GREENHOUSE" : (grp === "CLINIC_PHARMACY" ? "CLINIC" : "LIVESTOCK");

  ACT_SPECS[newKey] = {
    mainGroup: grp,
    title: title.trim(),
    unit: unit.trim(),
    water: water,
    land: land,
    minL: 100,
    roof: land * 0.5,
    open: land * 0.5,
    docGroup: docGrp
  };
  saveAllDB();
  populateActivityDropdownByGroup(grp, newKey);
  recalcCaseSpecsFromHeadcount();
  showToastMsg("زیرگروه جدید «" + title.trim() + "» به سامانه اضافه شد.");
}

function loadActiveCaseIntoForm() {
  var c = getActiveCase();
  if (!c) return;
  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var mainGrp = c.mainGroup || sp.mainGroup || "LIVESTOCK_POULTRY_FISHERIES";

  var grpEl = document.getElementById("c-main-group");
  if (grpEl) grpEl.value = mainGrp;
  populateActivityDropdownByGroup(mainGrp, c.actType);

  var entEl = document.getElementById("c-entity-type");
  if (entEl) entEl.value = c.entityType || "INDIVIDUAL";
  onEntityTypeChangedInForm();

  var stEl = document.getElementById("c-case-status");
  if (stEl) stEl.value = c.caseStatus || "ACTIVE";

  document.getElementById("c-count").value = toEn(c.count || 200);
  document.getElementById("c-code").value = c.code || "الف-۱۰۱/۶۳۶";
  document.getElementById("c-name").value = c.name || "";
  document.getElementById("c-nid").value = toFa(c.nid || "");
  document.getElementById("c-mobile").value = toFa(c.mobile || "");
  if (document.getElementById("c-reg-no")) document.getElementById("c-reg-no").value = toFa(c.regNo || "");
  if (document.getElementById("c-rep-name")) document.getElementById("c-rep-name").value = c.repName || "";
  document.getElementById("c-issue-date").value = toFa(c.issueDate || todayShamsi());
  document.getElementById("c-exp-date").value = toFa(c.expDate || "۱۴۰۵/۰۸/۱۳");
  document.getElementById("c-project").value = c.project || "";
  document.getElementById("c-cap").value = toFa(c.cap || "");
  document.getElementById("c-land").value = toFa(c.land || "");
  var parcelInput = document.getElementById("c-land-parcel");
  if (parcelInput) parcelInput.value = toFa(c.landParcel || "");
  document.getElementById("c-water").value = toFa(c.water || "");
  document.getElementById("c-loc").value = c.loc || "";
  document.getElementById("c-subarea").value = c.subarea || "";
  document.getElementById("c-utm").value = toEn(c.utm || "");

  if (typeof window.renderCaseSegmentedPointsTable === "function") {
    window.renderCaseSegmentedPointsTable();
  }

  renderCustomFieldsSummary();
}

function recalcCaseSpecsFromHeadcount() {
  var key = document.getElementById("c-act-type").value;
  var count = parseFloat(toEn(document.getElementById("c-count").value)) || 0;
  var sp = ACT_SPECS[key] || ACT_SPECS.sheep_high;

  var water = Math.round(count * sp.water);
  var land = Math.max(sp.minL, Math.round(count * sp.land));
  var roof = Math.round(count * sp.roof);
  var open = Math.round(count * sp.open);

  document.getElementById("c-project").value = sp.title;
  document.getElementById("c-cap").value = toFa(count) + " " + sp.unit;
  document.getElementById("c-water").value = toFa(water);
  document.getElementById("c-land").value = toFa(land);
  document.getElementById("c-subarea").value = "مسقف: " + toFa(roof) + " م.م | بهاربند/محوطه: " + toFa(open) + " م.م";
}
window.autoFillFromHeadcount = recalcCaseSpecsFromHeadcount;

function startNewCaseWizard(presetGroup) {
  var grp = presetGroup || "GREENHOUSE_MUSHROOM";
  var defaultAct = grp === "GREENHOUSE_MUSHROOM" ? "greenhouse_veg" : (grp === "CLINIC_PHARMACY" ? "pharmacy" : "sheep_high");
  var sp = ACT_SPECS[defaultAct] || ACT_SPECS.greenhouse_veg;
  var prefix = grp === "GREENHOUSE_MUSHROOM" ? "گ-" : (grp === "CLINIC_PHARMACY" ? "د-" : "دام-");
  var newId = "CASE-" + new Date().getTime();
  var nextNum = casesDB.length + 101;

  var newCase = {
    id: newId,
    code: prefix + toFa(nextNum) + "/۶۳۶",
    entityType: "INDIVIDUAL",
    mainGroup: grp,
    actType: defaultAct,
    name: "متقاضی جدید",
    nid: "",
    regNo: "",
    repName: "",
    mobile: "",
    count: grp === "GREENHOUSE_MUSHROOM" ? 1000 : (grp === "CLINIC_PHARMACY" ? 1 : 200),
    project: sp.title,
    cap: grp === "GREENHOUSE_MUSHROOM" ? "۱۰۰۰ مترمربع" : (grp === "CLINIC_PHARMACY" ? "۱ واحد" : "۲۰۰ راس"),
    land: grp === "GREENHOUSE_MUSHROOM" ? "۱۲۵۰" : (grp === "CLINIC_PHARMACY" ? "۴۵" : "۱۲۰۰"),
    landParcel: "",
    water: grp === "GREENHOUSE_MUSHROOM" ? "۸۰۰۰" : (grp === "CLINIC_PHARMACY" ? "۲۰۰" : "۲۰۰۰"),
    subarea: "مسقف: ۱۰۰۰ م.م | محوطه: ۲۵۰ م.م",
    loc: "فارس/ خفر/ مرکزی / خفر",
    utmZone: "39R",
    utm: "715183,3205094\n715219,3205068\n715204,3205048\n715169,3205075",
    issueDate: todayShamsi(),
    expDate: "۱۴۰۶/۰۲/۱۳",
    caseStatus: "ACTIVE",
    customFields: [],
    inquiries: { water: "NONE", elec: "NONE", road: "NONE", gas: "NONE", env: "NONE", natres: "NONE", vet: "NONE" },
    history: [
      { date: todayShamsi() + " - " + nowTimeFa(), action: "ایجاد پرونده جدید در سامانه", by: "مدیر مرکز ۶۳۶" }
    ],
    croquisMaps: []
  };

  casesDB.unshift(newCase);
  activeCaseId = newId;
  saveAllDB();
  loadActiveCaseIntoForm();
  closeMandatoryApplicantModal();
  switchMainPane("pane-cases");
  switchCaseSubTab("sub-info");
  var nameInput = document.getElementById("c-name");
  if (nameInput) { nameInput.focus(); nameInput.select(); }
  showToastMsg("پرونده جدید تشکیل شد؛ مشخصات متقاضی و کد ملی را وارد و ذخیره نمایید.");
}

function saveActiveCaseChanges(goToLetters) {
  var c = getActiveCase();
  if (!c) {
    requireActiveCase("ذخیره تغییرات پرونده");
    return;
  }

  var enteredName = document.getElementById("c-name").value.trim();
  var enteredNid = toEn(document.getElementById("c-nid").value.trim());
  var enteredCode = document.getElementById("c-code").value.trim();

  if (!enteredName || enteredName === "متقاضی جدید") {
    alert("لطفاً نام و نام خانوادگی متقاضی (یا نام شرکت/سازمان) را به طور دقیق وارد نمایید.");
    document.getElementById("c-name").focus();
    return;
  }
  if (!enteredNid || enteredNid.length < 8) {
    alert("لطفاً کد ملی ۱۰ رقمی یا شناسه ملی ۱۱ رقمی معتبر وارد نمایید.");
    document.getElementById("c-nid").focus();
    return;
  }

  // جلوگیری از ثبت پرونده تکراری بر اساس کد ملی یا کلاسه پرونده
  for (var i = 0; i < casesDB.length; i++) {
    var other = casesDB[i];
    if (other.id === c.id) continue;
    if (enteredNid && toEn(other.nid) === enteredNid && other.actType === document.getElementById("c-act-type").value) {
      var confirmDup = confirm("⚠️ هشدار جلوگیری از پرونده تکراری:\nمتقاضی «" + other.name + "» با همین کد ملی/شناسه (" + toFa(enteredNid) + ") و همین نوع فعالیت در پرونده کلاسه «" + toFa(other.code) + "» قبلاً ثبت شده است.\nآیا مطمئن هستید که می‌خواهید پرونده دومی برای ایشان ثبت شود؟");
      if (!confirmDup) return;
      break;
    }
  }

  c.entityType = (document.getElementById("c-entity-type") || {}).value || "INDIVIDUAL";
  c.mainGroup = (document.getElementById("c-main-group") || {}).value || "GREENHOUSE_MUSHROOM";
  c.actType = document.getElementById("c-act-type").value;
  c.caseStatus = (document.getElementById("c-case-status") || {}).value || "ACTIVE";
  c.count = parseFloat(toEn(document.getElementById("c-count").value)) || 0;
  c.code = enteredCode;
  c.name = enteredName;
  c.nid = toFa(enteredNid);
  c.mobile = toFa(document.getElementById("c-mobile").value.trim());
  if (document.getElementById("c-reg-no")) c.regNo = toFa(document.getElementById("c-reg-no").value.trim());
  if (document.getElementById("c-rep-name")) c.repName = document.getElementById("c-rep-name").value.trim();
  c.issueDate = toFa(document.getElementById("c-issue-date").value.trim());
  c.expDate = toFa(document.getElementById("c-exp-date").value.trim());
  c.project = document.getElementById("c-project").value.trim();
  c.cap = toFa(document.getElementById("c-cap").value.trim());
  c.land = toFa(document.getElementById("c-land").value.trim());
  c.landParcel = toFa((document.getElementById("c-land-parcel") || {}).value || "");
  c.water = toFa(document.getElementById("c-water").value.trim());
  c.loc = document.getElementById("c-loc").value.trim();
  c.subarea = document.getElementById("c-subarea").value.trim();
  c.utm = toEn(document.getElementById("c-utm").value.trim());

  logCaseAction(c, "ویرایش و ذخیره اطلاعات پرونده (" + c.project + " - " + c.cap + ")");
  saveAllDB();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();

  if (goToLetters) {
    switchMainPane("pane-letters");
    showToastMsg("مشخصات پرونده ذخیره شد؛ اکنون قالب نامه استعلام را انتخاب کنید.");
  } else {
    showToastMsg("تغییرات پرونده «" + c.name + "» با موفقیت ذخیره شد.");
  }
}

function deleteActiveCase() {
  if (window.__nezamDriveReady === false) {
    showToastMsg("در حال تکمیل بازیابی اطلاعات؛ پس از آماده‌شدن سامانه حذف را انجام دهید.", true);
    return;
  }
  var c = getActiveCase();
  if (!c) return;
  if (casesDB.length <= 1) {
    alert("حداقل یک پرونده باید در سامانه باقی بماند.");
    return;
  }
  var relatedLetters = 0;
  for (var l = 0; l < lettersDB.length; l++) if (lettersDB[l].caseId === c.id) relatedLetters++;
  var mapCount = (c.croquisMaps || []).length;

  var msg = "⚠️ کنترل دسترسی و تأیید نهایی حذف پرونده:\n" +
    "متقاضی: " + c.name + " (کدملی: " + toFa(c.nid) + ")\n" +
    "کلاسه: " + toFa(c.code) + "\n" +
    "سوابق مرتبط: " + toFa(relatedLetters) + " نامه دبیرخانه و " + toFa(mapCount) + " نقشه کروکی.\n\n" +
    "آیا از حذف قطعی این پرونده اطمینان کامل دارید؟";
  if (!confirm(msg)) return;

  var deleteHistoryToo = confirm("آیا نامه‌های ثبت‌شده این متقاضی در دفتر اندیکاتور نیز حذف شوند؟ (برای حفظ سوابق دبیرخانه روی Cancel کلیک کنید)");
  var lettersToDelete = deleteHistoryToo
    ? lettersDB.filter(function(item) { return item.caseId === c.id; })
    : [];
  // پیش از حذف، ثبت دائمی انجام می‌شود تا نسخه‌های قدیمی Drive یا مرورگر نتوانند پرونده را زنده کنند.
  if (!recordNezamDeletions([c], lettersToDelete)) {
    alert("ثبت سابقه حذف در حافظه مرورگر ناموفق بود؛ برای جلوگیری از بازگشت پرونده، حذف انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.");
    return;
  }
  if (deleteHistoryToo) {
    lettersDB = lettersDB.filter(function(item) { return item.caseId !== c.id; });
  }

  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === c.id) {
      casesDB.splice(i, 1);
      break;
    }
  }
  activeCaseId = casesDB[0].id;
  var caseDeleteSaved = saveAllDB();
  loadActiveCaseIntoForm();
  if (typeof window.syncDeletionToDrive === "function") window.syncDeletionToDrive();
  showToastMsg(caseDeleteSaved
    ? "پرونده حذف و در فهرست حذف دائمی ثبت شد."
    : "حذف در فهرست حذف دائمی ثبت شد، اما ذخیره یکی از بخش‌های مرورگر خطا داد؛ وضعیت ذخیره‌سازی را بررسی کنید.", !caseDeleteSaved);
}

/* جدول فهرست جامع و جستجوی پیشرفته متقاضیان در ۳ گروه تخصصی */
function renderApplicantsDirectoryTable() {
  var tbody = document.getElementById("applicants-directory-tbody");
  if (!tbody) return;

  var q = toEn((document.getElementById("adv-search-q") || {}).value || "").trim().toLowerCase();
  var fGroup = (document.getElementById("adv-filter-group") || {}).value || "ALL";
  var fEntity = (document.getElementById("adv-filter-entity") || {}).value || "ALL";
  var fStatus = (document.getElementById("adv-filter-status") || {}).value || "ALL";
  var fDate = toEn((document.getElementById("adv-filter-date") || {}).value || "").trim();

  var countG1 = 0, countG2 = 0, countG3 = 0;
  for (var k = 0; k < casesDB.length; k++) {
    if (casesDB[k].mainGroup === "GREENHOUSE_MUSHROOM") countG1++;
    else if (casesDB[k].mainGroup === "CLINIC_PHARMACY") countG3++;
    else countG2++;
  }
  var b1 = document.getElementById("badge-count-g1"); if (b1) b1.textContent = toFa(countG1);
  var b2 = document.getElementById("badge-count-g2"); if (b2) b2.textContent = toFa(countG2);
  var b3 = document.getElementById("badge-count-g3"); if (b3) b3.textContent = toFa(countG3);

  var statusMap = {
    ACTIVE: { txt: "فعال", cls: "bg-success" },
    IN_PROGRESS: { txt: "در جریان استعلام", cls: "bg-warning text-dark" },
    APPROVED: { txt: "دارای مجوز/مصوب", cls: "bg-primary" },
    ARCHIVED: { txt: "راکد / بایگانی", cls: "bg-secondary" }
  };

  var html = "";
  var matched = 0;
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    if (fGroup !== "ALL" && c.mainGroup !== fGroup) continue;
    if (fEntity !== "ALL" && (c.entityType || "INDIVIDUAL") !== fEntity) continue;
    if (fStatus !== "ALL" && (c.caseStatus || "ACTIVE") !== fStatus) continue;
    if (fDate && toEn(c.issueDate || "").indexOf(fDate) === -1) continue;

    var searchHay = toEn([c.code, c.name, c.nid, c.mobile, c.project, c.loc, c.landParcel || "", c.repName || "", c.regNo || ""].join(" ")).toLowerCase();
    if (q && searchHay.indexOf(q) === -1) continue;

    matched++;
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var stMeta = statusMap[c.caseStatus || "ACTIVE"] || statusMap.ACTIVE;
    var entTitle = c.entityType === "LEGAL" ? "🏢 حقوقی" : (c.entityType === "ORG" ? "🏛️ سازمانی" : "👤 حقیقی");
    var mapsCount = (c.croquisMaps || []).length;
    var safeId = escapeHtmlCore(c.id);

    html += '<tr class="' + (c.id === activeCaseId ? 'table-success border-success' : '') + '">' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td class="text-start">' +
        '<b>' + escapeHtmlCore(c.name) + '</b> ' +
        '<span class="badge bg-light text-dark border">' + entTitle + '</span><br>' +
        '<small class="text-muted">کدملی/شناسه: <b>' + escapeHtmlCore(toFa(c.nid)) + '</b> | تماس: ' + escapeHtmlCore(toFa(c.mobile || "---")) + '</small>' +
        (c.repName ? '<br><small class="text-primary">نماینده/مدیرعامل: ' + escapeHtmlCore(c.repName) + '</small>' : '') +
      '</td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + escapeHtmlCore(grpMeta.shortTitle) + '</span></td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.project) + '</b><br><small class="text-muted">ظرفیت: ' + escapeHtmlCore(toFa(c.cap)) + ' | زمین: ' + escapeHtmlCore(toFa(c.land)) + ' م.م</small></td>' +
      '<td class="text-start"><small class="fw-bold text-success">' + escapeHtmlCore(c.loc) + '</small><br><small class="text-primary">پلاک ثبتی: ' + escapeHtmlCore(toFa(c.landParcel || "---")) + '</small><br><small class="text-muted">تاریخ ثبت: ' + escapeHtmlCore(toFa(c.issueDate)) + '</small></td>' +
      '<td><span class="badge ' + stMeta.cls + '">' + stMeta.txt + '</span><br><small class="text-muted">' + escapeHtmlCore(toFa(mapsCount)) + ' نقشه کروکی</small></td>' +
      '<td>' +
        '<div class="d-flex gap-1 justify-content-center flex-wrap">' +
          '<button type="button" class="btn btn-sm ' + (c.id === activeCaseId ? 'btn-success' : 'btn-outline-success') + ' fw-bold py-0 px-2" data-case-action="select" data-case-id="' + safeId + '">' + (c.id === activeCaseId ? '✔ فعال (ویرایش)' : 'انتخاب پرونده') + '</button>' +
          '<button type="button" class="btn btn-sm btn-outline-primary fw-bold py-0 px-2" data-case-action="croquis" data-case-id="' + safeId + '">🗺️ کروکی</button>' +
          '<button type="button" class="btn btn-sm btn-outline-dark fw-bold py-0 px-2" data-case-action="letters" data-case-id="' + safeId + '">📨 نامه</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  tbody.innerHTML = html || '<tr><td colspan="7" class="text-center py-4 text-muted">هیچ متقاضی با فیلترهای انتخاب‌شده یافت نشد.</td></tr>';
  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-case-action]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-case-id");
      var action = btn.getAttribute("data-case-action");
      var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
      if (!exists) return;
      selectActiveCase(id);
      if (action === "croquis") switchMainPane("pane-croquis");
      else if (action === "letters") switchMainPane("pane-letters");
      else if (action === "select") switchCaseSubTab("sub-info");
    });
  }
  var matchCountEl = document.getElementById("adv-search-count-badge");
  if (matchCountEl) matchCountEl.textContent = toFa(matched) + " پرونده";
}
function filterDirectoryByMainGroupCard(grpCode) {
  var sel = document.getElementById("adv-filter-group");
  if (sel) sel.value = grpCode;
  switchMainPane("pane-cases");
  switchCaseSubTab("sub-list");
  renderApplicantsDirectoryTable();
}

function renderActiveCaseHistory() {
  var c = getActiveCase();
  var tbody = document.getElementById("case-history-tbody");
  if (!tbody || !c) return;
  var list = Array.isArray(c.history) ? c.history : [];
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var item = list[i] || {};
    html += '<tr>' +
      '<td class="text-center fw-bold">' + escapeHtmlCore(toFa(i + 1)) + '</td>' +
      '<td class="fw-bold text-primary">' + escapeHtmlCore(toFa(item.date)) + '</td>' +
      '<td>' + escapeHtmlCore(item.action) + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + escapeHtmlCore(item.by || "مرکز ۶۳۶") + '</span></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="4" class="text-center text-muted py-3">سابقه‌ای ثبت نشده است.</td></tr>';
}
function addManualHistoryNoteToCase() {
  var c = getActiveCase();
  if (!c) return;
  var inp = document.getElementById("new-history-note-input");
  var txt = (inp ? inp.value : "").trim();
  if (!txt) { alert("شرح اقدام انجام‌شده را وارد نمایید."); return; }
  logCaseAction(c, txt);
  if (inp) inp.value = "";
  saveAllDB();
  renderActiveCaseHistory();
  showToastMsg("اقدام جدید در سوابق پرونده ثبت شد.");
}

function addCustomFieldToActiveCase() {
  var c = getActiveCase();
  if (!c) return;
  var lbl = prompt("عنوان فیلد سفارشی جدید برای این پرونده را وارد کنید (مثلاً: شماره پلاک ثبتی، فاصله تا روستا):");
  if (!lbl || !lbl.trim()) return;
  var val = prompt("مقدار «" + lbl.trim() + "» را وارد نمایید:") || "";
  if (!c.customFields) c.customFields = [];
  c.customFields.push({ label: lbl.trim(), value: val.trim() });
  saveAllDB();
  renderCustomFieldsSummary();
  if (typeof syncLetterEditorWithActiveCase === "function") syncLetterEditorWithActiveCase();
}

function renderCustomFieldsSummary() {
  var c = getActiveCase();
  var el = document.getElementById("c-custom-fields-summary");
  if (!el || !c) return;
  var list = Array.isArray(c.customFields) ? c.customFields : [];
  if (!list.length) { el.textContent = ""; return; }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var field = list[i] || {};
    html += '<span class="badge bg-secondary me-1">' + escapeHtmlCore(field.label) + ': ' + escapeHtmlCore(toFa(field.value)) +
      ' <span style="cursor:pointer;color:#fca5a5;" onclick="getActiveCase().customFields.splice(' + i + ',1);saveAllDB();renderCustomFieldsSummary();">✕</span></span>';
  }
  el.innerHTML = html;
}
function copyCaseFieldLatin(inputId, title) {
  var el = document.getElementById(inputId);
  if (!el) return;
  var val = toEn(el.value.trim());
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val);
  showToastMsg(title + " کپی شد: " + val.split("\n")[0]);
}

/* =========================================================================
   ۶. ماتریس یکپارچه پیگیری پاسخ ۷ استعلام هر پرونده (بدون دکمه چاپ ۶ نامه)
   ========================================================================= */
var INQ_STATUS_ORDER = ["NONE", "WAIT", "OK", "REJ"];
var INQ_STATUS_STYLE = {
  NONE: { txt: "⚪ ارسال نشده", cls: "btn-light border text-secondary" },
  WAIT: { txt: "🟡 منتظر پاسخ", cls: "btn-warning text-dark" },
  OK:   { txt: "🟢 موافقت شد", cls: "btn-success text-white" },
  REJ:  { txt: "🔴 مخالفت/نقص", cls: "btn-danger text-white" }
};

function toggleCaseInquiryStatus(caseId, agencyKey) {
  for (var i = 0; i < casesDB.length; i++) {
    if (casesDB[i].id === caseId) {
      if (!casesDB[i].inquiries) casesDB[i].inquiries = {};
      var cur = casesDB[i].inquiries[agencyKey] || "NONE";
      var next = INQ_STATUS_ORDER[(INQ_STATUS_ORDER.indexOf(cur) + 1) % INQ_STATUS_ORDER.length];
      casesDB[i].inquiries[agencyKey] = next;
      logCaseAction(casesDB[i], "تغییر وضعیت استعلام (" + agencyKey + ") به " + INQ_STATUS_STYLE[next].txt);
      break;
    }
  }
  saveAllDB();
}

function renderUnifiedCasesMatrix() {
  var tbody = document.getElementById("unified-matrix-tbody");
  if (!tbody) return;
  var q = toFa((document.getElementById("matrix-filter-input") || {}).value || "").trim().toLowerCase();
  var agencies = ["water", "elec", "road", "gas", "env", "natres", "vet"];
  var html = "";

  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    var hay = [c.code, c.name, c.nid, c.project, c.loc].join(" ").toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var inq = c.inquiries || {};
    var okCount = 0;
    var cells = "";
    var safeId = escapeHtmlCore(c.id);
    for (var a = 0; a < agencies.length; a++) {
      var agencyKey = agencies[a];
      var st = inq[agencyKey] || "NONE";
      if (st === "OK") okCount++;
      var meta = INQ_STATUS_STYLE[st] || INQ_STATUS_STYLE.NONE;
      cells += '<td><button type="button" class="btn btn-sm ' + meta.cls + ' fw-bold py-1 px-2" style="font-size:0.73rem;white-space:nowrap;" data-case-action="inquiry" data-case-id="' + safeId + '" data-inquiry-key="' + agencyKey + '">' + escapeHtmlCore(meta.txt) + '</button></td>';
    }

    var pct = Math.round((okCount / agencies.length) * 100);
    html += '<tr class="' + (c.id === activeCaseId ? 'table-active' : '') + '">' +
      '<td class="fw-bold">' + escapeHtmlCore(toFa(c.code)) + '</td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.name) + '</b><br><small class="text-muted">کدملی: ' + escapeHtmlCore(toFa(c.nid)) + '</small><br><small class="text-success fw-bold">' + escapeHtmlCore(c.loc) + '</small></td>' +
      '<td class="text-start"><b>' + escapeHtmlCore(c.project) + '</b><br><small class="text-muted">ظرفیت: ' + escapeHtmlCore(toFa(c.cap)) + ' | ' + escapeHtmlCore(toFa(c.land)) + ' م.م</small></td>' +
      cells +
      '<td><span class="badge ' + (pct === 100 ? 'bg-success' : 'bg-primary') + '">' + escapeHtmlCore(toFa(pct)) + '٪ (' + escapeHtmlCore(toFa(okCount)) + '/۷)</span></td>' +
      '<td><small class="fw-bold text-danger">' + escapeHtmlCore(toFa(c.expDate || "۱۴۰۵/۰۸/۱۳")) + '</small></td>' +
      '<td><div class="d-flex gap-1 justify-content-center">' +
        '<button type="button" class="btn btn-sm btn-outline-success fw-bold" data-case-action="letters" data-case-id="' + safeId + '" data-tip="صدور نامه استعلام برای این پرونده">📨 صدور نامه</button>' +
        '<button type="button" class="btn btn-sm btn-outline-dark fw-bold" data-case-action="binder" data-case-id="' + safeId + '" data-tip="چاپ لیبل عطف زونکن">🏷️ لیبل</button>' +
      '</div></td></tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="13" class="py-3 text-muted">موردی یافت نشد.</td></tr>';

  if (!tbody.dataset.secureActionsBound) {
    tbody.dataset.secureActionsBound = "1";
    tbody.addEventListener("click", function (event) {
      var btn = event.target.closest("button[data-case-action]");
      if (!btn || !tbody.contains(btn)) return;
      var id = btn.getAttribute("data-case-id");
      var action = btn.getAttribute("data-case-action");
      var item = casesDB.find(function (record) { return record && String(record.id) === id; });
      if (!item) return;
      if (action === "inquiry") {
        var key = btn.getAttribute("data-inquiry-key");
        if (agencies.indexOf(key) === -1) return;
        toggleCaseInquiryStatus(id, key);
      } else {
        selectActiveCase(id);
        if (action === "letters") switchMainPane("pane-letters");
        else if (action === "binder") printOfficialForm("BINDER_LABEL");
      }
    });
  }
}
function openFilesDB(cb) {
  var settled = false;
  var timer = setTimeout(function() { finish(null); }, 4500);
  function finish(db) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try { cb(db || null); }
    catch (callbackError) { console.error("IndexedDB callback failed:", callbackError); }
  }

  if (idbInstance) {
    try {
      // دسترسی به transaction هم وضعیت بسته‌شدن DB را آشکار می‌کند.
      idbInstance.transaction(["docs"], "readonly");
      return finish(idbInstance);
    } catch (closedError) {
      try { idbInstance.close(); } catch (e) {}
      idbInstance = null;
    }
  }
  if (!window.indexedDB) return finish(null);

  var req;
  try {
    req = window.indexedDB.open("Nezam636_UnifiedFiles_DB", 1);
  } catch (openError) {
    console.warn("Could not open local document database:", openError);
    return finish(null);
  }
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs", { keyPath: "key" });
  };
  req.onsuccess = function(e) {
    var db = e.target.result;
    idbInstance = db;
    db.onversionchange = function() {
      try { db.close(); } catch (closeError) {}
      if (idbInstance === db) idbInstance = null;
    };
    finish(db);
  };
  req.onerror = function() {
    console.warn("IndexedDB open failed:", req.error || "unknown error");
    finish(null);
  };
  req.onblocked = function() {
    console.warn("IndexedDB open is blocked by another tab or connection.");
    finish(null);
  };
}

function getUploadedDocsForCase(caseId, cb) {
  var completed = false;
  var fallbackTimer = setTimeout(function() {
    if (completed) return;
    completed = true;
    console.warn("Local document lookup timed out; continuing with Google Drive inventory.");
    cb({});
  }, 5000);

  function finish(map) {
    if (completed) return;
    completed = true;
    clearTimeout(fallbackTimer);
    cb(map || {});
  }

  openFilesDB(function(db) {
    if (!db) return finish({});
    var tx;
    try {
      tx = db.transaction(["docs"], "readonly");
      var req = tx.objectStore("docs").getAll();
      req.onsuccess = function(e) {
        var list = e.target.result || [];
        var map = {};
        for (var i = 0; i < list.length; i++) {
          if (String(list[i].caseId) === String(caseId)) map[list[i].docCode] = list[i];
        }
        finish(map);
      };
      req.onerror = function() { finish({}); };
      tx.onerror = function() { finish({}); };
      tx.onabort = function() { finish({}); };
    } catch (readError) {
      console.warn("Local document lookup failed:", readError);
      finish({});
    }
  });
}

function uploadCaseDocFile(event, docCode, docTitle, replaceFileId) {
  var input = event && event.target;
  var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
  if (!files.length) return false;
  var active = requireActiveCase("بارگذاری فایل مدرک در پرونده");
  if (!active) { if (input) input.value = ""; return false; }

  if (window.NezamDriveDocuments && typeof window.NezamDriveDocuments.uploadFiles === "function") {
    var context = {
      caseId: String(active.id),
      fullName: String(active.name || ""),
      nationalCode: String(active.nid || active.code || ""),
      docCode: String(docCode || "OTHER"),
      docTitle: String(docTitle || "سایر مدارک"),
      replaceFileId: String(replaceFileId || "")
    };
    if (context.replaceFileId && files.length !== 1) {
      alert("برای جایگزینی فقط یک فایل انتخاب کنید.");
      if (input) input.value = "";
      return false;
    }
    window.NezamDriveDocuments.uploadFiles(files, context).then(function(result) {
      var successCount = result.successes ? result.successes.length : 0;
      var failureCount = result.failures ? result.failures.length : 0;
      if (typeof showToastMsg === "function") {
        showToastMsg(failureCount
          ? successCount + " فایل در Drive ذخیره شد؛ " + failureCount + " فایل ناموفق بود. جزئیات را در گزارش بارگذاری ببینید."
          : successCount + " فایل با موفقیت در Google Drive ذخیره شد.", !!failureCount);
      }
      if (failureCount) console.warn("Drive document upload failures:", result.failures);
      if (typeof renderActiveCaseDocsChecklist === "function") renderActiveCaseDocsChecklist();
    }).catch(function(error) {
      console.error("Drive document upload failed:", error);
      if (typeof showToastMsg === "function") showToastMsg(error.message || "بارگذاری در Google Drive ناموفق بود.", true);
      else alert(error.message || "بارگذاری در Google Drive ناموفق بود.");
    }).finally(function() {
      if (input) input.value = "";
    });
    return true;
  }

  // برای جلوگیری از ثبت اشتباه مدرک به‌عنوان «تحویل‌شده»، در نبود ماژول Drive فایل جدید فقط محلی ذخیره نمی‌شود.
  if (typeof showToastMsg === "function") showToastMsg("اتصال بایگانی Google Drive آماده نیست؛ فایل بارگذاری نشد. صفحه را تازه‌سازی کنید و وضعیت اتصال را بررسی کنید.", true);
  if (input) input.value = "";
  return false;
}

function uploadCaseDocFileLegacy(event, docCode, docTitle) {
  var input = event && event.target;
  var file = input && input.files ? input.files[0] : null;
  if (!file) return;
  var active = requireActiveCase("بارگذاری فایل مدرک در پرونده");
  if (!active) { input.value = ""; return; }

  var extensionMatch = String(file.name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  var extension = extensionMatch ? extensionMatch[1] : "";
  var allowedTypes = {
    pdf: ["application/pdf"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"]
  };
  var accepted = allowedTypes[extension];
  var mime = String(file.type || "").toLowerCase();
  if (!accepted || (mime && accepted.indexOf(mime) === -1)) {
    alert("فقط فایل‌های PDF، JPG، PNG و WEBP قابل بارگذاری هستند.");
    input.value = "";
    return;
  }
  if (file.size <= 0 || file.size > 12 * 1024 * 1024) {
    alert("حجم هر مدرک باید بیشتر از صفر و حداکثر ۱۲ مگابایت باشد.");
    input.value = "";
    return;
  }

  // بررسی امضای ابتدایی فایل؛ پسوند به‌تنهایی قابل جعل است.
  var signatureReader = new FileReader();
  signatureReader.onerror = function () {
    alert("بررسی نوع واقعی فایل ناموفق بود.");
    input.value = "";
  };
  signatureReader.onload = function(signatureEvent) {
    var bytes = new Uint8Array(signatureEvent.target.result || new ArrayBuffer(0));
    var validSignature = false;
    if (extension === "pdf") {
      validSignature = bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
    } else if (extension === "jpg" || extension === "jpeg") {
      validSignature = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    } else if (extension === "png") {
      validSignature = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
    } else if (extension === "webp") {
      validSignature = bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    }
    if (!validSignature) {
      alert("محتوای واقعی فایل با پسوند انتخاب‌شده مطابقت ندارد.");
      input.value = "";
      return;
    }

    var reader = new FileReader();
    reader.onerror = function () {
      alert("خواندن فایل ناموفق بود. فایل را دوباره انتخاب کنید.");
      input.value = "";
    };
    reader.onload = function(e) {
      if (!e.target || typeof e.target.result !== "string" || e.target.result.indexOf("data:") !== 0) {
        alert("محتوای فایل معتبر نیست.");
        input.value = "";
        return;
      }
      openFilesDB(function(db) {
        if (!db) {
          alert("مخزن فایل‌های مرورگر در دسترس نیست.");
          input.value = "";
          return;
        }
        try {
          var tx = db.transaction(["docs"], "readwrite");
          tx.objectStore("docs").put({
            key: active.id + "__" + docCode,
            caseId: active.id,
            docCode: docCode,
            docTitle: docTitle,
            fileName: String(file.name || "document." + extension).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 140),
            uploadDate: todayShamsi(),
            dataUrl: e.target.result,
            rawBlob: file
          });
          tx.oncomplete = function() {
            logCaseAction(active, "بارگذاری مدرک «" + docTitle + "» (" + file.name + ")");
            saveAllDB();
            renderActiveCaseDocsChecklist();
            showToastMsg("فایل «" + docTitle + "» در پرونده «" + active.name + "» ذخیره شد.");
            input.value = "";
          };
          tx.onerror = function() {
            alert("ذخیره فایل در مرورگر ناموفق بود. فضای ذخیره‌سازی را بررسی کنید.");
            input.value = "";
          };
        } catch (storageError) {
          console.error("Document storage failed:", storageError);
          alert("ذخیره فایل انجام نشد؛ احتمالاً فضای کافی در مرورگر وجود ندارد.");
          input.value = "";
        }
      });
    };
    reader.readAsDataURL(file);
  };
  signatureReader.readAsArrayBuffer(file.slice(0, 12));
}

function downloadCaseDocFile(docCode) {
  var c = getActiveCase();
  if (!c) return;
  getUploadedDocsForCase(c.id, function(map) {
    var rec = map[docCode];
    if (!rec || !rec.dataUrl) return;
    var a = document.createElement("a");
    a.href = rec.dataUrl;
    a.download = rec.fileName;
    a.click();
  });
}

function removeCaseDocFile(docCode) {
  var c = getActiveCase();
  if (!c) return;
  if (!confirm("فایل بارگذاری‌شده حذف شود؟")) return;
  openFilesDB(function(db) {
    if (!db) return;
    var tx = db.transaction(["docs"], "readwrite");
    tx.objectStore("docs").delete(c.id + "__" + docCode);
    tx.oncomplete = function() { renderActiveCaseDocsChecklist(); };
  });
}

function addCustomDocToChecklist() {
  var c = requireActiveCase("افزودن مدرک به چک‌لیست");
  if (!c) return;
  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var grp = sp.docGroup || "LIVESTOCK";
  var title = prompt("عنوان مدرک جدید مورد نیاز را وارد نمایید:");
  if (!title || !title.trim()) return;
  var ref = prompt("مرجع یا ماده قانونی مربوط به این مدرک (اختیاری):", "ضوابط اختصاصی مرکز ۶۳۶") || "";
  if (!DOC_CHECKLISTS[grp]) DOC_CHECKLISTS[grp] = [];
  DOC_CHECKLISTS[grp].push({ code: "CDOC_" + new Date().getTime(), title: title.trim(), mandatory: true, legalRef: ref.trim() });
  saveAllDB();
  renderActiveCaseDocsChecklist();
}

function renderActiveCaseDocsChecklist() {
  var c = getActiveCase();
  var tbody = document.getElementById("case-docs-tbody");
  var banner = document.getElementById("case-missing-docs-banner");
  var folderLbl = document.getElementById("drive-folder-label");
  var toolbar = document.getElementById("case-docs-drive-toolbar");
  var libraryBox = document.getElementById("case-docs-file-library");
  var libraryBody = document.getElementById("case-docs-library-tbody");
  var librarySummary = document.getElementById("case-docs-library-summary");
  if (!tbody || !banner) return;

  if (!c) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3 fw-bold">ابتدا یک متقاضی را انتخاب نمایید.</td></tr>';
    banner.textContent = "";
    if (toolbar) toolbar.style.display = "none";
    if (librarySummary) librarySummary.textContent = "ابتدا یک متقاضی را انتخاب کنید.";
    if (libraryBody) libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">پرونده‌ای انتخاب نشده است.</td></tr>';
    return;
  }

  if (toolbar) toolbar.style.display = "";
  var safeFolder = (c.name + " - " + toEn(c.nid || "000")).replace(/[\\/:*?"<>|]/g, "_");
  if (folderLbl) folderLbl.textContent = "📁 بایگانی ابری متقاضی: " + safeFolder;

  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

  function bindToolbar() {
    if (!toolbar || toolbar.dataset.bound === "1") return;
    toolbar.dataset.bound = "1";
    var select = document.getElementById("case-doc-bulk-code");
    var fileInput = document.getElementById("case-doc-bulk-files");
    var uploadBtn = document.getElementById("case-doc-bulk-upload");
    var migrateBtn = document.getElementById("case-doc-migrate-legacy");
    var retryBtn = document.getElementById("case-doc-retry-failed");
    if (retryBtn) retryBtn.addEventListener("click", async function() {
      if (!window.NezamDriveDocuments || !window.NezamDriveDocuments.retryFailed) return;
      retryBtn.disabled = true;
      try {
        var result = await window.NezamDriveDocuments.retryFailed();
        var failed = result.failures ? result.failures.length : 0;
        showToastMsg((result.successes ? result.successes.length : 0) + " فایل در تلاش مجدد ذخیره شد." +
          (failed ? " " + failed + " فایل همچنان ناموفق است." : ""), !!failed);
        renderActiveCaseDocsChecklist();
      } catch (error) {
        showToastMsg(error.message || "تلاش مجدد ناموفق بود.", true);
      } finally {
        retryBtn.disabled = false;
      }
    });
    var searchInput = document.getElementById("case-doc-search");
    if (searchInput) searchInput.addEventListener("input", function() {
      var query = String(searchInput.value || "").trim().toLocaleLowerCase();
      var tableRows = tbody.querySelectorAll("tr");
      for (var ri = 0; ri < tableRows.length; ri++) {
        var haystack = String(tableRows[ri].textContent || "").toLocaleLowerCase();
        tableRows[ri].style.display = !query || haystack.indexOf(query) !== -1 ? "" : "none";
      }
    });
    if (uploadBtn) uploadBtn.addEventListener("click", function() {
      var option = select && select.options[select.selectedIndex];
      if (!option || !option.value) {
        showToastMsg("ابتدا عنوان مدرک را انتخاب کنید.", true);
        return;
      }
      if (!fileInput || !fileInput.files || !fileInput.files.length) {
        showToastMsg("ابتدا یک یا چند فایل انتخاب کنید.", true);
        return;
      }
      uploadCaseDocFile({ target: fileInput }, option.value, option.textContent || "سایر مدارک");
    });
    if (fileInput) fileInput.addEventListener("change", function() {
      var label = document.getElementById("case-doc-bulk-file-label");
      if (label) label.textContent = fileInput.files.length
        ? toFa(fileInput.files.length) + " فایل انتخاب شده"
        : "هنوز فایلی انتخاب نشده است";
    });
    if (migrateBtn) migrateBtn.addEventListener("click", async function() {
      if (!window.NezamDriveDocuments || !window.NezamDriveDocuments.migrateLegacyDocs) {
        showToastMsg("ابزار انتقال فایل‌های قدیمی بارگذاری نشده است.", true);
        return;
      }
      var button = migrateBtn;
      button.disabled = true;
      try {
        var ctx = window.NezamDriveDocuments.getCaseContext();
        var result = await window.NezamDriveDocuments.migrateLegacyDocs(ctx);
        var failed = result.failures ? result.failures.length : 0;
        showToastMsg((result.successes ? result.successes.length : 0) + " فایل قدیمی منتقل شد." +
          (failed ? " " + failed + " فایل منتقل نشد؛ جزئیات در گزارش فنی موجود است." : ""), !!failed);
        if (failed) console.warn("Legacy document migration failures:", result.failures);
        renderActiveCaseDocsChecklist();
      } catch (error) {
        showToastMsg(error.message || "انتقال مدارک قدیمی ناموفق بود.", true);
      } finally {
        button.disabled = false;
      }
    });
  }

  bindToolbar();
  if (librarySummary) librarySummary.textContent = "در حال دریافت فهرست فایل‌های متقاضی از Google Drive...";
  if (libraryBody) libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">⏳ در حال بارگذاری فهرست اسناد...</td></tr>';
  var legacyBoxHandler = document.getElementById("case-docs-legacy-files");
  if (legacyBoxHandler && legacyBoxHandler.dataset.bound !== "1") {
    legacyBoxHandler.dataset.bound = "1";
    legacyBoxHandler.addEventListener("click", function(event) {
      var btn = event.target && event.target.closest ? event.target.closest("button[data-legacy-delete]") : null;
      if (!btn) return;
      var fileId = btn.getAttribute("data-legacy-delete");
      var current = getActiveCase();
      if (!fileId || !current || !window.NezamDriveDocuments) return;
      if (!confirm("این فایل قدیمی از پوشه Google Drive متقاضی حذف شود؟")) return;
      btn.disabled = true;
      window.NezamDriveDocuments.remove(fileId, {
        caseId: String(current.id), fullName: String(current.name || ""),
        nationalCode: String(current.nid || current.code || "")
      }).catch(function(error) {
        showToastMsg(error.message || "حذف فایل قدیمی ناموفق بود.", true);
      }).finally(function() { renderActiveCaseDocsChecklist(); });
    });
  }
  if (libraryBox && libraryBox.dataset.actionsBound !== "1") {
    libraryBox.dataset.actionsBound = "1";
    libraryBox.addEventListener("click", function(event) {
      var refresh = event.target && event.target.closest ? event.target.closest("#case-docs-refresh-library") : null;
      if (refresh) {
        refresh.disabled = true;
        renderActiveCaseDocsChecklist();
        setTimeout(function() { refresh.disabled = false; }, 1200);
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest("button[data-library-action]") : null;
      if (!button || !libraryBox.contains(button)) return;
      var action = button.getAttribute("data-library-action");
      var fileId = button.getAttribute("data-file-id");
      var current = getActiveCase();
      if (!current || !fileId || !window.NezamDriveDocuments) return;
      if (action === "delete") {
        if (!confirm("فایل انتخاب‌شده از Google Drive حذف شود؟")) return;
        button.disabled = true;
        window.NezamDriveDocuments.remove(fileId, {
          caseId: String(current.id), fullName: String(current.name || ""),
          nationalCode: String(current.nid || current.code || "")
        }).catch(function(error) {
          showToastMsg(error.message || "حذف فایل ناموفق بود.", true);
        }).finally(function() {
          renderActiveCaseDocsChecklist();
        });
      }
    });
    libraryBox.addEventListener("change", function(event) {
      var input = event.target && event.target.closest
        ? event.target.closest('input[data-library-action="replace"]') : null;
      if (!input || !libraryBox.contains(input)) return;
      var current = getActiveCase();
      var code = input.getAttribute("data-doc-code");
      var title = input.getAttribute("data-doc-title");
      var fileId = input.getAttribute("data-file-id");
      if (!current || !code || !title || !fileId || !input.files || !input.files.length) return;
      if (input.files.length !== 1) {
        showToastMsg("برای جایگزینی هر فایل، فقط یک فایل جدید انتخاب کنید.", true);
        input.value = "";
        return;
      }
      uploadCaseDocFile({ target: input }, code, title, fileId);
    });
  }

  var bulkSelect = document.getElementById("case-doc-bulk-code");
  if (bulkSelect) {
    var selectedBulk = bulkSelect.value;
    bulkSelect.innerHTML = reqDocs.map(function(doc) {
      return '<option value="' + escapeHtmlCore(doc.code) + '">' + escapeHtmlCore(doc.title) + '</option>';
    }).join("");
    if (selectedBulk && reqDocs.some(function(doc) { return String(doc.code) === selectedBulk; })) bulkSelect.value = selectedBulk;
  }

  if (!tbody.dataset.secureDocActionsBound) {
    tbody.dataset.secureDocActionsBound = "1";
    tbody.addEventListener("change", function(event) {
      var input = event.target && event.target.closest
        ? event.target.closest('input[data-doc-action="upload"],input[data-doc-action="replace"]') : null;
      if (!input || !tbody.contains(input)) return;
      var code = input.getAttribute("data-doc-code");
      var title = input.getAttribute("data-doc-title");
      var action = input.getAttribute("data-doc-action");
      var oldFileId = action === "replace" ? input.getAttribute("data-file-id") : "";
      var current = getActiveCase();
      if (!current || !code || !title) return;
      var currentSpec = ACT_SPECS[current.actType] || ACT_SPECS.sheep_high;
      var allowedDocs = DOC_CHECKLISTS[currentSpec.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;
      if (!allowedDocs.some(function(doc) { return doc && String(doc.code) === code; })) return;
      uploadCaseDocFile(event, code, title, oldFileId);
    });

    tbody.addEventListener("click", function(event) {
      var btn = event.target && event.target.closest
        ? event.target.closest("button[data-doc-action]") : null;
      if (!btn || !tbody.contains(btn)) return;
      var code = btn.getAttribute("data-doc-code");
      var action = btn.getAttribute("data-doc-action");
      var fileId = btn.getAttribute("data-file-id");
      var current = getActiveCase();
      if (!current || !code) return;
      var currentSpec = ACT_SPECS[current.actType] || ACT_SPECS.sheep_high;
      var allowedDocs = DOC_CHECKLISTS[currentSpec.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;
      if (!allowedDocs.some(function(doc) { return doc && String(doc.code) === code; })) return;

      if (action === "remove-file") {
        if (!fileId || !window.NezamDriveDocuments) return;
        if (!confirm("این فایل به‌صورت دائمی از بایگانی Google Drive حذف شود؟ فایل به سطل زباله Drive منتقل خواهد شد.")) return;
        var context = { caseId: String(current.id), fullName: String(current.name || ""), nationalCode: String(current.nid || current.code || "") };
        btn.disabled = true;
        window.NezamDriveDocuments.remove(fileId, context).catch(function(error) {
          showToastMsg(error.message || "حذف فایل از Drive ناموفق بود.", true);
        }).finally(function() {
          btn.disabled = false;
          renderActiveCaseDocsChecklist();
        });
      } else if (action === "download-local") {
        downloadCaseDocFile(code);
      }
    });
  }

  function renderDriveLibrary(cloudFiles, cloudError, folderUrl) {
    if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;
    if (libraryBody) {
      if (cloudError) {
        libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">دریافت فهرست فایل‌ها ناموفق بود: ' +
          escapeHtmlCore(cloudError) + '<br><small>اتصال و دسترسی Google Drive را بررسی کنید.</small></td></tr>';
      } else if (!cloudFiles || !cloudFiles.length) {
        libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">هنوز فایلی در پوشه Google Drive این متقاضی پیدا نشد.</td></tr>';
      } else {
        var ordered = cloudFiles.slice().sort(function(a,b) {
          return Number(b.updatedAt || b.uploadedAt || 0) - Number(a.updatedAt || a.uploadedAt || 0);
        });
        libraryBody.innerHTML = ordered.map(function(file) {
          var fileId = String(file.fileId || file.id || "");
          var safeId = escapeHtmlCore(fileId);
          var rawName = String(file.fileName || file.name || "بدون نام");
          var fileName = escapeHtmlCore(rawName);
          var docTitle = escapeHtmlCore(file.docTitle || "فایل قدیمی / پیوست");
          var docCode = escapeHtmlCore(file.docCode || "LEGACY");
          var ext = rawName.match(/\.([^.]+)$/);
          var typeLabel = escapeHtmlCore((ext ? ext[1].toUpperCase() + " · " : "") + String(file.mimeType || "نوع نامشخص"));
          var size = Math.max(0, Number(file.size || 0));
          var sizeLabel = size >= 1073741824 ? (size/1073741824).toFixed(2)+" GB" :
            (size >= 1048576 ? (size/1048576).toFixed(2)+" MB" : (size ? Math.max(1,Math.round(size/1024))+" KB" : "—"));
          var stamp = Number(file.uploadedAt || file.updatedAt || 0);
          var dateLabel = stamp ? new Date(stamp).toLocaleString("fa-IR") : "—";
          var version = Math.max(1,Number(file.version || 1));
          var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
          var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
          var links = (viewUrl ? '<a class="btn btn-sm btn-outline-primary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(viewUrl) + '">👁️ مشاهده</a>' : '') +
            (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(downloadUrl) + '">⬇️ دانلود</a>' : '');
          var replace = (!file.legacy && docCode !== "LEGACY")
            ? '<label class="btn btn-sm btn-outline-warning py-0 px-2 m-0">جایگزینی<input type="file" hidden data-library-action="replace" data-file-id="' + safeId + '" data-doc-code="' + docCode + '" data-doc-title="' + docTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"></label>' : '';
          return '<tr class="case-drive-file-row">' +
            '<td><div class="fw-bold">' + fileName + '</div><small class="text-muted">' + docTitle + '</small></td>' +
            '<td><span class="badge bg-light text-dark border">' + typeLabel + '</span></td>' +
            '<td class="text-nowrap">' + escapeHtmlCore(sizeLabel) + '</td>' +
            '<td class="text-nowrap small">' + escapeHtmlCore(dateLabel) + '</td>' +
            '<td class="text-center">' + escapeHtmlCore(toFa(version)) + '</td>' +
            '<td><div class="d-flex flex-wrap gap-1">' + links + replace +
              '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-library-action="delete" data-file-id="' + safeId + '">🗑️ حذف</button>' +
            '</div></td></tr>';
        }).join("");
        var search = document.getElementById("case-doc-search");
        if (search && search.value) {
          var q = String(search.value).trim().toLocaleLowerCase();
          Array.prototype.forEach.call(libraryBody.querySelectorAll(".case-drive-file-row"),function(row) {
            row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(q) !== -1 ? "" : "none";
          });
        }
      }
    }
    if (librarySummary) {
      var total = (cloudFiles || []).reduce(function(sum,file) { return sum + Math.max(0,Number(file.size || 0)); },0);
      var sizeText = total >= 1073741824 ? (total/1073741824).toFixed(2)+" GB" :
        (total >= 1048576 ? (total/1048576).toFixed(2)+" MB" : (total ? Math.max(1,Math.round(total/1024))+" KB" : "۰ بایت"));
      librarySummary.textContent = cloudError
        ? "خطا در دریافت فهرست فایل‌ها"
        : toFa((cloudFiles || []).length)+" فایل · مجموع حجم "+sizeText+" · تازه‌سازی "+new Date().toLocaleTimeString("fa-IR");
    }
    if (folderLbl && folderUrl && /^https:\/\/drive\.google\.com\//.test(folderUrl)) {
      folderLbl.innerHTML = '<a href="' + escapeHtmlCore(folderUrl) + '" target="_blank" rel="noopener noreferrer">📁 بازکردن پوشه اختصاصی در Google Drive</a>';
    }
  }

  var driveListContext = {
    caseId: String(c.id),
    fullName: String(c.name || ""),
    nationalCode: String(c.nid || c.code || "")
  };
  var driveListPromise = window.NezamDriveDocuments && typeof window.NezamDriveDocuments.list === "function"
    ? window.NezamDriveDocuments.list(driveListContext)
    : Promise.reject(new Error("ماژول اتصال بایگانی ابری بارگذاری نشده است."));

  // دریافت و نمایش کتابخانه ابری مستقل از IndexedDB؛ خرابی حافظه محلی نباید دیدن فایل‌های Drive را متوقف کند.
  driveListPromise.then(function(result) {
    renderDriveLibrary(result.documents || [], "", result.folderUrl || "");
  }).catch(function(error) {
    renderDriveLibrary([], error && error.message ? error.message : String(error), "");
  });

  getUploadedDocsForCase(c.id, function(localMap) {
    if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;

    function renderRows(cloudFiles, cloudError, folderUrl) {
      if (!getActiveCase() || String(getActiveCase().id) !== String(c.id)) return;
      var missing = [];
      var rows = "";
      var doneCount = 0;
      var legacyFiles = (cloudFiles || []).filter(function(file) { return file && (file.legacy || file.docCode === "LEGACY"); });
      var managedFiles = (cloudFiles || []).filter(function(file) { return file && !file.legacy && file.docCode !== "LEGACY"; });

      for (var i = 0; i < reqDocs.length; i++) {
        var d = reqDocs[i] || {};
        var safeCode = escapeHtmlCore(d.code);
        var safeTitle = escapeHtmlCore(d.title);
        var filesForDoc = managedFiles.filter(function(file) { return String(file.docCode) === String(d.code); });
        var localFile = localMap[d.code];
        if (filesForDoc.length) doneCount++;
        else missing.push(d.title);

        var statusHtml = filesForDoc.length
          ? '<span class="badge bg-success">✅ در Google Drive (' + escapeHtmlCore(toFa(filesForDoc.length)) + ' فایل)</span>'
          : (localFile
            ? '<span class="badge bg-warning text-dark">⚠️ فقط در این مرورگر؛ هنوز به Drive منتقل نشده</span><br><small>' + escapeHtmlCore(localFile.fileName || "") + '</small>'
            : '<span class="badge bg-danger">❌ مدرک در بایگانی ابری موجود نیست</span>');

        var fileActions = filesForDoc.map(function(file) {
          var safeId = escapeHtmlCore(file.fileId || file.id || "");
          var safeName = escapeHtmlCore(file.fileName || file.name || "فایل");
          var size = Number(file.size || 0);
          var sizeLabel = size ? (size >= 1048576 ? (size / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB") : "";
          var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
          var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
          return '<div class="d-flex flex-wrap align-items-center gap-1 border rounded p-1 mb-1 bg-white">' +
            (viewUrl ? '<a class="small fw-bold text-decoration-none" href="' + escapeHtmlCore(viewUrl) + '" target="_blank" rel="noopener noreferrer">👁️ ' + safeName + '</a>' : '<span class="small fw-bold">' + safeName + '</span>') +
            '<small class="text-muted">' + escapeHtmlCore(sizeLabel) + (Number(file.version || 1) > 1 ? ' · نسخه ' + escapeHtmlCore(toFa(file.version)) : '') + '</small>' +
            (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-1" href="' + escapeHtmlCore(downloadUrl) + '" target="_blank" rel="noopener noreferrer">دریافت</a>' : '') +
            (!file.legacy ? '<label class="btn btn-sm btn-outline-primary py-0 px-1 m-0" title="ابتدا نسخه جدید ذخیره می‌شود و سپس نسخه قبلی به سطل زباله می‌رود">جایگزینی<input type="file" data-doc-action="replace" data-doc-code="' + safeCode + '" data-doc-title="' + safeTitle + '" data-file-id="' + safeId + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp" hidden></label>' : '') +
            '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-doc-action="remove-file" data-doc-code="' + safeCode + '" data-file-id="' + safeId + '">حذف</button>' +
            '</div>';
        }).join("");

        rows += '<tr class="' + (filesForDoc.length ? 'table-success' : '') + '">' +
          '<td class="text-center fw-bold">' + escapeHtmlCore(toFa(i + 1)) + '</td>' +
          '<td><b>' + safeTitle + '</b>' + (d.legalRef ? '<br><small class="text-primary">⚖️ مستند قانونی: ' + escapeHtmlCore(d.legalRef) + '</small>' : '') + '</td>' +
          '<td>' + statusHtml + (filesForDoc.length && localFile ? '<br><small class="text-warning">یک نسخه قدیمی محلی نیز وجود دارد.</small>' : '') + '</td>' +
          '<td><div class="d-flex flex-column gap-1">' +
          '<label class="btn btn-sm btn-primary fw-bold m-0" style="cursor:pointer;">📤 افزودن فایل<input type="file" multiple data-doc-action="upload" data-doc-code="' + safeCode + '" data-doc-title="' + safeTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp" hidden></label>' +
          fileActions +
          '</div></td></tr>';
      }

      tbody.innerHTML = rows || '<tr><td colspan="4" class="text-center py-3 text-muted">چک‌لیست مدرک برای این فعالیت تعریف نشده است.</td></tr>';

      // فهرست مستقل همه فایل‌های Drive؛ مستقل از چک‌لیست و عنوان مدرک.
      if (libraryBody) {
        var allFiles = (cloudFiles || []).slice().sort(function(a, b) {
          return Number(b.updatedAt || b.uploadedAt || 0) - Number(a.updatedAt || a.uploadedAt || 0);
        });
        if (cloudError) {
          libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">دریافت فهرست فایل‌ها ناموفق بود: ' + escapeHtmlCore(cloudError) + '<br><small>اتصال و دسترسی Google Drive را بررسی و دکمه تازه‌سازی را اجرا کنید.</small></td></tr>';
        } else if (!allFiles.length) {
          libraryBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">هنوز فایلی در پوشه Google Drive این متقاضی پیدا نشد.</td></tr>';
        } else {
          libraryBody.innerHTML = allFiles.map(function(file, index) {
            var fileId = String(file.fileId || file.id || "");
            var safeId = escapeHtmlCore(fileId);
            var fileName = escapeHtmlCore(file.fileName || file.name || "بدون نام");
            var docTitle = escapeHtmlCore(file.docTitle || "فایل قدیمی / پیوست");
            var docCode = escapeHtmlCore(file.docCode || "LEGACY");
            var mimeType = String(file.mimeType || "نامشخص");
            var extMatch = String(file.fileName || file.name || "").match(/\.([^.]+)$/);
            var typeLabel = escapeHtmlCore(extMatch ? extMatch[1].toUpperCase() + " · " + mimeType : mimeType);
            var size = Math.max(0, Number(file.size || 0));
            var sizeLabel = size >= 1073741824 ? (size / 1073741824).toFixed(2) + " GB" :
              (size >= 1048576 ? (size / 1048576).toFixed(2) + " MB" :
              (size ? Math.max(1, Math.round(size / 1024)) + " KB" : "—"));
            var dateValue = Number(file.uploadedAt || file.updatedAt || 0);
            var dateLabel = dateValue ? new Date(dateValue).toLocaleString("fa-IR") : "—";
            var version = Math.max(1, Number(file.version || 1));
            var viewUrl = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
            var downloadUrl = /^https:\/\/drive\.google\.com\//.test(String(file.downloadUrl || "")) ? String(file.downloadUrl) : "";
            var links = (viewUrl ? '<a class="btn btn-sm btn-outline-primary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(viewUrl) + '">👁️ مشاهده</a>' : '') +
              (downloadUrl ? '<a class="btn btn-sm btn-outline-secondary py-0 px-2" target="_blank" rel="noopener noreferrer" href="' + escapeHtmlCore(downloadUrl) + '">⬇️ دانلود</a>' : '');
            var replace = (!file.legacy && docCode !== "LEGACY")
              ? '<label class="btn btn-sm btn-outline-warning py-0 px-2 m-0">جایگزینی<input type="file" hidden data-library-action="replace" data-file-id="' + safeId + '" data-doc-code="' + docCode + '" data-doc-title="' + docTitle + '" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"></label>'
              : '';
            return '<tr class="case-drive-file-row">' +
              '<td><div class="fw-bold">' + fileName + '</div><small class="text-muted">' + docTitle + '</small></td>' +
              '<td><span class="badge bg-light text-dark border">' + typeLabel + '</span></td>' +
              '<td class="text-nowrap">' + escapeHtmlCore(sizeLabel) + '</td>' +
              '<td class="text-nowrap small">' + escapeHtmlCore(dateLabel) + '</td>' +
              '<td class="text-center">' + escapeHtmlCore(toFa(version)) + '</td>' +
              '<td><div class="d-flex flex-wrap gap-1">' + links + replace +
                '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-library-action="delete" data-file-id="' + safeId + '">🗑️ حذف</button>' +
              '</div></td></tr>';
          }).join("");
        }
      }

      if (librarySummary) {
        var libraryBytes = (cloudFiles || []).reduce(function(sum, file) { return sum + Math.max(0, Number(file.size || 0)); }, 0);
        var librarySize = libraryBytes >= 1073741824 ? (libraryBytes / 1073741824).toFixed(2) + " GB" :
          (libraryBytes >= 1048576 ? (libraryBytes / 1048576).toFixed(2) + " MB" :
          (libraryBytes ? Math.max(1, Math.round(libraryBytes / 1024)) + " KB" : "۰ بایت"));
        librarySummary.textContent = toFa((cloudFiles || []).length) + " فایل در پوشه این متقاضی · مجموع حجم: " + librarySize +
          (cloudError ? " · خطا در دریافت اطلاعات" : " · آخرین بازخوانی: " + new Date().toLocaleTimeString("fa-IR"));
      }

      var searchInput = document.getElementById("case-doc-search");
      if (searchInput && searchInput.value) {
        var searchQuery = String(searchInput.value).trim().toLocaleLowerCase();
        Array.prototype.forEach.call(tbody.querySelectorAll("tr"), function(row) {
          row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(searchQuery) !== -1 ? "" : "none";
        });
        if (libraryBody) Array.prototype.forEach.call(libraryBody.querySelectorAll(".case-drive-file-row"), function(row) {
          row.style.display = String(row.textContent || "").toLocaleLowerCase().indexOf(searchQuery) !== -1 ? "" : "none";
        });
      }
      var usage = document.getElementById("case-docs-cloud-usage");
      if (usage) {
        var totalBytes = (cloudFiles || []).reduce(function(sum, file) { return sum + Math.max(0, Number(file.size || 0)); }, 0);
        var totalLabel = totalBytes >= 1073741824 ? (totalBytes / 1073741824).toFixed(2) + " GB" :
          (totalBytes >= 1048576 ? (totalBytes / 1048576).toFixed(2) + " MB" :
          (totalBytes ? Math.max(1, Math.round(totalBytes / 1024)) + " KB" : "۰ بایت"));
        usage.textContent = "تعداد فایل‌های Drive: " + toFa((cloudFiles || []).length) + " | حجم ثبت‌شده: " + totalLabel;
      }

      var legacyBox = document.getElementById("case-docs-legacy-files");
      if (legacyBox) {
        legacyBox.innerHTML = legacyFiles.length
          ? '<div class="small fw-bold mb-1">فایل‌های قدیمی موجود در پوشه Drive (بدون دسته‌بندی):</div>' +
            legacyFiles.map(function(file) {
              var url = /^https:\/\/drive\.google\.com\//.test(String(file.webViewLink || "")) ? String(file.webViewLink) : "";
              return '<div class="d-flex flex-wrap align-items-center gap-2 small mb-1">' +
                (url ? '<a href="' + escapeHtmlCore(url) + '" target="_blank" rel="noopener noreferrer">' : '') +
                '📎 ' + escapeHtmlCore(file.fileName || file.name || "فایل قدیمی") +
                (url ? '</a>' : '') +
                '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-legacy-delete="' + escapeHtmlCore(file.fileId || file.id || "") + '">حذف</button>' +
                '<span class="text-muted">برای تکمیل چک‌لیست، فایل را از مسیر افزودن فایل به مدرک مربوط متصل کنید.</span></div>';
            }).join("")
          : "";
      }

      if (folderLbl && folderUrl && /^https:\/\/drive\.google\.com\//.test(folderUrl)) {
        folderLbl.innerHTML = '<a href="' + escapeHtmlCore(folderUrl) + '" target="_blank" rel="noopener noreferrer">📁 بازکردن پوشه اختصاصی در Google Drive</a>';
      }

      if (missing.length === 0) {
        banner.className = "alert alert-success fw-bold mb-3";
        banner.textContent = "🎉 پرونده «" + String(c.name || "") + "» کامل است و تمامی " + toFa(reqDocs.length) + " عنوان مدرک در Google Drive موجود است.";
      } else {
        var badges = "";
        for (var m = 0; m < missing.length; m++) {
          badges += '<span class="badge bg-danger me-1 mb-1 p-2">❗ ' + escapeHtmlCore(toFa(m + 1)) + '. ' + escapeHtmlCore(missing[m]) + '</span>';
        }
        banner.className = "p-3 rounded-3 border border-2 border-danger bg-danger-subtle mb-3";
        banner.innerHTML =
          '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">' +
            '<b class="text-danger">⚠️ نقص مدارک پرونده «' + escapeHtmlCore(c.name) + '»: (' + escapeHtmlCore(toFa(doneCount)) + ' از ' + escapeHtmlCore(toFa(reqDocs.length)) + ' عنوان مدرک در Drive — ' + escapeHtmlCore(toFa(missing.length)) + ' عنوان ناقص)</b>' +
            '<button type="button" class="btn btn-sm btn-danger fw-bold" onclick="issueDeficiencyLetterForActiveCase()">🖨️ چاپ نامه ابلاغ نواقص روی سربرگ ۶۳۶</button>' +
          '</div><div>' + badges + '</div>';
      }

      if (cloudError) {
        banner.className = "alert alert-warning mb-3";
        banner.innerHTML = '<b>ارتباط با بایگانی ابری برقرار نشد:</b> ' + escapeHtmlCore(cloudError) +
          '<br><small>تا زمان دریافت فهرست Drive، وضعیت تحویل مدارک تأییدشده محسوب نمی‌شود.</small>';
      }
    }

    driveListPromise.then(function(result) {
      renderRows(result.documents || [], "", result.folderUrl || "");
    }).catch(function(error) {
      renderRows([], error && error.message ? error.message : String(error), "");
    });
  });
}
async function syncActiveCaseFolderToDrive() {
  var c = requireActiveCase("ساخت پوشه اختصاصی متقاضی در درایو");
  if (!c) return;
  if (!window.showDirectoryPicker) {
    downloadWindowsBatFolderCreator();
    return;
  }
  try {
    if (!rootDriveHandle) {
      rootDriveHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    }
    var folderName = (c.name + " - " + toEn(c.nid || "000")).replace(/[\\/:*?"<>|]/g, "_").trim();
    var caseDir = await rootDriveHandle.getDirectoryHandle(folderName, { create: true });

    var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
    var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

    getUploadedDocsForCase(c.id, async function(upMap) {
      var savedCount = 0;
      var repLines = ["گزارش وضعیت مدارک پرونده: " + c.name + " (کدملی: " + toFa(c.nid) + ")", "طرح: " + c.project + " | موقعیت: " + c.loc, "----------------------------------------"];
      for (var i = 0; i < reqDocs.length; i++) {
        var d = reqDocs[i];
        var up = upMap[d.code];
        if (up && up.rawBlob) {
          var fHandle = await caseDir.getFileHandle(String(i + 1).padStart(2, "0") + "_" + up.fileName, { create: true });
          var w = await fHandle.createWritable();
          await w.write(up.rawBlob);
          await w.close();
          savedCount++;
          repLines.push("[تکمیل] " + d.title);
        } else {
          repLines.push("[ناقص] " + d.title);
        }
      }
      var txtHandle = await caseDir.getFileHandle("00_وضعیت_مدارک_و_نواقص.txt", { create: true });
      var tw = await txtHandle.createWritable();
      await tw.write(repLines.join("\r\n"));
      await tw.close();
      alert("✅ پوشه «" + folderName + "» در درایو کامپیوتر شما ساخته شد و " + toFa(savedCount) + " فایل مدرک + گزارش نواقص داخل آن ذخیره گردید.");
    });
  } catch (e) {}
}

function downloadWindowsBatFolderCreator() {
  var bat = "@echo off\r\nchcp 65001 > nul\r\nmkdir \"بایگانی_متقاضیان_مرکز_636\"\r\ncd \"بایگانی_متقاضیان_مرکز_636\"\r\n";
  for (var i = 0; i < casesDB.length; i++) {
    var fn = (casesDB[i].name + " - " + toEn(casesDB[i].nid || "000")).replace(/[\\/:*?"<>|]/g, "_");
    bat += "mkdir \"" + fn + "\"\r\n";
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bat], { type: "application/x-bat;charset=utf-8" }));
  a.download = "Make_Folders_636.bat";
  a.click();
  showToastMsg("فایل ساخت پوشه همه متقاضیان دانلود شد.");
}

/* =========================================================================
   ۹. دبیرخانه، امور مالی، کارها، پشتیبان‌گیری و خروجی تک‌فایلی ویندوز
   ========================================================================= */
function normalizeSecretariatSearchText(value) {
  var text = String(value == null ? "" : value);
  try {
    if (typeof DOMParser !== "undefined" && /<\/?[a-z][\s\S]*?>/i.test(text)) {
      text = new DOMParser().parseFromString(text, "text/html").body.textContent || "";
    } else {
      text = text.replace(/<[^>]*>/g, " ");
    }
  } catch (parseError) {
    text = text.replace(/<[^>]*>/g, " ");
  }
  return toEn(text).replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u200c\u200f\u0640]/g, "")
    .replace(/[\s\u00a0]+/g, " ").trim().toLowerCase();
}

function renderSecretariatTable() {
  var tbody = document.getElementById("secretariat-tbody");
  if (!tbody) return;
  var q = normalizeSecretariatSearchText((document.getElementById("sec-search-q") || {}).value || "");
  var dir = (document.getElementById("sec-filter-dir") || {}).value || "ALL";
  var html = "";

  for (var i = 0; i < lettersDB.length; i++) {
    var l = lettersDB[i] || {};
    if (dir !== "ALL" && l.type !== dir) continue;
    var hay = normalizeSecretariatSearchText([
      l.number, l.date, l.type === "OUT" ? "صادره" : "وارده",
      l.recipient, l.appName, l.appNid, l.project, l.cap, l.land,
      l.landParcel, l.loc, l.body, l.officeLetter === true ? "نامه مستقل دفتر" : "نامه پرونده"
    ].join(" "));
    if (q && hay.indexOf(q) === -1) continue;

    var pSize = l.paperSize === "A5" ? "A5" : "A4";
    var letterType = l.type === "OUT" ? "صادره" : "وارده";
    var safeLetterId = escapeHtmlCore(l.id);
    html += "<tr>" +
      "<td><b>" + escapeHtmlCore(toFa(l.number)) + "</b><br><small class='text-muted'>" + escapeHtmlCore(toFa(l.date)) + "</small></td>" +
      "<td><span class='badge " + (l.type === "OUT" ? "bg-success" : "bg-primary") + "'>" + letterType + "</span><br><span class='badge bg-dark mt-1'>کاغذ " + pSize + "</span></td>" +
      "<td><b>" + escapeHtmlCore(l.recipient) + "</b><br>" +
        (l.officeLetter === true
          ? "<small class='text-primary fw-bold'>نامه اداری مستقل دفتر</small>"
          : "<small class='text-success fw-bold'>متقاضی: " + escapeHtmlCore(l.appName || "---") + " (" + escapeHtmlCore(toFa(l.cap || "")) + ")</small>") +
      "</td>" +
      "<td><div class='d-flex gap-1 justify-content-center flex-wrap'>" +
        "<button type='button' class='btn btn-sm btn-warning py-0 px-2 fw-bold' data-letter-action='edit' data-letter-id='" + safeLetterId + "' data-tip='ویرایش متن، شماره یا مشخصات این نامه'>✏️</button>" +
        "<button type='button' class='btn btn-sm btn-success py-0 px-2 fw-bold' data-letter-action='preview' data-letter-id='" + safeLetterId + "' data-tip='پیش‌نمایش و چاپ؛ اندازه کاغذ در صفحه چاپ انتخاب می‌شود'>🖨️ پیش‌نمایش / چاپ</button>" +
        "<button type='button' class='btn btn-sm btn-outline-danger py-0 px-2' data-letter-action='delete' data-letter-id='" + safeLetterId + "'>🗑️</button>" +
      "</div></td></tr>";
  }
  tbody.innerHTML = html || "<tr><td colspan='4' class='text-center py-3 text-muted'>نامه‌ای یافت نشد.</td></tr>";

  // اتصال رویدادها در هر بار رندر؛ کلیک‌های بایگانی پس از جستجو و فیلتر نیز فعال می‌مانند.
  tbody.onclick = function (event) {
    var target = event.target;
    var btn = target && target.closest ? target.closest("button[data-letter-action]") : null;
    if (!btn || !tbody.contains(btn)) return;
    var id = btn.getAttribute("data-letter-id");
    var action = btn.getAttribute("data-letter-action");
    var idx = lettersDB.findIndex(function (letter) { return letter && String(letter.id) === String(id); });
    if (idx < 0) {
      showToastMsg("نامه انتخاب‌شده در دفتر اندیکاتور پیدا نشد؛ جدول را تازه‌سازی کنید.", true);
      return;
    }
    try {
      if (action === "edit") {
        if (typeof window.editLetterFromSecretariat === "function") window.editLetterFromSecretariat(id);
        else if (typeof editLetterFromSecretariat === "function") editLetterFromSecretariat(id);
        else showToastMsg("ماژول ویرایش نامه بارگذاری نشده است.", true);
      } else if (action === "preview") {
        if (typeof window.previewSavedLetter === "function") {
          // نامه با اندازه ذخیره‌شده باز می‌شود؛ A4/A5 فقط در یک محل انتخاب می‌شود.
          window.previewSavedLetter(id);
        } else if (typeof window.printArchivedLetter === "function") {
          window.printArchivedLetter(id);
        } else showToastMsg("موتور چاپ نامه بارگذاری نشده است.", true);
      } else if (action === "delete") {
        if (window.__nezamDriveReady === false) {
          showToastMsg("در حال تکمیل بازیابی اطلاعات؛ پس از آماده‌شدن سامانه حذف را انجام دهید.", true);
          return;
        }
        if (!confirm("آیا از حذف این نامه از دفتر اندیکاتور اطمینان دارید؟")) return;
        var deletedLetterRecord = lettersDB[idx];
        if (!recordNezamDeletions([], [deletedLetterRecord])) {
          showToastMsg("ثبت سابقه حذف در حافظه مرورگر ناموفق بود؛ نامه حذف نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.", true);
          return;
        }
        lettersDB.splice(idx, 1);
        var letterDeleteSaved = saveAllDB();
        if (typeof window.syncDeletionToDrive === "function") window.syncDeletionToDrive();
        showToastMsg(letterDeleteSaved
          ? "نامه حذف و در فهرست حذف دائمی ثبت شد."
          : "حذف در فهرست حذف دائمی ثبت شد، اما ذخیره یکی از بخش‌های مرورگر خطا داد؛ وضعیت ذخیره‌سازی را بررسی کنید.", !letterDeleteSaved);
      }
    } catch (error) {
      window.__nezam636LastSecretariatError = error;
      console.error("Secretariat action failed:", error && error.stack ? error.stack : error);
      var reason = error && error.message ? error.message : String(error || "خطای نامشخص");
      var actionLabel = action === "edit" ? "ویرایش" : (action === "preview" ? "پیش‌نمایش و چاپ" : "حذف");
      showToastMsg("عملیات «" + actionLabel + "» ناموفق بود: " + reason, true);
    }
  };
}
function filterLettersTable(dirVal) {
  var sel = document.getElementById("sec-filter-dir");
  if (sel) sel.value = dirVal;
  renderSecretariatTable();
}

function addOfficeTask() {
  var c = getActiveCase();
  var title = document.getElementById("tsk-title").value.trim();
  if (!title) return;
  tasksDB.unshift({
    id: "T-" + new Date().getTime(),
    caseId: c ? c.id : "",
    title: title + (c ? " (" + c.name + ")" : ""),
    cat: document.getElementById("tsk-cat").value,
    due: document.getElementById("tsk-due").value,
    status: "در حال پیگیری"
  });
  document.getElementById("tsk-title").value = "";
  saveAllDB();
}

function refreshAllViews() {
  populateGlobalCaseSelector();
  renderApplicantsDirectoryTable();

  var outC = 0, inC = 0;
  for (var i = 0; i < lettersDB.length; i++) {
    if (lettersDB[i].type === "IN") inC++; else outC++;
  }

  var openTasksCount = tasksDB.filter(function (task) { return task && task.status !== "انجام شده"; }).length;
  if (document.getElementById("kpi-total-cases")) document.getElementById("kpi-total-cases").textContent = toFa(casesDB.length);
  if (document.getElementById("kpi-out-letters")) document.getElementById("kpi-out-letters").textContent = toFa(outC);
  if (document.getElementById("kpi-in-letters")) document.getElementById("kpi-in-letters").textContent = toFa(inC);
  if (document.getElementById("kpi-open-tasks")) document.getElementById("kpi-open-tasks").textContent = toFa(openTasksCount);

  var dashTbody = document.getElementById("dash-cases-summary-tbody");
  if (dashTbody) {
    var dHtml = "";
    for (var cIdx = 0; cIdx < casesDB.length; cIdx++) {
      var c = casesDB[cIdx];
      var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
      var inq = c.inquiries || {};
      var ok = 0;
      for (var k in inq) if (inq[k] === "OK") ok++;
      var safeCaseId = escapeHtmlCore(c.id);
      dHtml += "<tr class='" + (c.id === activeCaseId ? "table-success" : "") + "'>" +
        "<td class='fw-bold'>" + escapeHtmlCore(toFa(c.code)) + "</td>" +
        "<td><b>" + escapeHtmlCore(c.name) + "</b><br><small class='text-muted'>" + escapeHtmlCore(toFa(c.nid)) + "</small></td>" +
        "<td><span class='badge " + grpMeta.badgeClass + " mb-1'>" + escapeHtmlCore(grpMeta.shortTitle) + "</span><br><small>" + escapeHtmlCore(c.project) + " (" + escapeHtmlCore(toFa(c.cap)) + ")</small></td>" +
        "<td class='text-success fw-bold'>" + escapeHtmlCore(c.loc) + "</td>" +
        "<td><span class='badge bg-success'>" + escapeHtmlCore(toFa(ok)) + " از ۷ موافقت</span></td>" +
        "<td><div class='d-flex gap-1'>" +
          "<button type='button' class='btn btn-sm btn-primary py-0 fw-bold' data-case-action='select' data-case-id='" + safeCaseId + "'>پرونده</button>" +
          "<button type='button' class='btn btn-sm btn-outline-success py-0 fw-bold' data-case-action='croquis' data-case-id='" + safeCaseId + "'>🗺️ کروکی</button>" +
        "</div></td>" +
      "</tr>";
    }
    dashTbody.innerHTML = dHtml || "<tr><td colspan='6' class='text-center text-muted py-3'>پرونده‌ای ثبت نشده است.</td></tr>";
    if (!dashTbody.dataset.secureActionsBound) {
      dashTbody.dataset.secureActionsBound = "1";
      dashTbody.addEventListener("click", function (event) {
        var btn = event.target.closest("button[data-case-action]");
        if (!btn || !dashTbody.contains(btn)) return;
        var id = btn.getAttribute("data-case-id");
        var action = btn.getAttribute("data-case-action");
        var exists = casesDB.some(function (item) { return item && String(item.id) === id; });
        if (!exists) return;
        selectActiveCase(id);
        if (action === "croquis") switchMainPane("pane-croquis");
        else switchMainPane("pane-cases");
      });
    }
  }

  var tHolder = document.getElementById("tasks-list-holder");
  if (tHolder) {
    var tHtml = "";
    for (var t = 0; t < tasksDB.length; t++) {
      var tk = tasksDB[t] || {};
      var done = tk.status === "انجام شده";
      tHtml += '<div class="col-md-6"><div class="p-2 border rounded d-flex justify-content-between align-items-center ' + (done ? 'bg-success-subtle' : 'bg-white') + '">' +
        '<div class="small"><span class="badge bg-secondary me-1">' + escapeHtmlCore(tk.cat) + '</span> <b>' + escapeHtmlCore(tk.title) + '</b> <small class="text-muted">(' + escapeHtmlCore(toFa(tk.due)) + ')</small></div>' +
        '<div class="d-flex gap-1"><button type="button" class="btn btn-sm btn-outline-success py-0" onclick="tasksDB[' + t + '].status=\'انجام شده\';saveAllDB();" aria-label="علامت‌گذاری انجام شد">✔</button><button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="tasksDB.splice(' + t + ',1);saveAllDB();" aria-label="حذف پیگیری">✕</button></div>' +
      '</div></div>';
    }
    tHolder.innerHTML = tHtml;
  }

  renderSecretariatTable();
  renderUnifiedCasesMatrix();
}
function exportFullSystemBackup() {
  var data = {
    version: "636-PRO-V3",
    exportDate: todayShamsi(),
    casesDB: casesDB,
    lettersDB: lettersDB,
    tasksDB: tasksDB,
    actSpecs: ACT_SPECS,
    docChecklists: DOC_CHECKLISTS
  };
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "Backup_Nezam636_Full_" + toEn(todayShamsi()).replace(/\//g, "-") + ".json";
  a.click();
  showToastMsg("نسخه پشتیبان کامل (شامل متقاضیان، نقشه‌های کروکی و نامه‌ها) دانلود شد.");
}

function importFullSystemBackup(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (d.casesDB) casesDB = d.casesDB;
      if (d.lettersDB) lettersDB = d.lettersDB;
      if (d.tasksDB) tasksDB = d.tasksDB;
      if (d.actSpecs) ACT_SPECS = d.actSpecs;
      if (d.docChecklists) DOC_CHECKLISTS = d.docChecklists;
      normalizeAllCasesSchema();
      activeCaseId = casesDB.length ? casesDB[0].id : "";
      saveAllDB();
      loadActiveCaseIntoForm();
      showToastMsg("پشتیبان کامل سامانه با موفقیت بازیابی شد.");
    } catch (err) { alert("فایل پشتیبان نامعتبر است."); }
  };
  r.readAsText(f);
}

/* دانلود نسخه تک‌فایلی مستقل ویندوز (HTML خودکفا که روی هر مرورگری با دابل‌کلیک باز می‌شود و شامل کل اطلاعات فعلی است) */
window.downloadStandaloneWindowsHTML = async function() {
  try {
    showToastMsg("⏳ در حال ساخت نسخه مستقل ویندوز و آماده‌سازی فایل‌های برنامه...");
    var docClone = document.documentElement.cloneNode(true);
    var bodyEl = docClone.querySelector("body");
    if (!bodyEl) throw new Error("ساختار صفحه برای تهیه نسخه مستقل کامل نیست.");

    // قراردادن تصویر لحظه‌ای اطلاعات پیش از اجرای هر ماژول اصلی
    var oldSnap = docClone.querySelector("#embedded-db-snapshot");
    if (oldSnap) oldSnap.remove();

    var snapshotPayload = {
      casesDB: casesDB,
      lettersDB: lettersDB,
      tasksDB: tasksDB,
      actSpecs: ACT_SPECS,
      docChecklists: DOC_CHECKLISTS,
      brandCfg: typeof brandCfg !== "undefined" ? brandCfg : null,
      tplCfg: typeof tplCfg !== "undefined" ? tplCfg : null,
      paperSize: typeof currentPaperSize !== "undefined" ? currentPaperSize : "A4",
      activeCaseId: typeof activeCaseId !== "undefined" ? activeCaseId : "",
      deletionManifest: readNezamDeletionManifest()
    };
    var safeSnapshotJson = JSON.stringify(snapshotPayload)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    var snapScript = document.createElement("script");
    snapScript.id = "embedded-db-snapshot";
    snapScript.textContent =
      "(function(){try{var snap=" + safeSnapshotJson + ";" +
      "if(!localStorage.getItem('nezam636_unified_cases')&&snap.casesDB)localStorage.setItem('nezam636_unified_cases',JSON.stringify(snap.casesDB));" +
      "if(!localStorage.getItem('nezam636_deletion_manifest_v1')&&snap.deletionManifest)localStorage.setItem('nezam636_deletion_manifest_v1',JSON.stringify(snap.deletionManifest));" +
      "if(!localStorage.getItem('nezam636_letters')&&snap.lettersDB)localStorage.setItem('nezam636_letters',JSON.stringify(snap.lettersDB));" +
      "if(!localStorage.getItem('nezam636_tasks')&&snap.tasksDB)localStorage.setItem('nezam636_tasks',JSON.stringify(snap.tasksDB));" +
      "if(!localStorage.getItem('nezam636_act_specs_v3')&&snap.actSpecs)localStorage.setItem('nezam636_act_specs_v3',JSON.stringify(snap.actSpecs));" +
      "if(!localStorage.getItem('nezam636_doc_checklists_v2')&&snap.docChecklists)localStorage.setItem('nezam636_doc_checklists_v2',JSON.stringify(snap.docChecklists));" +
      "if(!localStorage.getItem('nezam636_branding_cfg')&&snap.brandCfg)localStorage.setItem('nezam636_branding_cfg',JSON.stringify(snap.brandCfg));" +
      "if(!localStorage.getItem('nezam636_templates_cfg')&&snap.tplCfg)localStorage.setItem('nezam636_templates_cfg',JSON.stringify(snap.tplCfg));" +
      "if(!localStorage.getItem('nezam636_paper_size')&&snap.paperSize)localStorage.setItem('nezam636_paper_size',snap.paperSize);" +
      "if(!localStorage.getItem('nezam636_active_case_id')&&snap.activeCaseId)localStorage.setItem('nezam636_active_case_id',snap.activeCaseId);" +
      "}catch(e){console.error('Nezam636 snapshot restore failed',e);}})();";
    bodyEl.insertBefore(snapScript, bodyEl.firstChild);

    // ماژول‌ها در همان جای اصلی خود به اسکریپت داخلی تبدیل می‌شوند تا ترتیب وابستگی‌ها حفظ شود.
    var externalScripts = Array.prototype.slice.call(docClone.querySelectorAll("script[src]"));
    var bundledNames = ["nezam-core.js", "nezam-customizer.js", "nezam-ai-assistant.js"];
    var bundledCount = 0;

    for (var i = 0; i < externalScripts.length; i++) {
      var oldScript = externalScripts[i];
      var src = oldScript.getAttribute("src") || "";
      if (!bundledNames.some(function(name) { return src.indexOf(name) !== -1; })) continue;

      var response = await fetch(src, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("دریافت فایل " + src + " ناموفق بود (HTTP " + response.status + ").");
      }
      var scriptText = await response.text();
      if (!scriptText.trim()) throw new Error("فایل برنامه خالی است: " + src);

      var inlineScript = document.createElement("script");
      inlineScript.textContent = scriptText.replace(/<\/script/gi, "<\\/script");
      oldScript.parentNode.replaceChild(inlineScript, oldScript);
      bundledCount++;
    }

    if (bundledCount !== bundledNames.length) {
      throw new Error("همه ماژول‌های اصلی برای ساخت نسخه مستقل پیدا نشدند.");
    }

    var fullHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var objectUrl = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = objectUrl;
    link.download = "Nezam636_Windows_Offline.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(objectUrl); }, 3000);

    showToastMsg("✅ نسخه مستقل ویندوز با ترتیب صحیح ماژول‌ها ساخته و دانلود شد.");
  } catch (error) {
    console.error("Standalone HTML build failed:", error);
    alert("ساخت نسخه مستقل انجام نشد.\n" +
      (error && error.message ? error.message : "اتصال اینترنت یا دسترسی به فایل‌های اصلی را بررسی کنید.") +
      "\n\nبرای حفظ اطلاعات، ابتدا از بخش پشتیبان‌گیری فایل JSON تهیه کنید.");
  }
};
function initAppCore() {
  var tipBox = document.getElementById("smart-mouse-tooltip");
  if (tipBox) {
    document.addEventListener("mouseover", function(e) {
      var t = e.target.closest("[data-tip]");
      if (t) { tipBox.innerHTML = "<b>💡 راهنما:</b>" + t.getAttribute("data-tip"); tipBox.style.display = "block"; }
    });
    document.addEventListener("mousemove", function(e) {
      if (tipBox.style.display === "block") {
        tipBox.style.left = Math.max(10, Math.min(e.clientX + 15, window.innerWidth - 310)) + "px";
        tipBox.style.top = Math.max(10, Math.min(e.clientY + 18, window.innerHeight - 80)) + "px";
      }
    });
    document.addEventListener("mouseout", function(e) {
      if (e.target.closest("[data-tip]")) tipBox.style.display = "none";
    });
  }

  setInterval(function() {
    try {
      var now = new Date();
      var clk = document.getElementById("live-clock");
      var dt = document.getElementById("live-date");
      if (clk) clk.textContent = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
      if (dt) dt.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    } catch (e) {}
  }, 1000);

  refreshAllViews();
  loadActiveCaseIntoForm();
  renderActiveCaseDocsChecklist();
  renderActiveCaseHistory();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppCore);
} else {
  initAppCore();
}


/* =========================================================================
   ۱۰. توابع پشتیبان همگام‌سازی کامل حافظه (Memory + LocalStorage + IndexedDB)
   مخصوص ذخیره و بازخوانی ۱۰۰٪ اطلاعات در گوگل درایو بین مرورگرها و دستگاه‌ها
   ========================================================================= */
window.flushInMemoryStateToLocalStorage = function() {
  try {
    applyNezamDeletionManifestToState();
    window.__gdriveInternalFlush = true;
    localStorage.setItem("nezam636_unified_cases", JSON.stringify(casesDB));
    localStorage.setItem("nezam636_letters", JSON.stringify(lettersDB));
    localStorage.setItem(NEZAM_DELETION_MANIFEST_KEY, JSON.stringify(readNezamDeletionManifest()));
    localStorage.setItem("nezam636_tasks", JSON.stringify(tasksDB));
    localStorage.setItem("nezam636_doc_checklists_v2", JSON.stringify(DOC_CHECKLISTS));
    localStorage.setItem("nezam636_act_specs_v3", JSON.stringify(ACT_SPECS));
    localStorage.setItem("nezam636_active_case_id", activeCaseId || "");
    if (typeof brandCfg !== "undefined" && brandCfg) {
      localStorage.setItem("nezam636_branding_cfg", JSON.stringify(brandCfg));
    }
    if (typeof tplCfg !== "undefined" && tplCfg) {
      localStorage.setItem("nezam636_templates_cfg", JSON.stringify(tplCfg));
    }
    if (typeof currentPaperSize !== "undefined" && currentPaperSize) {
      localStorage.setItem("nezam636_paper_size", currentPaperSize);
    }
    return true;
  } catch (e) {
    console.error("Flush to localStorage failed; cloud snapshot must be stopped:", e);
    return false;
  } finally {
    window.__gdriveInternalFlush = false;
  }
};

window.reloadAllStateFromLocalStorage = function() {
  try {
    window.__gdriveInternalFlush = true;
    if (localStorage.getItem("nezam636_act_specs_v3")) {
      var savedSpecs = JSON.parse(localStorage.getItem("nezam636_act_specs_v3"));
      for (var sk in savedSpecs) ACT_SPECS[sk] = savedSpecs[sk];
    }
    var rawCases = localStorage.getItem("nezam636_unified_cases");
    if (rawCases !== null) {
      var loadedCases = JSON.parse(rawCases);
      if (Array.isArray(loadedCases)) casesDB = loadedCases;
    }
    var rawLetters = localStorage.getItem("nezam636_letters");
    if (rawLetters !== null) {
      var loadedLetters = JSON.parse(rawLetters);
      if (Array.isArray(loadedLetters)) lettersDB = loadedLetters;
    }
    try {
      localStorage.removeItem("nezam636_cases_v6");
      localStorage.removeItem("nezam636_letters_v6");
    } catch (legacyCleanupError) {}
    applyNezamDeletionManifestToState();
    var rawTasks = localStorage.getItem("nezam636_tasks") || localStorage.getItem("nezam636_tasks_v6");
    if (rawTasks) {
      var loadedTasks = JSON.parse(rawTasks);
      if (Array.isArray(loadedTasks)) tasksDB = loadedTasks;
    }
    if (localStorage.getItem("nezam636_doc_checklists_v2")) {
      var loadedDocs = JSON.parse(localStorage.getItem("nezam636_doc_checklists_v2"));
      for (var dk in loadedDocs) DOC_CHECKLISTS[dk] = loadedDocs[dk];
    }
    if (localStorage.getItem("nezam636_active_case_id") !== null) {
      activeCaseId = localStorage.getItem("nezam636_active_case_id");
    }

    normalizeAllCasesSchema();
    var foundActive = false;
    for (var i = 0; i < casesDB.length; i++) {
      if (casesDB[i].id === activeCaseId) { foundActive = true; break; }
    }
    if (!foundActive && casesDB.length > 0) {
      activeCaseId = casesDB[0].id;
    }

    // بازخوانی تنظیمات سربرگ و قالب‌های نامه
    if (typeof brandCfg !== "undefined" && localStorage.getItem("nezam636_branding_cfg")) {
      var pb = JSON.parse(localStorage.getItem("nezam636_branding_cfg"));
      for (var bk in pb) brandCfg[bk] = pb[bk];
    }
    if (typeof tplCfg !== "undefined" && localStorage.getItem("nezam636_templates_cfg")) {
      var pt = JSON.parse(localStorage.getItem("nezam636_templates_cfg"));
      for (var tk in pt) tplCfg[tk] = pt[tk];
    }
    if (typeof initBrandingAndTemplatesUI === "function") {
      initBrandingAndTemplatesUI();
    }

    refreshAllViews();
    loadActiveCaseIntoForm();
    renderActiveCaseDocsChecklist();
    renderActiveCaseHistory();
    if (typeof window.initCroquisWorkspaceForActiveCase === "function") {
      window.initCroquisWorkspaceForActiveCase();
    }
    if (typeof window.syncLetterEditorWithActiveCase === "function") {
      window.syncLetterEditorWithActiveCase();
    }
    if (typeof window.renderSinglePreviewSheet === "function") {
      window.renderSinglePreviewSheet();
    }
  } catch (e) {
    console.error("Error reloading state from localStorage:", e);
  } finally {
    window.__gdriveInternalFlush = false;
  }
};

window.exportIndexedDBDocs = function() {
  return new Promise(function(resolve, reject) {
    openFilesDB(function(db) {
      if (!db) return reject(new Error("پایگاه فایل‌های محلی IndexedDB قابل بازشدن نیست؛ ذخیره ابری برای جلوگیری از حذف پیوست‌ها متوقف شد."));
      var tx;
      try {
        tx = db.transaction(["docs"], "readonly");
        var req = tx.objectStore("docs").getAll();
        req.onsuccess = function(e) {
          var list = Array.isArray(e.target.result) ? e.target.result : [];
          var cleanList = [];
          var omittedLargeCount = 0;
          for (var i = 0; i < list.length; i++) {
            var item = list[i] || {};
            var dUrl = item.dataUrl || "";
            // محدودیت حجم انتقال از Apps Script؛ فایل‌های بزرگ باید از مسیر بایگانی مستقیم Drive منتقل شوند.
            if (dUrl.length < 2200000) {
              cleanList.push({
                key: item.key,
                caseId: item.caseId,
                docCode: item.docCode,
                docTitle: item.docTitle,
                fileName: item.fileName,
                uploadDate: item.uploadDate,
                dataUrl: dUrl
              });
            } else {
              omittedLargeCount++;
            }
          }
          window.__nezam636IndexedDBExportStatus = {
            totalCount: list.length,
            includedCount: cleanList.length,
            omittedLargeCount: omittedLargeCount,
            exportedAt: Date.now()
          };
          resolve(cleanList);
        };
        req.onerror = function() {
          reject(req.error || new Error("خواندن اسناد IndexedDB ناموفق بود."));
        };
        tx.onerror = function() {
          reject(tx.error || new Error("تراکنش خواندن اسناد IndexedDB ناموفق بود."));
        };
        tx.onabort = function() {
          reject(tx.error || new Error("تراکنش خواندن اسناد IndexedDB لغو شد."));
        };
      } catch (err) {
        reject(err);
      }
    });
  });
};

window.importIndexedDBDocs = function(docsList) {
  return new Promise(function(resolve) {
    if (!Array.isArray(docsList) || docsList.length === 0) return resolve(false);
    openFilesDB(function(db) {
      if (!db) return resolve(false);
      try {
        var tx = db.transaction(["docs"], "readwrite");
        var store = tx.objectStore("docs");
        for (var i = 0; i < docsList.length; i++) {
          var d = docsList[i];
          if (d && d.key) {
            store.put({
              key: d.key,
              caseId: d.caseId,
              docCode: d.docCode,
              docTitle: d.docTitle,
              fileName: d.fileName,
              uploadDate: d.uploadDate,
              dataUrl: d.dataUrl
            });
          }
        }
        tx.oncomplete = function() {
          renderActiveCaseDocsChecklist();
          resolve(true);
        };
        tx.onerror = function() { resolve(false); };
      } catch (err) {
        resolve(false);
      }
    });
  });
};
