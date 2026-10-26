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

/* بارگذاری و مهاجرت هوشمند داده‌های قبلی از LocalStorage */
try {
  if (localStorage.getItem("nezam636_act_specs_v3")) {
    var savedSpecs = JSON.parse(localStorage.getItem("nezam636_act_specs_v3"));
    for (var sk in savedSpecs) ACT_SPECS[sk] = savedSpecs[sk];
  }
  if (localStorage.getItem("nezam636_unified_cases")) {
    var loadedCases = JSON.parse(localStorage.getItem("nezam636_unified_cases"));
    if (Array.isArray(loadedCases) && loadedCases.length) {
      casesDB = loadedCases;
    }
  }
  if (localStorage.getItem("nezam636_letters")) lettersDB = JSON.parse(localStorage.getItem("nezam636_letters"));
  if (localStorage.getItem("nezam636_tasks")) tasksDB = JSON.parse(localStorage.getItem("nezam636_tasks"));
  if (localStorage.getItem("nezam636_doc_checklists_v2")) {
    var loadedDocs = JSON.parse(localStorage.getItem("nezam636_doc_checklists_v2"));
    for (var dk in loadedDocs) DOC_CHECKLISTS[dk] = loadedDocs[dk];
  }
  if (localStorage.getItem("nezam636_active_case_id") !== null) {
    activeCaseId = localStorage.getItem("nezam636_active_case_id");
  }
} catch (e) {}

/* ارتقای ساختاری پرونده‌های قدیمی بدون حذف هیچ اطلاعاتی */
function normalizeAllCasesSchema() {
  var has201 = false;
  for (var i = 0; i < casesDB.length; i++) {
    var c = casesDB[i];
    if (c.id === "CASE-201") has201 = true;
    var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
    if (!c.mainGroup) c.mainGroup = sp.mainGroup || "LIVESTOCK_POULTRY_FISHERIES";
    if (!c.entityType) c.entityType = "INDIVIDUAL";
    if (!c.caseStatus) c.caseStatus = "ACTIVE";
    if (!c.utmZone) c.utmZone = "39R";
    if (!Array.isArray(c.customFields)) c.customFields = [];
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
  if (!has201 && casesDB.length <= 3) {
    casesDB.unshift(JSON.parse(JSON.stringify(DEFAULT_UNIFIED_CASES[0])));
  }
}
normalizeAllCasesSchema();

function saveAllDB() {
  try {
    localStorage.setItem("nezam636_unified_cases", JSON.stringify(casesDB));
    localStorage.setItem("nezam636_letters", JSON.stringify(lettersDB));
    localStorage.setItem("nezam636_tasks", JSON.stringify(tasksDB));
    localStorage.setItem("nezam636_doc_checklists_v2", JSON.stringify(DOC_CHECKLISTS));
    localStorage.setItem("nezam636_act_specs_v3", JSON.stringify(ACT_SPECS));
    localStorage.setItem("nezam636_active_case_id", activeCaseId || "");
  } catch (e) {}
  refreshAllViews();
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
    reasonEl.textContent = "عملیات درخواستی: «" + (reasonText || "شروع فرایند اداری") + "» — طبق قانون اجباری سامانه، هیچ فرایند اداری (صدور نامه، ترسیم کروکی، بارگذاری مدرک یا چاپ فرم) بدون انتخاب متقاضی مجاز نیست.";
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
    var hay = toEn(c.code + " " + c.name + " " + c.nid + " " + c.mobile + " " + c.project + " " + c.loc + " " + (c.repName || "")).toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    html += '<tr>' +
      '<td class="fw-bold">' + toFa(c.code) + '</td>' +
      '<td><b>' + c.name + '</b><br><small class="text-muted">کدملی/شناسه: ' + toFa(c.nid) + ' | همراه: ' + toFa(c.mobile || "---") + '</small></td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + grpMeta.shortTitle + '</span><br><small>' + c.project + '</small></td>' +
      '<td><button type="button" class="btn btn-sm btn-success fw-bold" onclick="confirmSelectApplicantFromGuard(\'' + c.id + '\')">✅ انتخاب و ادامه</button></td>' +
    '</tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="4" class="text-center py-3 text-muted">متقاضی با این مشخصات یافت نشد. لطفاً روی دکمه «ثبت متقاضی جدید» کلیک کنید.</td></tr>';
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
      infoSummary.innerHTML = '<span class="text-danger fw-bold">هیچ متقاضی انتخاب نشده است! پیش از هرگونه عملیات، متقاضی را انتخاب یا ثبت نمایید.</span>';
    }
    if (lockBanner) lockBanner.style.display = "block";
  } else {
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var entityLbl = c.entityType === "LEGAL" ? "شخص حقوقی" : (c.entityType === "ORG" ? "سازمان/نهاد" : "شخص حقیقی");
    if (statusBadge) {
      statusBadge.className = "badge bg-success fs-6";
      statusBadge.textContent = "👤 پرونده فعال: " + c.name;
    }
    if (infoSummary) {
      infoSummary.innerHTML =
        '<span class="badge ' + grpMeta.badgeClass + ' me-1">' + grpMeta.shortTitle + '</span>' +
        '<span class="badge bg-secondary me-1">' + entityLbl + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کلاسه: ' + toFa(c.code) + '</span>' +
        '<span class="badge bg-light text-dark border me-1">کدملی/شناسه: ' + toFa(c.nid) + '</span>' +
        '<span class="badge bg-success-subtle text-success border border-success me-1">' + c.project + ' (' + toFa(c.cap) + ')</span>' +
        '<span class="badge bg-light text-secondary border">📍 ' + c.loc + '</span>';
    }
    if (lockBanner) lockBanner.style.display = "none";
  }
}

/* =========================================================================
   ۴. ناوبری واحد بین تب‌های اصلی و زیرتب‌ها (همراه با کنترل متقاضی فعال)
   ========================================================================= */
function switchMainPane(paneId) {
  if (paneId === "pane-compose") paneId = "pane-cases";
  if (paneId === "pane-preview") paneId = "pane-print";
  if (paneId === "pane-ai-center") paneId = "pane-ai";

  // تب‌هایی که طبق قانون بخش سوم بدون انتخاب متقاضی نباید اجرا شوند
  var guardedPanes = {
    "pane-croquis": "ورود به ابزار تخصصی کروکی زمین و نقشه UTM",
    "pane-letters": "ورود به دبیرخانه و صدور نامه اداری برای متقاضی",
    "pane-print": "مشاهده و چاپ سربرگ و فرم‌های رسمی متقاضی"
  };

  if (guardedPanes[paneId] && !getActiveCase()) {
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
    html += '<option value="' + c.id + '" ' + (c.id === activeCaseId ? "selected" : "") + '>' +
      '[' + grpMeta.shortTitle + '] ' + toFa(c.code) + ' — ' + c.name + ' (کدملی/شناسه: ' + toFa(c.nid) + ' | ' + c.cap + ')' +
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
    var sp = ACT_SPECS[k];
    if (!selectedGroup || sp.mainGroup === selectedGroup) {
      html += '<option value="' + k + '" ' + (k === selectedActKey ? "selected" : "") + '>' + sp.title + ' (واحد: ' + sp.unit + ')</option>';
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
  saveAllDB();
  loadActiveCaseIntoForm();
  showToastMsg("پرونده با رعایت کنترل دسترسی حذف گردید.");
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

    var searchHay = toEn([c.code, c.name, c.nid, c.mobile, c.project, c.loc, c.repName || "", c.regNo || ""].join(" ")).toLowerCase();
    if (q && searchHay.indexOf(q) === -1) continue;

    matched++;
    var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
    var stMeta = statusMap[c.caseStatus || "ACTIVE"] || statusMap.ACTIVE;
    var entTitle = c.entityType === "LEGAL" ? "🏢 حقوقی" : (c.entityType === "ORG" ? "🏛️ سازمانی" : "👤 حقیقی");
    var mapsCount = (c.croquisMaps || []).length;

    html += '<tr class="' + (c.id === activeCaseId ? 'table-success border-success' : '') + '">' +
      '<td class="fw-bold">' + toFa(c.code) + '</td>' +
      '<td class="text-start">' +
        '<b>' + c.name + '</b> ' +
        '<span class="badge bg-light text-dark border">' + entTitle + '</span><br>' +
        '<small class="text-muted">کدملی/شناسه: <b>' + toFa(c.nid) + '</b> | تماس: ' + toFa(c.mobile || "---") + '</small>' +
        (c.repName ? '<br><small class="text-primary">نماینده/مدیرعامل: ' + c.repName + '</small>' : '') +
      '</td>' +
      '<td><span class="badge ' + grpMeta.badgeClass + '">' + grpMeta.shortTitle + '</span></td>' +
      '<td class="text-start"><b>' + c.project + '</b><br><small class="text-muted">ظرفیت: ' + toFa(c.cap) + ' | زمین: ' + toFa(c.land) + ' م.م</small></td>' +
      '<td class="text-start"><small class="fw-bold text-success">' + c.loc + '</small><br><small class="text-muted">تاریخ ثبت: ' + toFa(c.issueDate) + '</small></td>' +
      '<td><span class="badge ' + stMeta.cls + '">' + stMeta.txt + '</span><br><small class="text-muted">' + toFa(mapsCount) + ' نقشه کروکی</small></td>' +
      '<td>' +
        '<div class="d-flex gap-1 justify-content-center flex-wrap">' +
          '<button class="btn btn-sm ' + (c.id === activeCaseId ? 'btn-success' : 'btn-outline-success') + ' fw-bold py-0 px-2" onclick="selectActiveCase(\'' + c.id + '\'); switchCaseSubTab(\'sub-info\');">' + (c.id === activeCaseId ? '✔ فعال (ویرایش)' : 'انتخاب پرونده') + '</button>' +
          '<button class="btn btn-sm btn-outline-primary fw-bold py-0 px-2" onclick="selectActiveCase(\'' + c.id + '\'); switchMainPane(\'pane-croquis\');">🗺️ کروکی</button>' +
          '<button class="btn btn-sm btn-outline-dark fw-bold py-0 px-2" onclick="selectActiveCase(\'' + c.id + '\'); switchMainPane(\'pane-letters\');">📨 نامه</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  tbody.innerHTML = html || '<tr><td colspan="7" class="text-center py-4 text-muted">هیچ متقاضی با فیلترهای انتخاب‌شده یافت نشد.</td></tr>';
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
  var list = c.history || [];
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += '<tr>' +
      '<td class="text-center fw-bold">' + toFa(i + 1) + '</td>' +
      '<td class="fw-bold text-primary">' + toFa(list[i].date) + '</td>' +
      '<td>' + list[i].action + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + (list[i].by || "مرکز ۶۳۶") + '</span></td>' +
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
  var list = c.customFields || [];
  if (!list.length) { el.innerHTML = ""; return; }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += '<span class="badge bg-secondary me-1">' + list[i].label + ': ' + toFa(list[i].value) +
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
    var hay = (c.code + " " + c.name + " " + c.nid + " " + c.project + " " + c.loc).toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var inq = c.inquiries || {};
    var okCount = 0;
    var cells = "";
    for (var a = 0; a < agencies.length; a++) {
      var k = agencies[a];
      var st = inq[k] || "NONE";
      if (st === "OK") okCount++;
      var meta = INQ_STATUS_STYLE[st] || INQ_STATUS_STYLE.NONE;
      cells += '<td><button type="button" class="btn btn-sm ' + meta.cls + ' fw-bold py-1 px-2" style="font-size:0.73rem;white-space:nowrap;" onclick="toggleCaseInquiryStatus(\'' + c.id + '\',\'' + k + '\')">' + meta.txt + '</button></td>';
    }

    var pct = Math.round((okCount / agencies.length) * 100);
    html += '<tr class="' + (c.id === activeCaseId ? 'table-active' : '') + '">' +
      '<td class="fw-bold">' + toFa(c.code) + '</td>' +
      '<td class="text-start"><b>' + c.name + '</b><br><small class="text-muted">کدملی: ' + toFa(c.nid) + '</small><br><small class="text-success fw-bold">' + c.loc + '</small></td>' +
      '<td class="text-start"><b>' + c.project + '</b><br><small class="text-muted">ظرفیت: ' + toFa(c.cap) + ' | ' + toFa(c.land) + ' م.م</small></td>' +
      cells +
      '<td><span class="badge ' + (pct === 100 ? 'bg-success' : 'bg-primary') + '">' + toFa(pct) + '٪ (' + toFa(okCount) + '/۷)</span></td>' +
      '<td><small class="fw-bold text-danger">' + toFa(c.expDate || "۱۴۰۵/۰۸/۱۳") + '</small></td>' +
      '<td><div class="d-flex gap-1 justify-content-center">' +
        '<button class="btn btn-sm btn-outline-success fw-bold" onclick="selectActiveCase(\'' + c.id + '\'); switchMainPane(\'pane-letters\');" data-tip="صدور نامه استعلام برای این پرونده">📨 صدور نامه</button>' +
        '<button class="btn btn-sm btn-outline-dark fw-bold" onclick="selectActiveCase(\'' + c.id + '\'); printOfficialForm(\'BINDER_LABEL\');" data-tip="چاپ لیبل عطف زونکن">🏷️ لیبل</button>' +
      '</div></td></tr>';
  }
  tbody.innerHTML = html || '<tr><td colspan="13" class="py-3 text-muted">موردی یافت نشد.</td></tr>';
}

/* بخش قوانین NotebookLM بنا به درخواست کاربر حذف گردید */

/* =========================================================================
   ۸. بایگانی دیجیتال مدارک هر پرونده در IndexedDB و ساخت پوشه در درایو
   ========================================================================= */
var idbInstance = null;
function openFilesDB(cb) {
  if (idbInstance) return cb(idbInstance);
  if (!window.indexedDB) return cb(null);
  var req = window.indexedDB.open("Nezam636_UnifiedFiles_DB", 1);
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs", { keyPath: "key" });
  };
  req.onsuccess = function(e) { idbInstance = e.target.result; cb(idbInstance); };
  req.onerror = function() { cb(null); };
}

function getUploadedDocsForCase(caseId, cb) {
  openFilesDB(function(db) {
    if (!db) return cb({});
    var tx = db.transaction(["docs"], "readonly");
    var req = tx.objectStore("docs").getAll();
    req.onsuccess = function(e) {
      var list = e.target.result || [];
      var map = {};
      for (var i = 0; i < list.length; i++) {
        if (list[i].caseId === caseId) map[list[i].docCode] = list[i];
      }
      cb(map);
    };
    req.onerror = function() { cb({}); };
  });
}

function uploadCaseDocFile(event, docCode, docTitle) {
  var file = event.target.files[0];
  if (!file) return;
  var c = requireActiveCase("بارگذاری فایل مدرک در پرونده");
  if (!c) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    openFilesDB(function(db) {
      if (!db) return;
      var tx = db.transaction(["docs"], "readwrite");
      tx.objectStore("docs").put({
        key: c.id + "__" + docCode,
        caseId: c.id,
        docCode: docCode,
        docTitle: docTitle,
        fileName: file.name,
        uploadDate: todayShamsi(),
        dataUrl: e.target.result,
        rawBlob: file
      });
      tx.oncomplete = function() {
        logCaseAction(c, "بارگذاری مدرک «" + docTitle + "» (" + file.name + ")");
        saveAllDB();
        renderActiveCaseDocsChecklist();
        showToastMsg("فایل «" + docTitle + "» در پرونده «" + c.name + "» ذخیره شد.");
      };
    });
  };
  reader.readAsDataURL(file);
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
  if (!tbody || !banner) return;

  if (!c) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3 fw-bold">ابتدا یک متقاضی را انتخاب نمایید.</td></tr>';
    banner.innerHTML = "";
    return;
  }

  var safeFolder = (c.name + " - " + toEn(c.nid || "000")).replace(/[\\/:*?"<>|]/g, "_");
  if (folderLbl) folderLbl.textContent = "📁 پوشه اختصاصی این متقاضی در درایو کامپیوتر: " + safeFolder;

  var sp = ACT_SPECS[c.actType] || ACT_SPECS.sheep_high;
  var reqDocs = DOC_CHECKLISTS[sp.docGroup || "LIVESTOCK"] || DOC_CHECKLISTS.LIVESTOCK;

  getUploadedDocsForCase(c.id, function(upMap) {
    var missing = [];
    var rows = "";
    var doneCount = 0;

    for (var i = 0; i < reqDocs.length; i++) {
      var d = reqDocs[i];
      var up = upMap[d.code];
      if (up) doneCount++; else missing.push(d.title);

      rows += '<tr class="' + (up ? 'table-success' : '') + '">' +
        '<td class="text-center fw-bold">' + toFa(i + 1) + '</td>' +
        '<td><b>' + d.title + '</b>' + (d.legalRef ? '<br><small class="text-primary">⚖️ مستند قانونی: ' + d.legalRef + '</small>' : '') + '</td>' +
        '<td>' + (up ? '<span class="badge bg-success">✅ تحویل و بارگذاری شد (' + toFa(up.uploadDate) + ')</span><br><small>' + up.fileName + '</small>' : '<span class="badge bg-danger">❌ مدرک ناقص (تحویل نشده)</span>') + '</td>' +
        '<td><div class="d-flex gap-1">' +
          '<label class="btn btn-sm btn-primary fw-bold m-0" style="cursor:pointer;">📤 بارگذاری فایل<input type="file" onchange="uploadCaseDocFile(event,\'' + d.code + '\',\'' + d.title + '\')" hidden></label>' +
          (up ? '<button class="btn btn-sm btn-success fw-bold" onclick="downloadCaseDocFile(\'' + d.code + '\')">👁️ مشاهده</button><button class="btn btn-sm btn-outline-danger" onclick="removeCaseDocFile(\'' + d.code + '\')">🗑️</button>' : '') +
        '</div></td></tr>';
    }
    tbody.innerHTML = rows;

    if (missing.length === 0) {
      banner.className = "alert alert-success fw-bold mb-3";
      banner.innerHTML = "🎉 پرونده «" + c.name + "» کامل است و تمامی " + toFa(reqDocs.length) + " مدرک قانونی بارگذاری شده‌اند.";
    } else {
      var badges = "";
      for (var m = 0; m < missing.length; m++) {
        badges += '<span class="badge bg-danger me-1 mb-1 p-2">❗ ' + toFa(m + 1) + '. ' + missing[m] + '</span>';
      }
      banner.className = "p-3 rounded-3 border border-2 border-danger bg-danger-subtle mb-3";
      banner.innerHTML =
        '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">' +
          '<b class="text-danger">⚠️ اعلام هوشمند نقص مدارک پرونده «' + c.name + '»: (' + toFa(doneCount) + ' از ' + toFa(reqDocs.length) + ' مدرک کامل — ' + toFa(missing.length) + ' مدرک ناقص)</b>' +
          '<button type="button" class="btn btn-sm btn-danger fw-bold" onclick="issueDeficiencyLetterForActiveCase()">🖨️ چاپ نامه ابلاغ نواقص روی سربرگ ۶۳۶</button>' +
        '</div>' +
        '<div>' + badges + '</div>';
    }
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
function renderSecretariatTable() {
  var tbody = document.getElementById("secretariat-tbody");
  if (!tbody) return;
  var q = toFa((document.getElementById("sec-search-q") || {}).value || "").trim().toLowerCase();
  var dir = (document.getElementById("sec-filter-dir") || {}).value || "ALL";
  var html = "";

  for (var i = 0; i < lettersDB.length; i++) {
    var l = lettersDB[i];
    if (dir !== "ALL" && l.type !== dir) continue;
    var hay = (l.number + " " + l.recipient + " " + l.appName + " " + l.appNid + " " + l.body).toLowerCase();
    if (q && hay.indexOf(q) === -1) continue;

    var pSize = l.paperSize || "A4";
    html += "<tr>" +
      "<td><b>" + toFa(l.number) + "</b><br><small class='text-muted'>" + toFa(l.date) + "</small></td>" +
      "<td><span class='badge " + (l.type === "OUT" ? "bg-success" : "bg-primary") + "'>" + (l.type === "OUT" ? "صادره" : "وارده") + "</span><br><span class='badge bg-dark mt-1'>کاغذ " + pSize + "</span></td>" +
      "<td><b>" + l.recipient + "</b><br><small class='text-success fw-bold'>متقاضی: " + (l.appName || "---") + " (" + toFa(l.cap || "") + ")</small></td>" +
      "<td><div class='d-flex gap-1 justify-content-center flex-wrap'>" +
        "<button class='btn btn-sm btn-warning py-0 px-2 fw-bold' onclick='editLetterFromSecretariat(\"" + l.id + "\")' data-tip='ویرایش متن، شماره یا مشخصات این نامه'>✏️</button>" +
        "<button class='btn btn-sm btn-success py-0 px-2 fw-bold' onclick='previewSavedLetter(\"" + l.id + "\", \"A4\")' data-tip='مشاهده و چاپ روی کاغذ A4'>🖨️ A4</button>" +
        "<button class='btn btn-sm btn-primary py-0 px-2 fw-bold' onclick='previewSavedLetter(\"" + l.id + "\", \"A5\")' data-tip='مشاهده و چاپ روی کاغذ A5'>🖨️ A5</button>" +
        "<button class='btn btn-sm btn-outline-danger py-0 px-2' onclick='if(confirm(\"آیا از حذف این نامه از دفتر اندیکاتور اطمینان دارید؟\")){lettersDB.splice(" + i + ",1);saveAllDB();}'>🗑️</button>" +
      "</div></td></tr>";
  }
  tbody.innerHTML = html || "<tr><td colspan='4' class='text-center py-3 text-muted'>نامه‌ای یافت نشد.</td></tr>";
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

  if (document.getElementById("kpi-total-cases")) document.getElementById("kpi-total-cases").textContent = toFa(casesDB.length);
  if (document.getElementById("kpi-out-letters")) document.getElementById("kpi-out-letters").textContent = toFa(outC);
  if (document.getElementById("kpi-in-letters")) document.getElementById("kpi-in-letters").textContent = toFa(inC);
  if (document.getElementById("kpi-open-tasks")) document.getElementById("kpi-open-tasks").textContent = toFa(tasksDB.length);

  var dashTbody = document.getElementById("dash-cases-summary-tbody");
  if (dashTbody) {
    var dHtml = "";
    for (var cIdx = 0; cIdx < casesDB.length; cIdx++) {
      var c = casesDB[cIdx];
      var grpMeta = APPLICANT_MAIN_GROUPS[c.mainGroup] || APPLICANT_MAIN_GROUPS.LIVESTOCK_POULTRY_FISHERIES;
      var inq = c.inquiries || {};
      var ok = 0;
      for (var k in inq) if (inq[k] === "OK") ok++;
      dHtml += "<tr class='" + (c.id === activeCaseId ? "table-success" : "") + "'>" +
        "<td class='fw-bold'>" + toFa(c.code) + "</td>" +
        "<td><b>" + c.name + "</b><br><small class='text-muted'>" + toFa(c.nid) + "</small></td>" +
        "<td><span class='badge " + grpMeta.badgeClass + " mb-1'>" + grpMeta.shortTitle + "</span><br><small>" + c.project + " (" + toFa(c.cap) + ")</small></td>" +
        "<td class='text-success fw-bold'>" + c.loc + "</td>" +
        "<td><span class='badge bg-success'>" + toFa(ok) + " از ۷ موافقت</span></td>" +
        "<td><div class='d-flex gap-1'>" +
          "<button class='btn btn-sm btn-primary py-0 fw-bold' onclick='selectActiveCase(\"" + c.id + "\"); switchMainPane(\"pane-cases\"); switchCaseSubTab(\"sub-info\");'>پرونده</button>" +
          "<button class='btn btn-sm btn-outline-success py-0 fw-bold' onclick='selectActiveCase(\"" + c.id + "\"); switchMainPane(\"pane-croquis\");'>🗺️ کروکی</button>" +
        "</div></td>" +
      "</tr>";
    }
    dashTbody.innerHTML = dHtml;
  }

  var tHolder = document.getElementById("tasks-list-holder");
  if (tHolder) {
    var tHtml = "";
    for (var t = 0; t < tasksDB.length; t++) {
      var tk = tasksDB[t];
      var done = tk.status === "انجام شده";
      tHtml += '<div class="col-md-6"><div class="p-2 border rounded d-flex justify-content-between align-items-center ' + (done ? 'bg-success-subtle' : 'bg-white') + '">' +
        '<div class="small"><span class="badge bg-secondary me-1">' + tk.cat + '</span> <b>' + tk.title + '</b> <small class="text-muted">(' + toFa(tk.due) + ')</small></div>' +
        '<div class="d-flex gap-1"><button class="btn btn-sm btn-outline-success py-0" onclick="tasksDB[' + t + '].status=\'انجام شده\';saveAllDB();">✔</button><button class="btn btn-sm btn-outline-danger py-0" onclick="tasksDB.splice(' + t + ',1);saveAllDB();">✕</button></div>' +
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
    showToastMsg("⏳ در حال ساخت فایل تک‌صفحه‌ای مستقل ویندوز (شامل کل پرونده‌ها و نامه‌ها)...");
    var docClone = document.documentElement.cloneNode(true);

    // پاکسازی المان‌های موقت پیش‌نمایش در کلون تا در شروع مجدد تمیز رندر شوند
    var scripts = docClone.querySelectorAll("script[src]");
    var hasExternalScripts = false;
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("nezam-core.js") !== -1 || src.indexOf("nezam-customizer.js") !== -1 || src.indexOf("nezam-ai-assistant.js") !== -1) {
        hasExternalScripts = true;
        scripts[i].remove();
      }
    }

    var bodyEl = docClone.querySelector("body");

    // تزریق اسنپ‌شات اطلاعات فعلی تا در هر کامپیوتر دیگری با تمام پرونده‌ها و نامه‌ها باز شود
    var oldSnap = docClone.querySelector("#embedded-db-snapshot");
    if (oldSnap) oldSnap.remove();
    var snapScript = document.createElement("script");
    snapScript.id = "embedded-db-snapshot";
    var snapshotPayload = {
      casesDB: casesDB,
      lettersDB: lettersDB,
      tasksDB: tasksDB,
      actSpecs: ACT_SPECS,
      docChecklists: DOC_CHECKLISTS,
      brandCfg: typeof brandCfg !== "undefined" ? brandCfg : null,
      tplCfg: typeof tplCfg !== "undefined" ? tplCfg : null,
      paperSize: typeof currentPaperSize !== "undefined" ? currentPaperSize : "A4"
    };
    snapScript.textContent =
      "(function(){\n" +
      "  try {\n" +
      "    var snap = " + JSON.stringify(snapshotPayload) + ";\n" +
      "    if (!localStorage.getItem('nezam636_cases_v6') && snap.casesDB) localStorage.setItem('nezam636_cases_v6', JSON.stringify(snap.casesDB));\n" +
      "    if (!localStorage.getItem('nezam636_letters_v6') && snap.lettersDB) localStorage.setItem('nezam636_letters_v6', JSON.stringify(snap.lettersDB));\n" +
      "    if (!localStorage.getItem('nezam636_tasks_v6') && snap.tasksDB) localStorage.setItem('nezam636_tasks_v6', JSON.stringify(snap.tasksDB));\n" +
      "    if (!localStorage.getItem('nezam636_act_specs_v6') && snap.actSpecs) localStorage.setItem('nezam636_act_specs_v6', JSON.stringify(snap.actSpecs));\n" +
      "    if (!localStorage.getItem('nezam636_doc_checklists_v6') && snap.docChecklists) localStorage.setItem('nezam636_doc_checklists_v6', JSON.stringify(snap.docChecklists));\n" +
      "    if (!localStorage.getItem('nezam636_branding_cfg') && snap.brandCfg) localStorage.setItem('nezam636_branding_cfg', JSON.stringify(snap.brandCfg));\n" +
      "    if (!localStorage.getItem('nezam636_templates_cfg') && snap.tplCfg) localStorage.setItem('nezam636_templates_cfg', JSON.stringify(snap.tplCfg));\n" +
      "    if (!localStorage.getItem('nezam636_paper_size_v1') && snap.paperSize) localStorage.setItem('nezam636_paper_size_v1', snap.paperSize);\n" +
      "  } catch(e) {}\n" +
      "})();";
    bodyEl.insertBefore(snapScript, bodyEl.firstChild);

    if (hasExternalScripts) {
      var c1 = await fetch("./nezam-core.js").then(function(r) { return r.text(); });
      var c2 = await fetch("./nezam-customizer.js").then(function(r) { return r.text(); });
      var s1 = document.createElement("script"); s1.textContent = c1; bodyEl.appendChild(s1);
      var s2 = document.createElement("script"); s2.textContent = c2; bodyEl.appendChild(s2);
      try {
        var c3 = await fetch("./nezam-ai-assistant.js").then(function(r) { return r.text(); });
        var s3 = document.createElement("script"); s3.textContent = c3; bodyEl.appendChild(s3);
      } catch (err) {}
    }

    var fullHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Nezam636_Khafr_Windows_Offline.html";
    a.click();
    showToastMsg("✅ فایل تک‌صفحه‌ای خودکفای ویندوز دانلود شد! روی هر سیستمی بدون نیاز به نصب و اینترنت با دابل‌کلیک اجرا می‌شود.");
  } catch (e) {
    alert("در حالت باز بودن مستقیم از روی هارد، می‌توانید از دکمه «پشتیبان کامل (Backup)» نیز برای ذخیره اطلاعات استفاده نمایید.");
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
